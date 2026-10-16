import React from 'react';
import { MapPin, ChevronDown, Mic, Search, Crown } from 'lucide-react';

const CustomerTopBar = ({
  selectedBranch,
  distanceKm,
  onOpenLocationModal,
  onOpenProfile,
  onOpenWallet,
  onOpenSearch,
  searchQuery = '',
  searchPlaceholder = 'Search "biryani, tandoori, curries..."',
  userInitial = 'A',
  userPhoto = null
}) => {
  const branchName = selectedBranch?.name || 'Bandra (Flagship)';
  const branchAddress = selectedBranch?.shortAddress || 'Linking Road, Bandra West';

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-[#FFF5D6] via-[#FFF8E7] to-[#FFFBF2] border-b border-amber-200/50 shadow-xs">
      <section className="px-4 pt-3 pb-3">
        {/* Top Row: Branch Selector & Royal Membership Pill */}
        <div className="flex items-center justify-between gap-2">
          {/* Branch Selector: User directly selects from the 4 Persian Darbar Outlets */}
          <div
            onClick={onOpenLocationModal}
            className="flex items-center space-x-2 cursor-pointer active:opacity-75 transition-opacity flex-1 min-w-0"
          >
            <div className="w-8 h-8 rounded-full bg-[#1C1917] text-amber-400 flex items-center justify-center shrink-0 shadow-xs border border-amber-400/40">
              <MapPin className="w-4 h-4 fill-current" />
            </div>
            <div className="leading-tight min-w-0 flex-1 truncate">
              <div className="flex items-center space-x-1">
                <span className="text-xs sm:text-sm font-black text-neutral-900 truncate">
                  {branchName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-800 stroke-[3] shrink-0" />
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-amber-900/80 truncate mt-0.5">
                {distanceKm ? `${distanceKm} km · ` : ''}{branchAddress}
              </p>
            </div>
          </div>

          {/* Right Action Icons: Zomato Gold Style Royalty Pill & Profile Avatar */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Royal Club Pill */}
            <button
              onClick={onOpenWallet}
              aria-label="Royalty Membership"
              className="px-2 py-1 rounded-full bg-[#1C1917] text-amber-300 border border-amber-400/50 text-xs font-black flex items-center space-x-1 shadow-xs active:scale-95 transition-transform shrink-0"
            >
              <Crown className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[9.5px] font-extrabold tracking-wider uppercase">Royalty</span>
            </button>

            {/* Profile Avatar */}
            <button
              onClick={onOpenProfile}
              aria-label="Customer Profile"
              className="w-8 h-8 rounded-full bg-[#1C1C1C] text-amber-300 flex items-center justify-center font-bold text-xs shadow-xs active:scale-95 transition-transform overflow-hidden border border-amber-300/60 shrink-0"
            >
              {userPhoto ? (
                <img src={userPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                userInitial
              )}
            </button>
          </div>
        </div>

        {/* ── Search Bar matching Screenshot 4 ── */}
        <div className="mt-2.5">
          <div
            id="top-search-bar"
            onClick={onOpenSearch}
            className="relative cursor-pointer"
          >
            <div className="w-full bg-white/95 hover:bg-white rounded-2xl py-2.5 pl-9 pr-9 text-xs font-medium text-neutral-800 placeholder-neutral-400 border border-amber-200/80 shadow-xs flex items-center transition-colors">
              <span className={searchQuery ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}>
                {searchQuery || searchPlaceholder}
              </span>
            </div>
            {/* Search Icon */}
            <Search className="w-4 h-4 text-neutral-600 absolute left-3 top-3" />
            {/* Mic Icon */}
            <Mic className="w-4 h-4 text-[#E23744] absolute right-3 top-3" />
          </div>
        </div>
      </section>
    </header>
  );
};

export default CustomerTopBar;
