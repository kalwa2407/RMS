import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bike, LogOut, RefreshCw, MapPin, Package,
  CheckCircle, Truck, Phone, CreditCard, Tag,
  Clock, Navigation, IndianRupee, TrendingUp, Star,
  ChevronRight, RotateCw
} from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";

/* ── Helpers ── */
const fmt = (n) => `₹${Number(n || 0).toFixed(0)}`;

const formatTime = (ts) => {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    return isToday ? `Today, ${time}` : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + ` ${time}`;
  } catch { return "—"; }
};

const timeSince = (ts) => {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
};

const STATUS_FLOW = {
  ready: { next: "out_for_delivery", label: "Picked Up — Start Delivery", color: "#16a34a" },
  out_for_delivery: { next: "delivered", label: "Mark as Delivered", color: "#7c3aed" },
};

const DeliveryPanel = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("delivery_token");
  const riderId = localStorage.getItem("delivery_id") || "rider";

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [tab, setTab] = useState("active"); // "active" | "completed"

  // Cumulative stats — persist in localStorage per rider session
  const statsKey = `rider_stats_${riderId}`;
  const [cumulativeStats, setCumulativeStats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(statsKey)) || { count: 0, earnings: 0 };
    } catch { return { count: 0, earnings: 0 }; }
  });

  useEffect(() => {
    if (!token) navigate("/staff-entry", { replace: true });
  }, [token, navigate]);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/delivery/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("delivery_token");
        navigate("/staff-entry", { replace: true });
      }
    }
  }, [token, navigate]);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/delivery/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ordersData = Array.isArray(data) ? data : [];
      setOrders(ordersData);

      // Recalculate cumulative stats from all delivered orders in this session
      const delivered = ordersData.filter(o => o.status === "delivered");
      const newStats = {
        count: delivered.length,
        earnings: delivered.reduce((sum, o) => sum + (o.total || 0), 0)
      };
      setCumulativeStats(newStats);
      localStorage.setItem(statsKey, JSON.stringify(newStats));
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("delivery_token");
        navigate("/staff-entry", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate, statsKey]);

  useEffect(() => {
    fetchProfile();
    fetchOrders();
    const interval = setInterval(fetchOrders, 12000);
    return () => clearInterval(interval);
  }, [fetchProfile, fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await axios.put(
        `${API_BASE}/api/delivery/orders/${orderId}/status?new_status=${newStatus}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchOrders();
      if (newStatus === "delivered") {
        setTab("completed");
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const openMaps = (address) => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, "_blank");
  };

  const logout = () => {
    localStorage.removeItem("delivery_token");
    navigate("/staff-entry", { replace: true });
  };

  const activeOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  const completedOrders = orders.filter(o => o.status === "delivered");

  const displayOrders = tab === "active" ? activeOrders : completedOrders;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#0a0f1a" }}>

      {/* ── HEADER ── */}
      <div className="shrink-0 z-40" style={{ background: "rgba(10,15,26,0.98)", borderBottom: "1.5px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
                <Bike className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2" style={{ borderColor: "#0a0f1a" }} />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">{profile?.name || "Delivery Partner"}</p>
              <p className="text-green-400 text-[10px] font-medium mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                Online · {profile?.vehicle_type || "Delivery"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchOrders} className="p-2 rounded-xl active:scale-90 transition-transform" style={{ background: "rgba(255,255,255,0.06)" }}>
              <RotateCw className="h-4 w-4 text-gray-400" />
            </button>
            <button onClick={logout} className="p-2 rounded-xl active:scale-90 transition-transform" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <LogOut className="h-4 w-4 text-red-400" />
            </button>
          </div>
        </div>

        {/* Stats row — like Swiggy */}
        <div className="flex px-4 pb-4 gap-3">
          <div className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(22,163,74,0.2)" }}>
              <CheckCircle className="h-4.5 w-4.5 text-green-400" style={{ width: "18px", height: "18px" }} />
            </div>
            <div>
              <p className="text-green-400 font-black text-2xl leading-none">{cumulativeStats.count}</p>
              <p className="text-green-600 text-[10px] font-medium mt-0.5">Delivered</p>
            </div>
          </div>
          <div className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)" }}>
              <IndianRupee className="text-violet-400" style={{ width: "18px", height: "18px" }} />
            </div>
            <div>
              <p className="text-violet-400 font-black text-2xl leading-none">{fmt(cumulativeStats.earnings).replace("₹", "")}</p>
              <p className="text-violet-600 text-[10px] font-medium mt-0.5">₹ Value</p>
            </div>
          </div>
          <div className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.15)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(234,179,8,0.15)" }}>
              <Package className="text-yellow-400" style={{ width: "18px", height: "18px" }} />
            </div>
            <div>
              <p className="text-yellow-400 font-black text-2xl leading-none">{activeOrders.length}</p>
              <p className="text-yellow-600 text-[10px] font-medium mt-0.5">Active</p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex mx-4 mb-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {[
            { key: "active", label: "Active", count: activeOrders.length },
            { key: "completed", label: "Completed", count: completedOrders.length },
          ].map(({ key, label, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              style={{
                background: tab === key ? (key === "active" ? "rgba(22,163,74,0.2)" : "rgba(124,58,237,0.2)") : "transparent",
                color: tab === key ? (key === "active" ? "#4ade80" : "#a78bfa") : "#6b7280",
                borderRadius: "16px",
              }}>
              <span>{label}</span>
              {count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black"
                  style={{ background: tab === key ? (key === "active" ? "rgba(22,163,74,0.3)" : "rgba(124,58,237,0.3)") : "rgba(255,255,255,0.08)", color: "inherit" }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-600 gap-2 text-sm">
            <RotateCw className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: "2px solid rgba(255,255,255,0.08)" }}>
              {tab === "active"
                ? <Bike className="h-10 w-10" style={{ color: "rgba(255,255,255,0.2)" }} />
                : <CheckCircle className="h-10 w-10" style={{ color: "rgba(255,255,255,0.2)" }} />}
            </div>
            <p className="text-white font-semibold">{tab === "active" ? "No active orders" : "No completed orders"}</p>
            <p className="text-gray-600 text-sm">{tab === "active" ? "Sit tight — orders will appear here" : "Delivered orders will show here"}</p>
          </div>
        ) : (
          displayOrders.map(order => {
            const flow = STATUS_FLOW[order.status];
            const isCOD = order.payment_method === "cod";
            const isUpdating = updating === order.order_id;
            const isCompleted = order.status === "delivered";
            const isPickup = order.status === "ready";
            const isOFD = order.status === "out_for_delivery";

            return (
              <div key={order.order_id} className="rounded-3xl overflow-hidden"
                style={{
                  background: isCompleted ? "rgba(255,255,255,0.03)" : "rgba(15,25,40,0.9)",
                  border: `1.5px solid ${isPickup ? "rgba(22,163,74,0.5)" : isOFD ? "rgba(124,58,237,0.4)" : isCompleted ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.08)"}`
                }}>

                {/* Status banner */}
                {(isPickup || isOFD) && (
                  <div className="px-4 py-2.5 flex items-center gap-2"
                    style={{ background: isPickup ? "rgba(22,163,74,0.12)" : "rgba(124,58,237,0.12)", borderBottom: `1px solid ${isPickup ? "rgba(22,163,74,0.2)" : "rgba(124,58,237,0.15)"}` }}>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: isPickup ? "#4ade80" : "#a78bfa" }} />
                    <p className="text-xs font-bold" style={{ color: isPickup ? "#4ade80" : "#a78bfa" }}>
                      {isPickup ? "🟢 Ready for pickup at restaurant" : "🛵 On the way to customer"}
                    </p>
                  </div>
                )}

                {/* Order header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-500 text-xs font-mono">#{order.order_id?.slice(-8)}</p>
                    <span className="text-gray-700">·</span>
                    <p className="text-gray-500 text-xs">{timeSince(order.created_at)}</p>
                  </div>
                  {isCompleted && (
                    <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-1">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                      <span className="text-green-400 text-[10px] font-bold">Delivered</span>
                    </div>
                  )}
                </div>

                {/* Customer info */}
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center">
                      <span className="text-[#EAB308] text-xs font-bold">{order.customer_name?.[0]?.toUpperCase() || "?"}</span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">{order.customer_name}</p>
                      {order.phone && <p className="text-gray-500 text-xs">{order.phone}</p>}
                    </div>
                  </div>

                  {/* Address tap-to-maps */}
                  <button onClick={() => order.address && openMaps(order.address)}
                    className="w-full flex items-start gap-3 rounded-2xl p-3 text-left active:scale-[0.98] transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(22,163,74,0.15)" }}>
                      <MapPin className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-200 text-sm leading-snug">{order.address || "—"}</p>
                      {order.address && <p className="text-green-500 text-xs mt-0.5 flex items-center gap-1"><Navigation className="h-2.5 w-2.5" /> Open Maps</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-600 shrink-0 self-center" />
                  </button>
                </div>

                {/* Items */}
                <div className="px-4 pb-3">
                  <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-1.5">Items</p>
                  <div className="space-y-1">
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-300">{item.quantity}× {item.name}</span>
                        <span className="text-gray-500">{fmt(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment row */}
                <div className="mx-4 mb-4 rounded-2xl px-4 py-3 flex items-center justify-between"
                  style={{ background: isCOD ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.04)", border: isCOD ? "1px solid rgba(249,115,22,0.25)" : "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{order.payment_method || "—"}</span>
                    {isCOD && (
                      <span className="bg-orange-500/15 text-orange-400 border border-orange-500/25 text-[9px] font-bold px-2 py-0.5 rounded-full">COLLECT CASH</span>
                    )}
                  </div>
                  <span className="text-white font-black text-lg">{fmt(order.total)}</span>
                </div>

                {/* CTA Button — Zomato style full width */}
                {flow && !isCompleted && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => updateStatus(order.order_id, flow.next)}
                      disabled={isUpdating}
                      className="w-full py-4 rounded-2xl font-black text-white text-sm tracking-wide flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl"
                      style={{ background: `linear-gradient(135deg, ${flow.color}, ${isPickup ? "#059669" : "#5b21b6"})`, boxShadow: `0 8px 24px ${flow.color}40` }}>
                      {isUpdating
                        ? <><RotateCw className="h-4 w-4 animate-spin" /> Updating...</>
                        : <>
                          {flow.next === "delivered" ? <CheckCircle className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                          {flow.label}
                        </>}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DeliveryPanel;
