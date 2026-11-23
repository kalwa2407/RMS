import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Edit2, Check, X, ShieldCheck } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";
import { Page, PageHeader, Card, List, ListRow, Button, IconButton, StatusPill, Sheet, FormField, FormGroup, FormRow, Input, Switch, EmptyState, LoadingState } from "./ui";

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
    <Page>
      <PageHeader
        title="Captains"
        subtitle="Floor staff accounts"
        actions={<Button variant="primary" icon={UserPlus} onClick={() => { resetForm(); setShowForm(true); }}>Add Captain</Button>}
      />

      {loading ? (
        <LoadingState rows={3} label="Loading captains" />
      ) : captains.length === 0 ? (
        <Card>
          <EmptyState icon={ShieldCheck} title="No captains yet" description='Use "Add Captain" to create a floor staff login.' />
        </Card>
      ) : (
        <List>
          {captains.map(c => {
            const cid = c.id || c.captain_id;
            return (
              <ListRow
                key={cid}
                leading={
                  <span className="h-10 w-10 rounded-full bg-[var(--a-info-tint)] text-[var(--a-info)] font-semibold text-[15px] flex items-center justify-center">
                    {c.name?.charAt(0)?.toUpperCase() || "C"}
                  </span>
                }
                title={<span className="flex items-center gap-2">{c.name}<StatusPill tone="neutral">{c.captain_id}</StatusPill>{!c.active && <StatusPill tone="error">Inactive</StatusPill>}</span>}
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
        title={editingId ? "Edit captain" : "New captain"}
        footer={
          <>
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button variant="primary" icon={Check} type="submit" form="captain-form" disabled={saving}>{saving ? "Saving…" : (editingId ? "Update" : "Create")}</Button>
          </>
        }
      >
        <form id="captain-form" onSubmit={handleSave} className="space-y-4">
          {!editingId && (
            <FormField label="Captain ID">
              <Input type="text" value={form.captain_id} onChange={e => setForm({ ...form, captain_id: e.target.value })} placeholder="e.g. CAP001" />
            </FormField>
          )}
          <FormField label="Full name">
            <Input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Captain name" />
          </FormField>
          <FormField label="Phone">
            <Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
          </FormField>
          <FormField label="Password" hint={editingId ? "Leave blank to keep the current password" : undefined}>
            <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editingId ? "New password (optional)" : "Password"} />
          </FormField>
          {editingId && (
            <FormGroup>
              <FormRow label="Active" hint="Can log in to the captain app">
                <Switch checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
              </FormRow>
            </FormGroup>
          )}
        </form>
      </Sheet>
    </Page>
  );
};

export default CaptainsManagement;
