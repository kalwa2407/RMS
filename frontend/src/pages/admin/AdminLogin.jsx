import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";
import { Button } from "./ui";

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
      if (response.data.branch) {
        localStorage.setItem("admin_branch", response.data.branch);
      }
      if (response.data.username) {
        localStorage.setItem("admin_username", response.data.username);
      }
      if (response.data.name) {
        localStorage.setItem("admin_name", response.data.name);
      }

      const branchTitle = response.data.branch && response.data.branch !== "all"
        ? `${response.data.branch.toUpperCase()} Branch`
        : "Master";

      toast({
        title: "Login successful!",
        description: `Welcome to Persian Darbar ${branchTitle} Admin Panel`,
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

  const theme = (() => { try { return localStorage.getItem("admin_theme") || "dark"; } catch { return "dark"; } })();

  return (
    <div className={`admin-theme-${theme} min-h-screen flex items-center justify-center px-4 py-10`}>
      <div className="w-full max-w-[380px] space-y-6">
        <div className="text-center">
          <img
            src="/app-icon.png"
            alt="Persian Darbar"
            className="h-16 w-16 rounded-[16px] object-contain mx-auto border border-[var(--a-line)] shadow-[var(--a-shadow)]"
          />
          <h1 className="mt-4 text-[24px] leading-[30px] font-semibold tracking-[-0.01em] text-[var(--a-text)]">Persian Darbar Admin</h1>
          <p className="mt-1 text-[14px] text-[var(--a-text-2)]">Sign in to manage orders, menu and outlets</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-[12px] border border-[var(--a-line)] bg-[var(--a-card)] divide-y divide-[var(--a-line)] overflow-hidden shadow-[var(--a-shadow)]">
            <label className="flex items-center gap-3 px-4 h-12">
              <span className="w-24 shrink-0 text-[15px] text-[var(--a-text)]">Username</span>
              <input
                type="text"
                required
                autoComplete="username"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                placeholder="admin username"
                className="flex-1 min-w-0 bg-transparent text-[15px] text-[var(--a-text)] placeholder:text-[var(--a-text-3)] outline-none !shadow-none"
              />
            </label>
            <label className="flex items-center gap-3 px-4 h-12">
              <span className="w-24 shrink-0 text-[15px] text-[var(--a-text)]">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                placeholder="required"
                className="flex-1 min-w-0 bg-transparent text-[15px] text-[var(--a-text)] placeholder:text-[var(--a-text-3)] outline-none !shadow-none"
              />
            </label>
          </div>

          <Button type="submit" variant="primary" size="lg" icon={LogIn} className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>

          <Button type="button" variant="plain" className="w-full" onClick={() => navigate("/staff-entry")}>
            Back to Staff Portals
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
