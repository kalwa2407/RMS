import React, { useRef, useEffect } from 'react';
import { ChevronLeft, Search, X, Mic, Plus, Minus, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto no-scrollbar max-w-[430px] mx-auto animate-in fade-in duration-200">
      {/* ── Search Header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-100 px-4 pt-3 pb-3">
        <div className="flex items-center gap-2.5">
          {/* Back Navigation Button */}
          <button
            onClick={onClose}
            aria-label="Back"
            className="p-1 -ml-1 text-neutral-700 active:opacity-60 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
          </button>

          {/* Search Input Bar */}
          <div className="flex-1 flex items-center justify-between border border-neutral-200 bg-neutral-50/80 rounded-2xl px-3.5 py-2 shadow-xs">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, biryani, curries, kebabs..."
              className="w-full bg-transparent border-none p-0 text-sm font-bold text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-0"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <Mic className="w-4 h-4 text-[#E23744]" />
            )}
          </div>
        </div>
      </div>

      {/* ── If Searching: Show Live Results from real menu ── */}
      {searchQuery.trim() ? (
        <div className="p-4 flex-1 pb-24">
          <p className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-3">
            {searchResults.length} {searchResults.length === 1 ? 'DISH FOUND' : 'DISHES FOUND'} FOR "{searchQuery}"
          </p>

          {searchResults.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-red-50 text-[#E23744] mx-auto flex items-center justify-center mb-3 text-2xl font-black">
                🍽️
              </div>
              <h3 className="font-extrabold text-base text-neutral-900">No dishes matched</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Try searching for "Biryani", "Tandoori Mumtaz", "Mutton Barra", "Butter Chicken" or "Naan".
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((dish) => {
                const inCart = cart.find(c => c._id === dish._id);
                return (
                  <div
                    key={dish._id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-neutral-200/80 bg-white shadow-xs gap-3"
                  >
                    <div className="flex-1 pr-1">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span className="text-[10px] font-black text-[#E23744] bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                          {dish.category}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-neutral-900 leading-tight">
                        {dish.name}
                      </h4>
                      <p className="text-xs font-black text-neutral-900 mt-1">
                        ₹{dish.price}
                      </p>
                      {dish.description && (
                        <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                          {dish.description}
                        </p>
                      )}
                    </div>

                    {/* Dish Image & Add to Cart button */}
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-neutral-100 border border-neutral-100">
                      <img
                        src={dish.image || '/dynamic_images/img1.jpeg'}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/no-image.png';
                        }}
                      />
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[88%]">
                        {inCart ? (
                          <div className="flex items-center justify-between bg-white text-[#E23744] border border-[#E23744] rounded-lg shadow-sm px-2 py-0.5 text-xs font-bold">
                            <button
                              onClick={() => onUpdateCartQty(dish._id, -1)}
                              className="p-0.5 active:scale-75 transition-transform"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-black">{inCart.quantity}</span>
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
                            className="w-full bg-white text-[#E23744] border border-red-200 hover:border-[#E23744] rounded-lg shadow-xs py-1 text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all text-center"
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
        /* ── If Not Searching: Regal Persian Darbar Cravings & Grid ── */
        <div className="p-4 space-y-5 pb-24">
          {/* Changed Quote: Regal Persian Darbar Header */}
          <div>
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
              <h2 className="text-xl text-neutral-900 font-black tracking-tight">
                Craving Royal Flavours?
              </h2>
            </div>
            <p className="text-[11px] font-semibold text-neutral-500 mt-0.5">
              Fresh basmati biryanis, charcoal kebabs & Mughlai feasts
            </p>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2.5 mt-1">
              {SEARCH_CRAVINGS.map((craving, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(craving.replace('✦ ', ''))}
                  className="shrink-0 bg-white border border-neutral-200 hover:border-[#E23744] hover:text-[#E23744] px-3.5 py-1.5 rounded-full text-xs font-bold text-neutral-700 shadow-xs active:scale-95 transition-all whitespace-nowrap"
                >
                  {craving}
                </button>
              ))}
            </div>
          </div>

          {/* WHAT'S ON YOUR MIND? Real dishes with beautiful circular roundels */}
          <div>
            <h3 className="text-xs font-black tracking-wider text-neutral-400 uppercase mb-3.5">
              WHAT'S ON YOUR MIND?
            </h3>
            <div className="grid grid-cols-3 gap-y-4 gap-x-3">
              {SEARCH_ROUNDELS_GRID.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSearchQuery(item.title)}
                  className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-neutral-100 shadow-xs group-hover:border-[#E23744] transition-colors bg-neutral-100 p-0.5">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-xs font-bold text-neutral-900 mt-1.5 text-center line-clamp-1">
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
