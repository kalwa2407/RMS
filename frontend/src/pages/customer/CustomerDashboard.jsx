import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import API_BASE from '../../lib/config';
import {
  ShoppingBag, Calendar, Clock, Phone,
  Edit2, Check, ArrowRight, LogOut, AlertCircle,
  Truck, UtensilsCrossed, RotateCw,
  Eye, User, ChevronRight, Crown, Home, Plus, X,
  Star, Minus, Zap, Gift, TrendingUp, BookOpen
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

  /* ── Bottom nav ── */
  const NAV = [
    { key:'home',     Icon:Home,          label:'Home' },
    { key:'order',    Icon:UtensilsCrossed,label:'Order' },
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
      <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">

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

              {/* Quick action grid (Frosted Glass Tiles) */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { Icon:UtensilsCrossed, label:'Order Food',   sub:'Biryanis & Kebabs', color:GOLD,       action:()=>navigate('/order') },
                  { Icon:Calendar,        label:'Reserve Table',sub:'Book in advance',   color:'#a78bfa',   action:()=>setTab('reserve') },
                  { Icon:Clock,           label:'My Orders',    sub:`${orders.length} total`, color:'#60a5fa', action:()=>setTab('order') },
                  { Icon:BookOpen,        label:'My Bookings',  sub:`${reservations.length} total`, color:'#34d399', action:()=>setTab('bookings') },
                ].map(({ Icon, label, sub, color, action })=>(
                  <button key={label} onClick={action}
                    className="rounded-3xl p-4 text-left active:scale-[0.97] transition-all group"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(20, 20, 25, 0.40) 100%)',
                      backdropFilter: 'blur(18px)',
                      WebkitBackdropFilter: 'blur(18px)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105"
                      style={{ background:`${color}20`, border:`1px solid ${color}40` }}>
                      <Icon style={{ color, width:18, height:18 }} />
                    </div>
                    <p className="text-white font-bold text-sm">{label}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-white/60 text-xs">{sub}</p>
                      <ChevronRight className="w-3.5 h-3.5 text-white/40" />
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

        {/* ══ ORDER ══ */}
        {tab === 'order' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-base" style={{ fontFamily:"'Playfair Display',serif" }}>My Orders</h2>
              <button onClick={fetchOrders} className="p-2 rounded-xl active:scale-90 transition-transform" style={{ background:'rgba(255,255,255,0.05)' }}>
                <RotateCw className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <Link to="/order">
              <div className="rounded-3xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all" style={GLASS_GOLD_CARD}>
                <UtensilsCrossed className="w-5 h-5" style={{ color:GOLD }} />
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">Order Food Now</p>
                  <p className="text-xs text-white/70">Biryanis, Kebabs & more</p>
                </div>
                <ArrowRight className="w-4 h-4" style={{ color:GOLD }} />
              </div>
            </Link>
            {loadO ? (
              <div className="flex items-center justify-center py-16 gap-2 text-white/50 text-sm"><RotateCw className="w-4 h-4 animate-spin" /> Loading...</div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3"><ShoppingBag className="w-14 h-14 text-white/20" /><p className="text-white/60 text-sm">No orders yet</p></div>
            ) : orders.map(o => (
              <div key={o.order_id||o._id} className="rounded-3xl overflow-hidden" style={GLASS_CARD_SM}>
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
            ))}
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

      {/* ═══ BOTTOM NAV (Frosted Glass Bar) ═══ */}
      <div className="relative z-20 shrink-0 flex items-center justify-around px-2 pt-2 pb-safe"
        style={{
          background: 'rgba(12, 14, 18, 0.70)',
          borderTop: '1px solid rgba(255, 255, 255, 0.16)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)'
        }}>
        {NAV.map(({ key, Icon, label, gold, dot }) => {
          const active = tab === key;
          return (
            <button key={key}
              onClick={() => key==='order' ? navigate('/order') : setTab(key)}
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
