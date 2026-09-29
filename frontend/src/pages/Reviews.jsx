import React, { useEffect, useState, useRef } from "react";
import { Star, Quote, MessageSquare, Sparkles, User, ArrowDown, Send, CheckCircle2, PenLine } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import API_BASE from "../lib/config";

/* ─── Write a Review Form ──────────────────────────────────────────────────── */
const WriteReviewForm = () => {
  const { currentUser, customerProfile } = useCustomerAuth();
  const [form, setForm] = useState({ name: "", text: "", rating: 5 });
  const [hovered, setHovered] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser?.displayName) {
      setForm(f => ({ ...f, name: customerProfile?.name || currentUser.displayName || "" }));
    }
  }, [currentUser, customerProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || form.name.trim().length < 2) return setError("Please enter your name.");
    if (!form.text.trim() || form.text.trim().length < 10) return setError("Review must be at least 10 characters.");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          text: form.text,
          rating: form.rating,
          customer_uid: currentUser?.uid || "",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Submission failed");
      }
      setDone(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

   if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a4855] border border-green-500/30 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto"
      >
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
        <p className="text-gray-400 mb-6">Your review has been submitted. It'll appear on the site after our team reviews it.</p>
        <div className="bg-[#0f2933] border border-[#EAB308]/20 rounded-2xl p-5">
          <p className="text-white font-bold mb-2">Also post on Google Reviews?</p>
          <p className="text-gray-400 text-sm mb-4">Help more people discover Persian Darbar by sharing your experience directly on Google!</p>
          <a
            href="https://g.page/r/CersianDarbar/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-bold px-6 py-3 rounded-xl transition-all text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Post on Google Reviews
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#1a4855] to-[#0f3040] border border-[#EAB308]/25 rounded-3xl p-6 md:p-10 max-w-2xl mx-auto mb-20 md:mb-32"
    >
      {/* Form Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-[#EAB308]/15 border border-[#EAB308]/30 flex items-center justify-center">
          <PenLine className="w-5 h-5 text-[#EAB308]" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Share Your Experience</h2>
          <p className="text-gray-500 text-xs uppercase tracking-widest">Your review matters to us</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Star Rating */}
        <div>
          <label className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 block">Your Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setForm(f => ({ ...f, rating: star }))}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= (hovered || form.rating)
                      ? "fill-[#EAB308] text-[#EAB308]"
                      : "text-gray-700"
                  }`}
                />
              </button>
            ))}
            <span className="text-gray-500 text-sm ml-2 self-center">
              {["", "Poor", "Fair", "Good", "Great", "Excellent!"][hovered || form.rating]}
            </span>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 block">Your Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Enter your name"
            className="w-full bg-[#0f2933] text-white px-4 py-3 rounded-xl border border-[#EAB308]/20 focus:border-[#EAB308]/60 outline-none placeholder-gray-600 transition-colors"
          />
        </div>

        {/* Review Text */}
        <div>
          <label className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 block">Your Review</label>
          <textarea
            value={form.text}
            onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            placeholder="Tell us about your dining experience..."
            rows={4}
            className="w-full bg-[#0f2933] text-white px-4 py-3 rounded-xl border border-[#EAB308]/20 focus:border-[#EAB308]/60 outline-none placeholder-gray-600 resize-none transition-colors"
          />
          <div className="text-right text-xs text-gray-600 mt-1">{form.text.length} chars</div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#EAB308] hover:bg-[#CA8A04] disabled:opacity-60 disabled:cursor-not-allowed text-black font-black py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
        >
          <Send className="w-4 h-4" />
          {submitting ? "Submitting..." : "Submit Review"}
        </button>

        <p className="text-center text-gray-600 text-xs">
          Your review will be published after a brief moderation check.
        </p>

        {/* Google Reviews CTA */}
        <div className="border-t border-[#EAB308]/15 pt-4 text-center">
          <p className="text-gray-500 text-xs mb-2">Want to post directly on Google too?</p>
          <a
            href="https://g.page/r/CersianDarbar/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-4 py-2 rounded-xl transition-all text-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Also Post on Google Reviews
          </a>
        </div>
      </form>
    </motion.div>
  );
};

/* ─── Scroll Reveal ───────────────────────────────────────────────────────── */
const ScrollReveal = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

/* ─── Main Reviews Page ───────────────────────────────────────────────────── */
const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [displayCount, setDisplayCount] = useState(12);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/reviews`);
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const displayedReviews = reviews.slice(0, displayCount);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#184956] to-[#0f2933] pt-28 md:pt-40 pb-16 md:pb-32 relative selection:bg-primary/30">
      {/* Cinematic Backgrounds */}
      <div className="absolute top-0 right-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#1a4855] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header Section */}
        <header className="text-center mb-12 md:mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-3 bg-[#1a4855] border border-[#EAB308]/20 rounded-full px-6 py-2 mb-8"
          >
            <Sparkles className="text-primary w-4 h-4" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">The Imperial Voice</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-9xl font-black text-white mb-6 md:mb-10 leading-tight"
          >
            Patron <span className="text-[#EAB308] italic">Reflections</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center space-y-5"
          >
            <div className="flex items-center space-x-4 bg-[#1a4855] border border-[#EAB308]/20 rounded-3xl p-5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.round(averageRating) ? "fill-primary text-primary" : "text-gray-700"}`}
                  />
                ))}
              </div>
              <div className="h-8 w-px bg-white/10 mx-2" />
              <span className="text-3xl font-black text-white italic">{averageRating}</span>
              <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest pt-2">Global Score</span>
            </div>
            <p className="text-gray-500 font-light italic">Over {reviews.length.toLocaleString()}+ Verified Culinary Commendations</p>

            {/* CTA to write review */}
            <button
              onClick={() => setShowForm(f => !f)}
              className="flex items-center gap-2 bg-[#EAB308] hover:bg-[#CA8A04] text-black font-black px-6 py-3 rounded-full transition-all duration-300 text-sm uppercase tracking-widest shadow-lg shadow-[#EAB308]/20 hover:scale-105 active:scale-95"
            >
              <PenLine className="w-4 h-4" />
              {showForm ? "Hide Form" : "Write a Review"}
            </button>
          </motion.div>
        </header>

        {/* Write Review Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <WriteReviewForm />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reviews Masonry Grid */}
        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-12 h-12 border border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-8">
            <AnimatePresence>
              {displayedReviews.map((review, i) => (
                <ScrollReveal key={review._id} delay={i * 0.05}>
                  <div className="break-inside-avoid mb-4 md:mb-8 group">
                    <div className="bg-[#1a4855] border border-[#EAB308]/20 rounded-2xl md:rounded-xl p-6 md:p-10 relative overflow-hidden group-hover:scale-[1.02] transition-all duration-700">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Quote size={80} strokeWidth={1} />
                      </div>

                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          <User size={18} />
                        </div>
                        <div>
                          <h3 className="text-white font-bold italic">{review.name || review.customer_name}</h3>
                          <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
                            {new Date(review.date || review.created_at).toLocaleDateString()} • Verified Dine
                          </p>
                        </div>
                      </div>

                      <div className="flex mb-5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < review.rating ? "fill-primary text-primary" : "text-gray-800"}`}
                          />
                        ))}
                      </div>

                      <p className="text-gray-400 font-light italic leading-relaxed text-sm md:text-base mb-5">
                        "{review.text || review.review_text}"
                      </p>

                      <div className="pt-5 border-t border-[#EAB308]/20 flex items-center justify-between">
                        {(() => {
                          const src = review.source;
                          if (src === "google")  return <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-400">?? Google Maps</span>;
                          if (src === "zomato")  return <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-orange-400">??? Zomato</span>;
                          if (src === "swiggy")  return <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-300">?? Swiggy</span>;
                          return <span className="text-primary text-[9px] font-black uppercase tracking-widest">? Direct Review</span>;
                        })()}
                        <Sparkles className="text-primary/20" size={14} />
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Load More */}
        {!loading && displayCount < reviews.length && (
          <div className="mt-20 text-center">
            <button
              onClick={() => setDisplayCount(prev => prev + 12)}
              className="bg-primary text-black px-12 py-5 rounded-full font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center space-x-4 mx-auto"
            >
              <ArrowDown size={14} />
              <span>Unveil More Reflections</span>
            </button>
          </div>
        )}

        {displayCount >= reviews.length && !loading && reviews.length > 0 && (
          <div className="mt-32 text-center space-y-4 opacity-30">
            <div className="h-px w-24 bg-primary/20 mx-auto" />
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] italic">The end of the scroll</p>
          </div>
        )}

        {!loading && reviews.length === 0 && (
          <div className="text-center py-24">
            <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Be the first to share your experience!</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 bg-[#EAB308] hover:bg-[#CA8A04] text-black font-bold px-8 py-3 rounded-full transition-all"
            >
              Write the First Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
