import React, { useState, useEffect, useRef } from 'react';
import { Drawer } from 'vaul';
import { X, Bookmark, Share2, Star, Check } from 'lucide-react';
import { isVegDish } from '../customerAssets';
import { AddStepper, VegMark, Price, cx, formatINR } from '../ui';

const ACCOMPANIMENTS = [
  {
    id: 'addon_chai',
    name: 'Irani Special Chai',
    price: 45,
    is_veg: true,
    image: '/dynamic_images/img7.jpeg',
    description: 'Slow-brewed authentic Iranian royal tea'
  },
  {
    id: 'addon_sulaimani',
    name: 'Sulaimani Black Tea',
    price: 45,
    is_veg: true,
    image: '/dynamic_images/img8.jpeg',
    description: 'Spiced aromatic digestive black tea'
  },
  {
    id: 'addon_garlic_naan',
    name: 'Royal Garlic Butter Naan',
    price: 65,
    is_veg: true,
    image: '/dynamic_images/img5.jpeg',
    description: 'Clay tandoor charred with garlic & fresh butter'
  },
  {
    id: 'addon_shahi_firni',
    name: 'Persian Shahi Firni',
    price: 120,
    is_veg: true,
    image: '/dynamic_images/img9.jpeg',
    description: 'Chilled saffron rice pudding in earthen kasora'
  },
  {
    id: 'addon_roomali',
    name: 'Fresh Roomali Roti (2 pcs)',
    price: 40,
    is_veg: true,
    image: '/dynamic_images/img4.jpeg',
    description: 'Handkerchief-thin delicate tawa bread'
  }
];

