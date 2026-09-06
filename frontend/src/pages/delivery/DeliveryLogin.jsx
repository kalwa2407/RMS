import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, LogIn, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";

const DeliveryLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("delivery_token");
    if (token) navigate("/delivery/panel", { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/delivery/login`, form);
      localStorage.setItem("delivery_token", data.access_token);
      navigate("/delivery/panel", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Incorrect phone or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{
        background: "linear-gradient(160deg, #111827 0%, #1f2937 60%, #111827 100%)",
      }}
    >
      {/* Icon */}
      <div
        className="mb-8 w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          boxShadow: "0 8px 32px rgba(59,130,246,0.35)",
        }}
      >
        <Bike className="h-10 w-10 text-white" />
      </div>

      <h1
        className="text-3xl font-bold text-white mb-1 text-center"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Delivery Partner
      </h1>
      <p className="text-sm text-gray-400 mb-10 text-center uppercase tracking-widest">
        Persian Darbar — Rider Login
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
            Phone Number
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. 9876543210"
            required
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500/60 placeholder-gray-600 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password"
              required
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500/60 placeholder-gray-600 transition-colors pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
          style={{
            background: loading ? "#1e3a6e" : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
          }}
        >
          <LogIn className="h-4 w-4" />
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="text-gray-600 text-xs mt-10 text-center">
        Contact admin to get your login credentials
      </p>
    </div>
  );
};

export default DeliveryLogin;
