import React, { useState, useEffect } from "react";
import { Search, Package, CheckCircle, Clock, Truck, Home, Sparkles, Navigation, ShieldCheck, MapPin, Receipt, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../hooks/use-toast";
import { Link } from "react-router-dom";

const OrderTracking = () => {
  const { toast } = useToast();
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
    delivered: { label: "Sovereign Arrival", icon: Home, color: "text-primary", bg: "bg-primary/10", message: "The feast has arrived at your sanctuary. Enjoy! 🎉" },
    cancelled: { label: "Recalled", icon: Package, color: "text-red-400", bg: "bg-red-400/10", message: "This royal order has been withdrawn." },
    rejected: { label: "Declined", icon: Package, color: "text-red-400", bg: "bg-red-400/10", message: "Unfortunately, the court could not fulfill this order." }
  };

  useEffect(() => {
    const lastOrderId = localStorage.getItem('lastOrderId');
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
      const res = await fetch(`${(process.env.REACT_APP_BACKEND_URL || "")}/api/orders/${id}`);
      if (!res.ok) throw new Error("Order not found");
      const data = await res.json();
      if (lastStatus && lastStatus !== data.status && !silent) {
        toast({ title: statusConfig[data.status].label, description: statusConfig[data.status].message });
      }
      setOrder(data);
      setLastStatus(data.status);
    } catch (err) {
      if (!silent) toast({ title: "Inquiry Failed", description: "This Order ID does not exist in our court records.", variant: "destructive" });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getStatusIndex = (status) => ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'].indexOf(status);

  return (
    <div className="min-h-screen bg-[#050b10] pt-40 pb-32 relative selection:bg-primary/30">
      {/* Cinematic Background */}
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <header className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-3 glass-premium rounded-full px-6 py-2 mb-8 border-white/5"
          >
            <Navigation className="text-primary w-4 h-4" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">Imperial Dispatch Herald</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-display font-black text-white mb-8"
          >
            Track Your <span className="golden-text">Feast</span>
          </motion.h1>
        </header>

        {/* High-End Search Interface */}
        <div className="relative max-w-2xl mx-auto mb-24">
          <form onSubmit={(e) => { e.preventDefault(); fetchOrder(orderId.trim()); }} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 rounded-[2rem] blur opacity-30 group-hover:opacity-60 transition-all duration-500" />
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="ENTER ROYAL ORDER ID..."
              className="w-full bg-[#0a1219] border border-white/10 rounded-[2rem] px-10 py-6 text-[10px] font-black tracking-[0.4em] text-white placeholder-gray-600 focus:outline-none focus:border-primary/40 relative z-10 uppercase"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary text-black p-4 rounded-2xl hover:scale-110 active:scale-95 transition-all z-20 shadow-xl shadow-primary/20"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          </form>
        </div>

        <AnimatePresence mode="wait">
          {order ? (
            <motion.div
              key="order-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              {/* Order Identity Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { label: "Herald Designation", val: order.order_id, icon: Navigation },
                   { label: "Imperial Recipient", val: order.customer_name, icon: Home },
                   { label: "Dispatch Zone", val: order.address, icon: MapPin }
                 ].map((item, i) => (
                   <div key={i} className="glass-premium rounded-[2.5rem] p-8 border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         <item.icon size={40} />
                      </div>
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-2">{item.label}</p>
                      <p className="text-white font-display font-bold text-lg truncate italic">{item.val}</p>
                   </div>
                 ))}
              </div>

              {/* Liquid Status Timeline */}
              <div className="glass-premium rounded-[4rem] p-12 md:p-20 border border-white/5 relative">
                 <div className="flex flex-col space-y-12">
                   {['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'].map((status, index) => {
                     const isPast = getStatusIndex(order.status) > index;
                     const isCurrent = order.status === status;
                     const config = statusConfig[status];
                     const Icon = config.icon;

                     return (
                       <div key={status} className="flex items-start gap-10 relative group">
                         {/* Visual Line */}
                         {index < 5 && (
                           <div className={`absolute left-7 top-16 bottom-[-3rem] w-px ${isPast ? 'bg-primary/50' : 'bg-white/5'} transition-colors duration-1000`} />
                         )}
                         
                         <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-1000 relative z-10 ${
                           isPast || isCurrent ? 'bg-black border-primary text-primary shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'bg-white/[0.02] border-white/5 text-gray-700'
                         }`}>
                           {isCurrent ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}><Icon size={20} /></motion.div> : <Icon size={20} />}
                         </div>

                         <div className="pt-2 flex-1">
                            <div className="flex items-center space-x-4 mb-2">
                               <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isCurrent || isPast ? 'text-white' : 'text-gray-700'}`}>
                                 {config.label}
                               </h4>
                               {isCurrent && <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">Current Status</span>}
                            </div>
                            <p className={`text-sm font-light leading-relaxed italic ${isCurrent ? 'text-gray-400' : 'text-gray-700'}`}>
                               {isCurrent ? config.message : "Awaiting this dispatch phase..."}
                            </p>
                         </div>
                       </div>
                     );
                   })}
                 </div>
              </div>

              {/* Final Summary Component */}
              <div className="glass-premium rounded-[3rem] p-10 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
                 <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                       <Receipt size={24} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Total Transaction</p>
                       <p className="text-3xl font-display font-black text-white italic">₹{order.total.toFixed(2)}</p>
                    </div>
                 </div>
                 <Link to="/order">
                   <button className="px-10 py-5 glass-premium border-white/5 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center space-x-3">
                      <ArrowLeft size={16} />
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
              className="text-center py-32 space-y-10"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/5 blur-[60px] rounded-full" />
                <Package className="w-24 h-24 text-white/[0.03] mx-auto relative z-10" />
              </div>
              <div className="space-y-4">
                 <h3 className="text-2xl font-display font-bold text-gray-500 italic">No Dispatch Found</h3>
                 <p className="text-gray-700 text-[10px] font-black uppercase tracking-[0.4em]">Awaiting valid entry into the imperial terminal</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderTracking;
