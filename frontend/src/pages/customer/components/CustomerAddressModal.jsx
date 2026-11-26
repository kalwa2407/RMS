import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Check, Navigation, Search, ChevronRight, Clock, LocateFixed } from 'lucide-react';
import { PERSIAN_DARBAR_BRANCHES, KNOWN_LOCALITIES } from '../customerAssets';

// ── Helpers ──────────────────────────────────────────────────────────────────

// Haversine distance in km (1 decimal)
const calcDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
};

// "11:00 AM" -> minutes since midnight
const toMinutes = (t) => {
  const m = String(t || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
};

// Open status from a "11:00 AM - 1:00 AM" string, evaluated in India time (handles past-midnight close)
export const isOutletOpenNow = (timing, now = new Date()) => {
  const [startStr, endStr] = String(timing || '').split('-');
  const start = toMinutes(startStr);
  const end = toMinutes(endStr);
  if (start == null || end == null) return null;
  let h;
  let min;
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(now);
    h = Number(parts.find((p) => p.type === 'hour')?.value) % 24;
    min = Number(parts.find((p) => p.type === 'minute')?.value);
  } catch (e) {
    h = now.getHours();
    min = now.getMinutes();
  }
  const cur = h * 60 + min;
  return end > start ? cur >= start && cur < end : cur >= start || cur < end;
};

