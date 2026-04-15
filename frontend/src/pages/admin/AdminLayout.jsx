import React, { useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Menu as MenuIcon,
  Image,
  ShoppingBag,
  Calendar,
  Star,
  Settings,
  Volume2,
  LogOut,
  ChefHat,
  Grid3X3,
  BarChart3,
  UtensilsCrossed,
  Package,
} from "lucide-react";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = (process.env.REACT_APP_BACKEND_URL || "");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      navigate("/admin");
      return;
    }

    const validate = async () => {
      try {
        // 🔥 BEST VALIDATION ENDPOINT
        const res = await fetch(`${API_BASE}/api/admin/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401 || res.status === 403) {
          // Token invalid → logout
          localStorage.removeItem("admin_token");
          navigate("/admin");
        }
      } catch (err) {
        // Network error — don't log out, backend might just be temporarily unreachable
        console.log("Validation error (network):", err);
      }
    };

    validate();
  }, [location.pathname, navigate, API_BASE]);

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Orders", path: "/admin/orders", icon: ShoppingBag },
    { name: "Table Dine-In", path: "/admin/table-sessions", icon: UtensilsCrossed, highlight: true },
    { name: "Kitchen View", path: "/admin/kitchen", icon: ChefHat },
    { name: "Tables", path: "/admin/tables", icon: Grid3X3 },
    { name: "Reports", path: "/admin/reports", icon: BarChart3 },
    { name: "Inventory", path: "/admin/inventory", icon: Package },
    { name: "Menu Management", path: "/admin/menu", icon: MenuIcon },
    { name: "Reservations", path: "/admin/reservations", icon: Calendar },
    { name: "Gallery", path: "/admin/gallery", icon: Image },
    { name: "Reviews", path: "/admin/reviews", icon: Star },
    { name: "Notification Sound", path: "/admin/sound-settings", icon: Volume2 },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-[#050b10]">
      {/* Header */}
      <div className="bg-white/[0.03] backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 overflow-hidden relative">
               <span className="text-primary font-black text-xl tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>TH</span>
            </div>
            <div>
              <h1 className="text-xl text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Admin Panel</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest" style={{ fontFamily: "'El Messiri', serif" }}>Taste of Hindustan Management</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-white/[0.05] border border-white/10 px-5 py-2.5 rounded-2xl text-gray-400 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all text-[11px] uppercase tracking-widest font-bold"
            style={{ fontFamily: "'El Messiri', serif" }}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 p-4 rounded-[2rem] sticky top-24 self-start">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-[13px] ${
                      isActive(item.path)
                        ? "bg-primary text-black font-bold"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                    }`}
                    style={{ fontFamily: "'El Messiri', serif" }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;


