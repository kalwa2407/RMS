import React from 'react';
import { ChevronDown, Mic, Search, User, Bell } from 'lucide-react';

const CustomerTopBar = ({
  activeTab = 'home',
  selectedBranch,
  distanceKm,
  onOpenLocationModal,
  onOpenProfile,
  onOpenWallet,
  onOpenSearch,
  onOpenNotifications,
  notificationCount = 0,
  searchQuery = '',
  searchPlaceholder = 'Search "biryani, tandoori, curries..."',
  userInitial = null,
  userPhoto = null
}) => {
  const branchName = selectedBranch?.name || 'Camp, Pune';
  const branchAddress = selectedBranch?.shortAddress || 'Renaissance Centre, Wellesley Rd';

  // ── Profile avatar helper — clean red & white brand aesthetic ──
  const ProfileAvatar = () => (
    <button
      onClick={onOpenProfile}
      aria-label="Customer Profile"
      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs active:scale-95 transition-transform overflow-hidden shrink-0 bg-white text-[#E40000] border border-amber-300/70"
    >
      {userPhoto ? (
        <img src={userPhoto} alt="" className="w-full h-full object-cover" />
      ) : userInitial ? (
        <span className="font-black text-[#E40000]">{userInitial}</span>
      ) : (
        <User className="w-4 h-4 text-[#E40000]" />
      )}
    </button>
  );

  // ── Reserve Tab Header — clean red & white, matches app aesthetic ──
  if (activeTab === 'reserve') {
    return (
      <header
        className="sticky top-0 z-40 bg-white/85 backdrop-blur-2xl border-b border-neutral-200/60 shadow-[0_2px_16px_rgba(0,0,0,0.03)]"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <section className="px-4 md:px-8 pt-1.5 pb-3">
          <div className="flex items-center justify-between gap-2">
            {/* Branch selector */}
            <div
              onClick={onOpenLocationModal}
              className="flex items-center space-x-2.5 cursor-pointer ios-press flex-1 min-w-0"
            >
              <img
                src="/app-icon.png"
                alt="Persian Darbar"
                className="w-8 h-8 rounded-xl object-contain shrink-0 shadow-xs border border-amber-400/40"
              />
              <div className="leading-tight min-w-0 flex-1 truncate">
                <div className="flex items-center space-x-1">
                  <span className="text-xs sm:text-sm font-black text-neutral-900 truncate tracking-tight">
                    Persian Darbar · {branchName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-700 stroke-[3] shrink-0" />
                </div>
                <p className="text-[10px] font-semibold text-neutral-500 truncate mt-0.5">
                  Fine Dining &amp; Royal Table Reservations
                </p>
              </div>
            </div>

            {/* Right: notification bell + red VIP pill + profile */}
            <div className="flex items-center space-x-1.5 shrink-0">
              {/* Notification Bell */}
              {onOpenNotifications && (
                <button
                  onClick={onOpenNotifications}
                  className="relative w-8 h-8 rounded-full bg-neutral-100/90 border border-neutral-200/60 flex items-center justify-center ios-press cursor-pointer shadow-xs shrink-0"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4 text-neutral-700" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] bg-[#E40000] text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5 border border-white">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={onOpenWallet}
                aria-label="Royalty Membership"
                className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#E40000] to-[#CC0000] text-white text-xs font-black flex items-center space-x-1 shadow-sm ios-press shrink-0"
              >
                <img src="/app-icon.png" alt="" className="w-3.5 h-3.5 rounded-sm object-contain" />
                <span className="text-[9.5px] font-extrabold tracking-wider uppercase">VIP Table</span>
              </button>
              <ProfileAvatar />
            </div>
          </div>

          {/* Status strip */}
          <div className="mt-2 flex items-center justify-between bg-neutral-50/90 border border-neutral-200/70 rounded-xl px-3 py-1.5 text-[10px] font-semibold text-neutral-600 shadow-2xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Instant Confirmation · Live Table Booking</span>
            </span>
            <span className="text-[#E40000] font-black uppercase tracking-wider text-[9px]">
              Since 1978
            </span>
          </div>
        </section>
      </header>
    );
  }

  // ── Default Header (Home / Order / Rewards / Profile tabs) ──
  return (
    <header
      className="sticky top-0 z-40 bg-white/85 backdrop-blur-2xl border-b border-neutral-200/60 shadow-[0_2px_16px_rgba(0,0,0,0.03)]"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <section className="px-4 md:px-8 pt-1.5 pb-3">
        {/* Top row */}
        <div className="flex items-center justify-between gap-2">
          {/* Branch selector with crown logo */}
          <div
            onClick={onOpenLocationModal}
            className="flex items-center space-x-2 cursor-pointer ios-press flex-1 min-w-0"
          >
            <img
              src="/app-icon.png"
              alt="Persian Darbar"
              className="w-8 h-8 rounded-xl object-contain shrink-0 shadow-xs border border-amber-400/40"
            />
            <div className="leading-tight min-w-0 flex-1 truncate">
              <div className="flex items-center space-x-1">
                <span className="text-xs sm:text-sm font-black text-neutral-900 truncate">
                  {branchName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-800 stroke-[3] shrink-0" />
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-neutral-500 truncate mt-0.5">
                {distanceKm ? `${distanceKm} km · ` : ''}{branchAddress}
              </p>
            </div>
          </div>

          {/* Right: notification bell + Royalty pill + Profile */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Notification Bell */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative w-8 h-8 rounded-full bg-neutral-100/90 border border-neutral-200/60 flex items-center justify-center ios-press cursor-pointer shadow-xs shrink-0"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-neutral-700" />
                {notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] bg-[#E40000] text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5 border border-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={onOpenWallet}
              aria-label="Royalty Membership"
              className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#E40000] to-[#CC0000] text-white text-xs font-black flex items-center space-x-1 shadow-sm ios-press shrink-0"
            >
              <img src="/app-icon.png" alt="" className="w-3.5 h-3.5 rounded-sm object-contain" />
              <span className="text-[9.5px] font-extrabold tracking-wider uppercase">Royalty</span>
            </button>
            <ProfileAvatar />
          </div>
        </div>

        {/* ── Search Bar: Apple Spotlight Style ── */}
        <div className="mt-2.5">
          <div
            id="top-search-bar"
            onClick={onOpenSearch}
            className="relative cursor-pointer ios-press"
          >
            <div className="w-full bg-neutral-100/80 hover:bg-neutral-100 rounded-2xl py-2.5 pl-9 pr-9 text-xs font-medium text-neutral-800 border border-neutral-200/60 shadow-2xs flex items-center transition-colors">
              <span className={searchQuery ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}>
                {searchQuery || searchPlaceholder}
              </span>
            </div>
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
            <Mic className="w-4 h-4 text-[#E40000] absolute right-3 top-3" />
          </div>
        </div>
      </section>
    </header>
  );
};

export default CustomerTopBar;
