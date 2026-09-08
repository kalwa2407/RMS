import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import API_BASE from '../../lib/config';
import {
  ShoppingBag,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Edit2,
  Check,
  ChevronRight,
  ArrowRight,
  LogOut,
  AlertCircle,
  Truck,
  Sparkles,
  UtensilsCrossed,
  RotateCw,
  Eye
} from 'lucide-react';

const CustomerDashboard = () => {
  const { currentUser, customerProfile, updateProfile, signOutCustomer, idToken } = useCustomerAuth();
  const navigate = useNavigate();

  // State
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingRes, setLoadingRes] = useState(true);

  // Phone editing state
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Initial phone sync
  useEffect(() => {
    if (customerProfile?.phone) {
      setPhoneInput(customerProfile.phone);
    }
  }, [customerProfile]);

  // Fetch customer orders
  const fetchOrders = useCallback(async () => {
    if (!idToken) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_BASE}/api/customer/orders`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [idToken]);

  // Fetch customer reservations
  const fetchReservations = useCallback(async () => {
    if (!idToken) return;
    setLoadingRes(true);
    try {
      const res = await fetch(`${API_BASE}/api/customer/reservations`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReservations(data || []);
      }
    } catch (err) {
      console.error('Error fetching customer reservations:', err);
    } finally {
      setLoadingRes(false);
    }
  }, [idToken]);

  useEffect(() => {
    if (idToken) {
      fetchOrders();
      fetchReservations();
    }
  }, [idToken, fetchOrders, fetchReservations]);

  // Save phone number handler
  const handleSavePhone = async (e) => {
    e.preventDefault();
    setPhoneError('');
    const cleanPhone = phoneInput.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    setPhoneSaving(true);
    const res = await updateProfile({ phone: cleanPhone });
    setPhoneSaving(false);
    if (res.success) {
      setIsEditingPhone(false);
      setPhoneSuccess(true);
      setTimeout(() => setPhoneSuccess(false), 3000);
      // Re-fetch orders in case past orders match this phone
      fetchOrders();
    } else {
      setPhoneError(res.warning || 'Failed to save phone number');
    }
  };

  // Find active orders
  const activeOrders = orders.filter(o => 
    ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)
  );

  // Find upcoming / pending reservations
  const activeReservations = reservations.filter(r => 
    ['pending', 'confirmed'].includes(r.status)
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'placed':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-medium animate-pulse">Placed</span>;
      case 'accepted':
      case 'preparing':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-xs font-medium animate-pulse">Kitchen Preparing</span>;
      case 'ready':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-xs font-medium">Food Ready</span>;
      case 'out_for_delivery':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-medium animate-pulse">Out for Delivery</span>;
      case 'delivered':
        return <span className="bg-green-500/20 text-green-300 border border-green-500/30 px-2.5 py-0.5 rounded-full text-xs font-medium">Delivered</span>;
      case 'cancelled':
      case 'rejected':
        return <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-0.5 rounded-full text-xs font-medium">Cancelled</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-300 border border-gray-500/30 px-2.5 py-0.5 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#184956] to-[#0f2933] text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="bg-[#0f2933]/90 border border-[#EAB308]/20 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="Profile" 
                className="w-16 h-16 rounded-full border-2 border-[#EAB308] object-cover shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#EAB308]/20 border-2 border-[#EAB308] flex items-center justify-center text-[#EAB308] text-2xl font-bold">
                {currentUser?.displayName ? currentUser.displayName[0] : 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Hello, {currentUser?.displayName || 'Diner'}!
                </h1>
                <Sparkles className="w-5 h-5 text-[#EAB308]" />
              </div>
              <p className="text-gray-400 text-sm">{currentUser?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <Link
              to="/customer/profile"
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span>Manage Profile</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <button
              onClick={async () => {
                await signOutCustomer();
                navigate('/');
              }}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Delivery Phone Number Banner */}
        <div className="bg-[#133742]/90 border border-[#EAB308]/30 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#EAB308]/10 text-[#EAB308] shrink-0 mt-0.5 sm:mt-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-semibold text-white">
                    Delivery & Contact Mobile Number
                  </h3>
                  {customerProfile?.phone ? (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-medium animate-pulse">
                      Action Needed
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-300 mt-0.5">
                  {customerProfile?.phone 
                    ? `Current: +91 ${customerProfile.phone} • Used for delivery calls & auto-fills at checkout`
                    : "Add your mobile number so our delivery riders can reach you seamlessly."}
                </p>
              </div>
            </div>

            {/* Edit / Input */}
            <div className="w-full sm:w-auto">
              {isEditingPhone ? (
                <form onSubmit={handleSavePhone} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">+91</span>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength="10"
                      className="w-full sm:w-48 pl-10 pr-3 py-1.5 bg-[#0a1e25] border border-[#EAB308]/40 rounded-lg text-sm text-white focus:outline-none focus:border-[#EAB308]"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={phoneSaving}
                      className="px-3 py-1.5 bg-[#EAB308] hover:bg-[#CA8A04] text-black font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {phoneSaving ? <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPhone(false);
                        setPhoneInput(customerProfile?.phone || '');
                        setPhoneError('');
                      }}
                      className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsEditingPhone(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#EAB308]/10 hover:bg-[#EAB308]/20 border border-[#EAB308]/40 text-[#EAB308] text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{customerProfile?.phone ? 'Update Number' : '+ Add Mobile Number'}</span>
                </button>
              )}
            </div>
          </div>

          {phoneError && (
            <p className="mt-2 text-xs text-red-300 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{phoneError}</span>
            </p>
          )}

          {phoneSuccess && (
            <p className="mt-2 text-xs text-emerald-300 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Phone number saved successfully!</span>
            </p>
          )}
        </div>

        {/* Live Active Order Alert Card (If any) */}
        {activeOrders.length > 0 && (
          <div className="bg-gradient-to-r from-[#184956] to-[#0c242c] border-2 border-[#EAB308] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#EAB308]/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#EAB308]/20 border border-[#EAB308] flex items-center justify-center text-[#EAB308] animate-bounce">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">Active Order in Progress</h2>
                    {getStatusBadge(activeOrders[0].status)}
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Order ID: <span className="font-mono text-[#EAB308]">{activeOrders[0].order_id}</span>
                  </p>
                </div>
              </div>

              <Link
                to={`/track?order_id=${activeOrders[0].order_id}`}
                className="px-5 py-2.5 bg-[#EAB308] hover:bg-[#CA8A04] text-black font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 self-stretch sm:self-auto justify-center"
              >
                <span>Track Live Order</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Items summary */}
            <div className="bg-black/30 rounded-xl p-3 text-xs text-gray-300 flex flex-wrap items-center justify-between gap-2 border border-white/5">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-[#EAB308]" />
                <span>
                  {activeOrders[0].items?.map(i => `${i.quantity}x ${i.name}`).slice(0, 3).join(', ')}
                  {activeOrders[0].items?.length > 3 ? ` + ${activeOrders[0].items.length - 3} more` : ''}
                </span>
              </div>
              <div className="font-semibold text-white">
                Total: ₹{activeOrders[0].total?.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Pending / Confirmed Reservation Alert (If any) */}
        {activeReservations.length > 0 && (
          <div className="bg-[#123844]/80 border border-emerald-500/30 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-semibold text-white">Upcoming Table Reservation</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    activeReservations[0].status === 'confirmed'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                  }`}>
                    {activeReservations[0].status === 'confirmed' ? '✅ Confirmed' : '🟡 Awaiting Confirmation'}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5">
                  Date: <strong>{activeReservations[0].date}</strong> at <strong>{activeReservations[0].time}</strong> • {activeReservations[0].guests} Guests
                </p>
              </div>
            </div>

            <Link
              to="/customer/reservations"
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
            >
              <span>View Reservations</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Quick Action Navigation Grid (Swiggy / Zomato style) */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>Quick Actions</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/order"
              className="bg-[#0f2933]/90 hover:bg-[#153a47] border border-[#EAB308]/20 hover:border-[#EAB308]/60 rounded-2xl p-5 transition-all group shadow-md"
            >
              <div className="w-12 h-12 rounded-xl bg-[#EAB308]/10 text-[#EAB308] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#EAB308] transition-colors">
                Order Online
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Delicious Biryanis & Kebabs
              </p>
            </Link>

            <Link
              to="/reservation"
              className="bg-[#0f2933]/90 hover:bg-[#153a47] border border-[#EAB308]/20 hover:border-[#EAB308]/60 rounded-2xl p-5 transition-all group shadow-md"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#EAB308] transition-colors">
                Reserve Table
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Royal dining experience
              </p>
            </Link>

            <Link
              to="/customer/orders"
              className="bg-[#0f2933]/90 hover:bg-[#153a47] border border-[#EAB308]/20 hover:border-[#EAB308]/60 rounded-2xl p-5 transition-all group shadow-md"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#EAB308] transition-colors">
                My Orders
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {orders.length} past orders placed
              </p>
            </Link>

            <Link
              to="/customer/reservations"
              className="bg-[#0f2933]/90 hover:bg-[#153a47] border border-[#EAB308]/20 hover:border-[#EAB308]/60 rounded-2xl p-5 transition-all group shadow-md"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#EAB308] transition-colors">
                My Bookings
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {reservations.length} reservations
              </p>
            </Link>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="bg-[#0f2933]/90 border border-[#EAB308]/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#EAB308]" />
              <span>Recent Orders</span>
            </h2>
            {orders.length > 0 && (
              <Link 
                to="/customer/orders" 
                className="text-xs text-[#EAB308] hover:underline flex items-center gap-1 font-medium"
              >
                <span>View All ({orders.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {loadingOrders ? (
            <div className="py-8 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
              <span>Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center text-gray-400 space-y-3">
              <p className="text-sm">You haven't placed any orders yet.</p>
              <Link
                to="/order"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EAB308] hover:bg-[#CA8A04] text-black font-bold text-xs rounded-xl transition-all"
              >
                <span>Browse Menu & Order Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => (
                <div 
                  key={order.order_id || order._id}
                  className="bg-[#123844]/60 border border-white/5 hover:border-[#EAB308]/30 rounded-xl p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-[#EAB308]">
                        #{order.order_id}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-gray-300">
                      {order.items?.map(i => `${i.quantity}x ${i.name}`).slice(0, 2).join(', ')}
                      {order.items?.length > 2 ? ` + ${order.items.length - 2} more` : ''}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-base font-bold text-white">
                      ₹{order.total?.toFixed(2)}
                    </span>
                    <Link
                      to={`/track?order_id=${order.order_id}`}
                      className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-lg text-white transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Track</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CustomerDashboard;
