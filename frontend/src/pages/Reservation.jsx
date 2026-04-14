import React, { useState, useEffect, useRef } from "react";
import { Calendar, Clock, Users, MapPin, Check, Info, ChevronRight, ChevronLeft, Loader2, Sparkles, User, Phone, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../hooks/use-toast";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "");

const Reservation = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [tables, setTables] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTablesLoading, setIsTablesLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    guests: "2",
    specialRequests: "",
  });

  const timeSlots = [
    "11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM",
    "6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM","9:00 PM",
    "9:30 PM","10:00 PM","10:30 PM","11:00 PM",
  ];

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setIsTablesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tables`);
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      }
    } catch (err) {
      console.error("Failed to fetch tables:", err);
    } finally {
      setIsTablesLoading(false);
    }
  };

  useEffect(() => {
    if (formData.guests && formData.date && formData.time) {
      const guestCount = parseInt(formData.guests);
      const filtered = tables.filter(t => t.capacity >= guestCount && t.status === "free");
      setAvailableTables(filtered);
    }
  }, [formData.guests, formData.date, formData.time, tables]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (field === 'guests' || field === 'date' || field === 'time') {
       setSelectedTable(null);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    const reservationData = {
      customer_name: formData.name,
      phone: formData.phone,
      date: formData.date,
      time: formData.time,
      guests: Number(formData.guests),
      table_number: selectedTable,
      special_requests: formData.specialRequests,
    };

    try {
      const res = await fetch(`${API_BASE}/api/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationData),
      });

      if (!res.ok) throw new Error("Reservation failed");
      
      toast({ 
        title: "Table Reserved", 
        description: "Your royal table has been successfully secured." 
      });
      setStep(5); // Success step
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Unable to complete reservation at this time.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedTables = availableTables.reduce((acc, table) => {
    const loc = table.location || "Palace Hall";
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(table);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#050b10] pt-28 md:pt-40 pb-16 md:pb-32 relative selection:bg-primary/30 scroll-smooth">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <header className="text-center mb-12 md:mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-2 glass-premium rounded-full px-5 py-2 mb-8 border-white/5"
          >
            <Sparkles className="text-primary w-4 h-4" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">The Concierge Experience</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl md:text-8xl font-display font-black text-white mb-6 md:mb-8"
          >
            Reserve Your <span className="golden-text">Place</span>
          </motion.h1>
          
          {/* Progress Timeline */}
          <div className="flex items-center justify-center space-x-4 mb-2">
            {[1, 2, 3, 4].map((num) => (
              <React.Fragment key={num}>
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black tracking-widest transition-all duration-500 border ${
                    step >= num 
                      ? 'bg-primary border-primary text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
                      : 'glass-premium border-white/10 text-gray-500'
                  }`}
                >
                  {step > num ? <Check size={14} /> : num}
                </div>
                {num < 4 && (
                  <div className={`w-12 h-[1px] ${step > num ? 'bg-primary' : 'bg-white/10'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </header>

        <div className="glass-premium rounded-2xl md:rounded-[4rem] p-6 md:p-12 lg:p-20 border border-white/5 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-white/[0.03]" />
          
          <AnimatePresence mode="wait">
            {/* Step 1: Basics (Name & Contact) */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="space-y-4">
                  <h2 className="text-2xl md:text-4xl font-display font-bold text-white">First, tell us who you are</h2>
                  <p className="text-gray-500 font-light">Enter your contact details so our heralds can confirm your seat.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                      <User size={14} />
                      <span>Full Name</span>
                    </label>
                    <input
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="HOW MAY WE ADDRESS YOU?"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-3xl px-8 py-5 text-sm font-bold tracking-widest text-white focus:border-primary/50 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                      <Phone size={14} />
                      <span>Phone Number</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+91 MOBILE NUMBER"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-3xl px-8 py-5 text-sm font-bold tracking-widest text-white focus:border-primary/50 transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  disabled={!formData.name || !formData.phone}
                  onClick={nextStep}
                  className="w-full magnetic-button bg-primary text-black py-4 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs flex items-center justify-center space-x-4 disabled:opacity-20 transition-all"
                >
                  <span>Continue Selection</span>
                  <ChevronRight size={18} />
                </button>
              </motion.div>
            )}

            {/* Step 2: Time & Guests */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="space-y-4">
                  <h2 className="text-2xl md:text-4xl font-display font-bold text-white">Choose your time</h2>
                  <p className="text-gray-500 font-light">Select the date and party size for your royal banquet.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                      <Calendar size={14} />
                      <span>Date</span>
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={formData.date}
                      onChange={(e) => handleChange("date", e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-3xl px-8 py-5 text-sm font-bold tracking-widest text-white focus:border-primary/50 transition-all outline-none invert-calendar"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                      <Clock size={14} />
                      <span>Hour</span>
                    </label>
                    <select
                      value={formData.time}
                      onChange={(e) => handleChange("time", e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-3xl px-8 py-5 text-sm font-bold tracking-widest text-white focus:border-primary/50 transition-all outline-none appearance-none"
                    >
                      <option value="" className="bg-[#050b10]">SELECT SLOT</option>
                      {timeSlots.map(s => <option key={s} value={s} className="bg-[#050b10]">{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                      <Users size={14} />
                      <span>Guests</span>
                    </label>
                    <select
                      value={formData.guests}
                      onChange={(e) => handleChange("guests", e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-3xl px-8 py-5 text-sm font-bold tracking-widest text-white focus:border-primary/50 transition-all outline-none appearance-none"
                    >
                      {[1,2,3,4,5,6,8,10,12].map(n => <option key={n} value={n} className="bg-[#050b10]">{n} GUESTS</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 md:gap-6">
                  <button onClick={prevStep} className="w-1/3 glass-premium text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest text-[10px]">Back</button>
                  <button 
                    disabled={!formData.date || !formData.time}
                    onClick={nextStep} 
                    className="flex-1 bg-primary text-black py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center space-x-4 disabled:opacity-20 transition-all"
                  >
                    <span>Find Table</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Ambience & Table */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="space-y-4">
                  <h2 className="text-2xl md:text-4xl font-display font-bold text-white">Select your setting</h2>
                  <p className="text-gray-500 font-light">Pick a specific table from our royal mapped zones.</p>
                </div>

                <div className="space-y-10">
                   {Object.entries(groupedTables).map(([zone, zoneTables]) => (
                     <div key={zone} className="space-y-6">
                        <div className="flex items-center space-x-4">
                           <div className="h-[1px] flex-1 bg-white/5" />
                           <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em]">{zone}</span>
                           <div className="h-[1px] flex-1 bg-white/5" />
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center">
                           {zoneTables.map((t) => (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedTable(t.table_number)}
                                className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-500 relative ${
                                  selectedTable === t.table_number 
                                    ? "bg-primary border-primary text-black shadow-lg shadow-primary/20"
                                    : "glass-premium border-white/5 text-gray-500 hover:border-primary/50"
                                }`}
                              >
                                <span className="text-sm font-black italic">{t.table_number}</span>
                                <span className="text-[8px] font-bold opacity-60 mt-1">{t.capacity}P</span>
                                {selectedTable === t.table_number && (
                                   <div className="absolute -top-2 -right-2 bg-black rounded-full border border-primary p-0.5">
                                      <Check size={10} className="text-primary" />
                                   </div>
                                )}
                              </motion.button>
                           ))}
                        </div>
                     </div>
                   ))}

                   {availableTables.length === 0 && (
                      <div className="py-12 text-center glass-premium rounded-[3rem] border-white/5">
                        <Info className="mx-auto text-primary/30 mb-4" size={40} />
                        <h3 className="text-xl font-display font-bold text-white">No available tables</h3>
                        <p className="text-gray-500 text-sm mt-2">Try a different time or reduced party size.</p>
                      </div>
                   )}
                </div>

                <div className="flex gap-4 md:gap-6">
                  <button onClick={prevStep} className="w-1/3 glass-premium text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest text-[10px]">Back</button>
                  <button 
                    disabled={!selectedTable}
                    onClick={nextStep} 
                    className="flex-1 bg-primary text-black py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center space-x-4 disabled:opacity-20 transition-all shadow-xl shadow-primary/10"
                  >
                    <span>Confirm Order</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Final Summary */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="space-y-4">
                  <h2 className="text-2xl md:text-4xl font-display font-bold text-white">Final Confirmation</h2>
                  <p className="text-gray-500 font-light">Review your royal banquet details before final seal.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 glass-premium rounded-2xl md:rounded-[3rem] p-6 md:p-10 border-white/5">
                   <div className="space-y-6">
                      <div className="flex items-center space-x-6">
                         <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <Calendar />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Date & Time</p>
                            <p className="text-xl font-display font-bold text-white">{formData.date} at {formData.time}</p>
                         </div>
                      </div>
                      <div className="flex items-center space-x-6">
                         <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <Users />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Party Size</p>
                            <p className="text-xl font-display font-bold text-white">{formData.guests} Guests</p>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-6">
                      <div className="flex items-center space-x-6">
                         <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <MapPin />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ambience/Table</p>
                            <p className="text-xl font-display font-bold text-white">Table {selectedTable}</p>
                         </div>
                      </div>
                      <div className="flex items-center space-x-6">
                         <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <User />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Reserved For</p>
                            <p className="text-xl font-display font-bold text-white">{formData.name}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                    <MessageSquare size={14} />
                    <span>Special Compliments</span>
                  </label>
                  <textarea
                    value={formData.specialRequests}
                    onChange={(e) => handleChange("specialRequests", e.target.value)}
                    placeholder="ANNIVERSARY? DIETARY NEEDS? PREFERRED CANDLES?"
                    className="w-full bg-white/[0.02] border border-white/10 rounded-[2rem] px-8 py-6 text-sm font-bold tracking-widest text-white focus:border-primary/50 transition-all outline-none resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-4 md:gap-6">
                  <button onClick={prevStep} className="w-1/3 glass-premium text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest text-[10px]">Back</button>
                  <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="flex-1 bg-primary text-black py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-[12px] flex items-center justify-center space-x-4 shadow-2xl shadow-primary/20 transition-all active:scale-95"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : (
                      <>
                        <span>Seal Reservation</span>
                        <Sparkles size={18} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Success! */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-10 space-y-12"
              >
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/20 blur-[60px] animate-pulse rounded-full" />
                  <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-black relative z-10 border-4 border-black">
                     <Check size={60} strokeWidth={3} />
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-5xl font-display font-black text-white">It is Sealed.</h2>
                  <p className="text-gray-400 text-lg font-light leading-relaxed max-w-sm mx-auto">
                    Your royal table is being prepared. Our chefs have been notified of your arrival.
                  </p>
                </div>

                <div className="pt-8 flex flex-col items-center space-y-6">
                   <Link to="/" className="w-full">
                      <button className="w-full bg-white/[0.03] border border-white/10 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white hover:text-black transition-all">
                        Return To Court
                      </button>
                   </Link>
                   <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Your confirmation code: #PD-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Reservation;
