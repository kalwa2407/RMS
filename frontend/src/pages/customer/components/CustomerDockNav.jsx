import React from 'react';
import { Home, UtensilsCrossed, Calendar, Award, User, ShoppingBag, Clock, Navigation, Bike, ChefHat } from 'lucide-react';

const CustomerDockNav = ({
  activeTab = 'home',
  onSelectTab,
  cartCount = 0,
  cartTotal = 0,
  onOpenCart,
  activeOrder = null,   // { order_id, status, eta } - for live tracker
  onTrackOrder = null,  // callback to open tracking
}) => {
  const NAV_ITEMS = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'order', label: 'Order', icon: UtensilsCrossed },
    { id: 'reserve', label: 'Reserve', icon: Calendar },
    { id: 'rewards', label: 'Rewards', icon: Award },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  // Status label map for the tracker pill
  const statusLabel = {
    placed: 'Order Placed',
    accepted: 'Order Accepted',
    preparing: 'Preparing Feast',
    ready: 'Ready for Pickup',
    out_for_delivery: 'Out for Delivery',
  };

  return (
    <nav
      className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[430px] md:max-w-lg lg:max-w-xl px-3 z-40 pointer-events-none"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        paddingTop: '4px'
      }}
    >
      {/* ── Zomato-style Active Order Tracker Pill ── */}
      {activeOrder && onTrackOrder && !cartCount && activeOrder.status !== 'delivered' && (
        <div className="mb-2 pointer-events-auto animate-in slide-in-from-bottom duration-300">
          <div
            onClick={onTrackOrder}
            className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer active:scale-98 transition-all border border-white/10"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sm">
                  {activeOrder.status === 'out_for_delivery' ? (
                    <Bike className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ChefHat className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-[#1a1a2e] animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-black leading-tight">
                  {statusLabel[activeOrder.status] || 'Your Order is Active'}
                </p>
                {activeOrder.eta && (
                  <p className="text-[10px] text-white/60 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {activeOrder.eta}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-emerald-400">Track</span>
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Cart Capsule Banner (Shown when cart has items) ── */}
      {cartCount > 0 && (
        <div className="mb-2 pointer-events-auto animate-in slide-in-from-bottom duration-200">
          <div
            onClick={onOpenCart}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2.5 rounded-2xl shadow-[0_8px_24px_-4px_rgba(16,185,129,0.45)] border border-emerald-400/30 flex items-center justify-between cursor-pointer ios-press transition-all"
          >
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 fill-current" />
              <span className="text-xs font-black tracking-tight">
                {cartCount} {cartCount === 1 ? 'item' : 'items'} in cart
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-black">₹{cartTotal.toLocaleString()}</span>
              <span className="text-[11px] font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full ml-1">View Cart ›</span>
            </div>
          </div>
        </div>
      )}

      {/* ── BEGIN: Apple HIG Frosted Glass Dock ── */}
      <div className="ios-dock rounded-[30px] border border-white/80 shadow-[0_16px_40px_-6px_rgba(0,0,0,0.12)] px-2 py-1.5 flex items-center justify-between pointer-events-auto backdrop-blur-2xl bg-white/85">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ios-press relative ${
                isActive ? 'text-[#E40000]' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <div className={`relative p-1.5 rounded-2xl transition-all duration-300 ${
                isActive ? 'bg-red-50/90 text-[#E40000] scale-110 shadow-xs' : 'hover:scale-105'
              }`}>
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight transition-all duration-200 ${
                isActive ? 'font-black text-[#E40000]' : 'font-semibold text-neutral-500'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#E40000] mt-0.5 animate-in zoom-in duration-200" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CustomerDockNav;
