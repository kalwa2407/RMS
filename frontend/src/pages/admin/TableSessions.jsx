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
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";

const API_BASE = process.env.REACT_APP_BACKEND_URL;

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

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <UtensilsCrossed className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-primary">Table Dine-In Orders</h1>
            <p className="text-gray-400 text-sm">PetPooja-Style Session Management</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Sound Toggle Button */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition ${
              soundEnabled 
                ? "bg-green-600 text-white hover:bg-green-700" 
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
            title={soundEnabled ? "Sound ON - Click to mute" : "Sound OFF - Click to unmute"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span>{soundEnabled ? "Sound ON" : "Sound OFF"}</span>
          </button>
          <button
            onClick={fetchData}
            className="bg-white/[0.03] text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-[#234d5c] transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-2 ${
            activeTab === "pending"
              ? "bg-yellow-500 text-black"
              : "bg-white/[0.03] text-gray-300 hover:text-white"
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
              : "bg-white/[0.03] text-gray-300 hover:text-white"
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
              : "bg-white/[0.03] text-gray-300 hover:text-white"
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
            <div className="bg-white/[0.03] rounded-xl p-8 text-center">
              <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No pending orders</p>
            </div>
          ) : (
            pendingOrders.map((order) => (
              <div key={order.order_id} className="bg-white/[0.03] rounded-xl p-4 border-l-4 border-yellow-500">
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
                <div className="bg-[#050b10] rounded-lg p-3">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-400 text-sm border-b border-white/5">
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
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
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
            <div className="col-span-full bg-white/[0.03] rounded-xl p-8 text-center">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No active tables</p>
            </div>
          ) : (
            activeSessions.map((session) => (
              <div key={session.session_id} className="bg-white/[0.03] rounded-xl p-4">
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
                    <div key={order.order_id} className="bg-[#050b10] rounded-lg p-2 text-sm">
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
                <div className="bg-[#050b10] rounded-lg p-3 mb-4">
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
              <div className="bg-white/[0.03] rounded-xl p-8 text-center">
                <Receipt className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No pending bills</p>
              </div>
            ) : (
              <div className="space-y-3">
                {billingSessions.map((session) => (
                  <div
                    key={session.session_id}
                    onClick={() => setSelectedSession(session)}
                    className={`bg-white/[0.03] rounded-xl p-4 cursor-pointer transition ${
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
              <div className="bg-white/[0.03] rounded-xl p-4">
                <div className="text-center mb-4 pb-4 border-b border-white/5">
                  <h4 className="text-xl font-bold text-white">Persian Darbar</h4>
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
                <div className="border-t border-white/5 pt-3 space-y-2">
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
                      className="w-24 bg-[#050b10] text-white px-2 py-1 rounded text-right"
                    />
                  </div>
                  <div className="flex justify-between text-primary font-bold text-xl pt-2 border-t border-white/5">
                    <span>Total</span>
                    <span>₹{selectedSession.total - discount}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-gray-400 text-sm mb-2">Payment Method</p>
                  <div className="flex space-x-2">
                    {["cash", "card", "upi"].map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`flex-1 py-2 rounded-lg font-medium transition ${
                          paymentMethod === method
                            ? "bg-primary text-black"
                            : "bg-[#050b10] text-gray-300 hover:text-white"
                        }`}
                      >
                        {method.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Close Session Button */}
                <button
                  onClick={() => closeSession(selectedSession.session_id)}
                  className="w-full mt-4 bg-green-500 text-black py-3 rounded-lg font-bold hover:bg-green-400 transition flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Complete Payment & Close Table</span>
                </button>
              </div>
            ) : (
              <div className="bg-white/[0.03] rounded-xl p-8 text-center">
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


