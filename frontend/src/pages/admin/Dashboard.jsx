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

import API_BASE from "../../lib/config";

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
        pendingOrders: orders.filter((o) => o.status === "placed").length,

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
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-8 h-8 border-2 border-red-500/20 border-t-[#E40000] rounded-full animate-spin" />
        <p className="text-xs font-semibold text-neutral-500">Loading Master Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Executive Dashboard
          </h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mt-1">
            Persian Darbar · Camp Pune Live Telemetry
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>All Systems Live</span>
          </span>
        </div>
      </div>

      {/* STAT CARDS (macOS Widget Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white hover:bg-neutral-50/60 border border-black/[0.06] hover:border-amber-400/50 rounded-3xl p-5 transition-all duration-200 ios-press group shadow-xs"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform shadow-xs">
                  <Icon className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200/60">
                  {card.title}
                </span>
              </div>

              <h3 className="text-3xl font-black text-neutral-900 tracking-tight mb-1">
                {card.value}
              </h3>
              <p className="text-xs font-medium text-neutral-500">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-neutral-50/70 border border-black/[0.06] rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-neutral-900 tracking-tight">
            Quick Actions &amp; Operations
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            macOS Fast Navigation
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => navigate("/admin/menu")}
            className="bg-white border border-black/[0.06] hover:bg-gradient-to-r hover:from-[#E40000] hover:to-[#C90000] hover:border-transparent text-neutral-800 hover:text-white p-5 rounded-2xl transition-all ios-press cursor-pointer text-center group active:scale-95 shadow-xs"
          >
            <MenuIcon className="h-5 w-5 mx-auto mb-2 group-hover:scale-110 transition-transform text-amber-600 group-hover:text-white" />
            <p className="text-xs font-black uppercase tracking-wider">Manage Menu</p>
          </button>

          <button
            onClick={() => navigate("/admin/gallery")}
            className="bg-white border border-black/[0.06] hover:bg-gradient-to-r hover:from-[#E40000] hover:to-[#C90000] hover:border-transparent text-neutral-800 hover:text-white p-5 rounded-2xl transition-all ios-press cursor-pointer text-center group active:scale-95 shadow-xs"
          >
            <Image className="h-5 w-5 mx-auto mb-2 group-hover:scale-110 transition-transform text-amber-600 group-hover:text-white" />
            <p className="text-xs font-black uppercase tracking-wider">Gallery</p>
          </button>

          <button
            onClick={() => navigate("/admin/orders")}
            className="bg-white border border-black/[0.06] hover:bg-gradient-to-r hover:from-[#E40000] hover:to-[#C90000] hover:border-transparent text-neutral-800 hover:text-white p-5 rounded-2xl transition-all ios-press cursor-pointer text-center group active:scale-95 shadow-xs"
          >
            <ShoppingBag className="h-5 w-5 mx-auto mb-2 group-hover:scale-110 transition-transform text-amber-600 group-hover:text-white" />
            <p className="text-xs font-black uppercase tracking-wider">Live Orders</p>
          </button>

          <button
            onClick={() => navigate("/admin/reservations")}
            className="bg-white border border-black/[0.06] hover:bg-gradient-to-r hover:from-[#E40000] hover:to-[#C90000] hover:border-transparent text-neutral-800 hover:text-white p-5 rounded-2xl transition-all ios-press cursor-pointer text-center group active:scale-95 shadow-xs"
          >
            <Calendar className="h-5 w-5 mx-auto mb-2 group-hover:scale-110 transition-transform text-amber-600 group-hover:text-white" />
            <p className="text-xs font-black uppercase tracking-wider">Table Bookings</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


