import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, Smartphone, Zap, Bell, CheckCircle2, Share, Info } from 'lucide-react';
import { isStandaloneApp, isIOSDevice } from '../lib/pwa';
import logoImg from '../assets/logo.png';

const CustomerPwaInstallModal = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  useEffect(() => {
    // 1. If already installed or running inside standalone app / APK, do not prompt
    if (isStandaloneApp()) {
      return;
    }

    // 2. Check if dismissed recently (24 hours cooldown)
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_at');
    if (dismissedAt) {
      const hoursSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        return;
      }
    }

    const ios = isIOSDevice();
    setIsIOS(ios);

    // 3. For Chromium / Android, capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show modal after 1.8 seconds so user lands smoothly on the dashboard
      setTimeout(() => {
        setShowModal(true);
      }, 1800);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. If beforeinstallprompt hasn't fired or on mobile web, show prompt after 2 seconds
    const fallbackTimer = setTimeout(() => {
      setShowModal(true);
    }, 2200);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowModal(false);
        }
      } catch (err) {
        console.warn('PWA install prompt error:', err);
      } finally {
        setInstalling(false);
        setDeferredPrompt(null);
      }
    } else {
      // If browser doesn't expose deferred prompt, show manual instructions
      setShowManualGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowModal(false);
    localStorage.setItem('pwa_prompt_dismissed_at', Date.now().toString());
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={handleDismiss} />

      {/* Modal card */}
      <div 
        className="relative w-full sm:max-w-md bg-[#0a1820] border-t sm:border border-[#EAB308]/30 rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden z-10 select-none animate-in slide-in-from-bottom-6 duration-300"
      >
        {/* Ambient gold glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#EAB308]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon + Brand */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EAB308]/25 to-black/90 border border-[#EAB308]/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_24px_rgba(234,179,8,0.25)] overflow-hidden">
            <img 
              src={logoImg} 
              alt="Persian Darbar" 
              className="w-10 h-10 object-contain drop-shadow"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#EAB308]/10 to-transparent" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAB308]/10 border border-[#EAB308]/30 text-[#EAB308] text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Official Customer App</span>
            </div>
            <h3 
              className="text-xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Install Persian Darbar
            </h3>
            <p className="text-gray-400 text-xs">
              persiandarbar.in · 1-Tap Home Screen Access
            </p>
          </div>
        </div>

        {/* Benefits List */}
        <div className="space-y-2.5 my-4 bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
          <div className="flex items-center gap-3 text-xs text-gray-300">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span><strong>2x Faster Performance:</strong> 1-Tap live order tracking & instant checkout.</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-300">
            <div className="w-6 h-6 rounded-lg bg-[#EAB308]/10 border border-[#EAB308]/25 flex items-center justify-center text-[#EAB308] flex-shrink-0">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <span><strong>Real-Time Updates:</strong> Live kitchen status & table reservation passes.</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-300">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <span><strong>Zero Storage Used:</strong> Launches instantly like a native mobile app.</span>
          </div>
        </div>

        {/* Action Section */}
        {isIOS ? (
          /* iOS Instructions */
          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-[#EAB308]/10 border border-[#EAB308]/30 text-xs text-gray-200">
              <p className="font-semibold text-[#EAB308] mb-1.5 flex items-center gap-1.5">
                <Share className="w-3.5 h-3.5" /> How to install on iPhone/iPad:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-gray-300">
                <li>Tap Safari's <strong>Share button</strong> (square with arrow icon).</li>
                <li>Scroll down & tap <strong>"Add to Home Screen"</strong>.</li>
                <li>Tap <strong>"Add"</strong> at top right to complete.</li>
              </ol>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Got It, Thanks
            </button>
          </div>
        ) : showManualGuide ? (
          /* Android Chrome / Browser Manual Guide */
          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-[#EAB308]/10 border border-[#EAB308]/30 text-xs text-gray-200">
              <p className="font-semibold text-[#EAB308] mb-1.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Quick 2-Step Install:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-gray-300">
                <li>Tap your browser menu (<strong>⋮</strong> three dots at top/bottom right).</li>
                <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
              </ol>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full py-3 rounded-xl bg-[#EAB308] hover:bg-[#CA8A04] text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Done, Continue to App
            </button>
          </div>
        ) : (
          /* Android / Desktop Install Action */
          <div className="space-y-2 pt-1">
            <button
              onClick={handleInstallClick}
              disabled={installing}
              className="w-full group relative overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-[#EAB308] to-[#CA8A04] hover:from-[#FACC15] hover:to-[#EAB308] text-black font-extrabold py-3.5 px-5 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#EAB308]/20 active:scale-[0.98] cursor-pointer text-sm"
            >
              <Download className="w-4 h-4 text-black group-hover:translate-y-0.5 transition-transform" />
              <span>{installing ? 'Installing App...' : 'Install App Now'}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="w-full py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Continue in Browser
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomerPwaInstallModal;

