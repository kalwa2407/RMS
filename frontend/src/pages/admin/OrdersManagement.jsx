import React, { useEffect, useState, useRef } from "react";
import { Check, X, Clock, Package, Truck, Home, Printer, Eye, Bell, Trash2, Bike, UtensilsCrossed, ShoppingBag, MapPin, Phone, ExternalLink, RefreshCw, Zap, AlertTriangle, ToggleLeft, ToggleRight, WifiOff, MessageCircle } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";
import { printOrder, getPrintMode, isSerialPrinterConnected, connectSerialPrinter } from "../../lib/PrintService";

/* Porter status → display config */
const PORTER_STATUS_DISPLAY = {
  open:                  { label: "Searching Rider",     color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
  accepted:              { label: "Rider Assigned",      color: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/30" },
  reached_for_pickup:    { label: "Rider at Restaurant", color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/30" },
  order_picked_up:       { label: "Picked Up",           color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" },
  started_for_delivery:  { label: "On the Way",          color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" },
  reached_for_delivery:  { label: "At Destination",      color: "text-green-400",  bg: "bg-green-400/10 border-green-400/30" },
  delivered:             { label: "Delivered ✓",         color: "text-emerald-400",bg: "bg-emerald-400/10 border-emerald-400/30" },
  cancelled:             { label: "Porter Cancelled",    color: "text-red-400",    bg: "bg-red-400/10 border-red-400/30" },
};

const formatOrderTime = (ts) => {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    if (isToday) return `Today, ${time}`;
    if (isYesterday) return `Yesterday, ${time}`;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + `, ${time}`;
  } catch { return ts; }
};

const OrdersManagement = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeTab, setOrderTypeTab] = useState("all"); // all | online | dinein
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [lastPlacedCount, setLastPlacedCount] = useState(0);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [assigningOrder, setAssigningOrder] = useState(null);
  const audioRef = useRef(null);

  const [unassigningOrder, setUnassigningOrder] = useState(null);

  // ── Porter state (Stage 2 Integration) ──────────────────────────────────────
  const [porterModal, setPorterModal] = useState(null);
  const [porterCancelling, setPorterCancelling] = useState(null);
  const [porterRefreshing, setPorterRefreshing] = useState(null);

  // ── Print Mode ────────────────────────────────────────────────────────────
  const [printMode, setPrintModeState] = useState(() => getPrintMode());
  // Sync when localStorage changes (e.g. user changes setting in another tab)
  useEffect(() => {
    const sync = () => setPrintModeState(getPrintMode());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // ── Online Orders Billing Mode ────────────────────────────────────────────
  // "auto" = bill prints automatically when order is accepted (via thermal printer)
  // "manual" = admin clicks Print Bill manually
  const [onlineBillingMode, setOnlineBillingMode] = useState(
    () => localStorage.getItem("pd_online_billing_mode") || "manual"
  );
  const [printerConnected, setPrinterConnected] = useState(() => isSerialPrinterConnected());

  const toggleOnlineBillingMode = () => {
    const next = onlineBillingMode === "manual" ? "auto" : "manual";
    setOnlineBillingMode(next);
    localStorage.setItem("pd_online_billing_mode", next);
    if (next === "auto" && !isSerialPrinterConnected()) {
      toast({
        title: "⚠️ Auto Bill Mode Enabled",
        description: "No printer connected. Connect a thermal printer first.",
        variant: "destructive",
        duration: 6000,
      });
    } else if (next === "auto") {
      toast({ title: "✅ Auto Bill Mode", description: "Bills will print automatically on order accept.", duration: 4000 });
    }
  };

  const handleConnectPrinter = async () => {
    const result = await connectSerialPrinter();
    if (result.success) {
      setPrinterConnected(true);
      toast({ title: "🖨️ Printer Connected!", description: "Thermal printer is ready.", duration: 4000 });
    } else {
      toast({ title: "Connection Failed", description: result.error || "Could not connect to printer.", variant: "destructive" });
    }
  };


  useEffect(() => {
    const loadSound = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        const response = await axios.get(`${API_BASE}/api/admin/notification-sound`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const audio = new Audio();
        audio.src = response.data.url ? `${API_BASE}${response.data.url}` : "/notification.wav";
        audio.volume = 0.7;
        audioRef.current = audio;
        const prime = () => { audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {}); };
        document.addEventListener("click", prime, { once: true });
        document.addEventListener("keydown", prime, { once: true });
      } catch {
        const audio = new Audio("/notification.wav");
        audio.volume = 0.7;
        audioRef.current = audio;
      }
    };
    loadSound();
  }, []);

  const playNotificationSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch {}
  };

  useEffect(() => {
    fetchOrders();
    fetchPartners();
    const interval = setInterval(() => fetchOrders(true), 10000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const fetchPartners = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const { data } = await axios.get(`${API_BASE}/api/admin/delivery-partners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeliveryPartners((Array.isArray(data) ? data : []).filter(p => p.active !== false));
    } catch {}
  };

  const fetchOrders = async (silent = false) => {
    try {
      const token = localStorage.getItem("admin_token");
      const url = statusFilter === "all"
        ? `${API_BASE}/api/admin/orders`
        : `${API_BASE}/api/admin/orders?status_filter=${statusFilter}`;
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const newOrders = Array.isArray(response.data) ? response.data : [];
      const newPlacedCount = newOrders.filter(o => o.status === "placed").length;
      if (silent && newPlacedCount > lastPlacedCount) {
        playNotificationSound();
        toast({ title: "🔔 New Order!", description: `${newPlacedCount} new order(s) received`, duration: 5000 });
      }
      setOrders(newOrders);
      setLastPlacedCount(newPlacedCount);
    } catch (error) {
      if (!silent) toast({ title: "Error", description: "Failed to fetch orders. Check if backend is running.", variant: "destructive" });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const assignDelivery = async (orderId, partnerId) => {
    try {
      const token = localStorage.getItem("admin_token");
      await axios.post(`${API_BASE}/api/admin/orders/${orderId}/assign-delivery`,
        { delivery_partner_id: partnerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: "Assigned", description: "Delivery partner assigned" });
      setAssigningOrder(null);
      fetchOrders();
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.detail || "Failed to assign", variant: "destructive" });
    }
  };
  const unassignDelivery = async (orderId) => {
    if (!window.confirm("Remove assigned in-house delivery rider from this order?")) return;
    setUnassigningOrder(orderId);
    try {
      const token = localStorage.getItem("admin_token");
      await axios.post(`${API_BASE}/api/admin/orders/${orderId}/unassign-delivery`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: "Unassigned", description: "Rider removed from order" });
      fetchOrders();
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.detail || "Failed to unassign", variant: "destructive" });
    } finally {
      setUnassigningOrder(null);
    }
  };

  // -- Porter Handlers (Stage 2 Integration) -----------------------------------
  const openPorterModal = async (order) => {
    const drop_lat = order.drop_lat || null;
    const drop_lng = order.drop_lng || null;
    if (!drop_lat || !drop_lng) {
      setPorterModal({ order, step: "no_coords", quote: null, tempLat: "", tempLng: "" });
      return;
    }
    setPorterModal({ order, step: "quoting", quote: null });
    await _fetchPorterQuote(order, drop_lat, drop_lng);
  };

  const _fetchPorterQuote = async (order, drop_lat, drop_lng) => {
    try {
      const token = localStorage.getItem("admin_token");
      const { data } = await axios.post(
        `${API_BASE}/api/admin/orders/${order.order_id}/porter/quote`,
        { drop_lat: parseFloat(drop_lat), drop_lng: parseFloat(drop_lng), vehicle_type: "2-wheeler" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPorterModal(prev => ({ ...prev, step: "quoted", quote: data, drop_lat: parseFloat(drop_lat), drop_lng: parseFloat(drop_lng) }));
    } catch (err) {
      toast({ title: "Porter Quote Failed", description: err.response?.data?.detail || "Could not get quote", variant: "destructive" });
      setPorterModal(null);
    }
  };

  const confirmPorterBook = async () => {
    if (!porterModal) return;
    const { order, drop_lat, drop_lng } = porterModal;
    setPorterModal(prev => ({ ...prev, step: "booking" }));
    try {
      const token = localStorage.getItem("admin_token");
      const { data } = await axios.post(
        `${API_BASE}/api/admin/orders/${order.order_id}/porter/book`,
        { drop_lat, drop_lng, vehicle_type: "2-wheeler" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: "Porter Booked!", description: `Rider: ${data.rider_name || "Searching..."}` });
      setPorterModal(null);
      fetchOrders();
    } catch (err) {
      toast({ title: "Booking Failed", description: err.response?.data?.detail || "Porter booking error", variant: "destructive" });
      setPorterModal(prev => ({ ...prev, step: "quoted" }));
    }
  };

  const cancelPorterBooking = async (order) => {
    if (!window.confirm("Cancel Porter booking? You can assign an in-house rider after.")) return;
    setPorterCancelling(order.order_id);
    try {
      const token = localStorage.getItem("admin_token");
      await axios.post(
        `${API_BASE}/api/admin/orders/${order.order_id}/porter/cancel`,
        { reason: "Cancelled by admin" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: "Porter Cancelled", description: "You can now assign an in-house rider." });
      fetchOrders();
    } catch (err) {
      toast({ title: "Cancel Failed", description: err.response?.data?.detail || "Could not cancel", variant: "destructive" });
    } finally { setPorterCancelling(null); }
  };

  const refreshPorterStatus = async (order) => {
    setPorterRefreshing(order.order_id);
    try {
      const token = localStorage.getItem("admin_token");
      await axios.get(`${API_BASE}/api/admin/orders/${order.order_id}/porter/status`, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: "Porter Status Refreshed" });
      fetchOrders();
    } catch (err) {
      toast({ title: "Refresh Failed", description: err.response?.data?.detail || "Could not refresh", variant: "destructive" });
    } finally { setPorterRefreshing(null); }
  };



  const openOrderWhatsApp = (order) => {
    const rawPhone = order.phone?.replace(/\D/g, "");
    const waNumber = rawPhone?.length === 10 ? `91${rawPhone}` : rawPhone;
    if (!waNumber) {
      toast({ title: "No Phone Number", description: "Customer phone number not available for this order.", variant: "destructive" });
      return;
    }
    const token = order.bill_number || order.kot_number || (order.order_id ? order.order_id.slice(-6).toUpperCase() : "PD-ORDER");
    const items = (order.items || []).map(i => `  • ${i.quantity || 1}x ${i.name || i.item_name || "Item"}`).join("\n");
    const orderType = order.order_type === "TAKEAWAY" ? "Takeaway / Self Pickup" : "Home Delivery";
    
    let text = "";
    if (order.status === "delivered") {
      text = `*ORDER DELIVERED — PERSIAN DARBAR*\n\nDear *${order.customer_name || "Valued Guest"}*,\nYour order has been delivered! We hope you loved your meal.\n\n*Bill Summary:*\n*Bill No:* #${token}\n*Total Paid:* Rs ${order.total || order.subtotal || 0}\n\n*Download Tax Invoice (PDF):*\nhttps://www.persiandarbar.in/invoice/${order.order_id || order.id || ""}\n\nSupport: +91 95942 87868\nThank you for dining with Persian Darbar.`;
    } else {
      text = `*ORDER CONFIRMED — PERSIAN DARBAR*\n\nDear *${order.customer_name || "Valued Guest"}*,\nWe have accepted your order! Our chefs are preparing your royal feast.\n\n*Order Details:*\n*Order ID / Token:* #${token}\n*Items:*\n${items}\n*Total Amount:* Rs ${order.total || order.subtotal || 0}\n*Delivery Type:* ${orderType}\n\n*Live Order Tracking:*\nhttps://www.persiandarbar.in/track-order/${order.order_id || order.id || ""}\n\nHelpline: +91 95942 87868`;
    }
    
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const updateStatus = async (order, newStatus) => {
    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(`${API_BASE}/api/admin/orders/${order.order_id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (newStatus === "accepted") {
        toast({ title: "✅ Order Accepted & WhatsApp Dispatched!", description: "Confirmation details sent directly to customer's WhatsApp" });
      } else {
        toast({ title: "Updated!", description: `Order is now ${newStatus}` });
      }
      fetchOrders();

      // Auto/Manual billing for online orders on accept
      if (newStatus === "accepted" && order.order_type !== "DINE_IN") {
        // Re-fetch to get the assigned bill_number from backend
        setTimeout(async () => {
          try {
            const token2 = localStorage.getItem("admin_token");
            const res = await axios.get(`${API_BASE}/api/admin/orders/${order.order_id}`, {
              headers: { Authorization: `Bearer ${token2}` }
            });
            const updatedOrder = res.data;
            const billNo = updatedOrder?.bill_number || order.order_id?.slice(-8);
            const currentBillingMode = localStorage.getItem("pd_online_billing_mode") || "manual";

            if (currentBillingMode === "auto") {
              // AUTO mode: check printer connected
              if (isSerialPrinterConnected()) {
                await printOrder(updatedOrder || order, billNo, "auto");
                toast({ title: `🖨️ Bill Printed: ${billNo}`, description: "Auto-printed to thermal printer", duration: 4000 });
              } else {
                // Auto mode but printer not connected — show alert
                toast({
                  title: `⚠️ Printer Not Connected`,
                  description: `Bill ${billNo} generated but printer is not connected. Connect printer and print manually.`,
                  variant: "destructive",
                  duration: 8000,
                });
              }
            } else {
              // MANUAL mode: just notify, let admin click Print Bill
              toast({
                title: `📄 Bill Ready: ${billNo}`,
                description: "Click Print Bill on the order to print",
                duration: 6000
              });
            }
          } catch { /* print errors are non-fatal */ }
        }, 1200);
      }
    } catch {
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
    }
  };

  // ── Print online order bill (called manually or automatically) ───────────
  const printOnlineOrderBill = async (order) => {
    const billNo = order.bill_number || order.order_id?.slice(-8);
    try {
      await printOrder(order, billNo, printMode);
    } catch (err) {
      toast({ title: "Print Failed", description: "Could not print bill.", variant: "destructive" });
    }
  };

  const printInvoice = async (order) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(`${API_BASE}/api/admin/invoice/${order.order_id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          printWindow.focus();
          printWindow.print();
        });
      }
    } catch {
      // Fallback: browser print with thermal receipt layout
      const items = order.items || [];
      const w = window.open("", "_blank", "width=400,height=600");
      if (!w) return;
      w.document.write(`<!DOCTYPE html><html><head>
        <title>Receipt - ${order.order_id}</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: 'Courier New', monospace; font-size: 11px; width: 72mm; }
          .center { text-align:center; }
          .bold { font-weight:bold; }
          .line { border-top: 1px dashed #000; margin: 4px 0; }
          .row { display:flex; justify-content:space-between; }
          h2 { font-size:14px; }
        </style>
      </head><body>
        <div class="center bold"><h2>PERSIAN DARBAR</h2></div>
        <div class="center" style="font-size:9px">Camp, Pune | +91 9594287868</div>
        <div class="line"></div>
        <div class="row"><span>Order: ${order.order_id?.slice(-8)}</span><span>${formatOrderTime(order.created_at)}</span></div>
        <div class="row"><span>Type: ${order.order_type?.replace("_","-")}</span>${order.table_number ? `<span>Table: ${order.table_number}</span>` : ""}</div>
        <div><b>Customer:</b> ${order.customer_name || "—"}</div>
        ${order.address ? `<div style="font-size:9px">${order.address}</div>` : ""}
        <div class="line"></div>
        <div class="bold">ITEMS</div>
        ${items.map(item => `<div class="row"><span>${item.quantity}x ${item.name}</span><span>₹${(item.price * item.quantity).toFixed(0)}</span></div>`).join("")}
        <div class="line"></div>
        <div class="row"><span>Subtotal</span><span>₹${(order.subtotal || 0).toFixed(2)}</span></div>
        ${order.delivery_fee > 0 ? `<div class="row"><span>Delivery</span><span>₹${order.delivery_fee.toFixed(2)}</span></div>` : ""}
        ${order.taxes > 0 ? `<div class="row"><span>GST</span><span>₹${order.taxes.toFixed(2)}</span></div>` : ""}
        <div class="line"></div>
        <div class="row bold" style="font-size:13px"><span>TOTAL</span><span>₹${(order.total || 0).toFixed(2)}</span></div>
        <div class="line"></div>
        <div class="center" style="margin-top:6px">Thank you! Visit Again ♡</div>
      </body></html>`);
      w.document.close();
      setTimeout(() => { w.focus(); w.print(); }, 300);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      placed: { label: "New", color: "bg-blue-500", icon: Bell },
      accepted: { label: "Accepted", color: "bg-green-500", icon: Check },
      preparing: { label: "Preparing", color: "bg-yellow-500", icon: Clock },
      ready: { label: "Ready", color: "bg-purple-500", icon: Package },
      out_for_delivery: { label: "Out for Delivery", color: "bg-orange-500", icon: Truck },
      delivered: { label: "Delivered", color: "bg-green-700", icon: Home },
      cancelled: { label: "Cancelled", color: "bg-red-500", icon: X },
      rejected: { label: "Rejected", color: "bg-red-700", icon: X },
    };
    return configs[status] || { label: status, color: "bg-gray-500", icon: Package };
  };

  const getNextActions = (status, orderType) => {
    switch (status) {
      case "placed": return [
        { label: "✅ Accept", value: "accepted", color: "bg-green-600 hover:bg-green-700" },
        { label: "✗ Reject", value: "rejected", color: "bg-red-600 hover:bg-red-700" },
      ];
      case "accepted": return [{ label: "🔥 Start Preparing", value: "preparing", color: "bg-yellow-600 hover:bg-yellow-700" }];
      case "preparing": return [{ label: "✅ Mark Ready", value: "ready", color: "bg-purple-600 hover:bg-purple-700" }];
      case "ready":
        if (orderType === "DINE_IN") return [{ label: "✔ Mark Served", value: "delivered", color: "bg-green-700 hover:bg-green-800" }];
        return [{ label: "🛵 Out for Delivery", value: "out_for_delivery", color: "bg-orange-600 hover:bg-orange-700" }];
      case "out_for_delivery": return [{ label: "✔ Mark Delivered", value: "delivered", color: "bg-emerald-600 hover:bg-emerald-700" }];
      default: return [];
    }
  };

  const statusTabs = [
    { label: "All", value: "all" },
    { label: "New", value: "placed" },
    { label: "Accepted", value: "accepted" },
    { label: "Preparing", value: "preparing" },
    { label: "Ready", value: "ready" },
    { label: "Out for Delivery", value: "out_for_delivery" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const orderTypeTabs = [
    { label: "All Orders", value: "all", icon: Package },
    { label: "Online & Delivery", value: "online", icon: ShoppingBag },
    { label: "Dine-In", value: "dinein", icon: UtensilsCrossed },
  ];

  // Filter by order type tab
  const filteredOrders = orders.filter(o => {
    if (orderTypeTab === "online") return o.order_type === "DELIVERY" || o.order_type === "TAKEAWAY";
    if (orderTypeTab === "dinein") return o.order_type === "DINE_IN";
    return true;
  });

  const newOrdersCount = orders.filter(o => o.status === "placed").length;
  const newOnlineCount = orders.filter(o => o.status === "placed" && (o.order_type === "DELIVERY" || o.order_type === "TAKEAWAY")).length;
  const newDineCount = orders.filter(o => o.status === "placed" && o.order_type === "DINE_IN").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-primary" style={{ fontFamily: "Playfair Display, serif" }}>
            Orders Management
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-gray-400 text-sm">Total: {orders.length}</span>
            {newOrdersCount > 0 && (
              <span className="inline-flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-full text-xs animate-pulse">
                <Bell className="w-3 h-3" /> {newOrdersCount} New
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={playNotificationSound}
            className="bg-[#1a4855] border border-[#EAB308]/30 text-white px-3 py-2 rounded-lg hover:bg-[#2a5865] text-xs font-medium flex items-center gap-1.5 transition-colors">
            🔊 <span className="hidden sm:inline">Test Sound</span>
          </button>
          <div className="text-xs text-gray-500 hidden sm:flex items-center gap-1">🔄 Auto 10s</div>
        </div>
      </div>

      {/* Order Type Tabs (Online vs Dine-In) */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {orderTypeTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = orderTypeTab === tab.value;
          const badge = tab.value === "online" ? newOnlineCount : tab.value === "dinein" ? newDineCount : newOrdersCount;
          return (
            <button key={tab.value} onClick={() => setOrderTypeTab(tab.value)}
              className={`relative flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all border ${
                isActive
                  ? "bg-primary text-black border-primary shadow-lg shadow-primary/20"
                  : "bg-[#1a4855] text-gray-300 border-[#EAB308]/15 hover:border-[#EAB308]/30"
              }`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.value === "all" ? "All" : tab.value === "online" ? "Online" : "Dine-In"}</span>
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Online Billing Mode Toggle ─────────────────────────────────────── */}
      {(orderTypeTab === "online" || orderTypeTab === "all") && (
        <div className={`mb-4 rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${
          onlineBillingMode === "auto"
            ? "bg-emerald-900/20 border-emerald-500/30"
            : "bg-[#1a4855] border-[#EAB308]/20"
        }`}>
          {/* Left: Mode Info */}
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              onlineBillingMode === "auto" ? "bg-emerald-500/20" : "bg-[#EAB308]/10"
            }`}>
              <Printer className={`w-4 h-4 ${onlineBillingMode === "auto" ? "text-emerald-400" : "text-[#EAB308]"}`} />
            </div>
            <div>
              <p className={`text-sm font-bold ${onlineBillingMode === "auto" ? "text-emerald-300" : "text-white"}`}>
                {onlineBillingMode === "auto" ? "🤖 Auto Bill Mode" : "🖐 Manual Bill Mode"}
                <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${
                  onlineBillingMode === "auto"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-[#EAB308]/15 text-[#EAB308]"
                }`}>
                  Online Orders
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {onlineBillingMode === "auto"
                  ? "Bill prints automatically to thermal printer when order is accepted"
                  : "Click 'Print Bill' manually on each order after accepting"}
              </p>
            </div>
          </div>

          {/* Right: Printer Status + Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Printer Connection Status */}
            {onlineBillingMode === "auto" && (
              <div className="flex items-center gap-1.5">
                {printerConnected ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-900/30 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Printer Ready
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-900/20 border border-red-500/30 px-2.5 py-1.5 rounded-lg font-medium">
                      <WifiOff className="w-3 h-3" />
                      Not Connected
                    </span>
                    <button
                      onClick={handleConnectPrinter}
                      className="text-xs text-white bg-[#EAB308]/20 hover:bg-[#EAB308]/30 border border-[#EAB308]/30 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Toggle Button */}
            <button
              onClick={toggleOnlineBillingMode}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                onlineBillingMode === "auto"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500"
                  : "bg-[#0f2933] hover:bg-[#1a4855] text-gray-300 border-white/10"
              }`}
            >
              {onlineBillingMode === "auto"
                ? <><ToggleRight className="w-4 h-4" /> Auto</>
                : <><ToggleLeft className="w-4 h-4" /> Manual</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {statusTabs.map(tab => (
          <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === tab.value ? "bg-primary text-black" : "bg-[#1a4855] text-gray-300 hover:bg-[#2a5865]"
            }`}>
            {tab.label}
            {tab.value === "placed" && newOrdersCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{newOrdersCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No orders found</p>
          <p className="text-sm mt-1">
            {orderTypeTab !== "all" ? `No ${orderTypeTab === "online" ? "online/delivery" : "dine-in"} orders` : "No orders match the current filter"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            const nextActions = getNextActions(order.status, order.order_type);

            return (
              <div key={order.order_id}
                className={`bg-[#1a4855] border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg ${
                  order.order_type === "DINE_IN" ? "border-purple-500/20" :
                  order.order_type === "DELIVERY" ? "border-[#EAB308]/20" : "border-blue-500/20"
                }`}>
                {/* Order Type Banner */}
                <div className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
                  order.order_type === "DINE_IN" ? "bg-purple-500/15 text-purple-400" :
                  order.order_type === "DELIVERY" ? "bg-[#EAB308]/10 text-[#EAB308]" : "bg-blue-500/15 text-blue-400"
                }`}>
                  {order.order_type === "DINE_IN" ? <UtensilsCrossed className="w-3 h-3" /> :
                   order.order_type === "DELIVERY" ? <Bike className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                  {order.order_type?.replace("_", "-")}
                  {order.order_type === "DINE_IN" && order.table_number && (
                    <span className="ml-auto bg-primary text-black px-2 py-0.5 rounded font-bold">Table {order.table_number}</span>
                  )}
                </div>

                <div className="p-4 sm:p-5">
                  {/* Header row */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white font-mono">{order.order_id?.slice(-10) || order.order_id}</h3>
                        {order.kot_number && (
                          <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded text-xs font-bold">{order.kot_number}</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatOrderTime(order.created_at)}
                      </p>
                    </div>
                    <div className={`${statusConfig.color} text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold shrink-0`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig.label}
                    </div>
                  </div>

                  {/* Customer + Address */}
                  <div className="grid sm:grid-cols-2 gap-3 mb-3 bg-[#0f2933] rounded-lg p-3">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Customer</p>
                      <p className="text-white font-semibold text-sm">{order.customer_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-gray-400 text-xs">{order.phone || "—"}</p>
                        {order.phone && (
                          <button
                            onClick={() => openOrderWhatsApp(order)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30"
                            title="Chat with customer on WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>
                        )}
                      </div>
                    </div>
                    {(order.address || order.table_number) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">
                          {order.order_type === "DINE_IN" ? "Table" : "Delivery Address"}
                        </p>
                        <p className="text-white text-sm">{order.address || `Table ${order.table_number}`}</p>
                        {order.distance_km && <p className="text-gray-400 text-xs">{order.distance_km} km away</p>}
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div className="mb-3">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Order Items</p>
                    <div className="space-y-1">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-300">{item.name} <span className="text-gray-500">×{item.quantity}</span></span>
                          <span className="text-primary font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-[#EAB308]/15 pt-3 mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Subtotal</span><span>₹{(order.subtotal || 0).toFixed(2)}</span>
                    </div>
                    {order.delivery_fee > 0 && (
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Delivery Fee</span><span>₹{order.delivery_fee.toFixed(2)}</span>
                      </div>
                    )}
                    {order.taxes > 0 && (
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>GST</span><span>₹{order.taxes.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base mt-2">
                      <span className="text-white">Total</span>
                      <span className="text-primary">₹{(order.total || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {nextActions.map(action => (
                      <button key={action.value}
                        onClick={() => updateStatus(order, action.value)}
                        className={`${action.color} text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors`}>
                        {action.label}
                      </button>
                    ))}

                    {/* Print Bill (online orders) */}
                    {["accepted", "preparing", "ready", "out_for_delivery", "delivered"].includes(order.status) && order.order_type !== "DINE_IN" && (
                      <div className="flex items-center gap-1.5">
                        {order.bill_number && (
                          <span className="bg-[#EAB308]/15 text-[#EAB308] font-mono text-xs px-2 py-1 rounded font-bold border border-[#EAB308]/30">
                            #{order.bill_number}
                          </span>
                        )}
                        <button
                          onClick={() => printOnlineOrderBill(order)}
                          className="bg-[#0f2933] border border-[#EAB308]/30 text-white px-3 py-2 rounded-lg hover:bg-[#1a4855] text-sm font-medium flex items-center gap-1.5 transition-colors"
                          title="Print Bill"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Print Bill</span>
                        </button>
                      </div>
                    )}

                    {/* WhatsApp Customer Dispatch Button */}
                    {order.phone && order.order_type !== "DINE_IN" && (
                      <button
                        onClick={() => openOrderWhatsApp(order)}
                        className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                        title="Send WhatsApp confirmation to customer"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span>WhatsApp</span>
                      </button>
                    )}

                    {/* ── Delivery Assignment (In-House Fleet OR Porter) ── */}
                    {order.order_type === "DELIVERY" && ["accepted","preparing","ready","out_for_delivery"].includes(order.status) && (
                      <div className="w-full mt-2">

                        {/* 1. Porter Active Banner */}
                        {order.porter_order_id && (
                          <div className="mb-2 rounded-xl border overflow-hidden" style={{ background: "rgba(15,41,51,0.8)" }}>
                            <div className={`flex items-center justify-between px-3 py-2 border-b ${(PORTER_STATUS_DISPLAY[order.porter_status] || PORTER_STATUS_DISPLAY["open"]).bg}`}>
                              <div className="flex items-center gap-2">
                                <Zap className={`w-3.5 h-3.5 ${(PORTER_STATUS_DISPLAY[order.porter_status] || PORTER_STATUS_DISPLAY["open"]).color}`} />
                                <span className={`text-xs font-bold ${(PORTER_STATUS_DISPLAY[order.porter_status] || PORTER_STATUS_DISPLAY["open"]).color}`}>
                                  Porter: {(PORTER_STATUS_DISPLAY[order.porter_status] || { label: order.porter_status || "Booked" }).label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => refreshPorterStatus(order)}
                                  disabled={porterRefreshing === order.order_id}
                                  title="Refresh Porter status"
                                  className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                >
                                  <RefreshCw className={`w-3 h-3 ${porterRefreshing === order.order_id ? "animate-spin" : ""}`} />
                                </button>
                                {!["order_picked_up","started_for_delivery","delivered"].includes(order.porter_status) && (
                                  <button
                                    onClick={() => cancelPorterBooking(order)}
                                    disabled={porterCancelling === order.order_id}
                                    title="Cancel Porter"
                                    className="w-6 h-6 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            {(order.porter_rider_name || order.porter_rider_phone || order.porter_tracking_url) && (
                              <div className="px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-3">
                                  {order.porter_rider_name && (
                                    <div className="flex items-center gap-1.5">
                                      <Bike className="w-3.5 h-3.5 text-gray-400" />
                                      <span className="text-white text-xs font-semibold">{order.porter_rider_name}</span>
                                    </div>
                                  )}
                                  {order.porter_rider_phone && (
                                    <div className="flex items-center gap-1.5">
                                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                                      <a href={`tel:${order.porter_rider_phone}`} className="text-[#EAB308] text-xs">{order.porter_rider_phone}</a>
                                    </div>
                                  )}
                                </div>
                                {order.porter_tracking_url && (
                                  <a href={order.porter_tracking_url} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                    <MapPin className="w-3 h-3" /> Live Track <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. In-House Rider Assigned Card */}
                        {order.delivery_partner_name && !order.porter_order_id && (
                          <div className="rounded-xl p-2.5 bg-gradient-to-r from-emerald-950/40 to-[#0e2c36] border border-emerald-500/30 flex items-center justify-between gap-2 flex-wrap mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                <Bike className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-xs font-bold">{order.delivery_partner_name}</span>
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                                    PD FLEET
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                  <span>{order.delivery_partner_vehicle || "Royal Fleet Bike"}</span>
                                  {order.delivery_partner_phone && (
                                    <>
                                      <span>•</span>
                                      <a href={`tel:${order.delivery_partner_phone}`} className="text-[#EAB308] hover:underline font-mono">
                                        📞 {order.delivery_partner_phone}
                                      </a>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 ml-auto">
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setAssigningOrder(assigningOrder === order.order_id ? null : order.order_id)}
                                  className="text-[10px] font-bold px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 transition"
                                >
                                  Change
                                </button>
                                {assigningOrder === order.order_id && (
                                  <div className="absolute bottom-full right-0 mb-1 bg-[#0f2933] border border-[#EAB308]/25 rounded-xl shadow-2xl z-30 w-56 overflow-hidden">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-3 pt-2.5 pb-1">Assign Different Rider</p>
                                    {deliveryPartners.length === 0 ? (
                                      <p className="text-gray-400 text-xs px-3 py-2">No active riders</p>
                                    ) : (
                                      deliveryPartners.map(p => (
                                        <button
                                          key={p.id || p._id}
                                          type="button"
                                          onClick={() => assignDelivery(order.order_id, p.id || p._id)}
                                          className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-[#1a4855] transition-colors flex items-center gap-2"
                                        >
                                          <Bike className="w-3.5 h-3.5 text-[#EAB308]" />
                                          <div>
                                            <p className="font-bold">{p.name}</p>
                                            <p className="text-gray-500 text-[10px]">{p.vehicle_type} · {p.phone}</p>
                                          </div>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => unassignDelivery(order.order_id)}
                                disabled={unassigningOrder === order.order_id}
                                title="Unassign Rider"
                                className="text-[10px] font-bold px-2 py-1 rounded bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/40 transition"
                              >
                                {unassigningOrder === order.order_id ? '...' : 'Unassign'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 3. Not Assigned to Either — Show BOTH In-House Rider & Book Porter options */}
                        {!order.delivery_partner_name && !order.porter_order_id && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* In-House Rider Button */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setAssigningOrder(assigningOrder === order.order_id ? null : order.order_id)}
                                className="bg-gradient-to-r from-[#ca8a04] to-[#EAB308] text-black px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all"
                              >
                                <Bike className="w-3.5 h-3.5" /> In-House Rider
                              </button>
                              {assigningOrder === order.order_id && (
                                <div className="absolute bottom-full left-0 mb-1 bg-[#0f2933] border border-[#EAB308]/25 rounded-xl shadow-2xl z-30 w-64 overflow-hidden">
                                  <div className="px-3 py-2 bg-[#1a4855]/60 border-b border-white/10 flex items-center justify-between">
                                    <span className="text-[10px] text-[#EAB308] font-black uppercase tracking-wider">Persian Darbar Fleet</span>
                                    <span className="text-[9px] text-gray-400">{deliveryPartners.length} Available</span>
                                  </div>
                                  {deliveryPartners.length === 0 ? (
                                    <p className="text-gray-400 text-xs px-3 py-3">No active riders configured</p>
                                  ) : (
                                    <div className="max-h-48 overflow-y-auto">
                                      {deliveryPartners.map(p => (
                                        <button
                                          key={p.id || p._id}
                                          type="button"
                                          onClick={() => assignDelivery(order.order_id, p.id || p._id)}
                                          className="w-full text-left px-3 py-2.5 text-xs text-gray-200 hover:bg-[#1a4855] transition-colors flex items-center gap-2.5 border-b border-white/5 last:border-b-0"
                                        >
                                          <div className="w-6 h-6 rounded-md bg-[#EAB308]/15 text-[#EAB308] flex items-center justify-center shrink-0">
                                            <Bike className="w-3.5 h-3.5" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">{p.name}</p>
                                            <p className="text-gray-400 text-[10px] truncate">{p.vehicle_type} · {p.phone}</p>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Porter Button (Next Stage / Backup Option) */}
                            <button
                              type="button"
                              onClick={() => openPorterModal(order)}
                              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-orange-900/30"
                            >
                              <Zap className="w-3.5 h-3.5" /> Book Porter
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* View Details */}
                    <button onClick={() => setSelectedOrder(order)}
                      className="bg-[#0f2933] border border-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ml-auto">
                      <Eye className="w-4 h-4" /> Details
                    </button>

                    {/* Delete delivered */}
                    {order.status === "delivered" && (
                      <button onClick={async () => {
                        if (!window.confirm("Delete this order?")) return;
                        try {
                          const token = localStorage.getItem("admin_token");
                          await axios.delete(`${API_BASE}/api/admin/orders/${order.order_id}`, { headers: { Authorization: `Bearer ${token}` } });
                          toast({ title: "Deleted", description: "Order deleted" });
                          fetchOrders();
                        } catch { toast({ title: "Error", description: "Failed to delete", variant: "destructive" }); }
                      }}
                        className="bg-red-900/30 border border-red-500/30 text-red-400 hover:bg-red-900/50 px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a4855] rounded-2xl p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#EAB308]/20 shadow-2xl">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-xl font-bold text-primary" style={{ fontFamily: "Playfair Display, serif" }}>Order Details</h3>
                <p className="text-gray-400 text-sm font-mono">{selectedOrder.order_id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="bg-[#0f2933] rounded-lg p-3 text-sm">
                <div className="flex justify-between mb-1"><span className="text-gray-400">Type</span><span className="text-white">{selectedOrder.order_type?.replace("_","-")}</span></div>
                <div className="flex justify-between mb-1"><span className="text-gray-400">Placed</span><span className="text-white">{formatOrderTime(selectedOrder.created_at)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="text-primary font-semibold">{selectedOrder.status}</span></div>
              </div>
            </div>

            <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Status Timeline</h4>
            <div className="space-y-2 mb-5">
              {(selectedOrder.status_history || []).map((h, idx) => (
                <div key={idx} className="bg-[#0f2933] rounded-lg p-3 flex justify-between items-start">
                  <div>
                    <p className="text-primary font-semibold text-sm capitalize">{h.status}</p>
                    {h.note && <p className="text-gray-400 text-xs mt-0.5">{h.note}</p>}
                  </div>
                  <p className="text-gray-500 text-xs shrink-0 ml-3">{formatOrderTime(h.timestamp)}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedOrder(null)}
              className="w-full bg-primary text-black py-3 rounded-xl font-bold hover:bg-[#d4a406] transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {/* ===== Porter Booking Modal (Stage 2 Integration) ===== */}
      {porterModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0f2933] border border-orange-500/30 rounded-2xl p-5 max-w-md w-full shadow-2xl shadow-orange-900/20">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/40">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Book Porter Rider</h3>
                  <p className="text-gray-400 text-xs font-mono">{porterModal.order?.order_id?.slice(-10)}</p>
                </div>
              </div>
              <button onClick={() => setPorterModal(null)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step: No Coordinates */}
            {porterModal.step === "no_coords" && (
              <div>
                <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-yellow-300 text-xs">This order doesn't have GPS coordinates stored. Please enter the customer's approximate coordinates to get a Porter quote.</p>
                </div>
                <p className="text-gray-400 text-xs mb-3">Customer address: <span className="text-white">{porterModal.order?.address}</span></p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Latitude</label>
                    <input
                      type="number" step="any"
                      value={porterModal.tempLat || ""}
                      onChange={e => setPorterModal(prev => ({ ...prev, tempLat: e.target.value }))}
                      placeholder="e.g. 18.5230"
                      className="w-full bg-[#1a4855] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Longitude</label>
                    <input
                      type="number" step="any"
                      value={porterModal.tempLng || ""}
                      onChange={e => setPorterModal(prev => ({ ...prev, tempLng: e.target.value }))}
                      placeholder="e.g. 73.8567"
                      className="w-full bg-[#1a4855] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPorterModal(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button
                    onClick={() => _fetchPorterQuote(porterModal.order, porterModal.tempLat, porterModal.tempLng)}
                    disabled={!porterModal.tempLat || !porterModal.tempLng}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-600 to-orange-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Get Quote
                  </button>
                </div>
              </div>
            )}

            {/* Step: Quoting (loading) */}
            {porterModal.step === "quoting" && (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderWidth: 3 }} />
                <p className="text-gray-400 text-sm">Fetching Porter quote...</p>
              </div>
            )}

            {/* Step: Quoted */}
            {porterModal.step === "quoted" && porterModal.quote && (
              <div>
                <div className="bg-[#1a4855] rounded-xl p-3 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Customer</span>
                    <span className="text-white font-medium">{porterModal.quote.customer_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Distance</span>
                    <span className="text-white">{porterModal.quote.distance_km ? `${porterModal.quote.distance_km} km` : "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Customer delivery fee</span>
                    <span className={(porterModal.quote.distance_km || 0) <= 5 ? "text-green-400 font-bold" : "text-[#EAB308] font-bold"}>
                      {(porterModal.quote.distance_km || 0) <= 5 ? "FREE (≤5km)" : "₹60"}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border border-orange-500/30 rounded-xl p-4 mb-4">
                  <p className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-3">Porter Quote (Your Cost)</p>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-3xl font-black text-white">₹{porterModal.quote.estimated_fare?.toFixed(0)}</p>
                      <p className="text-gray-400 text-xs">Estimated Porter fare</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-orange-400">{porterModal.quote.eta_minutes} min</p>
                      <p className="text-gray-400 text-xs">Rider ETA</p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs">{porterModal.quote.note}</p>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Bike className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-300 text-sm capitalize">Vehicle: {porterModal.quote.vehicle_type}</span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setPorterModal(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button
                    onClick={confirmPorterBook}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white transition-all shadow-lg shadow-orange-900/30"
                  >
                    ✓ Confirm Book Porter
                  </button>
                </div>
              </div>
            )}

            {/* Step: Booking */}
            {porterModal.step === "booking" && (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderWidth: 3 }} />
                <p className="text-gray-400 text-sm">Booking Porter rider...</p>
                <p className="text-gray-600 text-xs mt-1">This may take a few seconds</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
