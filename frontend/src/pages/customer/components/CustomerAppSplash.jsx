import React, { useEffect, useState } from 'react';

// Matches the native launch screen colour (Capacitor SplashScreen #0B131B)
// so the hand-off from native splash to the web layer is seamless.
const CustomerAppSplash = ({ isReady = true, minDurationMs = 500 }) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      const hideTimer = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(hideTimer);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0B131B] transition-opacity duration-[400ms] ease-pd-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className={`flex flex-col items-center transition-transform duration-500 ease-pd-out ${fading ? 'scale-[1.04]' : 'scale-100'}`}>
        <img src="/app-icon.png" alt="" className="w-20 h-20 rounded-[22px] object-cover" />
        <p className="mt-5 text-[22px] text-white tracking-[0.04em]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Persian Darbar
        </p>
      </div>
    </div>
  );
};

export default CustomerAppSplash;
