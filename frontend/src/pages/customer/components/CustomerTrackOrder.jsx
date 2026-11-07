import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ChevronDown, Share2, RefreshCw, Phone, Bike, ChefHat,
  CheckCircle2, Clock, Package, Zap, ExternalLink,
  MessageCircle, Star, Shield, Copy, AlertCircle,
  AlertTriangle, X, ChevronUp
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import API_BASE from '../../../lib/config';
import CustomerDeliveryMap from './CustomerDeliveryMap';

// ── Calculation Constants (Internal only - never shown to user) ──────────
const PREP_TIME_MINS = 15;
const MINS_PER_KM = 3;
const RESTAURANT_PHONE = '+919594287868';

const CANCEL_REASONS = [
  'Ordered by mistake',
  'Want to change items or add drinks/naan',
  'Incorrect delivery address',
  'Estimated delivery time is too long',
  'Other reason'
];

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
  } catch (e) { }
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [customReason, setCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
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
  const canCancel = !isCancelled && !isDelivered && ['placed', 'accepted'].includes(order?.status);

  // Discreet cancel order handler
  const handleConfirmCancel = async () => {
    if (!order?.order_id) return;
    setCancelling(true);
    const finalReason = cancelReason === 'Other reason' && customReason.trim() ? customReason.trim() : cancelReason;
    try {
      const res = await fetch(`${API_BASE}/api/orders/${order.order_id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: finalReason || 'Cancelled by customer' })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Could not cancel order');
      }
      setShowCancelModal(false);
      fetchOrder(order.order_id, false);
    } catch (err) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  // Native share or clipboard
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Track Persian Darbar Order',
        text: `Track my Persian Darbar order #${String(order?.order_id || propOrderId).slice(-6)} live!`,
        url,
      }).catch(() => { });
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
    <div className="fixed inset-0 z-[100] flex flex-col items-center select-none overflow-hidden animate-in fade-in duration-200 bg-black">
      <div className="w-full max-w-[430px] md:max-w-3xl lg:max-w-4xl h-full flex flex-col relative overflow-hidden md:border-x md:border-neutral-800/50 shadow-2xl">

        {/* ═══ FULL-SCREEN MAP (Swiggy-style top 60%) ═══ */}
        <div className="relative flex-1 min-h-0">

          {/* Map takes full top area */}
          {isDelivery && !isCancelled ? (
            <CustomerDeliveryMap
              order={order}
              eta={eta}
              isExpanded={isMapExpanded}
              onToggleExpand={() => setIsMapExpanded(prev => !prev)}
            />
          ) : (
            <div className="w-full h-full bg-[#F2EDE4] flex items-center justify-center">
              <Package className="w-10 h-10 text-neutral-300" />
            </div>
          )}

          {/* Top glassmorphism bar — overlaid on map */}
          <div
            className="absolute top-0 left-0 right-0 z-30 px-4 flex items-center justify-between"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)', paddingBottom: '10px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)' }}
          >
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-90 transition-all cursor-pointer border border-white/20"
              aria-label="Close"
            >
              <ChevronDown className="w-5 h-5 text-white" />
            </button>

            <div className="text-center">
              <p className="text-[11px] font-semibold text-white/70 tracking-widest uppercase">Order from</p>
              <h2 className="text-sm font-black text-white tracking-wide leading-tight">Persian Darbar</h2>
            </div>

            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-90 transition-all cursor-pointer border border-white/20"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* iOS Dynamic Island live pill */}
          {platform === 'ios' && !isCancelled && !isDelivered && (
            <div
              className="absolute left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-full bg-black flex items-center gap-3 shadow-2xl"
              style={{ top: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-black text-white text-[12px] tracking-tight lowercase italic">persian darbar</span>
              <span className="text-[11px] font-black text-amber-300">
                {eta?.isDelayed ? 'Late' : `${eta?.minsRemaining || '--'}m`}
              </span>
            </div>
          )}
        </div>

        {/* ═══ BOTTOM SHEET (Swiggy-style slide-up panel) ═══ */}
        <div
          className="relative bg-white z-20 flex flex-col transition-all duration-300 ease-in-out"
          style={{
            borderRadius: '24px 24px 0 0',
            marginTop: '-24px',
            boxShadow: '0 -6px 28px rgba(0,0,0,0.12)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            maxHeight: isMapExpanded ? '150px' : '52vh',
            minHeight: isMapExpanded ? '140px' : '280px',
            overflowY: isMapExpanded ? 'hidden' : 'auto',
          }}
        >
          {/* Interactive Drag handle / Map toggle */}
          <button
            type="button"
            onClick={() => setIsMapExpanded(prev => !prev)}
            className="w-full flex flex-col items-center justify-center pt-2.5 pb-1 shrink-0 cursor-pointer group"
            aria-label={isMapExpanded ? 'Show order details' : 'Expand map view'}
          >
            <div className="w-10 h-1 rounded-full bg-neutral-300 group-hover:bg-neutral-400 transition-colors" />
            <span className="text-[10px] font-semibold text-neutral-400 mt-1 flex items-center gap-1">
              {isMapExpanded ? (
                <><span>Show Order Details</span><ChevronUp className="w-3 h-3" /></>
              ) : (
                <><span>Tap for Full Map</span><ChevronDown className="w-3 h-3" /></>
              )}
            </span>
          </button>

          {/* ── Delivery status hero row ── */}
          {!isCancelled && !isDelivered && (
            <div className="px-5 pt-1 pb-3 flex items-start justify-between gap-3 shrink-0">
              <div className="flex-1 min-w-0">
                <h1 className="text-[20px] font-black text-neutral-900 leading-tight tracking-tight">
                  {getStatusHeadline()}
                </h1>
                {(order?.delivery_partner_name || order?.porter_rider_name) ? (
                  <p className="text-xs text-neutral-600 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                    <span>{order.delivery_partner_name || order.porter_rider_name} is on the way</span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                      Live GPS
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500 mt-0.5">Kitchen preparing your feast</p>
                )}
                {eta && !eta.isDelayed && (
                  <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    {eta.etaPillText}
                    {eta.distKm ? ` · ${eta.distKm} km` : ''}
                  </p>
                )}
                {eta?.isDelayed && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Running a little behind schedule
                  </p>
                )}
              </div>

              {/* ETA badge — Swiggy-style green badge */}
              {eta && !eta.isDelayed && (
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-emerald-600 flex flex-col items-center justify-center shadow-md">
                  <span className="text-2xl font-black text-white leading-none">{eta.minsRemaining || '--'}</span>
                  <span className="text-[9px] font-bold text-emerald-100 uppercase tracking-wider mt-0.5">mins</span>
                </div>
              )}
              {eta?.isDelayed && (
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-amber-500 flex flex-col items-center justify-center shadow-md">
                  <Clock className="w-6 h-6 text-white" />
                  <span className="text-[9px] font-bold text-amber-100 uppercase tracking-wider mt-1">Late</span>
                </div>
              )}
            </div>
          )}

          {/* Delivered hero */}
          {isDelivered && (
            <div className="px-5 pt-3 pb-4 flex items-center gap-3 shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-black text-neutral-900">Order Delivered</h1>
                <p className="text-xs text-neutral-500 mt-0.5">Your feast has arrived. Enjoy!</p>
              </div>
            </div>
          )}

          {/* Cancelled hero */}
          {isCancelled && (
            <div className="px-5 pt-3 pb-4 flex items-center gap-3 shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-black text-neutral-900">Order Cancelled</h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {order?.cancellation_reason || 'This order has been cancelled.'}
                </p>
              </div>
            </div>
          )}

          {/* ── Thin divider ── */}
          <div className="h-px bg-neutral-100 mx-5 shrink-0" />

          {/* ── Scrollable content ── */}
          <div className="flex-1 overflow-y-auto no-scrollbar">

            {/* Delay apology block */}
            {eta?.isDelayed && !isCancelled && !isDelivered && (
              <div className="mx-5 mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                  We sincerely apologize for the delay. Your feast is being prepared with care and your rider is on the way.
                </p>
                <a
                  href={`tel:${RESTAURANT_PHONE}`}
                  className="mt-3 w-full py-2.5 rounded-xl bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Contact Restaurant Support
                </a>
              </div>
            )}

            {/* Delivery partner card */}
            {isDelivery && !isCancelled && (
              <div className="px-5 mt-4">
                {order?.porter_order_id ? (
                  /* Porter partner */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-orange-100 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-neutral-900">
                          {order.porter_rider_name || 'Porter Express Driver'}
                        </p>
                        <p className="text-[11px] text-neutral-500">{order.porter_rider_vehicle || 'Two-Wheeler Partner'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.porter_rider_phone && (
                        <a href={`tel:${order.porter_rider_phone}`} className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center cursor-pointer active:scale-90 transition-all">
                          <Phone className="w-4 h-4 text-white" />
                        </a>
                      )}
                      {order.porter_tracking_url && (
                        <a href={order.porter_tracking_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center cursor-pointer active:scale-90 transition-all">
                          <ExternalLink className="w-4 h-4 text-white" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : order?.delivery_partner_name ? (
                  /* In-house rider */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center font-black text-lg text-emerald-700">
                        {order.delivery_partner_name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-black text-neutral-900">{order.delivery_partner_name}</p>
                          <span className="text-[8px] bg-emerald-100 text-emerald-700 font-black px-1.5 py-0.5 rounded uppercase">Official</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            4.9
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                            <Shield className="w-3 h-3" /> Sanitized
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.delivery_partner_phone && (
                        <>
                          <a href={`tel:${order.delivery_partner_phone}`} className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center cursor-pointer active:scale-90 transition-all">
                            <Phone className="w-4 h-4 text-white" />
                          </a>
                          <a
                            href={`https://wa.me/91${order.delivery_partner_phone.replace(/\D/g, '')}?text=Hi!%20I%20am%20tracking%20my%20Persian%20Darbar%20order.`}
                            target="_blank" rel="noreferrer"
                            className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center cursor-pointer active:scale-90 transition-all"
                          >
                            <MessageCircle className="w-4 h-4 text-white fill-current" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Allocating rider */
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-neutral-900">Allocating Delivery Partner</p>
                      <p className="text-[11px] text-neutral-500">Master chefs are preparing your feast</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add delivery instructions row */}
            {!isCancelled && !isDelivered && (
              <div className="mx-5 mt-4 py-3 border-t border-b border-neutral-100 flex items-center gap-3 cursor-pointer">
                <div className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center shrink-0">
                  <span className="text-neutral-500 text-sm font-bold leading-none">+</span>
                </div>
                <p className="text-xs font-semibold text-neutral-600">Add delivery instructions</p>
              </div>
            )}

            {/* Milestone progress bar — horizontal Swiggy-style */}
            {!isCancelled && (
              <div className="px-5 mt-5">
                <div className="relative">
                  {/* Track line */}
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-100" />
                  <div
                    className="absolute top-4 left-4 h-0.5 bg-[#E40000] transition-all duration-700"
                    style={{ width: `${Math.max(0, (milestoneIdx / (MILESTONES.length - 1)) * 100)}%`, right: 'auto' }}
                  />
                  {/* Steps */}
                  <div className="relative flex justify-between">
                    {MILESTONES.map((step, idx) => {
                      const isDone = milestoneIdx > idx;
                      const isCurrent = milestoneIdx === idx;
                      const isFuture = milestoneIdx < idx;
                      const StepIcon = step.icon;
                      return (
                        <div key={step.key} className="flex flex-col items-center gap-1.5" style={{ width: `${100 / MILESTONES.length}%` }}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isCurrent ? 'bg-[#E40000] shadow-md shadow-red-200 scale-110'
                              : isDone ? 'bg-emerald-500'
                                : 'bg-neutral-100'
                            }`}>
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            ) : (
                              <StepIcon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-neutral-400'}`} />
                            )}
                          </div>
                          <p className={`text-[9px] font-bold text-center leading-tight ${isFuture ? 'text-neutral-300' : isCurrent ? 'text-[#E40000]' : 'text-neutral-600'}`}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Android status pill */}
            {platform === 'android' && !isCancelled && !isDelivered && (
              <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-[#1F2937] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#E40000] flex items-center justify-center">
                    <ChefHat className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{getStatusHeadline()}</p>
                    <p className="text-[11px] text-emerald-400">
                      {eta && !eta.isDelayed ? `Arriving in ${eta.minsRemaining} mins` : 'Arriving soon'}
                    </p>
                  </div>
                </div>
                <div className="w-24 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.round(((milestoneIdx + 1) / 4) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Order summary */}
            {order && (
              <div className="mx-5 mt-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Order Summary</p>
                    <p className="text-xs font-mono font-bold text-neutral-700 mt-0.5">
                      #{String(order.order_id || propOrderId).slice(-10)}
                    </p>
                  </div>
                  <button onClick={copyOrderId} className="text-xs text-[#E40000] font-bold flex items-center gap-1 cursor-pointer">
                    <Copy className="w-3 h-3" />
                    {copied ? 'Copied!' : 'Copy ID'}
                  </button>
                </div>
                <div className="space-y-1.5 text-xs text-neutral-700">
                  {order.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="font-medium">{it.quantity}x {it.name}</span>
                      <span className="font-bold">&#8377;{it.price * it.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2.5 mt-2.5 border-t border-neutral-200 flex items-center justify-between">
                  <span className="text-xs font-black text-neutral-900">Total Bill</span>
                  <span className="text-sm font-black text-[#E40000]">&#8377;{order.total || order.subtotal || 0}</span>
                </div>
              </div>
            )}

            {/* Delivered celebration */}
            {(isDelivered || showDelivered) && !isCancelled && (
              <div className="mx-5 mt-4">
                <DeliveredScreen order={order} onGoHome={onGoHome || onClose} />
              </div>
            )}

            {/* Call restaurant */}
            <div className="px-5 mt-4">
              <a
                href={`tel:${RESTAURANT_PHONE}`}
                className="w-full bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Phone className="w-4 h-4 text-neutral-500" />
                Need Help? Call Persian Darbar
              </a>
            </div>

            {/* Cancel link */}
            {canCancel && (
              <div className="px-5 py-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="text-xs text-neutral-400 hover:text-red-600 font-semibold underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Need to cancel order?
                </button>
              </div>
            )}

            <div className="h-6" />
          </div>
        </div>
      </div>

      {/* ═══ Cancellation Modal ═══ */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-black text-neutral-900">Cancel Order</h3>
              </div>
              <button onClick={() => setShowCancelModal(false)} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4 text-neutral-600" />
              </button>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to cancel this order? Once cancelled, preparation will be halted immediately.
            </p>
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold text-neutral-500 uppercase tracking-wider">Please select reason:</label>
              {CANCEL_REASONS.map((reason) => (
                <label
                  key={reason}
                  onClick={() => setCancelReason(reason)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${cancelReason === reason ? 'border-red-500 bg-red-50/60 text-red-900' : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                >
                  <input type="radio" name="cancelReason" checked={cancelReason === reason} onChange={() => setCancelReason(reason)} className="accent-red-600" />
                  <span>{reason}</span>
                </label>
              ))}
              {cancelReason === 'Other reason' && (
                <textarea rows={2} value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Explain reason for cancellation..." className="w-full mt-2 p-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button type="button" onClick={() => setShowCancelModal(false)} className="py-3 px-4 rounded-xl border border-neutral-300 font-bold text-xs text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer">
                Keep Order
              </button>
              <button type="button" onClick={handleConfirmCancel} disabled={cancelling} className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer">
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerTrackOrder;
