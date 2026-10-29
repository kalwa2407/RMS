import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  UtensilsCrossed,
  Coins,
  ArrowUpDown,
  ExternalLink,
  MessageCircle,
  Eye,
  X,
  Sparkles,
  Crown,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  Receipt,
  UserCheck,
  Smartphone,
  Globe,
  RefreshCw,
  Award,
  Filter,
  DollarSign,
  LayoutGrid,
  List,
  Copy,
  Check
} from "lucide-react";
import API_BASE from "../../lib/config";
import { useToast } from "../../hooks/use-toast";

export default function CustomersManagement() {
  const { toast } = useToast();
  const token = localStorage.getItem("admin_token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedUid, setCopiedUid] = useState(null);
  const [dataPayload, setDataPayload] = useState({
    customers: [],
    total_count: 0,
    google_count: 0,
    phone_count: 0,
    total_orders_all: 0,
    total_spent_all: 0,
    total_reservations_all: 0
  });

  // UI Filter / View states
  // 'all' | 'google' | 'phone'
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("spent_desc"); // 'spent_desc' | 'orders_desc' | 'res_desc' | 'newest' | 'coins_desc'
  const [activityFilter, setActivityFilter] = useState("all"); // 'all' | 'has_orders' | 'has_res' | 'vip'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  // Modal / Dossier state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dossierTab, setDossierTab] = useState("dishes"); // 'dishes' | 'orders' | 'reservations' | 'coins'

  // Fetch all customers & metrics from backend
  const fetchCustomers = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await axios.get(`${API_BASE}/api/admin/customers`, { headers });
      if (res.data && res.data.success) {
        setDataPayload(res.data);
      } else {
        throw new Error(res.data?.detail || "Could not retrieve customers list");
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      toast({
        title: "Sync Error",
        description: err.response?.data?.detail || err.message || "Failed to load customer records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [headers, toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Keep selectedCustomer updated if data refreshes
  useEffect(() => {
    if (selectedCustomer) {
      const updated = dataPayload.customers.find(
        (c) => c.uid === selectedCustomer.uid || c._id === selectedCustomer._id
      );
      if (updated) setSelectedCustomer(updated);
    }
  }, [dataPayload.customers, selectedCustomer]);

  // Filtered & Sorted Customer list
  const filteredCustomers = useMemo(() => {
    let list = [...(dataPayload.customers || [])];

    // 1. Tab segmentation (Google vs Phone)
    if (activeTab === "google") {
      list = list.filter((c) => c.provider === "google");
    } else if (activeTab === "phone") {
      list = list.filter((c) => c.provider === "phone");
    }

    // 2. Search query filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const nameMatch = (c.name || "").toLowerCase().includes(q);
        const phoneMatch = (c.phone || "").includes(q);
        const emailMatch = (c.email || "").toLowerCase().includes(q);
        const uidMatch = (c.uid || "").toLowerCase().includes(q);
        return nameMatch || phoneMatch || emailMatch || uidMatch;
      });
    }

    // 3. Activity filter
    if (activityFilter === "has_orders") {
      list = list.filter((c) => c.total_orders > 0);
    } else if (activityFilter === "has_res") {
      list = list.filter((c) => c.total_reservations > 0);
    } else if (activityFilter === "vip") {
      list = list.filter((c) => (c.total_spent || 0) >= 1000 || (c.total_orders || 0) >= 3);
    }

    // 4. Sorting
    list.sort((a, b) => {
      if (sortBy === "spent_desc") return (b.total_spent || 0) - (a.total_spent || 0);
      if (sortBy === "orders_desc") return (b.total_orders || 0) - (a.total_orders || 0);
      if (sortBy === "res_desc") return (b.total_reservations || 0) - (a.total_reservations || 0);
      if (sortBy === "coins_desc") return (b.pd_coins || 0) - (a.pd_coins || 0);
      if (sortBy === "newest") {
        const dateA = a.created_at || a.last_active || "";
        const dateB = b.created_at || b.last_active || "";
        return dateB.localeCompare(dateA);
      }
      return 0;
    });

    return list;
  }, [dataPayload.customers, activeTab, searchQuery, activityFilter, sortBy]);

  // Copy helper
  const handleCopy = (text, uid) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  // Format date helpers
  const formatDate = (isoStr) => {
    if (!isoStr) return "N/A";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return isoStr;
    }
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return "N/A";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">

      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER & EXECUTIVE ACTIONS (Apple Pro Studio Style)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-black/[0.06] p-6 rounded-3xl shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#E40000] to-[#C90000] text-white flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
                Patron Directory &amp; CRM
              </h1>
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-50 text-[#E40000] border border-red-200/80">
                {dataPayload.total_count} Verified Patrons
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium mt-1">
              Persian Darbar Camp Pune · Segmented customer profiles, live dish order histories, and dining reservations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={() => fetchCustomers(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 transition-all text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
            title="Reload customer metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-neutral-600 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. METRIC STATS OVERVIEW CARDS (Apple Squircle KPI Cards)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div 
          onClick={() => setActiveTab("all")}
          className={`cursor-pointer bg-white border rounded-3xl p-5 shadow-xs transition-all ios-press ${
            activeTab === "all" ? "border-neutral-900 ring-2 ring-neutral-900/10" : "border-black/[0.06] hover:border-neutral-300"
          }`}
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">All Patrons</span>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-neutral-900">{dataPayload.total_count}</div>
          <div className="text-[11px] text-neutral-500 font-medium mt-1">
            100% Registered CRM Directory
          </div>
        </div>

        {/* Google Users */}
        <div 
          onClick={() => setActiveTab("google")}
          className={`cursor-pointer bg-white border rounded-3xl p-5 shadow-xs transition-all ios-press ${
            activeTab === "google" ? "border-blue-600 ring-2 ring-blue-500/20" : "border-black/[0.06] hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Google Accounts
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {dataPayload.total_count ? Math.round((dataPayload.google_count / dataPayload.total_count) * 100) : 0}%
            </span>
          </div>
          <div className="text-3xl font-black text-neutral-900">{dataPayload.google_count}</div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">OAuth Google Sign-in Patrons</div>
        </div>

        {/* Phone OTP Users */}
        <div 
          onClick={() => setActiveTab("phone")}
          className={`cursor-pointer bg-white border rounded-3xl p-5 shadow-xs transition-all ios-press ${
            activeTab === "phone" ? "border-emerald-600 ring-2 ring-emerald-500/20" : "border-black/[0.06] hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" /> Mobile OTP Users
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {dataPayload.total_count ? Math.round((dataPayload.phone_count / dataPayload.total_count) * 100) : 0}%
            </span>
          </div>
          <div className="text-3xl font-black text-neutral-900">{dataPayload.phone_count}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">Direct SMS / WhatsApp OTP</div>
        </div>

        {/* Lifetime Revenue & Orders */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Orders Volume</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-neutral-900">
            ₹{Number(dataPayload.total_spent_all || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium mt-1">
            {dataPayload.total_orders_all} Orders · {dataPayload.total_reservations_all} Table Bookings
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. SEGMENT TABS, SEARCH & VIEW MODE TOOLBAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-black/[0.06] p-5 rounded-3xl space-y-4 shadow-xs">
        {/* Top: Tabs & Counts */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          {/* Apple Segmented Control for Authentication Provider */}
          <div className="flex bg-neutral-100 p-1 rounded-2xl gap-1">
            {/* All Users Tab */}
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Patrons</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === "all" ? "bg-neutral-100 text-neutral-800" : "bg-black/5 text-neutral-500"
              }`}>
                {dataPayload.total_count}
              </span>
            </button>

            {/* Google Users Tab */}
            <button
              onClick={() => setActiveTab("google")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "google"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-neutral-500 hover:text-blue-600"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Google</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === "google" ? "bg-blue-50 text-blue-600" : "bg-black/5 text-neutral-500"
              }`}>
                {dataPayload.google_count}
              </span>
            </button>

            {/* Phone OTP Users Tab */}
            <button
              onClick={() => setActiveTab("phone")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "phone"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-neutral-500 hover:text-emerald-600"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile OTP</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === "phone" ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-neutral-500"
              }`}>
                {dataPayload.phone_count}
              </span>
            </button>
          </div>

          {/* Quick Activity Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-neutral-400 font-semibold mr-1">Activity:</span>
            <button
              onClick={() => setActivityFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activityFilter === "all"
                  ? "bg-neutral-900 text-white shadow-2xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActivityFilter("has_orders")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activityFilter === "has_orders"
                  ? "bg-[#E40000] text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70"
              }`}
            >
              Has Orders
            </button>
            <button
              onClick={() => setActivityFilter("has_res")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activityFilter === "has_res"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70"
              }`}
            >
              Has Bookings
            </button>
            <button
              onClick={() => setActivityFilter("vip")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activityFilter === "vip"
                  ? "bg-amber-500 text-neutral-950 shadow-xs"
                  : "bg-amber-50 text-amber-700 border border-amber-200/80 hover:bg-amber-100"
              }`}
            >
              <Crown className="w-3 h-3" />
              <span>VIP Patrons</span>
            </button>
          </div>
        </div>

        {/* Bottom Toolbar: Search, Sort & View Mode Switcher */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Apple Search Capsule */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patron by name, phone (+91), email, or user ID..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-neutral-900 placeholder-neutral-400 text-xs font-medium focus:outline-none focus:border-red-500 focus:bg-white transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-between md:justify-end">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200/80 text-neutral-800 text-xs font-bold focus:outline-none focus:border-red-500 cursor-pointer shadow-2xs"
              >
                <option value="spent_desc">Highest Lifetime Spend (₹)</option>
                <option value="orders_desc">Most Orders Placed</option>
                <option value="res_desc">Most Table Bookings</option>
                <option value="newest">Newest Registered</option>
                <option value="coins_desc">Highest PD Coins</option>
              </select>
            </div>

            {/* Layout Arrangement Toggle (Grid vs Table) */}
            <div className="flex items-center bg-neutral-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                title="Directory Cards Arrangement"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-neutral-900 shadow-2xs"
                    : "text-neutral-400 hover:text-neutral-800"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                title="Master Table Arrangement"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-neutral-900 shadow-2xs"
                    : "text-neutral-400 hover:text-neutral-800"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4. CUSTOMER ARRANGEMENT (GRID CARDS & MASTER TABLE VIEW)
      ══════════════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="bg-white border border-black/[0.06] rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="w-10 h-10 border-3 border-red-500/20 border-t-[#E40000] rounded-full animate-spin mb-4" />
          <h3 className="text-base font-bold text-neutral-900">Aggregating Patron Intelligence...</h3>
          <p className="text-xs text-neutral-400 mt-1">Compiling dish preferences, lifetime spends, and table booking histories</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white border border-black/[0.06] rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-xs">
          <Users className="w-12 h-12 text-neutral-300 mb-3" />
          <h3 className="text-lg font-bold text-neutral-900">No Customers Found</h3>
          <p className="text-xs text-neutral-500 max-w-md mt-1">
            {searchQuery
              ? `No patron matches the query "${searchQuery}". Try searching with a different name or number.`
              : `No customers found in this segment.`}
          </p>
          {(searchQuery || activityFilter !== "all") && (
            <button
              onClick={() => { setSearchQuery(""); setActivityFilter("all"); setActiveTab("all"); }}
              className="mt-4 px-4 py-2 rounded-2xl bg-neutral-900 text-white font-bold text-xs shadow-xs hover:bg-black transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ─────────────────────────────────────────────────────────────
           ARRANGEMENT A: APPLE CRM DIRECTORY CARDS (GRID VIEW)
        ───────────────────────────────────────────────────────────── */
        <div className="space-y-3">
          <div className="text-xs font-semibold text-neutral-500 px-1 flex items-center justify-between">
            <span>Arranged by <strong>{sortBy.replace("_desc", "").toUpperCase()}</strong> · Showing <strong className="text-neutral-900">{filteredCustomers.length}</strong> patrons</span>
            <span className="hidden sm:inline">Tap any card to view detailed dining dossier</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
            {filteredCustomers.map((customer) => {
              const isGoogle = customer.provider === "google";
              const isGuest = customer.is_guest;
              const hasOrders = (customer.total_orders || 0) > 0;
              const totalSpent = Number(customer.total_spent || 0);
              const isVip = totalSpent >= 2500 || (customer.total_orders || 0) >= 4;
              const topDish = customer.favorite_items && customer.favorite_items.length > 0
                ? customer.favorite_items[0]
                : null;

              return (
                <div
                  key={customer.uid || customer._id}
                  onClick={() => { setSelectedCustomer(customer); setDossierTab("dishes"); }}
                  className="bg-white hover:bg-neutral-50/50 border border-black/[0.06] hover:border-amber-400/60 rounded-3xl p-5 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md group flex flex-col justify-between relative overflow-hidden"
                >
                  {/* VIP Ribbon badge on top-right */}
                  {isVip && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-400 text-neutral-950 font-black text-[9px] uppercase tracking-wider px-3 py-0.5 rounded-bl-xl shadow-2xs flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5" />
                      <span>VIP Patron</span>
                    </div>
                  )}

                  <div>
                    {/* Header: Avatar, Name, and Provider Tag */}
                    <div className="flex items-start gap-3.5">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {customer.picture ? (
                          <img
                            src={customer.picture}
                            alt={customer.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-black/[0.08] shadow-xs"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-xs ${
                            isGoogle
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {(customer.name || "U").charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Corner indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] shadow-xs ${
                          isGoogle ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                        }`}>
                          {isGoogle ? <Globe className="w-2.5 h-2.5" /> : <Smartphone className="w-2.5 h-2.5" />}
                        </div>
                      </div>

                      {/* Name & Provider badge */}
                      <div className="min-w-0 flex-1 pr-14">
                        <h3 className="text-sm font-black text-neutral-900 group-hover:text-[#E40000] transition-colors truncate">
                          {customer.name || "Guest Patron"}
                        </h3>

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {isGoogle ? (
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                              <Globe className="w-2.5 h-2.5" /> Google
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <Smartphone className="w-2.5 h-2.5" /> Phone OTP
                            </span>
                          )}

                          {isGuest && (
                            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Guest
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-neutral-400 font-medium mt-1 truncate">
                          Joined: {formatDate(customer.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Contact details row */}
                    <div className="mt-3.5 pt-3 border-t border-neutral-100 space-y-1.5">
                      {customer.phone && (
                        <div className="flex items-center justify-between text-xs text-neutral-700">
                          <span className="flex items-center gap-1.5 font-mono font-semibold">
                            <Phone className="w-3 h-3 text-[#E40000]" />
                            +91 {customer.phone}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(`+91${customer.phone}`, customer.uid);
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
                            title="Copy Phone Number"
                          >
                            {copiedUid === customer.uid ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}

                      {customer.email && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 truncate">
                          <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Telemetry Chips Bar (3 Pills) */}
                    <div className="grid grid-cols-3 gap-2 mt-3.5 bg-neutral-50/90 border border-neutral-200/60 p-2.5 rounded-2xl text-center">
                      {/* Orders & Spend */}
                      <div className="border-r border-neutral-200/60 pr-1">
                        <div className="text-[10px] font-bold text-neutral-500 flex items-center justify-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-[#E40000]" /> Orders
                        </div>
                        <div className="text-xs font-black text-neutral-900 mt-0.5">
                          {customer.total_orders || 0}
                        </div>
                        <div className="text-[10px] font-black text-emerald-700 font-mono">
                          ₹{totalSpent.toLocaleString("en-IN")}
                        </div>
                      </div>

                      {/* Reservations */}
                      <div className="border-r border-neutral-200/60 pr-1">
                        <div className="text-[10px] font-bold text-neutral-500 flex items-center justify-center gap-1">
                          <Calendar className="w-3 h-3 text-purple-600" /> Bookings
                        </div>
                        <div className="text-xs font-black text-neutral-900 mt-0.5">
                          {customer.total_reservations || 0}
                        </div>
                        <div className="text-[10px] font-medium text-neutral-400">
                          Tables
                        </div>
                      </div>

                      {/* Coins */}
                      <div>
                        <div className="text-[10px] font-bold text-neutral-500 flex items-center justify-center gap-1">
                          <Coins className="w-3 h-3 text-amber-500" /> Coins
                        </div>
                        <div className="text-xs font-black text-amber-600 mt-0.5">
                          {customer.pd_coins || 0}
                        </div>
                        <div className="text-[10px] font-medium text-neutral-400">
                          Balance
                        </div>
                      </div>
                    </div>

                    {/* Favorite Dish Pill */}
                    {topDish ? (
                      <div className="mt-3 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-left">
                        <div className="text-[9.5px] uppercase font-black text-amber-800 flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5 text-amber-600" /> Favorite Item
                        </div>
                        <div className="text-xs font-bold text-neutral-900 truncate mt-0.5">
                          {topDish.name}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          Ordered <strong className="text-amber-800">{topDish.count}×</strong> (₹{topDish.total_spent})
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-[10px] text-neutral-400 italic bg-neutral-50 py-1.5 px-3 rounded-xl border border-neutral-200/60">
                        New patron · No orders placed yet
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Quick Actions */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(customer);
                        setDossierTab("dishes");
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-[#E40000] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Dossier</span>
                    </button>

                    {customer.phone && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Direct WhatsApp */}
                        <a
                          href={`https://wa.me/91${customer.phone}?text=${encodeURIComponent(
                            `Hello ${customer.name || "Customer"}, greetings from Persian Darbar Camp, Pune!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 transition-all cursor-pointer shadow-2xs"
                          title="Chat on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>

                        {/* Direct Call */}
                        <a
                          href={`tel:${customer.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200/80 transition-all cursor-pointer shadow-2xs"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
           ARRANGEMENT B: MASTER DATA TABLE (TABLE VIEW)
        ───────────────────────────────────────────────────────────── */
        <div className="bg-white border border-black/[0.06] rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200/80 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-5">Patron</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Orders / Spend</th>
                  <th className="py-3.5 px-4">Bookings</th>
                  <th className="py-3.5 px-4">PD Coins</th>
                  <th className="py-3.5 px-4">Top Favorite Item</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredCustomers.map((customer) => {
                  const isGoogle = customer.provider === "google";
                  const topDish = customer.favorite_items && customer.favorite_items.length > 0
                    ? customer.favorite_items[0]
                    : null;
                  const totalSpent = Number(customer.total_spent || 0);

                  return (
                    <tr
                      key={customer.uid || customer._id}
                      onClick={() => { setSelectedCustomer(customer); setDossierTab("dishes"); }}
                      className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Patron Identity */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {customer.picture ? (
                            <img
                              src={customer.picture}
                              alt={customer.name}
                              className="w-9 h-9 rounded-xl object-cover border border-black/[0.06] shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-700 font-black flex items-center justify-center shrink-0">
                              {(customer.name || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-neutral-900 group-hover:text-[#E40000] transition-colors block truncate">
                              {customer.name || "Guest Patron"}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                              isGoogle ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-700"
                            }`}>
                              {isGoogle ? "Google" : "Phone OTP"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {customer.phone && (
                            <span className="block font-mono font-semibold text-neutral-800">
                              +91 {customer.phone}
                            </span>
                          )}
                          {customer.email && (
                            <span className="block text-neutral-400 truncate max-w-[180px]">
                              {customer.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Orders / Spend */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-black text-neutral-900 block">
                            {customer.total_orders || 0} Orders
                          </span>
                          <span className="font-mono font-bold text-emerald-700 text-[11px]">
                            ₹{totalSpent.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </td>

                      {/* Bookings */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-neutral-700">
                          {customer.total_reservations || 0} Tables
                        </span>
                      </td>

                      {/* PD Coins */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-amber-600 flex items-center gap-1">
                          <Coins className="w-3 h-3 text-amber-500" />
                          {customer.pd_coins || 0}
                        </span>
                      </td>

                      {/* Top Item */}
                      <td className="py-3.5 px-4">
                        {topDish ? (
                          <div className="truncate max-w-[180px]">
                            <span className="font-bold text-neutral-900 block truncate">
                              {topDish.name}
                            </span>
                            <span className="text-[10px] text-amber-700 font-semibold">
                              {topDish.count}× ordered
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">None</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(customer);
                            setDossierTab("dishes");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-neutral-100 group-hover:bg-[#E40000] text-neutral-700 group-hover:text-white font-bold text-xs transition-all cursor-pointer"
                        >
                          Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          5. CUSTOMER DOSSIER MODAL (Apple Sheet Style)
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 lg:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-black/[0.08] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">

            {/* Dossier Top Banner */}
            <div className="p-6 bg-neutral-50/70 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Large Avatar */}
                <div className="relative shrink-0">
                  {selectedCustomer.picture ? (
                    <img
                      src={selectedCustomer.picture}
                      alt={selectedCustomer.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-neutral-200 text-neutral-800 flex items-center justify-center text-2xl font-black shadow-sm">
                      {(selectedCustomer.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md ${
                    selectedCustomer.provider === "google" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                  }`}>
                    {selectedCustomer.provider === "google" ? <Globe className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl lg:text-2xl font-black text-neutral-900 tracking-tight">
                      {selectedCustomer.name || "Customer Profile"}
                    </h2>
                    {selectedCustomer.provider === "google" ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-blue-50 text-blue-700 border border-blue-200">
                        Google Verified
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Mobile Phone OTP
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mt-1">
                    {selectedCustomer.phone && (
                      <span className="font-mono text-neutral-800 font-semibold flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#E40000]" />
                        +91 {selectedCustomer.phone}
                      </span>
                    )}
                    {selectedCustomer.email && (
                      <span className="flex items-center gap-1 text-neutral-600">
                        <Mail className="w-3 h-3 text-blue-500" />
                        {selectedCustomer.email}
                      </span>
                    )}
                    <span className="text-neutral-400">
                      ID: <span className="font-mono text-neutral-600">{selectedCustomer.uid}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedCustomer(null)}
                className="self-start md:self-center p-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick KPI Ribbon */}
            <div className="grid grid-cols-4 bg-white border-b border-neutral-100 p-4 text-center divide-x divide-neutral-100">
              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Orders</div>
                <div className="text-xl font-black text-neutral-900 mt-0.5">{selectedCustomer.total_orders || 0}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Lifetime Spend</div>
                <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">
                  ₹{Number(selectedCustomer.total_spent || 0).toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Reservations</div>
                <div className="text-xl font-black text-purple-700 mt-0.5">{selectedCustomer.total_reservations || 0}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">PD Coins</div>
                <div className="text-xl font-black text-amber-600 mt-0.5">{selectedCustomer.pd_coins || 0}</div>
              </div>
            </div>

            {/* Dossier Segmented Tab Navigation */}
            <div className="bg-neutral-50 px-6 pt-3 flex gap-2 border-b border-neutral-200/80 overflow-x-auto">
              {/* Tab 1: Dish Breakdown */}
              <button
                onClick={() => setDossierTab("dishes")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  dossierTab === "dishes"
                    ? "bg-white text-[#E40000] border-[#E40000] shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-900 border-transparent"
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Dishes &amp; Frequencies</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 font-black">
                  {selectedCustomer.favorite_items?.length || 0}
                </span>
              </button>

              {/* Tab 2: Orders List */}
              <button
                onClick={() => setDossierTab("orders")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  dossierTab === "orders"
                    ? "bg-white text-[#E40000] border-[#E40000] shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-900 border-transparent"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Order History</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 font-black">
                  {selectedCustomer.orders?.length || 0}
                </span>
              </button>

              {/* Tab 3: Table Reservations */}
              <button
                onClick={() => setDossierTab("reservations")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  dossierTab === "reservations"
                    ? "bg-white text-[#E40000] border-[#E40000] shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-900 border-transparent"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Table Bookings</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 font-black">
                  {selectedCustomer.reservations?.length || 0}
                </span>
              </button>

              {/* Tab 4: Loyalty Coins History */}
              <button
                onClick={() => setDossierTab("coins")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  dossierTab === "coins"
                    ? "bg-white text-[#E40000] border-[#E40000] shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-900 border-transparent"
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>PD Coins Ledger</span>
              </button>
            </div>

            {/* Dossier Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[55vh]">

              {/* TAB 1: DISH ORDER FREQUENCY */}
              {dossierTab === "dishes" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      Dish Order Breakdown &amp; Quantities
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Lifetime count of every dish ordered by this customer at Persian Darbar.
                    </p>
                  </div>

                  {!selectedCustomer.favorite_items || selectedCustomer.favorite_items.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-200/60">
                      <UtensilsCrossed className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                      <p className="text-neutral-700 font-bold text-xs">No food orders recorded</p>
                      <p className="text-[11px] text-neutral-400">This patron has not completed any food orders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedCustomer.favorite_items.map((item, idx) => {
                        const maxCount = selectedCustomer.favorite_items[0].count || 1;
                        const percentage = Math.round((item.count / maxCount) * 100);

                        return (
                          <div
                            key={idx}
                            className="bg-neutral-50/80 border border-neutral-200/70 p-3.5 rounded-2xl hover:border-amber-400/50 transition-all"
                          >
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                                  idx === 0
                                    ? "bg-amber-400 text-neutral-950 shadow-2xs"
                                    : idx === 1
                                    ? "bg-neutral-300 text-neutral-900"
                                    : idx === 2
                                    ? "bg-amber-700 text-white"
                                    : "bg-neutral-200 text-neutral-600"
                                }`}>
                                  #{idx + 1}
                                </span>
                                <div>
                                  <span className="text-xs font-bold text-neutral-900">{item.name}</span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="text-xs font-black text-amber-700">
                                  Ordered {item.count} {item.count === 1 ? "time" : "times"}
                                </div>
                                <div className="text-[11px] font-mono text-emerald-700 font-bold">
                                  ₹{Number(item.total_spent || 0).toLocaleString("en-IN")}
                                </div>
                              </div>
                            </div>

                            {/* Popularity progress meter */}
                            <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-amber-400 to-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ORDER HISTORY */}
              {dossierTab === "orders" && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#E40000]" />
                      Complete Order History ({selectedCustomer.orders?.length || 0})
                    </h4>
                  </div>

                  {!selectedCustomer.orders || selectedCustomer.orders.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-200/60">
                      <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                      <p className="text-neutral-700 font-bold text-xs">No orders on record</p>
                    </div>
                  ) : (
                    selectedCustomer.orders.map((ord, idx) => {
                      const oid = ord.order_id || ord._id || ord.id || `ORD-${idx + 1}`;
                      const orderTotal = ord.total || ord.total_amount || ord.final_amount || 0;
                      const status = (ord.status || "completed").toLowerCase();

                      return (
                        <div
                          key={oid}
                          className="bg-neutral-50/80 border border-neutral-200/70 p-4 rounded-2xl space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-neutral-900 bg-white px-2 py-0.5 rounded-lg border border-neutral-200/70 shadow-2xs">
                                {oid}
                              </span>
                              <span className="text-[11px] text-neutral-500">
                                {formatDateTime(ord.created_at || ord.timestamp)}
                              </span>
                              {ord.order_type && (
                                <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  {ord.order_type}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                status === "completed" || status === "delivered"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : status === "cancelled"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {status}
                              </span>
                              <span className="text-xs font-black font-mono text-emerald-700">
                                ₹{Number(orderTotal).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>

                          {/* Itemized list */}
                          <div className="space-y-1.5 pl-1">
                            {ord.items && ord.items.map((it, itemIdx) => (
                              <div key={itemIdx} className="flex items-center justify-between text-xs text-neutral-700">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#E40000] bg-red-50 px-1.5 py-0.2 rounded font-mono text-[11px]">
                                    {it.quantity || it.qty || 1}×
                                  </span>
                                  <span className="font-semibold text-neutral-900">{it.name || it.title}</span>
                                </div>
                                <span className="font-mono text-neutral-500">
                                  ₹{Number((it.price || 0) * (it.quantity || it.qty || 1)).toLocaleString("en-IN")}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Address */}
                          {ord.delivery_address && (
                            <div className="text-[11px] text-neutral-600 bg-white p-2 rounded-xl border border-neutral-200/60">
                              📍 <strong>Delivery Address:</strong> {ord.delivery_address}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 3: TABLE RESERVATIONS */}
              {dossierTab === "reservations" && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      Table Bookings &amp; Reservations ({selectedCustomer.reservations?.length || 0})
                    </h4>
                  </div>

                  {!selectedCustomer.reservations || selectedCustomer.reservations.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-200/60">
                      <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                      <p className="text-neutral-700 font-bold text-xs">No table bookings on record</p>
                    </div>
                  ) : (
                    selectedCustomer.reservations.map((res, idx) => {
                      const rid = res.id || res._id || `RES-${idx + 1}`;
                      const status = (res.status || "confirmed").toLowerCase();

                      return (
                        <div
                          key={rid}
                          className="bg-neutral-50/80 border border-neutral-200/70 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-neutral-900 bg-white px-2 py-0.5 rounded-lg border border-neutral-200/70">
                                {rid}
                              </span>
                              <span className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                status === "confirmed"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : status === "completed"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : status === "cancelled"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {status}
                              </span>
                            </div>

                            <div className="text-xs font-black text-neutral-900">
                              📅 {res.date || "Date"} · ⏰ {res.time || "Time slot"}
                            </div>

                            <div className="text-xs text-neutral-600 flex items-center gap-3">
                              <span>👥 <strong>{res.guests || res.guest_count || 2}</strong> Guests</span>
                              {res.table_number && <span>🪑 Table <strong>#{res.table_number}</strong></span>}
                            </div>

                            {res.special_requests && (
                              <div className="text-[11px] text-amber-700 italic mt-1">
                                Note: "{res.special_requests}"
                              </div>
                            )}
                          </div>

                          <div className="text-right text-[11px] text-neutral-400">
                            Booked on: {formatDateTime(res.created_at)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 4: COINS HISTORY */}
              {dossierTab === "coins" && (
                <div className="space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-xs text-amber-800 uppercase font-bold">Active Wallet Balance</div>
                      <div className="text-2xl font-black text-amber-600 flex items-center gap-2 mt-0.5">
                        <Coins className="w-6 h-6" />
                        <span>{selectedCustomer.pd_coins || 0} PD Coins</span>
                      </div>
                      <div className="text-xs text-neutral-600 mt-1">
                        Worth ₹{selectedCustomer.pd_coins || 0} in discounts at Persian Darbar
                      </div>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Transaction History</h4>

                  {!selectedCustomer.coins_history || selectedCustomer.coins_history.length === 0 ? (
                    <div className="text-center py-8 bg-neutral-50 rounded-2xl border border-neutral-200/60 text-neutral-400 text-xs">
                      No coin ledger entries on record.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.coins_history.map((tx, idx) => {
                        const isCredit = tx.type === "credit" || tx.type === "earned";
                        return (
                          <div
                            key={idx}
                            className="bg-neutral-50/80 border border-neutral-200/70 p-3 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-neutral-900">{tx.reason || tx.note || "Coin Transaction"}</div>
                              <div className="text-neutral-400 text-[11px]">{formatDateTime(tx.timestamp)}</div>
                            </div>
                            <div className={`font-black font-mono text-xs ${isCredit ? "text-emerald-700" : "text-red-600"}`}>
                              {isCredit ? "+" : "-"}{tx.amount || tx.coins} Coins
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Dossier Bottom Action Bar */}
            <div className="p-4 bg-neutral-50/80 border-t border-neutral-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {selectedCustomer.phone && (
                  <>
                    {/* WhatsApp CTA */}
                    <a
                      href={`https://wa.me/91${selectedCustomer.phone}?text=${encodeURIComponent(
                        `Hello ${selectedCustomer.name || "Customer"}, greetings from Persian Darbar! We appreciate your loyalty with us.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Customer</span>
                    </a>

                    {/* Phone Call CTA */}
                    <a
                      href={`tel:${selectedCustomer.phone}`}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call +91 {selectedCustomer.phone}</span>
                    </a>
                  </>
                )}

                {selectedCustomer.email && (
                  <a
                    href={`mailto:${selectedCustomer.email}?subject=Greetings%20from%20Persian%20Darbar`}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:text-neutral-900 font-bold text-xs transition-all cursor-pointer shadow-2xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </a>
                )}
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
