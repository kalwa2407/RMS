import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, LogIn, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";

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
      localStorage.setItem("kitchen_name", data.name || "Chef");
      navigate("/kitchen/panel", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Incorrect Staff ID or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{
        background: "linear-gradient(160deg, #1a0a00 0%, #3d1500 60%, #1a0a00 100%)",
      }}
    >
      {/* Icon */}
      <div
        className="mb-8 w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #f97316, #dc2626)",
          boxShadow: "0 8px 32px rgba(249,115,22,0.4)",
        }}
      >
        <ChefHat className="h-10 w-10 text-white" />
      </div>

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
            value={form.staff_id}
            onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
            placeholder="e.g. KIT001"
            required
            className="w-full text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none placeholder-gray-600 transition-colors"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(249,115,22,0.25)" }}
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-orange-400/70 mb-1.5 block">
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password"
              required
              className="w-full text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none placeholder-gray-600 transition-colors pr-12"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(249,115,22,0.25)" }}
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
            background: loading
              ? "rgba(249,115,22,0.4)"
              : "linear-gradient(135deg, #f97316, #dc2626)",
            boxShadow: "0 4px 20px rgba(249,115,22,0.35)",
          }}
        >
          <LogIn className="h-4 w-4" />
          {loading ? "Logging in..." : "Enter Kitchen"}
        </button>
      </form>

      <p className="text-gray-700 text-xs mt-10 text-center">
        Admin can create kitchen staff accounts from the admin panel
      </p>
    </div>
  );
};

export default KitchenLogin;
