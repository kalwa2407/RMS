import React, { useEffect, useState } from 'react';
import { Star, UtensilsCrossed, Bookmark, Share2, BadgePercent, Check } from 'lucide-react';
import { PERSIAN_DARBAR_CATEGORIES, getDishMetrics, findCartItem, isVegDish } from '../customerAssets';
import CustomerDishDetailModal from './CustomerDishDetailModal';
import { AddStepper, Chip, EmptyState, VegMark, Price, cx } from '../ui';

// Height of the sticky top bar, so the menu filters can stick right below it.
const useTopBarHeight = () => {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const el = document.querySelector('[data-pd-topbar]');
    if (!el) return undefined;
    const update = () => setHeight(el.getBoundingClientRect().height);
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return height;
};

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
  onRemoveCoupon,
  onSelectDishDetail
}) => {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'veg' | 'nonveg' | 'bestseller'
  const [selectedDishDetail, setSelectedDishDetail] = useState(null);
  const [bookmarkedDishes, setBookmarkedDishes] = useState({});
  const topBarHeight = useTopBarHeight();

  const openDish = (dish) => (onSelectDishDetail || setSelectedDishDetail)(dish);

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
    const isVeg = isVegDish(item);

    let matchesType = true;
    if (filterType === 'veg') matchesType = isVeg;
    else if (filterType === 'nonveg') matchesType = !isVeg;
    else if (filterType === 'bestseller') matchesType = item.popular || (item.rating && item.rating >= 4.5);

    return matchesCat && matchesType && item.available !== false;
  });

  const activeCategory = PERSIAN_DARBAR_CATEGORIES.find(
    (c) => c.id.toLowerCase() === (selectedCat || 'All').toLowerCase()
  );

  // ── Offer strip (only when an active offer exists) ──
  const renderOfferStrip = () => {
    const activeOffers = (offers || []).filter(
      (o) => o.active !== false && o.is_active !== false && (o.coupon_code || o.code || o.title)
    );
    if (activeOffers.length === 0) return null;

    const currentOffer = activeOffers[0];
    const couponCode = currentOffer.coupon_code || currentOffer.code || 'DARBAR30';
    const isApplied = appliedCoupon?.code?.toUpperCase() === couponCode.toUpperCase();

    return (
      <div className="px-4 pt-3">
        <button
          type="button"
          onClick={() => {
            if (isApplied) {
              onRemoveCoupon && onRemoveCoupon();
            } else {
              onApplyCoupon && onApplyCoupon(couponCode);
            }
          }}
          className="w-full flex items-center gap-3 rounded-[14px] bg-pd-gold-tint border border-pd-gold/20 px-3.5 py-3 text-left pd-press"
        >
          <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 text-pd-gold">
            <BadgePercent className="w-[18px] h-[18px]" strokeWidth={2} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-semibold text-pd-ink truncate">
              {isApplied
                ? `${couponCode} applied`
                : (currentOffer.title || `Save with ${couponCode}`)}
            </span>
            <span className="block text-[12px] text-pd-ink-2 truncate">
              {isApplied ? 'Tap to remove' : `Use code ${couponCode}`}
            </span>
          </span>
          <span
            className={cx(
              'shrink-0 h-8 px-3 rounded-full text-[13px] font-semibold inline-flex items-center gap-1',
              isApplied ? 'bg-white text-pd-success' : 'bg-pd-ink text-white'
            )}
          >
            {isApplied ? (<><Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Applied</>) : 'Apply'}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full max-w-full overflow-x-clip pb-44 bg-white min-h-screen">
      {renderOfferStrip()}

      {/* ── Category rail ── */}
      <section className="pt-4 pb-1" aria-label="Menu categories">
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 py-1">
          {PERSIAN_DARBAR_CATEGORIES.map((item) => {
            const isActive = (selectedCat || 'All').toLowerCase() === item.id.toLowerCase();
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onSelectCat(item.id)}
                aria-pressed={isActive}
                className="flex flex-col items-center shrink-0 w-[68px] pd-press"
              >
                <span
                  className={cx(
                    'w-16 h-16 rounded-full overflow-hidden bg-pd-surface transition-shadow',
                    isActive ? 'ring-2 ring-pd-action ring-offset-2' : ''
                  )}
                >
                  <img src={item.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                </span>
                <span
                  className={cx(
                    'text-[12px] leading-4 mt-2 text-center line-clamp-2',
                    isActive ? 'font-semibold text-pd-ink' : 'font-medium text-pd-ink-2'
                  )}
                >
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Sticky filters ── */}
      <div
        className="sticky z-30 bg-white/95 backdrop-blur-xl border-b border-[color:var(--pd-line)]"
        style={{ top: topBarHeight }}
      >
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-2.5">
          <Chip active={filterType === 'veg'} onClick={() => setFilterType(filterType === 'veg' ? 'all' : 'veg')}>
            <VegMark veg size={13} />
            Veg
          </Chip>
          <Chip active={filterType === 'nonveg'} onClick={() => setFilterType(filterType === 'nonveg' ? 'all' : 'nonveg')}>
            <VegMark veg={false} size={13} />
            Non-veg
          </Chip>
          <Chip active={filterType === 'bestseller'} onClick={() => setFilterType(filterType === 'bestseller' ? 'all' : 'bestseller')}>
            Bestseller
          </Chip>
          {filterType !== 'all' && (
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className="shrink-0 h-9 px-2 text-[14px] font-medium text-pd-action pd-press"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Section title ── */}
      <div className="px-4 pt-5 pb-1 flex items-baseline justify-between">
        <h2 className="text-[19px] font-bold text-pd-ink tracking-[-0.01em]">
          {activeCategory?.title || selectedCat || 'All dishes'}
        </h2>
        <span className="text-[13px] text-pd-ink-3 pd-tabular">
          {filteredDishes.length} {filteredDishes.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* ── Dish list (1 col phone, 2 col iPad) ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 md:px-4">
        {filteredDishes.length === 0 ? (
          <EmptyState
            className="md:col-span-2"
            icon={UtensilsCrossed}
            title="No dishes here yet"
            message={`Nothing matches “${activeCategory?.title || selectedCat}” with these filters.`}
            actionLabel="Show all dishes"
            onAction={() => {
              onSelectCat('All');
              setFilterType('all');
            }}
          />
        ) : (
          filteredDishes.map((dish, idx) => {
            const inCart = findCartItem(cart, dish);
            const { rating } = getDishMetrics(dish);
            const isVeg = isVegDish(dish);
            const dishId = dish._id || dish.id;

            const fallbackImg = `/dynamic_images/img${((idx % 9) + 1)}.jpeg`;
            const dishImg = dish.image && !dish.image.includes('no-image.png') && !dish.image.includes('photo-1701579231305-d7d8af9a3fd')
              ? dish.image
              : fallbackImg;

            const isSaved = bookmarkedDishes[dishId];

            return (
              <article
                key={dishId || idx}
                onClick={() => openDish(dish)}
                className="flex items-start gap-4 px-4 md:px-0 py-5 border-b border-[color:var(--pd-line)] cursor-pointer active:bg-pd-surface/60 transition-colors"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <VegMark veg={isVeg} />
                    {dish.popular && (
                      <span className="text-[11px] font-semibold text-pd-gold uppercase tracking-[0.04em]">
                        Bestseller
                      </span>
                    )}
                  </div>

                  <h3 className="mt-1.5 text-[16px] leading-[21px] font-semibold text-pd-ink">
                    {dish.name}
                  </h3>

                  <div className="mt-1 flex items-center gap-2">
                    <Price value={dish.price} className="text-[15px] font-semibold text-pd-ink" />
                    {rating && (
                      <span className="inline-flex items-center gap-0.5 text-[13px] font-medium text-pd-ink-2">
                        <Star className="w-3.5 h-3.5 fill-pd-gold text-pd-gold" />
                        {rating}
                      </span>
                    )}
                  </div>

                  {dish.description && (
                    <p className="mt-2 text-[13px] leading-[18px] text-pd-ink-2 line-clamp-2">
                      {dish.description}
                    </p>
                  )}

                  <div className="mt-2 -ml-2 flex items-center">
                    <button
                      type="button"
                      onClick={(e) => toggleBookmark(dishId, e)}
                      aria-label={isSaved ? 'Remove from saved' : 'Save dish'}
                      aria-pressed={Boolean(isSaved)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-pd-ink-3 pd-press"
                    >
                      <Bookmark className={cx('w-[18px] h-[18px]', isSaved && 'fill-pd-gold text-pd-gold')} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleShareDish(dish, e)}
                      aria-label="Share dish"
                      className="w-9 h-9 rounded-full flex items-center justify-center text-pd-ink-3 pd-press"
                    >
                      <Share2 className="w-[18px] h-[18px]" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>

                {/* Image + ADD */}
                <div className="relative shrink-0 w-[124px] pb-4">
                  <div className="w-[124px] h-[124px] rounded-[14px] overflow-hidden bg-pd-surface">
                    <img
                      src={dishImg}
                      alt={dish.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = fallbackImg;
                      }}
                    />
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-0">
                    <AddStepper
                      quantity={inCart?.quantity || 0}
                      onAdd={() => onAddToCart(dish)}
                      onIncrement={() => onUpdateCartQty(dishId, 1)}
                      onDecrement={() => onUpdateCartQty(dishId, -1)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDish(dish);
                    }}
                    className="absolute left-0 right-0 -bottom-5 text-center text-[11px] text-pd-ink-3"
                  >
                    Customisable
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* ── Dish Detail & Customization Modal (Fallback if not lifted) ── */}
      {!onSelectDishDetail && (
        <CustomerDishDetailModal
          dish={selectedDishDetail}
          isOpen={Boolean(selectedDishDetail)}
          onClose={() => setSelectedDishDetail(null)}
          onAddToCart={onAddToCart}
        />
      )}
    </div>
  );
};

export default CustomerOrderTab;
