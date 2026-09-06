import React, { useEffect, useState } from "react";
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
  X,
  AlignLeft,
  ShieldCheck,
  Bike,
} from "lucide-react";
import logoImg from "../../assets/logo.png";
import API_BASE from "../../lib/config";

/* ── Section grouping for drawer ──────────────────────────────────────────── */
const SECTIONS = [
  {
    label: "Operations",
    items: [
      { name: "Dashboard",   path: "/admin/dashboard",       icon: LayoutDashboard },
      { name: "Orders",      path: "/admin/orders",          icon: ShoppingBag },
      { name: "Dine-In",     path: "/admin/table-sessions",  icon: UtensilsCrossed },
      { name: "Kitchen",     path: "/admin/kitchen",         icon: ChefHat },
      { name: "Tables",      path: "/admin/tables",          icon: Grid3X3 },
    ],
  },
  {
    label: "Management",
    items: [
      { name: "Reports",      path: "/admin/reports",        icon: BarChart3 },
      { name: "Inventory",    path: "/admin/inventory",      icon: Package },
      { name: "Menu",         path: "/admin/menu",           icon: MenuIcon },
      { name: "Reservations", path: "/admin/reservations",   icon: Calendar },
    ],
  },
  {
    label: "Content & Config",
    items: [
      { name: "Gallery",   path: "/admin/gallery",        icon: Image },
      { name: "Reviews",   path: "/admin/reviews",        icon: Star },
      { name: "Sounds",    path: "/admin/sound-settings", icon: Volume2 },
      { name: "Settings",  path: "/admin/settings",       icon: Settings },
      { name: "Captains",  path: "/admin/captains",       icon: ShieldCheck },
      { name: "Delivery",  path: "/admin/delivery-partners", icon: Bike },
      { name: "Kitchen Staff", path: "/admin/kitchen-staff", icon: ChefHat },
    ],
  },
];

/* Flat list (used in sidebar & lookups) */
const ALL_ITEMS = SECTIONS.flatMap((s) => s.items);

/* Bottom tab bar – 4 primary actions always visible */
const BOTTOM_TABS = [
  { name: "Dashboard", path: "/admin/dashboard",      icon: LayoutDashboard },
  { name: "Orders",    path: "/admin/orders",          icon: ShoppingBag },
  { name: "Dine-In",   path: "/admin/table-sessions",  icon: UtensilsCrossed },
  { name: "Kitchen",   path: "/admin/kitchen",         icon: ChefHat },
];

