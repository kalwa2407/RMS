import React, { useState, useEffect, useCallback } from "react";
import { ChefHat, Clock, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

const KitchenView = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const API_BASE = (process.env.REACT_APP_BACKEND_URL || "");
  const token = localStorage.getItem("admin_token");

  const fetchKitchenOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/kitchen/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch kitchen orders:", err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, token]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchKitchenOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast({
          title: "Status Updated",
          description: `Order ${orderId} marked as ${newStatus}`,
        });
        fetchKitchenOrders();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getTimeSinceOrder = (createdAt) => {
    const diff = Math.floor((new Date() - new Date(createdAt)) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
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
          <ChefHat className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-primary">Kitchen View</h1>
            <p className="text-gray-400 text-sm">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={fetchKitchenOrders}
          className="flex items-center space-x-2 bg-white/[0.03] px-4 py-2 rounded-lg text-primary hover:bg-[#254a58] transition"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="bg-white/[0.03] rounded-xl p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl text-white mb-2">All Caught Up!</h2>
          <p className="text-gray-400">No pending orders in the kitchen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div
              key={order.order_id}
              className={`bg-white/[0.03] rounded-xl p-5 border-2 ${
                order.status === "accepted"
                  ? "border-yellow-500"
                  : "border-orange-500"
              }`}
            >
              {/* Order Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-primary font-bold text-lg">
                      {order.kot_number || order.order_id}
                    </span>
                    {order.order_type === "DINE_IN" && order.table_number && (
                      <span className="bg-primary text-black px-2 py-1 rounded text-sm font-bold">
                        Table {order.table_number}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    {order.customer_name}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      order.status === "accepted"
                        ? "bg-yellow-500/20 text-yellow-500"
                        : "bg-orange-500/20 text-orange-500"
                    }`}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Order Time */}
              <div className="flex items-center space-x-2 text-gray-400 text-sm mb-4">
                <Clock className="h-4 w-4" />
                <span>{getTimeSinceOrder(order.created_at)}</span>
              </div>

              {/* Items */}
              <div className="bg-[#050b10] rounded-lg p-3 mb-4">
                <h4 className="text-white font-bold mb-2">Items:</h4>
                <ul className="space-y-2">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="text-gray-300">
                      <div className="flex justify-between">
                        <span>
                          <span className="text-primary font-bold mr-2">
                            {item.quantity}x
                          </span>
                          {item.name}
                        </span>
                      </div>
                      {item.variant && (
                        <span className="text-gray-500 text-sm ml-6">({item.variant})</span>
                      )}
                      {item.addons && item.addons.length > 0 && (
                        <span className="text-gray-500 text-sm ml-6 block">
                          + {item.addons.join(", ")}
                        </span>
                      )}
                      {item.special_instructions && (
                        <div className="ml-6 mt-1 text-yellow-500 text-sm flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {item.special_instructions}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {order.status === "accepted" && (
                  <button
                    onClick={() => updateOrderStatus(order.order_id, "preparing")}
                    className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-bold hover:bg-orange-600 transition"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === "preparing" && (
                  <button
                    onClick={() => updateOrderStatus(order.order_id, "ready")}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold hover:bg-green-600 transition"
                  >
                    Mark Ready
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenView;


