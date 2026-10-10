import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  Clock,
  Check,
  X,
  ChefHat,
  Receipt,
  CreditCard,
  RefreshCw,
  UtensilsCrossed,
  Bell,
  DollarSign,
  Volume2,
  VolumeX,
  Printer,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import logoImg from "../../assets/logo.png";

import API_BASE from "../../lib/config";

const TableSessions = () => {
  const { toast } = useToast();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [billingSessions, setBillingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedSession, setSelectedSession] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [pendingCount, setPendingCount] = useState(0);
  const audioRef = useRef(null);
  const [soundUrl, setSoundUrl] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundIntervalRef = useRef(null);

  const token = localStorage.getItem("admin_token");

  // Fetch notification sound
  useEffect(() => {
    const fetchSound = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/notification-sound/dinein`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.url) {
          setSoundUrl(`${API_BASE}${data.url}`);
        }
      } catch (err) {}
    };
    fetchSound();
  }, [token]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    
    if (audioRef.current && soundUrl) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      // Default beep if no custom sound
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleIAyYLR0bIHRxXN3fW55qJF9jH9tXnqNqahpS15lkrjDpFY1MFmPuNGfYBkJP53azeWbaAAldJTQmIZ1m7aYnYuLh4Z5dWpnSU5lgJmrk2gwHkBxo7++i1AsIEl4lqeeb1M2U3+YppNuV0hUhp+qk2c+IT9wiZ+ciXRbUl+Di5ySemNeXXqKk4lwWlFSZ4GUmnllUk5gh5unlmlOQE10ipyai3VcS1BnfY+ai35xXVJYbH6NlIh3ZVhVXnOCi42Cd2ZZV1xudoOKhXxwY1pZY3R+iIh+cmNaV2BxfYaIgXVnXllebnmEiIN4amBaXm93goeDeW1jX19zeoWHg3txZWFfc3qEhoN6cWViYnN5g4WBem9lYmRzeYOFgXpvZWNkc3mChYF5b2VjZHR5goWAeXBlYmR0eYKFgHlwZWNkdHmChIB5cGVjZHR5goSAeXBlY2R0eYKEgHlwZWNkdHmChIB5cGVjZA==");
      audio.play().catch(() => {});
    }
  }, [soundUrl, soundEnabled]);

  // Sound interval - play every 10 seconds while there are pending orders
  useEffect(() => {
    // Clear existing interval
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }

    // If there are pending orders and sound is enabled, play every 10 seconds
    if (pendingCount > 0 && soundEnabled) {
      // Play immediately
      playNotificationSound();
      
      // Then play every 10 seconds
      soundIntervalRef.current = setInterval(() => {
        playNotificationSound();
      }, 10000);
    }

    return () => {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
      }
    };
  }, [pendingCount, soundEnabled, playNotificationSound]);

  const fetchData = useCallback(async () => {
    try {
      const pendingRes = await fetch(`${API_BASE}/api/admin/table-sessions/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pendingRes.ok) {
        const newPending = await pendingRes.json();
        
        // Show toast if new orders arrived
        if (newPending.length > pendingCount && pendingCount > 0) {
          toast({ title: "🔔 New Dine-In Order!", description: `Table order waiting for approval` });
        } else if (newPending.length > 0 && pendingCount === 0) {
          toast({ title: "🔔 Pending Dine-In Orders!", description: `${newPending.length} order(s) waiting for approval` });
        }
        
        setPendingCount(newPending.length);
        setPendingOrders(newPending);
      }

      const sessionsRes = await fetch(`${API_BASE}/api/admin/table-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sessionsRes.ok) {
        const sessions = await sessionsRes.json();
        setActiveSessions(sessions.filter(s => s.status === "active" || s.status === "pending"));
        setBillingSessions(sessions.filter(s => s.status === "billing"));
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [token, pendingCount, toast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const approveOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/table-sessions/order/${orderId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Order Approved", description: "Sent to kitchen" });
        fetchData();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to approve", variant: "destructive" });
    }
  };

  const rejectOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/table-sessions/order/${orderId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Order Rejected" });
        fetchData();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to reject", variant: "destructive" });
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const statusMessages = {
          preparing: "Order marked as Preparing",
          ready: "Order is Ready to Serve",
          served: "Order Served"
        };
        toast({ title: statusMessages[newStatus] || "Status Updated" });
        fetchData();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const generateBill = async (sessionId) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/table-sessions/${sessionId}/generate-bill?discount=${discount}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSelectedSession(data);
        setActiveTab("billing");
        toast({ title: "Bill Generated" });
        fetchData();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate bill", variant: "destructive" });
    }
  };

  const closeSession = async (sessionId) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/table-sessions/${sessionId}/close?payment_method=${paymentMethod}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        toast({ title: "Session Closed", description: "Table is now free" });
        setSelectedSession(null);
        fetchData();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to close session", variant: "destructive" });
    }
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    return { date, time };
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch (e) {
      return "";
    }
  };

  const getLogoBase64 = () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width  = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 200;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Convert any colored pixels to crisp, high-density pitch black
        // so thermal and monochrome receipt printers produce a bold, sharp logo
        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 30) {
              data[i] = 0;     // R
              data[i + 1] = 0; // G
              data[i + 2] = 0; // B
              data[i + 3] = 255;
            } else {
              data[i + 3] = 0;
            }
          }
          ctx.putImageData(imgData, 0, 0);
        } catch (e) {
          // Fallback to normal canvas export
        }
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve("");
      img.src = logoImg;
    });
  };

  const printBill = async (session) => {
    const billNo   = session.bill_number || session.session_id?.slice(-8) || "—";
    const tableNo  = session.table_number;
    const customer = session.customer_name || "Guest";
    const now      = formatDateTime(new Date().toISOString());

    // Flatten all items across all orders in the session
    const allItems = (session.orders || []).flatMap((o) => o.items || []);

    // Merge duplicate items
    const merged = {};
    allItems.forEach((item) => {
      const key = item.name + (item.variant ? `|${item.variant}` : "");
      if (merged[key]) {
        merged[key].quantity += item.quantity;
        merged[key].total   += item.price * item.quantity;
      } else {
        merged[key] = {
          name:     item.name + (item.variant ? ` (${item.variant})` : ""),
          quantity: item.quantity,
          rate:     item.price,
          total:    item.price * item.quantity,
        };
      }
    });
    const rows = Object.values(merged);

    const subtotal = session.subtotal ?? 0;
    const taxes    = session.taxes    ?? 0;
    const discount = session.discount ?? 0;
    const total    = session.total    ?? subtotal + taxes - discount;

    // Convert logo to base64 so it works inside the sandboxed print window
    const logoBase64 = await getLogoBase64();
    const logoHtml   = logoBase64
      ? `<div style="text-align:center;margin-bottom:4px;"><img src="${logoBase64}" alt="Persian Darbar" style="width:85px;height:auto;max-height:55px;object-fit:contain;margin:0 auto;display:inline-block;filter:contrast(200%) brightness(0);" /></div>`
      : "";

    const w = window.open("", "_blank", "width=340,height=700");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Bill - ${billNo}</title>
      <style>
        @page { size: 80mm auto; margin: 3mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          font-weight: 700;
          width: 72mm;
          color: #000;
          line-height: 1.35;
        }
        .center { text-align: center; }
        .bold   { font-weight: 900; }
        .dashed { border-top: 1.5px dashed #000; margin: 6px 0; }
        .solid  { border-top: 2.5px solid #000; margin: 6px 0; }
        .row    { display: flex; justify-content: space-between; font-weight: 700; }
        .row-3  { display: flex; font-weight: 700; }
        .row-3 .col-name  { flex: 1; font-weight: 800; padding-right: 4px; }
        .row-3 .col-qty   { width: 32px; text-align: center; font-weight: 800; }
        .row-3 .col-amt   { width: 58px; text-align: right; font-weight: 900; }
        .header-name { font-size: 20px; font-weight: 900; letter-spacing: 1px; margin-top: 2px; }
        .sub { font-size: 11px; font-weight: 700; }
        .bill-no { font-size: 14px; font-weight: 900; }
        .grand-total { font-size: 17px; font-weight: 900; padding: 2px 0; }
        .footer { font-size: 11px; font-weight: 700; }
        .items-header { font-size: 13px; font-weight: 900; border-bottom: 2px solid #000; padding-bottom: 3px; margin-bottom: 4px; }
      </style>
    </head><body>
      <div class="center">
        ${logoHtml}
        <div class="header-name">PERSIAN DARBAR</div>
        <div class="sub">Camp, Pune, Maharashtra 411004</div>
        <div class="sub">Ph: +91 9594287868</div>
        <div class="sub">GSTIN: 27XXXXX1234X1Z5</div>
      </div>
      <div class="dashed"></div>
      <div class="center bold" style="font-size:14px;letter-spacing:1px;">BILL / TAX INVOICE</div>
      <div class="dashed"></div>
      <div class="row">
        <span><b>Bill No:</b> <span class="bill-no">${billNo}</span></span>
        <span>${now.date}</span>
      </div>
      <div class="row">
        <span><b>Table:</b> ${tableNo}</span>
        <span>${now.time}</span>
      </div>
      <div><b>Customer:</b> ${customer}</div>
      <div class="dashed"></div>
      <div class="items-header row-3">
        <span class="col-name">ITEM</span>
        <span class="col-qty">QTY</span>
        <span class="col-amt">AMT</span>
      </div>
      ${rows.map(r => `
        <div class="row-3" style="padding:2px 0;">
          <span class="col-name">${r.name}</span>
          <span class="col-qty">${r.quantity}</span>
          <span class="col-amt">&#8377;${r.total.toFixed(0)}</span>
        </div>
      `).join("")}
      <div class="dashed"></div>
      <div class="row"><span>Subtotal</span><span>&#8377;${subtotal.toFixed(2)}</span></div>
      <div class="row"><span>GST (5%)</span><span>&#8377;${taxes.toFixed(2)}</span></div>
      ${discount > 0 ? `<div class="row"><span>Discount</span><span>- &#8377;${discount.toFixed(2)}</span></div>` : ""}
      <div class="solid"></div>
      <div class="row grand-total"><span>GRAND TOTAL</span><span>&#8377;${total.toFixed(2)}</span></div>
      <div class="solid"></div>
      <div class="dashed"></div>
      <div class="center footer" style="margin-top:8px;">
        <div>Thank you for dining with us!</div>
        <div>Powered by Persian Darbar POS</div>
      </div>
    </body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 300);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#EAB308]" style={{ fontFamily: "'Playfair Display', serif" }}>Dine-In Orders</h1>
          <p className="text-gray-500 text-xs uppercase tracking-widest">Table Session Management</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm font-bold transition ${
              soundEnabled
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{soundEnabled ? "Sound ON" : "Sound OFF"}</span>
          </button>
          <button
            onClick={fetchData}
            className="bg-[#1a4855] text-white px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm hover:bg-[#234d5c] transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs — horizontally scrollable on mobile */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-2 ${
            activeTab === "pending"
              ? "bg-yellow-500 text-black"
              : "bg-[#1a4855] text-gray-300 hover:text-white"
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Pending Approval</span>
          {pendingOrders.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-2 ${
            activeTab === "active"
              ? "bg-green-500 text-black"
              : "bg-[#1a4855] text-gray-300 hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Active Tables</span>
          <span className="bg-green-700 text-white text-xs px-2 py-0.5 rounded-full">
            {activeSessions.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-2 ${
            activeTab === "billing"
              ? "bg-blue-500 text-black"
              : "bg-[#1a4855] text-gray-300 hover:text-white"
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Billing</span>
        </button>
      </div>

      {/* PENDING APPROVAL TAB */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingOrders.length === 0 ? (
            <div className="bg-[#1a4855] rounded-xl p-8 text-center">
              <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No pending orders</p>
            </div>
          ) : (
            pendingOrders.map((order) => (
              <div key={order.order_id} className="bg-[#1a4855] rounded-xl p-4 border-l-4 border-yellow-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="bg-primary text-black px-3 py-1 rounded-lg font-bold">
                        Table {order.table_number}
                      </span>
                      <span className="text-white font-medium">{order.customer_name}</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatTime(order.created_at)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => rejectOrder(order.order_id)}
                      className="bg-red-500/20 text-red-500 px-4 py-2 rounded-lg font-bold hover:bg-red-500/30 transition flex items-center space-x-1"
                    >
                      <X className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => approveOrder(order.order_id)}
                      className="bg-green-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-green-400 transition flex items-center space-x-1"
                    >
                      <Check className="h-4 w-4" />
                      <span>Accept & Send to Kitchen</span>
                    </button>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-[#0f2933] rounded-lg p-3">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-400 text-sm border-b border-[#EAB308]/20">
                        <th className="text-left py-2">Item</th>
                        <th className="text-center py-2">Qty</th>
                        <th className="text-right py-2">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-800">
                          <td className="py-2 text-white">{item.name}</td>
                          <td className="py-2 text-center text-primary font-bold">{item.quantity}</td>
                          <td className="py-2 text-right text-white">₹{item.price * item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#EAB308]/20">
                    <span className="text-primary font-bold">Total</span>
                    <span className="text-primary font-bold text-lg">₹{order.total}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ACTIVE TABLES TAB */}
      {activeTab === "active" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeSessions.length === 0 ? (
            <div className="col-span-full bg-[#1a4855] rounded-xl p-8 text-center">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No active tables</p>
            </div>
          ) : (
            activeSessions.map((session) => (
              <div key={session.session_id} className="bg-[#1a4855] rounded-xl p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-green-500 text-black px-3 py-1 rounded-lg font-bold">
                        Table {session.table_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        session.status === "active" ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <p className="text-white font-medium mt-1">{session.customer_name}</p>
                    <p className="text-gray-400 text-xs">
                      Started: {formatTime(session.created_at)}
                    </p>
                  </div>
                </div>

                {/* Session Orders */}
                <div className="space-y-2 mb-4">
                  {session.orders?.map((order, idx) => (
                    <div key={order.order_id} className="bg-[#0f2933] rounded-lg p-2 text-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Order #{idx + 1}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          order.status === "accepted" ? "bg-green-500/20 text-green-500" :
                          order.status === "preparing" ? "bg-blue-500/20 text-blue-500" :
                          order.status === "ready" ? "bg-purple-500/20 text-purple-500" :
                          order.status === "served" ? "bg-gray-500/20 text-gray-400" :
                          "bg-gray-500/20 text-gray-500"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-white mb-2">₹{order.total}</p>
                      
                      {/* Status Update Buttons */}
                      {order.status !== "served" && order.status !== "rejected" && (
                        <div className="flex flex-wrap gap-1">
                          {order.status === "accepted" && (
                            <button
                              onClick={() => updateOrderStatus(order.order_id, "preparing")}
                              className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded text-xs font-medium hover:bg-blue-500/30"
                            >
                              <ChefHat className="h-3 w-3 inline mr-1" />
                              Preparing
                            </button>
                          )}
                          {(order.status === "accepted" || order.status === "preparing") && (
                            <button
                              onClick={() => updateOrderStatus(order.order_id, "ready")}
                              className="bg-purple-500/20 text-purple-500 px-2 py-1 rounded text-xs font-medium hover:bg-purple-500/30"
                            >
                              <UtensilsCrossed className="h-3 w-3 inline mr-1" />
                              Ready
                            </button>
                          )}
                          {(order.status === "ready" || order.status === "preparing") && (
                            <button
                              onClick={() => updateOrderStatus(order.order_id, "served")}
                              className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs font-medium hover:bg-green-500/30"
                            >
                              <Check className="h-3 w-3 inline mr-1" />
                              Served
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Session Total */}
                <div className="bg-[#0f2933] rounded-lg p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Session Total</span>
                    <span className="text-primary font-bold text-lg">₹{session.total}</span>
                  </div>
                </div>

                {/* Generate Bill Button */}
                <button
                  onClick={() => generateBill(session.session_id)}
                  className="w-full bg-primary text-black py-2 rounded-lg font-bold hover:bg-white transition flex items-center justify-center space-x-2"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Generate Final Bill</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* BILLING TAB */}
      {activeTab === "billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Bills */}
          <div>
            <h3 className="text-lg font-bold text-primary mb-4">Pending Bills</h3>
            {billingSessions.length === 0 ? (
              <div className="bg-[#1a4855] rounded-xl p-8 text-center">
                <Receipt className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No pending bills</p>
              </div>
            ) : (
              <div className="space-y-3">
                {billingSessions.map((session) => (
                  <div
                    key={session.session_id}
                    onClick={() => setSelectedSession(session)}
                    className={`bg-[#1a4855] rounded-xl p-4 cursor-pointer transition ${
                      selectedSession?.session_id === session.session_id
                        ? "border border-primary/20"
                        : "hover:bg-[#234d5c]"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="bg-blue-500 text-black px-3 py-1 rounded-lg font-bold">
                          Table {session.table_number}
                        </span>
                        {session.bill_number && (
                          <span className="ml-2 bg-[#EAB308]/20 text-primary font-mono text-sm px-2 py-1 rounded font-bold">
                            #{session.bill_number}
                          </span>
                        )}
                        <p className="text-white mt-1">{session.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-bold text-xl">₹{session.total}</p>
                        <p className="text-gray-400 text-xs">{session.orders?.length} orders</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bill Details */}
          <div>
            <h3 className="text-lg font-bold text-primary mb-4">Bill Details</h3>
            {selectedSession ? (
              <div className="bg-[#1a4855] rounded-xl p-4">
                <div className="text-center mb-4 pb-4 border-b border-[#EAB308]/20">
                  <h4 className="text-xl font-bold text-white">Persian Darbar</h4>
                  {selectedSession.bill_number && (
                    <p className="text-primary font-mono font-bold text-lg tracking-widest mt-1">
                      Bill # {selectedSession.bill_number}
                    </p>
                  )}
                  <p className="text-gray-400">Table {selectedSession.table_number}</p>
                  <p className="text-gray-400">{selectedSession.customer_name}</p>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {selectedSession.orders?.map((order) =>
                    order.items?.map((item, idx) => (
                      <div key={`${order.order_id}-${idx}`} className="flex justify-between text-sm">
                        <span className="text-white">
                          {item.name} x{item.quantity}
                        </span>
                        <span className="text-white">₹{item.price * item.quantity}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-[#EAB308]/20 pt-3 space-y-2">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>₹{selectedSession.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>GST (5%)</span>
                    <span>₹{selectedSession.taxes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Discount</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-24 bg-[#0f2933] text-white px-2 py-1 rounded text-right"
                    />
                  </div>
                  <div className="flex justify-between text-primary font-bold text-xl pt-2 border-t border-[#EAB308]/20">
                    <span>Total</span>
                    <span>₹{selectedSession.total - discount}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-4 pt-4 border-t border-[#EAB308]/20">
                  <p className="text-gray-400 text-sm mb-2">Payment Method</p>
                  <div className="flex space-x-2">
                    {["cash", "card", "upi"].map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`flex-1 py-2 rounded-lg font-medium transition ${
                          paymentMethod === method
                            ? "bg-primary text-black"
                            : "bg-[#0f2933] text-gray-300 hover:text-white"
                        }`}
                      >
                        {method.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Print + Close Session Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => printBill(selectedSession)}
                    className="flex-1 bg-[#1a4855] border border-[#EAB308]/40 text-primary py-3 rounded-lg font-bold hover:bg-[#234d5c] transition flex items-center justify-center space-x-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Bill</span>
                  </button>
                  <button
                    onClick={() => closeSession(selectedSession.session_id)}
                    className="flex-1 bg-green-500 text-black py-3 rounded-lg font-bold hover:bg-green-400 transition flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Complete Payment</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#1a4855] rounded-xl p-8 text-center">
                <DollarSign className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Select a bill to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audio element for dine-in notification */}
      {soundUrl && <audio ref={audioRef} src={soundUrl} preload="auto" />}
    </div>
  );
};

export default TableSessions;


