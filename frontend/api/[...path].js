// Vercel Serverless Function: Proxy all /api/* requests to Cloud Run backend
// Handles ALL HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)

module.exports = async function handler(req, res) {
  const BACKEND_URL = "https://tasteofhindustan-api-63332283509.asia-south1.run.app";

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }

  // Build the target URL from the catch-all path segments
  const pathSegments = req.query.path || [];
  const targetPath = "/api/" + (Array.isArray(pathSegments) ? pathSegments.join("/") : pathSegments);

  // Preserve query string
  const urlObj = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  const queryString = urlObj.search || "";
  const targetUrl = BACKEND_URL + targetPath + queryString;

  // Forward headers, excluding host and Vercel-specific ones
  const forwardHeaders = {};
  for (var key in req.headers) {
    var lowerKey = key.toLowerCase();
    if (
      lowerKey !== "host" &&
      lowerKey !== "connection" &&
      !lowerKey.startsWith("x-vercel") &&
      !lowerKey.startsWith("x-forwarded") &&
      !lowerKey.startsWith("x-real")
    ) {
      forwardHeaders[key] = req.headers[key];
    }
  }

  try {
    // Build fetch options
    var fetchOptions = {
      method: req.method,
      headers: forwardHeaders,
    };

    // Attach body for non-GET/HEAD requests
    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      if (typeof req.body === "object") {
        fetchOptions.body = JSON.stringify(req.body);
        fetchOptions.headers["content-type"] = "application/json";
      } else {
        fetchOptions.body = req.body;
      }
    }

    var backendResponse = await fetch(targetUrl, fetchOptions);

    // Forward response headers from backend
    backendResponse.headers.forEach(function (value, key) {
      var lk = key.toLowerCase();
      if (lk !== "transfer-encoding" && lk !== "connection" && lk !== "content-encoding") {
        res.setHeader(key, value);
      }
    });

    // Ensure CORS headers are set
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // Send response
    var responseBuffer = Buffer.from(await backendResponse.arrayBuffer());
    res.status(backendResponse.status).send(responseBuffer);
  } catch (error) {
    console.error("Proxy error:", error.message);
    res.status(502).json({
      error: "Bad Gateway",
      message: "Failed to connect to backend server",
    });
  }
};
