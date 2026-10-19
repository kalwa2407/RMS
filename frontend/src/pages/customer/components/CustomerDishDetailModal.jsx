import React, { useState, useEffect } from 'react';
import { X, Bookmark, Share2, Plus, Minus, Star, Check } from 'lucide-react';

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
  dish,
  isOpen,
  onClose,
  onAddToCart
}) => {
  const [quantity, setQuantity] = useState(1);
  // Each addon entry: { ...addon, qty: number }
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedAddons([]);
      setIsBookmarked(false);
      setCopied(false);
    }
  }, [isOpen, dish]);

  if (!isOpen || !dish) return null;

  const isVeg = dish.is_veg === true ||
    dish.veg === true ||
    (dish.category || '').toLowerCase().includes('veg') ||
    (dish.name || '').toLowerCase().includes('paneer') ||
    (dish.name || '').toLowerCase().includes('dal');

  const fallbackImg = `/dynamic_images/img${(((dish.id || dish._id || 1) % 9) + 1)}.jpeg`;
  const dishImg = dish.image && !dish.image.includes('no-image.png') && !dish.image.includes('photo-1701579231305-d7d8af9a3fd')
    ? dish.image
    : fallbackImg;

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
  const unitPrice = (dish.price || 0) + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    onAddToCart({
      ...dish,
      price: unitPrice,
      addons: selectedAddons.map(a => ({ ...a, quantity: a.qty })),
      quantity
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
    <div className="fixed inset-0 z-[70] flex flex-col justify-end items-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* ── Top Floating Close (X) Button (Matching Screenshot 4) ── */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="mb-2 w-10 h-10 rounded-full bg-neutral-900/80 hover:bg-neutral-900 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer border border-white/20"
      >
        <X className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* ── Modal Container (White Bottom Sheet) ── */}
      <div className="w-full max-w-[430px] max-h-[85vh] bg-white rounded-t-[28px] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          
          {/* 1. Large Hero Dish Photo (Screenshot 4) */}
          <div className="relative w-full h-64 bg-neutral-100">
            <img
              src={dishImg}
              alt={dish.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = fallbackImg;
              }}
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

            {/* Rating Tag */}
            <div className="absolute bottom-3 left-4 bg-black/70 backdrop-blur-xs text-white text-xs font-black px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-md">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{dish.rating ? Number(dish.rating).toFixed(1) : '4.8'}</span>
              <span className="text-white/60 text-[10px] font-normal ml-0.5">· Persian Special</span>
            </div>
          </div>

          {/* 2. Dish Metadata & Action Row */}
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                {/* Veg / Non-Veg Icon */}
                <div className={`w-4 h-4 rounded-[4px] border ${isVeg ? 'border-emerald-600' : 'border-[#8B2500]'} flex items-center justify-center p-[2px]`}>
                  {isVeg ? (
                    <div className="w-2 h-2 rounded-full bg-emerald-600" />
                  ) : (
                    <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-[#8B2500]" />
                  )}
                </div>

                {/* Dish Name */}
                <h2 className="text-xl font-black text-neutral-900 leading-tight">
                  {dish.name}
                </h2>

                {/* Price */}
                <div className="flex items-baseline space-x-2">
                  <span className="text-lg font-black text-neutral-900">
                    ₹{dish.price}
                  </span>
                  {dish.original_price && dish.original_price > dish.price && (
                    <span className="text-xs text-neutral-400 line-through font-semibold">
                      ₹{dish.original_price}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Bookmark & Share (Screenshot 4) */}
              <div className="flex items-center space-x-2 shrink-0 pt-1">
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  aria-label="Bookmark"
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all active:scale-90 ${
                    isBookmarked
                      ? 'bg-amber-50 border-amber-400 text-amber-600'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={handleShare}
                  aria-label="Share"
                  className="w-9 h-9 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 flex items-center justify-center transition-all active:scale-90"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Social Proof: Highly Reordered Progress Pill (Screenshot 4) */}
            <div className="flex items-center space-x-2 pt-0.5">
              <div className="w-16 h-2 rounded-full bg-emerald-100 overflow-hidden flex">
                <div className="w-4/5 h-full bg-emerald-600 rounded-full" />
              </div>
              <span className="text-xs font-bold text-neutral-700">
                Highly reordered
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-neutral-600 leading-relaxed pt-1">
              {dish.description ||
                'Delicately seasoned authentic Persian recipe slow-cooked to culinary perfection using aromatic Persian Darbar spices.'}
            </p>
          </div>

          <div className="h-2 bg-neutral-100 border-y border-neutral-200/60 my-1" />

          {/* 3. Customization & Add-on Section: Beverages & Accompaniments (Screenshot 4) */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-sm font-black text-neutral-900">
                Beverages & Royal Accompaniments
              </h3>
              <p className="text-[11px] text-neutral-400">
                Select options to pair with your dish
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {ACCOMPANIMENTS.map((addon) => {
                const selected = selectedAddons.find((a) => a.id === addon.id);
                return (
                  <div
                    key={addon.id}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                      selected
                        ? 'border-[#E40000] bg-red-50/40 shadow-xs'
                        : 'border-neutral-200/80 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {/* Image Thumbnail */}
                      <img
                        src={addon.image}
                        alt={addon.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 bg-neutral-100 border border-neutral-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/dynamic_images/img1.jpeg';
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          {/* Veg dot */}
                          <div className="w-3 h-3 rounded-[3px] border border-emerald-600 flex items-center justify-center p-[1px]">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          </div>
                          <h4 className="text-xs font-bold text-neutral-900 truncate">
                            {addon.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                          {addon.description}
                        </p>
                        <p className="text-xs font-black text-neutral-900 mt-0.5">
                          ₹{addon.price}
                        </p>
                      </div>
                    </div>

                    {/* ADD Button / Quantity Stepper (Zomato style) */}
                    {selected ? (
                      <div className="ml-2 flex items-center space-x-2 bg-[#E40000] rounded-xl px-2.5 py-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAddonQty(addon.id, -1);
                          }}
                          className="text-white p-0.5 active:scale-75 transition-transform"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <span className="text-white text-xs font-black w-4 text-center">
                          {selected.qty}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAddonQty(addon.id, 1);
                          }}
                          className="text-white p-0.5 active:scale-75 transition-transform"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addAddon(addon);
                        }}
                        className="ml-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 shrink-0 border bg-white text-[#E40000] border-red-200 hover:border-[#E40000]"
                      >
                        ADD +
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 4. Sticky Bottom Action Bar (Screenshot 4) ── */}
        <div
          className="p-3.5 bg-white border-t border-neutral-200/80 flex items-center justify-between gap-3 shadow-lg"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)'
          }}
        >
          {/* Quantity Selector: [- 1 +] in rounded pink outline */}
          <div className="flex items-center justify-between w-28 px-3 py-2.5 rounded-2xl border border-rose-200 bg-rose-50/50 text-[#E40000]">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              aria-label="Decrease quantity"
              className="p-0.5 active:scale-75 transition-transform cursor-pointer"
            >
              <Minus className="w-4 h-4 stroke-[3]" />
            </button>
            <span className="text-base font-black text-neutral-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              aria-label="Increase quantity"
              className="p-0.5 active:scale-75 transition-transform cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Big Red CTA: Add item - ₹XXX */}
          <button
            onClick={handleAdd}
            className="flex-1 bg-[#E40000] hover:bg-[#CC0000] text-white font-black text-sm py-3 px-4 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center space-x-1 cursor-pointer"
          >
            <span>Add item - ₹{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDishDetailModal;
