import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [menuCategories, setMenuCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${(process.env.REACT_APP_BACKEND_URL || "")}/api/menu`);
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
    <div className="min-h-screen bg-gradient-to-b from-[#184956] to-[#0f2933] pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <h1
            className="text-5xl md:text-6xl font-bold text-[#EAB308] mb-4"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Our Menu
          </h1>
          <p className="text-lg text-gray-300">
            Explore our authentic Persian and Mughlai delicacies
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a4855] text-white px-6 py-3 rounded-full border-2 border-[#EAB308]/30 focus:border-[#EAB308] outline-none placeholder-gray-400 text-sm"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <p className="text-center text-yellow-400 text-xl">Loading menu...</p>
        )}

        {/* Category Filters */}
        {!loading && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {menuCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 text-sm font-bold rounded-full transition-all duration-300 ${
                  selectedCategory === category
                    ? "bg-[#EAB308] text-black shadow-lg"
                    : "bg-transparent border-2 border-[#EAB308] text-[#EAB308] hover:bg-[#EAB308] hover:text-black"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="bg-[#1a4855] border-2 border-[#EAB308]/30 rounded-xl overflow-hidden hover:border-[#EAB308] hover:shadow-xl transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden border-b-2 border-[#EAB308]/30">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/no-image.png";
                  }}
                />
                <div className="absolute top-3 right-3 bg-[#EAB308] text-black px-3 py-1 rounded-full text-sm font-bold">
                  ₹{item.price}
                </div>
                {item.veg !== undefined && (
                  <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${
                    item.veg ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {item.veg ? '🌿 Veg' : '🍖 Non-Veg'}
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-1">
                  {item.name}
                </h3>
                <p className="text-gray-400 text-xs mb-3 leading-relaxed">
                  {item.description}
                </p>

                <Link to="/order">
                  <button className="w-full bg-[#EAB308] hover:bg-[#CA8A04] text-black py-2 rounded-full font-bold text-sm transition-all duration-300">
                    Order Now
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {!loading && filteredItems.length === 0 && (
          <p className="text-center text-gray-300 mt-10 text-lg">
            No items found matching your search.
          </p>
        )}
      </div>
    </div>
  );
};

export default Menu;
