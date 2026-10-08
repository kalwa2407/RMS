import React, { useState, useEffect } from "react";
import { X, Search, Maximize2, Camera, Sparkles, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE from "../lib/config";

const categories = ["All", "Ambience", "Food", "Royal", "Events"];

// ── Curated Persian Darbar Visual Heritage Collection ──────────────────────────
const CURATED_SHOWCASE = [
  {
    _id: "cur-amb-1",
    url: "/luxury_persian_restaurant_interior_1776082050142.png",
    caption: "The Royal Darbar Hall",
    category: "Ambience",
    tagline: "Grand chandeliers & opulent Mughal-Persian archways"
  },
  {
    _id: "cur-food-1",
    url: "/signature_persian_kabab_platter_1776082069527.png",
    caption: "Signature Persian Kabab Platter",
    category: "Food",
    tagline: "Saffron-infused seekh, barg kababs & aromatic butter rice"
  },
  {
    _id: "cur-food-2",
    url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1200&auto=format&fit=crop",
    caption: "Dum Pukht Royal Biryani",
    category: "Food",
    tagline: "Slow-cooked fragrant aged basmati with saffron & royal spices"
  },
  {
    _id: "cur-royal-1",
    url: "https://images.unsplash.com/photo-1541544741938-0af808b77e40?q=80&w=1200&auto=format&fit=crop",
    caption: "Intricate Geometric Archways",
    category: "Royal",
    tagline: "Timeless Persian calligraphy & handcrafted royal marble motifs"
  },
  {
    _id: "cur-amb-2",
    url: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?q=80&w=1200&auto=format&fit=crop",
    caption: "Sovereign Twilight Seating",
    category: "Ambience",
    tagline: "Intimate velvet banquettes bathed in warm golden candlelight"
  },
  {
    _id: "cur-food-3",
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
    caption: "Charcoal Smoked Raan Tender",
    category: "Food",
    tagline: "Slow-roasted leg of lamb marinated in Persian saffron & secret spices"
  },
  {
    _id: "cur-royal-2",
    url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1200&auto=format&fit=crop",
    caption: "Zafrani & Rose Royal Mocktails",
    category: "Royal",
    tagline: "Handcrafted elixirs with organic Shiraz rosewater & 24K edible gold"
  },
  {
    _id: "cur-events-1",
    url: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=1200&auto=format&fit=crop",
    caption: "Royal Banquets & Mehfil-e-Khaas",
    category: "Events",
    tagline: "Bespoke celebrations, anniversary galas & royal wedding feasts"
  },
  {
    _id: "cur-events-2",
    url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1200&auto=format&fit=crop",
    caption: "Private Dastarkhwan Family Dining",
    category: "Events",
    tagline: "Secluded VIP dining halls for intimate royal gatherings"
  },
  {
    _id: "cur-food-4",
    url: "https://images.unsplash.com/photo-1574484284002-952d92156ca6?q=80&w=1200&auto=format&fit=crop",
    caption: "Zereshk Polo & Mutton Nihari",
    category: "Food",
    tagline: "Tart barberries over buttered saffron rice with 12-hour simmered shanks"
  },
  {
    _id: "cur-royal-3",
    url: "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?q=80&w=1200&auto=format&fit=crop",
    caption: "Imperial Crystal Chandeliers",
    category: "Royal",
    tagline: "Bespoke crystal fixtures casting a warm majestic glow across the hall"
  },
  {
    _id: "cur-events-3",
    url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop",
    caption: "Sufi Nights & Live Ghazal Evenings",
    category: "Events",
    tagline: "Soulful acoustic musical nights accompanying authentic Persian dining"
  }
];

// Helper to provide context-aware fallback photos if a custom URL is broken
const getFallbackImage = (img) => {
  const text = ((img?.caption || "") + " " + (img?.category || "")).toLowerCase();
  if (text.includes("biryani") || text.includes("rice") || text.includes("pulao") || text.includes("dum")) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1200&auto=format&fit=crop";
  }
  if (text.includes("roll") || text.includes("spring") || text.includes("starter") || text.includes("snack")) {
    return "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop";
  }
  if (text.includes("kebab") || text.includes("kabab") || text.includes("platter") || text.includes("dish") || text.includes("food") || text.includes("serve")) {
    return "/signature_persian_kabab_platter_1776082069527.png";
  }
  if (text.includes("mocktail") || text.includes("drink") || text.includes("sherbet") || text.includes("rose")) {
    return "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1200&auto=format&fit=crop";
  }
  if (text.includes("event") || text.includes("banquet") || text.includes("celebration") || text.includes("wedding") || text.includes("party")) {
    return "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=1200&auto=format&fit=crop";
  }
  return "/luxury_persian_restaurant_interior_1776082050142.png";
};

