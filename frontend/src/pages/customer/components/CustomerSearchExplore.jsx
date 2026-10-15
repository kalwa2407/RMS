import React, { useRef, useEffect } from 'react';
import { ChevronLeft, Search, X, Mic, Plus, Minus } from 'lucide-react';
import { SEARCH_CRAVINGS, SEARCH_ROUNDELS_GRID } from '../customerAssets';

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

  const searchResults = searchQuery.trim()
    ? menu.filter(item =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto no-scrollbar max-w-[430px] mx-auto">
      {/* ── Search Header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 pt-3 pb-3">
        <div className="flex items-center gap-2.5">
          {/* Back Navigation Button */}
          <button
            onClick={onClose}
            aria-label="Back"
            className="p-1 -ml-1 text-gray-700 active:opacity-60 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
          </button>

          {/* Search Input Bar */}
          <div className="flex-1 flex items-center justify-between border border-gray-200 bg-white rounded-xl px-3.5 py-2 shadow-xs">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, biryani, curries..."
              className="w-full bg-transparent border-none p-0 text-[14px] font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <Mic className="w-4 h-4 text-[#E23744]" />
            )}
          </div>
        </div>
      </div>

      {/* ── If Searching: Show Live Results ── */}
      {searchQuery.trim() ? (
        <div className="p-4 flex-1 pb-24">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            {searchResults.length} RESULTS FOR "{searchQuery}"
          </p>

          {searchResults.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-3 text-2xl">
                🔍
              </div>
              <h3 className="font-bold text-base text-gray-900">No dishes found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Try searching for "Biryani", "Kebabs", "Chicken Curry" or "Paratha".
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((dish) => {
                const inCart = cart.find(c => c._id === dish._id);
                const isVeg = dish.is_veg !== false && !dish.category?.toLowerCase().includes('non') && dish.veg !== false;
                return (
                  <div
                    key={dish._id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-white shadow-xs gap-3"
                  >
                    <div className="flex-1 pr-1">
                      {/* Veg / Non-Veg Indicator */}
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span
                          className={`w-3.5 h-3.5 border flex items-center justify-center p-[2px] rounded-xs ${
                            isVeg ? 'border-green-600' : 'border-red-600'
                          }`}
                        >
                          {isVeg ? (
                            <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                          ) : (
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-xs" />
                          )}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                          {dish.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-neutral-900 leading-tight">
                        {dish.name}
                      </h4>
                      <p className="text-xs font-extrabold text-neutral-900 mt-1">
                        ₹{dish.price}
                      </p>
                      {dish.description && (
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                          {dish.description}
                        </p>
                      )}
                    </div>

                    {/* Dish Image + Add Button */}
                    <div className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                      <img
                        src={dish.image || '/no-image.png'}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/no-image.png';
                        }}
                      />
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[82%]">
                        {inCart ? (
                          <div className="flex items-center justify-between bg-white text-[#E23744] border border-[#E23744] rounded-lg shadow-sm px-2 py-0.5 text-xs font-bold">
                            <button
                              onClick={() => onUpdateCartQty(dish._id, -1)}
                              className="p-0.5 active:scale-75 transition-transform"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span>{inCart.quantity}</span>
                            <button
                              onClick={() => onUpdateCartQty(dish._id, 1)}
                              className="p-0.5 active:scale-75 transition-transform"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onAddToCart(dish)}
                            className="w-full bg-white text-[#E23744] border border-red-200 hover:border-[#E23744] rounded-lg shadow-xs py-1 text-xs font-black uppercase tracking-wider active:scale-95 transition-all text-center"
                          >
                            ADD
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── If Not Searching: Show Cravings & What's on your mind ── */
        <div className="p-4 space-y-6 pb-24">
          {/* Think it, search it */}
          <div>
            <h2 className="font-script text-2xl text-[#E23744] font-bold tracking-wide">
              Think it, search it
            </h2>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2.5 mt-1">
              {SEARCH_CRAVINGS.map((craving, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(craving.replace('✦ ', ''))}
                  className="shrink-0 bg-white border border-gray-200 hover:border-[#E23744] hover:text-[#E23744] px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-700 shadow-xs active:scale-95 transition-all whitespace-nowrap"
                >
                  {craving}
                </button>
              ))}
            </div>
          </div>

          {/* WHAT'S ON YOUR MIND? 3-Column Roundels Grid */}
          <div>
            <h3 className="text-xs font-extrabold tracking-wider text-gray-400 uppercase mb-4">
              WHAT'S ON YOUR MIND?
            </h3>
            <div className="grid grid-cols-3 gap-y-5 gap-x-3">
              {SEARCH_ROUNDELS_GRID.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSearchQuery(item.title)}
                  className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-100 shadow-xs group-hover:border-[#E23744] transition-colors">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-[12px] font-bold text-gray-800 mt-2 text-center line-clamp-1">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSearchExplore;
