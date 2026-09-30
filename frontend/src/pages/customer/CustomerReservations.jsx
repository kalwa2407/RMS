import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useToast } from '../../hooks/use-toast';
import API_BASE from '../../lib/config';
import {
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  CheckCircle,
  Clock3,
  XCircle,
  RotateCw,
  Plus,
  MessageSquare,
  Sparkles
} from 'lucide-react';

const CustomerReservations = () => {
  const { idToken, fetchWithAuth } = useCustomerAuth();
  const { toast } = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevReservationsRef = useRef([]);

  const fetchReservations = useCallback(async (isPolling = false) => {
    if (!idToken) return;
    if (!isPolling) setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/api/customer/reservations`);
      if (res.ok) {
        const data = await res.json() || [];

        // Check if any reservation just got confirmed
        if (prevReservationsRef.current.length > 0) {
          data.forEach(curr => {
            const prev = prevReservationsRef.current.find(p => (p.id || p._id) === (curr.id || curr._id));
            if (prev && prev.status === 'pending' && curr.status === 'confirmed') {
              toast({
                title: "🎉 Reservation Confirmed!",
                description: `Table ${curr.table_number ? curr.table_number : 'Assigned'} is confirmed for ${curr.date} at ${curr.time}!`,
              });
            }
          });
        }
        prevReservationsRef.current = data;
        setReservations(data);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      if (!isPolling) setLoading(false);
      setIsRefreshing(false);
    }
  }, [idToken, fetchWithAuth, toast]);

  useEffect(() => {
    if (idToken) {
      fetchReservations();
    }
  }, [idToken, fetchReservations]);

  // Fast live polling: 4 seconds if pending reservation exists, 15 seconds otherwise
  useEffect(() => {
    if (!idToken) return;
    const hasPending = reservations.some(r => r.status === 'pending');
    const intervalTime = hasPending ? 4000 : 15000;

    const interval = setInterval(() => {
      fetchReservations(true);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [idToken, reservations, fetchReservations]);

  // Immediate refresh on window / tab focus
  useEffect(() => {
    const handleFocus = () => {
      if (idToken) fetchReservations(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [idToken, fetchReservations]);

  const getStatusDisplay = (res) => {
    const status = res.status;
    switch (status) {
      case 'confirmed':
        return {
          icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
          label: res.table_number ? `Confirmed (Table ${res.table_number})` : 'Confirmed',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          desc: res.table_number
            ? `Your Table ${res.table_number} is reserved for ${res.date} at ${res.time}! Please arrive 10-15 minutes early.`
            : `Your table is confirmed for ${res.date} at ${res.time}! Please arrive 10-15 minutes early.`
        };
      case 'rejected':
      case 'cancelled':
        return {
          icon: <XCircle className="w-4 h-4 text-red-400" />,
          label: 'Unavailable',
          badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
          desc: 'Sorry, tables were fully booked for this slot.'
        };
      default:
        return {
          icon: <Clock3 className="w-4 h-4 text-amber-400 animate-pulse" />,
          label: 'Awaiting Host Confirmation',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
          desc: 'Our manager is reviewing table availability and will confirm shortly...'
        };
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#070d14" }}>

      {/* ─── Fixed Header ─── */}
      <div className="shrink-0" style={{ background: "rgba(7,13,20,0.98)", borderBottom: "1px solid rgba(234,179,8,0.1)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/customer/dashboard" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#EAB308] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">My Reservations</h1>
              <p className="text-[#EAB308] text-[10px] font-semibold">{reservations.length} booking{reservations.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIsRefreshing(true); fetchReservations(); }}
              disabled={isRefreshing}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#EAB308] transition-colors"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#EAB308]' : ''}`} />
            </button>
            <Link to="/reservation" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-black bg-[#EAB308] hover:bg-[#CA8A04] transition-all">
              <Plus className="w-3.5 h-3.5" />
              <span>Book Table</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">

        {/* Live indicator if pending */}
        {reservations.some(r => r.status === 'pending') && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>
              Real-time update active: You have a pending reservation awaiting approval. This page refreshes automatically.
            </span>
          </div>
        )}

        {/* Reservation Cards List */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 space-y-2">
            <div className="w-6 h-6 border-2 border-[#EAB308] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Loading your reservations...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-[#0f2933]/80 border border-white/5 rounded-2xl p-12 text-center space-y-3">
            <Calendar className="w-12 h-12 text-gray-500 mx-auto" />
            <p className="text-base text-gray-300 font-medium">No table reservations yet</p>
            <p className="text-xs text-gray-400">
              Plan your fine dining experience with royal seating and live kitchen delicacies.
            </p>
            <div className="pt-2">
              <Link
                to="/reservation"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EAB308] hover:bg-[#CA8A04] text-black font-bold text-xs rounded-xl transition-all"
              >
                <span>Reserve a Table Now</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map(res => {
              const statusInfo = getStatusDisplay(res);

              return (
                <div
                  key={res.id || res._id}
                  className="bg-[#0f2933]/90 border border-[#EAB308]/20 hover:border-[#EAB308]/40 rounded-2xl p-5 sm:p-6 transition-all shadow-xl space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#EAB308]/10 border border-[#EAB308]/30 flex items-center justify-center text-[#EAB308]">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                          <span>Table for {res.guests} Guests</span>
                          {res.status === 'confirmed' && res.table_number && (
                            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-black">
                              Table {res.table_number}
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-400">
                          Reserved under {res.customer_name} {res.phone && `• +91 ${res.phone}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${statusInfo.badgeClass}`}>
                        {statusInfo.icon}
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Date, Time & Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#0a1e25]/60 p-3.5 rounded-xl border border-white/5">
                    <div>
                      <span className="text-gray-400 block mb-0.5">Date</span>
                      <strong className="text-white text-sm">{res.date}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Time Slot</span>
                      <strong className="text-[#EAB308] text-sm">{res.time}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Party Size</span>
                      <strong className="text-white text-sm">{res.guests} Guests</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Assigned Table</span>
                      <strong className={`text-sm ${res.table_number ? "text-emerald-400 font-bold" : "text-gray-400 font-normal"}`}>
                        {res.table_number ? `Table ${res.table_number}` : "Auto-allocated"}
                      </strong>
                    </div>
                  </div>

                  {/* Special requests if any */}
                  {res.special_requests && (
                    <div className="text-xs text-gray-300 flex items-start gap-2 bg-white/5 p-3 rounded-xl">
                      <MessageSquare className="w-4 h-4 text-[#EAB308] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Special Requests: </span>
                        <span>{res.special_requests}</span>
                      </div>
                    </div>
                  )}

                  {/* Action & WhatsApp Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/5">
                    <p className="text-xs text-gray-400">{statusInfo.desc}</p>
                    <div className="flex items-center gap-3">
                      <a
                        href={`https://wa.me/919594287868?text=${encodeURIComponent(
                          `Hello Persian Darbar! I have a question regarding my table reservation:\n\n` +
                          `👤 *Name:* ${res.customer_name}\n` +
                          `📅 *Date:* ${res.date}\n` +
                          `⏰ *Time:* ${res.time}\n` +
                          `👥 *Guests:* ${res.guests} Guests\n` +
                          `${res.table_number ? `🪑 *Table:* Table ${res.table_number}\n` : ""}\n` +
                          `Please help me with this. Thank you!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp Concierge</span>
                      </a>
                      <Link
                        to="/reservation"
                        className="text-xs text-[#EAB308] hover:underline font-semibold whitespace-nowrap"
                      >
                        Book Another
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        </div>
      </div>
    </div>
  );
};

export default CustomerReservations;
