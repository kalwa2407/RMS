import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Edit2, Check, X, Bike } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";
import { Page, PageHeader, Card, List, ListRow, Button, IconButton, StatusPill, Sheet, FormField, FormGroup, FormRow, Input, Select, Switch, EmptyState, LoadingState } from "./ui";

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
    <Page>
      <PageHeader
        title="Delivery Partners"
        subtitle="In-house rider accounts"
        actions={<Button variant="primary" icon={UserPlus} onClick={() => { resetForm(); setShowForm(true); }}>Add Partner</Button>}
      />

      {loading ? (
        <LoadingState rows={3} label="Loading delivery partners" />
      ) : partners.length === 0 ? (
        <Card>
          <EmptyState icon={Bike} title="No delivery partners yet" description='Use "Add Partner" to create a rider login.' />
        </Card>
      ) : (
        <List>
          {partners.map(p => (
            <ListRow
              key={p.id}
              leading={
                <span className="h-10 w-10 rounded-full bg-[var(--a-fill)] flex items-center justify-center">
                  <Bike className="h-5 w-5 text-[var(--a-text-2)]" />
                </span>
              }
              title={<span className="flex items-center gap-2">{p.name}{p.active === false && <StatusPill tone="error">Inactive</StatusPill>}</span>}
              subtitle={<span className="pd-tabular">{p.phone} · {p.vehicle_type}{p.vehicle_number ? ` · ${p.vehicle_number}` : ""}</span>}
              trailing={
                deleteConfirm === p.id ? (
                  <>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>Confirm</Button>
                    <IconButton icon={X} label="Keep" className="h-8 w-8" onClick={() => setDeleteConfirm(null)} />
                  </>
                ) : (
                  <>
                    <IconButton icon={Edit2} label="Edit" variant="plain" className="!text-[var(--a-text-2)]" onClick={() => handleEdit(p)} />
                    <IconButton icon={Trash2} label="Delete" variant="plain" className="!text-[var(--a-error)]" onClick={() => setDeleteConfirm(p.id)} />
                  </>
                )
              }
            />
          ))}
        </List>
      )}

      <Sheet
        open={showForm}
        onClose={resetForm}
        size="sm"
        title={editingId ? "Edit delivery partner" : "New delivery partner"}
        footer={
          <>
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button variant="primary" icon={Check} type="submit" form="partner-form" disabled={saving}>{saving ? "Saving…" : (editingId ? "Update" : "Create")}</Button>
          </>
        }
      >
        <form id="partner-form" onSubmit={handleSave} className="space-y-4">
          <FormField label="Full name">
            <Input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Rider name" />
          </FormField>
          <FormField label="Phone number">
            <Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Login phone number" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Vehicle type">
              <Select value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value })}>
                <option value="Bike">Bike</option>
                <option value="Scooter">Scooter</option>
                <option value="Cycle">Cycle</option>
              </Select>
            </FormField>
            <FormField label="Vehicle number">
              <Input type="text" value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} placeholder="e.g. MH12 AB 1234" />
            </FormField>
          </div>
          <FormField label="Password" hint={editingId ? "Leave blank to keep the current password" : undefined}>
            <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editingId ? "New password (optional)" : "Login password"} />
          </FormField>
          {editingId && (
            <FormGroup>
              <FormRow label="Active" hint="Can receive orders">
                <Switch checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
              </FormRow>
            </FormGroup>
          )}
        </form>
      </Sheet>
    </Page>
  );
};

export default DeliveryPartnersManagement;
