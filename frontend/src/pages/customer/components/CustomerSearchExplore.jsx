import React, { useRef, useEffect } from 'react';
import { ChevronLeft, Search, X, Mic, SearchX, TrendingUp } from 'lucide-react';
import { SEARCH_CRAVINGS, SEARCH_ROUNDELS_GRID, findCartItem, isVegDish } from '../customerAssets';
import { AddStepper, EmptyState, Price, VegMark } from '../ui';

const fallbackFor = (dish) => `/dynamic_images/img${(((dish._id || dish.id || 1) % 9) + 1)}.jpeg`;

const CustomerSearchExplore = ({
  searchQuery,
  setSearchQuery,
  onClose,
  menu = [],
  cart = [],
  onAddToCart,
  onUpdateCartQty,
  onOpenCart
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = searchQuery.trim().toLowerCase();
  const searchResults = q
    ? menu.filter(item =>
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto no-scrollbar w-full max-w-[430px] md:max-w-4xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div
        className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-[color:var(--pd-line)] px-3 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="w-10 h-10 rounded-full flex items-center justify-center text-pd-ink pd-press"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2} />
          </button>
          <div className="flex-1 h-11 flex items-center gap-2.5 bg-pd-surface rounded-[12px] px-3.5">
            <Search className="w-[18px] h-[18px] text-pd-ink-2 shrink-0" strokeWidth={2} />
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes and categories"
              className="flex-1 min-w-0 bg-transparent border-none p-0 text-[16px] text-pd-ink placeholder:text-pd-ink-3 focus:outline-none focus:ring-0 [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="w-6 h-6 rounded-full bg-pd-ink-3/30 flex items-center justify-center text-white"
              >
                <X className="w-3.5 h-3.5" strokeWidth={3} />
              </button>
            ) : (
              <Mic className="w-[18px] h-[18px] text-pd-action shrink-0" strokeWidth={2} />
            )}
          </div>
        </div>
      </div>

      {q ? (
        <div className="flex-1 pb-28">
          <p className="px-4 pt-4 pb-1 text-[13px] text-pd-ink-2">
            {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for “{searchQuery.trim()}”
          </p>

          {searchResults.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No matching dishes"
              message="Try “biryani”, “kebab”, “butter chicken” or “naan”."
            />
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 md:px-4">
              {searchResults.map((dish, sIdx) => {
                const inCart = findCartItem(cart, dish);
                const img = dish.image && !dish.image.includes('no-image.png') && !dish.image.includes('photo-1701579231305-d7d8af9a3fd') ? dish.image : fallbackFor(dish);
                return (
                  <li
                    key={dish._id || dish.id || sIdx}
                    className="flex items-center gap-4 px-4 md:px-0 py-4 border-b border-[color:var(--pd-line)]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <VegMark veg={isVegDish(dish)} size={13} />
                        {dish.category && <span className="text-[12px] text-pd-ink-3 truncate">{dish.category}</span>}
                      </div>
                      <h4 className="mt-1 text-[16px] leading-[21px] font-semibold text-pd-ink">{dish.name}</h4>
                      <Price value={dish.price} className="block mt-0.5 text-[15px] font-medium text-pd-ink" />
                      {dish.description && (
                        <p className="mt-1 text-[13px] text-pd-ink-2 line-clamp-1">{dish.description}</p>
                      )}
                    </div>
                    <div className="relative shrink-0 w-[96px] pb-3">
                      <div className="w-[96px] h-[96px] rounded-[14px] overflow-hidden bg-pd-surface">
                        <img
                          src={img}
                          alt={dish.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = fallbackFor(dish);
                          }}
                        />
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-0">
                        <AddStepper
                          size="sm"
                          quantity={inCart?.quantity || 0}
                          onAdd={() => onAddToCart(dish)}
                          onIncrement={() => onUpdateCartQty(dish._id || dish.id, 1)}
                          onDecrement={() => onUpdateCartQty(dish._id || dish.id, -1)}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="pb-28">
          <section className="pt-5">
            <h2 className="px-4 flex items-center gap-2 text-[17px] font-semibold text-pd-ink">
              <TrendingUp className="w-[18px] h-[18px] text-pd-ink-2" strokeWidth={2} />
              Popular searches
            </h2>
            <div className="mt-3 px-4 flex flex-wrap gap-2">
              {SEARCH_CRAVINGS.map((craving, idx) => {
                const label = craving.replace('✦ ', '');
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSearchQuery(label)}
                    className="h-9 px-3.5 rounded-full border border-[color:var(--pd-line)] text-[14px] text-pd-ink pd-press"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="pt-8">
            <h2 className="px-4 text-[17px] font-semibold text-pd-ink">Browse by category</h2>
            <div className="mt-4 px-4 grid grid-cols-3 md:grid-cols-6 gap-y-5 gap-x-3">
              {SEARCH_ROUNDELS_GRID.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSearchQuery(item.title)}
                  className="flex flex-col items-center pd-press"
                >
                  <span className="w-[84px] h-[84px] rounded-full overflow-hidden bg-pd-surface">
                    <img src={item.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </span>
                  <span className="mt-2 text-[13px] font-medium text-pd-ink text-center line-clamp-1">{item.title}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default CustomerSearchExplore;
