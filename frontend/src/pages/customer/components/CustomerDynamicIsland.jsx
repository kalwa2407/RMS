import React from 'react';
import { Bike, ChefHat, ChevronRight } from 'lucide-react';

/**
 * CustomerDynamicIsland: slim live-order strip under the top bar.
 * Shown only while the cart bar occupies the bottom slot, so the active
 * order is never shown twice. ETA maths is internal.
 */
export const CustomerDynamicIsland = ({
  activeOrder,
  onOpenTrackOrder,
  distanceKm = 3.5,
}) => {
  if (!activeOrder) return null;

  const status = activeOrder.status || 'placed';
  if (['delivered', 'cancelled', 'rejected'].includes(status)) return null;

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
  const progress = Math.min(1, Math.max(0.15, (totalMins - minsLeft) / totalMins));

  const onTheWay = status === 'out_for_delivery';
  const statusText = onTheWay ? 'On the way' : status === 'ready' ? 'Packed and ready' : 'Being prepared';
  const Icon = onTheWay ? Bike : ChefHat;

  return (
    <div className="px-4 pt-3 select-none">
      <button
        type="button"
        onClick={onOpenTrackOrder}
        className="relative w-full overflow-hidden rounded-[14px] bg-pd-ink text-white flex items-center gap-3 pl-3 pr-2 h-14 text-left pd-press"
      >
        <span className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#34C759] border-2 border-pd-ink" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-semibold truncate">{statusText}</span>
          <span className="block text-[12px] text-white/70 pd-tabular">Arriving in about {minsLeft} min</span>
        </span>
        <span className="flex items-center text-[14px] font-semibold text-white/90 shrink-0">
          Track
          <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2.25} />
        </span>
        <span className="absolute left-0 bottom-0 h-[3px] bg-[#34C759]" style={{ width: `${Math.round(progress * 100)}%` }} />
      </button>
    </div>
  );
};

export default CustomerDynamicIsland;
