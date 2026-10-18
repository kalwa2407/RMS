import React, { useState, useMemo } from 'react';
import { Clock, Bike, ChefHat, Phone, ChevronRight, X, ExternalLink } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

/**
 * CustomerDynamicIsland
 * Auto-detects iOS vs Android platform (Zero toggles).
 * Shows real-time ETA (calculation is internal, never exposed to user).
 */

// Auto-detect platform using Capacitor runtime & user agent
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

export const CustomerDynamicIsland = ({
  activeOrder,
  onOpenTrackOrder,
  distanceKm = 3.5,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-detect platform (no manual toggle)
  const platform = useMemo(() => detectPlatform(), []);

  if (!activeOrder) return null;

  const status = activeOrder.status || 'placed';
  const isDelivered = status === 'delivered';
  const isCancelled = ['cancelled', 'rejected'].includes(status);
  if (isCancelled || isDelivered) return null;

  // Calculate ETA internally
  const dist = parseFloat(activeOrder.distance_km || distanceKm || 3.5);
  const totalMins = 15 + Math.round(dist * 3);

  let minsLeft = totalMins;
  if (status === 'preparing' || status === 'accepted') {
    minsLeft = Math.max(10, totalMins - 5);
  } else if (status === 'ready') {
    minsLeft = Math.round(dist * 3);
  } else if (status === 'out_for_delivery') {
    minsLeft = Math.max(4, Math.round(dist * 1.5));
  }

  // Progress percentage (0 to 1)
  const progressPercent = Math.min(1, Math.max(0.15, (totalMins - minsLeft) / totalMins));
  const strokeDashoffset = 44 - 44 * progressPercent;

  const statusText = status === 'out_for_delivery'
    ? 'Out for Delivery'
    : status === 'ready'
    ? 'Ready for Pickup'
    : 'Preparing your order';

  // ── iOS DYNAMIC ISLAND ─────────────────────────────────────────────────
  if (platform === 'ios') {
    return (
      <div className="w-full flex flex-col items-center px-4 pt-1 pb-1 z-50 pointer-events-auto select-none">
        {/* Collapsed Pill */}
        {!isExpanded ? (
          <div
            onClick={() => onOpenTrackOrder ? onOpenTrackOrder() : setIsExpanded(true)}
            className="w-[200px] sm:w-[220px] h-[35px] bg-black text-white rounded-full px-3.5 flex items-center justify-between shadow-2xl border border-white/10 active:scale-95 transition-all cursor-pointer group hover:border-white/20"
            title="Tap to track order live"
          >
            {/* Left: Brand name */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[12px] font-black lowercase tracking-tight font-sans text-white group-hover:text-amber-300 transition-colors">
                persian darbar
              </span>
            </div>

            {/* Right: Circular Ring Timer */}
            <div className="flex items-center gap-1.5">
              <div className="relative w-6 h-6 flex items-center justify-center">
                <svg className="w-6 h-6 -rotate-90" viewBox="0 0 20 20">
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    stroke="#2a2a2a"
                    strokeWidth="2.2"
                    fill="none"
                  />
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeDasharray="44"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[8.5px] font-black text-white tracking-tighter">
                  {minsLeft}m
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Expanded Dynamic Island */
          <div className="w-full max-w-[390px] bg-black text-white rounded-3xl p-4 shadow-2xl border border-white/15 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black lowercase text-amber-300">persian darbar</span>
                <span className="text-[10px] text-white/50">. Live Activity</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-white capitalize">
                  {statusText}
                </p>
                <p className="text-[11px] text-white/60">
                  Estimated arrival in {minsLeft} mins
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/50 font-medium">ETA</p>
                <p className="text-lg font-black text-white">{minsLeft} mins</p>
              </div>
            </div>

            <button
              onClick={onOpenTrackOrder}
              className="w-full mt-1 py-2 bg-gradient-to-r from-red-600 to-[#E40000] text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-98 transition-transform shadow-md"
            >
              <span>View Full Live Map & Rider Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── ANDROID MATERIAL YOU LIVE NOTIFICATION ─────────────────────────────
  return (
    <div className="w-full px-4 pt-1 pb-1 z-50 pointer-events-auto select-none">
      <div
        onClick={onOpenTrackOrder}
        className="w-full bg-[#1F2937] text-white rounded-2xl p-3 shadow-lg border border-neutral-700 active:scale-98 transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#E40000] flex items-center justify-center text-white text-[10px]">
              <ChefHat className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">Persian Darbar</span>
                <span className="text-[9px] bg-neutral-700 text-neutral-300 px-1 rounded">Live Order</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-bold">
                {statusText} . {minsLeft} min
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-white/10 px-2 py-1 rounded-lg text-amber-300">
            ~{minsLeft}m
          </span>
        </div>

        {/* Material progress line */}
        <div className="w-full bg-neutral-700 h-1 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.round(progressPercent * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerDynamicIsland;
