import React, { useEffect, useState } from "react";
import { Trash2, Star } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const ReviewsManagement = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem("admin_token");

      const response = await axios.get(`${API_BASE}/api/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReviews(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review permanently?")) return;

    try {
      const token = localStorage.getItem("admin_token");

      await axios.delete(`${API_BASE}/api/admin/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({ title: "Success", description: "Review deleted successfully" });

      fetchReviews();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-primary">Loading reviews...</div>
    );
  }

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        ).toFixed(1)
      : 0;

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-4xl font-bold text-primary"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Reviews Management
        </h2>
        <p className="text-gray-300 mt-2">
          Total Reviews: {reviews.length} | Average Rating: {avgRating} ⭐
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reviews.map((review) => (
          <div
            key={review._id}
            className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:border-primary/20 transition-all duration-300"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {review.customer_name}
                </h3>

                <div className="flex mt-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-primary text-primary"
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleDelete(review._id)}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* REVIEW TEXT */}
            <p className="text-gray-300 leading-relaxed">
              "{review.review_text}"
            </p>

            {/* DATE */}
            <p className="text-gray-400 text-sm mt-3">
              {new Date(review.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsManagement;


