import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";
import logoImg from "../../assets/logo.png";

const CaptainLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ captain_id: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("captain_token");
    if (token) navigate("/captain/panel", { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/captain/login`, form);
      localStorage.setItem("captain_token", data.access_token);
      localStorage.setItem("captain_name", data.name || "Captain");
      localStorage.setItem("captain_id", data.captain_id);
      navigate("/captain/panel", { replace: true });
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
        background: "linear-gradient(160deg, #0f2933 0%, #1a4855 60%, #0f2933 100%)",
      }}
    >
      {/* Real logo */}
      <img
        src={logoImg}
        alt="Persian Darbar"
        className="mb-4 h-24 w-auto object-contain drop-shadow-2xl"
        style={{ filter: "drop-shadow(0 4px 24px rgba(234,179,8,0.35))" }}
      />

      <h1
        className="text-3xl font-bold text-white mb-1 text-center"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Captain Panel
      </h1>
      <p className="text-sm text-gray-400 mb-10 text-center uppercase tracking-widest">
        Persian Darbar — Staff Login
      </p>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4"
      >
        {/* Captain ID */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
            Captain ID
          </label>
          <input
            type="text"
            value={form.captain_id}
            onChange={(e) => setForm({ ...form, captain_id: e.target.value })}
            placeholder="e.g. CAP001"
            required
            className="w-full bg-[#1a4855] border border-[#EAB308]/25 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#EAB308]/60 placeholder-gray-500 transition-colors"
          />
        </div>

        {/* Password */}
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
              className="w-full bg-[#1a4855] border border-[#EAB308]/25 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#EAB308]/60 placeholder-gray-500 transition-colors pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-black transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
          style={{
            background: loading ? "#8a6b00" : "linear-gradient(135deg, #EAB308, #d97706)",
            boxShadow: "0 4px 20px rgba(234,179,8,0.3)",
          }}
        >
          <LogIn className="h-4 w-4" />
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="text-gray-600 text-xs mt-10 text-center">
        Admin can create captain accounts from the admin panel
      </p>
    </div>
  );
};

export default CaptainLogin;
