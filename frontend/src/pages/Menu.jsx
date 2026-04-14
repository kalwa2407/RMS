import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Utensils, Info, Search, Sparkles, Filter, Leaf, Flame } from "lucide-react";

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [menuCategories, setMenuCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/menu`);
        const data = await res.json();
        setMenuItems(data);
        const categories = ["All", ...new Set(data.map((item) => item.category))];
        setMenuCategories(categories);
        setLoading(false);
      } catch (err) {
        console.error("Menu fetch failed:", err);
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

  return (
    <div className="min-h-screen bg-[#050b10] pt-40 pb-32 relative selection:bg-primary/30">
      {/* Decorative Aura */}
      <div className="absolute top-0 right-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header Section */}
        <header className="text-center mb-24 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-3 glass-premium rounded-full px-6 py-2 mb-8 border-white/5"
          >
            <Sparkles className="text-primary w-4 h-4" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">Gastronomic Artistry</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl md:text-8xl font-display font-black text-white mb-8"
          >
            Our <span className="golden-text">Collections</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 font-light text-xl max-w-2xl mx-auto leading-relaxed italic border-white/10"
          >
            "A masterfully curated anthology of Persian flavors, where every spice tells a thousand-year-old tale of royalty."
          </motion.p>
        </header>

        {/* Search & Filter Bar */}
        <div className="mb-20 flex flex-col md:flex-row gap-8 items-center justify-between glass-premium rounded-[3rem] p-4 border-white/5 focus-within:border-primary/30 transition-all duration-500">
          <div className="flex flex-wrap justify-center md:justify-start gap-2 h-max">
            {menuCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-8 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-500 border relative overflow-hidden group ${
                  selectedCategory === category
                    ? "bg-primary border-primary text-black shadow-[0_0_25px_rgba(234,179,8,0.3)]"
                    : "bg-white/[0.02] border-white/5 text-gray-500 hover:text-white hover:border-white/20"
                }`}
              >
                <span className="relative z-10">{category}</span>
                {selectedCategory === category && (
                   <motion.div layoutId="menu-tab-glow" className="absolute inset-0 bg-white/20 blur-lg" />
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={20} />
            <input 
               type="text" 
               placeholder="Find your craving..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-white/[0.03] border border-white/5 rounded-full py-4 pl-16 pr-8 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-all text-sm font-bold tracking-wide"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="relative">
              <div className="w-24 h-24 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame className="text-primary animate-pulse" />
              </div>
            </div>
            <p className="text-gray-400 font-black tracking-[0.5em] text-[10px] uppercase mt-10">Igniting The Hearth...</p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="group"
                >
                  <div className="brutal-card rounded-[3rem] p-4 h-full flex flex-col group hover:bg-white/[0.02] transition-all duration-700">
                    <div className="relative aspect-square overflow-hidden rounded-[2.5rem] mb-8">
                      <motion.img
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 1 }}
                        src={index === 0 ? "/signature_persian_kabab_platter_1776082069527.png" : item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:rotate-2"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1541544741938-0af808b77e40?w=800";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      <div className="absolute top-6 right-6 flex flex-col space-y-3">
                        <div className="glass-premium border-white/20 text-white px-5 py-2.5 rounded-full text-lg font-black italic shadow-2xl">
                          ₹{item.price}
                        </div>
                      </div>

                      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                        {item.veg ? (
                          <div className="flex items-center space-x-2 glass-premium px-4 py-1.5 rounded-full border-green-500/30">
                            <Leaf size={14} className="text-green-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Vegetarian</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 glass-premium px-4 py-1.5 rounded-full border-red-500/30">
                            <Flame size={14} className="text-red-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Royal Meat</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-6 pb-6 flex-1 flex flex-col">
                      <h3 className="text-3xl font-display font-black text-white mb-4 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-gray-500 text-sm font-light leading-relaxed mb-10 flex-1">
                        {item.description}
                      </p>

                      <Link to="/order" className="mt-auto">
                        <button className="w-full magnetic-button bg-primary text-black py-4.5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-primary/10 hover:bg-white transition-all group-hover:scale-[1.02]">
                          Order Now
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && filteredItems.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-40 border-2 border-dashed border-white/5 rounded-[4rem]"
          >
            <div className="magnetic-button inline-flex w-24 h-24 rounded-full glass-premium items-center justify-center text-primary/30 mb-8">
               <Utensils size={40} />
            </div>
            <h3 className="text-3xl font-display font-black text-white mb-4">No Flavors Found</h3>
            <p className="text-gray-500 font-light max-w-sm mx-auto">
              We couldn't find any masterpieces matching your search. Try broadening your royal search.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Menu;
