import React from 'react';
import { Home, Tag, UtensilsCrossed, ShoppingBag, Sparkles, Heart } from 'lucide-react';

const CustomerDockNav = ({
  activeTab = 'home',
  onSelectTab,
  cartCount = 0,
  cartTotal = 0,
  onOpenCart,
  onOpenQuickActions,
  healthyMode = false,
  onToggleHealthyMode
}) => {
  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[430px] px-3 pb-3 pt-1 z-40 pointer-events-none">
      {/* ── Floating Cart Capsule Banner (Shown when cart has items) ── */}
      {cartCount > 0 && (
        <div className="mb-2 pointer-events-auto">
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
      <div className="dock-blur rounded-[28px] border border-white/70 shadow-floating-dock px-3 py-1.5 flex items-center justify-between pointer-events-auto bg-white/92 backdrop-blur-xl">
        {/* Tab 1: Home / Delivery */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'home' ? 'text-[#E23744]' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5] fill-red-50' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-0.5 ${activeTab === 'home' ? 'font-black text-[#E23744]' : 'font-semibold text-neutral-600'}`}>
            Home
          </span>
        </button>

        {/* Tab 2: Under ₹250 */}
        <button
          onClick={() => onSelectTab('under250')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'under250' ? 'text-[#E23744]' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Tag className={`w-5 h-5 ${activeTab === 'under250' ? 'stroke-[2.5] fill-red-50' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-0.5 ${activeTab === 'under250' ? 'font-black text-[#E23744]' : 'font-semibold text-neutral-600'}`}>
            Under ₹250
          </span>
        </button>

        {/* Tab 3: Dining */}
        <button
          onClick={() => onSelectTab('dining')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'dining' ? 'text-[#E23744]' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <UtensilsCrossed className={`w-5 h-5 ${activeTab === 'dining' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-0.5 ${activeTab === 'dining' ? 'font-black text-[#E23744]' : 'font-semibold text-neutral-600'}`}>
            Dining
          </span>
        </button>

        {/* Center Glowing Action Button (AI Concierge / Quick Order) */}
        <div className="px-1 flex items-center justify-center">
          <button
            onClick={onOpenQuickActions}
            aria-label="Quick Concierge"
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#EA384D] to-[#D31027] text-white flex items-center justify-center shadow-glow-action transform active:scale-90 transition-transform"
          >
            <Sparkles className="w-5 h-5 fill-current animate-pulse" />
          </button>
        </div>

        {/* Tab 4: Healthy Mode Pill */}
        <button
          onClick={onToggleHealthyMode}
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-full shadow-xs active:scale-95 transition-transform ml-1 ${
            healthyMode
              ? 'bg-[#24963F] text-white ring-2 ring-emerald-300'
              : 'bg-[#4A5D4E] text-[#E8F5E9]'
          }`}
        >
          <Heart className="w-3.5 h-3.5 fill-current text-green-300" />
          <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">
            {healthyMode ? 'Healthy On' : 'Healthy Mode'}
          </span>
        </button>
      </div>

      {/* iOS Home Indicator Bar */}
      <div className="w-32 h-1 bg-black/40 rounded-full mx-auto mt-2" />
    </nav>
  );
};

export default CustomerDockNav;
