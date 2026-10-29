import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ChevronDown, Share2, RefreshCw, Phone, MapPin, Bike, ChefHat,
  CheckCircle2, Clock, Package, Home, Zap, ExternalLink,
  MessageCircle, Star, Shield, Maximize2, Minimize2, Copy, AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import API_BASE from '../../../lib/config';
import CustomerDeliveryMap from './CustomerDeliveryMap';

// ── Calculation Constants (Internal only - never shown to user) ──────────
const PREP_TIME_MINS = 15;
const MINS_PER_KM = 3;
const RESTAURANT_PHONE = '02026131976';

// Status to milestone mapping
const STATUS_MILESTONE = {
  placed: 0,
  accepted: 1,
  preparing: 1,
  ready: 2,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1,
  rejected: -1,
};

const MILESTONES = [
  {
    key: 'placed',
    label: 'Order Placed',
    sublabel: 'Confirmed & sent to kitchen',
    icon: Package,
  },
  {
    key: 'kitchen',
    label: 'Preparing Your Feast',
    sublabel: 'Master chefs crafting your Mughlai delicacies',
    icon: ChefHat,
  },
  {
    key: 'dispatched',
    label: 'Out for Delivery',
    sublabel: 'Rider on the road to your doorstep',
    icon: Bike,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    sublabel: 'Enjoy your royal Persian feast',
    icon: CheckCircle2,
  },
];

// ── ETA Calculation Engine (Internal - results shown, formula hidden) ────
function calcETA(order, orderPlacedAt) {
  if (!order) return null;
  const status = order.status;
  if (['delivered', 'cancelled', 'rejected'].includes(status)) return null;

  const distKm = parseFloat(order.distance_km || order.distanceKm || 3.5);
  const deliveryMins = Math.round(distKm * MINS_PER_KM);
  const totalFormulaMins = PREP_TIME_MINS + deliveryMins;

  let minsRemaining = totalFormulaMins;
  if (status === 'placed') {
    minsRemaining = totalFormulaMins;
  } else if (status === 'accepted' || status === 'preparing') {
    minsRemaining = Math.max(8, totalFormulaMins - 5);
  } else if (status === 'ready') {
    minsRemaining = deliveryMins;
  } else if (status === 'out_for_delivery') {
    minsRemaining = Math.max(4, Math.round(deliveryMins * 0.6));
  }

  // Check if ETA has expired based on when order was placed
  let isDelayed = false;
  if (orderPlacedAt) {
    const placedTime = new Date(orderPlacedAt).getTime();
    const now = Date.now();
    const elapsedMins = (now - placedTime) / 60000;
    if (elapsedMins > totalFormulaMins) {
      isDelayed = true;
      minsRemaining = 0;
    }
  }

  const etaPillText = isDelayed
    ? 'Running a bit late'
    : `Arriving in ${minsRemaining} mins`;

  return { minsRemaining, etaPillText, distKm, totalFormulaMins, isDelayed };
}

// ── Auto-detect platform using Capacitor & user agent (Zero toggles) ──────
function detectPlatform() {
  try {
    const cap = Capacitor.getPlatform();
    if (cap === 'ios') return 'ios';
    if (cap === 'android') return 'android';
  } catch (e) {}
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  return 'android';
}

// ── Delivered Celebration Screen ──────────────────────────────────────────
const DeliveredScreen = ({ order, onGoHome }) => (
  <div className="mx-4 bg-white rounded-3xl p-6 border border-emerald-200/80 shadow-md flex flex-col items-center justify-center text-center space-y-5 animate-in zoom-in-95 duration-300">
    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center shadow-lg">
      <CheckCircle2 className="w-10 h-10 text-emerald-600" />
    </div>
    <div>
      <h2 className="text-xl font-black text-neutral-900">Order Delivered!</h2>
      <p className="text-xs text-neutral-500 mt-1 max-w-xs">
        Your royal Persian feast has arrived at your doorstep. We hope you enjoy every bite!
      </p>
    </div>
    {order?.items && (
      <div className="w-full bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200/60 shadow-xs text-left">
        <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2">Order Items</p>
        <div className="space-y-1.5 text-xs text-neutral-700">
          {order.items.map((it, idx) => (
            <div key={idx} className="flex justify-between">
              <span className="font-medium">{it.quantity}x {it.name}</span>
              <span className="font-bold">&#8377;{it.price * it.quantity}</span>
            </div>
          ))}
        </div>
        <div className="pt-2 mt-2 border-t border-neutral-200/60 flex justify-between">
          <span className="text-xs font-black text-neutral-900">Total Paid</span>
          <span className="text-sm font-black text-[#E40000]">&#8377;{order.total || order.subtotal || 0}</span>
        </div>
      </div>
    )}
    <button
      onClick={onGoHome}
      className="w-full py-3.5 bg-neutral-900 hover:bg-black text-white font-black text-xs rounded-2xl shadow-md active:scale-98 transition-transform cursor-pointer"
    >
      Done & Return to Home
    </button>
  </div>
);

