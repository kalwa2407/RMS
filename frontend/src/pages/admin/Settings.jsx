import React, { useState, useEffect } from "react";
import { Save, Key, MapPin, Phone, Mail } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "");

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Password Change
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });

  // Contact Info
  const [contactInfo, setContactInfo] = useState({
    address: "FC Road, Pune, Maharashtra 411004, India",
    phone: "+91 20 1234 5678",
    email: "info@persiandarbar.com"
  });

  // UPI QR
  const [upiQRCode, setUpiQRCode] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(`${API_BASE}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      response.data.forEach((setting) => {
        if (setting.key === "upi_qr_code") setUpiQRCode(setting.value);
        if (setting.key === "contact_address")
          setContactInfo((prev) => ({ ...prev, address: setting.value }));
        if (setting.key === "contact_phone")
          setContactInfo((prev) => ({ ...prev, phone: setting.value }));
        if (setting.key === "contact_email")
          setContactInfo((prev) => ({ ...prev, email: setting.value }));
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("admin_token");

      await axios.post(
        `${API_BASE}/api/admin/change-password`,
        {
          old_password: passwordData.old_password,
          new_password: passwordData.new_password
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: "Success",
        description: "Password changed successfully"
      });

      setPasswordData({
        old_password: "",
        new_password: "",
        confirm_password: ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactUpdate = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const token = localStorage.getItem("admin_token");
      const headers = { Authorization: `Bearer ${token}` };

      await Promise.all([
        axios.put(
          `${API_BASE}/api/admin/settings`,
          { key: "contact_address", value: contactInfo.address },
          { headers }
        ),
        axios.put(
          `${API_BASE}/api/admin/settings`,
          { key: "contact_phone", value: contactInfo.phone },
          { headers }
        ),
        axios.put(
          `${API_BASE}/api/admin/settings`,
          { key: "contact_email", value: contactInfo.email },
          { headers }
        )
      ]);

      toast({
        title: "Success",
        description: "Contact information updated"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contact information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUPIUpdate = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const token = localStorage.getItem("admin_token");

      await axios.put(
        `${API_BASE}/api/admin/settings`,
        { key: "upi_qr_code", value: upiQRCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({ title: "Success", description: "UPI QR Code updated" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update UPI QR Code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2
          className="text-4xl font-bold text-primary"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Settings
        </h2>
        <p className="text-gray-300">
          Manage admin settings & restaurant information
        </p>
      </div>

      {/* CONTACT INFO */}
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-primary mb-4 flex items-center">
          <MapPin className="h-6 w-6 mr-2" />
          Contact Information
        </h3>

        <form onSubmit={handleContactUpdate} className="space-y-4">
          {/* address */}
          <div>
            <label className="block text-primary font-semibold mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Address
            </label>
            <input
              required
              value={contactInfo.address}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, address: e.target.value })
              }
              className="w-full px-4 py-3 bg-[#050b10] border border-white/5 rounded-lg text-white"
            />
          </div>

          {/* phone + email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-primary font-semibold mb-2 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Phone
              </label>
              <input
                required
                value={contactInfo.phone}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, phone: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#050b10] border border-white/5 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-primary font-semibold mb-2 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </label>
              <input
                required
                type="email"
                value={contactInfo.email}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, email: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#050b10] border border-white/5 rounded-lg text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-[#CA8A04] text-black py-3 rounded-full font-bold flex justify-center disabled:opacity-50"
          >
            <Save className="h-5 w-5 mr-2" />
            Update Contact Information
          </button>
        </form>
      </div>

      {/* PASSWORD CHANGE */}
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-primary mb-4 flex items-center">
          <Key className="h-6 w-6 mr-2" />
          Change Password
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-primary font-semibold mb-2">
              Current Password
            </label>
            <input
              required
              type="password"
              value={passwordData.old_password}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  old_password: e.target.value
                })
              }
              className="w-full px-4 py-3 bg-[#050b10] border border-white/5 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-primary font-semibold mb-2">
              New Password
            </label>
            <input
              required
              type="password"
              value={passwordData.new_password}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  new_password: e.target.value
                })
              }
              className="w-full px-4 py-3 bg-[#050b10] border border-white/5 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-primary font-semibold mb-2">
              Confirm New Password
            </label>
            <input
              required
              type="password"
              value={passwordData.confirm_password}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirm_password: e.target.value
                })
              }
              className="w-full px-4 py-3 bg-[#050b10] border border-white/5 rounded-lg text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-[#CA8A04] text-black py-3 rounded-full font-bold flex justify-center disabled:opacity-50"
          >
            <Save className="h-5 w-5 mr-2" />
            Change Password
          </button>
        </form>
      </div>

      {/* UPI QR */}
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-primary mb-4">
          UPI QR Code URL
        </h3>

        <form onSubmit={handleUPIUpdate} className="space-y-4">
          <div>
            <label className="block text-primary font-semibold mb-2">
              QR Code Image URL
            </label>
            <input
              value={upiQRCode}
              onChange={(e) => setUpiQRCode(e.target.value)}
              placeholder="https://example.com/upi.png"
              className="w-full px-4 py-3 bg-[#050b10] border border-white/5 rounded-lg text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-[#CA8A04] text-black py-3 rounded-full font-bold flex justify-center disabled:opacity-50"
          >
            <Save className="h-5 w-5 mr-2" />
            Update UPI QR Code
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;


