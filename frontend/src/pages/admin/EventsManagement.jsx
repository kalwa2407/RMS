import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, Calendar, Clock, MapPin, Users, Phone, Eye, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";
import { cx, Page, PageHeader, Card, List, Button, IconButton, Segmented, StatusPill, Sheet, FormField, Input, Select, Textarea, FileInput, EmptyState, LoadingState } from "./ui";

const EVENT_CATEGORIES = ["Special Event", "Live Music", "Food Festival", "Cultural Night", "Private Dining", "Corporate Event", "Seasonal Special"];

const EventsManagement = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("events");
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const defaultForm = {
    title: "", description: "", date: "", time: "", venue: "Persian Darbar, Camp, Pune",
    image: "", category: "Special Event", status: "active", max_guests: 0, price: "",
    highlights: []
  };
  const [formData, setFormData] = useState(defaultForm);
  const [highlightInput, setHighlightInput] = useState("");

  useEffect(() => { fetchEvents(); fetchContacts(); }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await axios.get(`${API_BASE}/api/admin/events`, { headers: { Authorization: `Bearer ${token}` } });
      setEvents(res.data || []);
    } catch { toast({ title: "Error", description: "Failed to fetch events", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await axios.get(`${API_BASE}/api/admin/events/contacts`, { headers: { Authorization: `Bearer ${token}` } });
      setContacts(res.data || []);
    } catch {}
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const token = localStorage.getItem("admin_token");
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/api/admin/upload/image`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd, credentials: "omit" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.success) {
        const url = data.url.startsWith("http") ? data.url : `${API_BASE}${data.url}`;
        setFormData(f => ({ ...f, image: url }));
        toast({ title: "Uploaded!", description: "Image uploaded successfully" });
      }
    } catch { toast({ title: "Upload Failed", variant: "destructive" }); }
    finally { setUploadingImage(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");
    try {
      if (editingEvent) {
        await axios.put(`${API_BASE}/api/admin/events/${editingEvent._id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
        toast({ title: "Updated!", description: "Event updated successfully" });
      } else {
        await axios.post(`${API_BASE}/api/admin/events`, formData, { headers: { Authorization: `Bearer ${token}` } });
        toast({ title: "Created!", description: "Event created successfully" });
      }
      fetchEvents();
      resetForm();
    } catch { toast({ title: "Error", description: "Failed to save event", variant: "destructive" }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event permanently?")) return;
    const token = localStorage.getItem("admin_token");
    try {
      await axios.delete(`${API_BASE}/api/admin/events/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: "Deleted", description: "Event deleted" });
      fetchEvents();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleContactStatus = async (contactId, newStatus) => {
    const token = localStorage.getItem("admin_token");
    try {
      await axios.put(`${API_BASE}/api/admin/events/contacts/${contactId}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: "Updated!", description: `Contact marked as ${newStatus}` });
      fetchContacts();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const startEdit = (event) => {
    setEditingEvent(event);
    setFormData({ ...defaultForm, ...event });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingEvent(null);
    setShowForm(false);
    setHighlightInput("");
  };

  const addHighlight = () => {
    if (highlightInput.trim()) {
      setFormData(f => ({ ...f, highlights: [...(f.highlights || []), highlightInput.trim()] }));
      setHighlightInput("");
    }
  };

  const removeHighlight = (i) => {
    setFormData(f => ({ ...f, highlights: f.highlights.filter((_, idx) => idx !== i) }));
  };

  const pendingContacts = contacts.filter(c => c.status === "pending").length;
  const evTone = (s) => (s === "active" ? "success" : s === "draft" ? "warn" : "neutral");
  const ctTone = (s) => (s === "pending" ? "accent" : s === "confirmed" ? "success" : "neutral");

  return (
    <Page>
      <PageHeader
        title="Events"
        subtitle={<span className="pd-tabular">{events.length} events · {contacts.length} inquiries{pendingContacts > 0 ? ` (${pendingContacts} pending)` : ""}</span>}
        actions={<Button variant="primary" icon={Plus} onClick={() => { setEditingEvent(null); setFormData(defaultForm); setShowForm(true); }}>Add Event</Button>}
      />

      <Segmented
        value={activeTab}
        onChange={setActiveTab}
        options={[{ value: "events", label: "Events", icon: Calendar }, { value: "contacts", label: "Inquiries", icon: Mail, count: pendingContacts }]}
      />

      {activeTab === "events" && (
        loading ? (
          <LoadingState rows={3} label="Loading events" />
        ) : events.length === 0 ? (
          <Card><EmptyState icon={Calendar} title="No events yet" description="Add your first event to show it on the website." action={<Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>Add Event</Button>} /></Card>
        ) : (
          <List>
            {events.map(event => (
              <div key={event._id} className={cx("flex items-center gap-3 px-3 sm:px-4 py-3", event.status === "archived" && "opacity-60")}>
                {event.image ? (
                  <img src={event.image} alt={event.title} className="h-16 w-16 sm:h-[72px] sm:w-24 rounded-[10px] object-cover shrink-0 border border-[var(--a-line)]"
                    onError={e => { e.target.onerror = null; e.target.style.visibility = "hidden"; }} />
                ) : (
                  <div className="h-16 w-16 sm:h-[72px] sm:w-24 rounded-[10px] bg-[var(--a-fill)] flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-[var(--a-text-3)]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-medium text-[var(--a-text)] truncate">{event.title}</span>
                    <StatusPill tone={evTone(event.status)} dot><span className="capitalize">{event.status}</span></StatusPill>
                  </div>
                  <div className="text-[13px] text-[var(--a-text-2)] truncate">
                    {event.category || "Event"}
                    {event.date && <> · <span className="pd-tabular">{new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></>}
                    {event.time && <> · {event.time}</>}
                  </div>
                  {event.venue && (
                    <div className="text-[12px] text-[var(--a-text-3)] truncate flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{event.venue}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <IconButton icon={Edit2} label="Edit" variant="plain" className="!text-[var(--a-text-2)]" onClick={() => startEdit(event)} />
                  <IconButton icon={Trash2} label="Delete" variant="plain" className="!text-[var(--a-error)]" onClick={() => handleDelete(event._id)} />
                </div>
              </div>
            ))}
          </List>
        )
      )}

      {activeTab === "contacts" && (
        contacts.length === 0 ? (
          <Card><EmptyState icon={Mail} title="No inquiries yet" description="Event inquiries from the website appear here." /></Card>
        ) : (
          <List>
            {contacts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(c => (
              <div key={c._id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-medium text-[var(--a-text)]">{c.name}</span>
                    <StatusPill tone={ctTone(c.status)} dot><span className="capitalize">{c.status}</span></StatusPill>
                  </div>
                  <div className="text-[13px] text-[var(--a-text)]">{c.event_title}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-[13px] text-[var(--a-text-2)]">
                    <span className="flex items-center gap-1 pd-tabular"><Phone className="h-3 w-3" />{c.phone}</span>
                    {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                    {c.guests > 1 && <span className="flex items-center gap-1 pd-tabular"><Users className="h-3 w-3" />{c.guests} guests</span>}
                  </div>
                  {c.message && <div className="mt-0.5 text-[13px] italic text-[var(--a-text-3)]">“{c.message}”</div>}
                  <div className="text-[12px] text-[var(--a-text-3)] pd-tabular">{new Date(c.created_at).toLocaleString("en-IN")}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {c.status === "pending" && (
                    <>
                      <Button size="sm" variant="primary" icon={CheckCircle} onClick={() => handleContactStatus(c._id, "confirmed")}>Confirm</Button>
                      <Button size="sm" variant="tinted" icon={X} onClick={() => handleContactStatus(c._id, "closed")}>Close</Button>
                    </>
                  )}
                  <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] bg-[var(--a-fill)] text-[13px] font-medium text-[var(--a-text)] pd-press">
                    <Phone className="h-3.5 w-3.5" />Call
                  </a>
                </div>
              </div>
            ))}
          </List>
        )
      )}

      <Sheet
        open={showForm}
        onClose={resetForm}
        title={editingEvent ? "Edit event" : "New event"}
        subtitle={editingEvent ? editingEvent.title : "Shown on the website when active"}
        footer={
          <>
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button variant="primary" icon={Save} type="submit" form="event-form">{editingEvent ? "Update Event" : "Create Event"}</Button>
          </>
        }
      >
        <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Title">
              <Input required value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Eid Special Night" />
            </FormField>
            <FormField label="Category">
              <Select value={formData.category} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}>
                {EVENT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Description">
            <Textarea required rows={3} value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Date">
              <Input type="date" value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} />
            </FormField>
            <FormField label="Time">
              <Input type="text" value={formData.time} onChange={e => setFormData(f => ({ ...f, time: e.target.value }))} placeholder="e.g. 7:00 PM - 11:00 PM" />
            </FormField>
            <FormField label="Max guests" hint="0 = unlimited">
              <Input type="number" min={0} value={formData.max_guests} onChange={e => setFormData(f => ({ ...f, max_guests: parseInt(e.target.value) || 0 }))} className="pd-tabular" />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Venue">
              <Input value={formData.venue} onChange={e => setFormData(f => ({ ...f, venue: e.target.value }))} />
            </FormField>
            <FormField label="Price / entry">
              <Input value={formData.price} onChange={e => setFormData(f => ({ ...f, price: e.target.value }))} placeholder="e.g. ₹1500/person or Free Entry" />
            </FormField>
          </div>
          <FormField label="Image" hint={uploadingImage ? "Uploading…" : "Upload a photo or paste an image URL"}>
            <div className="flex items-start gap-3">
              {formData.image
                ? <img src={formData.image} alt="Preview" className="h-20 w-20 rounded-[12px] object-cover border border-[var(--a-line)] shrink-0" onError={e => { e.target.style.display = "none"; }} />
                : <div className="h-20 w-20 rounded-[12px] bg-[var(--a-fill)] shrink-0" />}
              <div className="flex-1 min-w-0 space-y-2">
                <FileInput accept="image/*" disabled={uploadingImage} onChange={e => { const f = e.target.files[0]; if (f) handleImageUpload(f); }} />
                <Input value={formData.image} onChange={e => setFormData(f => ({ ...f, image: e.target.value }))} placeholder="Or paste image URL" />
              </div>
            </div>
          </FormField>
          <FormField label="Highlights">
            <div className="flex gap-2">
              <Input value={highlightInput} onChange={e => setHighlightInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addHighlight(); } }} placeholder="e.g. Live Music, Special Menu" />
              <Button variant="tinted" onClick={addHighlight}>Add</Button>
            </div>
            {(formData.highlights || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(formData.highlights || []).map((h, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-[var(--a-fill-2)] pl-2.5 pr-1 h-7 text-[13px] text-[var(--a-text)]">
                    {h}
                    <button type="button" onClick={() => removeHighlight(i)} className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-[var(--a-fill)] cursor-pointer" aria-label={`Remove ${h}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </FormField>
          <FormField label="Status">
            <Segmented
              stretch
              value={formData.status}
              onChange={(v) => setFormData(f => ({ ...f, status: v }))}
              options={[{ value: "active", label: "Active" }, { value: "draft", label: "Draft" }, { value: "archived", label: "Archived" }]}
            />
          </FormField>
        </form>
      </Sheet>
    </Page>
  );
};

export default EventsManagement;
