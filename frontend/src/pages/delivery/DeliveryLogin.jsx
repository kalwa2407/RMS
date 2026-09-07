import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";
import logoImg from "../../assets/logo.png";

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
      {/* Real logo */}
      <img
        src={logoImg}
        alt="Persian Darbar"
        className="mb-4 h-80 w-auto object-contain drop-shadow-2xl"
        style={{ mixBlendMode: 'screen', filter: "drop-shadow(0 4px 24px rgba(59,130,246,0.3))" }}
      />

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
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. 9876543210"
            className="w-full bg-[#1f2937] border border-blue-500/20 rounded-2xl px-5 py-3.5 text-white text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter password"
              className="w-full bg-[#1f2937] border border-blue-500/20 rounded-2xl px-5 py-3.5 pr-12 text-white text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-xs text-center bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all text-sm uppercase tracking-widest mt-2"
        >
          <LogIn className="h-4 w-4" />
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default DeliveryLogin;
