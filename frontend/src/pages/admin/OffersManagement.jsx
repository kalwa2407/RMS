import React, { useState, useEffect } from "react";
import {
  Tag, Plus, Trash2, Edit2, Save, Image as ImageIcon, Calendar,
  ArrowUp, ArrowDown, RefreshCw, Percent, Check, Zap
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import API_BASE from "../../lib/config";
import { cx, Page, PageHeader, Card, SectionTitle, List, Button, IconButton, Segmented, StatusPill, Switch, Sheet, FormField, FormGroup, FormRow, Input, Select, EmptyState, LoadingState } from "./ui";

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
  const topActive = offers.find((o) => o.active) || offers[0];
  const newCoupon = () => {
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
  };

  return (
    <Page>
      <PageHeader
        title="Offers"
        subtitle="Promotional banners, coupons and discounts shown in the customer app."
        actions={
          <>
            <IconButton
              icon={RefreshCw}
              label="Refresh"
              onClick={() => {
                if (activeSection === "coupons") fetchCoupons();
                else fetchOffers();
              }}
            />
            {activeSection === "coupons"
              ? <Button variant="primary" icon={Plus} onClick={newCoupon}>Create Coupon</Button>
              : <Button variant="primary" icon={Plus} onClick={openCreateModal}>Add Offer</Button>}
          </>
        }
      />

      <Segmented
        value={activeSection}
        onChange={setActiveSection}
        options={[
          { value: "coupons", label: `Coupons (${coupons.length})`, icon: Tag },
          { value: "banners", label: `Home Banners (${offers.length})`, icon: ImageIcon },
        ]}
      />

      {/* ── COUPONS ── */}
      {activeSection === "coupons" && (
        <>
          <section className="space-y-2">
            <SectionTitle title="Quick presets" subtitle="Opens a new coupon pre-filled with the rule" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {COUPON_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => openCouponModalWithPreset(p)}
                  className="text-left rounded-[12px] border border-[var(--a-line)] bg-[var(--a-card)] px-3 py-2.5 hover:bg-[var(--a-inset)] cursor-pointer pd-press"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-semibold tracking-[0.02em] text-[var(--a-text)]">{p.code}</span>
                    <Zap className="h-3.5 w-3.5 text-[var(--a-text-3)]" />
                  </div>
                  <div className="text-[13px] text-[var(--a-text-2)] pd-tabular">
                    {p.discount_type === "flat" ? `₹${p.discount_value} off` : `${p.discount_value}% off`} · min ₹{p.min_order_value}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <SectionTitle title="Coupon codes" subtitle={`${coupons.filter(c => c.active).length} live of ${coupons.length}`} />
            {couponsLoading ? (
              <LoadingState rows={3} label="Loading coupons" />
            ) : coupons.length === 0 ? (
              <Card>
                <EmptyState icon={Tag} title="No coupon codes yet" description="Create a code customers can apply at checkout."
                  action={<Button variant="primary" onClick={() => { setEditingCoupon(null); openCouponModalWithPreset(COUPON_PRESETS[0]); }}>Create Flat ₹199 OFF Code</Button>} />
              </Card>
            ) : (
              <List>
                {coupons.map((coupon) => {
                  const cid = coupon.id || coupon._id;
                  const isFlat = coupon.discount_type === "flat";
                  return (
                    <div key={cid} className={cx("flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3", !coupon.active && "opacity-70")}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[15px] font-semibold tracking-[0.02em] text-[var(--a-text)]">{coupon.code}</span>
                          <StatusPill tone={coupon.active ? "success" : "neutral"} dot>{coupon.active ? "Live" : "Paused"}</StatusPill>
                        </div>
                        <div className="text-[13px] text-[var(--a-text)] pd-tabular">
                          {isFlat ? `₹${coupon.discount_value} off` : `${coupon.discount_value}% off`}
                          {coupon.max_discount ? ` (max ₹${coupon.max_discount})` : ""}
                          <span className="text-[var(--a-text-3)]"> · min order ₹{coupon.min_order_value || 0}</span>
                        </div>
                        <div className="text-[12px] text-[var(--a-text-3)] truncate">
                          {coupon.description || `Applicable on orders above ₹${coupon.min_order_value || 0}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Switch checked={!!coupon.active} onChange={() => handleToggleCoupon(coupon)} label={coupon.active ? "Pause coupon" : "Make coupon live"} />
                        <IconButton icon={Edit2} label="Edit rule" variant="plain" className="!text-[var(--a-text-2)]" onClick={() => openEditCouponModal(coupon)} />
                        <IconButton icon={Trash2} label="Delete" variant="plain" className="!text-[var(--a-error)]" onClick={() => handleDeleteCoupon(cid)} />
                      </div>
                    </div>
                  );
                })}
              </List>
            )}
          </section>
        </>
      )}

      {/* ── HOME BANNERS ── */}
      {activeSection === "banners" && (
        <>
          <FormGroup footer={masterEnabled
            ? `Banners show at the top of the customer app home screen (${activeOffersCount} active).`
            : "The customer app shows the classic welcome screen with no banners."}>
            <FormRow label="Show offers in the customer app" hint={masterEnabled ? "Live on app" : "Off, default welcome screen"}>
              <Switch checked={masterEnabled} onChange={handleMasterToggle} disabled={savingMaster} label="Show offers in the customer app" />
            </FormRow>
          </FormGroup>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 space-y-2">
              <SectionTitle title="Banners" subtitle="Use the arrows to change the display order" />
              {loading ? (
                <LoadingState rows={3} label="Loading offers" />
              ) : offers.length === 0 ? (
                <Card><EmptyState icon={Tag} title="No offers yet" action={<Button variant="primary" onClick={openCreateModal}>Create First Offer</Button>} /></Card>
              ) : (
                <List>
                  {offers.map((offer, index) => (
                    <div key={offer.id || index} className={cx("flex flex-col sm:flex-row sm:items-center gap-3 px-3 sm:px-4 py-3", !offer.active && "opacity-70")}>
                      <img
                        src={offer.image_url}
                        alt={offer.title}
                        className="w-full sm:w-32 h-24 sm:h-20 rounded-[10px] object-cover border border-[var(--a-line)] shrink-0"
                        onError={(e) => {
                          e.target.src = "/dynamic_images/offer_royal_feast.jpg";
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[15px] font-medium text-[var(--a-text)] truncate">{offer.title}</span>
                          {offer.badge_text && <StatusPill tone="gold">{offer.badge_text}</StatusPill>}
                        </div>
                        {offer.subtitle && <div className="text-[13px] text-[var(--a-text-2)] truncate">{offer.subtitle}</div>}
                        <div className="text-[12px] text-[var(--a-text-3)] pd-tabular flex flex-wrap gap-x-2">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{offer.start_date || "Anytime"} – {offer.end_date || "No end"}</span>
                          <span className="capitalize">Tap: {offer.action || "order"}</span>
                          {offer.coupon_code && <span>Code {offer.coupon_code}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Switch checked={!!offer.active} onChange={() => handleToggleOfferActive(offer)} label={offer.active ? "Deactivate offer" : "Activate offer"} />
                        <IconButton icon={ArrowUp} label="Move Up" variant="plain" className="!text-[var(--a-text-2)]" onClick={() => handleMoveOrder(index, -1)} disabled={index === 0} />
                        <IconButton icon={ArrowDown} label="Move Down" variant="plain" className="!text-[var(--a-text-2)]" onClick={() => handleMoveOrder(index, 1)} disabled={index === offers.length - 1} />
                        <IconButton icon={Edit2} label="Edit Offer" variant="plain" className="!text-[var(--a-text-2)]" onClick={() => openEditModal(offer)} />
                        <IconButton icon={Trash2} label="Delete Offer" variant="plain" className="!text-[var(--a-error)]" onClick={() => handleDeleteOffer(offer.id)} />
                      </div>
                    </div>
                  ))}
                </List>
              )}
            </section>

            <section className="space-y-2 max-w-sm w-full">
              <SectionTitle title="App preview" subtitle="What customers see first" />
              <Card className="space-y-3">
                {masterEnabled && activeOffersCount > 0 && topActive ? (
                  <>
                    <div className="relative overflow-hidden rounded-[12px]">
                      <img
                        src={topActive.image_url}
                        alt="Preview"
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          e.target.src = "/dynamic_images/offer_royal_feast.jpg";
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/55 px-3 py-2">
                        <div className="text-[14px] font-semibold text-[#FFFFFF] truncate">{topActive.title}</div>
                        {topActive.subtitle && <div className="text-[12px] text-[#FFFFFF]/80 truncate">{topActive.subtitle}</div>}
                      </div>
                    </div>
                    <div className="flex justify-center gap-1">
                      {offers.filter((o) => o.active).map((_, i) => (
                        <span key={i} className={cx("h-1.5 rounded-full", i === 0 ? "w-4 bg-[var(--a-text-2)]" : "w-1.5 bg-[var(--a-fill-2)]")} />
                      ))}
                    </div>
                    <p className="text-[12px] text-[var(--a-text-3)] text-center pd-tabular">{activeOffersCount} offers live</p>
                  </>
                ) : (
                  <div className="rounded-[12px] bg-[var(--a-inset)] px-4 py-6 text-center">
                    <div className="text-[15px] font-semibold text-[var(--a-text)]">More than a meal, a tradition</div>
                    <div className="text-[13px] text-[var(--a-text-2)]">Default welcome screen (no banners)</div>
                  </div>
                )}
              </Card>
            </section>
          </div>
        </>
      )}

      {/* Offer sheet */}
      <Sheet
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingOffer ? "Edit offer" : "New offer"}
        subtitle="Home carousel banner"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" icon={Save} type="submit" form="offer-form">{editingOffer ? "Save Changes" : "Create Offer"}</Button>
          </>
        }
      >
        <form id="offer-form" onSubmit={handleSaveModal} className="space-y-4">
          <FormField label="Start from a preset">
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
                  className={cx(
                    "rounded-[10px] border p-1.5 text-left cursor-pointer",
                    formData.image_url === preset.url ? "border-[var(--a-accent)] ring-2 ring-[var(--a-accent)]/25" : "border-[var(--a-line)] hover:bg-[var(--a-fill)]"
                  )}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-14 object-cover rounded-[7px]" />
                  <div className="mt-1 text-[12px] font-medium truncate text-[var(--a-text)]">{preset.name}</div>
                </button>
              ))}
            </div>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Title">
              <Input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Royal Feast Weekend" />
            </FormField>
            <FormField label="Badge text">
              <Input type="text" value={formData.badge_text} onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })} placeholder="e.g. WEEKEND SPECIAL" />
            </FormField>
          </div>
          <FormField label="Subtitle">
            <Input type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} placeholder="e.g. Up to 30% off + 2X PD Coins" />
          </FormField>
          <FormField label="Banner image URL">
            <Input type="text" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="/dynamic_images/offer_royal_feast.jpg" />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Action on tap">
              <Select value={formData.action} onChange={(e) => setFormData({ ...formData, action: e.target.value })}>
                <option value="order">Order food (opens order tab)</option>
                <option value="reserve">Reserve table (opens reservation)</option>
                <option value="coupon">Apply coupon code</option>
              </Select>
            </FormField>
            <FormField label="Coupon code (optional)">
              <Input type="text" value={formData.coupon_code} onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })} placeholder="e.g. ROYAL30" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start date">
              <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
            </FormField>
            <FormField label="End date">
              <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
            </FormField>
          </div>
          <FormGroup>
            <FormRow label="Active" hint="Show this offer as soon as it is saved">
              <Switch checked={!!formData.active} onChange={() => setFormData({ ...formData, active: !formData.active })} label="Active" />
            </FormRow>
          </FormGroup>
        </form>
      </Sheet>

      {/* Coupon sheet */}
      <Sheet
        open={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        size="sm"
        title={editingCoupon ? "Edit coupon" : "New coupon"}
        subtitle="Applied by customers at checkout"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCouponModal(false)}>Cancel</Button>
            <Button variant="primary" icon={Check} type="submit" form="coupon-form">{editingCoupon ? "Save Changes" : "Save Coupon"}</Button>
          </>
        }
      >
        <form id="coupon-form" onSubmit={handleSaveCoupon} className="space-y-4">
          <FormField label="Coupon code" hint="e.g. FLAT199, DARBAR50">
            <Input type="text" required value={couponFormData.code}
              onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase().replace(/\s/g, "") })}
              placeholder="FLAT199" className="font-semibold tracking-[0.04em] uppercase" />
          </FormField>
          <FormField label="Discount type">
            <Segmented
              stretch
              value={couponFormData.discount_type}
              onChange={(v) => setCouponFormData({ ...couponFormData, discount_type: v })}
              options={[{ value: "flat", label: "Flat ₹ off" }, { value: "percentage", label: "Percentage off", icon: Percent }]}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={couponFormData.discount_type === "flat" ? "Discount (₹)" : "Discount (%)"}>
              <Input type="number" min="1" required value={couponFormData.discount_value}
                onChange={(e) => setCouponFormData({ ...couponFormData, discount_value: e.target.value })}
                placeholder={couponFormData.discount_type === "flat" ? "199" : "20"} className="pd-tabular" />
            </FormField>
            <FormField label="Min order (₹)" hint="Order must be above this">
              <Input type="number" min="0" value={couponFormData.min_order_value}
                onChange={(e) => setCouponFormData({ ...couponFormData, min_order_value: e.target.value })} placeholder="500" className="pd-tabular" />
            </FormField>
          </div>
          {couponFormData.discount_type === "percentage" && (
            <FormField label="Max discount cap (₹, optional)">
              <Input type="number" value={couponFormData.max_discount} onChange={(e) => setCouponFormData({ ...couponFormData, max_discount: e.target.value })} placeholder="150" className="pd-tabular" />
            </FormField>
          )}
          <FormField label="Description for customers">
            <Input type="text" value={couponFormData.description} onChange={(e) => setCouponFormData({ ...couponFormData, description: e.target.value })}
              placeholder={`Flat ₹${couponFormData.discount_value || 199} OFF on orders above ₹${couponFormData.min_order_value || 500}`} />
          </FormField>
          <FormGroup>
            <FormRow label="Active" hint="Customers can apply this coupon at checkout">
              <Switch checked={!!couponFormData.active} onChange={() => setCouponFormData({ ...couponFormData, active: !couponFormData.active })} label="Active" />
            </FormRow>
          </FormGroup>
        </form>
      </Sheet>
    </Page>
  );
};

export default OffersManagement;
