import React, { useState, useEffect } from 'react';
import { Plus, Minus, Star, Tag, Sparkles, Clock, Crown, ChevronRight, Award, ShieldCheck } from 'lucide-react';
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
  onGoToOrder,
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

  const currentOffer = activeOffersList[activeOfferIdx] || activeOffersList[0];

  // Signature chef specials from real menu
  const chefSpecials = menu.filter(item => item.popular || (item.rating && item.rating >= 4.5)).slice(0, 6);
  const displayedChefSpecials = chefSpecials.length > 0 ? chefSpecials : menu.slice(0, 6);

  return (
    <div className="flex-1 pb-28">
      {/* ── BEGIN: Grand Royal Offer Hero Section (Expanded & Matching Screenshot 4 Aesthetics) ── */}
      <section className="bg-gradient-to-b from-[#FFF5D6] via-[#FFF8E7] to-[#F8F9FA] px-4 pt-2 pb-4">
        {currentOffer && (
          <div
            onClick={() => onOfferClick && onOfferClick(currentOffer)}
            className="relative rounded-3xl p-5 shadow-sm border border-amber-300/80 overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
            style={{
              background: currentOffer.bg_gradient || 'linear-gradient(135deg, #FFF5D6 0%, #FDE8B3 50%, #F9DC96 100%)',
            }}
          >
            {/* Ambient Watermark Crest Graphics */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 opacity-15 pointer-events-none">
              <svg className="w-full h-full text-amber-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col justify-between space-y-3">
              {/* Badge & Outlet Guarantee */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#1C1917] text-amber-300 border border-amber-400/50 shadow-xs">
                  {currentOffer.badge_text || 'ROYAL PRIVILEGE'}
                </span>
                <span className="text-[10px] font-extrabold text-amber-900/80 bg-white/70 px-2.5 py-0.5 rounded-full border border-amber-300/60">
                  ⚡ 4 Outlets Connected
                </span>
              </div>

              {/* Big Golden Envelope Style Headline */}
              <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-amber-300 shadow-inner">
                <p className="text-[11px] font-black text-amber-900 tracking-wider uppercase">
                  {currentOffer.subtitle || 'SPECIAL OFFER'}
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-[#451A03] tracking-tight leading-none mt-1">
                  {currentOffer.title}
                </h2>
                <p className="text-xs font-bold text-amber-800 mt-1 flex items-center space-x-1">
                  <span>🛵 {currentOffer.highlight_text || 'FREE DELIVERY ON ORDERS ABOVE ₹99'}</span>
                </p>
              </div>

              {/* Bottom Action & Coupon Row */}
              <div className="flex items-center justify-between pt-1">
                {currentOffer.coupon_code ? (
                  <div className="inline-flex items-center space-x-1.5 bg-[#1C1917] text-amber-300 px-3 py-1.5 rounded-full border border-amber-400/50 shadow-xs">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] text-neutral-300 font-bold">Code:</span>
                    <span className="text-xs font-black tracking-wider text-amber-300">
                      {currentOffer.coupon_code}
                    </span>
                  </div>
                ) : (
                  <div />
                )}

                <span className="inline-flex items-center space-x-1 text-xs font-black bg-[#E23744] text-white px-4 py-2 rounded-full shadow-md active:scale-95 transition-transform">
                  <span>{currentOffer.action === 'reserve' ? 'Book Table ›' : 'Order Now ›'}</span>
                </span>
              </div>
            </div>

            {/* Pagination Dots */}
            {activeOffersList.length > 1 && (
              <div className="flex justify-center space-x-1.5 mt-3 pt-2 border-t border-amber-300/60 relative z-10">
                {activeOffersList.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveOfferIdx(i);
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeOfferIdx ? 'w-6 bg-[#451A03]' : 'w-1.5 bg-amber-900/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
      {/* ── END: Grand Royal Offer Hero Section ── */}

      {/* ── BEGIN: Category Quick Roundels (Matching Screenshot 4) ── */}
      <section className="mt-2 px-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-black text-neutral-400 uppercase tracking-wider">
            EXPLORE PERSIAN DARBAR MENU
          </h2>
          <button
            onClick={onGoToOrder}
            className="text-xs font-black text-[#E23744] hover:underline"
          >
            See All Menu ›
          </button>
        </div>

        <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-2">
          {/* First Card: BEST OFFERS APPLIED (as in Screenshot 4) */}
          <div
            onClick={() => onSelectCat('All')}
            className="flex flex-col items-center shrink-0 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E23744] to-[#B91C1C] text-white p-2 flex flex-col items-center justify-between shadow-xs">
              <span className="text-[8px] font-black uppercase leading-tight text-center">
                BEST OFFERS<br />APPLIED
              </span>
              <span className="text-[9px] bg-white/20 font-bold px-1.5 py-0.2 rounded-md">
                Explore ›
              </span>
            </div>
            <span className="text-[11px] font-extrabold text-neutral-800 mt-1.5 text-center">
              Offers
            </span>
          </div>

          {/* Dish Category Roundels with Clean Food Cutout Aesthetic */}
          {PERSIAN_DARBAR_CATEGORIES.map((item) => {
            const isActive = selectedCat.toLowerCase() === item.id.toLowerCase();
            return (
              <div
                key={item.id}
                onClick={() => {
                  onSelectCat(item.id);
                  onGoToOrder();
                }}
                className="flex flex-col items-center shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                <div
                  className={`w-16 h-16 rounded-full overflow-hidden p-[2px] transition-all bg-white ${
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
      {/* ── END: Category Quick Roundels ── */}

      {/* ── BEGIN: Chef's Royal Specials Carousel ── */}
      {displayedChefSpecials.length > 0 && (
        <section className="mt-5 px-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-black text-neutral-900 uppercase tracking-tight flex items-center space-x-1.5">
                <span>CHEF'S ROYAL SPECIALS</span>
                <span className="text-amber-500">👑</span>
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium">
                Persian Darbar signature culinary masterpieces
              </p>
            </div>
            <button
              onClick={onGoToOrder}
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
                  className="w-44 shrink-0 bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-xs flex flex-col justify-between"
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

      {/* ── BEGIN: Table Reservation Royal Showcase ── */}
      <section className="mt-5 px-4">
        <div
          onClick={onGoToReserve}
          className="bg-gradient-to-r from-[#1C1917] via-[#2A241E] to-[#1C1917] border border-amber-400/40 text-white rounded-3xl p-5 flex items-center justify-between shadow-lg cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="space-y-1 max-w-[70%]">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center space-x-1">
              <Crown className="w-3 h-3 fill-amber-400" />
              <span>DINE IN ROYAL AMBIANCE</span>
            </span>
            <h3 className="text-base font-black leading-tight text-white mt-1">
              Book Your Royal Table
            </h3>
            <p className="text-[11px] text-neutral-300 font-medium">
              Guaranteed seating across all 4 Persian Darbar outlets with 10% PD Coins on bill.
            </p>
          </div>
          <button className="bg-[#E23744] hover:bg-[#C11F2C] text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-md shrink-0">
            Reserve ›
          </button>
        </div>
      </section>

      {/* ── BEGIN: Persian Darbar Heritage & Trust ── */}
      <section className="mt-6 px-4">
        <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">
              ORIGINAL PERSIA TO INDIA · SINCE 1978
            </h3>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed font-medium">
            Over 45 years of authentic Mughlai, Persian & coastal recipes crafted with slow-cooked aromatic basmati, hand-ground spices, and charcoal roasted tandoors.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-100 text-center">
            <div className="p-2 bg-neutral-50 rounded-xl">
              <span className="text-sm font-black text-neutral-900 block">45+</span>
              <span className="text-[10px] text-neutral-500 font-bold">Years Legacy</span>
            </div>
            <div className="p-2 bg-neutral-50 rounded-xl">
              <span className="text-sm font-black text-neutral-900 block">4.8 ★</span>
              <span className="text-[10px] text-neutral-500 font-bold">Patron Rating</span>
            </div>
            <div className="p-2 bg-neutral-50 rounded-xl">
              <span className="text-sm font-black text-neutral-900 block">4 Hubs</span>
              <span className="text-[10px] text-neutral-500 font-bold">Bandra · Pune</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomerHomeTab;
