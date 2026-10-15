import React, { useState } from 'react';
import { X, MapPin, Check, Navigation, Building2, Phone, Clock } from 'lucide-react';
import { PERSIAN_DARBAR_BRANCHES } from '../customerAssets';

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
  const [activeMode, setActiveMode] = useState('branches'); // 'branches' | 'delivery'

  const getBranchDistance = (branch) => {
    if (userCoords && userCoords.lat && userCoords.lng) {
      const R = 6371;
      const dLat = (userCoords.lat - branch.coordinates.lat) * Math.PI / 180;
      const dLon = (userCoords.lng - branch.coordinates.lng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(branch.coordinates.lat * Math.PI / 180) *
          Math.cos(userCoords.lat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return parseFloat((R * c).toFixed(1));
    }
    return branch.defaultDistance || branch.distance || 2.0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity p-0 sm:p-4">
      <div className="w-full max-w-[420px] bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto no-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-[#E23744]" />
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 leading-tight">
                Select Persian Darbar Outlet
              </h3>
              <p className="text-[10px] text-neutral-400 font-medium">
                Choose from our 4 royal dining & delivery hubs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mode Toggle Pills */}
        <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveMode('branches')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeMode === 'branches'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            👑 Persian Darbar Outlets (4)
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('delivery')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeMode === 'delivery'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            📍 Custom Delivery Address
          </button>
        </div>

        {activeMode === 'branches' ? (
          /* ── 4 Official Persian Darbar Branches ── */
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
                Official Branches
              </span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                All 4 Open Now
              </span>
            </div>

            {PERSIAN_DARBAR_BRANCHES.map((branch) => {
              const isSelected = selectedBranch?.id === branch.id || selectedBranch?.name === branch.name;
              return (
                <div
                  key={branch.id}
                  onClick={() => {
                    if (typeof onSelectBranch === 'function') {
                      onSelectBranch(branch);
                    } else if (typeof onSelectAddress === 'function') {
                      onSelectAddress(branch.name, branch.shortAddress);
                    }
                    onClose();
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden active:scale-[0.99] ${
                    isSelected
                      ? 'border-[#E23744] bg-red-50/40 shadow-xs ring-1 ring-[#E23744]/30'
                      : 'border-neutral-200/80 bg-white hover:border-red-200 hover:bg-neutral-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-white font-black text-xs shadow-xs"
                        style={{ background: branch.accent || '#E23744' }}
                      >
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-black text-neutral-900">
                            {branch.name}
                          </h4>
                          <span
                            className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded"
                            style={{
                              background: `${branch.accent}18`,
                              color: branch.accent,
                              border: `1px solid ${branch.accent}30`
                            }}
                          >
                            {branch.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 font-medium line-clamp-1">
                          {branch.fullAddress}
                        </p>
                        <div className="flex items-center space-x-3 text-[10px] text-neutral-400 pt-1">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            <span>{branch.timing}</span>
                          </span>
                          <span className="flex items-center space-x-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            <span>📍 ~{getBranchDistance(branch)} km away</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[#E23744] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-neutral-300 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Custom Doorstep Delivery Mode ── */
          <div className="space-y-3.5">
            {/* GPS Auto-detect Button */}
            <button
              onClick={() => {
                onDetectLocation();
                onClose();
              }}
              disabled={detectingLocation}
              className="w-full bg-red-50 hover:bg-red-100 border border-red-200 p-3 rounded-2xl flex items-center space-x-2.5 text-left active:scale-98 transition-all"
            >
              <Navigation className="w-4 h-4 text-[#E23744] shrink-0" />
              <div>
                <h4 className="text-xs font-black text-[#E23744]">
                  {detectingLocation ? 'Detecting GPS Coordinates...' : 'Use Current GPS Location'}
                </h4>
                <p className="text-[10px] text-red-600/80">
                  Find nearest Persian Darbar branch via live GPS
                </p>
              </div>
            </button>

            {/* Custom Input */}
            <div>
              <label className="block text-[11px] font-extrabold text-neutral-500 uppercase tracking-wider mb-1.5">
                Or Enter Doorstep Delivery Address
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="e.g. Flat 302, Linking Road, Bandra West..."
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#E23744]"
                />
                <button
                  onClick={() => {
                    if (customInput.trim()) {
                      onSelectAddress(customInput.trim(), 'Doorstep Delivery');
                      onClose();
                    }
                  }}
                  disabled={!customInput.trim()}
                  className="bg-[#1C1C1C] text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerAddressModal;
