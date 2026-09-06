import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Edit2, Check, X, ShieldCheck } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";

const CaptainsManagement = () => {
  const { toast } = useToast();
  const token = localStorage.getItem("admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [captains, setCaptains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ captain_id: "", name: "", phone: "", password: "", active: true });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchCaptains = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/captains`, { headers });
      setCaptains(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load captains", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCaptains(); }, []);

  const resetForm = () => {
    setForm({ captain_id: "", name: "", phone: "", password: "", active: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (c) => {
    setForm({ captain_id: c.captain_id, name: c.name, phone: c.phone || "", password: "", active: c.active });
    setEditingId(c.id || c.captain_id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const updatePayload = { name: form.name, phone: form.phone, active: form.active };
        if (form.password) updatePayload.password = form.password;
        await axios.put(`${API_BASE}/api/admin/captains/${editingId}`, updatePayload, { headers });
        toast({ title: "Updated", description: `Captain ${form.name} updated` });
      } else {
        if (!form.captain_id || !form.name || !form.password) {
          toast({ title: "Missing fields", description: "Captain ID, name, and password are required", variant: "destructive" });
          setSaving(false);
          return;
        }
        await axios.post(`${API_BASE}/api/admin/captains`, form, { headers });
        toast({ title: "Created", description: `Captain ${form.name} created` });
      }
      resetForm();
      fetchCaptains();
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.detail || "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/captains/${id}`, { headers });
      toast({ title: "Deleted", description: "Captain removed" });
      setDeleteConfirm(null);
      fetchCaptains();
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.detail || "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Captains
          </h2>
          <p className="text-gray-500 text-xs uppercase tracking-widest mt-0.5">Floor staff management</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#EAB308] text-black px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-400 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Captain</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-[#1a4855] border border-[#EAB308]/20 rounded-xl p-5 mb-6">
          <h3 className="text-white font-bold text-base mb-4">
            {editingId ? "Edit Captain" : "New Captain"}
          </h3>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!editingId && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Captain ID *</label>
                  <input
                    type="text"
                    value={form.captain_id}
                    onChange={e => setForm({ ...form, captain_id: e.target.value })}
                    placeholder="e.g. CAP001"
                    className="w-full bg-[#0f2933] border border-[#EAB308]/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#EAB308]/50 placeholder-gray-600"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Captain name"
                  className="w-full bg-[#0f2933] border border-[#EAB308]/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#EAB308]/50 placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone number"
                  className="w-full bg-[#0f2933] border border-[#EAB308]/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#EAB308]/50 placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">
                  Password {editingId && <span className="text-gray-600">(leave blank to keep)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={editingId ? "New password (optional)" : "Password *"}
                  className="w-full bg-[#0f2933] border border-[#EAB308]/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#EAB308]/50 placeholder-gray-600"
                />
              </div>
            </div>

            {editingId && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                  className="accent-[#EAB308] w-4 h-4"
                />
                <span className="text-sm text-gray-300">Active (can login)</span>
              </label>
            )}

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 bg-[#EAB308] text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-400 transition-colors disabled:opacity-60">
                <Check className="h-4 w-4" />
                {saving ? "Saving..." : (editingId ? "Update" : "Create")}
              </button>
              <button type="button" onClick={resetForm}
                className="flex items-center gap-1.5 bg-[#0f2933] border border-[#EAB308]/20 text-gray-400 px-4 py-2 rounded-lg text-sm font-bold hover:text-white transition-colors">
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Captains List */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading captains...</div>
      ) : captains.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
          <ShieldCheck className="h-14 w-14 opacity-25" />
          <p className="text-sm">No captains yet</p>
          <p className="text-xs">Click "Add Captain" to create one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {captains.map(c => (
            <div key={c.id || c.captain_id}
              className="flex items-center gap-3 bg-[#1a4855] border border-[#EAB308]/15 rounded-xl px-4 py-3.5">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-[#EAB308]/15 border border-[#EAB308]/20 flex items-center justify-center shrink-0">
                <span className="text-[#EAB308] font-bold text-sm">
                  {c.name?.charAt(0)?.toUpperCase() || "C"}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-semibold text-sm">{c.name}</p>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0f2933] text-[#EAB308] border border-[#EAB308]/20">
                    {c.captain_id}
                  </span>
                  {!c.active && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 border border-red-500/20">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-0.5">{c.phone || "No phone"}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => handleEdit(c)}
                  className="p-2 rounded-lg bg-[#0f2933] text-gray-400 hover:text-white transition-colors">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                {deleteConfirm === (c.id || c.captain_id) ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(c.id || c.captain_id)}
                      className="px-2 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">
                      Confirm
                    </button>
                    <button onClick={() => setDeleteConfirm(null)}
                      className="p-1.5 rounded-lg bg-[#0f2933] text-gray-400 hover:text-white transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(c.id || c.captain_id)}
                    className="p-2 rounded-lg bg-[#0f2933] text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Login info box */}
      <div className="mt-6 bg-[#0f2933] border border-[#EAB308]/10 rounded-xl p-4">
        <p className="text-gray-500 text-xs">
          <span className="text-[#EAB308] font-bold">Captain login URL:</span>{" "}
          <span className="font-mono">{window.location.origin}/captain</span>
          {" "}— Captains use their <span className="text-white">Captain ID</span> + <span className="text-white">password</span> to log in.
        </p>
      </div>
    </div>
  );
};

export default CaptainsManagement;
