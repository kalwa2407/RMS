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
  Volume2,
  VolumeX,
  Printer,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import logoImg from "../../assets/logo.png";

import API_BASE from "../../lib/config";
import { Page, PageHeader, Card, List, ListRow, SectionTitle, Button, Segmented, StatusPill, KeyValue, FormField, Input, EmptyState, LoadingState } from "./ui";

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
    return <LoadingState rows={4} label="Loading dine-in sessions" />;
  }

  const orderTone = (s) => ({ accepted: "info", preparing: "warn", ready: "success", served: "neutral", rejected: "error" }[s] || "neutral");

  return (
    <Page>
      <PageHeader
        title="Dine-In"
        subtitle="Table sessions, approvals and billing"
        actions={
          <>
            <Button
              variant={soundEnabled ? "tinted" : "destructive"}
              icon={soundEnabled ? Volume2 : VolumeX}
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? "Sound On" : "Sound Off"}
            </Button>
            <Button icon={RefreshCw} onClick={fetchData}>Refresh</Button>
          </>
        }
      />

      <Segmented
        value={activeTab}
        onChange={setActiveTab}
        options={[
          { value: "pending", label: "Pending Approval", icon: Bell, count: pendingOrders.length },
          { value: "active", label: `Active Tables (${activeSessions.length})`, icon: Users },
          { value: "billing", label: "Billing", icon: Receipt },
        ]}
      />

      {/* PENDING APPROVAL */}
      {activeTab === "pending" && (
        pendingOrders.length === 0 ? (
          <Card><EmptyState icon={Bell} title="No pending orders" description="New table orders waiting for approval will appear here." /></Card>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {pendingOrders.map((order) => (
              <Card key={order.order_id} padded={false}>
                <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[17px] font-semibold text-[var(--a-text)]">Table {order.table_number}</span>
                      <StatusPill tone="accent" dot>Waiting</StatusPill>
                    </div>
                    <div className="text-[13px] text-[var(--a-text-2)]">
                      {order.customer_name} · <span className="pd-tabular">{formatTime(order.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 divide-y divide-[var(--a-line)]">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-baseline justify-between gap-3 py-1.5 text-[14px]">
                      <span className="text-[var(--a-text)]"><span className="pd-tabular text-[var(--a-text-3)] mr-1.5">{item.quantity}×</span>{item.name}</span>
                      <span className="pd-tabular text-[var(--a-text)]">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="mx-4 mt-2 pt-2 border-t border-[var(--a-line)] flex items-baseline justify-between">
                  <span className="text-[15px] font-semibold">Total</span>
                  <span className="text-[17px] font-semibold pd-tabular">₹{order.total}</span>
                </div>
                <div className="px-4 py-3 mt-3 border-t border-[var(--a-line)] flex justify-end gap-2">
                  <Button size="sm" variant="destructive" icon={X} onClick={() => rejectOrder(order.order_id)}>Reject</Button>
                  <Button size="sm" variant="primary" icon={Check} onClick={() => approveOrder(order.order_id)}>Accept & Send to Kitchen</Button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* ACTIVE TABLES */}
      {activeTab === "active" && (
        activeSessions.length === 0 ? (
          <Card><EmptyState icon={Users} title="No active tables" description="Seated tables with open sessions appear here." /></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeSessions.map((session) => (
              <Card key={session.session_id} padded={false} className="flex flex-col">
                <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                  <div>
                    <div className="text-[17px] font-semibold text-[var(--a-text)]">Table {session.table_number}</div>
                    <div className="text-[13px] text-[var(--a-text-2)]">
                      {session.customer_name} · since <span className="pd-tabular">{formatTime(session.created_at)}</span>
                    </div>
                  </div>
                  <StatusPill tone={session.status === "active" ? "success" : "warn"} dot>
                    <span className="capitalize">{session.status}</span>
                  </StatusPill>
                </div>

                <div className="mx-4 rounded-[12px] border border-[var(--a-line)] divide-y divide-[var(--a-line)]">
                  {session.orders?.map((order, idx) => (
                    <div key={order.order_id} className="px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[14px] text-[var(--a-text)]">Order {idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] pd-tabular text-[var(--a-text)]">₹{order.total}</span>
                          <StatusPill tone={orderTone(order.status)}><span className="capitalize">{order.status}</span></StatusPill>
                        </div>
                      </div>
                      {order.status !== "served" && order.status !== "rejected" && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {order.status === "accepted" && (
                            <Button size="sm" variant="tinted" icon={ChefHat} className="h-7" onClick={() => updateOrderStatus(order.order_id, "preparing")}>Preparing</Button>
                          )}
                          {(order.status === "accepted" || order.status === "preparing") && (
                            <Button size="sm" variant="tinted" icon={UtensilsCrossed} className="h-7" onClick={() => updateOrderStatus(order.order_id, "ready")}>Ready</Button>
                          )}
                          {(order.status === "ready" || order.status === "preparing") && (
                            <Button size="sm" variant="tinted" icon={Check} className="h-7" onClick={() => updateOrderStatus(order.order_id, "served")}>Served</Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mx-4 mt-3 flex items-baseline justify-between">
                  <span className="text-[14px] text-[var(--a-text-2)]">Session total</span>
                  <span className="text-[20px] font-semibold pd-tabular">₹{session.total}</span>
                </div>
                <div className="p-4 mt-auto">
                  <Button variant="primary" icon={Receipt} className="w-full" onClick={() => generateBill(session.session_id)}>
                    Generate Final Bill
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* BILLING */}
      {activeTab === "billing" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <section className="space-y-2">
            <SectionTitle title="Pending bills" />
            {billingSessions.length === 0 ? (
              <Card><EmptyState icon={Receipt} title="No pending bills" description="Generate a final bill from Active Tables." /></Card>
            ) : (
              <List>
                {billingSessions.map((session) => {
                  const selected = selectedSession?.session_id === session.session_id;
                  return (
                    <ListRow
                      key={session.session_id}
                      onClick={() => setSelectedSession(session)}
                      className={selected ? "bg-[var(--a-fill-2)]" : ""}
                      title={<span className="flex items-center gap-2">Table {session.table_number}{session.bill_number && <StatusPill tone="neutral">#{session.bill_number}</StatusPill>}</span>}
                      subtitle={`${session.customer_name || "Guest"} · ${session.orders?.length || 0} orders`}
                      trailing={<span className="text-[16px] font-semibold pd-tabular text-[var(--a-text)]">₹{session.total}</span>}
                    />
                  );
                })}
              </List>
            )}
          </section>

          <section className="space-y-2">
            <SectionTitle title="Bill details" />
            {selectedSession ? (
              <Card className="space-y-4">
                <div className="text-center pb-3 border-b border-[var(--a-line)]">
                  <div className="text-[17px] font-semibold">Persian Darbar</div>
                  {selectedSession.bill_number && <div className="text-[14px] pd-tabular text-[var(--a-text-2)]">Bill #{selectedSession.bill_number}</div>}
                  <div className="text-[13px] text-[var(--a-text-2)]">Table {selectedSession.table_number} · {selectedSession.customer_name}</div>
                </div>

                <div className="divide-y divide-[var(--a-line)]">
                  {selectedSession.orders?.map((order) =>
                    order.items?.map((item, idx) => (
                      <div key={`${order.order_id}-${idx}`} className="flex justify-between gap-3 py-1.5 text-[14px]">
                        <span><span className="pd-tabular text-[var(--a-text-3)] mr-1.5">{item.quantity}×</span>{item.name}</span>
                        <span className="pd-tabular">₹{item.price * item.quantity}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--a-line)] space-y-2">
                  <KeyValue label="Subtotal" value={`₹${selectedSession.subtotal}`} />
                  <KeyValue label="GST (5%)" value={`₹${selectedSession.taxes}`} />
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="text-[var(--a-text-2)]">Discount</span>
                    <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-28 h-9 text-right pd-tabular" />
                  </div>
                  <div className="flex items-baseline justify-between pt-2 border-t border-[var(--a-line)]">
                    <span className="text-[16px] font-semibold">Total</span>
                    <span className="text-[24px] font-semibold pd-tabular">₹{selectedSession.total - discount}</span>
                  </div>
                </div>

                <FormField label="Payment method">
                  <Segmented
                    stretch
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    options={["cash", "card", "upi"].map(m => ({ value: m, label: m.toUpperCase() }))}
                  />
                </FormField>

                <div className="flex gap-2">
                  <Button className="flex-1" size="lg" icon={Printer} onClick={() => printBill(selectedSession)}>Print Bill</Button>
                  <Button className="flex-1" size="lg" variant="success" icon={CreditCard} onClick={() => closeSession(selectedSession.session_id)}>Complete Payment</Button>
                </div>
              </Card>
            ) : (
              <Card><EmptyState icon={Receipt} title="No bill selected" description="Select a pending bill to review and settle it." /></Card>
            )}
          </section>
        </div>
      )}

      {/* Audio element for dine-in notification */}
      {soundUrl && <audio ref={audioRef} src={soundUrl} preload="auto" />}
    </Page>
  );
};

export default TableSessions;
