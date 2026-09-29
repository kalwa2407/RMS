import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, Calendar, Clock, MapPin, Users, Phone, Eye, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";

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
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-primary" style={{ fontFamily: "Playfair Display, serif" }}>Events Management</h2>
          <p className="text-gray-400 text-sm mt-1">{events.length} events · {contacts.length} inquiries{pendingContacts > 0 ? ` (${pendingContacts} pending)` : ""}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)} className="bg-primary hover:bg-[#CA8A04] text-black px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all self-start sm:self-auto text-sm">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "+ Add Event"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[["events", "Events"], ["contacts", `Inquiries${pendingContacts > 0 ? ` (${pendingContacts})` : ""}`]].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-primary text-black" : "bg-[#1a4855] text-gray-300 hover:bg-[#2a5865]"}`}>{label}</button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-[#1a4855] border border-[#EAB308]/20 rounded-2xl p-5 mb-8 shadow-2xl">
          <h3 className="text-xl font-bold text-primary mb-4" style={{ fontFamily: "Playfair Display, serif" }}>
            {editingEvent ? "✏️ Edit Event" : "➕ Add New Event"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-primary font-semibold mb-1 text-sm">Event Title *</label>
                <input required value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Eid Special Night" className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white focus:outline-none focus:border-primary/60 text-sm" />
              </div>
              <div>
                <label className="block text-primary font-semibold mb-1 text-sm">Category</label>
                <select value={formData.category} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white focus:outline-none focus:border-primary/60 text-sm">
                  {EVENT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-primary font-semibold mb-1 text-sm">Description *</label>
              <textarea required rows={3} value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white focus:outline-none focus:border-primary/60 text-sm resize-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-primary font-semibold mb-1 text-sm">Date</label>
                <input type="date" value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white focus:outline-none focus:border-primary/60 text-sm" />
              </div>
              <div>
                <label className="block text-primary font-semibold mb-1 text-sm">Time</label>
                <input type="text" value={formData.time} onChange={e => setFormData(f => ({ ...f, time: e.target.value }))} placeholder="e.g. 7:00 PM - 11:00 PM" className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white focus:outline-none focus:border-primary/60 text-sm" />
              </div>
              <div>
                <label className="block text-primary font-semibold mb-1 text-sm">Max Guests (0 = unlimited)</label>
                <input type="number" min={0} value={formData.max_guests} onChange={e => setFormData(f => ({ ...f, max_guests: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white focus:outline-none focus:border-primary/60 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-primary font-semibold mb-1 text-sm">Venue</label>
                <input value={formData.venue} onChange={e => setFormData(f => ({ ...f, venue: e.target.value }))} className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white focus:outline-none focus:border-primary/60 text-sm" />
              </div>
              <div>
                <label className="block text-primary font-semibold mb-1 text-sm">Price / Entry</label>
                <input value={formData.price} onChange={e => setFormData(f => ({ ...f, price: e.target.value }))} placeholder="e.g. ₹1500/person or Free Entry" className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white focus:outline-none focus:border-primary/60 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-primary font-semibold mb-1 text-sm">Event Image</label>
              <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) handleImageUpload(f); }} disabled={uploadingImage} className="w-full px-3 py-2 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-black file:text-sm file:cursor-pointer" />
              {uploadingImage && <p className="text-xs text-primary mt-1">Uploading...</p>}
              <input value={formData.image} onChange={e => setFormData(f => ({ ...f, image: e.target.value }))} placeholder="Or paste image URL" className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white mt-2 focus:outline-none text-sm" />
              {formData.image && <img src={formData.image} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-[#EAB308]/20 mt-2" onError={e => { e.target.style.display = "none"; }} />}
            </div>
            <div>
              <label className="block text-primary font-semibold mb-1 text-sm">Highlights / Features</label>
              <div className="flex gap-2 mb-2">
                <input value={highlightInput} onChange={e => setHighlightInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addHighlight(); } }} placeholder="e.g. Live Music, Special Menu, Free Desserts" className="flex-1 px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white focus:outline-none focus:border-primary/60 text-sm" />
                <button type="button" onClick={addHighlight} className="bg-primary/20 border border-primary/40 text-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/30 transition-all">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.highlights || []).map((h, i) => (
                  <span key={i} className="flex items-center gap-1.5 bg-primary/15 border border-primary/30 text-primary text-xs font-bold px-3 py-1 rounded-full">
                    {h}
                    <button type="button" onClick={() => removeHighlight(i)} className="text-primary/70 hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-primary font-semibold mb-1 text-sm">Status</label>
              <select value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value }))} className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white focus:outline-none focus:border-primary/60 text-sm">
                <option value="active">Active (visible to public)</option>
                <option value="draft">Draft (hidden)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-primary hover:bg-[#CA8A04] text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                <Save className="h-4 w-4" />{editingEvent ? "Update Event" : "Create Event"}
              </button>
              <button type="button" onClick={resetForm} className="bg-[#0f2933] border border-white/10 text-gray-400 hover:text-white px-5 py-3 rounded-xl font-medium transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === "events" && (
        <>
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No events yet. Add your first event!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map(event => (
                <div key={event._id} className={`bg-[#1a4855] border rounded-2xl overflow-hidden transition-all hover:shadow-lg ${event.status === "draft" ? "border-yellow-500/30 opacity-80" : event.status === "archived" ? "border-gray-500/20 opacity-60" : "border-[#EAB308]/15 hover:border-[#EAB308]/30"}`}>
                  <div className="relative h-40">
                    {event.image ? (
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover" onError={e => { e.target.onerror = null; e.target.parentElement.style.background = "linear-gradient(135deg, #1a4855, #0f2933)"; e.target.style.display = "none"; }} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#EAB308]/20 to-[#0f2933] flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-[#EAB308]/30" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${event.status === "active" ? "bg-green-500/20 text-green-400 border border-green-500/30" : event.status === "draft" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-gray-500/20 text-gray-400 border border-gray-500/30"}`}>{event.status}</span>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className="bg-[#EAB308] text-black text-[10px] font-black px-2 py-0.5 rounded-full">{event.category || "Event"}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold text-base mb-1 truncate">{event.title}</h3>
                    <p className="text-gray-400 text-xs mb-3 line-clamp-2">{event.description}</p>
                    <div className="space-y-1 mb-3">
                      {event.date && <div className="flex items-center gap-1.5 text-xs text-gray-400"><Calendar className="w-3 h-3 text-primary" />{new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>}
                      {event.venue && <div className="flex items-center gap-1.5 text-xs text-gray-400"><MapPin className="w-3 h-3 text-primary" />{event.venue}</div>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(event)} className="flex-1 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/40 text-blue-400 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all"><Edit2 className="h-3 w-3" />Edit</button>
                      <button onClick={() => handleDelete(event._id)} className="bg-red-600/20 border border-red-500/30 hover:bg-red-600/40 text-red-400 px-3 py-2 rounded-lg flex items-center justify-center transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Contacts/Inquiries Tab */}
      {activeTab === "contacts" && (
        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No event inquiries yet.</p>
            </div>
          ) : contacts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(c => (
            <div key={c._id} className={`bg-[#1a4855] border rounded-2xl p-4 transition-all ${c.status === "pending" ? "border-yellow-500/30" : c.status === "confirmed" ? "border-green-500/30" : "border-[#EAB308]/10"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-sm">{c.name}</h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${c.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : c.status === "confirmed" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>{c.status}</span>
                  </div>
                  <p className="text-[#EAB308] text-xs font-bold mb-1">📋 {c.event_title}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-2">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
                    {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                    {c.guests > 1 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.guests} guests</span>}
                  </div>
                  {c.message && <p className="text-gray-500 text-xs italic">"{c.message}"</p>}
                  <p className="text-gray-600 text-[10px] mt-1">{new Date(c.created_at).toLocaleString("en-IN")}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {c.status === "pending" && (
                    <>
                      <button onClick={() => handleContactStatus(c._id, "confirmed")} className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 text-green-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-500/30 transition-all"><CheckCircle className="w-3 h-3" />Confirm</button>
                      <button onClick={() => handleContactStatus(c._id, "closed")} className="flex items-center gap-1 bg-gray-500/20 border border-gray-500/30 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-500/30 transition-all"><X className="w-3 h-3" />Close</button>
                    </>
                  )}
                  <a href={`tel:${c.phone}`} className="flex items-center gap-1 bg-[#EAB308]/20 border border-[#EAB308]/30 text-[#EAB308] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#EAB308]/30 transition-all"><Phone className="w-3 h-3" />Call</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsManagement;
