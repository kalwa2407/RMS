import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import {
  ChevronLeft,
  Crown,
  Phone,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Edit2,
  ShieldCheck,
  UtensilsCrossed
} from 'lucide-react';

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
  const fromPath = location.state?.from?.pathname || '/customer/dashboard';
  const fromSearch = location.state?.from?.search || '';
  const from = `${fromPath}${fromSearch}`;

  useEffect(() => {
    if (!loading && currentUser) {
      sessionStorage.setItem('customer_guest_browse', 'true');
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

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
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
      setSuccessNotice(`Verification code sent to +91 ${phone}`);
    } else {
      setError(res.error || 'Failed to send verification code. Please check your number and retry.');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit verification code');
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

  // Google Sign-In
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

  return (
    <div className="min-h-screen w-full bg-[#F8F9FA] flex flex-col items-center justify-start text-neutral-900 font-sans select-none">
      {/* ── Mobile Container (Zomato 430px Standard) ── */}
      <div
        className="w-full max-w-[430px] min-h-screen bg-white flex flex-col shadow-xl relative"
        style={{
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 20px) + 12px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)'
        }}
      >
        {/* ── Top Bar ── */}
        <header className="px-5 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (step === 'otp') {
                setStep('phone');
                setOtp('');
                setError(null);
              } else {
                navigate(-1);
              }
            }}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <Link
            to="/customer/dashboard"
            onClick={() => sessionStorage.setItem('customer_guest_browse', 'true')}
          >
            <span className="text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 px-3.5 py-1.5 rounded-full transition-colors">
              Skip
            </span>
          </Link>
        </header>

        {/* ── Hero Branding Header ── */}
        <section className="px-6 pt-4 pb-6 text-center">
          {/* Persian Darbar Royal Emblem */}
          <div className="relative inline-block mb-3">
            <div className="w-16 h-16 rounded-2xl bg-[#0F1721] text-amber-300 flex items-center justify-center font-black text-2xl shadow-lg border-2 border-amber-400/80 mx-auto">
              <Crown className="w-8 h-8 text-amber-400 fill-amber-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs">
              ✓
            </div>
          </div>

          <h1
            className="text-2xl font-black text-neutral-900 tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Persian Darbar
          </h1>
          <p className="text-xs font-semibold text-neutral-500 mt-0.5">
            India's #1 Royal Mughlai & Dum Biryani App
          </p>

          <div className="mt-4 pt-3 border-t border-neutral-100">
            <h2 className="text-base font-black text-neutral-900">
              {step === 'phone' ? 'Log in or sign up' : 'Enter Verification Code'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {step === 'phone'
                ? 'Enter your mobile number to get started'
                : `We have sent a 6-digit code to +91 ${phone}`}
            </p>
          </div>
        </section>

        {/* ── Error & Notice Alerts ── */}
        <div className="px-6">
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-[#E23744] text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <span className="text-sm leading-none mt-0.5">⚠️</span>
              <span className="leading-relaxed flex-1">{error}</span>
            </div>
          )}

          {successNotice && !error && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed flex-1">{successNotice}</span>
            </div>
          )}
        </div>

        {/* ── STEP 1: ZOMATO PHONE NUMBER FLOW ── */}
        {step === 'phone' && (
          <div className="px-6 flex-1 flex flex-col justify-between">
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Phone Input Box */}
              <div>
                <label className="block text-[11px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="flex items-center rounded-2xl border-2 border-neutral-200 focus-within:border-[#E23744] focus-within:ring-2 focus-within:ring-red-100 transition-all bg-white overflow-hidden shadow-xs">
                  {/* Country Flag Pill */}
                  <div className="px-3.5 py-3.5 bg-neutral-50 border-r border-neutral-200 flex items-center space-x-1.5 shrink-0">
                    <span className="text-base leading-none">🇮🇳</span>
                    <span className="text-xs font-black text-neutral-800">+91</span>
                  </div>

                  {/* Input */}
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    autoFocus
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full bg-transparent px-4 py-3.5 text-neutral-900 font-bold text-base tracking-wider placeholder:tracking-normal placeholder:font-normal placeholder:text-neutral-400 placeholder:text-sm outline-none"
                  />

                  {phone.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPhone('')}
                      className="pr-4 text-xs font-bold text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Primary Continue Button (Zomato Signature Red) */}
              <button
                type="submit"
                disabled={submitting || phone.length !== 10}
                className="w-full py-4 px-5 rounded-2xl bg-[#E23744] hover:bg-[#C11F2C] text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Alternative Auth Methods */}
            <div className="pt-6 pb-2 space-y-4">
              {/* Or Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px bg-neutral-200 flex-1" />
                <span className="text-[11px] uppercase font-bold tracking-widest text-neutral-400">
                  or
                </span>
                <div className="h-px bg-neutral-200 flex-1" />
              </div>

              {/* ── GOOGLE 1-CLICK SIGN-IN (Prominent Zomato style) ── */}
              <button
                type="button"
                id="google-signin-btn"
                onClick={handleGoogleSignIn}
                disabled={signingInGoogle || submitting || loading}
                className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 font-bold py-3.5 px-4 rounded-2xl transition-all text-xs sm:text-sm shadow-xs active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {signingInGoogle ? (
                  <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Guest Explore Pill */}
              <Link to="/customer/dashboard" className="block text-center">
                <button
                  type="button"
                  className="w-full flex items-center justify-center space-x-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold py-3 px-4 rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  <UtensilsCrossed className="w-4 h-4 text-amber-700" />
                  <span>Explore Menu as Guest ›</span>
                </button>
              </Link>

              {/* Legal Disclaimer */}
              <p className="text-[11px] text-neutral-400 text-center leading-relaxed pt-2">
                By continuing, you agree to our{' '}
                <Link to="/terms" className="text-neutral-700 underline font-medium">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="text-neutral-700 underline font-medium">Privacy Policy</Link>
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 2: ZOMATO 6-DIGIT OTP FLOW ── */}
        {step === 'otp' && (
          <div className="px-6 flex-1 flex flex-col justify-between">
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Phone display with Edit */}
              <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Verification code sent to
                  </span>
                  <span className="text-sm font-black text-neutral-900">
                    +91 {phone}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-bold text-[#E23744] hover:bg-red-50 flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {/* OTP Digits Input */}
              <div>
                <label className="block text-[11px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                  6-Digit Verification Code
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={handleOtpChange}
                  className="w-full bg-white border-2 border-neutral-300 focus:border-[#E23744] focus:ring-2 focus:ring-red-100 rounded-2xl px-4 py-4 text-center text-3xl font-black tracking-[0.4em] text-neutral-900 placeholder:tracking-[0.3em] placeholder:text-neutral-300 outline-none transition-all shadow-inner"
                />
              </div>

              {/* Optional Name for personalization */}
              <div>
                <label className="block text-[11px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                  Your Name <span className="text-neutral-400 lowercase font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 focus:border-[#E23744] focus:ring-2 focus:ring-red-100 rounded-2xl px-4 py-3 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 outline-none transition-all"
                />
              </div>

              {/* Resend Link / Timer */}
              <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
                <span>Didn't receive SMS?</span>
                {resendCooldown > 0 ? (
                  <span className="font-mono text-neutral-400">
                    Resend in <strong className="text-neutral-900">{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={submitting}
                    className="text-[#E23744] hover:underline font-black flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend SMS</span>
                  </button>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={submitting || otp.length !== 6}
                className="w-full py-4 px-5 rounded-2xl bg-[#E23744] hover:bg-[#C11F2C] text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-6 pb-2 text-center text-xs text-neutral-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe & Secure 256-bit Encrypted Login</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerLogin;
