import React, { useState } from 'react';
import { Drawer } from 'vaul';
import { X, Plus, Tag, MapPin, Check, AlertCircle, Navigation, Banknote, CreditCard, Coins, Bike, ShoppingBag, ChevronDown, Store } from 'lucide-react';
import { isVegDish } from '../customerAssets';
import { AddStepper, VegMark, cx, formatINR } from '../ui';

const COOKING_OPTIONS = ['Less spicy', 'Extra gravy', 'Well cooked', 'No onion/garlic'];
const DELIVERY_OPTIONS = ['Leave at door', "Don't ring bell", 'Call upon arrival', 'Avoid calling'];

/* White card on the warm-grey sheet background. */
const Card = ({ children, className = '' }) => (
  <section className={cx('bg-white rounded-[18px] shadow-pd-1', className)}>{children}</section>
);

const CardTitle = ({ icon: Icon, children, action }) => (
  <div className="flex items-center justify-between gap-2 mb-3">
    <h3 className="flex items-center gap-2 text-[15px] font-semibold text-pd-ink">
      {Icon && <Icon className="w-[18px] h-[18px] text-pd-ink-2" strokeWidth={1.75} />}
      {children}
    </h3>
    {action}
  </div>
);

const BillRow = ({ label, value, className = '' }) => (
  <div className={cx('flex items-center justify-between text-[14px]', className)}>
    <span>{label}</span>
    <span className="pd-tabular">{value}</span>
  </div>
);

