﻿import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Check,
  UtensilsCrossed,
  Clock,
  ChefHat,
  X,
  Globe,
  RefreshCw,
  Lock,
  Search,
  Sparkles,
  Flame,
  Wine,
  Coffee,
  Award,
  ChevronRight,
  Eye,
  Info
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import API_BASE from "../lib/config";

const MAX_TABLES = 44;

// Category metadata mapping for royal subtitles & icons
const CATEGORY_META = {
  "Biryani": {
    sub: "Dum Pukht Basmati Specialties",
    icon: Flame,
    feat: true,
  },
  "Starters": {
    sub: "Clay Oven Charcoal Delicacies",
    icon: UtensilsCrossed,
    feat: false,
  },
  "Main Course": {
    sub: "Rich Mughlai & Persian Gravies",
    icon: ChefHat,
    feat: false,
  },
  "Mocktails": {
    sub: "Artisanal Crafted Coolers & Sips",
    icon: Wine,
    feat: false,
  },
  "Beverages": {
    sub: "Chilled Refreshers & Shakes",
    icon: Coffee,
    feat: false,
  },
  "Breads": {
    sub: "Tandoor Baked Roti & Naan",
    icon: Sparkles,
    feat: false,
  },
  "Desserts": {
    sub: "Royal Sweet Finales & Shahi Tukda",
    icon: Award,
    feat: false,
  },
};

