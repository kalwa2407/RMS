import React, { useEffect, useState } from "react";
import { Check, X, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";

const ReservationsManagement = () => {
  const { toast } = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  if (loading) {
    return <div className="text-center py-20 text-[#EAB308]">Loading reservations...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white" style={{ fontFamily: "Playfair Display, serif" }}>
          Reservations
        </h2>
        <div className="flex gap-4 mt-2 text-xs text-gray-500 uppercase tracking-widest">
          <span>Total: <span className="text-white font-bold">{reservations.length}</span></span>
          <span>Pending: <span className="text-yellow-400 font-bold">{reservations.filter(r => r.status === "pending").length}</span></span>
          <span>Confirmed: <span className="text-green-400 font-bold">{reservations.filter(r => r.status === "confirmed").length}</span></span>
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-20 text-gray-600">No reservations yet</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reservations.map((res) => {
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
