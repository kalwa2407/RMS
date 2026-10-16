import React, { useState } from 'react';
import { X, MapPin, Check, Navigation, Building2, Clock, Phone } from 'lucide-react';
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
      <div className="w-full max-w-[430px] bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-300 max-h-[88vh] overflow-y-auto no-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-red-50 text-[#E23744] flex items-center justify-center">
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
          <div className="w-8 h-8 rounded-xl bg-[#E23744] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Navigation className={`w-4 h-4 ${detectingLocation ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-[#E23744]">
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
                className={`rounded-2xl border transition-all cursor-pointer overflow-hidden active:scale-[0.99] flex flex-col ${
                  isSelected
                    ? 'border-[#E23744] bg-red-50/20 shadow-md ring-2 ring-[#E23744]/20'
                    : 'border-neutral-200/80 bg-white hover:border-neutral-300'
                }`}
              >
                {/* Branch Real Image Banner */}
                <div className="relative h-28 w-full bg-neutral-900 overflow-hidden">
                  <img
                    src={branch.image}
                    alt={branch.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Branch Tag & City */}
                  <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
                    <span
                      className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md text-white shadow-xs"
                      style={{ background: branch.accent }}
                    >
                      {branch.badge}
                    </span>
                    <span className="text-[10px] font-bold bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-md">
                      {branch.city}
                    </span>
                  </div>

                  {/* Selection Checkmark */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#E23744] text-white flex items-center justify-center shadow-lg">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Title & Distance on Bottom of Image */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between text-white">
                    <div>
                      <h4 className="text-sm font-black leading-tight text-white drop-shadow">
                        {branch.name}
                      </h4>
                      <p className="text-[10px] text-neutral-300 line-clamp-1 mt-0.5">
                        {branch.shortAddress}
                      </p>
                    </div>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                      isFar ? 'bg-amber-500 text-black' : 'bg-white text-neutral-900 shadow'
                    }`}>
                      {dist ? `📍 ~${dist} km` : 'Open'}
                    </span>
                  </div>
                </div>

                {/* Footer details: timing & phones */}
                <div className="px-3.5 py-2 flex items-center justify-between text-[11px] text-neutral-600 bg-neutral-50/70 border-t border-neutral-100">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    <span className="font-medium text-[10px]">{branch.timing}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-neutral-700 font-bold text-[10px]">
                    <Phone className="w-3 h-3 text-neutral-400" />
                    <span>{branch.phones[0]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Locality/Area Input for Doorstep Delivery */}
        <div className="pt-2 border-t border-neutral-100">
          <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
            Set Home Locality (e.g. Kondhwa, Bandra, Camp, Andheri)
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="e.g. Kondhwa, Pune or Linking Road, Bandra"
              className="flex-1 bg-neutral-50 border border-neutral-200/80 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-neutral-800 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-red-100 focus:border-[#E23744]"
            />
            <button
              onClick={() => {
                if (customInput.trim() && typeof onSelectAddress === 'function') {
                  onSelectAddress(customInput.trim());
                  onClose();
                }
              }}
              disabled={!customInput.trim()}
              className="bg-[#1C1C1C] text-white text-xs font-black px-4 py-2.5 rounded-2xl disabled:opacity-40 active:scale-95 transition-transform"
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
