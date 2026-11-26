import React from 'react';
import { Home, UtensilsCrossed, CalendarDays, Award, User, ShoppingBag, ChevronRight, Bike, ChefHat } from 'lucide-react';
import { cx, formatINR } from '../ui';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'order', label: 'Order', icon: UtensilsCrossed },
  { id: 'reserve', label: 'Reserve', icon: CalendarDays },
  { id: 'rewards', label: 'Rewards', icon: Award },
  { id: 'profile', label: 'Profile', icon: User }
];

// Status label map for the active-order bar
const STATUS_LABEL = {
  placed: 'Order placed',
  accepted: 'Order accepted',
  preparing: 'Being prepared',
  ready: 'Ready for pickup',
  out_for_delivery: 'On the way',
};

const CustomerDockNav = ({
  activeTab = 'home',
  onSelectTab,
  cartCount = 0,
  cartTotal = 0,
  onOpenCart,
  activeOrder = null,   // { order_id, status, eta } - for live tracker
  onTrackOrder = null,  // callback to open tracking
}) => {
  const showOrderBar = activeOrder && onTrackOrder && !cartCount && activeOrder.status !== 'delivered';

  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] md:max-w-4xl z-40 pointer-events-none"
    >
      {/* ── Floating action bars (cart wins over active order) ── */}
      <div className="px-3 md:px-6 pb-2 md:max-w-lg md:mx-auto">
        {cartCount > 0 && (
          <button
            type="button"
            onClick={onOpenCart}
            className="pointer-events-auto w-full h-[56px] rounded-[14px] bg-pd-action text-white shadow-pd-2 px-4 flex items-center justify-between pd-press animate-in slide-in-from-bottom-4 fade-in duration-200"
          >
            <span className="flex items-center gap-3 min-w-0">
              <ShoppingBag className="w-5 h-5 shrink-0" strokeWidth={2} />
              <span className="text-left leading-tight">
                <span className="block text-[12px] font-medium text-white/80 pd-tabular">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'} · incl. taxes &amp; fees
                </span>
                <span className="block text-[16px] font-semibold pd-tabular">
                  {formatINR(cartTotal)}
                </span>
              </span>
            </span>
            <span className="flex items-center gap-0.5 text-[15px] font-semibold shrink-0">
              View cart
              <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2.25} />
            </span>
          </button>
        )}

        {showOrderBar && (
          <button
            type="button"
            onClick={onTrackOrder}
            className="pointer-events-auto w-full h-[56px] rounded-[14px] bg-pd-ink text-white shadow-pd-2 px-4 flex items-center justify-between pd-press animate-in slide-in-from-bottom-4 fade-in duration-200"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                {activeOrder.status === 'out_for_delivery' ? (
                  <Bike className="w-[18px] h-[18px]" strokeWidth={2} />
                ) : (
                  <ChefHat className="w-[18px] h-[18px]" strokeWidth={2} />
                )}
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#34C759] border-2 border-pd-ink" />
              </span>
              <span className="text-left leading-tight min-w-0">
                <span className="block text-[15px] font-semibold truncate">
                  {STATUS_LABEL[activeOrder.status] || 'Your order is active'}
                </span>
                {activeOrder.eta && (
                  <span className="block text-[12px] text-white/70">ETA {activeOrder.eta}</span>
                )}
              </span>
            </span>
            <span className="flex items-center gap-0.5 text-[14px] font-semibold text-white/90 shrink-0">
              Track
              <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2.25} />
            </span>
          </button>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div
        className="pointer-events-auto bg-white/[0.94] backdrop-blur-xl border-t border-[color:var(--pd-line)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch justify-around h-[56px] md:max-w-lg md:mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cx(
                  'flex-1 flex flex-col items-center justify-center gap-1 pd-press',
                  isActive ? 'text-pd-action' : 'text-pd-ink-3'
                )}
              >
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.25 : 1.75} />
                <span className={cx('text-[11px] leading-none', isActive ? 'font-semibold' : 'font-medium')}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default CustomerDockNav;