const formatKm = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km} km`);

// "11:00 AM - 1:00 AM" -> "11 AM – 1 AM" (fits one line next to the distance on phones)
const compactTiming = (timing) =>
  String(timing || '').replace(/:00\s*/g, ' ').replace(/\s*-\s*/, ' – ').replace(/\s+/g, ' ').trim();

// ── Component ────────────────────────────────────────────────────────────────

const CustomerAddressModal = ({
  isOpen = false,
  onClose,
  selectedBranch,
  onSelectBranch,
  userCoords = null,
  currentAddress = '',
  onSelectAddress,
  onDetectLocation,
  detectingLocation = false
}) => {
  const [customInput, setCustomInput] = useState(currentAddress);
  const inputRef = useRef(null);

  // Sync input when the sheet opens or the saved address changes
  useEffect(() => {
    if (currentAddress) setCustomInput(currentAddress);
  }, [currentAddress, isOpen]);

  // Close on Escape (keyboard / iPad hardware keyboard)
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && typeof onClose === 'function') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Google Places Autocomplete
  useEffect(() => {
    if (!isOpen || !inputRef.current || !window.google?.maps?.places) return;
    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'in' },
        fields: ['formatted_address', 'geometry', 'name']
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const fullAddr = place?.formatted_address || place?.name;
        if (!fullAddr) return;
        setCustomInput(fullAddr);
        const newCoords = place.geometry?.location
          ? { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
          : null;
        if (typeof onSelectAddress === 'function') onSelectAddress(fullAddr, newCoords);
      });
    } catch (e) {
      console.warn('Google places autocomplete init notice:', e);
    }
  }, [isOpen, onSelectAddress]);

  // User position: live GPS first, else a known locality in the typed/saved address. Never a made-up distance.
  const effectiveCoords = useMemo(() => {
    if (userCoords?.lat && userCoords?.lng) return userCoords;
    const addr = (customInput || currentAddress || '').toLowerCase();
    const hit = Object.entries(KNOWN_LOCALITIES).find(([key]) => addr.includes(key));
    return hit ? hit[1] : null;
  }, [userCoords, customInput, currentAddress]);

  const outlets = useMemo(() => {
    const list = PERSIAN_DARBAR_BRANCHES.map((branch) => ({
      branch,
      distance: effectiveCoords
        ? calcDistance(effectiveCoords.lat, effectiveCoords.lng, branch.coordinates.lat, branch.coordinates.lng)
        : null,
      openNow: isOutletOpenNow(branch.timing)
    }));
    if (effectiveCoords) list.sort((a, b) => a.distance - b.distance);
    return list;
  }, [effectiveCoords]);

  const nearestId = effectiveCoords ? outlets[0]?.branch.id : null;
  const trimmedInput = customInput.trim();
  const canApplyAddress = trimmedInput.length > 0 && trimmedInput !== (currentAddress || '').trim();

  const applyAddress = () => {
    if (!trimmedInput || typeof onSelectAddress !== 'function') return;
    onSelectAddress(trimmedInput);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-200 motion-reduce:animate-none cursor-default"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="outlet-sheet-title"
        className="relative w-full max-w-[440px] md:max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] shadow-[0_-12px_48px_rgba(0,0,0,0.18)] flex flex-col max-h-[90dvh] animate-in slide-in-from-bottom-8 fade-in duration-300 ease-out motion-reduce:animate-none"
      >
        {/* Grabber */}
        <div className="sm:hidden pt-2.5 flex justify-center" aria-hidden="true">
          <div className="w-10 h-1.5 rounded-full bg-neutral-200" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 sm:pt-5 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 id="outlet-sheet-title" className="text-[19px] font-black tracking-tight text-neutral-900 leading-tight">
              Choose your outlet
            </h3>
            <p className="text-[12.5px] text-neutral-500 font-medium mt-0.5">
              Delivery and dine-in from your nearest Persian Darbar
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 shrink-0 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 active:scale-95 transition-transform"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Address search */}
        <form
          className="px-5 pb-3"
          onSubmit={(e) => { e.preventDefault(); applyAddress(); }}
        >
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              enterKeyHint="done"
              autoComplete="street-address"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Search area, street or landmark"
              aria-label="Delivery address"
              className={`w-full h-12 rounded-2xl bg-neutral-100 border border-transparent pl-11 ${canApplyAddress ? 'pr-[92px]' : 'pr-10'} text-base font-semibold text-neutral-900 placeholder:text-neutral-400 placeholder:font-medium outline-none transition-colors focus:bg-white focus:border-neutral-300 focus:ring-4 focus:ring-neutral-100`}
            />
            {customInput && !canApplyAddress && (
              <button
                type="button"
                onClick={() => { setCustomInput(''); inputRef.current?.focus(); }}
                aria-label="Clear address"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {canApplyAddress && (
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-4 rounded-xl bg-neutral-900 text-white text-[13px] font-bold active:scale-95 transition-transform"
              >
                Apply
              </button>
            )}
          </div>
        </form>

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain no-scrollbar px-5"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
        >
          {/* Current location */}
          <button
            type="button"
            onClick={() => { if (typeof onDetectLocation === 'function') onDetectLocation(); }}
            disabled={detectingLocation}
            className="w-full flex items-center gap-3.5 py-3 text-left active:opacity-70 transition-opacity disabled:opacity-80"
          >
            <span className="w-10 h-10 rounded-full bg-red-50 text-[#E40000] flex items-center justify-center shrink-0">
              {detectingLocation
                ? <Navigation className="w-[18px] h-[18px] animate-pulse" />
                : <LocateFixed className="w-[18px] h-[18px]" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[14.5px] font-bold text-[#E40000]">
                {detectingLocation ? 'Finding your location…' : 'Use current location'}
              </span>
              <span className="block text-[12px] text-neutral-500 font-medium mt-0.5">
                {userCoords?.lat ? 'Location set · distances are exact' : 'Uses GPS to show exact distance to each outlet'}
              </span>
            </span>
            <ChevronRight className="w-5 h-5 text-neutral-300 shrink-0" />
          </button>

          <div className="h-px bg-neutral-100 my-2" />

          {/* Outlets */}
          <div className="flex items-baseline justify-between pt-2 pb-2.5">
            <h4 className="text-[11px] font-black uppercase tracking-[0.12em] text-neutral-400">
              Outlets
            </h4>
            <span className="text-[11px] font-semibold text-neutral-400">
              {effectiveCoords ? 'Nearest first' : 'Set location to see distance'}
            </span>
          </div>

          <ul className="space-y-2.5 md:grid md:grid-cols-2 md:gap-2.5 md:space-y-0">
            {outlets.map(({ branch, distance, openNow }) => {
              const isSelected = selectedBranch?.id === branch.id || selectedBranch?.name === branch.name;
              const isNearest = branch.id === nearestId;
              const monogram = (branch.name || '?').trim().charAt(0).toUpperCase();
              return (
                <li key={branch.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      if (typeof onSelectBranch === 'function') {
                        onSelectBranch({ ...branch, calculatedDistance: distance });
                      }
                      onClose();
                    }}
                    className={`w-full text-left rounded-[20px] border p-3.5 flex items-center gap-3.5 transition-[background-color,border-color,transform] duration-150 active:scale-[0.985] ${
                      isSelected
                        ? 'border-[#E40000] bg-red-50/50 shadow-[0_0_0_1px_rgba(228,0,0,0.25)]'
                        : 'border-neutral-200/90 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    {/* Monogram tile in the app's royal navy + gold */}
                    <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#141F2D] to-[#0B131B] text-amber-300 flex items-center justify-center shrink-0 font-black text-lg border border-amber-400/25 shadow-sm">
                      {monogram}
                    </span>

                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[15px] font-bold text-neutral-900 truncate">{branch.name}</span>
                        {isNearest && (
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-[1px] rounded-md">
                            Nearest
                          </span>
                        )}
                        {distance != null && (
                          <span className="ml-auto pl-2 shrink-0 text-[12.5px] font-bold text-neutral-800 tabular-nums">
                            {formatKm(distance)}
                          </span>
                        )}
                      </span>
                      <span className="block text-[12.5px] text-neutral-500 font-medium truncate mt-0.5">
                        {branch.shortAddress}
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] font-medium text-neutral-500 mt-1.5 min-w-0">
                        {openNow != null && (
                          <>
                            <span className={`flex items-center gap-1 shrink-0 font-semibold ${openNow ? 'text-emerald-700' : 'text-neutral-400'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${openNow ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                              {openNow ? 'Open' : 'Closed'}
                            </span>
                            <span className="text-neutral-300 shrink-0" aria-hidden="true">·</span>
                          </>
                        )}
                        <span className="flex items-center gap-1 truncate">
                          <Clock className="w-3 h-3 shrink-0 text-neutral-400" />
                          <span className="truncate">{compactTiming(branch.timing)}</span>
                        </span>
                      </span>
                    </span>

                    {/* Selection indicator */}
                    <span className="shrink-0" aria-hidden="true">
                      {isSelected ? (
                        <span className="w-[22px] h-[22px] rounded-full bg-[#E40000] text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="block w-[22px] h-[22px] rounded-full border-2 border-neutral-300" />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CustomerAddressModal;
