import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronDown, Share2, RefreshCw, Phone, MapPin, Bike, ChefHat,
  CheckCircle2, Clock, Package, Home, Zap, ExternalLink,
  MessageCircle, Star, Shield, Maximize2, Minimize2, Copy, AlertCircle,
  Smartphone, Apple
} from 'lucide-react';
import API_BASE from '../../../lib/config';

// ── Calculation Constants (As Requested: 15 mins prep + 1 km = 3 mins) ──────
const PREP_TIME_MINS = 15; // Guaranteed kitchen preparation time
const MINS_PER_KM = 3;    // Delivery speed formula: 1km = 3 minutes
const RESTAURANT_PHONE = '02026131976';

// Status → milestone mapping
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
    sublabel: 'Confirmed & sent to royal kitchen',
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

// ── ETA Calculation Engine: 15 mins prep + distance * 3 min ────────────────
function calcETA(order) {
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

  const prepMins = PREP_TIME_MINS;
  const etaPillText = `Arriving in ${minsRemaining} mins`;

  return { minsRemaining, etaPillText, distKm, prepMins, deliveryMins, totalFormulaMins };
}

// ── Map View (Pixel-Matched to Screenshot 1: media_1792316474139.png) ────────
const GoogleStyleMapView = ({ order, eta, isExpanded, onToggleExpand }) => {
  const isOutForDelivery = ['out_for_delivery', 'ready'].includes(order?.status);
  const isDelivered = order?.status === 'delivered';
  const progress = isDelivered ? 1 : isOutForDelivery ? 0.65 : 0.08;

  // Approximate coordinate positions on 360x280 viewBox
  // Restaurant pin (Right side near Kondhwa Main Rd / Bhairoba Nala): x=305, y=148
  // Home pin (Left side near Abhinav Society / Uni Billboard): x=122, y=170
  // Bezier curve: M 305 148 Q 230 140 122 170

  // Rider position along curve based on progress
  const t = 1 - progress; // moves from restaurant (t=1, x=305) to home (t=0, x=122)
  const riderX = Math.round((1 - t) * 122 + t * 305);
  const riderY = Math.round((1 - t) * 170 + t * 148 - Math.sin(t * Math.PI) * 18);

  return (
    <div
      className={`relative w-full overflow-hidden transition-all duration-300 ${
        isExpanded ? 'h-[360px]' : 'h-[230px]'
      }`}
      style={{ backgroundColor: '#F0F2F5' }}
    >
      {/* ── Street Map Vector Canvas ── */}
      <svg
        className="w-full h-full select-none"
        viewBox="0 0 360 280"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Land Background */}
        <rect width="360" height="280" fill="#F4F5F7" />

        {/* City Blocks (Soft light-gray rectangles) */}
        <rect x="10" y="20" width="75" height="45" rx="3" fill="#E8EAED" />
        <rect x="95" y="15" width="80" height="35" rx="3" fill="#E8EAED" />
        <rect x="185" y="25" width="45" height="50" rx="3" fill="#E8EAED" />
        <rect x="15" y="75" width="90" height="40" rx="3" fill="#E8EAED" />
        <rect x="115" y="60" width="60" height="55" rx="3" fill="#E8EAED" />
        <rect x="15" y="125" width="70" height="35" rx="3" fill="#E8EAED" />
        <rect x="95" y="125" width="55" height="30" rx="3" fill="#E8EAED" />
        <rect x="15" y="170" width="65" height="50" rx="3" fill="#E8EAED" />
        <rect x="90" y="190" width="55" height="40" rx="3" fill="#E8EAED" />
        <rect x="155" y="175" width="50" height="60" rx="3" fill="#E8EAED" />
        <rect x="290" y="30" width="60" height="60" rx="3" fill="#E8EAED" />
        <rect x="295" y="105" width="55" height="50" rx="3" fill="#E8EAED" />
        <rect x="290" y="180" width="60" height="70" rx="3" fill="#E8EAED" />

        {/* Bhairoba Nala River / Water Body (Cyan-blue curving river) */}
        <path
          d="M 330 0 C 300 45 250 85 242 145 C 235 195 285 240 280 280"
          fill="none"
          stroke="#A8D5F2"
          strokeWidth="11"
          strokeLinecap="round"
        />
        {/* River Label */}
        <text
          x="285"
          y="235"
          transform="rotate(82 285 235)"
          fontSize="6.5"
          fill="#4A90E2"
          fontFamily="system-ui, sans-serif"
          fontWeight="500"
          letterSpacing="0.5"
        >
          Bhairoba Nala
        </text>

        {/* Kondhwa Main Road (Main vertical street line) */}
        <line x1="240" y1="0" x2="215" y2="280" stroke="#FFFFFF" strokeWidth="10" />
        <line x1="240" y1="0" x2="215" y2="280" stroke="#D1D5DB" strokeWidth="1.5" />
        <text
          x="234"
          y="70"
          transform="rotate(95 234 70)"
          fontSize="6.5"
          fill="#6B7280"
          fontFamily="system-ui, sans-serif"
          fontWeight="600"
        >
          Kondhwa Main Rd
        </text>

        {/* Cross Streets & Avenues */}
        <path d="M 0 170 Q 150 170 360 148" fill="none" stroke="#FFFFFF" strokeWidth="8" />
        <path d="M 0 170 Q 150 170 360 148" fill="none" stroke="#E5E7EB" strokeWidth="1.5" />

        <line x1="0" y1="120" x2="240" y2="120" stroke="#FFFFFF" strokeWidth="6" />
        <line x1="0" y1="70" x2="240" y2="70" stroke="#FFFFFF" strokeWidth="6" />
        <line x1="110" y1="0" x2="110" y2="280" stroke="#FFFFFF" strokeWidth="6" />
        <line x1="180" y1="0" x2="180" y2="280" stroke="#FFFFFF" strokeWidth="5" />

        {/* Abhinav Society Locality Hindi Text (Screenshot 1 match) */}
        <text
          x="120"
          y="48"
          fontSize="7"
          fill="#9CA3AF"
          fontFamily="system-ui, sans-serif"
          fontWeight="500"
        >
          अभिनव
        </text>
        <text
          x="118"
          y="57"
          fontSize="7"
          fill="#9CA3AF"
          fontFamily="system-ui, sans-serif"
          fontWeight="500"
        >
          सोसायटी
        </text>

        {/* Uni Billboard (Screenshot 1 Match: Black billboard with UNI text) */}
        <g transform="translate(35, 175)">
          <rect x="0" y="0" width="52" height="26" rx="4" fill="#0A0A0A" />
          <rect x="1" y="1" width="50" height="24" rx="3" fill="#141414" stroke="#333" strokeWidth="0.5" />
          <text x="7" y="18" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.5">
            uni
          </text>
          <circle cx="43" cy="14" r="2.5" fill="#00D2A0" />
          {/* Billboard legs */}
          <line x1="12" y1="26" x2="12" y2="34" stroke="#555" strokeWidth="2.5" />
          <line x1="40" y1="26" x2="40" y2="34" stroke="#555" strokeWidth="2.5" />
        </g>

        {/* ── Curved Dashed Delivery Route Line (Screenshot 1 Match) ── */}
        <path
          d="M 305 148 Q 215 140 122 170"
          fill="none"
          stroke="#1F2937"
          strokeWidth="2.8"
          strokeDasharray="6 4"
          strokeLinecap="round"
        />

        {/* Route Progress Colored Accent */}
        <path
          d="M 305 148 Q 215 140 122 170"
          fill="none"
          stroke="#E40000"
          strokeWidth="2.8"
          strokeDasharray={`${progress * 200} 300`}
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* ── Restaurant Pin (Black circular teardrop with cutlery) ── */}
        <g transform="translate(305, 148)">
          {/* Teardrop background */}
          <path
            d="M 0 0 C -7 -14 -12 -18 -12 -25 A 12 12 0 1 1 12 -25 C 12 -18 7 -14 0 0 Z"
            fill="#111827"
          />
          <circle cx="0" cy="-25" r="9.5" fill="#111827" />
          {/* Fork & Spoon cutlery icon */}
          <path
            d="M -3 -29 v 5 c 0 0.8 0.6 1.4 1.4 1.4 v 6 h 1.2 v -6 c 0.8 0 1.4 -0.6 1.4 -1.4 v -5 h -0.8 v 3.5 h -0.6 v -3.5 h -0.8 v 3.5 h -0.6 v -3.5 z M 3 -29 c -1.2 0 -2 1 -2 2.5 v 3.5 h 1.2 v 6 h 1.2 v -12 z"
            fill="#FFFFFF"
          />
          {/* Shadow pin dot */}
          <ellipse cx="0" cy="1" rx="4" ry="1.5" fill="#000000" opacity="0.3" />
        </g>

        {/* ── Home Destination Pin (Black circular teardrop with house) ── */}
        <g transform="translate(122, 170)">
          <path
            d="M 0 0 C -7 -14 -12 -18 -12 -25 A 12 12 0 1 1 12 -25 C 12 -18 7 -14 0 0 Z"
            fill="#111827"
          />
          <circle cx="0" cy="-25" r="9.5" fill="#111827" />
          {/* House icon */}
          <path
            d="M 0 -29 L -5.5 -24 h 1.8 v 6.5 h 7.4 v -6.5 h 1.8 z"
            fill="#FFFFFF"
          />
          <ellipse cx="0" cy="1" rx="4" ry="1.5" fill="#000000" opacity="0.3" />
        </g>

        {/* ── Rider Bike Pin (Animated along route) ── */}
        {isOutForDelivery && (
          <g transform={`translate(${riderX}, ${riderY - 14})`}>
            <circle cx="0" cy="0" r="14" fill="#FFFFFF" stroke="#E40000" strokeWidth="2.5" />
            <path
              d="M -6 4 a 3 3 0 1 0 0 -6 a 3 3 0 0 0 0 6 z m 12 0 a 3 3 0 1 0 0 -6 a 3 3 0 0 0 0 6 z M 0 -5 h 3 l 3 5 h -4 z M -3 2 h 6 v -1.5 H -3 z"
              fill="#E40000"
            />
            <circle cx="9" cy="-9" r="3.5" fill="#10B981" />
          </g>
        )}

        {/* ── Google Watermark Logo (Bottom Left of Map) ── */}
        <g transform="translate(10, 260)">
          <text
            x="0"
            y="0"
            fontFamily="Product Sans, Roboto, sans-serif"
            fontWeight="bold"
            fontSize="13"
            letterSpacing="-0.5"
            fill="#757575"
          >
            Google
          </text>
        </g>
      </svg>

      {/* ── Map Expand / Recenter Button (Top Right of Map) ── */}
      <button
        onClick={onToggleExpand}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 text-neutral-700 shadow-md flex items-center justify-center active:scale-90 transition-all cursor-pointer border border-neutral-200"
        title={isExpanded ? 'Collapse Map' : 'Expand Map'}
      >
        {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* Live Distance Pill on Map */}
      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-neutral-200 flex items-center gap-1.5 text-[10px] font-black text-neutral-800">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span>{eta?.distKm || 3.5} km from you</span>
      </div>
    </div>
  );
};

