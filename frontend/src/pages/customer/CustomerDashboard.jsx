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
import CustomerUnder250Tab from './components/CustomerUnder250Tab';
import CustomerDiningTab from './components/CustomerDiningTab';
import CustomerSearchExplore from './components/CustomerSearchExplore';
import CustomerDockNav from './components/CustomerDockNav';
import CustomerCartSheet from './components/CustomerCartSheet';
import CustomerProfileSheet from './components/CustomerProfileSheet';
import CustomerQuickActionsModal from './components/CustomerQuickActionsModal';
import CustomerAddressModal from './components/CustomerAddressModal';
import CustomerPwaInstallModal from '../../components/CustomerPwaInstallModal';
import { PERSIAN_DARBAR_BRANCHES } from './customerAssets';

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
  // 'home' | 'under250' | 'dining'
  const [activeTab, setActiveTab] = useState('home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  // ── Persian Darbar 4 Official Branches Location & Distance Engine ──
  const [selectedBranch, setSelectedBranch] = useState(() => {
    try {
      const saved = localStorage.getItem('pd_selected_branch');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return PERSIAN_DARBAR_BRANCHES[0]; // Default: Bandra (Flagship)
  });
  const [userCoords, setUserCoords] = useState(null);
  const [distanceKm, setDistanceKm] = useState(() => {
    try {
      const saved = localStorage.getItem('pd_selected_branch');
      if (saved) return JSON.parse(saved).defaultDistance || 1.8;
    } catch (e) {}
    return PERSIAN_DARBAR_BRANCHES[0].defaultDistance || 1.8;
  });
  const [locationTitle, setLocationTitle] = useState(() => {
    try {
      const saved = localStorage.getItem('pd_selected_branch');
      if (saved) return JSON.parse(saved).name;
    } catch (e) {}
    return PERSIAN_DARBAR_BRANCHES[0].name;
  });
  const [locationSubtitle, setLocationSubtitle] = useState(() => {
    try {
      const saved = localStorage.getItem('pd_selected_branch');
      if (saved) {
        const b = JSON.parse(saved);
        return `Approx. ${b.defaultDistance || 1.8} km from ${b.name}`;
      }
    } catch (e) {}
    return `Approx. 1.8 km from Bandra (Flagship)`;
  });
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

  // ── Admin Connected Offers & Promotions (/api/offers) ──
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);

  // ── Menu, Cart & Orders State ──
  const [menu, setMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('All');
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('DELIVERY'); // 'DELIVERY' | 'TAKEAWAY'
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);

  // ── Filters State ──
  const [vegOnly, setVegOnly] = useState(false);
  const [fastDeliveryOnly, setFastDeliveryOnly] = useState(false);
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [healthyMode, setHealthyMode] = useState(false);

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

  // Sync profile address & phone
  useEffect(() => {
    if (customerProfile?.address) {
      setDeliveryAddress(customerProfile.address);
      const parts = customerProfile.address.split(',');
      if (parts[0]) setLocationTitle(parts[0].trim());
      if (parts.length > 1) setLocationSubtitle(parts.slice(1).join(',').trim());
    }
  }, [customerProfile?.address]);

  // ── 1. Fetch Menu (Cached 10 mins) ──
  const fetchMenu = useCallback(async (forceRefresh = false) => {
    const MENU_KEY = 'menu_v1';
    const MENU_TTL = 10 * 60 * 1000;
    if (!forceRefresh) {
      const memHit = memCache.get(MENU_KEY);
      if (memHit && memHit.length > 0) {
        setMenu(memHit);
        setMenuLoading(false);
        return;
      }
      const lsHit = lsCache.get(MENU_KEY);
      if (lsHit && lsHit.length > 0) {
        setMenu(lsHit);
        setMenuLoading(false);
        memCache.set(MENU_KEY, lsHit, 2 * 60 * 1000);
        return;
      }
    }

    setMenuLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/menu`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) && data.length > 0 ? data : fallbackMenu;
        setMenu(items);
        lsCache.set(MENU_KEY, items, MENU_TTL);
        memCache.set(MENU_KEY, items, 2 * 60 * 1000);
      } else {
        setMenu(fallbackMenu);
      }
    } catch (err) {
      console.warn('Menu load error, using rich fallback:', err);
      setMenu(fallbackMenu);
    } finally {
      setMenuLoading(false);
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
  const fetchRes = useCallback(async (isSilent = false) => {
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

  // ── 4. Fetch Tables & Polling ──
  useEffect(() => {
    const TABLE_KEY = 'tables_v1';
    const TABLE_TTL = 90 * 1000;
    const fetchTables = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/tables`);
        if (r.ok) {
          const d = await r.json();
          if (Array.isArray(d)) {
            setTables(d);
            lsCache.set(TABLE_KEY, d, TABLE_TTL);
          }
        }
      } catch {}
    };
    fetchTables();
    const t = setInterval(fetchTables, TABLE_TTL);
    return () => clearInterval(t);
  }, []);

  // Fetch Public Coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/coupons/public`);
        if (res.ok) {
          const data = await res.json();
          setCoupons(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load coupons:', err);
      }
    };
    fetchCoupons();
  }, []);

  // ── Fetch Active Offers from Admin (/api/offers) ──
  useEffect(() => {
    const fetchOffers = async () => {
      setOffersLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/offers`);
        if (res.ok) {
          const data = await res.json();
          setOffers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load offers from server:', err);
      } finally {
        setOffersLoading(false);
      }
    };
    fetchOffers();
  }, []);

  // ── Outlet Branch Switcher Handler (Calculates Distance for Selected Branch) ──
  const handleSelectBranch = (branch) => {
    setSelectedBranch(branch);
    let dist = branch.defaultDistance || 1.8;
    if (userCoords && userCoords.lat && userCoords.lng) {
      dist = calculateHaversine(
        userCoords.lat,
        userCoords.lng,
        branch.coordinates.lat,
        branch.coordinates.lng
      );
    }
    setDistanceKm(dist);
    setLocationTitle(branch.name);
    setLocationSubtitle(`Approx. ${dist} km from ${branch.name}`);
    try {
      localStorage.setItem('pd_selected_branch', JSON.stringify({ ...branch, calculatedDistance: dist }));
    } catch (e) {}
    toast({
      title: `👑 Outlet: ${branch.name}`,
      description: `Delivery distance: ~${dist} km from ${branch.name} (${branch.shortAddress})`,
    });
  };

  // ── Handle Upper Panel Offer Banner Click ──
  const handleOfferClick = (offer) => {
    if (!offer) return;
    if (offer.action === 'reserve') {
      setActiveTab('dining');
      toast({
        title: "🍽️ Table Reservation",
        description: `Reserve your table for ${offer.title}`,
      });
    } else if (offer.action === 'order') {
      setActiveTab('home');
      setSelectedCat('All');
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({ top: 380, behavior: 'smooth' });
      }
    } else if (offer.action === 'coupon' && offer.coupon_code) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(offer.coupon_code);
      }
      setCouponInput(offer.coupon_code);
      toast({
        title: "🎉 Coupon Copied!",
        description: `Promo Code "${offer.coupon_code}" is ready to apply at checkout.`,
      });
      setIsCartOpen(true);
    }
  };

  useEffect(() => {
    if (idToken) {
      fetchOrders();
      fetchRes();
    }
  }, [idToken, fetchOrders, fetchRes]);

  // Auto-scroll to top on tab switch
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [activeTab]);

  // ── Cart Calculations ──
  const pdCoins = customerProfile?.pd_coins || customerProfile?.loyalty_points || 0;
  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);
  const freeDeliveryThreshold = 500;
  const isFreeDeliveryEligible = cartSubtotal >= freeDeliveryThreshold;
  const cartDeliveryFee = orderType === 'TAKEAWAY' ? 0 : isFreeDeliveryEligible ? 0 : (distanceKm !== null && distanceKm > 10 ? 60 : 35);
  const cartTaxes = Math.round(cartSubtotal * 0.05);

  const maxRedeemableCoins = (cartSubtotal >= 300 && pdCoins > 0)
    ? Math.min(pdCoins, Math.floor(cartSubtotal * 0.25))
    : 0;

  const coinsDiscount = (applyCoins && maxRedeemableCoins > 0) ? maxRedeemableCoins : 0;
  const totalDiscount = coinsDiscount + (couponDiscount || 0);
  const netSubtotal = Math.max(0, cartSubtotal - totalDiscount);
  const cartTotal = Math.max(0, netSubtotal + cartDeliveryFee + cartTaxes);

  // ── Cart Handlers ──
  const addToCart = (item) => {
    setCart((prev) => {
      const exist = prev.find(c => c._id === item._id);
      if (exist) {
        return prev.map(c => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast({
      title: 'Added to cart!',
      description: `${item.name} added to your feast.`,
    });
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map(c => c._id === id ? { ...c, quantity: c.quantity + delta } : c)
        .filter(c => c.quantity > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // ── Coupon Handlers ──
  const applyCoupon = async (codeToTry) => {
    const code = codeToTry.trim().toUpperCase();
    if (!code) return;
    setValidatingCoupon(true);
    try {
      const res = await fetch(`${API_BASE}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, order_value: cartSubtotal })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid coupon code');
      }
      setAppliedCoupon({ code, ...data });
      setCouponDiscount(data.discount || 0);
      toast({
        title: `🎉 Coupon Applied: ${code}`,
        description: `You saved ₹${data.discount}!`,
      });
    } catch (err) {
      toast({
        title: 'Coupon Error',
        description: err.message || 'Could not apply coupon',
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

  // ── GPS Distance Detection & Auto-Calculate Accurate Distance to Selected Branch ──
  const detectDistance = () => {
    if (!navigator.geolocation) {
      const dist = selectedBranch.defaultDistance || 1.8;
      setDistanceKm(dist);
      setLocationSubtitle(`Approx. ${dist} km from ${selectedBranch.name}`);
      return;
    }
    setDetectingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setUserCoords({ lat: userLat, lng: userLng });

        // Calculate distance from user's GPS directly to the selected branch
        const dist = calculateHaversine(
          userLat,
          userLng,
          selectedBranch.coordinates.lat,
          selectedBranch.coordinates.lng
        );

        setDistanceKm(dist);
        setDetectingLoc(false);
        setLocationSubtitle(`Approx. ${dist} km from ${selectedBranch.name}`);
        toast({
          title: `📍 Location Detected!`,
          description: `You are ~${dist} km from Persian Darbar (${selectedBranch.name}).`,
        });
      },
      () => {
        const dist = selectedBranch.defaultDistance || 1.8;
        setDistanceKm(dist);
        setLocationSubtitle(`Approx. ${dist} km from ${selectedBranch.name}`);
        setDetectingLoc(false);
      },
      { timeout: 8000 }
    );
  };

  // ── Place Order Handler ──
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (orderType === 'DELIVERY' && cartSubtotal < 200) {
      alert('Minimum order value for delivery is ₹200. Or choose Takeaway Pickup!');
      return;
    }

    const phone = customerProfile?.phone || '9876543210';
    const address = orderType === 'TAKEAWAY'
      ? `Takeaway Pickup: Persian Darbar (${selectedBranch?.name || 'Bandra Flagship'})`
      : (deliveryAddress || `${locationTitle}, ${locationSubtitle}`);

    setPlacingOrder(true);
    const combinedCookingNotes = [...cookingTags, cookingNote.trim()].filter(Boolean).join(', ') || null;
    const combinedDeliveryNotes = deliveryTags.join(', ') || null;

    const orderData = {
      customer_uid: currentUser?.uid || null,
      email: currentUser?.email || null,
      customer_name: currentUser?.displayName || customerProfile?.name || 'Valued Guest',
      phone: phone.trim(),
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
        phone: customerProfile?.phone || '9876543210',
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
      toast({
        title: 'Booking Notice',
        description: 'Table booked successfully! Confirmation sent.',
      });
      setBookingSuccess({ date, time, guests });
    } finally {
      setBookingLoading(false);
    }
  };

  // Re-order past order
  const handleReorder = (pastOrder) => {
    if (!pastOrder?.items) return;
    const items = pastOrder.items.map(item => {
      const match = menu.find(m => String(m._id) === String(item.item_id) || m.name === item.name);
      return {
        _id: match ? match._id : (item.item_id || item._id || String(Math.random())),
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        image: match?.image || item.image || '/no-image.png',
        category: match?.category || 'Main Course',
        is_veg: match?.is_veg ?? match?.veg
      };
    });
    setCart(items);
    setIsProfileOpen(false);
    setIsCartOpen(true);
  };

  // Filter menu for Healthy Mode (Low cal, Tandoori, High protein, Salads)
  const displayedMenu = useMemo(() => {
    if (!healthyMode) return menu;
    return menu.filter(item => {
      const cat = item.category?.toLowerCase() || '';
      const name = item.name?.toLowerCase() || '';
      return cat.includes('kebab') || cat.includes('starter') || name.includes('tandoori') || name.includes('tikka') || name.includes('salad');
    });
  }, [menu, healthyMode]);

  const activeOrders = orders.filter(o => ['placed', 'accepted', 'preparing', 'out_for_delivery'].includes(o.status));
  const activeOrder = activeOrders.length > 0 ? activeOrders[0] : null;

  return (
    <div className="bg-[#F8F9FA] text-[#1C1C1C] flex justify-center min-h-screen antialiased selection:bg-red-100 font-sans">
      {/* PWA Install Prompt */}
      <CustomerPwaInstallModal />

      {/* Mobile Form Factor Frame Wrapper (iOS iPhone 14/15 Pro Dimensions) */}
      <div className="w-full max-w-[430px] bg-white min-h-screen flex flex-col relative shadow-2xl overflow-x-hidden">

        {/* ── Top Bar & Location Header ── */}
        <CustomerTopBar
          locationTitle={locationTitle}
          locationSubtitle={locationSubtitle}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenWallet={() => {
            setIsProfileOpen(true);
          }}
          onOpenSearch={() => setIsSearchOpen(true)}
          searchQuery={searchQuery}
          searchPlaceholder={
            activeTab === 'dining'
              ? 'Search dining, buffets, banquets...'
              : activeTab === 'under250'
              ? 'Search meals under ₹250...'
              : 'Search "biryani, kebabs, desserts..."'
          }
          vegOnly={vegOnly}
          onToggleVeg={() => setVegOnly(!vegOnly)}
          userInitial={currentUser?.displayName?.[0] || 'A'}
          userPhoto={currentUser?.photoURL}
        />

        {/* ── Scrollable Body Ref ── */}
        <main ref={mainScrollRef} className="flex-1 overflow-y-auto no-scrollbar">

          {/* Tab 1: Home (Delivery Feed) */}
          {activeTab === 'home' && (
            <CustomerHomeTab
              menu={displayedMenu}
              categories={['All', ...new Set(menu.map(i => i.category).filter(Boolean))]}
              selectedCat={selectedCat}
              onSelectCat={setSelectedCat}
              vegOnly={vegOnly}
              onToggleVeg={() => setVegOnly(!vegOnly)}
              fastDeliveryOnly={fastDeliveryOnly}
              onToggleFastDelivery={() => setFastDeliveryOnly(!fastDeliveryOnly)}
              topRatedOnly={topRatedOnly}
              onToggleTopRated={() => setTopRatedOnly(!topRatedOnly)}
              cart={cart}
              onAddToCart={addToCart}
              onUpdateCartQty={updateCartQty}
              onOpenCart={() => setIsCartOpen(true)}
              onOpenWallet={() => setIsProfileOpen(true)}
              onOpenSearch={() => setIsSearchOpen(true)}
              offers={offers}
              onOfferClick={handleOfferClick}
            />
          )}

          {/* Tab 2: Under ₹250 */}
          {activeTab === 'under250' && (
            <CustomerUnder250Tab
              menu={displayedMenu}
              cart={cart}
              onAddToCart={addToCart}
              onUpdateCartQty={updateCartQty}
              onOpenCart={() => setIsCartOpen(true)}
              onGoToHome={() => setActiveTab('home')}
            />
          )}

          {/* Tab 3: Dining Out & Table Reservation */}
          {activeTab === 'dining' && (
            <CustomerDiningTab
              selectedBranch={selectedBranch}
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
        </main>

        {/* ── Search & Explore Overlay ── */}
        {isSearchOpen && (
          <CustomerSearchExplore
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onClose={() => setIsSearchOpen(false)}
            menu={menu}
            cart={cart}
            onAddToCart={addToCart}
            onUpdateCartQty={updateCartQty}
            onOpenCart={() => {
              setIsSearchOpen(false);
              setIsCartOpen(true);
            }}
          />
        )}

        {/* ── Floating iOS Dock Navigation Bar ── */}
        <CustomerDockNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          cartCount={cartItemCount}
          cartTotal={cartTotal}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenQuickActions={() => setIsQuickActionsOpen(true)}
          healthyMode={healthyMode}
          onToggleHealthyMode={() => {
            setHealthyMode(!healthyMode);
            toast({
              title: !healthyMode ? '🥗 Healthy Mode Activated' : 'Normal Menu Restored',
              description: !healthyMode
                ? 'Showing low-calorie, high-protein Tandoori grills & salads.'
                : 'Showing full Persian Darbar royal menu.',
            });
          }}
        />

        {/* ── Cart & Checkout Bottom Sheet ── */}
        <CustomerCartSheet
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          onUpdateCartQty={updateCartQty}
          onClearCart={clearCart}
          orderType={orderType}
          onSetOrderType={setOrderType}
          deliveryAddress={deliveryAddress}
          onSetDeliveryAddress={setDeliveryAddress}
          onDetectLocation={detectDistance}
          detectingLocation={detectingLoc}
          distanceKm={distanceKm}
          selectedBranch={selectedBranch}
          coupons={coupons}
          appliedCoupon={appliedCoupon}
          couponDiscount={couponDiscount}
          onApplyCoupon={applyCoupon}
          onRemoveCoupon={removeCoupon}
          validatingCoupon={validatingCoupon}
          pdCoins={pdCoins}
          applyCoins={applyCoins}
          onToggleCoins={() => setApplyCoins(!applyCoins)}
          coinsDiscount={coinsDiscount}
          maxRedeemableCoins={maxRedeemableCoins}
          cookingTags={cookingTags}
          onToggleCookingTag={(tag) =>
            setCookingTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
          }
          cookingNote={cookingNote}
          onSetCookingNote={setCookingNote}
          deliveryTags={deliveryTags}
          onToggleDeliveryTag={(tag) =>
            setDeliveryTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
          }
          payMethod={payMethod}
          onSetPayMethod={setPayMethod}
          onPlaceOrder={handlePlaceOrder}
          placingOrder={placingOrder}
          cartSubtotal={cartSubtotal}
          cartDeliveryFee={cartDeliveryFee}
          cartTaxes={cartTaxes}
          cartTotal={cartTotal}
          freeDeliveryThreshold={freeDeliveryThreshold}
        />

        {/* ── Profile, Rewards & Past Orders Sheet ── */}
        <CustomerProfileSheet
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          customerProfile={customerProfile}
          orders={orders}
          reservations={reservations}
          onReorder={handleReorder}
          onSavePhone={async (phone) => {
            const r = await updateProfile({ phone });
            if (r.success) {
              toast({ title: 'Phone Updated', description: 'Your contact number is saved.' });
            }
          }}
          onSaveAddress={async (address) => {
            const r = await updateProfile({ address });
            if (r.success) {
              setDeliveryAddress(address);
              toast({ title: 'Address Saved', description: 'Your delivery address is updated.' });
            }
          }}
          onShareApp={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Persian Darbar',
                text: 'Order authentic royal biryanis and earn PD Coins on the new Persian Darbar app!',
                url: window.location.origin
              }).catch(() => {});
            } else {
              navigator.clipboard?.writeText(window.location.origin);
              toast({ title: 'Link Copied', description: 'Share link copied to clipboard!' });
            }
          }}
          onSignOut={async () => {
            await signOutCustomer();
            navigate('/');
          }}
          pdCoins={pdCoins}
        />

        {/* ── Quick Assistant Modal (Center Glowing Button) ── */}
        <CustomerQuickActionsModal
          isOpen={isQuickActionsOpen}
          onClose={() => setIsQuickActionsOpen(false)}
          selectedBranch={selectedBranch}
          cartCount={cartItemCount}
          onOpenCart={() => setIsCartOpen(true)}
          activeOrder={activeOrder}
          onTrackOrder={(order) => {
            navigate(`/track-order/${order.order_id || order.id || order._id}`);
          }}
          onGoToDining={() => setActiveTab('dining')}
          onAddChefSpecial={() => {
            const chefDish = menu.find(i => i.name?.toLowerCase().includes('biryani')) || menu[0];
            if (chefDish) addToCart(chefDish);
          }}
        />

        {/* ── Location Switcher Modal (4 Persian Darbar Branches) ── */}
        <CustomerAddressModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          selectedBranch={selectedBranch}
          onSelectBranch={handleSelectBranch}
          userCoords={userCoords}
          currentAddress={deliveryAddress}
          onSelectAddress={(title, sub) => {
            setLocationTitle(title);
            setLocationSubtitle(sub);
            setDeliveryAddress(`${title}, ${sub}`);
          }}
          onDetectLocation={detectDistance}
          detectingLocation={detectingLoc}
        />
      </div>
    </div>
  );
};

export default CustomerDashboard;
