import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useToast } from '../../hooks/use-toast';
import API_BASE from '../../lib/config';
import { lsCache, memCache } from '../../lib/cache';

import {
  ShoppingBag, Calendar, Clock, Phone,
  Edit2, Check, ArrowRight, LogOut, AlertCircle,
  Truck, UtensilsCrossed, RotateCw,
  Eye, User, ChevronRight, Crown, Home, Plus, X,
  Star, Minus, Zap, Gift, TrendingUp, BookOpen,
  Search, MapPin, CheckCircle2, Trash2, Sparkles,
  ShieldCheck, MessageSquare, ExternalLink, Share2,
  Tag, Flame, Percent, ChefHat, Repeat, Leaf
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
  const { toast } = useToast();
  const navigate   = useNavigate();
  const rzReady    = useRazorpay();
  const prevResRef = useRef([]);

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

  /* ── Offers & Promotions State ── */
  const [offers, setOffers]               = useState([]);
  const [activeOfferIdx, setActiveOfferIdx] = useState(0);

  /* Fetch active offers from server */
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/offers`);
        if (res.ok) {
          const data = await res.json();
          setOffers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load offers:", err);
      }
    };
    fetchOffers();
  }, []);

  /* Auto-slide offers carousel every 5 seconds */
  useEffect(() => {
    if (offers.length <= 1) return;
    const interval = setInterval(() => {
      setActiveOfferIdx((prev) => (prev + 1) % offers.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [offers.length]);

  const handleOfferClick = (offer) => {
    if (!offer) return;
    if (offer.action === 'reserve') {
      setTab('reserve');
    } else if (offer.action === 'order') {
      setTab('order');
    } else if (offer.action === 'coupon' && offer.coupon_code) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(offer.coupon_code);
      }
      toast({
        title: "🎟️ Coupon Copied!",
        description: `Code ${offer.coupon_code} copied to clipboard!`,
      });
      setTab('order');
    } else {
      setTab('order');
    }
  };

  /* ── Phase 2: Category, Veg Filter & Re-order State ── */
  const [vegOnly, setVegOnly]                     = useState(false);
  const [coupons, setCoupons]                     = useState([]);
  const [couponCodeInput, setCouponCodeInput]     = useState('');
  const [appliedCoupon, setAppliedCoupon]         = useState(null);
  const [couponDiscount, setCouponDiscount]       = useState(0);
  const [couponError, setCouponError]             = useState('');
  const [validatingCoupon, setValidatingCoupon]   = useState(false);

  /* Cooking & Delivery Customization */
  const [cookingTags, setCookingTags]             = useState([]);
  const [cookingNote, setCookingNote]             = useState('');
  const [deliveryTags, setDeliveryTags]           = useState([]);

  /* Fetch Public Coupons */
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/coupons/public`);
        if (res.ok) {
          const data = await res.json();
          setCoupons(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load coupons:", err);
      }
    };
    fetchCoupons();
  }, []);

  /* Apply Coupon Code */
  const applyCoupon = async (codeToTry) => {
    const code = (codeToTry || couponCodeInput).trim().toUpperCase();
    if (!code) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await fetch(`${API_BASE}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, order_value: cartSubtotal })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid coupon code');
      }
      setAppliedCoupon({ code, ...data });
      setCouponDiscount(data.discount || 0);
      setCouponCodeInput(code);
      toast({
        title: `🎉 Coupon Applied: ${code}`,
        description: `You saved ₹${data.discount}!`,
      });
    } catch (err) {
      setCouponError(err.message || 'Coupon could not be applied');
      toast({
        title: 'Coupon Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCodeInput('');
    setCouponError('');
  };

  /* Quick Re-Order Last Order */
  const handleReorder = (pastOrder) => {
    if (!pastOrder || !pastOrder.items || pastOrder.items.length === 0) return;
    const reorderedItems = pastOrder.items.map(item => {
      const match = menu.find(m => String(m._id) === String(item.item_id) || m.name === item.name);
      return {
        _id: match ? match._id : (item.item_id || item._id || String(Math.random())),
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        image: match?.image || item.image || '/no-image.png',
        category: match?.category || 'Main Course',
        is_veg: match?.is_veg ?? match?.veg,
      };
    });
    setCart(reorderedItems);
    setTab('order');
    setOrderSubTab('menu');
    setIsCartOpen(true);
    toast({
      title: '⚡ Feast Reloaded!',
      description: `Loaded ${reorderedItems.length} dishes from Order #${pastOrder.order_id?.slice(-8)} into your cart!`,
    });
  };

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

  /* ─── Fetch Menu items (cached 10 min to reduce reads) ─── */
  const fetchMenu = useCallback(async (forceRefresh = false) => {
    const MENU_KEY = 'menu_v1';
    const MENU_TTL = 10 * 60 * 1000;
    if (!forceRefresh) {
      const memHit = memCache.get(MENU_KEY);
      if (memHit) { setMenu(memHit); setMenuLoading(false); return; }
      const lsHit = lsCache.get(MENU_KEY);
      if (lsHit) { setMenu(lsHit); setMenuLoading(false); memCache.set(MENU_KEY, lsHit, 2 * 60 * 1000); return; }
    }
    setMenuLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/menu`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : [];
        setMenu(items);
        lsCache.set(MENU_KEY, items, MENU_TTL);
        memCache.set(MENU_KEY, items, 2 * 60 * 1000);
      }
    } catch (err) { console.error('Menu load error:', err); }
    finally { setMenuLoading(false); }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  useEffect(() => { if (customerProfile?.phone) setPhoneVal(customerProfile.phone); }, [customerProfile]);

  /* â”€â”€ Fetch orders â”€â”€ */
  const fetchOrders = useCallback(async () => {
    if (!idToken) return;
    setLoadO(true);
    try { const r = await fetchWithAuth(`${API_BASE}/api/customer/orders`); if (r.ok) setOrders(await r.json() || []); }
    catch(e) { console.error(e); } finally { setLoadO(false); }
  }, [idToken, fetchWithAuth]);

  /* â”€â”€ Fetch reservations â”€â”€ */
  const fetchRes = useCallback(async (isSilent = false) => {
    if (!idToken) return;
    if (!isSilent) setLoadR(true);
    try {
      const r = await fetchWithAuth(`${API_BASE}/api/customer/reservations`);
      if (r.ok) {
        const data = await r.json() || [];
        if (prevResRef.current.length > 0) {
          data.forEach(curr => {
            const prev = prevResRef.current.find(p => (p.id || p._id) === (curr.id || curr._id));
            if (prev && prev.status === 'pending' && curr.status === 'confirmed') {
              toast({
                title: "🎉 Table Reserved!",
                description: `Table ${curr.table_number ? curr.table_number : 'Assigned'} is confirmed for ${curr.date} at ${curr.time}!`,
              });
            }
          });
        }
        prevResRef.current = data;
        setRes(data);
      }
    }
    catch(e) { console.error(e); } finally { if (!isSilent) setLoadR(false); }
  }, [idToken, fetchWithAuth, toast]);

  /* ─── Table polling every 90s (replaces SSE — saves ~95% reads) ─── */
  useEffect(() => {
    const TABLE_KEY = 'tables_v1';
    const TABLE_TTL = 90 * 1000;
    const fetchTables = async (useCache = false) => {
      if (useCache) {
        const cached = lsCache.get(TABLE_KEY);
        if (cached) { setTables(cached); setLoadT(false); return; }
      }
      try {
        const r = await fetch(`${API_BASE}/api/tables`);
        if (r.ok) {
          const d = await r.json();
          if (Array.isArray(d)) { setTables(d); lsCache.set(TABLE_KEY, d, TABLE_TTL); }
        }
      } catch {} finally { setLoadT(false); }
    };
    fetchTables(true);
    const t = setInterval(() => fetchTables(false), TABLE_TTL);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { if (idToken) { fetchOrders(); fetchRes(); } }, [idToken, fetchOrders, fetchRes]);

  // Polling reservations: every 4 seconds if pending, every 15 seconds otherwise
  useEffect(() => {
    if (!idToken) return;
    const hasPending = reservations.some(r => r.status === 'pending');
    const intervalTime = hasPending ? 4000 : 15000;
    const interval = setInterval(() => {
      fetchRes(true);
    }, intervalTime);
    return () => clearInterval(interval);
  }, [idToken, reservations, fetchRes]);

  // Immediate refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (idToken) {
        fetchRes(true);
        fetchOrders();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [idToken, fetchRes, fetchOrders]);

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

  /* ── Status badge ── */
  const badge = (s) => ({
    placed:           <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">Placed</span>,
    accepted:         <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Accepted</span>,
    preparing:        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 animate-pulse">Preparing 🔥</span>,
    ready:            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Ready</span>,
    out_for_delivery: <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">On way 🛵</span>,
    delivered:        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">Delivered ✔</span>,
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

  /* ── In-App Cart & Ordering Calculations (Phase 2 Enhanced) ── */
  const CATEGORY_META = {
    All: { icon: '✨', title: 'All', desc: 'Royal Menu' },
    Biryani: { icon: '🍗', title: 'Biryani', desc: 'Dum & Saffron' },
    Kebabs: { icon: '🍢', title: 'Kebabs', desc: 'Tandoor & Seekh' },
    Mughlai: { icon: '🥘', title: 'Mughlai', desc: 'Shahi Gravies' },
    'Main Course': { icon: '🍛', title: 'Gravies', desc: 'Rich Curries' },
    Starters: { icon: '🥟', title: 'Starters', desc: 'Appetizers' },
    Breads: { icon: '🫓', title: 'Breads', desc: 'Roti & Naan' },
    Desserts: { icon: '🍮', title: 'Desserts', desc: 'Shahi Meetha' },
    Beverages: { icon: '🍹', title: 'Drinks', desc: 'Chai & Sharbats' },
  };

  const menuCategories = ['All', ...new Set(menu.map(i => i.category).filter(Boolean))];
  
  const filteredMenuItems = menu.filter(item => {
    const matchesCat = selectedCat === 'All' || item.category === selectedCat;
    const matchesSearch = !searchQuery.trim() || 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const isVeg = item.is_veg !== false && !item.category?.toLowerCase().includes('non') && item.veg !== false;
    const matchesVeg = !vegOnly || isVeg;
    return matchesCat && matchesSearch && matchesVeg && item.available !== false;
  });

  const chefsSpecials = useMemo(() => {
    return menu.filter(item => item.popular || (item.rating && item.rating >= 4.8)).slice(0, 8);
  }, [menu]);

  const latestOrder = orders && orders.length > 0 ? orders[0] : null;

  const cartItemCount   = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal    = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const freeDeliveryThreshold = 500;
  const isFreeDeliveryEligible = cartSubtotal >= freeDeliveryThreshold;
  const freeDeliveryProgress = Math.min(100, (cartSubtotal / freeDeliveryThreshold) * 100);
  const cartDeliveryFee = orderType === 'TAKEAWAY' ? 0 : isFreeDeliveryEligible ? 0 : (distanceKm !== null && distanceKm > 10 ? 60 : 35);
  const cartTaxes       = Math.round(cartSubtotal * 0.05);

  /* ── PD Coins & Coupon Combined Discounts ── */
  const maxRedeemableCoins = (cartSubtotal >= 300 && pdCoins > 0)
    ? Math.min(pdCoins, Math.floor(cartSubtotal * 0.25))
    : 0;
  const coinsApplied     = (applyCoins && maxRedeemableCoins > 0) ? maxRedeemableCoins : 0;
  const coinsDiscount    = coinsApplied;
  const totalDiscount    = coinsDiscount + (couponDiscount || 0);
  const netSubtotal      = Math.max(0, cartSubtotal - totalDiscount);
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
    const combinedCookingNotes = [...cookingTags, cookingNote.trim()].filter(Boolean).join(', ') || null;
    const combinedDeliveryNotes = deliveryTags.join(', ') || null;

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
        special_instructions: combinedCookingNotes
      })),
      subtotal: cartSubtotal,
      discount: totalDiscount,
      coins_to_redeem: coinsApplied,
      coins_discount: coinsDiscount,
      delivery_fee: cartDeliveryFee,
      taxes: cartTaxes,
      total: cartTotal,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      cooking_instructions: combinedCookingNotes,
      delivery_instructions: combinedDeliveryNotes
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
            {/* ── Dynamic Offers Carousel (Admin Controlled) OR Classic Hero (Screenshot 3) ── */}
            {offers && offers.length > 0 ? (
              <div className="mx-4 mt-3 relative">
                {/* Carousel Card */}
                <div
                  onClick={() => handleOfferClick(offers[activeOfferIdx])}
                  className="relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 shadow-2xl active:scale-[0.99] group"
                  style={{
                    border: '1px solid rgba(234, 179, 8, 0.40)',
                    boxShadow: '0 10px 36px 0 rgba(0, 0, 0, 0.45), 0 0 24px rgba(234, 179, 8, 0.15)',
                    minHeight: '178px',
                  }}
                >
                  {/* Background Image / Persian Darbar Art */}
                  <img
                    key={offers[activeOfferIdx]?.id || activeOfferIdx}
                    src={offers[activeOfferIdx]?.image_url || '/dynamic_images/offer_royal_feast.jpg'}
                    alt={offers[activeOfferIdx]?.title}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = '/dynamic_images/offer_royal_feast.jpg';
                    }}
                  />

                  {/* Dark Vignette Overlay for Crisp Typography */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to right, rgba(5, 12, 16, 0.94) 0%, rgba(5, 12, 16, 0.70) 58%, rgba(5, 12, 16, 0.30) 100%)',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35" />

                  {/* Banner Content */}
                  <div className="relative z-10 p-5 flex flex-col justify-between h-full min-h-[178px]">
                    <div>
                      {/* Top Row: Persian Darbar Tag & Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow"
                          style={{
                            background: GOLD,
                            color: '#000',
                          }}
                        >
                          {offers[activeOfferIdx]?.badge_text || 'SPECIAL OFFER'}
                        </span>
                        <p className="text-[10px] font-black tracking-[0.25em] uppercase text-right" style={{ color: GOLD }}>
                          PERSIAN DARBAR
                        </p>
                      </div>

                      {/* Title */}
                      <h2
                        className="text-white text-xl sm:text-2xl font-black leading-tight max-w-[82%]"
                        style={{ fontFamily: "'Playfair Display',Georgia,serif" }}
                      >
                        {offers[activeOfferIdx]?.title}
                      </h2>

                      {/* Subtitle */}
                      <p className="text-xs font-semibold mt-1 text-gray-200 line-clamp-1 max-w-[82%]">
                        {offers[activeOfferIdx]?.subtitle}
                      </p>
                    </div>

                    {/* Bottom Row: CTA Button + Slide Indicators */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow hover:bg-white/25 transition">
                        <span>
                          {offers[activeOfferIdx]?.action === 'reserve' ? 'Book Table' : 'Order Now'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#EAB308]" />
                      </div>

                      {/* Dots / Indicators */}
                      {offers.length > 1 && (
                        <div
                          className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {offers.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setActiveOfferIdx(i)}
                              className={`transition-all rounded-full ${
                                i === activeOfferIdx
                                  ? 'w-5 h-1.5 bg-[#EAB308]'
                                  : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Hero banner card (Frosted Glass) - Screenshot 3 Classic Screen */
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
            )}

            <div className="px-4 pt-3 space-y-4">

              {/* ── Quick Reorder (Last Feast) ── */}
              {latestOrder && (
                <div className="rounded-3xl p-4 transition-all relative overflow-hidden border border-[#EAB308]/30 shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(20, 24, 30, 0.65) 100%)',
                    backdropFilter: 'blur(20px)',
                  }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#EAB308]/20 flex items-center justify-center text-[#EAB308]">
                        <Repeat className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-white">Order Again · Last Feast</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">#{latestOrder.order_id?.slice(-8)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">
                        {latestOrder.items?.map(i => `${i.quantity}x ${i.name}`).slice(0, 3).join(', ')}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        ₹{latestOrder.total?.toFixed(0)} · In-House Persian Darbar Delivery
                      </p>
                    </div>
                    <button
                      onClick={() => handleReorder(latestOrder)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#EAB308] text-black font-black text-xs active:scale-95 transition shadow-md shadow-[#EAB308]/20 shrink-0 flex items-center gap-1.5"
                    >
                      <Repeat className="w-3 h-3" /> Re-Order
                    </button>
                  </div>
                </div>
              )}

              {/* ── Chef's Royal Specials Carousel (Home Tab) ── */}
              {chefsSpecials.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <ChefHat className="w-4 h-4 text-[#EAB308]" />
                      <span className="text-xs font-black uppercase tracking-widest text-white">Chef's Royal Specials</span>
                    </div>
                    <button
                      onClick={() => { setTab('order'); setOrderSubTab('menu'); }}
                      className="text-[11px] font-bold text-[#EAB308] hover:underline flex items-center gap-0.5"
                    >
                      Full Menu <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar select-none">
                    {chefsSpecials.map(dish => {
                      const inCart = cart.find(c => c._id === dish._id);
                      const qty = inCart ? inCart.quantity : 0;
                      const isVeg = dish.is_veg !== false && !dish.category?.toLowerCase().includes('non') && dish.veg !== false;
                      return (
                        <div
                          key={dish._id}
                          className="shrink-0 w-44 rounded-2xl overflow-hidden border border-white/10 bg-[#0e2129]/80 shadow-lg flex flex-col justify-between"
                        >
                          <div className="relative h-24 w-full bg-black/40">
                            <img
                              src={dish.image || '/no-image.png'}
                              alt={dish.name}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.src = '/no-image.png'; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className={`absolute top-2 left-2 w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${isVeg ? 'border-green-500 bg-[#0f2933]' : 'border-red-500 bg-[#0f2933]'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                            </div>
                            <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-[#EAB308] text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-[#EAB308]" /> {dish.rating || 4.8}
                            </span>
                          </div>
                          <div className="p-2.5 flex flex-col justify-between flex-1">
                            <div>
                              <p className="text-white font-bold text-xs truncate">{dish.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{dish.serves || 'Serves 1-2'}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                              <span className="text-[#EAB308] font-black text-xs">₹{dish.price}</span>
                              {qty === 0 ? (
                                <button
                                  onClick={() => addToCart(dish)}
                                  className="px-2.5 py-1 rounded-lg bg-[#EAB308] text-black font-black text-[10px] active:scale-90 transition"
                                >
                                  + ADD
                                </button>
                              ) : (
                                <div className="flex items-center gap-1 bg-[#EAB308] rounded-lg px-1 py-0.5">
                                  <button onClick={() => updateCartQty(dish._id, -1)} className="w-4 h-4 text-black text-xs font-bold">-</button>
                                  <span className="text-black font-black text-[10px] px-1">{qty}</span>
                                  <button onClick={() => updateCartQty(dish._id, 1)} className="w-4 h-4 text-black text-xs font-bold">+</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                            title={`Table ${tNum} — ${isOccupied ? 'Occupied (locked)' : s}`}
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

              {/* ── Active Live Order Banner (Persian Darbar In-House Fleet Tracker) ── */}
              {activeOrders.length > 0 && (() => {
                const live = activeOrders[0];
                const isRiderOut = live.status === 'out_for_delivery';
                const isPrep = live.status === 'preparing' || live.status === 'accepted';
                const mIdx = live.status === 'placed' ? 0 : isPrep ? 1 : isRiderOut ? 2 : live.status === 'delivered' ? 3 : 0;

                return (
                  <div
                    className="rounded-3xl p-4 border relative overflow-hidden transition-all"
                    style={{
                      background: 'linear-gradient(135deg, rgba(14, 22, 28, 0.95) 0%, rgba(8, 14, 18, 0.98) 100%)',
                      borderColor: isRiderOut ? 'rgba(234, 179, 8, 0.45)' : 'rgba(255, 255, 255, 0.18)',
                      backdropFilter: 'blur(24px)',
                      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)'
                    }}
                  >
                    {/* Header line */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#EAB308]/20 flex items-center justify-center text-[#EAB308] border border-[#EAB308]/30">
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#EAB308]">
                            Persian Darbar Private Fleet
                          </p>
                          <p className="text-[9px] text-white/50">
                            Live Order Tracking · In-House Fleet
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {live.bill_number && (
                          <span className="text-[10px] font-mono font-bold text-[#EAB308] bg-[#EAB308]/15 px-2 py-0.5 rounded-full border border-[#EAB308]/30">
                            #{live.bill_number}
                          </span>
                        )}
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                    </div>

                    {/* Status & ETA */}
                    <div className="flex items-center justify-between gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 mb-3">
                      <div>
                        <p className="text-white font-bold text-xs">
                          {isRiderOut
                            ? '🛵 Dispatched with In-House Rider'
                            : isPrep
                            ? '👨‍🍳 Royal Kitchen Crafting Fresh Feast'
                            : '📝 Order Confirmed & Heralded'}
                        </p>
                        <p className="text-white/60 text-[11px] truncate mt-0.5 max-w-[200px] sm:max-w-xs">
                          {live.items?.map(i => `${i.quantity}x ${i.name}`).slice(0, 2).join(', ')}
                        </p>
                      </div>

                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-xl border border-emerald-500/30 shrink-0">
                        {isRiderOut ? 'ARRIVING ~15-20M' : 'EST. ~25-35M'}
                      </span>
                    </div>

                    {/* 4-Step Milestone Progress Bar */}
                    <div className="mb-3 px-1">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                        <span className={mIdx >= 0 ? 'text-[#EAB308]' : ''}>1. Placed</span>
                        <span className={mIdx >= 1 ? 'text-[#EAB308]' : ''}>2. Kitchen</span>
                        <span className={mIdx >= 2 ? 'text-[#EAB308]' : ''}>3. PD Fleet</span>
                        <span className={mIdx >= 3 ? 'text-emerald-400' : ''}>4. Delivered</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#ca8a04] via-[#EAB308] to-emerald-400 transition-all duration-700"
                          style={{ width: `${Math.max(25, (mIdx + 1) * 25)}%` }}
                        />
                      </div>
                    </div>

                    {/* Rider Info if assigned (Porter or Persian Darbar Fleet) */}
                    {live.porter_order_id ? (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 mb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] font-bold border border-orange-500/30">
                            ⚡
                          </div>
                          <div>
                            <p className="text-white font-bold text-xs leading-none">
                              {live.porter_rider_name || 'Porter Courier'}
                            </p>
                            <p className="text-orange-400 text-[9px] mt-0.5 font-medium">
                              Porter Express Delivery {live.porter_status ? `• ${live.porter_status.replace(/_/g, ' ')}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {live.porter_rider_phone && (
                            <a
                              href={`tel:${live.porter_rider_phone}`}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 active:scale-95 transition"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </a>
                          )}
                          {live.porter_tracking_url && (
                            <a
                              href={live.porter_tracking_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 text-[10px] font-bold border border-orange-500/30 flex items-center gap-1 active:scale-95 transition"
                            >
                              <span>Map</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ) : live.delivery_partner_name ? (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 mb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold border border-emerald-500/30">
                            {live.delivery_partner_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-bold text-xs leading-none">{live.delivery_partner_name}</p>
                            <p className="text-white/40 text-[9px] mt-0.5">{live.delivery_partner_vehicle || 'PD Fleet Rider'}</p>
                          </div>
                        </div>

                        {live.delivery_partner_phone && (
                          <a
                            href={`tel:${live.delivery_partner_phone}`}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 active:scale-95 transition"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                    ) : null}

                    {/* CTA Link to full /track screen */}
                    <Link
                      to={`/track?order_id=${live.order_id}`}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ca8a04] to-[#EAB308] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <span>Track Live Feast Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })()}

              {/* Active reservation banner */}
              {activeRes.length > 0 && (
                <Link to="/customer/reservations" className="block group">
                  <div
                    className="rounded-3xl p-4 flex items-center justify-between gap-3 transition-all duration-300 hover:scale-[1.01]"
                    style={{
                      background: activeRes[0].status === 'confirmed'
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 46, 22, 0.45) 100%)'
                        : 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(69, 42, 5, 0.35) 100%)',
                      border: activeRes[0].status === 'confirmed'
                        ? '1px solid rgba(52, 211, 153, 0.4)'
                        : '1px solid rgba(234, 179, 8, 0.35)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: activeRes[0].status === 'confirmed'
                        ? '0 8px 24px rgba(16, 185, 129, 0.15)'
                        : '0 8px 24px rgba(234, 179, 8, 0.12)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{
                          background: activeRes[0].status === 'confirmed'
                            ? 'rgba(16, 185, 129, 0.25)'
                            : 'rgba(234, 179, 8, 0.2)'
                        }}
                      >
                        <Calendar className={`w-6 h-6 ${activeRes[0].status === 'confirmed' ? 'text-emerald-400' : 'text-amber-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-black text-[11px] uppercase tracking-wider ${activeRes[0].status === 'confirmed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {activeRes[0].status === 'confirmed'
                              ? (activeRes[0].table_number ? `Table ${activeRes[0].table_number} Reserved` : 'Table Confirmed')
                              : 'Awaiting Host Confirmation'}
                          </p>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${activeRes[0].status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'}`}>
                            {activeRes[0].status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                          </span>
                        </div>
                        <p className="text-white font-bold text-sm mt-0.5">{activeRes[0].date} at {activeRes[0].time}</p>
                        <p className="text-white/70 text-xs">
                          {activeRes[0].guests} Guests {activeRes[0].table_number ? `· Table ${activeRes[0].table_number}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-white/50 group-hover:text-white transition-colors">
                      <span className="text-[11px] font-semibold hidden sm:inline">Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
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
          <div className="p-4 space-y-4 pb-24 md:max-w-2xl md:mx-auto lg:max-w-3xl">

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

                {/* ── Swiggy/Zomato Style Category Chips (Horizontal Scroll) ── */}
                <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar select-none">
                  {menuCategories.map(cat => {
                    const meta = CATEGORY_META[cat] || { icon: '🍽️', title: cat, desc: '' };
                    const isSelected = selectedCat === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCat(cat);
                          if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
                        }}
                        className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 border ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#EAB308] to-[#ca9a04] text-black border-[#EAB308] shadow-md shadow-[#EAB308]/30 font-black'
                            : 'bg-[#133540] text-gray-200 border-white/10 hover:border-[#EAB308]/40 hover:text-white'
                        }`}
                      >
                        <span className="text-base leading-none">{meta.icon}</span>
                        <span>{meta.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* ── Chef's Specials Highlight (When viewing All category) ── */}
                {selectedCat === 'All' && !searchQuery && chefsSpecials.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-[#EAB308]" />
                        <span>Persian Darbar Bestsellers</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold">Must-Try</span>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar select-none">
                      {chefsSpecials.slice(0, 5).map(spec => {
                        const inCart = cart.find(c => c._id === spec._id);
                        const qty = inCart ? inCart.quantity : 0;
                        const isVeg = spec.is_veg !== false && !spec.category?.toLowerCase().includes('non') && spec.veg !== false;
                        return (
                          <div
                            key={`spec-${spec._id}`}
                            className="shrink-0 w-44 rounded-2xl overflow-hidden border border-[#EAB308]/30 bg-[#0c1f26] shadow-lg flex flex-col justify-between"
                          >
                            <div className="relative h-24 w-full bg-black/40">
                              <img
                                src={spec.image || '/no-image.png'}
                                alt={spec.name}
                                className="w-full h-full object-cover"
                                onError={e => { e.target.src = '/no-image.png'; }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                              <div className={`absolute top-2 left-2 w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${isVeg ? 'border-green-500 bg-[#0f2933]' : 'border-red-500 bg-[#0f2933]'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                              </div>
                              <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-[#EAB308] text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-[#EAB308]" /> {spec.rating || 4.9}
                              </span>
                            </div>
                            <div className="p-2.5 flex flex-col justify-between flex-1">
                              <div>
                                <p className="text-white font-bold text-xs truncate">{spec.name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{spec.serves || 'Serves 1-2'}</p>
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                                <span className="text-[#EAB308] font-black text-xs">₹{spec.price}</span>
                                {qty === 0 ? (
                                  <button
                                    onClick={() => addToCart(spec)}
                                    className="px-2.5 py-1 rounded-lg bg-[#EAB308] text-black font-black text-[10px] active:scale-90 transition"
                                  >
                                    + ADD
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1 bg-[#EAB308] rounded-lg px-1 py-0.5">
                                    <button onClick={() => updateCartQty(spec._id, -1)} className="w-4 h-4 text-black text-xs font-bold">-</button>
                                    <span className="text-black font-black text-[10px] px-1">{qty}</span>
                                    <button onClick={() => updateCartQty(spec._id, 1)} className="w-4 h-4 text-black text-xs font-bold">+</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Filters & Veg Only Toggle Row ── */}
                <div className="flex items-center justify-between px-1 pt-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white/80 text-xs font-bold">
                      {searchQuery ? `Results for "${searchQuery}"` : selectedCat === 'All' ? 'All Dishes' : selectedCat}
                    </p>
                    <span className="bg-[#EAB308] text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                      {filteredMenuItems.length}
                    </span>
                  </div>

                  {/* Veg Only Toggle Button */}
                  <button
                    onClick={() => setVegOnly(prev => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition border ${
                      vegOnly
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-900/30'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-sm border-2 border-emerald-400 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <span>Veg Only</span>
                  </button>
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
                    <p className="text-white/50 text-xs mt-1">Try another category or toggle off Veg Only</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMenuItems.map(item => {
                      const inCart = cart.find(c => c._id === item._id);
                      const qty = inCart ? inCart.quantity : 0;
                      const isVeg = item.is_veg !== false && !item.category?.toLowerCase().includes('non') && item.veg !== false;
                      return (
                        <div
                          key={item._id}
                          className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-[#EAB308]/15 bg-[#143640]/80 transition-all hover:bg-[#1a4350] hover:border-[#EAB308]/30 shadow-md shadow-black/20"
                        >
                          {/* Thumbnail with Veg indicator and Rating */}
                          <div className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-[#0a1b22] border border-white/10">
                            <img
                              src={item.image || '/no-image.png'}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.src = '/no-image.png'; }}
                            />
                            {/* Veg/Non-veg indicator */}
                            <div className={`absolute top-1.5 left-1.5 w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${isVeg ? 'border-green-500 bg-[#0f2933]' : 'border-red-500 bg-[#0f2933]'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                            </div>
                            {item.popular && (
                              <span className="absolute bottom-1 left-1 bg-[#EAB308] text-black text-[8px] font-black px-1.5 py-0.5 rounded shadow">
                                ★ BESTSELLER
                              </span>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-white font-bold text-sm leading-tight truncate">
                                {item.name}
                              </h3>
                              {item.rating && (
                                <span className="text-[10px] text-[#EAB308] font-bold bg-[#EAB308]/15 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-[#EAB308]" /> {item.rating}
                                </span>
                              )}
                            </div>

                            <p className="text-gray-300 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                              {item.description || item.category}
                            </p>

                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                              <span className="font-bold text-white text-sm text-[#EAB308]">
                                ₹{item.price}
                              </span>
                              {item.serves && <span>• {item.serves}</span>}
                              {item.preparation_time && <span>• ⏱️ {item.preparation_time}m</span>}
                            </div>
                          </div>

                          {/* ADD / qty stepper */}
                          <div className="shrink-0">
                            {qty === 0 ? (
                              <button
                                onClick={() => addToCart(item)}
                                className="border border-[#EAB308] text-[#EAB308] hover:bg-[#EAB308] hover:text-black font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 bg-[#EAB308]/10 transition-all active:scale-95 shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" /> ADD
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-[#EAB308] rounded-xl px-2 py-1 shadow-md shadow-[#EAB308]/30">
                                <button
                                  onClick={() => updateCartQty(item._id, -1)}
                                  className="w-6 h-6 flex items-center justify-center text-black hover:bg-black/15 rounded-lg transition-colors font-bold"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-black font-black text-sm w-5 text-center">{qty}</span>
                                <button
                                  onClick={() => updateCartQty(item._id, 1)}
                                  className="w-6 h-6 flex items-center justify-center text-black hover:bg-black/15 rounded-lg transition-colors font-bold"
                                >
                                  <Plus className="w-3.5 h-3.5" />
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
                          {o.bill_number ? (
                            <span className="text-[#EAB308] bg-[#EAB308]/15 px-2 py-0.5 rounded-full text-xs font-mono font-bold border border-[#EAB308]/30">
                              #{o.bill_number}
                            </span>
                          ) : (
                            <span className="text-white/50 text-xs font-mono">#{o.order_id?.slice(-8)}</span>
                          )}
                          {badge(o.status)}
                        </div>
                        <span className="text-white font-bold text-sm">₹{o.total?.toFixed(0)}</span>
                      </div>
                      <div className="px-4 py-3 space-y-2">
                        <div className="flex items-center justify-between">
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

                        {/* Logistics Rider Badge (Porter Courier or In-House Fleet) */}
                        {o.porter_order_id ? (
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                            <span className="text-orange-400 font-semibold flex items-center gap-1.5">
                              <span>⚡</span>
                              <span>Porter Courier: {o.porter_rider_name || 'Assigned'}</span>
                            </span>
                            {o.porter_rider_phone && (
                              <a
                                href={`tel:${o.porter_rider_phone}`}
                                className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                <span>Call</span>
                              </a>
                            )}
                          </div>
                        ) : o.delivery_partner_name ? (
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                              <Bike className="w-3.5 h-3.5" />
                              <span>PD Fleet: {o.delivery_partner_name}</span>
                            </span>
                            {o.delivery_partner_phone && o.status === 'out_for_delivery' && (
                              <a
                                href={`tel:${o.delivery_partner_phone}`}
                                className="text-[#EAB308] hover:underline font-bold flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                <span>Call Rider</span>
                              </a>
                            )}
                          </div>
                        ) : null}
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
                    <span className="font-black text-lg">₹{cartSubtotal.toLocaleString()}</span>
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
                      <span className="text-white font-bold text-sm">{r.date} · {r.time}</span>
                    </div>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${ok?'bg-emerald-500/20 text-emerald-300 border-emerald-500/40':bad?'bg-red-500/20 text-red-300 border-red-500/40':'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'}`}>
                      {ok ? (r.table_number ? `✅ Table ${r.table_number} Confirmed` : '✅ Confirmed') : bad ? 'Unavailable' : '⏳ Pending Confirmation'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/65">
                    <span><UtensilsCrossed className="w-3.5 h-3.5 inline mr-1 text-white/80" />{r.guests} guests</span>
                    {r.table_number && (
                      <span className="text-emerald-400 font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        Table {r.table_number}
                      </span>
                    )}
                    {r.occasion && <span>{r.occasion}</span>}
                    {r.amount_paid && <span style={{ color:GOLD }} className="font-bold">₹{r.amount_paid} paid</span>}
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
              <p className="font-bold text-sm mt-1 mb-3" style={{ color:'rgba(234,179,8,0.85)' }}>₹{pdCoins.toLocaleString()} Value</p>
              <div className="w-16 h-px mx-auto mb-3" style={{ background:GB }} />
              <div className="flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-white/60">
                <span>Dine</span><span style={{color:GOLD}}>â—†</span><span>Earn</span><span style={{color:GOLD}}>â—†</span><span>Redeem</span><span style={{color:GOLD}}>â—†</span><span>Revisit</span>
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
                              {txn.note || (isEarned ? `₹${txn.bill_amount} bill` : isExpired ? '45-day auto expiry' : 'Discount')}
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
                      {pdCoins > 500 ? 'â­ Royal Elite Member' : '👑 Royal Patron'}
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
                <p className="text-[9px] text-white/50 mt-0.5">₹{pdCoins} value â€º</p>
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
                      <p className="text-white/60 text-xs mt-0.5">+91 20 2613 0000 · Open 11:00 AM - 1:00 AM</p>
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
                        {copiedLink ? '✔ Link copied to clipboard!' : 'Invite friends & family to the royal experience'}
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
                Serving Royal Mughlai Cuisine Since 1976 · Camp, Pune
              </p>
              <p className="text-[8px] text-white/30 font-mono pt-1">
                Version 2.4.0 (Privilege Edition)
              </p>
            </div>

          </div>
        )}

      </div>

      {/* ─── IN-APP CART & CHECKOUT DRAWER (Glassmorphism) ─── */}
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

              {/* ── 1. Free Delivery Progress Bar (Order Type: DELIVERY) ── */}
              {orderType === 'DELIVERY' && (
                <div className="rounded-2xl p-3.5 bg-gradient-to-r from-emerald-950/40 via-[#0d232c] to-[#0a1c22] border border-emerald-500/30">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                      <Truck className="w-4 h-4 text-emerald-400" />
                      {isFreeDeliveryEligible
                        ? '🎉 You have unlocked FREE Delivery!'
                        : `Add ₹${freeDeliveryThreshold - cartSubtotal} more for FREE Delivery!`}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      ₹{cartSubtotal}/₹{freeDeliveryThreshold}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#EAB308] to-emerald-400 transition-all duration-500 rounded-full"
                      style={{ width: `${freeDeliveryProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* ── 2. In-House Rider ETA Banner ── */}
              <div className="rounded-2xl p-3 bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EAB308]/20 flex items-center justify-center text-[#EAB308] shrink-0 border border-[#EAB308]/30">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-xs">
                      {orderType === 'TAKEAWAY' ? 'Ready for Pickup: ~20-25 Mins' : 'Estimated Delivery: 30-40 Mins'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {orderType === 'TAKEAWAY' ? 'Persian Darbar, Camp Pune Counter' : 'Delivered by Persian Darbar In-House Rider'}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-500/15 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                  LIVE KITCHEN
                </span>
              </div>

              {/* ── 3. Items List ── */}
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

              {/* ── 4. Order Type: Delivery vs Takeaway ── */}
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

              {/* ── 5. Delivery Details ── */}
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
                      {isFreeDeliveryEligible ? '✅ Free Delivery (Order > ₹500)' : distanceKm === null ? 'Within 5km: Free' : distanceKm <= 5 ? '✅ Free Delivery' : distanceKm <= 20 ? '₹60 Delivery Fee' : '❌ Out of range (>20km)'}
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

              {/* ── 6. Cooking Instructions / Chef Note ── */}
              <div className="rounded-2xl p-3.5 space-y-2.5" style={GLASS_CARD_SM}>
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-[#EAB308]" />
                  <label className="text-xs font-bold text-white/85">Cooking Request / Chef Note</label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'less_spicy', label: '🌶️ Less Spicy' },
                    { id: 'extra_spicy', label: '🔥 Extra Spicy' },
                    { id: 'extra_salan', label: '🍲 Extra Salan / Gravy' },
                    { id: 'extra_onion_lemon', label: '🧅 Extra Onion & Lemon' },
                    { id: 'no_cutlery', label: '🥄 No Plastic Cutlery' },
                  ].map(tag => {
                    const active = cookingTags.includes(tag.label);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          setCookingTags(prev =>
                            prev.includes(tag.label) ? prev.filter(t => t !== tag.label) : [...prev, tag.label]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition border ${
                          active
                            ? 'bg-[#EAB308] text-black border-[#EAB308] font-bold'
                            : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={cookingNote}
                  onChange={e => setCookingNote(e.target.value)}
                  placeholder="Any other special cooking requests? (optional)"
                  className="w-full rounded-xl px-3 py-2 bg-white/10 text-white text-xs border border-white/20 focus:outline-none focus:border-[#EAB308] placeholder-white/40"
                />
              </div>

              {/* ── 7. Delivery Partner Instructions (for Delivery) ── */}
              {orderType === 'DELIVERY' && (
                <div className="rounded-2xl p-3.5 space-y-2" style={GLASS_CARD_SM}>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#EAB308]" />
                    <label className="text-xs font-bold text-white/85">Rider Delivery Instructions</label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['🚪 Leave at door', '🔕 Avoid calling bell', '📞 Call upon arrival', '🏢 Leave with security'].map(tag => {
                      const active = deliveryTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setDeliveryTags(prev =>
                              prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                            );
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition border ${
                            active
                              ? 'bg-[#EAB308] text-black border-[#EAB308] font-bold'
                              : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── 8. Coupons & Promo Codes Section ── */}
              <div className="rounded-2xl p-3.5 space-y-2.5" style={GLASS_CARD_SM}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#EAB308]" />
                    <span className="text-xs font-bold text-white">Apply Coupon Code</span>
                  </div>
                  {appliedCoupon && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      SAVING ₹{couponDiscount}
                    </span>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-mono font-black text-xs text-white">{appliedCoupon.code}</span>
                        <p className="text-[10px] text-emerald-300">Coupon applied! ₹{couponDiscount} discount</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs text-red-400 font-bold hover:underline px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code (e.g. ROYAL30)"
                      className="flex-1 rounded-xl px-3 py-2 bg-white/10 text-white font-mono text-xs border border-white/20 focus:outline-none focus:border-[#EAB308] placeholder-white/40 uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => applyCoupon()}
                      disabled={validatingCoupon || !couponCodeInput.trim()}
                      className="px-4 py-2 rounded-xl bg-[#EAB308] text-black font-black text-xs disabled:opacity-40 active:scale-95 transition"
                    >
                      {validatingCoupon ? 'Checking...' : 'APPLY'}
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-[10px] text-red-400 font-semibold">{couponError}</p>
                )}

                {/* Available Coupons Suggestion Chips */}
                {!appliedCoupon && coupons.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] text-gray-400 font-medium mb-1.5">Available for you:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {coupons.map(cpn => (
                        <button
                          key={cpn.code}
                          type="button"
                          onClick={() => applyCoupon(cpn.code)}
                          className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-[#EAB308]/15 border border-[#EAB308]/30 text-[#EAB308] hover:bg-[#EAB308]/25 font-bold transition flex items-center gap-1"
                        >
                          <Percent className="w-3 h-3" />
                          <span>{cpn.code}</span>
                          <span className="text-[9px] text-white/60">
                            ({cpn.discount_type === 'percentage' ? `${cpn.discount_value}% OFF` : `₹${cpn.discount_value} OFF`})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── 9. Contact Phone ── */}
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

              {/* ── 10. Payment Method ── */}
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

              {/* ── 11. 🪙 PD Coins Redemption Card ── */}
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
                            Add items worth ₹{300 - cartSubtotal} more to redeem (Min ₹300)
                          </p>
                        ) : (
                          <p className="text-white/60 text-[10px] mt-0.5">
                            Max 25% bill cap: Save up to <span className="text-[#EAB308] font-bold">₹{maxRedeemableCoins}</span>
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
                        {applyCoins ? 'Applied ✔' : 'Apply'}
                      </button>
                    )}
                  </div>

                  {applyCoins && maxRedeemableCoins > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Saving ₹{coinsDiscount} on this order!
                      </span>
                      <span className="text-white/50">
                        +Earn <span className="text-[#EAB308] font-bold">{coinsEarnable}</span> new coins
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ── 12. Bill Breakdown ── */}
              <div className="rounded-2xl p-4 space-y-2 text-xs" style={GLASS_CARD_SM}>
                <div className="flex justify-between text-white/70">
                  <span>Items Subtotal</span>
                  <span>₹{cartSubtotal.toLocaleString()}</span>
                </div>
                {coinsApplied > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      🪙 PD Coins Discount
                    </span>
                    <span>-₹{coinsDiscount.toLocaleString()}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      🎟️ Promo Code ({appliedCoupon?.code})
                    </span>
                    <span>-₹{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
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

              {/* ── 13. Confirm Order CTA ── */}
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
