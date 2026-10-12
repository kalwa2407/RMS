import React, { useState, useEffect } from "react";
import {
  Search, Package, CheckCircle, Clock, Truck, Home,
  Navigation, ShieldCheck, MapPin, Receipt, Loader2,
  ArrowLeft, RefreshCw, Phone, Bike, Utensils, Sparkles,
  ChevronRight, AlertCircle, ChefHat, HeartHandshake, Zap, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../hooks/use-toast";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import API_BASE from "../lib/config";

const GOLD = "#EAB308";
const RESTAURANT_PHONE = "02026131976";

const MILESTONES = [
  {
    key: "placed",
    label: "Order Placed",
    sub: "Heralded to Royal Kitchen",
    icon: Package,
    statuses: ["placed"]
  },
  {
    key: "kitchen",
    label: "Kitchen Crafting",
    sub: "Master chefs curating authentic Mughlai feast",
    icon: ChefHat,
    statuses: ["accepted", "preparing"]
  },
  {
    key: "dispatched",
    label: "PD Fleet Dispatched",
    sub: "Private rider en route with sealed thermal bag",
    icon: Bike,
    statuses: ["ready", "out_for_delivery"]
  },
  {
    key: "delivered",
    label: "Sovereign Arrival",
    sub: "Delivered fresh to your doorstep",
    icon: Home,
    statuses: ["delivered"]
  }
];

const OrderTracking = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId: pathOrderId } = useParams();
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paramId = params.get("order_id") || pathOrderId;
    const lastOrderId = paramId || localStorage.getItem("lastOrderId");
    if (lastOrderId) {
      setOrderId(lastOrderId);
      fetchOrder(lastOrderId);
    }
  }, [location.search, pathOrderId]);

  // Real-time polling every 10 seconds for active orders
  useEffect(() => {
    if (!order || ["delivered", "cancelled", "rejected"].includes(order.status)) return;
    const interval = setInterval(() => fetchOrder(order.order_id, true), 10000);
    return () => clearInterval(interval);
  }, [order]);

  const fetchOrder = async (id, silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${id}`);
      if (!res.ok) throw new Error("Order not found");
      const data = await res.json();
      if (lastStatus && lastStatus !== data.status && !silent) {
        toast({
          title: "Order Status Updated!",
          description: `Your order is now: ${data.status?.toUpperCase()}`
        });
      }
      setOrder(data);
      setLastStatus(data.status);
    } catch (err) {
      if (!silent) {
        toast({
          title: "Inquiry Failed",
          description: "This Order ID does not exist in our records.",
          variant: "destructive"
        });
      }
    } finally {
      if (!silent) setLoading(false);
      else setRefreshing(false);
    }
  };

  const getMilestoneIndex = (status) => {
    if (["placed"].includes(status)) return 0;
    if (["accepted", "preparing"].includes(status)) return 1;
    if (["ready", "out_for_delivery"].includes(status)) return 2;
    if (["delivered"].includes(status)) return 3;
    return -1;
  };

  const currentMilestoneIdx = order ? getMilestoneIndex(order.status) : -1;
  const isDelivery = order?.order_type === "DELIVERY";

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#060a0e" }}>

      {/* ── Fixed Header ── */}
      <header
        className="shrink-0 z-30"
        style={{
          background: "rgba(10, 16, 22, 0.95)",
          borderBottom: "1px solid rgba(234, 179, 8, 0.2)",
          backdropFilter: "blur(20px)"
        }}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 max-w-4xl mx-auto">
          <button
            onClick={() => {
              if (window.history.length > 2) navigate(-1);
              else navigate("/customer/dashboard");
            }}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#EAB308] hover:border-[#EAB308]/40 transition-all shrink-0 cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <Link
            to="/customer/dashboard"
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#EAB308] hover:border-[#EAB308]/40 transition-all shrink-0"
            title="Return to Home"
          >
            <Home className="w-4 h-4" />
          </Link>

          {/* Search bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); fetchOrder(orderId.trim()); }}
            className="flex-1 flex items-center gap-2"
          >
            <div className="flex-1 relative">
              <Navigation className="w-3.5 h-3.5 text-[#EAB308] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter Order ID (e.g. ORD-123456)..."
                className="w-full bg-[#0d161d] border border-[#EAB308]/25 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#EAB308] uppercase font-mono tracking-wider"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !orderId.trim()}
              className="px-3.5 py-2 bg-gradient-to-r from-[#ca8a04] to-[#EAB308] text-black rounded-xl hover:brightness-110 active:scale-95 transition-all font-bold flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          </form>

          {order && !["delivered", "cancelled", "rejected"].includes(order.status) && (
            <button
              onClick={() => fetchOrder(order.order_id, true)}
              disabled={refreshing}
              title="Refresh live status"
              className="w-9 h-9 rounded-xl bg-[#EAB308]/15 border border-[#EAB308]/30 flex items-center justify-center text-[#EAB308] hover:bg-[#EAB308]/25 transition-all shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </header>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 max-w-4xl mx-auto w-full space-y-4">
        <AnimatePresence mode="wait">
          {order ? (
            <motion.div
              key="order-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* ── 1. Sovereign Order Header Banner ── */}
              <div
                className="rounded-3xl p-5 border relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(20, 28, 36, 0.95) 0%, rgba(10, 16, 22, 0.98) 100%)",
                  borderColor: "rgba(234, 179, 8, 0.35)",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#EAB308]">
                        Persian Darbar Feast
                      </span>
                      {order.bill_number && (
                        <span className="bg-[#EAB308]/20 text-[#EAB308] text-[10px] font-mono px-2 py-0.5 rounded-full font-black border border-[#EAB308]/30">
                          #{order.bill_number}
                        </span>
                      )}
                      <span className="text-[10px] text-white/50 font-mono">
                        {order.order_id?.slice(-8)}
                      </span>
                    </div>

                    <h2
                      className="text-white text-xl sm:text-2xl font-bold mt-1"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {order.status === "delivered"
                        ? "Feast Successfully Delivered 🎉"
                        : order.status === "out_for_delivery"
                        ? "Rider is Racing to Your Doorstep! 🛵"
                        : order.status === "preparing"
                        ? "Royal Kitchen Crafting Your Feast 👨‍🍳"
                        : "Order Received & Confirmed"}
                    </h2>

                    <p className="text-white/60 text-xs mt-1">
                      {isDelivery ? "Direct In-House Fleet Delivery" : "Self Pickup at Restaurant Counter"} · Camp, Pune
                    </p>
                  </div>

                  {/* Status Pill & ETA */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                    <span
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                        order.status === "delivered"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : order.status === "out_for_delivery"
                          ? "bg-[#EAB308]/25 text-[#EAB308] border-[#EAB308]/50 animate-pulse"
                          : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                      {order.status?.replace(/_/g, " ")}
                    </span>
                    {order.status !== "delivered" && (
                      <span className="text-[11px] text-gray-400 font-medium">
                        ⏱️ Est. ~25-35 mins
                      </span>
                    )}
                  </div>
                </div>

                {/* Live pulse strip */}
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-4">
                  <div
                    className="h-full bg-gradient-to-r from-[#EAB308] via-amber-400 to-emerald-400 transition-all duration-1000"
                    style={{
                      width: `${Math.max(25, (currentMilestoneIdx + 1) * 25)}%`
                    }}
                  />
                </div>
              </div>

              {/* ── 2. Delivery Logistics Card (DELIVERY ONLY) ── */}
              {isDelivery && (
                <div
                  className="rounded-3xl p-5 border relative overflow-hidden transition-all"
                  style={{
                    background: "linear-gradient(135deg, rgba(16, 28, 34, 0.9) 0%, rgba(10, 20, 26, 0.95) 100%)",
                    borderColor: order.porter_order_id
                      ? "rgba(249, 115, 22, 0.45)"
                      : order.delivery_partner_name
                      ? "rgba(16, 185, 129, 0.4)"
                      : "rgba(234, 179, 8, 0.25)",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)"
                  }}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          order.porter_order_id
                            ? "bg-orange-500/20 border border-orange-500/30 text-orange-400"
                            : "bg-[#EAB308]/20 border border-[#EAB308]/30 text-[#EAB308]"
                        }`}
                      >
                        {order.porter_order_id ? <Zap className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </div>
                      <div>
                        <p
                          className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                            order.porter_order_id ? "text-orange-400" : "text-[#EAB308]"
                          }`}
                        >
                          {order.porter_order_id ? "Porter Express Logistics" : "Persian Darbar Private Fleet"}
                        </p>
                        <p className="text-[9px] text-white/50">
                          {order.porter_order_id
                            ? "On-Demand Hyperlocal Courier Partner · Live GPS Tracked"
                            : "100% In-House Dedicated Logistics · No Third-Party Aggregators"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        order.porter_order_id
                          ? "bg-orange-500/15 text-orange-300 border-orange-500/30"
                          : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {order.porter_order_id ? "PORTER COURIER" : "LIVE RIDER FLEET"}
                    </span>
                  </div>

                  {/* Porter Card */}
                  {order.porter_order_id ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-orange-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-orange-950/40">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-bold text-base">
                              {order.porter_rider_name || "Porter Courier Rider"}
                            </h4>
                            <span className="text-[9px] bg-orange-500/20 text-orange-400 font-bold px-1.5 py-0.5 rounded uppercase">
                              {order.porter_status?.replace(/_/g, " ") || "BOOKED"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 mt-0.5">
                            Order Ref: <span className="font-mono text-white/80">{order.porter_order_id.slice(-10)}</span>
                            {order.porter_rider_vehicle && (
                              <span className="ml-2 text-[#EAB308]/90 font-medium">• {order.porter_rider_vehicle}</span>
                            )}
                          </p>
                          <p className="text-[10px] text-orange-300 font-medium mt-0.5 flex items-center gap-1">
                            <span>⚡ Express Dispatch</span>
                            <span>•</span>
                            <span>Direct From Kitchen</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.porter_rider_phone && (
                          <a
                            href={`tel:${order.porter_rider_phone}`}
                            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 active:scale-95 transition-all"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Call Rider</span>
                          </a>
                        )}
                        {order.porter_tracking_url && (
                          <a
                            href={order.porter_tracking_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-950/40 active:scale-95 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Live Porter Map</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ) : order.delivery_partner_name ? (
                    /* Persian Darbar In-House Rider Card */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-900/30">
                          <Bike className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-bold text-base">
                              {order.delivery_partner_name}
                            </h4>
                            <span className="text-[9px] bg-[#EAB308]/20 text-[#EAB308] font-bold px-1.5 py-0.5 rounded">
                              PD RIDER
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 mt-0.5">
                            {order.delivery_partner_vehicle || "Royal Fleet Two-Wheeler"}
                          </p>
                          <p className="text-[10px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                            <span>👑 Sanitized Thermal Bag</span>
                            <span>•</span>
                            <span>Contactless Delivery</span>
                          </p>
                        </div>
                      </div>

                      {order.delivery_partner_phone && (
                        <a
                          href={`tel:${order.delivery_partner_phone}`}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-95 transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call In-House Rider</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    /* Awaiting Rider Assignment */
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EAB308]/15 border border-[#EAB308]/25 flex items-center justify-center text-[#EAB308] shrink-0">
                        <Bike className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-white text-xs font-bold">
                          Assigning Persian Darbar Fleet Rider
                        </p>
                        <p className="text-white/50 text-[10px] mt-0.5">
                          Your royal feast is being freshly prepared in the kitchen. A dedicated rider will be assigned momentarily for instant pickup.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Customer Delivery Instructions if any */}
                  {order.delivery_instructions && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-start gap-2 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-[#EAB308] shrink-0 mt-0.5" />
                      <p className="text-white/70">
                        <span className="text-[#EAB308] font-bold">Delivery Note for Rider: </span>
                        {order.delivery_instructions}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── 3. 4-Stage Milestone Timeline ── */}
              <div
                className="rounded-3xl p-5 border"
                style={{
                  background: "linear-gradient(180deg, rgba(17, 24, 32, 0.8) 0%, rgba(10, 16, 22, 0.9) 100%)",
                  borderColor: "rgba(255, 255, 255, 0.12)"
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#EAB308] mb-4">
                  Royal Journey Timeline
                </p>

                <div className="space-y-6">
                  {MILESTONES.map((step, idx) => {
                    const isDone = currentMilestoneIdx > idx;
                    const isCurrent = currentMilestoneIdx === idx;
                    const Icon = step.icon;

                    return (
                      <div key={step.key} className="flex items-start gap-4 relative">
                        {/* Connecting Line */}
                        {idx < MILESTONES.length - 1 && (
                          <div
                            className={`absolute left-5 top-10 w-0.5 h-10 transition-colors duration-500 ${
                              isDone ? "bg-[#EAB308]" : "bg-white/10"
                            }`}
                          />
                        )}

                        {/* Icon Node */}
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 relative z-10 ${
                            isCurrent
                              ? "bg-gradient-to-br from-[#ca8a04] to-[#EAB308] text-black border-[#EAB308] shadow-lg shadow-[#EAB308]/30 scale-110"
                              : isDone
                              ? "bg-emerald-950/60 border-emerald-500 text-emerald-400"
                              : "bg-white/5 border-white/10 text-white/30"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Text info */}
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-sm font-bold ${
                                isCurrent
                                  ? "text-[#EAB308]"
                                  : isDone
                                  ? "text-white"
                                  : "text-white/40"
                              }`}
                            >
                              {step.label}
                            </h4>
                            {isCurrent && (
                              <span className="text-[8px] font-black uppercase tracking-widest bg-[#EAB308]/20 text-[#EAB308] px-2 py-0.5 rounded-full border border-[#EAB308]/30 animate-pulse">
                                CURRENT STEP
                              </span>
                            )}
                            {isDone && (
                              <span className="text-[9px] text-emerald-400 font-bold">
                                ✓ Done
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs mt-0.5 ${
                              isCurrent ? "text-gray-300" : isDone ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {step.sub}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 4. Special Kitchen Instruction (if any) ── */}
              {order.cooking_instructions && (
                <div
                  className="rounded-2xl p-4 border flex items-start gap-3"
                  style={{
                    background: "rgba(234, 179, 8, 0.08)",
                    borderColor: "rgba(234, 179, 8, 0.3)"
                  }}
                >
                  <ChefHat className="w-5 h-5 text-[#EAB308] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-[#EAB308]">
                      Special Kitchen Request:
                    </p>
                    <p className="text-xs text-gray-200 mt-0.5 italic">
                      "{order.cooking_instructions}"
                    </p>
                  </div>
                </div>
              )}

              {/* ── 5. Items in this Feast Breakdown ── */}
              <div
                className="rounded-3xl p-5 border"
                style={{
                  background: "linear-gradient(180deg, rgba(17, 24, 32, 0.8) 0%, rgba(10, 16, 22, 0.9) 100%)",
                  borderColor: "rgba(255, 255, 255, 0.12)"
                }}
              >
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#EAB308]">
                    Feast Items ({order.items?.length || 0})
                  </span>
                  <span className="text-xs text-white/50">
                    Destination: <span className="text-white font-medium">{order.address || "Camp, Pune"}</span>
                  </span>
                </div>

                <div className="space-y-2.5">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[#EAB308]/15 text-[#EAB308] font-bold text-[10px] flex items-center justify-center">
                          {item.quantity}x
                        </span>
                        <span className="text-white font-medium">{item.name}</span>
                      </div>
                      <span className="text-white/80 font-mono">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-white/60">Total Paid / Payable</span>
                  <span className="text-lg font-black text-[#EAB308]">
                    ₹{order.total?.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* ── 6. Direct Support & Assistance ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={`tel:${RESTAURANT_PHONE}`}
                  className="rounded-2xl p-3.5 bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-center gap-2 text-white font-bold text-xs transition-all active:scale-95"
                >
                  <Phone className="w-4 h-4 text-[#EAB308]" />
                  <span>Call Restaurant Desk</span>
                </a>

                <Link
                  to="/customer/dashboard"
                  className="rounded-2xl p-3.5 bg-[#EAB308]/15 hover:bg-[#EAB308]/25 border border-[#EAB308]/30 flex items-center justify-center gap-2 text-[#EAB308] font-bold text-xs transition-all active:scale-95"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Back to Menu / Home</span>
                </Link>
              </div>

            </motion.div>
          ) : (
            /* Empty State */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4 min-h-[50vh]"
            >
              <div className="w-20 h-20 rounded-3xl bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center text-[#EAB308]">
                <Package className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No Order Found</h3>
                <p className="text-gray-400 text-xs mt-1 max-w-xs mx-auto">
                  Please enter your Order ID in the search field above to track your feast in real time.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default OrderTracking;
