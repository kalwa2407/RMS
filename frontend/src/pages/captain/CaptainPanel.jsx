import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UtensilsCrossed, RefreshCw, LogOut, ChefHat, Plus, X, Minus,
  Check, Clock, Receipt, ShoppingBag, Users, Bell, AlertCircle, CheckCircle, Search, Sparkles, TrendingUp, Coffee,
  Calendar, UserCheck
} from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";

/* ── Helpers ── */
const tableColor = (status) => {
  if (status === "free") return { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.4)", text: "#22c55e", label: "Free" };
  if (status === "occupied") return { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.4)", text: "#ef4444", label: "Occupied" };
  if (status === "reserved") return { bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.5)", text: "#EAB308", label: "Reserved" };
  return { bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.4)", text: "#EAB308", label: "Billing" };
};

const formatTime = (ts) => {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    return isToday ? time : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " " + time;
  } catch { return "—"; }
};

const timeSince = (ts) => {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
};

const orderStatusLabel = (s) => ({
  accepted: "⏳ Sent to Kitchen",
  preparing: "🔥 Preparing",
  ready: "✅ READY — Serve Now!",
  delivered: "✔ Served",
})[s] || s;

const fmt = (n) => `₹${Number(n || 0).toFixed(0)}`;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { g: "Good Morning", e: "☀️" };
  if (h < 17) return { g: "Good Afternoon", e: "🌤️" };
  if (h < 21) return { g: "Good Evening", e: "🌆" };
  return { g: "Good Night", e: "🌙" };
};
const getShiftTime = () => {
  const now = new Date();
  return now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};