const CustomerCartSheet = ({
  isOpen = false,
  onClose,
  currentUser = null,
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
  freeDeliveryThreshold = 500,
  onOrderMore
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [showCouponsList, setShowCouponsList] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const freeDeliveryDiff = Math.max(0, freeDeliveryThreshold - cartSubtotal);
  const freeDeliveryUnlocked = cartDeliveryFee === 0 || freeDeliveryDiff === 0;
  const numDist = parseFloat(distanceKm || 0);
  const isBeyondDeliveryRange = orderType === 'DELIVERY' && numDist > 20;
  const totalSavings = (couponDiscount || 0) + (coinsDiscount || 0);
  const instructionCount = cookingTags.length + deliveryTags.length + (cookingNote ? 1 : 0);

  const ctaLabel = isBeyondDeliveryRange
    ? 'Delivery unavailable beyond 20 km'
    : placingOrder
    ? 'Placing order…'
    : currentUser
    ? 'Place order'
    : 'Log in to place order';

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Drawer.Content
          aria-describedby={undefined}
          className="fixed z-[51] bottom-0 left-0 right-0 mx-auto w-full max-w-[430px] md:max-w-xl h-[92vh] bg-pd-surface rounded-t-[24px] flex flex-col outline-none"
        >
          {/* Header */}
          <div className="bg-white rounded-t-[24px] border-b border-[color:var(--pd-line)]">
            <div className="w-10 h-1.5 rounded-full bg-black/15 mx-auto mt-2" />
            <div className="px-4 pt-2 pb-3 flex items-center justify-between">
              <div>
                <Drawer.Title className="text-[20px] font-bold text-pd-ink tracking-[-0.01em]">Your cart</Drawer.Title>
                <p className="text-[13px] text-pd-ink-2 pd-tabular">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} · Persian Darbar{selectedBranch?.name ? `, ${selectedBranch.name}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 rounded-full bg-pd-surface flex items-center justify-center text-pd-ink-2 pd-press"
              >
                <X className="w-[18px] h-[18px]" strokeWidth={2} />
              </button>
            </div>

            {/* Delivery / Pickup segmented control */}
            <div className="px-4 pb-3">
              <div className="flex bg-pd-surface p-1 rounded-[12px]" role="tablist">
                {[
                  { id: 'DELIVERY', label: 'Delivery', icon: Bike },
                  { id: 'TAKEAWAY', label: 'Pickup', icon: ShoppingBag },
                ].map(({ id, label, icon: Icon }) => {
                  const active = orderType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => onSetOrderType(id)}
                      className={cx(
                        'flex-1 h-9 rounded-[9px] text-[14px] font-semibold flex items-center justify-center gap-1.5 transition-colors',
                        active ? 'bg-white text-pd-ink shadow-pd-1' : 'text-pd-ink-2'
                      )}
                    >
                      <Icon className="w-4 h-4" strokeWidth={2} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-3">
            {/* Address / pickup */}
            {orderType === 'TAKEAWAY' ? (
              <Card className="p-4">
                <CardTitle icon={Store}>Pickup from</CardTitle>
                <p className="text-[15px] font-medium text-pd-ink">
                  Persian Darbar ({selectedBranch?.name || 'Bandra Flagship'})
                </p>
                <p className="text-[13px] text-pd-ink-2 mt-0.5">
                  {selectedBranch?.fullAddress || 'Moray Mahal, Linking Road, Bandra West, Mumbai'}
                </p>
                <p className="text-[13px] text-pd-success font-medium mt-2">
                  Ready in about 25 min · No delivery fee
                </p>
              </Card>
            ) : (
              <Card className="p-4">
                <CardTitle
                  icon={MapPin}
                  action={
                    <button
                      type="button"
                      onClick={onDetectLocation}
                      disabled={detectingLocation}
                      className="flex items-center gap-1 text-[13px] font-semibold text-pd-action pd-press disabled:opacity-60"
                    >
                      <Navigation className={cx('w-3.5 h-3.5', detectingLocation && 'animate-spin')} />
                      {detectingLocation ? 'Detecting…' : 'Use my location'}
                    </button>
                  }
                >
                  Deliver to
                </CardTitle>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => onSetDeliveryAddress(e.target.value)}
                  placeholder="Flat, street, landmark"
                  autoComplete="street-address"
                  className="w-full h-12 bg-pd-surface rounded-[12px] px-3.5 text-[16px] text-pd-ink placeholder:text-pd-ink-3 focus:outline-none focus:ring-2 focus:ring-pd-action/30"
                />
                {distanceKm && (
                  <p className={cx('text-[13px] mt-2', isBeyondDeliveryRange ? 'text-pd-error' : 'text-pd-ink-2')}>
                    <span className="pd-tabular">{distanceKm} km</span> from {selectedBranch?.name || 'Persian Darbar'}
                  </p>
                )}
                {isBeyondDeliveryRange && (
                  <div className="mt-3 rounded-[12px] bg-[#FDECEC] p-3 flex items-start gap-2.5">
                    <AlertCircle className="w-[18px] h-[18px] shrink-0 mt-0.5 text-pd-error" />
                    <div className="text-[13px] leading-[18px] text-pd-ink">
                      <p className="font-semibold">We deliver within 20 km</p>
                      <p className="text-pd-ink-2 mt-0.5">
                        You are <span className="pd-tabular">{numDist.toFixed(1)} km</span> away. Switch to Pickup to order from this outlet.
                      </p>
                    </div>
                  </div>
                )}
                {!isBeyondDeliveryRange && (
                  <div className="mt-3 pt-3 border-t border-[color:var(--pd-line)] flex items-center gap-2 text-[13px]">
                    <Bike className="w-4 h-4 text-pd-ink-2 shrink-0" strokeWidth={1.75} />
                    {freeDeliveryUnlocked ? (
                      <span className="text-pd-success font-medium">Free delivery on this order</span>
                    ) : (
                      <span className="text-pd-ink-2">
                        Add <span className="font-semibold text-pd-ink pd-tabular">{formatINR(freeDeliveryDiff)}</span> more for free delivery
                      </span>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Items */}
            <Card className="px-4 pt-4 pb-1">
              <CardTitle
                action={
                  <button type="button" onClick={onClearCart} className="text-[13px] font-medium text-pd-ink-3 pd-press">
                    Clear
                  </button>
                }
              >
                Items
              </CardTitle>
              <ul className="divide-y divide-[color:var(--pd-line)]">
                {cart.map((item) => (
                  <li key={item._id || item.id} className="flex items-center gap-3 py-3">
                    <VegMark veg={isVegDish(item)} size={13} className="self-start mt-1" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[15px] font-medium text-pd-ink leading-5">{item.name}</h4>
                      <p className="text-[13px] text-pd-ink-2 mt-0.5 pd-tabular">{formatINR(item.price)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <AddStepper
                        size="sm"
                        quantity={item.quantity}
                        onIncrement={() => onUpdateCartQty(item._id || item.id, 1)}
                        onDecrement={() => onUpdateCartQty(item._id || item.id, -1)}
                        className="!shadow-none"
                      />
                      <span className="text-[13px] font-semibold text-pd-ink pd-tabular">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              {onOrderMore && (
                <button
                  type="button"
                  onClick={onOrderMore}
                  className="w-full flex items-center gap-2 py-3.5 border-t border-[color:var(--pd-line)] text-[14px] font-semibold text-pd-action pd-press"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.25} />
                  Add more items
                </button>
              )}
            </Card>

            {/* Instructions (collapsed by default) */}
            <Card className="p-4">
              <button
                type="button"
                onClick={() => setShowInstructions((v) => !v)}
                aria-expanded={showInstructions}
                className="w-full flex items-center justify-between text-left"
              >
                <span>
                  <span className="block text-[15px] font-semibold text-pd-ink">Cooking &amp; delivery instructions</span>
                  <span className="block text-[13px] text-pd-ink-2 mt-0.5">
                    {instructionCount > 0 ? `${instructionCount} added` : 'Optional'}
                  </span>
                </span>
                <ChevronDown className={cx('w-5 h-5 text-pd-ink-3 transition-transform duration-200', showInstructions && 'rotate-180')} />
              </button>

              {showInstructions && (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-[13px] font-medium text-pd-ink-2 mb-2">For the kitchen</p>
                    <div className="flex flex-wrap gap-2">
                      {COOKING_OPTIONS.map((tag) => {
                        const selected = cookingTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onToggleCookingTag(tag)}
                            className={cx(
                              'h-8 px-3 rounded-full text-[13px] font-medium border transition-colors',
                              selected ? 'border-pd-ink bg-pd-ink text-white' : 'border-[color:var(--pd-line)] bg-white text-pd-ink'
                            )}
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
                      placeholder="Note for the chef"
                      className="w-full mt-3 h-11 bg-pd-surface rounded-[12px] px-3.5 text-[16px] text-pd-ink placeholder:text-pd-ink-3 focus:outline-none focus:ring-2 focus:ring-pd-action/30"
                    />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-pd-ink-2 mb-2">For the rider</p>
                    <div className="flex flex-wrap gap-2">
                      {DELIVERY_OPTIONS.map((tag) => {
                        const selected = deliveryTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onToggleDeliveryTag(tag)}
                            className={cx(
                              'h-8 px-3 rounded-full text-[13px] font-medium border transition-colors',
                              selected ? 'border-pd-ink bg-pd-ink text-white' : 'border-[color:var(--pd-line)] bg-white text-pd-ink'
                            )}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Offers */}
            <Card className="p-4">
              <CardTitle
                icon={Tag}
                action={
                  coupons.length > 0 && !appliedCoupon ? (
                    <button
                      type="button"
                      onClick={() => setShowCouponsList(!showCouponsList)}
                      className="text-[13px] font-semibold text-pd-action pd-press"
                    >
                      {showCouponsList ? 'Hide offers' : `View ${coupons.length} offers`}
                    </button>
                  ) : null
                }
              >
                Offers
              </CardTitle>

              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-[12px] bg-[#EAF6EE] px-3.5 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Check className="w-[18px] h-[18px] text-pd-success shrink-0" strokeWidth={2.5} />
                    <span className="text-[14px] text-pd-ink truncate">
                      <span className="font-semibold">{appliedCoupon.code}</span> applied · you save <span className="pd-tabular">{formatINR(couponDiscount)}</span>
                    </span>
                  </div>
                  <button type="button" onClick={onRemoveCoupon} className="text-[13px] font-semibold text-pd-ink-2 pl-2 pd-press">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    autoCapitalize="characters"
                    className="flex-1 min-w-0 h-11 bg-pd-surface rounded-[12px] px-3.5 text-[16px] font-medium tracking-wide text-pd-ink placeholder:text-pd-ink-3 placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-pd-action/30"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (couponInput.trim()) onApplyCoupon(couponInput.trim());
                    }}
                    disabled={validatingCoupon || !couponInput.trim()}
                    className="h-11 px-4 rounded-[12px] bg-pd-ink text-white text-[14px] font-semibold disabled:opacity-35 pd-press"
                  >
                    {validatingCoupon ? 'Checking…' : 'Apply'}
                  </button>
                </div>
              )}

              {showCouponsList && coupons.length > 0 && !appliedCoupon && (
                <ul className="mt-3 divide-y divide-[color:var(--pd-line)] border-t border-[color:var(--pd-line)]">
                  {coupons.map((c) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        onClick={() => {
                          setCouponInput(c.code);
                          onApplyCoupon(c.code);
                        }}
                        className="w-full flex items-center justify-between gap-3 py-3 text-left pd-press"
                      >
                        <span className="min-w-0">
                          <span className="block text-[14px] font-semibold text-pd-ink tracking-wide">{c.code}</span>
                          <span className="block text-[13px] text-pd-ink-2 truncate">
                            {c.description || `Get ${c.discount_percent || 15}% off`}
                          </span>
                        </span>
                        <span className="text-[13px] font-semibold text-pd-action shrink-0">Apply</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* PD Coins */}
            {pdCoins > 0 && (
              <Card className="p-4">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-pd-gold-tint flex items-center justify-center shrink-0">
                      <Coins className="w-[18px] h-[18px] text-pd-gold" strokeWidth={2} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-pd-ink">Use PD Coins</span>
                      <span className="block text-[13px] text-pd-ink-2 pd-tabular">
                        {pdCoins} coins · save up to {formatINR(maxRedeemableCoins)}
                      </span>
                    </span>
                  </span>
                  <input type="checkbox" checked={applyCoins} onChange={onToggleCoins} className="sr-only peer" />
                  <span
                    aria-hidden="true"
                    className="relative shrink-0 w-[51px] h-[31px] rounded-full bg-[#E3E1DC] transition-colors peer-checked:bg-pd-success peer-focus-visible:ring-2 peer-focus-visible:ring-pd-action/40 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-[27px] after:h-[27px] after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-[20px]"
                  />
                </label>
              </Card>
            )}

            {/* Bill */}
            <Card className="p-4">
              <CardTitle>Bill details</CardTitle>
              <div className="space-y-2.5 text-pd-ink-2">
                <BillRow label="Item total" value={formatINR(cartSubtotal)} />
                {orderType === 'DELIVERY' && (
                  <BillRow
                    label="Delivery fee"
                    value={cartDeliveryFee === 0 ? <span className="text-pd-success font-medium">Free</span> : formatINR(cartDeliveryFee)}
                  />
                )}
                <BillRow label="GST & restaurant charges (5%)" value={formatINR(cartTaxes)} />
                {couponDiscount > 0 && (
                  <BillRow label="Coupon discount" value={`− ${formatINR(couponDiscount)}`} className="text-pd-success" />
                )}
                {coinsDiscount > 0 && (
                  <BillRow label="PD Coins" value={`− ${formatINR(coinsDiscount)}`} className="text-pd-success" />
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-[color:var(--pd-line)] flex items-center justify-between">
                <span className="text-[16px] font-semibold text-pd-ink">To pay</span>
                <span className="text-[17px] font-bold text-pd-ink pd-tabular">{formatINR(cartTotal)}</span>
              </div>
              {totalSavings > 0 && (
                <p className="mt-3 rounded-[10px] bg-[#EAF6EE] text-pd-success text-[13px] font-medium text-center py-2 pd-tabular">
                  You are saving {formatINR(totalSavings)} on this order
                </p>
              )}
            </Card>

            {/* Payment */}
            <Card className="p-4">
              <CardTitle>Pay with</CardTitle>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'cod', label: orderType === 'TAKEAWAY' ? 'Pay at outlet' : 'Cash on delivery', icon: Banknote },
                  { id: 'online', label: 'UPI / Online', icon: CreditCard },
                ].map(({ id, label, icon: Icon }) => {
                  const active = payMethod === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onSetPayMethod(id)}
                      className={cx(
                        'h-14 rounded-[12px] border-2 flex items-center justify-center gap-2 text-[14px] font-semibold pd-press transition-colors',
                        active ? 'border-pd-ink bg-white text-pd-ink' : 'border-transparent bg-pd-surface text-pd-ink-2'
                      )}
                    >
                      <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </Card>

            <div className="h-2" />
          </div>

          {/* Footer */}
          <div
            className="bg-white border-t border-[color:var(--pd-line)] px-4 pt-3 flex items-center gap-4"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
          >
            <div className="shrink-0">
              <p className="text-[17px] font-bold text-pd-ink pd-tabular leading-tight">{formatINR(cartTotal)}</p>
              <p className="text-[12px] text-pd-ink-3">Total</p>
            </div>
            <button
              type="button"
              onClick={onPlaceOrder}
              disabled={placingOrder || isBeyondDeliveryRange}
              className={cx(
                'flex-1 h-[52px] rounded-[14px] text-white text-[16px] font-semibold pd-press transition-colors',
                isBeyondDeliveryRange ? 'bg-pd-ink-3 cursor-not-allowed' : 'bg-pd-action hover:bg-pd-action-press disabled:opacity-60'
              )}
            >
              {ctaLabel}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default CustomerCartSheet;
