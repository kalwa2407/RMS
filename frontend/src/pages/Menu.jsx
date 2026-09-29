import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, Plus, UtensilsCrossed, ShoppingCart } from "lucide-react";
import API_BASE from "../lib/config";
import { lsCache, memCache } from "../lib/cache";


const RowSkeleton = () => (
  <div className="flex items-center gap-3 p-3 rounded-2xl border border-[#EAB308]/10 bg-[#1a4855]/40 animate-pulse">
    <div className="shrink-0 w-[72px] h-[72px] rounded-xl bg-[#0f2933]" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-[#0f2933] rounded-full w-2/3" />
      <div className="h-3 bg-[#0f2933] rounded-full w-full" />
      <div className="h-3 bg-[#0f2933] rounded-full w-4/5" />
      <div className="h-4 bg-[#0f2933] rounded-full w-16 mt-1" />
    </div>
    <div className="shrink-0 w-16 h-8 bg-[#0f2933] rounded-xl" />
  </div>
);

const PillSkeleton = () => (
  <div className="shrink-0 h-8 w-24 bg-[#1a4855] rounded-full animate-pulse" />
);

const Menu = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const pillsRef = useRef(null);

  useEffect(() => {
    const MENU_KEY = 'menu_v1';
    const MENU_TTL = 10 * 60 * 1000;
    const fetchMenu = async () => {
      // Check memory cache
      const memHit = memCache.get(MENU_KEY);
      if (memHit) { setMenuItems(memHit); setMenuCategories(["All", ...new Set(memHit.map(i => i.category))]); setLoading(false); return; }
      // Check localStorage cache
      const lsHit = lsCache.get(MENU_KEY);
      if (lsHit) { setMenuItems(lsHit); setMenuCategories(["All", ...new Set(lsHit.map(i => i.category))]); setLoading(false); memCache.set(MENU_KEY, lsHit, 2 * 60 * 1000); return; }
      // Network fetch
      try {
        const res = await fetch(`${API_BASE}/api/menu`);
        const data = await res.json();
        setMenuItems(data);
        setMenuCategories(["All", ...new Set(data.map((item) => item.category))]);
        lsCache.set(MENU_KEY, data, MENU_TTL);
        memCache.set(MENU_KEY, data, 2 * 60 * 1000);
      } catch (err) {
        console.error("Menu fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);


  const filteredItems = menuItems.filter((item) => {
    const matchCat = selectedCategory === "All" || item.category === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch && item.available;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#184956] to-[#0f2933] pt-24 pb-16">
      <style>{`
        .pills-scroll::-webkit-scrollbar{display:none;}
        .pills-scroll{-ms-overflow-style:none;scrollbar-width:none;}
        .menu-row{transition:background 0.15s ease;}
        .menu-row:hover{background:rgba(234,179,8,0.05);}
        .add-pill{transition:all 0.15s ease;}
        .add-pill:hover{background:#EAB308!important;color:#000!important;}
      `}</style>
      <div className="max-w-4xl mx-auto px-3 sm:px-5 lg:px-8">

        <div className="text-center mb-8 pt-2">
          <h1 className="text-4xl md:text-5xl font-bold text-[#EAB308] mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
            Our Menu
          </h1>
          <p className="text-gray-400 text-sm">Explore our authentic Persian and Mughlai delicacies</p>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search biryani, kebabs, desserts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a4855] border border-[#EAB308]/20 text-white pl-10 pr-10 py-3 rounded-2xl outline-none focus:border-[#EAB308]/60 placeholder-gray-500 text-sm transition-colors"
            style={{ fontSize: "16px" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
              <X size={15} />
            </button>
          )}
        </div>

        <div ref={pillsRef} className="pills-scroll flex gap-2 overflow-x-auto pb-2 mb-4">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => <PillSkeleton key={i} />)
            : menuCategories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button key={cat}
                    onClick={() => { setSelectedCategory(cat); setSearchQuery(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                      active
                        ? "bg-[#EAB308] text-black shadow-md"
                        : "bg-[#1a4855] text-gray-300 border border-[#EAB308]/20 hover:border-[#EAB308]/50 hover:text-white"
                    }`}>
                    {cat}
                  </button>
                );
              })}
        </div>

        {!loading && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <p className="text-white/80 text-sm font-bold">
              {searchQuery ? `Results for "${searchQuery}"` : selectedCategory === "All" ? "All Items" : selectedCategory}
            </p>
            <span className="bg-[#EAB308] text-black text-[11px] font-black px-2 py-0.5 rounded-full">{filteredItems.length}</span>
          </div>
        )}

        <div className="space-y-2">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => <RowSkeleton key={i} />)
            : filteredItems.length === 0
              ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-60">
                  <UtensilsCrossed size={48} className="text-[#EAB308]" />
                  <p className="text-gray-400 text-center text-sm">
                    {searchQuery ? `No items found for "${searchQuery}"` : "No items in this category"}
                  </p>
                </div>
              )
              : filteredItems.map((item) => {
                  const isVeg = item.is_veg !== false && !item.category?.toLowerCase().includes("non");
                  return (
                    <div key={item._id} className="menu-row flex items-center gap-3 p-3 rounded-2xl border border-[#EAB308]/10 bg-[#1a4855]/60">
                      <div className="relative shrink-0 w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-xl overflow-hidden bg-[#0f2933]">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = "/no-image.png"; }}
                        />
                        <div className={`absolute top-1 left-1 w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${isVeg ? "border-green-500 bg-[#0f2933]" : "border-red-500 bg-[#0f2933]"}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? "bg-green-500" : "bg-red-500"}`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-black text-sm sm:text-[15px] leading-snug truncate">{item.name}</h3>
                        {item.description && (
                          <p className="text-gray-400 text-[11px] sm:text-xs mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                        )}
                        <p className="text-[#EAB308] font-black text-sm mt-1.5">Rs.{item.price}</p>
                      </div>
                      <Link to="/order" className="shrink-0">
                        <button className="add-pill border-2 border-[#EAB308] text-[#EAB308] font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 bg-transparent">
                          <Plus size={13} /> ORDER
                        </button>
                      </Link>
                    </div>
                  );
                })}
        </div>

        {!loading && filteredItems.length > 0 && (
          <div className="mt-10 text-center">
            <Link to="/order">
              <button className="inline-flex items-center gap-2 bg-[#EAB308] hover:bg-[#CA8A04] text-black px-8 py-3.5 rounded-2xl font-black text-sm transition-all duration-300" style={{ boxShadow: "0 6px 24px rgba(234,179,8,0.30)" }}>
                <ShoppingCart size={18} />
                Go to Order Online
              </button>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default Menu;
