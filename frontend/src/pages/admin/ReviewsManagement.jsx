import React, { useEffect, useState } from "react";
import { Trash2, Star, Check, Clock, Plus } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";
import { cx, Page, PageHeader, Card, List, Button, IconButton, Segmented, StatusPill, Sheet, FormField, Input, Textarea, EmptyState, LoadingState } from "./ui";

const ReviewsManagement = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | pending | approved
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", text: "", rating: 5, source: "google",
    date: new Date().toISOString().split("T")[0],
  });
  const [addingReview, setAddingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => { fetchReviews(); }, []);

  const platformConfig = {
    google:  { label: "Google Maps",  color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    icon: "??" },
    zomato:  { label: "Zomato",       color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: "???" },
    swiggy:  { label: "Swiggy",       color: "text-orange-300", bg: "bg-amber-500/10",  border: "border-amber-500/30",  icon: "??" },
    website: { label: "Direct Review",color: "text-primary",    bg: "bg-primary/10",    border: "border-primary/30",    icon: "?" },
  };

  const handleAddExternalReview = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.text.trim()) {
      toast({ title: "Missing fields", description: "Name and review text are required", variant: "destructive" });
      return;
    }
    setAddingReview(true);
    try {
      const token = localStorage.getItem("admin_token");
      await axios.post(`${API_BASE}/api/admin/reviews`, {
        ...addForm,
        date: new Date(addForm.date).toISOString(),
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: "Review Added! ?", description: `${platformConfig[addForm.source]?.label} review by ${addForm.name} added — approve it below to make it live` });
      setAddForm({ name: "", text: "", rating: 5, source: "google", date: new Date().toISOString().split("T")[0] });
      setShowAddForm(false);
      fetchReviews();
    } catch {
      toast({ title: "Error", description: "Failed to add review", variant: "destructive" });
    } finally {
      setAddingReview(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await axios.get(`${API_BASE}/api/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(res.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to fetch reviews", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem("admin_token");
      await axios.post(`${API_BASE}/api/admin/reviews/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Approved", description: "Review is now live on the website ✓" });
      fetchReviews();
    } catch {
      toast({ title: "Error", description: "Failed to approve review", variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review permanently?")) return;
    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(`${API_BASE}/api/admin/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Deleted", description: "Review removed" });
      fetchReviews();
    } catch {
      toast({ title: "Error", description: "Failed to delete review", variant: "destructive" });
    }
  };

  if (loading) return <LoadingState rows={4} label="Loading reviews" />;

  const pendingCount = reviews.filter(r => r.pending).length;
  const approvedCount = reviews.filter(r => !r.pending).length;
  const displayed = reviews.filter(r => {
    if (filter === "pending") return r.pending;
    if (filter === "approved") return !r.pending;
    return true;
  });

  const avgRating = reviews.filter(r => !r.pending).length > 0
    ? (reviews.filter(r => !r.pending).reduce((a, r) => a + r.rating, 0) / approvedCount).toFixed(1)
    : "–";

  return (
    <Page>
      <PageHeader
        title="Reviews"
        subtitle={
          <span className="pd-tabular">
            Average {avgRating} · {approvedCount} approved{pendingCount > 0 ? ` · ${pendingCount} pending approval` : ""}
          </span>
        }
        actions={<Button variant="primary" icon={Plus} onClick={() => setShowAddForm(true)}>Add External Review</Button>}
      />

      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { label: `All (${reviews.length})`, value: "all" },
          { label: "Pending", value: "pending", count: pendingCount },
          { label: `Approved (${approvedCount})`, value: "approved" },
        ]}
      />

      {displayed.length === 0 ? (
        <Card><EmptyState icon={Star} title="No reviews" description="No reviews match this filter." /></Card>
      ) : (
        <List>
          {displayed.map((review) => {
            const isPending = review.pending;
            const name = review.name || review.customer_name || "Anonymous";
            const text = review.text || review.review_text || "";
            const platform = review.source && platformConfig[review.source];
            return (
              <div key={review._id} className="flex items-start gap-3 px-4 py-3.5">
                <span className="h-9 w-9 rounded-full bg-[var(--a-fill-2)] text-[var(--a-text-2)] text-[14px] font-semibold flex items-center justify-center shrink-0">
                  {name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-medium text-[var(--a-text)]">{name}</span>
                    <span className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5`}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cx("h-3.5 w-3.5", i < review.rating ? "fill-[var(--a-gold)] text-[var(--a-gold)]" : "text-[var(--a-fill-2)]")} />
                      ))}
                    </span>
                    {isPending && <StatusPill tone="accent" icon={Clock}>Pending approval</StatusPill>}
                  </div>
                  <p className="mt-1 text-[14px] leading-5 text-[var(--a-text)] line-clamp-3">{text}</p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap text-[12px] text-[var(--a-text-3)]">
                    <span className="pd-tabular">
                      {new Date(review.date || review.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    {platform && <StatusPill tone="neutral">{platform.label}</StatusPill>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isPending && (
                    <Button size="sm" variant="primary" icon={Check} onClick={() => handleApprove(review._id)} title="Approve & Publish">Approve</Button>
                  )}
                  <IconButton icon={Trash2} label="Delete" variant="plain" className="!text-[var(--a-error)]" onClick={() => handleDelete(review._id)} />
                </div>
              </div>
            );
          })}
        </List>
      )}

      <Sheet
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add external review"
        subtitle="New reviews stay pending until approved"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button variant="primary" type="submit" form="review-form" disabled={addingReview}>{addingReview ? "Adding…" : "Add Review to Site"}</Button>
          </>
        }
      >
        <form id="review-form" onSubmit={handleAddExternalReview} className="space-y-4">
          <FormField label="Platform">
            <Segmented
              stretch
              value={addForm.source}
              onChange={(key) => setAddForm(f => ({ ...f, source: key }))}
              options={Object.entries(platformConfig).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
            />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Reviewer name">
              <Input required value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rohit Sharma" />
            </FormField>
            <FormField label="Review date">
              <Input type="date" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Rating">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setAddForm(f => ({ ...f, rating: star }))}
                  className="p-0.5 cursor-pointer"
                >
                  <Star className={cx("h-7 w-7", star <= (hoverRating || addForm.rating) ? "fill-[var(--a-gold)] text-[var(--a-gold)]" : "text-[var(--a-fill-2)]")} />
                </button>
              ))}
              <span className="ml-2 text-[14px] text-[var(--a-text-2)] pd-tabular">{addForm.rating}/5</span>
            </div>
          </FormField>
          <FormField label="Review text">
            <Textarea required rows={4} value={addForm.text} onChange={e => setAddForm(f => ({ ...f, text: e.target.value }))} placeholder="Paste the review text here" />
          </FormField>
        </form>
      </Sheet>
    </Page>
  );
};

export default ReviewsManagement;
