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
import { cx, Page, PageHeader, Card, StatCard, List, SectionTitle, Button, IconButton, Segmented, SearchField, StatusPill, Notice, Sheet, FormField, EmptyState, LoadingState } from "./ui";

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

  if (days < 0) return { label: "Past", tone: "neutral", isPast: true, color: "text-gray-500 bg-gray-500/10 border-gray-500/20" };
  if (days > 1) return { label: `In ${days} days`, tone: "info", isPast: false, color: "text-blue-300 bg-blue-500/10 border-blue-400/30" };
  if (days === 1) return { label: "Tomorrow", tone: "info", isPast: false, color: "text-yellow-300 bg-yellow-500/15 border-yellow-400/30" };

  // It's TODAY: calculate minutes difference from now
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const resMins = parseTimeToMinutes(timeStr);
  const diff = resMins - currentMins;

  if (diff < -90) {
    return { label: "Passed today", tone: "neutral", isPast: true, color: "text-gray-400 bg-gray-500/10 border-gray-500/20" };
  } else if (diff <= 0 && diff >= -90) {
    return { label: "Happening now", tone: "error", isNow: true, isUrgent: true, color: "text-red-400 bg-red-500/20 border-red-500/50 animate-pulse" };
  } else if (diff <= 60) {
    return { label: `In ${diff} min`, tone: "warn", isUrgent: true, color: "text-orange-400 bg-orange-500/25 border-orange-400/60 animate-pulse" };
  } else if (diff <= 180) {
    const hours = Math.floor(diff / 60);
    const m = diff % 60;
    return { label: `In ${hours}h ${m > 0 ? `${m}m` : ""}`, tone: "warn", isToday: true, color: "text-amber-300 bg-amber-500/15 border-amber-400/40" };
  } else {
    return { label: "Later today", tone: "neutral", isToday: true, color: "text-orange-300 bg-orange-500/15 border-orange-400/30" };
  }
}

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const statusMeta = (s) => ({
  pending:   { label: "Pending", tone: "accent" },
  confirmed: { label: "Confirmed", tone: "success" },
  seated:    { label: "Seated", tone: "info" },
  completed: { label: "Completed", tone: "neutral" },
  rejected:  { label: "Rejected", tone: "error" },
}[s] || { label: s || "Unknown", tone: "neutral" });

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
          title: "New Reservation Received!",
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
            title: "Reservation Confirmed & WhatsApp Sent!",
            description: `Confirmation pass dispatched directly to ${updatedRes.customer_name} (+91 ${updatedRes.phone})${updatedRes.table_number ? ` • Table ${updatedRes.table_number}` : ""}`,
          });
        } else if (updatedRes.whatsapp_error) {
          toast({
            title: "Reservation Confirmed",
            description: `Confirmed${updatedRes.table_number ? ` (Table ${updatedRes.table_number})` : ""}. WhatsApp status: ${updatedRes.whatsapp_error}`,
          });
        } else {
          toast({
            title: "Reservation Confirmed!",
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
        title: "WhatsApp Sent via Meta Cloud API!",
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
    return <LoadingState rows={5} label="Loading reservations" />;
  }

  return (
    <Page>
      <PageHeader
        title="Reservations"
        subtitle={
          <span>
            Updated <span className="pd-tabular">{lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-[var(--a-text-3)]"> · </span>
            <span className="pd-tabular">{TOTAL_TABLES}</span> tables
          </span>
        }
        actions={
          <>
            <Button
              variant={soundEnabled ? "tinted" : "secondary"}
              icon={soundEnabled ? Volume2 : VolumeX}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute incoming booking alert chime" : "Enable incoming booking alert chime"}
            >
              {soundEnabled ? "Chime On" : "Muted"}
            </Button>
            <Segmented
              value={viewMode}
              onChange={setViewMode}
              options={[{ value: "grid", label: "Cards", icon: LayoutGrid }, { value: "timeline", label: "Timeline", icon: ListOrdered }]}
            />
            <IconButton icon={RotateCcw} label="Refresh reservations now" onClick={() => fetchReservations()} />
          </>
        }
      />

      {imminentReservations.length > 0 && (
        <Card className="border-[var(--a-warn)]/40 bg-[var(--a-warn-tint)] shadow-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <ShieldAlert className="h-5 w-5 text-[var(--a-warn)] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-[var(--a-text)]">
                  {imminentReservations.length} reservation{imminentReservations.length > 1 ? "s" : ""} arriving within the hour
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {imminentReservations.map(res => (
                    <div key={res._id || res.id} className="flex items-center gap-2 rounded-full bg-[var(--a-card)] border border-[var(--a-line)] px-3 py-1 text-[13px]">
                      <span className="font-semibold pd-tabular">{res.time}</span>
                      <span className="text-[var(--a-text-3)]">·</span>
                      <span>{res.table_number ? `T${res.table_number}` : "No table"}</span>
                      <span className="text-[var(--a-text-3)]">·</span>
                      <span className="text-[var(--a-text-2)]">{res.customer_name} ({res.guests})</span>
                      <button onClick={() => setWhatsappModal(res)} className="text-[var(--a-success)] font-medium hover:underline cursor-pointer">WhatsApp</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button variant="secondary" onClick={() => { setActiveTab("today"); setSelectedDate(""); }}>Open Today's Queue</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Today", value: todayCount, sub: "Arrivals today", tab: "today", tone: "neutral", icon: CalendarDays },
          { label: "Pending", value: pendingCount, sub: "Needs confirmation", tab: "pending", tone: "accent", icon: Timer },
          { label: "Confirmed", value: confirmedCount, sub: "Ready for dining", tab: "confirmed", tone: "success", icon: Check },
          { label: "Upcoming", value: upcomingCount, sub: "Tomorrow and later", tab: "upcoming", tone: "info", icon: Calendar },
        ].map(s => {
          const isSelected = activeTab === s.tab && !selectedDate;
          return (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              sub={s.sub}
              icon={s.icon}
              tone={s.tone}
              onClick={() => { setActiveTab(s.tab); setSelectedDate(""); }}
              className={isSelected ? "ring-2 ring-[var(--a-accent)]/50" : ""}
            />
          );
        })}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          value={selectedDate ? "" : activeTab}
          onChange={(v) => { setActiveTab(v); setSelectedDate(""); }}
          options={[
            { value: "today", label: `Today (${todayCount})` },
            { value: "pending", label: `Pending (${pendingCount})` },
            { value: "confirmed", label: `Confirmed (${confirmedCount})` },
            { value: "upcoming", label: `Upcoming (${upcomingCount})` },
            { value: "all", label: `All (${reservations.length})` },
          ]}
        />
        <div className="flex items-center gap-2">
          <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Name, phone or table" className="flex-1 lg:w-64" />
          {!selectedDate && (
            <Button size="md" variant="tinted" icon={CalendarDays} onClick={() => setSelectedDate(getTodayDateString())}>Today</Button>
          )}
          <div className="relative">
            <Button size="md" variant={selectedDate ? "secondary" : "tinted"} icon={Calendar}>
              {selectedDate ? formatDateShort(selectedDate) : "Pick Date"}
            </Button>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" aria-label="Pick date" />
          </div>
          {selectedDate && <IconButton icon={X} label="Clear date filter" onClick={() => setSelectedDate("")} />}
        </div>
      </div>

      {filteredReservations.length === 0 ? (
        <Card>
          <EmptyState
            icon={Calendar}
            title="No reservations"
            description={selectedDate
              ? `No table reservations on ${formatDateShort(selectedDate)}.`
              : searchQuery
              ? `No bookings match "${searchQuery}".`
              : "No reservations under this filter."}
            action={<Button icon={RotateCcw} onClick={() => { setActiveTab("today"); setSelectedDate(""); setSearchQuery(""); }}>Back to Today</Button>}
          />
        </Card>
      ) : viewMode === "timeline" ? (
        /* Timeline: compact rows sorted by arrival slot */
        <section className="space-y-2">
          <SectionTitle title="Timeline" subtitle={`${filteredReservations.length} bookings by arrival slot`} />
          <List>
            {filteredReservations.map((res) => {
              const id = res._id || res.id;
              const timing = getLiveTimingStatus(res.date, res.time);
              const estEnd = getEstimatedEndSlot(res.time);
              const st = statusMeta(res.status);
              return (
                <div key={id} className="flex flex-col md:flex-row md:items-center gap-3 px-4 py-3">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-[84px] shrink-0">
                      <div className="text-[17px] font-semibold pd-tabular text-[var(--a-text)]">{res.time}</div>
                      <div className="text-[12px] text-[var(--a-text-3)] pd-tabular">to {estEnd}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-medium text-[var(--a-text)]">{res.customer_name}</span>
                        <StatusPill tone={st.tone} dot>{st.label}</StatusPill>
                        {timing && <StatusPill tone={timing.tone}>{timing.label}</StatusPill>}
                      </div>
                      <div className="mt-0.5 flex items-center flex-wrap gap-x-2 text-[13px] text-[var(--a-text-2)]">
                        <span className={res.table_number ? "" : "text-[var(--a-warn)]"}>{res.table_number ? `Table ${res.table_number}` : "No table assigned"}</span>
                        <span className="text-[var(--a-text-3)]">·</span>
                        <span className="pd-tabular">{res.guests} guests</span>
                        <span className="text-[var(--a-text-3)]">·</span>
                        <a href={`tel:${res.phone}`} className="pd-tabular hover:underline">+91 {res.phone}</a>
                        {res.special_requests && <span className="italic text-[var(--a-text-3)]">“{res.special_requests}”</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <IconButton icon={MessageCircle} label="WhatsApp" onClick={() => setWhatsappModal(res)} />
                    <IconButton icon={Table} label="Assign/Change Table" onClick={() => setTablePickerModal(res)} />
                    {res.status === "pending" ? (
                      <Button size="sm" variant="primary" onClick={() => updateStatus(id, "confirmed", res)}>Confirm</Button>
                    ) : res.status === "confirmed" ? (
                      <Button size="sm" variant="secondary" icon={UserCheck} onClick={() => updateStatus(id, "seated", res)}>Seat Guests</Button>
                    ) : res.status === "seated" ? (
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(id, "completed", res)}>Free Table</Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </List>
        </section>
      ) : (
        /* Cards */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {filteredReservations.map(res => {
            const id = res._id || res.id;
            const timing = getLiveTimingStatus(res.date, res.time);
            const estEnd = getEstimatedEndSlot(res.time);
            const isSending = sending === id;
            const st = statusMeta(res.status);
            const dp = res.date ? res.date.split(/[-/]/) : null;
            const dObj = dp ? new Date(+dp[0], +dp[1] - 1, +dp[2]) : null;
            const inactive = res.status === "rejected" || res.status === "completed";

            return (
              <Card key={id} padded={false} className={cx("flex flex-col", inactive && "opacity-70", timing?.isUrgent && "ring-1 ring-[var(--a-warn)]/50")}>
                {/* Header: date + time + status */}
                <div className="flex items-start justify-between gap-3 px-4 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-[52px] shrink-0 overflow-hidden rounded-[10px] border border-[var(--a-line)] text-center">
                      <div className="bg-[var(--a-accent)] text-[#FFFFFF] text-[11px] leading-4 font-semibold uppercase">
                        {dObj ? dObj.toLocaleDateString("en-IN", { month: "short" }) : "—"}
                      </div>
                      <div className="py-0.5 text-[20px] leading-6 font-semibold pd-tabular">
                        {dp ? dp[dp[0].length === 4 ? 2 : 0] : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[20px] leading-6 font-semibold pd-tabular text-[var(--a-text)]">{res.time}</div>
                      <div className="text-[13px] text-[var(--a-text-2)] pd-tabular">
                        {dObj ? dObj.toLocaleDateString("en-IN", { weekday: "short" }) : ""} · until {estEnd}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusPill tone={st.tone} dot>{st.label}</StatusPill>
                    {timing && <StatusPill tone={timing.tone}>{timing.label}</StatusPill>}
                  </div>
                </div>

                {/* Guest */}
                <div className="px-4 pt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[17px] font-semibold text-[var(--a-text)] truncate">{res.customer_name}</div>
                    <div className="mt-0.5 flex items-center flex-wrap gap-x-3 gap-y-1 text-[13px]">
                      <a href={`tel:${res.phone}`} className="inline-flex items-center gap-1 text-[var(--a-text-2)] pd-tabular hover:underline">
                        <Phone className="h-3.5 w-3.5" /> +91 {res.phone}
                      </a>
                      <button onClick={() => setWhatsappModal(res)} className="inline-flex items-center gap-1 text-[var(--a-success)] font-medium hover:underline cursor-pointer">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </button>
                    </div>
                    {res.email && <div className="text-[12px] text-[var(--a-text-3)] truncate">{res.email}</div>}
                  </div>
                  {deleteConfirm === id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="destructive" onClick={() => deleteReservation(id)}>Delete</Button>
                      <IconButton icon={X} label="Keep" className="h-8 w-8" onClick={() => setDeleteConfirm(null)} />
                    </div>
                  ) : (
                    <IconButton icon={Trash2} label="Delete reservation" variant="plain" className="!text-[var(--a-text-3)] hover:!text-[var(--a-error)]" onClick={() => setDeleteConfirm(id)} />
                  )}
                </div>

                {/* Table + party */}
                <div className="mx-4 mt-3 grid grid-cols-2 rounded-[12px] border border-[var(--a-line)] divide-x divide-[var(--a-line)]">
                  <button onClick={() => setTablePickerModal(res)} className="flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-[var(--a-fill)] cursor-pointer rounded-l-[12px]">
                    <div>
                      <div className="text-[12px] text-[var(--a-text-3)]">Table</div>
                      <div className={cx("text-[15px] font-medium", res.table_number ? "text-[var(--a-text)]" : "text-[var(--a-warn)]")}>
                        {res.table_number ? `Table ${res.table_number}` : "Assign table"}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-[var(--a-text-3)]" />
                  </button>
                  <div className="px-3 py-2.5">
                    <div className="text-[12px] text-[var(--a-text-3)]">Party size</div>
                    <div className="text-[15px] font-medium pd-tabular">{res.guests} {res.guests > 1 ? "guests" : "guest"}</div>
                  </div>
                </div>

                {res.special_requests && (
                  <Notice tone="gold" icon={Star} className="mx-4 mt-2">
                    <span className="font-semibold">Request: </span>{res.special_requests}
                  </Notice>
                )}

                <div className="px-4 pt-2 flex items-center justify-between text-[12px] text-[var(--a-text-3)]">
                  <span className="pd-tabular">Booked {new Date(res.created_at).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</span>
                  <span className="pd-tabular">#PD-{String(id).slice(-6).toUpperCase()}</span>
                </div>

                {/* Actions */}
                <div className="mt-auto px-4 py-3 mt-3 border-t border-[var(--a-line)] flex flex-wrap gap-2">
                  {res.status === "pending" ? (
                    <>
                      <Button className="flex-1" variant="primary" icon={isSending ? undefined : Check} onClick={() => updateStatus(id, "confirmed", res)} disabled={isSending}>
                        {isSending ? "Confirming…" : "Confirm & WhatsApp"}
                      </Button>
                      <Button variant="destructive" icon={X} onClick={() => updateStatus(id, "rejected", res)} disabled={isSending}>Reject</Button>
                    </>
                  ) : res.status === "confirmed" ? (
                    <>
                      <Button className="flex-1" variant="secondary" icon={MessageCircle} onClick={() => setWhatsappModal(res)}>Send WhatsApp</Button>
                      <Button variant="primary" icon={UserCheck} onClick={() => updateStatus(id, "seated", res)} title="Mark guests as arrived and seated at table">Mark Seated</Button>
                      <Button variant="plain" className="!text-[var(--a-error)]" onClick={() => updateStatus(id, "rejected", res)}>Cancel</Button>
                    </>
                  ) : res.status === "seated" ? (
                    <>
                      <Button className="flex-1" variant="primary" icon={CheckCircle2} onClick={() => updateStatus(id, "completed", res)}>
                        Complete Dining{res.table_number ? ` (Free Table ${res.table_number})` : ""}
                      </Button>
                      <IconButton icon={MessageCircle} label="WhatsApp" onClick={() => setWhatsappModal(res)} />
                    </>
                  ) : (
                    <Button className="flex-1" variant="tinted" icon={RotateCcw} onClick={() => updateStatus(id, "confirmed", res)}>Restore as Confirmed</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table picker */}
      <Sheet
        open={!!tablePickerModal}
        onClose={() => setTablePickerModal(null)}
        title="Assign table"
        subtitle={tablePickerModal ? `${tablePickerModal.customer_name} · ${tablePickerModal.guests} guests · ${tablePickerModal.time}` : ""}
        footer={tablePickerModal && (
          <>
            <Button variant="plain" className="mr-auto !text-[var(--a-error)]"
              onClick={() => updateStatus(tablePickerModal._id || tablePickerModal.id, tablePickerModal.status, tablePickerModal, null)}>
              Clear Table Assignment
            </Button>
            <Button variant="secondary" onClick={() => setTablePickerModal(null)}>Cancel</Button>
          </>
        )}
      >
        {tablePickerModal && (
          <div className="space-y-3">
            <p className="text-[13px] text-[var(--a-text-2)]">Choose one of the {TOTAL_TABLES} dining tables for this guest.</p>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map(num => {
                const isSelected = tablePickerModal.table_number === num;
                return (
                  <button
                    key={num}
                    onClick={() => updateStatus(tablePickerModal._id || tablePickerModal.id, tablePickerModal.status, tablePickerModal, num)}
                    className={cx(
                      "h-11 rounded-[10px] text-[15px] font-medium pd-tabular border transition-colors cursor-pointer",
                      isSelected
                        ? "bg-[var(--a-accent)] border-transparent text-[#FFFFFF]"
                        : "bg-[var(--a-card)] border-[var(--a-line)] text-[var(--a-text)] hover:bg-[var(--a-fill)]"
                    )}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Sheet>

      {/* WhatsApp */}
      <Sheet
        open={!!whatsappModal}
        onClose={() => setWhatsappModal(null)}
        title="Send WhatsApp update"
        subtitle={whatsappModal ? `${whatsappModal.customer_name} · +91 ${whatsappModal.phone}` : ""}
        footer={whatsappModal && (
          <>
            <Button variant="secondary" className="mr-auto" onClick={() => setWhatsappModal(null)}>Close</Button>
            <Button variant="secondary" icon={ExternalLink} title="Open manual WhatsApp Web chat"
              onClick={() => { openWhatsApp(whatsappModal.phone, getWhatsAppTemplates(whatsappModal).confirmation); setWhatsappModal(null); }}>
              WhatsApp Web
            </Button>
            <Button variant="success" icon={sendingDirectWa ? undefined : Zap} onClick={() => sendDirectWhatsApp(whatsappModal)} disabled={sendingDirectWa}>
              {sendingDirectWa ? "Sending…" : "Send Direct (Meta API)"}
            </Button>
          </>
        )}
      >
        {whatsappModal && (
          <div className="space-y-5">
            <FormField label="Open a template in WhatsApp">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "confirmation", label: "Confirmed", desc: "Booking pass" },
                  { id: "reminder", label: "1-hour", desc: "Reminder" },
                  { id: "ready", label: "Table ready", desc: "Arrival" },
                  { id: "cancellation", label: "Cancel", desc: "Release" },
                ].map(tmpl => {
                  const templates = getWhatsAppTemplates(whatsappModal);
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => openWhatsApp(whatsappModal.phone, templates[tmpl.id])}
                      className="rounded-[12px] border border-[var(--a-line)] bg-[var(--a-card)] px-3 py-2.5 text-left hover:bg-[var(--a-fill)] cursor-pointer"
                    >
                      <div className="text-[14px] font-medium text-[var(--a-text)]">{tmpl.label}</div>
                      <div className="text-[12px] text-[var(--a-text-3)]">{tmpl.desc}</div>
                    </button>
                  );
                })}
              </div>
            </FormField>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[var(--a-text-2)]">Preview (confirmation)</span>
                <Button size="sm" variant="plain" icon={Copy} onClick={() => {
                  navigator.clipboard.writeText(getWhatsAppTemplates(whatsappModal).confirmation);
                  toast({ title: "Copied!", description: "WhatsApp message copied to clipboard" });
                }}>Copy Text</Button>
              </div>
              <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-[12px] border border-[var(--a-line)] bg-[var(--a-inset)] p-3 text-[13px] leading-5 text-[var(--a-text)]">
                {getWhatsAppTemplates(whatsappModal).confirmation}
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </Page>
  );
};

export default ReservationsManagement;
