import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import API_BASE from '../../lib/config';
import {
  ShoppingBag, Calendar, Clock, MapPin, Phone,
  Edit2, Check, ArrowRight, LogOut, AlertCircle,
  Truck, Sparkles, UtensilsCrossed, RotateCw,
  Eye, User, ChevronRight, Crown, Home, Plus, X
} from 'lucide-react';

const CustomerDashboard = () => {
  const { currentUser, customerProfile, updateProfile, signOutCustomer, idToken, fetchWithAuth } = useCustomerAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('home'); // 'home' | 'orders' | 'bookings' | 'profile'
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingRes, setLoadingRes] = useState(true);

  // Phone editing
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (customerProfile?.phone) setPhoneInput(customerProfile.phone);
  }, [customerProfile]);

  const fetchOrders = useCallback(async () => {
    if (!idToken) return;
    setLoadingOrders(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/api/customer/orders`);
      if (res.ok) setOrders((await res.json()) || []);
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [idToken, fetchWithAuth]);

  const fetchReservations = useCallback(async () => {
    if (!idToken) return;
    setLoadingRes(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/api/customer/reservations`);
      if (res.ok) setReservations((await res.json()) || []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setLoadingRes(false);
    }
  }, [idToken, fetchWithAuth]);

  useEffect(() => {
    if (idToken) { fetchOrders(); fetchReservations(); }
  }, [idToken, fetchOrders, fetchReservations]);

  const handleSavePhone = async (e) => {
    e.preventDefault();
    setPhoneError('');
    const clean = phoneInput.replace(/[^0-9]/g, '');
    if (clean.length < 10) { setPhoneError('Enter a valid 10-digit number'); return; }
    setPhoneSaving(true);
    const res = await updateProfile({ phone: clean });
    setPhoneSaving(false);
    if (res.success) { setIsEditingPhone(false); setPhoneSuccess(true); setTimeout(() => setPhoneSuccess(false), 3000); fetchOrders(); }
    else setPhoneError(res.warning || 'Failed to save');
  };

  const activeOrders = orders.filter(o => ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status));
  const activeReservations = reservations.filter(r => ['pending', 'confirmed'].includes(r.status));

  const statusBadge = (status) => ({
    placed:            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">Placed</span>,
    accepted:          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">Accepted</span>,
    preparing:         <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 animate-pulse">Preparing 🔥</span>,
    ready:             <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Ready</span>,
    out_for_delivery:  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">On the way 🛵</span>,
    delivered:         <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">Delivered ✓</span>,
    cancelled:         <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">Cancelled</span>,
  }[status] || <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30">{status}</span>);

  const TABS = [
    { key: 'home',     icon: Home,        label: 'Home' },
    { key: 'orders',   icon: ShoppingBag, label: 'Orders',   badge: activeOrders.length },
    { key: 'bookings', icon: Calendar,    label: 'Bookings', badge: activeReservations.length },
    { key: 'profile',  icon: User,        label: 'Profile' },
  ];

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#070d14" }}>

      {/* ─── Fixed Header ─── */}
      <div className="shrink-0 pt-safe" style={{ background: "rgba(7,13,20,0.98)", borderBottom: "1px solid rgba(234,179,8,0.1)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full border-2 object-cover" style={{ borderColor: "rgba(234,179,8,0.5)" }} />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#EAB308]/15 border-2 border-[#EAB308]/30 flex items-center justify-center text-[#EAB308] font-bold">
                {currentUser?.displayName?.[0] || 'U'}
              </div>
            )}
            <div>
              <p className="text-white font-bold text-sm leading-tight">{currentUser?.displayName || 'Guest'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Crown className="w-3 h-3 text-[#EAB308]" />
                <span className="text-[#EAB308] text-[9px] font-black uppercase tracking-widest">Persian Darbar Member</span>
              </div>
            </div>
          </div>
          <button
            onClick={async () => { await signOutCustomer(); navigate('/'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-300 transition-all active:scale-95"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto">

        {/* ════════ HOME TAB ════════ */}
        {tab === 'home' && (
          <div className="p-4 space-y-4">

            {/* Active Order live banner */}
            {activeOrders.length > 0 && (
              <Link to={`/track?order_id=${activeOrders[0].order_id}`}>
                <div className="rounded-3xl p-4 flex items-center gap-4 relative overflow-hidden active:scale-[0.98] transition-all"
                  style={{ background: "linear-gradient(135deg,rgba(234,179,8,0.12),rgba(202,138,4,0.06))", border: "1.5px solid rgba(234,179,8,0.4)" }}>
                  <div className="absolute right-0 top-0 w-32 h-full opacity-10 pointer-events-none">
                    <Truck className="w-20 h-20 text-[#EAB308] absolute right-2 top-1/2 -translate-y-1/2 rotate-[-10deg]" />
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(234,179,8,0.15)", border: "1.5px solid rgba(234,179,8,0.3)" }}>
                    <Truck className="w-6 h-6 text-[#EAB308] animate-bounce" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#EAB308] font-black text-xs uppercase tracking-widest mb-0.5">Live Order</p>
                    <p className="text-white font-bold text-sm leading-tight truncate">
                      {activeOrders[0].items?.map(i => i.name).slice(0, 2).join(', ')}{activeOrders[0].items?.length > 2 ? ` +${activeOrders[0].items.length - 2}` : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {statusBadge(activeOrders[0].status)}
                      <span className="text-gray-500 text-[9px]">Tap to track</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#EAB308] shrink-0" />
                </div>
              </Link>
            )}

            {/* Active Reservation banner */}
            {activeReservations.length > 0 && (
              <div className="rounded-3xl p-4 flex items-center gap-4"
                style={{ background: "rgba(34,197,94,0.06)", border: "1.5px solid rgba(34,197,94,0.25)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(34,197,94,0.12)" }}>
                  <Calendar className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-0.5">Upcoming Reservation</p>
                  <p className="text-white font-semibold text-sm">{activeReservations[0].date} at {activeReservations[0].time}</p>
                  <p className="text-gray-500 text-xs">{activeReservations[0].guests} guests · {activeReservations[0].status === 'confirmed' ? '✅ Confirmed' : '⏳ Pending'}</p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { to: '/order', icon: UtensilsCrossed, label: 'Order Food', sub: 'Biryanis & Kebabs', color: "#EAB308", bg: "rgba(234,179,8,0.08)" },
                { to: '/reservation', icon: Calendar, label: 'Reserve Table', sub: 'Book a royal seat', color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
                { onClick: () => setTab('orders'), icon: Clock, label: 'My Orders', sub: `${orders.length} orders placed`, color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
                { onClick: () => setTab('bookings'), icon: ShoppingBag, label: 'My Bookings', sub: `${reservations.length} reservations`, color: "#34d399", bg: "rgba(52,211,153,0.08)" },
              ].map(({ to, onClick, icon: Icon, label, sub, color, bg }) => (
                <div key={label} onClick={onClick} className="cursor-pointer">
                  {to ? (
                    <Link to={to} className="block rounded-3xl p-4 active:scale-[0.97] transition-all" style={{ background: bg, border: `1px solid ${color}20` }}>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <p className="text-white font-bold text-sm">{label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
                    </Link>
                  ) : (
                    <div className="rounded-3xl p-4 active:scale-[0.97] transition-all" style={{ background: bg, border: `1px solid ${color}20` }}>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <p className="text-white font-bold text-sm">{label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════ ORDERS TAB ════════ */}
        {tab === 'orders' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-base">My Orders</h2>
              <button onClick={fetchOrders} className="p-2 rounded-xl active:scale-90 transition-transform" style={{ background: "rgba(255,255,255,0.05)" }}>
                <RotateCw className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {loadingOrders ? (
              <div className="flex items-center justify-center py-20 gap-2 text-gray-500 text-sm">
                <RotateCw className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-4">
                <ShoppingBag className="w-16 h-16 text-gray-800" />
                <p className="text-gray-500 text-sm">No orders yet</p>
                <Link to="/order" className="px-6 py-3 rounded-2xl bg-[#EAB308] text-black font-bold text-sm active:scale-95 transition-all">
                  Order Now
                </Link>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.order_id || order._id} className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs font-mono">#{order.order_id?.slice(-8)}</span>
                      {statusBadge(order.status)}
                    </div>
                    <span className="text-white font-bold text-sm">₹{order.total?.toFixed(0)}</span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">{order.items?.map(i => `${i.quantity}x ${i.name}`).slice(0, 2).join(', ')}{order.items?.length > 2 ? ` +${order.items.length - 2}` : ''}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <Link to={`/track?order_id=${order.order_id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#EAB308] active:scale-95 transition-all"
                      style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
                      <Eye className="w-3.5 h-3.5" /> Track
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ════════ BOOKINGS TAB ════════ */}
        {tab === 'bookings' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-base">My Reservations</h2>
              <Link to="/reservation"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#EAB308] active:scale-95 transition-all"
                style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
                <Plus className="w-3.5 h-3.5" /> New
              </Link>
            </div>

            {loadingRes ? (
              <div className="flex items-center justify-center py-20 gap-2 text-gray-500 text-sm">
                <RotateCw className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : reservations.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-4">
                <Calendar className="w-16 h-16 text-gray-800" />
                <p className="text-gray-500 text-sm">No reservations yet</p>
                <Link to="/reservation" className="px-6 py-3 rounded-2xl bg-[#EAB308] text-black font-bold text-sm active:scale-95 transition-all">
                  Book a Table
                </Link>
              </div>
            ) : (
              reservations.map((r, i) => (
                <div key={i} className="rounded-2xl p-4"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${r.status === 'confirmed' ? 'rgba(34,197,94,0.25)' : r.status === 'rejected' ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#EAB308]" />
                      <span className="text-white font-bold text-sm">{r.date} at {r.time}</span>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                      r.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      r.status === 'rejected'  ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                    }`}>{r.status === 'confirmed' ? '✅ Confirmed' : r.status === 'rejected' ? 'Rejected' : '⏳ Pending'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" /> {r.guests} guests</span>
                    {r.occasion && <span>{r.occasion}</span>}
                  </div>
                  {r.special_requests && <p className="text-gray-600 text-xs mt-2 italic">"{r.special_requests}"</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* ════════ PROFILE TAB ════════ */}
        {tab === 'profile' && (
          <div className="p-4 space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center pt-4 pb-2">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="w-20 h-20 rounded-full border-2 object-cover mb-3" style={{ borderColor: "rgba(234,179,8,0.5)" }} />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#EAB308]/15 border-2 border-[#EAB308]/30 flex items-center justify-center text-[#EAB308] text-3xl font-bold mb-3">
                  {currentUser?.displayName?.[0] || 'U'}
                </div>
              )}
              <p className="text-white font-bold text-lg">{currentUser?.displayName}</p>
              <p className="text-gray-500 text-xs">{currentUser?.email}</p>
            </div>

            {/* Phone number card */}
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#EAB308]" />
                  <span className="text-gray-400 text-sm font-semibold">Mobile Number</span>
                </div>
                {!isEditingPhone && (
                  <button onClick={() => setIsEditingPhone(true)}
                    className="text-xs text-[#EAB308] flex items-center gap-1 active:scale-95 transition-all">
                    <Edit2 className="w-3 h-3" /> {customerProfile?.phone ? 'Edit' : 'Add'}
                  </button>
                )}
              </div>

              {isEditingPhone ? (
                <form onSubmit={handleSavePhone} className="space-y-2">
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(234,179,8,0.3)" }}>
                    <span className="text-gray-400 text-sm font-mono">+91</span>
                    <input
                      type="tel" value={phoneInput} maxLength="10" autoFocus
                      onChange={e => setPhoneInput(e.target.value)}
                      placeholder="10-digit number"
                      className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-600"
                    />
                  </div>
                  {phoneError && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{phoneError}</p>}
                  {phoneSuccess && <p className="text-emerald-400 text-xs flex items-center gap-1"><Check className="w-3 h-3" />Saved!</p>}
                  <div className="flex gap-2">
                    <button type="submit" disabled={phoneSaving}
                      className="flex-1 py-2.5 rounded-xl bg-[#EAB308] text-black font-bold text-sm active:scale-95 transition-all disabled:opacity-50">
                      {phoneSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => { setIsEditingPhone(false); setPhoneInput(customerProfile?.phone || ''); setPhoneError(''); }}
                      className="px-4 py-2.5 rounded-xl text-gray-400 text-sm" style={{ background: "rgba(255,255,255,0.05)" }}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-white font-bold">{customerProfile?.phone ? `+91 ${customerProfile.phone}` : <span className="text-gray-600 font-normal text-sm">Not added yet</span>}</p>
              )}
            </div>

            {/* Sign out */}
            <button
              onClick={async () => { await signOutCustomer(); navigate('/'); }}
              className="w-full py-4 rounded-2xl font-bold text-red-400 text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}

      </div>

      {/* ─── Bottom Tab Bar ─── */}
      <div className="shrink-0 flex pb-safe" style={{ background: "rgba(7,13,20,0.98)", borderTop: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}>
        {TABS.map(({ key, icon: Icon, label, badge }) => {
          const active = tab === key;
          return (
            <button key={key} onClick={() => setTab(key)}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 relative transition-all active:scale-90">
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#EAB308]" />}
              <div className="relative">
                <Icon className="w-5 h-5" style={{ color: active ? "#EAB308" : "#6b7280" }} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#EAB308] text-black text-[8px] font-black flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: active ? "#EAB308" : "#6b7280" }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerDashboard;