/* ── Component ──────────────────────────────────────────────────────────────── */
const AdminLayout = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ── Auth guard ── */
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) { navigate("/admin"); return; }

    const validate = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("admin_token");
          navigate("/admin");
        }
      } catch {
        /* Network blip — stay logged in */
      }
    };
    validate();
  }, [location.pathname, navigate]);

  /* Close drawer on nav */
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const isActive     = (path) => location.pathname === path;
  const handleLogout = () => { localStorage.removeItem("admin_token"); navigate("/admin"); };
  const currentPage  = ALL_ITEMS.find((m) => m.path === location.pathname)?.name ?? "Admin";

  return (
    <div className="min-h-screen bg-[#0f2933]">

      {/* ════════════════════════════════════
          DESKTOP HEADER (lg+)
      ════════════════════════════════════ */}
      <div className="hidden lg:block bg-[#1a4855] border-b-2 border-[#EAB308] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <img src={logoImg} alt="Persian Darbar" className="h-14 w-auto object-contain" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-[#0f2933] border border-[#EAB308]/30 px-5 py-2.5 rounded-lg text-gray-300 hover:bg-red-900/30 hover:text-red-400 hover:border-red-500/30 transition-all text-sm font-bold"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════
          DESKTOP LAYOUT (sidebar + content)
      ════════════════════════════════════ */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="bg-[#1a4855] border border-[#EAB308]/20 p-4 rounded-xl sticky top-24 self-start">
            <nav className="space-y-1">
              {ALL_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm ${
                      isActive(item.path)
                        ? "bg-[#EAB308] text-black font-bold"
                        : "text-gray-300 hover:text-white hover:bg-[#0f2933]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Content area */}
          <div className="lg:col-span-4">
            <Outlet />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
          MOBILE HEADER (< lg)
      ════════════════════════════════════ */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
        {/* Glassmorphism header bar */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            background: "rgba(26,72,85,0.97)",
            borderBottom: "1.5px solid rgba(234,179,8,0.35)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Left: hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl bg-[#0f2933]/60 text-[#EAB308] active:scale-95 transition-transform"
            aria-label="Open menu"
          >
            <AlignLeft className="h-5 w-5" />
          </button>

          {/* Center: Logo + page name */}
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Persian Darbar" className="h-8 w-auto object-contain" />
            <span
              className="text-[#EAB308] font-bold text-sm uppercase tracking-widest"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {currentPage}
            </span>
          </div>

          {/* Right: bell placeholder (touch-friendly) */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-red-900/30 text-red-400 border border-red-500/20 active:scale-95 transition-transform"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════
          MOBILE CONTENT AREA
      ════════════════════════════════════ */}
      <div className="lg:hidden pt-[60px] pb-[72px] min-h-screen">
        <div className="px-4 py-4">
          <Outlet />
        </div>
      </div>

      {/* ════════════════════════════════════
          MOBILE BOTTOM TAB BAR
      ════════════════════════════════════ */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "rgba(26,72,85,0.98)",
          borderTop: "1.5px solid rgba(234,179,8,0.30)",
          backdropFilter: "blur(16px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-stretch">
          {BOTTOM_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative group"
              >
                {/* Active indicator pill */}
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-[#EAB308]"
                  />
                )}
                <div
                  className={`p-1.5 rounded-xl transition-all duration-200 ${
                    active ? "bg-[#EAB308]/15 scale-110" : "group-active:scale-90"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      active ? "text-[#EAB308]" : "text-gray-400"
                    }`}
                  />
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${
                    active ? "text-[#EAB308]" : "text-gray-500"
                  }`}
                >
                  {tab.name}
                </span>
              </Link>
            );
          })}

          {/* ── MORE tab ── */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 group"
          >
            <div className="p-1.5 rounded-xl group-active:scale-90 transition-transform">
              <MenuIcon className="h-5 w-5 text-gray-400" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
              More
            </span>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════
          MOBILE FULL DRAWER (slide-in left)
      ════════════════════════════════════ */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/65"
            style={{ backdropFilter: "blur(4px)" }}
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer panel */}
          <div
            className="relative flex flex-col w-[300px] max-w-[85vw] h-full"
            style={{
              background: "linear-gradient(160deg, #1a4855 0%, #0f3040 100%)",
              borderRight: "1.5px solid rgba(234,179,8,0.25)",
              boxShadow: "8px 0 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(234,179,8,0.18)" }}
            >
              <img src={logoImg} alt="Persian Darbar" className="h-10 w-auto object-contain" />
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-full bg-[#0f2933]/60 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable nav sections */}
            <div className="flex-1 overflow-y-auto py-4 px-3">
              {SECTIONS.map((section) => (
                <div key={section.label} className="mb-5">
                  <p
                    className="text-[9px] font-black uppercase tracking-[0.2em] text-[#EAB308]/50 px-3 mb-2"
                  >
                    {section.label}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            active
                              ? "bg-[#EAB308] text-black"
                              : "text-gray-300 hover:bg-white/5 hover:text-white active:bg-white/10"
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg ${
                              active ? "bg-black/15" : "bg-[#0f2933]/60"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className={`text-sm font-semibold ${active ? "font-bold" : ""}`}>
                            {item.name}
                          </span>
                          {active && (
                            <span className="ml-auto w-2 h-2 rounded-full bg-black/30" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer footer — logout */}
            <div
              className="px-4 py-5"
              style={{ borderTop: "1px solid rgba(234,179,8,0.15)" }}
            >
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 bg-red-900/25 border border-red-500/30 py-3.5 rounded-2xl text-red-400 font-bold text-sm hover:bg-red-900/40 active:scale-[0.98] transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
