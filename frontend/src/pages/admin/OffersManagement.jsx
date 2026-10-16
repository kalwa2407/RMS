import React, { useState, useEffect } from "react";
import {
  Tag, ToggleLeft, ToggleRight, Plus, Trash2, Edit2,
  Save, X, Image as ImageIcon, Calendar, Sparkles,
  Eye, EyeOff, AlertTriangle, ArrowUp, ArrowDown,
  CheckCircle, Smartphone, ExternalLink, RefreshCw,
  Percent, Check, Zap
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import API_BASE from "../../lib/config";

const PRESET_BANNERS = [
  {
    name: "Royal Feast Weekend",
    url: "/dynamic_images/offer_royal_feast.jpg",
    badge: "WEEKEND SPECIAL",
    title: "Royal Feast Weekend",
    subtitle: "UP TO 30% OFF + 2X PD Coins",
    action: "order",
    gradient: "linear-gradient(135deg, #1a0a2e 0%, #0d0518 100%)",
  },
  {
    name: "Double PD Coins",
    url: "/dynamic_images/offer_double_coins.jpg",
    badge: "2X COINS",
    title: "Double PD Coins",
    subtitle: "Earn 2X on every order this weekend!",
    action: "order",
    gradient: "linear-gradient(135deg, #0a1628 0%, #061020 100%)",
  },
  {
    name: "Festive Feast",
    url: "/dynamic_images/offer_festive_feast.jpg",
    badge: "FESTIVE",
    title: "Festive Feast Celebration",
    subtitle: "Celebrate with Royal Persian Flavours",
    action: "reserve",
    gradient: "linear-gradient(135deg, #3d0c1e 0%, #1a0610 100%)",
  },
];

const OffersManagement = () => {
  const { toast } = useToast();
  const [offers, setOffers] = useState([]);
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingMaster, setSavingMaster] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    badge_text: "SPECIAL OFFER",
    type: "banner",
    active: true,
    bg_gradient: "linear-gradient(135deg, #1a0a2e 0%, #0d0518 100%)",
    accent_color: "#EAB308",
    image_url: "/dynamic_images/offer_royal_feast.jpg",
    action: "order",
    coupon_code: "",
    description: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  });

  const token = localStorage.getItem("admin_token");

  // ── Coupons & Promo Codes Section State ──
  const [activeSection, setActiveSection] = useState("coupons"); // 'coupons' | 'banners'
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponFormData, setCouponFormData] = useState({
    code: "",
    discount_type: "flat",
    discount_value: 199,
    min_order_value: 500,
    max_discount: "",
    description: "",
    active: true,
  });

  const COUPON_PRESETS = [
    {
      label: "Flat ₹199 OFF on Orders > ₹500",
      code: "FLAT199",
      discount_type: "flat",
      discount_value: 199,
      min_order_value: 500,
      description: "Flat ₹199 OFF on royal orders above ₹500",
    },
    {
      label: "Flat ₹100 OFF on Orders > ₹399",
      code: "DARBAR100",
      discount_type: "flat",
      discount_value: 100,
      min_order_value: 399,
      description: "Flat ₹100 OFF on orders above ₹399",
    },
    {
      label: "Flat ₹50 OFF on Orders > ₹250",
      code: "DARBAR50",
      discount_type: "flat",
      discount_value: 50,
      min_order_value: 250,
      description: "Flat ₹50 OFF on orders above ₹250",
    },
    {
      label: "30% OFF up to ₹150 on Orders > ₹400",
      code: "ROYAL30",
      discount_type: "percentage",
      discount_value: 30,
      max_discount: 150,
      min_order_value: 400,
      description: "30% OFF up to ₹150 on royal feasts above ₹400",
    },
  ];

  useEffect(() => {
    fetchOffers();
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setCouponsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn("Error fetching coupons:", err);
    } finally {
      setCouponsLoading(false);
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponFormData.code.trim()) {
      toast({ title: "Coupon code is required", variant: "destructive" });
      return;
    }
    const payload = {
      code: couponFormData.code.trim().toUpperCase(),
      discount_type: couponFormData.discount_type,
      discount_value: parseFloat(couponFormData.discount_value) || 0,
      min_order_value: parseFloat(couponFormData.min_order_value) || 0,
      max_discount: couponFormData.max_discount ? parseFloat(couponFormData.max_discount) : null,
      description: couponFormData.description.trim() || undefined,
      active: couponFormData.active,
    };

    try {
      let res;
      if (editingCoupon) {
        const cid = editingCoupon.id || editingCoupon._id;
        res = await fetch(`${API_BASE}/api/admin/coupons/${cid}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/api/admin/coupons`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast({
          title: editingCoupon ? "Coupon Updated" : "Coupon Created Successfully",
          description: `Code ${payload.code} is now ready for customers.`,
        });
        setShowCouponModal(false);
        fetchCoupons();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({
          title: "Failed to save coupon",
          description: err.detail || "Server error",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Network error saving coupon", variant: "destructive" });
    }
  };

  const handleToggleCoupon = async (coupon) => {
    const cid = coupon.id || coupon._id;
    try {
      const res = await fetch(`${API_BASE}/api/admin/coupons/${cid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !coupon.active }),
      });
      if (res.ok) {
        setCoupons(prev => prev.map(c => (c.id === cid || c._id === cid) ? { ...c, active: !c.active } : c));
        toast({ title: !coupon.active ? "Coupon Activated" : "Coupon Paused" });
      }
    } catch {
      toast({ title: "Failed to toggle status", variant: "destructive" });
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm("Are you sure you want to delete this coupon code?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/coupons/${couponId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.id !== couponId && c._id !== couponId));
        toast({ title: "Coupon deleted" });
      }
    } catch {
      toast({ title: "Failed to delete coupon", variant: "destructive" });
    }
  };

  const openCouponModalWithPreset = (preset) => {
    setEditingCoupon(null);
    setCouponFormData({
      code: preset.code || "",
      discount_type: preset.discount_type || "flat",
      discount_value: preset.discount_value || 199,
      min_order_value: preset.min_order_value || 500,
      max_discount: preset.max_discount || "",
      description: preset.description || "",
      active: true,
    });
    setShowCouponModal(true);
  };

  const openEditCouponModal = (coupon) => {
    setEditingCoupon(coupon);
    setCouponFormData({
      code: coupon.code || "",
      discount_type: coupon.discount_type || "flat",
      discount_value: coupon.discount_value || 0,
      min_order_value: coupon.min_order_value || 0,
      max_discount: coupon.max_discount || "",
      description: coupon.description || "",
      active: coupon.active ?? true,
    });
    setShowCouponModal(true);
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/offers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOffers(data.offers || []);
        setMasterEnabled(data.master_enabled ?? true);
      } else {
        toast({ title: "Failed to load offers", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Network error loading offers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleMasterToggle = async () => {
    const nextState = !masterEnabled;
    setSavingMaster(true);
    const currentToken = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${API_BASE}/api/admin/offers/master-toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
        body: JSON.stringify({ enabled: nextState }),
      });
      if (res.ok) {
        setMasterEnabled(nextState);
        toast({
          title: nextState ? "Offers Enabled on App" : "Offers Disabled on App",
          description: nextState
            ? "Offer banners are now visible on the customer app home screen."
            : "Customer app will now show the default Persian Darbar welcome screen.",
        });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({
          title: "Failed to update master switch",
          description: data.detail || `Server error (${res.status})`,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({ title: "Failed to update master switch", description: err.message || "Network error", variant: "destructive" });
    } finally {
      setSavingMaster(false);
    }
  };

  const handleToggleOfferActive = async (offer) => {
    const updated = { ...offer, active: !offer.active };
    const currentToken = localStorage.getItem("admin_token") || token;
    try {
      const res = await fetch(`${API_BASE}/api/admin/offers/${offer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
        body: JSON.stringify({ active: updated.active }),
      });
      if (res.ok) {
        setOffers((prev) =>
          prev.map((o) => (o.id === offer.id ? { ...o, active: updated.active } : o))
        );
        toast({
          title: updated.active ? "Offer Activated" : "Offer Deactivated",
          description: `"${offer.title}" is now ${updated.active ? "visible" : "hidden"}.`,
        });
      }
    } catch {
      toast({ title: "Error updating offer", variant: "destructive" });
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/offers/${offerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOffers((prev) => prev.filter((o) => o.id !== offerId));
        toast({ title: "Offer deleted successfully" });
      }
    } catch {
      toast({ title: "Error deleting offer", variant: "destructive" });
    }
  };

  const handleMoveOrder = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= offers.length) return;

    const newOffers = [...offers];
    const [moved] = newOffers.splice(index, 1);
    newOffers.splice(targetIdx, 0, moved);

    // update sort_orders
    newOffers.forEach((o, i) => (o.sort_order = i + 1));
    setOffers(newOffers);

    // persist
    try {
      await Promise.all(
        newOffers.map((o) =>
          fetch(`${API_BASE}/api/admin/offers/${o.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ sort_order: o.sort_order }),
          })
        )
      );
    } catch {
      // non-fatal
    }
  };

  const openCreateModal = () => {
    setEditingOffer(null);
    setFormData({
      title: "",
      subtitle: "",
      badge_text: "SPECIAL OFFER",
      type: "banner",
      active: true,
      bg_gradient: "linear-gradient(135deg, #1a0a2e 0%, #0d0518 100%)",
      accent_color: "#EAB308",
      image_url: "/dynamic_images/offer_royal_feast.jpg",
      action: "order",
      coupon_code: "",
      description: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const openEditModal = (offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title || "",
      subtitle: offer.subtitle || "",
      badge_text: offer.badge_text || "OFFER",
      type: offer.type || "banner",
      active: offer.active ?? true,
      bg_gradient: offer.bg_gradient || "linear-gradient(135deg, #1a0a2e 0%, #0d0518 100%)",
      accent_color: offer.accent_color || "#EAB308",
      image_url: offer.image_url || "/dynamic_images/offer_royal_feast.jpg",
      action: offer.action || "order",
      coupon_code: offer.coupon_code || "",
      description: offer.description || "",
      start_date: offer.start_date || new Date().toISOString().split("T")[0],
      end_date: offer.end_date || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    try {
      if (editingOffer) {
        // PUT
        const res = await fetch(`${API_BASE}/api/admin/offers/${editingOffer.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const updated = await res.json();
          setOffers((prev) => prev.map((o) => (o.id === editingOffer.id ? updated : o)));
          toast({ title: "Offer updated successfully" });
          setShowModal(false);
        }
      } else {
        // POST
        const res = await fetch(`${API_BASE}/api/admin/offers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const created = await res.json();
          setOffers((prev) => [...prev, created]);
          toast({ title: "New offer created!" });
          setShowModal(false);
        }
      }
    } catch {
      toast({ title: "Failed to save offer", variant: "destructive" });
    }
  };

  const activeOffersCount = offers.filter((o) => o.active).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-8 h-8 text-[#EAB308]" />
            <h1 className="text-3xl font-extrabold text-white tracking-wide">
              Offers & Promotions
            </h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Manage promotional banners, discounts, and animated graffiti shown on the Customer App.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeSection === "coupons") fetchCoupons();
              else fetchOffers();
            }}
            className="p-2.5 rounded-xl bg-[#0f2933] border border-white/10 text-gray-300 hover:text-white hover:bg-[#1a4855] transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {activeSection === "coupons" ? (
            <button
              onClick={() => {
                setEditingCoupon(null);
                setCouponFormData({
                  code: "",
                  discount_type: "flat",
                  discount_value: 199,
                  min_order_value: 500,
                  max_discount: "",
                  description: "",
                  active: true,
                });
                setShowCouponModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition"
            >
              <Plus className="w-4 h-4" /> Create Coupon Code
            </button>
          ) : (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EAB308] hover:bg-[#ca9a04] text-black font-bold text-sm shadow-lg shadow-[#EAB308]/20 transition"
            >
              <Plus className="w-4 h-4" /> Add New Offer
            </button>
          )}
        </div>
      </div>

      {/* ── SECTION TABS SWITCHER: COUPONS VS BANNERS ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d2229]/80 p-2 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection("coupons")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeSection === "coupons"
                ? "bg-[#EAB308] text-black shadow-lg shadow-[#EAB308]/20 font-black"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Discount Promo Codes & Coupons</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
              activeSection === "coupons" ? "bg-black/20 text-black" : "bg-[#EAB308]/20 text-[#EAB308]"
            }`}>
              {coupons.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection("banners")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeSection === "banners"
                ? "bg-[#EAB308] text-black shadow-lg shadow-[#EAB308]/20 font-black"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Home Carousel Banners</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
              activeSection === "banners" ? "bg-black/20 text-black" : "bg-white/10 text-gray-300"
            }`}>
              {offers.length}
            </span>
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: PROMO COUPONS & CODES DASHBOARD ── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeSection === "coupons" && (
        <div className="space-y-6">
          {/* Quick Presets Banner */}
          <div className="bg-[#0d2229] border border-[#EAB308]/30 rounded-2xl p-4 space-y-2.5 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#EAB308] uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Quick Rule Presets (Click to Auto-Create)
              </span>
              <span className="text-[11px] text-gray-400">
                Instantly generates active promo rules for checkout
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {COUPON_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => openCouponModalWithPreset(p)}
                  className="p-3 rounded-xl bg-[#0a1e26] hover:bg-[#122e38] border border-white/10 hover:border-[#EAB308]/50 text-left transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm font-black text-[#EAB308] group-hover:scale-105 transition-transform">
                      {p.code}
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md font-bold">
                      {p.discount_type === 'flat' ? `₹${p.discount_value} OFF` : `${p.discount_value}% OFF`}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 font-medium leading-tight">
                    Min Order: ₹{p.min_order_value}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Coupons List Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Active Coupon Codes</span>
              <span className="text-xs bg-[#EAB308]/20 text-[#EAB308] px-2.5 py-0.5 rounded-full font-bold">
                {coupons.length} codes live
              </span>
            </h3>
            <button
              onClick={fetchCoupons}
              className="text-xs text-gray-400 hover:text-[#EAB308] flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {/* Coupons Grid */}
          {couponsLoading ? (
            <div className="p-12 text-center text-gray-400 bg-[#0f2933]/50 rounded-2xl border border-white/5">
              <div className="w-8 h-8 border-2 border-[#EAB308] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading coupon codes...
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center bg-[#0f2933]/40 rounded-2xl border border-dashed border-white/10 space-y-3">
              <Tag className="w-10 h-10 text-gray-500 mx-auto" />
              <p className="text-gray-300 font-medium">No coupon codes created yet</p>
              <button
                onClick={() => {
                  setEditingCoupon(null);
                  openCouponModalWithPreset(COUPON_PRESETS[0]);
                }}
                className="px-4 py-2 bg-[#EAB308] text-black font-bold rounded-xl text-sm"
              >
                Create Flat ₹199 OFF Code
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((coupon) => {
                const cid = coupon.id || coupon._id;
                const isFlat = coupon.discount_type === "flat";
                return (
                  <div
                    key={cid}
                    className={`rounded-2xl border p-5 transition-all space-y-3 relative overflow-hidden ${
                      coupon.active
                        ? "bg-[#0d2229] border-[#EAB308]/30 shadow-lg shadow-black/40 hover:border-[#EAB308]/60"
                        : "bg-[#08151a] border-white/5 opacity-60 hover:opacity-90"
                    }`}
                  >
                    {/* Header Row: Code & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-base font-black tracking-wider text-white bg-black/40 px-2.5 py-1 rounded-lg border border-amber-400/40">
                          {coupon.code}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isFlat ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {isFlat ? 'FLAT OFF' : '% OFF'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleCoupon(coupon)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                          coupon.active
                            ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/40"
                            : "bg-gray-800 text-gray-400 border-white/10"
                        }`}
                      >
                        {coupon.active ? "LIVE" : "PAUSED"}
                      </button>
                    </div>

                    {/* Discount Summary Banner */}
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400 block font-medium">Discount</span>
                        <span className="text-sm font-black text-[#EAB308]">
                          {isFlat ? `₹${coupon.discount_value} OFF` : `${coupon.discount_value}% OFF`}
                          {coupon.max_discount ? ` (Max ₹${coupon.max_discount})` : ''}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block font-medium">Min Order</span>
                        <span className="text-sm font-black text-white">
                          ₹{coupon.min_order_value || 0}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-300 leading-snug">
                      {coupon.description || `Applicable on orders above ₹${coupon.min_order_value || 0}`}
                    </p>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <button
                        onClick={() => openEditCouponModal(coupon)}
                        className="text-gray-300 hover:text-[#EAB308] flex items-center gap-1 font-bold"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Rule
                      </button>

                      <button
                        onClick={() => handleDeleteCoupon(cid)}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1 font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: HOME CAROUSEL BANNERS ── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeSection === "banners" && (
        <>
      {/* ── MASTER TOGGLE HERO CARD ── */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${
          masterEnabled
            ? "bg-gradient-to-r from-emerald-950/60 via-[#0d2229] to-[#0f2933] border-emerald-500/40 shadow-xl shadow-emerald-950/20"
            : "bg-gradient-to-r from-red-950/40 via-[#0d2229] to-[#0f2933] border-red-500/30 shadow-xl shadow-red-950/20"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                masterEnabled
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-red-500/20 border-red-500/40 text-red-400"
              }`}
            >
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">
                  Customer App Offers Banner
                </h2>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase border ${
                    masterEnabled
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-red-500/20 text-red-300 border-red-500/40"
                  }`}
                >
                  {masterEnabled ? "● LIVE ON APP" : "○ DISABLED / DEFAULT SCREEN"}
                </span>
              </div>
              <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
                {masterEnabled ? (
                  <>
                    Offers carousel is <strong>ENABLED</strong> on the Customer App. Users will see animated Persian Darbar banners at the top of the home screen ({activeOffersCount} active).
                  </>
                ) : (
                  <>
                    Offers carousel is <strong>DISABLED</strong>. The Customer App will display the clean, classic welcome screen ("More than a meal, a tradition") with no banners.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Big Master Switch */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleMasterToggle}
              disabled={savingMaster}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg border ${
                masterEnabled
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-900/40"
                  : "bg-red-700/80 hover:bg-red-600 text-white border-red-400 shadow-red-900/40"
              }`}
            >
              {masterEnabled ? (
                <>
                  <ToggleRight className="w-6 h-6 text-white" />
                  <span>MASTER TOGGLE: ON</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-6 h-6 text-white/80" />
                  <span>MASTER TOGGLE: OFF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── OFFERS LIST SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Offer Cards List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>All Offers</span>
              <span className="text-xs bg-[#EAB308]/20 text-[#EAB308] px-2.5 py-0.5 rounded-full font-bold">
                {offers.length} total
              </span>
            </h3>
            <span className="text-xs text-gray-400">
              Drag or use arrows to reorder display sequence
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400 bg-[#0f2933]/50 rounded-2xl border border-white/5">
              <div className="w-8 h-8 border-2 border-[#EAB308] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading offers...
            </div>
          ) : offers.length === 0 ? (
            <div className="p-12 text-center bg-[#0f2933]/40 rounded-2xl border border-dashed border-white/10 space-y-3">
              <Tag className="w-10 h-10 text-gray-500 mx-auto" />
              <p className="text-gray-300 font-medium">No offers created yet</p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-[#EAB308] text-black font-bold rounded-xl text-sm"
              >
                Create First Offer
              </button>
            </div>
          ) : (
            offers.map((offer, index) => (
              <div
                key={offer.id || index}
                className={`group rounded-2xl border transition-all duration-200 overflow-hidden ${
                  offer.active
                    ? "bg-[#0d2229] border-[#EAB308]/30 hover:border-[#EAB308]/60 shadow-lg shadow-black/40"
                    : "bg-[#0a181d] border-white/5 opacity-70 hover:opacity-90"
                }`}
              >
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Banner Image Preview */}
                  <div className="relative w-full sm:w-44 h-28 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10">
                    <img
                      src={offer.image_url}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = "/dynamic_images/offer_royal_feast.jpg";
                      }}
                    />
                    {offer.badge_text && (
                      <span className="absolute top-2 left-2 bg-[#EAB308] text-black text-[10px] font-black px-2 py-0.5 rounded shadow">
                        {offer.badge_text}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-white font-bold text-base truncate">
                        {offer.title}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          offer.active
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-gray-500/15 text-gray-400 border-gray-500/30"
                        }`}
                      >
                        {offer.active ? "Active" : "Inactive"}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                        Action: {offer.action || "order"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-300 font-medium">
                      {offer.subtitle}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#EAB308]" />
                        {offer.start_date || "Anytime"} → {offer.end_date || "Forever"}
                      </span>
                      {offer.coupon_code && (
                        <span className="font-mono text-[#EAB308] bg-[#EAB308]/10 px-2 py-0.5 rounded">
                          CODE: {offer.coupon_code}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex sm:flex-col items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggleOfferActive(offer)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                        offer.active
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400"
                          : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-white/10"
                      }`}
                    >
                      {offer.active ? (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Inactive
                        </>
                      )}
                    </button>

                    {/* Order buttons + Edit + Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveOrder(index, -1)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-20"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(index, 1)}
                        disabled={index === offers.length - 1}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-20"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(offer)}
                        className="p-1.5 rounded-lg bg-[#EAB308]/20 hover:bg-[#EAB308]/30 text-[#EAB308]"
                        title="Edit Offer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                        title="Delete Offer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Live Customer App Mobile Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Smartphone className="w-5 h-5 text-[#EAB308]" />
            <h3 className="text-lg font-bold text-white">Live Customer App Preview</h3>
          </div>

          <div className="bg-[#050f13] border-4 border-gray-800 rounded-[36px] p-3 max-w-sm mx-auto shadow-2xl relative overflow-hidden">
            {/* Phone Notch */}
            <div className="w-28 h-4 bg-gray-800 rounded-b-xl mx-auto mb-2" />

            {/* In-app Status */}
            <div className="text-[10px] text-gray-400 flex justify-between px-2 mb-2 font-mono">
              <span>9:41</span>
              <span>Persian Darbar</span>
              <span>100% 🔋</span>
            </div>

            {/* App Header */}
            <div className="bg-[#0a1e24] p-3 rounded-2xl mb-3 flex items-center justify-between border border-white/5">
              <div>
                <p className="text-[11px] text-[#EAB308] font-bold">PERSIAN DARBAR</p>
                <p className="text-[13px] text-white font-black">Royal Customer</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#EAB308]/20 border border-[#EAB308]/40 flex items-center justify-center text-[#EAB308] text-xs font-bold">
                👑
              </div>
            </div>

            {/* Offer Banner Area */}
            {masterEnabled && offers.filter((o) => o.active).length > 0 ? (
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#EAB308] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Special Offers
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {offers.filter((o) => o.active).length} offers live
                  </span>
                </div>

                {/* Top active banner preview */}
                {(() => {
                  const top = offers.find((o) => o.active) || offers[0];
                  return (
                    <div className="relative rounded-2xl overflow-hidden border border-[#EAB308]/40 shadow-lg group">
                      <img
                        src={top.image_url}
                        alt="Preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          e.target.src = "/dynamic_images/offer_royal_feast.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-3 flex flex-col justify-end">
                        <span className="bg-[#EAB308] text-black text-[9px] font-black px-1.5 py-0.5 rounded w-max mb-1">
                          {top.badge_text || "SPECIAL"}
                        </span>
                        <p className="text-white font-bold text-xs leading-tight">
                          {top.title}
                        </p>
                        <p className="text-[#EAB308] text-[10px] font-semibold">
                          {top.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Dot indicators */}
                <div className="flex justify-center gap-1 pt-1">
                  {offers
                    .filter((o) => o.active)
                    .map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full ${
                          i === 0 ? "w-4 bg-[#EAB308]" : "w-1.5 bg-gray-600"
                        }`}
                      />
                    ))}
                </div>
              </div>
            ) : (
              /* DEFAULT WELCOME SCREEN (Screenshot 3 style) */
              <div className="bg-gradient-to-b from-[#0a1e24] to-[#061418] border border-white/5 rounded-2xl p-4 text-center mb-3 space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#EAB308]/15 border border-[#EAB308]/30 flex items-center justify-center text-lg mx-auto">
                  🏛️
                </div>
                <h4 className="text-white font-black text-xs">
                  More than a meal, a tradition
                </h4>
                <p className="text-[10px] text-gray-400">
                  Welcome to Persian Darbar • Pune since 1976
                </p>
                <div className="text-[9px] text-[#EAB308] bg-[#EAB308]/10 py-1 px-2 rounded-full inline-block font-bold">
                  Dine-In • Takeaway • In-House Delivery
                </div>
              </div>
            )}

            {/* Quick action buttons mockup */}
            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
              <div className="bg-[#0a1e24] border border-white/5 p-2 rounded-xl text-white font-bold">
                🍽️ Order Food
              </div>
              <div className="bg-[#0a1e24] border border-white/5 p-2 rounded-xl text-white font-bold">
                📅 Reserve Table
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* ── CREATE / EDIT OFFER MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d2229] border border-[#EAB308]/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#EAB308]" />
                {editingOffer ? "Edit Offer" : "Create New Offer"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Presets Row */}
              <div>
                <label className="text-xs text-gray-300 font-bold mb-2 block">
                  Quick Presets (Persian Darbar AI Art)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_BANNERS.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          title: preset.title,
                          subtitle: preset.subtitle,
                          badge_text: preset.badge,
                          image_url: preset.url,
                          action: preset.action,
                          bg_gradient: preset.gradient,
                        }));
                      }}
                      className={`p-2 rounded-xl border text-left text-xs transition ${
                        formData.image_url === preset.url
                          ? "bg-[#EAB308]/20 border-[#EAB308] text-white"
                          : "bg-white/5 border-white/10 text-gray-300 hover:border-white/20"
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-14 object-cover rounded-lg mb-1"
                      />
                      <p className="font-bold truncate text-[11px]">{preset.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 font-bold mb-1 block">
                    Offer Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. Royal Feast Weekend"
                    className="w-full bg-[#07171d] border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-[#EAB308] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-bold mb-1 block">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={formData.badge_text}
                    onChange={(e) =>
                      setFormData({ ...formData, badge_text: e.target.value })
                    }
                    placeholder="e.g. WEEKEND SPECIAL, 2X COINS"
                    className="w-full bg-[#07171d] border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-[#EAB308] focus:outline-none"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="text-xs text-gray-300 font-bold mb-1 block">
                  Subtitle / Promo Text
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  placeholder="e.g. UP TO 30% OFF + 2X PD Coins on Orders"
                  className="w-full bg-[#07171d] border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-[#EAB308] focus:outline-none"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="text-xs text-gray-300 font-bold mb-1 block">
                  Banner Image URL
                </label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="/dynamic_images/offer_royal_feast.jpg"
                  className="w-full bg-[#07171d] border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-[#EAB308] focus:outline-none"
                />
              </div>

              {/* Action & Coupon Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 font-bold mb-1 block">
                    Action on Tap
                  </label>
                  <select
                    value={formData.action}
                    onChange={(e) =>
                      setFormData({ ...formData, action: e.target.value })
                    }
                    className="w-full bg-[#07171d] border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-[#EAB308] focus:outline-none"
                  >
                    <option value="order">Order Food (Opens Delivery/Order tab)</option>
                    <option value="reserve">Reserve Table (Opens Reservation)</option>
                    <option value="coupon">Apply Coupon Code</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-bold mb-1 block">
                    Coupon Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.coupon_code}
                    onChange={(e) =>
                      setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. ROYAL30"
                    className="w-full bg-[#07171d] border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-[#EAB308] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 font-bold mb-1 block">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full bg-[#07171d] border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-[#EAB308] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-bold mb-1 block">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full bg-[#07171d] border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-[#EAB308] focus:outline-none"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <p className="text-sm font-bold text-white">Active Status</p>
                  <p className="text-xs text-gray-400">
                    Enable this offer immediately once saved
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                    formData.active
                      ? "bg-emerald-600 text-white border-emerald-400"
                      : "bg-gray-800 text-gray-400 border-white/10"
                  }`}
                >
                  {formData.active ? "Enabled" : "Disabled"}
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#EAB308] hover:bg-[#ca9a04] text-black font-bold text-sm shadow-lg shadow-[#EAB308]/20 transition"
                >
                  {editingOffer ? "Save Changes" : "Create Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT COUPON MODAL ── */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d2229] border border-[#EAB308]/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#EAB308]" />
                {editingCoupon ? "Edit Coupon Code" : "Create New Coupon Code"}
              </h3>
              <button
                onClick={() => setShowCouponModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              {/* Code */}
              <div>
                <label className="text-xs text-gray-300 font-bold mb-1.5 block">
                  Coupon Code (e.g. FLAT199, DARBAR50)
                </label>
                <input
                  type="text"
                  required
                  value={couponFormData.code}
                  onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase().replace(/\s/g, "") })}
                  placeholder="FLAT199"
                  className="w-full bg-[#07171d] border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-base uppercase focus:border-[#EAB308] focus:outline-none"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="text-xs text-gray-300 font-bold mb-1.5 block">
                  Discount Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCouponFormData({ ...couponFormData, discount_type: "flat" })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      couponFormData.discount_type === "flat"
                        ? "bg-[#EAB308] text-black border-[#EAB308]"
                        : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    Flat Discount (₹ Amount Off)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCouponFormData({ ...couponFormData, discount_type: "percentage" })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      couponFormData.discount_type === "percentage"
                        ? "bg-[#EAB308] text-black border-[#EAB308]"
                        : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    Percentage (% Off)
                  </button>
                </div>
              </div>

              {/* Discount Value & Min Order Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300 font-bold mb-1.5 block">
                    {couponFormData.discount_type === "flat" ? "Discount Amount (₹)" : "Discount (%)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={couponFormData.discount_value}
                    onChange={(e) => setCouponFormData({ ...couponFormData, discount_value: e.target.value })}
                    placeholder={couponFormData.discount_type === "flat" ? "199" : "20"}
                    className="w-full bg-[#07171d] border border-white/15 rounded-xl px-3.5 py-2 text-white text-sm focus:border-[#EAB308] focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-300 font-bold mb-1.5 block">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={couponFormData.min_order_value}
                    onChange={(e) => setCouponFormData({ ...couponFormData, min_order_value: e.target.value })}
                    placeholder="500"
                    className="w-full bg-[#07171d] border border-white/15 rounded-xl px-3.5 py-2 text-white text-sm focus:border-[#EAB308] focus:outline-none font-bold"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">e.g. Order must be &gt; ₹500</p>
                </div>
              </div>

              {/* Max Discount for Percentage */}
              {couponFormData.discount_type === "percentage" && (
                <div>
                  <label className="text-xs text-gray-300 font-bold mb-1.5 block">
                    Max Discount Cap (₹) - Optional
                  </label>
                  <input
                    type="number"
                    value={couponFormData.max_discount}
                    onChange={(e) => setCouponFormData({ ...couponFormData, max_discount: e.target.value })}
                    placeholder="150"
                    className="w-full bg-[#07171d] border border-white/15 rounded-xl px-3.5 py-2 text-white text-sm focus:border-[#EAB308] focus:outline-none"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs text-gray-300 font-bold mb-1.5 block">
                  Description / Subtitle for Customers
                </label>
                <input
                  type="text"
                  value={couponFormData.description}
                  onChange={(e) => setCouponFormData({ ...couponFormData, description: e.target.value })}
                  placeholder={`Flat ₹${couponFormData.discount_value || 199} OFF on orders above ₹${couponFormData.min_order_value || 500}`}
                  className="w-full bg-[#07171d] border border-white/15 rounded-xl px-3.5 py-2 text-white text-sm focus:border-[#EAB308] focus:outline-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <p className="text-xs font-bold text-white">Active Status</p>
                  <p className="text-[10px] text-gray-400">
                    Customers can immediately apply this coupon at checkout
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCouponFormData({ ...couponFormData, active: !couponFormData.active })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                    couponFormData.active
                      ? "bg-emerald-600 text-white border-emerald-400"
                      : "bg-gray-800 text-gray-400 border-white/10"
                  }`}
                >
                  {couponFormData.active ? "Enabled" : "Disabled"}
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#EAB308] hover:bg-[#ca9a04] text-black font-bold text-xs shadow-lg shadow-[#EAB308]/20 transition"
                >
                  {editingCoupon ? "Save Changes" : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersManagement;
