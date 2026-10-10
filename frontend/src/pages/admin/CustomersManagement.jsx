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
  DollarSign
} from "lucide-react";
import API_BASE from "../../lib/config";
import { useToast } from "../../hooks/use-toast";

const GOLD = "#EAB308";

export default function CustomersManagement() {
  const { toast } = useToast();
  const token = localStorage.getItem("admin_token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [sortBy, setSortBy] = useState("orders_desc"); // 'orders_desc' | 'spent_desc' | 'res_desc' | 'newest' | 'coins_desc'
  const [activityFilter, setActivityFilter] = useState("all"); // 'all' | 'has_orders' | 'has_res'

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
    }

    // 4. Sorting
    list.sort((a, b) => {
      if (sortBy === "orders_desc") return (b.total_orders || 0) - (a.total_orders || 0);
      if (sortBy === "spent_desc") return (b.total_spent || 0) - (a.total_spent || 0);
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

  // Format date helper
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
          1. HEADER & EXECUTIVE ACTIONS
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a4855]/70 border border-[#EAB308]/20 p-6 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EAB308]/30 via-[#EAB308]/10 to-transparent border border-[#EAB308]/40 flex items-center justify-center text-[#EAB308] shadow-lg shadow-[#EAB308]/10">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
                Customer Database & CRM
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#EAB308]/20 text-[#EAB308] border border-[#EAB308]/30">
                  {dataPayload.total_count} Total Users
                </span>
              </h1>
              <p className="text-sm text-gray-300 mt-0.5">
                Segmented Google accounts & Mobile OTP customers with full order dish breakdowns and table booking histories.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCustomers(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f2933] border border-[#EAB308]/30 text-gray-200 hover:text-white hover:border-[#EAB308] transition-all text-sm font-semibold shadow-sm active:scale-95"
            title="Reload customer metrics"
          >
            <RefreshCw className={`w-4 h-4 text-[#EAB308] ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. METRIC STATS OVERVIEW CARDS
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-[#1a4855]/50 border border-white/10 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">All Customers</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-black text-white">{dataPayload.total_count}</div>
          <div className="text-[11px] text-gray-400 mt-1">
            {dataPayload.google_count} Google · {dataPayload.phone_count} Phone
          </div>
        </div>

        {/* Google Users */}
        <div 
          onClick={() => setActiveTab("google")}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${
            activeTab === "google" 
              ? "bg-blue-950/40 border-blue-500/60 ring-2 ring-blue-500/30" 
              : "bg-[#1a4855]/50 border-white/10 hover:border-blue-400/40"
          }`}
        >
          <div className="flex items-center justify-between text-blue-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Google Accounts
            </span>
            <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
              {dataPayload.total_count ? Math.round((dataPayload.google_count / dataPayload.total_count) * 100) : 0}%
            </span>
          </div>
          <div className="text-2xl font-black text-white">{dataPayload.google_count}</div>
          <div className="text-[11px] text-blue-300/80 mt-1">OAuth Google Sign-in users</div>
        </div>

        {/* Phone OTP Users */}
        <div 
          onClick={() => setActiveTab("phone")}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${
            activeTab === "phone" 
              ? "bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/30" 
              : "bg-[#1a4855]/50 border-white/10 hover:border-emerald-400/40"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" /> Mobile OTP Users
            </span>
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
              {dataPayload.total_count ? Math.round((dataPayload.phone_count / dataPayload.total_count) * 100) : 0}%
            </span>
          </div>
          <div className="text-2xl font-black text-white">{dataPayload.phone_count}</div>
          <div className="text-[11px] text-emerald-300/80 mt-1">Direct SMS / WhatsApp OTP</div>
        </div>

        {/* Lifetime Revenue & Orders */}
        <div className="bg-[#1a4855]/50 border border-[#EAB308]/20 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#EAB308] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Orders Volume</span>
            <TrendingUp className="w-4 h-4 text-[#EAB308]" />
          </div>
          <div className="text-2xl font-black text-white">
            ₹{Number(dataPayload.total_spent_all || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-gray-300 mt-1">
            {dataPayload.total_orders_all} Orders · {dataPayload.total_reservations_all} Table Bookings
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. SEGMENT TABS (GOOGLE vs PHONE) & SEARCH/SORT TOOLBAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#1a4855] border border-[#EAB308]/20 p-4 rounded-2xl space-y-4">
        {/* Top: Tabs & Counts */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex flex-wrap gap-2">
            {/* All Users Tab */}
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "all"
                  ? "bg-[#EAB308] text-black shadow-md shadow-[#EAB308]/20"
                  : "bg-[#0f2933] text-gray-300 hover:text-white border border-white/10"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>All Users</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                activeTab === "all" ? "bg-black/20 text-black" : "bg-white/10 text-gray-300"
              }`}>
                {dataPayload.total_count}
              </span>
            </button>

            {/* Google Users Tab */}
            <button
              onClick={() => setActiveTab("google")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "google"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/50"
                  : "bg-[#0f2933] text-gray-300 hover:text-white border border-white/10"
              }`}
            >
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Google Accounts</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                activeTab === "google" ? "bg-white/20 text-white" : "bg-blue-500/20 text-blue-300"
              }`}>
                {dataPayload.google_count}
              </span>
            </button>

            {/* Phone OTP Users Tab */}
            <button
              onClick={() => setActiveTab("phone")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "phone"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50"
                  : "bg-[#0f2933] text-gray-300 hover:text-white border border-white/10"
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Mobile / Phone OTP Users</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                activeTab === "phone" ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-300"
              }`}>
                {dataPayload.phone_count}
              </span>
            </button>
          </div>

          {/* Quick activity filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 font-semibold">Filter:</span>
            <button
              onClick={() => setActivityFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activityFilter === "all" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Any
            </button>
            <button
              onClick={() => setActivityFilter("has_orders")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activityFilter === "has_orders" ? "bg-[#EAB308]/20 text-[#EAB308] border border-[#EAB308]/40" : "text-gray-400 hover:text-white"
              }`}
            >
              Has Orders
            </button>
            <button
              onClick={() => setActivityFilter("has_res")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activityFilter === "has_res" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "text-gray-400 hover:text-white"
              }`}
            >
              Has Reservations
            </button>
          </div>
        </div>

        {/* Bottom Toolbar: Search & Sort */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone number, email address..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f2933] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#EAB308] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <ArrowUpDown className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-400 font-semibold shrink-0">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-auto px-3 py-2.5 rounded-xl bg-[#0f2933] border border-white/10 text-white text-sm focus:outline-none focus:border-[#EAB308] cursor-pointer"
            >
              <option value="orders_desc">Most Orders Placed</option>
              <option value="spent_desc">Highest Lifetime Spend (₹)</option>
              <option value="res_desc">Most Table Reservations</option>
              <option value="newest">Newest Registered</option>
              <option value="coins_desc">Highest PD Coins</option>
            </select>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4. CUSTOMER LIST CARDS / TABLE
      ══════════════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="bg-[#1a4855]/40 border border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin mb-4" />
          <h3 className="text-lg font-bold text-white">Aggregating Customer CRM Data...</h3>
          <p className="text-sm text-gray-400 mt-1">Compiling order histories, favorite dishes, and table reservations</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-[#1a4855]/40 border border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <Users className="w-16 h-16 text-gray-500 mb-4" />
          <h3 className="text-xl font-bold text-white">No Customers Found</h3>
          <p className="text-sm text-gray-400 max-w-md mt-1">
            {searchQuery
              ? `No user matches the query "${searchQuery}". Try searching with a different name or number.`
              : `No customers in the current category (${activeTab}).`}
          </p>
          {(searchQuery || activityFilter !== "all") && (
            <button
              onClick={() => { setSearchQuery(""); setActivityFilter("all"); setActiveTab("all"); }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#EAB308] text-black font-bold text-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-gray-400 px-1 flex items-center justify-between">
            <span>Showing <strong className="text-white">{filteredCustomers.length}</strong> customers</span>
            <span>Click any user to inspect their full dish order breakdown & reservations</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredCustomers.map((customer) => {
              const isGoogle = customer.provider === "google";
              const isGuest = customer.is_guest;
              const hasOrders = customer.total_orders > 0;
              const hasRes = customer.total_reservations > 0;
              const topDish = customer.favorite_items && customer.favorite_items.length > 0
                ? customer.favorite_items[0]
                : null;

              return (
                <div
                  key={customer.uid || customer._id}
                  onClick={() => { setSelectedCustomer(customer); setDossierTab("dishes"); }}
                  className="bg-[#1a4855]/70 hover:bg-[#1a4855] border border-white/10 hover:border-[#EAB308]/50 p-4 lg:p-5 rounded-2xl transition-all duration-200 cursor-pointer shadow-md group relative overflow-hidden"
                >
                  {/* Subtle top indicator bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      isGoogle ? "bg-blue-500" : isGuest ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  />

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Customer Identity */}
                    <div className="flex items-center gap-4 min-w-[280px]">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {customer.picture ? (
                          <img
                            src={customer.picture}
                            alt={customer.name}
                            className="w-13 h-13 rounded-2xl object-cover border-2 border-white/20 shadow-md"
                          />
                        ) : (
                          <div className={`w-13 h-13 rounded-2xl flex items-center justify-center font-black text-lg border-2 shadow-md ${
                            isGoogle
                              ? "bg-blue-900/40 text-blue-300 border-blue-500/40"
                              : "bg-emerald-900/40 text-emerald-300 border-emerald-500/40"
                          }`}>
                            {(customer.name || "U").charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Provider mini badge */}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm ${
                          isGoogle ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                        }`}>
                          {isGoogle ? <Globe className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                        </div>
                      </div>

                      {/* Name & Contact */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white group-hover:text-[#EAB308] transition-colors truncate">
                            {customer.name || "Guest Customer"}
                          </h3>

                          {/* Provider Badge */}
                          {isGoogle ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              <Globe className="w-2.5 h-2.5" /> Google User
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <Smartphone className="w-2.5 h-2.5" /> Phone OTP
                            </span>
                          )}

                          {isGuest && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Guest Order
                            </span>
                          )}
                        </div>

                        {/* Phone & Email line */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-300 mt-1">
                          {customer.phone && (
                            <span className="flex items-center gap-1 font-mono text-gray-200">
                              <Phone className="w-3 h-3 text-[#EAB308]" />
                              +91 {customer.phone}
                            </span>
                          )}
                          {customer.email && (
                            <span className="flex items-center gap-1 text-gray-300 truncate max-w-[220px]">
                              <Mail className="w-3 h-3 text-blue-400 shrink-0" />
                              <span className="truncate">{customer.email}</span>
                            </span>
                          )}
                        </div>

                        {/* Joined / Last Active */}
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Member since: {formatDate(customer.created_at)}
                          {customer.last_active && customer.last_active !== customer.created_at && (
                            <span> · Last active: {formatDate(customer.last_active)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Orders & Reservations Summary Stats */}
                    <div className="grid grid-cols-3 gap-3 bg-[#0f2933]/70 border border-white/5 p-3 rounded-xl lg:min-w-[340px]">
                      {/* Orders */}
                      <div className="text-center border-r border-white/10 pr-2">
                        <div className="text-xs text-gray-400 font-semibold flex items-center justify-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-[#EAB308]" /> Orders
                        </div>
                        <div className="text-base font-extrabold text-white mt-0.5">
                          {customer.total_orders}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-semibold font-mono">
                          ₹{Number(customer.total_spent || 0).toLocaleString("en-IN")}
                        </div>
                      </div>

                      {/* Reservations */}
                      <div className="text-center border-r border-white/10 pr-2">
                        <div className="text-xs text-gray-400 font-semibold flex items-center justify-center gap-1">
                          <UtensilsCrossed className="w-3 h-3 text-purple-400" /> Bookings
                        </div>
                        <div className="text-base font-extrabold text-white mt-0.5">
                          {customer.total_reservations}
                        </div>
                        <div className="text-[11px] text-gray-400">Tables</div>
                      </div>

                      {/* PD Coins */}
                      <div className="text-center">
                        <div className="text-xs text-gray-400 font-semibold flex items-center justify-center gap-1">
                          <Coins className="w-3 h-3 text-[#EAB308]" /> Coins
                        </div>
                        <div className="text-base font-extrabold text-[#EAB308] mt-0.5">
                          {customer.pd_coins || 0}
                        </div>
                        <div className="text-[11px] text-gray-400">Wallet</div>
                      </div>
                    </div>

                    {/* Right: Favorite Dish & CTA */}
                    <div className="flex items-center justify-between lg:justify-end gap-3 min-w-[240px]">
                      {topDish ? (
                        <div className="bg-[#0f2933]/90 border border-[#EAB308]/20 px-3 py-2 rounded-xl text-left max-w-[200px]">
                          <div className="text-[10px] uppercase font-black text-[#EAB308] flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5" /> Favorite Item
                          </div>
                          <div className="text-xs font-bold text-white truncate" title={topDish.name}>
                            {topDish.name}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Ordered <strong className="text-[#EAB308]">{topDish.count}×</strong> (₹{topDish.total_spent})
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic">No orders recorded yet</div>
                      )}

                      {/* Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(customer);
                          setDossierTab("dishes");
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#0f2933] group-hover:bg-[#EAB308] text-gray-300 group-hover:text-black font-bold text-xs flex items-center gap-1.5 transition-all border border-[#EAB308]/30 shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          5. CUSTOMER DOSSIER MODAL / DRAWER ("KISNE KITNE BAAR KYA KYA ORDER KIYA")
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 lg:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-[#1a4855] border-2 border-[#EAB308]/50 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">

            {/* Dossier Top Banner */}
            <div className="p-6 bg-gradient-to-r from-[#0f2933] via-[#1a4855] to-[#0f2933] border-b border-[#EAB308]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Large Avatar */}
                <div className="relative shrink-0">
                  {selectedCustomer.picture ? (
                    <img
                      src={selectedCustomer.picture}
                      alt={selectedCustomer.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#EAB308]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#0f2933] border-2 border-[#EAB308] text-[#EAB308] flex items-center justify-center text-2xl font-black">
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
                    <h2 className="text-xl lg:text-2xl font-black text-white">
                      {selectedCustomer.name || "Customer Profile"}
                    </h2>
                    {selectedCustomer.provider === "google" ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        Google Verified
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Mobile Phone OTP
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 mt-1">
                    {selectedCustomer.phone && (
                      <span className="font-mono text-gray-200 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#EAB308]" />
                        +91 {selectedCustomer.phone}
                      </span>
                    )}
                    {selectedCustomer.email && (
                      <span className="flex items-center gap-1 text-gray-300">
                        <Mail className="w-3 h-3 text-blue-400" />
                        {selectedCustomer.email}
                      </span>
                    )}
                    <span className="text-gray-400">
                      ID: <span className="font-mono text-gray-300">{selectedCustomer.uid}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedCustomer(null)}
                className="self-start md:self-center p-2 rounded-xl bg-[#0f2933] border border-white/20 text-gray-300 hover:text-white hover:border-[#EAB308] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-4 bg-[#0f2933] border-b border-white/10 p-4 text-center divide-x divide-white/10">
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase">Total Orders</div>
                <div className="text-xl font-black text-white mt-0.5">{selectedCustomer.total_orders}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase">Lifetime Spend</div>
                <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                  ₹{Number(selectedCustomer.total_spent || 0).toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase">Reservations</div>
                <div className="text-xl font-black text-purple-300 mt-0.5">{selectedCustomer.total_reservations}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase">PD Coins</div>
                <div className="text-xl font-black text-[#EAB308] mt-0.5">{selectedCustomer.pd_coins || 0}</div>
              </div>
            </div>

            {/* Dossier Tab Navigation */}
            <div className="bg-[#143742] px-6 pt-3 flex gap-2 border-b border-white/10 overflow-x-auto">
              {/* Tab 1: Dish Breakdown */}
              <button
                onClick={() => setDossierTab("dishes")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                  dossierTab === "dishes"
                    ? "bg-[#1a4855] text-[#EAB308] border-[#EAB308]"
                    : "text-gray-400 hover:text-white border-transparent"
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Dishes & Order Counts</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-black">
                  {selectedCustomer.favorite_items?.length || 0}
                </span>
              </button>

              {/* Tab 2: Orders List */}
              <button
                onClick={() => setDossierTab("orders")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                  dossierTab === "orders"
                    ? "bg-[#1a4855] text-[#EAB308] border-[#EAB308]"
                    : "text-gray-400 hover:text-white border-transparent"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Order History</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-black">
                  {selectedCustomer.orders?.length || 0}
                </span>
              </button>

              {/* Tab 3: Table Reservations */}
              <button
                onClick={() => setDossierTab("reservations")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                  dossierTab === "reservations"
                    ? "bg-[#1a4855] text-[#EAB308] border-[#EAB308]"
                    : "text-gray-400 hover:text-white border-transparent"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Table Reservations</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-black">
                  {selectedCustomer.reservations?.length || 0}
                </span>
              </button>

              {/* Tab 4: Loyalty Coins History */}
              <button
                onClick={() => setDossierTab("coins")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                  dossierTab === "coins"
                    ? "bg-[#1a4855] text-[#EAB308] border-[#EAB308]"
                    : "text-gray-400 hover:text-white border-transparent"
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Coins & Rewards</span>
              </button>
            </div>

            {/* Dossier Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[55vh]">

              {/* ─────────────────────────────────────────────────────────────
                  TAB 1: DISHES ORDERED FREQUENCY BREAKDOWN
              ───────────────────────────────────────────────────────────── */}
              {dossierTab === "dishes" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Crown className="w-4 h-4 text-[#EAB308]" />
                        Dish Order Frequency & Quantities
                      </h4>
                      <p className="text-xs text-gray-400">
                        Exact count of what dishes this customer has ordered across all lifetime orders.
                      </p>
                    </div>
                  </div>

                  {!selectedCustomer.favorite_items || selectedCustomer.favorite_items.length === 0 ? (
                    <div className="text-center py-12 bg-[#0f2933]/50 rounded-2xl border border-white/5">
                      <UtensilsCrossed className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-300 font-semibold text-sm">No items ordered yet</p>
                      <p className="text-xs text-gray-500">This customer has not completed any food orders so far.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedCustomer.favorite_items.map((item, idx) => {
                        const maxCount = selectedCustomer.favorite_items[0].count || 1;
                        const percentage = Math.round((item.count / maxCount) * 100);

                        return (
                          <div
                            key={idx}
                            className="bg-[#0f2933]/70 border border-white/10 p-3.5 rounded-xl hover:border-[#EAB308]/40 transition-all"
                          >
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                                  idx === 0
                                    ? "bg-[#EAB308] text-black shadow-md shadow-[#EAB308]/20"
                                    : idx === 1
                                    ? "bg-gray-300 text-black"
                                    : idx === 2
                                    ? "bg-amber-700 text-white"
                                    : "bg-white/10 text-gray-400"
                                }`}>
                                  #{idx + 1}
                                </span>
                                <div>
                                  <span className="text-sm font-bold text-white">{item.name}</span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="text-sm font-black text-[#EAB308]">
                                  Ordered {item.count} {item.count === 1 ? "time" : "times"}
                                </div>
                                <div className="text-xs font-mono text-emerald-400 font-semibold">
                                  ₹{Number(item.total_spent || 0).toLocaleString("en-IN")}
                                </div>
                              </div>
                            </div>

                            {/* Popularity meter */}
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-[#EAB308] to-emerald-400 h-full rounded-full transition-all duration-500"
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

              {/* ─────────────────────────────────────────────────────────────
                  TAB 2: ORDERS HISTORY
              ───────────────────────────────────────────────────────────── */}
              {dossierTab === "orders" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#EAB308]" />
                      Full Order History ({selectedCustomer.orders?.length || 0})
                    </h4>
                  </div>

                  {!selectedCustomer.orders || selectedCustomer.orders.length === 0 ? (
                    <div className="text-center py-12 bg-[#0f2933]/50 rounded-2xl border border-white/5">
                      <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-300 font-semibold text-sm">No orders placed</p>
                    </div>
                  ) : (
                    selectedCustomer.orders.map((ord, idx) => {
                      const oid = ord.order_id || ord._id || ord.id || `ORD-${idx + 1}`;
                      const orderTotal = ord.total || ord.total_amount || ord.final_amount || 0;
                      const status = (ord.status || "completed").toLowerCase();

                      return (
                        <div
                          key={oid}
                          className="bg-[#0f2933]/80 border border-white/10 p-4 rounded-xl space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-white bg-white/10 px-2 py-0.5 rounded">
                                {oid}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDateTime(ord.created_at || ord.timestamp)}
                              </span>
                              {ord.order_type && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAB308]/20 text-[#EAB308]">
                                  {ord.order_type}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                status === "completed" || status === "delivered"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : status === "cancelled"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : "bg-[#EAB308]/20 text-[#EAB308] border border-[#EAB308]/30"
                              }`}>
                                {status}
                              </span>
                              <span className="text-sm font-black font-mono text-emerald-400">
                                ₹{Number(orderTotal).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>

                          {/* Order items itemized list */}
                          <div className="space-y-1.5 pl-2">
                            {ord.items && ord.items.map((it, itemIdx) => (
                              <div key={itemIdx} className="flex items-center justify-between text-xs text-gray-300">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#EAB308] bg-black/40 px-1.5 py-0.2 rounded font-mono">
                                    {it.quantity || it.qty || 1}×
                                  </span>
                                  <span className="font-semibold text-white">{it.name || it.title}</span>
                                </div>
                                <span className="font-mono text-gray-400">
                                  ₹{Number((it.price || 0) * (it.quantity || it.qty || 1)).toLocaleString("en-IN")}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Address / Special notes if any */}
                          {ord.delivery_address && (
                            <div className="text-[11px] text-gray-400 bg-black/20 p-2 rounded-lg">
                              📍 <strong>Delivery Address:</strong> {ord.delivery_address}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 3: TABLE RESERVATIONS HISTORY
              ───────────────────────────────────────────────────────────── */}
              {dossierTab === "reservations" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      Table Bookings & Reservations ({selectedCustomer.reservations?.length || 0})
                    </h4>
                  </div>

                  {!selectedCustomer.reservations || selectedCustomer.reservations.length === 0 ? (
                    <div className="text-center py-12 bg-[#0f2933]/50 rounded-2xl border border-white/5">
                      <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-300 font-semibold text-sm">No reservations found</p>
                      <p className="text-xs text-gray-500">This user has not booked any dining tables yet.</p>
                    </div>
                  ) : (
                    selectedCustomer.reservations.map((res, idx) => {
                      const rid = res.id || res._id || `RES-${idx + 1}`;
                      const status = (res.status || "confirmed").toLowerCase();

                      return (
                        <div
                          key={rid}
                          className="bg-[#0f2933]/80 border border-white/10 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-white bg-white/10 px-2 py-0.5 rounded">
                                {rid}
                              </span>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                status === "confirmed"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : status === "completed"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : status === "cancelled"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : "bg-[#EAB308]/20 text-[#EAB308] border border-[#EAB308]/30"
                              }`}>
                                {status}
                              </span>
                            </div>

                            <div className="text-sm font-bold text-white">
                              📅 {res.date || "Date"} · ⏰ {res.time || "Time slot"}
                            </div>

                            <div className="text-xs text-gray-300 flex items-center gap-3">
                              <span>👥 <strong>{res.guests || res.guest_count || 2}</strong> Guests</span>
                              {res.table_number && <span>🪑 Table <strong>#{res.table_number}</strong></span>}
                            </div>

                            {res.special_requests && (
                              <div className="text-[11px] text-amber-300/90 italic mt-1">
                                Note: "{res.special_requests}"
                              </div>
                            )}
                          </div>

                          <div className="text-right text-[11px] text-gray-400">
                            Booked on: {formatDateTime(res.created_at)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 4: COINS & REWARDS HISTORY
              ───────────────────────────────────────────────────────────── */}
              {dossierTab === "coins" && (
                <div className="space-y-4">
                  <div className="bg-[#0f2933] border border-[#EAB308]/30 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-bold">Active Wallet Balance</div>
                      <div className="text-3xl font-black text-[#EAB308] flex items-center gap-2 mt-0.5">
                        <Coins className="w-7 h-7" />
                        <span>{selectedCustomer.pd_coins || 0} PD Coins</span>
                      </div>
                      <div className="text-xs text-gray-300 mt-1">Worth ₹{selectedCustomer.pd_coins || 0} in discounts at Persian Darbar</div>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction History</h4>

                  {!selectedCustomer.coins_history || selectedCustomer.coins_history.length === 0 ? (
                    <div className="text-center py-8 bg-[#0f2933]/50 rounded-xl border border-white/5 text-gray-400 text-xs">
                      No coin ledger entries on record.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.coins_history.map((tx, idx) => {
                        const isCredit = tx.type === "credit" || tx.type === "earned";
                        return (
                          <div
                            key={idx}
                            className="bg-[#0f2933]/70 border border-white/10 p-3 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-white">{tx.reason || tx.note || "Coin Transaction"}</div>
                              <div className="text-gray-400 text-[11px]">{formatDateTime(tx.timestamp)}</div>
                            </div>
                            <div className={`font-black font-mono text-sm ${isCredit ? "text-emerald-400" : "text-red-400"}`}>
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
            <div className="p-4 bg-[#0f2933] border-t border-[#EAB308]/30 flex flex-wrap items-center justify-between gap-3">
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
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Customer</span>
                    </a>

                    {/* Phone Call CTA */}
                    <a
                      href={`tel:${selectedCustomer.phone}`}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call +91 {selectedCustomer.phone}</span>
                    </a>
                  </>
                )}

                {selectedCustomer.email && (
                  <a
                    href={`mailto:${selectedCustomer.email}?subject=Greetings%20from%20Persian%20Darbar`}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1a4855] border border-white/20 hover:border-white text-gray-200 hover:text-white font-bold text-xs transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </a>
                )}
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all"
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
