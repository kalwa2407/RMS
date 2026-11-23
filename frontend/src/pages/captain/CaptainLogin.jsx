import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff, ChevronLeft } from "lucide-react";
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
      className="min-h-screen bg-pd-surface text-pd-ink antialiased flex flex-col items-center justify-center px-4 py-10"
      style={{ paddingTop: "max(40px, env(safe-area-inset-top))" }}
    >
      <div className="w-full max-w-[400px]">
        <div className="mx-auto w-[168px] h-[112px] rounded-[24px] bg-pd-teal overflow-hidden flex items-center justify-center shadow-pd-1">
          <img src={logoImg} alt="Persian Darbar" className="w-[260px] max-w-none h-auto object-contain" />
        </div>

        <h1 className="mt-6 text-[28px] leading-tight font-bold tracking-[-0.02em] text-center">Captain sign in</h1>
        <p className="mt-1 text-[15px] text-pd-ink-2 text-center">Persian Darbar staff</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="bg-white rounded-[16px] border border-[color:var(--pd-line)] shadow-pd-1 divide-y divide-[color:var(--pd-line)]">
            <label className="flex items-center gap-3 px-4 min-h-[52px]">
              <span className="w-[92px] shrink-0 text-[15px] font-medium">Captain ID</span>
              <input
                type="text"
                required
                autoComplete="username"
                autoCapitalize="characters"
                value={form.captain_id}
                onChange={(e) => setForm({ ...form, captain_id: e.target.value })}
                placeholder="e.g. CPT001"
                className="flex-1 min-w-0 h-[52px] bg-transparent text-[16px] outline-none placeholder:text-pd-ink-3"
              />
            </label>
            <label className="flex items-center gap-3 pl-4 pr-1 min-h-[52px]">
              <span className="w-[92px] shrink-0 text-[15px] font-medium">Password</span>
              <input
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Required"
                className="flex-1 min-w-0 h-[52px] bg-transparent text-[16px] outline-none placeholder:text-pd-ink-3"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="w-11 h-11 flex items-center justify-center text-pd-ink-3 shrink-0"
              >
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </label>
          </div>

          {error && (
            <p role="alert" className="text-[14px] text-pd-error bg-[#FDECEC] rounded-[12px] px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-[12px] bg-pd-action text-white text-[16px] font-semibold pd-press hover:bg-pd-action-press disabled:opacity-60"
          >
            <LogIn className="h-5 w-5" />
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/staff-entry")}
            className="w-full h-11 flex items-center justify-center gap-1 text-[15px] font-medium text-pd-ink-2 hover:text-pd-ink pd-press"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to staff portal
          </button>
        </form>
      </div>
    </div>
  );
};

export default CaptainLogin;