// URL normalizer: resolves relative /static/ paths, handles image_url vs url
const resolveImageUrl = (img) => {
  if (!img) return "/signature_persian_kabab_platter_1776082069527.png";
  const rawUrl = img.url || img.image_url;
  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
    return getFallbackImage(img);
  }
  const clean = rawUrl.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) {
    return clean;
  }
  if (clean.startsWith("/static/")) {
    return `${API_BASE}${clean}`;
  }
  return clean;
};

// Auto-detect appropriate category if not set
const detectCategory = (img) => {
  if (img.category && img.category !== "undefined") return img.category;
  const caption = (img.caption || "").toLowerCase();
  if (/(biryani|roll|dish|kebab|kabab|platter|food|starter|chicken|mutton|curry|naan|rice)/.test(caption)) {
    return "Food";
  }
  if (/(event|banquet|celebration|wedding|party|ghazal|sufi|gathering)/.test(caption)) {
    return "Events";
  }
  if (/(royal|shahi|gold|darbar|chandeliers|carpet|art|archway)/.test(caption)) {
    return "Royal";
  }
  return "Ambience";
};

const Gallery = () => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/gallery`);
        if (res.ok) {
          const data = await res.json();
          const dbItems = (Array.isArray(data) ? data : []).map(item => ({
            ...item,
            category: detectCategory(item),
            url: resolveImageUrl(item),
            image_url: resolveImageUrl(item)
          }));

          // Merge: show custom/admin items first, augmented with showcase to guarantee full collection
          const showcaseFiltered = CURATED_SHOWCASE.filter(
            cur => !dbItems.some(db => (db.caption || "").toLowerCase() === (cur.caption || "").toLowerCase())
          );
          setGallery([...dbItems, ...showcaseFiltered]);
        } else {
          setGallery(CURATED_SHOWCASE);
        }
      } catch (err) {
        console.error("Failed to load gallery from server, using showcase:", err);
        setGallery(CURATED_SHOWCASE);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const filteredGallery = filter === "All" 
    ? gallery 
    : gallery.filter(img => (img.category || "Ambience").toLowerCase() === filter.toLowerCase());

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#184956] to-[#0f2933] pt-28 md:pt-32 pb-16 md:pb-32 selection:bg-primary/30 relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-10 md:mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-2 bg-[#1a4855] border border-[#EAB308]/20 rounded-full px-5 py-1.5 mb-6"
          >
            <Camera className="text-[#EAB308] w-4 h-4" />
            <span className="text-[#EAB308] text-[10px] font-black uppercase tracking-[0.4em]">Visual Heritage</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            The <span className="text-[#EAB308]">Royal</span> Capture
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-base text-gray-300 max-w-2xl mx-auto font-light leading-relaxed px-2"
          >
            A curated visual journey through the soul of Persian Darbar. From architectural grandeur and intimate private alcoves to Mughlai culinary artistry.
          </motion.p>
        </div>

        {/* Liquid Filtering Pills */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10 md:mb-14">
          {categories.map((cat) => {
            const count = cat === "All"
              ? gallery.length
              : gallery.filter(img => (img.category || "Ambience").toLowerCase() === cat.toLowerCase()).length;

            return (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(cat)}
                className={`px-5 md:px-7 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 border flex items-center gap-2 ${
                  filter.toLowerCase() === cat.toLowerCase()
                    ? "bg-[#EAB308] text-black border-[#EAB308] shadow-[0_0_25px_rgba(234,179,8,0.4)] scale-105" 
                    : "bg-[#1a4855]/80 border-[#EAB308]/25 text-gray-300 hover:text-white hover:border-[#EAB308]/60 hover:bg-[#1a4855]"
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filter.toLowerCase() === cat.toLowerCase() ? "bg-black/20 text-black font-mono font-bold" : "bg-white/10 text-gray-400"
                }`}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Gallery Grid (Robust Non-Collapsing Cards) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="rounded-2xl h-80 bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredGallery.map((image, idx) => {
                const displayUrl = resolveImageUrl(image);

                return (
                  <motion.div
                    key={image._id || `gal-${idx}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => setSelectedImage(image)}
                    className="group relative rounded-2xl overflow-hidden bg-[#10232b] border border-[#EAB308]/25 hover:border-[#EAB308] transition-all duration-500 shadow-xl hover:shadow-[0_12px_35px_rgba(0,0,0,0.6)] cursor-pointer flex flex-col"
                  >
                    {/* Fixed Height Image Viewport — Never Collapses */}
                    <div className="relative w-full h-72 sm:h-80 overflow-hidden bg-[#0c1a20]">
                      <img
                        src={displayUrl}
                        alt={image.caption || "Persian Darbar Capture"}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getFallbackImage(image);
                        }}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />

                      {/* Top Category Badge */}
                      <div className="absolute top-3.5 left-3.5 z-10">
                        <span className="bg-black/60 backdrop-blur-md border border-[#EAB308]/40 text-[#EAB308] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" />
                          <span>{image.category || "Ambience"}</span>
                        </span>
                      </div>

                      {/* Top-right zoom action button */}
                      <div className="absolute top-3.5 right-3.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-[#EAB308] hover:text-black hover:border-[#EAB308] transition-all shadow-lg">
                          <Maximize2 className="w-4 h-4" />
                        </span>
                      </div>

                      {/* Bottom Dark Gradient Fade */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c1a20] via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                      {/* Caption & Tagline Bar */}
                      <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                        <h3 className="text-xl font-bold text-white group-hover:text-[#EAB308] transition-colors leading-snug">
                          {image.caption}
                        </h3>
                        <p className="text-xs text-gray-300 mt-1 line-clamp-2 font-light">
                          {image.tagline || "Authentic Mughlai & Persian Royal dining experience."}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 sm:p-8"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button
              whileHover={{ rotate: 90, scale: 1.1 }}
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 text-white/70 hover:text-[#EAB308] transition-all p-3 bg-white/10 border border-white/20 rounded-full z-10"
            >
              <X className="w-6 h-6" />
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full flex flex-col items-center bg-[#0d171d] border border-[#EAB308]/30 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-h-[70vh] rounded-2xl overflow-hidden bg-black/50 flex items-center justify-center">
                <img
                  src={resolveImageUrl(selectedImage)}
                  alt={selectedImage.caption}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getFallbackImage(selectedImage);
                  }}
                  className="w-full h-full max-h-[70vh] object-contain rounded-xl"
                />
              </div>

              <div className="mt-6 text-center w-full px-4">
                <span className="inline-block bg-[#EAB308]/20 text-[#EAB308] text-xs font-black uppercase tracking-[0.3em] px-3.5 py-1 rounded-full border border-[#EAB308]/30 mb-3">
                  {selectedImage.category || "Persian Darbar"}
                </span>
                <h2
                  className="text-2xl sm:text-4xl font-bold text-white mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {selectedImage.caption}
                </h2>
                <p className="text-sm text-gray-400 max-w-xl mx-auto">
                  {selectedImage.tagline || "Curated visual celebration of culinary authentic Persian heritage at Camp, Pune."}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;

