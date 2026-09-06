import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  UtensilsCrossed, RefreshCw, LogOut, ChefHat, Plus, X, Minus,
  Check, Clock, Receipt, ShoppingBag, Users
} from "lucide-react";
import axios from "axios";
import API_BASE from "../../lib/config";

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const tableColor = (status) => {
  if (status === "free")     return { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.4)",  text: "#22c55e",  label: "Free" };
  if (status === "occupied") return { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.4)",  text: "#ef4444",  label: "Occupied" };
  return                             { bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.4)",  text: "#EAB308",  label: "Billing" };
};

const orderStatusColor = (s) => {
  if (s === "accepted")  return "text-blue-400";
  if (s === "preparing") return "text-yellow-400";
  if (s === "ready")     return "text-green-400";
  if (s === "delivered") return "text-gray-400";
  return "text-gray-500";
};

const orderStatusLabel = (s) => ({
  accepted: "⏳ Sent to Kitchen",
  preparing: "🔥 Preparing",
  ready: "✅ Ready",
  delivered: "✔ Served",
}[s] || s);

const fmt = (n) => `₹${Number(n || 0).toFixed(0)}`;

/* ── Main Component ───────────────────────────────────────────────────────── */
const CaptainPanel = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("captain_token");
  const captainName = localStorage.getItem("captain_name") || "Captain";

  /* State */
  const [tab, setTab] = useState("tables"); // "tables" | "orders"
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Sheet state */
  const [sheet, setSheet] = useState(null); // null | { type: "table"|"order", table, session }
  const [menu, setMenu] = useState([]);
  const [menuCategory, setMenuCategory] = useState("All");
  const [cart, setCart] = useState([]);           // { item_id, name, price, quantity }
  const [guestName, setGuestName] = useState("Guest");
  const [placing, setPlacing] = useState(false);
  const [closingBill, setClosingBill] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  /* Auth guard */
  useEffect(() => {
    if (!token) navigate("/captain", { replace: true });
  }, [token, navigate]);

  /* Fetch tables */
  const fetchTables = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/captain/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTables(Array.isArray(data) ? data.sort((a, b) => a.table_number - b.table_number) : []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("captain_token");
        navigate("/captain", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  /* Fetch menu */
  const fetchMenu = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/menu`);
      setMenu(Array.isArray(data) ? data.filter(i => i.available !== false) : []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchTables();
    fetchMenu();
    const interval = setInterval(fetchTables, 15000);
    return () => clearInterval(interval);
  }, [fetchTables, fetchMenu]);

  /* Refresh sheet session when tables refresh */
  useEffect(() => {
    if (sheet?.type === "table" && sheet.table) {
      const fresh = tables.find(t => t.table_number === sheet.table.table_number);
      if (fresh) setSheet(s => ({ ...s, table: fresh }));
    }
  }, [tables]);

  /* Open table sheet */
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

  /* Cart helpers */
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.item_id === (item.id || item._id));
      if (existing) return prev.map(c => c.item_id === existing.item_id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item_id: item.id || item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };
  const removeFromCart = (item_id) => setCart(prev => prev.filter(c => c.item_id !== item_id));
  const updateQty = (item_id, delta) => {
    setCart(prev => prev.map(c => c.item_id === item_id
      ? { ...c, quantity: Math.max(0, c.quantity + delta) }
      : c
    ).filter(c => c.quantity > 0));
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  /* Place order */
  const placeOrder = async () => {
    if (!cart.length) return;
    setPlacing(true);
    try {
      const items = cart.map(c => ({
        item_id: c.item_id,
        name: c.name,
        price: c.price,
        quantity: c.quantity,
        variant: null,
        variant_price: 0,
        addons: [],
        item_cost: 0,
      }));
      const res = await axios.post(
        `${API_BASE}/api/captain/order`,
        {
          table_number: sheet.table.table_number,
          items,
          customer_name: guestName || "Guest",
          session_id: sheet.session?.session_id || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart([]);
      // Refresh session
      const { data } = await axios.get(
        `${API_BASE}/api/captain/tables/${sheet.table.table_number}/session`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSheet(s => ({ ...s, session: data.has_session ? data.session : null, table: { ...s.table, status: "occupied" } }));
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  /* Close bill */
  const closeBill = async () => {
    if (!sheet?.session?.session_id) return;
    setClosingBill(true);
    try {
      await axios.post(
        `${API_BASE}/api/captain/sessions/${sheet.session.session_id}/close?payment_method=${paymentMethod}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSheet(null);
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to close bill");
    } finally {
      setClosingBill(false);
    }
  };

  const logout = () => {
    ["captain_token", "captain_name", "captain_id"].forEach(k => localStorage.removeItem(k));
    navigate("/captain", { replace: true });
  };

  /* ── Menu categories ── */
  const categories = ["All", ...new Set(menu.map(i => i.category))];
  const filteredMenu = menuCategory === "All" ? menu : menu.filter(i => i.category === menuCategory);

  /* ── Active occupied tables for "Orders" tab ── */
  const occupiedTables = tables.filter(t => t.status !== "free");

  /* ──────────────────────────────────────────────────────────────────────────
     RENDER
  ─────────────────────────────────────────────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#0f2933" }}>

      {/* ── HEADER ── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(26,72,85,0.98)", borderBottom: "1.5px solid rgba(234,179,8,0.3)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EAB308] flex items-center justify-center">
            <UtensilsCrossed className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="text-[#EAB308] font-bold text-xs uppercase tracking-widest leading-none">Captain Panel</p>
            <p className="text-white text-sm font-semibold">{captainName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchTables}
            className="p-2 rounded-xl bg-[#0f2933]/60 text-gray-400 active:scale-90 transition-transform">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={logout}
            className="p-2 rounded-xl bg-red-900/30 text-red-400 active:scale-90 transition-transform">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto pb-20">

        {/* ── TABLES TAB ── */}
        {tab === "tables" && (
          <div className="p-3">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading tables...</div>
            ) : (
              <>
                {/* Legend */}
                <div className="flex gap-3 mb-4 px-1">
                  {[{s:"free",l:"Free"},{s:"occupied",l:"Occupied"},{s:"billing",l:"Billing"}].map(({s,l}) => {
                    const c = tableColor(s);
                    return (
                      <div key={s} className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.text }} />
                        <span className="text-gray-400 text-xs">{l}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Table Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {tables.map(t => {
                    const c = tableColor(t.status);
                    return (
                      <button
                        key={t.table_number}
                        onClick={() => openTable(t)}
                        className="relative flex flex-col items-center justify-center rounded-2xl py-4 px-1 transition-all active:scale-95"
                        style={{ background: c.bg, border: `1.5px solid ${c.border}` }}
                      >
                        <span className="text-white font-bold text-lg leading-none">{t.table_number}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: c.text }}>
                          {c.label}
                        </span>
                        {t.status === "occupied" && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0f2933]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === "orders" && (
          <div className="p-3 space-y-3">
            {occupiedTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm gap-2">
                <ChefHat className="h-10 w-10 opacity-30" />
                <p>No active tables</p>
              </div>
            ) : (
              occupiedTables.map(t => (
                <button
                  key={t.table_number}
                  onClick={() => openTable(t)}
                  className="w-full text-left rounded-2xl p-4 border transition-all active:scale-[0.98]"
                  style={{ background: "rgba(26,72,85,0.7)", borderColor: "rgba(234,179,8,0.2)" }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#EAB308]/15 flex items-center justify-center">
                        <span className="text-[#EAB308] font-bold text-sm">{t.table_number}</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Table {t.table_number}</p>
                        <p className="text-gray-400 text-xs capitalize">{t.status}</p>
                      </div>
                    </div>
                    <div className="text-[#EAB308] text-xs font-bold uppercase tracking-wider">
                      View →
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── BOTTOM TAB BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ background: "rgba(26,72,85,0.98)", borderTop: "1.5px solid rgba(234,179,8,0.25)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {[
          { key: "tables", icon: Users, label: "Tables" },
          { key: "orders", icon: ShoppingBag, label: "Active" },
        ].map(({ key, icon: Icon, label }) => {
          const active = tab === key;
          return (
            <button key={key} onClick={() => setTab(key)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative">
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-[#EAB308]" />}
              <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-[#EAB308]/15" : ""}`}>
                <Icon className={`h-5 w-5 ${active ? "text-[#EAB308]" : "text-gray-400"}`} />
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${active ? "text-[#EAB308]" : "text-gray-500"}`}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════
          TABLE SHEET
      ══════════════════════════════════════════════ */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setSheet(null)} />

          {/* Bottom sheet */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-3xl overflow-hidden"
            style={{ background: "#1a4855", maxHeight: "95vh", border: "1.5px solid rgba(234,179,8,0.25)" }}>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#EAB308]/30" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 pb-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(234,179,8,0.15)" }}>
              <div>
                <h2 className="text-white font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Table {sheet.table.table_number}
                </h2>
                <p className="text-gray-400 text-xs capitalize">{sheet.table.status}</p>
              </div>
              <button onClick={() => setSheet(null)}
                className="p-2 rounded-full bg-[#0f2933]/60 text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">

              {/* Existing orders */}
              {sheet.session?.orders?.length > 0 && (
                <div className="px-4 py-3 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Current Orders</p>
                  {sheet.session.orders.map((o, i) => (
                    <div key={i} className="rounded-xl p-3"
                      style={{ background: "rgba(15,41,51,0.7)", border: "1px solid rgba(234,179,8,0.1)" }}>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-300 text-xs font-semibold">Order #{i + 1}</span>
                        <span className={`text-xs font-bold ${orderStatusColor(o.status)}`}>{orderStatusLabel(o.status)}</span>
                      </div>
                      {o.items?.map((item, j) => (
                        <div key={j} className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>{item.quantity}× {item.name}</span>
                          <span>{fmt(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="text-right text-[#EAB308] text-xs font-bold mt-1">{fmt(o.total)}</div>
                    </div>
                  ))}

                  {/* Session total */}
                  <div className="rounded-xl p-3 flex justify-between items-center"
                    style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                    <span className="text-white font-bold text-sm">Session Total</span>
                    <span className="text-[#EAB308] font-bold text-lg">{fmt(sheet.session.total)}</span>
                  </div>
                </div>
              )}

              {/* ── Add items section ── */}
              <div className="px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Add Items</p>

                {/* Guest name (only if no session yet) */}
                {!sheet.session && (
                  <input
                    type="text"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder="Guest name (optional)"
                    className="w-full bg-[#0f2933] border border-[#EAB308]/20 text-white rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-[#EAB308]/50 placeholder-gray-600"
                  />
                )}

                {/* Category pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-1 px-1 no-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setMenuCategory(cat)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        menuCategory === cat
                          ? "bg-[#EAB308] text-black"
                          : "bg-[#0f2933] text-gray-400 border border-[#EAB308]/15"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Menu items */}
                <div className="space-y-2">
                  {filteredMenu.map(item => {
                    const id = item.id || item._id;
                    const inCart = cart.find(c => c.item_id === id);
                    return (
                      <div key={id} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                        style={{ background: "rgba(15,41,51,0.7)", border: "1px solid rgba(234,179,8,0.1)" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                          <p className="text-[#EAB308] text-xs font-bold">{fmt(item.price)}</p>
                        </div>
                        {inCart ? (
                          <div className="flex items-center gap-2 ml-3">
                            <button onClick={() => updateQty(id, -1)}
                              className="w-7 h-7 rounded-full bg-[#EAB308]/15 text-[#EAB308] flex items-center justify-center active:scale-90">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-white font-bold text-sm w-4 text-center">{inCart.quantity}</span>
                            <button onClick={() => updateQty(id, 1)}
                              className="w-7 h-7 rounded-full bg-[#EAB308] text-black flex items-center justify-center active:scale-90">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(item)}
                            className="ml-3 w-8 h-8 rounded-full bg-[#EAB308] text-black flex items-center justify-center active:scale-90 shrink-0">
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Sheet footer ── */}
            <div className="shrink-0 px-4 py-4 space-y-2"
              style={{ borderTop: "1px solid rgba(234,179,8,0.15)" }}>

              {/* Cart summary */}
              {cart.length > 0 && (
                <div className="rounded-xl p-3 mb-2"
                  style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm font-bold">{cart.length} item(s) in cart</span>
                    <span className="text-[#EAB308] font-bold">{fmt(cartTotal)}</span>
                  </div>
                </div>
              )}

              {/* Send to kitchen */}
              {cart.length > 0 && (
                <button onClick={placeOrder} disabled={placing}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-black disabled:opacity-60 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg,#EAB308,#d97706)" }}>
                  <ChefHat className="h-4 w-4" />
                  {placing ? "Sending..." : "Send to Kitchen"}
                </button>
              )}

              {/* Close bill */}
              {sheet.session?.orders?.length > 0 && cart.length === 0 && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {["cash","card","upi"].map(pm => (
                      <button key={pm} onClick={() => setPaymentMethod(pm)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                          paymentMethod === pm ? "bg-[#EAB308] text-black" : "bg-[#0f2933] text-gray-400 border border-[#EAB308]/20"
                        }`}>
                        {pm}
                      </button>
                    ))}
                  </div>
                  <button onClick={closeBill} disabled={closingBill}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 active:scale-[0.98]"
                    style={{ background: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.4)" }}>
                    <Receipt className="h-4 w-4" />
                    {closingBill ? "Closing..." : `Close Bill — ${fmt(sheet.session.total)}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainPanel;
