import React, { useEffect, useState, useRef } from "react";
import { Award, Users, Heart, Clock, Utensils, ShieldCheck, Sparkles, History, MapPin } from "lucide-react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_URL = (process.env.REACT_APP_BACKEND_URL || "");

const About = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGallery();
  }, []);

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
    { icon: Clock, label: "Legendary Years", value: "46" },
    { icon: Users, label: "Imperial Guests", value: "10K+" },
    { icon: Award, label: "Royal Accolades", value: "15" },
    { icon: Heart, label: "Secret Recipes", value: "50" },
  ];

  return (
    <div className="min-h-screen bg-[#050b10] pt-40 pb-32 relative selection:bg-primary/30 scroll-smooth">
      {/* Dynamic Ambient Background */}
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-white/[0.01] blur-[200px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Cinematic Header */}
        <header className="text-center mb-32 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-3 glass-premium rounded-full px-6 py-2 mb-10 border-white/5"
          >
            <History className="text-primary w-4 h-4" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">The Chronicle Of Pune</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl md:text-9xl font-display font-black text-white mb-10 leading-tight"
          >
            A Legacy In <br />
            <span className="golden-text">Every Grain</span>
          </motion.h1>
          
          <div className="max-w-px h-24 bg-gradient-to-b from-primary to-transparent mx-auto opacity-30" />
        </header>

        {/* Narrative Bento Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-52">
           <ScrollReveal className="lg:col-span-12 xl:col-span-7">
              <div className="relative group aspect-video overflow-hidden rounded-[4rem] brutal-card">
                 <img
                   src="https://images.unsplash.com/photo-1572471553554-bc9917e51ed3"
                   alt="The Imperial Kitchen"
                   className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-2000 scale-110 group-hover:scale-100"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-12 flex flex-col justify-end">
                    <p className="text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-4">Established 1978</p>
                    <h2 className="text-4xl font-display font-bold text-white max-w-lg">The cornerstone of authentic imperial dining.</h2>
                 </div>
              </div>
           </ScrollReveal>

           <ScrollReveal delay={0.2} className="lg:col-span-12 xl:col-span-5 flex flex-col justify-center space-y-10">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center">
                   <Sparkles className="text-primary" size={18} />
                </div>
                <h3 className="text-4xl font-display font-bold text-white italic">Beyond The Plate</h3>
                <p className="text-gray-400 font-light text-lg leading-relaxed italic">
                  For nearly half a century, Taste of Hindustan has been more than a restaurant—it's a royal institution. From the vibrant streets of Camp, Pune, we've preserved culinary secrets that date back centuries.
                </p>
                <div className="flex items-center space-x-4 pt-4">
                   <div className="h-[1px] w-12 bg-primary" />
                   <span className="text-xs font-black text-primary uppercase tracking-widest">Master Chef Farhad</span>
                </div>
              </div>
           </ScrollReveal>
        </div>

        {/* Imperial Stats Container */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-52">
          {stats.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div className="glass-premium rounded-[3rem] p-12 text-center border-white/5 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                   <item.icon size={80} strokeWidth={1} />
                </div>
                <h3 className="text-5xl font-display font-black text-primary mb-2 italic">{item.value}</h3>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">{item.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* The Hindustan Code - Luxury Manifesto */}
        <section className="mb-52 relative">
           <div className="absolute -top-32 left-1/2 -translate-x-1/2 opacity-[0.02] pointer-events-none select-none">
              <span className="text-[20rem] font-display font-black uppercase text-white tracking-widest leading-none">CODE</span>
           </div>
           
           <div className="text-center mb-32">
              <h2 className="text-5xl md:text-7xl font-display font-black text-white italic">The Hindustani <span className="golden-text">Manifesto</span></h2>
              <div className="w-24 h-[1px] bg-primary mx-auto mt-6 opacity-30" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {[
                { title: "Purest Origins", icon: MapPin, desc: "We source our saffron from Kashmir and our spices from the spice routes across Hindustan." },
                { title: "Time Architect", icon: Utensils, desc: "Our Nihari is slow-cooked for 18 hours, following a blueprint from 1978." },
                { title: "Sovereign Service", icon: ShieldCheck, desc: "Every patron is treated with the dignity and grace of a royal guest." }
              ].map((val, i) => (
                <ScrollReveal key={i} delay={i * 0.2}>
                  <div className="space-y-8 group">
                    <div className="w-16 h-16 rounded-3xl bg-primary/5 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all duration-700">
                       <val.icon size={24} />
                    </div>
                    <h3 className="text-3xl font-display font-bold text-white italic">{val.title}</h3>
                    <p className="text-gray-500 font-light text-sm leading-relaxed tracking-wide italic">{val.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
           </div>
        </section>

        {/* Cinematic Gallery Preview */}
        <section>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-10">
            <div className="space-y-4">
               <span className="text-primary text-[10px] font-black uppercase tracking-[0.5em]">Glimpses From The Court</span>
               <h2 className="text-5xl md:text-7xl font-display font-black text-white italic leading-tight">Moments Of <br /> Preservation</h2>
            </div>
            <p className="text-gray-600 max-w-sm font-light text-sm italic leading-relaxed">
               Capture the soul of our ambiance—where every shadow and highlight tells a story of elegance.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-32">
               <div className="w-12 h-12 border border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <AnimatePresence>
                {galleryImages.slice(0, 6).map((img, i) => (
                  <motion.div
                    key={img._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="aspect-square group relative rounded-[3rem] overflow-hidden brutal-card"
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

const ScrollReveal = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
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

export default About;
