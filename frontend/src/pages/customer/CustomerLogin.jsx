import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { 
  Utensils, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  PhoneCall,
  History
} from 'lucide-react';

const CustomerLogin = () => {
  const { currentUser, signInWithGoogle, loading } = useCustomerAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination if specified
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#184956] to-[#0f2933] text-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#EAB308]/10 border border-[#EAB308]/30 mb-4 shadow-lg shadow-[#EAB308]/10">
            <Utensils className="w-8 h-8 text-[#EAB308]" />
          </div>
          <h1 
            className="text-3xl sm:text-4xl font-bold text-white mb-2" 
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Taste of <span className="text-[#EAB308]">Hindustan</span>
          </h1>
          <p className="text-gray-300 text-sm">
            Customer Portal • Order Tracking & Table Reservations
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#0f2933]/90 border border-[#EAB308]/20 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-white mb-1">
              Welcome to Your Dining Hub
            </h2>
            <p className="text-xs text-gray-400">
              Sign in with your Google account for seamless tracking & instant updates
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn || loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
          >
            {signingIn ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{signingIn ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Perks list */}
          <div className="mt-8 pt-6 border-t border-white/10 space-y-3.5">
            <p className="text-xs uppercase tracking-wider text-[#EAB308] font-semibold text-center mb-4">
              What you get with your account
            </p>

            <div className="flex items-start gap-3 text-xs text-gray-300">
              <div className="p-1 rounded bg-[#EAB308]/10 text-[#EAB308] mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-white block font-medium">Real-Time Order Tracking</strong>
                Live status updates from kitchen to delivery rider.
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-gray-300">
              <div className="p-1 rounded bg-[#EAB308]/10 text-[#EAB308] mt-0.5">
                <History className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-white block font-medium">Order History & 1-Tap Reorder</strong>
                Easily re-order your favorite biryanis and kebabs.
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-gray-300">
              <div className="p-1 rounded bg-[#EAB308]/10 text-[#EAB308] mt-0.5">
                <PhoneCall className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-white block font-medium">Saved Phone & Address</strong>
                Save your contact details once, auto-fill on every order.
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-gray-300">
              <div className="p-1 rounded bg-[#EAB308]/10 text-[#EAB308] mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-white block font-medium">Live Table Booking Status</strong>
                Instant notification when your table reservation is approved.
              </div>
            </div>
          </div>

          {/* Guest Link */}
          <div className="mt-8 text-center pt-4 border-t border-white/10">
            <Link 
              to="/order" 
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#EAB308] transition-colors"
            >
              <span>Continue as Guest to Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Security badge */}
        <p className="mt-6 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          <span>Secured with Google & Firebase • Zero Spam</span>
        </p>
      </div>
    </div>
  );
};

export default CustomerLogin;
