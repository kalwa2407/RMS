import React, { useState } from 'react';
import { ChevronDown, Mic, Search, User, Bell, MapPin, Crown } from 'lucide-react';

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
  searchPlaceholder = 'Search for biryani, kebabs, curries…',
  userInitial = null,
  userPhoto = null
}) => {
  const branchName = selectedBranch?.name || 'Camp, Pune';
  const branchAddress = selectedBranch?.shortAddress || 'Renaissance Centre, Wellesley Rd';
  const isReserve = activeTab === 'reserve';
  const showSearch = activeTab === 'home' || activeTab === 'order';
  const showRoyalty = activeTab !== 'rewards' && activeTab !== 'profile';

  // Fall back to the initial / icon if the photo URL fails
  const [photoError, setPhotoError] = useState(false);

  return (
    <header
      data-pd-topbar
      className="sticky top-0 z-40 bg-white/[0.92] backdrop-blur-xl border-b border-[color:var(--pd-line)]"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <section className="px-4 md:px-8 pt-2 pb-3">
        <div className="flex items-center gap-3">
          {/* Location / outlet */}
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="flex items-start gap-2 flex-1 min-w-0 text-left pd-press"
            aria-label={`Change outlet, current ${branchName}`}
          >
            <MapPin className="w-5 h-5 text-pd-action shrink-0 mt-0.5" strokeWidth={2.25} />
            <span className="min-w-0">
              <span className="flex items-center gap-1">
                <span className="text-[17px] leading-[22px] font-bold text-pd-ink truncate tracking-[-0.01em]">
                  {branchName}
                </span>
                <ChevronDown className="w-4 h-4 text-pd-ink shrink-0" strokeWidth={2.5} />
              </span>
              <span className="block text-[13px] leading-[18px] text-pd-ink-2 truncate">
                {isReserve
                  ? 'Persian Darbar · table reservations'
                  : `${distanceKm ? `${distanceKm} km · ` : ''}${branchAddress}`}
              </span>
            </span>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {showRoyalty && (
              <button
                type="button"
                onClick={onOpenWallet}
                aria-label="Royalty rewards"
                className="h-8 px-2.5 rounded-full bg-pd-gold-tint text-pd-gold flex items-center gap-1 pd-press"
              >
                <Crown className="w-4 h-4" strokeWidth={2} />
                <span className="text-[13px] font-semibold">{isReserve ? 'VIP' : 'Royalty'}</span>
              </button>
            )}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-pd-ink pd-press"
                aria-label="Notifications"
              >
                <Bell className="w-[22px] h-[22px]" strokeWidth={1.75} />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-pd-action text-white text-[11px] font-semibold leading-[17px] text-center border-2 border-white box-content">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onOpenProfile}
              aria-label="Profile"
              className="w-9 h-9 rounded-full overflow-hidden bg-pd-surface flex items-center justify-center pd-press"
            >
              {userPhoto && !photoError ? (
                <img src={userPhoto} alt="" className="w-full h-full object-cover" onError={() => setPhotoError(true)} />
              ) : userInitial ? (
                <span className="text-[15px] font-semibold text-pd-ink">{userInitial}</span>
              ) : (
                <User className="w-5 h-5 text-pd-ink-2" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {showSearch && (
          <button
            id="top-search-bar"
            type="button"
            onClick={onOpenSearch}
            className="mt-3 w-full h-11 rounded-[12px] bg-pd-surface flex items-center gap-2.5 px-3.5 text-left pd-press"
          >
            <Search className="w-[18px] h-[18px] text-pd-ink-2 shrink-0" strokeWidth={2} />
            <span className={`flex-1 truncate text-[15px] ${searchQuery ? 'text-pd-ink font-medium' : 'text-pd-ink-3'}`}>
              {searchQuery || searchPlaceholder}
            </span>
            <span className="w-px h-5 bg-black/10" />
            <Mic className="w-[18px] h-[18px] text-pd-action shrink-0" strokeWidth={2} />
          </button>
        )}
      </section>
    </header>
  );
};

export default CustomerTopBar;
