import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  Calendar,
  Menu as MenuIcon,
  Image,
  Star,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import API_BASE from "../../lib/config";
import { Page, PageHeader, StatCard, SectionTitle, List, ListRow, LoadingState } from "./ui";

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

  const statCards = [
    { title: "Orders", value: stats.totalOrders, subtitle: `${stats.pendingOrders} awaiting acceptance`, icon: ShoppingBag, tone: "accent", to: "/admin/orders" },
    { title: "Reservations", value: stats.totalReservations, subtitle: `${stats.pendingReservations} pending`, icon: Calendar, tone: "info", to: "/admin/reservations" },
    { title: "Menu items", value: stats.totalMenuItems, subtitle: "Dishes on the menu", icon: MenuIcon, tone: "neutral", to: "/admin/menu" },
    { title: "Reviews", value: stats.totalReviews, subtitle: stats.totalReviews ? `Average rating ${stats.avgRating}` : "No reviews yet", icon: Star, tone: "gold", to: "/admin/reviews" },
  ];

  const quickActions = [
    { label: "Live orders", hint: `${stats.pendingOrders} new`, icon: ShoppingBag, to: "/admin/orders" },
    { label: "Table bookings", hint: `${stats.pendingReservations} pending`, icon: Calendar, to: "/admin/reservations" },
    { label: "Manage menu", hint: `${stats.totalMenuItems} items`, icon: MenuIcon, to: "/admin/menu" },
    { label: "Gallery", hint: `${stats.totalGalleryImages} images`, icon: Image, to: "/admin/gallery" },
  ];

  if (loading) {
    return <LoadingState rows={4} label="Loading dashboard" />;
  }

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <Page>
      <PageHeader title="Dashboard" subtitle={today} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <StatCard
            key={card.title}
            label={card.title}
            value={card.value}
            sub={card.subtitle}
            icon={card.icon}
            tone={card.tone}
            onClick={() => navigate(card.to)}
          />
        ))}
      </div>

      <section className="space-y-2">
        <SectionTitle title="Quick actions" />
        <List className="max-w-3xl">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <ListRow
                key={a.label}
                onClick={() => navigate(a.to)}
                leading={
                  <span className="h-8 w-8 rounded-[8px] bg-[var(--a-fill)] flex items-center justify-center">
                    <Icon className="h-4 w-4 text-[var(--a-text-2)]" />
                  </span>
                }
                title={a.label}
                trailing={
                  <>
                    <span className="text-[13px] text-[var(--a-text-3)] pd-tabular">{a.hint}</span>
                    <ChevronRight className="h-4 w-4 text-[var(--a-text-3)]" />
                  </>
                }
              />
            );
          })}
        </List>
      </section>
    </Page>
  );
};

export default Dashboard;
