import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bike, LogOut, MapPin, CheckCircle, Truck, Phone,
  Navigation, ChevronRight, RotateCw, WifiOff, Banknote
} from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";
import { cx, EmptyState } from "../customer/ui";
import { IconButton, StatusPill, Segmented, ListRow, Hairline, OrderCardSkeleton } from "./ui";

const fmt = (n) => `₹${Math.round(Number(n||0)).toLocaleString("en-IN")}`;

// ── Incoming delivery offer (auto-dispatch): first rider to accept within the window gets it ──
const OfferCard = ({ offer, secondsLeft, windowSeconds, busy, onAccept, onDecline }) => {
  const pct = Math.max(0, Math.min(100, (secondsLeft / Math.max(1, windowSeconds)) * 100));
  const urgent = secondsLeft <= 10;
  return (
    <section className="bg-white rounded-[18px] shadow-pd-2 overflow-hidden border-2 border-pd-success" aria-live="polite">
      <div className="h-1.5 w-full bg-pd-surface">
        <div className={cx("h-full transition-[width] duration-1000 ease-linear", urgent ? "bg-pd-error" : "bg-pd-success")} style={{ width:`${pct}%` }}/>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-pd-success">New delivery request</p>
          <p className={cx("text-[20px] font-bold pd-tabular", urgent ? "text-pd-error" : "text-pd-ink")}>{secondsLeft}s</p>
        </div>
        <div className="mt-2 flex items-start gap-2">
          <MapPin className="h-5 w-5 shrink-0 mt-0.5 text-pd-ink-2"/>
          <p className="text-[16px] font-semibold text-pd-ink leading-snug">{offer.address || "Address on pickup"}</p>
        </div>
        <p className="mt-2 text-[14px] text-pd-ink-2 pd-tabular">
          {offer.distance_km != null ? `${Number(offer.distance_km).toFixed(1)} km · ` : ""}
          {offer.items_count} item{offer.items_count === 1 ? "" : "s"} · {offer.payment_method === "cod" ? `Collect ${fmt(offer.total)}` : "Prepaid"}
        </p>
        {offer.branch_name && (
          <p className="mt-0.5 text-[13px] text-pd-ink-3">
            Pickup: {offer.branch_name}{offer.status === "placed" ? " · kitchen hasn't accepted yet" : ""}
          </p>
        )}
        <div className="mt-4 flex gap-2.5">
          <button type="button" disabled={busy} onClick={onDecline}
            className="pd-press flex-1 h-12 rounded-[14px] bg-pd-surface text-pd-ink text-[16px] font-semibold disabled:opacity-50">
            Decline
          </button>
          <button type="button" disabled={busy} onClick={onAccept}
            className="pd-press flex-[2] h-12 rounded-[14px] bg-pd-success text-white text-[16px] font-semibold disabled:opacity-60">
            {busy ? "Please wait…" : "Accept delivery"}
          </button>
        </div>
      </div>
    </section>
  );
};

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
  ready:            { next:"out_for_delivery", label:"Picked up, start delivery", shortLabel:"Start delivery", icon:Truck,       buttonClass:"bg-pd-action text-white" },
  out_for_delivery: { next:"delivered",        label:"Mark as delivered",         shortLabel:"Mark delivered", icon:CheckCircle, buttonClass:"bg-pd-success text-white" },
};

const STATUS_META = {
  ready:            { tone:"warn",    label:"Ready for pickup" },
  out_for_delivery: { tone:"teal",    label:"On the way" },
  delivered:        { tone:"success", label:"Delivered" },
};

const statusMeta = (status) =>
  STATUS_META[status] || { tone:"neutral", label:String(status || "Assigned").replace(/_/g, " ") };

const hasGpsPin = (order) => Boolean(order.latitude || order.coordinates?.lat);

const greetingFor = (d) => {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Good night";
};

const shortTime = (d) => d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true});