const CustomerDishDetailModal = ({
  dish: dishProp,
  isOpen,
  onClose,
  onAddToCart
}) => {
  const [quantity, setQuantity] = useState(1);
  // Each addon entry: { ...addon, qty: number }
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  // Keep the last dish while the sheet animates closed.
  const lastDishRef = useRef(dishProp);
  if (dishProp) lastDishRef.current = dishProp;
  const dish = dishProp || lastDishRef.current;

  useEffect(() => {
    if (isOpen) {
      setQuantity(dishProp?.quantity ? Math.max(1, dishProp.quantity) : 1);
      setSelectedAddons([]);
      setIsBookmarked(false);
      setCopied(false);
    }
  }, [isOpen, dishProp]);

  if (!dish) return null;

  const isVeg = isVegDish(dish);

  const fallbackImg = `/dynamic_images/img${(((dish.id || dish._id || 1) % 9) + 1)}.jpeg`;
  const dishImg = dish.image && !dish.image.includes('no-image.png') && !dish.image.includes('photo-1701579231305-d7d8af9a3fd')
    ? dish.image
    : fallbackImg;
  const rating = dish.rating && !Number.isNaN(Number(dish.rating)) ? Number(dish.rating).toFixed(1) : null;

  // Add an addon with qty 1 (or increment if already present)
  const addAddon = (addon) => {
    setSelectedAddons(prev => {
      const existing = prev.find(a => a.id === addon.id);
      if (existing) {
        return prev.map(a => a.id === addon.id ? { ...a, qty: a.qty + 1 } : a);
      }
      return [...prev, { ...addon, qty: 1 }];
    });
  };

  // Update addon quantity; remove if qty goes to 0
  const updateAddonQty = (addonId, delta) => {
    setSelectedAddons(prev => {
      return prev.map(a => {
        if (a.id !== addonId) return a;
        const newQty = a.qty + delta;
        return newQty <= 0 ? null : { ...a, qty: newQty };
      }).filter(Boolean);
    });
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price * a.qty), 0);
  const dishPrice = dish.price || 0;
  const totalPrice = (dishPrice * quantity) + addonsTotal;

  const handleAdd = () => {
    // 1. Add/update the main dish item with its true price & explicit modal quantity
    onAddToCart({
      ...dish,
      price: dishPrice,
      quantity,
      fromModal: true,
      hasAddons: selectedAddons.length > 0
    });

    // 2. Add each accompaniment as an independent item in the cart
    selectedAddons.forEach((addon) => {
      if (addon.qty > 0) {
        onAddToCart({
          id: addon.id,
          _id: addon.id,
          name: addon.name,
          price: addon.price,
          quantity: addon.qty,
          is_veg: addon.is_veg,
          image: addon.image,
          category: 'Beverages & Accompaniments',
          fromModal: false,
          silentToast: true
        });
      }
    });

    onClose();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${dish.name} - Persian Darbar`,
        text: `Order ${dish.name} (₹${dish.price}) from Persian Darbar!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText?.(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Drawer.Root open={Boolean(isOpen && dishProp)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[70] bg-black/50" />
        <Drawer.Content
          aria-describedby={undefined}
          className="fixed z-[71] bottom-0 left-0 right-0 mx-auto w-full max-w-[430px] md:max-w-xl max-h-[92vh] bg-white rounded-t-[24px] flex flex-col outline-none"
        >
          <Drawer.Title className="sr-only">{dish.name}</Drawer.Title>

          {/* Grab handle */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-10 h-1.5 rounded-full bg-white/85 shadow-sm" />

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center pd-press"
          >
            <X className="w-5 h-5" strokeWidth={2.25} />
          </button>

          <div className="flex-1 overflow-y-auto no-scrollbar rounded-t-[24px]">
            {/* Hero photo */}
            <div className="relative w-full aspect-[4/3] max-h-72 bg-pd-surface">
              <img
                src={dishImg}
                alt={dish.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = fallbackImg;
                }}
              />
            </div>

            {/* Title block */}
            <div className="px-4 pt-4 pb-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <VegMark veg={isVeg} />
                    {dish.popular && (
                      <span className="text-[11px] font-semibold text-pd-gold uppercase tracking-[0.04em]">Bestseller</span>
                    )}
                  </div>
                  <h2 className="mt-2 text-[22px] leading-7 font-bold text-pd-ink tracking-[-0.01em]">
                    {dish.name}
                  </h2>
                  <div className="mt-1 flex items-baseline gap-2">
                    <Price value={dish.price} className="text-[17px] font-semibold text-pd-ink" />
                    {dish.original_price && dish.original_price > dish.price && (
                      <span className="text-[13px] text-pd-ink-3 line-through pd-tabular">
                        {formatINR(dish.original_price)}
                      </span>
                    )}
                    {rating && (
                      <span className="inline-flex items-center gap-0.5 text-[13px] font-medium text-pd-ink-2">
                        <Star className="w-3.5 h-3.5 fill-pd-gold text-pd-gold" />
                        {rating}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    aria-label={isBookmarked ? 'Remove from saved' : 'Save dish'}
                    aria-pressed={isBookmarked}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-pd-ink-2 bg-pd-surface pd-press"
                  >
                    <Bookmark className={cx('w-[18px] h-[18px]', isBookmarked && 'fill-pd-gold text-pd-gold')} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label="Share"
                    className="w-10 h-10 rounded-full flex items-center justify-center text-pd-ink-2 bg-pd-surface pd-press"
                  >
                    {copied ? <Check className="w-[18px] h-[18px] text-pd-success" /> : <Share2 className="w-[18px] h-[18px]" strokeWidth={1.75} />}
                  </button>
                </div>
              </div>

              <p className="mt-3 text-[15px] leading-[22px] text-pd-ink-2">
                {dish.description ||
                  'Delicately seasoned authentic Persian recipe slow-cooked to culinary perfection using aromatic Persian Darbar spices.'}
              </p>
            </div>

            <div className="h-2 bg-pd-surface" />

            {/* Add-ons */}
            <div className="px-4 pt-5 pb-6">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[17px] font-semibold text-pd-ink">Pair it with</h3>
                <span className="text-[12px] text-pd-ink-3">Optional</span>
              </div>

              <ul className="mt-2 divide-y divide-[color:var(--pd-line)]">
                {ACCOMPANIMENTS.map((addon) => {
                  const selected = selectedAddons.find((a) => a.id === addon.id);
                  return (
                    <li key={addon.id} className="flex items-center gap-3 py-3">
                      <img
                        src={addon.image}
                        alt=""
                        loading="lazy"
                        className="w-14 h-14 rounded-[10px] object-cover shrink-0 bg-pd-surface"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/dynamic_images/img1.jpeg';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <VegMark veg={addon.is_veg} size={12} />
                          <h4 className="text-[15px] font-medium text-pd-ink truncate">{addon.name}</h4>
                        </div>
                        <p className="text-[12px] text-pd-ink-3 truncate mt-0.5">{addon.description}</p>
                        <Price value={addon.price} className="block text-[14px] font-semibold text-pd-ink mt-0.5" />
                      </div>
                      <AddStepper
                        size="sm"
                        quantity={selected?.qty || 0}
                        onAdd={() => addAddon(addon)}
                        onIncrement={() => updateAddonQty(addon.id, 1)}
                        onDecrement={() => updateAddonQty(addon.id, -1)}
                        className="!shadow-none"
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Sticky footer */}
          <div
            className="px-4 pt-3 bg-white border-t border-[color:var(--pd-line)] flex items-center gap-3"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
          >
            <div className="flex items-center justify-between h-12 w-[116px] rounded-[12px] border border-[color:var(--pd-line)] text-pd-ink">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
                className="h-full px-3.5 text-[20px] leading-none pd-press"
              >
                −
              </button>
              <span className="text-[16px] font-semibold pd-tabular" aria-live="polite">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Increase quantity"
                className="h-full px-3.5 text-[20px] leading-none pd-press"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 h-12 rounded-[12px] bg-pd-action hover:bg-pd-action-press text-white text-[16px] font-semibold pd-press pd-tabular"
            >
              Add item · {formatINR(totalPrice)}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default CustomerDishDetailModal;
