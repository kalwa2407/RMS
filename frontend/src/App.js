import React from "react";
import "./App.css";
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
import CaptainsManagement from "./pages/admin/CaptainsManagement";
import DeliveryPartnersManagement from "./pages/admin/DeliveryPartnersManagement";
import KitchenStaffManagement from "./pages/admin/KitchenStaffManagement";

// Captain & Delivery Imports
import CaptainLogin from "./pages/captain/CaptainLogin";
import CaptainPanel from "./pages/captain/CaptainPanel";
import DeliveryLogin from "./pages/delivery/DeliveryLogin";
import DeliveryPanel from "./pages/delivery/DeliveryPanel";
import KitchenLogin from "./pages/kitchen/KitchenLogin";
import KitchenPanel from "./pages/kitchen/KitchenPanel";

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
            <Route path="captains" element={<CaptainsManagement />} />
            <Route path="delivery-partners" element={<DeliveryPartnersManagement />} />
            <Route path="kitchen-staff" element={<KitchenStaffManagement />} />
          </Route>

          {/* ---------------- CAPTAIN ROUTES ---------------- */}
          <Route path="/captain" element={<CaptainLogin />} />
          <Route path="/captain/panel" element={<CaptainPanel />} />

          {/* ---------------- DELIVERY ROUTES ---------------- */}
          <Route path="/delivery" element={<DeliveryLogin />} />
          <Route path="/delivery/panel" element={<DeliveryPanel />} />

          {/* ---------------- KITCHEN ROUTES ---------------- */}
          <Route path="/kitchen" element={<KitchenLogin />} />
          <Route path="/kitchen/panel" element={<KitchenPanel />} />

          {/* 404 — catch all */}
          <Route
            path="*"
            element={
              <>
                <Navbar />
                <div className="min-h-screen bg-[#0f2933] flex flex-col items-center justify-center text-center px-4">
                  <p className="text-[#EAB308] text-8xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>404</p>
                  <h1 className="text-white text-2xl font-semibold mb-2">Page Not Found</h1>
                  <p className="text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
                  <a href="/" className="bg-[#EAB308] text-black px-8 py-3 rounded-full font-bold hover:bg-white transition-all">
                    Go Home
                  </a>
                </div>
                <Footer />
              </>
            }
          />

        </Routes>

        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
