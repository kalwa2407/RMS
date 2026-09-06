import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import axios from 'axios';

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "");

const Footer = () => {
  const [contactInfo, setContactInfo] = useState({
    address: "Upper Ground Floor, Renaissance Business Wellesley Road, Camp, Pune",
    phone: "+91 91756 23047",
    email: "info@persiandarbar.com"
  });

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/settings/public`);
      if (response.data) {
        setContactInfo({
          address: response.data.contact_address || contactInfo.address,
          phone: response.data.contact_phone || contactInfo.phone,
          email: response.data.contact_email || contactInfo.email
        });
      }
    } catch (error) {}
  };

  return (
    <footer className="bg-[#0f2933] text-white golden-border-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* About */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-[#EAB308] rounded-lg flex items-center justify-center">
                <span className="text-[#0f2933] font-bold text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>PD</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Persian Darbar</h3>
                <p className="text-[#EAB308] text-xs">Original Since 1978</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-300">
              Experience the Royal Persian Taste in Pune. Where tradition meets taste with authentic cuisine and flavorful delicacies.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[#EAB308] font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-gray-300 hover:text-[#EAB308] transition-colors">Home</Link></li>
              <li><Link to="/menu" className="text-sm text-gray-300 hover:text-[#EAB308] transition-colors">Menu</Link></li>
              <li><Link to="/order" className="text-sm text-gray-300 hover:text-[#EAB308] transition-colors">Order Online</Link></li>
              <li><Link to="/reservation" className="text-sm text-gray-300 hover:text-[#EAB308] transition-colors">Table Booking</Link></li>
              <li><Link to="/gallery" className="text-sm text-gray-300 hover:text-[#EAB308] transition-colors">Gallery</Link></li>
              <li><Link to="/about" className="text-sm text-gray-300 hover:text-[#EAB308] transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-[#EAB308] font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-[#EAB308] flex-shrink-0" />
                <span className="text-sm text-gray-300">{contactInfo.phone}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-[#EAB308] flex-shrink-0" />
                <span className="text-sm text-gray-300">{contactInfo.email}</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-[#EAB308] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-300">{contactInfo.address}</span>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="text-[#EAB308] font-semibold text-lg mb-4">Opening Hours</h3>
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <Clock className="h-4 w-4 text-[#EAB308] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p>Mon - Fri: 11:00 AM - 11:00 PM</p>
                  <p className="mt-1">Sat - Sun: 11:00 AM - 12:00 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#EAB308]/20 mt-12 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Persian Darbar Pune. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
