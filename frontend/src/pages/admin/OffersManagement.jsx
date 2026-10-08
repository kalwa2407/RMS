import React, { useState, useEffect } from "react";
import {
  Tag, ToggleLeft, ToggleRight, Plus, Trash2, Edit2,
  Save, X, Image as ImageIcon, Calendar, Sparkles,
  Eye, EyeOff, AlertTriangle, ArrowUp, ArrowDown,
  CheckCircle, Smartphone, ExternalLink, RefreshCw
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

  useEffect(() => {
    fetchOffers();
  }, []);

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
            onClick={fetchOffers}
            className="p-2.5 rounded-xl bg-[#0f2933] border border-white/10 text-gray-300 hover:text-white hover:bg-[#1a4855] transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EAB308] hover:bg-[#ca9a04] text-black font-bold text-sm shadow-lg shadow-[#EAB308]/20 transition"
          >
            <Plus className="w-4 h-4" /> Add New Offer
          </button>
        </div>
      </div>

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
    </div>
  );
};

export default OffersManagement;
