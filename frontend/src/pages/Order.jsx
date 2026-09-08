import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Plus, Minus, Trash2, ShoppingCart, MapPin, Loader2, CreditCard, Wallet, Lock, Crown, Sparkles } from "lucide-react";
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

const Order = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, customerProfile, idToken } = useCustomerAuth();

  const [menu, setMenu] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Persian Darbar location (Camp, Pune)
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

  // ─── Auth Guard ──────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#184956] to-[#0b131b] flex items-center justify-center px-4 py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#EAB308]/5 blur-[130px] rounded-full pointer-events-none" />
        <div className="max-w-md w-full text-center relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-[#EAB308]/10 border border-[#EAB308]/30 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-9 h-9 text-[#EAB308]" />
          </div>
          <div className="inline-flex items-center gap-2 bg-[#EAB308]/10 border border-[#EAB308]/20 rounded-full px-4 py-1.5 mb-6">
            <Crown className="w-3.5 h-3.5 text-[#EAB308]" />
            <span className="text-[#EAB308] text-[10px] font-black uppercase tracking-[0.4em]">Members Only</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            Order <span className="text-[#EAB308]">Online</span>
          </h1>
          <p className="text-gray-400 text-sm font-light leading-relaxed mb-10 max-w-sm mx-auto">
            Sign in to place your order — track it live from kitchen to your doorstep. It's free and takes 5 seconds.
          </p>
          <div className="space-y-3">
            <Link to="/customer/login" state={{ from: location }} className="block">
              <button className="w-full group relative overflow-hidden bg-[#EAB308] hover:bg-[#CA8A04] text-black font-black py-4 px-8 rounded-2xl text-sm uppercase tracking-[0.25em] transition-all shadow-2xl shadow-[#EAB308]/20 hover:shadow-[#EAB308]/40 hover:scale-[1.02] flex items-center justify-center gap-3">
                <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <Sparkles className="w-4 h-4" />
                Sign In to Order
              </button>
            </Link>
            <Link to="/" className="block">
              <button className="w-full bg-transparent border border-white/10 hover:border-white/20 text-gray-400 hover:text-white font-semibold py-3.5 px-8 rounded-2xl text-xs uppercase tracking-widest transition-all">
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  // ─────────────────────────────────────────────────────────────────────

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
        const distNum = parseFloat(dist);
        setDistance(distNum);
        setLoadingLocation(false);
        
        // Show delivery tier in toast
        let feeMsg = "Free delivery!";
        if (distNum > 20)  feeMsg = "Out of delivery range (>20km).";
        else if (distNum > 10) feeMsg = "₹60 delivery fee (10-20km).";
        toast({ title: `📍 ${dist} km away`, description: feeMsg });
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
    toast({ title: "Added to cart", description: `${item.name} added.` });
  };

  const updateQuantity = (id, change) => {
    setCart(cart.map((item) => item._id === id ? { ...item, quantity: Math.max(0, item.quantity + change) } : item).filter(i => i.quantity > 0));
  };

  const removeFromCart = (id) => setCart(cart.filter((item) => item._id !== id));
  const calculateSubtotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return toast({ title: "Cart is empty", variant: "destructive" });

    const subtotal = calculateSubtotal();
    if (subtotal < 250) return toast({ title: "Minimum order value: ₹250", variant: "destructive" });

    setIsPlacingOrder(true);
    // If location not detected and user hasn't skipped, block order
    if (distance === null) {
      toast({ title: "Location Required", description: "Please detect your location or choose standard delivery before placing order.", variant: "destructive" });
      setIsPlacingOrder(false);
      return;
    }
    // ── 3-tier delivery rule ──
    if (distance !== null && distance > 20) {
      toast({ title: "Out of delivery range", description: "We only deliver within 20km. Try takeaway or dine-in.", variant: "destructive" });
      setIsPlacingOrder(false);
      return;
    }

    const deliveryFee = distance === null ? 60 : distance <= 10 ? 0 : 60;
    const taxRate = 0.05;
    const taxes = subtotal * taxRate;
    const total = subtotal + deliveryFee + taxes;

    const orderData = {
      customer_uid: currentUser?.uid || null,
      email: currentUser?.email || null,
      customer_name: customerInfo.name,
      phone: customerInfo.phone,
      address: customerInfo.address,
      distance_km: distance || 0,
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
      const headers = { "Content-Type": "application/json" };
      if (idToken) {
        headers["Authorization"] = `Bearer ${idToken}`;
      }

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error("Invalid order");
      const data = await res.json();

      if (data.order_id) {
        localStorage.setItem("lastOrderId", data.order_id);
      }

      toast({ 
        title: "Order Placed! 🎉", 
        description: `Your order is being prepared. ID: ${data.order_id?.slice(-8)}` 
      });

      setCart([]);
      setDistance(null);

      // Smooth redirect to live tracking
      setTimeout(() => {
        if (data.order_id) {
          navigate(`/track?order_id=${data.order_id}`);
        }
      }, 1200);
    } catch (err) {
      toast({ title: "Order failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#184956] to-[#0f2933] pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-[#EAB308] mb-4" style={{ fontFamily: "Playfair Display, serif" }}>
            Order Online
          </h1>
          <p className="text-lg text-gray-300">
            Enjoy authentic Persian & Mughlai cuisine delivered to your door
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Selection */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-3 mb-8 justify-center lg:justify-start">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 text-sm font-bold rounded-full transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-[#EAB308] text-black shadow-lg"
                      : "bg-transparent border-2 border-[#EAB308] text-[#EAB308] hover:bg-[#EAB308] hover:text-black"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <div key={item._id} className="bg-[#1a4855] rounded-xl overflow-hidden border-2 border-[#EAB308]/20 hover:border-[#EAB308] transition-all duration-300 card-hover">
                  <div className="relative h-40 overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = "/no-image.png"; }}
                    />
                    <div className="absolute top-3 right-3 bg-[#EAB308] text-black px-3 py-1 rounded-full text-sm font-bold">
                      ₹{item.price}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold mb-1">{item.name}</h3>
                    <p className="text-gray-400 text-xs mb-3 line-clamp-2">{item.description}</p>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-full bg-[#EAB308] hover:bg-[#CA8A04] text-black py-2 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="lg:sticky lg:top-28">
            <div className="bg-[#1a4855] rounded-xl border-2 border-[#EAB308]/30 overflow-hidden">
              <div className="bg-[#EAB308] p-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="h-5 w-5 text-black" />
                  <h2 className="text-black font-bold text-lg">Your Cart</h2>
                </div>
                <span className="bg-black text-[#EAB308] px-3 py-1 rounded-full text-xs font-bold">
                  {cart.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              </div>

              <div className="p-4 space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Your cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-[30vh] overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item._id} className="flex items-center justify-between bg-[#0f2933] rounded-lg p-3">
                          <div className="flex-1">
                            <h4 className="text-white font-bold text-sm">{item.name}</h4>
                            <p className="text-[#EAB308] text-xs">₹{item.price * item.quantity}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => updateQuantity(item._id, -1)} className="w-7 h-7 rounded-full bg-[#1a4855] text-white flex items-center justify-center hover:bg-[#EAB308] hover:text-black transition-colors">
                              <Minus size={14} />
                            </button>
                            <span className="text-white font-bold text-sm w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item._id, 1)} className="w-7 h-7 rounded-full bg-[#1a4855] text-white flex items-center justify-center hover:bg-[#EAB308] hover:text-black transition-colors">
                              <Plus size={14} />
                            </button>
                            <button onClick={() => removeFromCart(item._id)} className="text-red-400 hover:text-red-300 ml-2">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#EAB308]/20 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Subtotal</span>
                        <span className="text-white font-bold">₹{calculateSubtotal()}</span>
                      </div>
                      {distance !== null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Delivery</span>
                          {distance > 20 ? (
                            <span className="text-red-400 font-bold text-xs">OUT OF RANGE</span>
                          ) : distance > 10 ? (
                            <span className="text-orange-400 font-bold">₹60</span>
                          ) : (
                            <span className="text-green-400 font-bold">FREE</span>
                          )}
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t border-[#EAB308]/20 pt-2">
                        <span className="text-white">Total</span>
                        <span className="text-[#EAB308]">₹{calculateSubtotal() + (distance !== null && distance > 10 && distance <= 20 ? 60 : 0)}</span>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                      <input required value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        placeholder="Your Name"
                        className="w-full bg-[#0f2933] text-white px-4 py-3 rounded-lg border border-[#EAB308]/30 focus:border-[#EAB308] outline-none placeholder-gray-400 text-sm"
                      />
                      <input required value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        placeholder="Phone Number"
                        className="w-full bg-[#0f2933] text-white px-4 py-3 rounded-lg border border-[#EAB308]/30 focus:border-[#EAB308] outline-none placeholder-gray-400 text-sm"
                      />
                      <textarea required value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                        placeholder="Delivery Address"
                        className="w-full bg-[#0f2933] text-white px-4 py-3 rounded-lg border border-[#EAB308]/30 focus:border-[#EAB308] outline-none placeholder-gray-400 text-sm resize-none"
                        rows={2}
                      />

                      {/* Location Detection */}
                      <div className="bg-[#0f2933] rounded-lg p-3 text-center">
                        {!distance ? (
                          <div className="space-y-2">
                            <button type="button" onClick={getUserLocation}
                              className="flex items-center justify-center space-x-2 w-full text-[#EAB308] hover:text-white transition-colors text-sm font-bold"
                            >
                              {loadingLocation ? <Loader2 className="animate-spin" size={16} /> : <MapPin size={16} />}
                              <span>{loadingLocation ? 'Detecting...' : 'Detect My Location'}</span>
                            </button>
                            {/* Delivery range hint */}
                            <div className="text-xs text-gray-600 space-y-0.5">
                              <p>0–10 km — <span className="text-green-500">Free delivery</span></p>
                              <p>10–20 km — <span className="text-orange-400">₹60 flat fee</span></p>
                              <p>&gt;20 km — <span className="text-red-500">Not accepted</span></p>
                            </div>
                          </div>
                        ) : distance > 20 ? (
                          <p className="text-red-400 text-sm font-bold">
                            ❌ {distance} km — Out of delivery range (max 20 km)
                          </p>
                        ) : (
                          <p className="text-green-400 text-sm font-bold">
                            ✓ {distance} km away · {distance <= 10 ? 'Free Delivery!' : '₹60 Delivery Fee'}
                          </p>
                        )}
                      </div>

                      {/* Leaflet Map — shows once GPS is detected */}
                      {userLocation && (
                        <div className="rounded-xl overflow-hidden border border-[#EAB308]/20" style={{ height: 200 }}>
                          <MapContainer
                            center={[userLocation.lat, userLocation.lng]}
                            zoom={12}
                            style={{ height: "100%", width: "100%" }}
                            zoomControl={false}
                          >
                            <TileLayer
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            {/* Restaurant marker */}
                            <Marker
                              position={[RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng]}
                              icon={restaurantIcon}
                            >
                              <Popup>🍽️ Persian Darbar (Restaurant)</Popup>
                            </Marker>
                            {/* User marker */}
                            <Marker
                              position={[userLocation.lat, userLocation.lng]}
                              icon={userIcon}
                            >
                              <Popup>📍 Your Location ({distance} km away)</Popup>
                            </Marker>
                            {/* Line between */}
                            <Polyline
                              positions={[
                                [RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng],
                                [userLocation.lat, userLocation.lng]
                              ]}
                              color={distance > 20 ? "#ef4444" : distance > 10 ? "#f97316" : "#22c55e"}
                              weight={2}
                              dashArray="6 4"
                            />
                            <MapFitBounds positions={[
                              [RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng],
                              [userLocation.lat, userLocation.lng]
                            ]} />
                          </MapContainer>
                        </div>
                      )}

                      {/* Payment Method */}
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button"
                          onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'cod'})}
                          className={`p-3 rounded-lg border text-sm font-bold transition-all flex items-center justify-center space-x-2 ${
                            customerInfo.paymentMethod === 'cod'
                              ? 'bg-[#EAB308] border-[#EAB308] text-black'
                              : 'bg-[#0f2933] border-[#EAB308]/30 text-gray-400'
                          }`}
                        >
                          <Wallet size={16} />
                          <span>Cash</span>
                        </button>
                        <button type="button"
                          onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'online'})}
                          className={`p-3 rounded-lg border text-sm font-bold transition-all flex items-center justify-center space-x-2 ${
                            customerInfo.paymentMethod === 'online'
                              ? 'bg-[#EAB308] border-[#EAB308] text-black'
                              : 'bg-[#0f2933] border-[#EAB308]/30 text-gray-400'
                          }`}
                        >
                          <CreditCard size={16} />
                          <span>Online</span>
                        </button>
                      </div>

                      <button type="submit" disabled={isPlacingOrder}
                        className="w-full bg-[#EAB308] hover:bg-[#CA8A04] text-black py-3 rounded-full font-bold text-base transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {isPlacingOrder ? <Loader2 className="animate-spin" /> : <span>Place Order</span>}
                      </button>
                    </form>

                    <p className="text-center text-gray-500 text-xs">Minimum order value: ₹250</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;
