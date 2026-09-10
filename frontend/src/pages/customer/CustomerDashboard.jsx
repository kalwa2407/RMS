import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import API_BASE from '../../lib/config';
import {
  ShoppingBag, Calendar, Clock, Phone,
  Edit2, Check, ArrowRight, LogOut, AlertCircle,
  Truck, UtensilsCrossed, RotateCw,
  Eye, User, ChevronRight, Crown, Home, Plus, X,
  Star, Minus, Zap, Gift, TrendingUp, BookOpen,
  Search, MapPin, CheckCircle2, Trash2, Sparkles
} from 'lucide-react';

/* ─── Design tokens ─── */
const GOLD = '#EAB308';
const GF   = 'rgba(234,179,8,0.12)';
const GB   = 'rgba(234,179,8,0.30)';

/* ─── Premium Glassmorphism Design Tokens ─── */
const GLASS_CARD = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.10) 0%, rgba(20, 20, 25, 0.45) 100%)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
};

const GLASS_CARD_SM = {
  background: 'rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.16)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
};

const GLASS_GOLD_CARD = {
  background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.14) 0%, rgba(20, 20, 25, 0.45) 100%)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(234, 179, 8, 0.32)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
};

const CARD = 'rgba(255, 255, 255, 0.08)';

/* ─── Helpers ─── */
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '';
const fmtT = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true }) : '';

/* ─── Razorpay script loader ─── */
const useRazorpay = () => {
  const [ready, setReady] = useState(!!window.Razorpay);
  useEffect(() => {
    if (window.Razorpay) return;
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => setReady(true);
    document.body.appendChild(s);
  }, []);
  return ready;
};

