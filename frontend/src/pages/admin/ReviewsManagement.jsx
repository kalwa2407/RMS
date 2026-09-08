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

  useEffect(() => { fetchReviews(); }, []);

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
      <div className="mb-5">
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
                    <p className="text-gray-600 text-xs mt-2">
                      {new Date(review.date || review.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric"
                      })}
                    </p>
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
