import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Award, Clock, Zap, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { menuItems } from '../mockData';

/* ─────────────────────────────────────────────────────────
   Shared font helpers
───────────────────────────────────────────────────────── */
const CINZEL  = { fontFamily: "'Playfair Display', serif" };
const MESSIRI = { fontFamily: "'El Messiri', serif" };
const RUQAA   = { fontFamily: "'Aref Ruqaa', serif" };

/* ─────────────────────────────────────────────────────────
   Home
───────────────────────────────────────────────────────── */
const Home = () => {
  const containerRef = useRef(null);
  const videoRef     = useRef(null);
  const signatureDishes = menuItems.filter(i => i.popular).slice(0, 3);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const videoY    = useTransform(scrollYProgress, [0, 0.5], ["0%", "18%"]);
  const heroTextY = useTransform(scrollYProgress, [0, 0.3], ["0%", "30%"]);
  const heroOp    = useTransform(scrollYProgress, [0, 0.22], [1, 0]);

  /* Force native video to play */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, []);

  return (
    <div ref={containerRef} className="relative bg-[#050b10] overflow-x-hidden selection:bg-primary/30">

      {/* ───────── 1. CINEMATIC HERO ───────── */}
      <section className="relative h-[100vh] md:h-[110vh] flex items-center justify-center overflow-hidden">

        {/* BG Video Layer */}
        <motion.div style={{ y: videoY, opacity: heroOp }} className="absolute inset-0 z-0">
          {/* Multi-layer tinted overlays */}
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#050b10]/60 via-black/20 to-[#050b10]" />
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#050b10]/50 via-transparent to-[#050b10]/50" />
          {/* Noise/texture grain for cinematic look */}
          <div className="absolute inset-0 z-10 opacity-[0.06]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")", backgroundSize: "256px 256px" }} />

          {/* Native HTML5 Video — most reliable cross-browser approach */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover scale-[1.08] brightness-[0.55]"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            {/* Hosted on Cloudflare R2 — fast, CORS-open, no auth token expiry */}
            <source src="https://videos.pexels.com/video-files/853921/853921-hd_1920_1080_25fps.mp4" type="video/mp4" />
            <source src="https://videos.pexels.com/video-files/1448735/1448735-uhd_2560_1440_24fps.mp4" type="video/mp4" />
            {/* Fallback full-cover image if video blocked */}
            <img
              src="/luxury_persian_restaurant_interior_1776082050142.png"
              alt="Taste of Hindustan"
              className="w-full h-full object-cover"
            />
          </video>

          {/* Saffron glow orbs */}
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-[120px] z-10 pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-600/5 rounded-full blur-[100px] z-10 pointer-events-none" />
        </motion.div>

        {/* Hero Content */}
        <motion.div
          style={{ y: heroTextY, opacity: heroOp }}
          className="relative z-20 text-center px-4 max-w-6xl mx-auto w-full"
        >
          {/* Arabic kicker */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <span
              className="text-primary/70 text-xl md:text-2xl tracking-widest"
              style={RUQAA}
            >
              ذوق الهند · مرحباً بكم
            </span>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center space-x-3 bg-white/5 border border-primary/30 rounded-full px-6 py-2 mb-10 backdrop-blur-xl"
          >
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <p className="text-primary text-[10px] font-semibold uppercase tracking-[0.5em]" style={MESSIRI}>
              The Heart of Hindustan · Since 1978
            </p>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.94, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 leading-[1.05] tracking-tight"
            style={CINZEL}
          >
            <span className="block text-3xl sm:text-5xl md:text-7xl lg:text-[6rem] text-white drop-shadow-[0_2px_30px_rgba(255,255,255,0.15)]">
              Where Art Meets
            </span>
            <span className="block text-3xl sm:text-5xl md:text-7xl lg:text-[6rem] golden-text drop-shadow-[0_0_40px_rgba(234,179,8,0.25)] italic">
              The Palate.
            </span>
          </motion.h1>

          {/* Sub tagline in El Messiri */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-gray-400 text-base md:text-lg mb-14 tracking-widest font-light max-w-xl mx-auto"
            style={MESSIRI}
          >
            An ode to imperial Hindustani cuisine, where every bite tells a story of fire, spice, and legacy.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.65 }}
            className="flex flex-col sm:flex-row gap-5 justify-center items-center"
          >
            <Link to="/menu">
              <button
                className="magnetic-button group bg-primary text-black px-10 py-5 rounded-full font-bold uppercase tracking-[0.25em] text-[11px] flex items-center space-x-3 shadow-2xl shadow-primary/20"
                style={MESSIRI}
              >
                <span>Discover the Collection</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform duration-500" />
              </button>
            </Link>
            <Link to="/reservation">
              <button
                className="magnetic-button bg-white/5 border border-white/20 text-white px-10 py-5 rounded-full font-semibold uppercase tracking-[0.25em] text-[11px] hover:bg-white hover:text-black backdrop-blur-xl transition-all duration-500"
                style={MESSIRI}
              >
                Reserve Your Private Table
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-3 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <span className="text-[9px] uppercase tracking-[0.6em] text-white/30 font-medium" style={MESSIRI}>Scroll</span>
          <motion.div
            className="w-[1px] h-16 bg-gradient-to-b from-primary/60 to-transparent"
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ originY: 0 }}
          />
        </motion.div>
      </section>

      {/* ───────── 2. BENTO GRID FEATURES ───────── */}
      <section className="py-32 relative px-4">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto">
            {/* Main bento */}
            <div className="md:col-span-2 md:row-span-2 brutal-card rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 flex flex-col justify-end group min-h-[280px] md:min-h-0">
              <div className="absolute inset-0 z-0 overflow-hidden rounded-[2.5rem]">
                <img
                  src="/luxury_persian_restaurant_interior_1776082050142.png"
                  className="w-full h-full object-cover brightness-[0.35] group-hover:scale-105 transition-transform duration-1000"
                  alt="Interior"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              </div>
              <div className="relative z-10">
                <span className="text-primary/60 text-2xl mb-4 block" style={RUQAA}>المطبخ الهندي</span>
                <ChefHat className="text-primary h-10 w-10 mb-5" />
                <h2 className="text-3xl text-white mb-3" style={CINZEL}>A Legacy<br/>Since 1978</h2>
                <p className="text-gray-400 text-sm leading-relaxed" style={MESSIRI}>
                  Decades of culinary heritage, preserved and perfected through every generation.
                </p>
              </div>
            </div>

            {/* Award */}
            <div className="md:col-span-1 brutal-card rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 glass-premium flex flex-col justify-center items-center text-center">
              <Award className="text-primary h-10 w-10 mb-4" />
              <h3 className="text-xl text-white mb-1" style={CINZEL}>Crafted with Precision</h3>
              <p className="text-xs text-gray-500" style={MESSIRI}>Every dish is a balance of fire, spice, and mastery.</p>
            </div>

            {/* Delivery */}
            <div className="md:col-span-1 brutal-card rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 bg-primary group flex flex-col justify-center items-center text-center">
              <div className="relative">
                <Zap className="text-black h-10 w-10 group-hover:scale-125 transition-transform duration-500" />
                <div className="absolute inset-0 bg-white/20 blur-xl animate-ping" />
              </div>
              <h3 className="text-xl text-black mt-5 mb-1" style={CINZEL}>An Atmosphere of Royalty</h3>
              <p className="text-[10px] text-black/60 uppercase tracking-widest" style={MESSIRI}>Dine where tradition meets timeless elegance.</p>
            </div>

            {/* Hours */}
            <div className="md:col-span-2 brutal-card rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 glass-premium flex items-center space-x-4 md:space-x-6">
              <div className="w-16 h-16 rounded-full border border-primary/30 flex items-center justify-center shrink-0 relative overflow-hidden group">
                <Clock className="text-primary h-7 w-7 relative z-10" />
                <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </div>
              <div>
                <h3 className="text-2xl text-white leading-tight" style={CINZEL}>At Your<br/>Pleasure, Always</h3>
                <p className="text-sm text-gray-400 mt-1.5" style={MESSIRI}>Open daily · 11:00 AM to 1:00 AM</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ───────── 3. SIGNATURE COLLECTION ───────── */}
      <section className="py-32 relative">
        <div className="absolute top-0 right-0 w-[45%] h-[45%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-20 gap-6 md:gap-8">
            <ScrollReveal direction="left">
              <p className="text-primary font-semibold uppercase tracking-[0.5em] text-[10px] mb-4" style={MESSIRI}>A curated expression of royal flavors</p>
              <h2 className="text-3xl sm:text-5xl md:text-7xl text-white leading-none" style={CINZEL}>
                The <span className="text-stroke-white text-transparent">Hindustan</span><br/>Collection
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <Link to="/menu">
                <div className="flex items-center space-x-4 group cursor-pointer">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/40 group-hover:text-primary transition-colors" style={MESSIRI}>View All Works</span>
                  <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary transition-all duration-500">
                    <ArrowRight className="text-white h-5 w-5 group-hover:text-primary" />
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
            {signatureDishes.map((dish, i) => (
              <ScrollReveal key={dish.id} delay={i * 0.15}>
                <div className="group relative">
                  <div className="relative aspect-[4/3] sm:aspect-[4/5] overflow-hidden rounded-2xl md:rounded-[2.5rem] brutal-card mb-4 md:mb-6">
                    <img
                      src={i === 0 ? "/signature_persian_kabab_platter_1776082069527.png" : dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-6 left-6 right-6 z-10 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <Link to="/order">
                        <button className="w-full bg-white text-black py-3.5 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-primary transition-colors" style={MESSIRI}>
                          Begin Your Experience
                        </button>
                      </Link>
                    </div>
                  </div>
                  <div className="flex justify-between items-start px-1">
                    <div>
                      <h3 className="text-xl text-white mb-1.5" style={CINZEL}>{dish.name}</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest" style={MESSIRI}>{dish.category}</p>
                    </div>
                    <span className="text-lg font-bold text-primary/80" style={CINZEL}>₹{dish.price}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── 4. FULL-SCREEN CTA ───────── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop"
            className="w-full h-full object-cover brightness-[0.18]"
            alt="Royal Experience"
          />
          <div className="absolute inset-0 bg-[#050b10]/50 backdrop-blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050b10] via-transparent to-[#050b10]" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <ScrollReveal>
            {/* Arabic accent */}
            <p className="text-primary/50 text-3xl mb-6" style={RUQAA}>تذوق طعم الهند</p>
            <h2 className="text-3xl sm:text-5xl md:text-7xl text-white mb-8 md:mb-12 leading-tight" style={CINZEL}>
              An experience remembered <br /><span className="golden-text">long after the last bite.</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/reservation">
                <button className="magnetic-button bg-primary text-black px-8 md:px-14 py-4 md:py-6 rounded-full font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-[12px] shadow-2xl shadow-primary/20" style={MESSIRI}>
                  Secure Your Private Table
                </button>
              </Link>
              <Link to="/contact">
                <button className="text-white/40 hover:text-white text-[10px] uppercase tracking-[0.5em] transition-colors" style={MESSIRI}>
                  Contact Concierge →
                </button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   ScrollReveal helper
───────────────────────────────────────────────────────── */
const ScrollReveal = ({ children, direction = "up", delay = 0, className = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        y: direction === "up" ? 50 : direction === "down" ? -50 : 0,
        x: direction === "left" ? 50 : direction === "right" ? -50 : 0,
        scale: 0.97,
      }}
      animate={inView ? { opacity: 1, y: 0, x: 0, scale: 1 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default Home;
