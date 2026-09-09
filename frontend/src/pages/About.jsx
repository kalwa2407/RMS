import React, { useEffect, useState, useRef } from "react";
import { Award, Users, Heart, Clock, Utensils, ShieldCheck, Sparkles, History, MapPin, Phone, Crown, ExternalLink } from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_URL = (process.env.REACT_APP_BACKEND_URL || "");

/* ── Scroll-reveal wrapper ─────────────────────────────────── */
const ScrollReveal = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ── Branch data ───────────────────────────────────────────── */
const BRANCHES = [
  {
    city: "BANDRA",
    gradient: "from-[#EAB308]/20 via-[#1a4855] to-[#0f2933]",
    accent: "#EAB308",
    address: "Moray Mahal, Linking Road,\nBandra West, Mumbai",
    phones: [
      "+91 98929 57741",
      "+91 77388 93395",
      "022 6694 1326",
      "022 2640 1326",
      "022 2643 1741",
    ],
    // Google Maps embed for Bandra area
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.2!2d72.8360!3d19.0550!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c95e1e0a8e1d%3A0x0!2sMoray%20Mahal%2C%20Linking%20Rd%2C%20Bandra%20West%2C%20Mumbai!5e0!3m2!1sen!2sin!4v1694000000000",
    mapLink: "https://maps.google.com/?q=Moray+Mahal+Linking+Road+Bandra+West+Mumbai",
    badge: "Flagship",
  },
  {
    city: "ANDHERI",
    gradient: "from-[#f97316]/15 via-[#1a4855] to-[#0f2933]",
    accent: "#f97316",
    address: "Times Square Building, B-3,\nAndheri-Kurla Road, Opposite\nMittal Industrial Estate, Marol, Andheri (E)",
    phones: [
      "+91 87799 19652",
      "+91 90829 94556",
      "022 4968 2090",
      "022 4968 3090",
      "022 4968 4090",
    ],
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3769.9!2d72.8796!3d19.1130!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b7e6b4af2f4b%3A0x0!2sTimes%20Square%20Building%20Andheri-Kurla%20Road%20Marol%20Andheri!5e0!3m2!1sen!2sin!4v1694000000001",
    mapLink: "https://maps.google.com/?q=Times+Square+Building+Andheri+Kurla+Road+Marol+Andheri+East+Mumbai",
    badge: "East Mumbai",
  },
  {
    city: "KURLA",
    gradient: "from-[#8b5cf6]/15 via-[#1a4855] to-[#0f2933]",
    accent: "#8b5cf6",
    address: "No.17, Kanakia Zillion,\nL.B.S Marg, CST Road Junction,\nKurla West, Mumbai",
    phones: [
      "+91 91675 10547",
      "+91 91674 97707",
      "022 2086 0844",
      "022 2086 0855",
    ],
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.8!2d72.8800!3d19.0700!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c63a37c67a47%3A0x0!2sKanakia%20Zillion%20LBS%20Marg%20Kurla%20West%20Mumbai!5e0!3m2!1sen!2sin!4v1694000000002",
    mapLink: "https://maps.google.com/?q=Kanakia+Zillion+LBS+Marg+Kurla+West+Mumbai",
    badge: "Central Hub",
  },
  {
    city: "PUNE",
    gradient: "from-[#22c55e]/15 via-[#1a4855] to-[#0f2933]",
    accent: "#22c55e",
    address: "My Office Renaissance Business Centre,\nDr Baba Saheb Ambedkar Rd, Camp,\nPune, Maharashtra 411001",
    phones: [],
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3783.5!2d73.8567!3d18.5204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c0a7a1c5e12d%3A0x0!2sRenaissance+Business+Centre+Camp+Pune!5e0!3m2!1sen!2sin!4v1694000000003",
    mapLink: "https://maps.google.com/?q=Renaissance+Business+Centre+Camp+Pune+Maharashtra",
    badge: "Pune",
  },
];

