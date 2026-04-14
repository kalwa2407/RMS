import React, { useState, useEffect, useRef } from "react";
import { Upload, Volume2, Check, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "");

const SoundSettings = () => {
  const { toast } = useToast();
  const [onlineSoundUrl, setOnlineSoundUrl] = useState(null);
  const [dineinSoundUrl, setDineinSoundUrl] = useState(null);
  const [uploading, setUploading] = useState({ online: false, dinein: false });
  const onlineAudioRef = useRef(null);
  const dineinAudioRef = useRef(null);

  useEffect(() => {
    fetchCurrentSounds();
  }, []);

  const fetchCurrentSounds = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      
      // Fetch online order sound
      const onlineRes = await axios.get(`${API_BASE}/api/admin/notification-sound`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (onlineRes.data.url) {
        setOnlineSoundUrl(`${API_BASE}${onlineRes.data.url}`);
      }

      // Fetch dine-in order sound
      const dineinRes = await axios.get(`${API_BASE}/api/admin/notification-sound/dinein`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (dineinRes.data.url) {
        setDineinSoundUrl(`${API_BASE}${dineinRes.data.url}`);
      }
    } catch (error) {
      console.log("Failed to fetch sounds:", error);
    }
  };

  const handleSoundUpload = async (file, type) => {
    if (!file) return;

    const validTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload MP3, WAV, OGG, or WebM audio file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Audio file must be less than 5MB",
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

      if (response.data.success) {
        if (type === "dinein") {
          setDineinSoundUrl(`${API_BASE}${response.data.url}`);
        } else {
          setOnlineSoundUrl(`${API_BASE}${response.data.url}`);
        }
        toast({
          title: "Success! 🎉",
          description: `${type === "dinein" ? "Dine-In" : "Online"} notification sound updated`,
        });
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

  const testSound = (type) => {
    const audioRef = type === "dinein" ? dineinAudioRef : onlineAudioRef;
    const soundUrl = type === "dinein" ? dineinSoundUrl : onlineSoundUrl;
    
    if (soundUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        toast({
          title: "Cannot Play",
          description: "Failed to play sound. Check browser permissions.",
          variant: "destructive",
        });
      });
    } else {
      toast({
        title: "No Sound",
        description: "Please upload a notification sound first",
        variant: "destructive",
      });
    }
  };

  const SoundCard = ({ type, title, icon: Icon, soundUrl, audioRef, color }) => (
    <div className={`bg-white/[0.03] border-2 border-${color}-500/30 rounded-2xl p-6`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className={`bg-${color}-500/20 p-3 rounded-xl`}>
          <Icon className={`h-6 w-6 text-${color}-500`} />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="text-gray-400 text-sm">Notification Sound</p>
        </div>
      </div>

      {/* Current Sound */}
      <div className="mb-4">
        {soundUrl ? (
          <div className="bg-[#050b10] rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-gray-300">Custom sound uploaded</span>
            </div>
            <button
              onClick={() => testSound(type)}
              className={`bg-${color}-600 text-white px-4 py-2 rounded-lg hover:bg-${color}-700 transition-colors flex items-center gap-2`}
              style={{ backgroundColor: color === "yellow" ? "#EAB308" : color === "blue" ? "#3B82F6" : "" }}
            >
              <Volume2 className="w-4 h-4" />
              Test
            </button>
          </div>
        ) : (
          <div className="bg-[#050b10] rounded-lg p-4">
            <p className="text-gray-400">Using default notification sound</p>
          </div>
        )}
      </div>

      {/* Upload */}
      <div className="border-2 border-dashed border-white/5 rounded-lg p-6 text-center hover:border-primary/20 transition-colors">
        <input
          type="file"
          id={`sound-upload-${type}`}
          accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/webm"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) handleSoundUpload(file, type);
          }}
          className="hidden"
          disabled={uploading[type]}
        />
        
        <label
          htmlFor={`sound-upload-${type}`}
          className={`cursor-pointer ${uploading[type] ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">
            {uploading[type] ? "Uploading..." : "Click to upload"}
          </p>
          <p className="text-gray-400 text-xs">MP3, WAV, OGG (Max 5MB)</p>
        </label>
      </div>

      {soundUrl && <audio ref={audioRef} src={soundUrl} preload="auto" />}
    </div>
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-primary mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
        Notification Sound Settings
      </h2>
      <p className="text-gray-400 mb-8">Configure different sounds for online and dine-in orders</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Online Orders Sound */}
        <SoundCard
          type="online"
          title="Online Orders"
          icon={ShoppingBag}
          soundUrl={onlineSoundUrl}
          audioRef={onlineAudioRef}
          color="yellow"
        />

        {/* Dine-In Orders Sound */}
        <SoundCard
          type="dinein"
          title="Table Dine-In"
          icon={UtensilsCrossed}
          soundUrl={dineinSoundUrl}
          audioRef={dineinAudioRef}
          color="blue"
        />
      </div>

      {/* Info */}
      <div className="mt-6 bg-gray-800/50 rounded-lg p-4 max-w-4xl">
        <h4 className="text-white font-semibold mb-2">💡 Tips:</h4>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• Use different sounds to easily distinguish between online and dine-in orders</li>
          <li>• Choose short sounds (1-3 seconds) that grab attention</li>
          <li>• Test sounds after uploading to ensure they work correctly</li>
        </ul>
      </div>
    </div>
  );
};

export default SoundSettings;


