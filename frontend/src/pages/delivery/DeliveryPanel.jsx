import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bike, LogOut, RefreshCw, MapPin, Package,
  CheckCircle, Truck, Phone, CreditCard, Tag,
  Clock, Star, Navigation, IndianRupee
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
  ready: { next: "out_for_delivery", label: "Picked Up — Start Delivery 🛵", color: "from-green-600 to-emerald-600" },
  out_for_delivery: { next: "delivered", label: "Delivered Successfully ✓", color: "from-emerald-600 to-teal-600" },
};

const statusBadge = (s) => ({
  accepted: { label: "Accepted", bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/25" },
  preparing: { label: "🔥 Preparing", bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/25" },
  ready: { label: "✅ Ready for Pickup", bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/35" },
  out_for_delivery: { label: "🛵 Out for Delivery", bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/25" },
}[s] || { label: s, bg: "bg-gray-700/30", text: "text-gray-400", border: "border-gray-600/25" });

const DeliveryPanel = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("delivery_token");

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);

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
      // Calculate today's earnings from delivered orders
      const delivered = ordersData.filter(o => o.status === "delivered");
      setTotalEarnings(delivered.reduce((sum, o) => sum + (o.total || 0), 0));
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("delivery_token");
        navigate("/staff-entry", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchProfile();
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
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
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const openMaps = (address) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://maps.google.com/?q=${encoded}`, "_blank");
  };

  const logout = () => {
    localStorage.removeItem("delivery_token");
    navigate("/staff-entry", { replace: true });
  };

  const activeOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  const completedToday = orders.filter(o => o.status === "delivered");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #060d1a 0%, #0d1b2a 100%)" }}>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 shrink-0"
        style={{ background: "rgba(6,13,26,0.97)", borderBottom: "1.5px solid rgba(59,130,246,0.2)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20"
              style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }}>
              <Bike className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">{profile?.name || "Delivery Partner"}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {profile?.vehicle_type && `${profile.vehicle_type}`}
                {profile?.vehicle_number && ` · ${profile.vehicle_number}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchOrders}
              className="p-2 rounded-xl bg-white/5 text-gray-400 active:scale-90 transition-transform border border-white/8">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={logout}
              className="p-2 rounded-xl bg-red-900/30 text-red-400 active:scale-90 transition-transform border border-red-500/20">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex divide-x divide-white/5 px-4 pb-3">
          <div className="flex-1 pr-4">
            <p className="text-gray-600 text-[10px] uppercase tracking-wider">Active</p>
            <p className="text-white font-black text-xl leading-tight">{activeOrders.length}</p>
          </div>
          <div className="flex-1 px-4">
            <p className="text-gray-600 text-[10px] uppercase tracking-wider">Delivered</p>
            <p className="text-emerald-400 font-black text-xl leading-tight">{completedToday.length}</p>
          </div>
          <div className="flex-1 pl-4">
            <p className="text-gray-600 text-[10px] uppercase tracking-wider">Value</p>
            <p className="text-blue-400 font-black text-xl leading-tight">{fmt(orders.reduce((s, o) => s + (o.total || 0), 0))}</p>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 px-4 py-4">

        {/* Page title */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-white font-bold text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            My Orders
          </h1>
          <span className="text-gray-600 text-xs">Auto-refresh 15s</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-600 gap-2 text-sm">
            <RefreshCw className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "rgba(59,130,246,0.08)", border: "2px solid rgba(59,130,246,0.15)" }}>
              <Bike className="h-10 w-10 text-blue-500/40" />
            </div>
            <p className="text-white font-semibold">No orders assigned yet</p>
            <p className="text-gray-600 text-sm">Check back in a moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const badge = statusBadge(order.status);
              const flow = STATUS_FLOW[order.status];
              const isCOD = order.payment_method === "cod";
              const isUpdating = updating === order.order_id;
              const isCompleted = order.status === "delivered";

              return (
                <div key={order.order_id}
                  className={`rounded-2xl overflow-hidden transition-all ${isCompleted ? "opacity-60" : ""}`}
                  style={{
                    background: isCompleted ? "rgba(255,255,255,0.02)" : "rgba(15,30,50,0.8)",
                    border: `1.5px solid ${order.status === "ready" ? "rgba(34,197,94,0.4)" :
                      order.status === "out_for_delivery" ? "rgba(139,92,246,0.3)" : "rgba(59,130,246,0.12)"}`
                  }}>

                  {/* Order header */}
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-400" />
                      <span className="text-white font-bold text-sm font-mono">{order.order_id?.slice(-10)}</span>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Date + Time */}
                  <div className="px-4 pt-2.5 flex items-center gap-1.5 text-gray-600 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(order.created_at)}</span>
                    <span>·</span>
                    <span>{timeSince(order.created_at)}</span>
                  </div>

                  {/* Customer + address */}
                  <div className="px-4 py-3 space-y-2.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                        <Phone className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{order.customer_name}</p>
                        <p className="text-gray-400 text-xs">{order.phone}</p>
                      </div>
                    </div>
                    <button onClick={() => order.address && openMaps(order.address)}
                      className="flex items-start gap-2.5 w-full text-left group">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-300 text-sm leading-snug">{order.address || "—"}</p>
                        {order.address && (
                          <p className="text-emerald-500 text-xs mt-0.5 flex items-center gap-1">
                            <Navigation className="h-2.5 w-2.5" /> Open in Maps
                          </p>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Items */}
                  <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-2">Items</p>
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-0.5">
                        <span className="text-gray-300">{item.quantity}× {item.name}</span>
                        <span className="text-gray-500">{fmt(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Payment */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">
                        {order.payment_method || "—"}
                      </span>
                      {isCOD && (
                        <span className="bg-orange-500/15 text-orange-400 border border-orange-500/25 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          COLLECT CASH
                        </span>
                      )}
                    </div>
                    <span className="text-white font-black text-lg">{fmt(order.total)}</span>
                  </div>

                  {/* COD highlight */}
                  {isCOD && !isCompleted && (
                    <div className="mx-4 mb-3 rounded-xl px-3 py-2.5 flex items-center gap-2"
                      style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)" }}>
                      <Tag className="h-4 w-4 text-orange-400 shrink-0" />
                      <span className="text-orange-300 text-sm font-bold">
                        Collect {fmt(order.total)} in cash from customer
                      </span>
                    </div>
                  )}

                  {/* Action button */}
                  {flow && !isCompleted && (
                    <div className="px-4 pb-4">
                      <button onClick={() => updateStatus(order.order_id, flow.next)} disabled={isUpdating}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50 bg-gradient-to-r ${flow.color} shadow-lg`}>
                        {flow.next === "delivered"
                          ? <CheckCircle className="h-4 w-4" />
                          : <Truck className="h-4 w-4" />}
                        {isUpdating ? "Updating..." : flow.label}
                      </button>
                    </div>
                  )}

                  {/* Delivered badge */}
                  {isCompleted && (
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-center gap-2 py-3 rounded-xl"
                        style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-emerald-400 font-bold text-sm">Delivered ✓</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryPanel;
