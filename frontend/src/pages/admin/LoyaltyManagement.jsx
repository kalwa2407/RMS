import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Coins,
  Search,
  PlusCircle,
  MinusCircle,
  History,
  RotateCw,
  Crown,
  Sparkles,
  User,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  TrendingUp,
  Gift,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  FileText
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import API_BASE from "../../lib/config";

const GOLD = "#EAB308";

export default function LoyaltyManagement() {
  const { toast } = useToast();
  const token = localStorage.getItem("admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  // Search & Customers
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Global audit logs
  const [globalLogs, setGlobalLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState("search"); // 'search' | 'audit'

  // Modals
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  // Award Form
  const [billAmount, setBillAmount] = useState("");
  const [awardNote, setAwardNote] = useState("");
  const [submittingAward, setSubmittingAward] = useState(false);

  // Redeem Form
  const [redeemCoins, setRedeemCoins] = useState("");
  const [redeemNote, setRedeemNote] = useState("");
  const [submittingRedeem, setSubmittingRedeem] = useState(false);

  // Fetch Global Transactions (Audit Trail)
  const fetchGlobalLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/loyalty/transactions`, { headers });
      setGlobalLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch global transactions", err);
      toast({
        title: "Error",
        description: "Failed to load loyalty audit history",
        variant: "destructive",
      });
    } finally {
      setLoadingLogs(false);
    }
  }, [headers, toast]);

  useEffect(() => {
    fetchGlobalLogs();
  }, []);

  // Search Customers
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query || query.length < 2) {
      toast({
        title: "Input required",
        description: "Please enter at least 2 characters (phone number or name)",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/loyalty/search?q=${encodeURIComponent(query)}`, { headers });
      const results = Array.isArray(data) ? data : [];
      setSearchResults(results);
      if (results.length === 1) {
        setSelectedCustomer(results[0]);
      } else if (results.length === 0) {
        setSelectedCustomer(null);
      }
    } catch (err) {
      console.error("Search failed", err);
      toast({
        title: "Search Error",
        description: "Could not fetch customer data. Check server connection.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  // Re-fetch selected customer after award/redeem
  const refreshCustomer = async (customerId) => {
    if (!customerId) return;
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/loyalty/search?q=${encodeURIComponent(selectedCustomer.phone || selectedCustomer.name)}`, { headers });
      if (Array.isArray(data)) {
        const updated = data.find((c) => c._id === customerId);
        if (updated) {
          setSelectedCustomer(updated);
          // Also update search results list
          setSearchResults((prev) => prev.map((c) => (c._id === customerId ? updated : c)));
        }
      }
    } catch (err) {
      console.error("Failed to refresh customer", err);
    }
  };

  // Submit Award Coins
  const handleAwardCoins = async (e) => {
    e.preventDefault();
    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Bill Amount",
        description: "Please enter a valid bill amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    const calculatedCoins = Math.floor(amount * 0.10);
    if (calculatedCoins <= 0) {
      toast({
        title: "Amount Too Small",
        description: "Bill amount is too low to earn at least 1 PD Coin (minimum ₹10)",
        variant: "destructive",
      });
      return;
    }

    setSubmittingAward(true);
    try {
      const payload = {
        customer_id: selectedCustomer._id,
        bill_amount: amount,
        note: awardNote.trim() || `Dine-in bill ₹${amount.toLocaleString()}`,
      };
      const { data } = await axios.post(`${API_BASE}/api/admin/loyalty/award`, payload, { headers });

      if (data.success) {
        toast({
          title: "Coins Credited!",
          description: `Successfully awarded ${data.coins_awarded} PD Coins to ${data.customer_name}. New Balance: ${data.new_balance}`,
        });
        setShowAwardModal(false);
        setBillAmount("");
        setAwardNote("");
        await refreshCustomer(selectedCustomer._id);
        fetchGlobalLogs();
      }
    } catch (err) {
      console.error("Award error", err);
      toast({
        title: "Error Crediting Coins",
        description: err.response?.data?.detail || "Failed to award coins. Try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingAward(false);
    }
  };

  // Submit Redeem Coins
  const handleRedeemCoins = async (e) => {
    e.preventDefault();
    const coins = parseInt(redeemCoins, 10);
    const available = selectedCustomer?.pd_coins || 0;

    if (isNaN(coins) || coins <= 0) {
      toast({
        title: "Invalid Coin Count",
        description: "Please enter a positive number of coins to redeem",
        variant: "destructive",
      });
      return;
    }

    if (coins > available) {
      toast({
        title: "Insufficient Coins",
        description: `Customer only has ${available} PD Coins in wallet`,
        variant: "destructive",
      });
      return;
    }

    setSubmittingRedeem(true);
    try {
      const payload = {
        customer_id: selectedCustomer._id,
        coins_to_redeem: coins,
        note: redeemNote.trim() || `Redeemed for ₹${coins} bill discount`,
      };
      const { data } = await axios.post(`${API_BASE}/api/admin/loyalty/redeem`, payload, { headers });

      if (data.success) {
        toast({
          title: "Coins Redeemed!",
          description: `Successfully redeemed ${data.coins_redeemed} PD Coins (₹${data.discount_value} Discount). Remaining: ${data.new_balance}`,
        });
        setShowRedeemModal(false);
        setRedeemCoins("");
        setRedeemNote("");
        await refreshCustomer(selectedCustomer._id);
        fetchGlobalLogs();
      }
    } catch (err) {
      console.error("Redeem error", err);
      toast({
        title: "Error Redeeming Coins",
        description: err.response?.data?.detail || "Failed to redeem coins.",
        variant: "destructive",
      });
    } finally {
      setSubmittingRedeem(false);
    }
  };

  const calculatedAward = Math.floor((parseFloat(billAmount) || 0) * 0.10);
  const redeemDiscount = parseInt(redeemCoins, 10) || 0;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-white">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0d222d] via-[#102b38] to-[#0c1e28] border border-amber-500/20 p-5 sm:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 p-2 border border-amber-300/40">
              <img src="/pd_coin.png" alt="PD Coin" className="w-full h-full object-contain" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-black/80 rounded-full p-1 border border-amber-400/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                PD Coins Loyalty Program
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30">
                10% Cashback
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Look up customer profile by phone/name, credit 10% of bill amount as PD Coins, or redeem coins as bill discounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              if (selectedCustomer) refreshCustomer(selectedCustomer._id);
              fetchGlobalLogs();
            }}
            disabled={loadingLogs}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-colors text-xs font-semibold"
          >
            <RotateCw className={`w-4 h-4 ${loadingLogs ? "animate-spin text-amber-400" : ""}`} />
            Refresh
          </button>

          <div className="flex rounded-xl bg-black/40 border border-white/10 p-1">
            <button
              onClick={() => setActiveTab("search")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "search"
                  ? "bg-amber-500 text-black shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Lookup & Manage
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "audit"
                  ? "bg-amber-500 text-black shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Audit Log ({globalLogs.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === "search" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── LEFT COLUMN: SEARCH & SEARCH RESULTS (5 cols) ── */}
          <div className="lg:col-span-5 space-y-4">
            {/* Search Input Box */}
            <div className="bg-[#0f2430]/90 border border-white/10 p-4 rounded-2xl shadow-lg">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                Customer Lookup
              </label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search phone (e.g. 9876543210) or name..."
                    className="w-full bg-black/40 border border-white/15 focus:border-amber-400/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                        setSelectedCustomer(null);
                        setHasSearched(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/10 shrink-0"
                >
                  {searching ? <RotateCw className="w-4 h-4 animate-spin" /> : "Search"}
                </button>
              </form>
              <p className="text-[11px] text-white/50 mt-2">
                Tip: Enter the customer's 10-digit mobile number or full name.
              </p>
            </div>

            {/* Results List */}
            <div className="bg-[#0f2430]/90 border border-white/10 p-4 rounded-2xl shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                  {searching
                    ? "Searching customers..."
                    : hasSearched
                    ? `Results (${searchResults.length})`
                    : "Ready for search"}
                </span>
                {selectedCustomer && (
                  <span className="text-[10px] text-amber-400 font-semibold">
                    1 Active Selection
                  </span>
                )}
              </div>

              {searching && (
                <div className="py-12 text-center text-white/40 flex flex-col items-center gap-3">
                  <RotateCw className="w-6 h-6 animate-spin text-amber-400" />
                  <p className="text-xs">Finding customer profiles...</p>
                </div>
              )}

              {!searching && hasSearched && searchResults.length === 0 && (
                <div className="py-10 text-center text-white/50 space-y-2">
                  <AlertCircle className="w-8 h-8 mx-auto text-amber-400/60" />
                  <p className="text-sm font-semibold text-white/80">No customer found</p>
                  <p className="text-xs text-white/50 max-w-xs mx-auto">
                    We couldn't find anyone matching "{searchQuery}". Ask the customer if they registered with a different phone number or logged into the app.
                  </p>
                </div>
              )}

              {!searching && !hasSearched && (
                <div className="py-10 text-center text-white/40 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-amber-400/70">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/70">Enter a customer's phone or name</p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      Select them to credit coins or redeem bill discounts.
                    </p>
                  </div>
                </div>
              )}

              {!searching && searchResults.length > 0 && (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {searchResults.map((cust) => {
                    const isSelected = selectedCustomer?._id === cust._id;
                    const coins = cust.pd_coins || 0;
                    return (
                      <div
                        key={cust._id}
                        onClick={() => setSelectedCustomer(cust)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-amber-500/15 border-amber-400/80 shadow-md shadow-amber-500/5 ring-1 ring-amber-400/50"
                            : "bg-black/30 border-white/10 hover:border-white/20 hover:bg-black/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-black font-black text-sm shrink-0 border border-amber-300/40">
                              {cust.picture ? (
                                <img
                                  src={cust.picture}
                                  alt={cust.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                (cust.name || "C").charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-sm text-white truncate">
                                  {cust.name || "Valued Customer"}
                                </h3>
                                {coins > 500 && (
                                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-white/60 font-mono mt-0.5">
                                {cust.phone || "No phone listed"}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="flex items-center justify-end gap-1 text-amber-400 font-black text-sm">
                              <img src="/pd_coin.png" alt="" className="w-3.5 h-3.5 object-contain" />
                              <span>{coins.toLocaleString()}</span>
                            </div>
                            <span className="text-[10px] text-white/50 block mt-0.5">
                              ≈ ₹{coins.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: SELECTED CUSTOMER DETAILS & ACTIONS (7 cols) ── */}
          <div className="lg:col-span-7 space-y-4">
            {selectedCustomer ? (
              <>
                {/* Customer Golden Profile Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#122c3b] via-[#102430] to-[#0a171f] border border-amber-400/30 p-6 shadow-2xl">
                  {/* Subtle coin background watermark */}
                  <img
                    src="/pd_coin.png"
                    alt=""
                    className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 pointer-events-none select-none"
                  />

                  <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-1 shadow-lg shadow-amber-500/20 shrink-0">
                        {selectedCustomer.picture ? (
                          <img
                            src={selectedCustomer.picture}
                            alt=""
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-xl bg-black/60 flex items-center justify-center text-amber-400 font-black text-2xl">
                            {(selectedCustomer.name || "C").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-white tracking-wide">
                            {selectedCustomer.name || "Customer"}
                          </h2>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              (selectedCustomer.pd_coins || 0) > 500
                                ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                                : "bg-white/10 text-white/70 border border-white/20"
                            }`}
                          >
                            {(selectedCustomer.pd_coins || 0) > 500
                              ? "👑 Royal Elite"
                              : "⭐ Royal Patron"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-white/60 mt-1">
                          {selectedCustomer.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3.5 h-3.5 text-amber-400" />
                              {selectedCustomer.phone}
                            </span>
                          )}
                          {selectedCustomer.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-amber-400" />
                              {selectedCustomer.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Balance Banner */}
                    <div className="bg-black/50 border border-amber-400/30 rounded-2xl px-5 py-3 text-right shrink-0 w-full sm:w-auto">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                        Current Coin Balance
                      </p>
                      <div className="flex items-center justify-end gap-2 mt-0.5">
                        <img src="/pd_coin.png" alt="" className="w-6 h-6 object-contain drop-shadow" />
                        <span className="text-3xl font-black text-white">
                          {(selectedCustomer.pd_coins || 0).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 font-medium">
                        Redeemable value:{" "}
                        <strong className="text-emerald-400">
                          ₹{(selectedCustomer.pd_coins || 0).toLocaleString()}
                        </strong>
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6">
                    <button
                      onClick={() => setShowAwardModal(true)}
                      className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                    >
                      <PlusCircle className="w-5 h-5" />
                      Award PD Coins (10% of Bill)
                    </button>

                    <button
                      onClick={() => setShowRedeemModal(true)}
                      disabled={(selectedCustomer.pd_coins || 0) <= 0}
                      className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all border ${
                        (selectedCustomer.pd_coins || 0) > 0
                          ? "bg-white/10 hover:bg-white/15 text-white border-white/20 active:scale-[0.98]"
                          : "bg-white/5 text-white/30 border-white/5 cursor-not-allowed"
                      }`}
                    >
                      <MinusCircle className="w-5 h-5 text-amber-400" />
                      Redeem Coins (Discount)
                    </button>
                  </div>
                </div>

                {/* Customer History Log */}
                <div className="bg-[#0f2430]/90 border border-white/10 p-5 rounded-2xl shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                        Customer Loyalty History
                      </h3>
                    </div>
                    <span className="text-xs text-white/50">
                      {(selectedCustomer.coins_history || []).length} recorded activities
                    </span>
                  </div>

                  {(!selectedCustomer.coins_history || selectedCustomer.coins_history.length === 0) ? (
                    <div className="py-12 text-center text-white/40 space-y-2">
                      <img src="/pd_coin.png" alt="" className="w-10 h-10 mx-auto opacity-30 grayscale" />
                      <p className="text-xs font-semibold">No loyalty transactions recorded yet</p>
                      <p className="text-[11px] text-white/30">
                        When this customer dines in, award 10% coins using the button above.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {[...selectedCustomer.coins_history].reverse().map((item, idx) => {
                        const isEarned  = item.type === "earned";
                        const isExpired = item.type === "expired";
                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isEarned
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : isExpired
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                }`}
                              >
                                {isEarned ? (
                                  <ArrowUpRight className="w-5 h-5" />
                                ) : isExpired ? (
                                  <X className="w-4 h-4" />
                                ) : (
                                  <ArrowDownRight className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">
                                  {isEarned
                                    ? (item.note?.includes("online") ? "Online Order Cashback (10%)" : "Dine-In Cashback (10%)")
                                    : isExpired
                                    ? "Expired (45-Day Policy)"
                                    : "Bill Discount Redemption"}
                                </p>
                                <p className="text-xs text-white/60 mt-0.5">
                                  {item.note || (isEarned ? `Bill: ₹${item.bill_amount}` : isExpired ? "45-day auto expiry" : `Redeemed ${item.coins} coins`)}
                                </p>
                                <p className="text-[10px] text-white/40 mt-1">
                                  {item.timestamp ? new Date(item.timestamp).toLocaleString("en-IN") : "Just now"}
                                  {item.awarded_by && ` • by @${item.awarded_by}`}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`text-base font-black ${
                                  isEarned ? "text-emerald-400" : isExpired ? "text-rose-400" : "text-amber-400"
                                }`}
                              >
                                {isEarned ? `+${item.coins}` : `-${item.coins}`}
                              </span>
                              <p className="text-[10px] text-white/50 mt-0.5">
                                Bal: {item.balance_after}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Blank state when no customer is selected */
              <div className="bg-[#0f2430]/90 border border-white/10 p-12 rounded-2xl shadow-lg text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-400 p-4">
                  <img src="/pd_coin.png" alt="" className="w-full h-full object-contain" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-lg font-bold text-white">Select a Customer to Begin</h3>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Search by mobile number on the left. Once selected, you can award 10% cashback coins on their dining bill, or redeem their accumulated coins as an instant discount.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-4 text-left">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <p className="text-[10px] uppercase font-bold text-amber-400">Step 1</p>
                    <p className="text-xs text-white/80 font-medium mt-1">Search customer mobile</p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <p className="text-[10px] uppercase font-bold text-amber-400">Step 2</p>
                    <p className="text-xs text-white/80 font-medium mt-1">Input dine-in bill total</p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <p className="text-[10px] uppercase font-bold text-amber-400">Step 3</p>
                    <p className="text-xs text-white/80 font-medium mt-1">10% auto-credited instantly</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── AUDIT TAB: ALL RESTAURANT LOYALTY TRANSACTIONS ── */
        <div className="bg-[#0f2430]/90 border border-white/10 p-6 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white">
                Restaurant-Wide Loyalty Audit Trail
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                Last 50 loyalty coin awards and redemptions across all customers.
              </p>
            </div>
            <button
              onClick={fetchGlobalLogs}
              disabled={loadingLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white transition-colors"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin text-amber-400" : ""}`} />
              Refresh
            </button>
          </div>

          {loadingLogs ? (
            <div className="py-16 text-center text-white/40 flex flex-col items-center gap-3">
              <RotateCw className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-sm">Loading audit logs...</p>
            </div>
          ) : globalLogs.length === 0 ? (
            <div className="py-16 text-center text-white/40 space-y-2">
              <Receipt className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-semibold">No loyalty transactions recorded yet</p>
              <p className="text-xs text-white/30">
                Transactions will appear here whenever an admin awards or redeems coins.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Coins</th>
                    <th className="py-3 px-3">Bill / Discount</th>
                    <th className="py-3 px-3">Admin Staff</th>
                    <th className="py-3 px-3">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {globalLogs.map((log, idx) => {
                    const isEarned  = log.type === "earned";
                    const isExpired = log.type === "expired";
                    return (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 font-mono text-white/60">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString("en-IN") : "—"}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-white">{log.customer_name || "Customer"}</p>
                          <p className="text-[11px] text-white/50 font-mono">{log.customer_phone || "—"}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isEarned
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : isExpired
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {isEarned ? "Awarded (10%)" : isExpired ? "Expired (45d)" : "Redeemed"}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-black text-sm">
                          <span className={isEarned ? "text-emerald-400" : isExpired ? "text-rose-400" : "text-amber-400"}>
                            {isEarned ? `+${log.coins}` : `-${log.coins}`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-white/80">
                          {isEarned && log.bill_amount
                            ? `₹${Number(log.bill_amount).toLocaleString()}`
                            : log.discount_value
                            ? `₹${Number(log.discount_value).toLocaleString()} discount`
                            : isExpired
                            ? "Auto Expired"
                            : "—"}
                        </td>
                        <td className="py-3 px-3 text-white/60 font-mono">
                          {isExpired ? "System (Auto)" : `@${log.awarded_by || log.redeemed_by || "admin"}`}
                        </td>
                        <td className="py-3 px-3 text-white/50 max-w-xs truncate">
                          {log.note || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL: AWARD COINS (10% OF BILL)
         ═════════════════════════════════════════════════════════════ */}
      {showAwardModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#102430] border border-amber-500/40 p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Award PD Coins (10% Cashback)
                  </h3>
                  <p className="text-xs text-white/60">
                    To: <strong className="text-white">{selectedCustomer.name}</strong> ({selectedCustomer.phone || "No phone"})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAwardModal(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAwardCoins} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                  Dine-In Bill Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    placeholder="Enter bill amount (e.g. 2500)"
                    autoFocus
                    required
                    className="w-full bg-black/50 border border-white/20 focus:border-amber-400 rounded-xl pl-8 pr-4 py-3 text-lg font-bold text-white placeholder-white/30 focus:outline-none transition-colors"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] uppercase font-bold text-white/40">Presets:</span>
                  {[500, 1000, 2000, 3500, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBillAmount(preset.toString())}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-white/70 hover:text-white border border-white/10 transition-colors"
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic 10% calculation preview card */}
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Bill Amount:</span>
                  <span className="font-bold text-white">
                    ₹{parseFloat(billAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Reward Rate:</span>
                  <span className="font-bold text-amber-400">10% of bill</span>
                </div>
                <div className="h-px bg-white/10 my-1" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <img src="/pd_coin.png" alt="" className="w-5 h-5 object-contain" />
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                      Coins to Credit:
                    </span>
                  </div>
                  <span className="text-2xl font-black text-emerald-400">
                    +{calculatedAward} Coins
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-white/50 pt-1">
                  <span>New Customer Balance:</span>
                  <span className="font-semibold text-white/80">
                    {((selectedCustomer.pd_coins || 0) + calculatedAward).toLocaleString()} PD Coins
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Internal Note (Optional)
                </label>
                <input
                  type="text"
                  value={awardNote}
                  onChange={(e) => setAwardNote(e.target.value)}
                  placeholder="e.g. Table #4 Family Dinner"
                  className="w-full bg-black/50 border border-white/20 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAwardModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAward || calculatedAward <= 0}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  {submittingAward ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Credit +{calculatedAward} Coins
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL: REDEEM COINS (BILL DISCOUNT)
         ═════════════════════════════════════════════════════════════ */}
      {showRedeemModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#102430] border border-amber-500/40 p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <MinusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Redeem Coins for Bill Discount
                  </h3>
                  <p className="text-xs text-white/60">
                    Customer: <strong className="text-white">{selectedCustomer.name}</strong> • Available:{" "}
                    <strong className="text-amber-400">
                      {(selectedCustomer.pd_coins || 0).toLocaleString()} Coins
                    </strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRedeemModal(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRedeemCoins} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                  Coins to Redeem
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={selectedCustomer.pd_coins || 0}
                    value={redeemCoins}
                    onChange={(e) => setRedeemCoins(e.target.value)}
                    placeholder={`Enter up to ${selectedCustomer.pd_coins || 0} coins`}
                    autoFocus
                    required
                    className="w-full bg-black/50 border border-white/20 focus:border-amber-400 rounded-xl px-4 py-3 text-lg font-bold text-white placeholder-white/30 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase text-amber-400">
                    Coins
                  </span>
                </div>

                {/* Preset Percentages */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] uppercase font-bold text-white/40">Quick:</span>
                  {[
                    { label: "25%", val: Math.floor((selectedCustomer.pd_coins || 0) * 0.25) },
                    { label: "50%", val: Math.floor((selectedCustomer.pd_coins || 0) * 0.50) },
                    { label: "75%", val: Math.floor((selectedCustomer.pd_coins || 0) * 0.75) },
                    { label: "Max All", val: selectedCustomer.pd_coins || 0 },
                  ]
                    .filter((p) => p.val > 0)
                    .map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setRedeemCoins(preset.val.toString())}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-white/70 hover:text-white border border-white/10 transition-colors"
                      >
                        {preset.label} ({preset.val})
                      </button>
                    ))}
                </div>
              </div>

              {/* Dynamic discount conversion */}
              <div className="rounded-2xl bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-amber-500/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Conversion Rate:</span>
                  <span className="font-bold text-white">1 PD Coin = ₹1.00 Discount</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Coins Deducted:</span>
                  <span className="font-bold text-rose-400">-{redeemDiscount} Coins</span>
                </div>
                <div className="h-px bg-white/10 my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Bill Discount Value:
                  </span>
                  <span className="text-2xl font-black text-amber-300">
                    ₹{redeemDiscount.toLocaleString()} OFF
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-white/50 pt-1">
                  <span>Customer Remaining Balance:</span>
                  <span className="font-semibold text-white/80">
                    {Math.max(0, (selectedCustomer.pd_coins || 0) - redeemDiscount).toLocaleString()} PD Coins
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Internal Note (Optional)
                </label>
                <input
                  type="text"
                  value={redeemNote}
                  onChange={(e) => setRedeemNote(e.target.value)}
                  placeholder="e.g. Applied to Bill #1042"
                  className="w-full bg-black/50 border border-white/20 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRedeemModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submittingRedeem ||
                    redeemDiscount <= 0 ||
                    redeemDiscount > (selectedCustomer.pd_coins || 0)
                  }
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  {submittingRedeem ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Apply ₹{redeemDiscount} Discount
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
