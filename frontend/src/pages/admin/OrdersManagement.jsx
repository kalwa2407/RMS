import React, { useEffect, useState, useRef } from "react";
import { Check, X, Clock, Package, Truck, Home, Printer, Eye, Bell, Trash2, Bike, UtensilsCrossed, ShoppingBag, MapPin, Phone, ExternalLink, RefreshCw, Zap, AlertTriangle, WifiOff, MessageCircle, Volume2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";
import { cx, Page, PageHeader, Card, Button, IconButton, Segmented, StatusPill, CountBadge, EmptyState, LoadingState, KeyValue, Sheet, FormGroup, FormRow, FormField, Input } from "./ui";
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
  const adminBranch = (localStorage.getItem("admin_branch") || "all").toLowerCase();
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("all");
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
        title: "Auto Bill Mode Enabled",
        description: "No printer connected. Connect a thermal printer first.",
        variant: "destructive",
        duration: 6000,
      });
    } else if (next === "auto") {
      toast({ title: "Auto Bill Mode", description: "Bills will print automatically on order accept.", duration: 4000 });
    }
  };

  const handleConnectPrinter = async () => {
    const result = await connectSerialPrinter();
    if (result.success) {
      setPrinterConnected(true);
      toast({ title: "Printer Connected!", description: "Thermal printer is ready.", duration: 4000 });
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
          title: "Auto Acceptance Mode Enabled",
          description: `Orders will auto-accept in ${autoAcceptDelaySeconds}s. KOT dispatched to kitchen & Porter rider auto-assigned (Mock).`,
          duration: 5000
        });
      } else {
        toast({
          title: "Manual Acceptance Mode Enabled",
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
        title: "Order Auto-Accepted!",
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
  }, [statusFilter, selectedBranchFilter]);

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
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status_filter", statusFilter);
      if (adminBranch === "all" && selectedBranchFilter !== "all") params.append("branch", selectedBranchFilter);
      const queryString = params.toString() ? `?${params.toString()}` : "";
      const url = `${API_BASE}/api/admin/orders${queryString}`;
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const newOrders = Array.isArray(response.data) ? response.data : [];
      const newPlacedCount = newOrders.filter(o => o.status === "placed").length;
      if (silent && newPlacedCount > lastPlacedCount) {
        playNotificationSound();
        toast({ title: "New Order!", description: `${newPlacedCount} new order(s) received`, duration: 5000 });
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
        toast({ title: "Order Accepted & WhatsApp Dispatched!", description: "Confirmation details sent directly to customer's WhatsApp" });
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
                toast({ title: `Bill Printed: ${billNo}`, description: "Auto-printed to thermal printer", duration: 4000 });
              } else {
                // Auto mode but printer not connected — show alert
                toast({
                  title: `Printer Not Connected`,
                  description: `Bill ${billNo} generated but printer is not connected. Connect printer and print manually.`,
                  variant: "destructive",
                  duration: 8000,
                });
              }
            } else {
              // MANUAL mode: just notify, let admin click Print Bill
              toast({
                title: `Bill Ready: ${billNo}`,
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
      placed: { label: "New", tone: "accent", icon: Bell },
      accepted: { label: "Accepted", tone: "info", icon: Check },
      preparing: { label: "Preparing", tone: "warn", icon: Clock },
      ready: { label: "Ready", tone: "success", icon: Package },
      out_for_delivery: { label: "Out for Delivery", tone: "info", icon: Truck },
      delivered: { label: "Delivered", tone: "neutral", icon: Home },
      cancelled: { label: "Cancelled", tone: "error", icon: X },
      rejected: { label: "Rejected", tone: "error", icon: X },
    };
    return configs[status] || { label: status, tone: "neutral", icon: Package };
  };

  const getNextActions = (status, orderType) => {
    switch (status) {
      case "placed": return [
        { label: "Accept", value: "accepted", variant: "primary", icon: Check },
        { label: "Reject", value: "rejected", variant: "destructive", icon: X },
      ];
      case "accepted": return [{ label: "Start Preparing", value: "preparing", variant: "primary", icon: Clock }];
      case "preparing": return [{ label: "Mark Ready", value: "ready", variant: "primary", icon: Package }];
      case "ready":
        if (orderType === "DINE_IN") return [{ label: "Mark Served", value: "delivered", variant: "primary", icon: Check }];
        return [{ label: "Out for Delivery", value: "out_for_delivery", variant: "primary", icon: Truck }];
      case "out_for_delivery": return [{ label: "Mark Delivered", value: "delivered", variant: "primary", icon: Home }];
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
    return <LoadingState rows={5} label="Loading orders" />;
  }

  const typeMeta = (t) =>
    t === "DINE_IN" ? { label: "Dine-In", icon: UtensilsCrossed } :
    t === "DELIVERY" ? { label: "Delivery", icon: Bike } :
    { label: "Takeaway", icon: ShoppingBag };

  const riderMenu = (order, align = "left") => (
    <div className={cx(
      "absolute bottom-full mb-1.5 z-30 w-64 overflow-hidden rounded-[12px] border border-[var(--a-line)] bg-[var(--a-card)] shadow-[var(--a-shadow-pop)]",
      align === "right" ? "right-0" : "left-0"
    )}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--a-line)]">
        <span className="text-[12px] font-semibold text-[var(--a-text)]">In-house riders</span>
        <span className="text-[12px] text-[var(--a-text-3)] pd-tabular">{deliveryPartners.length} available</span>
      </div>
      {deliveryPartners.length === 0 ? (
        <p className="px-3 py-3 text-[13px] text-[var(--a-text-2)]">No active riders configured</p>
      ) : (
        <div className="max-h-56 overflow-y-auto divide-y divide-[var(--a-line)]">
          {deliveryPartners.map(p => (
            <button
              key={p.id || p._id}
              type="button"
              onClick={() => assignDelivery(order.order_id, p.id || p._id)}
              className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-[var(--a-fill)] cursor-pointer"
            >
              <span className="h-7 w-7 rounded-full bg-[var(--a-fill-2)] flex items-center justify-center shrink-0">
                <Bike className="h-3.5 w-3.5 text-[var(--a-text-2)]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-[var(--a-text)] truncate">{p.name}</span>
                <span className="block text-[12px] text-[var(--a-text-3)] truncate">{[p.vehicle_type, p.phone].filter(Boolean).join(" · ")}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const porterTone = (s) => ({
    open: "warn", accepted: "info", reached_for_pickup: "info", order_picked_up: "info",
    started_for_delivery: "info", reached_for_delivery: "success", delivered: "success", cancelled: "error",
  }[s] || "warn");

  return (
    <Page>
      <PageHeader
        title="Orders"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <span className="pd-tabular">{orders.length} orders</span>
            <span className="text-[var(--a-text-3)]">·</span>
            <span>Refreshes every 10 s</span>
            {newOrdersCount > 0 && <StatusPill tone="accent" dot>{newOrdersCount} new</StatusPill>}
          </span>
        }
        actions={<Button size="sm" icon={Volume2} onClick={playNotificationSound}>Test Sound</Button>}
      />

      {/* Settings: acceptance + billing */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <span className={cx("h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0",
              acceptanceMode === "auto" ? "bg-[var(--a-success-tint)] text-[var(--a-success)]" : "bg-[var(--a-fill)] text-[var(--a-text-2)]")}>
              {acceptanceMode === "auto" ? <Zap className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[15px] font-semibold text-[var(--a-text)]">Order acceptance</h3>
                <StatusPill tone={acceptanceMode === "auto" ? "success" : "neutral"}>
                  {acceptanceMode === "auto" ? `Auto after ${autoAcceptDelaySeconds}s` : "Manual review"}
                </StatusPill>
              </div>
              <p className="mt-0.5 text-[13px] leading-[18px] text-[var(--a-text-2)]">
                {acceptanceMode === "auto"
                  ? `Orders not accepted within ${autoAcceptDelaySeconds}s are accepted automatically, the KOT goes to the kitchen and a Porter rider is assigned (mock).`
                  : "Orders stay as New until an admin or captain accepts them."}
              </p>
            </div>
          </div>
          <Segmented
            size="sm"
            value={acceptanceMode}
            onChange={(v) => toggleAcceptanceMode(v)}
            options={[{ value: "manual", label: "Manual" }, { value: "auto", label: `Auto (${autoAcceptDelaySeconds}s)` }]}
          />
        </Card>

        {(orderTypeTab === "online" || orderTypeTab === "all") && (
          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <span className={cx("h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0",
                onlineBillingMode === "auto" ? "bg-[var(--a-success-tint)] text-[var(--a-success)]" : "bg-[var(--a-fill)] text-[var(--a-text-2)]")}>
                <Printer className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[15px] font-semibold text-[var(--a-text)]">Online bill printing</h3>
                  {onlineBillingMode === "auto" && (
                    printerConnected
                      ? <StatusPill tone="success" dot>Printer ready</StatusPill>
                      : <StatusPill tone="error" icon={WifiOff}>Printer not connected</StatusPill>
                  )}
                </div>
                <p className="mt-0.5 text-[13px] leading-[18px] text-[var(--a-text-2)]">
                  {onlineBillingMode === "auto"
                    ? "The bill prints on the thermal printer when an order is accepted."
                    : "Print each bill manually after accepting the order."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onlineBillingMode === "auto" && !printerConnected && (
                <Button size="sm" variant="plain" onClick={handleConnectPrinter}>Connect</Button>
              )}
              <Segmented
                size="sm"
                value={onlineBillingMode}
                onChange={(v) => { if (v !== onlineBillingMode) toggleOnlineBillingMode(); }}
                options={[{ value: "manual", label: "Manual" }, { value: "auto", label: "Auto" }]}
              />
            </div>
          </Card>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            value={orderTypeTab}
            onChange={setOrderTypeTab}
            options={orderTypeTabs.map(t => ({
              value: t.value,
              icon: t.icon,
              label: t.label,
              count: t.value === "online" ? newOnlineCount : t.value === "dinein" ? newDineCount : newOrdersCount,
            }))}
          />
          {adminBranch === "all" && (
            <Segmented
              size="sm"
              value={selectedBranchFilter}
              onChange={setSelectedBranchFilter}
              options={[
                { value: "all", label: "All Outlets" },
                { value: "pune", label: "Pune" },
                { value: "kurla", label: "Kurla" },
                { value: "bandra", label: "Bandra" },
                { value: "andheri", label: "Andheri" },
              ]}
            />
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
          {statusTabs.map(tab => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cx(
                  "h-8 px-3 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer inline-flex items-center gap-1.5 border",
                  active
                    ? "bg-[var(--a-text)] text-[var(--a-bg)] border-transparent"
                    : "bg-[var(--a-card)] text-[var(--a-text-2)] border-[var(--a-line)] hover:text-[var(--a-text)]"
                )}
              >
                {tab.label}
                {tab.value === "placed" && newOrdersCount > 0 && <CountBadge>{newOrdersCount}</CountBadge>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <Card>
          <EmptyState
            icon={Package}
            title="No orders"
            description={orderTypeTab !== "all" ? `No ${orderTypeTab === "online" ? "online or delivery" : "dine-in"} orders right now.` : "No orders match the current filter."}
          />
        </Card>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filteredOrders.map(order => {
            const statusConfig = getStatusConfig(order.status);
            const nextActions = getNextActions(order.status, order.order_type);
            const tm = typeMeta(order.order_type);
            const TypeIcon = tm.icon;
            const porter = PORTER_STATUS_DISPLAY[order.porter_status] || { label: order.porter_status || "Booked" };

            return (
              <Card key={order.order_id} padded={false} className="flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[16px] font-semibold text-[var(--a-text)] pd-tabular">#{order.order_id?.slice(-10) || order.order_id}</span>
                      {order.kot_number && <StatusPill tone="neutral">{order.kot_number}</StatusPill>}
                      {order.auto_accepted && <StatusPill tone="success" icon={Zap}>Auto-accepted</StatusPill>}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[13px] text-[var(--a-text-2)]">
                      <TypeIcon className="h-3.5 w-3.5" />
                      <span>{tm.label}</span>
                      {order.order_type === "DINE_IN" && order.table_number && <span>· Table {order.table_number}</span>}
                      <span className="text-[var(--a-text-3)]">·</span>
                      <span>{order.branch_name || (order.branch ? `${order.branch.charAt(0).toUpperCase()}${order.branch.slice(1)}` : "Pune")}</span>
                      <span className="text-[var(--a-text-3)]">·</span>
                      <span className="pd-tabular">{formatOrderTime(order.created_at)}</span>
                    </div>
                  </div>
                  <StatusPill tone={statusConfig.tone} dot>{statusConfig.label}</StatusPill>
                </div>

                {/* Customer */}
                <div className="mx-4 rounded-[10px] bg-[var(--a-inset)] px-3 py-2.5 grid gap-2 sm:grid-cols-2">
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-[var(--a-text)] truncate">{order.customer_name || "Guest"}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[13px] text-[var(--a-text-2)]">
                      <span className="pd-tabular">{order.phone || "No phone"}</span>
                      {order.phone && (
                        <button onClick={() => openOrderWhatsApp(order)} className="inline-flex items-center gap-1 text-[var(--a-success)] font-medium hover:underline cursor-pointer" title="Chat with customer on WhatsApp">
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </button>
                      )}
                    </div>
                  </div>
                  {(order.address || order.table_number) && (
                    <div className="min-w-0 text-[13px] leading-[18px] text-[var(--a-text-2)]">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--a-text-3)]" />
                        <span className="line-clamp-2">{order.address || `Table ${order.table_number}`}</span>
                      </div>
                      {order.distance_km && <div className="pl-5 text-[var(--a-text-3)] pd-tabular">{order.distance_km} km away</div>}
                    </div>
                  )}
                </div>

                {/* Auto-accept countdown */}
                {order.status === "placed" && acceptanceMode === "auto" && (
                  <div className="mx-4 mt-3 rounded-[10px] bg-[var(--a-warn-tint)] px-3 py-2.5 flex items-center justify-between gap-3">
                    <div className="text-[13px] leading-[18px] text-[var(--a-warn)]">
                      <div className="font-semibold">Auto-accepting in <span className="pd-tabular">{getCountdownSeconds(order)}s</span></div>
                      <div className="opacity-80">KOT goes to the kitchen and a Porter rider is assigned.</div>
                    </div>
                    <Button size="sm" variant="success" icon={Check} onClick={() => updateStatus(order, "accepted")}>Accept now</Button>
                  </div>
                )}

                {/* Items */}
                <div className="px-4 pt-3">
                  <div className="divide-y divide-[var(--a-line)]">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-baseline justify-between gap-3 py-1.5 text-[14px]">
                        <span className="min-w-0 text-[var(--a-text)]">
                          <span className="pd-tabular text-[var(--a-text-3)] mr-1.5">{item.quantity}×</span>{item.name}
                        </span>
                        <span className="pd-tabular text-[var(--a-text)]">₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {(order.cooking_instructions || order.delivery_instructions || order.special_instructions) && (
                  <div className="mx-4 mt-2 space-y-1 rounded-[10px] bg-[var(--a-gold-tint)] px-3 py-2 text-[13px] leading-[18px]">
                    {(order.cooking_instructions || order.special_instructions) && (
                      <div><span className="font-semibold text-[var(--a-gold)]">Chef note: </span><span className="text-[var(--a-text)]">{order.cooking_instructions || order.special_instructions}</span></div>
                    )}
                    {order.delivery_instructions && (
                      <div><span className="font-semibold text-[var(--a-gold)]">Delivery note: </span><span className="text-[var(--a-text)]">{order.delivery_instructions}</span></div>
                    )}
                  </div>
                )}

                {/* Totals */}
                <div className="mx-4 mt-3 pt-3 border-t border-[var(--a-line)] space-y-1">
                  <KeyValue label="Subtotal" value={`₹${(order.subtotal || 0).toFixed(2)}`} className="text-[13px]" />
                  {order.delivery_fee > 0 && <KeyValue label="Delivery fee" value={`₹${order.delivery_fee.toFixed(2)}`} className="text-[13px]" />}
                  {order.taxes > 0 && <KeyValue label="GST" value={`₹${order.taxes.toFixed(2)}`} className="text-[13px]" />}
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-[15px] font-semibold text-[var(--a-text)]">Total</span>
                    <span className="text-[18px] font-semibold text-[var(--a-text)] pd-tabular">₹{(order.total || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Delivery assignment */}
                {order.order_type === "DELIVERY" && ["accepted","preparing","ready","out_for_delivery"].includes(order.status) && (
                  <div className="mx-4 mt-3">
                    {order.porter_order_id && (
                      <div className="rounded-[10px] border border-[var(--a-line)] overflow-hidden">
                        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[var(--a-inset)]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusPill tone={porterTone(order.porter_status)} icon={Zap}>Porter: {porter.label.replace(" ✓", "")}</StatusPill>
                            <span className="text-[12px] text-[var(--a-text-3)]">Mock courier service</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <IconButton icon={RefreshCw} label="Refresh Porter status" className={cx("h-7 w-7", porterRefreshing === order.order_id && "[&>svg]:animate-spin")}
                              onClick={() => refreshPorterStatus(order)} disabled={porterRefreshing === order.order_id} />
                            {!["order_picked_up","started_for_delivery","delivered"].includes(order.porter_status) && (
                              <IconButton icon={X} label="Cancel Porter" variant="destructive" className="h-7 w-7"
                                onClick={() => cancelPorterBooking(order)} disabled={porterCancelling === order.order_id} />
                            )}
                          </div>
                        </div>
                        {(order.porter_rider_name || order.porter_rider_phone || order.porter_tracking_url) && (
                          <div className="px-3 py-2 flex items-center justify-between gap-2 flex-wrap text-[13px]">
                            <div className="flex items-center gap-3 text-[var(--a-text)]">
                              {order.porter_rider_name && <span className="inline-flex items-center gap-1.5"><Bike className="h-3.5 w-3.5 text-[var(--a-text-3)]" />{order.porter_rider_name}</span>}
                              {order.porter_rider_phone && <a href={`tel:${order.porter_rider_phone}`} className="inline-flex items-center gap-1.5 pd-tabular hover:underline"><Phone className="h-3.5 w-3.5 text-[var(--a-text-3)]" />{order.porter_rider_phone}</a>}
                            </div>
                            {order.porter_tracking_url && (
                              <a href={order.porter_tracking_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-[var(--a-info)] hover:underline">
                                Live track <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {order.delivery_partner_name && !order.porter_order_id && (
                      <div className="rounded-[10px] border border-[var(--a-line)] px-3 py-2.5 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="h-8 w-8 rounded-full bg-[var(--a-success-tint)] text-[var(--a-success)] flex items-center justify-center shrink-0"><Bike className="h-4 w-4" /></span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-medium text-[var(--a-text)] truncate">{order.delivery_partner_name}</span>
                              <StatusPill tone="success">PD Fleet</StatusPill>
                            </div>
                            <div className="text-[12px] text-[var(--a-text-2)]">
                              {order.delivery_partner_vehicle || "Fleet bike"}
                              {order.delivery_partner_phone && <> · <a href={`tel:${order.delivery_partner_phone}`} className="pd-tabular hover:underline">{order.delivery_partner_phone}</a></>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="relative">
                            <Button size="sm" variant="tinted" onClick={() => setAssigningOrder(assigningOrder === order.order_id ? null : order.order_id)}>Change</Button>
                            {assigningOrder === order.order_id && riderMenu(order, "right")}
                          </div>
                          <Button size="sm" variant="destructive" onClick={() => unassignDelivery(order.order_id)} disabled={unassigningOrder === order.order_id}>
                            {unassigningOrder === order.order_id ? "Removing…" : "Unassign"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {!order.delivery_partner_name && !order.porter_order_id && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                          <Button size="sm" variant="secondary" icon={Bike} onClick={() => setAssigningOrder(assigningOrder === order.order_id ? null : order.order_id)}>
                            In-house rider
                          </Button>
                          {assigningOrder === order.order_id && riderMenu(order, "left")}
                        </div>
                        <Button size="sm" variant="secondary" icon={Zap} onClick={() => openPorterModal(order)}>Book Porter</Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto px-4 py-3 mt-3 border-t border-[var(--a-line)] flex flex-wrap items-center gap-2">
                  {nextActions.map(action => (
                    <Button key={action.value} size="sm" variant={action.variant} icon={action.icon} onClick={() => updateStatus(order, action.value)}>
                      {action.label}
                    </Button>
                  ))}

                  {["placed", "accepted", "preparing", "ready", "out_for_delivery", "delivered"].includes(order.status) && order.order_type !== "DINE_IN" && (
                    <>
                      {order.bill_number && <StatusPill tone="neutral">#{order.bill_number}</StatusPill>}
                      <Button size="sm" variant="tinted" icon={Printer} onClick={() => printOnlineOrderBill(order)} title="Print Bill">Bill</Button>
                      <Button size="sm" variant="tinted" icon={Printer} onClick={() => printOnlineOrderKOT(order)} title="Print Kitchen Order Ticket (KOT)">KOT</Button>
                    </>
                  )}

                  {order.phone && order.order_type !== "DINE_IN" && (
                    <IconButton icon={MessageCircle} label="Send WhatsApp message to customer" onClick={() => openOrderWhatsApp(order)} />
                  )}

                  <div className="ml-auto flex items-center gap-1.5">
                    <Button size="sm" variant="plain" icon={Eye} onClick={() => setSelectedOrder(order)}>Details</Button>
                    {order.status === "delivered" && (
                      <IconButton icon={Trash2} label="Delete order" variant="destructive" onClick={async () => {
                        if (!window.confirm("Delete this order?")) return;
                        try {
                          const token = localStorage.getItem("admin_token");
                          await axios.delete(`${API_BASE}/api/admin/orders/${order.order_id}`, { headers: { Authorization: `Bearer ${token}` } });
                          toast({ title: "Deleted", description: "Order deleted" });
                          fetchOrders();
                        } catch { toast({ title: "Error", description: "Failed to delete", variant: "destructive" }); }
                      }} />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order details */}
      <Sheet
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order details"
        subtitle={selectedOrder?.order_id}
        size="sm"
        footer={<Button variant="secondary" onClick={() => setSelectedOrder(null)}>Close</Button>}
      >
        {selectedOrder && (
          <div className="space-y-5">
            <FormGroup>
              <FormRow label="Type"><span className="text-[15px] text-[var(--a-text-2)]">{typeMeta(selectedOrder.order_type).label}</span></FormRow>
              <FormRow label="Placed"><span className="text-[15px] text-[var(--a-text-2)] pd-tabular">{formatOrderTime(selectedOrder.created_at)}</span></FormRow>
              <FormRow label="Status"><StatusPill tone={getStatusConfig(selectedOrder.status).tone} dot>{getStatusConfig(selectedOrder.status).label}</StatusPill></FormRow>
            </FormGroup>
            <FormGroup title="Status timeline">
              {(selectedOrder.status_history || []).length === 0 ? (
                <div className="px-4 py-3 text-[14px] text-[var(--a-text-2)]">No status changes recorded yet.</div>
              ) : (selectedOrder.status_history || []).map((h, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div>
                    <div className="text-[15px] text-[var(--a-text)] capitalize">{String(h.status).replace(/_/g, " ")}</div>
                    {h.note && <div className="text-[13px] text-[var(--a-text-2)]">{h.note}</div>}
                  </div>
                  <div className="text-[13px] text-[var(--a-text-3)] pd-tabular shrink-0">{formatOrderTime(h.timestamp)}</div>
                </div>
              ))}
            </FormGroup>
          </div>
        )}
      </Sheet>

      {/* Porter booking */}
      <Sheet
        open={!!porterModal}
        onClose={() => setPorterModal(null)}
        title="Book Porter rider"
        subtitle={porterModal?.order?.order_id?.slice(-10)}
        size="sm"
        footer={porterModal && (porterModal.step === "no_coords" ? (
          <>
            <Button variant="secondary" onClick={() => setPorterModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => _fetchPorterQuote(porterModal.order, porterModal.tempLat, porterModal.tempLng)} disabled={!porterModal.tempLat || !porterModal.tempLng}>Get quote</Button>
          </>
        ) : porterModal.step === "quoted" && porterModal.quote ? (
          <>
            <Button variant="secondary" onClick={() => setPorterModal(null)}>Cancel</Button>
            <Button variant="primary" icon={Check} onClick={confirmPorterBook}>Confirm booking</Button>
          </>
        ) : null)}
      >
        {porterModal?.step === "no_coords" && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-[10px] bg-[var(--a-warn-tint)] px-3 py-2.5 text-[13px] leading-[18px] text-[var(--a-warn)]">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>This order has no GPS coordinates. Enter the customer's approximate coordinates to get a Porter quote.</span>
            </div>
            <p className="text-[13px] text-[var(--a-text-2)]">Customer address: <span className="text-[var(--a-text)]">{porterModal.order?.address}</span></p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Latitude">
                <Input type="number" step="any" value={porterModal.tempLat || ""} onChange={e => setPorterModal(prev => ({ ...prev, tempLat: e.target.value }))} placeholder="e.g. 18.5230" />
              </FormField>
              <FormField label="Longitude">
                <Input type="number" step="any" value={porterModal.tempLng || ""} onChange={e => setPorterModal(prev => ({ ...prev, tempLng: e.target.value }))} placeholder="e.g. 73.8567" />
              </FormField>
            </div>
          </div>
        )}

        {(porterModal?.step === "quoting" || porterModal?.step === "booking") && (
          <div className="py-10 flex flex-col items-center gap-3">
            <div className="h-7 w-7 rounded-full border-2 border-[var(--a-fill-2)] border-t-[var(--a-text-2)] animate-spin" />
            <p className="text-[14px] text-[var(--a-text-2)]">{porterModal.step === "quoting" ? "Fetching Porter quote…" : "Booking Porter rider… this may take a few seconds"}</p>
          </div>
        )}

        {porterModal?.step === "quoted" && porterModal.quote && (
          <div className="space-y-4">
            <div className="rounded-[12px] border border-[var(--a-line)] bg-[var(--a-card)] p-4 flex items-end justify-between">
              <div>
                <div className="text-[13px] text-[var(--a-text-2)]">Estimated Porter fare (your cost)</div>
                <div className="text-[32px] leading-[38px] font-semibold text-[var(--a-text)] pd-tabular">₹{porterModal.quote.estimated_fare?.toFixed(0)}</div>
              </div>
              <div className="text-right">
                <div className="text-[13px] text-[var(--a-text-2)]">Rider ETA</div>
                <div className="text-[20px] font-semibold text-[var(--a-text)] pd-tabular">{porterModal.quote.eta_minutes} min</div>
              </div>
            </div>
            <FormGroup footer={porterModal.quote.note}>
              <FormRow label="Customer"><span className="text-[15px] text-[var(--a-text-2)]">{porterModal.quote.customer_name}</span></FormRow>
              <FormRow label="Distance"><span className="text-[15px] text-[var(--a-text-2)] pd-tabular">{porterModal.quote.distance_km ? `${porterModal.quote.distance_km} km` : "—"}</span></FormRow>
              <FormRow label="Customer delivery fee">
                <StatusPill tone={(porterModal.quote.distance_km || 0) <= 5 ? "success" : "neutral"}>{(porterModal.quote.distance_km || 0) <= 5 ? "Free (≤5 km)" : "₹60"}</StatusPill>
              </FormRow>
              <FormRow label="Vehicle"><span className="text-[15px] text-[var(--a-text-2)] capitalize">{porterModal.quote.vehicle_type}</span></FormRow>
            </FormGroup>
          </div>
        )}
      </Sheet>
    </Page>
  );
};

export default OrdersManagement;
