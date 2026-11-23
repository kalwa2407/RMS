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
  ShieldCheck,
  Bike,
  Coins,
  Sparkles,
  Tag,
  Users,
  Sun,
  Moon,
  PanelLeft,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import API_BASE from "../../lib/config";
import { isStandaloneApp } from "../../lib/pwa";
import { cx, Segmented, Sheet } from "./ui";

/* ── Section grouping for navigation ──────────────────────────────────── */
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
      { name: "Loyalty",      path: "/admin/loyalty",        icon: Coins },
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

const ALL_ITEMS = SECTIONS.flatMap((s) => s.items);

/* Bottom tab bar on phones – 4 primary destinations + More */
const BOTTOM_TABS = [
  { name: "Dashboard", path: "/admin/dashboard",      icon: LayoutDashboard },
  { name: "Orders",    path: "/admin/orders",          icon: ShoppingBag },
  { name: "Dine-In",   path: "/admin/table-sessions",  icon: UtensilsCrossed },
  { name: "Kitchen",   path: "/admin/kitchen",         icon: ChefHat },
];

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

const AdminLayout = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("admin_theme") || "dark";
  });
  // Sidebar presentation only: "auto" = icon rail on iPad portrait, full on wider screens.
  const [sidebarMode, setSidebarMode] = useState(() => {
    try { return localStorage.getItem("admin_sidebar") || "auto"; } catch { return "auto"; }
  });

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("admin_theme", newTheme);
  };

  const toggleSidebar = () => {
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    const showingFull = sidebarMode === "expanded" || (sidebarMode === "auto" && wide);
    const next = showingFull ? "collapsed" : "expanded";
    setSidebarMode(next);
    try { localStorage.setItem("admin_sidebar", next); } catch { /* ignore */ }
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
    localStorage.removeItem("admin_branch");
    localStorage.removeItem("admin_username");
    localStorage.removeItem("admin_name");
    navigate(isStandaloneApp() ? "/staff-entry" : "/admin");
  };

  const adminBranch = (localStorage.getItem("admin_branch") || "all").toLowerCase();
  const adminName = localStorage.getItem("admin_name") || "Admin Master";
  const branchLabels = {
    pune: "Pune Branch Admin",
    kurla: "Kurla Branch Admin",
    bandra: "Bandra Flagship Admin",
    andheri: "Andheri Branch Admin",
    all: "Super Admin (All Outlets)"
  };
  const activeRoleName = branchLabels[adminBranch] || adminName;
  const branchLine = adminBranch === "all" ? "All outlets" : `${adminBranch.charAt(0).toUpperCase()}${adminBranch.slice(1)} outlet`;
  const currentItem  = ALL_ITEMS.find((m) => m.path === location.pathname);
  const currentPage  = currentItem?.name ?? "Admin";
  const currentSection = SECTIONS.find((s) => s.items.includes(currentItem))?.label;

  const isDark = theme === "dark";

  /* ── Sync dark class to html for Tailwind dark: variants ── */
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Rail = icons only. Full = icons + labels.
  const railOnly = sidebarMode === "collapsed";
  const fullAlways = sidebarMode === "expanded";
  const sidebarWidth = railOnly ? "md:w-[68px]" : fullAlways ? "md:w-[248px]" : "md:w-[68px] lg:w-[248px]";
  const labelVis = railOnly ? "hidden" : fullAlways ? "inline" : "hidden lg:inline";
  const blockVis = railOnly ? "hidden" : fullAlways ? "block" : "hidden lg:block";
  const contentPad = railOnly ? "md:pl-[68px]" : fullAlways ? "md:pl-[248px]" : "md:pl-[68px] lg:pl-[248px]";

  return (
    <div className={`min-h-screen admin-theme-${theme} ${isDark ? "dark" : ""}`}>

      {/* ═════════ SIDEBAR (iPad + desktop) ═════════ */}
      <aside
        className={cx(
          "hidden md:flex fixed inset-y-0 left-0 z-40 flex-col a-material border-r border-[var(--a-line)] transition-[width] duration-200",
          sidebarWidth
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 h-[60px] shrink-0">
          <img src="/app-icon.png" alt="Persian Darbar" className="h-8 w-8 rounded-[9px] object-contain shrink-0 border border-[var(--a-line)]" />
          <div className={cx("min-w-0", blockVis)}>
            <div className="text-[14px] leading-[18px] font-semibold text-[var(--a-text)] truncate">Persian Darbar</div>
            <div className="text-[12px] leading-4 text-[var(--a-text-3)] truncate">Admin</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 pb-3 space-y-4" aria-label="Admin">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <p className={cx("px-2 pb-1 text-[11px] leading-4 font-semibold text-[var(--a-text-3)]", blockVis)}>
                {section.label}
              </p>
              <div className="space-y-[2px]">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={item.name}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "flex items-center gap-2.5 h-8 px-2 rounded-[8px] text-[13px] transition-colors",
                        railOnly ? "justify-center" : fullAlways ? "" : "justify-center lg:justify-start",
                        active
                          ? "bg-[var(--a-fill-2)] text-[var(--a-text)] font-semibold"
                          : "text-[var(--a-text-2)] hover:bg-[var(--a-fill)] hover:text-[var(--a-text)] font-medium"
                      )}
                    >
                      <Icon
                        className={cx("h-[17px] w-[17px] shrink-0", active ? "text-[var(--a-accent)]" : "text-[var(--a-text-3)]")}
                        strokeWidth={active ? 2.2 : 1.9}
                      />
                      <span className={cx("truncate", labelVis)}>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: appearance + account */}
        <div className="shrink-0 border-t border-[var(--a-line)] p-3 space-y-2.5">
          <div className={blockVis}>
            <Segmented options={THEME_OPTIONS} value={theme} onChange={toggleTheme} size="sm" stretch />
          </div>
          <button
            onClick={() => toggleTheme(isDark ? "light" : "dark")}
            className={cx(
              "h-8 w-full items-center justify-center rounded-[8px] text-[var(--a-text-2)] hover:bg-[var(--a-fill)] cursor-pointer",
              railOnly ? "flex" : fullAlways ? "hidden" : "flex lg:hidden"
            )}
            title={isDark ? "Switch to Light" : "Switch to Dark"}
            aria-label="Toggle appearance"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className={cx("flex items-center gap-2.5 px-1", railOnly ? "justify-center" : fullAlways ? "" : "justify-center lg:justify-start")}>
            <div className="h-8 w-8 rounded-full bg-[var(--a-info-tint)] text-[var(--a-info)] text-[13px] font-semibold flex items-center justify-center shrink-0">
              {(adminName || "A").charAt(0).toUpperCase()}
            </div>
            <div className={cx("min-w-0 flex-1", blockVis)}>
              <div className="text-[13px] leading-[18px] font-medium text-[var(--a-text)] truncate">{activeRoleName}</div>
              <div className="text-[12px] leading-4 text-[var(--a-text-3)] truncate">{branchLine}</div>
            </div>
            <button
              onClick={handleLogout}
              className={cx(
                "h-8 w-8 items-center justify-center rounded-[8px] text-[var(--a-text-2)] hover:bg-[var(--a-error-tint)] hover:text-[var(--a-error)] cursor-pointer",
                railOnly ? "hidden" : fullAlways ? "flex" : "hidden lg:flex"
              )}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ═════════ CONTENT COLUMN ═════════ */}
      <div className={cx("min-h-screen flex flex-col transition-[padding] duration-200", contentPad)}>
        {/* Toolbar (iPad + desktop) */}
        <header className="hidden md:flex sticky top-0 z-30 h-[52px] items-center gap-3 px-4 lg:px-6 a-material border-b border-[var(--a-line)]">
          <button
            onClick={toggleSidebar}
            className="h-8 w-8 flex items-center justify-center rounded-[8px] text-[var(--a-text-2)] hover:bg-[var(--a-fill)] cursor-pointer"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <PanelLeft className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </button>
          <div className="flex items-center gap-1.5 min-w-0 text-[13px]">
            {currentSection && (
              <>
                <span className="text-[var(--a-text-3)] truncate">{currentSection}</span>
                <ChevronRight className="h-3.5 w-3.5 text-[var(--a-text-3)] shrink-0" />
              </>
            )}
            <span className="font-semibold text-[var(--a-text)] truncate">{currentPage}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden lg:inline-flex items-center h-7 px-2.5 rounded-full bg-[var(--a-fill)] text-[12px] font-medium text-[var(--a-text-2)]">
              {branchLine}
            </span>
            <button
              onClick={handleLogout}
              className="h-8 px-3 flex items-center gap-1.5 rounded-[8px] text-[13px] font-medium text-[var(--a-text-2)] hover:bg-[var(--a-error-tint)] hover:text-[var(--a-error)] cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {/* Phone top bar */}
        <header
          className="md:hidden sticky top-0 z-40 a-material border-b border-[var(--a-line)]"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="h-[52px] flex items-center justify-between px-4">
            <div className="flex items-center gap-2 min-w-0">
              <img src="/app-icon.png" alt="Persian Darbar" className="h-7 w-7 rounded-[8px] object-contain border border-[var(--a-line)]" />
              <span className="text-[17px] font-semibold text-[var(--a-text)] truncate">{currentPage}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleTheme(isDark ? "light" : "dark")}
                className="h-9 w-9 flex items-center justify-center rounded-full text-[var(--a-text-2)] hover:bg-[var(--a-fill)] cursor-pointer"
                aria-label="Toggle appearance"
              >
                {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>
              <button
                onClick={handleLogout}
                className="h-9 w-9 flex items-center justify-center rounded-full text-[var(--a-text-2)] hover:bg-[var(--a-fill)] cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 md:px-6 lg:px-8 pt-5 md:pt-7 pb-[96px] md:pb-10">
          <Outlet context={{ theme, isDark }} />
        </main>
      </div>

      {/* ═════════ PHONE TAB BAR ═════════ */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 a-material border-t border-[var(--a-line)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Primary"
      >
        <div className="flex items-stretch h-[56px]">
          {BOTTOM_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                aria-current={active ? "page" : undefined}
                className="flex-1 flex flex-col items-center justify-center gap-[3px] pd-press"
              >
                <Icon className={cx("h-[22px] w-[22px]", active ? "text-[var(--a-accent)]" : "text-[var(--a-text-3)]")} strokeWidth={active ? 2.2 : 1.8} />
                <span className={cx("text-[11px] leading-[13px] font-medium", active ? "text-[var(--a-accent)]" : "text-[var(--a-text-3)]")}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-[3px] pd-press cursor-pointer"
          >
            <MoreHorizontal className="h-[22px] w-[22px] text-[var(--a-text-3)]" strokeWidth={1.8} />
            <span className="text-[11px] leading-[13px] font-medium text-[var(--a-text-3)]">More</span>
          </button>
        </div>
      </nav>

      {/* ═════════ PHONE NAV SHEET ═════════ */}
      <div className="md:hidden">
        <Sheet open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Persian Darbar" subtitle={activeRoleName}>
          <div className="space-y-5">
            {SECTIONS.map((section) => (
              <section key={section.label} className="space-y-1.5">
                <h4 className="px-1 text-[12px] leading-4 font-medium uppercase tracking-[0.04em] text-[var(--a-text-3)]">{section.label}</h4>
                <div className="rounded-[12px] border border-[var(--a-line)] bg-[var(--a-card)] divide-y divide-[var(--a-line)] overflow-hidden">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link key={item.path} to={item.path} className="flex items-center gap-3 px-4 h-[46px] active:bg-[var(--a-fill)]">
                        <span className={cx("h-7 w-7 rounded-[7px] flex items-center justify-center", active ? "bg-[var(--a-accent)]" : "bg-[var(--a-fill-2)]")}>
                          <Icon className={cx("h-4 w-4", active ? "text-[#FFFFFF]" : "text-[var(--a-text-2)]")} />
                        </span>
                        <span className={cx("flex-1 text-[15px]", active ? "font-semibold text-[var(--a-text)]" : "text-[var(--a-text)]")}>{item.name}</span>
                        <ChevronRight className="h-4 w-4 text-[var(--a-text-3)]" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
            <section className="space-y-1.5">
              <h4 className="px-1 text-[12px] leading-4 font-medium uppercase tracking-[0.04em] text-[var(--a-text-3)]">Appearance</h4>
              <Segmented options={THEME_OPTIONS} value={theme} onChange={toggleTheme} stretch />
            </section>
            <button
              onClick={handleLogout}
              className="w-full h-11 rounded-[12px] bg-[var(--a-card)] border border-[var(--a-line)] text-[15px] font-medium text-[var(--a-error)] pd-press cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </Sheet>
      </div>
    </div>
  );
};

export default AdminLayout;
