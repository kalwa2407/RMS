import React, { useState, useEffect, useRef } from "react";
import {
  Save, Key, MapPin, Phone, Mail, Clock, Eye, EyeOff,
  RefreshCw, Image, CheckCircle, AlertCircle, Volume2,
  Upload, Play, Music, ShoppingBag, UtensilsCrossed, Loader2
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";

// ── Porter Config Panel (sub-component used in Settings) ─────────────────────
const PorterConfigPanel = () => {
  const [config, setConfig] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem("admin_token");
    fetch(`${API_BASE}/api/admin/porter/config`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setConfig(d))
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 text-sm animate-pulse">Checking Porter configuration...</div>;
  if (!config) return <div className="text-red-400 text-sm">Could not reach backend to check Porter status.</div>;

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${config.configured ? "bg-green-900/20 border-green-500/30" : "bg-red-900/20 border-red-500/30"}`}>
        <div className={`w-2.5 h-2.5 rounded-full ${config.configured ? "bg-green-400" : "bg-red-400"}`} />
        <div>
          <p className={`text-sm font-bold ${config.configured ? "text-green-400" : "text-red-400"}`}>
            {config.configured ? "Porter API Connected" : "Porter API Key Not Set"}
          </p>
          <p className="text-gray-500 text-xs">
            {config.configured
              ? `Environment: ${config.environment === "sandbox" ? "🧪 Sandbox (Testing)" : "🚀 Production"}`
              : 'Add PORTER_API_KEY to backend/.env to activate'}
          </p>
        </div>
      </div>

      {/* Restaurant Pickup Location */}
      <div className="bg-[#0f2933] rounded-xl p-4">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Restaurant Pickup Location</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Name</span>
            <span className="text-white">{config.restaurant_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Coordinates</span>
            <span className="text-white font-mono text-xs">{config.restaurant_lat}, {config.restaurant_lng}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Address</span>
            <span className="text-white text-xs text-right max-w-[60%]">{config.restaurant_address}</span>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      {!config.configured && (
        <div className="bg-[#0f2933] border border-orange-500/20 rounded-xl p-4">
          <p className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">Setup Steps</p>
          <ol className="space-y-1.5 text-xs text-gray-400 list-none">
            <li>1. Go to <span className="text-orange-400">porter.in/enterprise</span> → Request API access</li>
            <li>2. Receive API key from Porter team</li>
            <li>3. Set <code className="text-green-400 bg-black/30 px-1 rounded">PORTER_API_KEY=your_key</code> in <code className="text-gray-300">backend/.env</code></li>
            <li>4. Change <code className="text-green-400 bg-black/30 px-1 rounded">PORTER_API_BASE_URL</code> to production URL when ready</li>
            <li>5. Restart backend server</li>
          </ol>
        </div>
      )}

      {/* Delivery Policy */}
      <div className="bg-[#0f2933] rounded-xl p-4">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Delivery Fee Policy</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">0 – 5 km</span>
            <span className="text-green-400 font-bold">FREE (customer pays ₹0)</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">5 – 20 km</span>
            <span className="text-[#EAB308] font-bold">₹60 from customer</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Porter's cost</span>
            <span className="text-gray-300 text-xs">~₹50–120 (restaurant absorbs)</span>
          </div>
        </div>
      </div>
    </div>
  );
};


const Settings = () => {
  const { toast } = useToast();
  const [fetchingSettings, setFetchingSettings] = useState(true);
  const upiFileRef = useRef(null);

  // 1. Password State
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  // 2. Contact Info State
  const [contactInfo, setContactInfo] = useState({
    address: "",
    phone: "",
    email: "",
    opening_hours: ""
  });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  // 3. UPI QR State
  const [upiQRCode, setUpiQRCode] = useState("");
  const [uploadingUpi, setUploadingUpi] = useState(false);
  const [upiSaving, setUpiSaving] = useState(false);
  const [upiSaved, setUpiSaved] = useState(false);

  // 4. Sound Settings State
  const [onlineSoundUrl, setOnlineSoundUrl] = useState(null);
  const [dineinSoundUrl, setDineinSoundUrl] = useState(null);
  const [uploadingSound, setUploadingSound] = useState({ online: false, dinein: false });
  const [playingSound, setPlayingSound] = useState({ online: false, dinein: false, default: false });

  const formatSoundUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE}${url}`;
  };

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    setFetchingSettings(true);
    try {
      const token = localStorage.getItem("admin_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [settingsRes, onlineSoundRes, dineinSoundRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/api/admin/settings`, { headers }),
        axios.get(`${API_BASE}/api/admin/notification-sound`, { headers }),
        axios.get(`${API_BASE}/api/admin/notification-sound/dinein`, { headers })
      ]);

      // Parse general settings
      if (settingsRes.status === "fulfilled") {
        const data = settingsRes.value.data;
        if (Array.isArray(data)) {
          data.forEach((setting) => {
            if (setting.key === "upi_qr_code") setUpiQRCode(setting.value || "");
            if (setting.key === "contact_address")
              setContactInfo((prev) => ({ ...prev, address: setting.value || "" }));
            if (setting.key === "contact_phone")
              setContactInfo((prev) => ({ ...prev, phone: setting.value || "" }));
            if (setting.key === "contact_email")
              setContactInfo((prev) => ({ ...prev, email: setting.value || "" }));
            if (setting.key === "opening_hours")
              setContactInfo((prev) => ({ ...prev, opening_hours: setting.value || "" }));
          });
        } else if (data && typeof data === "object") {
          if (data.upi_qr_code) setUpiQRCode(data.upi_qr_code);
          if (data.contact_address) setContactInfo(prev => ({ ...prev, address: data.contact_address }));
          if (data.contact_phone) setContactInfo(prev => ({ ...prev, phone: data.contact_phone }));
          if (data.contact_email) setContactInfo(prev => ({ ...prev, email: data.contact_email }));
          if (data.opening_hours) setContactInfo(prev => ({ ...prev, opening_hours: data.opening_hours }));
        }
      }

      // Parse sounds
      if (onlineSoundRes.status === "fulfilled" && onlineSoundRes.value.data?.url) {
        setOnlineSoundUrl(formatSoundUrl(onlineSoundRes.value.data.url));
      }
      if (dineinSoundRes.status === "fulfilled" && dineinSoundRes.value.data?.url) {
        setDineinSoundUrl(formatSoundUrl(dineinSoundRes.value.data.url));
      }

    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setFetchingSettings(false);
    }
  };

  // --- PASSWORD UPDATE ---
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    if (passwordData.new_password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setPwSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      await axios.post(
        `${API_BASE}/api/admin/change-password`,
        { old_password: passwordData.old_password, new_password: passwordData.new_password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: "✅ Password Changed", description: "Admin password updated successfully" });
      setPasswordData({ old_password: "", new_password: "", confirm_password: "" });
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 4000);
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description: error.response?.data?.detail || "Incorrect old password or request failed",
        variant: "destructive"
      });
    } finally {
      setPwSaving(false);
    }
  };

  // --- CONTACT UPDATE ---
  const handleContactUpdate = async (e) => {
    e.preventDefault();
    setContactSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const headers = { Authorization: `Bearer ${token}` };
      await Promise.all([
        axios.put(`${API_BASE}/api/admin/settings`, { key: "contact_address", value: contactInfo.address }, { headers }),
        axios.put(`${API_BASE}/api/admin/settings`, { key: "contact_phone", value: contactInfo.phone }, { headers }),
        axios.put(`${API_BASE}/api/admin/settings`, { key: "contact_email", value: contactInfo.email }, { headers }),
        axios.put(`${API_BASE}/api/admin/settings`, { key: "opening_hours", value: contactInfo.opening_hours }, { headers })
      ]);
      toast({ title: "✅ Saved!", description: "Restaurant information updated successfully" });
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 4000);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update contact info", variant: "destructive" });
    } finally {
      setContactSaving(false);
    }
  };

  // --- UPI UPDATE ---
  const handleUPIUpdate = async (e) => {
    e.preventDefault();
    setUpiSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(
        `${API_BASE}/api/admin/settings`,
        { key: "upi_qr_code", value: upiQRCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: "✅ Saved!", description: "UPI QR code saved successfully" });
      setUpiSaved(true);
      setTimeout(() => setUpiSaved(false), 4000);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update UPI QR Code", variant: "destructive" });
    } finally {
      setUpiSaving(false);
    }
  };

  const handleUPIImageUpload = async (file) => {
    if (!file) return;
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid File", description: "Upload PNG, JPG or WEBP image", variant: "destructive" });
      return;
    }
    setUploadingUpi(true);
    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(`${API_BASE}/api/admin/upload/image`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      if (response.data.url) {
        const fullUrl = response.data.url.startsWith("http") ? response.data.url : `${API_BASE}${response.data.url}`;
        setUpiQRCode(fullUrl);
        // Auto-save setting as well
        await axios.put(
          `${API_BASE}/api/admin/settings`,
          { key: "upi_qr_code", value: fullUrl },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast({ title: "🎉 UPI QR Uploaded & Saved!", description: "QR code is now live on table checkout" });
        setUpiSaved(true);
        setTimeout(() => setUpiSaved(false), 4000);
      }
    } catch (error) {
      toast({ title: "Upload Failed", description: error.response?.data?.detail || "Failed to upload image", variant: "destructive" });
    } finally {
      setUploadingUpi(false);
    }
  };

  // --- SOUND UPLOAD & TEST ---
  const handleSoundUpload = async (file, type) => {
    if (!file) return;
    const validExtensions = ["mp3", "wav", "ogg", "webm", "m4a", "aac"];
    const ext = file.name.split(".").pop().toLowerCase();
    const isAudio = file.type.startsWith("audio/") || validExtensions.includes(ext);

    if (!isAudio) {
      toast({ title: "Invalid File", description: "Please upload an audio file (MP3, WAV, OGG, etc.)", variant: "destructive" });
      return;
    }

    setUploadingSound(prev => ({ ...prev, [type]: true }));
    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("file", file);

      const endpoint = type === "dinein"
        ? `${API_BASE}/api/admin/upload/sound/dinein`
        : `${API_BASE}/api/admin/upload/sound`;

      const response = await axios.post(endpoint, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      if (response.data.success && response.data.url) {
        const fullUrl = formatSoundUrl(response.data.url);
        if (type === "dinein") setDineinSoundUrl(fullUrl);
        else setOnlineSoundUrl(fullUrl);

        toast({
          title: "🎉 Sound Uploaded!",
          description: `${type === "dinein" ? "Dine-In" : "Online"} notification sound updated successfully`
        });

        // Test play
        try {
          const audio = new Audio(fullUrl);
          audio.volume = 0.8;
          audio.play().catch(() => {});
        } catch {}
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.detail || "Failed to upload audio file",
        variant: "destructive"
      });
    } finally {
      setUploadingSound(prev => ({ ...prev, [type]: false }));
    }
  };

  const playSound = (url, key) => {
    const soundTarget = url || "/notification.wav";
    setPlayingSound(prev => ({ ...prev, [key]: true }));

    try {
      const audio = new Audio(soundTarget);
      audio.volume = 0.8;
      audio.onended = () => setPlayingSound(prev => ({ ...prev, [key]: false }));
      audio.onerror = () => {
        setPlayingSound(prev => ({ ...prev, [key]: false }));
        toast({ title: "Playback Error", description: "Could not play audio. Check browser permissions.", variant: "destructive" });
      };
      audio.play().catch(() => {
        setPlayingSound(prev => ({ ...prev, [key]: false }));
        toast({ title: "Notice", description: "Click anywhere on the screen first to enable sound.", variant: "destructive" });
      });
    } catch {
      setPlayingSound(prev => ({ ...prev, [key]: false }));
    }
  };

  if (fetchingSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin text-[#EAB308]" />
          <span className="text-sm">Loading settings...</span>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#EAB308]/60 transition-colors text-sm";
  const labelClass = "block text-[#EAB308] font-semibold mb-2 flex items-center gap-2 text-xs uppercase tracking-wider";
  const btnClass = (saved) => `w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all disabled:opacity-50 text-sm active:scale-[0.99] cursor-pointer ${saved ? "bg-emerald-500 text-white" : "bg-[#EAB308] hover:bg-[#CA8A04] text-black shadow-lg"}`;

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h2 className="text-3xl md:text-4xl font-bold text-[#EAB308]" style={{ fontFamily: "Playfair Display, serif" }}>
          Settings
        </h2>
        <p className="text-gray-400 text-sm mt-1">Manage restaurant details, notification sounds, UPI payments & admin security</p>
      </div>

      {/* ─── 1. NOTIFICATION SOUNDS ─── */}
      <div className="bg-[#1a4855] border border-[#EAB308]/20 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#EAB308] flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Notification Sounds
          </h3>
          <button
            onClick={() => playSound("/notification.wav", "default")}
            disabled={playingSound.default}
            className="px-3 py-1.5 rounded-lg bg-[#0f2933] hover:bg-[#0f2933]/80 border border-[#EAB308]/20 text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition-all"
          >
            {playingSound.default ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EAB308]" /> : <Music className="w-3.5 h-3.5 text-[#EAB308]" />}
            <span>Test Default Chime</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Online Orders Sound Card */}
          <div className="bg-[#0f2933] border border-[#EAB308]/15 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#EAB308]/15 text-[#EAB308]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">Online Orders Sound</p>
                <p className="text-gray-400 text-[11px] truncate">
                  {onlineSoundUrl ? "Custom audio file active" : "Using default Persian chime"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => playSound(onlineSoundUrl, "online")}
                disabled={playingSound.online}
                className="flex-1 py-2 rounded-lg bg-[#EAB308] hover:bg-[#CA8A04] text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {playingSound.online ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{playingSound.online ? "Playing..." : "Test Sound"}</span>
              </button>

              <label
                htmlFor="sound-upload-online"
                className={`flex-1 py-2 rounded-lg border border-[#EAB308]/30 hover:border-[#EAB308]/70 text-gray-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${uploadingSound.online ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {uploadingSound.online ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EAB308]" /> : <Upload className="w-3.5 h-3.5 text-[#EAB308]" />}
                <span>{uploadingSound.online ? "Uploading..." : "Upload Sound"}</span>
              </label>
              <input
                type="file"
                id="sound-upload-online"
                accept="audio/*,.mp3,.wav,.ogg,.webm,.m4a"
                onChange={(e) => {
                  if (e.target.files[0]) handleSoundUpload(e.target.files[0], "online");
                }}
                className="hidden"
              />
            </div>
          </div>

          {/* Dine-In Orders Sound Card */}
          <div className="bg-[#0f2933] border border-[#EAB308]/15 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">Table Dine-In Sound</p>
                <p className="text-gray-400 text-[11px] truncate">
                  {dineinSoundUrl ? "Custom audio file active" : "Using default Persian chime"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => playSound(dineinSoundUrl, "dinein")}
                disabled={playingSound.dinein}
                className="flex-1 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {playingSound.dinein ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{playingSound.dinein ? "Playing..." : "Test Sound"}</span>
              </button>

              <label
                htmlFor="sound-upload-dinein"
                className={`flex-1 py-2 rounded-lg border border-blue-400/30 hover:border-blue-400/70 text-gray-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${uploadingSound.dinein ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {uploadingSound.dinein ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> : <Upload className="w-3.5 h-3.5 text-blue-400" />}
                <span>{uploadingSound.dinein ? "Uploading..." : "Upload Sound"}</span>
              </label>
              <input
                type="file"
                id="sound-upload-dinein"
                accept="audio/*,.mp3,.wav,.ogg,.webm,.m4a"
                onChange={(e) => {
                  if (e.target.files[0]) handleSoundUpload(e.target.files[0], "dinein");
                }}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. CONTACT INFORMATION ─── */}
      <div className="bg-[#1a4855] border border-[#EAB308]/20 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-[#EAB308] mb-5 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Restaurant & Contact Information
        </h3>
        <form onSubmit={handleContactUpdate} className="space-y-4">
          <div>
            <label className={labelClass}><MapPin className="h-3.5 w-3.5" /> Address</label>
            <input
              required
              value={contactInfo.address}
              onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
              placeholder="FC Road, Deccan Gymkhana, Pune, Maharashtra 411004"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}><Phone className="h-3.5 w-3.5" /> Phone Number</label>
              <input
                required
                value={contactInfo.phone}
                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                placeholder="+91 20 1234 5678"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}><Mail className="h-3.5 w-3.5" /> Email Address</label>
              <input
                required
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                placeholder="reservations@persiandarbar.in"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}><Clock className="h-3.5 w-3.5" /> Opening Hours</label>
            <input
              value={contactInfo.opening_hours}
              onChange={(e) => setContactInfo({ ...contactInfo, opening_hours: e.target.value })}
              placeholder="11:00 AM – 11:30 PM (Daily)"
              className={inputClass}
            />
          </div>

          <button type="submit" disabled={contactSaving} className={btnClass(contactSaved)}>
            {contactSaved ? <CheckCircle className="h-4 w-4" /> : contactSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {contactSaved ? "Information Saved!" : contactSaving ? "Saving..." : "Save Restaurant Details"}
          </button>
        </form>
      </div>

      {/* ─── 3. UPI QR CODE ─── */}
      <div className="bg-[#1a4855] border border-[#EAB308]/20 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-[#EAB308] mb-5 flex items-center gap-2">
          <Image className="h-5 w-5" />
          UPI QR Code Payment
        </h3>
        <div className="space-y-4">
          {/* Preview */}
          {upiQRCode && (
            <div className="flex flex-col items-center justify-center p-4 bg-[#0f2933] border border-[#EAB308]/15 rounded-xl">
              <p className="text-gray-400 text-xs mb-2">Live Customer Preview</p>
              <img
                src={upiQRCode}
                alt="UPI QR Code"
                className="w-44 h-44 object-contain rounded-xl border-2 border-[#EAB308]/30 bg-white p-2 shadow-lg"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          {/* Upload Image Button */}
          <div>
            <label className={labelClass}><Upload className="h-3.5 w-3.5" /> Upload QR Image</label>
            <input
              ref={upiFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUPIImageUpload(e.target.files[0])}
            />
            <button
              type="button"
              onClick={() => upiFileRef.current?.click()}
              disabled={uploadingUpi}
              className="w-full border-2 border-dashed border-[#EAB308]/30 rounded-xl py-4 text-center text-gray-300 hover:border-[#EAB308]/70 hover:text-white transition-all text-sm disabled:opacity-50 cursor-pointer bg-[#0f2933]/50"
            >
              {uploadingUpi ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#EAB308]" />
                  Uploading QR image...
                </span>
              ) : (
                "📤 Click to select & upload QR code image (PNG / JPG / WEBP)"
              )}
            </button>
          </div>

          <form onSubmit={handleUPIUpdate} className="space-y-3">
            <div>
              <label className={labelClass}>Or Enter QR Image URL</label>
              <input
                value={upiQRCode}
                onChange={(e) => setUpiQRCode(e.target.value)}
                placeholder="https://example.com/upi-qr.png or /static/uploads/qr.png"
                className={inputClass}
              />
            </div>
            <button type="submit" disabled={upiSaving} className={btnClass(upiSaved)}>
              {upiSaved ? <CheckCircle className="h-4 w-4" /> : upiSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {upiSaved ? "UPI QR Saved!" : upiSaving ? "Saving..." : "Save UPI QR Code"}
            </button>
          </form>
        </div>
      </div>

      {/* ─── 4. CHANGE PASSWORD ─── */}
      <div className="bg-[#1a4855] border border-[#EAB308]/20 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-[#EAB308] mb-5 flex items-center gap-2">
          <Key className="h-5 w-5" />
          Change Admin Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Old Password */}
          <div>
            <label className={labelClass}>Current Password</label>
            <div className="relative">
              <input
                required
                type={showOld ? "text" : "password"}
                value={passwordData.old_password}
                onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                placeholder="Enter current admin password"
                className={inputClass + " pr-12"}
              />
              <button
                type="button"
                onClick={() => setShowOld(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password & Confirm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>New Password</label>
              <div className="relative">
                <input
                  required
                  type={showNew ? "text" : "password"}
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="Min 6 characters"
                  className={inputClass + " pr-12"}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input
                required
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                placeholder="Re-enter new password"
                className={`${inputClass} ${passwordData.confirm_password && passwordData.confirm_password !== passwordData.new_password ? "border-red-500/60" : ""}`}
              />
              {passwordData.confirm_password && passwordData.confirm_password !== passwordData.new_password && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Passwords do not match</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={pwSaving || (passwordData.confirm_password && passwordData.confirm_password !== passwordData.new_password)}
            className={btnClass(pwSaved)}
          >
            {pwSaved ? <CheckCircle className="h-4 w-4" /> : pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
            {pwSaved ? "Password Changed Successfully!" : pwSaving ? "Updating Password..." : "Change Admin Password"}
          </button>
        </form>
      </div>

      {/* ===== Porter Integration Section ===== */}
      <div className="bg-[#1a4855] border border-[#EAB308]/15 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/30">
            <span className="text-white text-lg">🛵</span>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Porter Delivery Integration</h3>
            <p className="text-gray-400 text-xs">On-demand intracity delivery service for when in-house riders aren't available</p>
          </div>
        </div>

        <PorterConfigPanel />
      </div>
    </div>
  );
};

export default Settings;
