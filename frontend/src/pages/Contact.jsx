import React, { useState, useRef } from 'react';
import { MapPin, Phone, Mail, Clock, Send, ChevronRight, MessageSquare, Sparkles, Navigation, Globe, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useToast } from '../hooks/use-toast';

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "Royal Dispatch Sent",
      description: "Our concierge will review your inquiry within the hour."
    });
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-[#050b10] pt-44 pb-32 relative selection:bg-primary/30 scroll-smooth">
      {/* Dynamic Ambient Background */}
      <div className="absolute top-0 left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-stretch">
          
          {/* LEFT: Branding & Info */}
          <div className="lg:col-span-12 xl:col-span-5 flex flex-col justify-center space-y-16">
            <header className="space-y-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center space-x-3 glass-premium rounded-full px-6 py-2 border-white/5"
              >
                <Globe className="text-primary w-4 h-4" />
                <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">Global Presence, Local Heart</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-7xl md:text-8xl font-display font-black text-white leading-tight"
              >
                Let's <br /> <span className="golden-text italic">Connect</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-400 font-light text-xl max-w-lg leading-relaxed italic"
              >
                "Every great feast begins with a dialogue. Reach out to coordinate your royal arrangements."
              </motion.p>
            </header>

            <div className="space-y-10 group">
               {[
                 { icon: PhoneCall, channel: "concierge", val: "+91 91756 23047", desc: "For Reservations & Inquiries" },
                 { icon: Mail, channel: "correspondence", val: "info@persiandarbar.com", desc: "For Corporate & Event Bookings" },
                 { icon: Navigation, channel: "imperial address", val: "Camp Area, Pune, India", desc: "Renaissance Business Wellesley Road" }
               ].map((item, i) => (
                 <ScrollReveal key={i} delay={i * 0.1}>
                    <div className="flex items-center space-x-8 group">
                       <div className="w-16 h-16 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center text-primary transition-all duration-700 group-hover:bg-primary group-hover:text-black group-hover:rotate-[360deg] group-hover:rounded-2xl">
                          <item.icon size={20} />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em]">{item.channel}</p>
                          <h3 className="text-xl font-display font-bold text-white group-hover:text-primary transition-colors">{item.val}</h3>
                          <p className="text-gray-500 text-xs italic font-light">{item.desc}</p>
                       </div>
                    </div>
                 </ScrollReveal>
               ))}
            </div>

            <div className="pt-10 flex items-center space-x-6">
               <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
               <Sparkles className="text-primary/20" size={24} />
            </div>
          </div>

          {/* RIGHT: Concierge Form */}
          <div className="lg:col-span-12 xl:col-span-7">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="glass-premium rounded-[4rem] p-12 md:p-20 border border-white/5 relative overflow-hidden backdrop-blur-3xl shadow-2xl h-full"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              
              <div className="mb-16">
                 <h2 className="text-4xl font-display font-bold text-white mb-4">Direct Message</h2>
                 <p className="text-gray-500 font-light">Complete the seal below to initiate contact.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center space-x-3">
                       <MessageSquare size={12} />
                       <span>Your Name</span>
                    </label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="HOW MAY WE ADDRESS YOU?"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-3xl px-8 py-5 text-[10px] font-black tracking-widest text-white outline-none focus:border-primary/50 transition-all uppercase"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center space-x-3">
                       <Mail size={12} />
                       <span>Email Address</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="GUEST@EXAMPLE.COM"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-3xl px-8 py-5 text-[10px] font-black tracking-widest text-white outline-none focus:border-primary/50 transition-all uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center space-x-3">
                       <Phone size={12} />
                       <span>Subject / Area of Interest</span>
                    </label>
                   <select className="w-full bg-white/[0.02] border border-white/10 rounded-3xl px-8 py-5 text-[10px] font-black tracking-widest text-white outline-none focus:border-primary/50 transition-all appearance-none">
                      <option className="bg-[#050b10]">RESERVATION INQUIRY</option>
                      <option className="bg-[#050b10]">CATERING & GRAND EVENTS</option>
                      <option className="bg-[#050b10]">FRANCHISE OPPORTUNITY</option>
                      <option className="bg-[#050b10]">GENERAL COMPLIMENTS</option>
                   </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center space-x-3">
                       <MessageSquare size={12} />
                       <span>Your Message</span>
                    </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder="DESCRIBE YOUR REQUEST IN DETAIL..."
                    rows={5}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-[3rem] px-10 py-8 text-[10px] font-black tracking-[0.2em] text-white outline-none focus:border-primary/50 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full magnetic-button bg-primary text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[12px] flex items-center justify-center space-x-4 shadow-2xl shadow-primary/20 active:scale-95 transition-all"
                >
                  <Send size={18} />
                  <span>Dispatch To Concierge</span>
                </button>
              </form>

              <div className="mt-16 text-center space-y-4">
                 <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.4em] italic leading-relaxed">
                    By submitting, you agree to being contacted by our imperial assistants regarding your inquiry.
                 </p>
                 <div className="flex justify-center space-x-4 opacity-10">
                    <Sparkles size={16} /> <Sparkles size={16} /> <Sparkles size={16} />
                 </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Cinematic Map / Footer Area */}
        <section className="mt-52">
           <div className="glass-premium rounded-[4rem] border border-white/5 overflow-hidden aspect-[21/9] relative group">
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-700 z-10" />
              <img 
                 src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200"
                 alt="Pune Map Location"
                 className="w-full h-full object-cover grayscale-[0.8] scale-110 group-hover:scale-100 transition-all duration-[3s]"
              />
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-10">
                 <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 animate-pulse">
                    <MapPin size={32} />
                 </div>
                 <h3 className="text-4xl font-display font-bold text-white mb-4 italic">Locate The Grandeur</h3>
                 <p className="text-gray-400 font-light text-sm max-w-md mx-auto italic">Upper Ground Floor, Renaissance Business Wellesley Road, Camp, Pune, Maharashtra 411001</p>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

const ScrollReveal = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
      transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

export default Contact;
