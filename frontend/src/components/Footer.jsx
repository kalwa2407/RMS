import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter, ShieldCheck, Sparkles, Navigation, Globe, Send, History } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const Footer = () => {
  const [contactInfo, setContactInfo] = useState({
    address: "Upper Ground Floor, Renaissance Business Wellesley Road, Camp, Pune",
    phone: "+91 91756 23047",
    email: "info@tasteofhindustan.com"
  });

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/settings/public`);
      if (response.data) {
        setContactInfo({
          address: response.data.contact_address || contactInfo.address,
          phone: response.data.contact_phone || contactInfo.phone,
          email: response.data.contact_email || contactInfo.email
        });
      }
    } catch (error) {}
  };

  return (
    <footer className="bg-[#050b10] pt-40 pb-20 relative overflow-hidden border-t border-white/5">
      {/* Dynamic Ambient Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20">
          
          {/* Imperial Identity Bento */}
          <div className="lg:col-span-12 xl:col-span-5 flex flex-col justify-between space-y-12">
             <div className="space-y-10">
                <Link to="/" className="inline-flex items-center space-x-6 group">
                   <div className="w-16 h-16 rounded-[2rem] overflow-hidden border border-white/10 group-hover:border-primary/50 transition-all duration-700 brutal-card">
                      <img src="/logo.png" alt="Taste of Hindustan" className="w-full h-full object-cover scale-150" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-3xl font-display font-black tracking-widest text-white italic">TASTE OF</span>
                      <span className="text-[10px] font-black tracking-[0.6em] text-primary uppercase">HINDUSTAN</span>
                   </div>
                </Link>
                <p className="text-gray-400 font-light text-xl leading-relaxed italic max-w-lg">
                  "Preserving the soul of Hindustani culinary artistry — where every ingredient carries the weight of a timeless legacy."
                </p>
             </div>
             
             <div className="flex space-x-6">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <motion.a 
                    key={i} 
                    href="#" 
                    whileHover={{ y: -10, rotate: 10 }}
                    className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/30 transition-all duration-500"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.a>
                ))}
             </div>
          </div>

          {/* Navigation Matrix */}
          <div className="lg:col-span-6 xl:col-span-3">
             <div className="glass-premium rounded-[3rem] p-10 border-white/5 h-full">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-10">THE ARCHIVE</h3>
                <ul className="space-y-6">
                  {[
                    { label: "Grand Menu", path: "/menu" },
                    { label: "Royal Reservations", path: "/reservation" },
                    { label: "Imperial Delivery", path: "/order" },
                    { label: "Our Chronicle", path: "/about" },
                    { label: "Concierge Portal", path: "/contact" }
                  ].map((link, i) => (
                    <li key={i}>
                      <Link to={link.path} className="text-gray-400 hover:text-white transition-all text-sm font-light tracking-widest group flex items-center space-x-3 italic">
                        <span className="w-0 h-px bg-primary group-hover:w-4 transition-all" />
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
             </div>
          </div>

          {/* Concierge Bento */}
          <div className="lg:col-span-6 xl:col-span-4 space-y-8">
             <div className="glass-premium rounded-[3rem] p-10 border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-8">GRAND CONCIERGE</h3>
                <div className="space-y-10">
                   <div className="flex items-start space-x-6 group">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                         <Navigation size={18} />
                      </div>
                      <div className="flex-1 space-y-1">
                         <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none mb-2">Imperial Address</p>
                         <p className="text-xs text-gray-400 italic font-light leading-relaxed">{contactInfo.address}</p>
                      </div>
                   </div>
                   <div className="flex items-center space-x-6 group">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                         <Phone size={18} />
                      </div>
                      <div className="flex-1 space-y-1">
                         <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none mb-2">Direct Channel</p>
                         <p className="text-sm text-white font-bold tracking-widest">{contactInfo.phone}</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="glass-premium rounded-[3rem] p-8 border border-primary/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-6 flex items-center space-x-3">
                   <Sparkles size={12} />
                   <span>IN THE LOOP</span>
                </h3>
                <div className="relative">
                   <input 
                      type="email" 
                      placeholder="YOUR@SANCTUARY.COM" 
                      className="w-full bg-black/50 border border-white/5 rounded-2xl px-6 py-4 text-[10px] font-black tracking-widest focus:outline-none focus:border-primary/50 transition-all text-white"
                   />
                   <button className="absolute right-2 top-2 w-10 h-10 bg-primary text-black rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-primary/20">
                      <Send size={16} />
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Legal & Sovereign Seal */}
        <div className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="flex items-center space-x-4">
              <History size={16} className="text-primary/30" />
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em]">
                © 2026 TASTE OF HINDUSTAN • ARCHITECTING MOMENTS SINCE 1978 • PUNE, IN.
              </p>
           </div>
           
           <div className="flex space-x-12">
              {['Privacy Protocol', 'Service Terms', 'Sanitary Safety'].map((term, i) => (
                <a key={i} href="#" className="text-[9px] font-black text-gray-700 hover:text-primary uppercase tracking-[0.3em] transition-colors">{term}</a>
              ))}
           </div>

           <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" />
              <span className="text-[8px] font-black text-primary/40 uppercase tracking-[0.2em]">Royal Server Online</span>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
