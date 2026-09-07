import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";
import logoImg from "../../assets/logo.png";

const KitchenLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ staff_id: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("kitchen_token");
    if (token) navigate("/kitchen/panel", { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/kitchen/login`, form);
      localStorage.setItem("kitchen_token", data.access_token);
      navigate("/kitchen/panel", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Incorrect ID or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{
        background: "linear-gradient(160deg, #1a0a00 0%, #2d1a0a 60%, #1a0a00 100%)",
      }}
    >
      {/* Real logo */}
      <img
        src={logoImg}
        alt="Persian Darbar"
        className="mb-4 h-80 w-auto object-contain drop-shadow-2xl"
        style={{ mixBlendMode: 'screen', filter: "drop-shadow(0 4px 24px rgba(249,115,22,0.35))" }}
      />

      <h1
        className="text-3xl font-bold text-white mb-1 text-center"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Kitchen Panel
      </h1>
      <p className="text-sm text-orange-400/70 mb-10 text-center uppercase tracking-widest">
        Persian Darbar — Kitchen Login
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-orange-400/70 mb-1.5 block">
            Staff ID
          </label>
          <input
            type="text"
            required
            value={form.staff_id}
            onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
            placeholder="e.g. KTC001"
            className="w-full bg-[#2d1a0a] border border-orange-500/20 rounded-2xl px-5 py-3.5 text-white text-sm outline-none focus:border-orange-500/50 transition-all placeholder:text-gray-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-orange-400/70 mb-1.5 block">
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter password"
              className="w-full bg-[#2d1a0a] border border-orange-500/20 rounded-2xl px-5 py-3.5 pr-12 text-white text-sm outline-none focus:border-orange-500/50 transition-all placeholder:text-gray-500"
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
          className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-2xl transition-all text-sm uppercase tracking-widest mt-2"
        >
          <LogIn className="h-4 w-4" />
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default KitchenLogin;
