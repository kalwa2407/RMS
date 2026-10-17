import React, { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';

const CustomerAppSplash = ({ isReady = true, minDurationMs = 500 }) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      const hideTimer = setTimeout(() => setVisible(false), 550);
      return () => clearTimeout(hideTimer);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0C0E] text-white transition-opacity duration-500 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 45%, rgba(212, 175, 55, 0.15) 0%, #08090A 75%)',
        WebkitBackdropFilter: 'blur(20px)',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Subtle iOS Luxury Gold Aura */}
      <div className="relative flex flex-col items-center">
        {/* Royal Persian Darbar Crown Logo */}
        <div className="relative mb-6">
          <img
            src="/app-icon.png"
            alt="Persian Darbar"
            className="w-20 h-20 rounded-3xl object-cover shadow-2xl shadow-amber-900/40 animate-pulse border border-amber-400/40"
          />
          {/* Subtle Ambient Gold Ring */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-transparent to-amber-300/30 blur-xs pointer-events-none" />
        </div>

        {/* Brand Typography (Apple iOS Luxury Minimalist) */}
        <h1 className="text-xl sm:text-2xl font-black tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 uppercase text-center font-serif">
          Persian Darbar
        </h1>
        <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.3em] text-amber-300/70 uppercase mt-1 text-center">
          Since 1976 • The Royal Feast
        </p>

        {/* Sleek Minimal iOS Activity Spinner */}
        <div className="mt-8 flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
          <span className="text-[11px] font-semibold text-neutral-400 tracking-wider">
            Loading royal menu...
          </span>
        </div>
      </div>
    </div>
  );
};

export default CustomerAppSplash;
