import React from "react";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatBot from "./components/ChatBot";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Gallery from "./pages/Gallery";
import Reviews from "./pages/Reviews";
import Order from "./pages/Order";
import OrderTracking from "./pages/OrderTracking";
import Reservation from "./pages/Reservation";
import About from "./pages/About";
import Contact from "./pages/Contact";
import TableOrder from "./pages/TableOrder";
import { Toaster } from "./components/ui/toaster";

// Admin Imports
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import MenuManagement from "./pages/admin/MenuManagement";
import GalleryManagement from "./pages/admin/GalleryManagement";
import OrdersManagement from "./pages/admin/OrdersManagement";
import ReservationsManagement from "./pages/admin/ReservationsManagement";
import ReviewsManagement from "./pages/admin/ReviewsManagement";
import SoundSettings from "./pages/admin/SoundSettings";
import Settings from "./pages/admin/Settings";
import KitchenView from "./pages/admin/KitchenView";
import TableManagement from "./pages/admin/TableManagement";
import Reports from "./pages/admin/Reports";
import TableSessions from "./pages/admin/TableSessions";
import Inventory from "./pages/admin/Inventory";

import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ScrollToTop />
        <Routes>

          {/* ---------------- PUBLIC ROUTES ---------------- */}
          <Route
            path="/"
            element={<><Navbar /><Home /><Footer /><ChatBot /></>}
          />
          <Route
            path="/menu"
            element={<><Navbar /><Menu /><Footer /><ChatBot /></>}
          />
          <Route
            path="/gallery"
            element={<><Navbar /><Gallery /><Footer /><ChatBot /></>}
          />
          <Route
            path="/reviews"
            element={<><Navbar /><Reviews /><Footer /><ChatBot /></>}
          />
          <Route
            path="/order"
            element={<><Navbar /><Order /><Footer /><ChatBot /></>}
          />
          <Route
            path="/track-order"
            element={<><Navbar /><OrderTracking /><Footer /><ChatBot /></>}
          />
          <Route
            path="/reservation"
            element={<><Navbar /><Reservation /><Footer /><ChatBot /></>}
          />
          <Route
            path="/about"
            element={<><Navbar /><About /><Footer /><ChatBot /></>}
          />
          <Route
            path="/contact"
            element={<><Navbar /><Contact /><Footer /><ChatBot /></>}
          />

          {/* ---------------- TABLE ORDERING (QR CODE) ---------------- */}
          <Route path="/table-order" element={<TableOrder />} />

          {/* ---------------- ADMIN ROUTES ---------------- */}

          {/* Admin Login */}
          <Route path="/admin" element={<AdminLogin />} />

          {/* Protected Admin Layout */}
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="gallery" element={<GalleryManagement />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="table-sessions" element={<TableSessions />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="kitchen" element={<KitchenView />} />
            <Route path="tables" element={<TableManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reservations" element={<ReservationsManagement />} />
            <Route path="reviews" element={<ReviewsManagement />} />
            <Route path="sound-settings" element={<SoundSettings />} />
            <Route path="settings" element={<Settings />} />
          </Route>

        </Routes>

        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
