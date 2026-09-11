import React, { useEffect, useState, useRef } from "react";
import { Check, X, Clock, Package, Truck, Home, Printer, Eye, Bell, Trash2, Bike, UtensilsCrossed, ShoppingBag } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";

/* ── helpers ── */
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

  const updateStatus = async (order, newStatus) => {
    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(`${API_BASE}/api/admin/orders/${order.order_id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: "Updated!", description: `Order is now ${newStatus}` });
      fetchOrders();
    } catch {
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
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
                      <p className="text-gray-400 text-xs">{order.phone || "—"}</p>
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

                    {/* Print Invoice */}
                    {["accepted", "preparing", "ready", "out_for_delivery", "delivered"].includes(order.status) && (
                      <button onClick={() => printInvoice(order)}
                        className="bg-[#0f2933] border border-[#EAB308]/30 text-white px-4 py-2 rounded-lg hover:bg-[#1a4855] text-sm font-medium flex items-center gap-2 transition-colors">
                        <Printer className="w-4 h-4" /> Print
                      </button>
                    )}

                    {/* Assign Delivery Partner */}
                    {order.order_type === "DELIVERY" && order.status === "ready" && (
                      <div className="relative">
                        {order.delivery_partner_name ? (
                          <div className="flex items-center gap-2 bg-green-900/30 border border-green-500/30 px-3 py-2 rounded-lg">
                            <Bike className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">{order.delivery_partner_name}</span>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => setAssigningOrder(assigningOrder === order.order_id ? null : order.order_id)}
                              className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2 transition-colors">
                              <Bike className="w-4 h-4" /> Assign Rider
                            </button>
                            {assigningOrder === order.order_id && (
                              <div className="absolute bottom-full left-0 mb-1 bg-[#0f2933] border border-[#EAB308]/25 rounded-xl shadow-2xl z-20 w-56 overflow-hidden">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider px-3 pt-3 pb-1">Select Partner</p>
                                {deliveryPartners.length === 0 ? (
                                  <p className="text-gray-400 text-sm px-3 py-2">No active partners</p>
                                ) : (
                                  deliveryPartners.map(p => (
                                    <button key={p.id} onClick={() => assignDelivery(order.order_id, p.id)}
                                      className="w-full text-left px-3 py-2.5 text-sm text-gray-200 hover:bg-[#1a4855] transition-colors flex items-center gap-2">
                                      <Bike className="w-3.5 h-3.5 text-[#EAB308]" />
                                      <div>
                                        <p className="font-medium">{p.name}</p>
                                        <p className="text-gray-500 text-xs">{p.vehicle_type} · {p.phone}</p>
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </>
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
    </div>
  );
};

export default OrdersManagement;
