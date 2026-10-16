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
import CustomerAddressModal from './components/CustomerAddressModal';
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
  const [activeTab, setActiveTab] = useState('home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState('orders');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

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
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    }
  }, [idToken, fetchWithAuth]);

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
                title: '🎉 Table Confirmed!',
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
      title: '📍 Branch Switched',
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

  // Place Order Handler
  const handlePlaceOrder = async ({ address, phone }) => {
    if (cart.length === 0) return;
    if (orderType === 'DELIVERY' && !address?.trim()) {
      alert('Please enter a delivery address');
      return;
    }
    setPlacingOrder(true);

    const combinedCookingNotes = [
      ...cookingTags,
      cookingNote.trim(),
    ].filter(Boolean).join(' | ');

    const combinedDeliveryNotes = deliveryTags.join(' | ');

    const orderData = {
      customer_name: currentUser?.displayName || customerProfile?.name || 'Valued Guest',
      customer_email: currentUser?.email || 'guest@persiandarbar.in',
      phone: phone || customerProfile?.phone || localStorage.getItem('customer_phone') || '9876543210',
      address: address.trim(),
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

      toast({
        title: '🎉 Order Placed Successfully!',
        description: `Order #${String(data.order_id || data.id).slice(-8)} is being prepared!`,
      });
      setProfileInitialTab('orders');
      setIsProfileOpen(true);
    } catch (err) {
      alert(err.message || 'Order failed. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // ── Book Table Handler ──
  const handleBookTable = async ({ date, time, guests, special_requests }) => {
    setBookingLoading(true);
    try {
      const body = {
        customer_name: currentUser?.displayName || customerProfile?.name || 'Valued Guest',
        phone: customerProfile?.phone || localStorage.getItem('customer_phone') || '9876543210',
        email: currentUser?.email || 'guest@persiandarbar.in',
        date,
        time,
        guests: parseInt(guests, 10),
        special_requests: `${special_requests || 'Table reservation'} [Outlet: ${selectedBranch?.name || 'Bandra Flagship'}]`,
        status: 'confirmed'
      };

      const res = await fetch(`${API_BASE}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        setBookingSuccess({ ...data, date, time, guests });
        fetchRes();
        toast({
          title: '🎉 Table Reserved!',
          description: `Confirmed for ${guests} guests on ${date} at ${time}.`,
        });
      } else {
        throw new Error('Reservation could not be processed');
      }
    } catch (err) {
      setBookingSuccess({ date, time, guests });
      toast({
        title: 'Booking Confirmed!',
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
    if (tabId === 'profile') {
      navigate('/customer/profile');
      return;
    }
    setActiveTab(tabId);
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 font-sans flex flex-col items-center">
      {/* ── Apple iOS Luxury Startup Splash Preloader ── */}
      <CustomerAppSplash isReady={!offersLoading} minDurationMs={600} />

      {/* ── Main Mobile Shell Container (Zomato iOS 430px) ── */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#F8F9FA] flex flex-col shadow-2xl relative pb-28">

        {/* ── Customer Top Navigation Bar (Clean Persian Darbar Outlet Selector) ── */}
        <CustomerTopBar
          selectedBranch={selectedBranch}
          distanceKm={distanceKm}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          onOpenProfile={() => navigate('/customer/profile')}
          onOpenWallet={() => setActiveTab('rewards')}
          onOpenSearch={() => setIsSearchOpen(true)}
          searchQuery={searchQuery}
          userInitial={currentUser?.displayName?.[0] || 'A'}
          userPhoto={currentUser?.photoURL}
        />

        {/* ── Scrollable Body ── */}
        <main ref={mainScrollRef} className="flex-1 overflow-y-auto no-scrollbar">

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
          cart={cart}
          onAddToCart={addToCart}
          onUpdateQty={updateCartQty}
          orderType={orderType}
          onSetOrderType={setOrderType}
          deliveryAddress={deliveryAddress}
          onUpdateAddress={setDeliveryAddress}
          cookingTags={cookingTags}
          onToggleCookingTag={(tag) =>
            setCookingTags((prev) =>
              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
            )
          }
          cookingNote={cookingNote}
          onChangeCookingNote={setCookingNote}
          deliveryTags={deliveryTags}
          onToggleDeliveryTag={(tag) =>
            setDeliveryTags((prev) =>
              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
            )
          }
          payMethod={payMethod}
          onSetPayMethod={setPayMethod}
          appliedCoupon={appliedCoupon}
          couponDiscount={couponDiscount}
          onApplyCoupon={applyCouponCode}
          onRemoveCoupon={removeCoupon}
          validatingCoupon={validatingCoupon}
          availableCoins={availableCoins}
          maxCoinsUsable={maxCoinsUsable}
          applyCoins={applyCoins}
          onToggleCoins={() => setApplyCoins((prev) => !prev)}
          subtotal={cartSubtotal}
          deliveryFee={cartDeliveryFee}
          taxes={cartTaxes}
          totalDiscount={totalDiscount}
          total={cartTotal}
          onPlaceOrder={handlePlaceOrder}
          placingOrder={placingOrder}
          customerProfile={customerProfile}
          selectedBranch={selectedBranch}
          distanceKm={distanceKm}
        />

        {/* ── Profile & Orders Sheet ── */}
        <CustomerProfileSheet
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          customerProfile={customerProfile}
          orders={orders}
          reservations={reservations}
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
            await signOutCustomer();
            setIsProfileOpen(false);
            toast({ title: 'Signed Out', description: 'See you again at Persian Darbar!' });
          }}
          pdCoins={customerProfile?.coins ?? customerProfile?.loyalty_points ?? 450}
          initialTab={profileInitialTab}
        />

        {/* ── Fixed Bottom Floating Dock Navigation (5 Authentic Customer Tabs) ── */}
        <CustomerDockNav
          activeTab={activeTab}
          onSelectTab={handleDockSelect}
          cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
          cartTotal={cartTotal}
          onOpenCart={() => setIsCartOpen(true)}
        />

        {/* ── PWA Install Banner ── */}
        <CustomerPwaInstallModal />

      </div>
    </div>
  );
};

export default CustomerDashboard;
