import React, { useRef, useState } from 'react';
import { Star, Sparkles, Clock, Crown, Flame, Moon, ChevronRight, CalendarDays } from 'lucide-react';
import {
  PERSIAN_DARBAR_CATEGORIES,
  DEFAULT_PERSIAN_DARBAR_OFFERS,
  PERSIAN_DARBAR_HALLMARKS,
  getDishMetrics,
  findCartItem,
  isVegDish
} from '../customerAssets';
import CustomerDishDetailModal from './CustomerDishDetailModal';
import { AddStepper, SectionHeader, VegMark, Price, cx } from '../ui';

const HALLMARK_ICONS = { Flame, Crown, Clock, Sparkles };

// Card tints for offers without their own photo
const OFFER_TINTS = ['#1A3D47', '#5C1A20', '#0E1A20'];

const dishImageFor = (dish, idx, offset = 0) => {
  const fallbackImg = `/dynamic_images/img${(((idx + offset) % 9) + 1)}.jpeg`;
  const src = dish.image && !dish.image.includes('no-image.png') && !dish.image.includes('photo-1701579231305-d7d8af9a3fd')
    ? dish.image
    : fallbackImg;
  return { src, fallbackImg };
};

/* Vertical dish card used in rails and grids */
const DishCard = ({ dish, idx, offset = 0, inCart, onOpen, onAdd, onInc, onDec, className = '' }) => {
  const { src, fallbackImg } = dishImageFor(dish, idx, offset);
  const { rating } = getDishMetrics(dish);
  return (
    <article
      onClick={onOpen}
      className={cx('shrink-0 cursor-pointer group', className)}
    >
      <div className="relative">
        <div className="aspect-[6/5] w-full rounded-[16px] overflow-hidden bg-pd-surface">
          <img
            src={src}
            alt={dish.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-active:scale-[0.98]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = fallbackImg;
            }}
          />
        </div>
        {rating && (
          <span className="absolute top-2 left-2 h-6 px-1.5 rounded-[8px] bg-white/95 text-[12px] font-semibold text-pd-ink flex items-center gap-0.5 shadow-pd-1">
            <Star className="w-3 h-3 fill-pd-gold text-pd-gold" />
            {rating}
          </span>
        )}
        <div className="absolute -bottom-3 right-2">
          <AddStepper size="sm" quantity={inCart?.quantity || 0} onAdd={onAdd} onIncrement={onInc} onDecrement={onDec} />
        </div>
      </div>
      <div className="pt-4 pr-1">
        <div className="flex items-start gap-1.5">
          <VegMark veg={isVegDish(dish)} size={12} className="mt-1" />
          <h3 className="text-[15px] leading-5 font-semibold text-pd-ink line-clamp-2">{dish.name}</h3>
        </div>
        <Price value={dish.price} className="block mt-1 text-[14px] font-medium text-pd-ink-2" />
      </div>
    </article>
  );
};

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
  onGoToReserve,
  onSelectDishDetail
}) => {
  const [activeOfferIdx, setActiveOfferIdx] = useState(0);
  const [selectedDishDetail, setSelectedDishDetail] = useState(null);
  const offerRailRef = useRef(null);

  const openDish = (dish) => (onSelectDishDetail || setSelectedDishDetail)(dish);

  // Active offers (from Admin API or defaults)
  const activeOffersList = offers && offers.length > 0 ? offers : DEFAULT_PERSIAN_DARBAR_OFFERS;

  // Signature chef specials from the real menu
  const chefSpecials = menu.filter((item) => item.popular || (item.rating && item.rating >= 4.5)).slice(0, 8);
  const displayedChefSpecials = chefSpecials.length > 0 ? chefSpecials : menu.slice(0, 8);

  // A different selection further down the feed
  const trendingDelicacies = menu.slice(6, 12).length > 0 ? menu.slice(6, 12) : menu.slice(0, 5);

  const reserveImage = (PERSIAN_DARBAR_CATEGORIES.find((c) => c.id === 'All') || {}).image;

  const handleOfferScroll = () => {
    const el = offerRailRef.current;
    if (!el) return;
    const card = el.firstElementChild;
    if (!card) return;
    const step = card.getBoundingClientRect().width + 12;
    const idx = Math.round(el.scrollLeft / step);
    if (idx !== activeOfferIdx) setActiveOfferIdx(Math.max(0, Math.min(activeOffersList.length - 1, idx)));
  };

  const scrollToOffer = (i) => {
    const el = offerRailRef.current;
    const card = el?.children?.[i];
    if (el && card) el.scrollTo({ left: card.offsetLeft - 16, behavior: 'smooth' });
  };

  return (
    <div className="flex-1 w-full max-w-full overflow-x-clip pb-44 bg-white min-h-screen">
      {/* ── 1. Offers carousel ── */}
      <section className="pt-4" aria-label="Offers">
        <div
          ref={offerRailRef}
          onScroll={handleOfferScroll}
          className="flex gap-3 overflow-x-auto no-scrollbar px-4 snap-x snap-mandatory scroll-px-4"
        >
          {activeOffersList.map((offer, i) => (
            <button
              type="button"
              key={offer.id || i}
              onClick={() => onOfferClick && onOfferClick(offer)}
              className="relative shrink-0 w-[86%] md:w-[46%] h-[176px] rounded-[20px] overflow-hidden snap-start text-left pd-press"
              style={{ backgroundColor: OFFER_TINTS[i % OFFER_TINTS.length] }}
            >
              {offer.image_url && (
                <img src={offer.image_url} alt="" loading={i === 0 ? 'eager' : 'lazy'} className="absolute inset-0 w-full h-full object-cover" />
              )}
              <span
                className="absolute inset-0"
                style={{ background: `linear-gradient(90deg, ${OFFER_TINTS[i % OFFER_TINTS.length]} 0%, ${OFFER_TINTS[i % OFFER_TINTS.length]}E6 45%, ${OFFER_TINTS[i % OFFER_TINTS.length]}00 100%)` }}
              />
              <span className="relative z-10 h-full flex flex-col justify-between p-4 max-w-[72%]">
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#E9C67A]">
                    {offer.badge_text || 'Offer'}
                  </span>
                  <span className="block mt-1.5 text-[21px] leading-[25px] font-bold text-white tracking-[-0.01em] line-clamp-2">
                    {offer.title}
                  </span>
                  {offer.subtitle && (
                    <span className="block mt-1 text-[13px] leading-[17px] text-white/80 line-clamp-1">{offer.subtitle}</span>
                  )}
                </span>
                <span className="flex items-center gap-2">
                  {offer.coupon_code && (
                    <span className="h-7 px-2.5 rounded-[8px] border border-dashed border-white/50 text-[12px] font-semibold tracking-wide text-white flex items-center min-w-0 truncate">
                      {offer.coupon_code}
                    </span>
                  )}
                  <span className="h-7 pl-3 pr-2 rounded-full bg-white text-pd-ink text-[12px] font-semibold flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                    {offer.action === 'reserve' ? 'Book table' : 'Order now'}
                    <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
        {activeOffersList.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3" role="tablist" aria-label="Offer pages">
            {activeOffersList.map((_, i) => (
              <button
                type="button"
                key={i}
                role="tab"
                aria-selected={i === activeOfferIdx}
                aria-label={`Offer ${i + 1}`}
                onClick={() => scrollToOffer(i)}
                className={cx('h-1.5 rounded-full transition-all duration-300', i === activeOfferIdx ? 'w-5 bg-pd-ink' : 'w-1.5 bg-black/15')}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 2. Categories ── */}
      <section className="pt-7">
        <SectionHeader title="What are you craving?" action="See menu" onAction={onGoToOrder} />
        <div className="mt-4 flex gap-4 overflow-x-auto no-scrollbar px-4 py-1">
          {PERSIAN_DARBAR_CATEGORIES.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                onSelectCat(item.id);
                onGoToOrder();
              }}
              className="flex flex-col items-center shrink-0 w-[76px] pd-press"
            >
              <span className="w-[72px] h-[72px] rounded-full overflow-hidden bg-pd-surface">
                <img src={item.image} alt="" loading="lazy" className="w-full h-full object-cover" />
              </span>
              <span className="mt-2 text-[12px] leading-4 font-medium text-pd-ink text-center line-clamp-2">{item.title}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── 3. Bestsellers rail ── */}
      {displayedChefSpecials.length > 0 && (
        <section className="pt-8">
          <SectionHeader title="Bestsellers" subtitle="Most loved from our kitchen" action="See all" onAction={onGoToOrder} />
          <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1 snap-x scroll-px-4">
            {displayedChefSpecials.map((dish, idx) => (
              <DishCard
                key={dish._id || dish.id || idx}
                dish={dish}
                idx={idx}
                className="w-[156px] md:w-[188px] snap-start"
                inCart={findCartItem(cart, dish)}
                onOpen={() => openDish(dish)}
                onAdd={() => onAddToCart(dish)}
                onInc={() => onUpdateCartQty(dish._id || dish.id, 1)}
                onDec={() => onUpdateCartQty(dish._id || dish.id, -1)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── 4. Reserve banner ── */}
      <section className="pt-8 px-4">
        <button
          type="button"
          onClick={onGoToReserve}
          className="relative w-full h-[148px] rounded-[20px] overflow-hidden text-left bg-pd-teal pd-press"
        >
          {reserveImage && <img src={reserveImage} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />}
          <span className="absolute inset-0 bg-gradient-to-r from-[#0E1A20] via-[#0E1A20]/80 to-transparent" />
          <span className="relative z-10 h-full flex flex-col justify-center px-5 max-w-[70%]">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#E9C67A]">
              <CalendarDays className="w-3.5 h-3.5" /> Dine in
            </span>
            <span className="mt-1.5 text-[20px] leading-6 font-bold text-white">Book a table</span>
            <span className="mt-1 text-[13px] text-white/75">Reserve at any Persian Darbar outlet in seconds.</span>
          </span>
          <span className="absolute z-10 right-4 bottom-4 h-9 px-4 rounded-full bg-white text-pd-ink text-[14px] font-semibold flex items-center">
            Reserve
          </span>
        </button>
      </section>

      {/* ── 5. More to try grid ── */}
      {trendingDelicacies.length > 0 && (
        <section className="pt-8">
          <SectionHeader title="Popular right now" action="See all" onAction={onGoToOrder} />
          <div className="mt-4 px-4 grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-6">
            {trendingDelicacies.slice(0, 4).map((dish, idx) => (
              <DishCard
                key={dish._id || dish.id || idx}
                dish={dish}
                idx={idx}
                offset={2}
                className="w-full"
                inCart={findCartItem(cart, dish)}
                onOpen={() => openDish(dish)}
                onAdd={() => onAddToCart(dish)}
                onInc={() => onUpdateCartQty(dish._id || dish.id, 1)}
                onDec={() => onUpdateCartQty(dish._id || dish.id, -1)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── 6. Late night ── */}
      <section className="pt-8 px-4">
        <button
          type="button"
          onClick={onGoToOrder}
          className="w-full flex items-center gap-3 rounded-[16px] bg-pd-surface px-4 py-3.5 text-left pd-press"
        >
          <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
            <Moon className="w-5 h-5 text-pd-ink" strokeWidth={1.75} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-semibold text-pd-ink">Open till 1:00 AM</span>
            <span className="block text-[13px] text-pd-ink-2">Late-night biryani, delivered hot</span>
          </span>
          <ChevronRight className="w-5 h-5 text-pd-ink-3" />
        </button>
      </section>

      {/* ── 7. Our craft ── */}
      <section className="pt-8">
        <SectionHeader title="The Persian Darbar way" />
        <div className="mt-4 px-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {PERSIAN_DARBAR_HALLMARKS.map((item, idx) => {
            const Icon = HALLMARK_ICONS[item.iconName] || Sparkles;
            return (
              <div key={idx} className="rounded-[16px] border border-[color:var(--pd-line)] p-3.5">
                <Icon className="w-5 h-5 text-pd-gold" strokeWidth={1.75} />
                <h4 className="mt-2.5 text-[14px] font-semibold text-pd-ink">{item.title}</h4>
                <p className="mt-1 text-[12px] leading-4 text-pd-ink-2">{item.desc}</p>
              </div>
            );
          })}
        </div>
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

export default CustomerHomeTab;
