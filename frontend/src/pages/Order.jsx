import React, { useState, useEffect, useRef } from "react";
import { Plus, Minus, Trash2, ShoppingCart, MapPin, ArrowRight, CheckCircle2, Info, Loader2, Sparkles, Navigation, CreditCard, Wallet, PackageOpen, User, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../hooks/use-toast";

const Order = () => {
  const { toast } = useToast();

  const [menu, setMenu] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Taste of Hindustan location (Camp, Pune)
  const RESTAURANT_LOCATION = {
    lat: 18.5204,
    lng: 73.8567
  };

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    paymentMethod: "cod",
  });

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const dist = R * c;
    return dist.toFixed(1);
  };

  const getUserLocation = () => {
    setLoadingLocation(true);
    if (!navigator.geolocation) {
      toast({ title: "Location Error", description: "Browser doesn't support geolocation.", variant: "destructive" });
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });
        const dist = calculateDistance(userLat, userLng, RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng);
        setDistance(parseFloat(dist));
        setLoadingLocation(false);
        toast({ title: "Location Detected", description: `You are ${dist} km away. Delivery charges calculated.` });
      },
      (error) => {
        setLoadingLocation(false);
        toast({ title: "Location Error", description: "Could not detect location. Please allow access.", variant: "destructive" });
      }
    );
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${(process.env.REACT_APP_BACKEND_URL || "")}/api/menu`);
        const data = await res.json();
        setMenu(data);
      } catch (err) {
        console.error("Menu load failed:", err);
      }
    };
    fetchMenu();
  }, []);

  const categories = ["All", ...new Set(menu.map((i) => i.category))];
  const filteredItems = menu.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesCategory && item.available;
  });

  const addToCart = (item) => {
    const existing = cart.find((c) => c._id === item._id);
    if (existing) {
      setCart(cart.map((c) => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast({ title: "Royal Plate Updated", description: `${item.name} added to your selection.` });
  };

  const updateQuantity = (id, change) => {
    setCart(cart.map((item) => item._id === id ? { ...item, quantity: Math.max(0, item.quantity + change) } : item).filter(i => i.quantity > 0));
  };

  const removeFromCart = (id) => setCart(cart.filter((item) => item._id !== id));
  const calculateSubtotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return toast({ title: "Your plate is empty", variant: "destructive" });
    if (distance === null) return toast({ title: "Location required", description: "We need your location to calculate royal delivery fees.", variant: "destructive" });

    const subtotal = calculateSubtotal();
    if (subtotal < 250) return toast({ title: "Minimum order value: ₹250", variant: "destructive" });

    setIsPlacingOrder(true);
    const deliveryFee = distance <= 10 ? 0 : 40;
    const taxRate = 0.05;
    const taxes = subtotal * taxRate;
    const total = subtotal + deliveryFee + taxes;

    const orderData = {
      customer_name: customerInfo.name,
      phone: customerInfo.phone,
      address: customerInfo.address,
      distance_km: distance,
      payment_method: customerInfo.paymentMethod,
      items: cart.map((i) => ({
        item_id: String(i._id),
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        variant: null,
        variant_price: 0.0,
        addons: [],
        special_instructions: null
      })),
      subtotal,
      discount: 0.0,
      delivery_fee: deliveryFee,
      taxes,
      total,
      coupon_code: null,
    };

    try {
      const res = await fetch(`${(process.env.REACT_APP_BACKEND_URL || "")}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error("Invalid order");
      const data = await res.json();

      toast({ 
        title: "Order Dispatched! 🎉", 
        description: `Your feast is being prepared. ID: ${data.order_id?.slice(-8)}` 
      });

      setCart([]);
      setCustomerInfo({ name: "", phone: "", address: "", paymentMethod: "cod" });
      setDistance(null);
    } catch (err) {
      toast({ title: "Order failed", description: "Our heralds encountered an issue. Please try again.", variant: "destructive" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050b10] pt-28 md:pt-40 pb-16 md:pb-32 relative selection:bg-primary/30">
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 right-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <header className="text-center mb-12 md:mb-24 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-3 glass-premium rounded-full px-6 py-2 mb-8 border-white/5"
          >
            <Navigation className="text-primary w-4 h-4" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">Express Royal Service</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-8xl font-display font-black text-white mb-4 md:mb-8"
          >
            Express <span className="golden-text">Gourmet</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 font-light text-sm md:text-xl max-w-2xl mx-auto leading-relaxed italic"
          >
            "The finest Hindustani flavors, swift as a desert wind, delivered to your sanctuary."
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
          {/* MENU SELECTION */}
          <div className="lg:col-span-8 space-y-12">
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 md:px-8 py-2.5 md:py-3.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-500 border relative overflow-hidden group ${
                    selectedCategory === category
                      ? "bg-primary border-primary text-black"
                      : "bg-white/[0.02] border-white/5 text-gray-500 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, idx) => (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="brutal-card rounded-2xl md:rounded-[2.5rem] p-3 md:p-4 group"
                  >
                    <div className="relative aspect-[4/3] md:aspect-video overflow-hidden rounded-xl md:rounded-[2rem] mb-4 md:mb-6">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1541544741938-0af808b77e40?w=800"; }}
                      />
                      <div className="absolute top-4 right-4 glass-premium px-4 py-1.5 rounded-full text-white font-black italic shadow-2xl">
                        ₹{item.price}
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <h3 className="text-lg md:text-2xl font-display font-bold text-white mb-1 md:mb-2 group-hover:text-primary transition-colors">{item.name}</h3>
                      <p className="text-gray-500 text-xs font-light line-clamp-2 mb-6 italic">{item.description}</p>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full magnetic-button bg-white/[0.03] border border-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center space-x-3 hover:bg-white hover:text-black transition-all"
                      >
                        <Plus size={16} />
                        <span>Add To Feast</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* CHECKOUT CART */}
          <div className="lg:col-span-4 lg:sticky lg:top-44">
            <div className="glass-premium rounded-2xl md:rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
              <div className="bg-primary p-8 flex justify-between items-center text-black">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-primary">
                     <ShoppingCart size={18} strokeWidth={3} />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-[0.2em]">Royal Selection</h2>
                </div>
                <div className="bg-black text-primary px-4 py-1 rounded-full text-[10px] font-black">
                   {cart.reduce((s, i) => s + i.quantity, 0)} ITEMS
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Cart Items */}
                <div className="space-y-6 max-h-[30vh] overflow-y-auto pr-4 custom-scrollbar">
                  <AnimatePresence>
                    {cart.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                        <PackageOpen className="mx-auto text-white/5 mb-4" size={48} />
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-relaxed">Your feast hasn't <br /> started yet</p>
                      </motion.div>
                    ) : (
                      cart.map((item) => (
                        <motion.div
                          key={item._id}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center justify-between group"
                        >
                          <div className="flex-1">
                            <h4 className="text-white font-bold text-sm tracking-tight">{item.name}</h4>
                            <p className="text-primary text-[10px] font-black">₹{item.price * item.quantity}</p>
                          </div>
                          <div className="flex items-center space-x-4 glass-premium rounded-full p-1 border-white/5">
                            <button onClick={() => updateQuantity(item._id, -1)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-primary transition-colors">
                              <Minus size={14} />
                            </button>
                            <span className="text-white font-black text-[10px] w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item._id, 1)} className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all">
                              <Plus size={14} />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>

                {/* Subtotal & Details */}
                {cart.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-8 border-t border-white/5 space-y-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-bold tracking-widest">
                          <span className="text-gray-500 uppercase">Aura Subtotal</span>
                          <span className="text-white">₹{calculateSubtotal()}</span>
                        </div>
                        {distance && (
                           <div className="flex justify-between items-center text-[10px] font-bold tracking-widest">
                            <span className="text-gray-500 uppercase">Palace Dispatch</span>
                            <span className="text-green-500">{distance <= 10 ? 'COMPLIMENTARY' : '₹40'}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Total Feast</span>
                          <span className="text-2xl font-display font-black text-primary italic">₹{calculateSubtotal() + (distance > 10 ? 40 : 0)}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-3">
                         <div className="relative">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                            <input 
                               required 
                               value={customerInfo.name}
                               onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                               placeholder="NAME ON ACCOUNT"
                               className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black tracking-widest text-white outline-none focus:border-primary/30 transition-all uppercase"
                            />
                         </div>
                         <div className="relative">
                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                            <input 
                               required 
                               value={customerInfo.phone}
                               onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                               placeholder="CONTACT NUMBER"
                               className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black tracking-widest text-white outline-none focus:border-primary/30 transition-all"
                            />
                         </div>
                         <textarea 
                            required 
                            value={customerInfo.address}
                            onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                            placeholder="DELIVERY SANCTUARY (ADDRESS)"
                            className="w-full bg-white/[0.02] border border-white/5 rounded-[2rem] py-5 px-8 text-[10px] font-black tracking-widest text-white outline-none focus:border-primary/30 transition-all resize-none"
                            rows={2}
                         />
                      </div>

                      <div className="p-6 glass-premium rounded-3xl border-white/5 text-center">
                         {!distance ? (
                            <button type="button" onClick={getUserLocation} className="flex items-center justify-center space-x-3 w-full text-primary hover:text-white transition-all group">
                               {loadingLocation ? <Loader2 className="animate-spin" /> : <MapPin size={16} className="group-hover:scale-125 transition-transform" />}
                               <span className="text-[10px] font-black uppercase tracking-[0.3em]">{loadingLocation ? 'Locating...' : 'Detect Dispatch Zone'}</span>
                            </button>
                         ) : (
                            <div className="flex items-center justify-center space-x-3 text-green-500">
                               <CheckCircle2 size={16} />
                               <span className="text-[10px] font-black uppercase tracking-[0.3em]">{distance} KM DETECTED</span>
                            </div>
                         )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <button 
                            type="button"
                            onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'cod'})}
                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center space-y-2 ${customerInfo.paymentMethod === 'cod' ? 'bg-primary border-primary text-black' : 'glass-premium border-white/5 text-gray-500'}`}
                         >
                            <Wallet size={16} />
                            <span className="text-[8px] font-black uppercase tracking-widest">CASH</span>
                         </button>
                         <button 
                            type="button"
                            onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'online'})}
                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center space-y-2 ${customerInfo.paymentMethod === 'online' ? 'bg-primary border-primary text-black' : 'glass-premium border-white/5 text-gray-500'}`}
                         >
                            <CreditCard size={16} />
                            <span className="text-[8px] font-black uppercase tracking-widest">ONLINE</span>
                         </button>
                      </div>

                      <button
                        type="submit"
                        disabled={!distance || isPlacingOrder}
                        className="w-full magnetic-button bg-primary text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[12px] shadow-2xl shadow-primary/20 disabled:opacity-20 transition-all flex items-center justify-center space-x-4"
                      >
                        {isPlacingOrder ? <Loader2 className="animate-spin" /> : (
                          <>
                            <span>Dispatch Feast</span>
                            <ArrowRight size={20} />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </div>
            </div>
            
            <div className="mt-8 flex items-center justify-center space-x-4 text-gray-600">
               <div className="w-8 h-[1px] bg-white/5" />
               <p className="text-[9px] font-black uppercase tracking-[0.5em]">Min Value ₹250</p>
               <div className="w-8 h-[1px] bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;
