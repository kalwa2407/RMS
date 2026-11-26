import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronDown, ChevronLeft, Share2, Phone, Bike, ChefHat,
  CheckCircle2, Clock, Package, ExternalLink,
  MessageCircle, Copy, AlertCircle, X, Check, Store
} from 'lucide-react';
import API_BASE from '../../../lib/config';
import CustomerDeliveryMap from './CustomerDeliveryMap';
import { cx, formatINR } from '../ui';
import { useCustomerAuth } from '../../../context/CustomerAuthContext';

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
  { key: 'placed', label: 'Placed' },
  { key: 'kitchen', label: 'Preparing' },
  { key: 'dispatched', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' },
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

  let isDelayed = false;
  if (orderPlacedAt) {
    const placedTime = new Date(orderPlacedAt).getTime();
    const elapsedMins = (Date.now() - placedTime) / 60000;
    if (elapsedMins > totalFormulaMins) {
      isDelayed = true;
      minsRemaining = 0;
    }
  }

  const etaPillText = isDelayed ? 'Running a bit late' : `Arriving in ${minsRemaining} mins`;
  return { minsRemaining, etaPillText, distKm, totalFormulaMins, isDelayed };
}

const CircleButton = ({ onClick, label, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={cx('w-11 h-11 rounded-full bg-white shadow-pd-2 flex items-center justify-center text-pd-ink pd-press', className)}
  >
    {children}
  </button>
);

// ── Order items card (used in tracking + delivered) ──
const OrderDetailsCard = ({ order, fallbackId, copied, onCopy }) => (
  <section className="mx-4 mt-3 rounded-[18px] bg-pd-surface p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[15px] font-semibold text-pd-ink">Order details</p>
        <p className="text-[12px] text-pd-ink-3 mt-0.5 pd-tabular">
          #{String(order?.order_id || fallbackId).slice(-10)}
        </p>
      </div>
      {onCopy && (
        <button type="button" onClick={onCopy} className="h-8 px-3 rounded-full bg-white text-[13px] font-medium text-pd-ink flex items-center gap-1.5 pd-press">
          {copied ? <Check className="w-3.5 h-3.5 text-pd-success" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy ID'}
        </button>
      )}
    </div>
    <ul className="mt-3 space-y-2">
      {order?.items?.map((it, idx) => (
        <li key={idx} className="flex justify-between gap-3 text-[14px]">
          <span className="text-pd-ink-2"><span className="text-pd-ink font-medium pd-tabular">{it.quantity} ×</span> {it.name}</span>
          <span className="text-pd-ink pd-tabular shrink-0">{formatINR(it.price * it.quantity)}</span>
        </li>
      ))}
    </ul>
    <div className="mt-3 pt-3 border-t border-black/[0.06] flex items-center justify-between">
      <span className="text-[15px] font-semibold text-pd-ink">Total</span>
      <span className="text-[16px] font-bold text-pd-ink pd-tabular">{formatINR(order?.total || order?.subtotal || 0)}</span>
    </div>
  </section>
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
  const { fetchWithAuth } = useCustomerAuth();
  const pollingRef = useRef(null);
  const autoCloseTimerRef = useRef(null);

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

      if (data.status === 'delivered') {
        setShowDelivered(true);
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

  // Live polling every 6-10 seconds for active orders
  useEffect(() => {
    if (!order) return undefined;
    if (['delivered', 'cancelled', 'rejected'].includes(order.status)) {
      clearInterval(pollingRef.current);
      return undefined;
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
  const riderName = order?.porter_order_id ? (order.porter_rider_name || 'Porter partner') : order?.delivery_partner_name;
  const riderPhone = order?.porter_order_id ? order?.porter_rider_phone : order?.delivery_partner_phone;

  const handleConfirmCancel = async () => {
    if (!order?.order_id) return;
    setCancelling(true);
    const finalReason = cancelReason === 'Other reason' && customReason.trim() ? customReason.trim() : cancelReason;
    try {
      // Authenticated: the server only lets the customer who placed the order cancel it
      const res = await fetchWithAuth(`${API_BASE}/api/orders/${order.order_id}/cancel`, {
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

  // Headline + sub line for the sheet
  const getHeadline = () => {
    if (!order) return loading ? 'Loading your order…' : 'Tracking order';
    if (isCancelled) return 'Order cancelled';
    if (isDelivered) return 'Delivered';
    if (eta?.isDelayed) return 'Almost there';
    if (eta?.minsRemaining) {
      return isDelivery ? `Arriving in ${eta.minsRemaining} min` : `Ready in ${eta.minsRemaining} min`;
    }
    return 'Order placed';
  };
  const getSubline = () => {
    if (!order) return '';
    if (isCancelled) return order.cancellation_reason || 'This order has been cancelled.';
    switch (order.status) {
      case 'placed': return 'Waiting for the restaurant to confirm';
      case 'accepted':
      case 'preparing': return 'Your food is being prepared';
      case 'ready': return isDelivery ? 'Packed and waiting for pickup by the rider' : 'Ready for pickup at the outlet';
      case 'out_for_delivery': return riderName ? `${riderName.split(' ')[0]} is on the way with your order` : 'Your order is on the way';
      default: return '';
    }
  };

  const goHome = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    if (onGoHome) onGoHome();
    else if (onClose) onClose();
  };

  // ── Delivered screen ──
  if (showDelivered && isDelivered) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center animate-in fade-in duration-200">
        <div className="w-full max-w-[430px] md:max-w-xl h-full flex flex-col">
          <div className="px-4 flex items-center" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
            <button type="button" onClick={onClose} aria-label="Close" className="w-11 h-11 rounded-full flex items-center justify-center text-pd-ink pd-press">
              <X className="w-6 h-6" strokeWidth={2} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="flex flex-col items-center text-center px-8 pt-6 pb-4">
              <div className="w-20 h-20 rounded-full bg-[#EAF6EE] flex items-center justify-center animate-in zoom-in-50 duration-300">
                <CheckCircle2 className="w-10 h-10 text-pd-success" strokeWidth={2} />
              </div>
              <h1 className="mt-5 text-[26px] font-bold text-pd-ink tracking-[-0.01em]">Order delivered</h1>
              <p className="mt-1.5 text-[15px] text-pd-ink-2">Enjoy your meal from Persian Darbar.</p>
            </div>
            {order?.items && <OrderDetailsCard order={order} fallbackId={propOrderId} />}
          </div>
          <div className="px-4 pt-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
            <button type="button" onClick={goHome} className="w-full h-[52px] rounded-[14px] bg-pd-ink text-white text-[16px] font-semibold pd-press">
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showMap = isDelivery && !isCancelled;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center select-none overflow-hidden bg-[#F4F4F2] animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] md:max-w-3xl h-full flex flex-col relative overflow-hidden">

        {/* ═══ Map ═══ */}
        <div className="relative flex-1 min-h-0">
          {showMap ? (
            <CustomerDeliveryMap
              order={order}
              eta={eta}
              isExpanded={isMapExpanded}
              onToggleExpand={() => setIsMapExpanded(prev => !prev)}
              bottomInset={24}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white shadow-pd-1 flex items-center justify-center">
                {isCancelled ? <AlertCircle className="w-9 h-9 text-pd-error" /> : <Store className="w-9 h-9 text-pd-ink-2" strokeWidth={1.75} />}
              </div>
            </div>
          )}

          {/* Floating top controls */}
          <div
            className="absolute top-0 left-0 right-0 z-30 px-4 flex items-center justify-between pointer-events-none"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}
          >
            <CircleButton onClick={onClose} label="Close" className="pointer-events-auto">
              <ChevronLeft className="w-6 h-6" strokeWidth={2} />
            </CircleButton>
            <CircleButton onClick={handleShare} label="Share" className="pointer-events-auto">
              {copied ? <Check className="w-5 h-5 text-pd-success" /> : <Share2 className="w-5 h-5" strokeWidth={2} />}
            </CircleButton>
          </div>
        </div>

        {/* ═══ Bottom sheet ═══ */}
        <div
          className="relative bg-white z-20 flex flex-col rounded-t-[24px] -mt-6 shadow-[0_-8px_30px_rgba(14,26,32,0.10)] transition-[max-height] duration-300 ease-pd-out"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            maxHeight: isMapExpanded ? '196px' : '58vh',
            minHeight: '196px',
          }}
        >
          <button
            type="button"
            onClick={() => setIsMapExpanded(prev => !prev)}
            className="w-full pt-2.5 pb-1 flex justify-center shrink-0"
            aria-label={isMapExpanded ? 'Show order details' : 'Expand map'}
          >
            <span className="w-10 h-1.5 rounded-full bg-black/15" />
          </button>

          {/* Hero */}
          <div className="px-5 pt-2 pb-4 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-[24px] leading-[30px] font-bold text-pd-ink tracking-[-0.015em]">{getHeadline()}</h1>
                <p className="mt-1 text-[14px] text-pd-ink-2">{getSubline()}</p>
              </div>
              {refreshing && <span className="mt-2 w-2 h-2 rounded-full bg-pd-success animate-pulse shrink-0" aria-label="Updating" />}
            </div>

            {!isCancelled && (
              <div className="mt-4">
                <div className="flex gap-1.5" aria-hidden="true">
                  {MILESTONES.map((step, idx) => (
                    <span key={step.key} className="flex-1 h-1 rounded-full bg-black/[0.08] overflow-hidden">
                      <span
                        className={cx(
                          'block h-full rounded-full bg-pd-success transition-[width] duration-700 ease-pd-out',
                          idx === milestoneIdx && !isDelivered && 'animate-pulse'
                        )}
                        style={{ width: idx <= milestoneIdx ? '100%' : '0%' }}
                      />
                    </span>
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] font-medium text-pd-ink-3">
                  {MILESTONES.map((step, idx) => (
                    <span key={step.key} className={cx(idx === milestoneIdx && 'text-pd-ink')}>{step.label}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
            {eta?.isDelayed && !isCancelled && !isDelivered && (
              <section className="mx-4 rounded-[16px] bg-[#FFF5E5] p-4 flex gap-3">
                <Clock className="w-5 h-5 text-pd-warn shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-pd-ink">Taking a little longer than usual</p>
                  <p className="text-[13px] text-pd-ink-2 mt-0.5">Sorry about the wait. We are on it and your order will reach you shortly.</p>
                </div>
              </section>
            )}

            {/* Delivery partner */}
            {isDelivery && !isCancelled && (
              <section className="mx-4 mt-3 rounded-[16px] border border-[color:var(--pd-line)] p-4 flex items-center gap-3">
                {riderName ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-pd-surface flex items-center justify-center text-[18px] font-semibold text-pd-ink shrink-0">
                      {riderName[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-semibold text-pd-ink truncate">{riderName}</p>
                      <p className="text-[13px] text-pd-ink-2 truncate">
                        {order?.porter_order_id ? (order.porter_rider_vehicle || 'Two-wheeler') : 'Your delivery partner'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {order?.porter_order_id && order?.porter_tracking_url && (
                        <a href={order.porter_tracking_url} target="_blank" rel="noreferrer" aria-label="Open Porter tracking" className="w-11 h-11 rounded-full bg-pd-surface flex items-center justify-center text-pd-ink pd-press">
                          <ExternalLink className="w-5 h-5" strokeWidth={1.75} />
                        </a>
                      )}
                      {!order?.porter_order_id && riderPhone && (
                        <a
                          href={`https://wa.me/91${riderPhone.replace(/\D/g, '')}?text=Hi!%20I%20am%20tracking%20my%20Persian%20Darbar%20order.`}
                          target="_blank" rel="noreferrer"
                          aria-label="Message on WhatsApp"
                          className="w-11 h-11 rounded-full bg-pd-surface flex items-center justify-center text-pd-ink pd-press"
                        >
                          <MessageCircle className="w-5 h-5" strokeWidth={1.75} />
                        </a>
                      )}
                      {riderPhone && (
                        <a href={`tel:${riderPhone}`} aria-label="Call delivery partner" className="w-11 h-11 rounded-full bg-pd-success text-white flex items-center justify-center pd-press">
                          <Phone className="w-5 h-5" strokeWidth={2} />
                        </a>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-pd-surface flex items-center justify-center shrink-0">
                      {milestoneIdx >= 2 ? <Bike className="w-5 h-5 text-pd-ink-2" /> : <ChefHat className="w-5 h-5 text-pd-ink-2" strokeWidth={1.75} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-pd-ink">Assigning a delivery partner</p>
                      <p className="text-[13px] text-pd-ink-2">We will show their details here</p>
                    </div>
                  </>
                )}
              </section>
            )}

            {/* Pickup outlet */}
            {!isDelivery && !isCancelled && (
              <section className="mx-4 mt-3 rounded-[16px] border border-[color:var(--pd-line)] p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-pd-surface flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-pd-ink-2" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-pd-ink">Pickup order</p>
                  <p className="text-[13px] text-pd-ink-2">Show your order ID at the counter</p>
                </div>
              </section>
            )}

            {order && <OrderDetailsCard order={order} fallbackId={propOrderId} copied={copied} onCopy={copyOrderId} />}

            {/* Help + cancel */}
            <section className="mx-4 mt-3 rounded-[16px] border border-[color:var(--pd-line)] divide-y divide-[color:var(--pd-line)]">
              <a href={`tel:${RESTAURANT_PHONE}`} className="flex items-center gap-3 px-4 h-14 text-[15px] text-pd-ink pd-press">
                <Phone className="w-5 h-5 text-pd-ink-2" strokeWidth={1.75} />
                <span className="flex-1">Call Persian Darbar</span>
                <ChevronDown className="w-4 h-4 -rotate-90 text-pd-ink-3" />
              </a>
              {canCancel && (
                <button type="button" onClick={() => setShowCancelModal(true)} className="w-full flex items-center gap-3 px-4 h-14 text-[15px] text-pd-error pd-press">
                  <X className="w-5 h-5" strokeWidth={1.75} />
                  <span className="flex-1 text-left">Cancel order</span>
                </button>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* ═══ Cancellation sheet ═══ */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[120] bg-black/50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-[24px] px-5 pt-5 flex flex-col gap-4 animate-in slide-in-from-bottom duration-300"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-bold text-pd-ink">Cancel order?</h3>
              <button type="button" onClick={() => setShowCancelModal(false)} aria-label="Close" className="w-9 h-9 rounded-full bg-pd-surface flex items-center justify-center pd-press">
                <X className="w-[18px] h-[18px] text-pd-ink-2" />
              </button>
            </div>
            <p className="text-[14px] text-pd-ink-2 -mt-2">The kitchen will stop preparing it right away.</p>
            <div className="divide-y divide-[color:var(--pd-line)] border-y border-[color:var(--pd-line)]">
              {CANCEL_REASONS.map((reason) => (
                <label key={reason} className="flex items-center gap-3 h-12 text-[15px] text-pd-ink cursor-pointer">
                  <input type="radio" name="cancelReason" checked={cancelReason === reason} onChange={() => setCancelReason(reason)} className="w-5 h-5 accent-[#B4232F]" />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            {cancelReason === 'Other reason' && (
              <textarea rows={2} value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Tell us why" className="w-full p-3 rounded-[12px] bg-pd-surface text-[16px] focus:outline-none focus:ring-2 focus:ring-pd-action/30" />
            )}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button type="button" onClick={() => setShowCancelModal(false)} className="h-12 rounded-[12px] bg-pd-surface text-[15px] font-semibold text-pd-ink pd-press">
                Keep order
              </button>
              <button type="button" onClick={handleConfirmCancel} disabled={cancelling} className="h-12 rounded-[12px] bg-pd-error text-white text-[15px] font-semibold pd-press disabled:opacity-50">
                {cancelling ? 'Cancelling…' : 'Cancel order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerTrackOrder;
