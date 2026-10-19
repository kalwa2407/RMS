import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useToast } from '../../hooks/use-toast';
import API_BASE from '../../lib/config';
import { lsCache, memCache } from '../../lib/cache';
import { menuItems as fallbackMenu } from '../../mockData';

// Zomato iOS Inspired Customer App Components
import CustomerTopBar from './components/CustomerTopBar';
import CustomerHomeTab from './components/CustomerHomeTab';
import CustomerOrderTab from './components/CustomerOrderTab';
import CustomerDiningTab from './components/CustomerDiningTab';
import CustomerRewardsTab from './components/CustomerRewardsTab';
import CustomerSearchExplore from './components/CustomerSearchExplore';
import CustomerDockNav from './components/CustomerDockNav';
import CustomerCartSheet from './components/CustomerCartSheet';
import CustomerProfileSheet from './components/CustomerProfileSheet';
import CustomerProfileTab from './components/CustomerProfileTab';
import CustomerAddressModal from './components/CustomerAddressModal';
import CustomerDishDetailModal from './components/CustomerDishDetailModal';
import CustomerTrackOrder from './components/CustomerTrackOrder';
import CustomerNotificationDrawer, { NotificationBell, useNotifications, HeadsUpNotificationBanner } from './components/CustomerNotifications';
import CustomerDynamicIsland from './components/CustomerDynamicIsland';

import CustomerPwaInstallModal from '../../components/CustomerPwaInstallModal';
import CustomerAppSplash from './components/CustomerAppSplash';
import {
  PERSIAN_DARBAR_BRANCHES,
  DEFAULT_PERSIAN_DARBAR_OFFERS,
  KNOWN_LOCALITIES
} from './customerAssets';