/* ─── Table status dot ─── */
const Dot = ({ status }) => {
  const m = { available:'#22c55e', held:'#f59e0b', reserved:'#3b82f6', occupied:'#ef4444', cleaning:'#a78bfa', unavailable:'#374151' };
  const c = m[status?.toLowerCase()] || m.unavailable;
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: c, boxShadow:`0 0 5px ${c}` }} />;
};

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
const CustomerDashboard = () => {
  const { currentUser, customerProfile, updateProfile, signOutCustomer, idToken, fetchWithAuth } = useCustomerAuth();
  const navigate   = useNavigate();
  const rzReady    = useRazorpay();

  const [tab, setTab]           = useState('home');
  const [orders, setOrders]     = useState([]);
  const [reservations, setRes]  = useState([]);
  const [tables, setTables]     = useState([]);
  const [loadO, setLoadO]       = useState(true);
  const [loadR, setLoadR]       = useState(true);
  const [loadT, setLoadT]       = useState(true);

  /* reserve flow */
  const [guests, setGuests]     = useState(2);
  const [paying, setPaying]     = useState(false);
  const [success, setSuccess]   = useState(null);

  /* phone edit */
  const [editPhone, setEditPhone] = useState(false);
  const [phoneVal, setPhoneVal]   = useState('');
  const [phoneSav, setPhoneSav]   = useState(false);
  const [phoneOk, setPhoneOk]     = useState(false);
  const [phoneErr, setPhoneErr]   = useState('');

  const sseRef = useRef(null);
  const mainScrollRef = useRef(null);

  /* ── In-App Ordering State ── */
  const [menu, setMenu]                   = useState([]);
  const [menuLoading, setMenuLoading]     = useState(true);
  const [selectedCat, setSelectedCat]     = useState('All');
  const [searchQuery, setSearchQuery]     = useState('');
  const [cart, setCart]                   = useState([]);
  const [orderSubTab, setOrderSubTab]     = useState('menu'); // 'menu' | 'history'
  const [isCartOpen, setIsCartOpen]       = useState(false);
  const [orderType, setOrderType]         = useState('DELIVERY'); // 'DELIVERY' | 'TAKEAWAY'
  const [deliveryAddress, setDeliveryAddr]= useState('');
  const [distanceKm, setDistanceKm]       = useState(null);
  const [detectingLoc, setDetectingLoc]   = useState(false);
  const [payMethod, setPayMethod]         = useState('cod');
  const [placingOrder, setPlacingOrder]   = useState(false);
  const [orderDone, setOrderDone]         = useState(null);

  /* ── Auto-scroll to top when switching tabs or subtabs (native mobile app behavior) ── */
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [tab, orderSubTab]);

  useEffect(() => {
    if (customerProfile?.address) setDeliveryAddr(customerProfile.address);
  }, [customerProfile]);

  /* ── Fetch Menu items ── */
  const fetchMenu = useCallback(async () => {
    setMenuLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/menu`);
      if (res.ok) {
        const data = await res.json();
        setMenu(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => { if (customerProfile?.phone) setPhoneVal(customerProfile.phone); }, [customerProfile]);

  /* ── Fetch orders ── */
  const fetchOrders = useCallback(async () => {
    if (!idToken) return;
    setLoadO(true);
    try { const r = await fetchWithAuth(`${API_BASE}/api/customer/orders`); if (r.ok) setOrders(await r.json() || []); }
    catch(e) { console.error(e); } finally { setLoadO(false); }
  }, [idToken, fetchWithAuth]);

  /* ── Fetch reservations ── */
  const fetchRes = useCallback(async () => {
    if (!idToken) return;
    setLoadR(true);
    try { const r = await fetchWithAuth(`${API_BASE}/api/customer/reservations`); if (r.ok) setRes(await r.json() || []); }
    catch(e) { console.error(e); } finally { setLoadR(false); }
  }, [idToken, fetchWithAuth]);

  /* ── SSE: real-time table stream ── */
  useEffect(() => {
    const connect = () => {
      const es = new EventSource(`${API_BASE}/api/tables/stream`);
      es.onmessage = (e) => {
        try { const d = JSON.parse(e.data); if (Array.isArray(d)) { setTables(d); setLoadT(false); } } catch(_) {}
      };
      es.onerror = () => {
        es.close();
        fetch(`${API_BASE}/api/tables`).then(r=>r.json()).then(d=>{ if(Array.isArray(d)){setTables(d);setLoadT(false);} }).catch(()=>{});
        setTimeout(connect, 5000);
      };
      sseRef.current = es;
    };
    connect();
    return () => sseRef.current?.close();
  }, []);

  useEffect(() => { if (idToken) { fetchOrders(); fetchRes(); } }, [idToken, fetchOrders, fetchRes]);

  /* ── Computed ── */
  const activeOrders = orders.filter(o => ['placed','accepted','preparing','ready','out_for_delivery'].includes(o.status));
  const activeRes    = reservations.filter(r => ['pending','confirmed'].includes(r.status));
  const pdCoins      = customerProfile?.pd_coins || customerProfile?.loyalty_points || 0;
  const fee          = guests * 10;

  const tAvail = tables.filter(t => t.status?.toLowerCase() === 'available').length;
  const tOccup = tables.filter(t => t.status?.toLowerCase() === 'occupied').length;
  const tResvd = tables.filter(t => ['reserved','held'].includes(t.status?.toLowerCase())).length;

  /* ── Status badge ── */
  const badge = (s) => ({
    placed:           <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">Placed</span>,
    accepted:         <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Accepted</span>,
    preparing:        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 animate-pulse">Preparing 🔥</span>,
    ready:            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Ready</span>,
    out_for_delivery: <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">On way 🛵</span>,
    delivered:        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">Delivered ✓</span>,
    cancelled:        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">Cancelled</span>,
  }[s] || <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30">{s}</span>);

  /* ── Razorpay ── */
  const handlePay = async () => {
    if (!rzReady) { alert('Payment loading...'); return; }
    setPaying(true);
    const opts = {
      key: 'rzp_test_YourKeyHere', // TODO: replace with real key
      amount: fee * 100,
      currency: 'INR',
      name: 'Persian Darbar',
      description: `Table Reservation — ${guests} Guest${guests>1?'s':''}`,
      theme: { color: GOLD },
      prefill: { name: currentUser?.displayName||'', email: currentUser?.email||'', contact: customerProfile?.phone ? `91${customerProfile.phone}`:'' },
      handler: async (response) => {
        try {
          const now = new Date();
          const body = {
            customer_name: currentUser?.displayName || 'Guest',
            phone: customerProfile?.phone || '',
            email: currentUser?.email || '',
            date: now.toISOString().split('T')[0],
            time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
            guests,
            special_requests: 'Walk-in paid reservation',
            payment_id: response.razorpay_payment_id,
            amount_paid: fee,
          };
          const res = await fetchWithAuth(`${API_BASE}/api/reservations`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
          if (res.ok) { const d = await res.json(); setSuccess({ ...d, payment_id: response.razorpay_payment_id, guests, fee }); fetchRes(); }
        } catch(e) { console.error(e); }
        setPaying(false);
      },
      modal: { ondismiss: () => setPaying(false) },
    };
    new window.Razorpay(opts).open();
  };

  /* ── Phone save ── */
  const savePhone = async (e) => {
    e.preventDefault(); setPhoneErr('');
    const c = phoneVal.replace(/[^0-9]/g,'');
    if (c.length < 10) { setPhoneErr('Enter valid 10-digit number'); return; }
    setPhoneSav(true);
    const r = await updateProfile({ phone: c });
    setPhoneSav(false);
    if (r.success) { setEditPhone(false); setPhoneOk(true); setTimeout(() => setPhoneOk(false), 3000); fetchOrders(); }
    else setPhoneErr(r.warning || 'Failed');
  };

  /* ── In-App Cart & Ordering Calculations ── */
  const menuCategories = ['All', ...new Set(menu.map(i => i.category).filter(Boolean))];
  const filteredMenuItems = menu.filter(item => {
    const matchesCat = selectedCat === 'All' || item.category === selectedCat;
    const matchesSearch = !searchQuery.trim() || 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch && item.available !== false;
  });

  const cartItemCount   = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal    = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartDeliveryFee = orderType === 'TAKEAWAY' ? 0 : (distanceKm !== null && distanceKm > 10 ? 60 : 0);
  const cartTaxes       = Math.round(cartSubtotal * 0.05);
  const cartTotal       = cartSubtotal + cartDeliveryFee + cartTaxes;

  const addToCart = (item) => {
    setCart(prev => {
      const exist = prev.find(c => c._id === item._id);
      if (exist) {
        return prev.map(c => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => 
      prev.map(c => c._id === id ? { ...c, quantity: c.quantity + delta } : c)
          .filter(c => c.quantity > 0)
    );
  };

  const detectDistance = () => {
    if (!navigator.geolocation) {
      setDistanceKm(4.2);
      return;
    }
    setDetectingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const R = 6371;
        const dLat = (pos.coords.latitude - 18.5204) * Math.PI / 180;
        const dLon = (pos.coords.longitude - 73.8567) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(18.5204 * Math.PI / 180) * Math.cos(pos.coords.latitude * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const dist = parseFloat((R * c).toFixed(1));
        setDistanceKm(dist);
        setDetectingLoc(false);
      },
      () => {
        setDistanceKm(4.5);
        setDetectingLoc(false);
      },
      { timeout: 8000 }
    );
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (orderType === 'DELIVERY' && cartSubtotal < 250) {
      alert('Minimum order value for delivery is ₹250. Or choose Takeaway Pickup (no minimum)!');
      return;
    }
    const phone = phoneVal || customerProfile?.phone;
    if (!phone) {
      alert('Please enter your contact mobile number.');
      return;
    }
    if (orderType === 'DELIVERY' && !deliveryAddress.trim()) {
      alert('Please enter your delivery address.');
      return;
    }
    if (orderType === 'DELIVERY' && distanceKm && distanceKm > 20) {
      alert('Out of delivery range (>20km). Please choose Takeaway Pickup.');
      return;
    }

    setPlacingOrder(true);
    const orderData = {
      customer_uid: currentUser?.uid || null,
      email: currentUser?.email || null,
      customer_name: currentUser?.displayName || customerProfile?.name || 'Valued Guest',
      phone: phone.trim(),
      address: orderType === 'TAKEAWAY' ? 'Takeaway Pickup: Persian Darbar (Camp, Pune)' : deliveryAddress.trim(),
      order_type: orderType,
      distance_km: distanceKm || 3.5,
      payment_method: payMethod,
      items: cart.map(i => ({
        item_id: String(i._id),
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        variant: null,
        variant_price: 0.0,
        addons: [],
        special_instructions: null
      })),
      subtotal: cartSubtotal,
      discount: 0.0,
      delivery_fee: cartDeliveryFee,
      taxes: cartTaxes,
      total: cartTotal,
      coupon_code: null
    };

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Could not place order');
      }
      const data = await res.json();
      setCart([]);
      setIsCartOpen(false);
      setOrderDone(data);
      setOrderSubTab('history');
      fetchOrders();
    } catch (err) {
      alert(err.message || 'Order failed. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  /* ── Bottom nav ── */
  const NAV = [
    { key:'home',     Icon:Home,          label:'Home' },
    { key:'order',    Icon:UtensilsCrossed,label:'Order', count: cartItemCount },
    { key:'reserve',  Icon:Calendar,      label:'Reserve', gold:true },
    { key:'coins',    Icon:Star,          label:'Rewards', dot: pdCoins>0 },
    { key:'profile',  Icon:User,          label:'Profile' },
  ];

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden text-white" style={{ fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* ═══ FULLSCREEN HEAVILY BLURRED RESTAURANT INTERIOR BACKGROUND ═══ */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <img
          src="/dynamic_images/img1.jpeg"
          alt=""
          className="w-full h-full object-cover"
          style={{
            filter: 'blur(36px) brightness(0.38) saturate(1.25)',
            transform: 'scale(1.22)',
            transformOrigin: 'center center'
          }}
        />
        {/* Ambient dark gradient overlay to ensure perfect contrast for frosted glass panels */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/70" />
      </div>

      {/* ═══ HEADER (Glassmorphic) ═══ */}
      <div className="relative z-10 shrink-0 px-4 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(15, 18, 24, 0.45)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.14)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
        <div className="flex items-center gap-3">
          {currentUser?.photoURL
            ? <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" style={{ border:`2px solid ${GOLD}`, boxShadow:`0 0 12px ${GF}` }} />
            : <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background:'rgba(255,255,255,0.12)', border:`1.5px solid ${GOLD}`, color:GOLD, backdropFilter:'blur(10px)' }}>
                {currentUser?.displayName?.[0]||'U'}
              </div>
          }
          <div>
            <p className="text-white font-bold text-sm leading-tight drop-shadow-sm">{currentUser?.displayName||'Guest'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Crown className="w-3 h-3" style={{ color:GOLD }} />
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color:GOLD }}>
                PD {pdCoins > 500 ? 'Elite' : 'Member'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={async()=>{ await signOutCustomer(); navigate('/'); }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white/85 active:scale-95 transition-all shadow-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.10)',
            border: '1px solid rgba(255, 255, 255, 0.20)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}>
          <LogOut className="w-3.5 h-3.5 text-white/75" /> Sign Out
        </button>
      </div>

      {/* ═══ SCROLLABLE BODY ═══ */}
      <div ref={mainScrollRef} className="relative z-10 flex-1 overflow-y-auto overscroll-contain">

        {/* ══ HOME ══ */}
        {tab === 'home' && (
          <div className="pb-6">
            {/* Hero banner card (Frosted Glass) */}
            <div className="relative mx-4 mt-3 rounded-3xl overflow-hidden p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(20,20,25,0.48) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.20)',
                boxShadow: '0 8px 32px 0 rgba(0,0,0,0.35)'
              }}>
              <div className="absolute inset-0 -z-10 opacity-30 bg-cover bg-center" style={{ backgroundImage: 'url(/dynamic_images/img1.jpeg)' }} />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

              <div className="flex justify-between items-start mb-3">
                <div className="w-6 h-[2px] rounded-full" style={{ background: GOLD }} />
                <p className="text-[10px] font-black tracking-[0.25em] uppercase text-right" style={{ color: GOLD }}>PERSIAN DARBAR</p>
              </div>

              <h1 className="text-white text-2xl font-black leading-snug" style={{ fontFamily: "'Playfair Display',Georgia,serif" }}>
                More than a meal,<br />
                <em style={{ color: GOLD }}>a tradition.</em>
              </h1>

              <p className="text-[10px] font-bold tracking-[0.3em] uppercase mt-2.5" style={{ color: 'rgba(234,179,8,0.8)' }}>
                Reserve · Dine · Earn · Revisit
              </p>

              {/* Dots indicator */}
              <div className="flex justify-center items-center gap-1.5 mt-4">
                <span className="w-2.5 h-1.5 rounded-full" style={{ background: GOLD }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              </div>
            </div>

            <div className="px-4 pt-3 space-y-3">

              {/* Reserve & Earn CTA (Frosted Glass Panel) */}
              <button onClick={()=>setTab('reserve')}
                className="w-full rounded-3xl p-5 flex items-center justify-between active:scale-[0.98] transition-all text-left group"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(25, 25, 30, 0.45) 100%)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.20)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)'
                }}>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: GOLD }}>Reserve &amp; Earn</p>
                  <p className="text-white font-bold text-xl leading-snug" style={{ fontFamily: "'Playfair Display',serif" }}>
                    Book Your Royal Table
                  </p>
                  <p className="text-xs mt-1 text-white/75">
                    ₹10/person <span style={{ color: GOLD }}>·</span> Earn 10% PD Coins on bill
                  </p>
                </div>
                {/* Glass squircle button with Calendar icon as shown in mockup */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.06) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.32)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.35), 0 4px 16px rgba(0,0,0,0.25)'
                  }}>
                  <Calendar className="w-6 h-6 text-white/95" />
                </div>
              </button>

              {/* Live table status (Frosted Glass Panel) */}
              <div className="rounded-3xl p-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(20, 20, 25, 0.45) 100%)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)'
                }}>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow:'0 0 8px rgba(52,211,153,0.8)' }} />
                    <span className="text-white font-bold text-xs uppercase tracking-[0.2em]">Live Table Status</span>
                  </div>
                  <span className="text-[10px] text-white/50 font-semibold uppercase tracking-widest">Now</span>
                </div>
                {loadT ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-white/50 text-xs">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" /> Connecting...
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-3 gap-2.5 mb-3.5">
                      {[
                        ['Available', '#22c55e', tAvail, 'rgba(34, 197, 94, 0.12)', 'rgba(34, 197, 94, 0.35)'],
                        ['Occupied',  '#ef4444', tOccup, 'rgba(239, 68, 68, 0.12)', 'rgba(239, 68, 68, 0.35)'],
                        ['Reserved',  '#3b82f6', tResvd, 'rgba(59, 130, 246, 0.12)', 'rgba(59, 130, 246, 0.35)'],
                      ].map(([l, c, n, bg, bdr]) => (
                        <div key={l} className="rounded-2xl py-2.5 text-center"
                          style={{ background: bg, border: `1px solid ${bdr}`, backdropFilter:'blur(10px)' }}>
                          <p className="text-2xl font-black" style={{ color: c }}>{n}</p>
                          <p className="text-[9px] uppercase tracking-widest font-bold mt-0.5" style={{ color: c }}>{l}</p>
                        </div>
                      ))}
                    </div>
                    {/* Table chips */}
                    <div className="flex flex-wrap gap-1.5 justify-between">
                      {tables.slice(0, 20).map((t, i) => {
                        const s = t.status?.toLowerCase() || 'unavailable';
                        const cm = { available:'#22c55e', held:'#f59e0b', reserved:'#3b82f6', occupied:'#ef4444', cleaning:'#a78bfa', unavailable:'#374151' };
                        const c = cm[s] || cm.unavailable;
                        return (
                          <div key={t._id || i} title={`${t.table_number} — ${s}`}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all"
                            style={{
                              background: `${c}18`,
                              border: `1.5px solid ${c}55`,
                              color: c,
                              boxShadow: `0 2px 6px ${c}22`,
                              backdropFilter: 'blur(8px)'
                            }}>
                            {String(t.table_number || i + 1).replace('T', '').slice(-2)}
                          </div>
                        );
                      })}
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mt-3 pt-2" style={{ borderTop:'1px solid rgba(255,255,255,0.08)' }}>
                      {[
                        ['#22c55e', 'Available'],
                        ['#ef4444', 'Occupied'],
                        ['#3b82f6', 'Reserved'],
                        ['#a78bfa', 'Cleaning']
                      ].map(([c, l]) => (
                        <span key={l} className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: c, boxShadow:`0 0 6px ${c}` }} />
                          <span className="text-[10px] text-white/70 font-medium">{l}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Active order banner */}
              {activeOrders.length > 0 && (
                <Link to={`/track?order_id=${activeOrders[0].order_id}`}>
                  <div className="rounded-3xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all"
                    style={GLASS_CARD_SM}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(234,179,8,0.15)', border: `1px solid ${GB}` }}>
                      <Truck className="w-5 h-5 animate-bounce" style={{ color:GOLD }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[10px] uppercase tracking-widest" style={{ color:GOLD }}>Live Order</p>
                      <p className="text-white font-bold text-sm leading-tight truncate">{activeOrders[0].items?.map(i=>i.name).slice(0,2).join(', ')}</p>
                      <div className="flex items-center gap-2 mt-0.5">{badge(activeOrders[0].status)}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0" style={{ color:GOLD }} />
                  </div>
                </Link>
              )}

              {/* Active reservation banner */}
              {activeRes.length > 0 && (
                <div className="rounded-3xl p-4 flex items-center gap-3"
                  style={{ background:'rgba(34,197,94,0.10)', border:'1px solid rgba(34,197,94,0.3)', backdropFilter:'blur(16px)' }}>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background:'rgba(34,197,94,0.2)' }}>
                    <Calendar className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">Upcoming Reservation</p>
                    <p className="text-white font-bold text-sm">{activeRes[0].date} at {activeRes[0].time}</p>
                    <p className="text-white/70 text-xs">{activeRes[0].guests} guests · {activeRes[0].status === 'confirmed' ? '✅ Confirmed' : '⏳ Pending'}</p>
                  </div>
                </div>
              )}

              {/* PD Coins card (Frosted Glass Panel) */}
              <div className="rounded-3xl p-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.10) 0%, rgba(20, 20, 25, 0.45) 100%)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)'
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] mb-1.5" style={{ color: GOLD }}>Your Rewards</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">{pdCoins.toLocaleString()}</span>
                      <span className="text-base font-bold" style={{ color: GOLD }}>PD Coins</span>
                    </div>
                    <p className="text-xs text-white/75 mt-1">₹{pdCoins.toLocaleString()} value <span style={{ color: GOLD }}>·</span> Earn 10% on dine-in</p>
                  </div>
                  <div className="flex flex-col items-end gap-2.5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-2 transition-transform hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 100%)',
                        border: '1px solid rgba(255,255,255,0.28)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 4px 12px rgba(0,0,0,0.25)'
                      }}>
                      <img src="/pd_coin.png" alt="PD Coin" className="w-10 h-10 drop-shadow-md" style={{ filter:'drop-shadow(0 0 8px rgba(234,179,8,0.45))' }} />
                    </div>
                    <button onClick={()=>setTab('coins')}
                      className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl active:scale-95 transition-all"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 100%)',
                        border: '1px solid rgba(234,179,8,0.45)',
                        color: GOLD,
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                      }}>
                      View Details
                    </button>
                  </div>
                </div>
              </div>

              {/* ═══ QUICK ACTIONS (Ultra-Premium Frosted Glass Jewel Tiles) ═══ */}
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  {
                    Icon: UtensilsCrossed,
                    label: 'Order Food',
                    sub: 'Biryanis & Kebabs',
                    badge: 'In-App',
                    color: GOLD,
                    glow: 'rgba(234, 179, 8, 0.35)',
                    border: 'rgba(234, 179, 8, 0.40)',
                    iconBg: 'radial-gradient(circle at 30% 30%, rgba(234,179,8,0.35) 0%, rgba(202,138,4,0.12) 100%)',
                    action: () => { setTab('order'); setOrderSubTab('menu'); }
                  },
                  {
                    Icon: Calendar,
                    label: 'Reserve Table',
                    sub: 'Book in advance',
                    badge: 'Instant',
                    color: '#a78bfa',
                    glow: 'rgba(167, 139, 250, 0.35)',
                    border: 'rgba(167, 139, 250, 0.40)',
                    iconBg: 'radial-gradient(circle at 30% 30%, rgba(167,139,250,0.35) 0%, rgba(139,92,246,0.12) 100%)',
                    action: () => setTab('reserve')
                  },
                  {
                    Icon: Clock,
                    label: 'My Orders',
                    sub: `${orders.length} order${orders.length === 1 ? '' : 's'}`,
                    badge: activeOrders.length > 0 ? `${activeOrders.length} active` : null,
                    color: '#60a5fa',
                    glow: 'rgba(96, 165, 250, 0.35)',
                    border: 'rgba(96, 165, 250, 0.40)',
                    iconBg: 'radial-gradient(circle at 30% 30%, rgba(96,165,250,0.35) 0%, rgba(59,130,246,0.12) 100%)',
                    action: () => { setTab('order'); setOrderSubTab('history'); }
                  },
                  {
                    Icon: BookOpen,
                    label: 'My Bookings',
                    sub: `${reservations.length} total`,
                    badge: activeRes.length > 0 ? `${activeRes.length} live` : null,
                    color: '#34d399',
                    glow: 'rgba(52, 211, 153, 0.35)',
                    border: 'rgba(52, 211, 153, 0.40)',
                    iconBg: 'radial-gradient(circle at 30% 30%, rgba(52,211,153,0.35) 0%, rgba(16,185,129,0.12) 100%)',
                    action: () => setTab('bookings')
                  },
                ].map(({ Icon, label, sub, badge, color, glow, border, iconBg, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="group relative rounded-3xl p-4 text-left active:scale-[0.97] transition-all duration-300 overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(18, 22, 28, 0.55) 100%)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                        style={{
                          background: iconBg,
                          border: `1.5px solid ${border}`,
                          boxShadow: `0 0 16px ${glow}`
                        }}
                      >
                        <Icon style={{ color, width: 20, height: 20 }} />
                      </div>
                      {badge && (
                        <span
                          className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: `${color}20`,
                            color: color,
                            border: `1px solid ${color}45`
                          }}
                        >
                          {badge}
                        </span>
                      )}
                    </div>
                    <p className="text-white font-bold text-[15px] leading-tight drop-shadow-sm mb-1">{label}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-white/65 text-xs font-medium">{sub}</p>
                      <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Brand footer card (Frosted Glass) */}
              <div className="rounded-3xl overflow-hidden relative" style={{ height:94, border:'1px solid rgba(255,255,255,0.16)' }}>
                <img src="/dynamic_images/img3.jpeg" alt="" className="w-full h-full object-cover"
                  style={{ filter:'brightness(0.35) saturate(0.7)' }} />
                <div className="absolute inset-0 flex items-center justify-between px-5"
                  style={{ background:'linear-gradient(90deg, rgba(10,12,16,0.85) 0%, rgba(10,12,16,0.3) 100%)', backdropFilter:'blur(4px)' }}>
                  <div>
                    <p className="text-white font-black text-base leading-tight" style={{ fontFamily:"'Playfair Display',serif" }}>
                      Authentic <span style={{ color:GOLD }}>Persian Flavours</span>
                    </p>
                    <p className="text-xs text-white/70 mt-0.5">Now at your fingertips</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/50">Same Legacy</p>
                    <p className="text-[8px] font-black uppercase tracking-widest" style={{ color:GOLD }}>A Richer Tomorrow</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══ ORDER (In-App Food Ordering & History) ══ */}
        {tab === 'order' && (
          <div className="p-4 space-y-4 pb-24">

            {/* Sub-tab switcher */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter:'blur(16px)' }}>
              <button
                onClick={() => setOrderSubTab('menu')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  orderSubTab === 'menu'
                    ? 'bg-[#EAB308] text-black shadow-lg'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Order Menu</span>
              </button>
              <button
                onClick={() => setOrderSubTab('history')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  orderSubTab === 'history'
                    ? 'bg-[#EAB308] text-black shadow-lg'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>My Orders ({orders.length})</span>
                {activeOrders.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                )}
              </button>
            </div>

            {/* ── SUB-TAB: MENU & IN-APP CART ── */}
            {orderSubTab === 'menu' && (
              <div className="space-y-4">

                {/* Order Success Banner (if just placed) */}
                {orderDone && (
                  <div className="rounded-3xl p-5 text-center space-y-2.5"
                    style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', backdropFilter: 'blur(16px)' }}>
                    <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-emerald-400 font-black text-sm uppercase tracking-widest">Order Placed Successfully!</p>
                    <p className="text-white text-xs">Order ID: <span className="font-mono text-[#EAB308]">#{orderDone.order_id?.slice(-8)}</span></p>
                    <div className="pt-1 flex justify-center gap-2">
                      <button
                        onClick={() => { setOrderSubTab('history'); setOrderDone(null); }}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#EAB308] text-black"
                      >
                        View Order Status
                      </button>
                      <button
                        onClick={() => setOrderDone(null)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 text-white/70"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Search Bar */}
                <div className="relative rounded-2xl flex items-center px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', backdropFilter: 'blur(16px)' }}>
                  <Search className="w-4 h-4 text-white/50 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search Biryanis, Kebabs, Desserts..."
                    className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-white/40"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-white/50 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Pills (Horizontal Scroll) */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
                  {menuCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCat(cat);
                        if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
                      }}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                        selectedCat === cat
                          ? 'bg-[#EAB308] text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                          : 'bg-white/[0.08] text-white/80 border border-white/15 hover:bg-white/15'
                      }`}
                      style={{ backdropFilter: 'blur(12px)' }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Menu Items List */}
                {menuLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/50 text-sm">
                    <RotateCw className="w-6 h-6 animate-spin text-[#EAB308]" />
                    <span>Loading Royal Menu...</span>
                  </div>
                ) : filteredMenuItems.length === 0 ? (
                  <div className="rounded-3xl p-10 text-center" style={GLASS_CARD_SM}>
                    <UtensilsCrossed className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white font-bold text-sm">No dishes found</p>
                    <p className="text-white/50 text-xs mt-1">Try another category or search term</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMenuItems.map(item => {
                      const inCart = cart.find(c => c._id === item._id);
                      const qty = inCart ? inCart.quantity : 0;
                      return (
                        <div
                          key={item._id}
                          className="rounded-3xl p-3.5 flex gap-3.5 items-center transition-all group"
                          style={GLASS_CARD}
                        >
                          {/* Dish Image */}
                          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 relative bg-black/40 border border-white/15">
                            <img
                              src={item.image || '/no-image.png'}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={e => { e.target.src = '/no-image.png'; }}
                            />
                            {item.popular && (
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-[#EAB308] text-black font-black text-[8px] uppercase tracking-wider">
                                Star
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`w-2 h-2 rounded-full ${item.category?.toLowerCase().includes('veg') && !item.category?.toLowerCase().includes('non') ? 'bg-emerald-400' : 'bg-red-400'}`} />
                              <h3 className="text-white font-bold text-sm leading-snug truncate" style={{ fontFamily: "'Playfair Display',serif" }}>
                                {item.name}
                              </h3>
                            </div>
                            <p className="text-white/60 text-xs line-clamp-1 mb-1.5">{item.description || item.category}</p>
                            <p className="text-[#EAB308] font-black text-sm">₹{item.price}</p>
                          </div>

                          {/* Add / Stepper CTA */}
                          <div className="shrink-0 flex items-center">
                            {qty === 0 ? (
                              <button
                                onClick={() => addToCart(item)}
                                className="px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider text-black shadow-md transition-all active:scale-95 flex items-center gap-1"
                                style={{
                                  background: 'linear-gradient(135deg, #FDE047 0%, #EAB308 60%, #CA8A04 100%)',
                                  boxShadow: '0 4px 12px rgba(234,179,8,0.35)'
                                }}
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 rounded-2xl p-1"
                                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(234,179,8,0.4)' }}>
                                <button
                                  onClick={() => updateCartQty(item._id, -1)}
                                  className="w-7 h-7 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white active:scale-90 transition-all"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-white font-black text-xs px-1.5 min-w-[18px] text-center">{qty}</span>
                                <button
                                  onClick={() => updateCartQty(item._id, 1)}
                                  className="w-7 h-7 rounded-xl flex items-center justify-center bg-[#EAB308] text-black font-black active:scale-90 transition-all"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* ── SUB-TAB: ORDER HISTORY ── */}
            {orderSubTab === 'history' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <p className="text-xs font-black uppercase tracking-widest text-[#EAB308]">Your Orders</p>
                  <button onClick={fetchOrders} className="p-2 rounded-xl active:scale-90 transition-transform" style={{ background:'rgba(255,255,255,0.08)' }}>
                    <RotateCw className="w-4 h-4 text-white/70" />
                  </button>
                </div>
                {loadO ? (
                  <div className="flex items-center justify-center py-16 gap-2 text-white/50 text-sm">
                    <RotateCw className="w-4 h-4 animate-spin text-[#EAB308]" /> Loading orders...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="rounded-3xl p-12 text-center" style={GLASS_CARD_SM}>
                    <ShoppingBag className="w-14 h-14 text-white/20 mx-auto mb-3" />
                    <p className="text-white font-bold text-sm">No orders yet</p>
                    <p className="text-white/50 text-xs mt-1 mb-4">Start ordering delicious Persian Darbar feasts!</p>
                    <button
                      onClick={() => setOrderSubTab('menu')}
                      className="px-5 py-2.5 rounded-2xl bg-[#EAB308] text-black font-bold text-xs uppercase tracking-wider active:scale-95"
                    >
                      Browse Menu Now
                    </button>
                  </div>
                ) : (
                  orders.map(o => (
                    <div key={o.order_id || o._id} className="rounded-3xl overflow-hidden" style={GLASS_CARD_SM}>
                      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-white/50 text-xs font-mono">#{o.order_id?.slice(-8)}</span>
                          {badge(o.status)}
                        </div>
                        <span className="text-white font-bold text-sm">₹{o.total?.toFixed(0)}</span>
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-white/90 text-sm font-medium">{o.items?.map(i=>`${i.quantity}x ${i.name}`).slice(0,2).join(', ')}{o.items?.length>2?` +${o.items.length-2}`:''}</p>
                          <p className="text-white/50 text-xs mt-0.5">{fmt(o.created_at)} · {fmtT(o.created_at)}</p>
                        </div>
                        <Link to={`/track?order_id=${o.order_id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-sm"
                          style={{ background:'rgba(234,179,8,0.18)', border:`1px solid ${GB}`, color:GOLD }}>
                          <Eye className="w-3.5 h-3.5" /> Track
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── FLOATING CART PILL ── */}
            {orderSubTab === 'menu' && cart.length > 0 && !isCartOpen && (
              <div className="sticky bottom-2 z-30 pt-2">
                <div
                  onClick={() => setIsCartOpen(true)}
                  className="rounded-3xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #FDE047 0%, #EAB308 60%, #CA8A04 100%)',
                    border: '1.5px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.6), 0 0 24px rgba(234,179,8,0.6)'
                  }}
                >
                  <div className="flex items-center gap-3 text-black">
                    <div className="w-10 h-10 rounded-2xl bg-black/15 flex items-center justify-center font-black text-sm">
                      {cartItemCount}
                    </div>
                    <div>
                      <p className="font-black text-base leading-tight">₹{cartSubtotal.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-black/75 uppercase tracking-wider">{cart.length} dish{cart.length === 1 ? '' : 'es'} in cart</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-black font-black text-xs uppercase tracking-wider bg-black/10 px-3.5 py-2 rounded-xl">
                    <span>Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ══ RESERVE ══ */}
        {tab === 'reserve' && (
          <div className="p-4 space-y-4">
            {success ? (
              <div className="flex flex-col items-center text-center pt-8 space-y-5">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background:GF, border:`3px solid ${GB}`, boxShadow:`0 0 40px ${GF}` }}>
                  <Crown className="w-9 h-9" style={{ color:GOLD }} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1" style={{ color:GOLD }}>Table Reserved</p>
                  <h2 className="text-white text-2xl font-black" style={{ fontFamily:"'Playfair Display',serif" }}>Persian Darbar</h2>
                  <p className="text-gray-400 text-sm">Camp, Pune</p>
                </div>
                <div className="w-full rounded-2xl p-4 space-y-2.5" style={{ background:CARD, border:`1px solid ${GB}` }}>
                  {[['Guests',`${success.guests} Persons`],['Amount Paid',`₹${success.fee}`],['Payment ID',success.payment_id?.slice(-10)||'—']].map(([k,v])=>(
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs">{k}</span>
                      <span className="text-white font-bold text-sm">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="w-full rounded-2xl p-4 text-center" style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.25)' }}>
                  <p className="text-emerald-400 font-black text-sm">✅ CONFIRMED</p>
                  <p className="text-gray-500 text-xs mt-1">Show this screen at the host desk</p>
                </div>
                <button onClick={()=>{ setSuccess(null); setTab('bookings'); }}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-black active:scale-[0.98] transition-all"
                  style={{ background:GOLD }}>
                  View My Bookings
                </button>
              </div>
            ) : (
              <>
                <div className="pt-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1" style={{ color:GOLD }}>Reserve Your Table</p>
                  <h2 className="text-white text-xl font-black" style={{ fontFamily:"'Playfair Display',serif" }}>Persian Darbar</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Camp, Pune · Instant Confirmation</p>
                </div>

                {/* Guest stepper */}
                <div className="rounded-3xl p-5" style={GLASS_CARD}>
                  <p className="text-[#EAB308] text-xs font-black uppercase tracking-widest mb-3">Number of Guests</p>
                  <div className="flex items-center justify-between">
                    <button onClick={()=>setGuests(g=>Math.max(1,g-1))}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center active:scale-90 transition-all"
                      style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)' }}>
                      <Minus className="w-5 h-5 text-white" />
                    </button>
                    <div className="text-center">
                      <span className="text-5xl font-black text-white">{guests}</span>
                      <p className="text-xs text-white/60 mt-0.5">Guest{guests>1?'s':''}</p>
                    </div>
                    <button onClick={()=>setGuests(g=>Math.min(20,g+1))}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-md"
                      style={{ background:GOLD, border:`1px solid rgba(255,255,255,0.3)` }}>
                      <Plus className="w-5 h-5 text-black stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Time */}
                <div className="rounded-3xl p-5 flex items-center justify-between" style={GLASS_CARD}>
                  <div>
                    <p className="text-[#EAB308] text-xs font-black uppercase tracking-widest mb-1">Arrival Time</p>
                    <p className="text-white font-bold text-lg">NOW</p>
                    <p className="text-white/60 text-xs">{new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}</p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background:'rgba(234,179,8,0.18)', border:`1px solid ${GB}` }}>
                    <Zap className="w-5 h-5" style={{ color:GOLD }} />
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-3xl p-5" style={GLASS_CARD}>
                  <p className="text-[#EAB308] text-xs font-black uppercase tracking-widest mb-3">Reservation Summary</p>
                  {[['Guests',`${guests} × ₹10`],['Reservation Fee',`₹${fee}`],['PD Coins Reward','After eligible dine-in']].map(([k,v])=>(
                    <div key={k} className="flex items-center justify-between py-2" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-white/60 text-xs">{k}</span>
                      <span className={`font-bold text-sm ${k==='Reservation Fee'?'text-white text-base':'text-white/80'}`}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Earn info */}
                <div className="rounded-3xl p-4 flex items-center gap-3" style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)', backdropFilter:'blur(16px)' }}>
                  <Gift className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-xs text-white/80">Earn <strong className="text-emerald-400 font-bold">10% PD Coins</strong> automatically after eligible dine-in bill</p>
                </div>

                {/* Pay CTA */}
                <button onClick={handlePay} disabled={paying}
                  className="w-full py-4 rounded-3xl font-black text-sm uppercase tracking-[0.15em] text-black active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl"
                  style={{ background:GOLD, boxShadow:`0 8px 30px rgba(234,179,8,0.45)` }}>
                  {paying ? 'Opening Payment...' : `Reserve & Pay ₹${fee}`}
                </button>

                <div className="text-center">
                  <Link to="/reservation" className="text-xs underline" style={{ color:'rgba(234,179,8,0.45)' }}>
                    Schedule for a future date →
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ BOOKINGS ══ */}
        {tab === 'bookings' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-base" style={{ fontFamily:"'Playfair Display',serif" }}>My Bookings</h2>
              <Link to="/reservation" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-black active:scale-95 transition-all" style={{ background:GOLD }}>
                <Plus className="w-3.5 h-3.5" /> New
              </Link>
            </div>
            {loadR ? (
              <div className="flex items-center justify-center py-16 gap-2 text-white/50 text-sm"><RotateCw className="w-4 h-4 animate-spin" /> Loading...</div>
            ) : reservations.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <Calendar className="w-14 h-14 text-white/20" />
                <p className="text-white/60 text-sm">No reservations yet</p>
                <button onClick={()=>setTab('reserve')} className="px-6 py-3 rounded-3xl text-black font-bold text-sm active:scale-95 transition-all shadow-lg" style={{ background:GOLD }}>
                  Reserve Now
                </button>
              </div>
            ) : reservations.map((r,i) => {
              const ok  = r.status==='confirmed';
              const bad = ['rejected','cancelled'].includes(r.status);
              return (
                <div key={i} className="rounded-3xl p-5 space-y-3"
                  style={{
                    ...GLASS_CARD_SM,
                    border: `1px solid ${ok?'rgba(34,197,94,0.4)':bad?'rgba(239,68,68,0.4)':GB}`
                  }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4" style={{ color:GOLD }} />
                      <span className="text-white font-bold text-sm">{r.date} · {r.time}</span>
                    </div>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${ok?'bg-emerald-500/20 text-emerald-300 border-emerald-500/40':bad?'bg-red-500/20 text-red-300 border-red-500/40':'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'}`}>
                      {ok?'✅ Confirmed':bad?'Unavailable':'⏳ Pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/65">
                    <span><UtensilsCrossed className="w-3.5 h-3.5 inline mr-1 text-white/80" />{r.guests} guests</span>
                    {r.occasion && <span>{r.occasion}</span>}
                    {r.amount_paid && <span style={{ color:GOLD }} className="font-bold">₹{r.amount_paid} paid</span>}
                  </div>
                  {r.special_requests && <p className="text-white/60 text-xs italic">"{r.special_requests}"</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ COINS ══ */}
        {tab === 'coins' && (
          <div className="p-4 space-y-4">
            <div className="rounded-3xl p-6 text-center" style={GLASS_GOLD_CARD}>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4" style={{ color:GOLD }}>PD Coins</p>
              {/* Brand coin asset */}
              <div className="flex justify-center mb-4">
                <img
                  src="/pd_coin.png"
                  alt="PD Coin"
                  className="w-28 h-28"
                  style={{ filter:'drop-shadow(0 0 20px rgba(234,179,8,0.55)) drop-shadow(0 4px 12px rgba(0,0,0,0.6))', animation:'spin 18s linear infinite' }}
                />
              </div>
              <span className="text-5xl font-black text-white">{pdCoins.toLocaleString()}</span>
              <p className="font-bold text-sm mt-1 mb-3" style={{ color:'rgba(234,179,8,0.85)' }}>₹{pdCoins.toLocaleString()} Value</p>
              <div className="w-16 h-px mx-auto mb-3" style={{ background:GB }} />
              <div className="flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-white/60">
                <span>Dine</span><span style={{color:GOLD}}>◆</span><span>Earn</span><span style={{color:GOLD}}>◆</span><span>Redeem</span><span style={{color:GOLD}}>◆</span><span>Revisit</span>
              </div>
            </div>

            <div className="rounded-3xl p-5" style={GLASS_CARD}>
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color:GOLD }}>How It Works</p>
              {[
                [Calendar,    'Reserve a table (₹10/person)', 'Required'],
                [UtensilsCrossed,'Dine at Persian Darbar',    'Eligible bill'],
                [TrendingUp,  'Earn 10% as PD Coins',        'Auto-credited'],
                [Gift,        'Redeem on next visit',         '₹1 = 1 Coin'],
              ].map(([Icon,text,note])=>(
                <div key={text} className="flex items-center gap-3 py-2.5" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background:GF }}>
                    <Icon style={{ color:GOLD, width:16, height:16 }} />
                  </div>
                  <p className="text-white text-sm flex-1 font-medium">{text}</p>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">{note}</span>
                </div>
              ))}
            </div>

            <div className="rounded-3xl p-5" style={GLASS_CARD}>
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color:GOLD }}>Transaction History</p>
              {pdCoins === 0 ? (
                <div className="py-8 text-center">
                  <img src="/pd_coin.png" alt="" className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-white/60 text-sm">No transactions yet</p>
                  <p className="text-white/40 text-xs mt-1">Dine in to start earning!</p>
                </div>
              ) : (
                <p className="text-white/60 text-xs py-4 text-center">Full transaction history coming soon</p>
              )}
            </div>

            <button onClick={()=>setTab('reserve')}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] text-black active:scale-[0.98] transition-all"
              style={{ background:GOLD }}>
              Reserve &amp; Start Earning
            </button>
          </div>
        )}

        {/* ══ PROFILE ══ */}
        {tab === 'profile' && (
          <div className="p-4 space-y-4">
            <div className="flex flex-col items-center pt-6 pb-2">
              {currentUser?.photoURL
                ? <img src={currentUser.photoURL} alt="" className="w-20 h-20 rounded-full object-cover mb-3" style={{ border:`3px solid ${GB}`, boxShadow:`0 0 20px ${GF}` }} />
                : <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-3" style={{ background:GF, border:`3px solid ${GB}`, color:GOLD }}>{currentUser?.displayName?.[0]||'U'}</div>
              }
              <p className="text-white font-bold text-lg" style={{ fontFamily:"'Playfair Display',serif" }}>{currentUser?.displayName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Crown className="w-3 h-3" style={{ color:GOLD }} />
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color:GOLD }}>Persian Darbar Member</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">{currentUser?.email}</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[['Orders',orders.length],['Bookings',reservations.length],['PD Coins',pdCoins]].map(([l,v])=>(
                <div key={l} className="rounded-3xl p-4 text-center" style={GLASS_CARD_SM}>
                  <p className="text-2xl font-black text-white">{v}</p>
                  <p className="text-[9px] text-white/60 uppercase tracking-widest font-bold mt-1">{l}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl p-5" style={GLASS_CARD}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" style={{ color:GOLD }} />
                  <span className="text-white/75 text-sm font-semibold">Mobile Number</span>
                </div>
                {!editPhone && (
                  <button onClick={()=>setEditPhone(true)} className="text-xs flex items-center gap-1 active:scale-95 transition-all" style={{ color:GOLD }}>
                    <Edit2 className="w-3 h-3" /> {customerProfile?.phone?'Edit':'Add'}
                  </button>
                )}
              </div>
              {editPhone ? (
                <form onSubmit={savePhone} className="space-y-2.5">
                  <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background:'rgba(255,255,255,0.1)', border:`1px solid ${GB}` }}>
                    <span className="text-white/60 text-sm font-mono">+91</span>
                    <input type="tel" value={phoneVal} maxLength="10" autoFocus onChange={e=>setPhoneVal(e.target.value)}
                      placeholder="10-digit number" className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-white/40" />
                  </div>
                  {phoneErr && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{phoneErr}</p>}
                  {phoneOk  && <p className="text-emerald-400 text-xs flex items-center gap-1"><Check className="w-3 h-3" />Saved!</p>}
                  <div className="flex gap-2">
                    <button type="submit" disabled={phoneSav}
                      className="flex-1 py-3 rounded-2xl text-black font-bold text-sm active:scale-95 transition-all disabled:opacity-50 shadow-md" style={{ background:GOLD }}>
                      {phoneSav?'Saving...':'Save'}
                    </button>
                    <button type="button" onClick={()=>{setEditPhone(false);setPhoneVal(customerProfile?.phone||'');setPhoneErr('');}}
                      className="px-4 py-3 rounded-2xl text-white/70 text-sm" style={{ background:'rgba(255,255,255,0.1)' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-white font-bold">{customerProfile?.phone?`+91 ${customerProfile.phone}`:<span className="text-white/40 font-normal text-sm">Not added yet</span>}</p>
              )}
            </div>

            <button onClick={async()=>{await signOutCustomer();navigate('/');}}
              className="w-full py-4 rounded-3xl font-bold text-red-300 text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md"
              style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', backdropFilter:'blur(12px)' }}>
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}

      </div>

      {/* ═══ IN-APP CART & CHECKOUT DRAWER (Glassmorphism) ═══ */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-md">
          <div
            className="w-full max-h-[88dvh] rounded-t-3xl flex flex-col overflow-hidden text-white shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, rgba(20, 24, 32, 0.95) 0%, rgba(10, 12, 16, 0.98) 100%)',
              borderTop: '1px solid rgba(255, 255, 255, 0.22)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)'
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#EAB308]" />
                <h3 className="font-bold text-lg text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
                  Your Feast Cart
                </h3>
                <span className="text-xs text-white/50">({cartItemCount} items)</span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Cart Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">

              {/* Items List */}
              <div className="space-y-2.5">
                {cart.map(item => (
                  <div key={item._id} className="rounded-2xl p-3 flex items-center justify-between gap-3"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{item.name}</p>
                      <p className="text-[#EAB308] text-xs font-semibold">₹{item.price} each</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1 bg-white/10 rounded-xl p-0.5 border border-white/15">
                        <button
                          onClick={() => updateCartQty(item._id, -1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white active:scale-90"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white px-1.5">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item._id, 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#EAB308] text-black font-bold active:scale-90"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-white font-bold text-sm min-w-[50px] text-right">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Type: Delivery vs Takeaway */}
              <div className="rounded-2xl p-1.5 flex gap-2" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <button
                  type="button"
                  onClick={() => setOrderType('DELIVERY')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    orderType === 'DELIVERY' ? 'bg-[#EAB308] text-black shadow-md' : 'text-white/70'
                  }`}
                >
                  <Truck className="w-4 h-4" /> Home Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    orderType === 'TAKEAWAY' ? 'bg-[#EAB308] text-black shadow-md' : 'text-white/70'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" /> Takeaway Pickup
                </button>
              </div>

              {/* Delivery Details */}
              {orderType === 'DELIVERY' && (
                <div className="rounded-2xl p-4 space-y-3" style={GLASS_CARD_SM}>
                  <div>
                    <label className="text-xs font-bold text-white/75 block mb-1">Delivery Address</label>
                    <textarea
                      rows={2}
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddr(e.target.value)}
                      placeholder="Enter flat/house no, street, landmark..."
                      className="w-full rounded-xl p-3 bg-white/10 text-white text-xs border border-white/20 focus:outline-none focus:border-[#EAB308] placeholder-white/40 resize-none"
                    />
                  </div>

                  {/* Geolocation Distance Check */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={detectDistance}
                      disabled={detectingLoc}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-[#EAB308] border border-[#EAB308]/30 active:scale-95 transition-all"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{detectingLoc ? 'Detecting...' : distanceKm ? `📍 ${distanceKm} km away` : 'Detect Range'}</span>
                    </button>
                    <span className="text-[11px] text-white/60">
                      {distanceKm === null ? 'Within 10km: Free' : distanceKm <= 10 ? '✅ Free Delivery' : distanceKm <= 20 ? '₹60 Delivery Fee' : '❌ Out of range (>20km)'}
                    </span>
                  </div>
                </div>
              )}

              {/* Takeaway Info */}
              {orderType === 'TAKEAWAY' && (
                <div className="rounded-2xl p-3.5 flex items-center gap-3 bg-white/5 border border-white/10 text-xs text-white/80">
                  <MapPin className="w-4 h-4 text-[#EAB308] shrink-0" />
                  <span>Pickup counter at <strong>Persian Darbar, Camp, Pune</strong>. Ready in ~25-30 mins. No minimum order limit!</span>
                </div>
              )}

              {/* Contact Phone */}
              <div className="rounded-2xl p-3 flex items-center gap-2" style={GLASS_CARD_SM}>
                <Phone className="w-4 h-4 text-[#EAB308]" />
                <span className="text-xs text-white/60">Contact:</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneVal}
                  onChange={e => setPhoneVal(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="flex-1 bg-transparent text-white font-bold text-xs focus:outline-none placeholder-white/40"
                />
              </div>

              {/* Payment Method */}
              <div className="rounded-2xl p-3.5 space-y-2" style={GLASS_CARD_SM}>
                <label className="text-xs font-bold text-white/75 block">Payment Option</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('cod')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      payMethod === 'cod' ? 'bg-[#EAB308] text-black shadow' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    💵 Cash on {orderType === 'TAKEAWAY' ? 'Pickup' : 'Delivery'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('online')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      payMethod === 'online' ? 'bg-[#EAB308] text-black shadow' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    💳 Online / UPI
                  </button>
                </div>
              </div>

              {/* Bill Breakdown */}
              <div className="rounded-2xl p-4 space-y-2 text-xs" style={GLASS_CARD_SM}>
                <div className="flex justify-between text-white/70">
                  <span>Items Subtotal</span>
                  <span>₹{cartSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Delivery Fee</span>
                  <span>{cartDeliveryFee === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : `₹${cartDeliveryFee}`}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>GST & Restaurant Taxes (5%)</span>
                  <span>₹{cartTaxes.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between font-black text-sm text-white">
                  <span>Total Amount</span>
                  <span className="text-[#EAB308] text-base">₹{cartTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-black shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #FDE047 0%, #EAB308 60%, #CA8A04 100%)',
                  boxShadow: '0 8px 24px rgba(234,179,8,0.5)'
                }}
              >
                {placingOrder ? 'Placing Order...' : `Confirm Order · ₹${cartTotal.toLocaleString()}`}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ═══ BOTTOM NAV (Frosted Glass Bar) ═══ */}
      <div className="relative z-20 shrink-0 flex items-center justify-around px-2 pt-2 pb-safe"
        style={{
          background: 'rgba(12, 14, 18, 0.70)',
          borderTop: '1px solid rgba(255, 255, 255, 0.16)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)'
        }}>
        {NAV.map(({ key, Icon, label, gold, dot, count }) => {
          const active = tab === key;
          return (
            <button key={key}
              onClick={() => {
                if (tab === key) {
                  mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  setTab(key);
                }
              }}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-1 relative transition-all active:scale-95 group">
              {gold ? (
                /* Prominent solid gold center reserve button as in mockup */
                <div className="relative -mt-6">
                  <div className="w-13 h-13 rounded-full flex items-center justify-center p-3 shadow-lg transition-transform group-hover:scale-105"
                    style={{
                      background: 'radial-gradient(circle at 35% 35%, #FDE047 0%, #EAB308 60%, #CA8A04 100%)',
                      boxShadow: '0 0 24px rgba(234, 179, 8, 0.65), 0 4px 12px rgba(0,0,0,0.4)',
                      border: '2px solid rgba(255, 255, 255, 0.45)'
                    }}>
                    <Icon className="w-6 h-6 text-black stroke-[2.4]" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Icon style={{ width: 21, height: 21, color: active ? GOLD : 'rgba(255,255,255,0.6)' }} />
                  {dot && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: GOLD, boxShadow: `0 0 6px ${GOLD}` }} />}
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-[#EAB308] text-black text-[9px] font-black shadow-md">
                      {count}
                    </span>
                  )}
                </div>
              )}
              <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${
                gold ? 'text-[#EAB308] mt-0.5' : active ? 'text-[#EAB308]' : 'text-white/60 group-hover:text-white'
              }`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerDashboard;