const TableOrder = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const tableNumber = parseInt(searchParams.get("table") || "0");

  // Session state
  const [session, setSession] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [sessionLocked, setSessionLocked] = useState(false);

  // Menu state
  const [menu, setMenu] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dietFilter, setDietFilter] = useState("all"); // 'all' | 'veg' | 'non-veg'
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals & detail view
  const [selectedDish, setSelectedDish] = useState(null);
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Order tracking
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [showStatusPage, setShowStatusPage] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const dishesSectionRef = useRef(null);

  // Check for existing session on load
  useEffect(() => {
    if (tableNumber > 0 && tableNumber <= MAX_TABLES) {
      checkExistingSession();
      fetchMenu();
    }
  }, [tableNumber]);

  const checkExistingSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/table/${tableNumber}/session`);
      const data = await res.json();
      if (data.has_session && data.session) {
        const storedSessionId = localStorage.getItem(`table_${tableNumber}_session`);
        if (data.session.status === "closed") {
          localStorage.removeItem(`table_${tableNumber}_session`);
          setShowNameModal(true);
        } else if (storedSessionId === data.session.session_id) {
          setSession(data.session);
          setCustomerName(data.session.customer_name);
          setSessionLocked(false);
        } else {
          setSession(data.session);
          setSessionLocked(true);
        }
      } else {
        setShowNameModal(true);
      }
    } catch (err) {
      setShowNameModal(true);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/menu`);
      const data = await res.json();
      setMenu(data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load menu", variant: "destructive" });
    }
  };

  const startSession = async () => {
    if (!customerName.trim()) {
      return toast({ title: "Name Required", description: "Please enter your name", variant: "destructive" });
    }

    try {
      const res = await fetch(`${API_BASE}/api/table/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_number: tableNumber, customer_name: customerName })
      });
      const data = await res.json();

      if (res.status === 409) {
        toast({ title: "Table Occupied", description: data.detail || "This table is occupied. Please wait for the bill.", variant: "destructive" });
        return;
      }

      if (!res.ok) {
        toast({ title: "Error", description: data.detail || "Failed to start session", variant: "destructive" });
        return;
      }

      if (data.session) {
        localStorage.setItem(`table_${tableNumber}_session`, data.session.session_id);
        setSession(data.session);
        setShowNameModal(false);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to start session", variant: "destructive" });
    }
  };

  // Poll for order status updates
  const pollStatus = React.useCallback(async (manual = false) => {
    if (!session?.session_id) return;
    if (manual) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/table/session/${session.session_id}/status`);
      if (!res.ok) {
        localStorage.removeItem(`table_${tableNumber}_session`);
        setSession(null);
        setSessionLocked(false);
        setShowStatusPage(false);
        setShowNameModal(true);
        return;
      }
      const data = await res.json();
      setSession(data);
      if (data.status === "closed") {
        localStorage.removeItem(`table_${tableNumber}_session`);
        setSession(null);
        setSessionLocked(false);
        setShowStatusPage(false);
        setCart([]);
        setShowNameModal(true);
        return;
      }
      if (data.orders?.length > 0) {
        const latestOrder = data.orders[data.orders.length - 1];
        setOrderStatus(latestOrder.status);
      }
    } catch (err) {
    } finally {
      if (manual) setRefreshing(false);
    }
  }, [session?.session_id, tableNumber]);

  useEffect(() => {
    if (!session?.session_id) return;
    pollStatus();
    const interval = setInterval(() => pollStatus(), 60000);
    return () => clearInterval(interval);
  }, [session?.session_id, pollStatus]);

  // Derived Category Lists
  const rawCategories = Array.from(new Set(menu.map((i) => i.category))).filter(Boolean);
  const categories = ["All", ...rawCategories];

  // Filtering
  const filteredItems = menu.filter((item) => {
    if (!item.available) return false;
    const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDiet =
      dietFilter === "all" ||
      (dietFilter === "veg" && item.veg) ||
      (dietFilter === "non-veg" && !item.veg);

    return matchesCat && matchesSearch && matchesDiet;
  });

  // Cart operations
  const getItemQty = (id) => {
    const found = cart.find((c) => c._id === id);
    return found ? found.quantity : 0;
  };

  const addToCart = (item, e) => {
    if (e) e.stopPropagation();
    const existing = cart.find((c) => c._id === item._id);
    if (existing) {
      setCart(cart.map((c) => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast({ title: "Added to Order", description: `${item.name}` });
  };

  const updateQuantity = (id, change, e) => {
    if (e) e.stopPropagation();
    setCart(cart.map((item) => {
      if (item._id === id) {
        const nextQty = item.quantity + change;
        return nextQty > 0 ? { ...item, quantity: nextQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id, e) => {
    if (e) e.stopPropagation();
    setCart(cart.filter((item) => item._id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gstAmount = Math.round(cartTotal * 0.05);
  const grandTotal = cartTotal + gstAmount;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      return toast({ title: "Order Empty", description: "Please add items to order", variant: "destructive" });
    }

    setLoading(true);
    try {
      const orderData = {
        table_number: tableNumber,
        customer_name: customerName || "Guest",
        session_id: session?.session_id || null,
        items: cart.map((item) => ({
          item_id: String(item._id),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variant: null,
          variant_price: 0,
          addons: [],
          special_instructions: null,
          item_cost: item.price * 0.4
        })),
        special_instructions: null
      };

      const res = await fetch(`${API_BASE}/api/table/session/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error((await res.json()).detail || "Order failed");

      const data = await res.json();
      setCurrentOrder(data.order);
      setOrderStatus("pending_approval");

      localStorage.setItem(`table_${tableNumber}_session`, data.session_id);

      setSession(prev => ({
        ...prev,
        session_id: data.session_id,
        order_ids: [...(prev?.order_ids || []), data.order.order_id]
      }));
      setCart([]);
      setShowMobileCart(false);
      setShowStatusPage(true);

      toast({ title: "Order Dispatched!", description: "Sent directly to kitchen chef" });
    } catch (err) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryCardClick = (catName) => {
    setSelectedCategory(catName);
    if (dishesSectionRef.current) {
      dishesSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Order status display
  const getStatusDisplay = (status) => {
    const statusMap = {
      pending_approval: { icon: Clock, text: "Waiting for Approval", color: "text-[#EAB308]", bg: "bg-[#EAB308]/15", step: 1 },
      accepted: { icon: Check, text: "Order Accepted", color: "text-emerald-400", bg: "bg-emerald-500/15", step: 2 },
      preparing: { icon: ChefHat, text: "Chef Preparing", color: "text-sky-400", bg: "bg-sky-500/15", step: 3 },
      ready: { icon: UtensilsCrossed, text: "Ready to Serve", color: "text-amber-400", bg: "bg-amber-500/15", step: 4 },
      served: { icon: Check, text: "Served to Table", color: "text-emerald-400", bg: "bg-emerald-500/15", step: 5 },
      rejected: { icon: X, text: "Order Cancelled", color: "text-rose-400", bg: "bg-rose-500/15", step: 0 },
    };
    return statusMap[status] || statusMap.pending_approval;
  };

  // 1. Invalid Table Screen
  if (!tableNumber || tableNumber < 1 || tableNumber > MAX_TABLES) {
    return (
      <div className="min-h-screen bg-[#081a22] flex items-center justify-center p-6 text-white font-['Outfit',sans-serif]">
        <div className="bg-[#0f2933] border border-[#EAB308]/20 rounded-3xl p-8 text-center max-w-md w-full shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-5 text-rose-400">
            <X className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-['Playfair_Display',serif] text-rose-400 mb-2">Invalid Dining Table</h1>
          <p className="text-gray-300 text-sm mb-4">Table number must be between 1 and {MAX_TABLES}.</p>
          <p className="text-gray-500 text-xs">Please scan the golden QR code placed on your Persian Darbar table.</p>
        </div>
      </div>
    );
  }

  // 2. Session Locked Screen
  if (sessionLocked && session) {
    return (
      <div className="min-h-screen bg-[#081a22] flex items-center justify-center px-4 font-['Outfit',sans-serif] relative overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-[#EAB308]/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-[#163f4b]/30 blur-[100px] rounded-full pointer-events-none" />

        <div className="bg-[#0f2933] border border-[#EAB308]/25 rounded-3xl p-8 text-center max-w-md w-full shadow-2xl relative z-10">
          <div className="w-16 h-16 bg-[#EAB308]/10 border border-[#EAB308]/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#EAB308]">
            <Lock className="w-8 h-8" />
          </div>
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#EAB308] font-bold block mb-1">Dine-In Session Active</span>
          <h1 className="text-3xl text-white font-['Playfair_Display',serif] mb-3">Table {tableNumber} In Use</h1>
          <p className="text-gray-300 text-sm mb-4">
            Currently opened by <span className="text-[#EAB308] font-bold">{session.customer_name}</span>.
          </p>
          <p className="text-gray-500 text-xs mb-8">
            If you belong to this party, please ask the primary device to order or wait until the table check is completed.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#163f4b] hover:bg-[#EAB308] hover:text-black border border-[#EAB308]/30 text-white py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Check Availability</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Name Entry Welcome Modal
  if (showNameModal) {
    return (
      <div className="min-h-screen bg-[#081a22] flex items-center justify-center px-4 font-['Outfit',sans-serif] relative overflow-hidden">
        <div className="absolute top-10 right-10 w-96 h-96 bg-[#EAB308]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#163f4b]/40 blur-[120px] rounded-full pointer-events-none" />

        <div className="bg-[#0f2933] border border-[#EAB308]/30 rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center p-4 mb-4">
              <div className="absolute inset-0 border border-[#EAB308]/30 rounded-full animate-ping opacity-25" />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1a4855] to-[#0f2933] border border-[#EAB308]/40 flex items-center justify-center shadow-lg shadow-[#EAB308]/10">
                <span className="text-[#EAB308] font-['Playfair_Display',serif] text-3xl font-extrabold tracking-tight">PD</span>
              </div>
            </div>

            <span className="text-[#EAB308] text-[11px] font-bold uppercase tracking-[0.3em] block mb-1">
              Table {tableNumber} Â· Royal Dining
            </span>
            <h1 className="text-3xl text-white font-['Playfair_Display',serif] font-bold mb-2">
              Persian Darbar
            </h1>
            <p className="text-gray-400 text-xs italic">
              Authentic Iranian & Royal Mughlai Cuisine Since 1978
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-2">
                Guest Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="How shall we address you?"
                className="w-full bg-[#163f4b]/60 border border-[#EAB308]/30 rounded-2xl px-5 py-4 text-sm font-medium text-white outline-none focus:border-[#EAB308] focus:ring-1 focus:ring-[#EAB308]/50 transition-all placeholder:text-gray-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customerName.trim()) startSession();
                }}
              />
            </div>

            <button
              onClick={startSession}
              disabled={!customerName.trim()}
              className="w-full bg-gradient-to-r from-[#EAB308] to-[#ca9a07] text-black py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs shadow-xl shadow-[#EAB308]/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 disabled:hover:brightness-100"
            >
              Begin Royal Dining
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Order Status Page
  if (showStatusPage && session?.orders?.length > 0) {
    return (
      <div className="min-h-screen bg-[#081a22] text-white font-['Outfit',sans-serif] pb-24">
        {/* Top Sticky Bar */}
        <div className="bg-[#0f2933]/90 backdrop-blur-md border-b border-[#EAB308]/20 sticky top-0 z-40 py-3.5 px-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAB308] text-black flex items-center justify-center font-['Playfair_Display',serif] font-bold text-sm shadow-md">
                PD
              </div>
              <div>
                <h1 className="text-sm font-bold text-[#EAB308]">Table {tableNumber}</h1>
                <p className="text-xs text-gray-300">{customerName || "Guest"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => pollStatus(true)}
                disabled={refreshing}
                title="Refresh order status"
                className="w-9 h-9 rounded-full bg-[#163f4b] border border-[#EAB308]/30 flex items-center justify-center text-[#EAB308] hover:bg-[#EAB308]/20 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setShowStatusPage(false)}
                className="bg-gradient-to-r from-[#EAB308] to-[#ca9a07] text-black px-4 py-2 rounded-full font-bold text-xs shadow-md"
              >
                + Order More
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#EAB308] font-bold">Live Kitchen Tracker</span>
            <h2 className="text-2xl font-bold font-['Playfair_Display',serif] text-white mt-1">Your Table Orders</h2>
          </div>

          {session.orders.map((order, idx) => {
            const status = getStatusDisplay(order.status);
            const StatusIcon = status.icon;

            return (
              <div key={order.order_id} className="bg-[#0f2933] rounded-3xl p-6 border border-[#EAB308]/20 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#EAB308]/15">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Order #{idx + 1}</span>
                  <span className="text-xs font-mono text-[#EAB308] bg-[#EAB308]/10 px-2.5 py-1 rounded-full border border-[#EAB308]/20">
                    {order.kot_number || order.order_id?.slice(-8)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    {["Accepted", "Preparing", "Ready", "Served"].map((step, i) => {
                      const stepNum = i + 2;
                      const isActive = status.step >= stepNum;
                      const isCurrent = status.step === stepNum;
                      return (
                        <div key={step} className="flex flex-col items-center flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs font-bold transition-all ${
                            isActive ? "bg-[#EAB308] text-black shadow-md shadow-[#EAB308]/20" : "bg-[#163f4b] text-gray-400"
                          } ${isCurrent ? "ring-2 ring-[#EAB308] ring-offset-2 ring-offset-[#0f2933]" : ""}`}>
                            {i + 1}
                          </div>
                          <span className={`text-[10px] font-medium ${isActive ? "text-[#EAB308]" : "text-gray-500"}`}>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-1.5 bg-[#163f4b] rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full bg-gradient-to-r from-[#EAB308] to-[#ca9a07] transition-all duration-500 rounded-full"
                      style={{ width: `${Math.max(0, (status.step - 1) * 33.33)}%` }}
                    />
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center justify-center gap-3 py-3.5 rounded-2xl mb-4 ${status.bg}`}>
                  <StatusIcon className={`h-5 w-5 ${status.color}`} />
                  <span className={`text-base font-bold ${status.color}`}>{status.text}</span>
                </div>

                {/* Items List */}
                <div className="space-y-2 py-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-300">
                      <span>{item.quantity}Ã— {item.name}</span>
                      <span className="font-semibold text-white">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-[#EAB308]/15 flex justify-between items-center">
                  <span className="text-xs text-gray-400">Order Subtotal</span>
                  <span className="text-[#EAB308] font-bold text-base">₹{order.total}</span>
                </div>
              </div>
            );
          })}

          {/* Session Total Card */}
          <div className="bg-gradient-to-br from-[#163f4b] to-[#0f2933] rounded-3xl p-6 border border-[#EAB308]/30 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#EAB308] font-bold block">Grand Total</span>
                <span className="text-white text-lg font-['Playfair_Display',serif]">Table Session Total</span>
              </div>
              <span className="text-3xl font-bold font-['Playfair_Display',serif] text-[#EAB308]">₹{session.total || 0}</span>
            </div>
            <p className="text-gray-400 text-xs mt-3 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#EAB308]" />
              You can pay via UPI, Card, or Cash with your table captain when ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 5. Main Royal Menu & Ordering UI
  return (
    <div className="min-h-screen bg-[#081a22] text-white font-['Outfit',sans-serif] pb-28 lg:pb-12">
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          COMPACT ROYAL HEADER (Inspired by Blue Nile)
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <header className="relative bg-gradient-to-b from-[#0a232c] via-[#0f2933] to-[#081a22] pt-8 pb-6 px-4 border-b border-[#EAB308]/20 overflow-hidden">
        {/* Soft Ambient Gold Aura */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(234,179,8,0.12),transparent_70%)]" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Top Row Badges */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-[#EAB308]/30 px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wider text-gray-300">
              <span className="w-2 h-2 rounded-full bg-[#EAB308] shadow-[0_0_8px_#EAB308] animate-pulse" />
              <span>Table {tableNumber} Â· Dine-In</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => pollStatus(true)}
                disabled={refreshing}
                title="Refresh menu & status"
                className="w-8 h-8 rounded-full bg-white/5 border border-[#EAB308]/20 flex items-center justify-center text-[#EAB308] hover:bg-[#EAB308]/20 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              </button>

              {session?.orders?.length > 0 && (
                <button
                  onClick={() => setShowStatusPage(true)}
                  className="bg-[#EAB308]/15 hover:bg-[#EAB308]/25 text-[#EAB308] border border-[#EAB308]/40 px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Orders ({session.orders.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Center Brand Crest */}
          <div className="text-center relative py-2">
            <div className="inline-flex items-center justify-center relative mb-2">
              {/* Pulsing rings */}
              <div className="w-16 h-16 rounded-full border border-[#EAB308]/40 absolute animate-ping opacity-20" />
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#163f4b] to-[#0f2933] border border-[#EAB308]/50 flex items-center justify-center shadow-lg shadow-[#EAB308]/15">
                <span className="text-[#EAB308] font-['Playfair_Display',serif] text-2xl font-black">PD</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-['Playfair_Display',serif] text-white tracking-wide">
              Persian Darbar
            </h1>
            <p className="text-[11px] font-['Playfair_Display',serif] italic tracking-[0.2em] text-[#EAB308] mt-1 flex items-center justify-center gap-3">
              <span className="w-6 h-[1px] bg-[#EAB308]/50" />
              ROYAL DINE-IN CULINARY SELECTION
              <span className="w-6 h-[1px] bg-[#EAB308]/50" />
            </p>
          </div>
        </div>

        {/* Thin Gold Gradient Border at Header Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#EAB308] to-transparent" />
      </header>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          STICKY PILL NAVIGATION BAR
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="sticky top-0 z-30 bg-[#081a22]/95 backdrop-blur-xl border-b border-[#EAB308]/20 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-2.5">
          {/* Top Controls: Search & Diet toggle */}
          <div className="flex items-center gap-2 mb-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search royal dishes, kebabs, biryani..."
                className="w-full bg-[#0f2933] border border-[#EAB308]/20 rounded-full pl-9 pr-8 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#EAB308]/60 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Veg / Non-Veg Quick Switch */}
            <div className="flex bg-[#0f2933] p-0.5 rounded-full border border-[#EAB308]/20 text-[11px] shrink-0 font-medium">
              <button
                onClick={() => setDietFilter("all")}
                className={`px-2.5 py-1 rounded-full transition ${dietFilter === "all" ? "bg-[#EAB308] text-black font-bold" : "text-gray-400"}`}
              >
                All
              </button>
              <button
                onClick={() => setDietFilter("veg")}
                className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 ${dietFilter === "veg" ? "bg-emerald-600 text-white font-bold" : "text-emerald-400"}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Veg
              </button>
              <button
                onClick={() => setDietFilter("non-veg")}
                className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 ${dietFilter === "non-veg" ? "bg-rose-700 text-white font-bold" : "text-rose-400"}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Non-Veg
              </button>
            </div>
          </div>

          {/* Horizontal Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              const meta = CATEGORY_META[cat];
              const CatIcon = meta?.icon || UtensilsCrossed;

              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryCardClick(cat)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide flex items-center gap-1.5 transition-all shrink-0 ${
                    isActive
                      ? "bg-gradient-to-r from-[#EAB308] to-[#ca9a07] text-black font-bold shadow-md shadow-[#EAB308]/20 scale-105"
                      : "bg-[#0f2933] border border-[#EAB308]/25 text-gray-300 hover:text-white hover:border-[#EAB308]"
                  }`}
                >
                  <CatIcon className={`w-3 h-3 ${isActive ? "text-black" : "text-[#EAB308]"}`} />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            BENTO GRID (Category Showcase when 'All' selected)
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {selectedCategory === "All" && !searchQuery.trim() && (
          <section className="mb-10">
            <div className="text-center mb-6">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#EAB308] font-bold">Royal Menu Collection</span>
              <h2 className="text-2xl font-bold font-['Playfair_Display',serif] text-white">Explore Categories</h2>
              <p className="text-xs text-gray-400 mt-1">Tap any category to explore dishes or tap a dish for royal details</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
              {rawCategories.map((cat, i) => {
                const meta = CATEGORY_META[cat] || {
                  sub: "Persian Darbar Specialties",
                  icon: UtensilsCrossed,
                  feat: false,
                };
                const CatIcon = meta.icon;
                const count = menu.filter((m) => m.category === cat && m.available).length;
                const isHero = meta.feat;

                return (
                  <div
                    key={cat}
                    onClick={() => handleCategoryCardClick(cat)}
                    className={`relative rounded-2xl p-4 sm:p-5 cursor-pointer overflow-hidden transition-all duration-300 group ${
                      isHero
                        ? "col-span-2 bg-gradient-to-br from-[#184956] via-[#10343e] to-[#0f2933] border border-[#EAB308]/50 shadow-xl shadow-[#EAB308]/10 hover:border-[#EAB308]"
                        : "bg-[#0f2933] border border-[#EAB308]/20 hover:border-[#EAB308]/60 shadow-lg hover:-translate-y-1"
                    }`}
                  >
                    {/* Inset dashed frame for luxury menu look */}
                    <div className="absolute inset-2 border border-dashed border-[#EAB308]/15 rounded-xl pointer-events-none group-hover:border-[#EAB308]/30 transition" />

                    {/* Watermark serial number */}
                    <span className="absolute top-2 right-3 font-['Cormorant_Garamond',serif] text-4xl sm:text-5xl font-bold text-[#EAB308]/10 group-hover:text-[#EAB308]/20 transition pointer-events-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl bg-[#163f4b] border border-[#EAB308]/30 flex items-center justify-center text-[#EAB308] mb-3 group-hover:scale-110 transition shadow-md">
                          <CatIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-['Playfair_Display',serif] text-base sm:text-lg font-bold text-white group-hover:text-[#EAB308] transition leading-snug">
                          {cat}
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                          {meta.sub}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#EAB308]/15">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#EAB308]">
                          {count} {count === 1 ? "Dish" : "Dishes"}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-[#163f4b] border border-[#EAB308]/30 flex items-center justify-center text-[#EAB308] group-hover:bg-[#EAB308] group-hover:text-black transition">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            DISHES GRID & DESKTOP CART LAYOUT
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div ref={dishesSectionRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Dishes Column (Span 2 on Desktop) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#EAB308]/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EAB308]" />
                <h2 className="text-xl font-bold font-['Playfair_Display',serif] text-white">
                  {selectedCategory === "All" ? "Full Royal Menu" : selectedCategory}
                </h2>
                <span className="text-xs text-gray-400">({filteredItems.length})</span>
              </div>
              {selectedCategory !== "All" && (
                <button
                  onClick={() => setSelectedCategory("All")}
                  className="text-xs text-[#EAB308] hover:underline"
                >
                  View All Categories
                </button>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-[#0f2933] rounded-3xl border border-[#EAB308]/20">
                <UtensilsCrossed className="w-10 h-10 text-[#EAB308]/40 mx-auto mb-3" />
                <p className="text-gray-300 font-medium">No dishes match your selection</p>
                <p className="text-gray-500 text-xs mt-1">Try resetting the dietary filter or search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredItems.map((item) => {
                  const qty = getItemQty(item._id);

                  return (
                    <div
                      key={item._id}
                      onClick={() => setSelectedDish(item)}
                      className="bg-[#0f2933] border border-[#EAB308]/20 hover:border-[#EAB308]/50 rounded-2xl p-3.5 flex gap-3 transition-all duration-200 group cursor-pointer hover:shadow-xl hover:shadow-[#EAB308]/5 relative overflow-hidden"
                    >
                      {/* Left Accent Bar on Hover */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#EAB308] opacity-0 group-hover:opacity-100 transition" />

                      {/* Image / Cloche Placeholder */}
                      <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden bg-[#163f4b] shrink-0 border border-[#EAB308]/20">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[#EAB308] p-2 bg-gradient-to-br from-[#184956] to-[#0f2933]">
                            <ChefHat className="w-6 h-6 mb-1 text-[#EAB308]/80" />
                            <span className="text-[8px] uppercase tracking-wider text-gray-300 font-bold">Royal Chef</span>
                          </div>
                        )}

                        {/* Quick View Eye */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      {/* Dish Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            {/* Indian Veg / Non-Veg Indicator */}
                            {item.veg ? (
                              <span className="w-3.5 h-3.5 border border-emerald-500 rounded-sm flex items-center justify-center shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              </span>
                            ) : (
                              <span className="w-3.5 h-3.5 border border-rose-500 rounded-sm flex items-center justify-center shrink-0 relative">
                                <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-rose-500" />
                              </span>
                            )}
                            <h3 className="font-['Playfair_Display',serif] text-sm font-bold text-white group-hover:text-[#EAB308] transition truncate">
                              {item.name}
                            </h3>
                          </div>

                          <p className="text-gray-400 text-xs line-clamp-1 font-light leading-relaxed">
                            {item.description || "Authentic specialty crafted with traditional herbs & spices."}
                          </p>
                        </div>

                        {/* Price & Action */}
                        <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-[#EAB308]/10">
                          <span className="text-[#EAB308] font-bold text-sm tracking-wide font-['Outfit',sans-serif]">
                            ₹{item.price}
                          </span>

                          {/* Stepper / ADD Button */}
                          {qty > 0 ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 bg-[#163f4b] border border-[#EAB308]/40 rounded-lg p-0.5"
                            >
                              <button
                                onClick={(e) => updateQuantity(item._id, -1, e)}
                                className="w-6 h-6 rounded-md bg-[#0f2933] text-white flex items-center justify-center hover:bg-rose-900/50 hover:text-rose-300 transition"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold text-[#EAB308] w-4 text-center">
                                {qty}
                              </span>
                              <button
                                onClick={(e) => updateQuantity(item._id, 1, e)}
                                className="w-6 h-6 rounded-md bg-[#EAB308] text-black flex items-center justify-center hover:brightness-110 transition"
                              >
                                <Plus className="w-3 h-3 font-bold" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => addToCart(item, e)}
                              className="bg-[#EAB308] hover:bg-white text-black px-3.5 py-1 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm"
                            >
                              + ADD
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              DESKTOP CART FOLIO (Sticky Right Column)
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <div className="hidden lg:block">
            <div className="bg-[#0f2933] border border-[#EAB308]/30 rounded-3xl p-5 sticky top-28 shadow-2xl overflow-hidden">
              {/* Gold Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#EAB308] to-transparent" />

              <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#EAB308]/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EAB308]/15 text-[#EAB308] flex items-center justify-center border border-[#EAB308]/30">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-['Playfair_Display',serif] text-base font-bold text-white">Your Table Order</h3>
                    <p className="text-[10px] text-gray-400">Table {tableNumber} Â· {customerName}</p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-[#EAB308]/10 text-[#EAB308] px-2.5 py-0.5 rounded-full border border-[#EAB308]/30">
                  {cartCount} {cartCount === 1 ? "Item" : "Items"}
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm font-medium">Your order folio is empty</p>
                  <p className="text-gray-500 text-xs mt-1">Tap + ADD on any dish to send it to the kitchen.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item._id}
                        className="bg-[#163f4b]/50 border border-[#EAB308]/15 rounded-xl p-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{item.name}</p>
                          <p className="text-xs text-[#EAB308] font-mono">₹{item.price * item.quantity}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => updateQuantity(item._id, -1, e)}
                            className="w-5 h-5 rounded-md bg-[#0f2933] text-gray-300 flex items-center justify-center hover:bg-rose-900/50 hover:text-white"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-bold text-white w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={(e) => updateQuantity(item._id, 1, e)}
                            className="w-5 h-5 rounded-md bg-[#EAB308] text-black flex items-center justify-center hover:brightness-110"
                          >
                            <Plus className="w-2.5 h-2.5 font-bold" />
                          </button>
                          <button
                            onClick={(e) => removeFromCart(item._id, e)}
                            className="text-gray-400 hover:text-rose-400 ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="mt-4 pt-3 border-t border-[#EAB308]/20 space-y-1.5 text-xs text-gray-300">
                    <div className="flex justify-between">
                      <span>Items Subtotal</span>
                      <span className="font-semibold text-white">₹{cartTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Restaurant GST (5%)</span>
                      <span className="text-white">₹{gstAmount}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#EAB308]/15 text-sm font-bold">
                      <span className="text-white font-['Playfair_Display',serif]">Table Bill Total</span>
                      <span className="text-[#EAB308] text-lg font-mono">₹{grandTotal}</span>
                    </div>
                  </div>

                  {/* Send to Kitchen Button */}
                  <button
                    onClick={handleSubmitOrder}
                    disabled={loading}
                    className="w-full mt-4 bg-gradient-to-r from-[#EAB308] to-[#ca9a07] text-black py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-[#EAB308]/20 hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending to Chef...</span>
                      </>
                    ) : (
                      <>
                        <ChefHat className="w-4 h-4" />
                        <span>Send to Kitchen</span>
                      </>
                    )}
                  </button>
                </>
              )}

              <div className="mt-4 pt-3 border-t border-[#EAB308]/15 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-[#EAB308] transition"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Visit Persian Darbar Website</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MOBILE FLOATING CART BAR
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40">
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full bg-gradient-to-r from-[#EAB308] to-[#ca9a07] text-black py-3.5 px-5 rounded-2xl font-bold flex items-center justify-between shadow-2xl shadow-[#EAB308]/30 active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="bg-black/20 rounded-xl w-8 h-8 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-xs block font-extrabold uppercase tracking-wide">
                  {cartCount} {cartCount === 1 ? "Item" : "Items"} in Order
                </span>
                <span className="text-[10px] text-black/80 font-medium">Tap to review & dispatch</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-black font-mono">₹{grandTotal}</span>
              <div className="w-6 h-6 rounded-full bg-black/15 flex items-center justify-center">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MOBILE CART BOTTOM SHEET
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowMobileCart(false)}
          />

          <div className="relative bg-[#0f2933] border-t border-[#EAB308]/30 rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up shadow-2xl">
            {/* Grab handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1 bg-gray-600 rounded-full" />
            </div>

            <div className="flex justify-between items-center px-5 py-3 border-b border-[#EAB308]/15">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#EAB308]" />
                <h3 className="font-['Playfair_Display',serif] text-lg font-bold text-white">Your Table Order</h3>
              </div>
              <button
                onClick={() => setShowMobileCart(false)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-2.5 flex-1">
              {cart.map((item) => (
                <div
                  key={item._id}
                  className="bg-[#163f4b]/60 border border-[#EAB308]/20 rounded-2xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{item.name}</p>
                    <p className="text-xs text-[#EAB308] font-mono mt-0.5">₹{item.price * item.quantity}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => updateQuantity(item._id, -1, e)}
                      className="w-7 h-7 rounded-lg bg-[#0f2933] text-white flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold text-white w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={(e) => updateQuantity(item._id, 1, e)}
                      className="w-7 h-7 rounded-lg bg-[#EAB308] text-black flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3 font-bold" />
                    </button>
                    <button
                      onClick={(e) => removeFromCart(item._id, e)}
                      className="text-gray-400 hover:text-rose-400 ml-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom calculation & checkout */}
            <div className="p-5 border-t border-[#EAB308]/20 bg-[#0c222b]">
              <div className="space-y-1.5 text-xs text-gray-300 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="text-white">₹{gstAmount}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#EAB308]/15 text-base font-bold">
                  <span className="text-white font-['Playfair_Display',serif]">Grand Total</span>
                  <span className="text-[#EAB308] font-mono text-xl">₹{grandTotal}</span>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#EAB308] to-[#ca9a07] text-black py-4 rounded-2xl font-bold uppercase tracking-wider text-sm shadow-xl shadow-[#EAB308]/20 hover:brightness-110 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending to Chef...</span>
                  </>
                ) : (
                  <>
                    <ChefHat className="w-5 h-5" />
                    <span>Send Order to Kitchen</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                Order will be prepared immediately for Table {tableNumber}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MODAL 2: DISH DETAIL MODAL (With Animated Cloche)
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {selectedDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedDish(null)}
          />

          <div className="relative bg-[#0f2933] border border-[#EAB308]/40 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl z-10 animate-fade-in">
            {/* Top gold stripe */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#EAB308] to-transparent" />

            {/* Close Button */}
            <button
              onClick={() => setSelectedDish(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/50 border border-white/20 text-white flex items-center justify-center hover:bg-[#EAB308] hover:text-black transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Photo / Cloche Area */}
            <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-[#163f4b] via-[#10333d] to-[#0a2027] overflow-hidden flex flex-col items-center justify-center border-b border-[#EAB308]/20">
              {selectedDish.image ? (
                <img
                  src={selectedDish.image}
                  alt={selectedDish.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Animated Cloche with rising steam lines (Blue Nile style) */
                <div className="flex flex-col items-center justify-center text-[#EAB308] py-6">
                  <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#EAB308] drop-shadow-[0_4px_12px_rgba(234,179,8,0.4)]" fill="none" stroke="currentColor">
                    <path d="M42 20 Q44 15 42 10" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse" opacity="0.6" />
                    <path d="M50 18 Q52 12 50 7" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse" opacity="0.8" />
                    <path d="M58 20 Q60 15 58 10" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse" opacity="0.6" />
                    <circle cx="50" cy="24" r="3.5" strokeWidth="2" />
                    <path d="M22 56 C22 34 32 28 50 28 C68 28 78 34 78 56" strokeWidth="2" strokeLinecap="round" />
                    <path d="M16 56 L84 56 C86.2 56 88 57.8 88 60 L88 62 L12 62 L12 60 C12 57.8 13.8 56 16 56 Z" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M24 62 L76 62" strokeWidth="2" />
                  </svg>
                  <span className="mt-2 text-[10px] uppercase tracking-[0.25em] text-[#EAB308] font-bold bg-[#EAB308]/10 border border-[#EAB308]/30 px-3 py-0.5 rounded-full">
                    Heritage Culinary Craft
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex justify-between items-start gap-3 mb-2">
                <h3 className="font-['Playfair_Display',serif] text-2xl font-bold text-white">
                  {selectedDish.name}
                </h3>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  selectedDish.veg
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedDish.veg ? "bg-emerald-400" : "bg-rose-400"}`} />
                  {selectedDish.veg ? "Vegetarian" : "Non-Vegetarian"}
                </span>
                <span className="text-[11px] text-gray-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                  {selectedDish.category || "Specialty"}
                </span>
              </div>

              {/* Description Quote Box */}
              <p className="text-gray-300 text-xs italic bg-[#163f4b]/50 border-l-2 border-[#EAB308] p-3 rounded-r-xl mb-6 leading-relaxed">
                {selectedDish.description || "Authentic Persian Darbar specialty prepared with heritage recipes and slow-cooked in our traditional tandoor and copper handis."}
              </p>

              {/* Price & Add to Cart Action */}
              <div className="flex items-center justify-between pt-4 border-t border-[#EAB308]/20">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">Portion Price</span>
                  <span className="font-['Playfair_Display',serif] text-3xl font-extrabold text-[#EAB308]">
                    ₹{selectedDish.price}
                  </span>
                </div>

                {getItemQty(selectedDish._id) > 0 ? (
                  <div className="flex items-center gap-3 bg-[#163f4b] border border-[#EAB308]/40 rounded-xl p-1">
                    <button
                      onClick={(e) => updateQuantity(selectedDish._id, -1, e)}
                      className="w-8 h-8 rounded-lg bg-[#0f2933] text-white flex items-center justify-center hover:bg-rose-900/50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-[#EAB308] w-6 text-center">
                      {getItemQty(selectedDish._id)}
                    </span>
                    <button
                      onClick={(e) => updateQuantity(selectedDish._id, 1, e)}
                      className="w-8 h-8 rounded-lg bg-[#EAB308] text-black flex items-center justify-center font-bold"
                    >
                      <Plus className="w-4 h-4 font-bold" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => addToCart(selectedDish, e)}
                    className="bg-gradient-to-r from-[#EAB308] to-[#ca9a07] text-black px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-[#EAB308]/20 hover:brightness-110 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Order</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default TableOrder;

