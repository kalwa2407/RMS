import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  ArrowLeft,
  ShieldCheck,
  LogOut,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Shield,
  FileText,
  ExternalLink
} from 'lucide-react';

const CustomerProfile = () => {
  const { currentUser, customerProfile, updateProfile, signOutCustomer } = useCustomerAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [newAddressInput, setNewAddressInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (customerProfile) {
      setName(customerProfile.name || currentUser?.displayName || '');
      setPhone(customerProfile.phone || '');
      setAddress(customerProfile.address || '');
      setAddresses(customerProfile.addresses || []);
    } else if (currentUser) {
      setName(currentUser.displayName || '');
    }
  }, [customerProfile, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone && cleanPhone.length < 10) {
      setMessage({ type: 'error', text: 'Please enter a valid 10-digit mobile number' });
      return;
    }

    setSaving(true);
    const res = await updateProfile({
      name,
      phone: cleanPhone,
      address,
      addresses
    });
    setSaving(false);

    if (res.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } else {
      setMessage({ type: 'error', text: res.warning || 'Failed to update profile' });
    }
  };

  const handleAddAddress = () => {
    if (!newAddressInput.trim()) return;
    const trimmed = newAddressInput.trim();
    if (!addresses.includes(trimmed)) {
      const updated = [...addresses, trimmed];
      setAddresses(updated);
      if (!address) setAddress(trimmed);
      setNewAddressInput('');
    }
  };

  const handleRemoveAddress = (indexToRemove) => {
    const updated = addresses.filter((_, idx) => idx !== indexToRemove);
    setAddresses(updated);
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#070d14" }}>

      {/* ─── Fixed Header ─── */}
      <div className="shrink-0" style={{ background: "rgba(7,13,20,0.98)", borderBottom: "1px solid rgba(234,179,8,0.1)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/customer/dashboard" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#EAB308] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">My Profile</h1>
              <p className="text-[#EAB308] text-[10px] font-semibold">{currentUser?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={async () => { await signOutCustomer(); navigate('/'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-300 transition-all"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 max-w-2xl mx-auto space-y-4">

        {/* Profile Card Header */}
        <div className="bg-[#0f2933]/90 border border-[#EAB308]/20 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Avatar"
              className="w-20 h-20 rounded-full border-2 border-[#EAB308] object-cover shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#EAB308]/20 border-2 border-[#EAB308] flex items-center justify-center text-[#EAB308] text-3xl font-bold">
              {currentUser?.displayName ? currentUser.displayName[0] : 'U'}
            </div>
          )}

          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {currentUser?.displayName || 'Customer'}
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Google Verified</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{currentUser?.email}</p>
          </div>

          <button
            onClick={async () => {
              await signOutCustomer();
              navigate('/');
            }}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Status message */}
        {message.text && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit} className="bg-[#0f2933]/90 border border-[#EAB308]/20 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h2 className="text-base font-bold text-white pb-3 border-b border-white/10">
            Account & Contact Information
          </h2>

          <div className="space-y-4 text-xs">
            {/* Full Name */}
            <div>
              <label className="block text-gray-300 font-medium mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#EAB308]" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2.5 bg-[#0a1e25] border border-[#EAB308]/30 rounded-xl text-sm text-white focus:outline-none focus:border-[#EAB308]"
              />
            </div>

            {/* Email (Read-only from Google) */}
            <div>
              <label className="block text-gray-300 font-medium mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#EAB308]" />
                <span>Email Address (Google Account)</span>
              </label>
              <input
                type="email"
                value={currentUser?.email || ''}
                disabled
                className="w-full px-3.5 py-2.5 bg-[#0a1e25]/50 border border-white/10 rounded-xl text-sm text-gray-400 cursor-not-allowed"
              />
            </div>

            {/* Mobile Phone Number (The key requirement!) */}
            <div className="p-4 rounded-xl bg-[#123844]/60 border border-[#EAB308]/30 space-y-2">
              <label className="block text-white font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#EAB308]" />
                  <span>Delivery Mobile Number</span>
                </span>
                <span className="text-[10px] text-[#EAB308]">₹0 Cost • No OTP</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit phone number (e.g. 9876543210)"
                  maxLength="10"
                  className="w-full pl-12 pr-3.5 py-2.5 bg-[#0a1e25] border border-[#EAB308]/40 rounded-xl text-sm text-white focus:outline-none focus:border-[#EAB308] font-mono"
                />
              </div>
              <p className="text-[11px] text-gray-300">
                This number will be automatically pre-filled when you order food or reserve a table. Riders and captains will call on this number.
              </p>
            </div>

            {/* Primary Delivery Address */}
            <div>
              <label className="block text-gray-300 font-medium mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#EAB308]" />
                <span>Primary Delivery Address</span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House/Flat number, Street, Landmark, Area..."
                rows="3"
                className="w-full px-3.5 py-2.5 bg-[#0a1e25] border border-[#EAB308]/30 rounded-xl text-sm text-white focus:outline-none focus:border-[#EAB308]"
              />
            </div>

            {/* Saved Addresses List */}
            <div className="pt-2">
              <label className="block text-gray-300 font-medium mb-2">
                Saved Additional Addresses
              </label>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newAddressInput}
                  onChange={(e) => setNewAddressInput(e.target.value)}
                  placeholder="Add another address (e.g. Office, Home 2)..."
                  className="flex-1 px-3 py-2 bg-[#0a1e25] border border-[#EAB308]/30 rounded-xl text-xs text-white focus:outline-none focus:border-[#EAB308]"
                />
                <button
                  type="button"
                  onClick={handleAddAddress}
                  className="px-3 py-2 bg-[#EAB308]/20 hover:bg-[#EAB308]/30 text-[#EAB308] border border-[#EAB308]/40 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {addresses.length > 0 ? (
                <div className="space-y-2">
                  {addresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#0a1e25]/60 border border-white/5 rounded-xl flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="text-gray-300 truncate">{addr}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAddress(idx)}
                        className="text-gray-500 hover:text-red-400 p-1 cursor-pointer"
                        title="Delete address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-500">No additional addresses saved.</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-[#EAB308] hover:bg-[#CA8A04] text-black font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>

        {/* ─── Legal & Account Deletion (Google Play Compliance) ─── */}
        <div className="bg-[#0f2933]/90 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#EAB308]" />
              <h3 className="text-white font-semibold text-xs uppercase tracking-wider">Privacy & Legal</h3>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">v1.0.0</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <Link
              to="/privacy-policy"
              className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#EAB308]/30 hover:bg-white/10 transition-colors flex items-center justify-between text-gray-300 hover:text-white"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#EAB308]" />
                <span>Privacy Policy</span>
              </div>
              <ExternalLink className="w-3 h-3 text-gray-500" />
            </Link>

            <Link
              to="/terms"
              className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#EAB308]/30 hover:bg-white/10 transition-colors flex items-center justify-between text-gray-300 hover:text-white"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Terms of Service</span>
              </div>
              <ExternalLink className="w-3 h-3 text-gray-500" />
            </Link>
          </div>

          {/* Account Deletion Request */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-red-300">Delete Account & Data</p>
              <p className="text-[11px] text-gray-500">Permanently remove credentials & saved addresses</p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* ─── Delete Account Confirmation Modal ─── */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0b161f] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-white text-lg font-bold mb-2">Request Account Deletion?</h3>
              <p className="text-xs text-gray-300 leading-relaxed mb-4">
                In compliance with Google Play Store User Data policies, requesting deletion will permanently revoke your
                Google Authentication profile, purge your saved phone number, delivery addresses, and active loyalty tokens within 30 days.
              </p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-400 mb-5">
                Past tax invoices are retained in anonymized form as required by Indian GST and statutory accounting laws.
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-white transition-colors"
                >
                  Cancel
                </button>
                <a
                  href={`mailto:privacy@persiandarbar.in?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20Persian%20Darbar%20account%20and%20associated%20data.%0A%0AUser%20Email:%20${encodeURIComponent(currentUser?.email || '')}%0APhone:%20${encodeURIComponent(phone || '')}`}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white text-center transition-colors"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Proceed via Email
                </a>
              </div>
            </div>
          </div>
        )}

        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
