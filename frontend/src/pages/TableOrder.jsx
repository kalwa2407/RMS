import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Plus, Minus, Trash2, ShoppingCart, Check, UtensilsCrossed, Clock, ChefHat, X, Globe, RefreshCw, Lock } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "");
const MAX_TABLES = 44;

const TableOrder = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const tableNumber = parseInt(searchParams.get("table") || "0");

  // Session state
  const [session, setSession] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [sessionLocked, setSessionLocked] = useState(false);

  // Menu state
  const [menu, setMenu] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // Order tracking
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [showStatusPage, setShowStatusPage] = useState(false);

  // Mobile cart state
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Check for existing session on load
  useEffect(() => {
    if (tableNumber > 0 && tableNumber <= MAX_TABLES) {
      checkExistingSession();
      fetchMenu();
    }
  }, [tableNumber]);

  const checkExistingSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/table/${tableNumber}/session`);
      const data = await res.json();
      if (data.has_session && data.session) {
        // Session exists - check if it belongs to this device
        const storedSessionId = localStorage.getItem(`table_${tableNumber}_session`);
        
        if (data.session.status === "closed") {
          // Session is closed, allow new session
          localStorage.removeItem(`table_${tableNumber}_session`);
          setShowNameModal(true);
        } else if (storedSessionId === data.session.session_id) {
          // Same device - allow access
          setSession(data.session);
          setCustomerName(data.session.customer_name);
          setSessionLocked(false);
        } else {
          // Different device - lock access
          setSession(data.session);
          setSessionLocked(true);
        }
      } else {
        setShowNameModal(true);
      }
    } catch (err) {
      setShowNameModal(true);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/menu`);
      const data = await res.json();
      setMenu(data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load menu", variant: "destructive" });
    }
  };

  const startSession = async () => {
    if (!customerName.trim()) {
      return toast({ title: "Name Required", description: "Please enter your name", variant: "destructive" });
    }
    
    try {
      // Start a new session
      const res = await fetch(`${API_BASE}/api/table/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_number: tableNumber, customer_name: customerName })
      });
      const data = await res.json();
      
      if (data.session) {
        // Store session ID in localStorage to track ownership
        localStorage.setItem(`table_${tableNumber}_session`, data.session.session_id);
        setSession(data.session);
        setShowNameModal(false);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to start session", variant: "destructive" });
    }
  };

  // Poll for order status updates
  useEffect(() => {
    if (!session?.session_id) return;
    
    const pollStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/table/session/${session.session_id}/status`);
        
        if (!res.ok) {
          // Session no longer exists (404) — reset to welcome screen
          localStorage.removeItem(`table_${tableNumber}_session`);
          setSession(null);
          setSessionLocked(false);
          setShowStatusPage(false);
          setShowNameModal(true);
          return;
        }
        
        const data = await res.json();
        setSession(data);
        
        // Check if session is closed by admin (billing completed)
        if (data.status === "closed") {
          localStorage.removeItem(`table_${tableNumber}_session`);
          setSession(null);
          setSessionLocked(false);
          setShowStatusPage(false);
          setCart([]);
          setShowNameModal(true);
          return;
        }
        
        // Check latest order status
        if (data.orders?.length > 0) {
          const latestOrder = data.orders[data.orders.length - 1];
          setOrderStatus(latestOrder.status);
        }
      } catch (err) {}
    };

    const interval = setInterval(pollStatus, 5000);
    pollStatus(); // Initial call
    return () => clearInterval(interval);
  }, [session?.session_id, tableNumber]);

  const categories = ["All", ...new Set(menu.map((i) => i.category))];
  const filteredItems = menu.filter((item) => {
    if (selectedCategory === "All") return item.available;
    return item.category === selectedCategory && item.available;
  });

  const addToCart = (item) => {
    const existing = cart.find((c) => c._id === item._id);
    if (existing) {
      setCart(cart.map((c) => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast({ title: "Added", description: `${item.name}` });
  };

  const updateQuantity = (id, change) => {
    setCart(cart.map((item) => 
      item._id === id ? { ...item, quantity: Math.max(1, item.quantity + change) } : item
    ));
  };

  const removeFromCart = (id) => setCart(cart.filter((item) => item._id !== id));
  
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      return toast({ title: "Cart Empty", description: "Add items to order", variant: "destructive" });
    }

    setLoading(true);
    try {
      const orderData = {
        table_number: tableNumber,
        customer_name: customerName || "Guest",
        session_id: session?.session_id || null,
        items: cart.map((item) => ({
          item_id: String(item._id),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variant: null,
          variant_price: 0,
          addons: [],
          special_instructions: null,
          item_cost: item.price * 0.4
        })),
        special_instructions: null
      };

      const res = await fetch(`${API_BASE}/api/table/session/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error((await res.json()).detail || "Order failed");
      
      const data = await res.json();
      setCurrentOrder(data.order);
      setOrderStatus("pending_approval");
      
      // Store session ID
      localStorage.setItem(`table_${tableNumber}_session`, data.session_id);
      
      setSession(prev => ({
        ...prev,
        session_id: data.session_id,
        order_ids: [...(prev?.order_ids || []), data.order.order_id]
      }));
      setCart([]);
      setShowMobileCart(false);
      setShowStatusPage(true);
      
      toast({ title: "Order Sent!", description: "Waiting for approval" });
    } catch (err) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Order status display
  const getStatusDisplay = (status) => {
    const statusMap = {
      pending_approval: { icon: Clock, text: "Waiting for Approval", color: "text-yellow-500", bg: "bg-yellow-500/20", step: 1 },
      accepted: { icon: Check, text: "Order Accepted", color: "text-green-500", bg: "bg-green-500/20", step: 2 },
      preparing: { icon: ChefHat, text: "Being Prepared", color: "text-blue-500", bg: "bg-blue-500/20", step: 3 },
      ready: { icon: UtensilsCrossed, text: "Ready to Serve", color: "text-purple-500", bg: "bg-purple-500/20", step: 4 },
      served: { icon: Check, text: "Served", color: "text-green-500", bg: "bg-green-500/20", step: 5 },
      rejected: { icon: X, text: "Rejected", color: "text-red-500", bg: "bg-red-500/20", step: 0 },
    };
    return statusMap[status] || statusMap.pending_approval;
  };

  // Invalid table (outside 1-44 range)
  if (!tableNumber || tableNumber < 1 || tableNumber > MAX_TABLES) {
    return (
      <div className="min-h-screen bg-[#050b10] flex items-center justify-center p-6">
        <div className="bg-white/[0.03] rounded-3xl p-10 text-center max-w-md border border-red-500">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Invalid Table</h1>
          <p className="text-gray-300 mb-4">Table number must be between 1 and {MAX_TABLES}.</p>
          <p className="text-gray-400 text-sm">Please scan the QR code at your table.</p>
        </div>
      </div>
    );
  }

  // Session locked - another device is using this table
  if (sessionLocked && session) {
    return (
      <div className="min-h-screen bg-[#050b10] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 text-center max-w-md w-full shadow-2xl relative z-10">
          <div className="w-20 h-20 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 overflow-hidden relative mx-auto mb-6">
             <Lock className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className="text-3xl text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Table In Use</h1>
          <p className="text-gray-400 mb-4 tracking-wide font-light">Table {tableNumber} is currently reserved by <span className="text-primary font-bold">{session.customer_name}</span>.</p>
          <p className="text-gray-500 text-xs mb-8 uppercase tracking-widest">Please wait until the current experience is completed.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white/[0.05] border border-white/10 text-white px-8 py-4 rounded-2xl font-bold hover:bg-white hover:text-black hover:border-white uppercase tracking-widest text-[11px] transition-all flex items-center justify-center mx-auto space-x-3 w-full"
            style={{ fontFamily: "'El Messiri', serif" }}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Check Availability</span>
          </button>
        </div>
      </div>
    );
  }

  // Name entry modal
  if (showNameModal) {
    return (
      <div className="min-h-screen bg-[#050b10] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative z-10">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 overflow-hidden relative mx-auto mb-6">
               <span className="text-primary font-black text-3xl tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>TH</span>
            </div>
            <h1 className="text-4xl text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Taste of Hindustan</h1>
            <p className="text-primary text-[10px] uppercase tracking-[0.3em] font-bold mb-1" style={{ fontFamily: "'El Messiri', serif" }}>Welcome</p>
            <p className="text-gray-500 text-xs italic">Table {tableNumber}</p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest" style={{ fontFamily: "'El Messiri', serif" }}>Your Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="How shall we address you?"
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-white outline-none focus:border-primary/50 transition-all placeholder:text-gray-600"
                autoFocus
              />
            </div>
            
            <button
              onClick={startSession}
              disabled={!customerName.trim()}
              className="w-full bg-primary text-black py-4 rounded-2xl font-bold uppercase tracking-[0.25em] text-[11px] shadow-2xl shadow-primary/20 hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-primary"
              style={{ fontFamily: "'El Messiri', serif" }}
            >
              Begin Your Experience
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Order Status Page
  if (showStatusPage && session?.orders?.length > 0) {
    return (
      <div className="min-h-screen bg-[#050b10] pb-24">
        {/* Header */}
        <div className="bg-white/[0.03] border-b border-white/5 sticky top-0 z-40 py-3">
          <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center border border-primary/50 overflow-hidden relative">
                 <span className="text-black font-black text-xs" style={{ fontFamily: "'Playfair Display', serif" }}>TH</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary">Table {tableNumber}</h1>
                <p className="text-xs text-gray-300">{customerName}</p>
              </div>
            </div>
            <button
              onClick={() => setShowStatusPage(false)}
              className="bg-primary text-black px-4 py-2 rounded-full font-bold text-sm"
            >
              + Order More
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <h2 className="text-2xl font-bold text-primary text-center">Order Status</h2>
          
          {session.orders.map((order, idx) => {
            const status = getStatusDisplay(order.status);
            const StatusIcon = status.icon;
            
            return (
              <div key={order.order_id} className="bg-white/[0.03] rounded-2xl p-6 border border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400">Order #{idx + 1}</span>
                  <span className="text-gray-400 text-sm">{order.kot_number || order.order_id}</span>
                </div>
                
                {/* Status Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    {['Accepted', 'Preparing', 'Ready', 'Served'].map((step, i) => {
                      const stepNum = i + 2;
                      const isActive = status.step >= stepNum;
                      const isCurrent = status.step === stepNum;
                      return (
                        <div key={step} className="flex flex-col items-center flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                            isActive ? 'bg-primary text-black' : 'bg-gray-600 text-gray-400'
                          } ${isCurrent ? 'ring-2 ring-[#EAB308] ring-offset-2 ring-offset-[#050b10]' : ''}`}>
                            {i + 1}
                          </div>
                          <span className={`text-xs ${isActive ? 'text-primary' : 'text-gray-500'}`}>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.max(0, (status.step - 1) * 33.33)}%` }}
                    />
                  </div>
                </div>

                {/* Current Status */}
                <div className={`flex items-center justify-center space-x-3 py-4 rounded-xl ${status.bg}`}>
                  <StatusIcon className={`h-8 w-8 ${status.color}`} />
                  <span className={`text-xl font-bold ${status.color}`}>{status.text}</span>
                </div>

                {/* Order Items */}
                <div className="mt-4 space-y-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-gray-300 text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
                  <span className="text-gray-400">Order Total</span>
                  <span className="text-primary font-bold">₹{order.total}</span>
                </div>
              </div>
            );
          })}

          {/* Session Total */}
          <div className="bg-primary/20 rounded-2xl p-6 border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-primary text-lg">Session Total</span>
              <span className="text-primary text-2xl font-bold">₹{session.total || 0}</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Pay at counter when ready</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b10] pb-24 lg:pb-6">
      {/* Header */}
      <div className="bg-white/[0.03] border-b border-white/5 sticky top-0 z-40 py-3">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center border border-primary/50 overflow-hidden relative">
               <span className="text-black font-black text-xs" style={{ fontFamily: "'Playfair Display', serif" }}>TH</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">Table {tableNumber}</h1>
              <p className="text-xs text-gray-300">{customerName}</p>
            </div>
          </div>
          
          {session?.orders?.length > 0 && (
            <button
              onClick={() => setShowStatusPage(true)}
              className="bg-primary/20 text-primary px-4 py-2 rounded-full font-bold text-sm border border-primary/20"
            >
              View Orders
            </button>
          )}
        </div>
      </div>

      {/* Session Orders Status Bar */}
      {session?.orders?.length > 0 && (
        <div className="bg-white/[0.03] border-b border-white/5 py-2 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Orders:</span>
              {session.orders.map((order, idx) => {
                const status = getStatusDisplay(order.status);
                const StatusIcon = status.icon;
                return (
                  <div key={order.order_id} className={`flex items-center space-x-1 px-2 py-1 rounded-full ${status.bg}`}>
                    <StatusIcon className={`h-3 w-3 ${status.color}`} />
                    <span className={`text-xs ${status.color}`}>#{idx + 1}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-primary font-bold text-sm">
              ₹{session.total || 0}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Category Filter */}
        <div className="flex overflow-x-auto space-x-2 pb-4 scrollbar-hide mb-4">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition text-sm ${
                selectedCategory === cat 
                  ? "bg-primary text-black font-bold" 
                  : "bg-white/[0.03] text-gray-300 hover:text-primary"
              }`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Items */}
          <div className="lg:col-span-2 space-y-3">
            {filteredItems.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No items available</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredItems.map((item) => (
                  <div key={item._id} className="bg-white/[0.03] rounded-xl p-3 flex space-x-3">
                    <img 
                      src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200"} 
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0" 
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${item.veg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <h3 className="text-white font-medium text-sm truncate">{item.name}</h3>
                        </div>
                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{item.description}</p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-primary font-bold">₹{item.price}</p>
                        <button 
                          onClick={() => addToCart(item)}
                          className="bg-primary text-black px-3 py-1.5 rounded-lg font-bold text-sm hover:bg-white transition"
                        >
                          ADD
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Cart */}
          <div className="hidden lg:block bg-white/[0.03] rounded-xl p-4 h-fit sticky top-24">
            <h2 className="text-lg font-bold text-primary mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />Your Order
            </h2>

            {cart.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Cart is empty</p>
            ) : (
              <>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item._id} className="bg-[#050b10] rounded-lg p-2 flex items-center space-x-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.name}</p>
                        <p className="text-primary text-sm">₹{item.price * item.quantity}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => updateQuantity(item._id, -1)}
                          className="w-6 h-6 rounded-full bg-white/[0.03] text-white flex items-center justify-center">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-white font-bold text-sm w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item._id, 1)}
                          className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center">
                          <Plus className="h-3 w-3" />
                        </button>
                        <button onClick={() => removeFromCart(item._id)} className="text-red-500 ml-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex justify-between text-primary font-bold text-lg">
                    <span>Total</span>
                    <span>₹{cartTotal}</span>
                  </div>
                </div>

                <button 
                  onClick={handleSubmitOrder} 
                  disabled={loading}
                  className="w-full mt-4 bg-primary text-black py-3 rounded-xl font-bold hover:bg-white transition disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send to Kitchen"}
                </button>
              </>
            )}

            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
              <Link to="/" className="flex items-center justify-center space-x-2 text-gray-400 hover:text-primary transition">
                <Globe className="h-4 w-4" />
                <span className="text-sm">Visit Main Website</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Cart Button */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#050b10] to-transparent">
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full bg-primary text-black py-4 rounded-2xl font-bold flex items-center justify-between px-6 shadow-lg shadow-primary/20"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-black/20 rounded-full w-8 h-8 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <span>{cartCount} {cartCount === 1 ? 'Item' : 'Items'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">₹{cartTotal}</span>
              <span className="text-sm">→</span>
            </div>
          </button>
        </div>
      )}

      {/* Mobile Cart Bottom Sheet */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileCart(false)} />
          
          <div className="absolute bottom-0 left-0 right-0 bg-white/[0.03] rounded-t-3xl max-h-[85vh] overflow-hidden animate-slide-up">
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-gray-500 rounded-full" />
            </div>
            
            <div className="flex justify-between items-center px-4 pb-3 border-b border-white/5">
              <h2 className="text-xl font-bold text-primary">Your Order</h2>
              <button onClick={() => setShowMobileCart(false)} className="text-gray-400">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[50vh] p-4 space-y-3">
              {cart.map((item) => (
                <div key={item._id} className="bg-[#050b10] rounded-xl p-3 flex space-x-3">
                  <img 
                    src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100"} 
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-white font-medium truncate pr-2">{item.name}</p>
                      <button onClick={() => removeFromCart(item._id)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-primary font-bold">₹{item.price * item.quantity}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <button onClick={() => updateQuantity(item._id, -1)}
                        className="w-8 h-8 rounded-full bg-white/[0.03] text-white flex items-center justify-center">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-white font-bold text-lg w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, 1)}
                        className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.03]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-300">Subtotal</span>
                <span className="text-white font-bold">₹{cartTotal}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-300">GST (5%)</span>
                <span className="text-white">₹{Math.round(cartTotal * 0.05)}</span>
              </div>
              <div className="flex justify-between items-center mb-4 text-lg">
                <span className="text-primary font-bold">Total</span>
                <span className="text-primary font-bold">₹{cartTotal + Math.round(cartTotal * 0.05)}</span>
              </div>
              
              <button 
                onClick={handleSubmitOrder} 
                disabled={loading}
                className="w-full bg-primary text-black py-4 rounded-xl font-bold text-lg hover:bg-white transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send to Kitchen</span>
                )}
              </button>
              
              <p className="text-gray-400 text-xs text-center mt-2">Pay at counter after your meal</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TableOrder;


