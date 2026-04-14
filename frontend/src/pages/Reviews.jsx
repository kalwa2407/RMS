import React, { useEffect, useState, useRef } from "react";
import { Star, Quote, MessageSquare, Sparkles, User, History, ArrowDown } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [displayCount, setDisplayCount] = useState(12);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${(process.env.REACT_APP_BACKEND_URL || "")}/api/reviews`);
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
    <div className="min-h-screen bg-[#050b10] pt-28 md:pt-40 pb-16 md:pb-32 relative selection:bg-primary/30">
      {/* Cinematic Backgrounds */}
      <div className="absolute top-0 right-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header Section */}
        <header className="text-center mb-16 md:mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-3 glass-premium rounded-full px-6 py-2 mb-10 border-white/5"
          >
            <Sparkles className="text-primary w-4 h-4" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">The Imperial Voice</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-9xl font-display font-black text-white mb-6 md:mb-12 leading-tight"
          >
            Patron <span className="golden-text italic">Reflections</span>
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center space-y-6"
          >
             <div className="flex items-center space-x-4 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-3xl">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${i < Math.round(averageRating) ? "fill-primary text-primary" : "text-gray-700"}`}
                    />
                  ))}
                </div>
                <div className="h-8 w-px bg-white/10 mx-2" />
                <span className="text-3xl font-display font-black text-white italic">{averageRating}</span>
                <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest pt-2">Global Score</span>
             </div>
             <p className="text-gray-500 font-light italic">Over {reviews.length.toLocaleString()}+ Verified Culinary Commendations</p>
          </motion.div>
        </header>

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
                    <div className="glass-premium rounded-2xl md:rounded-[3rem] p-6 md:p-10 border border-white/5 relative overflow-hidden group-hover:scale-[1.02] transition-all duration-700">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Quote size={80} strokeWidth={1} />
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-8">
                         <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <User size={18} />
                         </div>
                         <div>
                            <h3 className="text-white font-display font-bold italic">{review.name}</h3>
                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
                               {new Date(review.date).toLocaleDateString()} • Verified Dine
                            </p>
                         </div>
                      </div>

                      <div className="flex mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < review.rating ? "fill-primary text-primary" : "text-gray-800"}`}
                          />
                        ))}
                      </div>

                      <p className="text-gray-400 font-light italic leading-relaxed text-sm md:text-lg mb-6 md:mb-8">
                        "{review.text}"
                      </p>

                      <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                         <span className="text-primary text-[9px] font-black uppercase tracking-widest">Imperial Patron</span>
                         <Sparkles className="text-primary/20" size={14} />
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Action Area */}
        {!loading && displayCount < reviews.length && (
          <div className="mt-20 text-center">
            <button
               onClick={() => setDisplayCount(prev => prev + 12)}
               className="magnetic-button bg-primary text-black px-12 py-6 rounded-full font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center space-x-4 mx-auto"
            >
              <ArrowDown size={14} />
              <span>Unveil More Reflections</span>
            </button>
          </div>
        )}

        {displayCount >= reviews.length && !loading && (
           <div className="mt-32 text-center space-y-4 opacity-30">
              <div className="h-px w-24 bg-primary/20 mx-auto" />
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] italic">The end of the scroll</p>
           </div>
        )}
      </div>
    </div>
  );
};

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

export default Reviews;
