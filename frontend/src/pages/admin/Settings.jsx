import React, { useState, useEffect, useRef } from "react";
import {
  Save, Key, Eye, EyeOff, Image, CheckCircle,
  Upload, Play, Music, ShoppingBag, UtensilsCrossed, Loader2
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";
import { cx, Page, PageHeader, Button, Segmented, StatusPill, Switch, FormField, FormGroup, FormRow, Input, LoadingState } from "./ui";

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

  if (loading) return <div className="px-4 py-3 text-[14px] text-[var(--a-text-2)]">Checking Porter configuration…</div>;
  if (!config) return <div className="px-4 py-3 text-[14px] text-[var(--a-error)]">Could not reach the backend to check Porter status.</div>;

  return (
    <>
      <FormRow label="Porter API" hint={config.configured ? `Environment: ${config.environment === "sandbox" ? "Sandbox (testing)" : "Production"}` : "Add PORTER_API_KEY to backend/.env to activate"}>
        <StatusPill tone={config.configured ? "success" : "error"} dot>{config.configured ? "Connected" : "Key not set"}</StatusPill>
      </FormRow>
      <FormRow label="Pickup name"><span className="text-[14px] text-[var(--a-text-2)]">{config.restaurant_name}</span></FormRow>
      <FormRow label="Coordinates"><span className="text-[14px] text-[var(--a-text-2)] pd-tabular">{config.restaurant_lat}, {config.restaurant_lng}</span></FormRow>
      <div className="flex items-start justify-between gap-4 px-4 py-3">
        <span className="text-[15px] text-[var(--a-text)] shrink-0">Address</span>
        <span className="text-[14px] text-[var(--a-text-2)] text-right">{config.restaurant_address}</span>
      </div>
      <FormRow label="0 – 10 km"><span className="text-[14px] text-[var(--a-success)]">Free (customer pays ₹0)</span></FormRow>
      <FormRow label="10 – 20 km"><span className="text-[14px] text-[var(--a-text)] pd-tabular">₹60 from customer</span></FormRow>
      <FormRow label="Porter's cost"><span className="text-[14px] text-[var(--a-text-2)] pd-tabular">~₹50–120 (restaurant absorbs)</span></FormRow>
      {!config.configured && (
        <div className="px-4 py-3 text-[13px] leading-5 text-[var(--a-text-2)]">
          <div className="font-medium text-[var(--a-text)] mb-1">Setup steps</div>
          <ol className="list-decimal pl-4 space-y-0.5">
            <li>Go to porter.in/enterprise and request API access</li>
            <li>Receive the API key from the Porter team</li>
            <li>Set <code className="px-1 rounded bg-[var(--a-fill)]">PORTER_API_KEY=your_key</code> in <code className="px-1 rounded bg-[var(--a-fill)]">backend/.env</code></li>
            <li>Change <code className="px-1 rounded bg-[var(--a-fill)]">PORTER_API_BASE_URL</code> to the production URL when ready</li>
            <li>Restart the backend server</li>
          </ol>
        </div>
      )}
    </>
  );
};

