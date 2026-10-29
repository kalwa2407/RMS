import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Check, Navigation, Building2, Clock, Phone, Search } from 'lucide-react';
import { PERSIAN_DARBAR_BRANCHES, KNOWN_LOCALITIES } from '../customerAssets';

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
    // Default distances if no user location is provided
    return branch.city === 'Pune' ? 4.2 : 2.5;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity p-0 sm:p-4">
      <div className="w-full max-w-[430px] md:max-w-2xl bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl p-5 md:p-6 space-y-4 animate-in slide-in-from-bottom duration-300 max-h-[88vh] overflow-y-auto no-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-red-50 text-[#E40000] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900 leading-tight">
                Select Persian Darbar Outlet
              </h3>
              <p className="text-[11px] text-neutral-500 font-medium">
                Choose your nearest royal dining & delivery branch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GPS Auto-detect Button */}
        <button
          onClick={() => {
            if (typeof onDetectLocation === 'function') {
              onDetectLocation();
            }
          }}
          disabled={detectingLocation}
          className="w-full bg-red-50 hover:bg-red-100/80 border border-red-200/80 p-3 rounded-2xl flex items-center space-x-3 text-left active:scale-98 transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-[#E40000] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Navigation className={`w-4 h-4 ${detectingLocation ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-[#E40000]">
              {detectingLocation ? 'Detecting Live GPS...' : 'Use My Current GPS Location'}
            </h4>
            <p className="text-[10px] text-neutral-600 font-medium">
              Calculates accurate km distance from your doorstep to all outlets
            </p>
          </div>
        </button>

        {/* ── 4 Official Persian Darbar Branches List with Real Photos ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
              Persian Darbar Branches (4)
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              All 4 Outlets Open
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {PERSIAN_DARBAR_BRANCHES.map((branch) => {
            const isSelected = selectedBranch?.id === branch.id || selectedBranch?.name === branch.name;
            const dist = getBranchDistance(branch);
            const isFar = dist > 35; // Intercity check

            return (
              <div
                key={branch.id}
                onClick={() => {
                  if (typeof onSelectBranch === 'function') {
                    onSelectBranch({ ...branch, calculatedDistance: dist });
                  }
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden active:scale-[0.99] flex items-center justify-between ${
                  isSelected
                    ? 'border-[#E40000] bg-red-50/40 shadow-xs ring-1 ring-[#E40000]/30'
                    : 'border-neutral-200/80 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
                }`}
              >
                <div className="flex items-start space-x-3 flex-1 min-w-0 pr-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-white font-black text-xs shadow-xs"
                    style={{ background: branch.accent || '#E40000' }}
                  >
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h4 className="text-xs font-black text-neutral-900 leading-tight">
                        {branch.name}
                      </h4>
                      <span
                        className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md"
                        style={{
                          background: `${branch.accent}18`,
                          color: branch.accent,
                          border: `1px solid ${branch.accent}35`
                        }}
                      >
                        {branch.badge}
                      </span>
                      <span className="text-[9px] font-bold bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-md">
                        {branch.city}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
                      {branch.shortAddress}
                    </p>
                    <div className="flex items-center space-x-3 text-[10px] text-neutral-400 pt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        <span>{branch.timing}</span>
                      </span>
                      <span className={`flex items-center space-x-1 font-bold px-2 py-0.5 rounded-md text-[10px] ${
                        isFar ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                      }`}>
                        <Navigation className="w-2.5 h-2.5" />
                        <span>{dist ? `~${dist} km away` : 'Open'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Selection Radio Circle */}
                <div className="shrink-0">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-[#E40000] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-neutral-300" />
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Custom Locality/Area Input with Google Places Autocomplete */}
        <div className="pt-2 border-t border-neutral-100">
          <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Search Doorstep Address or Landmark</span>
            <span className="text-[#4285F4] font-semibold lowercase tracking-normal">powered by Google</span>
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Search apartment, street, landmark, or area..."
                className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl pl-3.5 pr-8 py-2.5 text-xs font-bold text-neutral-800 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-red-100 focus:border-[#E40000]"
              />
              {customInput && (
                <button
                  type="button"
                  onClick={() => setCustomInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => {
                if (customInput.trim() && typeof onSelectAddress === 'function') {
                  onSelectAddress(customInput.trim());
                  onClose();
                }
              }}
              disabled={!customInput.trim()}
              className="bg-[#1C1C1C] hover:bg-neutral-800 text-white text-xs font-black px-4 py-2.5 rounded-2xl disabled:opacity-40 active:scale-95 transition-transform shrink-0 cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAddressModal;
