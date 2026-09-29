import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Check, X, Trash2, Calendar, CalendarDays, ChevronLeft, ChevronRight,
  RotateCcw, Users, Clock, MessageCircle, Phone, Star, AlertCircle, Table,
  Search, Volume2, VolumeX, Bell, CheckCircle2, UserCheck, Utensils, Send,
  Copy, ExternalLink, Filter, Sparkles
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";

const RESTAURANT_NAME = "Persian Darbar";
const RESTAURANT_PHONE = "9594287868";
const RESTAURANT_LOCATION = "Camp, Pune";

/* ── WhatsApp Message Templates ── */
const getWhatsAppTemplates = (res) => {
  const tableStr = res.table_number ? `\n🪑 *Assigned Table:* Table ${res.table_number}` : "";
  const notesStr = res.special_requests ? `\n📝 *Special Request:* ${res.special_requests}` : "";

  return {
    confirmation: `🌟 *TABLE RESERVATION CONFIRMED — ${RESTAURANT_NAME}* 🌟

Dear *${res.customer_name}*,

We are delighted to confirm your royal dining reservation at *${RESTAURANT_NAME}*!

📋 *Booking Details:*
━━━━━━━━━━━━━━━━━━━━
📅 *Date:* ${formatDateFull(res.date)}
⏰ *Time:* ${res.time}
👥 *Guests:* ${res.guests} Person${res.guests > 1 ? "s" : ""}${tableStr}${notesStr}

📍 *Location:* ${RESTAURANT_NAME}, ${RESTAURANT_LOCATION}
📞 *Manager Helpline:* +91 ${RESTAURANT_PHONE}

⚠️ *Important Note:*
Please arrive 10-15 minutes prior to your time slot. Your table is reserved exclusively for you.

We look forward to serving you our authentic Mughlai & Persian specialties! 👑

— *Team ${RESTAURANT_NAME}*`,

    reminder: `⏰ *RESERVATION REMINDER — ${RESTAURANT_NAME}*

Dear *${res.customer_name}*,

This is a gentle reminder that your table at *${RESTAURANT_NAME}* is reserved for TODAY at *${res.time}* (${res.guests} guests)${tableStr}.

Our culinary team and captains are ready to welcome you!
Please arrive 10 minutes early.

📞 *Need directions or running late? Call us:* +91 ${RESTAURANT_PHONE}
📍 *Location:* ${RESTAURANT_NAME}, ${RESTAURANT_LOCATION}`,

    ready: `🍽️ *YOUR TABLE IS READY — ${RESTAURANT_NAME}*

Dear *${res.customer_name}*,

Your table${res.table_number ? ` (Table ${res.table_number})` : ""} at *${RESTAURANT_NAME}* is fully prepared and waiting for you!

Please approach our host counter upon arrival. We are ready to serve you!

— *Team ${RESTAURANT_NAME}*`
  };
};

const openWhatsApp = (phone, text) => {
  const cleaned = phone?.replace(/\D/g, "");
  const number = cleaned?.length === 10 ? `91${cleaned}` : cleaned;
  if (!number) {
    alert("No phone number found for this reservation.");
    return;
  }
  const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
};

/* ── Date & Time helpers ── */
function formatDateFull(dateStr) {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const year = parts[0].length === 4 ? +parts[0] : +parts[2];
      const month = +parts[1] - 1;
      const day = parts[0].length === 4 ? +parts[2] : +parts[0];
      const d = new Date(year, month, day);
      return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
    return dateStr;
  } catch { return dateStr; }
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const year = parts[0].length === 4 ? +parts[0] : +parts[2];
      const month = +parts[1] - 1;
      const day = parts[0].length === 4 ? +parts[2] : +parts[0];
      const d = new Date(year, month, day);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
    return dateStr;
  } catch { return dateStr; }
}

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split(/[-/]/);
    let target;
    if (parts.length === 3) {
      const year = parts[0].length === 4 ? +parts[0] : +parts[2];
      const month = +parts[1] - 1;
      const day = parts[0].length === 4 ? +parts[2] : +parts[0];
      target = new Date(year, month, day);
    } else {
      target = new Date(dateStr);
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  } catch { return null; }
}

