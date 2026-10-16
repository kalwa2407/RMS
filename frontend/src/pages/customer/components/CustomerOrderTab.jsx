import React, { useState } from 'react';
import { Plus, Minus, Star, Search, Tag, Sparkles } from 'lucide-react';
import { PERSIAN_DARBAR_CATEGORIES } from '../customerAssets';

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
  appliedCoupon
}) => {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'veg' | 'bestseller'

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
    const isVeg = item.is_veg !== false && !item.category?.toLowerCase().includes('non') && item.veg !== false;
    const matchesType =
      filterType === 'all'
        ? true
        : filterType === 'veg'
        ? isVeg
        : item.popular || (item.rating && item.rating >= 4.5);
    return matchesCat && matchesType && item.available !== false;
  });

  return (
    <div className="flex-1 pb-28">
      {/* ── Top Offer Bar Integrated with Search (Matching Screenshot 4) ── */}
      <section className="bg-gradient-to-b from-[#FFF5D6] via-[#FFF8E7] to-white px-4 pt-2 pb-3 border-b border-amber-200/50">
        <div className="flex items-center justify-between bg-white/90 border border-amber-300/80 rounded-2xl px-3.5 py-2 shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-[#E23744] text-white flex items-center justify-center text-[10px] font-black">
              %
            </span>
            <span className="text-xs font-black text-neutral-900">
              {appliedCoupon ? `Code ${appliedCoupon.code} Applied` : 'FLAT 30% OFF with code DARBAR30'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#E23744] bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
            Save on Bill
          </span>
        </div>
      </section>

      {/* ── Category Roundels Scroll Bar (Matching Screenshot 4) ── */}
      <section className="sticky top-[102px] z-20 bg-white/95 backdrop-blur-md border-b border-neutral-100 py-2.5">
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

          {/* Clean Food Roundels */}
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

      {/* ── Sub-filters: All, Bestsellers, Pure Veg ── */}
      <section className="px-4 pt-3 pb-1 flex items-center space-x-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
            filterType === 'all'
              ? 'bg-neutral-900 text-white shadow-xs font-black'
              : 'bg-white text-neutral-600 border border-neutral-200/80'
          }`}
        >
          All ({filteredDishes.length})
        </button>
        <button
          onClick={() => setFilterType('bestseller')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center space-x-1 ${
            filterType === 'bestseller'
              ? 'bg-amber-500 text-black shadow-xs font-black'
              : 'bg-white text-amber-800 border border-amber-200'
          }`}
        >
          <span>👑 Bestsellers</span>
        </button>
        <button
          onClick={() => setFilterType(filterType === 'veg' ? 'all' : 'veg')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center space-x-1 ${
            filterType === 'veg'
              ? 'bg-emerald-600 text-white shadow-xs font-black'
              : 'bg-white text-emerald-800 border border-emerald-200'
          }`}
        >
          <span>🌱 Veg Only</span>
        </button>
      </section>

      {/* ── Dishes List ── */}
      <section className="px-4 py-2 space-y-3">
        {filteredDishes.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-neutral-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 text-[#E23744] flex items-center justify-center mx-auto text-xl font-black">
              🍽️
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
          filteredDishes.map((dish) => {
            const inCart = cart.find((c) => c._id === dish._id);
            return (
              <div
                key={dish._id}
                className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs flex items-center justify-between gap-3 transition-all hover:border-neutral-300"
              >
                <div className="flex-1 pr-1">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="text-[10px] font-black text-[#E23744] bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                      {dish.category}
                    </span>
                    {dish.popular && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                        ★ Must Try
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-sm text-neutral-900 leading-tight">
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

                {/* Dish Image & Add Button */}
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
          })
        )}
      </section>
    </div>
  );
};

export default CustomerOrderTab;
