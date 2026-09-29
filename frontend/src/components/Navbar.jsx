import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import logoImg from '../assets/logo.png';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { isStandaloneApp } from '../lib/pwa';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { currentUser } = useCustomerAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Menu', path: '/menu' },
    { name: 'Order Online', path: '/order' },
    { name: 'Table Booking', path: '/reservation' },
    { name: 'Events', path: '/events' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Reviews', path: '/reviews' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className="fixed w-full top-0 z-50 transition-all duration-300"
      style={{
        background: '#184956',
        boxShadow: scrolled ? '0 10px 30px -10px rgba(0,0,0,0.6)' : '0 4px 20px -5px rgba(0,0,0,0.3)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24 md:h-28">
          <Link to="/" className="flex items-center py-2">
            <img
              src={logoImg}
              alt="Persian Darbar"
              className="h-20 md:h-24 w-auto object-contain drop-shadow-md transition-transform hover:scale-105"
              style={{ mixBlendMode: 'screen' }}
            />
          </Link>

          <div className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative text-[13px] tracking-wide font-medium py-1.5 transition-all duration-300 group ${
                    active
                      ? 'text-[#EAB308] font-semibold'
                      : 'text-gray-200 hover:text-[#EAB308]'
                  }`}
                >
                  <span>{link.name}</span>
                  {/* Subtle active/hover glowing indicator */}
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-300 ${
                      active
                        ? 'w-full bg-[#EAB308] shadow-[0_0_8px_rgba(234,179,8,0.7)]'
                        : 'w-0 group-hover:w-1/2 bg-[#EAB308]/50'
                    }`}
                  />
                </Link>
              );
            })}

            {/* Customer Account Button in Desktop Nav */}
            {currentUser ? (
              <Link
                to="/customer/dashboard"
                className="flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full transition-all duration-300 group active:scale-95 hover:border-[#EAB308]"
                style={{
                  background: 'rgba(10, 31, 40, 0.85)',
                  border: '1px solid rgba(234, 179, 8, 0.35)',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)'
                }}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Account"
                    className="w-7 h-7 rounded-full object-cover border border-[#EAB308]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#EAB308]/20 flex items-center justify-center text-[#EAB308] text-xs font-bold border border-[#EAB308]/40">
                    {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                )}
                <span className="text-xs font-semibold text-white group-hover:text-[#EAB308] transition-colors max-w-[100px] truncate">
                  {currentUser.displayName?.split(' ')[0] || 'My Account'}
                </span>
              </Link>
            ) : (
              <Link
                to="/customer/login"
                className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full overflow-hidden transition-all duration-300 active:scale-95 shadow-md hover:shadow-[0_0_18px_rgba(234,179,8,0.4)] whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)',
                  border: '1px solid rgba(254, 240, 138, 0.45)'
                }}
              >
                <div className="w-4 h-4 rounded-full bg-black/15 flex items-center justify-center">
                  <User className="w-2.5 h-2.5 text-black" />
                </div>
                <span className="text-black text-xs font-bold tracking-wide uppercase">
                  Become a Member
                </span>
                <span className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </Link>
            )}

            {isStandaloneApp() && (
              <Link
                to="/staff-entry"
                onClick={() => sessionStorage.removeItem("allow_public_website")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAB308]/20 border border-[#EAB308] text-[#EAB308] hover:bg-[#EAB308] hover:text-black text-xs font-bold transition-all duration-200"
              >
                <span>👑</span>
                <span>Staff Portal</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {currentUser ? (
              <Link
                to="/customer/dashboard"
                className="flex items-center gap-1.5 p-1 rounded-full bg-[#0f2933] border border-[#EAB308]"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Account"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#EAB308]/20 flex items-center justify-center text-[#EAB308] text-xs font-bold">
                    {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                )}
              </Link>
            ) : (
              <Link
                to="/customer/login"
                className="px-3.5 py-1.5 rounded-full text-black text-xs font-bold whitespace-nowrap shadow-sm active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)',
                  border: '1px solid rgba(254, 240, 138, 0.4)'
                }}
              >
                Member
              </Link>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-[#EAB308] hover:bg-white/5 transition-colors border border-[#EAB308]/20"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Royal hairline gradient divider at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1.5px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(234,179,8,0.2) 15%, rgba(234,179,8,0.85) 50%, rgba(234,179,8,0.2) 85%, transparent 100%)'
        }}
      />
      <div
        className="absolute bottom-0 left-1/4 right-1/4 h-[1px] pointer-events-none opacity-60"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(254,240,138,0.9), transparent)',
          filter: 'blur(0.5px)'
        }}
      />

      {isOpen && (
        <div className="lg:hidden bg-[#0a1f28]/95 backdrop-blur-xl border-t border-[#EAB308]/20 shadow-2xl">
          <div className="px-4 pt-2 pb-5 space-y-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#EAB308]/15 text-[#EAB308] border-l-2 border-[#EAB308] font-semibold'
                      : 'text-gray-300 hover:bg-white/5 hover:text-[#EAB308]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {currentUser ? (
              <Link
                to="/customer/dashboard"
                onClick={() => setIsOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#EAB308] bg-[#184956]/60 border border-[#EAB308]/30"
              >
                👤 My Dashboard & Orders
              </Link>
            ) : (
              <Link
                to="/customer/login"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-bold text-center text-black shadow-md transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)',
                  border: '1px solid rgba(254, 240, 138, 0.4)'
                }}
              >
                👑 Become a PersianDarbar Member
              </Link>
            )}

            {isStandaloneApp() && (
              <Link
                to="/staff-entry"
                onClick={() => {
                  sessionStorage.removeItem("allow_public_website");
                  setIsOpen(false);
                }}
                className="block mt-3 px-3 py-2.5 rounded-xl text-base font-bold text-center text-black bg-[#EAB308] shadow-lg"
              >
                👑 Switch to Staff Portal (4 Panels)
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
