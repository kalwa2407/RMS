import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Check, X, Trash2, Calendar, CalendarDays, ChevronLeft, ChevronRight,
  RotateCcw, Users, Clock, MessageCircle, Phone, Star, AlertCircle, Table,
  Search, Volume2, VolumeX, Bell, CheckCircle2, UserCheck, Utensils, Send,
  Copy, ExternalLink, Filter, Sparkles, LayoutGrid, ListOrdered, ChevronDown,
  Crown, ShieldAlert, Timer, ArrowUpRight, CheckCheck, Zap
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";

const RESTAURANT_NAME = "Persian Darbar";
const RESTAURANT_PHONE = "9594287868";
const RESTAURANT_LOCATION = "Camp, Pune";
const TOTAL_TABLES = 44;

/* ── WhatsApp Message Templates ── */
const getWhatsAppTemplates = (res) => {
  const tableStr = res.table_number ? `\n🪑 *Assigned Table:* Table ${res.table_number}` : "\n🪑 *Table:* Priority Seating on Arrival";
  const notesStr = res.special_requests ? `\n📝 *Special Request:* ${res.special_requests}` : "";

  return {
    confirmation: `🌟 *TABLE RESERVATION CONFIRMED — ${RESTAURANT_NAME}* 🌟

Dear *${res.customer_name}*,

We are delighted to confirm your royal dining reservation at *${RESTAURANT_NAME}*!

📋 *Your Booking Pass:*
━━━━━━━━━━━━━━━━━━━━
📅 *Date:* ${formatDateFull(res.date)}
⏰ *Exact Time Slot:* ${res.time}
👥 *Guests:* ${res.guests} Person${res.guests > 1 ? "s" : ""}${tableStr}${notesStr}

📍 *Location:* ${RESTAURANT_NAME}, ${RESTAURANT_LOCATION}
📞 *Helpline / Host Desk:* +91 ${RESTAURANT_PHONE}

⚠️ *Guest Instructions:*
• Please arrive 10-15 minutes prior to your time slot.
• Tables are held for a maximum of 15 minutes past booking time.
• Valet parking is available at the entrance.

We look forward to welcoming you with traditional royal hospitality! 👑

— *Team ${RESTAURANT_NAME}*`,

    reminder: `⏰ *RESERVATION REMINDER — ${RESTAURANT_NAME}*

Dear *${res.customer_name}*,

A quick reminder that your table at *${RESTAURANT_NAME}* is reserved for TODAY at *${res.time}* (${res.guests} guests)${tableStr}.

Our captains and chefs have begun preparations to welcome you. Please arrive 10 minutes early.

📞 *Need directions or running late? Call us:* +91 ${RESTAURANT_PHONE}
📍 *Location:* ${RESTAURANT_NAME}, ${RESTAURANT_LOCATION}`,

    ready: `🍽️ *YOUR TABLE IS READY — ${RESTAURANT_NAME}*

Dear *${res.customer_name}*,

Your table${res.table_number ? ` (Table ${res.table_number})` : ""} at *${RESTAURANT_NAME}* is fully prepared, sanitized, and waiting for you!

Please meet our Host at the front desk upon arrival.

— *Team ${RESTAURANT_NAME}*`,

    cancellation: `ℹ️ *RESERVATION UPDATE — ${RESTAURANT_NAME}*

Dear *${res.customer_name}*,

Your reservation for ${res.date} at ${res.time} has been cancelled / released.

If this was done in error or you wish to reschedule, please call our Manager directly at +91 ${RESTAURANT_PHONE}.

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

/* ── Date & Time parsing helpers ── */
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

// Convert "08:30 PM" or "20:30" to minutes from midnight
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  try {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3]?.toUpperCase();

    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  } catch {
    return 0;
  }
}

// Format end of slot (+90 mins)
function getEstimatedEndSlot(timeStr) {
  const mins = parseTimeToMinutes(timeStr);
  if (!mins) return "";
  const endMins = (mins + 90) % (24 * 60);
  const h = Math.floor(endMins / 60);
  const m = endMins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Get live countdown / status for a reservation
function getLiveTimingStatus(dateStr, timeStr) {
  const days = getDaysUntil(dateStr);
  if (days === null) return null;

  if (days < 0) return { label: "Completed / Past", isPast: true, color: "text-gray-500 bg-gray-500/10 border-gray-500/20" };
  if (days > 1) return { label: `In ${days} days`, isPast: false, color: "text-blue-300 bg-blue-500/10 border-blue-400/30" };
  if (days === 1) return { label: "Tomorrow", isPast: false, color: "text-yellow-300 bg-yellow-500/15 border-yellow-400/30" };

  // It's TODAY: calculate minutes difference from now
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const resMins = parseTimeToMinutes(timeStr);
  const diff = resMins - currentMins;

  if (diff < -90) {
    return { label: "Passed Today", isPast: true, color: "text-gray-400 bg-gray-500/10 border-gray-500/20" };
  } else if (diff <= 0 && diff >= -90) {
    return { label: "🔴 HAPPENING NOW", isNow: true, isUrgent: true, color: "text-red-400 bg-red-500/20 border-red-500/50 animate-pulse" };
  } else if (diff <= 60) {
    return { label: `🔥 IN ${diff} MINS!`, isUrgent: true, color: "text-orange-400 bg-orange-500/25 border-orange-400/60 animate-pulse" };
  } else if (diff <= 180) {
    const hours = Math.floor(diff / 60);
    const m = diff % 60;
    return { label: `In ${hours}h ${m > 0 ? `${m}m` : ""}`, isToday: true, color: "text-amber-300 bg-amber-500/15 border-amber-400/40" };
  } else {
    return { label: "Today • Later", isToday: true, color: "text-orange-300 bg-orange-500/15 border-orange-400/30" };
  }
}

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const statusBadge = (s) => ({
  pending:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  seated:    "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  rejected:  "bg-red-500/20 text-red-400 border-red-500/40",
}[s] || "bg-gray-500/20 text-gray-400 border-gray-500/40");

/* ══════════════════════════════════════════════════════════════ */
const ReservationsManagement = () => {
  const { toast } = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState("today"); // default to today's schedule for high operational utility
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'timeline'
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(null);
  const [whatsappModal, setWhatsappModal] = useState(null);
  const [sendingDirectWa, setSendingDirectWa] = useState(false);
  const [tablePickerModal, setTablePickerModal] = useState(null); // reservation object being assigned a table
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const token = localStorage.getItem("admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const audioRef = useRef(null);
  const prevPendingCountRef = useRef(0);

  // Initialize notification chime
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
      
      // Sort: pending first, then by date, then by time slot
      const sorted = raw.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return 1;
        const daysA = getDaysUntil(a.date) ?? 999;
        const daysB = getDaysUntil(b.date) ?? 999;
        if (daysA !== daysB) return daysA - daysB;
        return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
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
      setLastRefreshed(new Date());
    } catch {
      if (!silent) toast({ title: "Error", description: "Failed to fetch reservations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [soundEnabled, playChime, toast]);

  useEffect(() => {
    fetchReservations();
    // Poll every 30 seconds for live synchronization
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

      const updatedRes = data.reservation || { ...res, status, ...(newTableNum ? { table_number: Number(newTableNum) } : {}) };

      if (status === "confirmed") {
        if (updatedRes.whatsapp_sent) {
          toast({
            title: "✅ Reservation Confirmed & WhatsApp Sent!",
            description: `Confirmation pass dispatched directly to ${updatedRes.customer_name} (+91 ${updatedRes.phone})${updatedRes.table_number ? ` • Table ${updatedRes.table_number}` : ""}`,
          });
        } else if (updatedRes.whatsapp_error) {
          toast({
            title: "✅ Reservation Confirmed",
            description: `Confirmed${updatedRes.table_number ? ` (Table ${updatedRes.table_number})` : ""}. WhatsApp status: ${updatedRes.whatsapp_error}`,
          });
        } else {
          toast({
            title: "✅ Reservation Confirmed!",
            description: `Marked CONFIRMED${updatedRes.table_number ? ` (Table ${updatedRes.table_number})` : ""}. Automatic WhatsApp dispatched to customer.`,
          });
        }
      } else {
        toast({
          title: status === "seated" ? "🪑 Guests Seated" : "Status Updated",
          description: `Marked as ${status.toUpperCase()}${updatedRes.table_number ? ` (Table ${updatedRes.table_number})` : ""}`,
        });
      }

      fetchReservations(true);
      // NOTE: Modal does not open on confirm! Silent background dispatch via Meta API.
    } catch {
      toast({ title: "Error", description: "Failed to update reservation", variant: "destructive" });
    } finally {
      setSending(null);
      setTablePickerModal(null);
    }
  };

  const sendDirectWhatsApp = async (res) => {
    const id = res._id || res.id;
    setSendingDirectWa(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/admin/reservations/${id}/send-whatsapp`, {}, { headers });
      toast({
        title: "✅ WhatsApp Sent via Meta Cloud API!",
        description: data.message || `Confirmation pass delivered to ${res.customer_name} (+91 ${res.phone})`,
      });
      setWhatsappModal(null);
      fetchReservations(true);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.detail || "Failed to dispatch via Meta API";
      toast({
        title: "Meta WhatsApp API Notice",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setSendingDirectWa(false);
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

  // Filter reservations
  const filteredReservations = reservations.filter(res => {
    const daysUntil = getDaysUntil(res.date);

    if (activeTab === "today" && daysUntil !== 0) return false;
    if (activeTab === "pending" && res.status !== "pending") return false;
    if (activeTab === "confirmed" && res.status !== "confirmed") return false;
    if (activeTab === "upcoming" && (daysUntil === null || daysUntil < 1)) return false;

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

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const name = (res.customer_name || "").toLowerCase();
      const phone = (res.phone || "").toLowerCase();
      const table = String(res.table_number || "");
      if (!name.includes(q) && !phone.includes(q) && !table.includes(q)) return false;
    }

    return true;
  });

  const pendingReservations = reservations.filter(r => r.status === "pending");
  const pendingCount = pendingReservations.length;
  const todayReservations = reservations.filter(r => getDaysUntil(r.date) === 0);
  const todayCount = todayReservations.length;
  const confirmedCount = reservations.filter(r => r.status === "confirmed").length;
  const upcomingCount = reservations.filter(r => {
    const d = getDaysUntil(r.date);
    return d !== null && d >= 1;
  }).length;

  // Imminent reservations starting within next 60 minutes or happening right now
  const imminentReservations = todayReservations.filter(r => {
    if (r.status === "rejected" || r.status === "completed") return false;
    const timing = getLiveTimingStatus(r.date, r.time);
    return timing?.isUrgent || timing?.isNow;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-[#EAB308] gap-4">
        <div className="w-10 h-10 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Loading Persian Darbar Reservations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── TOP ROYAL HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1a4855] via-[#143d48] to-[#0f2933] border border-[#EAB308]/30 p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#EAB308]/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAB308]/15 border border-[#EAB308]/30 text-[#EAB308] text-[10px] font-black uppercase tracking-[0.25em]">
              <Crown className="w-3.5 h-3.5" />
              <span>Royal Dining Concierge • VIP Table Floor</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Reservations & Table Bookings
            </h1>

            <div className="flex items-center flex-wrap gap-4 text-xs text-gray-300">
              <span className="flex items-center gap-1.5 text-gray-400">
                <Timer className="w-3.5 h-3.5 text-[#EAB308]" />
                Live Sync: <strong className="text-white">{lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-[#EAB308] font-bold">
                Capacity: {TOTAL_TABLES} Total Palace Tables
              </span>
            </div>
          </div>

          {/* Quick controls: Sound, View Mode, Refresh */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute incoming booking alert chime" : "Enable incoming booking alert chime"}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                soundEnabled
                  ? "bg-[#EAB308]/20 border-[#EAB308]/50 text-[#EAB308] shadow-[0_0_15px_rgba(234,179,8,0.25)]"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? "Chime ON" : "Muted"}</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex bg-[#0f2933] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === "grid" ? "bg-[#EAB308] text-black shadow" : "text-gray-400 hover:text-white"
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === "timeline" ? "bg-[#EAB308] text-black shadow" : "text-gray-400 hover:text-white"
                }`}
                title="Shift Timeline View"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Timeline</span>
              </button>
            </div>

            <button
              onClick={() => fetchReservations()}
              className="p-2.5 rounded-xl bg-[#0f2933] border border-white/10 text-gray-300 hover:text-[#EAB308] hover:border-[#EAB308]/30 transition-all"
              title="Refresh reservations now"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── IMMINENT RESERVATIONS ALERT BANNER (Within 60 mins or Happening Now) ── */}
      {imminentReservations.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-red-950/60 via-orange-950/40 to-[#0f2933] border-2 border-orange-500/60 shadow-[0_0_25px_rgba(249,115,22,0.3)] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/25 border border-orange-500/60 flex items-center justify-center shrink-0 text-orange-400 mt-0.5">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-extrabold text-base">
                    🚨 {imminentReservations.length} IMMINENT RESERVATION{imminentReservations.length > 1 ? "S" : ""} — BE READY!
                  </h3>
                  <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                    Action Required
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {imminentReservations.map(res => (
                    <div
                      key={res._id || res.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-orange-500/40 text-xs text-orange-200"
                    >
                      <strong className="text-[#EAB308] font-mono">{res.time}</strong>
                      <span>•</span>
                      <strong className="text-white">T{res.table_number || "Unassigned"}</strong>
                      <span>•</span>
                      <span>{res.customer_name} ({res.guests} guests)</span>
                      <button
                        onClick={() => setWhatsappModal(res)}
                        className="ml-1 text-emerald-400 hover:text-emerald-300 underline font-bold text-[10px]"
                      >
                        Ping WhatsApp
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => { setActiveTab("today"); setSelectedDate(""); }}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shrink-0"
            >
              Open Today's Queue
            </button>
          </div>
        </div>
      )}

      {/* ── METRIC TILES ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          { label: "Today's Schedule", value: todayCount, sub: "Arrivals today", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", tab: "today" },
          { label: "Pending Approval", value: pendingCount, sub: "Needs confirmation", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", tab: "pending", pulse: pendingCount > 0 },
          { label: "Confirmed Seats", value: confirmedCount, sub: "Ready for dining", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", tab: "confirmed" },
          { label: "Upcoming Days", value: upcomingCount, sub: "Tomorrow & beyond", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-400/30", tab: "upcoming" },
        ].map(s => {
          const isSelected = activeTab === s.tab && !selectedDate;
          return (
            <button
              key={s.label}
              onClick={() => { setActiveTab(s.tab); setSelectedDate(""); }}
              className={`p-4 rounded-2xl border text-left transition-all ${s.bg} ${
                isSelected
                  ? "ring-2 ring-[#EAB308] shadow-[0_0_20px_rgba(234,179,8,0.2)] bg-opacity-30"
                  : "hover:brightness-110"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-3xl font-black ${s.color}`}>{s.value}</span>
                {s.pulse && <span className="w-3 h-3 rounded-full bg-yellow-400 animate-ping" />}
              </div>
              <p className="text-xs font-black text-white uppercase tracking-wider mt-1">{s.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
            </button>
          );
        })}
      </div>

      {/* ── SEARCH, FILTER TABS & CALENDAR SELECTOR ── */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-[#0f2933]/95 border border-[#EAB308]/20 shadow-xl space-y-3">
        {/* Row 1: Filter Pills (Smooth scroll with touch, NO scrollbar, shrink-0) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {[
            { id: "today", label: `Today 🔥 (${todayCount})` },
            { id: "pending", label: `Pending ⏳ (${pendingCount})` },
            { id: "confirmed", label: `Confirmed ✅ (${confirmedCount})` },
            { id: "upcoming", label: `Upcoming 📅 (${upcomingCount})` },
            { id: "all", label: `All (${reservations.length})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSelectedDate(""); }}
              className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all select-none ${
                activeTab === t.id && !selectedDate
                  ? "bg-[#EAB308] text-black shadow-lg shadow-amber-500/25 scale-[1.02]"
                  : "text-gray-300 hover:text-white bg-[#1a4855]/60 hover:bg-[#1a4855] border border-white/10"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Row 2: Search Bar & Date Picker */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-white/5">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone number, table..."
              className="w-full bg-[#1a4855]/60 border border-[#EAB308]/20 focus:border-[#EAB308] rounded-2xl pl-10 pr-8 py-2.5 text-xs text-white placeholder-gray-400 outline-none transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Date Filters & Calendar Picker */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Today quick toggle */}
            {!selectedDate ? (
              <button
                onClick={() => setSelectedDate(getTodayDateString())}
                className="px-3.5 py-2.5 rounded-2xl bg-[#1a4855]/70 hover:bg-[#1a4855] border border-white/10 text-gray-300 hover:text-[#EAB308] text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <CalendarDays className="w-3.5 h-3.5 text-[#EAB308]" />
                <span>Today</span>
              </button>
            ) : null}

            {/* Calendar Date Picker Button */}
            <div className="relative">
              <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                selectedDate
                  ? "bg-[#EAB308]/20 border-[#EAB308] text-[#EAB308] shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                  : "bg-[#1a4855] border-white/10 text-gray-200 hover:border-[#EAB308]/50"
              }`}>
                <Calendar className="w-3.5 h-3.5 text-[#EAB308] shrink-0" />
                <span>{selectedDate ? formatDateShort(selectedDate) : "Pick Date"}</span>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
            </div>

            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="p-2.5 rounded-2xl bg-[#1a4855] text-red-400 hover:bg-red-500/20 border border-white/10 transition-colors"
                title="Clear date filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT: GRID OR TIMELINE VIEW ── */}
      {filteredReservations.length === 0 ? (
        <div className="text-center py-20 bg-[#1a4855]/30 border border-[#EAB308]/15 rounded-3xl p-8 max-w-lg mx-auto">
          <Calendar className="w-14 h-14 text-[#EAB308]/40 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            No Reservations Found
          </h3>
          <p className="text-gray-400 text-xs mb-5">
            {selectedDate
              ? `There are no table reservations scheduled for ${formatDateShort(selectedDate)}.`
              : searchQuery
              ? `No bookings match your search query "${searchQuery}".`
              : `No reservations found under this filter tab.`}
          </p>
          <button
            onClick={() => { setActiveTab("today"); setSelectedDate(""); setSearchQuery(""); }}
            className="px-5 py-2.5 bg-[#EAB308] hover:bg-[#ca9a07] text-black font-extrabold rounded-xl text-xs flex items-center gap-2 mx-auto transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Return to Today's Queue
          </button>
        </div>
      ) : viewMode === "timeline" ? (
        /* ══════════════════════════════════════════════════════════
           TIMELINE / SHIFT SCHEDULE VIEW
        ══════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0f2933]/60 border border-white/5 flex items-center justify-between text-xs text-gray-400">
            <span>Chronological timeline of upcoming guest arrivals:</span>
            <span className="text-[#EAB308] font-bold">{filteredReservations.length} bookings sorted by arrival slot</span>
          </div>

          <div className="space-y-3">
            {filteredReservations.map((res, idx) => {
              const id = res._id || res.id;
              const timing = getLiveTimingStatus(res.date, res.time);
              const estEnd = getEstimatedEndSlot(res.time);

              return (
                <div
                  key={id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    timing?.isUrgent
                      ? "bg-gradient-to-r from-orange-500/15 via-[#1a4855] to-[#0f2933] border-orange-500/50 shadow-lg"
                      : res.status === "confirmed"
                      ? "bg-[#1a4855]/70 border-emerald-500/30"
                      : "bg-[#1a4855]/40 border-white/5"
                  }`}
                >
                  {/* Left: Time badge & guest details */}
                  <div className="flex items-center gap-4">
                    {/* Time Slot Block */}
                    <div className="text-center px-4 py-2.5 rounded-xl bg-black/40 border border-[#EAB308]/30 min-w-[90px]">
                      <span className="text-xs font-bold text-[#EAB308] uppercase block leading-none">Slot</span>
                      <strong className="text-lg font-black text-white block mt-1 leading-none">{res.time}</strong>
                      <span className="text-[10px] text-gray-400 font-mono block mt-1">to {estEnd}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-black text-base">{res.customer_name}</h4>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${statusBadge(res.status)}`}>
                          {res.status}
                        </span>
                        {timing && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${timing.color}`}>
                            {timing.label}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center flex-wrap gap-3 text-xs text-gray-400 mt-1">
                        <span className="text-[#EAB308] font-bold">
                          {res.table_number ? `Table ${res.table_number}` : "⚠️ Unassigned Table"}
                        </span>
                        <span>•</span>
                        <span>{res.guests} Guests</span>
                        <span>•</span>
                        <a href={`tel:${res.phone}`} className="text-gray-300 hover:text-[#EAB308] font-mono">
                          +91 {res.phone}
                        </a>
                        {res.special_requests && (
                          <>
                            <span>•</span>
                            <span className="text-amber-300 italic">"{res.special_requests}"</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setWhatsappModal(res)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    {res.status === "pending" ? (
                      <button
                        onClick={() => updateStatus(id, "confirmed", res)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all"
                      >
                        Confirm
                      </button>
                    ) : res.status === "confirmed" ? (
                      <button
                        onClick={() => updateStatus(id, "seated", res)}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Seat Guests
                      </button>
                    ) : res.status === "seated" ? (
                      <button
                        onClick={() => updateStatus(id, "completed", res)}
                        className="px-4 py-2 rounded-xl bg-[#EAB308] hover:bg-[#ca9a07] text-black font-extrabold text-xs uppercase tracking-wider transition-all"
                      >
                        Free Table
                      </button>
                    ) : null}

                    <button
                      onClick={() => setTablePickerModal(res)}
                      className="p-2 rounded-xl bg-[#0f2933] border border-white/10 text-gray-400 hover:text-white"
                      title="Assign/Change Table"
                    >
                      <Table className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════
           LUXURY CARDS GRID VIEW
        ══════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReservations.map(res => {
            const id = res._id || res.id;
            const timing = getLiveTimingStatus(res.date, res.time);
            const estEnd = getEstimatedEndSlot(res.time);
            const isSending = sending === id;

            return (
              <div
                key={id}
                className={`rounded-3xl overflow-hidden border transition-all duration-300 shadow-xl ${
                  timing?.isUrgent
                    ? "border-orange-500/60 bg-gradient-to-br from-[#1a4855] via-[#153a45] to-[#0f2933] shadow-[0_0_25px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/40"
                    : res.status === "pending"
                    ? "border-yellow-500/50 bg-gradient-to-br from-[#1a4855] via-[#143d48] to-[#0f2933] shadow-[0_0_20px_rgba(234,179,8,0.15)]"
                    : res.status === "confirmed"
                    ? "border-emerald-500/30 bg-gradient-to-br from-[#1a4855] via-[#12333d] to-[#0f2933]"
                    : res.status === "seated"
                    ? "border-cyan-500/30 bg-gradient-to-br from-[#1a4855] via-[#12333d] to-[#0f2933]"
                    : "border-white/5 bg-[#1a4855]/30 opacity-75"
                }`}
              >
                {/* ── CARD HEADER: DATE & EXACT BOOKING TIMING ── */}
                <div
                  className="px-4 sm:px-5 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5"
                  style={{
                    background: timing?.isUrgent
                      ? "linear-gradient(90deg, rgba(249,115,22,0.2) 0%, rgba(249,115,22,0.03) 100%)"
                      : res.status === "pending"
                      ? "linear-gradient(90deg, rgba(234,179,8,0.18) 0%, rgba(234,179,8,0.03) 100%)"
                      : res.status === "confirmed"
                      ? "linear-gradient(90deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.03) 100%)"
                      : "rgba(255,255,255,0.03)"
                  }}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Day Block */}
                    <div className="text-center rounded-2xl px-3 py-2 min-w-[56px] sm:min-w-[58px] bg-black/40 border border-[#EAB308]/30 shadow-inner shrink-0">
                      <p className="text-[10px] font-black uppercase tracking-wider leading-none text-[#EAB308]">
                        {res.date ? new Date(+res.date.split(/[-/]/)[0], +res.date.split(/[-/]/)[1]-1, +res.date.split(/[-/]/)[2]).toLocaleDateString("en-IN",{month:"short"}) : "—"}
                      </p>
                      <p className="font-black text-2xl leading-none text-white mt-1">
                        {res.date ? res.date.split(/[-/]/)[res.date.split(/[-/]/)[0].length === 4 ? 2 : 0] : "—"}
                      </p>
                      <p className="text-[9px] text-gray-400 leading-none mt-0.5 font-medium">
                        {res.date ? new Date(+res.date.split(/[-/]/)[0], +res.date.split(/[-/]/)[1]-1, +res.date.split(/[-/]/)[2]).toLocaleDateString("en-IN",{weekday:"short"}) : ""}
                      </p>
                    </div>

                    {/* Exact Time Slot */}
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#EAB308]" />
                        <span className="text-white font-black text-xl sm:text-2xl tracking-tight leading-none">
                          {res.time}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-1 font-medium">
                        Window: <span className="text-gray-200">{res.time} – {estEnd}</span> (90 mins)
                      </p>
                    </div>
                  </div>

                  {/* Status & Relative Countdown */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    {timing && (
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${timing.color}`}>
                        {timing.label}
                      </span>
                    )}
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border tracking-wider ${statusBadge(res.status)}`}>
                      {res.status}
                    </span>
                  </div>
                </div>

                {/* ── CARD BODY: CUSTOMER & TABLE DETAILS ── */}
                <div className="px-5 py-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-white font-extrabold text-lg tracking-tight leading-snug">
                        {res.customer_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <a
                          href={`tel:${res.phone}`}
                          className="text-[#EAB308] text-xs font-bold hover:underline flex items-center gap-1 bg-[#0f2933] px-2.5 py-1 rounded-xl border border-white/10"
                        >
                          <Phone className="w-3 h-3" /> +91 {res.phone}
                        </a>
                        <button
                          onClick={() => setWhatsappModal(res)}
                          className="text-emerald-400 text-xs font-bold hover:underline flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-xl transition-colors hover:bg-emerald-500/20"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </button>
                      </div>
                      {res.email && <p className="text-gray-500 text-[11px] mt-1 font-mono">{res.email}</p>}
                    </div>

                    {/* Delete action */}
                    {deleteConfirm === id ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => deleteReservation(id)} className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-black uppercase">Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-xl bg-[#0f2933] text-gray-400"><X className="h-4 w-4"/></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(id)}
                        className="p-2 rounded-xl bg-[#0f2933] text-gray-500 hover:text-red-400 transition-colors shrink-0"
                        title="Delete reservation"
                      >
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    )}
                  </div>

                  {/* Highlights Grid: Table Number, Guests, Notes */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Table Assignment Button */}
                    <button
                      onClick={() => setTablePickerModal(res)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        res.table_number
                          ? "bg-[#0f2933]/90 border-[#EAB308]/30 hover:border-[#EAB308]"
                          : "bg-amber-500/10 border-amber-500/40 hover:border-amber-400 animate-pulse"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4 text-[#EAB308]" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Assigned Table</span>
                          <strong className="text-white text-sm">
                            {res.table_number ? `Table ${res.table_number}` : "⚠️ Select Table"}
                          </strong>
                        </div>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </button>

                    {/* Guests pill */}
                    <div className="p-3 rounded-2xl bg-[#0f2933]/90 border border-white/10 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#EAB308]" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Party Size</span>
                        <strong className="text-white text-sm">{res.guests} Person{res.guests > 1 ? "s" : ""}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Special Requests Banner */}
                  {res.special_requests && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
                      <Star className="w-4 h-4 text-[#EAB308] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[#EAB308] block mb-0.5">Special Guest Request:</strong>
                        <span>"{res.special_requests}"</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                    <span>Booked: {new Date(res.created_at).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</span>
                    <span className="font-mono text-[10px] text-gray-400">#PD-{String(id).slice(-6).toUpperCase()}</span>
                  </div>
                </div>

                {/* ── CARD FOOTER: ACTION BUTTONS ── */}
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1">
                  {res.status === "pending" ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => updateStatus(id, "confirmed", res)}
                        disabled={isSending}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-60"
                      >
                        {isSending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="h-4 w-4"/>}
                        Confirm & WhatsApp
                      </button>
                      <button
                        onClick={() => updateStatus(id, "rejected", res)}
                        disabled={isSending}
                        className="px-4 py-3 flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-2xl text-xs font-bold transition-colors disabled:opacity-60"
                      >
                        <X className="h-4 w-4"/> Reject
                      </button>
                    </div>
                  ) : res.status === "confirmed" ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => setWhatsappModal(res)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-white transition-all hover:opacity-95"
                        style={{
                          background: "linear-gradient(135deg, #22c55e, #16a34a)",
                          boxShadow: "0 4px 14px rgba(34,197,94,0.3)"
                        }}
                      >
                        <MessageCircle className="w-4 h-4" /> Send WhatsApp
                      </button>
                      <button
                        onClick={() => updateStatus(id, "seated", res)}
                        className="px-4 py-3 rounded-2xl text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-1.5"
                        title="Mark guests as arrived and seated at table"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Mark Seated
                      </button>
                      <button
                        onClick={() => updateStatus(id, "rejected", res)}
                        className="px-3.5 py-3 rounded-2xl text-xs font-bold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors flex items-center justify-center"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : res.status === "seated" ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => updateStatus(id, "completed", res)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-black bg-[#EAB308] hover:bg-[#ca9a07] transition-all shadow-lg shadow-amber-900/20"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Complete Dining (Free Table {res.table_number || ""})
                      </button>
                      <button
                        onClick={() => setWhatsappModal(res)}
                        className="px-4 py-3 rounded-2xl text-xs font-bold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors flex items-center justify-center"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => updateStatus(id, "confirmed", res)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-[#EAB308] border border-[#EAB308]/20 hover:bg-[#EAB308]/10 transition-colors"
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

      {/* ══════════════════════════════════════════════════════════
          TABLE PICKER DIALOG (1 to 44 Tables)
      ══════════════════════════════════════════════════════════ */}
      {tablePickerModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f2933] border border-[#EAB308]/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#1a4855]/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#EAB308]/20 border border-[#EAB308]/40 flex items-center justify-center text-[#EAB308]">
                  <Table className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-white font-extrabold text-base">Assign Palace Table</h3>
                  <p className="text-gray-400 text-xs">
                    {tablePickerModal.customer_name} • {tablePickerModal.guests} Guests • {tablePickerModal.time}
                  </p>
                </div>
              </div>
              <button onClick={() => setTablePickerModal(null)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-300">
                Select one of the {TOTAL_TABLES} dining tables to reserve for this guest:
              </p>

              {/* Table Grid (1 to 44) */}
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-1">
                {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map(num => {
                  const isSelected = tablePickerModal.table_number === num;
                  return (
                    <button
                      key={num}
                      onClick={() => updateStatus(tablePickerModal._id || tablePickerModal.id, tablePickerModal.status, tablePickerModal, num)}
                      className={`h-11 rounded-xl font-bold text-xs flex flex-col items-center justify-center border transition-all ${
                        isSelected
                          ? "bg-[#EAB308] border-[#EAB308] text-black shadow-lg shadow-amber-500/30 scale-105"
                          : "bg-[#1a4855]/60 border-white/10 text-white hover:border-[#EAB308]/50 hover:bg-[#1a4855]"
                      }`}
                    >
                      <span className="leading-none">{num}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  onClick={() => updateStatus(tablePickerModal._id || tablePickerModal.id, tablePickerModal.status, tablePickerModal, null)}
                  className="text-xs text-red-400 hover:underline font-bold"
                >
                  Clear Table Assignment
                </button>
                <button
                  onClick={() => setTablePickerModal(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          WHATSAPP NOTIFICATION MODAL
      ══════════════════════════════════════════════════════════ */}
      {whatsappModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f2933] border border-[#EAB308]/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#1a4855]/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-extrabold text-base">Send WhatsApp Update</h3>
                  <p className="text-gray-400 text-xs">Customer: {whatsappModal.customer_name} (+91 {whatsappModal.phone})</p>
                </div>
              </div>
              <button onClick={() => setWhatsappModal(null)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Template selector */}
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-2">Choose Template:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "confirmation", label: "🌟 Confirmed", desc: "Pass" },
                    { id: "reminder", label: "⏰ 1-Hr", desc: "Reminder" },
                    { id: "ready", label: "🍽️ Table Ready", desc: "Arrival" },
                    { id: "cancellation", label: "ℹ️ Cancel", desc: "Release" },
                  ].map(tmpl => {
                    const templates = getWhatsAppTemplates(whatsappModal);
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => openWhatsApp(whatsappModal.phone, templates[tmpl.id])}
                        className="p-3 rounded-2xl border border-white/10 hover:border-[#EAB308] bg-[#1a4855]/40 hover:bg-[#1a4855] text-left transition-all"
                      >
                        <p className="text-xs font-black text-white leading-tight">{tmpl.label}</p>
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
                <div className="bg-[#071318] p-4 rounded-2xl border border-white/5 text-gray-300 text-xs font-mono max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                  {getWhatsAppTemplates(whatsappModal).confirmation}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  onClick={() => sendDirectWhatsApp(whatsappModal)}
                  disabled={sendingDirectWa}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-60"
                >
                  {sendingDirectWa ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>Send Direct (Meta Cloud API)</span>
                </button>
                <button
                  onClick={() => {
                    openWhatsApp(whatsappModal.phone, getWhatsAppTemplates(whatsappModal).confirmation);
                    setWhatsappModal(null);
                  }}
                  className="px-4 py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  title="Open manual WhatsApp Web chat"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>WhatsApp Web</span>
                </button>
                <button
                  onClick={() => setWhatsappModal(null)}
                  className="px-4 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-xs transition-colors"
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
