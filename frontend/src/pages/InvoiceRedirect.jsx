import React, { useEffect } from "react";
import { useParams } from "react-router-dom";

export default function InvoiceRedirect() {
  const { orderId } = useParams();
  const directPdfUrl = `https://tasteofhindustan-api-63332283509.asia-south1.run.app/api/invoice/${orderId}`;

  useEffect(() => {
    if (orderId) {
      window.location.href = directPdfUrl;
    }
  }, [orderId, directPdfUrl]);

  return (
    <div className="min-h-screen bg-[#0a1f28] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className="text-xl font-bold text-white tracking-wide">PERSIAN DARBAR</h2>
      <p className="text-gray-300 text-sm mt-2">Opening your Tax Invoice PDF...</p>
      <a
        href={directPdfUrl}
        className="mt-5 px-5 py-2.5 bg-[#EAB308] text-black font-semibold rounded-xl text-sm hover:bg-yellow-400 transition-colors shadow-lg"
      >
        Download Invoice PDF
      </a>
    </div>
  );
}
