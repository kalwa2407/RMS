import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bike, LogOut, RefreshCw, MapPin, Package,
  CheckCircle, Truck, Phone, CreditCard, Tag,
} from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";

/* ── Helpers ── */
const fmt = (n) => `₹${Number(n || 0).toFixed(0)}`;

const STATUS_FLOW = {
  // Only 'ready' orders can be picked up by the rider (backend allows out_for_delivery)
  ready:            { next: "out_for_delivery", label: "Mark Picked Up 🛵",  color: "bg-green-600" },
  out_for_delivery: { next: "delivered",        label: "Mark Delivered ✓",  color: "bg-emerald-600" },
  // accepted/preparing: show info only, rider waits for kitchen to mark ready
};

const statusBadge = (s) => ({
  accepted:          { label: "Accepted",         bg: "bg-blue-500/15",    text: "text-blue-400" },
  preparing:         { label: "Preparing",        bg: "bg-yellow-500/15",  text: "text-yellow-400" },
  ready:             { label: "Ready for Pickup", bg: "bg-green-500/15",   text: "text-green-400" },
  out_for_delivery:  { label: "Out for Delivery", bg: "bg-purple-500/15",  text: "text-purple-400" },
}[s] || { label: s, bg: "bg-gray-700", text: "text-gray-400" });

const DeliveryPanel = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("delivery_token");

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // order_id being updated

  /* ── Auth guard ── */
  useEffect(() => {
    if (!token) { navigate("/delivery", { replace: true }); }
  }, [token, navigate]);

  /* ── Fetch profile ── */
  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/delivery/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("delivery_token");
        navigate("/delivery", { replace: true });
      }
    }
  }, [token, navigate]);

  /* ── Fetch orders ── */
  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/delivery/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("delivery_token");
        navigate("/delivery", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchProfile();
    fetchOrders();
    const interval = setInterval(fetchOrders, 20000);
    return () => clearInterval(interval);
  }, [fetchProfile, fetchOrders]);

  /* ── Update order status ── */
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

  const logout = () => {
    localStorage.removeItem("delivery_token");
    navigate("/delivery", { replace: true });
  };

  /* ──────────────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#111827" }}>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 shrink-0 flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(17,24,39,0.98)", borderBottom: "1.5px solid rgba(59,130,246,0.25)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }}>
            <Bike className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">{profile?.name || "Delivery Partner"}</p>
            <p className="text-gray-500 text-xs">{profile?.vehicle_type} · {profile?.vehicle_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchOrders}
            className="p-2 rounded-xl bg-gray-800 text-gray-400 active:scale-90 transition-transform">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={logout}
            className="p-2 rounded-xl bg-red-900/30 text-red-400 active:scale-90 transition-transform">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 px-4 py-4">

        {/* Page title */}
        <div className="mb-4">
          <h1 className="text-white font-bold text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            My Orders
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">{orders.length} active assignment{orders.length !== 1 ? "s" : ""}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-gray-600 gap-3">
            <Bike className="h-14 w-14 opacity-25" />
            <p className="text-sm font-medium">No orders assigned yet</p>
            <p className="text-xs">Check back in a moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const badge = statusBadge(order.status);
              const flow = STATUS_FLOW[order.status];
              const isCOD = order.payment_method === "cod";
              const isUpdating = updating === order.order_id;

              return (
                <div key={order.order_id}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(31,41,55,0.8)", border: "1.5px solid rgba(59,130,246,0.15)" }}>

                  {/* Order header */}
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-400" />
                      <span className="text-white font-bold text-sm">{order.order_id}</span>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Customer & address */}
                  <div className="px-4 py-3 space-y-2"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white text-sm font-semibold">{order.customer_name}</p>
                        <p className="text-gray-400 text-xs">{order.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                      <p className="text-gray-300 text-sm leading-snug">{order.address}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1.5">Items</p>
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-0.5">
                        <span className="text-gray-300">{item.quantity}× {item.name}</span>
                        <span className="text-gray-400">{fmt(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Payment */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-400 text-sm uppercase font-bold tracking-wider">
                        {order.payment_method}
                      </span>
                      {isCOD && (
                        <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full border border-orange-500/30">
                          Collect Cash
                        </span>
                      )}
                    </div>
                    <span className="text-white font-bold text-base">{fmt(order.total)}</span>
                  </div>

                  {/* COD amount highlight */}
                  {isCOD && (
                    <div className="mx-4 mb-3 rounded-xl px-3 py-2 flex items-center gap-2"
                      style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)" }}>
                      <Tag className="h-4 w-4 text-orange-400" />
                      <span className="text-orange-300 text-sm font-bold">
                        Collect {fmt(order.total)} from customer
                      </span>
                    </div>
                  )}

                  {/* Action button */}
                  {flow && (
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => updateStatus(order.order_id, flow.next)}
                        disabled={isUpdating}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60 ${flow.color}`}
                      >
                        {flow.next === "delivered"
                          ? <CheckCircle className="h-4 w-4" />
                          : <Truck className="h-4 w-4" />
                        }
                        {isUpdating ? "Updating..." : flow.label}
                      </button>
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
