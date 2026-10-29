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
  Sun,
  Moon,
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
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("admin_theme") || "light";
  });

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("admin_theme", newTheme);
  };

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

  const isDark = theme === "dark";

  /* ── Sync dark class to html for Tailwind dark: variants ── */
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className={`min-h-screen font-sans selection:bg-red-600 selection:text-white transition-colors duration-200 admin-theme-${theme} ${
      isDark ? "dark bg-[#0B0F15] text-neutral-100" : "bg-[#F2F2F7] text-neutral-900"
    }`}>

      {/* ════════════════════════════════════
          DESKTOP macOS UNIFIED TOOLBAR (lg+)
      ════════════════════════════════════ */}
      <header className={`hidden lg:block sticky top-0 z-50 transition-colors backdrop-blur-2xl border-b shadow-xs ${
        isDark
          ? "bg-[#101721]/90 border-white/[0.08]"
          : "bg-white/85 border-black/[0.06]"
      }`}>
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex justify-between items-center">
          {/* Left: macOS Traffic Lights & Logo */}
          <div className="flex items-center space-x-5">
            {/* macOS Window Controls */}
            <div className="flex items-center space-x-2 px-1">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-inner inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-inner inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-inner inline-block" />
            </div>

            <div className={`h-5 w-[1px] ${isDark ? "bg-white/10" : "bg-neutral-200"}`} />

            <div className="flex items-center space-x-3">
              <img
                src="/app-icon.png"
                alt="Persian Darbar"
                className="w-9 h-9 rounded-xl object-contain shrink-0 shadow-xs border border-amber-400/40"
              />
              <div>
                <h1 className={`text-sm font-black tracking-tight leading-none flex items-center gap-1.5 ${
                  isDark ? "text-white" : "text-neutral-900"
                }`}>
                  <span>Persian Darbar</span>
                </h1>
                <p className={`text-[10px] font-medium mt-0.5 ${
                  isDark ? "text-neutral-400" : "text-neutral-500"
                }`}>
                  Master Administrative Suite
                </p>
              </div>
            </div>
          </div>

          {/* Center: Live Status & Theme Switcher */}
          <div className="flex items-center gap-3">
            {/* macOS Capsule Status Pill */}
            <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full border shadow-2xs ${
              isDark
                ? "bg-white/[0.05] border-white/[0.08] text-neutral-300"
                : "bg-neutral-50 border-neutral-200/80 text-neutral-700"
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-xs font-semibold">
                Live Cloud Sync
              </span>
              <span className="text-neutral-300 text-xs">·</span>
              <span className="text-xs font-bold text-amber-600">Camp, Pune</span>
            </div>

            {/* Apple Segmented Light/Dark Switcher */}
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider hidden xl:inline ${
                isDark ? "text-neutral-400" : "text-neutral-500"
              }`}>
                Theme:
              </span>
              <div className={`flex items-center p-1 rounded-2xl border transition-all shadow-xs ${
                isDark
                  ? "bg-white/[0.08] border-white/15"
                  : "bg-neutral-200/70 border-neutral-300"
              }`}>
                <button
                  onClick={() => toggleTheme("light")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !isDark
                      ? "bg-white text-neutral-900 shadow-sm border border-black/5"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  title="Switch to Light Theme"
                >
                  <Sun className={`h-3.5 w-3.5 ${!isDark ? "text-amber-500" : "text-neutral-400"}`} />
                  <span className="text-[11px]">Light</span>
                </button>

                <button
                  onClick={() => toggleTheme("dark")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isDark
                      ? "bg-[#1F2937] text-white shadow-sm border border-white/10"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                  title="Switch to Dark Theme"
                >
                  <Moon className={`h-3.5 w-3.5 ${isDark ? "text-blue-400" : "text-neutral-500"}`} />
                  <span className="text-[11px]">Dark</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Staff Status & Logout */}
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-2xl border shadow-2xs ${
              isDark
                ? "bg-white/[0.04] border-white/[0.07]"
                : "bg-neutral-50 border-neutral-200/80"
            }`}>
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-neutral-950 font-black text-xs flex items-center justify-center shadow-xs">
                A
              </div>
              <div className="text-left">
                <span className={`text-xs font-bold block leading-none ${
                  isDark ? "text-white" : "text-neutral-900"
                }`}>
                  Admin Master
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold leading-none">
                  Active Shift
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 border border-red-200/80 px-4 py-2 rounded-2xl text-red-600 hover:bg-red-500 hover:text-white transition-all text-xs font-bold ios-press cursor-pointer shadow-xs active:scale-95"
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
          <aside className={`backdrop-blur-2xl border p-3.5 rounded-3xl sticky top-20 self-start shadow-xs space-y-4 transition-colors ${
            isDark
              ? "bg-[#101721]/90 border-white/[0.08]"
              : "bg-white/80 border-black/[0.06]"
          }`}>
            <div className="px-3 pt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                NAVIGATION
              </span>
            </div>

            <nav className="space-y-4">
              {SECTIONS.map((section) => (
                <div key={section.label} className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 px-3 pt-1">
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
                              ? "bg-gradient-to-r from-[#E40000] to-[#C90000] text-white font-black shadow-[0_4px_16px_rgba(228,0,0,0.25)] border border-red-400/30"
                              : isDark
                              ? "text-neutral-300 hover:text-white hover:bg-white/[0.06]"
                              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80"
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : isDark ? "text-neutral-400" : "text-neutral-500"}`} />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* macOS Sidebar Appearance Switcher */}
            <div className={`p-2.5 rounded-2xl border transition-all mt-4 ${
              isDark ? "bg-white/[0.04] border-white/10" : "bg-neutral-100 border-neutral-200/90"
            }`}>
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  isDark ? "text-neutral-400" : "text-neutral-600"
                }`}>
                  Appearance
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  isDark ? "bg-blue-500/20 text-blue-300" : "bg-amber-500/20 text-amber-900"
                }`}>
                  {isDark ? "Dark" : "Light"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => toggleTheme("light")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !isDark
                      ? "bg-white text-neutral-900 shadow-sm border border-neutral-200"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Sun className={`h-3.5 w-3.5 ${!isDark ? "text-amber-500" : "text-neutral-400"}`} />
                  <span className="text-[11px]">Light</span>
                </button>
                <button
                  onClick={() => toggleTheme("dark")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isDark
                      ? "bg-[#1F2937] text-white shadow-sm border border-white/20"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <Moon className={`h-3.5 w-3.5 ${isDark ? "text-blue-400" : "text-neutral-400"}`} />
                  <span className="text-[11px]">Dark</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Content Canvas */}
          <main className={`lg:col-span-5 border rounded-3xl p-6 shadow-xs min-h-[calc(100vh-120px)] transition-colors ${
            isDark
              ? "bg-[#101721]/70 border-white/[0.08]"
              : "bg-white border-black/[0.06]"
          }`}>
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
            background: isDark ? "rgba(16, 23, 33, 0.95)" : "rgba(255, 255, 255, 0.92)",
            borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)",
            backdropFilter: "blur(20px)",
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)"
          }}
        >
          {/* Left: hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`p-2.5 rounded-2xl border ios-press active:scale-95 transition-transform cursor-pointer ${
              isDark
                ? "bg-white/[0.06] border-white/[0.08] text-amber-300"
                : "bg-neutral-100 border-neutral-200/80 text-neutral-800"
            }`}
            aria-label="Open menu"
          >
            <AlignLeft className="h-5 w-5" />
          </button>

          {/* Center: Logo + page name */}
          <div className="flex items-center gap-2">
            <img src="/app-icon.png" alt="Persian Darbar" className="h-8 w-auto object-contain rounded-lg" />
            <span className={`font-black text-xs uppercase tracking-wider ${
              isDark ? "text-white" : "text-neutral-900"
            }`}>
              {currentPage}
            </span>
          </div>

          {/* Right: Theme toggle & Logout button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleTheme(isDark ? "light" : "dark")}
              className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                isDark
                  ? "bg-white/10 text-amber-300 border-white/10"
                  : "bg-neutral-100 text-neutral-800 border-neutral-200"
              }`}
              title="Toggle Light/Dark"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-2xl bg-red-50 text-red-600 border border-red-200/80 ios-press active:scale-95 transition-transform cursor-pointer"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
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
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 transition-colors"
        style={{
          background: isDark ? "rgba(16, 23, 33, 0.95)" : "rgba(255, 255, 255, 0.95)",
          borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)",
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
                    active ? (isDark ? "bg-red-500/20 scale-110" : "bg-red-50 scale-110") : "group-active:scale-95"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      active ? "text-[#E40000]" : isDark ? "text-neutral-400" : "text-neutral-400"
                    }`}
                  />
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${
                    active ? "text-[#E40000] font-black" : isDark ? "text-neutral-400" : "text-neutral-500"
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
              <MenuIcon className={`h-5 w-5 ${isDark ? "text-neutral-400" : "text-neutral-400"}`} />
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
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
            className="absolute inset-0 bg-black/50"
            style={{ backdropFilter: "blur(6px)" }}
            onClick={() => setDrawerOpen(false)}
          />

          {/* Sheet panel — slides up from bottom */}
          <div
            className="relative flex flex-col rounded-t-3xl max-h-[85vh] transition-colors"
            style={{
              background: isDark ? "rgba(16, 23, 33, 0.98)" : "rgba(255, 255, 255, 0.98)",
              borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.08)",
              backdropFilter: "blur(28px)",
              boxShadow: isDark ? "0 -8px 40px rgba(0,0,0,0.5)" : "0 -8px 40px rgba(0,0,0,0.12)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className={`w-10 h-1 rounded-full ${isDark ? "bg-neutral-700" : "bg-neutral-300"}`} />
            </div>

            {/* Sheet header */}
            <div
              className={`flex items-center justify-between px-5 py-3 border-b ${
                isDark ? "border-white/10" : "border-neutral-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <img src="/app-icon.png" alt="Persian Darbar" className="h-8 w-auto object-contain rounded-lg" />
                <span className={`font-black text-sm ${isDark ? "text-white" : "text-neutral-900"}`}>
                  Persian Darbar Admin
                </span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isDark ? "bg-white/10 text-neutral-300 hover:text-white" : "bg-neutral-100 text-neutral-500 hover:text-neutral-900"
                }`}
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
                              ? "bg-gradient-to-r from-[#E40000] to-[#C90000] text-white border-red-400/30 shadow-md font-bold"
                              : isDark
                              ? "bg-white/[0.04] text-neutral-200 border-white/5 hover:bg-white/[0.08]"
                              : "bg-neutral-50 text-neutral-700 border-neutral-200/60 hover:bg-neutral-100"
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${active ? "text-white" : isDark ? "text-neutral-400" : "text-neutral-500"}`} />
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

            {/* Sheet footer — appearance + logout */}
            <div
              className={`px-4 py-3 border-t space-y-2.5 ${isDark ? "border-white/10" : "border-neutral-100"}`}
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
            >
              {/* Theme Toggle row in drawer */}
              <div className={`flex items-center justify-between p-2 rounded-2xl border ${
                isDark ? "bg-white/[0.04] border-white/10" : "bg-neutral-100 border-neutral-200/80"
              }`}>
                <span className={`text-xs font-bold pl-2 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                  Appearance
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleTheme("light")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      !isDark ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400"
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span>Light</span>
                  </button>
                  <button
                    onClick={() => toggleTheme("dark")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      isDark ? "bg-[#1F2937] text-white shadow-sm" : "text-neutral-500"
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5 text-blue-400" />
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2.5 bg-red-50 border border-red-200/80 py-3.5 rounded-2xl text-red-600 font-bold text-xs hover:bg-red-500 hover:text-white ios-press active:scale-[0.98] transition-all cursor-pointer shadow-xs"
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
