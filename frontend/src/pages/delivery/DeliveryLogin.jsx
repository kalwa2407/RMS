import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff, ChevronLeft } from "lucide-react";
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

  const fieldClass =
    "w-full h-14 rounded-[14px] bg-pd-surface px-4 text-[17px] text-pd-ink outline-none " +
    "border border-transparent focus:border-pd-teal focus:bg-white transition-colors placeholder:text-pd-ink-3";

  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-white text-pd-ink"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
    >
      <div className="flex-1 w-full max-w-sm mx-auto px-5 flex flex-col">
        {/* Brand tile: the logo artwork is light, so it sits on the Darbar teal. */}
        <div className="mt-6 rounded-[24px] bg-pd-teal h-44 flex items-center justify-center overflow-hidden">
          <img
            src={logoImg}
            alt="Persian Darbar"
            className="h-56 w-auto object-contain"
            style={{ mixBlendMode: "screen" }}
          />
        </div>

        <h1 className="mt-8 text-[30px] leading-9 font-bold tracking-[-0.02em]">Delivery Partner</h1>
        <p className="mt-1 text-[16px] text-pd-ink-2">Sign in with the phone number registered with Persian Darbar.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="block text-[14px] font-semibold text-pd-ink-2 mb-1.5">Phone number</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="e.g. 9876543210"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className="block text-[14px] font-semibold text-pd-ink-2 mb-1.5">Password</span>
            <span className="relative block">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password"
                className={fieldClass + " pr-14"}
              />
              <button
                type="button"
                aria-label={showPw ? "Hide password" : "Show password"}
                onClick={() => setShowPw(!showPw)}
                className="pd-press absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-pd-ink-2"
              >
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </span>
          </label>

          {error && (
            <p role="alert" className="text-[15px] text-pd-error bg-[#FBEDEE] rounded-[12px] px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="pd-press w-full h-14 rounded-[14px] bg-pd-action text-white text-[17px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <LogIn className="h-5 w-5" />
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/staff-entry")}
          className="pd-press mt-8 h-12 w-full text-[16px] font-semibold text-pd-teal flex items-center justify-center gap-1.5"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to Staff Portal
        </button>
      </div>
    </div>
  );
};

export default DeliveryLogin;
