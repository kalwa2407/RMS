import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChefHat, Clock, RefreshCw, CheckCircle, LogOut,
  AlertCircle, Bell, Flame, UtensilsCrossed, Volume2, Printer
} from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";
import { printKOT } from "../../lib/PrintService";

const formatTime = (ts) => {
  if (!ts) return "—";
  try {
    const d = new Date(ts); const now = new Date();
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
  if (mins >= 20) return { border: "rgba(239,68,68,0.6)", bg: "rgba(239,68,68,0.05)", glow: "0 0 24px rgba(239,68,68,0.15)", badgeBg: "#ef4444", badgeText: "URGENT", timerCls: "text-red-400" };
  if (mins >= 10) return { border: "rgba(249,115,22,0.6)", bg: "rgba(249,115,22,0.04)", glow: "0 0 24px rgba(249,115,22,0.12)", badgeBg: "#f97316", badgeText: "DELAYED", timerCls: "text-orange-400" };
  return { border: "rgba(234,179,8,0.3)", bg: "rgba(234,179,8,0.03)", glow: "0 0 20px rgba(234,179,8,0.07)", badgeBg: "#22c55e", badgeText: "ON TIME", timerCls: "text-emerald-400" };
};
const sourceTag = (order) => {
  if (order.order_type === "DELIVERY") return { label: "🛵 Delivery", cls: "bg-blue-500/15 text-blue-300 border-blue-500/25" };
  if (order.order_type === "DINE_IN") return { label: `🪑 Table ${order.table_number || "—"}`, cls: "bg-purple-500/15 text-purple-300 border-purple-500/25" };
  return { label: "📦 Takeaway", cls: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25" };
};
const GOLD = "#EAB308";

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
    } catch (err) {
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

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#080c08 0%,#0f1500 50%,#080c08 100%)", fontFamily: "'Outfit',sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:"absolute",top:"-15%",left:"-10%",width:"500px",height:"500px",background:"radial-gradient(circle,rgba(249,115,22,0.07) 0%,transparent 70%)",borderRadius:"50%" }}/>
        <div style={{ position:"absolute",bottom:"10%",right:"-5%",width:"400px",height:"400px",background:"radial-gradient(circle,rgba(234,179,8,0.05) 0%,transparent 70%)",borderRadius:"50%" }}/>
      </div>

      {/* HEADER */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ background:"rgba(8,12,8,0.97)",borderBottom:"1px solid rgba(249,115,22,0.18)",backdropFilter:"blur(20px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden" style={{ background:"linear-gradient(135deg,#f97316 0%,#dc2626 100%)" }}>
            <ChefHat className="h-5 w-5 text-white" style={{ position:"relative",zIndex:1 }}/>
            <div style={{ position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(255,255,255,0.2),transparent)" }}/>
          </div>
          <div>
            <p className="font-black text-[10px] uppercase tracking-[0.2em] leading-none" style={{ color:"#f97316" }}>Kitchen Display</p>
            <p className="text-white text-sm font-bold mt-0.5" style={{ fontFamily:"'Playfair Display',serif" }}>{staffName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto KOT toggle */}
          <button
            onClick={() => {
              const next = !autoKotPrint;
              setAutoKotPrint(next);
              localStorage.setItem("pd_kitchen_auto_print", String(next));
            }}
            title="Auto-print KOT ticket when new order arrives"
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              autoKotPrint
                ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Auto KOT:</span>
            <span>{autoKotPrint ? "ON" : "OFF"}</span>
          </button>
          {notifCount > 0 && (
            <button onClick={() => setNotifCount(0)} className="relative p-2 rounded-xl border" style={{ background:"rgba(239,68,68,0.12)",borderColor:"rgba(239,68,68,0.3)" }}>
              <Bell className="h-4 w-4 text-red-400"/>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-black flex items-center justify-center">{notifCount}</span>
            </button>
          )}
          <button onClick={playAlert} className="p-2 rounded-xl" style={{ background:"rgba(255,255,255,0.05)" }}><Volume2 className="h-4 w-4 text-gray-500"/></button>
          <button onClick={() => fetchOrders()} className="p-2 rounded-xl" style={{ background:"rgba(249,115,22,0.08)" }}><RefreshCw className="h-4 w-4 text-orange-400"/></button>
          <span className="text-gray-700 text-[10px] font-mono hidden sm:block px-2">{lastRefresh.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>
          <button onClick={logout} className="p-2 rounded-xl" style={{ background:"rgba(239,68,68,0.1)" }}><LogOut className="h-4 w-4 text-red-400"/></button>
        </div>
      </div>


      {/* GREETING + PERFORMANCE CARDS */}
      <div className="px-4 pt-4 pb-0 space-y-3">
        {/* Greeting Card */}
        <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ background:"linear-gradient(135deg,rgba(249,115,22,0.1) 0%,rgba(8,12,8,0.85) 100%)", border:"1px solid rgba(249,115,22,0.22)", backdropFilter:"blur(16px)" }}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color:"#f97316" }}>
              {clockNow.getHours()<12?"☀️ Good Morning":clockNow.getHours()<17?"🌤️ Good Afternoon":clockNow.getHours()<21?"🌆 Good Evening":"🌙 Good Night"}
            </p>
            <p className="text-white font-bold text-base leading-tight mt-0.5" style={{ fontFamily:"'Playfair Display',serif" }}>{staffName}</p>
            <p className="text-gray-600 text-[10px] mt-0.5">Shift started · {shiftStart.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}</p>
          </div>
          <div className="text-right">
            <p className="text-white font-black text-xl leading-none" style={{ fontFamily:"'Playfair Display',serif" }}>
              {clockNow.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}
            </p>
            <p className="text-gray-600 text-[9px] mt-0.5 uppercase tracking-wider">
              {clockNow.toLocaleDateString("en-IN",{day:"2-digit",month:"short",weekday:"short"})}
            </p>
          </div>
        </div>

        {/* Performance cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl p-3.5" style={{ background:"rgba(249,115,22,0.08)",border:"1px solid rgba(249,115,22,0.2)" }}>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-1" style={{ color:"#f97316" }}>🔥 Queue Pressure</p>
            <p className="text-white font-black text-2xl">{orders.length > 5 ? "HIGH" : orders.length > 2 ? "MED" : "LOW"}</p>
            <p className="text-gray-600 text-[9px] mt-0.5">{orders.length} active · {newOrders.length} new</p>
          </div>
          <div className="rounded-2xl p-3.5" style={{ background:"rgba(234,179,8,0.06)",border:"1px solid rgba(234,179,8,0.18)" }}>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-1" style={{ color:GOLD }}>⏱️ Oldest Order</p>
            <p className="text-white font-black text-2xl">
              {orders.length > 0 ? `${Math.floor((Date.now()-new Date(orders[orders.length-1]?.accepted_at||orders[orders.length-1]?.created_at))/60000)}m` : "—"}
            </p>
            <p className="text-gray-600 text-[9px] mt-0.5">time in queue</p>
          </div>
        </div>
      </div>
      <div className="p-4 md:p-6 relative z-10">
        {/* STATS */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label:"All Active", value:orders.length, color:GOLD, bg:"rgba(234,179,8,0.08)", border:"rgba(234,179,8,0.2)" },
            { label:"New Orders", value:newOrders.length, color:"#f97316", bg:"rgba(249,115,22,0.08)", border:"rgba(249,115,22,0.25)" },
            { label:"Preparing", value:preparingOrders.length, color:"#a78bfa", bg:"rgba(167,139,250,0.08)", border:"rgba(167,139,250,0.2)" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background:s.bg, border:`1px solid ${s.border}` }}>
              <p className="text-3xl font-black" style={{ color:s.color }}>{s.value}</p>
              <p className="text-gray-600 text-[10px] font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-5 p-1 rounded-2xl" style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)" }}>
          {[
            { key:"all", label:"All Active", count:orders.length, icon:UtensilsCrossed },
            { key:"new", label:"New", count:newOrders.length, icon:Flame },
            { key:"preparing", label:"Cooking", count:preparingOrders.length, icon:Clock },
          ].map(({ key, label, count, icon:Icon }) => {
            const active = activeTab === key;
            const grad = key==="new" ? "linear-gradient(135deg,#f97316,#dc2626)" : key==="preparing" ? "linear-gradient(135deg,#a78bfa,#7c3aed)" : `linear-gradient(135deg,${GOLD},#d97706)`;
            return (
              <button key={key} onClick={() => setActiveTab(key)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 justify-center"
                style={{ background:active?grad:"transparent", color:active?(key==="all"?"#000":"#fff"):"#6b7280", boxShadow:active?"0 4px 12px rgba(0,0,0,0.4)":"none" }}>
                <Icon className="h-4 w-4"/>
                <span className="hidden sm:inline">{label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black" style={{ background:active?"rgba(0,0,0,0.2)":"rgba(255,255,255,0.08)", color:active?"#fff":"#9ca3af" }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* URGENCY LEGEND */}
        <div className="flex items-center gap-5 mb-5 px-1">
          <p className="text-gray-700 text-[10px] uppercase tracking-wider font-bold">Wait time:</p>
          {[{c:"#22c55e",l:"< 10 min"},{c:"#f97316",l:"10–20 min"},{c:"#ef4444",l:"> 20 min"}].map(x=>(
            <div key={x.l} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background:x.c }}/>
              <span className="text-gray-600 text-[10px]">{x.l}</span>
            </div>
          ))}
        </div>

        {/* ORDERS */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-72 gap-4">
            <RefreshCw className="h-10 w-10 text-orange-400 animate-spin"/>
            <p className="text-gray-600 text-sm">Loading kitchen queue...</p>
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 gap-5">
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background:"rgba(34,197,94,0.08)",border:"2px solid rgba(34,197,94,0.15)" }}>
              <CheckCircle className="h-12 w-12 text-emerald-500/60"/>
            </div>
            <div className="text-center">
              <p className="text-white text-xl font-bold" style={{ fontFamily:"'Playfair Display',serif" }}>All Caught Up! 🎉</p>
              <p className="text-gray-600 text-sm mt-1">No pending orders · Auto-refreshes every 8s</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayOrders.map(order => {
              const ts = order.accepted_at || order.created_at;
              const urg = urgency(ts);
              const tag = sourceTag(order);
              const isUpdating = updating === order.order_id;
              const isNew = order.status === "accepted";
              return (
                <div key={order.order_id} className="rounded-3xl overflow-hidden flex flex-col transition-all hover:scale-[1.015]"
                  style={{ background:urg.bg, border:`1.5px solid ${urg.border}`, boxShadow:urg.glow }}>
                  <div className="h-1" style={{ background:urg.badgeBg, opacity:0.7 }}/>
                  {/* Header */}
                  <div className="flex items-start justify-between px-4 pt-4 pb-3" style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-white font-black text-xl" style={{ fontFamily:"'Playfair Display',serif" }}>{order.kot_number || `#${order.order_id?.slice(-6)}`}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tag.cls}`}>{tag.label}</span>
                        <button
                          onClick={() => handlePrintKot(order)}
                          disabled={printingId === order.order_id}
                          className="px-2.5 py-1 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                          title="Quick Print KOT Slip (80mm Thermal)"
                        >
                          <Printer className={`h-3 w-3 ${printingId === order.order_id ? "animate-spin" : ""}`} />
                          <span>KOT Slip</span>
                        </button>
                      </div>
                      <p className="text-gray-500 text-xs font-medium">{order.customer_name}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-[10px] font-black text-white px-2.5 py-1 rounded-full" style={{ background:urg.badgeBg }}>{urg.badgeText}</span>
                      <div className={`flex items-center gap-1 text-xs mt-1.5 justify-end font-bold ${urg.timerCls}`}>
                        <Clock className="h-3 w-3"/><span>{timeSince(ts)}</span>
                      </div>
                      <p className="text-gray-700 text-[10px] mt-0.5">{formatTime(order.created_at)}</p>
                    </div>
                  </div>
                  {/* Status */}
                  <div className="px-4 pt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                      style={isNew ? { background:"rgba(249,115,22,0.15)",color:"#fb923c",border:"1px solid rgba(249,115,22,0.3)" } : { background:"rgba(167,139,250,0.12)",color:"#a78bfa",border:"1px solid rgba(167,139,250,0.25)" }}>
                      {isNew ? <Flame className="h-3 w-3"/> : <Clock className="h-3 w-3"/>}
                      {isNew ? "🔥 New Order — Start Now" : "⏳ Preparing..."}
                    </span>
                  </div>
                  {/* Items */}
                  <div className="flex-1 mx-4 my-3 rounded-2xl p-3" style={{ background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.04)" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-2.5" style={{ color:"#f97316" }}>Items to Prepare</p>
                    <ul className="space-y-2.5">
                      {(order.items||[]).map((item,i) => (
                        <li key={i}>
                          <div className="flex items-baseline gap-2">
                            <span className="font-black text-base w-7 text-right shrink-0" style={{ color:GOLD }}>{item.quantity}×</span>
                            <span className="text-white font-bold text-sm leading-tight">{item.name}</span>
                          </div>
                          {item.variant && <p className="text-gray-600 text-xs ml-9">({item.variant})</p>}
                          {item.addons?.length>0 && <p className="text-gray-600 text-xs ml-9">+ {item.addons.join(", ")}</p>}
                          {item.special_instructions && (
                            <div className="flex items-start gap-1 ml-9 mt-0.5">
                              <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" style={{ color:GOLD }}/>
                              <span className="text-xs" style={{ color:GOLD }}>{item.special_instructions}</span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Order special instructions / chef notes */}
                  {order.special_instructions && (
                    <div className="mx-4 mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">Special Note:</span>
                        <span className="text-amber-200 font-medium">{order.special_instructions}</span>
                      </div>
                    </div>
                  )}
                  {/* Action */}
                  <div className="px-4 pb-4 flex items-center gap-2">
                    <button
                      onClick={() => handlePrintKot(order)}
                      disabled={printingId === order.order_id}
                      className="px-3.5 py-3.5 rounded-2xl font-black text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shrink-0"
                      title="Print 80mm Thermal KOT Bill"
                    >
                      <Printer className={`h-4 w-4 ${printingId === order.order_id ? "animate-spin" : ""}`} />
                      <span>Print KOT</span>
                    </button>

                    {isNew && (
                      <button onClick={() => updateStatus(order.order_id,"preparing")} disabled={isUpdating}
                        className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                        style={{ background:"linear-gradient(135deg,#f97316,#ea580c)",boxShadow:"0 8px 24px rgba(249,115,22,0.3)" }}>
                        {isUpdating ? <><RefreshCw className="h-4 w-4 animate-spin"/> Updating...</> : <><Flame className="h-4 w-4"/> Start Preparing</>}
                      </button>
                    )}
                    {order.status==="preparing" && (
                      <button onClick={() => updateStatus(order.order_id,"ready")} disabled={isUpdating}
                        className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                        style={{ background:"linear-gradient(135deg,#22c55e,#16a34a)",boxShadow:"0 8px 24px rgba(34,197,94,0.25)" }}>
                        {isUpdating ? <><RefreshCw className="h-4 w-4 animate-spin"/> Updating...</> : <><CheckCircle className="h-4 w-4"/> Mark Ready — Notify Captain</>}
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