// ── Main CustomerTrackOrder Component ───────────────────────────────────────
const CustomerTrackOrder = ({ orderId: propOrderId, onClose, onGoHome }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  // OS Simulator toggle: 'ios' (Dynamic Island Screenshot 2) vs 'android' (Material Notification)
  const [osMode, setOsMode] = useState('ios');
  const pollingRef = useRef(null);

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
    } catch (err) {
      // Keep existing data
    } finally {
      if (!silent) setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (propOrderId) fetchOrder(propOrderId);
  }, [propOrderId, fetchOrder]);

  // Live polling every 10 seconds for active orders
  useEffect(() => {
    if (!order) return;
    if (['delivered', 'cancelled', 'rejected'].includes(order.status)) {
      clearInterval(pollingRef.current);
      return;
    }
    pollingRef.current = setInterval(() => fetchOrder(order.order_id, true), 10000);
    return () => clearInterval(pollingRef.current);
  }, [order, fetchOrder]);

  const eta = calcETA(order);
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
        text: `Track my royal Persian Darbar feast #${String(order?.order_id || propOrderId).slice(-6)} live!`,
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

  // Status title matching Screenshot 1
  const getStatusHeadline = () => {
    if (!order) return 'Tracking Order';
    if (order.status === 'delivered') return 'Order Delivered';
    if (order.status === 'out_for_delivery') return 'Out for Delivery';
    if (order.status === 'ready') return 'Order Ready for Pickup';
    if (order.status === 'preparing' || order.status === 'accepted') return 'Preparing your order';
    if (isCancelled) return 'Order cancelled';
    return 'Order placed';
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex flex-col items-center select-none overflow-hidden animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] h-full flex flex-col bg-[#F8F9FA] shadow-2xl relative overflow-hidden">

        {/* ══════════════════════════════════════════════════════════════════
            HEADER (EXACT PIXEL REPLICA OF SCREENSHOT 1: media_1792316474139.png)
            Dark Navy Blue #151E33 with ChevronDown, Title, Arriving Pill & Share
           ══════════════════════════════════════════════════════════════════ */}
        <header
          className="shrink-0 px-4 pb-4 text-white relative shadow-md"
          style={{
            backgroundColor: '#151E33',
            paddingTop: 'calc(max(env(safe-area-inset-top, 50px), 50px) + 8px)'
          }}
        >
          {/* Row 1: Back Chevron · Restaurant Name · Share Button */}
          <div className="flex items-center justify-between">
            {/* Dismiss button (ChevronDown inside circle) */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-90 transition-all cursor-pointer border border-white/10"
              aria-label="Dismiss tracking"
            >
              <ChevronDown className="w-5 h-5 text-white" />
            </button>

            {/* Restaurant Name */}
            <div className="text-center">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Persian Darbar
              </h2>
              <p className="text-[10px] text-white/60">Camp, Pune Flagship</p>
            </div>

            {/* Share button (Share2 inside circle) */}
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-90 transition-all cursor-pointer border border-white/10"
              aria-label="Share tracking"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Row 2: Big Bold Status Title (Screenshot 1: "Preparing your order") */}
          <div className="mt-4 text-center">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              {getStatusHeadline()}
            </h1>
          </div>

          {/* Row 3: Dark Arriving Pill + Refresh Button (Screenshot 1 Match) */}
          {eta && !isCancelled && !isDelivered && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="bg-[#242F48] border border-white/10 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-inner flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
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

        {/* ══════════════════════════════════════════════════════════════════
            SCROLLABLE CONTENT AREA
           ══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-8 space-y-3">

          {/* 1. Map View (Screenshot 1 Style) */}
          {isDelivery && !isCancelled && (
            <GoogleStyleMapView
              order={order}
              eta={eta}
              isExpanded={isMapExpanded}
              onToggleExpand={() => setIsMapExpanded(prev => !prev)}
            />
          )}

          {/* 2. OS Experience Mode Switcher (iOS Dynamic Island vs Android Live Status) */}
          <div className="px-4 pt-1">
            <div className="bg-white rounded-2xl p-1.5 border border-neutral-200 flex items-center justify-between shadow-xs">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-2">
                Live Island View:
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setOsMode('ios')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    osMode === 'ios'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Apple className="w-3.5 h-3.5" />
                  <span>iOS Dynamic Island</span>
                </button>
                <button
                  onClick={() => setOsMode('android')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    osMode === 'android'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Android Material</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. iOS Dynamic Island Live Activity Preview (Screenshot 2 Replica) */}
          {osMode === 'ios' && !isCancelled && (
            <div className="mx-4 p-3.5 rounded-3xl bg-black text-white shadow-xl border border-white/10 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black lowercase tracking-tight font-sans text-amber-300">
                    persian darbar
                  </span>
                  <span className="text-[10px] text-white/50">· Dynamic Island</span>
                </div>
                {/* Timer ring (Screenshot 2 match) */}
                <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-white">
                  <span>{eta?.minsRemaining || 18}m</span>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs text-white/80">
                <span>{getStatusHeadline()}</span>
                <span className="text-[11px] text-amber-300 font-bold">
                  {eta?.distKm || 3.5} km away
                </span>
              </div>
            </div>
          )}

          {/* Android Material You Live Status Card */}
          {osMode === 'android' && !isCancelled && (
            <div className="mx-4 p-3.5 rounded-3xl bg-[#1F2937] text-white shadow-lg border border-neutral-700 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#E40000] flex items-center justify-center text-white text-xs">
                    <ChefHat className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Persian Darbar Express</h3>
                    <p className="text-[11px] text-emerald-400 font-medium">
                      {getStatusHeadline()} · {eta?.minsRemaining || 18} mins
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-300 bg-white/10 px-2.5 py-1 rounded-xl">
                  ~{eta?.minsRemaining || 18}m
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

          {/* 4. Exact ETA Formula Breakdown Card (15 mins prep + 1 km = 3 mins) */}
          {eta && !isCancelled && (
            <div className="mx-4 bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Estimated Delivery Calculation
                </p>
                <span className="text-[10px] font-bold text-neutral-500">
                  Formula: 15m + (1km × 3m)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2">
                  <ChefHat className="w-4 h-4 text-amber-700 mx-auto mb-1" />
                  <p className="text-xs font-black text-amber-900">{PREP_TIME_MINS} mins</p>
                  <p className="text-[9px] text-amber-700">Kitchen Prep</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-2">
                  <Bike className="w-4 h-4 text-blue-700 mx-auto mb-1" />
                  <p className="text-xs font-black text-blue-900">~{eta.deliveryMins} mins</p>
                  <p className="text-[9px] text-blue-700">{eta.distKm} km × 3 min</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2">
                  <Clock className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
                  <p className="text-xs font-black text-emerald-900">~{eta.totalFormulaMins} mins</p>
                  <p className="text-[9px] text-emerald-700">Total ETA</p>
                </div>
              </div>
            </div>
          )}

          {/* 5. Delivery Partner / Rider Card (Personal Rider vs Porter Rider) */}
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

              {/* Porter Third-Party Partner Rider */}
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
                /* Persian Darbar In-House Personal Rider (Created & Assigned from Admin Panel) */
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
                /* Kitchen Preparing: Allocating Nearest Rider */
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

          {/* 6. Milestone Timeline */}
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

          {/* 7. Order Items & Total Summary */}
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
                    <span className="font-bold">₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-black text-neutral-900">Total Bill</span>
                <span className="text-sm font-black text-[#E40000]">
                  ₹{order.total || order.subtotal || 0}
                </span>
              </div>
            </div>
          )}

          {/* 8. Help / Call Restaurant */}
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
