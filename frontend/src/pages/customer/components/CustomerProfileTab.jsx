import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  X,
  CreditCard,
  MessageCircle,
  HelpCircle,
  Heart,
  Settings,
  Bell,
  UtensilsCrossed,
  Printer,
  Copy,
  Plus
} from 'lucide-react';
import { ROYAL_MEMBERSHIP_PRIVILEGES, PERSIAN_DARBAR_BRANCHES } from '../customerAssets';

const CustomerProfileTab = ({
  currentUser,
  customerProfile,
  orders = [],
  reservations = [],
  onReorder,
  onSavePhone,
  onSaveAddress,
  onSignOut,
  onGoToOrder,
  onGoToReserve,
  pdCoins = 450,
  initialSection = 'overview'
}) => {
  const navigate = useNavigate();
  const [section, setSection] = useState(initialSection); // 'overview' | 'orders' | 'reservations' | 'addresses' | 'rewards'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [nameVal, setNameVal] = useState(currentUser?.displayName || customerProfile?.name || localStorage.getItem('customer_name') || '');
  const [phoneVal, setPhoneVal] = useState(customerProfile?.phone || currentUser?.phoneNumber || localStorage.getItem('customer_phone') || '');
  const [addressVal, setAddressVal] = useState(customerProfile?.address || localStorage.getItem('customer_address') || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentUser?.displayName || customerProfile?.name) {
      setNameVal(currentUser?.displayName || customerProfile?.name || '');
    }
    if (customerProfile?.phone || currentUser?.phoneNumber) {
      setPhoneVal(customerProfile?.phone || currentUser?.phoneNumber || '');
    }
    if (customerProfile?.address) {
      setAddressVal(customerProfile.address);
    }
  }, [currentUser, customerProfile]);

  // Address book management
  const [savedAddresses, setSavedAddresses] = useState(() => {
    if (customerProfile?.addresses && customerProfile.addresses.length > 0) {
      return customerProfile.addresses;
    }
    const curr = customerProfile?.address || localStorage.getItem('customer_address');
    if (curr) {
      return [{ id: 'addr_1', tag: 'Home', address: curr, isDefault: true }];
    }
    return [];
  });
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddressTag, setNewAddressTag] = useState('Home');
  const [newAddressText, setNewAddressText] = useState('');

  const patronName = nameVal || (currentUser ? 'Valued Patron' : 'Guest');
  const patronPhone = phoneVal;
  const patronEmail = customerProfile?.email || currentUser?.email || localStorage.getItem('customer_email') || '';
  const patronInitial = (patronName?.[0] || 'P').toUpperCase();

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (onSavePhone) await onSavePhone(phoneVal);
    if (onSaveAddress) await onSaveAddress(addressVal);
    localStorage.setItem('customer_phone', phoneVal);
    localStorage.setItem('customer_address', addressVal);
    localStorage.setItem('customer_name', nameVal);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsEditModalOpen(false);
    }, 1200);
  };

  const handleAddNewAddress = (e) => {
    e.preventDefault();
    if (!newAddressText.trim()) return;
    const newAddr = {
      id: `addr_${Date.now()}`,
      tag: newAddressTag,
      address: newAddressText.trim(),
      isDefault: savedAddresses.length === 0
    };
    setSavedAddresses(prev => [...prev, newAddr]);
    if (onSaveAddress) onSaveAddress(newAddressText.trim());
    setNewAddressText('');
    setIsAddAddressOpen(false);
  };

  return (
    <div className="flex-1 pb-32 pt-2 px-4 space-y-4">
      {/* ── 1. ZOMATO STYLE PATRON HEADER CARD OR GUEST STATE ── */}
      {!currentUser ? (
        <section className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs relative overflow-hidden text-center space-y-4">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-amber-400/10 via-amber-200/5 to-transparent rounded-bl-full pointer-events-none" />
          
          <img
            src="/app-icon.png"
            alt="Persian Darbar"
            className="w-16 h-16 rounded-2xl shadow-md border border-amber-400/70 object-contain mx-auto"
          />

          <div>
            <h2 className="text-lg font-black text-neutral-900 leading-tight">
              Welcome to Persian Darbar
            </h2>
            <p className="text-xs text-neutral-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Log in to track live biryani orders, redeem your Royalty PD Coins, and view saved delivery addresses.
            </p>
          </div>

          <div className="pt-1 space-y-2">
            <button
              onClick={() => navigate('/customer/login')}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#E40000] hover:bg-[#CC0000] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>Log in or Sign up</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs relative overflow-hidden">
          {/* Subtle royal background glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-amber-400/10 via-amber-200/5 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-3.5">
              <div className="relative">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={patronName}
                    className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-amber-400/70"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#1C1917] text-amber-300 flex items-center justify-center font-black text-2xl shadow-md border-2 border-amber-400/70">
                    {patronInitial}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-xs">
                  <Crown className="w-3 h-3 text-neutral-950 fill-neutral-950" />
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-1.5">
                  <h2 className="text-base font-black text-neutral-900 leading-tight">
                    {patronName}
                  </h2>
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black" title="Verified Patron">
                    ✓
                  </div>
                </div>
                {patronPhone && (
                  <p className="text-xs font-semibold text-neutral-500 mt-0.5">
                    +91 {patronPhone}
                  </p>
                )}
                {patronEmail && (
                  <p className="text-[11px] text-neutral-400 truncate max-w-[200px]">
                    {patronEmail}
                  </p>
                )}
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-800 border border-amber-400/40">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>GOLD VIP PATRON</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 active:scale-95 transition-all shrink-0 cursor-pointer"
                title="Edit Profile Details"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#E40000] border border-red-200 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center justify-center"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── 2. ZOMATO 4-CARD QUICK STATS ── */}
          <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-neutral-100 text-center">
            <div
              onClick={() => setSection('orders')}
              className={`p-2 rounded-2xl cursor-pointer transition-all ${
                section === 'orders' ? 'bg-red-50 border border-red-200 text-[#E40000]' : 'bg-[#FAF8F5] text-neutral-800 hover:bg-neutral-100'
              }`}
            >
              <span className="block text-base font-black">{orders.length}</span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-tight block">Orders</span>
            </div>

            <div
              onClick={() => setSection('reservations')}
              className={`p-2 rounded-2xl cursor-pointer transition-all ${
                section === 'reservations' ? 'bg-red-50 border border-red-200 text-[#E40000]' : 'bg-[#FAF8F5] text-neutral-800 hover:bg-neutral-100'
              }`}
            >
              <span className="block text-base font-black">{reservations.length}</span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-tight block">Tables</span>
            </div>

            <div
              onClick={() => setSection('rewards')}
              className={`p-2 rounded-2xl cursor-pointer transition-all ${
                section === 'rewards' ? 'bg-amber-50 border border-amber-300 text-amber-800' : 'bg-[#FAF8F5] text-neutral-800 hover:bg-neutral-100'
              }`}
            >
              <span className="block text-base font-black text-amber-700">{pdCoins}</span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-tight block">Coins</span>
            </div>

            <div
              onClick={() => setSection('addresses')}
              className={`p-2 rounded-2xl cursor-pointer transition-all ${
                section === 'addresses' ? 'bg-red-50 border border-red-200 text-[#E40000]' : 'bg-[#FAF8F5] text-neutral-800 hover:bg-neutral-100'
              }`}
            >
              <span className="block text-base font-black">{savedAddresses.length}</span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-tight block">Saved</span>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. SECTION SELECTOR PILLS (Zomato Style) ── */}
      <div className="flex space-x-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'overview', label: 'All Services', icon: Sparkles },
          { id: 'orders', label: `My Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'reservations', label: `My Tables (${reservations.length})`, icon: Calendar },
          { id: 'addresses', label: 'Address Book', icon: MapPin },
          { id: 'rewards', label: 'Royalty Club', icon: Award }
        ].map((tab) => {
          const isActive = section === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSection(tab.id)}
              className={`py-2 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200/70 hover:bg-neutral-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1: OVERVIEW (Hub of All Zomato-style Features)
         ══════════════════════════════════════════════════════════════════ */}
      {section === 'overview' && (
        <div className="space-y-4">
          {/* Zomato Gold / Royal Pass Banner */}
          <div className="rounded-3xl p-5 text-white bg-gradient-to-br from-[#1C1917] via-[#2A241E] to-[#12100E] border-2 border-amber-400/50 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img src="/persian_darbar_crown_logo.png" alt="" className="w-5 h-5 rounded-md object-contain" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  PERSIAN DARBAR ROYAL PASS
                </span>
              </div>
              <span className="text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                ACTIVE PATRON
              </span>
            </div>

            <p className="text-sm font-black text-white mt-3">
              10% Instant PD Coins on every order + Free Delivery above ₹199
            </p>
            <p className="text-[11px] text-stone-300 mt-1">
              Priority table reservation across Bandra, Andheri, Kurla & Camp Pune outlets.
            </p>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-stone-300">Available Balance: <strong className="text-amber-300">{pdCoins} Coins</strong></span>
              <button
                onClick={() => setSection('rewards')}
                className="text-amber-400 hover:text-amber-300 font-black flex items-center gap-0.5"
              >
                <span>Passbook</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Shortcuts Section */}
          <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 px-2 py-1">
              FOOD ORDERS & BOOKINGS
            </h3>

            <div
              onClick={() => setSection('orders')}
              className="p-3 rounded-2xl hover:bg-neutral-50 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <ShoppingBag className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Your Online Orders</h4>
                  <p className="text-[10px] text-neutral-500">{orders.length} orders placed</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </div>

            <div
              onClick={() => setSection('reservations')}
              className="p-3 rounded-2xl hover:bg-neutral-50 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Table Reservations</h4>
                  <p className="text-[10px] text-neutral-500">{reservations.length} table bookings</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </div>

            <div
              onClick={() => setSection('addresses')}
              className="p-3 rounded-2xl hover:bg-neutral-50 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Saved Delivery Addresses</h4>
                  <p className="text-[10px] text-neutral-500">{savedAddresses.length} saved locations</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </div>
          </div>

          {/* Persian Darbar Official Outlets Direct Contact */}
          <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 px-2">
              PERSIAN DARBAR OUTLETS & DIRECT PHONES
            </h3>

            <div className="space-y-2 text-xs">
              {PERSIAN_DARBAR_BRANCHES.map((b) => (
                <div key={b.id} className="p-3 rounded-2xl bg-[#FAF8F5] border border-neutral-100 flex items-center justify-between">
                  <div>
                    <h5 className="font-black text-neutral-900">{b.name}</h5>
                    <p className="text-[10px] text-neutral-500">{b.shortAddress}</p>
                    <span className="text-[10px] font-mono text-amber-800 font-bold">{b.phones[0]}</span>
                  </div>
                  <a
                    href={`tel:${b.phones[0].replace(/\s/g, '')}`}
                    className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] flex items-center gap-1 shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* 24x7 WhatsApp Royal Concierge */}
          <a
            href="https://wa.me/917028033763?text=Hello%20Persian%20Darbar%20Concierge,%20I%20need%20assistance%20with%20my%20order."
            target="_blank"
            rel="noreferrer"
            className="w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-black text-xs flex items-center justify-center space-x-2 shadow-sm active:scale-98 transition-all"
          >
            <MessageCircle className="w-4 h-4 text-white" />
            <span>24x7 Royal WhatsApp Concierge</span>
          </a>

          {/* Logout Action */}
          {currentUser && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="w-full py-3.5 rounded-2xl bg-red-50 hover:bg-red-100 text-[#E40000] font-black text-xs flex items-center justify-center space-x-2 border border-red-200 active:scale-98 transition-all cursor-pointer shadow-xs"
              >
                <LogOut className="w-4 h-4 text-[#E40000]" />
                <span>Log Out from Persian Darbar</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2: MY ORDERS (Zomato-style Order History & Reorder)
         ══════════════════════════════════════════════════════════════════ */}
      {section === 'orders' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
              YOUR ORDER HISTORY ({orders.length})
            </h3>
            <button
              onClick={onGoToOrder}
              className="text-xs font-black text-[#E40000] hover:underline flex items-center gap-0.5"
            >
              <span>+ Order Now</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h4 className="font-black text-sm text-neutral-900">No Orders Placed Yet</h4>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Treat yourself to authentic Persian Darbar Dum Biryanis & succulent Raan.
              </p>
              <button
                onClick={onGoToOrder}
                className="px-5 py-2.5 rounded-2xl bg-[#E40000] hover:bg-[#CC0000] text-white text-xs font-black shadow-md active:scale-95 transition-all"
              >
                Explore Menu ›
              </button>
            </div>
          ) : (
            orders.map((ord) => {
              const orderId = ord.order_id || ord.id || ord._id;
              const dateStr = ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
              const itemsList = ord.items || [];
              const statusColors = {
                placed: 'bg-blue-50 text-blue-700 border-blue-200',
                accepted: 'bg-amber-50 text-amber-700 border-amber-200',
                preparing: 'bg-yellow-50 text-yellow-800 border-yellow-200',
                ready: 'bg-purple-50 text-purple-700 border-purple-200',
                out_for_delivery: 'bg-orange-50 text-orange-700 border-orange-200',
                delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200'
              };

              return (
                <div key={orderId} className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-neutral-900">
                          #{String(orderId).slice(-8).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-400">· {dateStr}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-neutral-500 block mt-0.5">
                        {ord.order_type || 'DELIVERY'} · {ord.payment_method?.toUpperCase() || 'COD'}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusColors[ord.status] || 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>
                      {ord.status || 'placed'}
                    </span>
                  </div>

                  {/* Items Summary */}
                  <div className="py-2 border-y border-neutral-100 space-y-1">
                    {itemsList.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-neutral-700 font-medium">
                          {item.name} <strong className="text-neutral-900">×{item.quantity}</strong>
                        </span>
                        <span className="text-neutral-900 font-bold">
                          ₹{((item.price || 0) * (item.quantity || 1)).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Cooking & Delivery Notes if present */}
                  {(ord.cooking_instructions || ord.delivery_instructions) && (
                    <div className="p-2 rounded-xl bg-[#FAF8F5] border border-amber-900/5 text-[10px] space-y-0.5">
                      {ord.cooking_instructions && (
                        <p className="text-amber-900 font-medium">Chef note: {ord.cooking_instructions}</p>
                      )}
                      {ord.delivery_instructions && (
                        <p className="text-neutral-600 font-medium">Delivery note: {ord.delivery_instructions}</p>
                      )}
                    </div>
                  )}

                  {/* Footer & Reorder Button */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-bold block">Bill Total</span>
                      <span className="text-sm font-black text-neutral-900">₹{(ord.total || 0).toFixed(0)}</span>
                    </div>

                    <button
                      onClick={() => onReorder && onReorder(ord)}
                      className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-[#E40000] hover:text-white text-[#E40000] border border-red-200 text-xs font-black transition-colors active:scale-95"
                    >
                      Reorder ↻
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3: MY RESERVATIONS
         ══════════════════════════════════════════════════════════════════ */}
      {section === 'reservations' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
              YOUR TABLE RESERVATIONS ({reservations.length})
            </h3>
            <button
              onClick={onGoToReserve}
              className="text-xs font-black text-[#E40000] hover:underline flex items-center gap-0.5"
            >
              <span>+ Book Table</span>
            </button>
          </div>

          {reservations.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Calendar className="w-7 h-7" />
              </div>
              <h4 className="font-black text-sm text-neutral-900">No Reservations Yet</h4>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Reserve your royal table in advance with preferred dining mood across any of our 4 Persian Darbar outlets.
              </p>
              <button
                onClick={onGoToReserve}
                className="px-5 py-2.5 rounded-2xl bg-[#E40000] hover:bg-[#CC0000] text-white text-xs font-black shadow-md active:scale-95 transition-all"
              >
                Book a Table ›
              </button>
            </div>
          ) : (
            reservations.map((res, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-neutral-400">
                      Table for {res.guests} Guests
                    </span>
                    <h4 className="font-black text-sm text-neutral-900">
                      {res.date} at {res.time}
                    </h4>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {res.status || 'Confirmed'}
                  </span>
                </div>

                {/* Dining Mood Badge */}
                {(res.dining_mood || (res.special_requests && res.special_requests.includes('Mood:'))) && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                      Mood: {res.dining_mood || (res.special_requests.match(/Mood:\s*([^|\]]+)/)?.[1]?.trim()) || 'Royal Dastarkhwan'}
                    </span>
                  </div>
                )}

                {res.special_requests && (
                  <p className="text-[11px] text-neutral-500 bg-[#FAF8F5] p-2.5 rounded-2xl border border-neutral-100">
                    {res.special_requests}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4: ADDRESS BOOK (Zomato-style Saved Addresses)
         ══════════════════════════════════════════════════════════════════ */}
      {section === 'addresses' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
              SAVED DELIVERY ADDRESSES
            </h3>
            <button
              onClick={() => setIsAddAddressOpen(true)}
              className="text-xs font-black text-[#E40000] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {savedAddresses.map((addr) => (
              <div key={addr.id} className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs flex items-start justify-between space-x-3">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-black text-xs text-neutral-900">{addr.tag}</h4>
                      {addr.isDefault && (
                        <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      {addr.address}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onSaveAddress) onSaveAddress(addr.address);
                    localStorage.setItem('customer_address', addr.address);
                    alert(`Selected ${addr.tag} as your active delivery address.`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-700 text-xs font-bold transition-colors shrink-0"
                >
                  Deliver Here
                </button>
              </div>
            ))}
          </div>

          {/* Add New Address Form Modal */}
          {isAddAddressOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-neutral-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-neutral-900">Add New Address</h3>
                  <button onClick={() => setIsAddAddressOpen(false)} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>

                <form onSubmit={handleAddNewAddress} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">Tag Location</label>
                    <div className="flex gap-2">
                      {['Home', 'Work', 'Other'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setNewAddressTag(tag)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            newAddressTag === tag ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">Complete Address</label>
                    <textarea
                      rows={3}
                      value={newAddressText}
                      onChange={(e) => setNewAddressText(e.target.value)}
                      placeholder="Flat/House No, Building, Street, Area, Pin code..."
                      className="w-full text-xs p-3 rounded-2xl border border-neutral-200 focus:outline-none focus:border-amber-500 resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-neutral-900 text-white text-xs font-black shadow-md active:scale-98"
                  >
                    Save Address
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5: ROYALTY REWARDS HUB
         ══════════════════════════════════════════════════════════════════ */}
      {section === 'rewards' && (
        <div className="space-y-3">
          <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  ROYALTY BALANCE
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-3xl font-black text-amber-800">{pdCoins}</span>
                  <span className="text-xs font-bold text-neutral-500">PD Coins</span>
                </div>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Worth <strong>₹{pdCoins}</strong> instant deduction at checkout.
                </p>
              </div>

              <button
                onClick={onGoToOrder}
                className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-neutral-950 text-xs font-black shadow-xs active:scale-95"
              >
                Use in Cart ›
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 px-1">
              VIP MEMBERSHIP PRIVILEGES
            </h3>
            <div className="space-y-2.5">
              {ROYAL_MEMBERSHIP_PRIVILEGES.map((priv, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-[#FAF8F5] border border-neutral-100 flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-neutral-900">{priv.title}</h5>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{priv.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 6. PROMINENT SIGN OUT BUTTON (Always accessible to logged in patron) ── */}
      {currentUser && (
        <section className="pt-2">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-white border border-red-200/90 hover:bg-red-50 text-[#E40000] font-black text-xs uppercase tracking-wider shadow-xs active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-[#E40000]" />
            <span>Sign Out of Persian Darbar</span>
          </button>
          <p className="text-[10px] text-neutral-400 text-center mt-2">
            Logged in as {patronName} {patronPhone ? `(+91 ${patronPhone})` : ''}
          </p>
        </section>
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-neutral-900">Edit Patron Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            {savedSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-black text-sm text-neutral-900">Profile Updated Successfully</h4>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-neutral-200 focus:outline-none focus:border-amber-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneVal}
                    onChange={(e) => setPhoneVal(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-neutral-200 focus:outline-none focus:border-amber-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">Default Address</label>
                  <textarea
                    rows={2}
                    value={addressVal}
                    onChange={(e) => setAddressVal(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-neutral-200 focus:outline-none focus:border-amber-500 resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 text-xs font-black shadow-md active:scale-98"
                >
                  Save Profile Changes
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── CUSTOM IN-APP LOGOUT CONFIRMATION MODAL ── */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-neutral-200 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#E40000] flex items-center justify-center mx-auto border border-red-100">
              <LogOut className="w-7 h-7 text-[#E40000]" />
            </div>
            <div>
              <h3 className="font-black text-base text-neutral-900">Sign Out of Persian Darbar?</h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                You will need to sign in again to view your past orders, track live food delivery, and redeem your royalty coins.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs active:scale-98 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowLogoutModal(false);
                  if (onSignOut) await onSignOut();
                }}
                className="py-3 rounded-2xl bg-[#E40000] hover:bg-[#CC0000] text-white font-black text-xs shadow-md active:scale-98 transition-all cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfileTab;
