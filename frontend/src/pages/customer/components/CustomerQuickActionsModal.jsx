import React from 'react';
import { X, Sparkles, ShoppingBag, Clock, Phone, Calendar, Heart, Crown } from 'lucide-react';


const CustomerQuickActionsModal = ({
  isOpen = false,
  onClose,
  cartCount = 0,
  onOpenCart,
  activeOrder = null,
  onTrackOrder,
  onGoToDining,
  onAddChefSpecial,
  selectedBranch = null
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[360px] bg-white rounded-3xl p-5 shadow-2xl space-y-4 border border-neutral-100">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#EA384D] to-[#D31027] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 fill-current animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-neutral-900">
                Quick Assistant
              </h3>
              <p className="text-[10px] text-neutral-500 font-medium">
                Persian Darbar Concierge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {/* 1. View Cart */}
          {cartCount > 0 && (
            <button
              onClick={() => { onClose(); onOpenCart(); }}
              className="w-full bg-red-50 hover:bg-red-100 border border-red-200 p-3 rounded-2xl flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <ShoppingBag className="w-4 h-4 text-[#E23744]" />
                <div>
                  <h4 className="text-xs font-black text-[#E23744]">
                    View Cart ({cartCount} items)
                  </h4>
                  <p className="text-[10px] text-red-600/80">
                    Ready to place your feast
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#E23744]">›</span>
            </button>
          )}

          {/* 2. Track Active Order (if any) */}
          {activeOrder && (
            <button
              onClick={() => { onClose(); onTrackOrder(activeOrder); }}
              className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 text-emerald-600 animate-spin" />
                <div>
                  <h4 className="text-xs font-black text-emerald-900">
                    Track Live Order
                  </h4>
                  <p className="text-[10px] text-emerald-700">
                    Status: {activeOrder.status || 'Cooking'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700">›</span>
            </button>
          )}

          {/* 3. Chef's Special One-Tap Add */}
          <button
            onClick={() => { onClose(); onAddChefSpecial(); }}
            className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 p-3 rounded-2xl flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Crown className="w-4 h-4 text-amber-600 fill-amber-400 shrink-0" />
              <div>

                <h4 className="text-xs font-black text-amber-900">
                  Chef's Special Recommendation
                </h4>
                <p className="text-[10px] text-amber-700">
                  Mutton Dum Biryani + Saffron Raita
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-800">ADD +</span>
          </button>

          {/* 4. Table Booking Shortcut */}
          <button
            onClick={() => { onClose(); onGoToDining(); }}
            className="w-full bg-purple-50 hover:bg-purple-100 border border-purple-200 p-3 rounded-2xl flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Calendar className="w-4 h-4 text-purple-700" />
              <div>
                <h4 className="text-xs font-black text-purple-900">
                  Book Table for Tonight
                </h4>
                <p className="text-[10px] text-purple-700">
                  Reserve a table instantly
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-800">›</span>
          </button>

          {/* 5. Call Concierge Direct */}
          <a
            href={`tel:${selectedBranch?.phones?.[0]?.replace(/\s/g, '') || '+919892957741'}`}
            className="w-full bg-neutral-100 hover:bg-neutral-200 p-3 rounded-2xl flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Phone className="w-4 h-4 text-neutral-700" />
              <div>
                <h4 className="text-xs font-bold text-neutral-800">
                  Call Restaurant Direct
                </h4>
                <p className="text-[10px] text-neutral-500">
                  {selectedBranch?.name || 'Bandra Flagship'} ({selectedBranch?.phones?.[0] || '+91 98929 57741'})
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-neutral-700">Call</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default CustomerQuickActionsModal;
