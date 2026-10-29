import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import logoImg from "../../assets/logo.png";
import API_BASE from "../../lib/config";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  // Redirect if already logged in — validate token against backend first
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    axios
      .get(`${API_BASE}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        navigate("/admin/dashboard", { replace: true });
      })
      .catch(() => {
        localStorage.removeItem("admin_token");
      });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE}/api/admin/login`,
        {
          username: credentials.username,
          password: credentials.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const token = response.data.access_token;
      if (!token) throw new Error("Invalid token from backend");

      localStorage.setItem("admin_token", token);

      toast({
        title: "Login successful!",
        description: "Welcome to Persian Darbar Admin Panel",
      });

      navigate("/admin/dashboard", { replace: true });

    } catch (error) {
      toast({
        title: "Login Failed",
        description:
          error.response?.data?.detail ||
          "Incorrect username or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F15] flex items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-red-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* macOS Window Card */}
        <div className="bg-[#101721]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6">
          {/* macOS Window Controls */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-inner inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border-[#DEA123] shadow-inner inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border-[#1AAB29] shadow-inner inline-block" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
              macOS Master Portal
            </span>
          </div>

          <div className="text-center pt-2">
            <img
              src={logoImg}
              alt="Persian Darbar"
              className="h-14 w-auto object-contain mx-auto mb-3"
              style={{ mixBlendMode: 'screen' }}
            />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Admin Master Suite
            </h1>
            <p className="text-neutral-400 font-semibold tracking-wider text-[10px] uppercase mt-1">
              Persian Darbar · Executive Access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                required
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                placeholder="Enter admin username"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs font-semibold text-white outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 transition-all placeholder:text-neutral-500 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <input
                type="password"
                required
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                placeholder="••••••••••••"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs font-semibold text-white outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 transition-all placeholder:text-neutral-500 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#E40000] via-[#D31027] to-[#B91C1C] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-[0_6px_20px_-2px_rgba(228,0,0,0.4)] ios-press transition-all cursor-pointer border border-white/20 active:scale-95 disabled:opacity-50 mt-2"
            >
              {loading ? "Authenticating Master Session..." : "Secure Studio Login ›"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/staff-entry")}
              className="w-full text-center text-xs font-semibold text-neutral-400 hover:text-white transition-colors py-2 flex items-center justify-center gap-1.5 ios-press cursor-pointer"
            >
              <span>&larr;</span>
              <span>Back to Staff Portals</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
