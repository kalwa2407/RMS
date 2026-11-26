import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Edit2, Check, X, ChefHat } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";
import { Page, PageHeader, Card, List, ListRow, Button, IconButton, StatusPill, Sheet, FormField, FormGroup, FormRow, Input, Switch, EmptyState, LoadingState } from "./ui";

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
    <Page>
      <PageHeader
        title="Kitchen Staff"
        subtitle="Kitchen staff accounts"
        actions={<Button variant="primary" icon={UserPlus} onClick={() => { resetForm(); setShowForm(true); }}>Add Staff</Button>}
      />

      {loading ? (
        <LoadingState rows={3} label="Loading kitchen staff" />
      ) : staff.length === 0 ? (
        <Card>
          <EmptyState icon={ChefHat} title="No kitchen staff yet" description='Use "Add Staff" to create a kitchen login.' />
        </Card>
      ) : (
        <List>
          {staff.map(c => {
            const cid = c.id || c.staff_id;
            return (
              <ListRow
                key={cid}
                leading={
                  <span className="h-10 w-10 rounded-full bg-[var(--a-info-tint)] text-[var(--a-info)] font-semibold text-[15px] flex items-center justify-center">
                    {c.name?.charAt(0)?.toUpperCase() || "C"}
                  </span>
                }
                title={<span className="flex items-center gap-2">{c.name}<StatusPill tone="neutral">{c.staff_id}</StatusPill>{!c.active && <StatusPill tone="error">Inactive</StatusPill>}</span>}
                subtitle={<span className="pd-tabular">{c.phone || "No phone"}</span>}
                trailing={
                  deleteConfirm === cid ? (
                    <>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(cid)}>Confirm</Button>
                      <IconButton icon={X} label="Keep" className="h-8 w-8" onClick={() => setDeleteConfirm(null)} />
                    </>
                  ) : (
                    <>
                      <IconButton icon={Edit2} label="Edit" variant="plain" className="!text-[var(--a-text-2)]" onClick={() => handleEdit(c)} />
                      <IconButton icon={Trash2} label="Delete" variant="plain" className="!text-[var(--a-error)]" onClick={() => setDeleteConfirm(cid)} />
                    </>
                  )
                }
              />
            );
          })}
        </List>
      )}

      <Sheet
        open={showForm}
        onClose={resetForm}
        size="sm"
        title={editingId ? "Edit kitchen staff" : "New kitchen staff"}
        footer={
          <>
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button variant="primary" icon={Check} type="submit" form="kitchen-staff-form" disabled={saving}>{saving ? "Saving…" : (editingId ? "Update" : "Create")}</Button>
          </>
        }
      >
        <form id="kitchen-staff-form" onSubmit={handleSave} className="space-y-4">
          {!editingId && (
            <FormField label="Staff ID">
              <Input type="text" value={form.staff_id} onChange={e => setForm({ ...form, staff_id: e.target.value })} placeholder="e.g. KIT001" />
            </FormField>
          )}
          <FormField label="Full name">
            <Input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Staff name" />
          </FormField>
          <FormField label="Phone">
            <Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
          </FormField>
          <FormField label="Password" hint={editingId ? "Leave blank to keep the current password" : undefined}>
            <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editingId ? "New password (optional)" : "Password"} />
          </FormField>
          {editingId && (
            <FormGroup>
              <FormRow label="Active" hint="Can log in to the kitchen app">
                <Switch checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
              </FormRow>
            </FormGroup>
          )}
        </form>
      </Sheet>
    </Page>
  );
};

export default KitchenStaffManagement;
