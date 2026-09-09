import React, { useState, useEffect } from "react";
import { Search, Package, CheckCircle, Clock, Truck, Home, Navigation, ShieldCheck, MapPin, Receipt, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../hooks/use-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API_BASE from "../lib/config";

const OrderTracking = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);

  const statusConfig = {
    placed: { label: "Heralded", icon: Package, color: "text-blue-400", bg: "bg-blue-400/10", message: "Your order has been announced to the royal kitchen." },
    accepted: { label: "Accepted", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10", message: "The master chefs have accepted your commission." },
    preparing: { label: "Curating", icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", message: "Your feast is being crafted with precision and care." },
    ready: { label: "Sealed", icon: ShieldCheck, color: "text-purple-400", bg: "bg-purple-400/10", message: "The preparation is complete. Final sealing in progress." },
    out_for_delivery: { label: "Dispatch", icon: Truck, color: "text-orange-400", bg: "bg-orange-400/10", message: "Our herald is racing across the city with your feast." },
    delivered: { label: "Sovereign Arrival", icon: Home, color: "text-[#EAB308]", bg: "bg-[#EAB308]/10", message: "The feast has arrived at your sanctuary. Enjoy! 🎉" },
    cancelled: { label: "Recalled", icon: Package, color: "text-red-400", bg: "bg-red-400/10", message: "This royal order has been withdrawn." },
    rejected: { label: "Declined", icon: Package, color: "text-red-400", bg: "bg-red-400/10", message: "Unfortunately, the court could not fulfill this order." }
  };

  useEffect(() => {
    // Auto-load order from URL param or localStorage
    const params = new URLSearchParams(location.search);
    const paramId = params.get("order_id");
    const lastOrderId = paramId || localStorage.getItem('lastOrderId');
    if (lastOrderId) {
      setOrderId(lastOrderId);
      fetchOrder(lastOrderId);
    }
  }, []);

  useEffect(() => {
    if (!order || ['delivered', 'cancelled', 'rejected'].includes(order.status)) return;
    const interval = setInterval(() => fetchOrder(order.order_id, true), 10000);
    return () => clearInterval(interval);
  }, [order]);

  const fetchOrder = async (id, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${id}`);
      if (!res.ok) throw new Error("Order not found");
      const data = await res.json();
      if (lastStatus && lastStatus !== data.status && !silent) {
        toast({ title: statusConfig[data.status]?.label, description: statusConfig[data.status]?.message });
      }
      setOrder(data);
      setLastStatus(data.status);
    } catch (err) {
      if (!silent) toast({ title: "Inquiry Failed", description: "This Order ID does not exist in our records.", variant: "destructive" });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getStatusIndex = (status) => ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'].indexOf(status);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#070d14" }}>

      {/* ─── Fixed Header ─── */}
      <div className="shrink-0" style={{ background: "rgba(7,13,20,0.98)", borderBottom: "1px solid rgba(234,179,8,0.1)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-2.5 px-4 py-3">
          <button
            onClick={() => {
              if (window.history.length > 2) navigate(-1);
              else navigate('/customer/dashboard');
            }}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#EAB308] transition-colors shrink-0 cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Link
            to="/"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#EAB308] transition-colors shrink-0"
            title="Return to Persian Darbar Home"
          >
            <Home className="w-4 h-4" />
          </Link>
          <form
            onSubmit={(e) => { e.preventDefault(); fetchOrder(orderId.trim()); }}
            className="flex-1 flex items-center gap-2"
          >
            <div className="flex-1 relative">
              <Navigation className="w-3.5 h-3.5 text-[#EAB308] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter your Order ID..."
                className="w-full bg-[#0a1219] border border-[#EAB308]/20 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#EAB308]/40 uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-2 bg-[#EAB308] text-black rounded-xl hover:bg-[#CA8A04] transition-all font-bold flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {order ? (
            <motion.div
              key="order-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 space-y-4"
            >
              {/* Order Identity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                 {[
                   { label: "Herald Designation", val: order.order_id, icon: Navigation },
                   { label: "Imperial Recipient", val: order.customer_name, icon: Home },
                   { label: "Dispatch Zone", val: order.address, icon: MapPin }
                 ].map((item, i) => (
                   <div key={i} className="bg-[#111c24] border border-[#EAB308]/20 rounded-2xl p-4 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-5">
                         <item.icon size={32} />
                      </div>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">{item.label}</p>
                      <p className="text-white font-bold text-sm truncate italic">{item.val}</p>
                   </div>
                 ))}
              </div>

              {/* Status Timeline */}
              <div className="bg-[#111c24] border border-[#EAB308]/20 rounded-3xl p-5 relative">
                 <div className="flex flex-col space-y-5">
                   {['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'].map((status, index) => {
                     const isPast = getStatusIndex(order.status) > index;
                     const isCurrent = order.status === status;
                     const config = statusConfig[status];
                     const Icon = config.icon;

                     return (
                       <div key={status} className="flex items-start gap-4 relative">
                         {index < 5 && (
                           <div className={`absolute left-4 top-8 w-px h-5 ${isPast ? 'bg-[#EAB308]/50' : 'bg-white/5'} transition-colors duration-700`} />
                         )}
                         
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-700 relative z-10 shrink-0 ${
                           isPast || isCurrent ? 'bg-black border-[#EAB308] text-[#EAB308]' : 'bg-[#0a1219] border-white/10 text-gray-700'
                         }`}>
                           {isCurrent ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}><Icon size={14} /></motion.div> : <Icon size={14} />}
                         </div>

                         <div className="pt-0.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                               <h4 className={`text-[9px] font-black uppercase tracking-[0.3em] ${isCurrent || isPast ? 'text-white' : 'text-gray-700'}`}>
                                 {config.label}
                               </h4>
                               {isCurrent && <span className="bg-[#EAB308]/10 text-[#EAB308] px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">Now</span>}
                            </div>
                            <p className={`text-xs leading-relaxed ${isCurrent ? 'text-gray-400' : 'text-gray-700'}`}>
                               {isCurrent ? config.message : "Awaiting..."}
                            </p>
                         </div>
                       </div>
                     );
                   })}
                 </div>
              </div>

              {/* Summary */}
              <div className="bg-[#111c24] border border-[#EAB308]/20 rounded-2xl p-4 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EAB308]/10 flex items-center justify-center text-[#EAB308] border border-[#EAB308]/20">
                       <Receipt size={18} />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total</p>
                       <p className="text-xl font-black text-white">₹{order.total?.toFixed(2)}</p>
                    </div>
                 </div>
                 <Link to="/order">
                   <button className="px-4 py-2 bg-[#111c24] border border-[#EAB308]/20 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-2">
                      <ArrowLeft size={13} />
                      <span>Order More</span>
                   </button>
                 </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4 min-h-[60vh]"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-[#EAB308]/5 blur-[60px] rounded-full" />
                <Package className="w-16 h-16 text-white/10 mx-auto relative z-10" />
              </div>
              <div>
                 <h3 className="text-base font-bold text-gray-500">No Order Found</h3>
                 <p className="text-gray-700 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Enter your Order ID above to track</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderTracking;
