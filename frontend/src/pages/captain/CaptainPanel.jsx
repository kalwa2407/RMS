import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw, LogOut, ChefHat, Receipt, Users, Bell, Check, CheckCircle, Search,
  Calendar, UserCheck, ChevronRight, WifiOff, LayoutGrid, UtensilsCrossed, ShoppingBag
} from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";
import { AddStepper, VegMark, Chip, EmptyState, Skeleton, formatINR, cx } from "../customer/ui";
import {
  tableStatus, orderStatus, IconButton, Segmented, StatusDot, Card, Label, Sheet, CloseButton, SearchField,
} from "./ui";

/* ── Helpers ── */
const formatTime = (ts) => {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    return isToday ? time : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " " + time;
  } catch { return "—"; }
};

const timeSince = (ts) => {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
};
const getShiftTime = () => {
  const now = new Date();
  return now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};
const CaptainPanel = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("captain_token");
  const captainName = localStorage.getItem("captain_name") || "Captain";

  const logout = () => {
    localStorage.removeItem("captain_token");
    localStorage.removeItem("captain_name");
    localStorage.removeItem("captain_id");
    navigate("/staff-entry", { replace: true });
  };

  const [tab, setTab] = useState("tables");
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tablesError, setTablesError] = useState(false); // presentation only: drives the error state
  const [readyOrders, setReadyOrders] = useState([]); // dine-in orders with status=ready
  const [readyAlerted, setReadyAlerted] = useState(new Set());
  const [sheet, setSheet] = useState(null);
  const [menu, setMenu] = useState([]);
  const [menuStatus, setMenuStatus] = useState("loading"); // presentation only
  const [menuCategory, setMenuCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [guestName, setGuestName] = useState("Guest");
  const [placing, setPlacing] = useState(false);
  const [closingBill, setClosingBill] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [shiftStart] = useState(() => new Date());
  const [clockTime, setClockTime] = useState(getShiftTime());
  const [reviewOpen, setReviewOpen] = useState(false); // phone-only order review sheet

  const audioRef = useRef(null);
  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClockTime(getShiftTime()), 10000);
    return () => clearInterval(t);
  }, []);


  useEffect(() => {
    if (!token) navigate("/staff-entry", { replace: true });
  }, [token, navigate]);

  // Init audio
  useEffect(() => {
    const audio = new Audio("/notification.wav");
    audio.volume = 0.9;
    audioRef.current = audio;
    const prime = () => { audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {}); };
    document.addEventListener("click", prime, { once: true });
    return () => document.removeEventListener("click", prime);
  }, []);

  const playAlert = () => {
    try { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); } } catch {}
  };

  const fetchTables = useCallback(async () => {
    if (!token) return; // Guard: don't fetch without valid token
    try {
      const { data } = await axios.get(`${API_BASE}/api/captain/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTables(Array.isArray(data) ? data.sort((a, b) => a.table_number - b.table_number) : []);
      setTablesError(false);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("captain_token");
        navigate("/staff-entry", { replace: true });
      } else {
        setTablesError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  const fetchMenu = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/menu`);
      setMenu(Array.isArray(data) ? data.filter(i => i.available !== false) : []);
      setMenuStatus("ok");
    } catch {
      setMenuStatus("error");
    }
  }, []);

  // Fetch ready dine-in orders for captain notification
  const fetchReadyOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/orders?status_filter=ready`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dineReady = Array.isArray(data)
        ? data.filter(o => o.order_type === "DINE_IN" && o.status === "ready")
        : [];
      // Alert for new ones not yet alerted
      const newReady = dineReady.filter(o => !readyAlerted.has(o.order_id));
      if (newReady.length > 0) {
        playAlert();
        setReadyAlerted(prev => {
          const next = new Set(prev);
          newReady.forEach(o => next.add(o.order_id));
          return next;
        });
      }
      setReadyOrders(dineReady);
    } catch {}
  }, [token, readyAlerted]);

  useEffect(() => {
    fetchTables();
    fetchMenu();
    fetchReadyOrders();
    const interval = setInterval(() => {
      fetchTables();
      fetchReadyOrders();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchTables, fetchMenu, fetchReadyOrders]);

  // Refresh sheet when tables update
  useEffect(() => {
    if (sheet?.type === "table" && sheet.table) {
      const fresh = tables.find(t => t.table_number === sheet.table.table_number);
      if (fresh) setSheet(s => ({ ...s, table: fresh }));
    }
  }, [tables]);

  const openTable = async (table) => {
    setCart([]);
    setGuestName("Guest");
    let session = null;
    if (table.current_session_id || table.status === "occupied") {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/captain/tables/${table.table_number}/session`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data.has_session) session = data.session;
      } catch {}
    }
    setSheet({ type: "table", table, session });
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.item_id === (item.id || item._id));
      if (existing) return prev.map(c => c.item_id === existing.item_id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item_id: item.id || item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };
  const updateQty = (item_id, delta) => {
    setCart(prev => prev.map(c => c.item_id === item_id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const placeOrder = async () => {
    if (!cart.length) return;
    setPlacing(true);
    try {
      const items = cart.map(c => ({ item_id: c.item_id, name: c.name, price: c.price, quantity: c.quantity, variant: null, variant_price: 0, addons: [], item_cost: 0 }));
      await axios.post(`${API_BASE}/api/captain/order`,
        { table_number: sheet.table.table_number, items, customer_name: guestName || "Guest", session_id: sheet.session?.session_id || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart([]);
      const { data } = await axios.get(`${API_BASE}/api/captain/tables/${sheet.table.table_number}/session`,
        { headers: { Authorization: `Bearer ${token}` } });
      setSheet(s => ({ ...s, session: data.has_session ? data.session : null, table: { ...s.table, status: "occupied" } }));
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  const closeBill = async () => {
    if (!sheet?.session?.session_id) return;
    setClosingBill(true);
    try {
      await axios.post(`${API_BASE}/api/captain/sessions/${sheet.session.session_id}/close?payment_method=${paymentMethod}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSheet(null);
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to close bill");
    } finally {
      setClosingBill(false);
    }
  };

  const markOrderServed = async (orderId) => {
    try {
      await axios.put(
        `${API_BASE}/api/admin/orders/${orderId}/status`,
        { status: "delivered" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReadyOrders(prev => prev.filter(o => o.order_id !== orderId));
      fetchTables();
      fetchReadyOrders();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update order status");
    }
  };

  const categories = ["All", ...new Set(menu.map(i => i.category))];
  const filteredMenu = menu.filter(i => {
    const matchesCategory = menuCategory === "All" || i.category === menuCategory;
    const matchesSearch = !menuSearch.trim() || i.name.toLowerCase().includes(menuSearch.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const occupiedTables = tables.filter(t => t.status !== "free");

  /* ── Presentation-only derived values ── */
  const counts = {
    free: tables.filter(t => t.status === "free").length,
    occupied: tables.filter(t => t.status === "occupied").length,
    billing: tables.filter(t => t.status !== "free" && t.status !== "occupied" && t.status !== "reserved").length,
  };
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const closeSheet = () => setSheet(null);
  const tableHasReady = (n) => readyOrders.some(o => o.table_number === n);
  const titles = { tables: "Tables", ready: "Ready to serve", orders: "Active tables" };
  const tabs = [
    { key: "tables", label: "Tables", icon: LayoutGrid },
    { key: "ready", label: "Ready", icon: Bell, badge: readyOrders.length },
    { key: "orders", label: "Active", icon: ShoppingBag },
  ];

  /* ── Pieces ── */
  const ReadyOrderCard = ({ order, compact }) => (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <p className="text-[20px] leading-6 font-bold tracking-[-0.01em]">
            {order.table_number ? `Table ${order.table_number}` : "Table —"}
          </p>
          <p className="text-[13px] text-pd-ink-2 mt-0.5 truncate">
            {order.kot_number || order.order_id?.slice(-8)} · {order.customer_name} · {formatTime(order.created_at)}
          </p>
        </div>
        <span className="shrink-0 h-6 px-2.5 rounded-full bg-pd-action text-white text-[12px] font-semibold flex items-center">Ready</span>
      </div>
      <ul className={cx("px-4 mt-3 space-y-1.5", compact && "text-[14px]")}>
        {(order.items || []).map((item, i) => (
          <li key={i} className="flex justify-between gap-3 text-[15px]">
            <span className="text-pd-ink min-w-0 truncate"><span className="pd-tabular text-pd-ink-2">{item.quantity}×</span> {item.name}</span>
            <span className="pd-tabular text-pd-ink-2 shrink-0">{formatINR(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="p-4">
        <button
          type="button"
          onClick={() => markOrderServed(order.order_id)}
          className="w-full h-12 rounded-[12px] bg-pd-action text-white text-[16px] font-semibold flex items-center justify-center gap-2 pd-press hover:bg-pd-action-press"
        >
          <Check className="w-5 h-5" strokeWidth={2.5} />
          Mark as served
        </button>
      </div>
    </Card>
  );

  const TableTile = ({ t }) => {
    const hasReady = tableHasReady(t.table_number);
    const isReserved = t.is_reserved_today || t.status === "reserved";
    const reservedFree = isReserved && t.status === "free";
    const s = tableStatus(reservedFree ? "reserved" : t.status);
    return (
      <button
        type="button"
        onClick={() => openTable(t)}
        aria-label={`Table ${t.table_number}, ${hasReady ? "food ready to serve" : s.label}`}
        className={cx("relative h-[104px] rounded-[16px] border p-3 flex flex-col justify-between text-left pd-press shadow-pd-1", s.tile)}
      >
        <div className="flex items-start justify-between gap-1">
          <span className={cx("text-[28px] leading-none font-semibold tracking-[-0.02em] pd-tabular", s.num)}>{t.table_number}</span>
          {hasReady ? (
            <span className="h-6 px-2 rounded-full bg-pd-action text-white text-[12px] font-semibold flex items-center gap-1 whitespace-nowrap shrink-0">
              <Bell className="w-3 h-3" strokeWidth={2.5} /> Serve
            </span>
          ) : isReserved && t.upcoming_reservation?.time ? (
            <span className={cx("h-6 px-2 rounded-full text-[12px] font-semibold flex items-center pd-tabular whitespace-nowrap shrink-0",
              t.status === "occupied" ? "bg-white/15 text-white" : "bg-white text-pd-gold border border-pd-gold/30")}>
              {t.upcoming_reservation.time}
            </span>
          ) : null}
        </div>
        <span className={cx("flex items-center gap-1.5 text-[13px] font-medium", s.text)}>
          <StatusDot className={s.dot} />
          {s.label}
        </span>
      </button>
    );
  };

  const renderTables = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3" aria-busy="true" aria-label="Loading tables">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-[104px] rounded-[16px]" />)}
        </div>
      );
    }
    if (tablesError && tables.length === 0) {
      return (
        <Card>
          <EmptyState icon={WifiOff} title="Couldn't load tables" message="Check the connection. The list refreshes on its own every few seconds." actionLabel="Try again" onAction={fetchTables} />
        </Card>
      );
    }
    if (tables.length === 0) {
      return (
        <Card>
          <EmptyState icon={LayoutGrid} title="No tables yet" message="Tables added by the manager will show up here." />
        </Card>
      );
    }
    return (
      <>
        {tablesError && (
          <div className="mb-3 flex items-center gap-2 rounded-[12px] bg-[#FFF4E5] text-pd-warn px-3.5 py-2.5 text-[14px] font-medium">
            <WifiOff className="w-4 h-4 shrink-0" /> Connection lost. Showing the last known status.
          </div>
        )}
        <Card className="mb-4 grid grid-cols-4 divide-x divide-[color:var(--pd-line)]">
          {[
            { label: "Free", value: counts.free, dot: "bg-pd-success" },
            { label: "Occupied", value: counts.occupied, dot: "bg-pd-teal" },
            { label: "Billing", value: counts.billing, dot: "bg-pd-warn" },
            { label: "To serve", value: readyOrders.length, dot: "bg-pd-action" },
          ].map(s => (
            <div key={s.label} className="px-3 py-3 md:px-4">
              <p className="text-[24px] leading-7 font-semibold pd-tabular">{s.value}</p>
              <p className="flex items-center gap-1.5 text-[12px] md:text-[13px] text-pd-ink-2 mt-0.5 whitespace-nowrap">
                <StatusDot className={s.dot} /> {s.label}
              </p>
            </div>
          ))}
        </Card>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3">
          {tables.map(t => <TableTile key={t.table_number} t={t} />)}
        </div>
      </>
    );
  };

  const renderReady = () => (
    readyOrders.length === 0 ? (
      <Card>
        <EmptyState icon={CheckCircle} title="Nothing to serve" message="When the kitchen marks a dine-in order ready, it appears here with a sound." />
      </Card>
    ) : (
      <div className="grid gap-3 md:grid-cols-2">
        {readyOrders.map(order => <ReadyOrderCard key={order.order_id} order={order} />)}
      </div>
    )
  );

  const renderActive = () => (
    occupiedTables.length === 0 ? (
      <Card>
        <EmptyState icon={ChefHat} title="No active tables" message="Tables with guests seated or bills open will be listed here." />
      </Card>
    ) : (
      <Card className="overflow-hidden">
        <ul className="divide-y divide-[color:var(--pd-line)]">
          {occupiedTables.map(t => {
            const hasReady = tableHasReady(t.table_number);
            const s = tableStatus(t.status);
            return (
              <li key={t.table_number}>
                <button type="button" onClick={() => openTable(t)}
                  className="w-full min-h-[64px] flex items-center gap-3 px-4 py-2.5 text-left hover:bg-pd-surface active:bg-pd-surface transition-colors">
                  <span className={cx("w-11 h-11 rounded-[12px] flex items-center justify-center text-[17px] font-semibold pd-tabular border", s.tile, s.num)}>
                    {t.table_number}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[16px] font-semibold">Table {t.table_number}</span>
                    <span className={cx("flex items-center gap-1.5 text-[14px]", hasReady ? "text-pd-action font-semibold" : "text-pd-ink-2")}>
                      {hasReady ? <><Bell className="w-3.5 h-3.5" /> Food ready to serve</> : s.label}
                    </span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-pd-ink-3 shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
    )
  );

  /* ── Sheet pieces ── */
  const res = sheet?.table?.upcoming_reservation;
  const sheetHasReady = sheet ? tableHasReady(sheet.table.table_number) : false;

  const renderNotices = () => (
    <>
      {res && (
        <div className="rounded-[14px] bg-pd-gold-tint border border-pd-gold/25 p-3.5 flex gap-3">
          <span className="w-9 h-9 rounded-full bg-white text-pd-gold flex items-center justify-center shrink-0">
            <Calendar className="w-[18px] h-[18px]" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[15px] font-semibold text-pd-ink">Reserved today at {res.time}</p>
              {res.status && <span className="shrink-0 h-6 px-2 rounded-full bg-white text-pd-gold text-[12px] font-semibold capitalize flex items-center">{res.status}</span>}
            </div>
            <p className="text-[14px] text-pd-ink-2 mt-0.5">
              {res.customer_name} · {res.guests} guests{res.phone && ` · +91 ${res.phone}`}
            </p>
            {res.special_requests && <p className="text-[14px] text-pd-ink-2 mt-1 italic">“{res.special_requests}”</p>}
            {sheet.table.status === "free" && (
              <button type="button" onClick={() => setGuestName(res.customer_name)}
                className="mt-2.5 h-11 px-4 rounded-[12px] bg-pd-ink text-white text-[15px] font-semibold flex items-center gap-2 pd-press">
                <UserCheck className="w-4 h-4" /> Seat {res.customer_name}
              </button>
            )}
          </div>
        </div>
      )}
      {sheetHasReady && (
        <div className="rounded-[14px] bg-pd-action-tint border border-pd-action/20 p-3.5 flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-pd-action text-white flex items-center justify-center shrink-0">
            <Bell className="w-[18px] h-[18px]" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-pd-ink">Food is ready</p>
            <p className="text-[14px] text-pd-ink-2">The kitchen marked an order for this table ready. Please serve.</p>
          </div>
        </div>
      )}
    </>
  );

  const renderGuest = () => !sheet?.session && (
    <div>
      <label className="block">
        <Label className="mb-1.5 px-1">Guest name</Label>
        <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)}
          placeholder="Guest name (optional)"
          className="w-full h-11 rounded-[12px] bg-white border border-[color:var(--pd-line)] px-3.5 text-[16px] text-pd-ink placeholder:text-pd-ink-3 outline-none focus:border-pd-ink/30" />
      </label>
    </div>
  );

  const renderSessionOrders = () => sheet?.session?.orders?.length > 0 && (
    <section>
      <Label className="mb-2 px-1">Sent to kitchen</Label>
      <Card className="overflow-hidden divide-y divide-[color:var(--pd-line)] shadow-none">
        {sheet.session.orders.map((o, i) => {
          const st = orderStatus(o.status);
          return (
            <div key={i} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[15px] font-semibold">Order {i + 1}</p>
                <span className={cx("h-6 px-2 rounded-full text-[12px] font-semibold flex items-center", st.cls)}>{st.label}</span>
              </div>
              {o.created_at && <p className="text-[13px] text-pd-ink-3 pd-tabular mt-0.5">{formatTime(o.created_at)} · {timeSince(o.created_at)}</p>}
              <ul className="mt-2 space-y-1">
                {o.items?.map((item, j) => (
                  <li key={j} className="flex justify-between gap-3 text-[14px] text-pd-ink-2">
                    <span className="min-w-0 truncate"><span className="pd-tabular">{item.quantity}×</span> {item.name}</span>
                    <span className="pd-tabular shrink-0">{formatINR(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-right text-[14px] font-semibold pd-tabular mt-1.5">{formatINR(o.total)}</p>
            </div>
          );
        })}
        <div className="px-4 py-3 flex items-center justify-between bg-pd-surface/60">
          <span className="text-[15px] font-semibold">Table total</span>
          <span className="text-[19px] font-bold pd-tabular">{formatINR(sheet.session.total)}</span>
        </div>
      </Card>
    </section>
  );

  const renderCartLines = () => (
    cart.length === 0 ? (
      <div className="rounded-[14px] border border-dashed border-pd-ink/15 px-4 py-6 text-center">
        <p className="text-[15px] font-medium text-pd-ink-2">No new items</p>
        <p className="text-[13px] text-pd-ink-3 mt-0.5">Tap ADD on a dish to start the order.</p>
      </div>
    ) : (
      <Card className="divide-y divide-[color:var(--pd-line)] shadow-none">
        {cart.map(c => (
          <div key={c.item_id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold truncate">{c.name}</p>
              <p className="text-[14px] text-pd-ink-2 pd-tabular">{formatINR(c.price * c.quantity)}</p>
            </div>
            <AddStepper size="sm" quantity={c.quantity}
              onIncrement={() => updateQty(c.item_id, 1)} onDecrement={() => updateQty(c.item_id, -1)}
              className="!h-11 !shadow-none" />
          </div>
        ))}
      </Card>
    )
  );

  const sendButton = (
    <button type="button" onClick={placeOrder} disabled={placing}
      className="w-full h-12 rounded-[12px] bg-pd-action text-white text-[16px] font-semibold flex items-center justify-center gap-2 pd-press hover:bg-pd-action-press disabled:opacity-60">
      <ChefHat className="w-5 h-5" />
      {placing ? "Sending…" : "Send to kitchen"}
    </button>
  );

  const billActions = sheet?.session?.orders?.length > 0 && cart.length === 0 && (
    <div className="space-y-2.5">
      <Segmented className="w-full flex" value={paymentMethod} onChange={setPaymentMethod}
        options={[{ key: "cash", label: "Cash" }, { key: "card", label: "Card" }, { key: "upi", label: "UPI" }].map(o => ({ ...o }))} />
      <button type="button" onClick={closeBill} disabled={closingBill}
        className="w-full h-12 rounded-[12px] bg-pd-ink text-white text-[16px] font-semibold flex items-center justify-center gap-2 pd-press disabled:opacity-60">
        <Receipt className="w-5 h-5" />
        {closingBill ? "Closing…" : <>Close bill · <span className="pd-tabular">{formatINR(sheet.session.total)}</span></>}
      </button>
    </div>
  );

  const renderMenu = () => (
    <div className="lg:flex lg:gap-4 lg:items-start">
      {/* Vertical category rail (wide iPad) */}
      <nav aria-label="Categories" className="hidden lg:block w-[168px] shrink-0 sticky top-[68px]">
        <ul className="space-y-0.5">
          {categories.map(cat => (
            <li key={cat}>
              <button type="button" onClick={() => setMenuCategory(cat)} aria-pressed={menuCategory === cat}
                className={cx("w-full min-h-[44px] px-3 rounded-[10px] text-left text-[15px] transition-colors",
                  menuCategory === cat ? "bg-white text-pd-ink font-semibold shadow-pd-1" : "text-pd-ink-2 hover:bg-white/60")}>
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex-1 min-w-0">
        {/* Horizontal category rail (phone / portrait) */}
        <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-3">
          {categories.map(cat => (
            <Chip key={cat} active={menuCategory === cat} onClick={() => setMenuCategory(cat)} className="h-10">{cat}</Chip>
          ))}
        </div>
        {menuStatus === "loading" ? (
          <Card className="divide-y divide-[color:var(--pd-line)] shadow-none">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-4">
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3.5 w-16" /></div>
                <Skeleton className="h-11 w-[96px]" />
              </div>
            ))}
          </Card>
        ) : menuStatus === "error" && menu.length === 0 ? (
          <Card className="shadow-none">
            <EmptyState icon={WifiOff} title="Couldn't load the menu" message="Check the connection and try again." actionLabel="Try again" onAction={fetchMenu} />
          </Card>
        ) : filteredMenu.length === 0 ? (
          <Card className="shadow-none">
            <EmptyState icon={Search} title="No dishes found"
              message={menuSearch ? `Nothing matches “${menuSearch}”.` : "This category has no available dishes."}
              actionLabel={menuSearch ? "Clear search" : undefined} onAction={() => setMenuSearch("")} />
          </Card>
        ) : (
          <Card className="divide-y divide-[color:var(--pd-line)] shadow-none overflow-hidden">
            {filteredMenu.map(item => {
              const id = item.id || item._id;
              const inCart = cart.find(c => c.item_id === id);
              return (
                <div key={id} className="flex items-center gap-3 px-4 py-3 min-h-[68px]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      {typeof item.veg === "boolean" && <VegMark veg={item.veg} size={14} className="mt-[3px]" />}
                      <p className="text-[16px] leading-5 font-semibold text-pd-ink line-clamp-2">{item.name}</p>
                    </div>
                    <p className="text-[14px] text-pd-ink-2 pd-tabular mt-0.5">
                      {formatINR(item.price)}
                      {menuCategory === "All" && item.category && <span className="text-pd-ink-3"> · {item.category}</span>}
                    </p>
                  </div>
                  <AddStepper
                    quantity={inCart?.quantity || 0}
                    onAdd={() => addToCart(item)}
                    onIncrement={() => updateQty(id, 1)}
                    onDecrement={() => updateQty(id, -1)}
                    className="!h-11 !w-[104px] !shadow-none"
                  />
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-pd-surface text-pd-ink antialiased">

      {/* ── HEADER ── */}
      <header className="shrink-0 bg-white/90 backdrop-blur-xl border-b border-[color:var(--pd-line)]"
        style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="h-16 px-4 md:px-6 flex items-center gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="w-10 h-10 rounded-[12px] bg-pd-teal text-white flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[16px] font-semibold leading-5 truncate">{captainName}</p>
              <p className="text-[13px] text-pd-ink-2 leading-4 pd-tabular truncate">Captain · {clockTime}</p>
            </div>
          </div>
          <Segmented className="hidden md:inline-flex" value={tab} onChange={setTab} options={tabs} />
          <div className="flex items-center gap-1 md:gap-2 md:flex-1 justify-end shrink-0">
            {readyOrders.length > 0 && (
              <button type="button" onClick={() => setTab("ready")}
                className="h-11 px-4 rounded-full bg-pd-action text-white text-[14px] font-semibold flex items-center gap-1.5 pd-press md:hidden">
                <Bell className="w-4 h-4" /> <span className="pd-tabular">{readyOrders.length}</span> ready
              </button>
            )}
            <IconButton label="Refresh tables" onClick={fetchTables} tone="ghost"><RefreshCw className="w-5 h-5" /></IconButton>
            <IconButton label="Log out" onClick={logout} tone="ghost"><LogOut className="w-5 h-5" /></IconButton>
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div className="flex-1 min-h-0 flex">
        <main className="flex-1 min-w-0 overflow-y-auto pb-28 md:pb-8">
          <div className="max-w-[1100px] mx-auto px-4 md:px-6 pt-5">
            <div className="mb-4">
              <h1 className="text-[28px] md:text-[32px] leading-tight font-bold tracking-[-0.02em]">{titles[tab]}</h1>
              <p className="text-[14px] text-pd-ink-2 mt-0.5">
                {getGreeting()} · {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })} · Shift started {shiftStart.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </p>
            </div>
            {tab === "tables" && renderTables()}
            {tab === "ready" && renderReady()}
            {tab === "orders" && renderActive()}
          </div>
        </main>

        {/* Ready-to-serve inspector (landscape iPad and wider) */}
        {tab !== "ready" && (
          <aside className="hidden lg:flex w-[340px] shrink-0 flex-col border-l border-[color:var(--pd-line)] bg-white/60">
            <div className="px-5 pt-5 pb-3 flex items-baseline justify-between">
              <h2 className="text-[19px] font-bold tracking-[-0.01em]">Ready to serve</h2>
              <span className="text-[14px] text-pd-ink-2 pd-tabular">{readyOrders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
              {readyOrders.length === 0 ? (
                <EmptyState icon={CheckCircle} title="All served" message="Ready orders from the kitchen appear here." className="px-2 py-10" />
              ) : (
                readyOrders.map(order => <ReadyOrderCard key={order.order_id} order={order} compact />)
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ── BOTTOM TAB BAR (phone) ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-t border-[color:var(--pd-line)] flex"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {tabs.map(({ key, icon: Icon, label, badge }) => {
          const active = tab === key;
          return (
            <button key={key} type="button" onClick={() => setTab(key)} aria-current={active ? "page" : undefined}
              className={cx("flex-1 h-[56px] flex flex-col items-center justify-center gap-0.5", active ? "text-pd-action" : "text-pd-ink-3")}>
              <span className="relative">
                <Icon className="w-6 h-6" strokeWidth={active ? 2.25 : 1.75} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-pd-action text-white text-[11px] font-semibold pd-tabular flex items-center justify-center ring-2 ring-white">
                    {badge}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ══════════ TABLE SHEET ══════════ */}
      <Sheet open={!!sheet} onClose={closeSheet} labelledBy="table-sheet-title">
        {sheet && (
          <>
            {/* Sheet header */}
            <div className="shrink-0 px-4 md:px-6 pt-2 md:pt-4 pb-3 flex items-center gap-3 border-b border-[color:var(--pd-line)] bg-pd-surface">
              <div className="flex-1 min-w-0">
                <h2 id="table-sheet-title" className="text-[22px] leading-7 font-bold tracking-[-0.01em]">Table {sheet.table.table_number}</h2>
                <p className="flex items-center gap-1.5 text-[14px] text-pd-ink-2">
                  <StatusDot className={tableStatus(sheet.table.status).dot === "bg-white" ? "bg-pd-teal" : tableStatus(sheet.table.status).dot} />
                  <span className="capitalize">{sheet.table.status}</span>
                  {sheet.session?.orders?.length > 0 && <span className="pd-tabular">· {formatINR(sheet.session.total)} so far</span>}
                </p>
              </div>
              <CloseButton onClick={closeSheet} />
            </div>

            <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px]">
              {/* Menu column (on phone everything scrolls here) */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="md:hidden px-4 pt-4 space-y-3">
                  {renderNotices()}
                  {renderGuest()}
                  {renderSessionOrders()}
                </div>
                <div className="sticky top-0 z-10 bg-pd-surface/95 backdrop-blur px-4 md:px-6 pt-4 pb-3">
                  <SearchField icon={Search} value={menuSearch} onChange={e => setMenuSearch(e.target.value)}
                    onClear={() => setMenuSearch("")} placeholder="Search dishes" />
                </div>
                <div className="px-4 md:px-6 pb-6">
                  {renderMenu()}
                </div>
              </div>

              {/* Order column (iPad) */}
              <aside className="hidden md:flex flex-col min-h-0 bg-white border-l border-[color:var(--pd-line)]">
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                  {renderNotices()}
                  {renderGuest()}
                  <section>
                    <div className="flex items-baseline justify-between mb-2 px-1">
                      <Label>New items</Label>
                      {cartCount > 0 && <span className="text-[13px] text-pd-ink-2 pd-tabular">{cartCount} {cartCount === 1 ? "item" : "items"}</span>}
                    </div>
                    {renderCartLines()}
                  </section>
                  {renderSessionOrders()}
                </div>
                {(cart.length > 0 || billActions) && (
                  <div className="shrink-0 p-4 border-t border-[color:var(--pd-line)] space-y-3">
                    {cart.length > 0 && (
                      <>
                        <div className="flex items-baseline justify-between px-1">
                          <span className="text-[15px] text-pd-ink-2">New items total</span>
                          <span className="text-[19px] font-bold pd-tabular">{formatINR(cartTotal)}</span>
                        </div>
                        {sendButton}
                      </>
                    )}
                    {billActions}
                  </div>
                )}
              </aside>

              {/* Sticky summary bar (phone) */}
              {(cart.length > 0 || billActions) && (
                <div className="md:hidden shrink-0 px-4 pt-3 pb-3 bg-white border-t border-[color:var(--pd-line)]"
                  style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
                  {cart.length > 0 ? (
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setReviewOpen(true)}
                        className="h-12 flex-1 min-w-0 rounded-[12px] bg-pd-surface px-3.5 text-left flex items-center justify-between gap-2 pd-press">
                        <span className="min-w-0">
                          <span className="block text-[13px] text-pd-ink-2 leading-4 pd-tabular">{cartCount} {cartCount === 1 ? "item" : "items"}</span>
                          <span className="block text-[16px] font-bold leading-5 pd-tabular">{formatINR(cartTotal)}</span>
                        </span>
                        <span className="text-[14px] font-semibold text-pd-action flex items-center">Review<ChevronRight className="w-4 h-4" /></span>
                      </button>
                      <div className="flex-1">{sendButton}</div>
                    </div>
                  ) : billActions}
                </div>
              )}
            </div>

            {/* Order review (phone) */}
            {reviewOpen && cart.length > 0 && (
              <div className="md:hidden absolute inset-0 z-20 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Review order">
                <div className="absolute inset-0 bg-pd-ink/30" onClick={() => setReviewOpen(false)} />
                <div className="relative bg-pd-surface rounded-t-[24px] shadow-pd-2 max-h-[80%] flex flex-col">
                  <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                    <div>
                      <h3 className="text-[19px] font-bold">Review order</h3>
                      <p className="text-[14px] text-pd-ink-2">Table {sheet.table.table_number} · {guestName || "Guest"}</p>
                    </div>
                    <CloseButton onClick={() => setReviewOpen(false)} />
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3">{renderCartLines()}</div>
                  <div className="px-4 pt-3 bg-white border-t border-[color:var(--pd-line)] space-y-3"
                    style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
                    <div className="flex items-baseline justify-between px-1">
                      <span className="text-[15px] text-pd-ink-2">Total</span>
                      <span className="text-[19px] font-bold pd-tabular">{formatINR(cartTotal)}</span>
                    </div>
                    {sendButton}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Sheet>
    </div>
  );
};

export default CaptainPanel;
