import React, { useEffect, useState } from "react";
import { Check, X, Trash2, Calendar, CalendarDays, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";

const ReservationsManagement = () => {
  const { toast } = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");

  const token = localStorage.getItem("admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchReservations(); }, []);

  const fetchReservations = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/reservations`, { headers });
      setReservations(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Error", description: "Failed to fetch reservations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API_BASE}/api/admin/reservations/${id}/status`, { status }, { headers });
      toast({ title: "Updated", description: `Reservation marked as ${status}` });
      fetchReservations();
    } catch {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const deleteReservation = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/reservations/${id}`, { headers });
      toast({ title: "Deleted", description: "Reservation removed" });
      setDeleteConfirm(null);
      fetchReservations();
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const statusBadge = (s) => {
    const map = {
      pending:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
      rejected:  "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return map[s] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getTodayDateString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const adjustDate = (days) => {
    if (!selectedDate) return;
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return dateObj.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric"
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const filteredReservations = reservations.filter((res) => {
    if (!selectedDate) return true;
    if (!res.date) return false;
    if (res.date === selectedDate) return true;
    if (res.date.startsWith(selectedDate)) return true;

    const parts = res.date.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const yyyy = parts[0];
        const mm = parts[1].padStart(2, "0");
        const dd = parts[2].padStart(2, "0");
        if (`${yyyy}-${mm}-${dd}` === selectedDate) return true;
      } else if (parts[2].length === 4) {
        const yyyy = parts[2];
        const mm = parts[1].padStart(2, "0");
        const dd = parts[0].padStart(2, "0");
        if (`${yyyy}-${mm}-${dd}` === selectedDate) return true;
      }
    }
    return false;
  });

  if (loading) {
    return <div className="text-center py-20 text-[#EAB308]">Loading reservations...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white" style={{ fontFamily: "Playfair Display, serif" }}>
            Reservations
          </h2>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500 uppercase tracking-widest">
            <span>
              Total: <span className="text-white font-bold">{filteredReservations.length}</span>
              {selectedDate && <span className="text-gray-400 font-normal"> (all: {reservations.length})</span>}
            </span>
            <span>
              Pending: <span className="text-yellow-400 font-bold">{filteredReservations.filter(r => r.status === "pending").length}</span>
            </span>
            <span>
              Confirmed: <span className="text-green-400 font-bold">{filteredReservations.filter(r => r.status === "confirmed").length}</span>
            </span>
          </div>
        </div>

        {/* Top Right Date Filter Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Main Date Button with Native Calendar Input */}
          <div className="relative group">
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                selectedDate
                  ? "bg-[#EAB308]/15 border-[#EAB308] text-[#EAB308] shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                  : "bg-[#1a4855] border-[#EAB308]/20 text-gray-200 hover:border-[#EAB308]/50 hover:bg-[#1a4855]/80"
              }`}
            >
              <Calendar className="w-4 h-4 text-[#EAB308] shrink-0" />
              <span>{selectedDate ? formatDateDisplay(selectedDate) : "Select Date"}</span>
              {selectedDate && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EAB308]/20 text-[#EAB308] font-mono">
                  {filteredReservations.length}
                </span>
              )}
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              title="Click to select a date"
            />
          </div>

          {/* Quick Actions & Day Stepper */}
          {selectedDate ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustDate(-1)}
                className="p-2 rounded-xl bg-[#1a4855] border border-[#EAB308]/20 text-gray-300 hover:text-[#EAB308] hover:border-[#EAB308]/50 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => adjustDate(1)}
                className="p-2 rounded-xl bg-[#1a4855] border border-[#EAB308]/20 text-gray-300 hover:text-[#EAB308] hover:border-[#EAB308]/50 transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate("")}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#1a4855] border border-[#EAB308]/20 text-gray-300 hover:text-red-400 hover:border-red-400/40 transition-colors text-xs font-semibold"
                title="Clear date filter"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Show All</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSelectedDate(getTodayDateString())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a4855] border border-[#EAB308]/20 text-gray-300 hover:text-[#EAB308] hover:border-[#EAB308]/50 transition-colors text-xs font-semibold"
              title="Show reservations for today"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#EAB308]" />
              <span>Today</span>
            </button>
          )}
        </div>
      </div>

      {/* Reservation Cards or Empty State */}
      {reservations.length === 0 ? (
        <div className="text-center py-20 text-gray-600">No reservations yet</div>
      ) : filteredReservations.length === 0 ? (
        <div className="text-center py-16 bg-[#1a4855]/40 border border-[#EAB308]/15 rounded-2xl p-8 max-w-md mx-auto my-8">
          <Calendar className="w-12 h-12 text-[#EAB308]/60 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Reservations Found</h3>
          <p className="text-gray-400 text-sm mb-5">
            There are no reservations booked for <span className="text-[#EAB308] font-semibold">{formatDateDisplay(selectedDate)}</span>.
          </p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate("")}
              className="px-4 py-2 bg-[#EAB308] hover:bg-[#ca9a07] text-black font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              View All Reservations
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReservations.map((res) => {
            const id = res._id || res.id;
            return (
              <div
                key={id}
                className="bg-[#1a4855] border border-[#EAB308]/15 rounded-2xl p-4 sm:p-5"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-base truncate">{res.customer_name}</h3>
                    <p className="text-gray-400 text-sm">{res.phone}</p>
                    {res.email && <p className="text-gray-500 text-xs">{res.email}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${statusBadge(res.status)}`}>
                      {res.status}
                    </span>
                    {/* Delete button */}
                    {deleteConfirm === id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteReservation(id)}
                          className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-bold"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="p-1.5 rounded-lg bg-[#0f2933] text-gray-400"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(id)}
                        className="p-1.5 rounded-lg bg-[#0f2933] text-gray-500 hover:text-red-400 transition-colors"
                        title="Delete reservation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4 bg-[#0f2933]/50 rounded-xl p-3">
                  <div>
                    <span className="text-[#EAB308] text-xs uppercase tracking-wider">Date</span>
                    <p className="text-white font-semibold">{res.date}</p>
                  </div>
                  <div>
                    <span className="text-[#EAB308] text-xs uppercase tracking-wider">Time</span>
                    <p className="text-white font-semibold">{res.time}</p>
                  </div>
                  <div>
                    <span className="text-[#EAB308] text-xs uppercase tracking-wider">Guests</span>
                    <p className="text-white font-semibold">{res.guests}</p>
                  </div>
                  {res.special_requests && (
                    <div className="col-span-2">
                      <span className="text-[#EAB308] text-xs uppercase tracking-wider">Note</span>
                      <p className="text-gray-300 text-xs leading-snug mt-0.5">{res.special_requests}</p>
                    </div>
                  )}
                </div>

                {/* Action buttons — pending only */}
                {res.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(id, "confirmed")}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
                    >
                      <Check className="h-4 w-4" /> Confirm
                    </button>
                    <button
                      onClick={() => updateStatus(id, "rejected")}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                  </div>
                )}

                <p className="text-gray-600 text-xs mt-3">
                  {new Date(res.created_at).toLocaleString("en-IN")}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReservationsManagement;
