import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, Clock, RefreshCw, CheckCircle, LogOut, AlertCircle, Bell } from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";

/* ── helpers ── */
const timeSince = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
};

const urgencyColor = (ts) => {
  const mins = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (mins >= 20) return { border: "#ef4444", bg: "rgba(239,68,68,0.08)", badge: "bg-red-500" };
  if (mins >= 10) return { border: "#f97316", bg: "rgba(249,115,22,0.06)", badge: "bg-orange-500" };
  return { border: "#EAB308", bg: "rgba(234,179,8,0.05)", badge: "bg-yellow-500" };
};

const sourceTag = (order) => {
  if (order.order_type === "DELIVERY") return { label: "🛵 Delivery", cls: "bg-blue-500/20 text-blue-300" };
  if (order.source === "captain" || order.order_type === "DINE_IN")
    return { label: `🪑 Table ${order.table_number || "—"}`, cls: "bg-purple-500/20 text-purple-300" };
  return { label: "📦 Takeaway", cls: "bg-green-500/20 text-green-300" };
};

/* ── Main ── */
const KitchenPanel = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("kitchen_token");
  const staffName = localStorage.getItem("kitchen_name") || "Chef";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [updating, setUpdating] = useState(null);
  const [notifCount, setNotifCount] = useState(0);

  const prevOrderIds = useRef(new Set());
  const audioRef = useRef(null);

  /* ── Auth guard ── */
  useEffect(() => {
    if (!token) navigate("/kitchen", { replace: true });
  }, [token, navigate]);

  /* ── Init audio ── */
  useEffect(() => {
    const audio = new Audio("/notification.wav");
    audio.volume = 0.8;
    audioRef.current = audio;
    // prime on first click
    const prime = () => {
      audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
    };
    document.addEventListener("click", prime, { once: true });
    return () => document.removeEventListener("click", prime);
  }, []);

  const playAlert = () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch {}
  };

  /* ── Fetch orders ── */
  const fetchOrders = useCallback(async (silent = false) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/kitchen/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fresh = Array.isArray(data) ? data : [];

      // detect NEW orders
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
    // 10s poll
    const interval = setInterval(() => fetchOrders(true), 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  /* ── Update status ── */
  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await axios.put(
        `${API_BASE}/api/kitchen/orders/${orderId}/status`,
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
    navigate("/kitchen", { replace: true });
  };

  /* ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: "#1a0a00" }}>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-5 py-3"
        style={{ background: "rgba(26,10,0,0.97)", borderBottom: "1.5px solid rgba(249,115,22,0.3)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #f97316, #dc2626)" }}>
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-orange-400 font-bold text-xs uppercase tracking-widest leading-none">Kitchen Panel</p>
            <p className="text-white text-sm font-semibold">{staffName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification badge */}
          {notifCount > 0 && (
            <button onClick={() => setNotifCount(0)}
              className="relative p-2 rounded-xl bg-red-900/30 text-red-400">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {notifCount}
              </span>
            </button>
          )}
          <span className="text-gray-600 text-xs hidden sm:block">
            {lastRefresh.toLocaleTimeString()}
          </span>
          <button onClick={() => fetchOrders()}
            className="p-2 rounded-xl text-orange-400 hover:text-white transition-colors"
            style={{ background: "rgba(249,115,22,0.1)" }}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={playAlert}
            className="p-2 rounded-xl text-gray-500 hover:text-orange-400 transition-colors"
            title="Test notification sound"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <Bell className="h-4 w-4" />
          </button>
          <button onClick={logout}
            className="p-2 rounded-xl bg-red-900/20 text-red-500 hover:bg-red-900/40 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="p-4 md:p-6">

        {/* Status bar */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-white text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            Active Orders
            <span className="ml-3 text-sm font-normal text-orange-400">({orders.length})</span>
          </h1>
          <div className="flex gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> &lt;10m</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> 10-20m</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> &gt;20m</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-60 text-orange-400">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-gray-600 gap-4">
            <CheckCircle className="h-16 w-16 opacity-20" />
            <p className="text-lg font-semibold">All Caught Up!</p>
            <p className="text-sm">No pending orders in the kitchen</p>
            <p className="text-xs">Refreshes every 10 seconds automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map(order => {
              const ts = order.accepted_at || order.created_at;
              const urg = urgencyColor(ts);
              const tag = sourceTag(order);
              const isUpdating = updating === order.order_id;

              return (
                <div key={order.order_id} className="rounded-2xl overflow-hidden flex flex-col"
                  style={{ background: urg.bg, border: `2px solid ${urg.border}` }}>

                  {/* Card header */}
                  <div className="flex items-start justify-between px-4 pt-4 pb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {order.kot_number || order.order_id?.slice(-6)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tag.cls}`}>
                          {tag.label}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">{order.customer_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold text-white px-2 py-1 rounded-full ${urg.badge}`}>
                        {order.status === "accepted" ? "🔥 New" : "⏳ Prep"}
                      </span>
                      <div className="flex items-center gap-1 text-gray-500 text-xs mt-1 justify-end">
                        <Clock className="h-3 w-3" />
                        <span>{timeSince(ts)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="flex-1 mx-4 mb-4 rounded-xl p-3"
                    style={{ background: "rgba(0,0,0,0.3)" }}>
                    <p className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">Items</p>
                    <ul className="space-y-2">
                      {order.items.map((item, i) => (
                        <li key={i}>
                          <div className="flex items-baseline gap-2">
                            <span className="text-orange-400 font-black text-base w-5 text-right shrink-0">
                              {item.quantity}×
                            </span>
                            <span className="text-white font-semibold text-sm leading-tight">{item.name}</span>
                          </div>
                          {item.variant && (
                            <p className="text-gray-500 text-xs ml-7">({item.variant})</p>
                          )}
                          {item.addons?.length > 0 && (
                            <p className="text-gray-500 text-xs ml-7">+ {item.addons.join(", ")}</p>
                          )}
                          {item.special_instructions && (
                            <div className="flex items-center gap-1 ml-7 mt-0.5 text-yellow-500 text-xs">
                              <AlertCircle className="h-3 w-3 shrink-0" />
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
                      <button
                        onClick={() => updateStatus(order.order_id, "preparing")}
                        disabled={isUpdating}
                        className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
                      >
                        {isUpdating ? "Updating..." : "🔥 Start Preparing"}
                      </button>
                    )}
                    {order.status === "preparing" && (
                      <button
                        onClick={() => updateStatus(order.order_id, "ready")}
                        disabled={isUpdating}
                        className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                      >
                        {isUpdating ? "Updating..." : "✅ Mark Ready"}
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
