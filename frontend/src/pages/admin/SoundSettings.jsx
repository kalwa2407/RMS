import React, { useState, useEffect } from "react";
import { Upload, Volume2, Check, ShoppingBag, UtensilsCrossed, Loader2, Play, Music } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";
import { cx, Page, PageHeader, Button, StatusPill, FormGroup, FormRow } from "./ui";

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
          title: "Sound Updated!",
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

  const SoundCard = ({ type, title, subtitle, icon: Icon, soundUrl }) => (
    <section className="space-y-1.5">
      <h4 className="px-1 text-[12px] leading-4 font-medium uppercase tracking-[0.04em] text-[var(--a-text-3)]">{title}</h4>
      <div className="rounded-[12px] border border-[var(--a-line)] bg-[var(--a-card)] divide-y divide-[var(--a-line)] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="h-8 w-8 rounded-[8px] bg-[var(--a-fill)] flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-[var(--a-text-2)]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] text-[var(--a-text)]">{subtitle}</div>
            <div className="mt-0.5">
              {soundUrl
                ? <StatusPill tone="success" icon={Check}>Custom sound active</StatusPill>
                : <StatusPill tone="neutral" icon={Music}>Default chime</StatusPill>}
            </div>
          </div>
          <Button
            size="sm"
            variant="tinted"
            icon={playing[type] ? Loader2 : Play}
            onClick={() => playSound(soundUrl, type)}
            disabled={playing[type]}
          >
            {playing[type] ? "Playing…" : "Test Sound"}
          </Button>
        </div>
        <label
          htmlFor={`sound-upload-${type}`}
          className={cx("flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--a-fill)]", uploading[type] && "opacity-50 cursor-not-allowed")}
        >
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
          <span className="h-8 w-8 rounded-[8px] bg-[var(--a-fill)] flex items-center justify-center shrink-0">
            {uploading[type] ? <Loader2 className="h-4 w-4 animate-spin text-[var(--a-text-2)]" /> : <Upload className="h-4 w-4 text-[var(--a-text-2)]" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] text-[var(--a-accent)]">{uploading[type] ? "Uploading audio…" : "Upload custom sound"}</div>
            <div className="text-[12px] text-[var(--a-text-3)]">MP3, WAV, OGG, WebM or M4A, up to 10 MB</div>
          </div>
        </label>
      </div>
    </section>
  );

  return (
    <Page className="max-w-3xl">
      <PageHeader title="Sounds" subtitle="Audio alerts for new online orders and dine-in table requests" />

      <SoundCard type="online" title="Online orders" subtitle="Plays when an online delivery order is placed" icon={ShoppingBag} soundUrl={onlineSoundUrl} />
      <SoundCard type="dinein" title="Dine-in orders" subtitle="Plays when a QR table order is placed" icon={UtensilsCrossed} soundUrl={dineinSoundUrl} />

      <FormGroup title="Default" footer="If no custom sound is uploaded, the signature Persian chime plays.">
        <FormRow label="Default system chime">
          <Button size="sm" variant="tinted" icon={playing.default ? Loader2 : Volume2} onClick={() => playSound("/notification.wav", "default")} disabled={playing.default}>
            Test Default Chime
          </Button>
        </FormRow>
      </FormGroup>
    </Page>
  );
};

export default SoundSettings;
