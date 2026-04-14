import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "");

const ReservationsManagement = () => {
  const { toast } = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem("admin_token");

      const response = await axios.get(`${API_BASE}/api/admin/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReservations(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch reservations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (reservationId, status) => {
    try {
      const token = localStorage.getItem("admin_token");

      await axios.put(
        `${API_BASE}/api/admin/reservations/${reservationId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: "Success",
        description: `Reservation marked as ${status}`,
      });

      fetchReservations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reservation",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "confirmed":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-primary">
        Loading reservations...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-4xl font-bold text-primary"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Reservations Management
        </h2>

        <p className="text-gray-300 mt-2">
          Total: {reservations.length} | Pending:{" "}
          {reservations.filter((r) => r.status === "pending").length}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reservations.map((res) => (
          <div
            key={res._id}
            className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:border-primary/20 transition-all duration-300"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {res.customer_name}
                </h3>

                <p className="text-gray-300">{res.phone}</p>

                {res.email && (
                  <p className="text-gray-400 text-sm">{res.email}</p>
                )}
              </div>

              <span
                className={`${getStatusColor(
                  res.status
                )} text-white px-3 py-1 rounded-full text-sm font-bold uppercase`}
              >
                {res.status}
              </span>
            </div>

            {/* DETAILS */}
            <div className="space-y-2 text-white mb-4">
              <p>
                <span className="text-primary">Date:</span> {res.date}
              </p>

              <p>
                <span className="text-primary">Time:</span> {res.time}
              </p>

              <p>
                <span className="text-primary">Guests:</span> {res.guests}
              </p>

              {res.special_requests && (
                <p>
                  <span className="text-primary">Special Requests:</span>{" "}
                  {res.special_requests}
                </p>
              )}
            </div>

            {/* ACTION BUTTONS */}
            {res.status === "pending" && (
              <div className="flex space-x-2">
                <button
                  onClick={() => updateStatus(res._id, "confirmed")}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center space-x-1"
                >
                  <Check className="h-4 w-4" />
                  <span>Confirm</span>
                </button>

                <button
                  onClick={() => updateStatus(res._id, "rejected")}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg flex items-center justify-center space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>Reject</span>
                </button>
              </div>
            )}

            <p className="text-gray-400 text-sm mt-4">
              Created: {new Date(res.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReservationsManagement;


