import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Edit2, Check, X, ChefHat } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";

const KitchenStaffManagement = () => {
  const { toast } = useToast();
  const token = localStorage.getItem("admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ staff_id: "", name: "", phone: "", password: "", active: true });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchStaff = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/kitchen-staff`, { headers });
      setStaff(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Error", description: "Failed to load kitchen staff", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const resetForm = () => {
    setForm({ staff_id: "", name: "", phone: "", password: "", active: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (s) => {
    setForm({ staff_id: s.staff_id, name: s.name, phone: s.phone || "", password: "", active: s.active });
    setEditingId(s.id || s.staff_id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const payload = { name: form.name, phone: form.phone, active: form.active };
        if (form.password) payload.password = form.password;
        await axios.put(`${API_BASE}/api/admin/kitchen-staff/${editingId}`, payload, { headers });
        toast({ title: "Updated", description: `${form.name} updated` });
      } else {
        if (!form.staff_id || !form.name || !form.password) {
          toast({ title: "Missing fields", description: "Staff ID, name and password required", variant: "destructive" });
          setSaving(false);
          return;
        }
        await axios.post(`${API_BASE}/api/admin/kitchen-staff`, form, { headers });
        toast({ title: "Created", description: `Kitchen staff ${form.name} created` });
      }
      resetForm();
      fetchStaff();
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.detail || "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/kitchen-staff/${id}`, { headers });
      toast({ title: "Deleted", description: "Staff member removed" });
      setDeleteConfirm(null);
      fetchStaff();
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.detail || "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Kitchen Staff
          </h2>
          <p className="text-gray-500 text-xs uppercase tracking-widest mt-0.5">Kitchen access management</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
          style={{ background: "linear-gradient(135deg, #f97316, #dc2626)" }}
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Staff</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-[#1a4855] border border-orange-500/20 rounded-xl p-5 mb-6">
          <h3 className="text-white font-bold text-base mb-4">{editingId ? "Edit Staff" : "New Kitchen Staff"}</h3>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!editingId && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Staff ID *</label>
                  <input type="text" value={form.staff_id}
                    onChange={e => setForm({ ...form, staff_id: e.target.value })}
                    placeholder="e.g. KIT001"
                    className="w-full bg-[#0f2933] border border-orange-500/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 placeholder-gray-600" />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Full Name *</label>
                <input type="text" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Staff name"
                  className="w-full bg-[#0f2933] border border-orange-500/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 placeholder-gray-600" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Phone</label>
                <input type="tel" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone number"
                  className="w-full bg-[#0f2933] border border-orange-500/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 placeholder-gray-600" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">
                  Password {editingId && <span className="text-gray-600">(blank = keep)</span>}
                </label>
                <input type="password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={editingId ? "New password (optional)" : "Password *"}
                  className="w-full bg-[#0f2933] border border-orange-500/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 placeholder-gray-600" />
              </div>
            </div>
            {editingId && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4" style={{ accentColor: "#f97316" }} />
                <span className="text-sm text-gray-300">Active (can login)</span>
              </label>
            )}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60 transition-all"
                style={{ background: "linear-gradient(135deg, #f97316, #dc2626)" }}>
                <Check className="h-4 w-4" />
                {saving ? "Saving..." : (editingId ? "Update" : "Create")}
              </button>
              <button type="button" onClick={resetForm}
                className="flex items-center gap-1.5 bg-[#0f2933] border border-orange-500/20 text-gray-400 px-4 py-2 rounded-lg text-sm font-bold hover:text-white">
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading staff...</div>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
          <ChefHat className="h-14 w-14 opacity-25" />
          <p className="text-sm">No kitchen staff yet</p>
          <p className="text-xs">Click "Add Staff" to create one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map(s => (
            <div key={s.id || s.staff_id}
              className="flex items-center gap-3 bg-[#1a4855] border border-orange-500/15 rounded-xl px-4 py-3.5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.25)" }}>
                <span className="text-orange-400 font-bold text-sm">{s.name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-semibold text-sm">{s.name}</p>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0f2933] border"
                    style={{ color: "#f97316", borderColor: "rgba(249,115,22,0.25)" }}>
                    {s.staff_id}
                  </span>
                  {!s.active && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 border border-red-500/20">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-0.5">{s.phone || "No phone"}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => handleEdit(s)}
                  className="p-2 rounded-lg bg-[#0f2933] text-gray-400 hover:text-white">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                {deleteConfirm === (s.id || s.staff_id) ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(s.id || s.staff_id)}
                      className="px-2 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold">Confirm</button>
                    <button onClick={() => setDeleteConfirm(null)}
                      className="p-1.5 rounded-lg bg-[#0f2933] text-gray-400">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(s.id || s.staff_id)}
                    className="p-2 rounded-lg bg-[#0f2933] text-gray-400 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-[#0f2933] border border-orange-500/10 rounded-xl p-4">
        <p className="text-gray-500 text-xs">
          <span className="text-orange-400 font-bold">Kitchen login URL:</span>{" "}
          <span className="font-mono">{window.location.origin}/kitchen</span>
          {" "}— Staff use their <span className="text-white">Staff ID</span> + <span className="text-white">password</span> to log in.
        </p>
      </div>
    </div>
  );
};

export default KitchenStaffManagement;