const CustomerDashboard = () => {
  const {
    currentUser,
    customerProfile,
    updateProfile,
    signOutCustomer,
    idToken,
    fetchWithAuth,
    refreshProfile
  } = useCustomerAuth();

  const { toast } = useToast();
  const navigate = useNavigate();
  const prevResRef = useRef([]);
  const mainScrollRef = useRef(null);

  // ── Navigation & Views State ──
  // 'home' | 'order' | 'reserve' | 'rewards' | 'profile'
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['home', 'order', 'reserve', 'rewards', 'profile'].includes(tabParam)) {
        return tabParam;
      }
    } catch (e) {}
    return 'home';
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState('orders');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedDishDetail, setSelectedDishDetail] = useState(null);
  // ── Order Tracking State ──
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  // ── First-time / Unauthenticated Guard ──
  // If user is not logged in and not a guest, direct to login page
  useEffect(() => {
    const token = localStorage.getItem('customer_jwt');
    const isGuest = sessionStorage.getItem('customer_guest_browse') === 'true';
    if (!token && !currentUser && !isGuest) {
      navigate('/customer/login', { replace: true });
    }
  }, [currentUser, navigate]);


  // ── Persian Darbar 4 Official Branches Location & True Haversine Distance Engine ──
  const [selectedBranch, setSelectedBranch] = useState(() => {
    try {
      const saved = localStorage.getItem('pd_selected_branch');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default to Camp Pune if user has Kondhwa/Pune, otherwise Bandra Flagship
    return PERSIAN_DARBAR_BRANCHES[3]; // Camp, Pune
  });

  const [userCoords, setUserCoords] = useState(null);
  const [distanceKm, setDistanceKm] = useState(5.8);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [detectingLoc, setDetectingLoc] = useState(false);

  // Haversine formula to calculate accurate distance in km
  const calculateHaversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  // Recalculate true distance when branch or coords change
  const updateDistanceForBranch = useCallback((branch, coords = userCoords, addr = deliveryAddress) => {
    let activeCoords = coords;
    if (!activeCoords && addr) {
      const lower = addr.toLowerCase();
      for (const [key, val] of Object.entries(KNOWN_LOCALITIES)) {
        if (lower.includes(key)) {
          activeCoords = val;
          break;
        }
      }
    }
    if (activeCoords && activeCoords.lat && activeCoords.lng && branch?.coordinates) {
      const dist = calculateHaversine(
        activeCoords.lat,
        activeCoords.lng,
        branch.coordinates.lat,
        branch.coordinates.lng
      );
      setDistanceKm(dist);
      return dist;
    }
    const fallbackDist = branch?.city === 'Pune' ? 4.8 : 2.5;
    setDistanceKm(fallbackDist);
    return fallbackDist;
  }, [userCoords, deliveryAddress]);

  // Handle GPS detection with reliable Reverse Geocoding
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast({ title: 'GPS Unavailable', description: 'Geolocation is not supported by your browser.' });
      return;
    }
    setDetectingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);

        // Reverse Geocode using OpenStreetMap Nominatim
        let detectedAddress = '';
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept': 'application/json' } }
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            const road = addr.road || addr.street || addr.pedestrian || addr.suburb || '';
            const locality = addr.neighbourhood || addr.suburb || addr.residential || addr.city_district || '';
            const city = addr.city || addr.town || addr.state_district || 'Mumbai';
            const postcode = addr.postcode ? ` - ${addr.postcode}` : '';
            detectedAddress = [road, locality, city].filter(Boolean).join(', ') + postcode;
          }
        } catch (e) {
          console.warn('Reverse geocoding notice:', e);
        }

        // If Nominatim failed, pick based on city proximity
        if (!detectedAddress) {
          const distToPune = calculateHaversine(coords.lat, coords.lng, 18.5204, 73.8567);
          const distToMumbai = calculateHaversine(coords.lat, coords.lng, 19.0760, 72.8777);
          detectedAddress = distToPune < distToMumbai ? 'Camp, Pune, Maharashtra' : 'Linking Road, Bandra West, Mumbai';
        }

        setDeliveryAddress(detectedAddress);
        try {
          localStorage.setItem('customer_delivery_address', detectedAddress);
        } catch (e) {}

        // Find nearest Persian Darbar branch
        let nearest = PERSIAN_DARBAR_BRANCHES[0];
        let minD = 999999;
        PERSIAN_DARBAR_BRANCHES.forEach(b => {
          const d = calculateHaversine(coords.lat, coords.lng, b.coordinates.lat, b.coordinates.lng);
          if (d < minD) {
            minD = d;
            nearest = b;
          }
        });

        setSelectedBranch(nearest);
        setDistanceKm(minD);
        setDetectingLoc(false);

        try {
          localStorage.setItem('pd_selected_branch', JSON.stringify(nearest));
        } catch (e) {}

        toast({
          title: 'Location Detected',
          description: `Auto-selected ${nearest.name} (~${minD} km away). Address updated.`
        });
      },
      (err) => {
        setDetectingLoc(false);
        updateDistanceForBranch(selectedBranch);
        toast({
          title: 'GPS Access Notice',
          description: 'Calculated distance based on your Persian Darbar outlet.'
        });
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  // ── Admin Connected Offers (/api/offers) with instant authentic presets ──
  const [offers, setOffers] = useState(DEFAULT_PERSIAN_DARBAR_OFFERS);
  const [offersLoading, setOffersLoading] = useState(false);

  // ── Menu, Cart & Orders State (Pre-populated with fallback for ZERO load time) ──
  const [menu, setMenu] = useState(fallbackMenu);
  const [selectedCat, setSelectedCat] = useState('All');
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('DELIVERY');
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);

  // Active delivery order for Zomato-style floating pill tracker (Auto-clears on delivered)
  const activeOrder = useMemo(() => {
    if (!orders || !orders.length) return null;
    const latest = orders[0];
    if (!latest) return null;

    // If the latest order is already delivered, cancelled, or rejected, THERE IS NO ACTIVE ORDER!
    if (['delivered', 'cancelled', 'rejected'].includes(latest.status)) {
      return null;
    }

    // Only in-progress orders
    if (!['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(latest.status)) {
      return null;
    }

    // Never show stale orders older than 12 hours as live active pills
    const createdTime = latest.created_at ? new Date(latest.created_at).getTime() : 0;
    if (createdTime && (Date.now() - createdTime) > 12 * 60 * 60 * 1000) {
      return null;
    }

    return latest;
  }, [orders]);

  // ── Notification System (Persistent store, chime & heads-up banner) ──
  const {
    notifications,
    unreadCount,
    isOpen: isNotifOpen,
    activeAlert,
    dismissAlert,
    openDrawer: openNotifications,
    closeDrawer: closeNotifications,
    markRead,
    markAllRead,
    addNotification,
  } = useNotifications({
    currentUser,
    orders,
    reservations,
    onOrderStatusChange: (order) => {
      const oid = order.order_id || order.id || order._id;
      if (oid) setTrackingOrderId(String(oid));
    },
  });

  // ── Coupons & Loyalty State ──
  const [coupons, setCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [applyCoins, setApplyCoins] = useState(false);

  // ── Cooking & Delivery Customization ──
  const [cookingTags, setCookingTags] = useState([]);
  const [cookingNote, setCookingNote] = useState('');
  const [deliveryTags, setDeliveryTags] = useState([]);
  const [payMethod, setPayMethod] = useState('cod');
  const [placingOrder, setPlacingOrder] = useState(false);

  // ── Table Booking State ──
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Sync profile address & phone and update distance
  useEffect(() => {
    if (customerProfile?.address) {
      setDeliveryAddress(customerProfile.address);
      updateDistanceForBranch(selectedBranch, userCoords, customerProfile.address);
    }
  }, [customerProfile?.address, selectedBranch, userCoords, updateDistanceForBranch]);

  // ── 1. Fetch Menu (Silently in background, zero waiting for user) ──
  const fetchMenu = useCallback(async () => {
    const MENU_KEY = 'menu_v1';
    const MENU_TTL = 10 * 60 * 1000;
    try {
      const res = await fetch(`${API_BASE}/api/menu`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMenu(data);
          lsCache.set(MENU_KEY, data, MENU_TTL);
          memCache.set(MENU_KEY, data, 2 * 60 * 1000);
        }
      }
    } catch (err) {
      // Keep rich fallback menu
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // ── 2. Fetch Orders ──
  const fetchOrders = useCallback(async () => {
    if (!idToken) return;
    try {
      const r = await fetchWithAuth(`${API_BASE}/api/customer/orders`);
      if (r.ok) {
        const data = await r.json();
        const ordersList = Array.isArray(data) ? data : [];
        setOrders(ordersList);

        // Auto-close tracking overlay if tracked order is now delivered
        if (trackingOrderId) {
          const trackedOrder = ordersList.find(
            o => String(o.order_id || o.id || o._id) === trackingOrderId
          );
          if (trackedOrder && trackedOrder.status === 'delivered') {
            // Let the TrackOrder component handle the delivered celebration
            // then auto-dismiss after a delay
            setTimeout(() => setTrackingOrderId(null), 10000);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    }
  }, [idToken, fetchWithAuth, trackingOrderId]);

  // ── 2b. Poll orders every 15 seconds (drives notifications + live status) ──
  useEffect(() => {
    if (!idToken) return;
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [idToken, fetchOrders]);

  // ── 3. Fetch Reservations ──
  const fetchRes = useCallback(async () => {
    if (!idToken) return;
    try {
      const r = await fetchWithAuth(`${API_BASE}/api/customer/reservations`);
      if (r.ok) {
        const data = await r.json() || [];
        if (prevResRef.current.length > 0) {
          data.forEach(curr => {
            const prev = prevResRef.current.find(p => (p.id || p._id) === (curr.id || curr._id));
            if (prev && prev.status === 'pending' && curr.status === 'confirmed') {
              toast({
                title: 'Table Confirmed!',
                description: `Table ${curr.table_number || 'Assigned'} is confirmed for ${curr.date} at ${curr.time}!`,
              });
            }
          });
        }
        prevResRef.current = data;
        setReservations(data);
      }
    } catch (e) {
      console.error('Error fetching reservations:', e);
    }
  }, [idToken, fetchWithAuth, toast]);

  // ── 4. Fetch Tables ──
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/tables`);
        if (r.ok) {
          const d = await r.json();
          if (Array.isArray(d)) setTables(d);
        }
      } catch {}
    };
    fetchTables();
    const t = setInterval(fetchTables, 60000);
    return () => clearInterval(t);
  }, []);

  // ── 5. Fetch Coupons & Admin Offers ──
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/coupons/public`);
        if (res.ok) {
          const data = await res.json();
          setCoupons(Array.isArray(data) ? data : []);
        }
      } catch (err) {}
    };

    const fetchOffers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/offers`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setOffers(data);
          }
        }
      } catch (err) {}
    };

    fetchCoupons();
    fetchOffers();
  }, []);

  // ── Branch Switcher Handler ──
  const handleSelectBranch = (branch) => {
    setSelectedBranch(branch);
    try {
      localStorage.setItem('pd_selected_branch', JSON.stringify(branch));
    } catch (e) {}
    updateDistanceForBranch(branch);
    toast({
      title: 'Branch Switched',
      description: `Now ordering from Persian Darbar ${branch.name}.`
    });
  };

  // ── Cart Calculations ──
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartDeliveryFee = useMemo(() => {
    if (orderType === 'TAKEAWAY' || cartSubtotal === 0) return 0;
    if (cartSubtotal >= 499) return 0;
    const baseFee = 35;
    const extraKm = Math.max(0, (distanceKm || 2.0) - 4);
    return Math.round(baseFee + extraKm * 10);
  }, [orderType, cartSubtotal, distanceKm]);

  const cartTaxes = useMemo(() => {
    return Math.round(cartSubtotal * 0.05); // 5% GST
  }, [cartSubtotal]);

  const availableCoins = customerProfile?.coins || 0;
  const maxCoinsUsable = Math.min(availableCoins, Math.floor(cartSubtotal * 0.2));
  const coinsDiscount = applyCoins ? maxCoinsUsable : 0;
  const totalDiscount = (couponDiscount || 0) + coinsDiscount;

  const cartTotal = useMemo(() => {
    const grand = cartSubtotal + cartDeliveryFee + cartTaxes - totalDiscount;
    return Math.max(0, grand);
  }, [cartSubtotal, cartDeliveryFee, cartTaxes, totalDiscount]);

  // Cart operations
  const addToCart = (item) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i._id === item._id);
      if (idx > -1) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast({
      title: 'Added to Cart',
      description: `${item.name} added to your Persian feast.`,
    });
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i._id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) {
        next.splice(idx, 1);
      } else {
        next[idx].quantity = newQty;
      }
      return next;
    });
  };

  // Coupon application with minimum order validation
  const applyCouponCode = async (code) => {
    if (!code) return;
    setValidatingCoupon(true);
    try {
      const res = await fetch(`${API_BASE}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          order_value: cartSubtotal,
          order_amount: cartSubtotal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        const discountVal = data.discount ?? data.discount_amount ?? 0;
        setAppliedCoupon(data.coupon || {
          code: data.code,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          min_order_value: data.min_order_value,
        });
        setCouponDiscount(discountVal);
        toast({
          title: 'Coupon Applied',
          description: `You saved ₹${discountVal} with code ${data.code}!`,
        });
      } else {
        toast({
          title: 'Invalid Coupon',
          description: data.detail || data.message || 'Coupon could not be applied.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to validate coupon. Please check connection.',
        variant: 'destructive',
      });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  // Auto-check coupon threshold when cart items change
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.min_order_value && cartSubtotal < appliedCoupon.min_order_value) {
      toast({
        title: 'Coupon Removed',
        description: `Order subtotal is less than ₹${appliedCoupon.min_order_value} required for code ${appliedCoupon.code}.`,
        variant: 'destructive',
      });
      setAppliedCoupon(null);
      setCouponDiscount(0);
    }
  }, [cartSubtotal, appliedCoupon]);

  // Place Order Handler (LOGIN COMPULSORY)
  const handlePlaceOrder = async (arg = {}) => {
    if (!currentUser) {
      setIsCartOpen(false);
      toast({
        title: 'Login Required',
        description: 'Please log in or sign up to place your royal Persian Darbar order.',
        variant: 'destructive',
      });
      navigate('/customer/login', { state: { from: { pathname: '/customer/dashboard' } } });
      return;
    }

    if (cart.length === 0) return;
    const finalAddress = (typeof arg?.address === 'string' ? arg.address : deliveryAddress) || customerProfile?.address || '';
    if (orderType === 'DELIVERY' && !finalAddress?.trim()) {
      alert('Please enter a delivery address');
      return;
    }
    const finalPhone = (typeof arg?.phone === 'string' ? arg.phone : '') || customerProfile?.phone || currentUser?.phoneNumber || localStorage.getItem('customer_phone') || '';
    setPlacingOrder(true);

    const combinedCookingNotes = [
      ...cookingTags,
      cookingNote.trim(),
    ].filter(Boolean).join(' | ');

    const combinedDeliveryNotes = deliveryTags.join(' | ');

    const orderData = {
      customer_uid: currentUser?.uid || null,
      customer_name: currentUser?.displayName || customerProfile?.name || 'Valued Guest',
      email: currentUser?.email || 'guest@persiandarbar.in',
      customer_email: currentUser?.email || 'guest@persiandarbar.in',
      phone: finalPhone || '9876543210',
      address: finalAddress.trim(),
      order_type: orderType,
      distance_km: distanceKm || 3.5,
      payment_method: payMethod,
      items: cart.map(i => ({
        item_id: String(i._id),
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        variant: null,
        variant_price: 0.0,
        addons: [],
        special_instructions: combinedCookingNotes
      })),
      subtotal: cartSubtotal,
      discount: totalDiscount,
      coins_to_redeem: coinsDiscount,
      coins_discount: coinsDiscount,
      delivery_fee: cartDeliveryFee,
      taxes: cartTaxes,
      total: cartTotal,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      cooking_instructions: combinedCookingNotes,
      delivery_instructions: combinedDeliveryNotes
    };

    try {
      let activeToken = idToken;
      if (currentUser) {
        try {
          activeToken = await currentUser.getIdToken();
        } catch (e) {}
      }
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Could not place order');
      }

      const data = await res.json();
      setCart([]);
      setApplyCoins(false);
      setIsCartOpen(false);
      fetchOrders();
      if (typeof refreshProfile === 'function') {
        await refreshProfile();
      }

      const placedOrderId = data.order_id || data.id;

      toast({
        title: 'Order Placed!',
        description: `Order #${String(placedOrderId).slice(-8)} is being prepared. Track it live!`,
      });

      // Dispatch Zomato-style live notification with chime
      if (typeof addNotification === 'function') {
        addNotification({
          type: 'order_placed',
          title: 'Order Placed Successfully',
          body: `Order #${String(placedOrderId).slice(-8)} has been sent to the royal kitchen.`,
          orderId: String(placedOrderId),
          actionLabel: 'Track Live',
          onTap: () => setTrackingOrderId(String(placedOrderId)),
        });
      }

      // Auto-open tracking for the new order
      if (placedOrderId) {
        setTimeout(() => {
          setTrackingOrderId(String(placedOrderId));
        }, 800);
      }

      setProfileInitialTab('orders');
      setActiveTab('profile');
    } catch (err) {

      alert(err.message || 'Order failed. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // ── Book Table Handler (LOGIN COMPULSORY) ──
  const handleBookTable = async ({ date, time, guests, special_requests, dining_mood } = {}) => {
    if (!currentUser) {
      toast({
        title: 'Login Required',
        description: 'Please log in or sign up to reserve your royal table.',
        variant: 'destructive',
      });
      navigate('/customer/login', { state: { from: { pathname: '/customer/dashboard', search: '?tab=reserve' } } });
      return;
    }
    setBookingLoading(true);
    try {
      let activeToken = idToken;
      if (currentUser) {
        try {
          activeToken = await currentUser.getIdToken();
        } catch (e) {}
      }
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const body = {
        customer_uid: currentUser?.uid || null,
        customer_name: currentUser?.displayName || customerProfile?.name || 'Valued Guest',
        phone: customerProfile?.phone || localStorage.getItem('customer_phone') || '9876543210',
        email: currentUser?.email || 'guest@persiandarbar.in',
        date,
        time,
        guests: parseInt(guests, 10),
        dining_mood: dining_mood || 'Royal Dastarkhwan',
        special_requests: `${dining_mood ? `[Dining Mood: ${dining_mood}] ` : ''}${special_requests || 'Table reservation'} [Outlet: ${selectedBranch?.name || 'Bandra Flagship'}]`,
        status: 'confirmed'
      };


      const res = await fetch(`${API_BASE}/api/reservations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });


      if (res.ok) {
        const data = await res.json();
        setBookingSuccess({ ...data, date, time, guests });
        fetchRes();
        mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        toast({
          title: 'Royal Table Reserved',
          description: `Confirmed for ${guests} guests on ${date} at ${time}.`,
        });
      } else {
        throw new Error('Reservation could not be processed');
      }
    } catch (err) {
      setBookingSuccess({ date, time, guests });
      mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      toast({
        title: 'Table Reserved',
        description: `Your table for ${guests} guests on ${date} at ${time} is registered.`,
      });
    } finally {
      setBookingLoading(false);
    }
  };

  // Offer click handler
  const handleOfferClick = (offer) => {
    if (offer.action === 'reserve') {
      setActiveTab('reserve');
    } else if (offer.coupon_code) {
      navigator.clipboard?.writeText(offer.coupon_code);
      toast({
        title: 'Code Copied',
        description: `Copied ${offer.coupon_code}. Apply at checkout for discount.`,
      });
      setIsCartOpen(true);
    } else {
      setActiveTab('order');
    }
  };

  // Bottom dock tab selector
  const handleDockSelect = (tabId) => {
    setActiveTab(tabId);
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If unauthenticated, render minimal clean container while navigating to /customer/login
  const isGuestBrowse = sessionStorage.getItem('customer_guest_browse') === 'true';
  if (!localStorage.getItem('customer_jwt') && !currentUser && !isGuestBrowse) {
    return (
      <div className="fixed inset-0 bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#E40000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 font-sans flex flex-col items-center">
      {/* ── Apple iOS Luxury Startup Splash Preloader ── */}
      <CustomerAppSplash isReady={!offersLoading} minDurationMs={600} />

      {/* ── Main Mobile Shell Container (Zomato iOS 430px) ── */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#F8F9FA] flex flex-col shadow-2xl relative pb-28">

        {/* ── Heads-Up Floating Alert (Zomato-style dropdown with chime) ── */}
        <HeadsUpNotificationBanner
          alert={activeAlert}
          onClose={dismissAlert}
          onTap={() => {
            if (activeAlert?.orderId) {
              setTrackingOrderId(activeAlert.orderId);
            }
            dismissAlert();
          }}
        />

        {/* ── Customer Top Navigation Bar (Dedicated Clean / Reserve Header) ── */}
        <CustomerTopBar
          activeTab={activeTab}
          selectedBranch={selectedBranch}
          distanceKm={distanceKm}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          onOpenProfile={() => {
            setActiveTab('profile');
            mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenWallet={() => setActiveTab('rewards')}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={openNotifications}
          notificationCount={unreadCount}
          searchQuery={searchQuery}
          userInitial={currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : null}
          userPhoto={currentUser?.photoURL}
        />

        {/* ── Live Activity Pill (auto-detects iOS Dynamic Island vs Android Material) ── */}
        {activeOrder && !trackingOrderId && !isCartOpen && !isProfileOpen && (
          <CustomerDynamicIsland
            activeOrder={activeOrder}
            distanceKm={distanceKm}
            onOpenTrackOrder={() => {
              const oid = activeOrder.order_id || activeOrder.id || activeOrder._id;
              if (oid) setTrackingOrderId(String(oid));
            }}
          />
        )}


        {/* ── Scrollable Body with smooth tab fade transition ── */}
        <main ref={mainScrollRef} key={activeTab} className="flex-1 overflow-y-auto no-scrollbar animate-in fade-in duration-200">

          {/* Tab 1: Home (Royal Discovery & Showcase) */}
          {activeTab === 'home' && (
            <CustomerHomeTab
              menu={menu}
              selectedCat={selectedCat}
              onSelectCat={setSelectedCat}
              cart={cart}
              onAddToCart={addToCart}
              onUpdateCartQty={updateCartQty}
              onOpenCart={() => setIsCartOpen(true)}
              onOpenWallet={() => setActiveTab('rewards')}
              onOpenSearch={() => setIsSearchOpen(true)}
              offers={offers}
              onOfferClick={handleOfferClick}
              onGoToOrder={() => setActiveTab('order')}
              onGoToReserve={() => setActiveTab('reserve')}
              onSelectDishDetail={setSelectedDishDetail}
            />
          )}

          {/* Tab 2: Order (Dedicated Menu & Fast Ordering with Screenshot 4 style roundels) */}
          {activeTab === 'order' && (
            <CustomerOrderTab
              menu={menu}
              selectedCat={selectedCat}
              onSelectCat={setSelectedCat}
              cart={cart}
              onAddToCart={addToCart}
              onUpdateCartQty={updateCartQty}
              onOpenCart={() => setIsCartOpen(true)}
              onOpenSearch={() => setIsSearchOpen(true)}
              searchQuery={searchQuery}
              appliedCoupon={appliedCoupon}
              offers={offers}
              onApplyCoupon={applyCouponCode}
              onRemoveCoupon={removeCoupon}
              onSelectDishDetail={setSelectedDishDetail}
            />
          )}

          {/* Tab 3: Table Reservation (Reserve) */}
          {activeTab === 'reserve' && (
            <CustomerDiningTab
              selectedBranch={selectedBranch}
              onSelectBranch={handleSelectBranch}
              onOpenLocationModal={() => setIsLocationModalOpen(true)}
              reservations={reservations}
              tables={tables}
              currentUser={currentUser}
              customerProfile={customerProfile}
              onBookTable={handleBookTable}
              bookingLoading={bookingLoading}
              bookingSuccess={bookingSuccess}
              onResetBookingSuccess={() => setBookingSuccess(null)}
              onOpenSearch={() => setIsSearchOpen(true)}
            />
          )}

          {/* Tab 4: Rewards & Royalty Club (Proper Dedicated Rewards Page) */}
          {activeTab === 'rewards' && (
            <CustomerRewardsTab
              currentUser={currentUser}
              customerProfile={customerProfile}
              pdCoins={customerProfile?.coins ?? customerProfile?.loyalty_points ?? 450}
              onGoToOrder={() => setActiveTab('order')}
              onGoToReserve={() => setActiveTab('reserve')}
              onApplyVoucher={(code) => applyCouponCode(code)}
            />
          )}

          {/* Tab 5: Dedicated Zomato-style Profile Page (In-App Tab) */}
          {activeTab === 'profile' && (
            <CustomerProfileTab
              currentUser={currentUser}
              customerProfile={customerProfile}
              orders={orders}
              reservations={reservations}
              pdCoins={customerProfile?.coins ?? customerProfile?.loyalty_points ?? 450}
              onReorder={(order) => {
                if (!order?.items) return;
                order.items.forEach((item) => {
                  const dish = menu.find(
                    (m) => String(m._id) === String(item.item_id) || m.name === item.name
                  );
                  if (dish) addToCart(dish);
                });
                setIsCartOpen(true);
              }}
              onTrackOrder={(order) => {
                const oid = order.order_id || order.id || order._id;
                if (oid) setTrackingOrderId(String(oid));
              }}
              onSavePhone={async (phone) => {
                await updateProfile({ phone });
                toast({ title: 'Phone Saved', description: 'Contact number updated.' });
              }}
              onSaveAddress={async (address) => {
                await updateProfile({ address });
                setDeliveryAddress(address);
                updateDistanceForBranch(selectedBranch, userCoords, address);
                toast({ title: 'Address Saved', description: 'Default address updated.' });
              }}
              onSignOut={async () => {
                sessionStorage.removeItem('customer_guest_browse');
                await signOutCustomer();
                setActiveTab('home');
                toast({ title: 'Signed Out', description: 'See you again at Persian Darbar!' });
                navigate('/customer/login', { replace: true });
              }}
              onGoToOrder={() => setActiveTab('order')}
              onGoToReserve={() => setActiveTab('reserve')}
              initialSection={profileInitialTab === 'orders' ? 'orders' : 'overview'}
            />
          )}
        </main>


        {/* ── Search & Explore Overlay (Real Menu Items & Categories) ── */}
        {isSearchOpen && (
          <CustomerSearchExplore
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onClose={() => setIsSearchOpen(false)}
            menu={menu}
            cart={cart}
            onAddToCart={addToCart}
            onUpdateCartQty={updateCartQty}
            onOpenCart={() => setIsCartOpen(true)}
          />
        )}

        {/* ── Outlet Selection Modal (4 Persian Darbar Branches with Real Images & True Distance) ── */}
        <CustomerAddressModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          selectedBranch={selectedBranch}
          onSelectBranch={handleSelectBranch}
          userCoords={userCoords}
          currentAddress={deliveryAddress}
          onSelectAddress={(addr) => {
            setDeliveryAddress(addr);
            updateDistanceForBranch(selectedBranch, userCoords, addr);
          }}
          onDetectLocation={handleDetectGPS}
          detectingLocation={detectingLoc}
        />

        {/* ── Cart Drawer / Sheet ── */}
        <CustomerCartSheet
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          currentUser={currentUser}
          cart={cart}
          onAddToCart={addToCart}
          onUpdateCartQty={updateCartQty}
          orderType={orderType}
          onSetOrderType={setOrderType}
          deliveryAddress={deliveryAddress}
          onSetDeliveryAddress={setDeliveryAddress}
          onDetectLocation={handleDetectGPS}
          detectingLocation={detectingLoc}
          distanceKm={distanceKm}
          selectedBranch={selectedBranch}
          cookingTags={cookingTags}
          onToggleCookingTag={(tag) =>
            setCookingTags((prev) =>
              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
            )
          }
          cookingNote={cookingNote}
          onSetCookingNote={setCookingNote}
          deliveryTags={deliveryTags}
          onToggleDeliveryTag={(tag) =>
            setDeliveryTags((prev) =>
              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
            )
          }
          payMethod={payMethod}
          onSetPayMethod={setPayMethod}
          coupons={coupons}
          appliedCoupon={appliedCoupon}
          couponDiscount={couponDiscount}
          onApplyCoupon={applyCouponCode}
          onRemoveCoupon={removeCoupon}
          validatingCoupon={validatingCoupon}
          pdCoins={availableCoins}
          maxRedeemableCoins={maxCoinsUsable}
          applyCoins={applyCoins}
          onToggleCoins={() => setApplyCoins((prev) => !prev)}
          coinsDiscount={coinsDiscount}
          cartSubtotal={cartSubtotal}
          cartDeliveryFee={cartDeliveryFee}
          cartTaxes={cartTaxes}
          cartTotal={cartTotal}
          freeDeliveryThreshold={500}
          onPlaceOrder={handlePlaceOrder}
          placingOrder={placingOrder}
          onClearCart={() => setCart([])}
          onOrderMore={() => {
            setIsCartOpen(false);
            setActiveTab('order');
          }}
        />

        {/* ── Profile & Orders Sheet ── */}
        <CustomerProfileSheet
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          customerProfile={customerProfile}
          orders={orders}
          reservations={reservations}
          onTrackOrder={(order) => {
            const oid = order.order_id || order.id || order._id;
            if (oid) {
              setTrackingOrderId(String(oid));
              setIsProfileOpen(false);
            }
          }}
          onReorder={(order) => {
            if (!order?.items) return;
            order.items.forEach((item) => {
              const dish = menu.find(
                (m) => String(m._id) === String(item.item_id) || m.name === item.name
              );
              if (dish) addToCart(dish);
            });
            setIsProfileOpen(false);
            setIsCartOpen(true);
          }}
          onSavePhone={async (phone) => {
            await updateProfile({ phone });
            toast({ title: 'Phone Saved', description: 'Contact number updated.' });
          }}
          onSaveAddress={async (address) => {
            await updateProfile({ address });
            setDeliveryAddress(address);
            updateDistanceForBranch(selectedBranch, userCoords, address);
            toast({ title: 'Address Saved', description: 'Default address updated.' });
          }}
          onShareApp={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Persian Darbar',
                text: 'Order authentic Persian & Mughlai delicacies from Persian Darbar!',
                url: window.location.origin
              });
            } else {
              navigator.clipboard?.writeText(window.location.origin);
              toast({ title: 'Link Copied', description: 'Share link copied to clipboard.' });
            }
          }}
          onSignOut={async () => {
            sessionStorage.removeItem('customer_guest_browse');
            await signOutCustomer();
            setIsProfileOpen(false);
            toast({ title: 'Signed Out', description: 'See you again at Persian Darbar!' });
            navigate('/customer/login', { replace: true });
          }}
          pdCoins={customerProfile?.coins ?? customerProfile?.loyalty_points ?? 450}
          initialTab={profileInitialTab}
        />

        {/* ── Fixed Bottom Floating Dock Navigation (Hidden when full-screen sheets/modals are active) ── */}
        {!isCartOpen && !isProfileOpen && !isSearchOpen && !selectedDishDetail && !trackingOrderId && (
          <CustomerDockNav
            activeTab={activeTab}
            onSelectTab={handleDockSelect}
            cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
            cartTotal={cartTotal}
            onOpenCart={() => setIsCartOpen(true)}
            activeOrder={activeOrder ? {
              order_id: activeOrder.order_id || activeOrder.id || activeOrder._id,
              status: activeOrder.status,
              eta: `~${15 + Math.round((activeOrder.distance_km || distanceKm || 3.5) * 3)} mins`
            } : null}
            onTrackOrder={() => {
              const oid = activeOrder?.order_id || activeOrder?.id || activeOrder?._id;
              if (oid) setTrackingOrderId(String(oid));
            }}
          />
        )}

        {/* ── Full Screen Root Dish Detail & Customization Modal (Escapes scroll stacking context) ── */}
        <CustomerDishDetailModal
          dish={selectedDishDetail}
          isOpen={Boolean(selectedDishDetail)}
          onClose={() => setSelectedDishDetail(null)}
          onAddToCart={addToCart}
        />

        {/* ── In-App Order Tracking Overlay ── */}
        {trackingOrderId && (
          <CustomerTrackOrder
            orderId={trackingOrderId}
            onClose={() => setTrackingOrderId(null)}
            onGoHome={() => {
              setTrackingOrderId(null);
              setActiveTab('home');
            }}
          />
        )}

        {/* ── Notification Drawer ── */}
        <CustomerNotificationDrawer
          isOpen={isNotifOpen}
          onClose={closeNotifications}
          notifications={notifications}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onTapNotification={(notif) => {
            closeNotifications();
            if (notif.orderId && notif.type?.startsWith('order_')) {
              setTrackingOrderId(notif.orderId);
            } else if (notif.type === 'reservation') {
              setActiveTab('reserve');
            }
          }}
        />

        {/* ── PWA Install Banner ── */}
        <CustomerPwaInstallModal />

      </div>
    </div>
  );
};

export default CustomerDashboard;
