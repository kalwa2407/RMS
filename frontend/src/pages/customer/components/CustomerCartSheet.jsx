import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Tag, MapPin, Check, Sparkles, AlertCircle, Navigation, Banknote, CreditCard, Coins, Bike, ShoppingBag } from 'lucide-react';


const CustomerCartSheet = ({
  isOpen = false,
  onClose,
  cart = [],
  onUpdateCartQty,
  onClearCart,
  orderType = 'DELIVERY',
  onSetOrderType,
  deliveryAddress = '',
  onSetDeliveryAddress,
  onDetectLocation,
  detectingLocation = false,
  distanceKm = null,
  selectedBranch = null,
  coupons = [],
  appliedCoupon = null,
  couponDiscount = 0,
  onApplyCoupon,
  onRemoveCoupon,
  validatingCoupon = false,
  pdCoins = 0,
  applyCoins = false,
  onToggleCoins,
  coinsDiscount = 0,
  maxRedeemableCoins = 0,
  cookingTags = [],
  onToggleCookingTag,
  cookingNote = '',
  onSetCookingNote,
  deliveryTags = [],
  onToggleDeliveryTag,
  payMethod = 'cod',
  onSetPayMethod,
  onPlaceOrder,
  placingOrder = false,
  cartSubtotal = 0,
  cartDeliveryFee = 0,
  cartTaxes = 0,
  cartTotal = 0,
  freeDeliveryThreshold = 500
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [showCouponsList, setShowCouponsList] = useState(false);

  if (!isOpen) return null;

  const COOKING_OPTIONS = ['Less spicy', 'Extra gravy', 'Well cooked', 'No onion/garlic'];
  const DELIVERY_OPTIONS = ['Leave at door', "Don't ring bell", 'Call upon arrival', 'Avoid calling'];

  const freeDeliveryDiff = Math.max(0, freeDeliveryThreshold - cartSubtotal);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity">
      <div
        className="w-full max-w-[430px] max-h-[90vh] bg-white rounded-t-[28px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
      >
        {/* Grab Handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1" />

        {/* ── Sheet Header ── */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-extrabold text-neutral-900">
              Your Food Cart
            </h2>
            <span className="text-xs font-bold text-gray-500">
              ({cart.reduce((s, i) => s + i.quantity, 0)} items)
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 no-scrollbar">
          {/* Order Type Tabs: Delivery vs Takeaway */}
          <div className="flex bg-neutral-100 p-1 rounded-xl">
            <button
              onClick={() => onSetOrderType('DELIVERY')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                orderType === 'DELIVERY'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Bike className="w-3.5 h-3.5" />
                <span>Home Delivery</span>
              </span>
            </button>
            <button
              onClick={() => onSetOrderType('TAKEAWAY')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                orderType === 'TAKEAWAY'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Takeaway Pickup</span>
              </span>
            </button>
          </div>


          {/* Takeaway Info (if Takeaway) */}
          {orderType === 'TAKEAWAY' && (
            <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200/70 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-neutral-800">
                <MapPin className="w-3.5 h-3.5 text-[#E23744]" />
                <span>Pickup Outlet: Persian Darbar ({selectedBranch?.name || 'Bandra Flagship'})</span>
              </div>
              <p className="text-[11px] text-neutral-600 font-medium">
                {selectedBranch?.fullAddress || 'Moray Mahal, Linking Road, Bandra West, Mumbai'}
              </p>
              <p className="text-[10px] text-emerald-700 font-bold pt-0.5">
                ✓ Ready for pickup in ~25 mins • Zero delivery fees
              </p>
            </div>
          )}

          {/* Delivery Address (if Delivery) */}
          {orderType === 'DELIVERY' && (
            <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-neutral-800">
                  <MapPin className="w-3.5 h-3.5 text-[#E23744]" />
                  <span>Delivery Address</span>
                </div>
                <button
                  onClick={onDetectLocation}
                  disabled={detectingLocation}
                  className="text-[11px] font-bold text-[#E23744] hover:underline flex items-center space-x-1"
                >
                  <Navigation className={`w-3 h-3 ${detectingLocation ? 'animate-spin' : ''}`} />
                  <span>{detectingLocation ? 'Detecting GPS...' : 'GPS Auto-detect'}</span>
                </button>
              </div>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => onSetDeliveryAddress(e.target.value)}
                placeholder="Enter complete flat, street, landmark address..."
                className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#E23744]"
              />
              {distanceKm && (
                <div className="flex items-center justify-between text-[11px] text-neutral-600 font-medium pt-0.5">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-[#E23744]" />
                    <span>Distance from <strong>{selectedBranch?.name || 'Persian Darbar'}</strong>:</span>
                  </span>
                  <span className="font-black text-neutral-900 bg-neutral-200/60 px-2 py-0.5 rounded-md">
                    {distanceKm} km
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Free Delivery Bar */}
          {orderType === 'DELIVERY' && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs text-amber-900 font-bold">
                <Bike className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  {freeDeliveryDiff === 0
                    ? 'FREE Delivery Unlocked on this order!'
                    : `Add ₹${freeDeliveryDiff} more for FREE Delivery`}
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-800">
                Above ₹{freeDeliveryThreshold}
              </span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">
                ITEMS IN CART
              </h3>
              <button
                onClick={onClearCart}
                className="text-[11px] font-bold text-red-500 hover:text-red-700"
              >
                Clear Cart
              </button>
            </div>

            {cart.map((item) => {
              const isVeg = item.is_veg !== false && !item.category?.toLowerCase().includes('non') && item.veg !== false;
              return (
                <div
                  key={item._id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start space-x-2 flex-1 pr-2">
                    <span
                      className={`w-3.5 h-3.5 border flex items-center justify-center p-[2px] rounded-xs mt-0.5 shrink-0 ${
                        isVeg ? 'border-green-600' : 'border-red-600'
                      }`}
                    >
                      {isVeg ? (
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                      ) : (
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-xs" />
                      )}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-xs font-extrabold text-neutral-800 mt-0.5">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center space-x-2 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-xs font-black">
                    <button
                      onClick={() => onUpdateCartQty(item._id, -1)}
                      className="text-neutral-600 hover:text-[#E23744] p-0.5"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateCartQty(item._id, 1)}
                      className="text-neutral-600 hover:text-[#E23744] p-0.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Coupons & Promos ── */}
          <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-neutral-800">
                <Tag className="w-3.5 h-3.5 text-[#E23744]" />
                <span>Offers &amp; Coupons</span>
              </div>
              {coupons.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCouponsList(!showCouponsList)}
                  className="text-[11px] font-bold text-[#E23744]"
                >
                  {showCouponsList ? 'Hide' : `View ${coupons.length} Offers`}
                </button>
              )}
            </div>

            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-xs font-bold text-emerald-800">
                <div className="flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Applied "{appliedCoupon.code}" (Saved ₹{couponDiscount})</span>
                </div>
                <button
                  onClick={onRemoveCoupon}
                  className="text-[11px] font-extrabold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code (e.g. ROYAL50)"
                  className="flex-1 bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-bold uppercase text-neutral-800 placeholder-neutral-400 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (couponInput.trim()) onApplyCoupon(couponInput.trim());
                  }}
                  disabled={validatingCoupon || !couponInput.trim()}
                  className="bg-[#1C1C1C] text-white text-xs font-bold px-4 py-1.5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
                >
                  {validatingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </div>
            )}

            {/* Public Coupons Suggestions */}
            {showCouponsList && coupons.length > 0 && !appliedCoupon && (
              <div className="space-y-1.5 pt-1 border-t border-neutral-200">
                {coupons.map((c) => (
                  <div
                    key={c.code}
                    onClick={() => {
                      setCouponInput(c.code);
                      onApplyCoupon(c.code);
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-dashed border-red-300 cursor-pointer hover:bg-red-50 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-black text-[#E23744]">
                        {c.code}
                      </span>
                      <p className="text-[10px] text-neutral-500">
                        {c.description || `Get ${c.discount_percent || 15}% OFF`}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-red-600">
                      APPLY
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Persian Darbar PD Coins Redemption ── */}
          {pdCoins > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-2xl border border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-300">
                  <Coins className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-900">
                    Redeem PD Coins
                  </h4>
                  <p className="text-[10px] text-amber-800">
                    Balance: {pdCoins} coins · Save up to ₹{maxRedeemableCoins}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyCoins}
                  onChange={onToggleCoins}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-600" />
              </label>
            </div>
          )}

          {/* ── Cooking & Delivery Tags ── */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-extrabold text-neutral-500 uppercase tracking-wider mb-1.5">
                Cooking Instructions
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COOKING_OPTIONS.map((tag) => {
                  const selected = cookingTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onToggleCookingTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                        selected
                          ? 'border-[#E23744] bg-red-50 text-[#E23744]'
                          : 'border-neutral-200 bg-white text-neutral-600'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={cookingNote}
                onChange={(e) => onSetCookingNote(e.target.value)}
                placeholder="Any special note for chef..."
                className="w-full mt-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-neutral-500 uppercase tracking-wider mb-1.5">
                Delivery Instructions
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DELIVERY_OPTIONS.map((tag) => {
                  const selected = deliveryTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onToggleDeliveryTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                        selected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-neutral-200 bg-white text-neutral-600'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Bill Details Breakdown ── */}
          <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200/80 space-y-2 text-xs">
            <h3 className="font-extrabold text-neutral-900 mb-2">
              Bill Summary
            </h3>
            <div className="flex items-center justify-between text-neutral-600">
              <span>Item Total</span>
              <span>₹{cartSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-600">
              <span>Delivery Partner Fee</span>
              <span>{cartDeliveryFee === 0 ? 'FREE' : `₹${cartDeliveryFee}`}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-600">
              <span>GST &amp; Restaurant Taxes (5%)</span>
              <span>₹{cartTaxes}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex items-center justify-between text-emerald-600 font-bold">
                <span>Coupon Discount</span>
                <span>- ₹{couponDiscount}</span>
              </div>
            )}
            {coinsDiscount > 0 && (
              <div className="flex items-center justify-between text-amber-600 font-bold">
                <span>PD Coins Redeemed</span>
                <span>- ₹{coinsDiscount}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-neutral-900 font-black text-sm pt-2 border-t border-neutral-200">
              <span>To Pay</span>
              <span>₹{cartTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[11px] font-extrabold text-neutral-500 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSetPayMethod('cod')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1.5 transition-all ${
                  payMethod === 'cod'
                    ? 'border-[#E23744] bg-red-50 text-[#E23744] ring-1 ring-[#E23744]'
                    : 'border-neutral-200 bg-white text-neutral-700'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cash on Delivery</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onSetPayMethod('online')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1.5 transition-all ${
                  payMethod === 'online'
                    ? 'border-[#E23744] bg-red-50 text-[#E23744] ring-1 ring-[#E23744]'
                    : 'border-neutral-200 bg-white text-neutral-700'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>UPI / Online (Razorpay)</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ── Fixed Footer CTA ── */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <button
            onClick={onPlaceOrder}
            disabled={placingOrder}
            className="w-full bg-[#E23744] hover:bg-[#CB202D] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>
              {placingOrder ? 'Confirming Order...' : `Confirm Order · ₹${cartTotal.toLocaleString()}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerCartSheet;
