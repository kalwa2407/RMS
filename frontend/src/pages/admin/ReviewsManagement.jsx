import React, { useEffect, useState } from "react";
import { Trash2, Star, Check, Clock, Eye, EyeOff } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";

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
      toast({ title: "Review Added! ?", description: `${platformConfig[addForm.source]?.label} review by ${addForm.name} added � approve it below to make it live` });
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

  if (loading) return <div className="text-center py-20 text-primary">Loading reviews...</div>;

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
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-primary" style={{ fontFamily: "Playfair Display, serif" }}>
            Reviews
          </h2>
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-400">
          <span>⭐ Avg: <strong className="text-white">{avgRating}</strong></span>
          <span>✅ Approved: <strong className="text-green-400">{approvedCount}</strong></span>
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 text-yellow-400 font-bold animate-pulse">
              <Clock className="h-3.5 w-3.5" />
              {pendingCount} Pending Approval
            </span>
          )}
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="bg-primary hover:bg-[#CA8A04] text-black px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all text-sm self-start shrink-0"
        >
          {showAddForm ? "? Cancel" : "+ Add External Review"}
        </button>
      </div>

      {/* Add External Review Form */}
      {showAddForm && (
        <div className="bg-[#1a4855] border border-[#EAB308]/20 rounded-2xl p-5 mb-6 shadow-2xl">
          <h3 className="text-lg font-bold text-primary mb-4" style={{ fontFamily: "Playfair Display, serif" }}>
            Add Review from External Platform
          </h3>
          <form onSubmit={handleAddExternalReview} className="space-y-4">
            {/* Platform selector */}
            <div>
              <label className="block text-primary font-semibold mb-2 text-sm">Platform Source *</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(platformConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAddForm(f => ({ ...f, source: key }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                      addForm.source === key
                        ? `${cfg.bg} ${cfg.border} ${cfg.color} scale-105`
                        : "bg-[#0f2933] border-white/10 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    <span>{cfg.icon}</span> {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-primary font-semibold mb-1 text-sm">Reviewer Name *</label>
                <input
                  required
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Rohit Sharma"
                  className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#EAB308]/60 placeholder-gray-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-primary font-semibold mb-1 text-sm">Review Date</label>
                <input
                  type="date"
                  value={addForm.date}
                  onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#EAB308]/60"
                />
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-primary font-semibold mb-2 text-sm">Star Rating *</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setAddForm(f => ({ ...f, rating: star }))}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={`w-7 h-7 transition-colors ${
                      star <= (hoverRating || addForm.rating)
                        ? "fill-primary text-primary"
                        : "text-gray-600"
                    }`} />
                  </button>
                ))}
                <span className="text-gray-400 text-sm ml-2 self-center">{addForm.rating}/5</span>
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-primary font-semibold mb-1 text-sm">Review Text *</label>
              <textarea
                required
                rows={4}
                value={addForm.text}
                onChange={e => setAddForm(f => ({ ...f, text: e.target.value }))}
                placeholder="Paste the review text here..."
                className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#EAB308]/60 placeholder-gray-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={addingReview}
              className="bg-primary hover:bg-[#CA8A04] disabled:opacity-60 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors text-sm"
            >
              {addingReview ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : "?"} 
              {addingReview ? "Adding..." : "Add Review to Site"}
            </button>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { label: "All", value: "all", count: reviews.length },
          { label: "Pending", value: "pending", count: pendingCount },
          { label: "Approved", value: "approved", count: approvedCount },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              filter === tab.value
                ? "bg-primary text-black"
                : "bg-[#1a4855] text-gray-300 hover:bg-[#2a5865]"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filter === tab.value ? "bg-black/20" : "bg-[#0f2933]"
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Reviews Grid */}
      {displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No reviews found</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayed.map((review) => {
            const isPending = review.pending;
            const name = review.name || review.customer_name || "Anonymous";
            const text = review.text || review.review_text || "";
            return (
              <div
                key={review._id}
                className={`rounded-2xl p-4 sm:p-6 border transition-all duration-300 ${
                  isPending
                    ? "bg-[#1a3a20] border-yellow-500/30"
                    : "bg-[#1a4855] border-[#EAB308]/20"
                }`}
              >
                {/* Status Badge */}
                {isPending && (
                  <div className="inline-flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                    <Clock className="h-3 w-3" />
                    Pending Approval
                  </div>
                )}

                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white truncate">{name}</h3>
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-primary text-primary" : "text-gray-700"}`} />
                      ))}
                      <span className="text-gray-500 text-xs ml-1">{review.rating}/5</span>
                    </div>
                    <p className="text-gray-300 text-sm mt-2 leading-relaxed line-clamp-3">"{text}"</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <p className="text-gray-600 text-xs">
                        {new Date(review.date || review.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                      </p>
                      {review.source && platformConfig[review.source] && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${platformConfig[review.source].bg} ${platformConfig[review.source].border} ${platformConfig[review.source].color}`}>
                          {platformConfig[review.source].icon} {platformConfig[review.source].label}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {isPending && (
                      <button
                        onClick={() => handleApprove(review._id)}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                        title="Approve & Publish"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review._id)}
                      className="bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewsManagement;
