import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Check, LocateFixed, Clock, Search, ChevronRight } from 'lucide-react';
import { PERSIAN_DARBAR_BRANCHES, KNOWN_LOCALITIES } from '../customerAssets';
import { cx } from '../ui';

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

  // Sync input when modal opens or currentAddress changes
  useEffect(() => {
    if (currentAddress) setCustomInput(currentAddress);
  }, [currentAddress, isOpen]);

  // Google Places Autocomplete Integration
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
        if (fullAddr) {
          setCustomInput(fullAddr);
          let newCoords = null;
          if (place.geometry?.location) {
            newCoords = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };
          }
          if (typeof onSelectAddress === 'function') {
            onSelectAddress(fullAddr, newCoords);
          }
        }
      });
    } catch (e) {
      console.warn('Google places autocomplete init notice:', e);
    }
  }, [isOpen, onSelectAddress]);

  // Haversine formula
  const calcDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  // Determine user coordinates from live GPS or entered address
  const getEffectiveUserCoords = () => {
    if (userCoords && userCoords.lat && userCoords.lng) {
      return userCoords;
    }
    const cleanAddr = (customInput || currentAddress || '').toLowerCase();
    for (const [key, coords] of Object.entries(KNOWN_LOCALITIES)) {
      if (cleanAddr.includes(key)) {
        return coords;
      }
    }
    return null;
  };

  const effectiveCoords = getEffectiveUserCoords();

  const getBranchDistance = (branch) => {
    if (effectiveCoords && effectiveCoords.lat && effectiveCoords.lng) {
      return calcDistance(
        effectiveCoords.lat,
        effectiveCoords.lng,
        branch.coordinates.lat,
        branch.coordinates.lng
      );
    }
    return branch.city === 'Pune' ? 4.2 : 2.5;
  };

  if (!isOpen) return null;

  const applyTypedAddress = () => {
    if (customInput.trim() && typeof onSelectAddress === 'function') {
      onSelectAddress(customInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200">
      {/* Tap outside to close */}
      <button type="button" aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pd-address-title"
        className="relative w-full max-w-[430px] md:max-w-xl bg-white rounded-t-[24px] sm:rounded-[24px] max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300 ease-pd-out"
      >
        <div className="w-10 h-1.5 rounded-full bg-black/15 mx-auto mt-2 sm:hidden" />

        {/* Header */}
        <div className="px-5 pt-3 pb-3 flex items-center justify-between">
          <h3 id="pd-address-title" className="text-[20px] font-bold text-pd-ink tracking-[-0.01em]">Delivery location</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-pd-surface flex items-center justify-center text-pd-ink-2 pd-press"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
          {/* Address search */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-12 flex items-center gap-2.5 bg-pd-surface rounded-[12px] px-3.5">
              <Search className="w-[18px] h-[18px] text-pd-ink-2 shrink-0" strokeWidth={2} />
              <input
                ref={inputRef}
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyTypedAddress(); }}
                placeholder="Search area, street or landmark"
                autoComplete="street-address"
                className="flex-1 min-w-0 bg-transparent text-[16px] text-pd-ink placeholder:text-pd-ink-3 outline-none"
              />
              {customInput && (
                <button
                  type="button"
                  onClick={() => setCustomInput('')}
                  aria-label="Clear"
                  className="w-6 h-6 rounded-full bg-pd-ink-3/30 flex items-center justify-center text-white shrink-0"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={3} />
                </button>
              )}
            </div>
            {customInput.trim() && customInput.trim() !== currentAddress && (
              <button
                type="button"
                onClick={applyTypedAddress}
                className="h-12 px-4 rounded-[12px] bg-pd-ink text-white text-[15px] font-semibold pd-press shrink-0"
              >
                Use
              </button>
            )}
          </div>

          {/* Current location */}
          <button
            type="button"
            onClick={() => {
              if (typeof onDetectLocation === 'function') onDetectLocation();
            }}
            disabled={detectingLocation}
            className="mt-2 w-full flex items-center gap-3 py-3.5 border-b border-[color:var(--pd-line)] text-left pd-press disabled:opacity-70"
          >
            <span className="w-10 h-10 rounded-full bg-pd-action-tint flex items-center justify-center shrink-0">
              <LocateFixed className={cx('w-5 h-5 text-pd-action', detectingLocation && 'animate-spin')} strokeWidth={2} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-semibold text-pd-action">
                {detectingLocation ? 'Finding your location…' : 'Use my current location'}
              </span>
              <span className="block text-[13px] text-pd-ink-2 truncate">
                {currentAddress || 'Using GPS for accurate distance'}
              </span>
            </span>
            <ChevronRight className="w-5 h-5 text-pd-ink-3 shrink-0" />
          </button>

          {/* Outlets */}
          <h4 className="mt-6 mb-1 text-[13px] font-semibold text-pd-ink-2 uppercase tracking-[0.06em]">Order from outlet</h4>
          <ul className="divide-y divide-[color:var(--pd-line)]">
            {PERSIAN_DARBAR_BRANCHES.map((branch) => {
              const isSelected = selectedBranch?.id === branch.id || selectedBranch?.name === branch.name;
              const dist = getBranchDistance(branch);
              const isFar = dist > 35; // Intercity check
              return (
                <li key={branch.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof onSelectBranch === 'function') {
                        onSelectBranch({ ...branch, calculatedDistance: dist });
                      }
                      onClose();
                    }}
                    aria-pressed={isSelected}
                    className="w-full flex items-center gap-3 py-3.5 text-left pd-press"
                  >
                    <span className={cx('w-10 h-10 rounded-full flex items-center justify-center shrink-0', isSelected ? 'bg-pd-ink text-white' : 'bg-pd-surface text-pd-ink-2')}>
                      <MapPin className="w-5 h-5" strokeWidth={1.75} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-[16px] font-semibold text-pd-ink truncate">{branch.name}</span>
                        {branch.badge && (
                          <span className="text-[11px] font-semibold text-pd-gold uppercase tracking-[0.04em] shrink-0">{branch.badge}</span>
                        )}
                      </span>
                      <span className="block text-[13px] text-pd-ink-2 truncate">{branch.shortAddress}, {branch.city}</span>
                      <span className="mt-0.5 flex items-center gap-3 text-[12px] text-pd-ink-3">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{branch.timing}</span>
                        <span className={cx('pd-tabular', isFar && 'text-pd-warn')}>{dist ? `${dist} km away` : ''}</span>
                      </span>
                    </span>
                    {isSelected ? (
                      <span className="w-6 h-6 rounded-full bg-pd-action text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full border-2 border-black/15 shrink-0" />
                    )}
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
