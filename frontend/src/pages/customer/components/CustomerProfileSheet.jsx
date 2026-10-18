import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Crown,
  Star,
  Clock,
  ShoppingBag,
  Calendar,
  Share2,
  LogOut,
  Check,
  ChevronRight,
  Award,
  Sparkles,
  MessageSquare,
  Gift,
  ShieldCheck,
  Edit2,
  Bike
} from 'lucide-react';
import { ROYAL_MEMBERSHIP_PRIVILEGES } from '../customerAssets';

const CustomerProfileSheet = ({
  isOpen = false,
  onClose,
  currentUser,
  customerProfile,
  orders = [],
  reservations = [],
  onReorder,
  onTrackOrder,
  onSavePhone,
  onSaveAddress,
  onShareApp,
  onSignOut,
  pdCoins = 450,
  initialTab = 'membership'
}) => {
  // 'membership' | 'orders' | 'reservations' | 'details'
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editPhone, setEditPhone] = useState(false);
  const [phoneVal, setPhoneVal] = useState(customerProfile?.phone || localStorage.getItem('customer_phone') || '');
  const [editAddr, setEditAddr] = useState(false);
  const [addrVal, setAddrVal] = useState(customerProfile?.address || localStorage.getItem('customer_address') || '');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (customerProfile?.phone) setPhoneVal(customerProfile.phone);
    if (customerProfile?.address) setAddrVal(customerProfile.address);
  }, [customerProfile]);

  if (!isOpen) return null;

  const patronName = currentUser?.displayName || customerProfile?.name || 'Valued Guest';
  const patronPhone = phoneVal || '';
  const patronEmail = customerProfile?.email || currentUser?.email || localStorage.getItem('customer_email');
  const patronInitial = (patronName?.[0] || 'A').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] max-h-[92vh] bg-[#F8F9FA] rounded-t-[36px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">

        {/* Grab Handle */}
        <div className="pt-3 pb-1 flex justify-center bg-white">
          <div className="w-12 h-1.5 bg-neutral-300 rounded-full" />
        </div>

        {/* ── Top Header Profile Bar ── */}
        <div className="px-5 py-3.5 bg-white border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-[#1C1917] text-amber-300 flex items-center justify-center font-black text-base shadow-sm border-2 border-amber-400/60">
              {patronInitial}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="text-base font-black text-neutral-900 leading-tight">
                  {patronName}
                </h2>
                <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
              </div>
              <p className="text-xs font-semibold text-neutral-500 mt-0.5">
                +91 {patronPhone} {patronEmail ? `· ${patronEmail}` : '· Verified Patron'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Segmented Navigation Tabs ── */}
        <div className="bg-white px-4 pt-1 pb-2 border-b border-neutral-100 flex space-x-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'membership', label: '👑 Royalty Club' },
            { id: 'orders', label: `Orders (${orders.length})` },
            { id: 'reservations', label: `Bookings (${reservations.length})` },
            { id: 'details', label: 'Saved Details' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-neutral-900 text-amber-300 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Scrollable Tab Body ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">

          {/* ═════════ TAB 1: ZOMATO GOLD STYLE ROYALTY MEMBERSHIP ═════════ */}
          {activeTab === 'membership' && (
            <div className="space-y-4">
              {/* Premium Metallic Card */}
              <div className="relative rounded-3xl p-5 shadow-xl overflow-hidden text-white border-2 border-amber-400/50 bg-gradient-to-br from-[#1C1917] via-[#2A241E] to-[#12100E]">
                {/* Background Shimmer Glow */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/50 flex items-center justify-center">
                        <Crown className="w-4 h-4 text-amber-300 fill-amber-400" />
                      </div>
                      <span className="text-xs font-black tracking-widest uppercase text-amber-300">
                        PERSIAN DARBAR ROYALTY
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-black">
                      VIP ELITE
                    </span>
                  </div>

                  {/* Coins Counter */}
                  <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-amber-400/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-200/80 block">
                        Your Royalty Balance
                      </span>
                      <h3 className="text-3xl font-black text-amber-300 leading-none mt-1">
                        {pdCoins.toLocaleString()} <span className="text-base text-amber-100">PD Coins</span>
                      </h3>
                      <p className="text-[11px] text-neutral-300 font-medium mt-1">
                        Worth <strong className="text-amber-300">₹{pdCoins}</strong> direct discount on your next order
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center text-xl font-black shadow-lg">
                      🪙
                    </div>
                  </div>

                  {/* Milestone Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-neutral-300 mb-1">
                      <span>Tier Progress</span>
                      <span className="text-amber-300">750 / 1000 Coins to Imperial VIP</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden p-[1px] border border-amber-400/20">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full w-[75%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* VIP Membership Privileges */}
              <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                  YOUR ROYAL PRIVILEGES
                </h3>

                <div className="space-y-3">
                  {ROYAL_MEMBERSHIP_PRIVILEGES.map((priv, idx) => (
                    <div key={idx} className="flex items-start space-x-3 p-2.5 rounded-2xl bg-neutral-50/70 border border-neutral-100">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 fill-amber-400 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-neutral-900 leading-tight">
                          {priv.title}
                        </h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {priv.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Concierge Button */}
              <a
                href="https://wa.me/919594287868?text=Hello%20Persian%20Darbar!%20I%20have%20an%20inquiry%20regarding%20my%20Royalty%20Coins%20and%20Membership."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#24963F] hover:bg-[#1E7E34] text-white p-3.5 rounded-2xl text-xs font-black flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Contact Royalty Concierge on WhatsApp</span>
              </a>
            </div>
          )}

          {/* ═════════ TAB 2: ORDERS HISTORY ═════════ */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-neutral-200/80 shadow-xs space-y-3">
                  <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" />
                  <h4 className="font-extrabold text-sm text-neutral-900">
                    No Orders Placed Yet
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Your royal biryani and kebab feasts will appear here.
                  </p>
                </div>
              ) : (
                orders.map((order) => {
                  const orderNum = String(order.order_id || order.id || order._id || '1001').slice(-6).toUpperCase();
                  const isDone = order.status === 'delivered';
                  return (
                    <div
                      key={order.id || order._id}
                      className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                            Order #{orderNum}
                          </span>
                          <h4 className="text-sm font-black text-neutral-900">
                            ₹{order.total || order.subtotal || 0} · {order.items?.length || 1} items
                          </h4>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            isDone
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          }`}
                        >
                          {order.status || 'Preparing'}
                        </span>
                      </div>

                      {/* Items preview */}
                      <div className="text-xs text-neutral-600 space-y-1">
                        {order.items?.slice(0, 3).map((it, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{it.quantity}x {it.name}</span>
                            <span className="font-bold">₹{it.price * it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Card Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                        <span className="text-[10px] text-neutral-400 font-medium">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Recent Order'}
                        </span>
                        <div className="flex items-center gap-2">
                          {!isDone && order.status !== 'cancelled' && onTrackOrder && (
                            <button
                              onClick={() => onTrackOrder(order)}
                              className="bg-[#E40000] hover:bg-[#c00000] text-white px-3 py-1.5 rounded-xl text-xs font-black transition-transform active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Bike className="w-3.5 h-3.5" />
                              <span>Track Live</span>
                            </button>
                          )}
                          <button
                            onClick={() => onReorder(order)}
                            className="bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Re-Order ›
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ═════════ TAB 3: RESERVATIONS ═════════ */}
          {activeTab === 'reservations' && (
            <div className="space-y-3">
              {reservations.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-neutral-200/80 shadow-xs space-y-3">
                  <Calendar className="w-12 h-12 text-neutral-300 mx-auto" />
                  <h4 className="font-extrabold text-sm text-neutral-900">
                    No Table Reservations Yet
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Book fine dining across our 4 Persian Darbar outlets.
                  </p>
                </div>
              ) : (
                reservations.map((res) => (
                  <div
                    key={res.id || res._id}
                    className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                      <div>
                        <span className="text-[10px] font-black text-neutral-400 uppercase">
                          Table for {res.guests} Guests
                        </span>
                        <h4 className="font-black text-sm text-neutral-900">
                          {res.date} at {res.time}
                        </h4>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          res.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        }`}
                      >
                        {res.status === 'confirmed'
                          ? res.table_number
                            ? `Table ${res.table_number}`
                            : 'Confirmed'
                          : 'Awaiting Host'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600">
                      Reserved under <strong className="text-neutral-900">{res.customer_name}</strong>
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═════════ TAB 4: SAVED DETAILS & ADDRESSES ═════════ */}
          {activeTab === 'details' && (
            <div className="space-y-3">
              {/* Phone card */}
              <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-black text-neutral-900">
                    <Phone className="w-4 h-4 text-[#E40000]" />
                    <span>Mobile Number</span>
                  </div>
                  <button
                    onClick={() => setEditPhone(!editPhone)}
                    className="text-xs font-bold text-[#E40000] hover:underline"
                  >
                    {editPhone ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                {editPhone ? (
                  <div className="flex space-x-2 pt-1">
                    <input
                      type="tel"
                      value={phoneVal}
                      onChange={(e) => setPhoneVal(e.target.value)}
                      className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                    />
                    <button
                      onClick={() => {
                        onSavePhone(phoneVal);
                        setEditPhone(false);
                      }}
                      className="bg-[#1C1C1C] text-white px-3 py-2 rounded-xl text-xs font-bold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-extrabold text-neutral-800">
                    +91 {phoneVal}
                  </p>
                )}
              </div>

              {/* Address card */}
              <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-black text-neutral-900">
                    <MapPin className="w-4 h-4 text-[#E40000]" />
                    <span>Default Delivery Address</span>
                  </div>
                  <button
                    onClick={() => setEditAddr(!editAddr)}
                    className="text-xs font-bold text-[#E40000] hover:underline"
                  >
                    {editAddr ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                {editAddr ? (
                  <div className="flex space-x-2 pt-1">
                    <input
                      type="text"
                      value={addrVal}
                      onChange={(e) => setAddrVal(e.target.value)}
                      className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                    />
                    <button
                      onClick={() => {
                        onSaveAddress(addrVal);
                        setEditAddr(false);
                      }}
                      className="bg-[#1C1C1C] text-white px-3 py-2 rounded-xl text-xs font-bold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-extrabold text-neutral-800">
                    {addrVal}
                  </p>
                )}
              </div>

              {/* Actions row: Share app & Sign out */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={onShareApp}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 p-3 rounded-2xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share App</span>
                </button>
                <button
                  onClick={onSignOut}
                  className="bg-red-50 hover:bg-red-100 text-[#E40000] border border-red-200 p-3 rounded-2xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CustomerProfileSheet;
