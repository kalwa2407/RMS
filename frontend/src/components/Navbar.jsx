import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setScrolled(latest > 80);
  });

  const navLinks = [
    { name: 'Menu', path: '/menu' },
    { name: 'Reservation', path: '/reservation' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'About', path: '/about' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <motion.nav
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: -120, opacity: 0 },
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-5 inset-x-0 z-[100] px-4 pointer-events-none"
      >
        <div className={`max-w-6xl mx-auto pointer-events-auto transition-all duration-700 ${scrolled ? 'max-w-4xl' : ''}`}>
          <div className={`relative px-5 py-3 md:px-8 md:py-4 rounded-full flex items-center justify-between gap-6 transition-all duration-700 ${
            scrolled
              ? 'bg-black/70 backdrop-blur-3xl border border-white/10 shadow-[0_8px_40px_-5px_rgba(0,0,0,0.8)]'
              : 'bg-white/[0.02] backdrop-blur-xl border border-white/5'
          }`}>
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group shrink-0">
              <motion.div whileHover={{ rotate: 8, scale: 1.05 }} className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500" />
                <div className="w-10 h-10 md:w-11 md:h-11 bg-primary rounded-2xl flex items-center justify-center border border-primary/50 overflow-hidden relative">
                  <span className="text-black font-black text-lg tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>TH</span>
                </div>
              </motion.div>
              <div className="hidden lg:flex flex-col leading-none gap-0.5">
                <span className="font-black tracking-[0.15em] text-white text-[15px] uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>TASTE OF</span>
                <span className="font-bold tracking-[0.5em] text-primary text-[8px] uppercase" style={{ fontFamily: "'El Messiri', serif" }}>ذوق الهند · Hindustan</span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="relative text-[11px] font-semibold tracking-[0.25em] uppercase transition-all duration-300 group"
                  style={{ fontFamily: "'El Messiri', serif" }}
                >
                  <span className={`transition-colors duration-300 ${
                    isActive(link.path) ? 'text-primary' : 'text-gray-400 group-hover:text-white'
                  }`}>
                    {link.name}
                  </span>
                  {isActive(link.path) && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute -bottom-1.5 left-0 w-full h-[1.5px] bg-primary rounded-full shadow-[0_0_10px_rgba(234,179,8,0.6)]"
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/order" className="hidden sm:block">
                <button
                  className="bg-primary text-black px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 shadow-lg shadow-primary/20"
                  style={{ fontFamily: "'El Messiri', serif" }}
                >
                  Begin Your Dining Experience
                </button>
              </Link>

              <Link to="/admin" className="hidden lg:block">
                <div className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-primary hover:border-primary/30 transition-all">
                  <User size={18} />
                </div>
              </Link>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full bg-white/5 border border-white/10 text-primary md:hidden"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.button>
            </div>

            {/* Glow */}
            <div className="absolute inset-0 rounded-full pointer-events-none overflow-hidden opacity-10">
              <div className="absolute -top-full -left-1/4 w-1/2 h-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="max-w-6xl mx-auto mt-3 pointer-events-auto md:hidden"
            >
              <div className="bg-black/80 backdrop-blur-3xl rounded-[2rem] border border-white/10 p-6 flex flex-col space-y-4 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`text-lg font-bold tracking-widest uppercase py-3 border-b border-white/5 transition-colors ${
                      isActive(link.path) ? 'text-primary' : 'text-white hover:text-primary'
                    }`}
                    style={{ fontFamily: "'El Messiri', serif" }}
                  >
                    {link.name}
                  </Link>
                ))}
                <Link to="/order" onClick={() => setIsOpen(false)}>
                  <button className="w-full bg-primary text-black py-4 rounded-2xl font-bold uppercase tracking-[0.3em] text-sm mt-2">
                    Begin Your Experience
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};

export default Navbar;
