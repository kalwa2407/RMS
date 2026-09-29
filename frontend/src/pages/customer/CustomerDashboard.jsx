import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import API_BASE from '../../lib/config';
import {
  ShoppingBag, Calendar, Clock, Phone,
  Edit2, Check, ArrowRight, LogOut, AlertCircle,
  Truck, UtensilsCrossed, RotateCw,
  Eye, User, ChevronRight, Crown, Home, Plus, X,
  Star, Minus, Zap, Gift, TrendingUp, BookOpen,
  Search, MapPin, CheckCircle2, Trash2, Sparkles,
  ShieldCheck, MessageSquare, ExternalLink, Share2
} from 'lucide-react';

/* â”€â”€â”€ Design tokens â”€â”€â”€ */
const GOLD = '#EAB308';
const GF   = 'rgba(234,179,8,0.12)';
const GB   = 'rgba(234,179,8,0.30)';

/* â”€â”€â”€ Premium Glassmorphism Design Tokens â”€â”€â”€ */
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

/* â”€â”€â”€ Helpers â”€â”€â”€ */
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '';
const fmtT = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true }) : '';

/* â”€â”€â”€ Razorpay script loader â”€â”€â”€ */
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

/* â”€â”€â”€ Table status dot â”€â”€â”€ */
const Dot = ({ status }) => {
  const m = { available:'#22c55e', held:'#f59e0b', reserved:'#3b82f6', occupied:'#ef4444', cleaning:'#a78bfa', unavailable:'#374151' };
  const c = m[status?.toLowerCase()] || m.unavailable;
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: c, boxShadow:`0 0 5px ${c}` }} />;
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN COMPONENT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const CustomerDashboard = () => {
  const { currentUser, customerProfile, updateProfile, signOutCustomer, idToken, fetchWithAuth, refreshProfile } = useCustomerAuth();
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

  /* address edit & profile helpers */
  const [editAddr, setEditAddr]   = useState(false);
  const [addrVal, setAddrVal]     = useState('');
  const [addrSav, setAddrSav]     = useState(false);
  const [addrOk, setAddrOk]       = useState(false);
  const [addrErr, setAddrErr]     = useState('');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const sseRef = useRef(null);
  const mainScrollRef = useRef(null);

  /* â”€â”€ In-App Ordering State â”€â”€ */
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
  const [applyCoins, setApplyCoins]       = useState(false);

  /* â”€â”€ Auto-scroll to top when switching tabs or subtabs (native mobile app behavior) â”€â”€ */
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [tab, orderSubTab]);

  useEffect(() => {
    if (customerProfile?.address) {
      setDeliveryAddr(customerProfile.address);
      setAddrVal(customerProfile.address);
    }
  }, [customerProfile]);

  /* â”€â”€ Fetch Menu items â”€â”€ */
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

  /* â”€â”€ Fetch orders â”€â”€ */
  const fetchOrders = useCallback(async () => {
    if (!idToken) return;
    setLoadO(true);
    try { const r = await fetchWithAuth(`${API_BASE}/api/customer/orders`); if (r.ok) setOrders(await r.json() || []); }
    catch(e) { console.error(e); } finally { setLoadO(false); }
  }, [idToken, fetchWithAuth]);

  /* â”€â”€ Fetch reservations â”€â”€ */
  const fetchRes = useCallback(async () => {
    if (!idToken) return;
    setLoadR(true);
    try { const r = await fetchWithAuth(`${API_BASE}/api/customer/reservations`); if (r.ok) setRes(await r.json() || []); }
    catch(e) { console.error(e); } finally { setLoadR(false); }
  }, [idToken, fetchWithAuth]);

  /* â”€â”€ SSE: real-time table stream â”€â”€ */
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

  /* â”€â”€ Computed â”€â”€ */
  const activeOrders = orders.filter(o => ['placed','accepted','preparing','ready','out_for_delivery'].includes(o.status));
  const activeRes    = reservations.filter(r => ['pending','confirmed'].includes(r.status));
  const pdCoins      = customerProfile?.pd_coins || customerProfile?.loyalty_points || 0;
  const fee          = guests * 10;

  /* â”€â”€ Coins expiring soon (within next 15 days of 45-day policy) â”€â”€ */
  const expiringSoonCoins = useMemo(() => {
    if (!customerProfile?.coins_history) return 0;
    const now = Date.now();
    let expiring = 0;
    for (const txn of customerProfile.coins_history) {
      if (txn.type === 'earned' && !txn.expired && txn.timestamp) {
        try {
          const ageDays = (now - new Date(txn.timestamp).getTime()) / (1000 * 60 * 60 * 24);
          if (ageDays >= 30 && ageDays < 45) {
            expiring += (txn.coins || 0);
          }
        } catch (e) {}
      }
    }
    return expiring;
  }, [customerProfile?.coins_history]);

  const tAvail = tables.filter(t => ['available','free'].includes(t.status?.toLowerCase())).length;
  const tOccup = tables.filter(t => t.status?.toLowerCase() === 'occupied').length;
  const tResvd = tables.filter(t => ['reserved','held'].includes(t.status?.toLowerCase())).length;

  /* â”€â”€ Status badge â”€â”€ */
  const badge = (s) => ({
    placed:           <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">Placed</span>,
    accepted:         <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Accepted</span>,
    preparing:        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 animate-pulse">Preparing ðŸ”¥</span>,
    ready:            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Ready</span>,
    out_for_delivery: <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">On way ðŸ›µ</span>,
    delivered:        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">Delivered âœ“</span>,
    cancelled:        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">Cancelled</span>,
  }[s] || <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30">{s}</span>);

  /* â”€â”€ Razorpay â”€â”€ */
  const handlePay = async () => {
    if (!rzReady) { alert('Payment loading...'); return; }
    setPaying(true);
    const opts = {
      key: 'rzp_test_YourKeyHere', // TODO: replace with real key
      amount: fee * 100,
      currency: 'INR',
      name: 'Persian Darbar',
      description: `Table Reservation â€” ${guests} Guest${guests>1?'s':''}`,
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

  /* â”€â”€ Phone save â”€â”€ */
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

  /* â”€â”€ Address save â”€â”€ */
  const saveAddress = async (e) => {
    e.preventDefault(); setAddrErr('');
    if (!addrVal.trim()) { setAddrErr('Enter a valid delivery address'); return; }
    setAddrSav(true);
    const r = await updateProfile({ address: addrVal.trim() });
    setAddrSav(false);
    if (r.success) {
      setEditAddr(false);
      setAddrOk(true);
      setDeliveryAddr(addrVal.trim());
      setTimeout(() => setAddrOk(false), 3000);
    } else {
      setAddrErr(r.warning || 'Failed to save address');
    }
  };

  /* â”€â”€ Share App â”€â”€ */
  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Persian Darbar',
        text: 'Experience authentic royal Mughlai dining and earn PD Coins at Persian Darbar!',
        url: window.location.origin
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  /* â”€â”€ In-App Cart & Ordering Calculations â”€â”€ */
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

  /* â”€â”€ PD Coins Redemption Rules:
     - Min â‚¹300 subtotal
     - Max burn cap: 25% of subtotal
     - 1 coin = â‚¹1 discount
     - 10% re-earn on net paid amount (subtotal - coin discount) â”€â”€ */
  const maxRedeemableCoins = (cartSubtotal >= 300 && pdCoins > 0)
    ? Math.min(pdCoins, Math.floor(cartSubtotal * 0.25))
    : 0;
  const coinsApplied     = (applyCoins && maxRedeemableCoins > 0) ? maxRedeemableCoins : 0;
  const coinsDiscount    = coinsApplied;
  const netSubtotal      = Math.max(0, cartSubtotal - coinsDiscount);
  const cartTotal        = Math.max(0, netSubtotal + cartDeliveryFee + cartTaxes);
  const coinsEarnable    = Math.floor(netSubtotal * 0.10);

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
      alert('Minimum order value for delivery is â‚¹250. Or choose Takeaway Pickup (no minimum)!');
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
      discount: coinsDiscount,
      coins_to_redeem: coinsApplied,
      coins_discount: coinsDiscount,
      delivery_fee: cartDeliveryFee,
      taxes: cartTaxes,
      total: cartTotal,
      coupon_code: null
    };

    try {
      let activeToken = idToken;
      if (currentUser) {
        try {
          activeToken = await currentUser.getIdToken();
          setIdToken(activeToken);
        } catch (e) {}
      }
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;
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
      setApplyCoins(false);
      setIsCartOpen(false);
      setOrderDone(data);
      setOrderSubTab('history');
      fetchOrders();
      if (typeof refreshProfile === 'function') {
        await refreshProfile();
      }
    } catch (err) {
      alert(err.message || 'Order failed. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  /* â”€â”€ Bottom nav â”€â”€ */
  const NAV = [
    { key:'home',     Icon:Home,          label:'Home' },
    { key:'order',    Icon:UtensilsCrossed,label:'Order', count: cartItemCount },
    { key:'reserve',  Icon:Calendar,      label:'Reserve', gold:true },
    { key:'coins',    Icon:Star,          label:'Rewards', dot: pdCoins>0 },
    { key:'profile',  Icon:User,          label:'Profile' },
  ];

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     RENDER
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden text-white" style={{ fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* â•â•â• FULLSCREEN HEAVILY BLURRED RESTAURANT INTERIOR BACKGROUND â•â•â• */}
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

      {/* â•â•â• HEADER (Glassmorphic) â•â•â• */}
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

      {/* â•â•â• SCROLLABLE BODY â•â•â• */}
      <div ref={mainScrollRef} className="relative z-10 flex-1 overflow-y-auto overscroll-contain">

        {/* â•â• HOME â•â• */}
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
                Reserve Â· Dine Â· Earn Â· Revisit
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
                    â‚¹10/person <span style={{ color: GOLD }}>Â·</span> Earn 10% PD Coins on bill
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
                    {/* Full 44-Table Grid */}
                    <div className="grid grid-cols-8 gap-1.5 mt-1">
                      {Array.from({length: 44}, (_, i) => i + 1).map(tNum => {
                        const t = tables.find(x => x.table_number === tNum);
                        const s = t ? (t.status?.toLowerCase() || 'unavailable') : 'unavailable';
                        const isOccupied = s === 'occupied';
                        const isFree = s === 'available' || s === 'free';
                        const cm = { available:'#22c55e', free:'#22c55e', held:'#f59e0b', reserved:'#3b82f6', occupied:'#ef4444', cleaning:'#a78bfa', unavailable:'#374151' };
                        const c = cm[s] || cm.unavailable;
                        return (
                          <div key={tNum}
                            title={`Table ${tNum} â€” ${isOccupied ? 'Occupied (locked)' : s}`}
                            className="aspect-square rounded-xl flex flex-col items-center justify-center text-[8px] font-black transition-all relative"
                            style={{
                              background: `${c}15`,
                              border: `1.5px solid ${c}${isOccupied ? '70' : '40'}`,
                              color: c,
                              boxShadow: isOccupied ? `0 0 8px ${c}25` : isFree ? `0 0 6px ${c}18` : 'none',
                            }}>
                            <span className="text-[9px] font-black" style={{color:c}}>{tNum}</span>
                            {isOccupied && (
                              <span style={{fontSize:'6px', color:c, opacity:0.7, letterSpacing:'0.05em', marginTop:'1px'}}>BUSY</span>
                            )}
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
                          <span className="w-2 h-2 rounded-full" style={{ background: c, boxShadow:`0 0 5px ${c}` }} />
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
                    <p className="text-white/70 text-xs">{activeRes[0].guests} guests Â· {activeRes[0].status === 'confirmed' ? 'âœ… Confirmed' : 'â³ Pending'}</p>
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
                    <p className="text-xs text-white/75 mt-1">â‚¹{pdCoins.toLocaleString()} value <span style={{ color: GOLD }}>Â·</span> Earn 10% on dine-in</p>
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

              {/* â•â•â• QUICK ACTIONS (Refined Luxury Frosted Glass Tiles) â•â•â• */}
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  {
                    Icon: UtensilsCrossed,
                    label: 'Order Food',
                    sub: 'Biryanis & Kebabs',
                    action: () => { setTab('order'); setOrderSubTab('menu'); }
                  },
                  {
                    Icon: Calendar,
                    label: 'Reserve Table',
                    sub: 'Book in advance',
                    action: () => setTab('reserve')
                  },
                  {
                    Icon: Clock,
                    label: 'My Orders',
                    sub: `${orders.length} order${orders.length === 1 ? '' : 's'}`,
                    live: activeOrders.length > 0,
                    action: () => { setTab('order'); setOrderSubTab('history'); }
                  },
                  {
                    Icon: BookOpen,
                    label: 'My Bookings',
                    sub: `${reservations.length} total`,
                    live: activeRes.length > 0,
                    action: () => setTab('bookings')
                  },
                ].map(({ Icon, label, sub, live, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="group relative rounded-3xl p-4 text-left active:scale-[0.97] transition-all duration-300 overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(18, 22, 28, 0.55) 100%)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#EAB308] shadow-sm transition-transform duration-300 group-hover:scale-105">
                        <Icon className="w-5 h-5 text-[#EAB308] stroke-[1.8]" />
                      </div>
                      {live && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                          <span>Live</span>
                        </span>
                      )}
                    </div>
                    <p className="text-white font-bold text-[15px] leading-tight drop-shadow-sm mb-1">{label}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-white/60 text-xs font-medium">{sub}</p>
                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#EAB308] group-hover:translate-x-0.5 transition-all" />
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

        {/* â•â• ORDER (In-App Food Ordering & History) â•â• */}
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

            {/* â”€â”€ SUB-TAB: MENU & IN-APP CART â”€â”€ */}
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
                <div className="relative flex items-center">
                  <Search className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search biryani, kebabs, desserts..."
                    className="w-full bg-[#1a4855] border border-[#EAB308]/20 text-white pl-10 pr-10 py-3 rounded-2xl outline-none focus:border-[#EAB308]/60 placeholder-gray-500 text-sm transition-colors"
                    style={{ fontSize: '16px' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 text-gray-400 hover:text-white transition-colors">
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
                      className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                        selectedCat === cat
                          ? 'bg-[#EAB308] text-black shadow-md shadow-[#EAB308]/30'
                          : 'bg-[#1a4855] text-gray-300 border border-[#EAB308]/20 hover:border-[#EAB308]/50 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Result count */}
                <div className="flex items-center gap-2 px-1">
                  <p className="text-white/80 text-xs font-bold">
                    {searchQuery ? `Results for "${searchQuery}"` : selectedCat === 'All' ? 'All Items' : selectedCat}
                  </p>
                  <span className="bg-[#EAB308] text-black text-[10px] font-black px-2 py-0.5 rounded-full">{filteredMenuItems.length}</span>
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
                  <div className="space-y-2">
                    {filteredMenuItems.map(item => {
                      const inCart = cart.find(c => c._id === item._id);
                      const qty = inCart ? inCart.quantity : 0;
                      const isVeg = item.is_veg !== false && !item.category?.toLowerCase().includes('non');
                      return (
                        <div
                          key={item._id}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-[#EAB308]/10 bg-[#1a4855]/60 transition-colors hover:bg-[#EAB308]/5"
                        >
                          {/* Thumbnail */}
                          <div className="relative shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden bg-[#0f2933]">
                            <img
                              src={item.image || '/no-image.png'}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.src = '/no-image.png'; }}
                            />
                            {/* Veg/Non-veg indicator */}
                            <div className={`absolute top-1 left-1 w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${isVeg ? 'border-green-500 bg-[#0f2933]' : 'border-red-500 bg-[#0f2933]'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-black text-sm leading-snug truncate">{item.name}</h3>
                            {(item.description || item.category) && (
                              <p className="text-gray-400 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">{item.description || item.category}</p>
                            )}
                            <p className="text-[#EAB308] font-black text-sm mt-1.5">â‚¹{item.price}</p>
                          </div>

                          {/* ADD / qty stepper */}
                          <div className="shrink-0">
                            {qty === 0 ? (
                              <button
                                onClick={() => addToCart(item)}
                                className="border-2 border-[#EAB308] text-[#EAB308] font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 bg-transparent hover:bg-[#EAB308] hover:text-black transition-all active:scale-95"
                              >
                                <Plus className="w-3.5 h-3.5" /> ADD
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 bg-[#EAB308] rounded-xl px-1 py-1" style={{ animation: 'popIn 0.18s ease' }}>
                                <button
                                  onClick={() => updateCartQty(item._id, -1)}
                                  className="w-6 h-6 flex items-center justify-center text-black hover:bg-black/15 rounded-lg transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-black font-black text-sm w-5 text-center">{qty}</span>
                                <button
                                  onClick={() => updateCartQty(item._id, 1)}
                                  className="w-6 h-6 flex items-center justify-center text-black hover:bg-black/15 rounded-lg transition-colors"
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

            {/* â”€â”€ SUB-TAB: ORDER HISTORY â”€â”€ */}
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
                        <span className="text-white font-bold text-sm">â‚¹{o.total?.toFixed(0)}</span>
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-white/90 text-sm font-medium">{o.items?.map(i=>`${i.quantity}x ${i.name}`).slice(0,2).join(', ')}{o.items?.length>2?` +${o.items.length-2}`:''}</p>
                          <p className="text-white/50 text-xs mt-0.5">{fmt(o.created_at)} Â· {fmtT(o.created_at)}</p>
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

            {/* â”€â”€ FLOATING CART FAB â”€â”€ */}
            {orderSubTab === 'menu' && cart.length > 0 && !isCartOpen && (
              <div className="sticky bottom-2 z-30 pt-2">
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="w-full flex items-center justify-between bg-[#EAB308] text-black rounded-2xl px-5 py-3.5 active:scale-[0.97] transition-transform"
                  style={{ boxShadow: '0 8px 32px rgba(234,179,8,0.45)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-black/20 text-black font-black text-sm w-8 h-8 rounded-xl flex items-center justify-center">
                      {cartItemCount}
                    </span>
                    <span className="font-black text-sm uppercase tracking-widest">View Cart</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg">â‚¹{cartSubtotal.toLocaleString()}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            )}

          </div>
        )}

        {/* â•â• RESERVE â•â• */}
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
                  {[['Guests',`${success.guests} Persons`],['Amount Paid',`â‚¹${success.fee}`],['Payment ID',success.payment_id?.slice(-10)||'â€”']].map(([k,v])=>(
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs">{k}</span>
                      <span className="text-white font-bold text-sm">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="w-full rounded-2xl p-4 text-center" style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.25)' }}>
                  <p className="text-emerald-400 font-black text-sm">âœ… CONFIRMED</p>
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
                  <p className="text-gray-500 text-xs mt-0.5">Camp, Pune Â· Instant Confirmation</p>
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
                  {[['Guests',`${guests} Ã— â‚¹10`],['Reservation Fee',`â‚¹${fee}`],['PD Coins Reward','After eligible dine-in']].map(([k,v])=>(
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
                  {paying ? 'Opening Payment...' : `Reserve & Pay â‚¹${fee}`}
                </button>

                <div className="text-center">
                  <Link to="/reservation" className="text-xs underline" style={{ color:'rgba(234,179,8,0.45)' }}>
                    Schedule for a future date â†’
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* â•â• BOOKINGS â•â• */}
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
                      <span className="text-white font-bold text-sm">{r.date} Â· {r.time}</span>
                    </div>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${ok?'bg-emerald-500/20 text-emerald-300 border-emerald-500/40':bad?'bg-red-500/20 text-red-300 border-red-500/40':'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'}`}>
                      {ok?'âœ… Confirmed':bad?'Unavailable':'â³ Pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/65">
                    <span><UtensilsCrossed className="w-3.5 h-3.5 inline mr-1 text-white/80" />{r.guests} guests</span>
                    {r.occasion && <span>{r.occasion}</span>}
                    {r.amount_paid && <span style={{ color:GOLD }} className="font-bold">â‚¹{r.amount_paid} paid</span>}
                  </div>
                  {r.special_requests && <p className="text-white/60 text-xs italic">"{r.special_requests}"</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* â•â• COINS â•â• */}
        {tab === 'coins' && (
          <div className="p-4 space-y-4">
            <div className="rounded-3xl p-6 text-center" style={GLASS_GOLD_CARD}>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4" style={{ color:GOLD }}>PD Coins</p>
              {/* Brand coin asset */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#EAB308]/20 blur-xl scale-95" />
                  <img
                    src="/pd_coin.png"
                    alt="Persian Darbar Royal PD Coin"
                    className="w-32 h-32 object-contain relative select-none transition-transform hover:scale-105 duration-300"
                    style={{
                      filter: 'drop-shadow(0 10px 24px rgba(234,179,8,0.55)) drop-shadow(0 4px 12px rgba(0,0,0,0.7))'
                    }}
                  />
                </div>
              </div>
              <span className="text-5xl font-black text-white">{pdCoins.toLocaleString()}</span>
              <p className="font-bold text-sm mt-1 mb-3" style={{ color:'rgba(234,179,8,0.85)' }}>â‚¹{pdCoins.toLocaleString()} Value</p>
              <div className="w-16 h-px mx-auto mb-3" style={{ background:GB }} />
              <div className="flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-white/60">
                <span>Dine</span><span style={{color:GOLD}}>â—†</span><span>Earn</span><span style={{color:GOLD}}>â—†</span><span>Redeem</span><span style={{color:GOLD}}>â—†</span><span>Revisit</span>
              </div>
            </div>

            <div className="rounded-3xl p-5" style={GLASS_CARD}>
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color:GOLD }}>How It Works</p>
              {[
                [Calendar,    'Reserve a table (â‚¹10/person)', 'Required'],
                [UtensilsCrossed,'Dine at Persian Darbar',    'Eligible bill'],
                [TrendingUp,  'Earn 10% as PD Coins',        'Auto-credited'],
                [Gift,        'Redeem on next visit',         'â‚¹1 = 1 Coin'],
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

            {/* Expiry Alert Warning Banner if any coins are expiring within 15 days */}
            {expiringSoonCoins > 0 && (
              <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-amber-300 font-bold text-xs">
                      {expiringSoonCoins} PD Coins expire soon!
                    </p>
                    <p className="text-white/60 text-[10px] mt-0.5">
                      Coins expire after 45 days. Order now to redeem them.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTab('order')}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 text-black font-black text-[10px] uppercase tracking-wider shrink-0 active:scale-95 transition-transform shadow"
                >
                  Order Now â†’
                </button>
              </div>
            )}

            <div className="rounded-3xl p-5" style={GLASS_CARD}>
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color:GOLD }}>Transaction History</p>
              {(!customerProfile?.coins_history || customerProfile.coins_history.length === 0) ? (
                <div className="py-8 text-center">
                  <img src="/pd_coin.png" alt="" className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-white/60 text-sm">No transactions yet</p>
                  <p className="text-white/40 text-xs mt-1">Dine in or order online to start earning!</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {[...customerProfile.coins_history].reverse().map((txn, i) => {
                    const isEarned  = txn.type === 'earned';
                    const isExpired = txn.type === 'expired';
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isEarned
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isExpired
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {isEarned ? 'â–²' : isExpired ? 'âœ•' : 'â–¼'}
                          </div>
                          <div>
                            <p className="text-white text-xs font-bold">
                              {isEarned 
                                ? (txn.note?.includes('online') ? 'Online Order Cashback (10%)' : 'Dine-In Cashback (10%)') 
                                : isExpired
                                ? 'Expired (45-Day Policy)'
                                : 'Coins Redeemed'}
                            </p>
                            <p className="text-white/50 text-[11px]">
                              {txn.note || (isEarned ? `â‚¹${txn.bill_amount} bill` : isExpired ? '45-day auto expiry' : 'Discount')}
                            </p>
                            <p className="text-white/30 text-[9px] mt-0.5">{txn.timestamp ? new Date(txn.timestamp).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : ''}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-sm font-black ${isEarned ? 'text-emerald-400' : isExpired ? 'text-rose-400' : 'text-amber-400'}`}>
                            {isEarned ? `+${txn.coins}` : `-${txn.coins}`}
                          </span>
                          <p className="text-white/40 text-[9px]">Bal: {txn.balance_after}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button onClick={()=>setTab('reserve')}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] text-black active:scale-[0.98] transition-all"
              style={{ background:GOLD }}>
              Reserve &amp; Start Earning
            </button>
          </div>
        )}

        {/* â•â• PROFILE (Swiggy / Zomato Luxury Persian Darbar VIP Experience) â•â• */}
        {tab === 'profile' && (
          <div className="p-4 space-y-4 pb-14">

            {/* 1. ROYAL PRIVILEGE PASSPORT HERO CARD */}
            <div className="relative rounded-3xl p-6 overflow-hidden text-white"
              style={{
                background: 'linear-gradient(135deg, rgba(234,179,8,0.18) 0%, rgba(22,27,36,0.72) 45%, rgba(10,12,16,0.92) 100%)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1.5px solid rgba(234, 179, 8, 0.38)',
                boxShadow: '0 16px 40px 0 rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255,255,255,0.25)'
              }}>
              {/* Subtle luxury ambient glow */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#EAB308]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#EAB308]/10 rounded-full blur-2xl pointer-events-none" />

              {/* Passport Header Strip */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/15">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-[#EAB308]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#EAB308]">
                    Privilege Club Passport
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/15">
                  #PD-{(currentUser?.uid?.slice(-6) || 'ROYAL').toUpperCase()}
                </span>
              </div>

              {/* Avatar & Main Info */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full p-1 shadow-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #FDE047 0%, #EAB308 50%, #92400E 100%)',
                      boxShadow: '0 0 20px rgba(234,179,8,0.5)'
                    }}>
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="" className="w-full h-full rounded-full object-cover border-2 border-[#12161f]" />
                    ) : (
                      <div className="w-full h-full rounded-full flex items-center justify-center text-2xl font-bold bg-[#12161f] text-[#EAB308]">
                        {currentUser?.displayName?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#12161f] flex items-center justify-center text-white shadow-md" title="Active Member">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-black text-xl leading-tight truncate" style={{ fontFamily: "'Playfair Display',serif" }}>
                    {currentUser?.displayName || 'Royal Patron'}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#EAB308]/25 text-[#EAB308] border border-[#EAB308]/40">
                      {pdCoins > 500 ? 'â­ Royal Elite Member' : 'ðŸ‘‘ Royal Patron'}
                    </span>
                  </div>
                  <p className="text-white/65 text-xs mt-1 truncate">{currentUser?.email}</p>
                </div>
              </div>

              {/* Privilege Perks footer pill */}
              <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px] text-white/80">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#EAB308]" />
                  <span>10% Dine-In PD Coin Cashback</span>
                </span>
                <span className="text-[#EAB308] font-bold">Priority Seating</span>
              </div>
            </div>

            {/* 2. SWIGGY/ZOMATO 3-METRIC STATS & WALLET STRIP */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* PD Coins Wallet */}
              <button
                onClick={() => setTab('coins')}
                className="group relative rounded-3xl p-3.5 text-center transition-all duration-200 active:scale-95"
                style={GLASS_CARD}
              >
                <div className="w-10 h-10 rounded-2xl mx-auto mb-1.5 flex items-center justify-center p-1.5 bg-white/[0.05] border border-white/10">
                  <img src="/pd_coin.png" alt="PD Coin" className="w-7 h-7 drop-shadow" />
                </div>
                <p className="text-xl font-black text-white">{pdCoins.toLocaleString()}</p>
                <p className="text-[9px] text-[#EAB308] font-bold uppercase tracking-wider mt-0.5">PD Coins</p>
                <p className="text-[9px] text-white/50 mt-0.5">â‚¹{pdCoins} value â€º</p>
              </button>

              {/* Orders */}
              <button
                onClick={() => { setTab('order'); setOrderSubTab('history'); }}
                className="group relative rounded-3xl p-3.5 text-center transition-all duration-200 active:scale-95"
                style={GLASS_CARD}
              >
                <div className="w-10 h-10 rounded-2xl mx-auto mb-1.5 flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#EAB308]">
                  <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
                </div>
                <p className="text-xl font-black text-white">{orders.length}</p>
                <p className="text-[9px] text-[#EAB308] font-bold uppercase tracking-wider mt-0.5">Orders</p>
                <p className="text-[9px] text-white/50 mt-0.5">History â€º</p>
              </button>

              {/* Bookings */}
              <button
                onClick={() => setTab('reserve')}
                className="group relative rounded-3xl p-3.5 text-center transition-all duration-200 active:scale-95"
                style={GLASS_CARD}
              >
                <div className="w-10 h-10 rounded-2xl mx-auto mb-1.5 flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#EAB308]">
                  <Calendar className="w-5 h-5 stroke-[1.8]" />
                </div>
                <p className="text-xl font-black text-white">{reservations.length}</p>
                <p className="text-[9px] text-[#EAB308] font-bold uppercase tracking-wider mt-0.5">Bookings</p>
                <p className="text-[9px] text-white/50 mt-0.5">Reserve â€º</p>
              </button>
            </div>

            {/* 3. GROUPED LIST: FOOD & DINING */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#EAB308] px-2">
                Food &amp; Dining Experience
              </p>
              <div className="rounded-3xl overflow-hidden divide-y divide-white/10" style={GLASS_CARD}>
                {/* Past Orders */}
                <button
                  onClick={() => { setTab('order'); setOrderSubTab('history'); }}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#EAB308] shrink-0">
                      <Clock className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Past Orders &amp; Receipts</p>
                      <p className="text-white/60 text-xs mt-0.5">
                        {activeOrders.length > 0 ? `${activeOrders.length} active order in progress` : `${orders.length} past feast${orders.length === 1 ? '' : 's'}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeOrders.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                    )}
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </div>
                </button>

                {/* Table Bookings */}
                <button
                  onClick={() => setTab('reserve')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#EAB308] shrink-0">
                      <Calendar className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Royal Table Reservation</p>
                      <p className="text-white/60 text-xs mt-0.5">
                        {activeRes.length > 0 ? `${activeRes.length} upcoming booking` : 'Book in advance for family & feasts'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>

                {/* Browse Royal Menu */}
                <button
                  onClick={() => { setTab('order'); setOrderSubTab('menu'); }}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#EAB308] shrink-0">
                      <UtensilsCrossed className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Explore Royal Menu</p>
                      <p className="text-white/60 text-xs mt-0.5">Biryanis, Mughlai Starters, Raan &amp; Desserts</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>
              </div>
            </div>

            {/* 4. GROUPED LIST: SAVED DETAILS & ADDRESSES */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#EAB308] px-2">
                Saved Details &amp; Addresses
              </p>
              <div className="rounded-3xl overflow-hidden divide-y divide-white/10" style={GLASS_CARD}>
                {/* Mobile Number Row */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#EAB308] shrink-0">
                        <Phone className="w-5 h-5 stroke-[1.8]" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Primary Mobile Number</p>
                        <p className="text-white/60 text-xs mt-0.5">
                          {customerProfile?.phone ? `+91 ${customerProfile.phone}` : 'Not linked yet'}
                        </p>
                      </div>
                    </div>
                    {!editPhone && (
                      <button
                        onClick={() => setEditPhone(true)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#EAB308] hover:text-yellow-300 py-1.5 px-3 rounded-xl hover:bg-white/[0.06] active:scale-95 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{customerProfile?.phone ? 'Edit' : 'Add'}</span>
                      </button>
                    )}
                  </div>

                  {/* Inline edit phone */}
                  {editPhone && (
                    <form onSubmit={savePhone} className="pt-2 space-y-2.5">
                      <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 bg-white/10 border border-[#EAB308]/40">
                        <span className="text-white/60 text-sm font-mono">+91</span>
                        <input
                          type="tel"
                          value={phoneVal}
                          maxLength="10"
                          autoFocus
                          onChange={e => setPhoneVal(e.target.value)}
                          placeholder="Enter 10-digit mobile number"
                          className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-white/40"
                        />
                      </div>
                      {phoneErr && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{phoneErr}</p>}
                      {phoneOk && <p className="text-emerald-400 text-xs flex items-center gap-1"><Check className="w-3.5 h-3.5" />Phone saved!</p>}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={phoneSav}
                          className="flex-1 py-2.5 rounded-xl text-black font-bold text-xs bg-[#EAB308] active:scale-95 disabled:opacity-50 shadow-md"
                        >
                          {phoneSav ? 'Saving...' : 'Save Number'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditPhone(false); setPhoneVal(customerProfile?.phone || ''); setPhoneErr(''); }}
                          className="px-4 py-2.5 rounded-xl text-white/70 text-xs bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Delivery Address Row */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#EAB308] shrink-0">
                        <MapPin className="w-5 h-5 stroke-[1.8]" />
                      </div>
                      <div className="max-w-[200px]">
                        <p className="text-white font-bold text-sm">Delivery Address</p>
                        <p className="text-white/60 text-xs mt-0.5 truncate">
                          {customerProfile?.address || 'Save address for 1-tap checkout'}
                        </p>
                      </div>
                    </div>
                    {!editAddr && (
                      <button
                        onClick={() => setEditAddr(true)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#EAB308] hover:text-yellow-300 py-1.5 px-3 rounded-xl hover:bg-white/[0.06] active:scale-95 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{customerProfile?.address ? 'Edit' : 'Add'}</span>
                      </button>
                    )}
                  </div>

                  {/* Inline edit address */}
                  {editAddr && (
                    <form onSubmit={saveAddress} className="pt-2 space-y-2.5">
                      <textarea
                        value={addrVal}
                        rows={2}
                        autoFocus
                        onChange={e => setAddrVal(e.target.value)}
                        placeholder="House/Flat, Street, Area, Pune"
                        className="w-full bg-white/10 text-white text-xs p-3 rounded-2xl border border-[#EAB308]/40 focus:outline-none placeholder-white/40 resize-none"
                      />
                      {addrErr && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{addrErr}</p>}
                      {addrOk && <p className="text-emerald-400 text-xs flex items-center gap-1"><Check className="w-3.5 h-3.5" />Address saved!</p>}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={addrSav}
                          className="flex-1 py-2.5 rounded-xl text-black font-bold text-xs bg-[#EAB308] active:scale-95 disabled:opacity-50 shadow-md"
                        >
                          {addrSav ? 'Saving...' : 'Save Address'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditAddr(false); setAddrVal(customerProfile?.address || ''); setAddrErr(''); }}
                          className="px-4 py-2.5 rounded-xl text-white/70 text-xs bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Payment Methods */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#EAB308] shrink-0">
                      <ShieldCheck className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Payment Methods</p>
                      <p className="text-white/60 text-xs mt-0.5">UPI, Cards &amp; Cash on Delivery</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                    <span>Active</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 5. GROUPED LIST: CONCIERGE & SUPPORT */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#EAB308] px-2">
                Persian Darbar Concierge
              </p>
              <div className="rounded-3xl overflow-hidden divide-y divide-white/10" style={GLASS_CARD}>
                {/* WhatsApp Chat */}
                <button
                  onClick={() => window.open('https://wa.me/917028033763?text=Hello%20Persian%20Darbar,%20I%20would%20like%20assistance', '_blank')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#EAB308] shrink-0">
                      <MessageSquare className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">WhatsApp Concierge</p>
                      <p className="text-white/60 text-xs mt-0.5">Direct banquet bookings, special orders &amp; support</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/40" />
                </button>

                {/* Call Restaurant */}
                <button
                  onClick={() => window.location.href = 'tel:+912026130000'}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#EAB308] shrink-0">
                      <Phone className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Call Camp, Pune Desk</p>
                      <p className="text-white/60 text-xs mt-0.5">+91 20 2613 0000 Â· Open 11:00 AM - 1:00 AM</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>

                {/* Share App */}
                <button
                  onClick={handleShareApp}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#EAB308] shrink-0">
                      <Share2 className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Share Persian Darbar</p>
                      <p className="text-white/60 text-xs mt-0.5">
                        {copiedLink ? 'âœ“ Link copied to clipboard!' : 'Invite friends & family to the royal experience'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>
              </div>
            </div>

            {/* 6. SIGN OUT CARD (With Confirmation) */}
            <div className="rounded-3xl p-4 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(30, 15, 18, 0.50) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.28)',
                backdropFilter: 'blur(20px)'
              }}>
              {!showSignOutConfirm ? (
                <button
                  onClick={() => setShowSignOutConfirm(true)}
                  className="w-full flex items-center justify-center gap-2.5 py-2 font-bold text-red-300 text-sm active:scale-95 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </button>
              ) : (
                <div className="space-y-3 text-center">
                  <p className="text-white font-bold text-sm">Are you sure you want to sign out?</p>
                  <p className="text-white/60 text-xs">You will need to sign in again to view your coins &amp; orders.</p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={async () => { await signOutCustomer(); navigate('/'); }}
                      className="flex-1 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-red-500 text-white shadow-lg active:scale-95 transition-all"
                    >
                      Yes, Sign Out
                    </button>
                    <button
                      onClick={() => setShowSignOutConfirm(false)}
                      className="flex-1 py-2.5 rounded-2xl font-bold text-xs bg-white/10 text-white/80 active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 7. BRAND HERITAGE FOOTER */}
            <div className="text-center pt-2 pb-4 space-y-1 select-none">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#EAB308]">
                PERSIAN DARBAR
              </p>
              <p className="text-[9px] text-white/40 tracking-wider">
                Serving Royal Mughlai Cuisine Since 1976 Â· Camp, Pune
              </p>
              <p className="text-[8px] text-white/30 font-mono pt-1">
                Version 2.4.0 (Privilege Edition)
              </p>
            </div>

          </div>
        )}

      </div>

      {/* â•â•â• IN-APP CART & CHECKOUT DRAWER (Glassmorphism) â•â•â• */}
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
                      <p className="text-[#EAB308] text-xs font-semibold">â‚¹{item.price} each</p>
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
                        â‚¹{(item.price * item.quantity).toLocaleString()}
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
                      <span>{detectingLoc ? 'Detecting...' : distanceKm ? `ðŸ“ ${distanceKm} km away` : 'Detect Range'}</span>
                    </button>
                    <span className="text-[11px] text-white/60">
                      {distanceKm === null ? 'Within 5km: Free' : distanceKm <= 5 ? 'âœ… Free Delivery' : distanceKm <= 20 ? 'â‚¹60 Delivery Fee' : 'âŒ Out of range (>20km)'}
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
                    ðŸ’µ Cash on {orderType === 'TAKEAWAY' ? 'Pickup' : 'Delivery'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('online')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      payMethod === 'online' ? 'bg-[#EAB308] text-black shadow' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    ðŸ’³ Online / UPI
                  </button>
                </div>
              </div>

              {/* ðŸª™ PD Coins Redemption Card */}
              {pdCoins > 0 && (
                <div 
                  className="rounded-2xl p-3.5 transition-all border"
                  style={{
                    background: applyCoins && maxRedeemableCoins > 0
                      ? 'linear-gradient(135deg, rgba(234,179,8,0.18) 0%, rgba(20,20,25,0.6) 100%)'
                      : 'rgba(255,255,255,0.06)',
                    borderColor: applyCoins && maxRedeemableCoins > 0
                      ? 'rgba(234,179,8,0.45)'
                      : 'rgba(255,255,255,0.12)'
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#EAB308]/20 flex items-center justify-center shrink-0 border border-[#EAB308]/30">
                        <img src="/pd_coin.png" alt="coin" className="w-5 h-5 object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-xs font-bold">Redeem PD Coins</span>
                          <span className="text-[10px] text-[#EAB308] font-black bg-[#EAB308]/15 px-1.5 py-0.5 rounded-full border border-[#EAB308]/25">
                            {pdCoins} Bal
                          </span>
                        </div>
                        {cartSubtotal < 300 ? (
                          <p className="text-white/50 text-[10px] mt-0.5">
                            Add items worth â‚¹{300 - cartSubtotal} more to redeem (Min â‚¹300)
                          </p>
                        ) : (
                          <p className="text-white/60 text-[10px] mt-0.5">
                            Max 25% bill cap: Save up to <span className="text-[#EAB308] font-bold">â‚¹{maxRedeemableCoins}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {cartSubtotal >= 300 && (
                      <button
                        type="button"
                        onClick={() => setApplyCoins(prev => !prev)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          applyCoins
                            ? 'bg-[#EAB308] text-black shadow-lg shadow-[#EAB308]/30 scale-105'
                            : 'bg-white/10 text-white/80 hover:bg-white/15'
                        }`}
                      >
                        {applyCoins ? 'Applied âœ“' : 'Apply'}
                      </button>
                    )}
                  </div>

                  {applyCoins && maxRedeemableCoins > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Saving â‚¹{coinsDiscount} on this order!
                      </span>
                      <span className="text-white/50">
                        +Earn <span className="text-[#EAB308] font-bold">{coinsEarnable}</span> new coins
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Bill Breakdown */}
              <div className="rounded-2xl p-4 space-y-2 text-xs" style={GLASS_CARD_SM}>
                <div className="flex justify-between text-white/70">
                  <span>Items Subtotal</span>
                  <span>â‚¹{cartSubtotal.toLocaleString()}</span>
                </div>
                {coinsApplied > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      ðŸª™ PD Coins Discount
                    </span>
                    <span>-â‚¹{coinsDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/70">
                  <span>Delivery Fee</span>
                  <span>{cartDeliveryFee === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : `â‚¹${cartDeliveryFee}`}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>GST & Restaurant Taxes (5%)</span>
                  <span>â‚¹{cartTaxes.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between font-black text-sm text-white">
                  <span>Total Amount</span>
                  <span className="text-[#EAB308] text-base">â‚¹{cartTotal.toLocaleString()}</span>
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
                {placingOrder ? 'Placing Order...' : `Confirm Order Â· â‚¹${cartTotal.toLocaleString()}`}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* â•â•â• BOTTOM NAV (Frosted Glass Bar) â•â•â• */}
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
