import React from 'react';
import { Home, UtensilsCrossed, Calendar, Award, User, ShoppingBag } from 'lucide-react';

const CustomerDockNav = ({
  activeTab = 'home',
  onSelectTab,
  cartCount = 0,
  cartTotal = 0,
  onOpenCart
}) => {
  const NAV_ITEMS = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'order', label: 'Order', icon: UtensilsCrossed },
    { id: 'reserve', label: 'Reserve', icon: Calendar },
    { id: 'rewards', label: 'Rewards', icon: Award },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav
      className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[430px] px-3 z-40 pointer-events-none"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        paddingTop: '4px'
      }}
    >
      {/* ── Floating Cart Capsule Banner (Shown when cart has items) ── */}
      {cartCount > 0 && (
        <div className="mb-2 pointer-events-auto animate-in slide-in-from-bottom duration-200">
          <div
            onClick={onOpenCart}
            className="bg-[#24963F] hover:bg-[#1C7A32] text-white px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between cursor-pointer active:scale-98 transition-all"
          >
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 fill-current" />
              <span className="text-xs font-bold">
                {cartCount} {cartCount === 1 ? 'item' : 'items'} in cart
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs font-black">₹{cartTotal.toLocaleString()}</span>
              <span className="text-xs font-bold text-white/90 ml-1">View Cart ›</span>
            </div>
          </div>
        </div>
      )}

      {/* ── BEGIN: Glassmorphic Dock Container ── */}
      <div className="dock-blur rounded-[28px] border border-white/70 shadow-floating-dock px-2 py-1.5 flex items-center justify-between pointer-events-auto bg-white/92 backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 active:scale-90 ${
                isActive ? 'text-[#E40000]' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <div className={`relative p-1 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-red-50 text-[#E40000] scale-110' : 'hover:scale-105'
              }`}>
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight transition-all duration-200 ${
                isActive ? 'font-black text-[#E40000]' : 'font-semibold text-neutral-600'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#E40000] mt-0.5 animate-in zoom-in-50 duration-200" />
              )}
            </button>
          );
        })}
      </div>

      {/* iOS Home Indicator Bar */}
      <div className="w-32 h-1 bg-black/40 rounded-full mx-auto mt-2" />
    </nav>
  );
};

export default CustomerDockNav;
