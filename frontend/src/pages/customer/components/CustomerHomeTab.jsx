import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Minus, Star, Zap, Clock, Tag, Sparkles } from 'lucide-react';
import { CATEGORY_ROUNDELS, RECOMMENDED_FALLBACK } from '../customerAssets';

const CustomerHomeTab = ({
  menu = [],
  categories = [],
  selectedCat = 'All',
  onSelectCat,
  vegOnly = false,
  onToggleVeg,
  fastDeliveryOnly = false,
  onToggleFastDelivery,
  topRatedOnly = false,
  onToggleTopRated,
  cart = [],
  onAddToCart,
  onUpdateCartQty,
  onOpenCart,
  onOpenWallet,
  onOpenSearch,
  offers = [],
  onOfferClick
}) => {
  // Offer Carousel State
  const [activeOfferIdx, setActiveOfferIdx] = useState(0);

  // Auto-slide offers carousel every 5s if multiple offers
  useEffect(() => {
    if (!offers || offers.length <= 1) return;
    const interval = setInterval(() => {
      setActiveOfferIdx((prev) => (prev + 1) % offers.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [offers]);

  // Filter menu items based on selected category and active filters
  const filteredDishes = menu.filter((item) => {
    const matchesCat = selectedCat === 'All' || item.category === selectedCat;
    const isVeg = item.is_veg !== false && !item.category?.toLowerCase().includes('non') && item.veg !== false;
    const matchesVeg = !vegOnly || isVeg;
    const matchesRating = !topRatedOnly || (item.rating && item.rating >= 4.0);
    return matchesCat && matchesVeg && matchesRating && item.available !== false;
  });

  // Recommended dishes
  const recommendedItems = menu.length > 0
    ? menu.filter(item => item.popular || (item.rating && item.rating >= 4.5)).slice(0, 5)
    : RECOMMENDED_FALLBACK;

  // Active or top signature dish for the Irani Cafe style highlight banner
  const spotlightDish = menu.find(i => i.popular) || menu[0] || {
    _id: 'spotlight_1',
    name: '1 x Chicken Samosa (2 pcs)',
    price: 162.72,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3vWIlf2qsiMpWmtxSln4Bj_Md6pQnv_hUpqtQkR7GCrHl_DPxB0Q4AKOu4g5PRHrtsBROn6LWmNpWP_4KSvIIG2UHdOIcwXTbwIuWDWrcbDjF0Zscv2S-RxKQ_iQifk0U8_H8L_tJnCOs9vp0JD3iq9SNAMBnhGKH1iv6SzIdsDe-t7GD-oFTAL6kbeOlqigcD1gTFepAx1rtR7gjwOVeVI067eEidz07lanet5-yWBnm3fsXnk4KXw',
    is_veg: false
  };

  const isSpotlightInCart = cart.find(c => c._id === spotlightDish._id);

  return (
    <div className="flex-1 pb-28">
      {/* ── BEGIN: Dynamic Offers & Promotions Upper Panel (Connected to Admin /api/offers) ── */}
      <section className="bg-gradient-to-b from-[#FFFBF2] to-white px-4 pt-1 pb-3">
        {offers && offers.length > 0 ? (
          /* Dynamic Admin Offer Banner */
          <div
            onClick={() => onOfferClick && onOfferClick(offers[activeOfferIdx])}
            className="relative rounded-2xl p-4 shadow-md border overflow-hidden cursor-pointer transition-all active:scale-[0.99] text-white"
            style={{
              background: offers[activeOfferIdx]?.bg_gradient || 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
              borderColor: `${offers[activeOfferIdx]?.accent_color || '#EAB308'}40`,
            }}
          >
            {/* Ambient Glow */}
            <div
              className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-2xl opacity-30 pointer-events-none"
              style={{ background: offers[activeOfferIdx]?.accent_color || '#EAB308' }}
            />

            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1.5 max-w-[62%]">
                <span
                  className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    background: `${offers[activeOfferIdx]?.accent_color || '#EAB308'}25`,
                    color: offers[activeOfferIdx]?.accent_color || '#EAB308',
                    border: `1px solid ${offers[activeOfferIdx]?.accent_color || '#EAB308'}50`
                  }}
                >
                  {offers[activeOfferIdx]?.badge_text || 'ROYAL SPECIAL'}
                </span>

                <h3 className="text-lg font-black text-white leading-tight line-clamp-1">
                  {offers[activeOfferIdx]?.title}
                </h3>

                <p className="text-xs text-neutral-300 font-medium line-clamp-1">
                  {offers[activeOfferIdx]?.subtitle}
                </p>

                {offers[activeOfferIdx]?.coupon_code && (
                  <div className="inline-flex items-center space-x-1.5 bg-white/10 backdrop-blur-xs border border-white/20 px-2 py-0.5 rounded-lg mt-0.5">
                    <Tag className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] text-neutral-300 font-bold">Code:</span>
                    <span className="text-xs font-black text-[#FFD77D] tracking-wide">
                      {offers[activeOfferIdx]?.coupon_code}
                    </span>
                  </div>
                )}

                <div className="pt-1">
                  <span
                    className="inline-flex items-center space-x-1 text-[11px] font-bold px-3 py-1 rounded-full shadow-xs active:scale-95 transition-transform"
                    style={{
                      background: offers[activeOfferIdx]?.accent_color || '#E23744',
                      color: '#FFFFFF'
                    }}
                  >
                    <span>
                      {offers[activeOfferIdx]?.action === 'reserve'
                        ? 'Book Table 🍽️'
                        : offers[activeOfferIdx]?.action === 'coupon'
                        ? 'Tap to Copy Code 🎟️'
                        : 'Order Now 🛵'}
                    </span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Offer Image */}
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-md relative bg-neutral-900">
                <img
                  src={offers[activeOfferIdx]?.image_url || '/dynamic_images/offer_royal_feast.jpg'}
                  alt={offers[activeOfferIdx]?.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?crop=entropy&cs=srgb&fm=jpg&w=400&q=80';
                  }}
                />
              </div>
            </div>

            {/* Pagination Dots */}
            {offers.length > 1 && (
              <div className="flex justify-center space-x-1.5 mt-3 pt-1 border-t border-white/10 relative z-10">
                {offers.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveOfferIdx(i);
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeOfferIdx ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Default Gold VIP Perk Banner Fallback */
          <div className="relative bg-gradient-to-r from-[#FDE8B3] via-[#F9DC96] to-[#F7D37E] rounded-2xl p-4 shadow-xs border border-amber-200/60 overflow-hidden text-center">
            {/* Delivery Scooter Decorative Graphics */}
            <div className="absolute -left-2 bottom-3 opacity-25">
              <svg className="w-16 h-16 text-amber-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 7a1 1 0 00-1 1v2.1l-1.92-2.88A2 2 0 0014.42 6H12a1 1 0 000 2h2.42l1.6 2.4-2.87 2.15A2.99 2.99 0 0010 11H5a1 1 0 00-1 1v3H3a1 1 0 000 2h1a3 3 0 106 0h4a3 3 0 106 0h2a1 1 0 001-1v-8a1 1 0 00-1-1zm-12 9a1 1 0 110-2 1 1 0 010 2zm10 0a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </div>
            <div className="absolute -right-3 top-2 opacity-25">
              <svg className="w-16 h-16 text-amber-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 7a1 1 0 00-1 1v2.1l-1.92-2.88A2 2 0 0014.42 6H12a1 1 0 000 2h2.42l1.6 2.4-2.87 2.15A2.99 2.99 0 0010 11H5a1 1 0 00-1 1v3H3a1 1 0 000 2h1a3 3 0 106 0h4a3 3 0 106 0h2a1 1 0 001-1v-8a1 1 0 00-1-1zm-12 9a1 1 0 110-2 1 1 0 010 2zm10 0a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </div>

            {/* Envelope Style Banner Graphic */}
            <div className="bg-gradient-to-b from-[#F5DE9B] to-[#ECD080] rounded-xl px-4 py-3 mx-2 border border-amber-300 shadow-inner">
              <p className="text-[11px] font-extrabold text-amber-900 tracking-wider uppercase">
                EXCLUSIVE PERK
              </p>
              <h2 className="text-2xl font-black text-[#5C3F0A] tracking-tight leading-none mt-1">
                FREE DELIVERY
              </h2>
              <p className="text-xs font-bold text-[#7A5816] mt-0.5">above ₹99</p>
            </div>

            {/* Pill Button CTA */}
            <div
              onClick={onOpenWallet}
              className="mt-3 inline-flex items-center justify-center bg-[#1B1915] text-[#FFD77D] text-[11px] font-bold px-4 py-1.5 rounded-full shadow-xs cursor-pointer space-x-1 active:scale-95 transition-transform"
            >
              <span>Renew <strong className="text-[#FFC72C] font-black">GOLD</strong> for 3 months at ₹1</span>
              <svg className="w-3 h-3 text-[#FFC72C]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Carousel Pagination Dots */}
            <div className="flex justify-center space-x-1.5 mt-2.5">
              <span className="w-1.5 h-1.5 bg-neutral-800 rounded-full" />
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
            </div>
          </div>
        )}
      </section>
      {/* ── END: Dynamic Offers & Promotions Upper Panel ── */}

      {/* ── BEGIN: Dishes Category Horizontal Scroll ── */}
      <section className="mt-1">
        <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar px-4 pb-2">
          {CATEGORY_ROUNDELS.map((item) => {
            if (item.isOfferCard) {
              return (
                <div
                  key="offers"
                  onClick={() => onSelectCat('All')}
                  className="flex flex-col items-center shrink-0 cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#E23744] to-[#C11F2C] text-white p-1.5 flex flex-col items-center justify-between shadow-xs">
                    <span className="text-[8px] font-black uppercase leading-tight text-center">
                      BEST OFFERS<br />APPLIED
                    </span>
                    <span className="text-[9px] bg-white/20 px-1 rounded-xs">Explore &gt;</span>
                  </div>
                  <span className="text-[11px] font-medium text-neutral-700 mt-1.5 text-center">
                    Offers
                  </span>
                </div>
              );
            }

            const isActive = selectedCat === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelectCat(item.id)}
                className="flex flex-col items-center shrink-0 cursor-pointer relative pb-1 active:scale-95 transition-transform"
              >
                <div
                  className={`w-16 h-16 rounded-full overflow-hidden border p-0.5 flex items-center justify-center ${
                    isActive
                      ? 'border-[#E23744] ring-2 ring-red-100 bg-red-50/50'
                      : 'border-orange-100 bg-orange-50/50'
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <span
                  className={`text-[11px] mt-1 text-center truncate max-w-[66px] ${
                    isActive ? 'font-bold text-neutral-900' : 'font-medium text-neutral-600'
                  }`}
                >
                  {item.title}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 w-8 h-[2.5px] bg-[#E23744] rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </section>
      {/* ── END: Dishes Category Horizontal Scroll ── */}

      {/* ── BEGIN: Quick Filters Chips ── */}
      <section className="mt-2 px-4">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          {/* Filters dropdown button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center space-x-1 border border-neutral-300 bg-white px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 shadow-xs whitespace-nowrap active:scale-95 transition-transform"
          >
            <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Filters</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {/* Near & Fast filter pill */}
          <button
            onClick={onToggleFastDelivery}
            className={`flex items-center space-x-1 border px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs whitespace-nowrap active:scale-95 transition-transform ${
              fastDeliveryOnly
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-neutral-300 bg-white text-neutral-700'
            }`}
          >
            <span className="text-emerald-600 text-xs">⚡</span>
            <span>Near &amp; Fast</span>
          </button>

          {/* No packaging charges */}
          <button className="border border-neutral-300 bg-white px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 shadow-xs whitespace-nowrap active:scale-95 transition-transform">
            No packaging charges
          </button>

          {/* Pure Veg */}
          <button
            onClick={onToggleVeg}
            className={`border px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs whitespace-nowrap active:scale-95 transition-transform ${
              vegOnly
                ? 'border-green-600 bg-green-50 text-green-700 font-bold'
                : 'border-neutral-300 bg-white text-neutral-700'
            }`}
          >
            Pure Veg
          </button>

          {/* Rated 4.0+ */}
          <button
            onClick={onToggleTopRated}
            className={`border px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs whitespace-nowrap active:scale-95 transition-transform ${
              topRatedOnly
                ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold'
                : 'border-neutral-300 bg-white text-neutral-700'
            }`}
          >
            ★ Rated 4.0+
          </button>
        </div>
      </section>
      {/* ── END: Quick Filters Chips ── */}

      {/* ── BEGIN: Recommended Section ── */}
      <section className="mt-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-extrabold tracking-wider text-neutral-400 uppercase">
            RECOMMENDED FOR YOU
          </h2>
        </div>

        {/* Horizontal Cards Row */}
        <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
          {recommendedItems.map((dish, idx) => {
            const inCart = cart.find(c => c._id === dish._id);
            const discountBadge = idx === 1 ? '₹125 OFF above ₹499' : idx === 2 ? 'Flat 20% OFF' : null;
            return (
              <div
                key={dish._id || idx}
                className="w-[170px] shrink-0 bg-white rounded-2xl border border-neutral-100 shadow-xs overflow-hidden flex flex-col cursor-pointer active:scale-98 transition-transform"
              >
                <div className="relative h-28 w-full bg-neutral-100">
                  <img
                    src={dish.image || '/no-image.png'}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = '/no-image.png'; }}
                  />
                  {/* Discount Badge Overlay */}
                  {discountBadge && (
                    <span className="absolute top-1.5 left-1.5 bg-neutral-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {discountBadge}
                    </span>
                  )}
                  {/* Rating Badge Overlay */}
                  <span className="absolute bottom-2 left-2 bg-[#24963F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center shadow-xs">
                    ★ {dish.rating || '4.5'}
                  </span>
                </div>

                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-neutral-900 truncate">
                      {dish.name}
                    </h3>
                    <p className="text-[10px] text-neutral-700 mt-0.5 flex items-center font-medium">
                      <span className="text-green-600 mr-1">⚡</span> Near &amp; Fast
                    </p>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-neutral-50">
                    <span className="text-xs font-extrabold text-neutral-900">
                      ₹{dish.price}
                    </span>
                    {inCart ? (
                      <div className="flex items-center space-x-1.5 bg-white text-[#E23744] border border-[#E23744] rounded-lg px-1.5 py-0.5 text-xs font-bold">
                        <button
                          onClick={(e) => { e.stopPropagation(); onUpdateCartQty(dish._id, -1); }}
                          className="p-0.5"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span>{inCart.quantity}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onUpdateCartQty(dish._id, 1); }}
                          className="p-0.5"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddToCart(dish); }}
                        className="bg-red-50 text-[#E23744] border border-red-200 text-[11px] font-bold px-2 py-0.5 rounded-lg active:scale-95 transition-transform"
                      >
                        ADD +
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Feature Highlight Row (Irani Cafe Promo Item Style) ── */}
        <div className="mt-4 bg-white rounded-2xl p-3 border border-neutral-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center space-x-1.5">
                <h4 className="font-bold text-sm text-neutral-900">Persian Darbar Special</h4>
                <span className="text-[9px] bg-neutral-100 text-neutral-500 px-1 rounded font-semibold">Ad</span>
              </div>
              <p className="text-[11px] text-neutral-600 flex items-center mt-0.5">
                <span className="text-green-600 mr-1">⚡</span> 20-25 mins
              </p>
            </div>
            <span className="bg-[#24963F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              ★ 4.9
            </span>
          </div>

          <div className="flex items-center space-x-3 bg-neutral-50 p-2 rounded-xl">
            <img
              alt={spotlightDish.name}
              className="w-16 h-16 rounded-lg object-cover shrink-0"
              src={spotlightDish.image || '/no-image.png'}
              onError={(e) => { e.target.src = '/no-image.png'; }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 border border-red-600 flex items-center justify-center p-[2px] rounded-xs shrink-0">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-xs" />
                </span>
                <p className="text-xs font-bold text-neutral-800 truncate">
                  {spotlightDish.name}
                </p>
              </div>
              <p className="text-[11px] font-bold text-neutral-900 mt-1">
                ₹{spotlightDish.price}
              </p>
            </div>

            {cart.length > 0 ? (
              <button
                onClick={onOpenCart}
                className="bg-red-50 text-[#E23744] border border-red-200 text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform whitespace-nowrap"
              >
                View cart ›
              </button>
            ) : (
              <button
                onClick={() => onAddToCart(spotlightDish)}
                className="bg-[#E23744] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg active:scale-95 transition-transform whitespace-nowrap shadow-xs"
              >
                ADD +
              </button>
            )}
          </div>
        </div>
      </section>
      {/* ── END: Recommended Section ── */}

      {/* ── BEGIN: Full Categorized Menu Feed ── */}
      <section className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
          <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
            {selectedCat === 'All' ? 'Full Royal Menu' : `${selectedCat} Specials`}
          </h2>
          <span className="text-xs font-bold text-gray-500">
            {filteredDishes.length} dishes
          </span>
        </div>

        <div className="space-y-4">
          {filteredDishes.map((dish) => {
            const inCart = cart.find(c => c._id === dish._id);
            const isVeg = dish.is_veg !== false && !dish.category?.toLowerCase().includes('non') && dish.veg !== false;
            return (
              <div
                key={dish._id}
                className="flex items-center justify-between p-3 rounded-2xl border border-neutral-100 bg-white shadow-xs gap-3 hover:shadow-sm transition-shadow"
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
                    {dish.rating && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1 rounded">
                        ★ {dish.rating}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-neutral-900 leading-tight">
                    {dish.name}
                  </h3>
                  <p className="text-xs font-extrabold text-neutral-900 mt-1">
                    ₹{dish.price}
                  </p>
                  {dish.description && (
                    <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5 leading-snug">
                      {dish.description}
                    </p>
                  )}
                </div>

                {/* Dish Image + Add Button */}
                <div className="relative shrink-0 w-28 h-28 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-100">
                  <img
                    src={dish.image || '/no-image.png'}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = '/no-image.png'; }}
                  />

                  {/* Overlapping ADD button */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[84%]">
                    {inCart ? (
                      <div className="flex items-center justify-between bg-white text-[#E23744] border border-[#E23744] rounded-lg shadow-sm px-2 py-0.5 text-xs font-black">
                        <button
                          onClick={() => onUpdateCartQty(dish._id, -1)}
                          className="p-0.5 active:scale-75 transition-transform"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span>{inCart.quantity}</span>
                        <button
                          onClick={() => onUpdateCartQty(dish._id, 1)}
                          className="p-0.5 active:scale-75 transition-transform"
                        >
                          <Plus className="w-3.5 h-3.5" />
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
      </section>
      {/* ── END: Full Categorized Menu Feed ── */}
    </div>
  );
};

export default CustomerHomeTab;
