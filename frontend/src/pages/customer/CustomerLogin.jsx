import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import {
  ShieldCheck,
  PhoneCall,
  ArrowRight,
  Crown,
  Star,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Zap,
  Lock,
  ChevronLeft,
  UtensilsCrossed
} from 'lucide-react';
import { isStandaloneApp } from '../../lib/pwa';

const CustomerLogin = () => {
  const { currentUser, signInWithGoogle, sendWhatsAppOtp, verifyWhatsAppOtp, loading } = useCustomerAuth();
  
  // Step: 'phone' or 'otp'
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  
  // UI states
  const [submitting, setSubmitting] = useState(false);
  const [signingInGoogle, setSigningInGoogle] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);
  
  // Timer for resend
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/customer/dashboard';

  useEffect(() => {
    if (!loading && currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, loading, navigate, from]);

  // Countdown timer handler
  useEffect(() => {
    if (resendCooldown > 0) {
      timerRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resendCooldown]);

  // Format 10-digit input
  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
    if (error) setError(null);
  };

  // Format 6-digit OTP
  const handleOtpChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(raw);
    if (error) setError(null);
  };

  // Step 1: Send OTP via SMS
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessNotice(null);

    const res = await sendWhatsAppOtp(phone);
    setSubmitting(false);

    if (res.success) {
      setStep('otp');
      setResendCooldown(res.resendCoolDown || 30);
      setSuccessNotice(`Verification code sent to +91 ${phone} via SMS!`);
    } else {
      setError(res.error || 'Failed to send SMS verification code. Please check your number and retry.');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code received via SMS');
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await verifyWhatsAppOtp(phone, otp, fullName.trim());
    setSubmitting(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setError(res.error || 'Invalid or expired verification code. Please check and retry.');
    }
  };

  // Alternative: Google Sign-In
  const handleGoogleSignIn = async () => {
    setSigningInGoogle(true);
    setError(null);
    const res = await signInWithGoogle();
    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setError(res.error || 'Google Sign-in failed. Please try again.');
      setSigningInGoogle(false);
    }
  };

  // Bespoke Luxury Badges for Royal Perks
  const perks = [
    {
      badge: (
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EAB308]/25 via-[#CA8A04]/10 to-[#07131a] border border-[#EAB308]/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_24px_rgba(234,179,8,0.22)] group-hover:scale-105 group-hover:border-[#EAB308] transition-all">
          {/* Live pulsing radar beacon */}
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-[#0b131b]" />
          </span>
          <svg className="w-6 h-6 text-[#EAB308]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" stroke="#EAB308" strokeOpacity="0.4" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#FDE047" strokeWidth="2.4" />
            <path d="M12 6v6l4 2" stroke="#FDE047" strokeWidth="2" />
            <circle cx="12" cy="12" r="2" fill="#EAB308" />
          </svg>
        </div>
      ),
      title: 'Live Kitchen-to-Door Tracking',
      tag: 'LIVE GPS',
      desc: 'Real-time order progress from royal tandoor to your doorstep.'
    },
    {
      badge: (
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f59e0b]/25 via-[#b45309]/15 to-[#07131a] border border-[#f59e0b]/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_24px_rgba(245,158,11,0.22)] group-hover:scale-105 group-hover:border-[#f59e0b] transition-all">
          <svg className="w-6 h-6 text-[#f59e0b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#goldGradientLightning)" stroke="#FDE047" strokeWidth="1.5" />
            <defs>
              <linearGradient id="goldGradientLightning" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ),
      title: '1-Tap Imperial Reorder',
      tag: 'INSTANT',
      desc: 'Reorder your signature Biryanis & Kebabs in under 5 seconds.'
    },
    {
      badge: (
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EAB308]/30 via-[#854d0e]/20 to-[#07131a] border border-[#EAB308]/50 flex items-center justify-center flex-shrink-0 shadow-[0_0_28px_rgba(234,179,8,0.28)] group-hover:scale-105 group-hover:border-[#EAB308] transition-all">
          <svg className="w-6 h-6 text-[#EAB308]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" fill="url(#crownGoldGrad)" stroke="#FDE047" strokeWidth="1.5" />
            <circle cx="12" cy="19" r="1.5" fill="#EAB308" />
            <defs>
              <linearGradient id="crownGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#CA8A04" stopOpacity="0.25" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ),
      title: 'VIP Table Priority Pass',
      tag: 'ROYAL PERK',
      desc: 'Instant royal table confirmations with zero waiting queue.'
    },
    {
      badge: (
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10b981]/25 via-[#047857]/15 to-[#07131a] border border-emerald-500/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_24px_rgba(16,185,129,0.22)] group-hover:scale-105 group-hover:border-emerald-400 transition-all">
          <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#shieldEmeraldGrad)" stroke="#34D399" strokeWidth="1.5" />
            <path d="M9 12l2 2 4-4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="shieldEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ),
      title: 'Instant SMS & OTP Login',
      tag: 'PASSWORDLESS',
      desc: 'Lightning-fast mobile login with 6-digit SMS verification.'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#0b131b] text-white relative overflow-x-hidden flex items-center justify-center p-4 sm:p-6 select-none">

      {/* ── Ambient background blobs ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[#EAB308]/8 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#184956]/50 blur-[120px] rounded-full" />
        <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-[#25D366]/6 blur-[100px] rounded-full" />
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

          {/* ════════════════════ BRANDING — Left Column on Desktop ════════════════════ */}
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
              Since 1978 — Authentic Persian & Mughlai dining excellence. Fast mobile OTP login, live order tracking & VIP bookings.
            </p>

            {/* Premium Luxury Perks list */}
            <div className="space-y-3">
              {perks.map(({ badge, title, tag, desc }) => (
                <div 
                  key={title} 
                  className="group flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-[#EAB308]/30 transition-all duration-300"
                >
                  {badge}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-xs font-bold leading-tight group-hover:text-[#EAB308] transition-colors">{title}</p>
                      <span className="text-[9px] font-black tracking-widest text-[#EAB308] bg-[#EAB308]/10 border border-[#EAB308]/25 px-1.5 py-0.2 rounded-md">{tag}</span>
                    </div>
                    <p className="text-gray-400 text-[11px] leading-relaxed mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ════════════════════ AUTH CARD ════════════════════ */}
          <div className="relative w-full max-w-md mx-auto">
            {/* Card glow */}
            <div className="absolute -inset-1 bg-gradient-to-br from-[#EAB308]/25 via-transparent to-[#184956]/40 rounded-3xl blur-xl opacity-70 pointer-events-none" />

            <div className="relative bg-[#0f1e27] border border-[#EAB308]/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">

              {/* Brand Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 bg-[#EAB308]/10 border border-[#EAB308]/25 rounded-full px-3.5 py-1 mb-2.5">
                  <Crown className="w-3 h-3 text-[#EAB308]" />
                  <span className="text-[#EAB308] text-[9px] font-black uppercase tracking-[0.35em]">Persian Darbar Member</span>
                </div>
                <h2
                  className="text-2xl sm:text-3xl font-black text-white"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {step === 'phone' ? (
                    <>Welcome to Your <span className="text-[#EAB308]">Dining Hub</span></>
                  ) : (
                    <>Verify <span className="text-[#EAB308]">SMS</span> Code</>
                  )}
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  {step === 'phone'
                    ? 'Enter your mobile number for instant SMS login & live tracking'
                    : `Enter the 6-digit verification code sent to +91 ${phone}`}
                </p>
              </div>

              {/* Gold Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-[#EAB308]/30 to-transparent mb-5" />

              {/* Error Notice */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-start gap-2.5">
                  <span className="text-sm leading-none mt-0.5">⚠️</span>
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Success Notice */}
              {successNotice && !error && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{successNotice}</span>
                </div>
              )}

              {/* ── STEP 1: MOBILE NUMBER INPUT (HERO VIEW) ── */}
              {step === 'phone' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                      Mobile Number
                    </label>
                    <div className="flex items-center rounded-2xl bg-black/35 border border-white/15 focus-within:border-[#EAB308] focus-within:ring-2 focus-within:ring-[#EAB308]/20 transition-all overflow-hidden shadow-inner">
                      <div className="px-3.5 py-3.5 bg-white/5 border-r border-white/10 flex items-center gap-1.5 text-xs font-bold text-gray-200">
                        <span className="text-base">🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        autoFocus
                        placeholder="Enter 10-digit number"
                        value={phone}
                        onChange={handlePhoneChange}
                        className="w-full bg-transparent px-3.5 py-3.5 text-white text-base tracking-widest placeholder:tracking-normal placeholder:text-gray-500 placeholder:text-xs outline-none"
                      />
                      {phone.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setPhone('')}
                          className="pr-3 text-xs text-gray-500 hover:text-white"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-[#EAB308]" />
                      You will receive an instant 6-digit code via SMS
                    </p>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    type="submit"
                    disabled={submitting || phone.length !== 10}
                    className="w-full group relative overflow-hidden flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#EAB308] to-[#CA8A04] hover:from-[#FACC15] hover:to-[#EAB308] text-black font-black py-3.5 px-5 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#EAB308]/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-black" />
                    )}
                    <span className="text-sm tracking-wide">
                      {submitting ? 'Sending SMS OTP...' : 'Get OTP on Mobile'}
                    </span>
                    {!submitting && <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>
              )}

              {/* ── STEP 2: 6-DIGIT OTP INPUT ── */}
              {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {/* Optional name for personalization */}
                  <div>
                    <label className="block text-gray-300 text-xs font-semibold mb-1 uppercase tracking-wider">
                      Your Name <span className="text-gray-500 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Aman Talukdar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-black/30 border border-white/15 focus:border-[#EAB308] focus:ring-2 focus:ring-[#EAB308]/20 rounded-2xl px-3.5 py-2.5 text-white text-sm placeholder:text-gray-500 outline-none transition-all"
                    />
                  </div>

                  {/* OTP Code */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">
                        6-Digit Verification Code
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setStep('phone');
                          setOtp('');
                          setError(null);
                        }}
                        className="text-[11px] text-[#EAB308] hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <ChevronLeft className="w-3 h-3" /> Change Number
                      </button>
                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={handleOtpChange}
                      className="w-full bg-black/45 border-2 border-white/20 focus:border-[#EAB308] focus:ring-2 focus:ring-[#EAB308]/30 rounded-2xl px-4 py-3.5 text-center text-2xl font-black tracking-[0.5em] text-[#EAB308] placeholder:tracking-[0.4em] placeholder:text-gray-600 outline-none transition-all shadow-inner"
                    />
                  </div>

                  {/* Resend Timer & Link */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                    <span>Didn't receive code?</span>
                    {resendCooldown > 0 ? (
                      <span className="text-gray-500 font-mono">
                        Resend in <strong className="text-white">{resendCooldown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={submitting}
                        className="text-[#EAB308] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Resend SMS
                      </button>
                    )}
                  </div>

                  {/* Verify Action Button */}
                  <button
                    type="submit"
                    disabled={submitting || otp.length !== 6}
                    className="w-full group relative overflow-hidden flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#EAB308] to-[#CA8A04] hover:from-[#FACC15] hover:to-[#EAB308] text-black font-black py-3.5 px-5 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#EAB308]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-black" />
                    )}
                    <span className="text-sm tracking-wide">
                      {submitting ? 'Verifying Code...' : 'Verify & Enter Club'}
                    </span>
                  </button>
                </form>
              )}

              {/* ── OR DIVIDER ── */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">
                  Or Continue With
                </span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              {/* ── GOOGLE 1-CLICK SIGN-IN ── */}
              <button
                type="button"
                id="google-signin-btn"
                onClick={handleGoogleSignIn}
                disabled={signingInGoogle || submitting || loading}
                className="w-full flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 text-xs sm:text-sm active:scale-[0.98] cursor-pointer mb-3 shadow"
              >
                {signingInGoogle ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Explore as Guest & Return links */}
              <div className="space-y-2 mt-1">
                <Link to="/customer/dashboard" className="block">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 bg-[#EAB308]/10 hover:bg-[#EAB308]/20 border border-[#EAB308]/40 text-[#EAB308] font-black py-3 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-sm"
                  >
                    <UtensilsCrossed className="w-4 h-4 text-[#EAB308]" />
                    <span>Explore Menu as Guest ›</span>
                  </button>
                </Link>

                <div className="text-center pt-1">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Return to Main Website</span>
                  </Link>
                </div>
              </div>

              {/* Trust Badge & Legal */}
              <div className="mt-5 pt-4 border-t border-white/10 flex flex-col items-center justify-center gap-1.5 text-center text-gray-500 text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[11px]">Instant SMS OTP · 256-Bit Secure Encryption</span>
                </div>
                <p className="text-[10px] text-gray-500">
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