// ── Delay / ETA Expired Apology Card ──────────────────────────────────────
const DelayApologyCard = ({ order }) => (
  <div className="mx-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-4.5 border-2 border-amber-300 shadow-md animate-in slide-in-from-top duration-300 space-y-3">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
        <Clock className="w-5 h-5 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-amber-950">Running a bit behind schedule</h3>
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
            Priority
          </span>
        </div>
        <p className="text-xs text-amber-900 mt-1 leading-relaxed">
          We sincerely apologize for the delay! Our master chefs craft every royal dish fresh, and your rider is navigating traffic right now. Your feast is almost at your doorstep!
        </p>
      </div>
    </div>
    <div className="pt-2 border-t border-amber-200/60 flex items-center gap-2">
      <a
        href={`tel:${RESTAURANT_PHONE}`}
        className="flex-1 py-2.5 rounded-xl bg-amber-950 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition-transform cursor-pointer"
      >
        <Phone className="w-3.5 h-3.5 text-amber-300" />
        <span>Call Restaurant Support</span>
      </a>
      {(order?.delivery_partner_phone || order?.porter_rider_phone) && (
        <a
          href={`tel:${order.delivery_partner_phone || order.porter_rider_phone}`}
          className="flex-1 py-2.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-transform cursor-pointer"
        >
          <Bike className="w-3.5 h-3.5 text-amber-700" />
          <span>Call Rider</span>
        </a>
      )}
    </div>
  </div>
);

