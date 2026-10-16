import React, { useState } from 'react';
import { Plus, Minus, Star, Crown, UtensilsCrossed, Bookmark, Share2 } from 'lucide-react';
import { PERSIAN_DARBAR_CATEGORIES, getDishMetrics } from '../customerAssets';
import CustomerDishDetailModal from './CustomerDishDetailModal';

const CustomerOrderTab = ({
  menu = [],
  selectedCat = 'All',
  onSelectCat,
  cart = [],
  onAddToCart,
  onUpdateCartQty,
  onOpenCart,
  onOpenSearch,
  searchQuery = '',
  appliedCoupon,
  offers = [],
  onApplyCoupon,
  onRemoveCoupon
}) => {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'veg' | 'nonveg' | 'bestseller'
  const [selectedDishDetail, setSelectedDishDetail] = useState(null);
  const [bookmarkedDishes, setBookmarkedDishes] = useState({});

  const toggleBookmark = (dishId, e) => {
    e?.stopPropagation();
    setBookmarkedDishes((prev) => ({ ...prev, [dishId]: !prev[dishId] }));
  };

  const handleShareDish = (dish, e) => {
    e?.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `${dish.name} - Persian Darbar`,
        text: `Order ${dish.name} (₹${dish.price}) from Persian Darbar!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText?.(window.location.href);
    }
  };

  // Category matching helper
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
    const matchesCat = matchCategory(item, selectedCat);
    const isVeg = item.is_veg === true ||
      item.veg === true ||
      (item.category || '').toLowerCase().includes('veg') ||
      (item.name || '').toLowerCase().includes('paneer') ||
      (item.name || '').toLowerCase().includes('dal');

    let matchesType = true;
    if (filterType === 'veg') matchesType = isVeg;
    else if (filterType === 'nonveg') matchesType = !isVeg;
    else if (filterType === 'bestseller') matchesType = item.popular || (item.rating && item.rating >= 4.5);

    return matchesCat && matchesType && item.available !== false;
  });

  return (
    <div className="flex-1 pb-28">
      {/* ── Top Offer Bar: Only shown when active offers exist ── */}
      {(() => {
        const activeOffers = (offers || []).filter(
          (o) => o.active !== false && o.is_active !== false && (o.coupon_code || o.code || o.title)
        );
        if (activeOffers.length === 0) return null;

        const currentOffer = activeOffers[0];
        const couponCode = currentOffer.coupon_code || currentOffer.code || 'DARBAR30';
        const isApplied = appliedCoupon?.code?.toUpperCase() === couponCode.toUpperCase();

        return (
          <section className="bg-gradient-to-b from-[#FFF5D6] via-[#FFF8E7] to-white px-4 pt-2 pb-3 border-b border-amber-200/50">
            <div
              onClick={() => {
                if (isApplied) {
                  onRemoveCoupon && onRemoveCoupon();
                } else {
                  onApplyCoupon && onApplyCoupon(couponCode);
                }
              }}
              className="flex items-center justify-between bg-white/95 hover:bg-white border border-amber-300/80 rounded-2xl px-3.5 py-2 shadow-xs cursor-pointer active:scale-98 transition-all"
            >
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-[#E23744] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                  %
                </span>
                <span className="text-xs font-black text-neutral-900 truncate">
                  {isApplied
                    ? `Coupon ${couponCode} Applied!`
                    : (currentOffer.title
                        ? `${currentOffer.title} with code ${couponCode}`
                        : `Save with code ${couponCode}`)}
                </span>
              </div>
              <button
                type="button"
                className={`text-[10px] font-black px-2.5 py-1 rounded-md shrink-0 transition-colors ${
                  isApplied
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-300'
                    : 'text-[#E23744] bg-red-50 border border-red-200 hover:bg-[#E23744] hover:text-white'
                }`}
              >
                {isApplied ? 'Applied ✓' : 'Save on Bill'}
              </button>
            </div>
          </section>
        );
      })()}

      {/* ── Category Roundels Scroll Bar ── */}
      <section className="bg-white border-b border-neutral-100 py-2.5">
        <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar px-4">
          {/* Best Offers Applied Card */}
          <div
            onClick={() => onSelectCat('All')}
            className="flex flex-col items-center shrink-0 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E23744] to-[#B91C1C] text-white p-1.5 flex flex-col items-center justify-between shadow-xs">
              <span className="text-[7.5px] font-black uppercase leading-tight text-center">
                BEST OFFERS<br />APPLIED
              </span>
              <span className="text-[8px] bg-white/20 font-bold px-1 rounded-xs">
                Explore ›
              </span>
            </div>
            <span className="text-[10px] font-extrabold text-neutral-800 mt-1 text-center">
              Offers
            </span>
          </div>

          {/* Food Roundels */}
          {PERSIAN_DARBAR_CATEGORIES.map((item) => {
            const isActive = selectedCat.toLowerCase() === item.id.toLowerCase();
            return (
              <div
                key={item.id}
                onClick={() => onSelectCat(item.id)}
                className="flex flex-col items-center shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                <div
                  className={`w-14 h-14 rounded-full overflow-hidden p-[2px] transition-all bg-white ${
                    isActive
                      ? 'border-2 border-[#E23744] shadow-sm scale-105'
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
                  className={`text-[10px] mt-1 text-center whitespace-nowrap transition-colors ${
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

      {/* ── Filter Chips (Veg / Non-veg / Bestsellers - Matching Screenshot 2 & 3) ── */}
      <section className="px-4 pt-3 pb-1 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
              : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          All ({filteredDishes.length})
        </button>

        <button
          onClick={() => setFilterType(filterType === 'veg' ? 'all' : 'veg')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
            filterType === 'veg'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-xs font-black'
              : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <div className="w-3.5 h-3.5 rounded-[3px] border border-emerald-600 flex items-center justify-center p-[1px]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          </div>
          <span>Veg</span>
        </button>

        <button
          onClick={() => setFilterType(filterType === 'nonveg' ? 'all' : 'nonveg')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
            filterType === 'nonveg'
              ? 'bg-red-50 text-red-800 border-[#8B2500] shadow-xs font-black'
              : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <div className="w-3.5 h-3.5 rounded-[3px] border border-[#8B2500] flex items-center justify-center p-[1px]">
            <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-[#8B2500]" />
          </div>
          <span>Non-veg</span>
        </button>

        <button
          onClick={() => setFilterType(filterType === 'bestseller' ? 'all' : 'bestseller')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
            filterType === 'bestseller'
              ? 'bg-amber-50 text-amber-900 border-amber-400 shadow-xs font-black'
              : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Bestseller</span>
        </button>
      </section>

      {/* ── Dishes List (Matching Screenshot 2 & 3) ── */}
      <section className="px-4 py-2 space-y-3">
        {filteredDishes.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-neutral-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 text-[#E23744] flex items-center justify-center mx-auto">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-sm text-neutral-900">
              No dishes found under "{selectedCat}"
            </h4>
            <button
              onClick={() => {
                onSelectCat('All');
                setFilterType('all');
              }}
              className="bg-[#E23744] text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs"
            >
              Show All Dishes
            </button>
          </div>
        ) : (
          filteredDishes.map((dish, idx) => {
            const inCart = cart.find((c) => c._id === dish._id || c.id === dish.id);
            const { rating, orderCount } = getDishMetrics(dish);
            const isVeg = dish.is_veg === true ||
              dish.veg === true ||
              (dish.category || '').toLowerCase().includes('veg') ||
              (dish.name || '').toLowerCase().includes('paneer') ||
              (dish.name || '').toLowerCase().includes('dal');

            const fallbackImg = `/dynamic_images/img${((idx % 9) + 1)}.jpeg`;
            const dishImg = dish.image && !dish.image.includes('no-image.png') && !dish.image.includes('photo-1701579231305-d7d8af9a3fd')
              ? dish.image
              : fallbackImg;

            const isSaved = bookmarkedDishes[dish._id || dish.id];

            return (
              <div
                key={dish._id || dish.id || idx}
                onClick={() => setSelectedDishDetail(dish)}
                className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs flex items-start justify-between gap-3 transition-all hover:border-neutral-300 active:scale-[0.99] cursor-pointer"
              >
                {/* Left Side: Dish Info (Screenshot 2 & 3) */}
                <div className="flex-1 min-w-0 pr-1 space-y-1">
                  {/* Veg / Non-veg indicator & Category */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-3.5 h-3.5 rounded-[3px] border ${isVeg ? 'border-emerald-600' : 'border-[#8B2500]'} flex items-center justify-center p-[1px]`}>
                      {isVeg ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      ) : (
                        <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-[#8B2500]" />
                      )}
                    </div>
                    {dish.popular && (
                      <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 uppercase">
                        Bestseller
                      </span>
                    )}
                  </div>

                  {/* Dish Name */}
                  <h3 className="font-bold text-[15px] text-neutral-900 leading-snug">
                    {dish.name}
                  </h3>

                  {/* Price */}
                  <div className="text-sm font-black text-neutral-900 pt-0.5">
                    ₹{dish.price}
                  </div>

                  {/* Social Proof: Highly Reordered Progress Pill (Screenshot 2 & 3) */}
                  <div className="flex items-center space-x-1.5 pt-0.5">
                    <div className="w-10 h-1.5 rounded-full bg-emerald-100 overflow-hidden flex">
                      <div className="w-3/4 h-full bg-emerald-600 rounded-full" />
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-600">
                      Highly reordered · {dish.order_count || orderCount}
                    </span>
                  </div>

                  {/* Description with 'more' */}
                  {dish.description && (
                    <p className="text-[11px] text-neutral-500 line-clamp-2 pt-0.5 leading-relaxed">
                      {dish.description}
                    </p>
                  )}

                  {/* Action Icons: Bookmark & Share (Screenshot 3) */}
                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={(e) => toggleBookmark(dish._id || dish.id, e)}
                      aria-label="Save dish"
                      className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 active:scale-90 transition-transform cursor-pointer"
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleShareDish(dish, e)}
                      aria-label="Share dish"
                      className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 active:scale-90 transition-transform cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right Side: Dish Image & ADD Button (Screenshot 2 & 3) */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative w-32 h-26 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-100 shadow-xs">
                    <img
                      src={dishImg}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = fallbackImg;
                      }}
                    />

                    {/* Star Rating Badge */}
                    <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center space-x-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{dish.rating ? Number(dish.rating).toFixed(1) : rating}</span>
                    </div>
                  </div>

                  {/* ADD + / Stepper Button (Centered Below Image - Screenshot 2 & 3) */}
                  <div className="mt-[-16px] z-10 w-28" onClick={(e) => e.stopPropagation()}>
                    {inCart ? (
                      <div className="flex items-center justify-between bg-white text-[#E23744] border-2 border-[#E23744] rounded-xl shadow-md px-2.5 py-1.5 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => onUpdateCartQty(dish._id || dish.id, -1)}
                          className="p-0.5 active:scale-75 transition-transform cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <span className="font-black text-sm text-neutral-900">{inCart.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateCartQty(dish._id || dish.id, 1)}
                          className="p-0.5 active:scale-75 transition-transform cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedDishDetail(dish)}
                        className="w-full bg-white text-[#E23744] hover:bg-rose-50/50 border border-red-200 hover:border-[#E23744] rounded-xl shadow-sm py-1.5 text-xs font-black uppercase tracking-wider active:scale-95 transition-all text-center cursor-pointer flex flex-col items-center justify-center"
                      >
                        <span>ADD +</span>
                      </button>
                    )}
                    <span className="block text-center text-[9px] text-neutral-400 font-medium mt-0.5">
                      customisable
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* ── Dish Detail & Customization Modal (Screenshot 4) ── */}
      <CustomerDishDetailModal
        dish={selectedDishDetail}
        isOpen={Boolean(selectedDishDetail)}
        onClose={() => setSelectedDishDetail(null)}
        onAddToCart={onAddToCart}
      />
    </div>
  );
};

export default CustomerOrderTab;
