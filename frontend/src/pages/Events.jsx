import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, Users, Phone, Mail, Send, Sparkles, ChevronRight, Star, X, CheckCircle2, Loader2, Camera, ZoomIn } from "lucide-react";
import API_BASE from "../lib/config";

const EventContactForm = ({ event, onClose }) => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", guests: 1, message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Please enter your name.");
    if (!form.phone.trim() || form.phone.length < 10) return setError("Please enter a valid phone number.");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/events/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: event?._id || "general", event_title: event?.title || "General Inquiry", ...form })
      });
      if (!res.ok) throw new Error("Submission failed");
      setDone(true);
    } catch {
      setError("Something went wrong. Please call us at 9594287868.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-gradient-to-br from-[#1a4855] to-[#0f2933] border border-[#EAB308]/30 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">{event ? `Book for: ${event.title}` : "Event Inquiry"}</h3>
            <p className="text-gray-400 text-xs mt-1">We will contact you within 24 hours</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        {done ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-green-400" /></div>
            <h4 className="text-white font-bold text-lg mb-2">Request Sent!</h4>
            <p className="text-gray-400 text-sm">Our team will reach out to you shortly.</p>
            <p className="text-[#EAB308] text-sm mt-2 font-bold">📞 9594287868</p>
            <button onClick={onClose} className="mt-6 bg-[#EAB308] text-black px-6 py-2.5 rounded-xl font-bold hover:bg-amber-500 transition-all">Close</button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 block">Your Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className="w-full bg-[#0f2933] text-white px-3 py-2.5 rounded-xl border border-[#EAB308]/20 focus:border-[#EAB308]/60 outline-none text-sm placeholder-gray-600" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 block">Guests</label>
                <input type="number" min={1} max={500} value={form.guests} onChange={e => setForm(f => ({ ...f, guests: parseInt(e.target.value) || 1 }))} className="w-full bg-[#0f2933] text-white px-3 py-2.5 rounded-xl border border-[#EAB308]/20 focus:border-[#EAB308]/60 outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 block">Phone Number *</label>
              <input required value={form.phone} type="tel" onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" className="w-full bg-[#0f2933] text-white px-3 py-2.5 rounded-xl border border-[#EAB308]/20 focus:border-[#EAB308]/60 outline-none text-sm placeholder-gray-600" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 block">Email (Optional)</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" className="w-full bg-[#0f2933] text-white px-3 py-2.5 rounded-xl border border-[#EAB308]/20 focus:border-[#EAB308]/60 outline-none text-sm placeholder-gray-600" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 block">Message</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Any special requirements..." rows={3} className="w-full bg-[#0f2933] text-white px-3 py-2.5 rounded-xl border border-[#EAB308]/20 focus:border-[#EAB308]/60 outline-none text-sm placeholder-gray-600 resize-none" />
            </div>
            {error && <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}
            <button type="submit" disabled={submitting} className="w-full bg-[#EAB308] hover:bg-amber-500 disabled:opacity-60 text-black font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "Sending..." : "Send Inquiry"}
            </button>
            <p className="text-center text-gray-600 text-xs">Or call us: <span className="text-[#EAB308] font-bold">📞 9594287868</span></p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

const EventCard = ({ event, onContact, index }) => {
  const eventDate = event.date ? new Date(event.date) : null;
  const isPast = eventDate && eventDate < new Date();
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`group relative bg-gradient-to-br from-[#1a4855] to-[#0f2f3d] border rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-[#EAB308]/10 hover:-translate-y-1 ${isPast ? "border-white/10 opacity-75" : "border-[#EAB308]/20 hover:border-[#EAB308]/50"}`}
    >
      <div className="relative h-52 overflow-hidden">
        {event.image ? (
          <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={e => { e.target.style.display = "none"; }} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#EAB308]/20 to-[#184956] flex items-center justify-center"><Sparkles className="w-16 h-16 text-[#EAB308]/30" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f2933]/80 to-transparent" />
        <div className="absolute top-3 left-3"><span className="bg-[#EAB308] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">{event.category || "Special Event"}</span></div>
        {isPast && <div className="absolute top-3 right-3"><span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full">Past Event</span></div>}
      </div>
      <div className="p-5">
        <h3 className="text-white font-black text-lg mb-2 group-hover:text-[#EAB308] transition-colors leading-tight">{event.title}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">{event.description}</p>
        <div className="space-y-2 mb-4">
          {event.date && <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-[#EAB308] shrink-0" /><span className="text-gray-300">{new Date(event.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span></div>}
          {event.time && <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-[#EAB308] shrink-0" /><span className="text-gray-300">{event.time}</span></div>}
          {event.venue && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-[#EAB308] shrink-0" /><span className="text-gray-300">{event.venue}</span></div>}
          {event.max_guests > 0 && <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-[#EAB308] shrink-0" /><span className="text-gray-300">Up to {event.max_guests} guests</span></div>}
        </div>
        {event.highlights && event.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {event.highlights.map((h, i) => <span key={i} className="bg-[#EAB308]/10 border border-[#EAB308]/20 text-[#EAB308] text-[10px] font-bold px-2 py-0.5 rounded-full">{h}</span>)}
          </div>
        )}
        {event.price && <p className="text-[#EAB308] font-black text-lg mb-4">{event.price}</p>}
        {!isPast && (
          <button onClick={() => onContact(event)} className="w-full bg-gradient-to-r from-[#EAB308] to-amber-500 hover:from-amber-500 hover:to-[#EAB308] text-black font-black py-3 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
            <Phone className="w-4 h-4" />Contact for This Event<ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

const DEFAULT_EVENTS = [
  {
    _id: "def-1",
    title: "Royal Sufi & Ghazal Night",
    category: "Music & Dining",
    description: "Immerse yourself in soul-stirring live Sufi melodies accompanied by a royal Dastarkhwan feast. Authentic kebabs, slow-cooked gravies, and saffron biryanis under ambient candlelit elegance.",
    date: "2026-10-10",
    time: "08:00 PM onwards",
    venue: "Persian Darbar, Royal Banquet Hall, Pune",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
    max_guests: 120,
    price: "Reserve Table / Set Menu",
    highlights: ["Live Sufi Troupe", "Royal Welcome Drink", "Chef's Special Raan Biryani", "Shahi Tukda Finale"]
  },
  {
    _id: "def-2",
    title: "Grand Persian Dastarkhwan Festival",
    category: "Culinary Festival",
    description: "A royal sharing feast featuring our heritage Mutton Raan, Jujeh Kebabs, Irani Koobideh, and aromatic saffron rice crafted following century-old Persian recipes.",
    date: "2026-10-17",
    time: "07:30 PM to 11:30 PM",
    venue: "Main Dining Hall, Persian Darbar Pune",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
    max_guests: 200,
    price: "A La Carte & Royal Sharing Trays",
    highlights: ["Mutton Raan Dum Pukht", "Persian Saffron Rice", "Live Tandoor Skewers", "Fresh Bakery Desserts"]
  },
  {
    _id: "def-3",
    title: "Corporate & Private Banquet Showcase",
    category: "Private Gatherings",
    description: "Planning a corporate milestone, royal wedding reception, or family celebration? Experience our bespoke catering, luxurious table setups, and dedicated banquet hospitality.",
    date: "2026-10-24",
    time: "Flexible Timings",
    venue: "Banquet Hall, Persian Darbar Pune",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
    max_guests: 250,
    price: "Custom Banquet Packages",
    highlights: ["Dedicated Service Staff", "Customized Multi-Course Menu", "Sound & Audio Setup", "Valet Parking"]
  }
];

const EventGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const CACHE_KEY = "pd_event_gallery_v1";
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  useEffect(() => {
    const cached = (() => {
      try {
        const c = localStorage.getItem(CACHE_KEY);
        if (!c) return null;
        const { data, ts } = JSON.parse(c);
        if (Date.now() - ts < CACHE_TTL) return data;
        return null;
      } catch { return null; }
    })();

    if (cached) { setPhotos(cached); return; }

    fetch(`${API_BASE}/api/events`)
      .then(r => r.json())
      .then(events => {
        const imgs = (Array.isArray(events) ? events : [])
          .filter(e => e.image)
          .map(e => ({ url: e.image, caption: e.title, date: e.date }));
        setPhotos(imgs);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data: imgs, ts: Date.now() })); } catch {}
      })
      .catch(() => {});
  }, []);

  if (photos.length === 0) return (
    <div className="text-center py-10 text-gray-600">
      <Camera className="w-12 h-12 mx-auto mb-3 opacity-20"/>
      <p className="text-sm">Event photos will appear here</p>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className="relative rounded-2xl overflow-hidden cursor-pointer group aspect-square"
            style={{ border: "1px solid rgba(234,179,8,0.15)" }}
            onClick={() => setLightbox(photo)}>
            <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={e => { e.target.parentElement.style.display = "none"; }}/>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-300"/>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
              <p className="text-white text-xs font-bold truncate">{photo.caption}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}>
            <button className="absolute top-4 right-4 text-white p-2 rounded-xl bg-white/10 hover:bg-white/20">
              <X className="w-6 h-6"/>
            </button>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
              <img src={lightbox.url} alt={lightbox.caption} className="w-full rounded-2xl object-contain max-h-[80vh]"/>
              <p className="text-white text-center mt-3 font-bold text-sm">{lightbox.caption}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
const Events = () => {
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState(null);
  const [generalContact, setGeneralContact] = useState(false);
  const [filterCat, setFilterCat] = useState("All");

  useEffect(() => {
    fetch(`${API_BASE}/api/events`)
      .then(r => {
        if (!r.ok) throw new Error("Status " + r.status);
        return r.json();
      })
      .then(d => {
        if (Array.isArray(d) && d.length > 0) {
          setEvents(d);
        } else {
          setEvents(DEFAULT_EVENTS);
        }
      })
      .catch(() => {
        setEvents(DEFAULT_EVENTS);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...new Set(events.map(e => e.category || "Special Event"))];
  const filtered = filterCat === "All" ? events : events.filter(e => (e.category || "Special Event") === filterCat);
  const now = new Date();
  const upcoming = filtered.filter(e => !e.date || new Date(e.date) >= now);
  const past = filtered.filter(e => e.date && new Date(e.date) < now);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#184956] to-[#0f2933] pt-28 pb-16 relative overflow-hidden">
      <div className="absolute top-0 right-[-10%] w-[50%] h-[50%] bg-[#EAB308]/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1a4855] blur-[150px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <header className="text-center mb-12">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center space-x-3 bg-[#1a4855] border border-[#EAB308]/20 rounded-full px-6 py-2 mb-6">
            <Sparkles className="text-[#EAB308] w-4 h-4" /><span className="text-[#EAB308] text-[10px] font-black uppercase tracking-[0.4em]">Royal Celebrations</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-4 leading-tight" style={{ fontFamily: "Playfair Display, serif" }}>
            Persian Darbar <span className="text-[#EAB308] italic">Events</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Experience the grandeur of Persian hospitality. Contact us to reserve your place at our exclusive events.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button onClick={() => setGeneralContact(true)} className="flex items-center gap-2 bg-[#EAB308] hover:bg-amber-500 text-black font-black px-7 py-3.5 rounded-full transition-all duration-300 text-sm uppercase tracking-wider shadow-lg hover:scale-105">
              <Mail className="w-4 h-4" />Inquire About Events
            </button>
            <a href="tel:9594287868" className="flex items-center gap-2 border-2 border-[#EAB308]/40 text-[#EAB308] hover:bg-[#EAB308]/10 font-bold px-7 py-3.5 rounded-full transition-all text-sm">
              <Phone className="w-4 h-4" />📞 9594287868
            </a>
          </motion.div>
        </header>

        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 justify-center flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)} className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filterCat === cat ? "bg-[#EAB308] text-black shadow-lg" : "bg-[#1a4855] text-gray-300 border border-[#EAB308]/20 hover:border-[#EAB308]/50"}`}>{cat}</button>
            ))}
          </div>
        )}

        {loading && <div className="flex justify-center py-20"><div className="w-12 h-12 border border-[#EAB308]/20 border-t-[#EAB308] rounded-full animate-spin" /></div>}

        {!loading && upcoming.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6"><div className="h-px flex-1 bg-[#EAB308]/20" /><h2 className="text-[#EAB308] font-black uppercase tracking-widest text-sm flex items-center gap-2"><Star className="w-4 h-4 fill-[#EAB308]" />Upcoming Events</h2><div className="h-px flex-1 bg-[#EAB308]/20" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{upcoming.map((ev, i) => <EventCard key={ev._id} event={ev} onContact={setContactModal} index={i} />)}</div>
          </section>
        )}

        {!loading && past.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6"><div className="h-px flex-1 bg-white/10" /><h2 className="text-gray-500 font-black uppercase tracking-widest text-sm">Past Events</h2><div className="h-px flex-1 bg-white/10" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{past.map((ev, i) => <EventCard key={ev._id} event={ev} onContact={setContactModal} index={i} />)}</div>
          </section>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-24">
            <Sparkles className="w-16 h-16 text-[#EAB308]/30 mx-auto mb-6" />
            <h3 className="text-white text-2xl font-bold mb-3">Exciting Events Coming Soon!</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">We are planning something extraordinary. Be the first to know by contacting us.</p>
            <button onClick={() => setGeneralContact(true)} className="bg-[#EAB308] hover:bg-amber-500 text-black font-black px-8 py-3.5 rounded-full transition-all">Contact Us for Events</button>
          </div>
        )}


        {/* ── EVENTS GALLERY ── */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-[#EAB308]/20"/>
            <h2 className="text-[#EAB308] font-black uppercase tracking-widest text-sm flex items-center gap-2">
              <Camera className="w-4 h-4"/> Event Highlights
            </h2>
            <div className="h-px flex-1 bg-[#EAB308]/20"/>
          </div>
          <EventGallery />
        </section>
        <div className="mt-12 bg-gradient-to-r from-[#1a4855] to-[#0f2f3d] border border-[#EAB308]/20 rounded-3xl p-6 md:p-8 text-center">
          <h3 className="text-white font-bold text-xl mb-2">Host Your Event at Persian Darbar</h3>
          <p className="text-gray-400 text-sm mb-4 max-w-xl mx-auto">Corporate events, birthdays, anniversaries, private dining — we create unforgettable experiences.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="tel:9594287868" className="flex items-center gap-2 text-[#EAB308] font-bold text-lg hover:underline"><Phone className="w-5 h-5" />9594287868</a>
            <span className="text-gray-600 hidden sm:block">|</span>
            <a href="https://www.persiandarbar.in" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#EAB308] transition-colors text-sm">persiandarbar.in</a>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {(contactModal || generalContact) && <EventContactForm event={contactModal} onClose={() => { setContactModal(null); setGeneralContact(false); }} />}
      </AnimatePresence>
    </div>
  );
};

export default Events;