// ── Main CustomerTrackOrder Component ───────────────────────────────────────
const CustomerTrackOrder = ({ orderId: propOrderId, onClose, onGoHome }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [showDelivered, setShowDelivered] = useState(false);
  const pollingRef = useRef(null);
  const autoCloseTimerRef = useRef(null);

  // Auto-detect platform (no manual toggle)
  const platform = useMemo(() => detectPlatform(), []);

  // Fetch order data
  const fetchOrder = useCallback(async (id, silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${id}`);
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      setOrder(data);

      // Auto-transition to delivered celebration
      if (data.status === 'delivered') {
        setShowDelivered(true);
        // Auto-close tracking after 8 seconds
        autoCloseTimerRef.current = setTimeout(() => {
          if (onGoHome) onGoHome();
          else if (onClose) onClose();
        }, 8000);
      }
    } catch (err) {
      // Keep existing data
    } finally {
      if (!silent) setLoading(false);
      else setRefreshing(false);
    }
  }, [onClose, onGoHome]);

  useEffect(() => {
    if (propOrderId) fetchOrder(propOrderId);
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, [propOrderId, fetchOrder]);

  // Live polling every 6-10 seconds for active orders (faster when rider is moving)
  useEffect(() => {
    if (!order) return;
    if (['delivered', 'cancelled', 'rejected'].includes(order.status)) {
      clearInterval(pollingRef.current);
      return;
    }
    const intervalMs = (order.delivery_partner_name || order.status === 'out_for_delivery') ? 6000 : 10000;
    pollingRef.current = setInterval(() => fetchOrder(order.order_id, true), intervalMs);
    return () => clearInterval(pollingRef.current);
  }, [order, fetchOrder]);

  const orderPlacedAt = order?.created_at || order?.createdAt || order?.placed_at;
  const eta = calcETA(order, orderPlacedAt);
  const milestoneIdx = order ? (STATUS_MILESTONE[order.status] ?? 0) : 0;
  const isCancelled = ['cancelled', 'rejected'].includes(order?.status);
  const isDelivery = order?.order_type === 'DELIVERY' || !order?.order_type;
  const isDelivered = order?.status === 'delivered';

  // Native share or clipboard
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Track Persian Darbar Order',
        text: `Track my Persian Darbar order #${String(order?.order_id || propOrderId).slice(-6)} live!`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyOrderId = () => {
    if (!order?.order_id) return;
    navigator.clipboard?.writeText(order.order_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Status headline
  const getStatusHeadline = () => {
    if (!order) return 'Tracking Order';
    if (order.status === 'delivered') return 'Order Delivered';
    if (order.status === 'out_for_delivery') return 'Out for Delivery';
    if (order.status === 'ready') return 'Order Ready for Pickup';
    if (order.status === 'preparing' || order.status === 'accepted') return 'Preparing your order';
    if (isCancelled) return 'Order cancelled';
    return 'Order placed';
  };

  // If delivered, show celebration and auto-close
  if (showDelivered && isDelivered) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex flex-col items-center select-none overflow-hidden animate-in fade-in duration-200">
        <div className="w-full max-w-[430px] md:max-w-3xl lg:max-w-4xl h-full flex flex-col bg-[#F8F9FA] shadow-2xl md:shadow-md relative overflow-hidden md:border-x md:border-neutral-200/50">
          <header
            className="shrink-0 px-4 pb-4 text-white relative shadow-md"
            style={{
              backgroundColor: '#151E33',
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)'
            }}
          >
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-90 transition-all cursor-pointer border border-white/10"
                aria-label="Dismiss tracking"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </button>
              <div className="text-center">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Persian Darbar
                </h2>
                <p className="text-[10px] text-white/60">Camp, Pune Flagship</p>
              </div>
              <div className="w-9" />
            </div>
            <div className="mt-4 text-center">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                Order Delivered
              </h1>
            </div>
            <div className="mt-3 flex items-center justify-center">
              <div className="bg-emerald-600/40 border border-emerald-400/30 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Delivered to your doorstep!</span>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <DeliveredScreen order={order} onGoHome={() => {
              if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
              if (onGoHome) onGoHome();
              else if (onClose) onClose();
            }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex flex-col items-center select-none overflow-hidden animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] md:max-w-3xl lg:max-w-4xl h-full flex flex-col bg-[#F8F9FA] shadow-2xl md:shadow-md relative overflow-hidden md:border-x md:border-neutral-200/50">

        {/* ═══ HEADER ═══ */}
        <header
          className="shrink-0 px-4 pb-4 text-white relative shadow-md"
          style={{
            backgroundColor: '#151E33',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)'
          }}
        >
          {/* Row 1: Back - Restaurant Name - Share */}
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-90 transition-all cursor-pointer border border-white/10"
              aria-label="Dismiss tracking"
            >
              <ChevronDown className="w-5 h-5 text-white" />
            </button>
            <div className="text-center">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Persian Darbar
              </h2>
              <p className="text-[10px] text-white/60">Camp, Pune Flagship</p>
            </div>
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-90 transition-all cursor-pointer border border-white/10"
              aria-label="Share tracking"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Row 2: Status Title */}
          <div className="mt-4 text-center">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              {getStatusHeadline()}
            </h1>
          </div>

          {/* Row 3: Arriving Pill + Refresh */}
          {eta && !isCancelled && !isDelivered && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className={`${eta.isDelayed ? 'bg-amber-600/30 border-amber-400/30' : 'bg-[#242F48] border-white/10'} border text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-inner flex items-center gap-2`}>
                {eta.isDelayed ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>{eta.etaPillText}</span>
              </div>
              <button
                onClick={() => fetchOrder(propOrderId, true)}
                disabled={refreshing}
                className="w-8 h-8 rounded-xl bg-[#242F48] hover:bg-[#2C3955] border border-white/10 flex items-center justify-center text-white/80 active:scale-90 transition-all cursor-pointer"
                title="Refresh live status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-300' : ''}`} />
              </button>
            </div>
          )}

          {isDelivered && (
            <div className="mt-3 flex items-center justify-center">
              <div className="bg-emerald-600/40 border border-emerald-400/30 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Delivered to your doorstep!</span>
              </div>
            </div>
          )}
        </header>

        {/* ═══ SCROLLABLE CONTENT ═══ */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-8 space-y-3">

          {/* Delivered Celebration View (Hides active map/rider transit when delivered) */}
          {(isDelivered || showDelivered) ? (
            <DeliveredScreen order={order} onGoHome={onGoHome || onClose} />
          ) : (
            <>
              {/* 1. Real Leaflet Delivery Map */}
              {isDelivery && !isCancelled && (
                <CustomerDeliveryMap
                  order={order}
                  eta={eta}
                  isExpanded={isMapExpanded}
                  onToggleExpand={() => setIsMapExpanded(prev => !prev)}
                />
              )}

              {/* 2. Platform-native Live Status (Auto-detected iOS Dynamic Island / Android Material) */}
              {platform === 'ios' && !isCancelled && !isDelivered && (
                <div className="mx-4 p-3.5 rounded-3xl bg-neutral-950 text-white shadow-2xl border border-neutral-800/90 animate-in slide-in-from-top-2 duration-300 space-y-2.5">
                  {/* Apple Dynamic Island Capsule Pill (Identical to iOS Live Activities) */}
                  <div className="w-full h-10 px-4 rounded-full bg-black border border-white/10 flex items-center justify-between shadow-inner">
                    {/* Brand Name on Left (matches screenshot with royal styling) */}
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-black italic text-white text-[13px] tracking-tight lowercase">
                        persian darbar
                      </span>
                    </div>

                    {/* Compact Trailing: Countdown ring & minutes remaining */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#18181B] border border-white/10">
                      <svg className="w-4 h-4 -rotate-90 shrink-0" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="white"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={56.5}
                          strokeDashoffset={
                            56.5 * (1 - Math.min(1, Math.max(0.15, (eta?.minsRemaining || 12) / (eta?.totalFormulaMins || 25))))
                          }
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-[11px] font-black text-white font-mono tracking-tight">
                        {eta?.isDelayed ? 'Late' : `${eta?.minsRemaining || 12}m`}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Island Expanded Status Details */}
                  <div className="px-1 flex items-center justify-between text-xs text-neutral-300">
                    <span className="font-medium truncate">{getStatusHeadline()}</span>
                    <span className="text-[11px] text-amber-400 font-bold shrink-0 ml-2">
                      {eta?.distKm ? `${eta.distKm} km away` : 'On Route'}
                    </span>
                  </div>
                </div>
              )}

              {platform === 'android' && !isCancelled && !isDelivered && (
                <div className="mx-4 p-3.5 rounded-3xl bg-[#1F2937] text-white shadow-lg border border-neutral-700 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#E40000] flex items-center justify-center text-white text-xs">
                        <ChefHat className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white">Persian Darbar</h3>
                        <p className="text-[11px] text-emerald-400 font-medium">
                          {getStatusHeadline()}
                          {eta && !eta.isDelayed ? ` . ${eta.minsRemaining} mins` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-300 bg-white/10 px-2.5 py-1 rounded-xl">
                      {eta?.isDelayed ? 'Late' : `~${eta?.minsRemaining || '--'}m`}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-700 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round(((milestoneIdx + 1) / 4) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 3. Delay Apology Card (when ETA expired) */}
              {eta?.isDelayed && !isCancelled && !isDelivered && (
                <DelayApologyCard order={order} />
              )}

          {/* 4. Delivery Partner / Rider Card */}
          {isDelivery && !isCancelled && (
            <div className="mx-4 bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Delivery Partner Details
                </p>
                <span className="text-[10px] font-bold text-neutral-500">
                  {order?.porter_order_id ? 'Third-Party Partner' : 'In-House Fleet'}
                </span>
              </div>

              {/* Porter Third-Party */}
              {order?.porter_order_id ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shrink-0">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-black text-neutral-900 truncate">
                          {order.porter_rider_name || 'Porter Express Driver'}
                        </h3>
                        <span className="text-[9px] bg-orange-100 text-orange-700 font-black px-1.5 py-0.5 rounded uppercase shrink-0">
                          Porter
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        {order.porter_rider_vehicle || 'Two-Wheeler Partner'}
                      </p>
                      <p className="text-[10px] font-mono text-orange-600 font-bold">
                        Porter Ref: {order.porter_order_id?.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {order.porter_rider_phone ? (
                      <a
                        href={`tel:${order.porter_rider_phone}`}
                        className="flex-1 py-2.5 rounded-2xl bg-neutral-900 hover:bg-black text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition-transform"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Call Driver</span>
                      </a>
                    ) : (
                      <a
                        href={`tel:${RESTAURANT_PHONE}`}
                        className="flex-1 py-2.5 rounded-2xl bg-neutral-100 text-neutral-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Contact Support</span>
                      </a>
                    )}
                    {order.porter_tracking_url && (
                      <a
                        href={order.porter_tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition-transform"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Porter Live Map</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : order?.delivery_partner_name ? (
                /* In-House Personal Rider (from Admin Panel) */
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md text-white font-black text-lg shrink-0">
                      <Bike className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-black text-neutral-900 truncate">
                          {order.delivery_partner_name}
                        </h3>
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 font-black px-1.5 py-0.5 rounded uppercase shrink-0">
                          Official Rider
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        {order.delivery_partner_vehicle || 'Two-Wheeler Partner'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          4.9 Rating
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                          <Shield className="w-3 h-3" /> Sanitized Bag
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {order.delivery_partner_phone && (
                      <a
                        href={`tel:${order.delivery_partner_phone}`}
                        className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition-transform cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Rider</span>
                      </a>
                    )}
                    {order.delivery_partner_phone && (
                      <a
                        href={`https://wa.me/91${order.delivery_partner_phone.replace(/\D/g, '')}?text=Hi!%20I%20am%20tracking%20my%20Persian%20Darbar%20order.`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition-transform cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                /* Allocating Nearest Rider */
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md text-white font-black text-lg shrink-0">
                      <ChefHat className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-black text-neutral-900 truncate">
                          Allocating Delivery Partner
                        </h3>
                        <span className="text-[9px] bg-amber-100 text-amber-700 font-black px-1.5 py-0.5 rounded uppercase shrink-0">
                          In Kitchen
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                        Master chefs are currently preparing your royal feast. Our nearest fleet rider will be assigned upon kitchen dispatch.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Milestone Timeline */}
          {!isCancelled && (
            <div className="mx-4 bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-3">
                Live Order Journey
              </p>
              <div className="space-y-4">
                {MILESTONES.map((step, idx) => {
                  const isDone = milestoneIdx > idx;
                  const isCurrent = milestoneIdx === idx;
                  const isFuture = milestoneIdx < idx;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.key} className="flex gap-3 relative">
                      {idx < MILESTONES.length - 1 && (
                        <div
                          className={`absolute left-[17px] top-9 w-0.5 h-6 ${
                            isDone ? 'bg-[#E40000]' : 'bg-neutral-200'
                          }`}
                        />
                      )}
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 z-10 transition-all ${
                          isCurrent
                            ? 'bg-[#E40000] text-white shadow-md shadow-red-200 scale-105'
                            : isDone
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <StepIcon className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-neutral-500'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-xs font-black ${
                              isCurrent ? 'text-neutral-900' : isFuture ? 'text-neutral-400' : 'text-neutral-700'
                            }`}
                          >
                            {step.label}
                          </h4>
                          {isCurrent && (
                            <span className="text-[8px] font-black bg-red-50 text-[#E40000] border border-red-200 px-1.5 py-0.5 rounded-full uppercase animate-pulse">
                              LIVE
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] ${isFuture ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {step.sublabel}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Order Items & Total Summary */}
          {order && (
            <div className="mx-4 bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-400 block">
                    Order Summary
                  </span>
                  <span className="text-xs font-mono font-bold text-neutral-700">
                    #{String(order.order_id || propOrderId).slice(-10)}
                  </span>
                </div>
                <button
                  onClick={copyOrderId}
                  className="text-xs text-[#E40000] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>

              {/* Items preview */}
              <div className="space-y-1.5 text-xs text-neutral-700">
                {order.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="font-medium">
                      {it.quantity}x {it.name}
                    </span>
                    <span className="font-bold">&#8377;{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-black text-neutral-900">Total Bill</span>
                <span className="text-sm font-black text-[#E40000]">
                  &#8377;{order.total || order.subtotal || 0}
                </span>
              </div>
            </div>
          )}
        </>
      )}

          {/* 7. Help / Call Restaurant */}
          <div className="px-4 pt-1">
            <a
              href={`tel:${RESTAURANT_PHONE}`}
              className="w-full bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4 text-neutral-500" />
              <span>Need Help? Call Persian Darbar (020-26131976)</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CustomerTrackOrder;
