import React, { useState, useEffect } from 'react';
import { Plus, Minus, Star, Zap, Clock, Tag, Sparkles } from 'lucide-react';
import { PERSIAN_DARBAR_CATEGORIES, DEFAULT_PERSIAN_DARBAR_OFFERS } from '../customerAssets';

const CustomerHomeTab = ({
  menu = [],
  selectedCat = 'All',
  onSelectCat,
  cart = [],
  onAddToCart,
  onUpdateCartQty,
  onOpenCart,
  onOpenWallet,
  onOpenSearch,
  offers = [],
  onOfferClick,
  onGoToReserve
}) => {
  // Offer Carousel State
  const [activeOfferIdx, setActiveOfferIdx] = useState(0);

  // Active offers (from Admin API or authentic defaults)
  const activeOffersList = offers && offers.length > 0 ? offers : DEFAULT_PERSIAN_DARBAR_OFFERS;

  // Auto-slide offers carousel every 5s if multiple offers
  useEffect(() => {
    if (!activeOffersList || activeOffersList.length <= 1) return;
    const interval = setInterval(() => {
      setActiveOfferIdx((prev) => (prev + 1) % activeOffersList.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeOffersList]);

  // Robust, flexible category matcher so clicking ANY category displays dishes instantly
  const matchCategory = (item, cat) => {
    if (!cat || cat === 'All') return true;
    const itemCat = (item.category || '').toLowerCase();
    const itemName = (item.name || '').toLowerCase();
    const targetCat = cat.toLowerCase();

    if (itemCat === targetCat) return true;

    if (targetCat === 'biryani') {
      return itemCat.includes('biryani') || itemName.includes('biryani');
    }
    if (targetCat === 'kebabs') {
      return (
        itemCat.includes('kebab') ||
        itemCat.includes('starter') ||
        itemName.includes('kebab') ||
        itemName.includes('tikka') ||
        itemName.includes('tandoor') ||
        itemName.includes('chop')
      );
    }
    if (targetCat === 'mughlai') {
      return (
        itemCat.includes('mughlai') ||
        itemCat.includes('curry') ||
        itemCat.includes('main') ||
        itemName.includes('chicken') ||
        itemName.includes('mutton')
      );
    }
    if (targetCat === 'starters') {
      return itemCat.includes('starter') || itemName.includes('fry') || itemName.includes('roll');
    }
    if (targetCat === 'main course') {
      return itemCat.includes('main') || itemCat.includes('curry') || itemCat.includes('mughlai');
    }
    if (targetCat === 'breads') {
      return (
        itemCat.includes('bread') ||
        itemCat.includes('roti') ||
        itemName.includes('naan') ||
        itemName.includes('roti') ||
        itemName.includes('paratha')
      );
    }
    if (targetCat === 'desserts') {
      return (
        itemCat.includes('dessert') ||
        itemCat.includes('sweet') ||
        itemName.includes('tukda') ||
        itemName.includes('firni') ||
        itemName.includes('kulfi') ||
        itemName.includes('halwa')
      );
    }
    if (targetCat === 'beverages') {
      return (
        itemCat.includes('beverage') ||
        itemCat.includes('drink') ||
        itemName.includes('chai') ||
        itemName.includes('lassi') ||
        itemName.includes('juice')
      );
    }

    return itemCat.includes(targetCat);
  };

  // Filtered dishes
  const filteredDishes = menu.filter((item) => {
    return matchCategory(item, selectedCat) && item.available !== false;
  });

  // Recommended chef specials from real menu
  const chefSpecials = menu.filter(item => item.popular || (item.rating && item.rating >= 4.5)).slice(0, 6);
  const displayedChefSpecials = chefSpecials.length > 0 ? chefSpecials : menu.slice(0, 6);

  const currentOffer = activeOffersList[activeOfferIdx] || activeOffersList[0];

  return (
    <div className="flex-1 pb-28">
      {/* ── BEGIN: Connected Admin Offers Carousel Banner ── */}
      <section className="bg-gradient-to-b from-[#FFFBF2] to-white px-4 pt-2 pb-3">
        {currentOffer && (
          <div
            onClick={() => onOfferClick && onOfferClick(currentOffer)}
            className="relative rounded-3xl p-4 shadow-md border overflow-hidden cursor-pointer transition-all active:scale-[0.99] text-white"
            style={{
              background: currentOffer.bg_gradient || 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
              borderColor: `${currentOffer.accent_color || '#EAB308'}40`,
            }}
          >
            {/* Ambient Lighting Glow */}
            <div
              className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full blur-2xl opacity-25 pointer-events-none"
              style={{ background: currentOffer.accent_color || '#EAB308' }}
            />

            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1 max-w-[62%]">
                <span
                  className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    background: `${currentOffer.accent_color || '#EAB308'}25`,
                    color: currentOffer.accent_color || '#EAB308',
                    border: `1px solid ${currentOffer.accent_color || '#EAB308'}50`
                  }}
                >
                  {currentOffer.badge_text || 'ROYAL OFFER'}
                </span>

                <h3 className="text-base font-black text-white leading-tight line-clamp-1 mt-0.5">
                  {currentOffer.title}
                </h3>

                <p className="text-[11px] text-neutral-300 font-medium line-clamp-1">
                  {currentOffer.subtitle}
                </p>

                {currentOffer.coupon_code && (
                  <div className="inline-flex items-center space-x-1.5 bg-white/10 backdrop-blur-xs border border-white/20 px-2 py-0.5 rounded-lg mt-0.5">
                    <Tag className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] text-neutral-300 font-bold">Code:</span>
                    <span className="text-xs font-black text-[#FFD77D] tracking-wide">
                      {currentOffer.coupon_code}
                    </span>
                  </div>
                )}

                <div className="pt-1">
                  <span
                    className="inline-flex items-center space-x-1 text-[11px] font-black px-3 py-1 rounded-full shadow-xs active:scale-95 transition-transform"
                    style={{
                      background: currentOffer.accent_color || '#E23744',
                      color: '#FFFFFF'
                    }}
                  >
                    <span>
                      {currentOffer.action === 'reserve'
                        ? 'Book Royal Table 🍽️'
                        : 'Tap to Apply Offer 🎟️'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Offer Image */}
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-md relative bg-neutral-900">
                <img
                  src={currentOffer.image_url || '/dynamic_images/img1.jpeg'}
                  alt={currentOffer.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/dynamic_images/img1.jpeg';
                  }}
                />
              </div>
            </div>

            {/* Pagination Dots */}
            {activeOffersList.length > 1 && (
              <div className="flex justify-center space-x-1.5 mt-2.5 pt-1 border-t border-white/10 relative z-10">
                {activeOffersList.map((_, i) => (
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
        )}
      </section>
      {/* ── END: Connected Admin Offers Carousel Banner ── */}

      {/* ── BEGIN: Dishes Category Horizontal Scroll ── */}
      <section className="mt-1">
        <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar px-4 pb-2">
          {PERSIAN_DARBAR_CATEGORIES.map((item) => {
            const isActive = selectedCat.toLowerCase() === item.id.toLowerCase();
            return (
              <div
                key={item.id}
                onClick={() => onSelectCat(item.id)}
                className="flex flex-col items-center shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                <div
                  className={`w-16 h-16 rounded-full overflow-hidden p-[2px] transition-all ${
                    isActive
                      ? 'border-2 border-[#E23744] shadow-md scale-105'
                      : 'border border-neutral-200/80 shadow-xs'
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span
                  className={`text-[11px] mt-1.5 text-center whitespace-nowrap transition-colors ${
                    isActive
                      ? 'font-black text-[#E23744]'
                      : 'font-semibold text-neutral-700'
                  }`}
                >
                  {item.title}
                </span>
                {isActive && (
                  <span className="w-4 h-0.5 bg-[#E23744] rounded-full mt-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </section>
      {/* ── END: Dishes Category Horizontal Scroll ── */}

      {/* ── BEGIN: Chef's Royal Specials Section ── */}
      {selectedCat === 'All' && displayedChefSpecials.length > 0 && (
        <section className="mt-4 px-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-black text-neutral-900 uppercase tracking-tight flex items-center space-x-1.5">
                <span>CHEF'S ROYAL SPECIALS</span>
                <span className="text-amber-500">👑</span>
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium">
                Persian Darbar signature delicacies
              </p>
            </div>
            <button
              onClick={() => onSelectCat('Biryani')}
              className="text-xs font-black text-[#E23744] hover:underline"
            >
              Full Menu ›
            </button>
          </div>

          <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
            {displayedChefSpecials.map((dish) => {
              const inCart = cart.find(c => c._id === dish._id);
              return (
                <div
                  key={dish._id}
                  className="w-44 shrink-0 bg-white rounded-2xl border border-neutral-200/80 overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div className="relative h-28 w-full bg-neutral-100">
                    <img
                      src={dish.image || '/dynamic_images/img1.jpeg'}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/no-image.png';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center space-x-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{dish.rating || '4.8'}</span>
                    </div>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-neutral-900 leading-tight line-clamp-1">
                        {dish.name}
                      </h4>
                      <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                        {dish.description || 'Authentic Persian Darbar secret recipe'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                      <span className="text-xs font-black text-neutral-900">
                        ₹{dish.price}
                      </span>

                      {inCart ? (
                        <div className="flex items-center space-x-1.5 bg-red-50 text-[#E23744] border border-[#E23744] rounded-lg px-2 py-0.5 text-xs font-bold">
                          <button onClick={() => onUpdateCartQty(dish._id, -1)}>
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black">{inCart.quantity}</span>
                          <button onClick={() => onUpdateCartQty(dish._id, 1)}>
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onAddToCart(dish)}
                          className="bg-red-50 hover:bg-[#E23744] hover:text-white text-[#E23744] border border-red-200 font-black text-[11px] px-3 py-1 rounded-lg transition-colors active:scale-95"
                        >
                          + ADD
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── BEGIN: All Filtered Dishes Feed ── */}
      <section className="mt-4 px-4 space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
          <h2 className="text-sm font-black text-neutral-900 uppercase tracking-tight">
            {selectedCat === 'All' ? 'ALL DISHES' : selectedCat.toUpperCase()} ({filteredDishes.length})
          </h2>
          {selectedCat !== 'All' && (
            <button
              onClick={() => onSelectCat('All')}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-900"
            >
              Clear Filter ✕
            </button>
          )}
        </div>

        {filteredDishes.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-neutral-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 text-[#E23744] flex items-center justify-center mx-auto text-xl font-black">
              🍽️
            </div>
            <h4 className="font-extrabold text-sm text-neutral-900">
              No dishes found under "{selectedCat}"
            </h4>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Please choose another royal category or tap "All Dishes".
            </p>
            <button
              onClick={() => onSelectCat('All')}
              className="bg-[#E23744] text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs"
            >
              Show All Dishes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDishes.map((dish) => {
              const inCart = cart.find(c => c._id === dish._id);
              return (
                <div
                  key={dish._id}
                  className="bg-white rounded-2xl p-3.5 border border-neutral-200/80 shadow-xs flex items-center justify-between gap-3 transition-all hover:border-neutral-300"
                >
                  <div className="flex-1 pr-1">
                    <span className="text-[10px] font-black text-[#E23744] bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                      {dish.category}
                    </span>
                    <h3 className="font-extrabold text-sm text-neutral-900 mt-1 leading-tight">
                      {dish.name}
                    </h3>
                    <p className="text-xs font-black text-neutral-900 mt-1">
                      ₹{dish.price}
                    </p>
                    {dish.description && (
                      <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5">
                        {dish.description}
                      </p>
                    )}
                  </div>

                  {/* Dish Image & Add Action */}
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-neutral-100 border border-neutral-100">
                    <img
                      src={dish.image || '/dynamic_images/img1.jpeg'}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/no-image.png';
                      }}
                    />
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[88%]">
                      {inCart ? (
                        <div className="flex items-center justify-between bg-white text-[#E23744] border border-[#E23744] rounded-lg shadow-md px-2 py-0.5 text-xs font-bold">
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
      </section>

      {/* ── Table Reservation Quick Banner ── */}
      <section className="mt-5 px-4">
        <div
          onClick={onGoToReserve}
          className="bg-neutral-900 text-white rounded-3xl p-4 flex items-center justify-between shadow-md cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
              FINE DINING · SINCE 1978
            </span>
            <h3 className="text-sm font-black leading-tight text-white">
              Reserve Your Royal Table
            </h3>
            <p className="text-[11px] text-neutral-400">
              Guaranteed seating across all 4 Persian Darbar outlets
            </p>
          </div>
          <button className="bg-[#E23744] text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-xs shrink-0">
            Book Table ›
          </button>
        </div>
      </section>
    </div>
  );
};

export default CustomerHomeTab;
