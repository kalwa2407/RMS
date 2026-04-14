import React, { useState, useEffect, useRef } from "react";
import { X, Search, Maximize2, Camera, MapPin, Sparkles } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";

const categories = ["All", "Ambience", "Food", "Royal", "Events"];

const Gallery = () => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch(`${(process.env.REACT_APP_BACKEND_URL || "")}/api/gallery`);
        const data = await res.json();
        setGallery(data.length > 0 ? data : generateMockGallery());
        setLoading(false);
      } catch (err) {
        console.error("Failed to load gallery:", err);
        setGallery(generateMockGallery());
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const generateMockGallery = () => [
    { _id: '1', url: '/luxury_persian_restaurant_interior_1776082050142.png', caption: 'The Royal Hall', category: 'Ambience' },
    { _id: '2', url: '/signature_persian_kabab_platter_1776082069527.png', caption: 'Chef\'s Special Kabab Platter', category: 'Food' },
    { _id: '3', url: 'https://images.unsplash.com/photo-1541544741938-0af808b77e40?q=80&w=2069&auto=format&fit=crop', caption: 'Intricate Geometric Art', category: 'Royal' },
    { _id: '4', url: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?q=80&w=1970&auto=format&fit=crop', caption: 'Ambient Evening Seating', category: 'Ambience' },
    { _id: '5', url: 'https://images.unsplash.com/photo-1574484284002-952d92156ca6?q=80&w=1974&auto=format&fit=crop', caption: 'Saffron Rice & Stew', category: 'Food' },
    { _id: '6', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop', caption: 'Royal Mocktails', category: 'Royal' },
  ];

  const filteredGallery = filter === "All" 
    ? gallery 
    : gallery.filter(img => (img.category || "Ambience") === filter);

  return (
    <div className="min-h-screen bg-[#050b10] pt-28 md:pt-32 pb-16 md:pb-32 selection:bg-primary/30 relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12 md:mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-2 glass-premium rounded-full px-5 py-1.5 mb-6 border-white/5"
          >
            <Camera className="text-primary w-4 h-4" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">Visual Heritage</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl md:text-8xl font-display font-black text-white mb-4 md:mb-8"
          >
            The <span className="golden-text">Royal</span> Capture
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-lg text-gray-400 max-w-2xl mx-auto font-light leading-relaxed px-2"
          >
            A curated visual journey through the soul of Persian Darbar. From architectural grandeur to culinary artistry.
          </motion.p>
        </div>

        {/* Liquid Filtering */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-10 md:mb-20">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(cat)}
              className={`px-4 md:px-8 py-2.5 md:py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-500 border ${
                filter === cat 
                  ? 'bg-primary text-black border-primary shadow-[0_0_20px_rgba(234,179,8,0.3)]' 
                  : 'glass-premium text-gray-400 border-white/5 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Gallery Masonry */}
        <motion.div 
           layout
           className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-8 space-y-4 md:space-y-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredGallery.map((image) => (
              <motion.div
                key={image._id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setSelectedImage(image)}
                className="relative group rounded-xl md:rounded-[2rem] overflow-hidden brutal-card cursor-pointer"
              >
                <img
                  src={image.url}
                  alt={image.caption}
                  className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-1000"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                  <div className="transform translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex items-center space-x-2 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
                       <Sparkles size={12} />
                       <span>{image.category || "Premium"}</span>
                    </div>
                    <h3 className="text-2xl font-display font-bold text-white mb-2">{image.caption}</h3>
                    <div className="flex items-center text-white/50 space-x-2">
                       <Maximize2 size={16} />
                       <span className="text-[10px] uppercase font-bold tracking-widest">Enlarge View</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-6 md:p-12"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button
              whileHover={{ rotate: 90, scale: 1.1 }}
              onClick={() => setSelectedImage(null)}
              className="absolute top-8 right-8 text-white/50 hover:text-primary transition-all p-3 glass-premium rounded-full"
            >
              <X size={32} />
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-6xl w-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.url}
                alt={selectedImage.caption}
                className="w-full h-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
              />
              <div className="mt-12 text-center">
                <div className="text-primary text-xs font-black uppercase tracking-[0.5em] mb-4">
                  {selectedImage.category || "Featured Selection"}
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-4">
                  {selectedImage.caption}
                </h2>
                <div className="w-12 h-[2px] bg-primary mx-auto" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