const CaptainPanel = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("captain_token");
  const captainName = localStorage.getItem("captain_name") || "Captain";

  const logout = () => {
    localStorage.removeItem("captain_token");
    localStorage.removeItem("captain_name");
    localStorage.removeItem("captain_id");
    navigate("/staff-entry", { replace: true });
  };

  const [tab, setTab] = useState("tables");
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readyOrders, setReadyOrders] = useState([]); // dine-in orders with status=ready
  const [readyAlerted, setReadyAlerted] = useState(new Set());
  const [sheet, setSheet] = useState(null);
  const [menu, setMenu] = useState([]);
  const [menuCategory, setMenuCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [guestName, setGuestName] = useState("Guest");
  const [placing, setPlacing] = useState(false);
  const [closingBill, setClosingBill] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [shiftStart] = useState(() => new Date());
  const [clockTime, setClockTime] = useState(getShiftTime());

  const audioRef = useRef(null);
  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClockTime(getShiftTime()), 10000);
    return () => clearInterval(t);
  }, []);


  useEffect(() => {
    if (!token) navigate("/staff-entry", { replace: true });
  }, [token, navigate]);

  // Init audio
  useEffect(() => {
    const audio = new Audio("/notification.wav");
    audio.volume = 0.9;
    audioRef.current = audio;
    const prime = () => { audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {}); };
    document.addEventListener("click", prime, { once: true });
    return () => document.removeEventListener("click", prime);
  }, []);

  const playAlert = () => {
    try { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); } } catch {}
  };

  const fetchTables = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/captain/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTables(Array.isArray(data) ? data.sort((a, b) => a.table_number - b.table_number) : []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("captain_token");
        navigate("/staff-entry", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  const fetchMenu = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/menu`);
      setMenu(Array.isArray(data) ? data.filter(i => i.available !== false) : []);
    } catch {}
  }, []);

  // Fetch ready dine-in orders for captain notification
  const fetchReadyOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/orders?status_filter=ready`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dineReady = Array.isArray(data)
        ? data.filter(o => o.order_type === "DINE_IN" && o.status === "ready")
        : [];
      // Alert for new ones not yet alerted
      const newReady = dineReady.filter(o => !readyAlerted.has(o.order_id));
      if (newReady.length > 0) {
        playAlert();
        setReadyAlerted(prev => {
          const next = new Set(prev);
          newReady.forEach(o => next.add(o.order_id));
          return next;
        });
      }
      setReadyOrders(dineReady);
    } catch {}
  }, [token, readyAlerted]);

  useEffect(() => {
    fetchTables();
    fetchMenu();
    fetchReadyOrders();
    const interval = setInterval(() => {
      fetchTables();
      fetchReadyOrders();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchTables, fetchMenu, fetchReadyOrders]);

  // Refresh sheet when tables update
  useEffect(() => {
    if (sheet?.type === "table" && sheet.table) {
      const fresh = tables.find(t => t.table_number === sheet.table.table_number);
      if (fresh) setSheet(s => ({ ...s, table: fresh }));
    }
  }, [tables]);

  const openTable = async (table) => {
    setCart([]);
    setGuestName("Guest");
    let session = null;
    if (table.current_session_id || table.status === "occupied") {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/captain/tables/${table.table_number}/session`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data.has_session) session = data.session;
      } catch {}
    }
    setSheet({ type: "table", table, session });
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.item_id === (item.id || item._id));
      if (existing) return prev.map(c => c.item_id === existing.item_id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item_id: item.id || item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };
  const updateQty = (item_id, delta) => {
    setCart(prev => prev.map(c => c.item_id === item_id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const placeOrder = async () => {
    if (!cart.length) return;
    setPlacing(true);
    try {
      const items = cart.map(c => ({ item_id: c.item_id, name: c.name, price: c.price, quantity: c.quantity, variant: null, variant_price: 0, addons: [], item_cost: 0 }));
      await axios.post(`${API_BASE}/api/captain/order`,
        { table_number: sheet.table.table_number, items, customer_name: guestName || "Guest", session_id: sheet.session?.session_id || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart([]);
      const { data } = await axios.get(`${API_BASE}/api/captain/tables/${sheet.table.table_number}/session`,
        { headers: { Authorization: `Bearer ${token}` } });
      setSheet(s => ({ ...s, session: data.has_session ? data.session : null, table: { ...s.table, status: "occupied" } }));
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  const closeBill = async () => {
    if (!sheet?.session?.session_id) return;
    setClosingBill(true);
    try {
      await axios.post(`${API_BASE}/api/captain/sessions/${sheet.session.session_id}/close?payment_method=${paymentMethod}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSheet(null);
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to close bill");
    } finally {
      setClosingBill(false);
    }
  };

  const markOrderServed = async (orderId) => {
    try {
      await axios.put(
        `${API_BASE}/api/admin/orders/${orderId}/status`,
        { status: "delivered" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReadyOrders(prev => prev.filter(o => o.order_id !== orderId));
      fetchTables();
      fetchReadyOrders();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update order status");
    }
  };

  const categories = ["All", ...new Set(menu.map(i => i.category))];
  const filteredMenu = menu.filter(i => {
    const matchesCategory = menuCategory === "All" || i.category === menuCategory;
    const matchesSearch = !menuSearch.trim() || i.name.toLowerCase().includes(menuSearch.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const occupiedTables = tables.filter(t => t.status !== "free");

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#0a1628" }}>

      {/* â”€â”€ HEADER â”€â”€ */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(15,30,60,0.98)", borderBottom: "1.5px solid rgba(234,179,8,0.25)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#EAB308] to-[#d97706] flex items-center justify-center shadow-lg">
            <UtensilsCrossed className="h-5 w-5 text-black" />
          </div>
          <div>
            <p className="text-[#EAB308] font-black text-[10px] uppercase tracking-[0.2em] leading-none">Captain Panel</p>
            <p className="text-white text-sm font-bold mt-0.5">{captainName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {readyOrders.length > 0 && (
            <button onClick={() => setTab("ready")}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold animate-pulse">
              <Bell className="h-3.5 w-3.5" />
              {readyOrders.length} Ready!
            </button>
          )}
          <button onClick={fetchTables}
            className="p-2 rounded-xl bg-[#0f2933]/60 text-gray-400 active:scale-90 transition-transform">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={logout}
            className="p-2 rounded-xl bg-red-900/30 text-red-400 active:scale-90 transition-transform">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* GREETING + STATS CARDS */}
      <div className="shrink-0 px-3 pt-3 pb-2 space-y-2.5">
        <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ background:"linear-gradient(135deg,rgba(234,179,8,0.12) 0%,rgba(10,22,40,0.85) 100%)", border:"1px solid rgba(234,179,8,0.22)", backdropFilter:"blur(16px)" }}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color:"#EAB308" }}>
              {getGreeting().e} {getGreeting().g}
            </p>
            <p className="text-white font-bold text-base leading-tight mt-0.5" style={{ fontFamily:"'Playfair Display',serif" }}>
              {captainName}
            </p>
            <p className="text-gray-500 text-[10px] mt-0.5">
              Shift started at {shiftStart.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white font-black text-2xl leading-none" style={{ fontFamily:"'Playfair Display',serif" }}>{clockTime}</p>
            <p className="text-gray-600 text-[9px] mt-0.5 uppercase tracking-wider">
              {new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",weekday:"short"})}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:"Tables", value:tables.length, sub:`${tables.filter(t=>t.status==="free").length} free`, color:"#EAB308", bg:"rgba(234,179,8,0.08)", border:"rgba(234,179,8,0.2)" },
            { label:"Occupied", value:tables.filter(t=>t.status==="occupied").length, sub:"active tables", color:"#ef4444", bg:"rgba(239,68,68,0.08)", border:"rgba(239,68,68,0.2)" },
            { label:"Ready", value:readyOrders.length, sub:"to serve now", color:"#22c55e", bg:"rgba(34,197,94,0.08)", border:"rgba(34,197,94,0.2)" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl px-2 py-2.5 text-center"
              style={{ background:s.bg, border:`1px solid ${s.border}` }}>
              <p className="font-black text-2xl leading-none" style={{ color:s.color }}>{s.value}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color:s.color }}>{s.label}</p>
              <p className="text-gray-600 text-[9px] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
      {/* â”€â”€ CONTENT â”€â”€ */}
      <div className="flex-1 overflow-y-auto pb-20">

        {/* â”€â”€ READY ORDERS ALERT TAB â”€â”€ */}
        {tab === "ready" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                🔔 Ready to Serve
              </h2>
              <button onClick={() => setTab("tables")} className="text-gray-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            {readyOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-600 gap-3">
                <CheckCircle className="h-12 w-12 opacity-20" />
                <p className="text-sm">No orders ready right now</p>
              </div>
            ) : (
              readyOrders.map(order => (
                <div key={order.order_id} className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(34,197,94,0.08)", border: "2px solid rgba(34,197,94,0.4)" }}>
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: "1px solid rgba(34,197,94,0.15)" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">{order.kot_number || order.order_id?.slice(-8)}</span>
                      <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">READY</span>
                    </div>
                    <div className="text-right">
                      {order.table_number && (
                        <span className="bg-[#EAB308] text-black text-xs px-2 py-1 rounded-lg font-bold">Table {order.table_number}</span>
                      )}
                      <p className="text-gray-400 text-[10px] mt-1">{formatTime(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-gray-400 text-xs mb-2">Customer: <span className="text-white">{order.customer_name}</span></p>
                    <div className="space-y-1">
                      {(order.items || []).map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-300">{item.quantity}× {item.name}</span>
                          <span className="text-emerald-400 font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 rounded-xl text-center space-y-2.5" style={{ background: "rgba(34,197,94,0.1)" }}>
                      <p className="text-emerald-400 font-bold text-sm">✅ Food is ready — Please serve Table {order.table_number || "—"}</p>
                      <button
                        onClick={() => markOrderServed(order.order_id)}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Check className="h-4 w-4" />
                        Mark as Served
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* â”€â”€ TABLES TAB â”€â”€ */}
        {tab === "tables" && (
          <div className="p-3">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" /> Loading tables...
              </div>
            ) : (
              <>
                {/* Legend */}
                <div className="flex gap-4 mb-4 px-1">
                  {[{ s: "free", l: "Free" }, { s: "reserved", l: "Reserved" }, { s: "occupied", l: "Occupied" }, { s: "billing", l: "Billing" }].map(({ s, l }) => {
                    const c = tableColor(s);
                    return (
                      <div key={s} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.text }} />
                        <span className="text-gray-400 text-xs font-medium">{l}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Table Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                  {tables.map(t => {
                    const c = tableColor(t.status);
                    const hasReady = readyOrders.some(o => o.table_number === t.table_number);
                    const isReserved = t.is_reserved_today || t.status === "reserved";
                    return (
                      <button key={t.table_number} onClick={() => openTable(t)}
                        className="relative flex flex-col items-center justify-center rounded-2xl py-3.5 px-1 transition-all active:scale-95"
                        style={{
                          background: isReserved && t.status === "free" ? "rgba(234,179,8,0.1)" : c.bg,
                          border: `1.5px solid ${hasReady ? "#22c55e" : isReserved && t.status === "free" ? "#EAB308" : c.border}`
                        }}>
                        {hasReady && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                        {isReserved && !hasReady && (
                          <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-[#EAB308] text-black text-[8px] font-black rounded-full uppercase shadow">
                            {t.upcoming_reservation?.time || "RES"}
                          </span>
                        )}
                        <span className="text-white font-bold text-lg leading-none">{t.table_number}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider mt-1 truncate max-w-full px-1"
                          style={{ color: hasReady ? "#22c55e" : isReserved && t.status === "free" ? "#EAB308" : c.text }}>
                          {hasReady ? "READY" : isReserved && t.status === "free" ? (t.upcoming_reservation?.time || "Reserved") : c.label}
                        </span>
                        {t.status === "occupied" && !hasReady && (
                          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a1628]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* â”€â”€ ORDERS TAB â”€â”€ */}
        {tab === "orders" && (
          <div className="p-3 space-y-3">
            {occupiedTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-600 gap-2">
                <ChefHat className="h-10 w-10 opacity-20" />
                <p className="text-sm">No active tables</p>
              </div>
            ) : (
              occupiedTables.map(t => {
                const hasReady = readyOrders.some(o => o.table_number === t.table_number);
                return (
                  <button key={t.table_number} onClick={() => openTable(t)}
                    className="w-full text-left rounded-2xl p-4 border transition-all active:scale-[0.98]"
                    style={{
                      background: hasReady ? "rgba(34,197,94,0.08)" : "rgba(26,72,85,0.7)",
                      borderColor: hasReady ? "rgba(34,197,94,0.4)" : "rgba(234,179,8,0.2)"
                    }}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: hasReady ? "rgba(34,197,94,0.2)" : "rgba(234,179,8,0.15)" }}>
                          <span className="font-bold text-sm" style={{ color: hasReady ? "#22c55e" : "#EAB308" }}>{t.table_number}</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">Table {t.table_number}</p>
                          <p className={`text-xs capitalize ${hasReady ? "text-emerald-400 font-bold" : "text-gray-400"}`}>
                            {hasReady ? "✅ Ready to serve!" : t.status}
                          </p>
                        </div>
                      </div>
                      <div className="text-[#EAB308] text-xs font-bold uppercase tracking-wider">View â†’</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* â”€â”€ BOTTOM TAB BAR â”€â”€ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ background: "rgba(15,30,60,0.98)", borderTop: "1.5px solid rgba(234,179,8,0.2)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {[
          { key: "tables", icon: Users, label: "Tables" },
          { key: "ready", icon: Bell, label: "Ready", badge: readyOrders.length },
          { key: "orders", icon: ShoppingBag, label: "Active" },
        ].map(({ key, icon: Icon, label, badge }) => {
          const active = tab === key;
          return (
            <button key={key} onClick={() => setTab(key)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative">
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-[#EAB308]" />}
              <div className={`p-1.5 rounded-xl relative ${active ? "bg-[#EAB308]/15" : ""}`}>
                <Icon className={`h-5 w-5 ${active ? "text-[#EAB308]" : key === "ready" && readyOrders.length > 0 ? "text-emerald-400" : "text-gray-500"}`} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full text-white text-[9px] font-black flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                active ? "text-[#EAB308]" : key === "ready" && readyOrders.length > 0 ? "text-emerald-400" : "text-gray-600"
              }`}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* â•â•â•â•â•â•â•â•â•â• TABLE SHEET â•â•â•â•â•â•â•â•â•â• */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSheet(null)} />
          <div className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-3xl overflow-hidden"
            style={{ background: "#0f1e3c", maxHeight: "95vh", border: "1.5px solid rgba(234,179,8,0.2)" }}>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#EAB308]/30" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 pb-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(234,179,8,0.1)" }}>
              <div>
                <h2 className="text-white font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Table {sheet.table.table_number}
                </h2>
                <p className="text-gray-500 text-xs capitalize">{sheet.table.status}</p>
              </div>
              <button onClick={() => setSheet(null)} className="p-2 rounded-full bg-white/5 text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">

                            {/* Upcoming Reservation warning banner */}
              {sheet.table?.upcoming_reservation && (
                <div className="mx-4 mt-3 rounded-2xl p-3.5 flex items-start gap-3 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/40">
                  <div className="w-8 h-8 rounded-full bg-[#EAB308]/20 text-[#EAB308] flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[#EAB308] font-bold text-sm">⚠️ Table Reserved Today: {sheet.table.upcoming_reservation.time}</p>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#EAB308]/20 text-[#EAB308] border border-[#EAB308]/30">
                        {sheet.table.upcoming_reservation.status}
                      </span>
                    </div>
                    <p className="text-gray-300 text-xs mt-1">
                      Reserved for <strong className="text-white">{sheet.table.upcoming_reservation.customer_name}</strong> ({sheet.table.upcoming_reservation.guests} guests)
                      {sheet.table.upcoming_reservation.phone && ` • +91 ${sheet.table.upcoming_reservation.phone}`}
                    </p>
                    {sheet.table.upcoming_reservation.special_requests && (
                      <p className="text-amber-200/80 text-[11px] mt-1 italic">
                        "{sheet.table.upcoming_reservation.special_requests}"
                      </p>
                    )}
                    {sheet.table.status === "free" && (
                      <button
                        onClick={() => setGuestName(sheet.table.upcoming_reservation.customer_name)}
                        className="mt-2 text-xs font-bold bg-[#EAB308] hover:bg-[#ca9a07] text-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Seat Reserved Guest ({sheet.table.upcoming_reservation.customer_name})
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Ready alert for this table */}
              {readyOrders.some(o => o.table_number === sheet.table.table_number) && (
                <div className="mx-4 mt-4 rounded-2xl p-3 flex items-center gap-3"
                  style={{ background: "rgba(34,197,94,0.12)", border: "1.5px solid rgba(34,197,94,0.4)" }}>
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-emerald-400 font-bold text-sm">Food is Ready! 🎉</p>
                    <p className="text-emerald-600 text-xs">Kitchen has marked this order ready. Please serve.</p>
                  </div>
                </div>
              )}

              {/* Existing orders */}
              {sheet.session?.orders?.length > 0 && (
                <div className="px-4 py-3 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Current Orders</p>
                  {sheet.session.orders.map((o, i) => (
                    <div key={i} className="rounded-xl p-3"
                      style={{
                        background: o.status === "ready" ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)",
                        border: o.status === "ready" ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.06)"
                      }}>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400 text-xs font-semibold">Order #{i + 1}</span>
                        <span className={`text-xs font-bold ${o.status === "ready" ? "text-emerald-400 animate-pulse" : o.status === "preparing" ? "text-yellow-400" : "text-blue-400"}`}>
                          {orderStatusLabel(o.status)}
                        </span>
                      </div>
                      {o.created_at && <p className="text-gray-600 text-[10px] mb-1.5">{formatTime(o.created_at)} · {timeSince(o.created_at)}</p>}
                      {o.items?.map((item, j) => (
                        <div key={j} className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>{item.quantity}× {item.name}</span>
                          <span>{fmt(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="text-right text-[#EAB308] text-xs font-bold mt-1">{fmt(o.total)}</div>
                    </div>
                  ))}
                  <div className="rounded-xl p-3 flex justify-between items-center"
                    style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.15)" }}>
                    <span className="text-white font-bold text-sm">Session Total</span>
                    <span className="text-[#EAB308] font-bold text-lg">{fmt(sheet.session.total)}</span>
                  </div>
                </div>
              )}

              {/* Add items */}
              <div className="px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Add Items</p>

                {!sheet.session && (
                  <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)}
                    placeholder="Guest name (optional)"
                    className="w-full bg-white/5 border border-[#EAB308]/15 text-white rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-[#EAB308]/40 placeholder-gray-600" />
                )}

                {/* Search bar */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={e => setMenuSearch(e.target.value)}
                    placeholder="Search menu items..."
                    className="w-full bg-white/5 border border-[#EAB308]/15 text-white rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-[#EAB308]/40 placeholder-gray-600"
                  />
                  {menuSearch && (
                    <button onClick={() => setMenuSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Category pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-1 px-1 no-scrollbar">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setMenuCategory(cat)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        menuCategory === cat ? "bg-[#EAB308] text-black" : "bg-white/5 text-gray-400 border border-[#EAB308]/10"
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Menu items */}
                <div className="space-y-2">
                  {filteredMenu.map(item => {
                    const id = item.id || item._id;
                    const inCart = cart.find(c => c.item_id === id);
                    return (
                      <div key={id} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(234,179,8,0.08)" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                          <p className="text-[#EAB308] text-xs font-bold">{fmt(item.price)}</p>
                        </div>
                        {inCart ? (
                          <div className="flex items-center gap-2 ml-3">
                            <button onClick={() => updateQty(id, -1)}
                              className="w-7 h-7 rounded-full bg-[#EAB308]/15 text-[#EAB308] flex items-center justify-center active:scale-90">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-white font-bold text-sm w-4 text-center">{inCart.quantity}</span>
                            <button onClick={() => updateQty(id, 1)}
                              className="w-7 h-7 rounded-full bg-[#EAB308] text-black flex items-center justify-center active:scale-90">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(item)}
                            className="ml-3 w-8 h-8 rounded-full bg-[#EAB308] text-black flex items-center justify-center active:scale-90 shrink-0">
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sheet footer */}
            <div className="shrink-0 px-4 py-4 space-y-2"
              style={{ borderTop: "1px solid rgba(234,179,8,0.1)" }}>
              {cart.length > 0 && (
                <div className="rounded-xl p-3 mb-2"
                  style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.15)" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm font-bold">{cart.length} item(s) in cart</span>
                    <span className="text-[#EAB308] font-bold">{fmt(cartTotal)}</span>
                  </div>
                </div>
              )}

              {cart.length > 0 && (
                <button onClick={placeOrder} disabled={placing}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-black disabled:opacity-60 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg,#EAB308,#d97706)" }}>
                  <ChefHat className="h-4 w-4" />
                  {placing ? "Sending..." : "Send to Kitchen"}
                </button>
              )}

              {sheet.session?.orders?.length > 0 && cart.length === 0 && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {["cash", "card", "upi"].map(pm => (
                      <button key={pm} onClick={() => setPaymentMethod(pm)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                          paymentMethod === pm ? "bg-[#EAB308] text-black" : "bg-white/5 text-gray-400 border border-[#EAB308]/15"
                        }`}>
                        {pm}
                      </button>
                    ))}
                  </div>
                  <button onClick={closeBill} disabled={closingBill}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 active:scale-[0.98]"
                    style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.35)" }}>
                    <Receipt className="h-4 w-4" />
                    {closingBill ? "Closing..." : `Close Bill — ${fmt(sheet.session.total)}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainPanel;

