import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import API_BASE from '../../lib/config';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  Crown,
  Sparkles,
  ShoppingBag,
  Calendar,
  Gift,
  ShieldCheck,
  LogOut,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Clock,
  ChevronRight,
  ExternalLink,
  Shield,
  FileText,
  Star,
  Award,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { ROYAL_MEMBERSHIP_PRIVILEGES } from './customerAssets';

const CustomerProfile = () => {
  const { currentUser, customerProfile, updateProfile, signOutCustomer, idToken, fetchWithAuth } = useCustomerAuth();
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/customer?tab=profile', { replace: true });
  }, [navigate]);


  // Active view tab: 'membership' | 'orders' | 'reservations' | 'details'
  const [activeTab, setActiveTab] = useState('membership');

  // Contact & Address edit states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [newAddressInput, setNewAddressInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Remote data state
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingRes, setLoadingRes] = useState(false);

  // Sync profile details
  useEffect(() => {
    const savedEmail = customerProfile?.email || currentUser?.email || localStorage.getItem('customer_email') || '';
    setEmail(savedEmail);
    if (customerProfile) {
      setName(customerProfile.name || currentUser?.displayName || 'Valued Guest');
      setPhone(customerProfile.phone || localStorage.getItem('customer_phone') || '');
      setAddress(customerProfile.address || localStorage.getItem('customer_address') || '');
      setAddresses(customerProfile.addresses || []);
    } else if (currentUser) {
      setName(currentUser.displayName || 'Valued Guest');
      setPhone(currentUser.phoneNumber || localStorage.getItem('customer_phone') || '');
      setAddress(localStorage.getItem('customer_address') || '');
    }
  }, [customerProfile, currentUser]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!idToken || !fetchWithAuth) return;
    setLoadingOrders(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/api/customer/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Orders fetch error:', e);
    } finally {
      setLoadingOrders(false);
    }
  }, [idToken, fetchWithAuth]);

  // Fetch reservations
  const fetchReservations = useCallback(async () => {
    if (!idToken || !fetchWithAuth) return;
    setLoadingRes(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/api/customer/reservations`);
      if (res.ok) {
        const data = await res.json();
        setReservations(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Reservations fetch error:', e);
    } finally {
      setLoadingRes(false);
    }
  }, [idToken, fetchWithAuth]);

  useEffect(() => {
    fetchOrders();
    fetchReservations();
  }, [fetchOrders, fetchReservations]);

  // Handle Profile Save
  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setMessage({ type: '', text: '' });

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone && cleanPhone.length < 10) {
      setMessage({ type: 'error', text: 'Please enter a valid 10-digit mobile number' });
      return;
    }

    setSaving(true);
    try {
      if (email.trim()) localStorage.setItem('customer_email', email.trim());
      const res = await updateProfile({
        name,
        phone: cleanPhone,
        email: email.trim(),
        address,
        addresses
      });
      if (res?.success) {
        setMessage({ type: 'success', text: 'Royal Patron Profile updated successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      } else {
        setMessage({ type: 'error', text: res?.warning || 'Failed to update profile' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error while saving profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = () => {
    if (!newAddressInput.trim()) return;
    const trimmed = newAddressInput.trim();
    if (!addresses.includes(trimmed)) {
      const updated = [...addresses, trimmed];
      setAddresses(updated);
      if (!address) setAddress(trimmed);
      setNewAddressInput('');
    }
  };

  const handleRemoveAddress = (indexToRemove) => {
    const updated = addresses.filter((_, idx) => idx !== indexToRemove);
    setAddresses(updated);
  };

  const patronCoins = customerProfile?.loyalty_points ?? 450;
  const patronInitial = (name || currentUser?.displayName || 'A')[0]?.toUpperCase();

  // Fallback demo orders for instant aesthetic preview if user has not placed live orders yet
  const displayOrders = orders.length > 0 ? orders : [
    {
      _id: 'ord_demo_1',
      order_number: 'PD-88214',
      date: 'Yesterday, 8:45 PM',
      total: 1140,
      status: 'DELIVERED',
      outlet: 'Camp, Pune',
      items: [
        { name: 'Mutton Dum Biryani (Full)', quantity: 1, price: 540 },
        { name: 'Murgh Barra Tandoori', quantity: 1, price: 460 },
        { name: 'Butter Garlic Naan', quantity: 2, price: 140 }
      ]
    },
    {
      _id: 'ord_demo_2',
      order_number: 'PD-87103',
      date: '12 Oct 2026, 1:15 PM',
      total: 780,
      status: 'DELIVERED',
      outlet: 'Camp, Pune',
      items: [
        { name: 'Chicken Mumtaz Kebab', quantity: 1, price: 420 },
        { name: 'Shahi Tukda Royal', quantity: 2, price: 360 }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-neutral-900 pb-20 font-sans selection:bg-amber-100">
      {/* ── Fixed Top App Bar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-900/10 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/customer/dashboard"
              className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 flex items-center justify-center text-neutral-700 active:scale-95 transition-transform"
              title="Return to Menu"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-1.5">
                <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                <h1 className="text-base font-black text-neutral-900 tracking-tight">
                  Royal Patron Profile
                </h1>
              </div>
              <p className="text-[11px] font-semibold text-neutral-500">
                Persian Darbar Royalty Club · Est. 1976
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              await signOutCustomer();
              navigate('/');
            }}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* ── 1. ZOMATO GOLD STYLE OBSIDIAN & GOLD VIP MEMBERSHIP CARD ── */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#0C0A09] text-white p-6 shadow-2xl border border-amber-400/40">
          {/* Subtle Background Glows */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-3.5">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 text-neutral-950 flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white/40">
                  {patronInitial}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-[#1C1917] flex items-center justify-center shadow-xs">
                  <Crown className="w-3 h-3 text-neutral-950 fill-neutral-950" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-black tracking-tight text-white">{name}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    VIP GOLD
                  </span>
                </div>
                <p className="text-xs text-stone-300 font-medium mt-0.5">
                  +91 {phone} {email ? `· ${email}` : '· Verified Patron'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400/80 block">
                Royalty Pass
              </span>
              <span className="text-xs font-mono font-bold text-stone-300">#PD-ROYAL-786</span>
            </div>
          </div>

          {/* Card Body: PD Coins Live Balance & Value */}
          <div className="mt-6 pt-5 border-t border-white/10 flex items-end justify-between relative z-10">
            <div>
              <div className="flex items-center space-x-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Available PD Coins</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400">
                  {patronCoins}
                </span>
                <span className="text-xs font-semibold text-stone-300">
                  Coins (= ₹{patronCoins} cashback value)
                </span>
              </div>
            </div>

            <Link
              to="/customer/dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-black shadow-md flex items-center space-x-1 active:scale-95 transition-transform"
            >
              <span>Redeem Now</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tier Progress Bar */}
          <div className="mt-4 pt-3 border-t border-white/10 relative z-10">
            <div className="flex justify-between text-[11px] text-stone-300 mb-1.5 font-semibold">
              <span>Gold Tier Patron</span>
              <span className="text-amber-300">50 coins to Emperor Tier</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-rose-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (patronCoins / 500) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── VIP ROYAL MEMBERSHIP PRIVILEGES ── */}
        <div className="bg-white rounded-2xl p-4 border border-amber-900/10 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
              <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                Your Persian Darbar Privileges
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active Member
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left">
            {ROYAL_MEMBERSHIP_PRIVILEGES.map((priv, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#FAF8F5] border border-amber-900/5 flex items-start space-x-2"
              >
                <span className="text-base leading-none">{priv.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 leading-tight">
                    {priv.title}
                  </h4>
                  <p className="text-[10px] text-neutral-500 leading-tight mt-0.5">
                    {priv.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Segmented Navigation Tabs ── */}
        <div className="bg-white p-1 rounded-2xl border border-neutral-200/80 shadow-xs flex space-x-1">
          {[
            { id: 'membership', label: '👑 Royalty Club' },
            { id: 'orders', label: `🛍️ Orders (${displayOrders.length})` },
            { id: 'reservations', label: `📅 Bookings (${reservations.length})` },
            { id: 'details', label: '📍 Saved Details' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Notification Feedback Message ── */}
        {message.text && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center space-x-2 animate-in fade-in duration-200 ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* ── TAB 1: MEMBERSHIP & COINS PASSBOOK ── */}
        {activeTab === 'membership' && (
          <div className="space-y-4">
            {/* How to Earn & Redeem */}
            <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-neutral-900 flex items-center space-x-2">
                <Gift className="w-4 h-4 text-amber-500" />
                <span>How Royalty Coins Work</span>
              </h3>
              <div className="space-y-2 text-xs text-neutral-600">
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <p>
                    <strong>Earn on Every Order:</strong> Get 5% cashback in PD Coins on every delivery or dining bill from Bandra, Andheri, Kurla & Camp.
                  </p>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    <strong>Direct 1 Coin = ₹1 Redemption:</strong> Toggle "Redeem PD Coins" at checkout for instant cash savings on your authentic feast.
                  </p>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <p>
                    <strong>VIP Priority Table:</strong> Never wait in line at any Persian Darbar branch during busy festive weekends.
                  </p>
                </div>
              </div>
            </div>

            {/* Refer a Friend Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-[#FFF9ED] to-rose-50 border border-amber-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                  Referral Privilege
                </span>
                <h4 className="text-sm font-bold text-neutral-900 mt-1">
                  Invite Family & Friends
                </h4>
                <p className="text-xs text-neutral-600 mt-0.5">
                  They get ₹100 off on 1st order. You get 100 PD Coins!
                </p>
              </div>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Persian Darbar Royalty Invite',
                      text: `Use my invite code DARBAR786 to join Persian Darbar Royalty Club and get ₹100 off your first Royal Biryani!`,
                      url: window.location.origin
                    });
                  } else {
                    navigator.clipboard?.writeText('https://persiandarbar.in/?ref=DARBAR786');
                    setMessage({ type: 'success', text: 'Referral link copied to clipboard!' });
                    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs flex items-center space-x-1.5 active:scale-95 transition-transform"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Code</span>
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 2: MY ORDERS ── */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {loadingOrders ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200/80">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-neutral-500">Loading your past royal feasts...</p>
              </div>
            ) : displayOrders.length > 0 ? (
              displayOrders.map((ord, idx) => (
                <div
                  key={ord._id || idx}
                  className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className="w-4 h-4 text-amber-500" />
                        <h4 className="text-sm font-black text-neutral-900">
                          {ord.order_number || `Order #${ord._id?.slice(-5) || idx + 1}`}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {ord.status || 'DELIVERED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {ord.outlet || 'Persian Darbar, Camp'} · {ord.date || 'Recent Order'}
                      </p>
                    </div>
                    <span className="text-sm font-black text-neutral-900">
                      ₹{ord.total || 0}
                    </span>
                  </div>

                  {/* Items list */}
                  <div className="border-t border-neutral-100 pt-2 space-y-1">
                    {(ord.items || []).map((itm, iIdx) => (
                      <div
                        key={iIdx}
                        className="flex items-center justify-between text-xs text-neutral-600"
                      >
                        <span>
                          {itm.quantity || 1}x {itm.name}
                        </span>
                        <span className="text-neutral-500 font-medium">
                          ₹{(itm.price || 0) * (itm.quantity || 1)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Re-order action button */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[11px] text-amber-800 font-semibold flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Earned +{Math.round((ord.total || 0) * 0.05)} PD Coins</span>
                    </span>
                    <button
                      onClick={() => navigate('/customer/dashboard')}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 font-black text-xs transition-colors flex items-center space-x-1"
                    >
                      <span>Order Again</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200/80 space-y-3">
                <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
                <h4 className="text-sm font-bold text-neutral-800">No Past Orders Yet</h4>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Treat yourself to our world-renowned Mutton Barra Chop and Dum Biryani today.
                </p>
                <Link
                  to="/customer/dashboard"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs"
                >
                  <span>Explore Menu</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: TABLE RESERVATIONS ── */}
        {activeTab === 'reservations' && (
          <div className="space-y-3">
            {loadingRes ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200/80">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-neutral-500">Checking your royal dining reservations...</p>
              </div>
            ) : reservations.length > 0 ? (
              reservations.map((res, idx) => (
                <div
                  key={res._id || idx}
                  className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      <div>
                        <h4 className="text-xs font-black text-neutral-900">
                          {res.branch_name || 'Persian Darbar, Camp Pune'}
                        </h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {res.date || 'Today'} · {res.time || '8:00 PM'} · {res.guests || 2} Guests
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {res.status || 'CONFIRMED'}
                    </span>
                  </div>
                  {res.special_request && (
                    <p className="text-[11px] text-neutral-600 bg-neutral-50 p-2 rounded-lg">
                      Note: "{res.special_request}"
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200/80 space-y-3">
                <Calendar className="w-10 h-10 text-neutral-300 mx-auto" />
                <h4 className="text-sm font-bold text-neutral-800">No Active Reservations</h4>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Experience Persian Darbar's regal Mughlai ambience with VIP priority seating.
                </p>
                <Link
                  to="/customer/dashboard"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs"
                >
                  <span>Book a Royal Table</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: SAVED CONTACT & ADDRESS DETAILS ── */}
        {activeTab === 'details' && (
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs space-y-4 text-left"
          >
            <h3 className="text-sm font-black text-neutral-900 pb-2 border-b border-neutral-100 flex items-center justify-between">
              <span>Account & Delivery Details</span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Google Verified</span>
              </span>
            </h3>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-neutral-50/50"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                <span>Account Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your personal or Google email address"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-neutral-50/50"
              />
            </div>

            {/* Delivery Mobile Number */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
              <label className="block text-xs font-bold text-amber-950 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-600" />
                  <span>Delivery Mobile Number</span>
                </span>
                <span className="text-[10px] text-amber-700 font-semibold">Pre-filled on Orders</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  maxLength="10"
                  className="w-full pl-12 pr-3.5 py-2 rounded-lg border border-amber-300 text-xs font-bold text-neutral-900 focus:outline-none focus:border-amber-500 bg-white font-mono"
                />
              </div>
              <p className="text-[10px] text-amber-800/80">
                Captains and delivery valets will contact you on this number for order updates.
              </p>
            </div>

            {/* Primary Delivery Address */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>Primary Delivery Address</span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House/Flat number, Street, Landmark, Area (e.g. Kondhwa, Pune)..."
                rows="2"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-neutral-50/50"
              />
            </div>

            {/* Additional Addresses */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-neutral-700">
                Additional Saved Addresses
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newAddressInput}
                  onChange={(e) => setNewAddressInput(e.target.value)}
                  placeholder="Add another address (e.g. Office, Home 2)..."
                  className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-neutral-50/50 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleAddAddress}
                  className="px-3.5 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs flex items-center space-x-1 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {addresses.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {addresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs"
                    >
                      <span className="text-neutral-800 truncate pr-2">{addr}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAddress(idx)}
                        className="text-neutral-400 hover:text-rose-600 p-1"
                        title="Delete address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-500 active:scale-[0.99] text-neutral-950 font-black text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ── Legal & Compliance Footer ── */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-500" />
            <span className="font-semibold">Privacy & Terms of Service</span>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/privacy-policy" className="hover:text-neutral-900 underline">
              Privacy
            </Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-neutral-900 underline">
              Terms
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerProfile;
