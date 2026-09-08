import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Award, Clock, Star, Sparkles, ShieldCheck, History, PhoneCall, CalendarCheck, Utensils, ArrowRight, Crown } from 'lucide-react';
import { menuItems, features } from '../mockData';
import { useCustomerAuth } from '../context/CustomerAuthContext';

const Home = () => {
  const signatureDishes = menuItems.filter(item => item.popular).slice(0, 3);
  const { currentUser } = useCustomerAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#184956] to-[#0f2933]">
      {/* Hero Section */}
      <section
        className="relative h-screen flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(15, 41, 51, 0.85), rgba(15, 41, 51, 0.85)), url(https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop)'
        }}
      >
        <div className="text-center text-white px-4 max-w-4xl mx-auto fade-in-up">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {signatureDishes.map((dish) => (
              <div key={dish.id} className="bg-[#1a4855] rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 card-hover">
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                  />
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
    </div>
  );
};

export default Home;
