import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
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
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import TableOrder from "./pages/TableOrder";
import Events from "./pages/Events";
import InvoiceRedirect from "./pages/InvoiceRedirect";
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
import LoyaltyManagement from "./pages/admin/LoyaltyManagement";
import EventsManagement from "./pages/admin/EventsManagement";
import OffersManagement from "./pages/admin/OffersManagement";
import CustomersManagement from "./pages/admin/CustomersManagement";

// Captain & Delivery Imports
import CaptainLogin from "./pages/captain/CaptainLogin";
import CaptainPanel from "./pages/captain/CaptainPanel";
import DeliveryLogin from "./pages/delivery/DeliveryLogin";
import DeliveryPanel from "./pages/delivery/DeliveryPanel";
import KitchenLogin from "./pages/kitchen/KitchenLogin";
import KitchenPanel from "./pages/kitchen/KitchenPanel";

import ScrollToTop from "./components/ScrollToTop";
import StaffAppEntry from "./pages/StaffAppEntry";

// Customer Auth & Portal
import { CustomerAuthProvider } from "./context/CustomerAuthContext";
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerOrders from "./pages/customer/CustomerOrders";
import CustomerReservations from "./pages/customer/CustomerReservations";
import CustomerProfile from "./pages/customer/CustomerProfile";

import { isStandaloneApp } from "./lib/pwa";

import { useLocation } from "react-router-dom";
import { App as CapApp } from "@capacitor/app";

// Standalone / Native root redirect
// Staff app (in.persiandarbar.staff): /staff-entry
// Customer app (in.persiandarbar.customer): /customer/dashboard
const NativeRootRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleNativeRedirect = async () => {
      if (!isStandaloneApp()) {
        return;
      }

      // Customer App detection:
      // Default to customer app unless staff app mode or staff bundle id
      let isCustomer = true;
      if (
        window.__RMS_APP_MODE__ === "staff" ||
        process.env.REACT_APP_APP_MODE === "staff"
      ) {
        isCustomer = false;
      }

      // Native Capacitor App ID runtime check
      if (
        window.Capacitor &&
        typeof window.Capacitor.isNativePlatform === "function" &&
        window.Capacitor.isNativePlatform()
      ) {
        try {
          const info = await CapApp.getInfo();
          if (info && info.id === "in.persiandarbar.staff") {
            isCustomer = false;
          } else if (info && info.id === "in.persiandarbar.customer") {
            isCustomer = true;
          }
        } catch (e) {
          console.warn("CapApp.getInfo error:", e);
        }
      }

      if (isCustomer) {
        const token = localStorage.getItem('customer_jwt');
        if (token) {
          navigate("/customer/dashboard", { replace: true });
        } else {
          navigate("/customer/login", { replace: true });
        }
      } else if (sessionStorage.getItem("allow_public_website") !== "true") {
        navigate("/staff-entry", { replace: true });
      }
    };

    handleNativeRedirect();
  }, [navigate]);

  if (isStandaloneApp()) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E40000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Home />
      <Footer />
      <ChatBot />
    </>
  );
};

// Android Native Hardware Back Button Manager
const AndroidBackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let removeListener;
    if (window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform()) {
      CapApp.addListener("backButton", ({ canGoBack }) => {
        const path = location.pathname;
        if (
          path === "/staff-entry" ||
          path === "/customer" ||
          path === "/customer/dashboard" ||
          path === "/customer/login" ||
          path === "/"
        ) {
          CapApp.exitApp();
        } else if (
          path === "/admin/dashboard" ||
          path === "/captain/panel" ||
          path === "/kitchen/panel" ||
          path === "/delivery/panel"
        ) {
          navigate("/staff-entry");
        } else {
          navigate(-1);
        }
      }).then((handle) => {
        removeListener = handle;
      });
    }

    return () => {
      if (removeListener && typeof removeListener.remove === "function") {
        removeListener.remove();
      }
    };
  }, [location.pathname, navigate]);

  return null;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <CustomerAuthProvider>
          <ScrollToTop />
          <AndroidBackButtonHandler />
          <Routes>

            {/* ---------------- STAFF APP ENTRY (Capacitor native) ---------------- */}
            <Route path="/staff-entry" element={<StaffAppEntry />} />

            {/* ---------------- CUSTOMER PORTAL ---------------- */}
            <Route
              path="/customer"
              element={localStorage.getItem('customer_jwt') ? <CustomerDashboard /> : <CustomerLogin />}
            />
            <Route path="/customer/login" element={<CustomerLogin />} />
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/customer/orders" element={<CustomerOrders />} />
            <Route path="/customer/reservations" element={<CustomerReservations />} />
            <Route path="/customer/profile" element={<CustomerProfile />} />

            {/* ---------------- PUBLIC ROUTES ---------------- */}
            <Route path="/" element={<NativeRootRedirect />} />
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
              element={<OrderTracking />}
            />
            <Route
              path="/track-order/:orderId"
              element={<OrderTracking />}
            />
            <Route
              path="/track"
              element={<OrderTracking />}
            />
            <Route
              path="/track/:orderId"
              element={<OrderTracking />}
            />
            <Route path="/invoice/:orderId" element={<InvoiceRedirect />} />
            <Route path="/invoices/:orderId" element={<InvoiceRedirect />} />
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
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/account-deletion" element={<PrivacyPolicy />} />
          <Route path="/delete-account" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route
            path="/events"
            element={<><Navbar /><Events /><Footer /><ChatBot /></>}
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
            <Route path="events" element={<EventsManagement />} />
            <Route path="sound-settings" element={<SoundSettings />} />
            <Route path="settings" element={<Settings />} />
            <Route path="captains" element={<CaptainsManagement />} />
            <Route path="delivery-partners" element={<DeliveryPartnersManagement />} />
            <Route path="kitchen-staff" element={<KitchenStaffManagement />} />
            <Route path="loyalty" element={<LoyaltyManagement />} />
            <Route path="offers" element={<OffersManagement />} />
            <Route path="customers" element={<CustomersManagement />} />
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
              isStandaloneApp() ? (
                <CustomerDashboard />
              ) : (
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
              )
            }
          />

        </Routes>

        <Toaster />
        </CustomerAuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
