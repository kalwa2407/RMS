import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Award, Clock, Star, Sparkles, ShieldCheck, History, PhoneCall, CalendarCheck, Utensils, ArrowRight, Crown, MapPin, Phone, ExternalLink } from 'lucide-react';
import { features } from '../mockData';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import API_BASE from '../lib/config';

const HOME_BRANCHES = [
  {
    city: "BANDRA", badge: "Flagship", accent: "#EAB308",
    address: "Moray Mahal, Linking Road,\nBandra West, Mumbai",
    phones: ["+91 98929 57741", "+91 77388 93395", "022 6694 1326"],
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.2!2d72.8360!3d19.0550!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c95e1e0a8e1d%3A0x0!2sMoray%20Mahal%2C%20Linking%20Rd%2C%20Bandra%20West%2C%20Mumbai!5e0!3m2!1sen!2sin!4v1694000000000",
    mapLink: "https://maps.google.com/?q=Moray+Mahal+Linking+Road+Bandra+West+Mumbai",
  },
  {
    city: "ANDHERI", badge: "East Mumbai", accent: "#f97316",
    address: "Times Square Building, B-3,\nAndheri-Kurla Road, Marol, Andheri (E)",
    phones: ["+91 87799 19652", "+91 90829 94556", "022 4968 2090"],
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3769.9!2d72.8796!3d19.1130!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b7e6b4af2f4b%3A0x0!2sTimes%20Square%20Building%20Andheri-Kurla%20Road%20Marol%20Andheri!5e0!3m2!1sen!2sin!4v1694000000001",
    mapLink: "https://maps.google.com/?q=Times+Square+Building+Andheri+Kurla+Road+Marol+Andheri+East+Mumbai",
  },
  {
    city: "KURLA", badge: "Central Hub", accent: "#8b5cf6",
    address: "No.17, Kanakia Zillion,\nL.B.S Marg, CST Road Junction,\nKurla West, Mumbai",
    phones: ["+91 91675 10547", "+91 91674 97707", "022 2086 0844"],
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.8!2d72.8800!3d19.0700!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c63a37c67a47%3A0x0!2sKanakia%20Zillion%20LBS%20Marg%20Kurla%20West%20Mumbai!5e0!3m2!1sen!2sin!4v1694000000002",
    mapLink: "https://maps.google.com/?q=Kanakia+Zillion+LBS+Marg+Kurla+West+Mumbai",
  },
  {
    city: "PUNE", badge: "Pune", accent: "#22c55e",
    address: "My Office Renaissance Business Centre,\nDr Baba Saheb Ambedkar Rd, Camp,\nPune, Maharashtra 411001",
    phones: ["+91 91756 23046"],
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3783.5!2d73.8567!3d18.5204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c0a7a1c5e12d%3A0x0!2sRenaissance+Business+Centre+Camp+Pune!5e0!3m2!1sen!2sin!4v1694000000003",
    mapLink: "https://maps.google.com/?q=Renaissance+Business+Centre+Camp+Pune+Maharashtra",
  },
];

