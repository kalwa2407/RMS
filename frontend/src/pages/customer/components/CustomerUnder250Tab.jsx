import React, { useState } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';
import { UNDER_250_ROUNDELS, findCartItem } from '../customerAssets';

const CustomerUnder250Tab = ({
  menu = [],
  cart = [],
  onAddToCart,
  onUpdateCartQty,
  onOpenCart,
  onGoToHome
}) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [pureVegOnly, setPureVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState('price-low'); // 'price-low' | 'rating'

  // Pocket friendly items under 250
  const under250Dishes = (menu.length > 0 ? menu : [])
    .filter(item => {
      const isUnder = (item.price || 0) <= 250;
      const isVeg = item.is_veg !== false && !item.category?.toLowerCase().includes('non') && item.veg !== false;
      const matchesVeg = !pureVegOnly || isVeg;
      const matchesCategory = activeCategory === 'All' ||
        item.category?.toLowerCase().includes(activeCategory.toLowerCase()) ||
        item.name?.toLowerCase().includes(activeCategory.toLowerCase());
      return isUnder && matchesVeg && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
      return (b.rating || 0) - (a.rating || 0);
    });

  // Fallback pocket friendly dishes if none in current API
  const fallbackUnder250 = [
    {
      _id: 'u250_1',
      name: '1 x Chicken Samosa (2 pieces)',
      price: 162.72,
      category: 'Starters',
      is_veg: false,
      rating: 4.5,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3vWIlf2qsiMpWmtxSln4Bj_Md6pQnv_hUpqtQkR7GCrHl_DPxB0Q4AKOu4g5PRHrtsBROn6LWmNpWP_4KSvIIG2UHdOIcwXTbwIuWDWrcbDjF0Zscv2S-RxKQ_iQifk0U8_H8L_tJnCOs9vp0JD3iq9SNAMBnhGKH1iv6SzIdsDe-t7GD-oFTAL6kbeOlqigcD1gTFepAx1rtR7gjwOVeVI067eEidz07lanet5-yWBnm3fsXnk4KXw'
    },
    {
      _id: 'u250_2',
      name: '1 x Grilled Bun Maska with Chai',
      price: 222.79,
      category: 'Beverages',
      is_veg: true,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?crop=entropy&cs=srgb&fm=jpg&w=400&q=80'
    },
    {
      _id: 'u250_3',
      name: 'Persian Dum Biryani Bowl',
      price: 249.00,
      category: 'Biryani',
      is_veg: false,
      rating: 4.7,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBT7p9ZXtVziXkvS7aJaLRmFPIX161FPlg-_fgbCUH-cGaPMCYTwgiORU6dTDgZ8EE5nbfgB0nmPRVhbB7nEEPJbpqKmNC7EEILzMXZX_uOvHPRvJYj9jbrQBzRy5EBMjFAb2b4FO8O5IjHZ9V46IXXy9vYS11xFEXtDtGTDeSn8mSa5LRe2Q623JMcx2e3XHhX19UfZh5YB8O3BvXWsG6xRTeiSmgwzcD6_wdsjAgXiVBcn85vwgfiMg'
    },
    {
      _id: 'u250_4',
      name: 'Butter Garlic Naan with Gravy',
      price: 180.00,
      category: 'Breads',
      is_veg: true,
      rating: 4.6,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-qeHNDpTHq96DeV45ZEc8TSXnm9NqDr3kf_WDjG8kV2Gh5jOoymgiRxWjBEByNUbP4f1bBkBZ9GmowTOJVjLJKY9sk3aJ_DacGw0IU5-PtWNLKH86UB8umAcMiRYQmWs53ihVYsbbYrkVR_qu7FHGffguGc4jnEH2jq5tGk-G4JmB97k5YQH01Uc-G1L9_Os2rpcsqJj2rt_c2jzyiQnemaqRVJMvEj1w4BmlKqwq5EHurSteYc3GqQ'
    }
  ];

  const displayDishes = under250Dishes.length > 0 ? under250Dishes : fallbackUnder250;

  return (
    <div className="flex-1 pb-28">
      {/* ── BEGIN: Meals Under ₹250 Festive Banner ── */}
      <section className="bg-gradient-to-b from-[#E8F4FA]/70 to-white px-4 pt-2 pb-4">
        <div className="relative bg-[#FFF2D6] rounded-2xl p-4 shadow-xs border border-amber-200 text-center overflow-visible">
          {/* Decorative Floating Badges */}
          <div className="absolute -left-2 top-2 bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs rotate-[-12deg]">
            %
          </div>
          <div className="absolute -right-2 top-2 bg-amber-400 text-black text-[12px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-xs">
            ₹
          </div>

          <h1 className="text-xl font-black text-[#1C1C1C] tracking-tight uppercase">
            MEALS UNDER ₹250
          </h1>

          {/* Ribbon Folded Ends Banner */}
          <div className="mt-2.5 mx-auto max-w-[280px]">
            <div className="ribbon-banner bg-[#E40000] text-white py-1 px-3 text-[11px] font-black uppercase tracking-wider shadow-sm">
              FINAL PRICE, BEST OFFER APPLIED
            </div>
          </div>
        </div>
      </section>
      {/* ── END: Festive Banner ── */}

      {/* ── BEGIN: Category Roundels ── */}
      <section className="mt-1">
        <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar px-4 pb-2">
          {UNDER_250_ROUNDELS.map((item) => {
            const isActive = activeCategory === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveCategory(item.id)}
                className="flex flex-col items-center shrink-0 cursor-pointer relative pb-1 active:scale-95 transition-transform"
              >
                <div
                  className={`w-16 h-16 rounded-full overflow-hidden border p-0.5 flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'border-[#E40000] ring-2 ring-red-100 bg-red-50/50'
                      : 'border-amber-100 bg-amber-50/50'
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <span
                  className={`text-[11px] mt-1 text-center truncate max-w-[64px] ${
                    isActive ? 'font-bold text-neutral-900' : 'font-medium text-neutral-600'
                  }`}
                >
                  {item.title}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 w-8 h-[2.5px] bg-[#E40000] rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </section>
      {/* ── END: Category Roundels ── */}

      {/* ── BEGIN: Filter Chips ── */}
      <section className="mt-2 px-4">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSortBy(sortBy === 'price-low' ? 'rating' : 'price-low')}
            className="flex items-center space-x-1 border border-neutral-300 bg-white px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 shadow-xs whitespace-nowrap active:scale-95 transition-transform"
          >
            <span>{sortBy === 'price-low' ? 'Sort: Price Low' : 'Sort: Top Rated'}</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          <button className="flex items-center space-x-1 border border-neutral-300 bg-white px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 shadow-xs whitespace-nowrap">
            <span>Loved by friends</span>
          </button>

          <button
            onClick={() => setPureVegOnly(!pureVegOnly)}
            className={`border px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs whitespace-nowrap active:scale-95 transition-transform ${
              pureVegOnly
                ? 'border-green-600 bg-green-50 text-green-700 font-bold'
                : 'border-neutral-300 bg-white text-neutral-700'
            }`}
          >
            Pure Veg
          </button>
        </div>
      </section>
      {/* ── END: Filter Chips ── */}

      {/* ── BEGIN: Dishes Grid Under ₹250 ── */}
      <section className="mt-4 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-base text-neutral-900">
              Irani Cafe &amp; Pocket Delights
            </h2>
            <p className="text-[11px] text-neutral-500 flex items-center mt-0.5">
              <span className="text-emerald-600 font-bold mr-1">⚡ 20–25 mins</span>
              <span>• Chef's Special</span>
            </p>
          </div>
          <span className="bg-[#24963F] text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-xs">
            ★ 4.8
          </span>
        </div>

        {/* 2-column or list cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {displayDishes.map((dish, uIdx) => {
            const inCart = findCartItem(cart, dish);
            const isVeg = dish.is_veg !== false && !dish.category?.toLowerCase().includes('non') && dish.veg !== false;
            return (
              <div
                key={dish._id || dish.id || uIdx}
                className="bg-white rounded-2xl border border-neutral-100 shadow-xs overflow-hidden flex flex-col justify-between p-3"
              >
                <div className="relative h-36 w-full rounded-xl overflow-hidden bg-neutral-100 mb-2.5">
                  <img
                    src={dish.image && !dish.image.includes('no-image.png') && !dish.image.includes('photo-1701579231305-d7d8af9a3fd') ? dish.image : `/dynamic_images/img${(((dish._id || dish.id || 1) % 9) + 1)}.jpeg`}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `/dynamic_images/img${(((dish._id || dish.id || 1) % 9) + 1)}.jpeg`;
                    }}
                  />
                  <span className="absolute bottom-2 left-2 bg-[#24963F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                    ★ {dish.rating || '4.5'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span
                      className={`w-3.5 h-3.5 border flex items-center justify-center p-[2px] rounded-xs shrink-0 ${
                        isVeg ? 'border-green-600' : 'border-red-600'
                      }`}
                    >
                      {isVeg ? (
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                      ) : (
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-xs" />
                      )}
                    </span>
                    <h3 className="font-bold text-xs text-neutral-900 truncate">
                      {dish.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-50">
                    <div>
                      <p className="text-sm font-extrabold text-neutral-900">
                        ₹{dish.price}
                      </p>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        Best price
                      </span>
                    </div>

                    {inCart ? (
                      <div className="flex items-center space-x-1.5 bg-white text-[#E40000] border border-[#E40000] rounded-lg px-2 py-1 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => onUpdateCartQty(dish._id || dish.id, -1)}
                          className="p-0.5 active:scale-75 transition-transform"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span>{inCart.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateCartQty(dish._id || dish.id, 1)}
                          className="p-0.5 active:scale-75 transition-transform"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAddToCart(dish)}
                        className="bg-red-50 hover:bg-red-100 text-[#E40000] border border-red-200 text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
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

        {/* View Full Menu Button */}
        <div className="text-center pt-2">
          <button
            onClick={onGoToHome}
            className="inline-flex items-center justify-center bg-white border border-neutral-300 text-neutral-800 text-xs font-bold px-6 py-2.5 rounded-full shadow-xs active:scale-95 transition-all"
          >
            <span>View full menu</span>
            <span className="ml-1 text-[#E40000]">›</span>
          </button>
        </div>
      </section>
      {/* ── END: Dishes Grid ── */}
    </div>
  );
};

export default CustomerUnder250Tab;
