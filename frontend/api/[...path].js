// Vercel Serverless Function: Proxy all /api/* requests to Cloud Run backend
// This handles ALL HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)
// Vercel external rewrites only support GET — this function fixes that.

export default async function handler(req, res) {
  const BACKEND_URL = "https://tasteofhindustan-api-63332283509.asia-south1.run.app";

  // Build the target URL from the catch-all path segments
  const pathSegments = req.query.path || [];
  const targetPath = "/api/" + pathSegments.join("/");
  const queryString = new URL(req.url, `http://${req.headers.host}`).search || "";
  const targetUrl = `${BACKEND_URL}${targetPath}${queryString}`;

  // Forward headers, excluding host and Vercel-specific ones
  const forwardHeaders = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey !== "host" &&
      lowerKey !== "connection" &&
      !lowerKey.startsWith("x-vercel") &&
      !lowerKey.startsWith("x-forwarded")
    ) {
      forwardHeaders[key] = value;
    }
  }
  // Pass along the real origin for CORS on the backend
  forwardHeaders["X-Forwarded-For"] = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";

  try {
    // Build fetch options
    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders,
    };

    // Attach body for non-GET/HEAD requests
    if (req.method !== "GET" && req.method !== "HEAD") {
      // If content-type is JSON, stringify the body
      if (req.headers["content-type"]?.includes("application/json")) {
        fetchOptions.body = JSON.stringify(req.body);
      } else if (req.headers["content-type"]?.includes("multipart/form-data")) {
        // For file uploads, we need to pass through the raw body
        // Vercel parses multipart by default, so we need raw body
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        fetchOptions.body = Buffer.concat(chunks);
        // Keep the original content-type with boundary
        fetchOptions.headers["content-type"] = req.headers["content-type"];
      } else {
        fetchOptions.body = JSON.stringify(req.body);
      }
    }

    const backendResponse = await fetch(targetUrl, fetchOptions);

    // Forward response headers from backend
    for (const [key, value] of backendResponse.headers.entries()) {
      const lowerKey = key.toLowerCase();
      // Skip hop-by-hop headers and encoding (Vercel handles compression)
      if (
        lowerKey !== "transfer-encoding" &&
        lowerKey !== "connection" &&
        lowerKey !== "content-encoding"
      ) {
        res.setHeader(key, value);
      }
    }

    // Set CORS headers to allow the frontend origin
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "https://rms.tasteofhindustan.com");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // Handle OPTIONS preflight
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    // Stream the response body
    const responseBuffer = await backendResponse.arrayBuffer();
    res.status(backendResponse.status).send(Buffer.from(responseBuffer));
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(502).json({
      error: "Bad Gateway",
      message: "Failed to connect to backend server",
      details: error.message,
    });
  }
}

// Disable Vercel's default body parser for file upload support
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};
