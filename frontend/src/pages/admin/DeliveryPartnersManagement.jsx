import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Edit2, Check, X, Bike } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";

const DeliveryPartnersManagement = () => {
  const { toast } = useToast();
  const token = localStorage.getItem("admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    vehicle_type: "Bike",
    vehicle_number: "",
    active: true
  });
  
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchPartners = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/delivery-partners`, { headers });
      setPartners(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load delivery partners", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPartners(); }, []);

  const resetForm = () => {
    setForm({ name: "", phone: "", password: "", vehicle_type: "Bike", vehicle_number: "", active: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name,
      phone: p.phone,
      password: "", // keep empty unless changing
      vehicle_type: p.vehicle_type || "Bike",
      vehicle_number: p.vehicle_number || "",
      active: p.active !== false
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const updatePayload = { 
          name: form.name, 
          phone: form.phone, 
          vehicle_type: form.vehicle_type,
          vehicle_number: form.vehicle_number,
          active: form.active 
        };
        if (form.password) updatePayload.password = form.password;
        await axios.put(`${API_BASE}/api/admin/delivery-partners/${editingId}`, updatePayload, { headers });
        toast({ title: "Updated", description: `Partner ${form.name} updated` });
      } else {
        if (!form.name || !form.phone || !form.password) {
          toast({ title: "Missing fields", description: "Name, phone, and password are required", variant: "destructive" });
          setSaving(false);
          return;
        }
        await axios.post(`${API_BASE}/api/admin/delivery-partners`, form, { headers });
        toast({ title: "Created", description: `Partner ${form.name} created` });
      }
      resetForm();
      fetchPartners();
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.detail || "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/delivery-partners/${id}`, { headers });
      toast({ title: "Deleted", description: "Partner removed" });
      setDeleteConfirm(null);
      fetchPartners();
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.detail || "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Delivery Partners
          </h2>
          <p className="text-gray-500 text-xs uppercase tracking-widest mt-0.5">Rider fleet management</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#3b82f6] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-500 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Partner</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-[#1a4855] border border-[#3b82f6]/20 rounded-xl p-5 mb-6">
          <h3 className="text-white font-bold text-base mb-4">
            {editingId ? "Edit Partner" : "New Delivery Partner"}
          </h3>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Rider name"
                  className="w-full bg-[#0f2933] border border-[#3b82f6]/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#3b82f6]/50 placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Phone Number *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="Login phone number"
                  className="w-full bg-[#0f2933] border border-[#3b82f6]/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#3b82f6]/50 placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Vehicle Type</label>
                <select
                  value={form.vehicle_type}
                  onChange={e => setForm({ ...form, vehicle_type: e.target.value })}
                  className="w-full bg-[#0f2933] border border-[#3b82f6]/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#3b82f6]/50"
                >
                  <option value="Bike">Bike</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Cycle">Cycle</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Vehicle Number</label>
                <input
                  type="text"
                  value={form.vehicle_number}
                  onChange={e => setForm({ ...form, vehicle_number: e.target.value })}
                  placeholder="e.g. MH12 AB 1234"
                  className="w-full bg-[#0f2933] border border-[#3b82f6]/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#3b82f6]/50 placeholder-gray-600"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">
                  Password {editingId && <span className="text-gray-600">(leave blank to keep)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={editingId ? "New password (optional)" : "Login Password *"}
                  className="w-full bg-[#0f2933] border border-[#3b82f6]/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#3b82f6]/50 placeholder-gray-600"
                />
              </div>
            </div>

            {editingId && (
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                  className="accent-[#3b82f6] w-4 h-4"
                />
                <span className="text-sm text-gray-300">Active (can receive orders)</span>
              </label>
            )}

            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 bg-[#3b82f6] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-500 transition-colors disabled:opacity-60">
                <Check className="h-4 w-4" />
                {saving ? "Saving..." : (editingId ? "Update" : "Create")}
              </button>
              <button type="button" onClick={resetForm}
                className="flex items-center gap-1.5 bg-[#0f2933] border border-[#3b82f6]/20 text-gray-400 px-4 py-2 rounded-lg text-sm font-bold hover:text-white transition-colors">
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading delivery partners...</div>
      ) : partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
          <Bike className="h-14 w-14 opacity-25" />
          <p className="text-sm">No delivery partners yet</p>
          <p className="text-xs">Click "Add Partner" to create one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map(p => (
            <div key={p.id}
              className="flex items-center gap-3 bg-[#1a4855] border border-[#3b82f6]/15 rounded-xl px-4 py-3.5">
              <div className="w-10 h-10 rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/20 flex items-center justify-center shrink-0">
                <Bike className="h-5 w-5 text-[#3b82f6]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-semibold text-sm">{p.name}</p>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0f2933] text-[#3b82f6] border border-[#3b82f6]/20">
                    {p.phone}
                  </span>
                  {p.active === false && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 border border-red-500/20">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-0.5">
                  {p.vehicle_type} {p.vehicle_number ? `· ${p.vehicle_number}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => handleEdit(p)}
                  className="p-2 rounded-lg bg-[#0f2933] text-gray-400 hover:text-white transition-colors">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                {deleteConfirm === p.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(p.id)}
                      className="px-2 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">
                      Confirm
                    </button>
                    <button onClick={() => setDeleteConfirm(null)}
                      className="p-1.5 rounded-lg bg-[#0f2933] text-gray-400 hover:text-white transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(p.id)}
                    className="p-2 rounded-lg bg-[#0f2933] text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-[#0f2933] border border-[#3b82f6]/10 rounded-xl p-4">
        <p className="text-gray-500 text-xs">
          <span className="text-[#3b82f6] font-bold">Rider login URL:</span>{" "}
          <span className="font-mono">{window.location.origin}/delivery</span>
          {" "}— Riders use their <span className="text-white">Phone Number</span> + <span className="text-white">password</span> to log in.
        </p>
      </div>
    </div>
  );
};

export default DeliveryPartnersManagement;