// ── Order Acceptance & Dispatch Automation Panel ─────────────────────────────
const OrderAcceptanceConfigPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [acceptanceSettings, setAcceptanceSettings] = useState({
    mode: "manual",
    delay_seconds: 45,
    auto_assign_porter: true,
    porter_mock_mode: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        const { data } = await axios.get(`${API_BASE}/api/admin/order-acceptance-settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data) {
          setAcceptanceSettings({
            mode: data.mode || "manual",
            delay_seconds: data.delay_seconds || 45,
            auto_assign_porter: data.auto_assign_porter !== false,
            porter_mock_mode: data.porter_mock_mode !== false
          });
        }
      } catch (e) {
        console.error("Failed to load acceptance settings:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(`${API_BASE}/api/admin/order-acceptance-settings`, acceptanceSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.setItem("pd_order_acceptance_mode", acceptanceSettings.mode);
      setSaved(true);
      toast({
        title: "Settings Saved",
        description: `Order acceptance mode set to ${acceptanceSettings.mode.toUpperCase()} (${acceptanceSettings.delay_seconds}s timeout).`
      });
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast({
        title: "Save Failed",
        description: err.response?.data?.detail || "Could not save acceptance settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="px-4 py-3 text-[14px] text-[var(--a-text-2)]">Loading acceptance settings…</div>;

  return (
    <>
      <div className="px-4 py-3 space-y-2">
        <Segmented
          stretch
          value={acceptanceSettings.mode}
          onChange={(v) => setAcceptanceSettings(prev => ({ ...prev, mode: v }))}
          options={[{ value: "manual", label: "Manual acceptance" }, { value: "auto", label: "Auto-acceptance" }]}
        />
        <p className="text-[13px] leading-[18px] text-[var(--a-text-2)]">
          {acceptanceSettings.mode === "manual"
            ? "Incoming orders stay as placed until a manager or captain reviews them and taps Accept."
            : `If not accepted within ${acceptanceSettings.delay_seconds}s, the order is accepted automatically, the KOT goes to the kitchen and a Porter rider is assigned.`}
        </p>
      </div>
      <FormRow label="Auto-accept timeout" hint="Time staff has to review before the system accepts">
        <Segmented
          size="sm"
          value={acceptanceSettings.delay_seconds}
          onChange={(sec) => setAcceptanceSettings(prev => ({ ...prev, delay_seconds: sec }))}
          options={[45, 50, 60].map(sec => ({ value: sec, label: `${sec}s` }))}
        />
      </FormRow>
      <FormRow
        label="Porter mock mode"
        hint={acceptanceSettings.porter_mock_mode
          ? "Simulates Porter bookings with sample rider details for demos, without API charges"
          : "Uses the live Porter API"}
      >
        <Switch
          checked={acceptanceSettings.porter_mock_mode}
          onChange={() => setAcceptanceSettings(prev => ({ ...prev, porter_mock_mode: !prev.porter_mock_mode }))}
          label="Porter mock mode"
        />
      </FormRow>
      <div className="px-4 py-3 flex justify-end">
        <Button variant={saved ? "success" : "primary"} icon={saved ? CheckCircle : Save} onClick={handleSave} disabled={saving}>
          {saved ? "Saved" : saving ? "Saving…" : "Save Acceptance Settings"}
        </Button>
      </div>
    </>
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
      toast({ title: "Password Changed", description: "Admin password updated successfully" });
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
      toast({ title: "Saved!", description: "Restaurant information updated successfully" });
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
      toast({ title: "Saved!", description: "UPI QR code saved successfully" });
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
        toast({ title: "UPI QR Uploaded & Saved!", description: "QR code is now live on table checkout" });
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
          title: "Sound Uploaded!",
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
    return <LoadingState rows={4} label="Loading settings" />;
  }

  const SoundRow = ({ type, label, url, Icon }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="h-8 w-8 rounded-[8px] bg-[var(--a-fill)] flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-[var(--a-text-2)]" /></span>
        <div className="min-w-0">
          <div className="text-[15px] text-[var(--a-text)]">{label}</div>
          <div className="text-[12px] text-[var(--a-text-3)]">{url ? "Custom audio file active" : "Using the default Persian chime"}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="tinted" icon={Play} onClick={() => playSound(url, type)} disabled={playingSound[type]}>
          {playingSound[type] ? "Playing…" : "Test"}
        </Button>
        <label
          htmlFor={`sound-upload-${type}`}
          className={cx("inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] text-[13px] font-medium bg-[var(--a-fill)] text-[var(--a-text)] cursor-pointer pd-press", uploadingSound[type] && "opacity-50 pointer-events-none")}
        >
          {uploadingSound[type] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploadingSound[type] ? "Uploading…" : "Upload"}
        </label>
        <input
          type="file"
          id={`sound-upload-${type}`}
          accept="audio/*,.mp3,.wav,.ogg,.webm,.m4a"
          onChange={(e) => {
            if (e.target.files[0]) handleSoundUpload(e.target.files[0], type);
          }}
          className="hidden"
        />
      </div>
    </div>
  );

  const pwMismatch = passwordData.confirm_password && passwordData.confirm_password !== passwordData.new_password;

  return (
    <Page className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Restaurant details, notification sounds, UPI payments and admin security" />

      {/* Notification sounds */}
      <FormGroup title="Notification sounds">
        <SoundRow type="online" label="Online orders" url={onlineSoundUrl} Icon={ShoppingBag} />
        <SoundRow type="dinein" label="Table dine-in orders" url={dineinSoundUrl} Icon={UtensilsCrossed} />
        <FormRow label="Default chime">
          <Button size="sm" variant="tinted" icon={playingSound.default ? Loader2 : Music} onClick={() => playSound("/notification.wav", "default")} disabled={playingSound.default}>
            Test Default Chime
          </Button>
        </FormRow>
      </FormGroup>

      {/* Contact */}
      <form onSubmit={handleContactUpdate}>
        <FormGroup title="Restaurant and contact information">
          <div className="p-4 space-y-4">
            <FormField label="Address">
              <Input required value={contactInfo.address} onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })} placeholder="FC Road, Deccan Gymkhana, Pune, Maharashtra 411004" />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Phone number">
                <Input required value={contactInfo.phone} onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })} placeholder="+91 20 1234 5678" />
              </FormField>
              <FormField label="Email address">
                <Input required type="email" value={contactInfo.email} onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} placeholder="reservations@persiandarbar.in" />
              </FormField>
            </div>
            <FormField label="Opening hours">
              <Input value={contactInfo.opening_hours} onChange={(e) => setContactInfo({ ...contactInfo, opening_hours: e.target.value })} placeholder="11:00 AM – 11:30 PM (Daily)" />
            </FormField>
          </div>
          <div className="px-4 py-3 flex justify-end">
            <Button type="submit" variant={contactSaved ? "success" : "primary"} icon={contactSaved ? CheckCircle : Save} disabled={contactSaving}>
              {contactSaved ? "Saved" : contactSaving ? "Saving…" : "Save Restaurant Details"}
            </Button>
          </div>
        </FormGroup>
      </form>

      {/* UPI */}
      <form onSubmit={handleUPIUpdate}>
        <FormGroup title="UPI QR code payment" footer="Customers see this QR code at table checkout.">
          <div className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="h-40 w-40 shrink-0 rounded-[12px] border border-[var(--a-line)] bg-white p-2 flex items-center justify-center self-center sm:self-start">
              {upiQRCode
                ? <img src={upiQRCode} alt="UPI QR Code" className="h-full w-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                : <Image className="h-8 w-8 text-[#8A949C]" />}
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <input ref={upiFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUPIImageUpload(e.target.files[0])} />
              <Button variant="tinted" icon={uploadingUpi ? Loader2 : Upload} onClick={() => upiFileRef.current?.click()} disabled={uploadingUpi}>
                {uploadingUpi ? "Uploading QR image…" : "Upload QR image"}
              </Button>
              <FormField label="Or QR image URL" hint="PNG, JPG or WEBP">
                <Input value={upiQRCode} onChange={(e) => setUpiQRCode(e.target.value)} placeholder="https://example.com/upi-qr.png or /static/uploads/qr.png" />
              </FormField>
            </div>
          </div>
          <div className="px-4 py-3 flex justify-end">
            <Button type="submit" variant={upiSaved ? "success" : "primary"} icon={upiSaved ? CheckCircle : Save} disabled={upiSaving}>
              {upiSaved ? "Saved" : upiSaving ? "Saving…" : "Save UPI QR Code"}
            </Button>
          </div>
        </FormGroup>
      </form>

      {/* Password */}
      <form onSubmit={handlePasswordChange}>
        <FormGroup title="Admin password">
          <div className="p-4 space-y-4">
            <FormField label="Current password">
              <div className="relative">
                <Input required type={showOld ? "text" : "password"} value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })} placeholder="Current admin password" className="pr-11" />
                <button type="button" onClick={() => setShowOld(v => !v)} aria-label={showOld ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-[8px] text-[var(--a-text-3)] hover:bg-[var(--a-fill)] cursor-pointer">
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="New password">
                <div className="relative">
                  <Input required type={showNew ? "text" : "password"} value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })} placeholder="At least 6 characters" className="pr-11" />
                  <button type="button" onClick={() => setShowNew(v => !v)} aria-label={showNew ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-[8px] text-[var(--a-text-3)] hover:bg-[var(--a-fill)] cursor-pointer">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>
              <FormField label="Confirm new password" error={pwMismatch ? "Passwords do not match" : undefined}>
                <Input required type="password" value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })} placeholder="Re-enter new password"
                  className={pwMismatch ? "!border-[var(--a-error)]" : ""} />
              </FormField>
            </div>
          </div>
          <div className="px-4 py-3 flex justify-end">
            <Button type="submit" variant={pwSaved ? "success" : "primary"} icon={pwSaved ? CheckCircle : Key} disabled={pwSaving || pwMismatch}>
              {pwSaved ? "Password Changed" : pwSaving ? "Updating…" : "Change Admin Password"}
            </Button>
          </div>
        </FormGroup>
      </form>

      {/* Order acceptance */}
      <FormGroup title="Order acceptance and auto-dispatch" footer="Manual or automatic acceptance (45–60 s), kitchen KOT routing and Porter rider allocation.">
        <OrderAcceptanceConfigPanel />
      </FormGroup>

      {/* Porter */}
      <FormGroup title="Porter delivery integration" footer="On-demand intracity delivery when in-house riders aren't available.">
        <PorterConfigPanel />
      </FormGroup>
    </Page>
  );
};

export default Settings;
