import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  Calendar,
  Menu as MenuIcon,
  Image,
  Star,
  TrendingUp,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,

    totalReservations: 0,
    pendingReservations: 0,

    totalMenuItems: 0,
    totalGalleryImages: 0,

    totalReviews: 0,
    avgRating: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const headers = { Authorization: `Bearer ${token}` };

      // ✔ FIXED — using ADMIN ROUTES
      const [
        ordersRes,
        reservationsRes,
        menuRes,
        galleryRes,
        reviewsRes,
      ] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/orders`, { headers }),
        axios.get(`${API_BASE}/api/admin/reservations`, { headers }),
        axios.get(`${API_BASE}/api/admin/menu`, { headers }),
        axios.get(`${API_BASE}/api/admin/gallery`, { headers }),
        axios.get(`${API_BASE}/api/admin/reviews`, { headers }),
      ]);

      const orders = ordersRes.data || [];
      const reservations = reservationsRes.data || [];
      const menu = menuRes.data || [];
      const gallery = galleryRes.data || [];
      const reviews = reviewsRes.data || [];

      const avgRating =
        reviews.length > 0
          ? (
              reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
              reviews.length
            ).toFixed(1)
          : 0;

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter((o) => o.status === "pending").length,

        totalReservations: reservations.length,
        pendingReservations: reservations.filter((r) => r.status === "pending")
          .length,

        totalMenuItems: menu.length,
        totalGalleryImages: gallery.length,

        totalReviews: reviews.length,
        avgRating,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Quick CTA cards
  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      subtitle: `${stats.pendingOrders} pending`,
      icon: ShoppingBag,
      color: "bg-blue-500",
    },
    {
      title: "Reservations",
      value: stats.totalReservations,
      subtitle: `${stats.pendingReservations} pending`,
      icon: Calendar,
      color: "bg-green-500",
    },
    {
      title: "Menu Items",
      value: stats.totalMenuItems,
      subtitle: "Active dishes",
      icon: MenuIcon,
      color: "bg-purple-500",
    },
    {
      title: "Gallery Images",
      value: stats.totalGalleryImages,
      subtitle: "Uploaded images",
      icon: Image,
      color: "bg-orange-500",
    },
    {
      title: "Reviews",
      value: stats.totalReviews,
      subtitle: `Avg: ${stats.avgRating} ⭐`,
      icon: Star,
      color: "bg-yellow-500",
    },
    {
      title: "Performance",
      value: "Excellent",
      subtitle: "All systems operational",
      icon: TrendingUp,
      color: "bg-teal-500",
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-20 text-primary text-xl">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="mb-10">
        <h2
          className="text-3xl text-white mb-2"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          Dashboard
        </h2>
        <p className="text-gray-500 text-xs uppercase tracking-widest" style={{ fontFamily: "'El Messiri', serif" }}>Welcome to Taste of Hindustan Admin Panel</p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 hover:border-primary/20 transition-all duration-500 group"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="bg-primary/10 p-3 rounded-xl border border-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>

              <h3 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                {card.value}
              </h3>
              <p className="text-primary text-[11px] uppercase tracking-widest font-bold" style={{ fontFamily: "'El Messiri', serif" }}>{card.title}</p>
              <p className="text-gray-500 text-xs mt-1">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* QUICK ACTIONS */}
      <div className="mt-8 bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[2rem] p-8">
        <h3
          className="text-xl text-white mb-6"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          Quick Actions
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/admin/menu")}
            className="bg-white/[0.02] border border-white/5 hover:bg-primary hover:text-black hover:border-primary text-gray-400 p-5 rounded-2xl transition-all duration-300 group"
          >
            <MenuIcon className="h-5 w-5 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ fontFamily: "'El Messiri', serif" }}>Add Menu</p>
          </button>

          <button
            onClick={() => navigate("/admin/gallery")}
            className="bg-white/[0.02] border border-white/5 hover:bg-primary hover:text-black hover:border-primary text-gray-400 p-5 rounded-2xl transition-all duration-300 group"
          >
            <Image className="h-5 w-5 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ fontFamily: "'El Messiri', serif" }}>Gallery</p>
          </button>

          <button
            onClick={() => navigate("/admin/orders")}
            className="bg-white/[0.02] border border-white/5 hover:bg-primary hover:text-black hover:border-primary text-gray-400 p-5 rounded-2xl transition-all duration-300 group"
          >
            <ShoppingBag className="h-5 w-5 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ fontFamily: "'El Messiri', serif" }}>Orders</p>
          </button>

          <button
            onClick={() => navigate("/admin/reservations")}
            className="bg-white/[0.02] border border-white/5 hover:bg-primary hover:text-black hover:border-primary text-gray-400 p-5 rounded-2xl transition-all duration-300 group"
          >
            <Calendar className="h-5 w-5 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ fontFamily: "'El Messiri', serif" }}>Reservations</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


