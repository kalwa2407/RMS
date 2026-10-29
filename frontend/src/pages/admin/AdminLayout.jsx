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
  Coins,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import logoImg from "../../assets/logo.png";
import API_BASE from "../../lib/config";
import { isStandaloneApp } from "../../lib/pwa";

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
      { name: "Customers",    path: "/admin/customers",      icon: Users },
      { name: "Reports",      path: "/admin/reports",        icon: BarChart3 },
      { name: "Offers",       path: "/admin/offers",         icon: Tag },
      { name: "Inventory",    path: "/admin/inventory",      icon: Package },
      { name: "Menu",         path: "/admin/menu",           icon: MenuIcon },
      { name: "Reservations", path: "/admin/reservations",   icon: Calendar },
      { name: "Events",       path: "/admin/events",         icon: Sparkles },
      { name: "Loyalty (Coins)", path: "/admin/loyalty",     icon: Coins },
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
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate(isStandaloneApp() ? "/staff-entry" : "/admin");
  };
  const currentPage  = ALL_ITEMS.find((m) => m.path === location.pathname)?.name ?? "Admin";

  return (
    <div className="min-h-screen bg-[#0B0F15] text-neutral-100 selection:bg-red-600 selection:text-white font-sans">

      {/* ════════════════════════════════════
          DESKTOP macOS UNIFIED TOOLBAR (lg+)
      ════════════════════════════════════ */}
      <header className="hidden lg:block bg-[#101721]/85 backdrop-blur-2xl border-b border-white/[0.08] sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex justify-between items-center">
          {/* Left: macOS Traffic Lights & Logo */}
          <div className="flex items-center space-x-5">
            {/* macOS Window Controls */}
            <div className="flex items-center space-x-2 px-1">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-inner inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border-[#DEA123] shadow-inner inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border-[#1AAB29] shadow-inner inline-block" />
            </div>

            <div className="h-5 w-[1px] bg-white/10" />

            <div className="flex items-center space-x-3">
              <img
                src={logoImg}
                alt="Persian Darbar"
                className="h-10 w-auto object-contain"
                style={{ mixBlendMode: 'screen' }}
              />
              <div>
                <h1 className="text-sm font-black text-white tracking-tight leading-none flex items-center gap-1.5">
                  <span>Persian Darbar</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30">
                    Pro Studio
                  </span>
                </h1>
                <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                  Master Administrative Suite
                </p>
              </div>
            </div>
          </div>

          {/* Center: macOS Capsule Status Pill */}
          <div className="flex items-center space-x-2 bg-white/[0.05] border border-white/[0.08] px-3.5 py-1.5 rounded-full shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-xs font-semibold text-neutral-300">
              Live Cloud Sync
            </span>
            <span className="text-neutral-500 text-xs">·</span>
            <span className="text-xs font-bold text-amber-300">Camp, Pune</span>
          </div>

          {/* Right: Staff Status & Logout */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 bg-white/[0.04] border border-white/[0.07] px-3 py-1.5 rounded-2xl">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-neutral-950 font-black text-xs flex items-center justify-center shadow-xs">
                A
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white block leading-none">
                  Admin Master
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold leading-none">
                  Active Shift
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 px-4 py-2 rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-bold ios-press cursor-pointer shadow-xs active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════
          DESKTOP LAYOUT (macOS Sidebar + Canvas)
      ════════════════════════════════════ */}
      <div className="hidden lg:block max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-6 gap-6">
          {/* macOS Frosted Glass Sidebar */}
          <aside className="bg-[#101721]/70 backdrop-blur-2xl border border-white/[0.08] p-3.5 rounded-3xl sticky top-20 self-start shadow-sm space-y-4">
            <div className="px-3 pt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                NAVIGATION
              </span>
            </div>

            <nav className="space-y-4">
              {SECTIONS.map((section) => (
                <div key={section.label} className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400/90 px-3 pt-1">
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
                          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all text-xs font-semibold ios-press ${
                            active
                              ? "bg-gradient-to-r from-[#E40000] to-[#C90000] text-white font-black shadow-[0_4px_16px_rgba(228,0,0,0.32)] border border-white/20"
                              : "text-neutral-300 hover:text-white hover:bg-white/[0.06]"
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-neutral-400"}`} />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* Content Canvas */}
          <main className="lg:col-span-5 bg-[#101721]/50 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 shadow-sm min-h-[calc(100vh-120px)]">
            <Outlet />
          </main>
        </div>
      </div>

      {/* ════════════════════════════════════
          MOBILE HEADER (< lg)
      ════════════════════════════════════ */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            background: "rgba(16, 23, 33, 0.95)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(20px)",
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)"
          }}
        >
          {/* Left: hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-amber-300 ios-press active:scale-95 transition-transform cursor-pointer"
            aria-label="Open menu"
          >
            <AlignLeft className="h-5 w-5" />
          </button>

          {/* Center: Logo + page name */}
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Persian Darbar" className="h-9 w-auto object-contain" style={{ mixBlendMode: 'screen' }} />
            <span className="text-white font-black text-xs uppercase tracking-wider">
              {currentPage}
            </span>
          </div>

          {/* Right: Logout button */}
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/25 ios-press active:scale-95 transition-transform cursor-pointer"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════
          MOBILE CONTENT AREA
      ════════════════════════════════════ */}
      <div className="lg:hidden pt-[76px] pb-[84px]">
        <div className="px-3.5 py-3">
          <Outlet />
        </div>
      </div>

      {/* ════════════════════════════════════
          MOBILE BOTTOM TAB BAR
      ════════════════════════════════════ */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "rgba(16, 23, 33, 0.96)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(24px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)",
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
                className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative group ios-press"
              >
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-[#E40000]"
                  />
                )}
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    active ? "bg-red-500/15 scale-110" : "group-active:scale-95"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      active ? "text-[#E40000]" : "text-neutral-400"
                    }`}
                  />
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${
                    active ? "text-white font-black" : "text-neutral-400"
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
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 group ios-press cursor-pointer"
          >
            <div className="p-1.5 rounded-xl group-active:scale-95 transition-transform">
              <MenuIcon className="h-5 w-5 text-neutral-400" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
              More
            </span>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════
          MOBILE BOTTOM SHEET (slide-up from More)
      ════════════════════════════════════ */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            style={{ backdropFilter: "blur(4px)" }}
            onClick={() => setDrawerOpen(false)}
          />

          {/* Sheet panel — slides up from bottom */}
          <div
            className="relative flex flex-col rounded-t-3xl max-h-[85vh]"
            style={{
              background: "rgba(16, 23, 33, 0.98)",
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(28px)",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/25" />
            </div>

            {/* Sheet header */}
            <div
              className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08]"
            >
              <img src={logoImg} alt="Persian Darbar" className="h-10 w-auto object-contain" style={{ mixBlendMode: 'screen' }} />
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-full bg-white/[0.06] text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable nav sections */}
            <div className="flex-1 overflow-y-auto py-3 px-3">
              {SECTIONS.map((section) => (
                <div key={section.label} className="mb-4">
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 px-3 mb-2"
                  >
                    {section.label}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ios-press active:scale-95 border ${
                            active
                              ? "bg-gradient-to-r from-[#E40000] to-[#C90000] text-white border-white/20 shadow-md font-bold"
                              : "bg-white/[0.04] text-neutral-300 border-white/[0.04] hover:bg-white/[0.08]"
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${active ? "text-white" : "text-neutral-400"}`} />
                          <span className="text-[10px] font-bold text-center leading-tight">
                            {item.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sheet footer — logout */}
            <div
              className="px-4 py-4 border-t border-white/[0.08]"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
            >
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2.5 bg-red-500/10 border border-red-500/25 py-3.5 rounded-2xl text-red-400 font-bold text-xs hover:bg-red-500 hover:text-white ios-press active:scale-[0.98] transition-all cursor-pointer shadow-xs"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out of Master Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
