import React, { useState, useEffect } from "react";
import { Upload, Volume2, Check, ShoppingBag, UtensilsCrossed, Loader2, Play, Music } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";

const SoundSettings = () => {
  const { toast } = useToast();
  const [onlineSoundUrl, setOnlineSoundUrl] = useState(null);
  const [dineinSoundUrl, setDineinSoundUrl] = useState(null);
  const [uploading, setUploading] = useState({ online: false, dinein: false });
  const [playing, setPlaying] = useState({ online: false, dinein: false, default: false });

  useEffect(() => {
    fetchCurrentSounds();
  }, []);

  const formatSoundUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE}${url}`;
  };

  const fetchCurrentSounds = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [onlineRes, dineinRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/api/admin/notification-sound`, { headers }),
        axios.get(`${API_BASE}/api/admin/notification-sound/dinein`, { headers })
      ]);

      if (onlineRes.status === "fulfilled" && onlineRes.value.data?.url) {
        setOnlineSoundUrl(formatSoundUrl(onlineRes.value.data.url));
      }

      if (dineinRes.status === "fulfilled" && dineinRes.value.data?.url) {
        setDineinSoundUrl(formatSoundUrl(dineinRes.value.data.url));
      }
    } catch (error) {
      console.log("Failed to fetch sounds:", error);
    }
  };

  const handleSoundUpload = async (file, type) => {
    if (!file) return;

    const validExtensions = ["mp3", "wav", "ogg", "webm", "m4a", "aac"];
    const ext = file.name.split(".").pop().toLowerCase();
    const isAudio = file.type.startsWith("audio/") || validExtensions.includes(ext);

    if (!isAudio) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an audio file (MP3, WAV, OGG, WebM, M4A)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Audio file must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("file", file);

      const endpoint = type === "dinein" 
        ? `${API_BASE}/api/admin/upload/sound/dinein`
        : `${API_BASE}/api/admin/upload/sound`;

      const response = await axios.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success && response.data.url) {
        const fullUrl = formatSoundUrl(response.data.url);
        if (type === "dinein") {
          setDineinSoundUrl(fullUrl);
        } else {
          setOnlineSoundUrl(fullUrl);
        }
        toast({
          title: "🎉 Sound Updated!",
          description: `${type === "dinein" ? "Dine-In" : "Online"} order notification sound saved successfully`,
        });

        // Test the new sound immediately
        try {
          const audio = new Audio(fullUrl);
          audio.volume = 0.8;
          audio.play().catch(() => {});
        } catch {}
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.detail || "Failed to upload sound",
        variant: "destructive",
      });
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const playSound = (url, key) => {
    const soundTarget = url || "/notification.wav";
    setPlaying(prev => ({ ...prev, [key]: true }));

    try {
      const audio = new Audio(soundTarget);
      audio.volume = 0.8;
      audio.onended = () => setPlaying(prev => ({ ...prev, [key]: false }));
      audio.onerror = () => {
        setPlaying(prev => ({ ...prev, [key]: false }));
        toast({
          title: "Audio Playback Failed",
          description: "Click anywhere on the screen first or check audio file format.",
          variant: "destructive"
        });
      };
      audio.play().catch(() => {
        setPlaying(prev => ({ ...prev, [key]: false }));
        toast({
          title: "Permission Needed",
          description: "Click on the page to enable audio playback in your browser.",
          variant: "destructive"
        });
      });
    } catch (err) {
      setPlaying(prev => ({ ...prev, [key]: false }));
    }
  };

  const SoundCard = ({ type, title, subtitle, icon: Icon, soundUrl, accentColor }) => (
    <div className="bg-[#1a4855] border border-[#EAB308]/20 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-xl" style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}>
            <Icon className="h-6 w-6" style={{ color: accentColor }} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-gray-400 text-xs">{subtitle}</p>
          </div>
        </div>

        {/* Current Sound Status */}
        <div className="mb-5 bg-[#0f2933] border border-[#EAB308]/10 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {soundUrl ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-gray-200 font-medium truncate">Custom sound active</span>
                </>
              ) : (
                <>
                  <Music className="w-4 h-4 text-[#EAB308] shrink-0" />
                  <span className="text-xs text-gray-400">Using default royal chime</span>
                </>
              )}
            </div>

            <button
              onClick={() => playSound(soundUrl, type)}
              disabled={playing[type]}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-black flex items-center gap-1.5 transition-all active:scale-95 shadow shrink-0"
              style={{ background: accentColor }}
            >
              {playing[type] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{playing[type] ? "Playing..." : "Test Sound"}</span>
            </button>
          </div>
        </div>

        {/* Upload Box */}
        <div className="border-2 border-dashed border-[#EAB308]/25 rounded-xl p-6 text-center hover:border-[#EAB308]/60 transition-colors bg-[#07131a]/40">
          <input
            type="file"
            id={`sound-upload-${type}`}
            accept="audio/*,.mp3,.wav,.ogg,.webm,.m4a,.aac"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) handleSoundUpload(file, type);
            }}
            className="hidden"
            disabled={uploading[type]}
          />
          
          <label
            htmlFor={`sound-upload-${type}`}
            className={`block cursor-pointer ${uploading[type] ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading[type] ? (
              <Loader2 className="w-8 h-8 text-[#EAB308] mx-auto mb-2 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-[#EAB308] mx-auto mb-2" />
            )}
            <p className="text-white font-semibold text-sm mb-0.5">
              {uploading[type] ? "Uploading audio..." : "Click to upload custom sound"}
            </p>
            <p className="text-gray-400 text-[11px]">Supports MP3, WAV, OGG, WebM, M4A (Max 10MB)</p>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold text-[#EAB308]" style={{ fontFamily: "Playfair Display, serif" }}>
          Notification Sound Settings
        </h2>
        <p className="text-gray-300 text-sm mt-1">Configure audio alerts for new online orders and dine-in table requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Online Orders Sound */}
        <SoundCard
          type="online"
          title="Online Orders"
          subtitle="Alert when online delivery order is placed"
          icon={ShoppingBag}
          soundUrl={onlineSoundUrl}
          accentColor="#EAB308"
        />

        {/* Dine-In Orders Sound */}
        <SoundCard
          type="dinein"
          title="Table Dine-In Orders"
          subtitle="Alert when QR table order is placed"
          icon={UtensilsCrossed}
          soundUrl={dineinSoundUrl}
          accentColor="#60A5FA"
        />
      </div>

      {/* Default Chime & Tips Card */}
      <div className="bg-[#1a4855]/60 border border-[#EAB308]/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-white font-semibold text-sm flex items-center gap-2">
            <span>🔊 Default System Sound</span>
          </h4>
          <p className="text-gray-400 text-xs mt-1">
            If no custom sound is uploaded, our signature Persian chime plays automatically.
          </p>
        </div>
        <button
          onClick={() => playSound("/notification.wav", "default")}
          disabled={playing.default}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-2 transition-all shrink-0 border border-white/10"
        >
          {playing.default ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EAB308]" /> : <Volume2 className="w-3.5 h-3.5 text-[#EAB308]" />}
          <span>Test Default Chime</span>
        </button>
      </div>
    </div>
  );
};

export default SoundSettings;
