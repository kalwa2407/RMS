import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  RefreshCw, CheckCircle2, LogOut, Bell, Volume2, Printer, WifiOff,
} from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";
import { printKOT } from "../../lib/PrintService";
import { cx } from "../customer/ui";
import {
  TicketCard, TicketSkeleton, BoardMessage, ColumnEmpty, OfflineBanner, IconButton, minutesSince,
} from "./ui";

const formatTime = (ts) => {
  if (!ts) return "—";
  try {
    const d = new Date(ts); const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    return isToday ? time : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " " + time;
  } catch { return "—"; }
};
const clockTime = (d) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
const greeting = (d) => {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Good night";
};

const KitchenPanel = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("kitchen_token");
  const staffName = localStorage.getItem("kitchen_name") || "Chef";

  const logout = () => {
    localStorage.removeItem("kitchen_token");
    localStorage.removeItem("kitchen_name");
    navigate("/staff-entry", { replace: true });
  };
  const [shiftStart] = useState(() => new Date());
  const [clockNow, setClockNow] = useState(new Date());

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [updating, setUpdating] = useState(null);
  const [printingId, setPrintingId] = useState(null);
  const [autoKotPrint, setAutoKotPrint] = useState(() => localStorage.getItem("pd_kitchen_auto_print") === "true");
  const [notifCount, setNotifCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [fetchError, setFetchError] = useState(false); // presentation only: drives the offline/error state
  const [, setTick] = useState(0);

  const prevOrderIds = useRef(new Set());
  const audioRef = useRef(null);

  useEffect(() => { if (!token) navigate("/kitchen", { replace: true }); }, [token, navigate]);

  useEffect(() => {
    const audio = new Audio("/notification.wav");
    audio.volume = 0.8;
    audioRef.current = audio;
    const prime = () => { audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {}); };
    document.addEventListener("click", prime, { once: true });
    return () => document.removeEventListener("click", prime);
  }, []);

    useEffect(() => { const c = setInterval(() => setClockNow(new Date()), 30000); return () => clearInterval(c); }, []);
  useEffect(() => { const t = setInterval(() => setTick(n => n + 1), 30000); return () => clearInterval(t); }, []);

  const playAlert = () => {
    try { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); } } catch {}
  };

  const handlePrintKot = async (order) => {
    try {
      setPrintingId(order.order_id);
      await printKOT(order, "manual");
    } catch (err) {
      console.error("Print KOT failed:", err);
      alert("Unable to open print dialog. Please ensure popups are allowed.");
    } finally {
      setTimeout(() => setPrintingId(null), 800);
    }
  };

  const fetchOrders = useCallback(async (silent = false) => {
    if (!token) return; // Guard: don't fetch without valid token
    try {
      const { data } = await axios.get(`${API_BASE}/api/kitchen/orders`, { headers: { Authorization: `Bearer ${token}` } });
      const fresh = Array.isArray(data) ? data : [];
      const newIds = new Set(fresh.map(o => o.order_id));
      const arrived = fresh.filter(o => !prevOrderIds.current.has(o.order_id));
      if (silent && arrived.length > 0) {
        playAlert();
        setNotifCount(n => n + arrived.length);
        if (autoKotPrint) {
          arrived.forEach(o => {
            try { printKOT(o, "auto"); } catch (e) { console.error("Auto KOT print error:", e); }
          });
        }
      }
      prevOrderIds.current = newIds;
      setOrders(fresh);
      setLastRefresh(new Date());
      setFetchError(false);
    } catch (err) {
      setFetchError(true);
      if (err.response?.status === 401 || err.response?.status === 403) { localStorage.removeItem("kitchen_token"); navigate("/kitchen", { replace: true }); }
    } finally { setLoading(false); }
  }, [token, navigate, autoKotPrint]);

  useEffect(() => { fetchOrders(); const i = setInterval(() => fetchOrders(true), 8000); return () => clearInterval(i); }, [fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await axios.put(`${API_BASE}/api/kitchen/orders/${orderId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      fetchOrders();
    } catch (err) { alert(err.response?.data?.detail || "Failed to update"); }
    finally { setUpdating(null); }
  };

  const newOrders = orders.filter(o => o.status === "accepted");
  const preparingOrders = orders.filter(o => o.status === "preparing");
  const displayOrders = activeTab === "new" ? newOrders : activeTab === "preparing" ? preparingOrders : orders;

  const oldest = orders.length > 0 ? orders[orders.length - 1] : null;
  const oldestMins = oldest ? minutesSince(oldest.accepted_at || oldest.created_at) : null;
  const queuePressure = orders.length > 5 ? "High" : orders.length > 2 ? "Medium" : "Low";

  const renderTicket = (order) => (
    <TicketCard
      key={order.order_id}
      order={order}
      formatTime={formatTime}
      isUpdating={updating === order.order_id}
      isPrinting={printingId === order.order_id}
      onPrint={() => handlePrintKot(order)}
      onAdvance={(next) => updateStatus(order.order_id, next)}
    />
  );

  const tabs = [
    { key: "all", label: "All", count: orders.length },
    { key: "new", label: "New", count: newOrders.length },
    { key: "preparing", label: "Cooking", count: preparingOrders.length },
  ];

  const emptyCopy = {
    all: { title: "No tickets in the queue", message: "New orders appear here automatically. The queue checks for orders every 8 seconds." },
    new: { title: "No new tickets", message: "Accepted orders waiting to be started will appear here." },
    preparing: { title: "Nothing cooking", message: "Tickets you start preparing will appear here." },
  }[activeTab];

  let board;
  if (loading) {
    board = (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4" aria-busy="true" aria-label="Loading kitchen queue">
        {[0, 1, 2, 3].map((i) => <TicketSkeleton key={i} />)}
      </div>
    );
  } else if (fetchError && orders.length === 0) {
    board = (
      <BoardMessage
        icon={WifiOff}
        tone="error"
        title="Can't load the kitchen queue"
        message="Check the tablet's internet connection. The panel keeps retrying every 8 seconds."
        action={<IconButton icon={RefreshCw} label="Try again" onClick={() => fetchOrders()} className="px-5">Try again</IconButton>}
      />
    );
  } else if (displayOrders.length === 0) {
    board = <BoardMessage icon={CheckCircle2} tone="success" title={emptyCopy.title} message={emptyCopy.message} />;
  } else if (activeTab === "all") {
    // Status columns: New | Cooking. Stacks to one list on narrow screens.
    const column = (title, list, accent, emptyText) => (
      <section className="min-w-0">
        <div className="flex items-baseline gap-2 mb-3 px-1">
          <span className={cx("w-2 h-2 rounded-full self-center", accent)} />
          <h2 className="text-[20px] font-semibold text-pd-ink">{title}</h2>
          <span className="text-[20px] font-semibold text-pd-ink-3 pd-tabular">{list.length}</span>
        </div>
        {list.length === 0 ? (
          <ColumnEmpty>{emptyText}</ColumnEmpty>
        ) : (
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 items-start">
            <AnimatePresence initial={false} mode="popLayout">{list.map(renderTicket)}</AnimatePresence>
          </div>
        )}
      </section>
    );
    board = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {column("New", newOrders, "bg-pd-action", "No new tickets")}
        {column("Cooking", preparingOrders, "bg-pd-teal", "Nothing cooking")}
      </div>
    );
  } else {
    board = (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 items-start">
        <AnimatePresence initial={false} mode="popLayout">{displayOrders.map(renderTicket)}</AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pd-surface text-pd-ink antialiased">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[var(--pd-line)]">
        <div className="px-4 md:px-6 h-[76px] flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-pd-ink-3">Kitchen display</p>
            <p className="text-[20px] font-semibold text-pd-ink leading-tight truncate">
              {greeting(clockNow)}, {staffName}
            </p>
            <p className="text-[13px] text-pd-ink-3 pd-tabular hidden sm:block">Shift started {clockTime(shiftStart)}</p>
          </div>

          <div className="hidden md:block text-right pr-2">
            <p className="text-[28px] font-semibold leading-none pd-tabular tracking-[-0.02em]">{clockTime(clockNow)}</p>
            <p className="text-[13px] text-pd-ink-3 mt-1">
              {clockNow.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {notifCount > 0 && (
              <button
                type="button"
                onClick={() => setNotifCount(0)}
                aria-label={`${notifCount} new tickets. Tap to clear`}
                className="pd-press h-12 px-4 rounded-[14px] bg-pd-action text-white inline-flex items-center gap-2 text-[15px] font-semibold"
              >
                <Bell className="h-5 w-5" strokeWidth={2} />
                <span className="pd-tabular">{notifCount} new</span>
              </button>
            )}
            <IconButton
              icon={Printer}
              label="Auto-print KOT ticket when new order arrives"
              active={autoKotPrint}
              aria-pressed={autoKotPrint}
              onClick={() => {
                const next = !autoKotPrint;
                setAutoKotPrint(next);
                localStorage.setItem("pd_kitchen_auto_print", String(next));
              }}
            >
              <span className="hidden lg:inline">Auto KOT</span>
              <span className={cx("text-[13px] font-semibold", autoKotPrint ? "text-white/80" : "text-pd-ink-3")}>{autoKotPrint ? "On" : "Off"}</span>
            </IconButton>
            <IconButton icon={Volume2} label="Test alert sound" onClick={playAlert} />
            <IconButton icon={RefreshCw} label="Refresh now" onClick={() => fetchOrders()}>
              <span className="hidden lg:inline text-[13px] text-pd-ink-3 pd-tabular font-medium">
                {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </IconButton>
            <IconButton icon={LogOut} label="Log out" tone="danger" onClick={logout} />
          </div>
        </div>
      </header>

      <main className="px-4 md:px-6 py-4">
        {/* TOOLBAR: status filter + queue facts */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-5">
          <div role="tablist" aria-label="Filter tickets" className="inline-flex p-1 rounded-[14px] bg-[rgba(14,26,32,0.06)]">
            {tabs.map(({ key, label, count }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(key)}
                  className={cx(
                    "pd-press h-12 min-w-[104px] px-4 rounded-[10px] inline-flex items-center justify-center gap-2 text-[16px] font-semibold",
                    active ? "bg-white text-pd-ink shadow-pd-1" : "text-pd-ink-2"
                  )}
                >
                  {label}
                  <span className={cx("pd-tabular text-[15px]", active ? "text-pd-ink-2" : "text-pd-ink-3")}>{count}</span>
                </button>
              );
            })}
          </div>

          <dl className="flex items-center gap-6 text-[15px]">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-pd-ink-3">Oldest ticket</dt>
              <dd className={cx(
                "text-[20px] font-semibold pd-tabular leading-tight",
                oldestMins == null ? "text-pd-ink-3" : oldestMins >= 20 ? "text-pd-error" : oldestMins >= 10 ? "text-pd-warn" : "text-pd-ink"
              )}>
                {oldestMins == null ? "—" : `${oldestMins}m`}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-pd-ink-3">Queue</dt>
              <dd className="text-[20px] font-semibold leading-tight">{queuePressure}</dd>
            </div>
          </dl>

          <p className="text-[13px] text-pd-ink-3 lg:ml-auto">
            Timer turns amber after 10 min and red after 20 min
          </p>
        </div>

        {fetchError && orders.length > 0 && !loading && (
          <OfflineBanner lastRefresh={clockTime(lastRefresh)} onRetry={() => fetchOrders()} />
        )}

        {board}
      </main>
    </div>
  );
};

export default KitchenPanel;

