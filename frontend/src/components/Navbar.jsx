import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import logoImg from '../assets/logo.png';
import { useCustomerAuth } from '../context/CustomerAuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { currentUser } = useCustomerAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Menu', path: '/menu' },
    { name: 'Order Online', path: '/order' },
    { name: 'Track Order', path: '/track-order' },
    { name: 'Table Booking', path: '/reservation' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Reviews', path: '/reviews' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-[#184956] border-b-2 border-[#EAB308] fixed w-full top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          <Link to="/" className="flex items-center py-2">
            <img
              src={logoImg}
              alt="Taste of Hindustan"
              className="h-14 md:h-16 w-auto object-contain drop-shadow-md transition-transform hover:scale-105"
              style={{ mixBlendMode: 'screen' }}
            />
          </Link>

          <div className="hidden lg:flex items-center space-x-5">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive(link.path) 
                    ? 'text-[#EAB308]' 
                    : 'text-white hover:text-[#EAB308]'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Customer Account Button in Desktop Nav */}
            {currentUser ? (
              <Link
                to="/customer/dashboard"
                className="flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full bg-[#0f2933] border border-[#EAB308]/40 hover:border-[#EAB308] transition-all duration-200 group"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Account"
                    className="w-7 h-7 rounded-full object-cover border border-[#EAB308]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#EAB308]/20 flex items-center justify-center text-[#EAB308] text-xs font-bold">
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EAB308] hover:bg-[#CA8A04] text-black text-xs font-bold transition-all duration-200 shadow"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
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
                className="px-3 py-1 rounded-full bg-[#EAB308] text-black text-xs font-bold"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-[#EAB308] hover:bg-[#0f2933] transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-[#0f2933] border-t border-gray-700">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-[#1a4855] text-[#EAB308]'
                    : 'text-white hover:bg-[#1a4855] hover:text-[#EAB308]'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {currentUser ? (
              <Link
                to="/customer/dashboard"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-semibold text-[#EAB308] bg-[#184956]"
              >
                👤 My Dashboard & Orders
              </Link>
            ) : (
              <Link
                to="/customer/login"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-semibold text-center text-black bg-[#EAB308]"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