/* Big primary status button (56pt tall) with its loading state. */
const StatusButton = ({ flow, busy, onClick, compact = false, className = "" }) => (
  <button type="button" onClick={onClick} disabled={busy} aria-label={flow.label}
    className={cx("pd-press h-14 rounded-[14px] px-3 text-[17px] font-semibold whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-60", flow.buttonClass, className)}>
    {busy
      ? <><RotateCw className="h-5 w-5 animate-spin"/> Updating…</>
      : <><flow.icon className="h-5 w-5 shrink-0" strokeWidth={2.25}/> {compact ? flow.shortLabel : flow.label}</>}
  </button>
);

const DeliveryPanel = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("delivery_token");
  const riderId = localStorage.getItem("delivery_id") || "rider";

  const logout = () => {
    ["delivery_token", "delivery_id", "delivery_name"].forEach(k => localStorage.removeItem(k));
    navigate("/staff-entry", { replace: true });
  };

  const [profile, setProfile]  = useState(null);
  const [orders, setOrders]    = useState([]);
  const [loading, setLoading]  = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [updating, setUpdating]= useState(null);
  const [tab, setTab]          = useState("active");
  const [shiftStart]           = useState(() => new Date());
  const [clockNow, setClockNow]= useState(new Date());

  const [isGpsBroadcasting, setIsGpsBroadcasting] = useState(false);

  const statsKey = `rider_stats_${riderId}`;
  const [cumulativeStats, setCumulativeStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem(statsKey)) || { count:0, earnings:0 }; } catch { return { count:0, earnings:0 }; }
  });

  useEffect(() => { if (!token) navigate("/staff-entry",{replace:true}); }, [token,navigate]);

  useEffect(() => {
    const c = setInterval(() => setClockNow(new Date()), 30000);
    return () => clearInterval(c);
  }, []);

  // ── Real-Time Rider GPS Broadcaster (100% Free HTML5/Capacitor GPS) ──
  // Broadcasts phone GPS coordinates to backend when delivering orders
  useEffect(() => {
    const deliveringOrder = orders.find(o => o.status === "out_for_delivery");
    if (!deliveringOrder || !navigator.geolocation || !token) {
      setIsGpsBroadcasting(false);
      return;
    }

    const orderId = deliveringOrder.id || deliveringOrder._id || deliveringOrder.order_id;
    if (!orderId) return;

    let watchId = null;
    let lastSent = 0;

    const broadcastLocation = async (lat, lng) => {
      const now = Date.now();
      // Throttle: Send once every 8 seconds to preserve battery
      if (now - lastSent < 8000) return;
      lastSent = now;
      try {
        await axios.put(
          `${API_BASE}/api/delivery/orders/${orderId}/location`,
          { lat, lng },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsGpsBroadcasting(true);
      } catch (err) {
        // Non-blocking background sync
      }
    };

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (pos?.coords) {
            broadcastLocation(pos.coords.latitude, pos.coords.longitude);
          }
        },
        (err) => {
          console.warn("Delivery GPS watch notice:", err);
          setIsGpsBroadcasting(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    } catch (e) {
      console.warn("Geolocation not supported:", e);
    }

    return () => {
      if (watchId !== null && navigator.geolocation?.clearWatch) {
        navigator.geolocation.clearWatch(watchId);
      }
      setIsGpsBroadcasting(false);
    };
  }, [orders, token]);

  const fetchProfile = useCallback(async () => {
    if (!token) return; // Guard: don't attempt fetch without a valid token
    try {
      const { data } = await axios.get(`${API_BASE}/api/delivery/profile`, { headers:{ Authorization:`Bearer ${token}` } });
      setProfile(data);
      if (data?.id || data?._id) localStorage.setItem("delivery_id", data.id || data._id);
      if (data?.name) localStorage.setItem("delivery_name", data.name);
    } catch (err) {
      if (err.response?.status===401||err.response?.status===403) {
        ["delivery_token", "delivery_id", "delivery_name"].forEach(k => localStorage.removeItem(k));
        navigate("/staff-entry",{replace:true});
      }
    }
  }, [token, navigate]);

  const fetchOrders = useCallback(async () => {
    if (!token) return; // Guard: don't attempt fetch without a valid token
    try {
      const { data } = await axios.get(`${API_BASE}/api/delivery/orders`, { headers:{ Authorization:`Bearer ${token}` } });
      const ordersData = Array.isArray(data) ? data : [];
      setOrders(ordersData);
      const delivered = ordersData.filter(o => o.status === "delivered");
      const newStats = { count:delivered.length, earnings:delivered.reduce((s,o) => s+(o.total||0),0) };
      setCumulativeStats(newStats);
      localStorage.setItem(statsKey, JSON.stringify(newStats));
      setLoadError(false);
    } catch (err) {
      if (err.response?.status===401||err.response?.status===403) {
        ["delivery_token", "delivery_id", "delivery_name"].forEach(k => localStorage.removeItem(k));
        navigate("/staff-entry",{replace:true});
      } else {
        setLoadError(true);
      }
    } finally { setLoading(false); }
  }, [token, navigate, statsKey]);

  useEffect(() => { fetchProfile(); fetchOrders(); const i=setInterval(fetchOrders,12000); return ()=>clearInterval(i); }, [fetchProfile,fetchOrders]);

  // ── Auto-dispatch offers: poll every 4 s, count down locally every second ──
  const [offers, setOffers] = useState([]);           // [{...offer, deadline: ms}]
  const [offerWindow, setOfferWindow] = useState(30);
  const [offerBusy, setOfferBusy] = useState(null);
  const [offerNotice, setOfferNotice] = useState(null);
  const [tick, setTick] = useState(Date.now());

  const fetchOffers = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(`${API_BASE}/api/delivery/offers`, { headers:{ Authorization:`Bearer ${token}` } });
      if (!data?.enabled) { setOffers([]); return; }
      setOfferWindow(data.window_seconds || 30);
      const now = Date.now();
      setOffers(prev => {
        const next = (data.offers || []).map(o => ({ ...o, deadline: now + (o.seconds_left || 0) * 1000 }));
        const isNew = next.some(o => !prev.find(p => p.order_id === o.order_id));
        if (isNew && navigator.vibrate) { try { navigator.vibrate([300, 150, 300]); } catch (e) { /* not supported */ } }
        return next;
      });
    } catch (e) { /* keep last known offers; next poll retries */ }
  }, [token]);

  useEffect(() => { fetchOffers(); const i = setInterval(fetchOffers, 4000); return () => clearInterval(i); }, [fetchOffers]);
  useEffect(() => {
    if (offers.length === 0) return undefined;
    const i = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(i);
  }, [offers.length]);

  const visibleOffers = offers
    .map(o => ({ ...o, secondsLeft: Math.max(0, Math.ceil((o.deadline - tick) / 1000)) }))
    .filter(o => o.secondsLeft > 0);

  const respondToOffer = async (orderId, action) => {
    setOfferBusy(orderId);
    setOfferNotice(null);
    try {
      await axios.post(`${API_BASE}/api/delivery/orders/${orderId}/${action}`, {}, { headers:{ Authorization:`Bearer ${token}` } });
      setOffers(prev => prev.filter(o => o.order_id !== orderId));
      if (action === "accept") {
        setTab("active");
        await fetchOrders();
        setOfferNotice({ ok: true, text: "Delivery accepted — it's in your Active list." });
      }
    } catch (err) {
      setOffers(prev => prev.filter(o => o.order_id !== orderId));
      setOfferNotice({ ok: false, text: err.response?.status === 409 ? "Too late — this delivery was already assigned." : (err.response?.data?.detail || "Could not respond. Please try again.") });
    } finally {
      setOfferBusy(null);
      setTimeout(() => setOfferNotice(null), 4000);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await axios.put(`${API_BASE}/api/delivery/orders/${orderId}/status?new_status=${newStatus}`, {}, { headers:{ Authorization:`Bearer ${token}` } });
      await fetchOrders();
      if (newStatus === "delivered") setTab("completed");
    } catch (err) { alert(err.response?.data?.detail || "Failed to update status"); }
    finally { setUpdating(null); }
  };

  const openMaps = (orderOrAddress) => {
    let url = '';
    if (orderOrAddress && typeof orderOrAddress === 'object') {
      const lat = orderOrAddress.latitude || orderOrAddress.lat || orderOrAddress.coordinates?.lat;
      const lng = orderOrAddress.longitude || orderOrAddress.lng || orderOrAddress.coordinates?.lng;
      if (lat && lng) {
        // Direct Turn-by-Turn GPS Navigation to exact pin
        url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      } else if (orderOrAddress.address) {
        url = `https://maps.google.com/?q=${encodeURIComponent(orderOrAddress.address)}`;
      }
    } else if (orderOrAddress) {
      url = `https://maps.google.com/?q=${encodeURIComponent(orderOrAddress)}`;
    }
    if (url) window.open(url, "_blank");
  };

  const activeOrders    = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  const completedOrders = orders.filter(o => o.status === "delivered");
  const displayOrders   = tab === "active" ? activeOrders : completedOrders;

  // The order the rider is working on right now drives the bottom action dock:
  // a live delivery first, otherwise the next pickup.
  const currentOrder = tab === "active"
    ? (activeOrders.find(o => o.status === "out_for_delivery") || activeOrders.find(o => STATUS_FLOW[o.status]))
    : null;
  const currentFlow = currentOrder ? STATUS_FLOW[currentOrder.status] : null;

  const renderOrder = (order) => {
    const flow = STATUS_FLOW[order.status];
    const meta = statusMeta(order.status);
    const isCOD = order.payment_method === "cod";
    const isUpdating = updating === order.order_id;
    const isCompleted = order.status === "delivered";
    const isCurrent = currentOrder && currentOrder.order_id === order.order_id;
    const items = order.items || [];
    return (
      <article key={order.order_id}
        className={cx("rounded-[18px] bg-white overflow-hidden", isCurrent ? "shadow-pd-2 ring-1 ring-pd-ink/10" : "shadow-pd-1")}>
        {/* Status + order meta */}
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <StatusPill tone={meta.tone} className={STATUS_META[order.status] ? "" : "capitalize"}>{meta.label}</StatusPill>
          <p className="text-[13px] text-pd-ink-3 pd-tabular truncate">
            #{order.order_id?.slice(-6)} · {timeSince(order.created_at)}
          </p>
        </div>

        <h2 className="px-4 pt-2.5 text-[20px] leading-[26px] font-semibold text-pd-ink tracking-[-0.01em] truncate">
          {order.customer_name || "Customer"}
        </h2>

        {/* Address + phone, grouped like an iOS inset list */}
        <div className="mx-4 mt-3 rounded-[14px] bg-pd-surface overflow-hidden">
          <ListRow
            onClick={() => openMaps(order)}
            icon={MapPin}
            iconClassName="bg-pd-teal text-white"
            className="items-start"
            title={<span className="block text-[16px] leading-[22px] text-pd-ink">{order.address || "No address on order"}</span>}
            subtitle={
              <span className="mt-1 flex items-center gap-1 text-[14px] font-semibold text-pd-teal">
                <Navigation className="h-3.5 w-3.5" strokeWidth={2.5}/>
                {hasGpsPin(order) ? "Navigate to GPS pin" : "Open in Google Maps"}
              </span>
            }
            trailing={<ChevronRight className="h-5 w-5 text-pd-ink-3 shrink-0 self-center"/>}
          />
          {order.phone && (
            <>
              <Hairline inset={68}/>
              <ListRow
                href={`tel:${order.phone}`}
                icon={Phone}
                iconClassName="bg-pd-success text-white"
                title={<span className="block text-[17px] font-semibold text-pd-ink pd-tabular">{order.phone}</span>}
                subtitle={<span className="block text-[14px] text-pd-ink-2">Call customer</span>}
                trailing={<ChevronRight className="h-5 w-5 text-pd-ink-3 shrink-0"/>}
              />
            </>
          )}
        </div>

        {/* Items */}
        <div className="px-4 pt-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-pd-ink-3">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
          <ul className="mt-1.5 divide-y divide-[var(--pd-line)]">
            {items.map((item, i) => (
              <li key={i} className="flex items-baseline gap-3 py-2 text-[16px]">
                <span className="w-8 shrink-0 font-semibold text-pd-ink pd-tabular">{item.quantity}×</span>
                <span className="flex-1 min-w-0 text-pd-ink">{item.name}</span>
                <span className="text-pd-ink-2 pd-tabular">{fmt(item.price*item.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Payment */}
        {isCOD && !isCompleted ? (
          <div className="mx-4 mt-2 rounded-[14px] bg-[#FDF3E3] px-4 py-3 flex items-center gap-3">
            <Banknote className="h-6 w-6 text-pd-warn shrink-0" strokeWidth={2}/>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-semibold text-pd-ink">Collect cash</p>
              <p className="text-[13px] text-pd-ink-2">Cash on delivery</p>
            </div>
            <p className="text-[24px] font-semibold text-pd-ink pd-tabular">{fmt(order.total)}</p>
          </div>
        ) : (
          <div className="mx-4 mt-2 border-t border-[var(--pd-line)] pt-3 flex items-center justify-between">
            <p className="text-[15px] text-pd-ink-2">
              {isCOD ? "Cash collected · COD" : <>Paid · <span className="uppercase">{order.payment_method || "—"}</span></>}
            </p>
            <p className="text-[20px] font-semibold text-pd-ink pd-tabular">{fmt(order.total)}</p>
          </div>
        )}

        {/* Primary action. The current order's action lives in the bottom dock. */}
        {flow && !isCompleted && !isCurrent ? (
          <div className="p-4">
            <StatusButton flow={flow} busy={isUpdating} onClick={() => updateStatus(order.order_id, flow.next)} className="w-full"/>
          </div>
        ) : (
          <div className="h-4"/>
        )}
      </article>
    );
  };

  const isEmpty = displayOrders.length === 0;

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-pd-surface text-pd-ink">
      {/* HEADER */}
      <header className="shrink-0 z-40 bg-white border-b border-[var(--pd-line)]" style={{ paddingTop:"env(safe-area-inset-top)" }}>
        <div className="flex items-start gap-2 px-4 pt-3">
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-pd-ink-2 pd-tabular">
              {greetingFor(clockNow)} · {shortTime(clockNow)}
            </p>
            <h1 className="text-[26px] leading-[32px] font-bold tracking-[-0.02em] text-pd-ink truncate">
              {profile?.name || "Delivery Partner"}
            </h1>
          </div>
          <IconButton label="Refresh orders" onClick={fetchOrders}><RotateCw className="h-5 w-5" strokeWidth={2.25}/></IconButton>
          <IconButton label="Log out" onClick={logout} tone="danger"><LogOut className="h-5 w-5" strokeWidth={2.25}/></IconButton>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 pt-1.5">
          <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-pd-success">
            <span className="w-2 h-2 rounded-full bg-pd-success" aria-hidden="true"/>
            Online
            <span className="font-normal text-pd-ink-2 pd-tabular">· shift since {shortTime(shiftStart)}</span>
          </span>
          {isGpsBroadcasting && (
            <StatusPill tone="teal">Sharing live location</StatusPill>
          )}
        </div>

        {/* Stats */}
        <dl className="mx-4 mt-3 grid grid-cols-3 rounded-[14px] bg-pd-surface divide-x divide-[var(--pd-line)]">
          {[
            { label:"Delivered",   val:cumulativeStats.count },
            { label:"Order value", val:fmt(cumulativeStats.earnings) },
            { label:"Active",      val:activeOrders.length },
          ].map(s => (
            <div key={s.label} className="px-3 py-2.5 min-w-0">
              <dd className="text-[22px] leading-7 font-semibold text-pd-ink pd-tabular truncate">{s.val}</dd>
              <dt className="text-[13px] text-pd-ink-2 truncate">{s.label}</dt>
            </div>
          ))}
        </dl>

        <div className="px-4 py-3">
          <Segmented value={tab} onChange={setTab} options={[
            { key:"active",    label:"Active",    count:activeOrders.length },
            { key:"completed", label:"Completed", count:completedOrders.length },
          ]}/>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-6 space-y-4"
        style={!currentFlow ? { paddingBottom:"calc(24px + env(safe-area-inset-bottom))" } : undefined}>
        {offerNotice && (
          <div role="status" className={cx("rounded-[14px] px-4 py-3 text-[15px] font-medium", offerNotice.ok ? "bg-[#EAF6EE] text-pd-success" : "bg-[#FDECEC] text-pd-error")}>
            {offerNotice.text}
          </div>
        )}
        {visibleOffers.map(offer => (
          <OfferCard
            key={offer.order_id}
            offer={offer}
            secondsLeft={offer.secondsLeft}
            windowSeconds={offerWindow}
            busy={offerBusy === offer.order_id}
            onAccept={() => respondToOffer(offer.order_id, "accept")}
            onDecline={() => respondToOffer(offer.order_id, "decline")}
          />
        ))}
        {loadError && !isEmpty && (
          <div role="status" className="rounded-[14px] bg-[#FDF3E3] px-4 py-3 flex items-center gap-3">
            <WifiOff className="h-5 w-5 text-pd-warn shrink-0"/>
            <p className="flex-1 text-[14px] text-pd-ink">Couldn't refresh. Showing the last update.</p>
            <button type="button" onClick={fetchOrders} className="pd-press text-[15px] font-semibold text-pd-action h-11 px-1">Retry</button>
          </div>
        )}

        {loading && isEmpty ? (
          <>
            <OrderCardSkeleton/>
            <OrderCardSkeleton/>
            <p className="sr-only">Loading deliveries</p>
          </>
        ) : loadError && isEmpty ? (
          <EmptyState icon={WifiOff} className="bg-white rounded-[18px] shadow-pd-1"
            title="Couldn't load deliveries"
            message="Check your internet connection and try again."
            actionLabel="Try again" onAction={fetchOrders}/>
        ) : isEmpty ? (
          <EmptyState icon={tab === "active" ? Bike : CheckCircle} className="bg-white rounded-[18px] shadow-pd-1"
            title={tab === "active" ? "No deliveries right now" : "No completed deliveries"}
            message={tab === "active" ? "New orders assigned to you will appear here automatically." : "Orders you deliver will show up here."}/>
        ) : (
          (currentOrder ? [currentOrder, ...displayOrders.filter(o => o !== currentOrder)] : displayOrders).map(renderOrder)
        )}
      </main>

      {/* BOTTOM ACTION DOCK: call, navigate and the next status step, within thumb reach */}
      {currentFlow && (
        <div className="shrink-0 z-40 bg-white border-t border-[var(--pd-line)] px-4 pt-3"
          style={{ paddingBottom:"max(12px, env(safe-area-inset-bottom))" }}>
          <p className="text-[13px] text-pd-ink-2 truncate mb-2">
            <span className="font-semibold text-pd-ink">{currentOrder.customer_name || "Customer"}</span>
            <span className="pd-tabular"> · #{currentOrder.order_id?.slice(-6)}</span>
            {currentOrder.payment_method === "cod" && <span className="text-pd-warn font-semibold pd-tabular"> · Collect {fmt(currentOrder.total)}</span>}
          </p>
          <div className="flex gap-2.5">
            {currentOrder.phone && (
              <a href={`tel:${currentOrder.phone}`} aria-label="Call customer"
                className="pd-press w-14 h-14 rounded-[14px] bg-pd-surface text-pd-ink flex items-center justify-center shrink-0">
                <Phone className="h-6 w-6" strokeWidth={2}/>
              </a>
            )}
            <button type="button" onClick={() => openMaps(currentOrder)} aria-label="Navigate to customer"
              className="pd-press w-14 h-14 rounded-[14px] bg-pd-surface text-pd-teal flex items-center justify-center shrink-0">
              <Navigation className="h-6 w-6" strokeWidth={2}/>
            </button>
            <StatusButton flow={currentFlow} busy={updating === currentOrder.order_id}
              onClick={() => updateStatus(currentOrder.order_id, currentFlow.next)} compact className="flex-1 min-w-0"/>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPanel;
