import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Menu', path: '/menu' },
    { name: 'Order Online', path: '/order' },
    { name: 'Track Order', path: '/track-order' },
    { name: 'Table Booking', path: '/reservation' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-[#184956] border-b-2 border-[#EAB308] fixed w-full top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#EAB308] rounded-lg flex items-center justify-center">
              <span className="text-[#0f2933] font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>PD</span>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-white font-bold text-lg tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>Persian Darbar</span>
              <span className="text-[#EAB308] text-[10px] font-medium tracking-widest uppercase">Original Since 1978</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center space-x-6">
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
            <Link to="/admin" className="p-2 rounded-full text-white hover:text-[#EAB308] transition-colors">
              <User size={18} />
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-md text-[#EAB308] hover:bg-[#0f2933] transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
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
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-[#1a4855] hover:text-[#EAB308] transition-colors"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
