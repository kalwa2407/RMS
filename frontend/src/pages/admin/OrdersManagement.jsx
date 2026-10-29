import React, { useEffect, useState, useRef } from "react";
import { Check, X, Clock, Package, Truck, Home, Printer, Eye, Bell, Trash2, Bike, UtensilsCrossed, ShoppingBag, MapPin, Phone, ExternalLink, RefreshCw, Zap, AlertTriangle, ToggleLeft, ToggleRight, WifiOff, MessageCircle } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";
import { printOrder, printKOT, getPrintMode, isSerialPrinterConnected, connectSerialPrinter } from "../../lib/PrintService";

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

  // ── Order Acceptance Mode (Mode 1: Manual vs Mode 2: Auto 45-60s) ──────────
  const [acceptanceMode, setAcceptanceMode] = useState(
    () => localStorage.getItem("pd_order_acceptance_mode") || "manual"
  );
  const [autoAcceptDelaySeconds, setAutoAcceptDelaySeconds] = useState(45);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [autoAcceptingIds, setAutoAcceptingIds] = useState(new Set());
  const autoAcceptingRef = useRef(new Set());

  // Real-time ticking clock for second-by-second countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch acceptance settings from backend on mount
  useEffect(() => {
    const fetchAcceptanceSettings = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        const { data } = await axios.get(`${API_BASE}/api/admin/order-acceptance-settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data?.mode) {
          setAcceptanceMode(data.mode);
          localStorage.setItem("pd_order_acceptance_mode", data.mode);
        }
        if (data?.delay_seconds) {
          setAutoAcceptDelaySeconds(data.delay_seconds);
        }
      } catch {
        const saved = localStorage.getItem("pd_order_acceptance_mode") || "manual";
        setAcceptanceMode(saved);
      }
    };
    fetchAcceptanceSettings();
  }, []);

  const toggleAcceptanceMode = async (targetMode) => {
    const next = targetMode || (acceptanceMode === "manual" ? "auto" : "manual");
    setAcceptanceMode(next);
    localStorage.setItem("pd_order_acceptance_mode", next);
    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(`${API_BASE}/api/admin/order-acceptance-settings`, {
        mode: next,
        delay_seconds: autoAcceptDelaySeconds,
        auto_assign_porter: true,
        porter_mock_mode: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (next === "auto") {
        toast({
          title: "⚡ Auto Acceptance Mode Enabled",
          description: `Orders will auto-accept in ${autoAcceptDelaySeconds}s. KOT dispatched to kitchen & Porter rider auto-assigned (Mock).`,
          duration: 5000
        });
      } else {
        toast({
          title: "🖐️ Manual Acceptance Mode Enabled",
          description: "Incoming orders require staff/admin manual acceptance.",
          duration: 4000
        });
      }
    } catch (err) {
      console.error("Failed to sync acceptance mode to server:", err);
    }
  };

  const getCountdownSeconds = (order) => {
    if (!order.created_at) return autoAcceptDelaySeconds;
    try {
      const created = new Date(order.created_at).getTime();
      const elapsed = Math.floor((currentTime - created) / 1000);
      return Math.max(0, autoAcceptDelaySeconds - elapsed);
    } catch {
      return autoAcceptDelaySeconds;
    }
  };

  const triggerAutoAccept = async (order) => {
    if (autoAcceptingRef.current.has(order.order_id)) return;
    autoAcceptingRef.current.add(order.order_id);
    setAutoAcceptingIds(prev => new Set(prev).add(order.order_id));
    try {
      const token = localStorage.getItem("admin_token");
      const { data } = await axios.post(
        `${API_BASE}/api/admin/orders/${order.order_id}/auto-accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: "⚡ Order Auto-Accepted!",
        description: `Order #${order.bill_number || order.order_id.slice(-6)} accepted automatically. KOT sent to kitchen${data?.porter_rider_name ? ` & Porter rider ${data.porter_rider_name} assigned!` : '!'}`
      });
      fetchOrders();
    } catch (err) {
      console.error("Auto accept trigger error:", err);
    } finally {
      setTimeout(() => {
        autoAcceptingRef.current.delete(order.order_id);
        setAutoAcceptingIds(prev => {
          const next = new Set(prev);
          next.delete(order.order_id);
          return next;
        });
      }, 3000);
    }
  };

  // Check placed orders for auto-accept trigger
  useEffect(() => {
    if (acceptanceMode !== "auto") return;
    orders.forEach(order => {
      if (order.status === "placed") {
        const remaining = getCountdownSeconds(order);
        if (remaining <= 0 && !autoAcceptingRef.current.has(order.order_id)) {
          triggerAutoAccept(order);
        }
      }
    });
  }, [currentTime, orders, acceptanceMode]);


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

  const printOnlineOrderKOT = async (order) => {
    try {
      await printKOT(order, printMode);
      toast({ title: "KOT Printed", description: "Kitchen order ticket printed successfully." });
    } catch (err) {
      toast({ title: "KOT Print Failed", description: "Could not print KOT.", variant: "destructive" });
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
          <h2 className="text-2xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
            Orders Management
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-neutral-600 dark:text-gray-400 text-sm font-semibold">Total: {orders.length}</span>
            {newOrdersCount > 0 && (
              <span className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black animate-pulse shadow-sm">
                <Bell className="w-3 h-3" /> {newOrdersCount} New
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={playNotificationSound}
            className="bg-white dark:bg-[#1a4855] border border-neutral-300 dark:border-[#EAB308]/30 text-neutral-800 dark:text-white px-3.5 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#2a5865] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer">
            🔊 <span className="hidden sm:inline">Test Sound</span>
          </button>
          <div className="text-xs text-neutral-500 dark:text-gray-400 hidden sm:flex items-center gap-1 font-semibold">🔄 Auto 10s</div>
        </div>
      </div>

      {/* ── Order Acceptance Mode (Mode 1: Manual vs Mode 2: Auto 45-60s) ── */}
      <div className={`mb-4 rounded-2xl border px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all shadow-xs ${
        acceptanceMode === "auto"
          ? "bg-emerald-50/80 border-emerald-300/80 dark:bg-gradient-to-r dark:from-emerald-950/60 dark:via-[#10333d] dark:to-[#0f2933] dark:border-emerald-500/40"
          : "bg-white dark:bg-[#141B26] border-neutral-200/90 dark:border-white/10"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
            acceptanceMode === "auto"
              ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20"
              : "bg-neutral-100 text-neutral-800 border border-neutral-200 dark:bg-[#EAB308]/15 dark:text-[#EAB308] dark:border-transparent"
          }`}>
            {acceptanceMode === "auto" ? <Zap className="w-5 h-5 text-white" /> : <Clock className="w-5 h-5 text-neutral-800 dark:text-[#EAB308]" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-sm font-black ${
                acceptanceMode === "auto" ? "text-emerald-900 dark:text-emerald-300" : "text-neutral-900 dark:text-white"
              }`}>
                {acceptanceMode === "auto" ? "⚡ Auto-Acceptance Mode (Active)" : "🖐️ Manual Acceptance Mode"}
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                acceptanceMode === "auto"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
                  : "bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-[#EAB308]/15 dark:text-[#EAB308] dark:border-[#EAB308]/30"
              }`}>
                {acceptanceMode === "auto" ? `${autoAcceptDelaySeconds}s Auto-Accept` : "Manual Review"}
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-gray-300/80 mt-0.5">
              {acceptanceMode === "auto"
                ? `Orders not accepted within ${autoAcceptDelaySeconds}s are automatically accepted → KOT sent to kitchen → Porter rider auto-assigned (Mock)`
                : "Orders stay in 'placed' status until manually accepted by admin or captain"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <div className="bg-neutral-100 dark:bg-[#0f2933] p-1 rounded-xl border border-neutral-200/90 dark:border-white/10 flex items-center gap-1">
            <button
              onClick={() => toggleAcceptanceMode("manual")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                acceptanceMode === "manual"
                  ? "bg-white text-neutral-900 shadow-sm border border-neutral-200/90 dark:bg-white/15 dark:text-white dark:border-white/20"
                  : "text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <ToggleLeft className="w-4 h-4 text-neutral-500 dark:text-gray-400" />
              <span>Manual</span>
            </button>

            <button
              onClick={() => toggleAcceptanceMode("auto")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                acceptanceMode === "auto"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md border border-emerald-400/50"
                  : "text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <ToggleRight className="w-4 h-4 text-white" />
              <span>Auto ({autoAcceptDelaySeconds}s)</span>
            </button>
          </div>
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
              className={`relative flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all border cursor-pointer ${
                isActive
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-sm dark:bg-amber-500 dark:text-neutral-950 dark:border-amber-500"
                  : "bg-white text-neutral-700 border-neutral-200/90 hover:bg-neutral-50 dark:bg-[#141B26] dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/5"
              }`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.value === "all" ? "All" : tab.value === "online" ? "Online" : "Dine-In"}</span>
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Online Billing Mode Toggle ─────────────────────────────────────── */}
      {(orderTypeTab === "online" || orderTypeTab === "all") && (
        <div className={`mb-4 rounded-2xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 transition-all shadow-xs ${
          onlineBillingMode === "auto"
            ? "bg-emerald-50/80 border-emerald-300/80 dark:bg-emerald-900/20 dark:border-emerald-500/30"
            : "bg-white border-neutral-200/90 dark:bg-[#141B26] dark:border-white/10"
        }`}>
          {/* Left: Mode Info */}
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              onlineBillingMode === "auto"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400"
                : "bg-neutral-100 text-neutral-800 border border-neutral-200 dark:bg-[#EAB308]/10 dark:text-[#EAB308] dark:border-transparent"
            }`}>
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-sm font-black ${
                onlineBillingMode === "auto" ? "text-emerald-900 dark:text-emerald-300" : "text-neutral-900 dark:text-white"
              }`}>
                {onlineBillingMode === "auto" ? "🤖 Auto Bill Mode" : "🖐 Manual Bill Mode"}
                <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full border ${
                  onlineBillingMode === "auto"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                    : "bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-[#EAB308]/15 dark:text-[#EAB308] dark:border-[#EAB308]/30"
                }`}>
                  Online Orders
                </span>
              </p>
              <p className="text-xs text-neutral-600 dark:text-gray-400 mt-0.5">
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
                  <span className="flex items-center gap-1 text-xs text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1.5 rounded-lg font-bold dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-500/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Printer Ready
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1.5 text-xs text-red-700 bg-red-100 border border-red-300 px-2.5 py-1.5 rounded-lg font-bold dark:text-red-400 dark:bg-red-900/20 dark:border-red-500/30">
                      <WifiOff className="w-3 h-3" />
                      Not Connected
                    </span>
                    <button
                      onClick={handleConnectPrinter}
                      className="text-xs text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer dark:text-white dark:bg-[#EAB308]/20 dark:border-[#EAB308]/30"
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                onlineBillingMode === "auto"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-xs"
                  : "bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-neutral-300 dark:bg-[#0f2933] dark:hover:bg-[#1a4855] dark:text-gray-300 dark:border-white/10"
              }`}
            >
              {onlineBillingMode === "auto"
                ? <><ToggleRight className="w-4 h-4 text-white" /> Auto</>
                : <><ToggleLeft className="w-4 h-4 text-neutral-500 dark:text-gray-400" /> Manual</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {statusTabs.map(tab => (
          <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              statusFilter === tab.value
                ? "bg-neutral-900 text-white border-neutral-900 shadow-sm dark:bg-amber-500 dark:text-neutral-950 dark:border-amber-500"
                : "bg-white text-neutral-700 border-neutral-200/90 hover:bg-neutral-50 dark:bg-[#141B26] dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/5"
            }`}>
            {tab.label}
            {tab.value === "placed" && newOrdersCount > 0 && (
              <span className="ml-1.5 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">{newOrdersCount}</span>
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
                className={`bg-white dark:bg-[#141B26] border rounded-2xl overflow-hidden transition-all shadow-xs hover:shadow-md ${
                  order.order_type === "DINE_IN" ? "border-purple-200 dark:border-purple-500/20" :
                  order.order_type === "DELIVERY" ? "border-amber-200/90 dark:border-[#EAB308]/20" : "border-blue-200 dark:border-blue-500/20"
                }`}>
                {/* Order Type Banner */}
                <div className={`px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b ${
                  order.order_type === "DINE_IN" ? "bg-purple-50 text-purple-900 border-purple-100 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/20" :
                  order.order_type === "DELIVERY" ? "bg-amber-50 text-amber-950 border-amber-100 dark:bg-[#EAB308]/10 dark:text-[#EAB308] dark:border-amber-500/20" : "bg-blue-50 text-blue-900 border-blue-100 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/20"
                }`}>
                  {order.order_type === "DINE_IN" ? <UtensilsCrossed className="w-3.5 h-3.5" /> :
                   order.order_type === "DELIVERY" ? <Bike className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                  <span>{order.order_type?.replace("_", "-")}</span>
                  {order.order_type === "DINE_IN" && order.table_number && (
                    <span className="ml-auto bg-neutral-900 text-white dark:bg-primary dark:text-black px-2.5 py-0.5 rounded-md font-black text-xs">Table {order.table_number}</span>
                  )}
                </div>

                <div className="p-4 sm:p-5">
                  {/* Header row */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black text-neutral-900 dark:text-white font-mono">{order.order_id?.slice(-10) || order.order_id}</h3>
                        {order.kot_number && (
                          <span className="bg-orange-100 text-orange-900 border border-orange-300 font-black font-mono px-2.5 py-0.5 rounded-md text-xs dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30">{order.kot_number}</span>
                        )}
                        {order.auto_accepted && (
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                            <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Auto-Accepted
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-500 dark:text-gray-400 text-xs mt-0.5 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" /> {formatOrderTime(order.created_at)}
                      </p>
                    </div>
                    <div className={`${statusConfig.color} text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold shrink-0 shadow-xs`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig.label}
                    </div>
                  </div>

                  {/* Customer + Address */}
                  <div className="grid sm:grid-cols-2 gap-3 mb-3.5 bg-neutral-50 dark:bg-[#0B0F15] rounded-xl p-3.5 border border-neutral-200/80 dark:border-white/5">
                    <div>
                      <p className="text-neutral-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-wider mb-0.5">CUSTOMER</p>
                      <p className="text-neutral-900 dark:text-white font-black text-sm">{order.customer_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-neutral-800 dark:text-gray-300 text-xs font-bold">{order.phone || "—"}</p>
                        {order.phone && (
                          <button
                            onClick={() => openOrderWhatsApp(order)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-md transition-colors cursor-pointer dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
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
                        <p className="text-neutral-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-wider mb-0.5">
                          {order.order_type === "DINE_IN" ? "TABLE NUMBER" : "DELIVERY ADDRESS"}
                        </p>
                        <p className="text-neutral-900 dark:text-white text-sm font-bold leading-snug">{order.address || `Table ${order.table_number}`}</p>
                        {order.distance_km && <p className="text-neutral-600 dark:text-gray-400 text-xs mt-0.5 font-medium">{order.distance_km} km away</p>}
                      </div>
                    )}
                  </div>

                  {/* Auto-Accept Live Countdown Banner for placed orders */}
                  {order.status === "placed" && acceptanceMode === "auto" && (
                    <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-gradient-to-r dark:from-amber-500/20 dark:via-[#133742] dark:to-[#0f2933] border border-amber-300 dark:border-amber-500/40 flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex items-center justify-center shrink-0">
                          <div className="w-3.5 h-3.5 rounded-full bg-amber-500 animate-ping absolute opacity-75" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5 flex-wrap">
                            <span>⚡ Auto-Accepting in</span>
                            <span className="font-mono text-sm px-2 py-0.5 bg-amber-200 dark:bg-amber-400/20 rounded-md border border-amber-400/50 text-amber-950 dark:text-amber-300 font-extrabold shadow-xs">
                              {getCountdownSeconds(order)}s
                            </span>
                          </p>
                          <p className="text-[10px] text-neutral-600 dark:text-gray-300/80 mt-0.5">
                            Receipt auto-dispatched to Kitchen & Porter rider assigned
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateStatus(order, "accepted")}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept Now
                      </button>
                    </div>
                  )}

                  {/* Items */}
                  <div className="mb-3.5">
                    <p className="text-neutral-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-wider mb-2">ORDER ITEMS</p>
                    <div className="space-y-1.5">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-0.5">
                          <span className="text-neutral-900 dark:text-gray-100 font-bold">
                            {item.name} <span className="text-neutral-500 dark:text-gray-400 font-medium">×{item.quantity}</span>
                          </span>
                          <span className="text-neutral-900 dark:text-amber-400 font-black font-mono">
                            ₹{(item.price * item.quantity).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cooking & Delivery Instructions from Online Customer */}
                  {(order.cooking_instructions || order.delivery_instructions || order.special_instructions) && (
                    <div className="mb-3.5 space-y-1.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 dark:bg-[#0a1e26] dark:border-[#EAB308]/20">
                      {(order.cooking_instructions || order.special_instructions) && (
                        <div className="flex items-start gap-1.5 text-xs text-amber-950 dark:text-amber-300">
                          <span className="font-black shrink-0">🍳 Chef Note:</span>
                          <span className="text-amber-900 dark:text-amber-100 font-medium">{order.cooking_instructions || order.special_instructions}</span>
                        </div>
                      )}
                      {order.delivery_instructions && (
                        <div className="flex items-start gap-1.5 text-xs text-emerald-950 dark:text-emerald-300">
                          <span className="font-black shrink-0">🛵 Delivery Note:</span>
                          <span className="text-emerald-900 dark:text-emerald-100 font-medium">{order.delivery_instructions}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Totals */}
                  <div className="border-t border-neutral-200 dark:border-[#EAB308]/15 pt-3 mb-4">
                    <div className="flex justify-between text-xs text-neutral-600 dark:text-gray-400 mb-1 font-medium">
                      <span>Subtotal</span><span>₹{(order.subtotal || 0).toFixed(2)}</span>
                    </div>
                    {order.delivery_fee > 0 && (
                      <div className="flex justify-between text-xs text-neutral-600 dark:text-gray-400 mb-1 font-medium">
                        <span>Delivery Fee</span><span>₹{order.delivery_fee.toFixed(2)}</span>
                      </div>
                    )}
                    {order.taxes > 0 && (
                      <div className="flex justify-between text-xs text-neutral-600 dark:text-gray-400 mb-1 font-medium">
                        <span>GST</span><span>₹{order.taxes.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-neutral-100 dark:border-white/5">
                      <span className="text-neutral-900 dark:text-white font-black">Total</span>
                      <span className="text-[#E40000] dark:text-amber-400 font-black text-lg font-mono">₹{(order.total || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {nextActions.map(action => (
                      <button key={action.value}
                        onClick={() => updateStatus(order, action.value)}
                        className={`${action.color} text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer`}>
                        {action.label}
                      </button>
                    ))}

                    {/* Print Bill & KOT (online orders - including newly placed) */}
                    {["placed", "accepted", "preparing", "ready", "out_for_delivery", "delivered"].includes(order.status) && order.order_type !== "DINE_IN" && (
                      <div className="flex items-center gap-1.5">
                        {order.bill_number && (
                          <span className="bg-neutral-100 text-neutral-900 font-mono text-xs px-2.5 py-1 rounded-lg font-bold border border-neutral-300 dark:bg-[#EAB308]/15 dark:text-[#EAB308] dark:border-[#EAB308]/30">
                            #{order.bill_number}
                          </span>
                        )}
                        <button
                          onClick={() => printOnlineOrderBill(order)}
                          className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-900 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer dark:bg-[#0f2933] dark:border-[#EAB308]/30 dark:text-white dark:hover:bg-[#1a4855]"
                          title="Print Bill"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Print Bill</span>
                        </button>

                        <button
                          onClick={() => printOnlineOrderKOT(order)}
                          className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-900 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-300 dark:hover:bg-orange-500/20"
                          title="Print Kitchen Order Ticket (KOT)"
                        >
                          <Printer className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          <span>Print KOT</span>
                        </button>
                      </div>
                    )}

                    {/* WhatsApp Customer Dispatch Button */}
                    {order.phone && order.order_type !== "DINE_IN" && (
                      <button
                        onClick={() => openOrderWhatsApp(order)}
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 dark:border-emerald-500/40 dark:text-emerald-400 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                        title="Send WhatsApp confirmation to customer"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>WhatsApp</span>
                      </button>
                    )}

                    {/* ── Delivery Assignment (In-House Fleet OR Porter) ── */}
                    {order.order_type === "DELIVERY" && ["accepted","preparing","ready","out_for_delivery"].includes(order.status) && (
                      <div className="w-full mt-2">

                        {/* 1. Porter Active Banner */}
                        {order.porter_order_id && (
                          <div className="mb-2 rounded-xl border overflow-hidden bg-neutral-50 dark:bg-[#0f2933] border-neutral-200 dark:border-white/10">
                            <div className={`flex items-center justify-between px-3 py-2 border-b ${(PORTER_STATUS_DISPLAY[order.porter_status] || PORTER_STATUS_DISPLAY["open"]).bg}`}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Zap className={`w-3.5 h-3.5 ${(PORTER_STATUS_DISPLAY[order.porter_status] || PORTER_STATUS_DISPLAY["open"]).color}`} />
                                <span className={`text-xs font-bold ${(PORTER_STATUS_DISPLAY[order.porter_status] || PORTER_STATUS_DISPLAY["open"]).color}`}>
                                  Porter: {(PORTER_STATUS_DISPLAY[order.porter_status] || { label: order.porter_status || "Booked" }).label}
                                </span>
                                <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30">
                                  Mock Courier Service
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => refreshPorterStatus(order)}
                                  disabled={porterRefreshing === order.order_id}
                                  title="Refresh Porter status"
                                  className="w-6 h-6 rounded-full bg-white border border-neutral-300 dark:bg-white/5 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                >
                                  <RefreshCw className={`w-3 h-3 ${porterRefreshing === order.order_id ? "animate-spin" : ""}`} />
                                </button>
                                {!["order_picked_up","started_for_delivery","delivered"].includes(order.porter_status) && (
                                  <button
                                    onClick={() => cancelPorterBooking(order)}
                                    disabled={porterCancelling === order.order_id}
                                    title="Cancel Porter"
                                    className="w-6 h-6 rounded-full bg-red-100 border border-red-300 dark:bg-red-900/30 dark:border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 transition-colors"
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
                                      <Bike className="w-3.5 h-3.5 text-neutral-500 dark:text-gray-400" />
                                      <span className="text-neutral-900 dark:text-white text-xs font-bold">{order.porter_rider_name}</span>
                                    </div>
                                  )}
                                  {order.porter_rider_phone && (
                                    <div className="flex items-center gap-1.5">
                                      <Phone className="w-3.5 h-3.5 text-neutral-500 dark:text-gray-400" />
                                      <a href={`tel:${order.porter_rider_phone}`} className="text-neutral-900 dark:text-[#EAB308] text-xs font-bold underline">{order.porter_rider_phone}</a>
                                    </div>
                                  )}
                                </div>
                                {order.porter_tracking_url && (
                                  <a href={order.porter_tracking_url} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline transition-colors font-bold">
                                    <MapPin className="w-3 h-3" /> Live Track <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. In-House Rider Assigned Card */}
                        {order.delivery_partner_name && !order.porter_order_id && (
                          <div className="rounded-xl p-3 bg-emerald-50/80 border border-emerald-300/80 dark:bg-gradient-to-r dark:from-emerald-950/40 dark:to-[#0e2c36] dark:border-emerald-500/30 flex items-center justify-between gap-2 flex-wrap mb-2 shadow-2xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <Bike className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-neutral-900 dark:text-white text-xs font-black">{order.delivery_partner_name}</span>
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                                    PD FLEET
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-neutral-600 dark:text-gray-400 mt-0.5">
                                  <span>{order.delivery_partner_vehicle || "Royal Fleet Bike"}</span>
                                  {order.delivery_partner_phone && (
                                    <>
                                      <span>•</span>
                                      <a href={`tel:${order.delivery_partner_phone}`} className="text-neutral-900 dark:text-[#EAB308] hover:underline font-bold font-mono">
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
                                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white/80 transition cursor-pointer"
                                >
                                  Change
                                </button>
                                {assigningOrder === order.order_id && (
                                  <div className="absolute bottom-full right-0 mb-1 bg-white border border-neutral-300 dark:bg-[#0f2933] dark:border-[#EAB308]/25 rounded-2xl shadow-2xl z-30 w-56 overflow-hidden">
                                    <p className="text-[10px] text-neutral-500 dark:text-gray-400 font-bold uppercase tracking-wider px-3 pt-2.5 pb-1">Assign Different Rider</p>
                                    {deliveryPartners.length === 0 ? (
                                      <p className="text-neutral-500 dark:text-gray-400 text-xs px-3 py-2">No active riders</p>
                                    ) : (
                                      deliveryPartners.map(p => (
                                        <button
                                          key={p.id || p._id}
                                          type="button"
                                          onClick={() => assignDelivery(order.order_id, p.id || p._id)}
                                          className="w-full text-left px-3 py-2 text-xs text-neutral-900 hover:bg-neutral-100 dark:text-gray-200 dark:hover:bg-[#1a4855] transition-colors flex items-center gap-2 cursor-pointer"
                                        >
                                          <Bike className="w-3.5 h-3.5 text-neutral-700 dark:text-[#EAB308]" />
                                          <div>
                                            <p className="font-bold">{p.name}</p>
                                            <p className="text-neutral-500 dark:text-gray-400 text-[10px]">{p.vehicle_type} · {p.phone}</p>
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
                                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-100 border border-red-300 text-red-700 hover:bg-red-200 dark:bg-red-950/40 dark:border-red-500/30 dark:text-red-400 transition cursor-pointer"
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
                                className="bg-neutral-900 hover:bg-black text-white dark:bg-gradient-to-r dark:from-[#ca8a04] dark:to-[#EAB308] dark:text-black px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                              >
                                <Bike className="w-3.5 h-3.5" /> In-House Rider
                              </button>
                              {assigningOrder === order.order_id && (
                                <div className="absolute bottom-full left-0 mb-1 bg-white border border-neutral-300 dark:bg-[#0f2933] dark:border-[#EAB308]/25 rounded-2xl shadow-2xl z-30 w-64 overflow-hidden">
                                  <div className="px-3 py-2 bg-neutral-100 dark:bg-[#1a4855]/60 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
                                    <span className="text-[10px] text-neutral-900 dark:text-[#EAB308] font-black uppercase tracking-wider">Persian Darbar Fleet</span>
                                    <span className="text-[9px] text-neutral-600 dark:text-gray-400 font-bold">{deliveryPartners.length} Available</span>
                                  </div>
                                  {deliveryPartners.length === 0 ? (
                                    <p className="text-neutral-500 dark:text-gray-400 text-xs px-3 py-3">No active riders configured</p>
                                  ) : (
                                    <div className="max-h-48 overflow-y-auto">
                                      {deliveryPartners.map(p => (
                                        <button
                                          key={p.id || p._id}
                                          type="button"
                                          onClick={() => assignDelivery(order.order_id, p.id || p._id)}
                                          className="w-full text-left px-3 py-2.5 text-xs text-neutral-900 hover:bg-neutral-100 dark:text-gray-200 dark:hover:bg-[#1a4855] transition-colors flex items-center gap-2.5 border-b border-neutral-100 dark:border-white/5 last:border-b-0 cursor-pointer"
                                        >
                                          <div className="w-6 h-6 rounded-md bg-neutral-100 text-neutral-800 dark:bg-[#EAB308]/15 dark:text-[#EAB308] flex items-center justify-center shrink-0">
                                            <Bike className="w-3.5 h-3.5" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-bold text-neutral-900 dark:text-white truncate">{p.name}</p>
                                            <p className="text-neutral-500 dark:text-gray-400 text-[10px] truncate">{p.vehicle_type} · {p.phone}</p>
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
                              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5" /> Book Porter
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* View Details */}
                    <button onClick={() => setSelectedOrder(order)}
                      className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 dark:bg-[#0f2933] dark:border-white/10 dark:text-gray-400 dark:hover:text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ml-auto cursor-pointer shadow-2xs">
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
                        className="bg-red-100 hover:bg-red-200 border border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-500/30 dark:text-red-400 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
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
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1a4855] text-neutral-900 dark:text-white rounded-2xl p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-neutral-200 dark:border-[#EAB308]/20 shadow-2xl">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-xl font-black text-neutral-900 dark:text-primary" style={{ fontFamily: "Playfair Display, serif" }}>Order Details</h3>
                <p className="text-neutral-500 dark:text-gray-400 text-sm font-mono">{selectedOrder.order_id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="bg-neutral-50 dark:bg-[#0f2933] border border-neutral-200 dark:border-white/5 rounded-xl p-3 text-sm">
                <div className="flex justify-between mb-1"><span className="text-neutral-500 dark:text-gray-400">Type</span><span className="font-bold text-neutral-900 dark:text-white">{selectedOrder.order_type?.replace("_","-")}</span></div>
                <div className="flex justify-between mb-1"><span className="text-neutral-500 dark:text-gray-400">Placed</span><span className="font-bold text-neutral-900 dark:text-white">{formatOrderTime(selectedOrder.created_at)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500 dark:text-gray-400">Status</span><span className="text-emerald-700 dark:text-primary font-black uppercase text-xs">{selectedOrder.status}</span></div>
              </div>
            </div>

            <h4 className="text-xs font-black text-neutral-500 dark:text-white mb-2 uppercase tracking-wider">Status Timeline</h4>
            <div className="space-y-2 mb-5">
              {(selectedOrder.status_history || []).map((h, idx) => (
                <div key={idx} className="bg-neutral-50 dark:bg-[#0f2933] border border-neutral-200 dark:border-white/5 rounded-xl p-3 flex justify-between items-start">
                  <div>
                    <p className="text-neutral-900 dark:text-primary font-bold text-sm capitalize">{h.status}</p>
                    {h.note && <p className="text-neutral-500 dark:text-gray-400 text-xs mt-0.5">{h.note}</p>}
                  </div>
                  <p className="text-neutral-500 dark:text-gray-400 text-xs shrink-0 ml-3 font-medium">{formatOrderTime(h.timestamp)}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedOrder(null)}
              className="w-full bg-neutral-900 text-white dark:bg-primary dark:text-black py-3 rounded-xl font-bold hover:bg-black transition-colors cursor-pointer shadow-sm">
              Close
            </button>
          </div>
        </div>
      )}

      {/* ===== Porter Booking Modal (Stage 2 Integration) ===== */}
      {porterModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0f2933] border border-orange-200 dark:border-orange-500/30 rounded-2xl p-5 max-w-md w-full shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-neutral-900 dark:text-white font-black text-lg">Book Porter Rider</h3>
                  <p className="text-neutral-500 dark:text-gray-400 text-xs font-mono">{porterModal.order?.order_id?.slice(-10)}</p>
                </div>
              </div>
              <button onClick={() => setPorterModal(null)} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step: No Coordinates */}
            {porterModal.step === "no_coords" && (
              <div>
                <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30 rounded-xl p-3 mb-4">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-yellow-800 dark:text-yellow-300 text-xs font-medium">This order doesn't have GPS coordinates stored. Please enter the customer's approximate coordinates to get a Porter quote.</p>
                </div>
                <p className="text-neutral-600 dark:text-gray-400 text-xs mb-3">Customer address: <span className="text-neutral-900 dark:text-white font-bold">{porterModal.order?.address}</span></p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-[10px] text-neutral-500 dark:text-gray-400 uppercase tracking-wider mb-1 block font-bold">Latitude</label>
                    <input
                      type="number" step="any"
                      value={porterModal.tempLat || ""}
                      onChange={e => setPorterModal(prev => ({ ...prev, tempLat: e.target.value }))}
                      placeholder="e.g. 18.5230"
                      className="w-full bg-neutral-50 dark:bg-[#1a4855] border border-neutral-300 dark:border-white/10 rounded-xl px-3 py-2 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 dark:text-gray-400 uppercase tracking-wider mb-1 block font-bold">Longitude</label>
                    <input
                      type="number" step="any"
                      value={porterModal.tempLng || ""}
                      onChange={e => setPorterModal(prev => ({ ...prev, tempLng: e.target.value }))}
                      placeholder="e.g. 73.8567"
                      className="w-full bg-neutral-50 dark:bg-[#1a4855] border border-neutral-300 dark:border-white/10 rounded-xl px-3 py-2 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPorterModal(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-gray-400 hover:bg-neutral-100 transition-colors font-bold cursor-pointer">Cancel</button>
                  <button
                    onClick={() => _fetchPorterQuote(porterModal.order, porterModal.tempLat, porterModal.tempLng)}
                    disabled={!porterModal.tempLat || !porterModal.tempLng}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-600 to-orange-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
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
                <p className="text-neutral-600 dark:text-gray-400 text-sm font-semibold">Fetching Porter quote...</p>
              </div>
            )}

            {/* Step: Quoted */}
            {porterModal.step === "quoted" && porterModal.quote && (
              <div>
                <div className="bg-neutral-50 dark:bg-[#1a4855] border border-neutral-200 dark:border-transparent rounded-xl p-3 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-gray-400">Customer</span>
                    <span className="text-neutral-900 dark:text-white font-bold">{porterModal.quote.customer_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-gray-400">Distance</span>
                    <span className="text-neutral-900 dark:text-white font-semibold">{porterModal.quote.distance_km ? `${porterModal.quote.distance_km} km` : "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-gray-400">Customer delivery fee</span>
                    <span className={(porterModal.quote.distance_km || 0) <= 5 ? "text-emerald-700 font-bold" : "text-[#E40000] font-bold"}>
                      {(porterModal.quote.distance_km || 0) <= 5 ? "FREE (≤5km)" : "₹60"}
                    </span>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 dark:bg-gradient-to-br dark:from-orange-900/30 dark:to-orange-800/20 dark:border-orange-500/30 rounded-xl p-4 mb-4">
                  <p className="text-orange-800 dark:text-orange-400 text-xs font-black uppercase tracking-wider mb-3">Porter Quote (Your Cost)</p>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-3xl font-black text-neutral-900 dark:text-white">₹{porterModal.quote.estimated_fare?.toFixed(0)}</p>
                      <p className="text-neutral-500 dark:text-gray-400 text-xs font-medium">Estimated Porter fare</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{porterModal.quote.eta_minutes} min</p>
                      <p className="text-neutral-500 dark:text-gray-400 text-xs">Rider ETA</p>
                    </div>
                  </div>
                  <p className="text-neutral-500 dark:text-gray-500 text-xs">{porterModal.quote.note}</p>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Bike className="w-4 h-4 text-orange-500" />
                  <span className="text-neutral-800 dark:text-gray-300 text-sm capitalize font-medium">Vehicle: {porterModal.quote.vehicle_type}</span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setPorterModal(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-gray-400 hover:bg-neutral-100 transition-colors font-bold cursor-pointer">Cancel</button>
                  <button
                    onClick={confirmPorterBook}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white transition-all shadow-md cursor-pointer"
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
                <p className="text-neutral-700 dark:text-gray-400 text-sm font-bold">Booking Porter rider...</p>
                <p className="text-neutral-500 dark:text-gray-600 text-xs mt-1">This may take a few seconds</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
