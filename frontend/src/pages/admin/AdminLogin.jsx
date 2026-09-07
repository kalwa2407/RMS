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
    <div className="min-h-screen bg-[#0f2933] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#1a4855] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <img
              src={logoImg}
              alt="Persian Darbar"
              className="h-36 md:h-40 w-auto object-contain drop-shadow-xl"
              style={{ mixBlendMode: 'screen' }}
            />
          </div>
          <h1
            className="text-4xl text-white mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Admin Panel
          </h1>
          <p className="text-gray-400 font-light tracking-widest text-[10px] uppercase">
            Persian Darbar Management System
          </p>
        </div>

        <div className="bg-[#1a4855] border border-[#EAB308]/20 rounded-xl p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
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
                className="w-full bg-[#1a4855] border border-[#EAB308]/20 rounded-2xl px-6 py-4 text-sm font-medium text-white outline-none focus:border-primary/50 transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
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
                className="w-full bg-[#1a4855] border border-[#EAB308]/20 rounded-2xl px-6 py-4 text-sm font-medium text-white outline-none focus:border-primary/50 transition-all placeholder:text-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black py-4 rounded-2xl font-bold uppercase tracking-[0.25em] text-[11px] shadow-2xl shadow-primary/20 hover:bg-white transition-all mt-4"
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
