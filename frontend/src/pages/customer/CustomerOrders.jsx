import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import API_BASE from '../../lib/config';
import {
  ShoppingBag,
  Clock,
  ArrowLeft,
  Search,
  Eye,
  RotateCw,
  FileText,
  XCircle,
  CheckCircle,
  Truck,
  UtensilsCrossed,
  AlertCircle
} from 'lucide-react';

const CustomerOrders = () => {
  const { idToken, currentUser, fetchWithAuth } = useCustomerAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, delivered, cancelled
  const [searchQuery, setSearchQuery] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!idToken) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/api/customer/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setLoading(false);
    }
  }, [idToken, fetchWithAuth]);

  useEffect(() => {
    if (idToken) {
      fetchOrders();
    }
  }, [idToken, fetchOrders]);

  // Handle order cancellation
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Cancelled by customer' })
      });
      if (res.ok) {
        await fetchOrders();
      } else {
        const err = await res.json();
        alert(err.detail || 'Could not cancel order');
      }
    } catch (err) {
      alert('Error cancelling order: ' + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  // Re-order items
  const handleReorder = (order) => {
    try {
      const cartItems = order.items.map(item => ({
        id: item.menu_item_id || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        veg: item.veg !== undefined ? item.veg : true,
        selectedVariant: item.variant || null,
        selectedAddons: item.addons || []
      }));
      localStorage.setItem('cart', JSON.stringify(cartItems));
      navigate('/order');
    } catch (err) {
      console.error('Failed to reorder:', err);
      navigate('/order');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'placed':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">Order Placed</span>;
      case 'accepted':
      case 'preparing':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">Kitchen Preparing</span>;
      case 'ready':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-semibold">Food Ready</span>;
      case 'out_for_delivery':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">Out for Delivery</span>;
      case 'delivered':
        return <span className="bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1 rounded-full text-xs font-semibold">Delivered</span>;
      case 'cancelled':
      case 'rejected':
        return <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full text-xs font-semibold">Cancelled</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-300 border border-gray-500/30 px-3 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  // Filter & Search Logic
  const filteredOrders = orders.filter(order => {
    // Filter by tab
    if (filter === 'active') {
      if (!['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(order.status)) return false;
    } else if (filter === 'delivered') {
      if (order.status !== 'delivered') return false;
    } else if (filter === 'cancelled') {
      if (!['cancelled', 'rejected'].includes(order.status)) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (order.order_id || '').toLowerCase().includes(q);
      const matchItems = (order.items || []).some(i => (i.name || '').toLowerCase().includes(q));
      return matchId || matchItems;
    }

    return true;
  });

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#070d14" }}>

      {/* ─── Fixed Header ─── */}
      <div
        className="shrink-0"
        style={{
          background: "rgba(7,13,20,0.98)",
          borderBottom: "1px solid rgba(234,179,8,0.1)",
          backdropFilter: "blur(16px)",
          paddingTop: "calc(max(env(safe-area-inset-top, 54px), 54px) + 8px)"
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/customer/dashboard" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#EAB308] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">My Orders</h1>
              <p className="text-[#EAB308] text-[10px] font-semibold">{orders.length} total order{orders.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Link to="/order" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-black bg-[#EAB308] hover:bg-[#CA8A04] transition-all">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Now</span>
          </Link>
        </div>

        {/* Filter + Search bar */}
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active 🔴' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all shrink-0 ${
                filter === tab.id ? 'bg-[#EAB308] text-black' : 'bg-white/5 text-gray-300 border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="relative flex-1 min-w-[130px]">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-7 pr-2 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white placeholder-gray-500 focus:outline-none focus:border-[#EAB308]/50"
            />
          </div>
        </div>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">


        {/* Orders List */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 space-y-2">
            <div className="w-6 h-6 border-2 border-[#EAB308] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Fetching your orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-[#0f2933]/80 border border-white/5 rounded-2xl p-12 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-gray-500 mx-auto" />
            <p className="text-base text-gray-300 font-medium">No orders found</p>
            <p className="text-xs text-gray-400">
              {searchQuery ? 'Try matching another dish name or order ID' : 'You have no orders in this category.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const isActive = ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(order.status);
              const canCancel = order.status === 'placed';

              return (
                <div
                  key={order.order_id || order._id}
                  className="bg-[#0f2933]/90 border border-[#EAB308]/20 hover:border-[#EAB308]/40 rounded-2xl p-5 sm:p-6 transition-all shadow-xl space-y-4"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-[#EAB308]">
                          #{order.order_id}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} • {order.order_type || 'DELIVERY'}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-lg font-bold text-white">
                        ₹{order.total?.toFixed(2)}
                      </div>
                      <span className="text-[11px] text-gray-400 uppercase tracking-wide">
                        {order.payment_method} • {order.payment_status}
                      </span>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="space-y-2 py-1">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.veg !== false ? 'bg-green-400' : 'bg-red-400'}`} />
                          <span className="font-medium text-white">
                            {item.quantity} × {item.name}
                          </span>
                          {item.variant && (
                            <span className="text-[11px] text-gray-400">({item.variant})</span>
                          )}
                        </div>
                        <span className="font-mono text-gray-300">
                          ₹{((item.price + (item.variant_price || 0)) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery details */}
                  {order.address && (
                    <div className="text-xs text-gray-400 bg-[#0a1e25]/60 p-2.5 rounded-xl border border-white/5">
                      <strong className="text-gray-300">Delivery Address: </strong>
                      {order.address} {order.phone && `• Contact: +91 ${order.phone}`}
                    </div>
                  )}

                  {/* Actions Bottom Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      {order.invoice_url && (
                        <a
                          href={order.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#EAB308]" />
                          <span>Invoice</span>
                        </a>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => handleCancelOrder(order.order_id)}
                          disabled={cancellingId === order.order_id}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{cancellingId === order.order_id ? 'Cancelling...' : 'Cancel Order'}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReorder(order)}
                        className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-[#EAB308]" />
                        <span>Reorder</span>
                      </button>

                      {isActive && (
                        <Link
                          to={`/track?order_id=${order.order_id}`}
                          className="px-4 py-1.5 bg-[#EAB308] hover:bg-[#CA8A04] text-black text-xs font-bold rounded-xl transition-all shadow flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Track Live</span>
                        </Link>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        </div>
      </div>
    </div>
  );
};

export default CustomerOrders;
