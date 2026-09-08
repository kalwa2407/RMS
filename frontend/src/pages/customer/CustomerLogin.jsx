import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import {
  Utensils,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  History,
  CalendarCheck,
  ArrowRight,
  Crown,
  Star,
} from 'lucide-react';

const CustomerLogin = () => {
  const { currentUser, signInWithGoogle, loading } = useCustomerAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/customer/dashboard';

  useEffect(() => {
    if (!loading && currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, loading, navigate, from]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    const res = await signInWithGoogle();
    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setError(res.error || 'Google Sign-in failed. Please try again.');
      setSigningIn(false);
    }
  };

  const perks = [
    { icon: Clock,        title: 'Live Order Tracking',     desc: 'Real-time kitchen-to-door status updates.' },
    { icon: History,      title: '1-Tap Reorder',           desc: 'Instantly reorder your favourite dishes.' },
    { icon: CalendarCheck,title: 'Priority Reservations',   desc: 'Reserve royal tables without calling us.' },
    { icon: PhoneCall,    title: 'Auto-fill Details',       desc: 'Save address & phone, auto-fill every time.' },
  ];

  return (
    <div className="min-h-screen bg-[#0b131b] text-white relative overflow-hidden flex items-center justify-center px-4 py-16">

      {/* ── Ambient background blobs ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[#EAB308]/6 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#184956]/50 blur-[120px] rounded-full" />
        <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-[#EAB308]/4 blur-[100px] rounded-full" />
      </div>

      {/* ── Decorative corner ornaments ── */}
      <div className="absolute top-6 left-6 opacity-20 hidden md:block">
        <Star className="w-5 h-5 text-[#EAB308]" />
      </div>
      <div className="absolute top-6 right-6 opacity-20 hidden md:block">
        <Star className="w-5 h-5 text-[#EAB308]" />
      </div>
      <div className="absolute bottom-6 left-6 opacity-20 hidden md:block">
        <Star className="w-5 h-5 text-[#EAB308]" />
      </div>
      <div className="absolute bottom-6 right-6 opacity-20 hidden md:block">
        <Star className="w-5 h-5 text-[#EAB308]" />
      </div>

      <div className="max-w-5xl w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* ════════════════════ LEFT — Branding ════════════════════ */}
          <div className="text-center lg:text-left">

            {/* Crown badge */}
            <div className="inline-flex items-center gap-2 bg-[#EAB308]/10 border border-[#EAB308]/25 rounded-full px-5 py-2 mb-8">
              <Crown className="w-4 h-4 text-[#EAB308]" />
              <span className="text-[#EAB308] text-[10px] font-black uppercase tracking-[0.45em]">Royal Dining Club</span>
            </div>

            {/* Logo icon */}
            <div className="flex lg:justify-start justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-[#EAB308]/20 blur-[24px] rounded-full" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EAB308] to-[#CA8A04] flex items-center justify-center shadow-2xl shadow-[#EAB308]/30">
                  <Utensils className="w-8 h-8 text-black" />
                </div>
              </div>
            </div>

            {/* Headline */}
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] mb-5"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              <span className="text-white">Persian</span>
              <br />
              <span className="text-[#EAB308]">Darbar</span>
            </h1>

            <p className="text-gray-400 text-base font-light leading-relaxed mb-10 max-w-sm mx-auto lg:mx-0">
              Since 1978 — Authentic Persian & Mughlai cuisine from the heart of Pune. Your royal experience begins here.
            </p>

            {/* Perks list */}
            <div className="space-y-4 text-left">
              {perks.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-4 group">
                  <div className="w-9 h-9 rounded-xl bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#EAB308]/20 transition-colors">
                    <Icon className="w-4 h-4 text-[#EAB308]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">{title}</p>
                    <p className="text-gray-500 text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ════════════════════ RIGHT — Auth Card ════════════════════ */}
          <div className="relative">
            {/* Card glow */}
            <div className="absolute -inset-1 bg-gradient-to-br from-[#EAB308]/20 via-transparent to-[#184956]/30 rounded-3xl blur-xl opacity-70" />

            <div className="relative bg-[#0f1e27] border border-[#EAB308]/15 rounded-3xl p-8 md:p-10 shadow-2xl">

              {/* Card header */}
              <div className="text-center mb-8">
                <p className="text-[#EAB308] text-[10px] font-black uppercase tracking-[0.45em] mb-3">
                  ✦ Member Access ✦
                </p>
                <h2
                  className="text-2xl md:text-3xl font-black text-white mb-2"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Welcome to Your<br />
                  <span className="text-[#EAB308]">Dining Hub</span>
                </h2>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Sign in with Google for seamless order tracking & instant reservations.
                </p>
              </div>

              {/* Thin gold divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-[#EAB308]/30 to-transparent mb-8" />

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-3">
                  <span className="text-base leading-none mt-0.5">⚠️</span>
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Google Sign-in Button */}
              <button
                id="google-signin-btn"
                onClick={handleGoogleSignIn}
                disabled={signingIn || loading}
                className="w-full group relative overflow-hidden flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-white/10 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mb-4"
              >
                {/* Shimmer on hover */}
                <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-gray-200/40 to-transparent" />

                {signingIn ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span className="text-sm tracking-wide">
                  {signingIn ? 'Connecting...' : 'Continue with Google'}
                </span>
              </button>

              {/* Golden CTA alternative */}
              <Link to="/" className="block">
                <button className="w-full flex items-center justify-center gap-2 bg-transparent border border-[#EAB308]/20 hover:border-[#EAB308]/50 hover:bg-[#EAB308]/5 text-gray-400 hover:text-[#EAB308] font-semibold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-widest transition-all duration-300">
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  Return to Home
                </button>
              </Link>

              {/* Thin gold divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-[#EAB308]/20 to-transparent mt-8 mb-6" />

              {/* Trust badge */}
              <p className="text-center text-xs text-gray-600 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Secured by Google & Firebase · Zero spam · No password</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
