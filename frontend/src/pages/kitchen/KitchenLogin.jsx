import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff, ChevronLeft } from "lucide-react";
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

  const inputCls =
    "w-full h-14 bg-white border border-[rgba(14,26,32,0.14)] rounded-[14px] px-4 text-[17px] text-pd-ink outline-none placeholder:text-pd-ink-3 focus:border-pd-ink focus:ring-4 focus:ring-[rgba(14,26,32,0.08)] transition-[border-color,box-shadow]";

  return (
    <div className="min-h-screen bg-pd-surface text-pd-ink antialiased flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mx-auto mb-8 w-full rounded-[24px] bg-pd-ink flex items-center justify-center overflow-hidden h-40">
          <img src={logoImg} alt="Persian Darbar" className="h-56 w-auto object-contain" />
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-pd-ink-3 text-center">Persian Darbar</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-[-0.02em] text-center">Kitchen display</h1>
        <p className="mt-2 text-[16px] text-pd-ink-2 text-center">Sign in with your kitchen staff ID.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="kitchen-staff-id" className="text-[15px] font-semibold text-pd-ink-2 mb-1.5 block">
              Staff ID
            </label>
            <input
              id="kitchen-staff-id"
              type="text"
              required
              autoComplete="username"
              value={form.staff_id}
              onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
              placeholder="e.g. KTC001"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="kitchen-password" className="text-[15px] font-semibold text-pd-ink-2 mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <input
                id="kitchen-password"
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password"
                className={`${inputCls} pr-14`}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-[12px] text-pd-ink-2"
              >
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-[15px] font-medium text-pd-error bg-[#FDECEC] rounded-[12px] px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="pd-press w-full h-14 rounded-[14px] bg-pd-action text-white text-[17px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
          >
            <LogIn className="h-5 w-5" />
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/staff-entry")}
            className="w-full h-12 text-[15px] font-medium text-pd-ink-2 flex items-center justify-center gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Staff Portal
          </button>
        </form>
      </div>
    </div>
  );
};

export default KitchenLogin;
