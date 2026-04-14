import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "");

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

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
        description: "Welcome to Taste of Hindustan Admin Panel",
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
    <div className="min-h-screen bg-[#050b10] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative z-10">

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 overflow-hidden relative mx-auto mb-6">
             <span className="text-primary font-black text-3xl tracking-tight" style={{ fontFamily: "'Cinzel Decorative', serif" }}>TH</span>
          </div>
          <h1
            className="text-4xl text-white mb-2"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
          >
            Admin Panel
          </h1>
          <p className="text-gray-400 font-light tracking-widest text-[10px] uppercase" style={{ fontFamily: "'El Messiri', serif" }}>
            Taste of Hindustan Management System
          </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest" style={{ fontFamily: "'El Messiri', serif" }}>
                Username
              </label>
              <input
                type="text"
                required
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                placeholder="Enter your username"
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-white outline-none focus:border-primary/50 transition-all placeholder:text-gray-600"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest" style={{ fontFamily: "'El Messiri', serif" }}>
                Password
              </label>
              <input
                type="password"
                required
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                placeholder="Enter your password"
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-white outline-none focus:border-primary/50 transition-all placeholder:text-gray-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black py-4 rounded-2xl font-bold uppercase tracking-[0.25em] text-[11px] shadow-2xl shadow-primary/20 hover:bg-white transition-all mt-4"
              style={{ fontFamily: "'El Messiri', serif" }}
            >
              {loading ? "Authenticating..." : "Secure Login"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;


