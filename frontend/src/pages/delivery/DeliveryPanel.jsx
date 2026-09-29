import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bike, LogOut, RefreshCw, MapPin, Package,
  CheckCircle, Truck, Phone, CreditCard,
  Clock, Navigation, IndianRupee, Star,
  ChevronRight, RotateCw
} from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";

const fmt = (n) => `₹${Number(n||0).toFixed(0)}`;

const formatTime = (ts) => {
  if (!ts) return "—";
  try {
    const d = new Date(ts); const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true});
    return isToday ? `Today, ${time}` : d.toLocaleDateString("en-IN",{day:"2-digit",month:"short"}) + ` ${time}`;
  } catch { return "—"; }
};

const timeSince = (ts) => {
  if (!ts) return "";
  const diff = Math.floor((Date.now()-new Date(ts))/60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff/60)}h ${diff%60}m ago`;
};

const STATUS_FLOW = {
  ready:            { next:"out_for_delivery", label:"Picked Up — Start Delivery", icon:Truck, color:"#16a34a" },
  out_for_delivery: { next:"delivered",        label:"Mark as Delivered",          icon:CheckCircle, color:"#7c3aed" },
};

const GOLD = "#EAB308";

const DeliveryPanel = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("delivery_token");
  const riderId = localStorage.getItem("delivery_id") || "rider";

  const [profile, setProfile]  = useState(null);
  const [orders, setOrders]    = useState([]);
  const [loading, setLoading]  = useState(true);
  const [updating, setUpdating]= useState(null);
  const [tab, setTab]          = useState("active");

  const statsKey = `rider_stats_${riderId}`;
  const [cumulativeStats, setCumulativeStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem(statsKey)) || { count:0, earnings:0 }; } catch { return { count:0, earnings:0 }; }
  });

  useEffect(() => { if (!token) navigate("/staff-entry",{replace:true}); }, [token,navigate]);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/delivery/profile`, { headers:{ Authorization:`Bearer ${token}` } });
      setProfile(data);
    } catch (err) {
      if (err.response?.status===401||err.response?.status===403) { localStorage.removeItem("delivery_token"); navigate("/staff-entry",{replace:true}); }
    }
  }, [token, navigate]);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/delivery/orders`, { headers:{ Authorization:`Bearer ${token}` } });
      const ordersData = Array.isArray(data) ? data : [];
      setOrders(ordersData);
      const delivered = ordersData.filter(o => o.status === "delivered");
      const newStats = { count:delivered.length, earnings:delivered.reduce((s,o) => s+(o.total||0),0) };
      setCumulativeStats(newStats);
      localStorage.setItem(statsKey, JSON.stringify(newStats));
    } catch (err) {
      if (err.response?.status===401||err.response?.status===403) { localStorage.removeItem("delivery_token"); navigate("/staff-entry",{replace:true}); }
    } finally { setLoading(false); }
  }, [token, navigate, statsKey]);

  useEffect(() => { fetchProfile(); fetchOrders(); const i=setInterval(fetchOrders,12000); return ()=>clearInterval(i); }, [fetchProfile,fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await axios.put(`${API_BASE}/api/delivery/orders/${orderId}/status?new_status=${newStatus}`, {}, { headers:{ Authorization:`Bearer ${token}` } });
      await fetchOrders();
      if (newStatus === "delivered") setTab("completed");
    } catch (err) { alert(err.response?.data?.detail || "Failed to update status"); }
    finally { setUpdating(null); }
  };

  const openMaps = (address) => window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`,"_blank");
  const logout = () => { localStorage.removeItem("delivery_token"); navigate("/staff-entry",{replace:true}); };

  const activeOrders    = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  const completedOrders = orders.filter(o => o.status === "delivered");
  const displayOrders   = tab === "active" ? activeOrders : completedOrders;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background:"linear-gradient(160deg,#060810 0%,#0a0f1a 50%,#060810 100%)", fontFamily:"'Outfit',sans-serif" }}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:"absolute",top:"-10%",right:"-5%",width:"450px",height:"450px",background:"radial-gradient(circle,rgba(22,163,74,0.06) 0%,transparent 70%)",borderRadius:"50%" }}/>
        <div style={{ position:"absolute",bottom:"5%",left:"-8%",width:"350px",height:"350px",background:"radial-gradient(circle,rgba(124,58,237,0.06) 0%,transparent 70%)",borderRadius:"50%" }}/>
      </div>

      {/* HEADER */}
      <div className="shrink-0 z-40 relative" style={{ background:"rgba(6,8,16,0.98)",borderBottom:"1px solid rgba(255,255,255,0.07)",backdropFilter:"blur(20px)" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl" style={{ background:"linear-gradient(135deg,#16a34a,#059669)" }}>
                <Bike className="h-6 w-6 text-white"/>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2" style={{ borderColor:"#06080f" }}/>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily:"'Playfair Display',serif" }}>{profile?.name || "Delivery Partner"}</p>
              <p className="text-green-400 text-[10px] font-medium mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse"/>
                Online · {profile?.vehicle_type || "Delivery"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchOrders} className="p-2 rounded-xl active:scale-90" style={{ background:"rgba(255,255,255,0.05)" }}><RotateCw className="h-4 w-4 text-gray-400"/></button>
            <button onClick={logout} className="p-2 rounded-xl active:scale-90" style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)" }}><LogOut className="h-4 w-4 text-red-400"/></button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex px-4 pb-4 gap-3">
          {[
            { icon:CheckCircle, val:cumulativeStats.count, label:"Delivered", color:"#4ade80", bg:"rgba(22,163,74,0.1)", border:"rgba(22,163,74,0.2)" },
            { icon:IndianRupee, val:fmt(cumulativeStats.earnings).replace("₹",""), label:"₹ Value", color:"#a78bfa", bg:"rgba(124,58,237,0.1)", border:"rgba(124,58,237,0.2)" },
            { icon:Package, val:activeOrders.length, label:"Active", color:GOLD, bg:"rgba(234,179,8,0.08)", border:"rgba(234,179,8,0.2)" },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-2xl px-3 py-3 flex items-center gap-2.5" style={{ background:s.bg, border:`1px solid ${s.border}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background:s.bg }}>
                <s.icon style={{ width:"18px",height:"18px",color:s.color }}/>
              </div>
              <div>
                <p className="font-black text-2xl leading-none" style={{ color:s.color }}>{s.val}</p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color:`${s.color}88` }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex mx-4 mb-4 rounded-2xl overflow-hidden" style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)" }}>
          {[
            { key:"active", label:"Active", count:activeOrders.length },
            { key:"completed", label:"Completed", count:completedOrders.length },
          ].map(({ key, label, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              style={{
                background: tab===key ? (key==="active" ? "rgba(22,163,74,0.2)" : "rgba(124,58,237,0.2)") : "transparent",
                color: tab===key ? (key==="active" ? "#4ade80" : "#a78bfa") : "#6b7280",
                borderRadius:"16px"
              }}>
              {label}
              {count>0 && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black" style={{ background:tab===key ? (key==="active"?"rgba(22,163,74,0.3)":"rgba(124,58,237,0.3)"):"rgba(255,255,255,0.08)", color:"inherit" }}>{count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-sm text-gray-600">
            <RotateCw className="h-4 w-4 animate-spin"/> Loading...
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background:"rgba(255,255,255,0.03)",border:"2px solid rgba(255,255,255,0.07)" }}>
              {tab==="active" ? <Bike className="h-10 w-10 text-gray-700"/> : <CheckCircle className="h-10 w-10 text-gray-700"/>}
            </div>
            <p className="text-white font-semibold" style={{ fontFamily:"'Playfair Display',serif" }}>{tab==="active" ? "No active orders" : "No completed orders"}</p>
            <p className="text-gray-600 text-sm">{tab==="active" ? "Sit tight — orders appear here" : "Delivered orders will show here"}</p>
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
                  background: isCompleted ? "rgba(255,255,255,0.02)" : "rgba(15,20,35,0.9)",
                  border:`1.5px solid ${isPickup?"rgba(22,163,74,0.5)":isOFD?"rgba(124,58,237,0.4)":isCompleted?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.07)"}`,
                  boxShadow: isPickup?"0 0 20px rgba(22,163,74,0.1)":isOFD?"0 0 20px rgba(124,58,237,0.1)":"none"
                }}>
                {/* Status banner */}
                {(isPickup||isOFD) && (
                  <div className="px-4 py-2.5 flex items-center gap-2" style={{ background:isPickup?"rgba(22,163,74,0.1)":"rgba(124,58,237,0.1)", borderBottom:`1px solid ${isPickup?"rgba(22,163,74,0.18)":"rgba(124,58,237,0.15)"}` }}>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background:isPickup?"#4ade80":"#a78bfa" }}/>
                    <p className="text-xs font-bold" style={{ color:isPickup?"#4ade80":"#a78bfa" }}>
                      {isPickup ? "🟢 Ready for pickup at restaurant" : "🛵 On the way to customer"}
                    </p>
                  </div>
                )}

                {/* Order header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600 text-xs font-mono">#{order.order_id?.slice(-8)}</p>
                    <span className="text-gray-700">·</span>
                    <p className="text-gray-600 text-xs">{timeSince(order.created_at)}</p>
                  </div>
                  {isCompleted && (
                    <div className="flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)" }}>
                      <CheckCircle className="h-3 w-3 text-green-400"/>
                      <span className="text-green-400 text-[10px] font-bold">Delivered</span>
                    </div>
                  )}
                </div>

                {/* Customer info */}
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background:"rgba(234,179,8,0.1)",border:"1px solid rgba(234,179,8,0.2)" }}>
                      <span className="text-xs font-bold" style={{ color:GOLD }}>{order.customer_name?.[0]?.toUpperCase()||"?"}</span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">{order.customer_name}</p>
                      {order.phone && <p className="text-gray-500 text-xs">{order.phone}</p>}
                    </div>
                  </div>
                  <button onClick={() => order.address && openMaps(order.address)}
                    className="w-full flex items-start gap-3 rounded-2xl p-3 text-left active:scale-[0.98] transition-all"
                    style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background:"rgba(22,163,74,0.15)" }}>
                      <MapPin className="h-4 w-4 text-green-400"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-200 text-sm leading-snug">{order.address||"—"}</p>
                      {order.address && <p className="text-green-500 text-xs mt-0.5 flex items-center gap-1"><Navigation className="h-2.5 w-2.5"/> Open in Maps</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-600 shrink-0 self-center"/>
                  </button>
                </div>

                {/* Items */}
                <div className="px-4 pb-3">
                  <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-1.5">Items</p>
                  <div className="space-y-1">
                    {(order.items||[]).map((item,i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-300">{item.quantity}× {item.name}</span>
                        <span className="text-gray-500">{fmt(item.price*item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment row */}
                <div className="mx-4 mb-4 rounded-2xl px-4 py-3 flex items-center justify-between"
                  style={{ background:isCOD?"rgba(249,115,22,0.08)":"rgba(255,255,255,0.04)", border:isCOD?"1px solid rgba(249,115,22,0.25)":"1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500"/>
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{order.payment_method||"—"}</span>
                    {isCOD && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background:"rgba(249,115,22,0.15)",color:"#fb923c",border:"1px solid rgba(249,115,22,0.25)" }}>COLLECT CASH</span>}
                  </div>
                  <span className="text-white font-black text-xl" style={{ fontFamily:"'Playfair Display',serif" }}>{fmt(order.total)}</span>
                </div>

                {/* CTA */}
                {flow && !isCompleted && (
                  <div className="px-4 pb-4">
                    <button onClick={() => updateStatus(order.order_id,flow.next)} disabled={isUpdating}
                      className="w-full py-4 rounded-2xl font-black text-white text-sm tracking-wide flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50"
                      style={{ background:`linear-gradient(135deg,${flow.color},${isPickup?"#059669":"#5b21b6"})`, boxShadow:`0 8px 24px ${flow.color}40` }}>
                      {isUpdating ? <><RotateCw className="h-4 w-4 animate-spin"/> Updating...</> : <><flow.icon className="h-5 w-5"/> {flow.label}</>}
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