const Home = () => {
  const { currentUser } = useCustomerAuth();
  const [signatureDishes, setSignatureDishes] = useState([]);
  const [loadingDishes, setLoadingDishes] = useState(true);

  // Hero slideshow — add images to /public/dynamic_images/ as img1.jpg, img2.jpg ... img9.jpg
  const heroImages = [
    '/dynamic_images/img1.jpeg',
    '/dynamic_images/img2.jpeg',
    '/dynamic_images/img3.jpeg',
    '/dynamic_images/img4.jpeg',
    '/dynamic_images/img5.jpeg',
    '/dynamic_images/img6.jpeg',
    '/dynamic_images/img7.jpeg',
    '/dynamic_images/img8.jpeg',
    '/dynamic_images/img9.jpeg',
  ];
  const [heroIndex, setHeroIndex] = useState(0);

  const goToSlide = (index) => setHeroIndex(index);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    const fetchSignatureDishes = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/menu`);
        const data = await res.json();
        // Only items marked as Signature (popular=true) by admin, max 3 on Home
        const signature = data.filter(item => item.popular === true && item.available !== false).slice(0, 3);
        setSignatureDishes(signature);
      } catch (err) {
        console.error('Failed to fetch signature dishes:', err);
      } finally {
        setLoadingDishes(false);
      }
    };
    fetchSignatureDishes();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#184956] to-[#0f2933]">
      {/* Hero Section — Dynamic Slideshow */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">

        {/* All images stacked — opacity crossfade, no remount, no blue flash */}
        {heroImages.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${src})`,
              opacity: i === heroIndex ? 1 : 0,
              transition: 'opacity 1.2s ease-in-out',
              zIndex: i === heroIndex ? 1 : 0,
            }}
          />
        ))}
        {/* Dark overlay — always on top of images */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2933]/80 via-[#0f2933]/70 to-[#0f2933]/90" style={{ zIndex: 2 }} />

        {/* Prev / Next arrows — z-index above overlay */}
        <button
          onClick={() => goToSlide((heroIndex - 1 + heroImages.length) % heroImages.length)}
          className="absolute left-4 md:left-8 w-10 h-10 rounded-full bg-black/30 border border-[#EAB308]/30 text-[#EAB308] flex items-center justify-center hover:bg-[#EAB308]/20 transition-all"
          style={{ zIndex: 3 }}
          aria-label="Previous"
        >
          &#8249;
        </button>
        <button
          onClick={() => goToSlide((heroIndex + 1) % heroImages.length)}
          className="absolute right-4 md:right-8 w-10 h-10 rounded-full bg-black/30 border border-[#EAB308]/30 text-[#EAB308] flex items-center justify-center hover:bg-[#EAB308]/20 transition-all"
          style={{ zIndex: 3 }}
          aria-label="Next"
        >
          &#8250;
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2" style={{ zIndex: 3 }}>
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`transition-all duration-300 rounded-full ${
                i === heroIndex
                  ? 'w-6 h-2 bg-[#EAB308]'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Content — above everything */}
        <div className="relative text-center text-white px-4 max-w-4xl mx-auto fade-in-up" style={{ zIndex: 3 }}>
          <div className="mb-8">
            <div className="inline-block border border-[#EAB308] rounded-full px-6 py-2">
              <p className="text-[#EAB308] text-base font-medium">
                Persian Cuisine • Royal Dining
              </p>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            Welcome to <span className="text-[#EAB308]">Persian Darbar</span>
          </h1>
          <p className="text-lg md:text-xl mb-10 text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Where tradition meets taste. Experience authentic Persian culture with artisan cuisine and flavorful delicacies in the heart of Pune.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/menu">
              <button className="bg-[#EAB308] hover:bg-[#CA8A04] text-black px-8 py-3 text-base font-bold rounded-full transition-all duration-300">
                View Our Menu
              </button>
            </Link>
            <Link to="/reservation">
              <button className="bg-transparent border-2 border-[#EAB308] hover:bg-[#EAB308] hover:text-black text-[#EAB308] px-8 py-3 text-base font-bold rounded-full transition-all duration-300">
                Reserve a Table
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Golden Border */}
      <div className="golden-divider"></div>

      {/* Features Section */}
      <section className="py-20 bg-[#1a4855] persian-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const icons = [ChefHat, Award, Clock, Star];
              const Icon = icons[index];
              return (
                <div key={feature.id} className="bg-[#0f2933] rounded-xl p-6 text-center hover:shadow-xl transition-all duration-300 card-hover">
                  <div className="w-16 h-16 bg-[#1a4855] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-[#EAB308]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Golden Border */}
      <div className="golden-divider"></div>

      {/* Signature Dishes Section */}
      <section className="py-20 bg-[#0f2933]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-[#EAB308] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Signature Dishes
            </h2>
            <p className="text-lg text-gray-300">
              Taste the royal flavors of Persia
            </p>
          </div>

          {loadingDishes ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-[#1a4855] rounded-xl overflow-hidden animate-pulse">
                  <div className="h-56 bg-[#0f2933]" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 bg-[#0f2933] rounded w-3/4" />
                    <div className="h-3 bg-[#0f2933] rounded w-full" />
                    <div className="h-3 bg-[#0f2933] rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : signatureDishes.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No signature dishes available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {signatureDishes.map((dish) => (
                <div key={dish._id || dish.id} className="bg-[#1a4855] rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 card-hover">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.src = '/no-image.png'; }}
                    />
                    <div className="absolute top-3 left-3 bg-yellow-500 text-black px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow">
                      <Star className="w-3 h-3 fill-black" /> Signature
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#EAB308] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{dish.name}</h3>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">{dish.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-[#EAB308]">₹{dish.price}</span>
                      <Link to="/order">
                        <button className="bg-[#EAB308] hover:bg-[#CA8A04] text-black px-6 py-2 rounded-full font-bold transition-all duration-300">
                          Order Now
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/menu">
              <button className="bg-transparent border-2 border-[#EAB308] hover:bg-[#EAB308] hover:text-black text-[#EAB308] px-10 py-3 rounded-full font-bold transition-all duration-300">
                Explore Full Menu
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Golden Border */}
      <div className="golden-divider"></div>

      {/* ══════════════════════════════════════════
          JOIN THE PERSIAN DARBAR FAMILY — CTA
      ══════════════════════════════════════════ */}
      {!currentUser && (
        <section className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-b from-[#0f2933] via-[#0d1f28] to-[#0b131b]">
          {/* Ambient glow blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#EAB308]/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#1a4855]/60 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 relative z-10">
            {/* Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 bg-[#EAB308]/10 border border-[#EAB308]/30 rounded-full px-5 py-2">
                <Crown className="w-4 h-4 text-[#EAB308]" />
                <span className="text-[#EAB308] text-xs font-black uppercase tracking-[0.4em]">Exclusive Members</span>
                <Crown className="w-4 h-4 text-[#EAB308]" />
              </div>
            </div>

            {/* Headline */}
            <h2
              className="text-4xl sm:text-5xl md:text-7xl font-black text-center text-white mb-6 leading-tight"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Join the <span className="text-[#EAB308]">Persian Darbar</span> Family
            </h2>
            <p className="text-center text-gray-400 text-base md:text-lg font-light mb-14 max-w-2xl mx-auto leading-relaxed">
              One tap. Unlimited privileges. Track orders live, reserve royal tables, reorder your favorites in seconds.
            </p>

            {/* Perks grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {[
                { icon: Clock, title: 'Live Order Tracking', desc: 'Watch your food go from kitchen to your door in real-time.' },
                { icon: CalendarCheck, title: 'Priority Table Booking', desc: 'Reserve your royal table instantly — no phone calls needed.' },
                { icon: History, title: '1-Tap Reorder', desc: 'Reorder your favourite biryanis and kebabs in a single tap.' },
                { icon: PhoneCall, title: 'Auto-fill Details', desc: 'Save address & phone once, auto-fills on every future order.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-4 bg-[#1a4855]/50 border border-[#EAB308]/10 rounded-2xl p-5 hover:border-[#EAB308]/30 hover:bg-[#1a4855]/80 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#EAB308]/20 transition-colors">
                    <Icon className="w-5 h-5 text-[#EAB308]" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-0.5">{title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/customer/login" className="w-full sm:w-auto">
                <button className="relative w-full sm:w-auto group overflow-hidden bg-[#EAB308] hover:bg-[#CA8A04] text-black font-black px-10 py-5 rounded-2xl text-sm uppercase tracking-[0.25em] transition-all duration-300 shadow-2xl shadow-[#EAB308]/20 hover:shadow-[#EAB308]/40 hover:scale-105 flex items-center justify-center gap-3">
                  {/* Shimmer */}
                  <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <Sparkles className="w-5 h-5" />
                  <span>Join the Family — It's Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/reservation">
                <button className="w-full sm:w-auto bg-transparent border border-[#EAB308]/30 hover:border-[#EAB308] text-[#EAB308] font-bold px-8 py-5 rounded-2xl text-sm uppercase tracking-widest transition-all duration-300 hover:bg-[#EAB308]/5 flex items-center justify-center gap-2">
                  <CalendarCheck className="w-4 h-4" />
                  <span>Reserve First</span>
                </button>
              </Link>
            </div>

            {/* Trust line */}
            <p className="text-center text-xs text-gray-600 mt-8 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>Sign in with Google · Zero spam · No password needed</span>
            </p>
          </div>
        </section>
      )}

      {/* If already logged in — show quick actions instead */}
      {currentUser && (
        <section className="py-20 bg-gradient-to-b from-[#0f2933] to-[#0b131b]">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-[#EAB308]/10 border border-[#EAB308]/30 rounded-full px-5 py-2 mb-8">
              <Crown className="w-4 h-4 text-[#EAB308]" />
              <span className="text-[#EAB308] text-xs font-black uppercase tracking-[0.4em]">Welcome Back, Royal Guest</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              What would you like <span className="text-[#EAB308]">today?</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Link to="/reservation">
                <button className="group flex items-center gap-3 bg-[#EAB308] hover:bg-[#CA8A04] text-black font-black px-8 py-4 rounded-2xl text-sm uppercase tracking-wider transition-all shadow-xl shadow-[#EAB308]/20 hover:scale-105">
                  <CalendarCheck className="w-5 h-5" />
                  Reserve a Table
                </button>
              </Link>
              <Link to="/order">
                <button className="group flex items-center gap-3 bg-transparent border border-[#EAB308]/40 hover:border-[#EAB308] text-[#EAB308] font-bold px-8 py-4 rounded-2xl text-sm uppercase tracking-wider transition-all hover:bg-[#EAB308]/10">
                  <Utensils className="w-5 h-5" />
                  Order Online
                </button>
              </Link>
              <Link to="/customer/dashboard">
                <button className="group flex items-center gap-3 bg-transparent border border-white/10 hover:border-white/30 text-gray-400 hover:text-white font-bold px-8 py-4 rounded-2xl text-sm uppercase tracking-wider transition-all">
                  <History className="w-5 h-5" />
                  My Orders
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}
      {/* Golden Border */}
      <div className="golden-divider" />

      {/* ══════════════════════════════════════════
          OUR BRANCHES — Compact Map Cards
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-[#0f2933]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="text-[#EAB308] text-[10px] font-black uppercase tracking-[0.5em] block mb-3">Where To Find Us</span>
            <h2 className="text-3xl md:text-5xl font-black text-white italic mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Our <span className="text-[#EAB308]">Branches</span>
            </h2>
            <div className="w-24 h-[1px] bg-[#EAB308]/30 mx-auto mt-4" />
            <p className="text-gray-500 text-sm mt-4 max-w-xl mx-auto">
              Four royal courts across Maharashtra — each one a gateway to authentic Mughal culinary heritage.
            </p>
          </div>

          {/* Branch Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {HOME_BRANCHES.map((branch) => (
              <div
                key={branch.city}
                className="group relative rounded-3xl overflow-hidden border border-white/10 flex flex-col"
                style={{ background: 'linear-gradient(135deg, #0f1e28, #152535)' }}
              >
                {/* Top accent line */}
                <div className="h-0.5 w-full shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${branch.accent}, transparent)` }} />

                {/* Card header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${branch.accent}20`, border: `1px solid ${branch.accent}30` }}>
                      <MapPin style={{ color: branch.accent }} size={16} />
                    </div>
                    <div>
                      <p className="text-white font-black text-base leading-none" style={{ fontFamily: 'Playfair Display, serif' }}>{branch.city}</p>
                      <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5 block" style={{ color: branch.accent }}>{branch.badge}</span>
                    </div>
                  </div>
                  <a
                    href={branch.mapLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                    style={{ background: `${branch.accent}15`, border: `1px solid ${branch.accent}30`, color: branch.accent }}
                  >
                    <ExternalLink size={11} /> Get Directions
                  </a>
                </div>

                {/* Address */}
                <div className="px-5 pb-3 shrink-0">
                  <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{branch.address}</p>
                </div>

                {/* Compact Map — 150px height */}
                <div
                  className="relative mx-4 mb-4 rounded-2xl overflow-hidden shrink-0"
                  style={{ height: 150, border: `1.5px solid ${branch.accent}25`, boxShadow: `0 0 30px ${branch.accent}10` }}
                >
                  <div className="absolute top-0 left-0 w-10 h-10 rounded-br-2xl pointer-events-none z-10" style={{ background: `linear-gradient(135deg, ${branch.accent}25, transparent)` }} />
                  <div className="absolute bottom-0 right-0 w-10 h-10 rounded-tl-2xl pointer-events-none z-10" style={{ background: `linear-gradient(315deg, ${branch.accent}25, transparent)` }} />
                  <iframe
                    title={`Map - Persian Darbar ${branch.city}`}
                    src={branch.mapSrc}
                    width="100%" height="100%"
                    style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.85) contrast(1.1)' }}
                    allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                {/* Phone numbers */}
                {branch.phones.length > 0 && (
                  <div className="px-5 pb-5 shrink-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2" style={{ color: branch.accent }}>Contact</p>
                    <div className="flex flex-wrap gap-2">
                      {branch.phones.map(ph => (
                        <a key={ph} href={`tel:${ph.replace(/\s/g, '')}`}
                          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white transition-all"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <Phone size={9} style={{ color: branch.accent }} />
                          {ph}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom glow */}
                <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{ background: `linear-gradient(to top, ${branch.accent}06, transparent)` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
