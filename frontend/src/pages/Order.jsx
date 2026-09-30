import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Plus, Minus, Trash2, ShoppingCart, MapPin, Loader2,
  CreditCard, Wallet, Sparkles, X, Search, ChevronRight, UtensilsCrossed
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import API_BASE from "../lib/config";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const restaurantIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const MapFitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length === 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
};

// ─── Isolated Checkout Form ──────────────────────────────────────────────────
// Dedicated component with its own local state to ensure typing into Name, Phone,
// or Address NEVER triggers re-renders of the parent Order page or drawer animations.
const CheckoutForm = React.memo(({
  initialInfo,
  onPlaceOrder,
  isPlacingOrder,
  isMobile = false,
  onCloseCart,
  distance,
  loadingLocation,
  getUserLocation,
  userLocation,
  RESTAURANT_LOCATION,
  restaurantIcon,
  userIcon
}) => {
  const [formData, setFormData] = useState(initialInfo);

  useEffect(() => {
    setFormData(prev => ({
      name: prev.name || initialInfo?.name || "",
      phone: prev.phone || initialInfo?.phone || "",
      address: prev.address || initialInfo?.address || "",
      paymentMethod: prev.paymentMethod || initialInfo?.paymentMethod || "cod"
    }));
  }, [initialInfo?.name, initialInfo?.phone, initialInfo?.address, initialInfo?.paymentMethod]);

  const onSubmit = (e) => {
    e.preventDefault();
    onPlaceOrder(formData);
    if (isMobile && onCloseCart) {
      onCloseCart();
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2.5 mt-3">
      <input
        id={isMobile ? "mob-customer-name" : "desk-customer-name"}
        name="customer-name"
        key={isMobile ? "mob-name" : "desk-name"}
        required
        value={formData.name}
        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
        placeholder="Your Name"
        autoComplete="name"
        className="w-full bg-[#0f2933] text-white px-4 py-3 rounded-xl border border-[#EAB308]/30 focus:border-[#EAB308] outline-none placeholder-gray-500 transition-colors"
        style={{ fontSize: '16px' }}
      />
      <input
        id={isMobile ? "mob-customer-phone" : "desk-customer-phone"}
        name="customer-phone"
        key={isMobile ? "mob-phone" : "desk-phone"}
        required
        value={formData.phone}
        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
        placeholder="Phone Number"
        type="tel"
        autoComplete="tel"
        className="w-full bg-[#0f2933] text-white px-4 py-3 rounded-xl border border-[#EAB308]/30 focus:border-[#EAB308] outline-none placeholder-gray-500 transition-colors"
        style={{ fontSize: '16px' }}
      />
      <textarea
        id={isMobile ? "mob-customer-address" : "desk-customer-address"}
        name="customer-address"
        key={isMobile ? "mob-address" : "desk-address"}
        required
        value={formData.address}
        onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
        placeholder="Delivery Address"
        rows={2}
        autoComplete="street-address"
        className="w-full bg-[#0f2933] text-white px-4 py-3 rounded-xl border border-[#EAB308]/30 focus:border-[#EAB308] outline-none placeholder-gray-500 resize-none transition-colors"
        style={{ fontSize: '16px' }}
      />

      {/* Location */}
      <div className="bg-[#0f2933] rounded-xl p-3 border border-[#EAB308]/20 text-center">
        {!distance ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={getUserLocation}
              className="flex items-center justify-center gap-2 w-full text-[#EAB308] hover:text-white transition-colors text-sm font-bold py-1"
            >
              {loadingLocation ? <Loader2 className="animate-spin" size={15} /> : <MapPin size={15} />}
              <span>{loadingLocation ? 'Detecting...' : 'Detect My Location'}</span>
            </button>
            <div className="text-[11px] text-gray-600 space-y-0.5">
              <p>0–5 km — <span className="text-green-500">Free delivery</span></p>
              <p>5–20 km — <span className="text-orange-400">₹60 flat fee</span></p>
              <p>&gt;20 km — <span className="text-red-500">Not accepted</span></p>
            </div>
          </div>
        ) : distance > 20
          ? <p className="text-red-400 text-sm font-bold">❌ {distance} km — Out of delivery range</p>
          : <p className="text-green-400 text-sm font-bold">✓ {distance} km · {distance <= 5 ? 'Free Delivery!' : '₹60 Delivery Fee'}</p>}
      </div>

      {/* Leaflet Map */}
      {userLocation && (
        <div className="rounded-xl overflow-hidden border border-[#EAB308]/20" style={{ height: 180 }}>
          <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={12} style={{ height: "100%", width: "100%" }} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
            <Marker position={[RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng]} icon={restaurantIcon}><Popup>🍽️ Persian Darbar (Restaurant)</Popup></Marker>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}><Popup>📍 Your Location ({distance} km away)</Popup></Marker>
            <Polyline positions={[[RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng], [userLocation.lat, userLocation.lng]]}
              color={distance > 20 ? "#ef4444" : distance > 5 ? "#f97316" : "#22c55e"} weight={2} dashArray="6 4" />
            <MapFitBounds positions={[[RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng], [userLocation.lat, userLocation.lng]]} />
          </MapContainer>
        </div>
      )}

      {/* Payment Method */}
      <div className="grid grid-cols-2 gap-2">
        {[['cod', 'Cash', <Wallet size={15} />], ['online', 'Online', <CreditCard size={15} />]].map(([val, label, icon]) => (
          <button
            key={val}
            type="button"
            onClick={() => setFormData(p => ({ ...p, paymentMethod: val }))}
            className={`p-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.paymentMethod === val
              ? 'bg-[#EAB308] border-[#EAB308] text-black'
              : 'bg-[#0f2933] border-[#EAB308]/30 text-gray-400 hover:border-[#EAB308]/60'}`}
          >
            {icon}<span>{label}</span>
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPlacingOrder}
        className="w-full bg-[#EAB308] hover:bg-[#CA8A04] text-black py-3.5 rounded-2xl font-black text-base transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ boxShadow: '0 6px 28px rgba(234,179,8,0.30)' }}
      >
        {isPlacingOrder ? <Loader2 className="animate-spin" size={18} /> : <span>Place Order 🎉</span>}
      </button>
      <p className="text-center text-gray-600 text-xs">Minimum order value: ₹250</p>
    </form>
  );
});

const Order = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, customerProfile, idToken, refreshProfile } = useCustomerAuth();

  const [menu, setMenu] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [applyCoins, setApplyCoins] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const categoryBarRef = useRef(null);

  // Persian Darbar location (Camp, Pune)
  const RESTAURANT_LOCATION = { lat: 18.5204, lng: 73.8567 };

  const [customerInfo, setCustomerInfo] = useState({
    name: "", phone: "", address: "", paymentMethod: "cod",
  });

  // Pre-fill customer details if logged in
  useEffect(() => {
    if (currentUser || customerProfile) {
      setCustomerInfo(prev => ({
        ...prev,
        name: prev.name || customerProfile?.name || currentUser?.displayName || "",
        phone: prev.phone || customerProfile?.phone || localStorage.getItem('customer_phone') || "",
        address: prev.address || customerProfile?.address || localStorage.getItem('customer_address') || ""
      }));
    }
  }, [currentUser, customerProfile]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
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
        const { latitude: userLat, longitude: userLng } = position.coords;
        setUserLocation({ lat: userLat, lng: userLng });
        const dist = calculateDistance(userLat, userLng, RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng);
        const distNum = parseFloat(dist);
        setDistance(distNum);
        setLoadingLocation(false);
        let feeMsg = "Free delivery!";
        if (distNum > 20) feeMsg = "Out of delivery range (>20km).";
        else if (distNum > 5) feeMsg = "₹60 delivery fee (5-20km).";
        toast({ title: `📍 ${dist} km away`, description: feeMsg });
      },
      () => {
        setLoadingLocation(false);
        toast({ title: "Location Error", description: "Could not detect location. Please allow access.", variant: "destructive" });
      }
    );
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/menu`);
        const data = await res.json();
        setMenu(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Menu load failed:", err);
      }
    };
    fetchMenu();
  }, []);

  const categories = ["All", ...new Set(menu.map((i) => i.category))];
  const filteredItems = menu.filter((item) => {
    const matchCat = selectedCategory === "All" || item.category === selectedCategory;
    const matchSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch && item.available;
  });

  const addToCart = (item) => {
    const existing = cart.find((c) => c._id === item._id);
    if (existing) {
      setCart(cart.map((c) => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast({ title: "Added to cart", description: `${item.name} added.` });
  };

  const updateQuantity = (id, change) =>
    setCart(cart.map((item) => item._id === id ? { ...item, quantity: Math.max(0, item.quantity + change) } : item).filter(i => i.quantity > 0));

  const removeFromCart = (id) => setCart(cart.filter((item) => item._id !== id));
  const calculateSubtotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const pdCoins = customerProfile?.pd_coins || customerProfile?.loyalty_points || 0;
  const subtotal = calculateSubtotal();
  const maxRedeemableCoins = (subtotal >= 300 && pdCoins > 0) ? Math.min(pdCoins, Math.floor(subtotal * 0.25)) : 0;
  const coinsApplied = (applyCoins && maxRedeemableCoins > 0) ? maxRedeemableCoins : 0;
  const coinsDiscount = coinsApplied;
  const netSubtotal = Math.max(0, subtotal - coinsDiscount);
  const taxRate = 0.05;
  const taxes = Math.round(subtotal * taxRate);
  const coinsEarnable = Math.floor(netSubtotal * 0.10);

  const handlePlaceOrder = async (submittedInfo) => {
    const finalInfo = submittedInfo || customerInfo;
    if (cart.length === 0) return toast({ title: "Cart is empty", variant: "destructive" });
    const sub = calculateSubtotal();
    if (sub < 250) return toast({ title: "Minimum order value: ₹250", variant: "destructive" });
    setIsPlacingOrder(true);
    if (distance === null) {
      toast({ title: "Location Required", description: "Please detect your location before placing order.", variant: "destructive" });
      setIsPlacingOrder(false);
      return;
    }
    if (distance > 20) {
      toast({ title: "Out of delivery range", description: "We only deliver within 20km.", variant: "destructive" });
      setIsPlacingOrder(false);
      return;
    }
    const deliveryFee = distance <= 5 ? 0 : 60;
    const calculatedTotal = Math.max(0, netSubtotal + deliveryFee + taxes);
    const orderData = {
      customer_uid: currentUser?.uid || null,
      email: currentUser?.email || null,
      customer_name: finalInfo.name,
      phone: finalInfo.phone,
      address: finalInfo.address,
      distance_km: distance || 0,
      payment_method: finalInfo.paymentMethod,
      items: cart.map((i) => ({
        item_id: String(i._id), name: i.name, price: i.price, quantity: i.quantity,
        variant: null, variant_price: 0.0, addons: [], special_instructions: null
      })),
      subtotal: sub, discount: coinsDiscount, coins_to_redeem: coinsApplied,
      coins_discount: coinsDiscount, delivery_fee: deliveryFee, taxes, total: calculatedTotal, coupon_code: null,
    };
    try {
      let activeToken = idToken;
      if (currentUser) { try { activeToken = await currentUser.getIdToken(); } catch (e) {} }
      const headers = { "Content-Type": "application/json" };
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;
      const res = await fetch(`${API_BASE}/api/orders`, { method: "POST", headers, body: JSON.stringify(orderData) });
      if (!res.ok) throw new Error("Invalid order");
      const data = await res.json();
      if (data.order_id) localStorage.setItem("lastOrderId", data.order_id);
      toast({ title: "Order Placed! 🎉", description: `Your order is being prepared. ID: ${data.order_id?.slice(-8)}` });
      setCart([]);
      setApplyCoins(false);
      setDistance(null);
      if (typeof refreshProfile === 'function') await refreshProfile();
      setTimeout(() => { if (data.order_id) navigate(`/track?order_id=${data.order_id}`); }, 1200);
    } catch (err) {
      toast({ title: "Order failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // ─── Reusable cart total display ───────────────────────────────────────────
  const cartTotal = Math.max(0, netSubtotal + (distance !== null && distance > 5 && distance <= 20 ? 60 : 0) + taxes);

  // ─── Cart inner content (shared desktop + mobile drawer) ───────────────────
  // Using a render function instead of a nested component so that React does NOT unmount/remount
  // input/textarea elements when typing phone/address (which causes keyboard to close/reappear on mobile).
  const renderCartContent = (isMobile = false) => (
    <div className="flex flex-col">

      {/* Items list */}
      <div className={`space-y-2 overflow-y-auto ${isMobile ? 'max-h-[28vh]' : 'max-h-[24vh]'}`} style={{ WebkitOverflowScrolling: 'touch' }}>
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-60">
            <UtensilsCrossed size={32} className="text-[#EAB308]" />
            <p className="text-gray-400 text-sm text-center">Your cart is empty<br /><span className="text-xs text-gray-500">Add items to get started</span></p>
          </div>
        ) : cart.map((item) => (
          <div key={item._id} className="flex items-center justify-between bg-[#0f2933] rounded-xl p-2.5 border border-[#EAB308]/10">
            <div className="flex-1 min-w-0 mr-2">
              <h4 className="text-white font-bold text-sm truncate">{item.name}</h4>
              <p className="text-[#EAB308] text-xs font-bold mt-0.5">₹{item.price * item.quantity}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => updateQuantity(item._id, -1)} className="w-6 h-6 rounded-lg bg-[#184956] text-white flex items-center justify-center hover:bg-[#EAB308] hover:text-black transition-colors">
                <Minus size={11} />
              </button>
              <span className="text-white font-black text-sm w-5 text-center">{item.quantity}</span>
              <button onClick={() => updateQuantity(item._id, 1)} className="w-6 h-6 rounded-lg bg-[#184956] text-white flex items-center justify-center hover:bg-[#EAB308] hover:text-black transition-colors">
                <Plus size={11} />
              </button>
              <button onClick={() => removeFromCart(item._id)} className="w-6 h-6 rounded-lg bg-red-900/20 text-red-400 flex items-center justify-center hover:bg-red-900/40 transition-colors ml-1">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (<>

        {/* PD Coins */}
        {currentUser && pdCoins > 0 ? (
          <div className="mt-3 rounded-xl p-3 bg-[#0f2933] border border-[#EAB308]/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/pd_coin.png" alt="coin" className="w-5 h-5 object-contain" />
                <div>
                  <p className="text-xs font-bold text-white leading-none">Redeem PD Coins</p>
                  <p className="text-[10px] text-[#EAB308] font-bold mt-0.5">Balance: {pdCoins} coins (₹{pdCoins})</p>
                </div>
              </div>
              {subtotal >= 300 && (
                <button type="button" onClick={() => setApplyCoins(p => !p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${applyCoins ? 'bg-[#EAB308] text-black scale-105' : 'bg-white/10 text-white/80 hover:bg-white/15'}`}>
                  {applyCoins ? 'Applied ✓' : 'Apply'}
                </button>
              )}
            </div>
            {subtotal < 300
              ? <p className="text-[10px] text-gray-500">Add ₹{300 - subtotal} more to redeem (min ₹300)</p>
              : <p className="text-[10px] text-gray-500">Save up to <span className="text-[#EAB308] font-bold">₹{maxRedeemableCoins}</span> (25% cap)</p>}
            {applyCoins && maxRedeemableCoins > 0 && (
              <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px]">
                <span className="text-emerald-400 font-bold flex items-center gap-1"><Sparkles size={10} /> Saving ₹{coinsDiscount}</span>
                <span className="text-gray-500">+Earn <span className="text-[#EAB308] font-bold">{coinsEarnable}</span> coins</span>
              </div>
            )}
          </div>
        ) : !currentUser ? (
          <div className="mt-3 rounded-xl p-2.5 bg-[#0f2933] border border-[#EAB308]/20 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <img src="/pd_coin.png" alt="coin" className="w-4 h-4 object-contain" />
              <span className="text-white/70 text-[11px]">Earn 10% cashback in PD Coins</span>
            </div>
            <button type="button" onClick={() => navigate('/customer/auth')} className="text-[10px] font-bold text-[#EAB308] hover:underline">Sign In</button>
          </div>
        ) : null}

        {/* Price summary */}
        <div className="mt-3 bg-[#0f2933] rounded-xl p-3 space-y-1.5 border border-[#EAB308]/10">
          <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal</span><span className="text-white font-bold">₹{subtotal}</span></div>
          {coinsApplied > 0 && <div className="flex justify-between text-sm text-emerald-400 font-bold"><span>🪙 PD Coins</span><span>-₹{coinsDiscount}</span></div>}
          {distance !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Delivery</span>
              {distance > 20 ? <span className="text-red-400 font-bold text-xs">OUT OF RANGE</span>
                : distance > 5 ? <span className="text-orange-400 font-bold">₹60</span>
                  : <span className="text-green-400 font-bold">FREE</span>}
            </div>
          )}
          <div className="flex justify-between text-sm"><span className="text-gray-400">GST (5%)</span><span className="text-white font-bold">₹{taxes}</span></div>
          <div className="flex justify-between text-base font-black border-t border-[#EAB308]/20 pt-2 mt-1">
            <span className="text-white">Total</span>
            <span className="text-[#EAB308]">₹{cartTotal}</span>
          </div>
        </div>

        {/* Checkout form */}
        <CheckoutForm
          initialInfo={customerInfo}
          onPlaceOrder={handlePlaceOrder}
          isPlacingOrder={isPlacingOrder}
          isMobile={isMobile}
          onCloseCart={() => setIsCartOpen(false)}
          distance={distance}
          loadingLocation={loadingLocation}
          getUserLocation={getUserLocation}
          userLocation={userLocation}
          RESTAURANT_LOCATION={RESTAURANT_LOCATION}
          restaurantIcon={restaurantIcon}
          userIcon={userIcon}
        />
      </>)}
    </div>
  );

  // ─── JSX ───────────────────────────────────────────────────────────────────
  return (
    <>

      {/* ── Page shell ────────────────────────────────────────────────────── */}
      <div className="min-h-screen bg-gradient-to-b from-[#184956] to-[#0f2933] pt-24 pb-28 lg:pb-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8">

          {/* ── Header row ─────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EAB308] flex items-center justify-center text-black font-black text-lg shrink-0">
                {currentUser?.displayName?.[0] || customerProfile?.name?.[0] || 'G'}
              </div>
              <div>
                <p className="text-[#EAB308] text-[11px] font-bold uppercase tracking-widest">Persian Darbar</p>
                <p className="text-white font-black text-sm leading-none">
                  {customerProfile?.name || currentUser?.displayName || 'Guest'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(currentUser ? '/customer/dashboard' : '/customer/login')}
              className="text-xs font-bold border border-[#EAB308]/50 text-[#EAB308] px-4 py-1.5 rounded-full hover:bg-[#EAB308] hover:text-black transition-all duration-200">
              {currentUser ? 'My Profile' : 'Sign In'}
            </button>
          </div>

          {/* ── Tab buttons (ORDER MENU / MY ORDERS) ──────────── */}
          <div className="flex gap-3 mb-5">
            <div className="flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-[#EAB308] text-black shadow-lg" style={{ boxShadow: '0 4px 20px rgba(234,179,8,0.25)' }}>
              <UtensilsCrossed size={16} /> ORDER MENU
            </div>
            <button
              onClick={() => navigate('/track')}
              className="flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-[#1a4855] text-white/70 border border-[#EAB308]/20 hover:border-[#EAB308]/50 hover:text-white transition-all duration-200">
              <ShoppingCart size={16} />
              MY ORDERS
              {cart.length > 0 && (
                <span className="bg-[#EAB308] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ml-1">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          {/* ── Main content: menu list + sticky cart ─────────── */}
          <div className="flex gap-6 items-start">

            {/* ── LEFT / FULL: Menu area ──────────────────────── */}
            <div className="flex-1 min-w-0">

              {/* Search bar */}
              <div className="relative mb-4">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search biryani, kebabs, desserts..."
                  className="w-full bg-[#1a4855] border border-[#EAB308]/20 text-white pl-10 pr-10 py-3 rounded-2xl outline-none focus:border-[#EAB308]/60 placeholder-gray-500 text-sm transition-colors"
                  style={{ fontSize: '16px' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Category pills — horizontally scrollable */}
              <div ref={categoryBarRef} className="pills-scroll flex gap-2 overflow-x-auto pb-2 mb-4">
                {categories.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button key={cat}
                      onClick={() => { setSelectedCategory(cat); setSearchQuery(''); }}
                      className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${active
                        ? 'bg-[#EAB308] text-black shadow-md'
                        : 'bg-[#1a4855] text-gray-300 border border-[#EAB308]/20 hover:border-[#EAB308]/50 hover:text-white'}`}>
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Result label */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <p className="text-white/80 text-sm font-bold">
                  {searchQuery ? `Results for "${searchQuery}"` : selectedCategory === 'All' ? 'All Items' : selectedCategory}
                </p>
                <span className="bg-[#EAB308] text-black text-[11px] font-black px-2 py-0.5 rounded-full">{filteredItems.length}</span>
              </div>

              {/* ── Menu rows ──────────────────────────────────── */}
              <div className="space-y-2">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-60">
                    <UtensilsCrossed size={48} className="text-[#EAB308]" />
                    <p className="text-gray-400 text-center text-sm">
                      {searchQuery ? `No items found for "${searchQuery}"` : 'No items in this category'}
                    </p>
                  </div>
                ) : filteredItems.map((item) => {
                  const cartItem = cart.find(c => c._id === item._id);
                  const qty = cartItem?.quantity || 0;
                  return (
                    <div key={item._id}
                      className="menu-row flex items-center gap-3 p-3 rounded-2xl border border-[#EAB308]/10 bg-[#1a4855]/60">

                      {/* Thumbnail */}
                      <div className="relative shrink-0 w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-xl overflow-hidden bg-[#0f2933]">
                        <img src={item.image} alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = "/no-image.png"; }} />
                        {/* Veg indicator */}
                        <div className={`absolute top-1 left-1 w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${item.is_veg !== false ? 'border-green-500 bg-[#0f2933]' : 'border-red-500 bg-[#0f2933]'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                      </div>

                      {/* Item text */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-black text-sm sm:text-[15px] leading-snug">{item.name}</h3>
                        {item.description && (
                          <p className="text-gray-400 text-[11px] sm:text-xs mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                        )}
                        <p className="text-[#EAB308] font-black text-sm mt-1.5">₹{item.price}</p>
                      </div>

                      {/* ADD / qty stepper */}
                      <div className="shrink-0">
                        {qty === 0 ? (
                          <button onClick={() => addToCart(item)}
                            className="add-btn-pill border-2 border-[#EAB308] text-[#EAB308] font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 bg-transparent">
                            <Plus size={13} /> ADD
                          </button>
                        ) : (
                          <div className="qty-inline flex items-center gap-1 bg-[#EAB308] rounded-xl px-1 py-1">
                            <button onClick={() => updateQuantity(item._id, -1)}
                              className="w-6 h-6 flex items-center justify-center text-black hover:bg-black/15 rounded-lg transition-colors">
                              <Minus size={12} />
                            </button>
                            <span className="text-black font-black text-sm w-5 text-center">{qty}</span>
                            <button onClick={() => updateQuantity(item._id, 1)}
                              className="w-6 h-6 flex items-center justify-center text-black hover:bg-black/15 rounded-lg transition-colors">
                              <Plus size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── RIGHT: Sticky cart panel (desktop only) ──────── */}
            <div className="hidden lg:block w-80 xl:w-[22rem] shrink-0 sticky top-24">
              <div className="bg-[#1a4855] rounded-2xl border border-[#EAB308]/25 overflow-hidden"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

                {/* Cart header */}
                <div className="bg-[#EAB308] flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart size={18} className="text-black" />
                    <h2 className="text-black font-black text-base" style={{ fontFamily: 'Playfair Display, serif' }}>Your Cart</h2>
                  </div>
                  <span className="bg-black text-[#EAB308] text-[11px] font-black px-2.5 py-0.5 rounded-full">
                    {cart.reduce((s, i) => s + i.quantity, 0)} items
                  </span>
                </div>

                <div className="p-4 overflow-y-auto max-h-[80vh]" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {isDesktop && renderCartContent(false)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile floating cart FAB ──────────────────────────────────────── */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
          <button onClick={() => setIsCartOpen(true)}
            className="w-full flex items-center justify-between bg-[#EAB308] text-black rounded-2xl px-5 py-3.5 active:scale-[0.97] transition-transform"
            style={{ boxShadow: '0 8px 32px rgba(234,179,8,0.45)' }}>
            <div className="flex items-center gap-3">
              <span className="bg-black/20 text-black font-black text-sm w-8 h-8 rounded-xl flex items-center justify-center">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
              <span className="font-black text-sm uppercase tracking-widest">View Cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg">₹{calculateSubtotal()}</span>
              <ChevronRight size={18} />
            </div>
          </button>
        </div>
      )}

      {/* ── Mobile cart drawer ────────────────────────────────────────────── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60"
            style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onClick={() => setIsCartOpen(false)} />

          {/* Drawer */}
          <div className="relative bg-[#0b1e28] rounded-t-3xl flex flex-col overflow-hidden border-t border-[#EAB308]/25 cart-drawer-animate"
            style={{
              maxHeight: '92dvh',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              boxShadow: '0 -16px 48px rgba(0,0,0,0.6)',
            }}>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#EAB308]/15 shrink-0">
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="h-5 w-5 text-[#EAB308]" />
                <h2 className="text-white font-black text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>Your Cart</h2>
                <span className="bg-[#EAB308] text-black text-[11px] font-black px-2 py-0.5 rounded-full">
                  {cart.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              </div>
              <button onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300 active:bg-white/20 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
              {!isDesktop && renderCartContent(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Order;
