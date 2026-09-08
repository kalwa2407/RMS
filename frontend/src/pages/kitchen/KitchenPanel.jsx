import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChefHat, Clock, RefreshCw, CheckCircle, LogOut,
  AlertCircle, Bell, Flame, UtensilsCrossed, Bike, Package
} from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";

/* ── helpers ── */
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
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
};

const urgency = (ts) => {
  const mins = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (mins >= 20) return { border: "#ef4444", bg: "rgba(239,68,68,0.07)", badge: "bg-red-500", text: "text-red-400", label: "URGENT" };
  if (mins >= 10) return { border: "#f97316", bg: "rgba(249,115,22,0.06)", badge: "bg-orange-500", text: "text-orange-400", label: "DELAYED" };
  return { border: "#EAB308", bg: "rgba(234,179,8,0.04)", badge: "bg-emerald-500", text: "text-emerald-400", label: "ON TIME" };
};

const sourceTag = (order) => {
  if (order.order_type === "DELIVERY") return { label: "🛵 Delivery", cls: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
  if (order.order_type === "DINE_IN") return { label: `🪑 Table ${order.table_number || "—"}`, cls: "bg-purple-500/20 text-purple-300 border-purple-500/30" };
  return { label: "📦 Takeaway", cls: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" };
};

const KitchenPanel = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("kitchen_token");
  const staffName = localStorage.getItem("kitchen_name") || "Chef";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [updating, setUpdating] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all"); // all | new | preparing

  const prevOrderIds = useRef(new Set());
  const audioRef = useRef(null);

  useEffect(() => {
    if (!token) navigate("/kitchen", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    const audio = new Audio("/notification.wav");
    audio.volume = 0.8;
    audioRef.current = audio;
    const prime = () => { audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {}); };
    document.addEventListener("click", prime, { once: true });
    return () => document.removeEventListener("click", prime);
  }, []);

  const playAlert = () => {
    try { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); } } catch {}
  };

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/kitchen/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fresh = Array.isArray(data) ? data : [];
      const newIds = new Set(fresh.map(o => o.order_id));
      const arrived = fresh.filter(o => !prevOrderIds.current.has(o.order_id));
      if (silent && arrived.length > 0) {
        playAlert();
        setNotifCount(n => n + arrived.length);
      }
      prevOrderIds.current = newIds;
      setOrders(fresh);
      setLastRefresh(new Date());
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("kitchen_token");
        navigate("/kitchen", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 8000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await axios.put(`${API_BASE}/api/kitchen/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update");
    } finally {
      setUpdating(null);
    }
  };

  const logout = () => {
    ["kitchen_token", "kitchen_name"].forEach(k => localStorage.removeItem(k));
    navigate("/staff-entry", { replace: true });
  };

  const newOrders = orders.filter(o => o.status === "accepted");
  const preparingOrders = orders.filter(o => o.status === "preparing");
  const displayOrders = activeTab === "new" ? newOrders : activeTab === "preparing" ? preparingOrders : orders;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0f0a 0%, #1a1000 100%)" }}>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(10,15,10,0.97)", borderBottom: "1.5px solid rgba(249,115,22,0.25)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #f97316, #dc2626)" }}>
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-orange-400 font-black text-[10px] uppercase tracking-[0.2em] leading-none">Kitchen Panel</p>
            <p className="text-white text-sm font-bold mt-0.5">{staffName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notifCount > 0 && (
            <button onClick={() => setNotifCount(0)}
              className="relative p-2 rounded-xl bg-red-900/30 text-red-400 border border-red-500/20">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-black flex items-center justify-center">
                {notifCount}
              </span>
            </button>
          )}
          <button onClick={() => fetchOrders()} title="Refresh"
            className="p-2 rounded-xl text-orange-400 hover:text-white transition-colors"
            style={{ background: "rgba(249,115,22,0.1)" }}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={playAlert} title="Test Sound"
            className="p-2 rounded-xl text-gray-500 hover:text-orange-400 transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <Bell className="h-4 w-4" />
          </button>
          <span className="text-gray-600 text-[10px] hidden sm:block">
            {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button onClick={logout} className="p-2 rounded-xl bg-red-900/20 text-red-500 hover:bg-red-900/40 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6">

        {/* ── TABS ── */}
        <div className="flex gap-2 mb-5">
          {[
            { key: "all", label: "All Active", count: orders.length, icon: UtensilsCrossed },
            { key: "new", label: "New Orders", count: newOrders.length, icon: Flame },
            { key: "preparing", label: "Preparing", count: preparingOrders.length, icon: Clock },
          ].map(({ key, label, count, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 justify-center ${
                activeTab === key
                  ? "text-black shadow-lg"
                  : "text-gray-400 border border-white/10 hover:border-orange-500/30"
              }`}
              style={activeTab === key ? { background: "linear-gradient(135deg,#f97316,#dc2626)" } : { background: "rgba(255,255,255,0.04)" }}>
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                activeTab === key ? "bg-black/20 text-white" : "bg-orange-500/20 text-orange-400"
              }`}>{count}</span>
            </button>
          ))}
        </div>

        {/* ── Urgency Legend ── */}
        <div className="flex items-center gap-4 mb-5 px-1">
          <p className="text-gray-600 text-xs uppercase tracking-wider font-bold">Wait time:</p>
          {[
            { color: "bg-emerald-500", label: "< 10 min" },
            { color: "bg-orange-500", label: "10–20 min" },
            { color: "bg-red-500", label: "> 20 min" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-gray-500 text-xs">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Orders ── */}
        {loading ? (
          <div className="flex items-center justify-center h-60 text-orange-400">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <p className="text-white text-lg font-bold">All Caught Up!</p>
            <p className="text-gray-600 text-sm">No pending orders · Refreshes every 8 seconds</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayOrders.map(order => {
              const ts = order.accepted_at || order.created_at;
              const urg = urgency(ts);
              const tag = sourceTag(order);
              const isUpdating = updating === order.order_id;

              return (
                <div key={order.order_id} className="rounded-2xl overflow-hidden flex flex-col transition-all hover:scale-[1.01]"
                  style={{ background: urg.bg, border: `2px solid ${urg.border}` }}>

                  {/* Card header */}
                  <div className="flex items-start justify-between px-4 pt-4 pb-3"
                    style={{ borderBottom: `1px solid ${urg.border}30` }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-black text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {order.kot_number || order.order_id?.slice(-6)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tag.cls}`}>
                          {tag.label}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs truncate">{order.customer_name}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className={`text-[10px] font-black text-white px-2.5 py-1 rounded-full ${urg.badge}`}>
                        {urg.label}
                      </span>
                      <div className="flex items-center gap-1 text-gray-500 text-xs mt-1.5 justify-end">
                        <Clock className="h-3 w-3" />
                        <span>{timeSince(ts)}</span>
                      </div>
                      <p className="text-gray-600 text-[10px] mt-0.5">{formatTime(order.created_at)}</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="px-4 pt-2.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                      order.status === "accepted" ? "bg-orange-500/20 text-orange-400" : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {order.status === "accepted" ? <Flame className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {order.status === "accepted" ? "🔥 New — Start Now" : "⏳ Preparing"}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="flex-1 mx-4 my-3 rounded-xl p-3" style={{ background: "rgba(0,0,0,0.25)" }}>
                    <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mb-2">Items to Prepare</p>
                    <ul className="space-y-2">
                      {(order.items || []).map((item, i) => (
                        <li key={i}>
                          <div className="flex items-baseline gap-2">
                            <span className="text-orange-400 font-black text-base w-6 text-right shrink-0">{item.quantity}×</span>
                            <span className="text-white font-bold text-sm leading-tight">{item.name}</span>
                          </div>
                          {item.variant && <p className="text-gray-500 text-xs ml-8">({item.variant})</p>}
                          {item.addons?.length > 0 && <p className="text-gray-500 text-xs ml-8">+ {item.addons.join(", ")}</p>}
                          {item.special_instructions && (
                            <div className="flex items-start gap-1 ml-8 mt-0.5 text-amber-400 text-xs">
                              <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{item.special_instructions}</span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action */}
                  <div className="px-4 pb-4">
                    {order.status === "accepted" && (
                      <button onClick={() => updateStatus(order.order_id, "preparing")} disabled={isUpdating}
                        className="w-full py-3.5 rounded-xl font-black text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg"
                        style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                        {isUpdating ? "Updating..." : "🔥 Start Preparing"}
                      </button>
                    )}
                    {order.status === "preparing" && (
                      <button onClick={() => updateStatus(order.order_id, "ready")} disabled={isUpdating}
                        className="w-full py-3.5 rounded-xl font-black text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg"
                        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                        {isUpdating ? "Updating..." : "✅ Mark Ready — Notify Captain"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenPanel;
