import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Crown, Star, Clock, ShoppingBag, Calendar, Share2, LogOut, Check, ChevronRight } from 'lucide-react';

const CustomerProfileSheet = ({
  isOpen = false,
  onClose,
  currentUser,
  customerProfile,
  orders = [],
  reservations = [],
  onReorder,
  onSavePhone,
  onSaveAddress,
  onShareApp,
  onSignOut,
  pdCoins = 0,
  initialTab = 'orders'
}) => {
  const [activeTab, setActiveTab] = useState(initialTab); // 'orders' | 'profile' | 'rewards'

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [editPhone, setEditPhone] = useState(false);
  const [phoneVal, setPhoneVal] = useState(customerProfile?.phone || '');
  const [editAddr, setEditAddr] = useState(false);
  const [addrVal, setAddrVal] = useState(customerProfile?.address || '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-[430px] max-h-[90vh] bg-white rounded-t-[28px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Grab Handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1" />

        {/* ── Sheet Header ── */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {currentUser?.displayName?.[0] || 'A'}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-neutral-900 leading-tight">
                {currentUser?.displayName || 'Valued Guest'}
              </h2>
              <div className="flex items-center space-x-1 mt-0.5">
                <Crown className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">
                  PD {pdCoins > 500 ? 'Royalty Elite' : 'Club Member'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Sub Navigation Tabs ── */}
        <div className="flex px-5 pt-3 border-b border-gray-100 bg-neutral-50/50">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'orders'
                ? 'border-[#E23744] text-[#E23744]'
                : 'border-transparent text-neutral-500'
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'rewards'
                ? 'border-[#E23744] text-[#E23744]'
                : 'border-transparent text-neutral-500'
            }`}
          >
            Royalty &amp; Coins
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-[#E23744] text-[#E23744]'
                : 'border-transparent text-neutral-500'
            }`}
          >
            Saved Details
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  <h4 className="font-bold text-sm text-neutral-800">
                    No Orders Yet
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    Your royal feasts will appear here once you order!
                  </p>
                </div>
              ) : (
                orders.map((o) => {
                  const statusColor = {
                    delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    placed: 'bg-amber-50 text-amber-800 border-amber-200',
                    preparing: 'bg-orange-50 text-orange-800 border-orange-200',
                    out_for_delivery: 'bg-blue-50 text-blue-800 border-blue-200',
                    cancelled: 'bg-red-50 text-red-800 border-red-200'
                  }[o.status?.toLowerCase()] || 'bg-neutral-100 text-neutral-800 border-neutral-200';

                  return (
                    <div
                      key={o.id || o.order_id || o._id}
                      className="bg-white rounded-2xl p-3.5 border border-neutral-100 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${statusColor}`}>
                            {o.status || 'Placed'}
                          </span>
                          <p className="text-[11px] font-bold text-neutral-500 mt-1">
                            {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : 'Recent Order'}
                          </p>
                        </div>
                        <span className="text-xs font-black text-neutral-900">
                          ₹{(o.total || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs text-neutral-700 line-clamp-1">
                        {(o.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-[10px] text-neutral-400 font-bold">
                          #{String(o.order_id || o.id || o._id).slice(-8)}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <a
                            href={o.invoice_url || `/invoice/${o.order_id || o.id || o._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <span>📄 Invoice</span>
                          </a>
                          <button
                            onClick={() => onReorder(o)}
                            className="bg-red-50 text-[#E23744] hover:bg-red-100 border border-red-200 text-xs font-bold px-3 py-1 rounded-lg active:scale-95 transition-transform"
                          >
                            ⚡ Re-order
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-4">
              {/* Royalty Gold VIP Card */}
              <div className="bg-gradient-to-br from-[#2A2416] via-[#1F1B12] to-[#12100A] p-4 rounded-2xl text-white border border-amber-500/40 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1.5">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
                      PERSIAN DARBAR GOLD
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                    VIP Member
                  </span>
                </div>

                <div className="my-2">
                  <p className="text-[11px] text-amber-200/80 font-semibold">
                    Available Balance
                  </p>
                  <h3 className="text-3xl font-black text-amber-300 tracking-tight">
                    {pdCoins} <span className="text-sm font-bold text-amber-400">Coins</span>
                  </h3>
                </div>

                <div className="pt-2 border-t border-amber-500/20 text-[11px] text-amber-100/90 flex items-center justify-between">
                  <span>1 Coin = ₹1 Discount on Next Feast</span>
                  <span>10% Cashback</span>
                </div>
              </div>

              {/* Exclusive Perks List */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/70 space-y-2.5">
                <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                  Gold Privileges
                </h4>
                <div className="space-y-2 text-xs text-neutral-700">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Free Delivery above ₹99</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Complimentary Dessert on Table Reservation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Priority Kitchen Dispatch</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Phone Edit */}
              <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                  <div className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#E23744]" />
                    <span>Mobile Number</span>
                  </div>
                  <button
                    onClick={() => {
                      if (editPhone && phoneVal) onSavePhone(phoneVal);
                      setEditPhone(!editPhone);
                    }}
                    className="text-[#E23744] text-[11px] font-bold hover:underline"
                  >
                    {editPhone ? 'Save' : 'Edit'}
                  </button>
                </div>
                {editPhone ? (
                  <input
                    type="tel"
                    value={phoneVal}
                    onChange={(e) => setPhoneVal(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-800 focus:outline-none"
                  />
                ) : (
                  <p className="text-xs font-bold text-neutral-700">
                    {customerProfile?.phone || phoneVal || 'No phone set'}
                  </p>
                )}
              </div>

              {/* Address Edit */}
              <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#E23744]" />
                    <span>Default Delivery Address</span>
                  </div>
                  <button
                    onClick={() => {
                      if (editAddr && addrVal) onSaveAddress(addrVal);
                      setEditAddr(!editAddr);
                    }}
                    className="text-[#E23744] text-[11px] font-bold hover:underline"
                  >
                    {editAddr ? 'Save' : 'Edit'}
                  </button>
                </div>
                {editAddr ? (
                  <textarea
                    rows={2}
                    value={addrVal}
                    onChange={(e) => setAddrVal(e.target.value)}
                    placeholder="Enter full home address..."
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-medium text-neutral-800 focus:outline-none"
                  />
                ) : (
                  <p className="text-xs font-medium text-neutral-600 line-clamp-2">
                    {customerProfile?.address || addrVal || 'No default address saved'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Fixed Footer Actions ── */}
        <div className="p-4 border-t border-gray-100 bg-white flex items-center space-x-2">
          <button
            onClick={onShareApp}
            className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share App</span>
          </button>
          <button
            onClick={onSignOut}
            className="flex-1 bg-red-50 hover:bg-red-100 text-[#E23744] border border-red-200 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfileSheet;
