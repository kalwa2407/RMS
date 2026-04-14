import React, { useEffect, useState, useRef } from "react";
import { Check, X, Clock, Package, Truck, Home, Printer, Eye, Bell, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const OrdersManagement = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const audioRef = useRef(null);

  // Initialize audio on component mount - load custom sound if available
  useEffect(() => {
    const loadNotificationSound = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        const response = await axios.get(
          `${API_BASE}/api/admin/notification-sound`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const audio = new Audio();
        
        // Use custom sound if available, otherwise use default happy bells notification
        if (response.data.url) {
          audio.src = `${API_BASE}${response.data.url}`;
        } else {
          // Default notification sound - happy bells
          audio.src = '/notification.wav';
        }
        
        audio.volume = 0.7;
        audioRef.current = audio;

        // Preload audio on first user interaction
        const enableAudio = () => {
          if (audioRef.current) {
            audioRef.current.play().then(() => {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }).catch(() => {});
          }
        };

        document.addEventListener('click', enableAudio, { once: true });
        document.addEventListener('keydown', enableAudio, { once: true });
        
        return () => {
          document.removeEventListener('click', enableAudio);
          document.removeEventListener('keydown', enableAudio);
        };
      } catch (error) {
        console.log("Failed to load custom sound, using default");
        // Fallback to default happy bells sound
        const audio = new Audio();
        audio.src = '/notification.wav';
        audio.volume = 0.7;
        audioRef.current = audio;
      }
    };

    loadNotificationSound();
  }, []);

  // Sound for new order notification - simple and reliable
  const playNotificationSound = () => {
    try {
      // Play audio element
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("✅ Notification sound played successfully!");
            })
            .catch((error) => {
              console.log("❌ Audio playback failed:", error);
              // Fallback: Try to play again
              setTimeout(() => {
                if (audioRef.current) {
                  audioRef.current.play().catch(() => {});
                }
              }, 100);
            });
        }
      }
    } catch (e) {
      console.log("Sound playback error:", e);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Poll for new orders every 10 seconds
    const interval = setInterval(() => {
      fetchOrders(true); // Silent fetch
    }, 10000);

    return () => clearInterval(interval);
  }, [statusFilter]);

  const fetchOrders = async (silent = false) => {
    try {
      const token = localStorage.getItem("admin_token");
      const url = statusFilter === "all" 
        ? `${API_BASE}/api/admin/orders`
        : `${API_BASE}/api/admin/orders?status_filter=${statusFilter}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newOrders = response.data || [];
      
      // Check for new orders and play sound
      if (silent && newOrders.length > lastOrderCount) {
        const newOrdersCount = newOrders.filter(o => o.status === "placed").length;
        const oldNewOrdersCount = orders.filter(o => o.status === "placed").length;
        
        if (newOrdersCount > oldNewOrdersCount) {
          playNotificationSound();
          toast({
            title: "🔔 New Order Received!",
            description: `You have ${newOrdersCount} new order(s)`,
            duration: 5000,
          });
        }
      }

      setOrders(newOrders);
      setLastOrderCount(newOrders.length);
    } catch (error) {
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const updateStatus = async (order, newStatus, reason = null) => {
    try {
      const token = localStorage.getItem("admin_token");

      const payload = { status: newStatus };
      if (reason) payload.reason = reason;

      await axios.put(
        `${API_BASE}/api/admin/orders/${order.order_id}/status`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: "Success",
        description: `Order ${newStatus === "accepted" ? "confirmed" : newStatus}!`,
      });

      fetchOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const printInvoice = async (order) => {
    if (!order.invoice_url && order.status === 'placed') {
      toast({
        title: "No Invoice",
        description: "Invoice will be generated when order is accepted",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(
        `${API_BASE}/api/admin/invoice/${order.order_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load invoice",
        variant: "destructive",
      });
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      placed: { label: "New Order", color: "bg-blue-500", icon: Bell },
      accepted: { label: "Accepted", color: "bg-green-500", icon: Check },
      preparing: { label: "Preparing", color: "bg-yellow-500", icon: Clock },
      ready: { label: "Ready", color: "bg-purple-500", icon: Package },
      out_for_delivery: { label: "Out for Delivery", color: "bg-orange-500", icon: Truck },
      delivered: { label: "Delivered", color: "bg-green-600", icon: Home },
      cancelled: { label: "Cancelled", color: "bg-red-500", icon: X },
      rejected: { label: "Rejected", color: "bg-red-600", icon: X },
    };
    return configs[status] || { label: status, color: "bg-gray-500", icon: Package };
  };

  const getNextActions = (status) => {
    switch (status) {
      case "placed":
        return [
          { label: "Accept Order", value: "accepted", color: "bg-green-600" },
          { label: "Reject", value: "rejected", color: "bg-red-600" }
        ];
      case "accepted":
        return [{ label: "Start Preparing", value: "preparing", color: "bg-yellow-600" }];
      case "preparing":
        return [{ label: "Mark Ready", value: "ready", color: "bg-purple-600" }];
      case "ready":
        return [{ label: "Out for Delivery", value: "out_for_delivery", color: "bg-orange-600" }];
      case "out_for_delivery":
        return [{ label: "Mark Delivered", value: "delivered", color: "bg-green-700" }];
      default:
        return [];
    }
  };

  const statusTabs = [
    { label: "All Orders", value: "all" },
    { label: "New", value: "placed" },
    { label: "Accepted", value: "accepted" },
    { label: "Preparing", value: "preparing" },
    { label: "Ready", value: "ready" },
    { label: "Out for Delivery", value: "out_for_delivery" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const newOrdersCount = orders.filter(o => o.status === "placed").length;

  if (loading) {
    return (
      <div className="text-center py-20 text-primary">
        Loading orders...
      </div>
    );
  }

  return (
    <div>
      {/* Header with notification */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2
            className="text-4xl font-bold text-primary"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Orders Management
          </h2>
          <p className="text-gray-300 mt-2">
            Total Orders: {orders.length}
            {newOrdersCount > 0 && (
              <span className="ml-4 inline-flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                <Bell className="w-4 h-4" />
                {newOrdersCount} New Order{newOrdersCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={playNotificationSound}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
          >
            🔊 Test Sound
          </button>
          <div className="text-sm text-gray-400">
            🔄 Auto-refresh every 10 seconds
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {statusTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? "bg-primary text-black"
                : "bg-white/[0.03] text-gray-300 hover:bg-[#2a5865]"
            }`}
          >
            {tab.label}
            {tab.value === "placed" && newOrdersCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {newOrdersCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            const nextActions = getNextActions(order.status);

            return (
              <div
                key={order.order_id}
                className={`bg-white/[0.03] border-2 rounded-xl p-6 ${
                  order.order_type === "DINE_IN" 
                    ? "border-primary/20" 
                    : "border-white/5"
                }`}
              >
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-primary">
                        {order.order_id}
                      </h3>
                      {order.order_type === "DINE_IN" && order.table_number && (
                        <span className="bg-primary text-black px-3 py-1 rounded-lg text-sm font-bold">
                          Table {order.table_number}
                        </span>
                      )}
                      {order.kot_number && (
                        <span className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                          {order.kot_number}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      {new Date(order.created_at).toLocaleString()}
                      {order.order_type && (
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                          order.order_type === "DINE_IN" 
                            ? "bg-purple-500/20 text-purple-400" 
                            : order.order_type === "TAKEAWAY"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-green-500/20 text-green-400"
                        }`}>
                          {order.order_type.replace("_", "-")}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className={`${statusConfig.color} text-white px-4 py-2 rounded-lg flex items-center gap-2`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig.label}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid md:grid-cols-2 gap-4 mb-4 bg-[#050b10] rounded-lg p-4">
                  <div>
                    <p className="text-gray-400 text-sm">Customer</p>
                    <p className="text-white font-medium">{order.customer_name}</p>
                    <p className="text-gray-400 text-sm">{order.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">
                      {order.order_type === "DINE_IN" ? "Table" : "Delivery Address"}
                    </p>
                    <p className="text-white">{order.address || `Table ${order.table_number}`}</p>
                    {order.distance_km && (
                      <p className="text-gray-400 text-sm">Distance: {order.distance_km} km</p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">Order Items:</p>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-white">
                          {item.name} x {item.quantity}
                        </span>
                        <span className="text-primary">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Total */}
                <div className="border-t border-white/5 pt-3 mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white">₹{order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.delivery_fee > 0 && (
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Delivery Fee</span>
                      <span className="text-white">₹{order.delivery_fee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Taxes</span>
                    <span className="text-white">₹{order.taxes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-2">
                    <span className="text-white">Total</span>
                    <span className="text-primary">₹{order.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {nextActions.map(action => (
                    <button
                      key={action.value}
                      onClick={() => updateStatus(order, action.value)}
                      className={`${action.color} text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium`}
                    >
                      {action.label}
                    </button>
                  ))}

                  {/* Invoice Button - Show for accepted and later statuses */}
                  {["accepted", "preparing", "ready", "out_for_delivery", "delivered"].includes(order.status) && (
                    <button
                      onClick={() => printInvoice(order)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print Invoice
                    </button>
                  )}

                  {/* View Details */}
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>

                  {/* Delete Button - Only for delivered orders */}
                  {order.status === "delivered" && (
                    <button
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to delete this order?")) {
                          try {
                            const token = localStorage.getItem("admin_token");
                            await axios.delete(`${API_BASE}/api/admin/orders/${order.order_id}`, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            toast({ title: "Success", description: "Order deleted" });
                            fetchOrders();
                          } catch (error) {
                            toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
                          }
                        }
                      }}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white/[0.03] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-primary">
                Order Details: {selectedOrder.order_id}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Status History */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Status History</h4>
              <div className="space-y-2">
                {selectedOrder.status_history.map((history, idx) => (
                  <div key={idx} className="bg-[#050b10] rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-primary font-medium">{history.status}</p>
                        {history.note && (
                          <p className="text-gray-400 text-sm">{history.note}</p>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs">
                        {new Date(history.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full bg-primary text-black py-3 rounded-lg font-bold hover:bg-[#d4a406]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;


