import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import {
  Utensils,
  Clock,
  ShieldCheck,
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
    <div className="h-[100dvh] w-full bg-[#0b131b] text-white relative overflow-hidden flex items-center justify-center p-4 sm:p-6 select-none">

      {/* ── Ambient background blobs ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[#EAB308]/8 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#184956]/50 blur-[120px] rounded-full" />
        <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-[#EAB308]/5 blur-[100px] rounded-full" />
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

      <div className="max-w-4xl w-full relative z-10 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">

          {/* ════════════════════ BRANDING — Desktop side / Mobile top ════════════════════ */}
          <div className="hidden lg:block text-left">
            {/* Crown badge */}
            <div className="inline-flex items-center gap-2 bg-[#EAB308]/10 border border-[#EAB308]/25 rounded-full px-4 py-1.5 mb-6">
              <Crown className="w-3.5 h-3.5 text-[#EAB308]" />
              <span className="text-[#EAB308] text-[9px] font-black uppercase tracking-[0.4em]">Royal Dining Club</span>
            </div>

            {/* Headline */}
            <h1
              className="text-5xl font-black leading-[1.02] mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              <span className="text-white">Persian</span>
              <br />
              <span className="text-[#EAB308]">Darbar</span>
            </h1>

            <p className="text-gray-400 text-sm font-light leading-relaxed mb-6 max-w-sm">
              Since 1978 — Authentic Persian & Mughlai dining excellence. Fast order tracking & priority bookings.
            </p>

            {/* Perks list */}
            <div className="space-y-3">
              {perks.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#EAB308]" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold leading-tight">{title}</p>
                    <p className="text-gray-500 text-[11px]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ════════════════════ AUTH CARD — Zero-scroll on all screens ════════════════════ */}
          <div className="relative w-full max-w-md mx-auto">
            {/* Card glow */}
            <div className="absolute -inset-1 bg-gradient-to-br from-[#EAB308]/25 via-transparent to-[#184956]/40 rounded-3xl blur-xl opacity-70 pointer-events-none" />

            <div className="relative bg-[#0f1e27] border border-[#EAB308]/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">

              {/* Mobile Brand Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 bg-[#EAB308]/10 border border-[#EAB308]/25 rounded-full px-3.5 py-1 mb-3">
                  <Crown className="w-3 h-3 text-[#EAB308]" />
                  <span className="text-[#EAB308] text-[9px] font-black uppercase tracking-[0.35em]">Persian Darbar Member</span>
                </div>
                <h2
                  className="text-2xl sm:text-3xl font-black text-white"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Welcome to Your <span className="text-[#EAB308]">Dining Hub</span>
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  1-Click Google sign-in for live tracking & priority reservations
                </p>
              </div>

              {/* Gold Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-[#EAB308]/30 to-transparent mb-6" />

              {/* Error Notification */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-start gap-2.5">
                  <span className="text-sm leading-none mt-0.5">⚠️</span>
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* "Become a PersianDarbar Member" Primary Action */}
              <button
                id="google-signin-btn"
                onClick={handleGoogleSignIn}
                disabled={signingIn || loading}
                className="w-full group relative overflow-hidden flex items-center justify-center gap-3 bg-[#EAB308] hover:bg-[#CA8A04] text-black font-black py-3.5 px-5 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#EAB308]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mb-3"
              >
                {/* Shimmer Effect */}
                <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                {signingIn ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0 bg-white rounded-full p-0.5 shadow-sm" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span className="text-xs sm:text-sm tracking-wide font-bold">
                  {signingIn ? 'Connecting...' : 'Become a PersianDarbar Member'}
                </span>
              </button>

              {/* Return to Home */}
              <Link to="/" className="block">
                <button className="w-full flex items-center justify-center gap-1.5 bg-transparent border border-[#EAB308]/20 hover:border-[#EAB308]/50 hover:bg-[#EAB308]/5 text-gray-400 hover:text-[#EAB308] font-semibold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer">
                  <ArrowRight className="w-3 h-3 rotate-180" />
                  Return to Main Site
                </button>
              </Link>

              {/* Trust Badge & Legal */}
              <div className="mt-5 pt-4 border-t border-[#EAB308]/15 flex flex-col items-center justify-center gap-2 text-center text-gray-500 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Secured by Google Auth · No password needed</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  By continuing, you agree to our{' '}
                  <Link to="/terms" className="text-[#EAB308] hover:underline">Terms</Link>
                  {' '}and{' '}
                  <Link to="/privacy-policy" className="text-[#EAB308] hover:underline">Privacy Policy</Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