/* ── Main Component ─────────────────────────────────────────── */
const About = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadGallery(); }, []);

  const loadGallery = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/gallery`);
      const data = response.data;
      if (Array.isArray(data)) setGalleryImages(data);
      else if (data && Array.isArray(data.gallery)) setGalleryImages(data.gallery);
      else setGalleryImages([]);
    } catch (err) {
      console.error("Gallery API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: Clock,  label: "Legendary Years", value: "46+" },
    { icon: Users,  label: "Imperial Guests",  value: "10K+" },
    { icon: Award,  label: "Royal Accolades",  value: "15" },
    { icon: Heart,  label: "Secret Recipes",   value: "50+" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#184956] to-[#0f2933] pt-28 md:pt-40 pb-16 md:pb-32 relative selection:bg-primary/30 scroll-smooth">
      {/* Ambient bg */}
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#1a4855] blur-[200px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">

        {/* ── Cinematic Header ─────────────────── */}
        <header className="text-center mb-16 md:mb-32 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-3 bg-[#1a4855] border border-[#EAB308]/20 rounded-full px-6 py-2 mb-10"
          >
            <History className="text-primary w-4 h-4" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">The Chronicle Of Pune</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-9xl font-black text-white mb-6 md:mb-10 leading-tight"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            A Legacy In <br />
            <span className="text-[#EAB308]">Every Grain</span>
          </motion.h1>

          <div className="max-w-px h-24 bg-gradient-to-b from-primary to-transparent mx-auto opacity-30" />
        </header>

        {/* ── Hero image + tagline ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 mb-20 md:mb-52">
          <ScrollReveal className="lg:col-span-12 xl:col-span-7">
            <div className="relative group aspect-[4/3] md:aspect-video overflow-hidden rounded-2xl md:rounded-[4rem] bg-[#1a4855] border border-[#EAB308]/20">
              <img
                src="https://images.unsplash.com/photo-1572471553554-bc9917e51ed3"
                alt="The Imperial Kitchen"
                className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-[2000ms] scale-110 group-hover:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-6 md:p-12 flex flex-col justify-end">
                <p className="text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-2 md:mb-4">Established 1978</p>
                <h2 className="text-2xl md:text-4xl font-bold text-white max-w-lg" style={{ fontFamily: "Playfair Display, serif" }}>
                  The cornerstone of authentic imperial dining.
                </h2>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2} className="lg:col-span-12 xl:col-span-5 flex flex-col justify-center space-y-10">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center">
                <Sparkles className="text-primary" size={18} />
              </div>
              <h3 className="text-2xl md:text-4xl font-bold text-white italic" style={{ fontFamily: "Playfair Display, serif" }}>Beyond The Plate</h3>
              <p className="text-gray-400 font-light text-sm md:text-lg leading-relaxed italic">
                For nearly half a century, Persian Darbar has been more than a restaurant — it's a royal institution. From the vibrant streets of Camp, Pune, we've preserved culinary secrets that date back centuries.
              </p>
              <div className="flex items-center space-x-4 pt-4">
                <div className="h-[1px] w-12 bg-primary" />
                <span className="text-xs font-black text-primary uppercase tracking-widest">Master Chef Farhad</span>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* ── Stats ─────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-20 md:mb-52">
          {stats.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div className="bg-[#1a4855] border border-[#EAB308]/20 rounded-2xl md:rounded-xl p-6 md:p-12 text-center relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <item.icon size={80} strokeWidth={1} />
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-primary mb-2 italic">{item.value}</h3>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">{item.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            ABOUT PERSIAN DARBAR — Real Brand Story
        ══════════════════════════════════════════════ */}
        <section className="mb-24 md:mb-52 relative">
          {/* Section watermark */}
          <div className="absolute -top-16 left-0 opacity-[0.025] pointer-events-none select-none overflow-hidden w-full">
            <span className="text-[12rem] font-black uppercase text-white tracking-widest leading-none whitespace-nowrap">DARBAR</span>
          </div>

          <ScrollReveal className="text-center mb-16 md:mb-24">
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.5em] block mb-4">Our Heritage</span>
            <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-white italic" style={{ fontFamily: "Playfair Display, serif" }}>
              About <span className="text-[#EAB308]">Persian Darbar</span>
            </h2>
            <div className="w-24 h-[1px] bg-primary mx-auto mt-6 opacity-30" />
          </ScrollReveal>

          {/* Single combined story paragraph */}
          <div className="max-w-5xl mx-auto">
            <ScrollReveal>
              <div className="relative bg-gradient-to-br from-[#1a4855] to-[#0f2933] rounded-3xl p-8 md:p-14 border border-[#EAB308]/15 overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#EAB308]/5 blur-[80px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#EAB308]/5 blur-[60px] rounded-full" />
                <div className="flex items-start gap-5 relative">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center mt-1">
                    <Crown className="text-[#EAB308]" size={20} />
                  </div>
                  <div className="space-y-5">
                    <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light">
                      The name <span className="text-[#EAB308] font-semibold">Persian Darbar</span> symbolizes and sounds synonymous to the Mughal dynasty and to the legacy of Mughal cuisine, coming from Mughal period and giving a feeling of a Royal Era while you dine. The brand started its journey in the year <span className="text-[#EAB308] font-semibold">1978</span> with the founders envisioning this brand, which reflects quality and taste. The founders carried out the vision &amp; expanded its branches across Mumbai with their rich recipes, love for food, sharp business acumen &amp; strong leadership qualities — resulting in an everlasting journey for Mumbaikars to relish unique Mughlai recipes developed over <span className="text-[#EAB308] font-semibold">4 decades</span> &amp; currently expanding at pan India level. Persian Darbar stands for <span className="text-[#EAB308] font-semibold">quality, trust, consistent taste &amp; royal ambience</span> — a rare combination in the food business, with all real spices, saffron, excellent quality of mutton and chicken freshly served every day. Serving all sorts of Mughlai Cuisines like <span className="text-[#EAB308] font-semibold">"Mutton Raan Biryani"</span> and assorted kebabs famous for their exclusive taste, the word of mouth for Persian Darbar is very strong among food lovers. They also serve <span className="text-[#EAB308] font-semibold">outdoor &amp; corporate catering</span> to many eminent MNCs and brands. The chefs have been serving this brand for <span className="text-[#EAB308] font-semibold">decades</span> — they know this is the most authentic preparation and aesthetic cooking style, rare to find, focusing exclusively on quality. The founders are visionaries — very clear that come what may, they would not serve anything below their standards set from day one. Today, the <span className="text-[#EAB308] font-semibold">next generation</span>, led by young and dynamic leaders, follows the same discipline of maintaining exceptional quality — which brings them laurels all the time.
                    </p>
                    <div className="inline-flex items-center gap-3 bg-[#EAB308]/10 border border-[#EAB308]/30 rounded-full px-6 py-2.5">
                      <Crown className="text-[#EAB308]" size={16} />
                      <span className="text-[#EAB308] font-black text-sm uppercase tracking-widest">THE RAAN KING OF MUMBAI</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            THE PERSIAN MANIFESTO
        ══════════════════════════════════════════════ */}
        <section className="mb-24 md:mb-52 relative">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 opacity-[0.02] pointer-events-none select-none">
            <span className="text-[20rem] font-black uppercase text-white tracking-widest leading-none">CODE</span>
          </div>
          <div className="text-center mb-32">
            <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-white italic" style={{ fontFamily: "Playfair Display, serif" }}>
              The Persian <span className="text-[#EAB308]">Manifesto</span>
            </h2>
            <div className="w-24 h-[1px] bg-primary mx-auto mt-6 opacity-30" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-16">
            {[
              { title: "Purest Origins",    icon: MapPin,      desc: "We source our saffron from Kashmir and our spices from the spice routes across Hindustan." },
              { title: "Time Architect",    icon: Utensils,    desc: "Our Nihari is slow-cooked for 18 hours, following a blueprint from 1978." },
              { title: "Sovereign Service", icon: ShieldCheck, desc: "Every patron is treated with the dignity and grace of a royal guest." },
            ].map((val, i) => (
              <ScrollReveal key={i} delay={i * 0.2}>
                <div className="space-y-8 group">
                  <div className="w-16 h-16 rounded-3xl bg-primary/5 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all duration-700">
                    <val.icon size={24} />
                  </div>
                  <h3 className="text-xl md:text-3xl font-bold text-white italic" style={{ fontFamily: "Playfair Display, serif" }}>{val.title}</h3>
                  <p className="text-gray-500 font-light text-sm leading-relaxed tracking-wide italic">{val.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            BRANCHES — Premium Map Cards
        ══════════════════════════════════════════════ */}
        <section className="mb-24 md:mb-52">
          <ScrollReveal className="text-center mb-16 md:mb-24">
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.5em] block mb-4">Where To Find Us</span>
            <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-white italic" style={{ fontFamily: "Playfair Display, serif" }}>
              Our <span className="text-[#EAB308]">Branches</span>
            </h2>
            <div className="w-24 h-[1px] bg-primary mx-auto mt-6 opacity-30" />
            <p className="text-gray-500 text-sm mt-6 max-w-xl mx-auto">
              Four royal courts across Maharashtra — each one a gateway to authentic Mughal culinary heritage.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
            {BRANCHES.map((branch, i) => (
              <ScrollReveal key={branch.city} delay={i * 0.1}>
                <div
                  className="group relative rounded-3xl overflow-hidden border border-white/10 flex flex-col"
                  style={{ background: "linear-gradient(135deg, #0f1e28, #152535)" }}
                >
                  {/* Top accent line */}
                  <div
                    className="h-0.5 w-full shrink-0"
                    style={{ background: `linear-gradient(90deg, transparent, ${branch.accent}, transparent)` }}
                  />

                  {/* Card header */}
                  <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: `${branch.accent}20`, border: `1px solid ${branch.accent}30` }}
                      >
                        <MapPin style={{ color: branch.accent }} size={18} />
                      </div>
                      <div>
                        <p className="text-white font-black text-lg leading-none" style={{ fontFamily: "Playfair Display, serif" }}>
                          {branch.city}
                        </p>
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest mt-0.5 block"
                          style={{ color: branch.accent }}
                        >
                          {branch.badge}
                        </span>
                      </div>
                    </div>
                    {/* Open in Maps CTA */}
                    <a
                      href={branch.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 hover:scale-105"
                      style={{
                        background: `${branch.accent}15`,
                        border: `1px solid ${branch.accent}30`,
                        color: branch.accent,
                      }}
                    >
                      <ExternalLink size={12} />
                      Get Directions
                    </a>
                  </div>

                  {/* Address */}
                  <div className="px-6 pb-4 shrink-0">
                    <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                      {branch.address}
                    </p>
                  </div>

                  {/* ── Embedded Map ── */}
                  <div
                    className="relative mx-4 mb-4 rounded-2xl overflow-hidden shrink-0"
                    style={{
                      height: 220,
                      border: `1.5px solid ${branch.accent}25`,
                      boxShadow: `0 0 40px ${branch.accent}12, inset 0 0 0 1px ${branch.accent}10`,
                    }}
                  >
                    {/* Glowing corner accents */}
                    <div
                      className="absolute top-0 left-0 w-12 h-12 rounded-br-2xl pointer-events-none z-10"
                      style={{ background: `linear-gradient(135deg, ${branch.accent}25, transparent)` }}
                    />
                    <div
                      className="absolute bottom-0 right-0 w-12 h-12 rounded-tl-2xl pointer-events-none z-10"
                      style={{ background: `linear-gradient(315deg, ${branch.accent}25, transparent)` }}
                    />
                    <iframe
                      title={`Map - Persian Darbar ${branch.city}`}
                      src={branch.mapSrc}
                      width="100%"
                      height="100%"
                      style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) brightness(0.85) contrast(1.1)" }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  {/* ── Phone Numbers ── */}
                  {branch.phones.length > 0 && (
                    <div className="px-6 pb-6 shrink-0">
                      <p
                        className="text-[10px] font-black uppercase tracking-[0.3em] mb-3"
                        style={{ color: branch.accent }}
                      >
                        Contact
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {branch.phones.map((ph) => (
                          <a
                            key={ph}
                            href={`tel:${ph.replace(/\s/g, "")}`}
                            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-300 transition-all active:scale-95 hover:text-white"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            <Phone size={10} style={{ color: branch.accent }} />
                            {ph}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom glow */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
                    style={{ background: `linear-gradient(to top, ${branch.accent}06, transparent)` }}
                  />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ── Gallery Preview ───────────────────────────────── */}
        <section>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-24 gap-6 md:gap-10">
            <div className="space-y-4">
              <span className="text-primary text-[10px] font-black uppercase tracking-[0.5em]">Glimpses From The Court</span>
              <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-white italic leading-tight" style={{ fontFamily: "Playfair Display, serif" }}>
                Moments Of <br /> Preservation
              </h2>
            </div>
            <p className="text-gray-600 max-w-sm font-light text-sm italic leading-relaxed">
              Capture the soul of our ambiance — where every shadow and highlight tells a story of elegance.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-32">
              <div className="w-12 h-12 border border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10">
              <AnimatePresence>
                {galleryImages.slice(0, 6).map((img, i) => (
                  <motion.div
                    key={img._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="aspect-square group relative rounded-2xl md:rounded-xl overflow-hidden bg-[#1a4855] border border-[#EAB308]/20"
                  >
                    <img
                      src={img.image_url}
                      alt={img.caption}
                      className="w-full h-full object-cover grayscale-[0.6] group-hover:grayscale-0 transition-all duration-1000 scale-110 group-hover:scale-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-10 flex items-end">
                      <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">{img.caption || "A Court Silhouette"}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default About;
