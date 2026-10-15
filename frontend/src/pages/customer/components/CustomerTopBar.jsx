import React from 'react';
import { MapPin, ChevronDown, Mic, Search } from 'lucide-react';

const CustomerTopBar = ({
  locationTitle = 'Bandra (Flagship)',
  locationSubtitle = 'Linking Road, Bandra West, Mumbai',
  onOpenLocationModal,
  onOpenProfile,
  onOpenWallet,
  onOpenSearch,
  searchQuery = '',
  searchPlaceholder = 'Search "biryani, kebabs, desserts..."',
  vegOnly = false,
  onToggleVeg,
  userInitial = 'A',
  userPhoto = null
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-xs">
      {/* ── BEGIN: iOS Status Bar with Dynamic Island Replica ── */}
      <div className="bg-[#F5EED8]/90 backdrop-blur-md pt-2 px-5 pb-1.5 flex items-center justify-between text-black">
        {/* Time Display */}
        <span className="text-[14px] font-bold tracking-tight">3:37</span>

        {/* iPhone Dynamic Island Replica with Green Active Call/Music Pill */}
        <div className="h-[25px] w-[98px] bg-black rounded-full flex items-center justify-between px-2.5 shadow-xs">
          <svg className="w-3.5 h-3.5 text-green-500 fill-current" viewBox="0 0 24 24">
            <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
        </div>

        {/* Network, 5G & Battery Indicators */}
        <div className="flex items-center space-x-1.5 text-black">
          <svg className="w-4 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 18.23C2.89 16.51 2 14.36 2 12 2 6.48 6.48 2 12 2s10 4.48 10 10c0 2.36-.89 4.51-2.35 6.23l-.62-.62C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 4c-2.76 0-5 2.24-5 5 0 1.34.53 2.56 1.39 3.46l.71-.71C8.42 14.07 8 13.08 8 12c0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.08-.42 2.07-1.1 2.75l.71.71c.86-.9 1.39-2.12 1.39-3.46 0-2.76-2.24-5-5-5zm0 4c-.55 0-1 .45-1 1 0 .34.17.63.43.81l.57.57.57-.57c.26-.18.43-.47.43-.81 0-.55-.45-1-1-1z" />
          </svg>
          <span className="text-[12px] font-extrabold">5G</span>
          <div className="w-5 h-2.5 border border-black rounded-sm p-[1px] flex items-center">
            <div className="w-full h-full bg-black rounded-xs" />
          </div>
        </div>
      </div>
      {/* ── END: iOS Status Bar ── */}

      {/* ── BEGIN: Location & Profile Bar ── */}
      <section className="bg-gradient-to-b from-[#F5EED8] via-[#FAF3E3] to-[#FFFBF2] px-4 pt-1.5 pb-3">
        <div className="flex items-center justify-between">
          {/* Location details clickable */}
          <div
            onClick={onOpenLocationModal}
            className="flex items-start space-x-1.5 cursor-pointer active:opacity-75 transition-opacity"
          >
            <MapPin className="w-5 h-5 text-[#E23744] mt-0.5 shrink-0 fill-current" />
            <div className="leading-tight">
              <div className="flex items-center space-x-1">
                <span className="text-base font-extrabold tracking-tight text-neutral-900 truncate max-w-[170px]">
                  {locationTitle}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-800 stroke-[2.5]" />
              </div>
              <p className="text-[11px] font-medium text-neutral-500 truncate max-w-[180px]">
                {locationSubtitle}
              </p>
            </div>
          </div>

          {/* Right Action Icons: district, wallet, profile */}
          <div className="flex items-center space-x-2">
            {/* district badge */}
            <span
              onClick={onOpenProfile}
              className="bg-[#5925dc] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs tracking-tight cursor-pointer active:scale-95 transition-transform"
            >
              district
            </span>

            {/* Wallet / Passbook Icon */}
            <button
              onClick={onOpenWallet}
              aria-label="Loyalty Wallet"
              className="w-8 h-8 rounded-full bg-white border border-neutral-200 shadow-xs flex items-center justify-center text-neutral-700 active:scale-95 transition-transform"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Profile Avatar */}
            <button
              onClick={onOpenProfile}
              aria-label="Customer Profile"
              className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs shadow-xs active:scale-95 transition-transform overflow-hidden border border-white"
            >
              {userPhoto ? (
                <img src={userPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                userInitial
              )}
            </button>
          </div>
        </div>

        {/* ── Search Bar & VEG Switch Row ── */}
        <div className="mt-3 flex items-center space-x-2">
          <div
            id="top-search-bar"
            onClick={onOpenSearch}
            className="relative flex-1 cursor-pointer"
          >
            <div className="w-full bg-white rounded-xl py-2.5 pl-9 pr-9 text-xs font-medium text-neutral-800 placeholder-neutral-400 border border-neutral-200 shadow-xs flex items-center">
              <span className={searchQuery ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}>
                {searchQuery || searchPlaceholder}
              </span>
            </div>
            {/* Search Icon */}
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
            {/* Mic Icon */}
            <Mic className="w-4 h-4 text-[#E23744] absolute right-3 top-3" />
          </div>

          {/* VEG Toggle Switch */}
          <div className="flex flex-col items-center select-none">
            <span className="text-[9px] font-extrabold text-neutral-600 tracking-wider">VEG</span>
            <label className="relative inline-flex items-center cursor-pointer mt-0.5">
              <input
                type="checkbox"
                checked={vegOnly}
                onChange={onToggleVeg}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#24963F]" />
            </label>
          </div>
        </div>
      </section>
      {/* ── END: Location & Profile Bar ── */}
    </header>
  );
};

export default CustomerTopBar;
