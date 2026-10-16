import React from 'react';
import { MapPin, ChevronDown, Mic, Search, Building2, Award } from 'lucide-react';

const CustomerTopBar = ({
  selectedBranch,
  distanceKm,
  onOpenLocationModal,
  onOpenProfile,
  onOpenWallet,
  onOpenSearch,
  searchQuery = '',
  searchPlaceholder = 'Search biryani, tandoori kebabs, curries...',
  userInitial = 'A',
  userPhoto = null
}) => {
  const branchName = selectedBranch?.name || 'Bandra (Flagship)';
  const branchAddress = selectedBranch?.shortAddress || 'Linking Road, Bandra West';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-xs">
      {/* ── Main Top Bar: Branch Selector & Profile Actions ── */}
      <section className="px-4 pt-3 pb-3">
        <div className="flex items-center justify-between">
          {/* Branch Selector: User directly selects from the 4 Persian Darbar Outlets */}
          <div
            onClick={onOpenLocationModal}
            className="flex items-center space-x-2 cursor-pointer active:opacity-75 transition-opacity max-w-[70%]"
          >
            <div className="w-8 h-8 rounded-full bg-red-50 text-[#E23744] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 fill-current" />
            </div>
            <div className="leading-tight truncate">
              <div className="flex items-center space-x-1">
                <span className="text-sm font-black text-neutral-900 truncate">
                  {branchName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-800 stroke-[3] shrink-0" />
              </div>
              <p className="text-[11px] font-semibold text-neutral-500 truncate mt-0.5">
                {distanceKm ? `${distanceKm} km · ` : ''}{branchAddress}
              </p>
            </div>
          </div>

          {/* Right Action Icons: Loyalty Coins & Profile Avatar */}
          <div className="flex items-center space-x-2">
            {/* PD Coins / Rewards Shortcut */}
            <button
              onClick={onOpenWallet}
              aria-label="Rewards"
              className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black flex items-center space-x-1 shadow-xs active:scale-95 transition-transform"
            >
              <Award className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span className="text-[11px]">PD Coins</span>
            </button>

            {/* Profile Avatar */}
            <button
              onClick={onOpenProfile}
              aria-label="Customer Profile"
              className="w-8 h-8 rounded-full bg-[#1C1C1C] text-amber-300 flex items-center justify-center font-bold text-xs shadow-xs active:scale-95 transition-transform overflow-hidden border border-neutral-300"
            >
              {userPhoto ? (
                <img src={userPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                userInitial
              )}
            </button>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="mt-2.5">
          <div
            id="top-search-bar"
            onClick={onOpenSearch}
            className="relative cursor-pointer"
          >
            <div className="w-full bg-neutral-100/80 hover:bg-neutral-100 rounded-2xl py-2.5 pl-9 pr-9 text-xs font-medium text-neutral-800 placeholder-neutral-400 border border-neutral-200/80 shadow-xs flex items-center transition-colors">
              <span className={searchQuery ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}>
                {searchQuery || searchPlaceholder}
              </span>
            </div>
            {/* Search Icon */}
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
            {/* Mic Icon */}
            <Mic className="w-4 h-4 text-[#E23744] absolute right-3 top-3" />
          </div>
        </div>
      </section>
    </header>
  );
};

export default CustomerTopBar;