function getUrgencyBadge(dateStr, timeStr) {
  const days = getDaysUntil(dateStr);
  if (days === null) return null;
  if (days < 0) return { label: "Past", color: "text-gray-500 bg-gray-500/10 border-gray-500/20" };
  if (days === 0) return { label: "TODAY 🔥", color: "text-orange-300 bg-orange-500/20 border-orange-400/40" };
  if (days === 1) return { label: "Tomorrow", color: "text-yellow-300 bg-yellow-500/15 border-yellow-400/30" };
  if (days <= 3) return { label: `In ${days} days`, color: "text-blue-300 bg-blue-500/10 border-blue-400/30" };
  return { label: `In ${days} days`, color: "text-gray-400 bg-gray-500/10 border-gray-500/20" };
}

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const statusBadge = (s) => ({
  pending:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  seated:    "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  rejected:  "bg-red-500/20 text-red-400 border-red-500/30",
}[s] || "bg-gray-500/20 text-gray-400 border-gray-500/30");

/* ══════════════════════════════════════════════════════════════ */
const ReservationsManagement = () => {
  const { toast } = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'today' | 'pending' | 'confirmed' | 'upcoming'
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(null); // id being processed
  const [whatsappModal, setWhatsappModal] = useState(null); // reservation object for modal
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [editingTable, setEditingTable] = useState(null); // id being edited { id, table_number }

  const token = localStorage.getItem("admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const audioRef = useRef(null);
  const prevPendingCountRef = useRef(0);

  // Sound initialization
  useEffect(() => {
    const audio = new Audio("/notification.wav");
    audio.volume = 0.85;
    audioRef.current = audio;
  }, []);

  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch {}
  }, [soundEnabled]);

  const fetchReservations = useCallback(async (silent = false) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/reservations`, { headers });
      const raw = Array.isArray(data) ? data : [];
      // Sort: pending first, then today's, then chronological
      const sorted = raw.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return 1;
        const daysA = getDaysUntil(a.date) ?? 999;
        const daysB = getDaysUntil(b.date) ?? 999;
        if (daysA !== daysB) return daysA - daysB;
        return (a.time || "").localeCompare(b.time || "");
      });

      const currentPending = sorted.filter(r => r.status === "pending").length;
      if (!silent && currentPending > prevPendingCountRef.current && prevPendingCountRef.current > 0) {
        playChime();
        toast({
          title: "🔔 New Reservation Received!",
          description: `${currentPending} pending table reservation(s) awaiting your action.`,
        });
      }
      prevPendingCountRef.current = currentPending;
      setReservations(sorted);
    } catch (err) {
      if (!silent) toast({ title: "Error", description: "Failed to fetch reservations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [soundEnabled, playChime, toast]);

  useEffect(() => {
    fetchReservations();
    // Poll every 30 seconds for live updates
    const interval = setInterval(() => {
      fetchReservations(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchReservations]);

  const updateStatus = async (id, status, res, newTableNum = null) => {
    setSending(id);
    try {
      const payload = { status };
      if (newTableNum !== null) payload.table_number = Number(newTableNum);
      const { data } = await axios.put(`${API_BASE}/api/admin/reservations/${id}/status`, payload, { headers });

      const updatedRes = data.reservation || { ...res, status, ...(newTableNum ? { table_number: newTableNum } : {}) };

      toast({
        title: status === "confirmed" ? "✅ Reservation Confirmed!" : status === "seated" ? "🪑 Guests Seated" : "Status Updated",
        description: `Reservation marked as ${status.toUpperCase()}${updatedRes.table_number ? ` (Table ${updatedRes.table_number})` : ""}`,
      });

      fetchReservations(true);

      // Open WhatsApp modal immediately on confirm
      if (status === "confirmed") {
        setWhatsappModal(updatedRes);
      }
    } catch {
      toast({ title: "Error", description: "Failed to update reservation", variant: "destructive" });
    } finally {
      setSending(null);
      setEditingTable(null);
    }
  };

  const deleteReservation = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/reservations/${id}`, { headers });
      toast({ title: "Deleted", description: "Reservation removed" });
      setDeleteConfirm(null);
      fetchReservations(true);
    } catch {
      toast({ title: "Error", description: "Failed to delete reservation", variant: "destructive" });
    }
  };

  const adjustDate = (days) => {
    if (!selectedDate) return;
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dt = new Date(y, m - 1, d); dt.setDate(dt.getDate() + days);
    setSelectedDate(`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`);
  };

  // Filter logic
  const filteredReservations = reservations.filter(res => {
    // Tab filter
    const daysUntil = getDaysUntil(res.date);
    if (activeTab === "today" && daysUntil !== 0) return false;
    if (activeTab === "pending" && res.status !== "pending") return false;
    if (activeTab === "confirmed" && res.status !== "confirmed") return false;
    if (activeTab === "upcoming" && (daysUntil === null || daysUntil < 1)) return false;

    // Date picker filter
    if (selectedDate) {
      if (!res.date) return false;
      const parts = res.date.split(/[-/]/);
      let norm = res.date;
      if (parts.length === 3) {
        norm = parts[0].length === 4
          ? `${parts[0]}-${parts[1].padStart(2,"0")}-${parts[2].padStart(2,"0")}`
          : `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
      }
      if (norm !== selectedDate) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const name = (res.customer_name || "").toLowerCase();
      const phone = (res.phone || "").toLowerCase();
      const table = String(res.table_number || "");
      if (!name.includes(q) && !phone.includes(q) && !table.includes(q)) return false;
    }

    return true;
  });

  const pendingCount = reservations.filter(r => r.status === "pending").length;
  const todayReservations = reservations.filter(r => getDaysUntil(r.date) === 0);
  const todayCount = todayReservations.length;
  const confirmedCount = reservations.filter(r => r.status === "confirmed").length;
  const upcomingCount = reservations.filter(r => {
    const d = getDaysUntil(r.date);
    return d !== null && d >= 1;
  }).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-[#EAB308] gap-3">
        <div className="w-8 h-8 border-3 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold tracking-wider uppercase animate-pulse">Loading Reservations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── HEADER & CONTROLS ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Table Reservations
            </h2>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute notification chime" : "Enable notification chime"}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                soundEnabled
                  ? "bg-[#EAB308]/20 border-[#EAB308]/40 text-[#EAB308]"
                  : "bg-white/5 border-white/10 text-gray-500"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-[10px] hidden sm:inline">{soundEnabled ? "Sound ON" : "Muted"}</span>
            </button>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Real-time booking management, table allocations, and instant WhatsApp confirmations.
          </p>
        </div>

        {/* Date Filter & Quick Date buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="relative">
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              selectedDate
                ? "bg-[#EAB308]/15 border-[#EAB308] text-[#EAB308] shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                : "bg-[#1a4855] border-[#EAB308]/20 text-gray-200 hover:border-[#EAB308]/50"
            }`}>
              <Calendar className="w-4 h-4 text-[#EAB308] shrink-0" />
              <span>{selectedDate ? formatDateShort(selectedDate) : "Calendar Filter"}</span>
              {selectedDate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EAB308]/20 text-[#EAB308] font-mono">{filteredReservations.length}</span>}
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
          </div>

          {selectedDate ? (
            <div className="flex items-center gap-1">
              <button onClick={() => adjustDate(-1)} className="p-2 rounded-xl bg-[#1a4855] border border-[#EAB308]/20 text-gray-300 hover:text-[#EAB308] transition-colors"><ChevronLeft className="w-4 h-4"/></button>
              <button onClick={() => adjustDate(1)} className="p-2 rounded-xl bg-[#1a4855] border border-[#EAB308]/20 text-gray-300 hover:text-[#EAB308] transition-colors"><ChevronRight className="w-4 h-4"/></button>
              <button onClick={() => setSelectedDate("")} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#1a4855] border border-[#EAB308]/20 text-gray-300 hover:text-red-400 transition-colors text-xs font-semibold">
                <X className="w-3.5 h-3.5"/><span className="hidden sm:inline">Clear Date</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSelectedDate(getTodayDateString())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a4855] border border-[#EAB308]/20 text-gray-300 hover:text-[#EAB308] transition-colors text-xs font-semibold"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#EAB308]"/><span>Today's Date</span>
            </button>
          )}
        </div>
      </div>

      {/* ── METRIC STATS & ALERT BANNERS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Today's Schedule", value: todayCount, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", tab: "today" },
          { label: "Pending Approval", value: pendingCount, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", tab: "pending", pulse: pendingCount > 0 },
          { label: "Confirmed", value: confirmedCount, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", tab: "confirmed" },
          { label: "Upcoming Days", value: upcomingCount, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", tab: "upcoming" },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => { setActiveTab(s.tab); setSelectedDate(""); }}
            className={`p-3.5 rounded-2xl border text-left transition-all ${s.bg} ${
              activeTab === s.tab ? "ring-2 ring-[#EAB308] shadow-lg" : "hover:brightness-110"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
              {s.pulse && <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />}
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">{s.label}</p>
          </button>
        ))}
      </div>

      {/* ── ACTIVE TODAY HIGHLIGHT BAR (Prevents seating walk-in on reserved table) ── */}
      {todayCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-transparent border border-orange-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0 text-orange-400">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                🚨 {todayCount} Reservation{todayCount > 1 ? "s" : ""} Scheduled for TODAY!
              </p>
              <p className="text-orange-200/80 text-xs">
                {todayReservations.map(r => `T${r.table_number || "?"} at ${r.time} (${r.customer_name})`).slice(0, 3).join(" • ")}
                {todayReservations.length > 3 && ` and ${todayReservations.length - 3} more...`}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setActiveTab("today"); setSelectedDate(""); }}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs uppercase tracking-wider transition-all shrink-0"
          >
            View Today's Timeline
          </button>
        </div>
      )}

      {/* ── SEARCH & FILTER TABS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0f2933]/70 p-2.5 rounded-2xl border border-white/5">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: `All (${reservations.length})` },
            { id: "today", label: `Today 🔥 (${todayCount})` },
            { id: "pending", label: `Pending ⏳ (${pendingCount})` },
            { id: "confirmed", label: `Confirmed ✅ (${confirmedCount})` },
            { id: "upcoming", label: `Upcoming 📅 (${upcomingCount})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-[#EAB308] text-black shadow-md"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, table..."
            className="w-full bg-[#1a4855]/70 border border-[#EAB308]/20 focus:border-[#EAB308] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── RESERVATION CARDS LIST ── */}
      {reservations.length === 0 ? (
        <div className="text-center py-20 text-gray-500 bg-[#0f2933]/40 rounded-2xl border border-white/5">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400" />
          <p className="text-base font-medium text-gray-300">No reservations placed yet</p>
          <p className="text-xs text-gray-500 mt-1">Bookings made via the customer app or website will appear here in real-time.</p>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="text-center py-16 bg-[#1a4855]/40 border border-[#EAB308]/15 rounded-2xl p-8 max-w-md mx-auto my-8">
          <Filter className="w-10 h-10 text-[#EAB308]/60 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Matching Reservations</h3>
          <p className="text-gray-400 text-xs mb-4">No reservations match your current filter or date selection.</p>
          <button
            onClick={() => { setActiveTab("all"); setSelectedDate(""); setSearchQuery(""); }}
            className="px-4 py-2 bg-[#EAB308] hover:bg-[#ca9a07] text-black font-bold rounded-xl text-xs flex items-center gap-1.5 mx-auto transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReservations.map(res => {
            const id = res._id || res.id;
            const urgency = getUrgencyBadge(res.date, res.time);
            const daysUntil = getDaysUntil(res.date);
            const isSending = sending === id;
            const isEditing = editingTable?.id === id;

            return (
              <div
                key={id}
                className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
                  res.status === "pending"
                    ? "border-yellow-500/40 bg-gradient-to-br from-[#1a4855] via-[#133640] to-[#0f2933] shadow-[0_4px_20px_rgba(234,179,8,0.1)]"
                    : res.status === "confirmed"
                    ? "border-emerald-500/30 bg-gradient-to-br from-[#1a4855] via-[#103039] to-[#0f2933]"
                    : res.status === "seated"
                    ? "border-cyan-500/30 bg-gradient-to-br from-[#1a4855] via-[#103039] to-[#0f2933]"
                    : "border-white/5 bg-[#1a4855]/40 opacity-75"
                }`}
              >
                {/* ── HERO BANNER: DATE, TIME & STATUS ── */}
                <div
                  className="px-5 py-3.5 flex items-center justify-between"
                  style={{
                    background: res.status === "pending"
                      ? "linear-gradient(90deg, rgba(234,179,8,0.18) 0%, rgba(234,179,8,0.04) 100%)"
                      : res.status === "confirmed"
                      ? "linear-gradient(90deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.03) 100%)"
                      : "rgba(255,255,255,0.03)"
                  }}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Day Block */}
                    <div
                      className="text-center rounded-xl px-3 py-2 min-w-[56px] shadow-inner"
                      style={{
                        background: daysUntil === 0 ? "rgba(249,115,22,0.25)" : "rgba(234,179,8,0.12)",
                        border: `1px solid ${daysUntil === 0 ? "rgba(249,115,22,0.5)" : "rgba(234,179,8,0.25)"}`
                      }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-wider leading-none" style={{ color: daysUntil === 0 ? "#f97316" : "#EAB308" }}>
                        {res.date ? new Date(+res.date.split("-")[0], +res.date.split("-")[1]-1, +res.date.split("-")[2]).toLocaleDateString("en-IN",{month:"short"}) : "—"}
                      </p>
                      <p className="font-black text-2xl leading-none text-white mt-1">
                        {res.date ? res.date.split(/[-/]/)[res.date.split(/[-/]/)[0].length === 4 ? 2 : 0] : "—"}
                      </p>
                      <p className="text-[9px] text-gray-400 leading-none mt-0.5 font-medium">
                        {res.date ? new Date(+res.date.split("-")[0], +res.date.split("-")[1]-1, +res.date.split("-")[2]).toLocaleDateString("en-IN",{weekday:"short"}) : ""}
                      </p>
                    </div>

                    {/* Time Slot Display */}
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#EAB308]" />
                        <span className="text-white font-black text-xl tracking-tight leading-none">{res.time}</span>
                        {daysUntil === 0 && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            Today
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs mt-1 font-medium">{formatDateFull(res.date)}</p>
                    </div>
                  </div>

                  {/* Status & Urgency Badges */}
                  <div className="flex flex-col items-end gap-1.5">
                    {urgency && (
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${urgency.color}`}>
                        {urgency.label}
                      </span>
                    )}
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border tracking-wider ${statusBadge(res.status)}`}>
                      {res.status}
                    </span>
                  </div>
                </div>

                {/* ── CUSTOMER & TABLE DETAILS ── */}
                <div className="px-5 py-4 border-t border-white/5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-white font-extrabold text-base tracking-tight leading-snug">{res.customer_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={`tel:${res.phone}`}
                          className="text-[#EAB308] text-xs font-bold hover:underline flex items-center gap-1 bg-[#0f2933] px-2 py-1 rounded-lg border border-white/5"
                        >
                          <Phone className="w-3 h-3" /> +91 {res.phone}
                        </a>
                        <button
                          onClick={() => setWhatsappModal(res)}
                          className="text-emerald-400 text-xs font-bold hover:underline flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg transition-colors hover:bg-emerald-500/20"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </button>
                      </div>
                      {res.email && <p className="text-gray-500 text-[11px] mt-1">{res.email}</p>}
                    </div>

                    {/* Delete action */}
                    {deleteConfirm === id ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => deleteReservation(id)} className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700">Confirm Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-lg bg-[#0f2933] text-gray-400"><X className="h-3.5 w-3.5"/></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(id)}
                        className="p-1.5 rounded-lg bg-[#0f2933] text-gray-500 hover:text-red-400 transition-colors shrink-0"
                        title="Delete reservation"
                      >
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    )}
                  </div>

                  {/* Badges: Party Size, Table Number, Special Requests */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-200 bg-[#0f2933]/80 rounded-xl px-3 py-1.5 border border-white/5">
                      <Users className="w-3.5 h-3.5 text-[#EAB308]" /> {res.guests} Guest{res.guests > 1 ? "s" : ""}
                    </span>

                    {/* Table Assignment with Inline Edit */}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 bg-[#0f2933] px-2 py-1 rounded-xl border border-[#EAB308]">
                        <span className="text-xs text-[#EAB308] font-bold">Table:</span>
                        <input
                          type="number"
                          defaultValue={res.table_number || ""}
                          placeholder="e.g. 5"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateStatus(id, res.status, res, e.target.value);
                            }
                          }}
                          id={`table-input-${id}`}
                          className="w-16 bg-[#1a4855] text-white text-xs px-2 py-0.5 rounded outline-none border border-white/10"
                        />
                        <button
                          onClick={() => {
                            const val = document.getElementById(`table-input-${id}`)?.value;
                            if (val) updateStatus(id, res.status, res, val);
                          }}
                          className="p-1 text-emerald-400 hover:text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingTable(null)} className="p-1 text-gray-400 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingTable({ id, table_number: res.table_number })}
                        title="Click to assign or change table"
                        className={`flex items-center gap-1.5 text-xs font-bold rounded-xl px-3 py-1.5 border transition-all ${
                          res.table_number
                            ? "text-[#EAB308] bg-[#EAB308]/10 border-[#EAB308]/30 hover:border-[#EAB308]"
                            : "text-amber-400 bg-amber-500/10 border-amber-500/30 hover:border-amber-400 animate-pulse"
                        }`}
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>{res.table_number ? `Table ${res.table_number}` : "⚠️ Assign Table"}</span>
                      </button>
                    )}

                    {res.special_requests && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 rounded-xl px-3 py-1.5 border border-amber-500/20 max-w-full truncate">
                        <Star className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{res.special_requests}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-gray-500 text-[10px]">
                    Created: {new Date(res.created_at).toLocaleString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                  </p>
                </div>

                {/* ── ACTION CONTROLS ── */}
                <div className="px-5 pb-4 pt-1">
                  {res.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(id, "confirmed", res)}
                        disabled={isSending}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-60"
                      >
                        {isSending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="h-4 w-4"/>}
                        Confirm & WhatsApp
                      </button>
                      <button
                        onClick={() => updateStatus(id, "rejected", res)}
                        disabled={isSending}
                        className="px-4 flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                      >
                        <X className="h-4 w-4"/> Reject
                      </button>
                    </div>
                  ) : res.status === "confirmed" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setWhatsappModal(res)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all hover:opacity-95"
                        style={{
                          background: "linear-gradient(135deg, #22c55e, #16a34a)",
                          boxShadow: "0 4px 14px rgba(34,197,94,0.3)"
                        }}
                      >
                        <MessageCircle className="h-4 w-4" /> Send WhatsApp
                      </button>
                      <button
                        onClick={() => updateStatus(id, "seated", res)}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 transition-colors flex items-center gap-1.5"
                        title="Mark guests as arrived and seated at table"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Mark Seated
                      </button>
                      <button
                        onClick={() => updateStatus(id, "rejected", res)}
                        className="px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : res.status === "seated" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(id, "completed", res)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-black bg-[#EAB308] hover:bg-[#ca9a07] transition-all"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Complete Dining (Free Table)
                      </button>
                      <button
                        onClick={() => setWhatsappModal(res)}
                        className="px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => updateStatus(id, "confirmed", res)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-[#EAB308] border border-[#EAB308]/20 hover:bg-[#EAB308]/10 transition-colors"
                    >
                      <RotateCcw className="h-4 w-4"/> Restore as Confirmed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── WHATSAPP CONFIRMATION MODAL ── */}
      {whatsappModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f2933] border border-[#EAB308]/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#1a4855]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-white font-extrabold text-sm">Send WhatsApp Message</h3>
                  <p className="text-gray-400 text-[10px]">Customer: {whatsappModal.customer_name} (+91 {whatsappModal.phone})</p>
                </div>
              </div>
              <button onClick={() => setWhatsappModal(null)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Template selector */}
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-2">Choose Message Template:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "confirmation", label: "🌟 Confirmed", desc: "Booking pass" },
                    { id: "reminder", label: "⏰ 1-Hr Reminder", desc: "Arriving today" },
                    { id: "ready", label: "🍽️ Table Ready", desc: "Prepared now" },
                  ].map(tmpl => {
                    const templates = getWhatsAppTemplates(whatsappModal);
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => openWhatsApp(whatsappModal.phone, templates[tmpl.id])}
                        className="p-3 rounded-xl border border-white/10 hover:border-[#EAB308] bg-[#1a4855]/40 hover:bg-[#1a4855] text-left transition-all"
                      >
                        <p className="text-xs font-bold text-white leading-tight">{tmpl.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{tmpl.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-300">Message Preview (Confirmation):</label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getWhatsAppTemplates(whatsappModal).confirmation);
                      toast({ title: "Copied!", description: "WhatsApp message copied to clipboard" });
                    }}
                    className="text-[11px] font-bold text-[#EAB308] hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy Text
                  </button>
                </div>
                <div className="bg-[#071318] p-4 rounded-2xl border border-white/5 text-gray-300 text-xs font-mono max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {getWhatsAppTemplates(whatsappModal).confirmation}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    openWhatsApp(whatsappModal.phone, getWhatsAppTemplates(whatsappModal).confirmation);
                    setWhatsappModal(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Send via WhatsApp Web/App</span>
                </button>
                <button
                  onClick={() => setWhatsappModal(null)}
                  className="px-5 bg-white/10 hover:bg-white/15 text-white font-bold py-3.5 rounded-xl text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReservationsManagement;
