/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Home, Sparkles, MessageSquare, BarChart3, Shield, Star, Crown, HelpCircle,
  PlusCircle, Heart, Share2, Bookmark, Flame, Image, Search, Bell, Navigation, 
  MapPin, Edit3, Music, Check, CheckCircle, ChevronRight, X, ArrowLeft, ArrowRight, RefreshCw, Disc,
  ListMusic, Sun, Moon, Cloud, Mail, Upload, Play, Pause, VolumeX, Volume2, Minimize2, Maximize2, LogOut, FileText
} from "lucide-react";
import { Post, Song, User, Comment, Story, Message, Notification, Playlist, MoodType } from "./types";
import FeedCard from "./components/FeedCard";
import DirectMessages from "./components/DirectMessages";
import MoodAnalytics from "./components/MoodAnalytics";
import Discovery from "./components/Discovery";
import AdminPanel from "./components/AdminPanel";
import CollaborativePlaylists from "./components/CollaborativePlaylists";
import WorkspaceHub from "./components/WorkspaceHub";

const MOOD_THEMES: Record<MoodType, {
  name: string;
  emoji: string;
  colorName: string;
  lightBg: string;
  darkBg: string;
  primaryButton: string;
  accentText: string;
  borderColor: string;
  sparkleColor: string;
  softBg: string;
  glowClass: string;
}> = {
  Happy: {
    name: "Happy",
    emoji: "☀️",
    colorName: "amber",
    lightBg: "bg-amber-50/30",
    darkBg: "bg-amber-950/20",
    primaryButton: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10",
    accentText: "text-amber-600 dark:text-amber-400 font-semibold",
    borderColor: "border-amber-200 dark:border-amber-900/45",
    sparkleColor: "text-amber-500",
    softBg: "bg-amber-50/80 dark:bg-amber-950/40",
    glowClass: "from-amber-400/15 via-transparent to-transparent"
  },
  Sad: {
    name: "Sad",
    emoji: "🌧️",
    colorName: "sky",
    lightBg: "bg-sky-50/30",
    darkBg: "bg-sky-950/20",
    primaryButton: "bg-sky-500 hover:bg-sky-655 text-white shadow-sky-500/10",
    accentText: "text-sky-500 dark:text-sky-400 font-semibold",
    borderColor: "border-sky-200 dark:border-sky-900/45",
    sparkleColor: "text-sky-500",
    softBg: "bg-sky-50/80 dark:bg-sky-950/40",
    glowClass: "from-sky-400/15 via-transparent to-transparent"
  },
  Excited: {
    name: "Excited",
    emoji: "⚡",
    colorName: "fuchsia",
    lightBg: "bg-fuchsia-50/30",
    darkBg: "bg-fuchsia-950/20",
    primaryButton: "bg-fuchsia-500 hover:bg-fuchsia-600 text-white shadow-fuchsia-500/10",
    accentText: "text-fuchsia-500 dark:text-fuchsia-400 font-semibold",
    borderColor: "border-fuchsia-200 dark:border-fuchsia-900/45",
    sparkleColor: "text-fuchsia-500",
    softBg: "bg-fuchsia-50/80 dark:bg-fuchsia-950/40",
    glowClass: "from-fuchsia-400/15 via-transparent to-transparent"
  },
  Motivated: {
    name: "Motivated",
    emoji: "🔥",
    colorName: "emerald",
    lightBg: "bg-emerald-50/30",
    darkBg: "bg-emerald-950/20",
    primaryButton: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/10",
    accentText: "text-emerald-500 dark:text-emerald-400 font-semibold",
    borderColor: "border-emerald-250 dark:border-emerald-900/45",
    sparkleColor: "text-emerald-500",
    softBg: "bg-emerald-50/80 dark:bg-emerald-950/40",
    glowClass: "from-emerald-400/15 via-transparent to-transparent"
  },
  Relaxed: {
    name: "Relaxed",
    emoji: "🍃",
    colorName: "indigo",
    lightBg: "bg-indigo-50/30",
    darkBg: "bg-indigo-950/20",
    primaryButton: "bg-indigo-650 hover:bg-indigo-700 text-white shadow-indigo-600/10",
    accentText: "text-indigo-600 dark:text-indigo-400 font-semibold",
    borderColor: "border-indigo-150 dark:border-indigo-900/45",
    sparkleColor: "text-indigo-550",
    softBg: "bg-indigo-50/80 dark:bg-indigo-950/40",
    glowClass: "from-indigo-400/15 via-transparent to-transparent"
  },
  Angry: {
    name: "Angry",
    emoji: "💢",
    colorName: "red",
    lightBg: "bg-red-50/30",
    darkBg: "bg-red-950/20",
    primaryButton: "bg-red-500 hover:bg-red-600 text-white shadow-red-500/10",
    accentText: "text-red-500 dark:text-red-400 font-semibold",
    borderColor: "border-red-200 dark:border-red-900/45",
    sparkleColor: "text-red-500",
    softBg: "bg-red-50/80 dark:bg-red-950/40",
    glowClass: "from-red-400/15 via-transparent to-transparent"
  },
  Heartbroken: {
    name: "Heartbroken",
    emoji: "💔",
    colorName: "rose",
    lightBg: "bg-rose-50/30",
    darkBg: "bg-rose-950/20",
    primaryButton: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/10",
    accentText: "text-rose-500 dark:text-rose-400 font-semibold",
    borderColor: "border-rose-200 dark:border-rose-900/45",
    sparkleColor: "text-rose-500",
    softBg: "bg-rose-50/80 dark:bg-rose-950/40",
    glowClass: "from-rose-400/15 via-transparent to-transparent"
  },
  Grateful: {
    name: "Grateful",
    emoji: "🙏",
    colorName: "teal",
    lightBg: "bg-teal-50/30",
    darkBg: "bg-teal-950/20",
    primaryButton: "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-650/10",
    accentText: "text-teal-600 dark:text-teal-400 font-semibold",
    borderColor: "border-teal-200 dark:border-teal-900/45",
    sparkleColor: "text-teal-500",
    softBg: "bg-teal-50/80 dark:bg-teal-950/40",
    glowClass: "from-teal-400/15 via-transparent to-transparent"
  },
  Tired: {
    name: "Tired",
    emoji: "💤",
    colorName: "slate",
    lightBg: "bg-slate-50/30",
    darkBg: "bg-slate-950/20",
    primaryButton: "bg-slate-600 hover:bg-slate-700 text-white shadow-slate-605/10",
    accentText: "text-slate-600 dark:text-slate-400 font-semibold",
    borderColor: "border-slate-200 dark:border-slate-900/45",
    sparkleColor: "text-slate-500",
    softBg: "bg-slate-50/80 dark:bg-slate-950/40",
    glowClass: "from-slate-400/15 via-transparent to-transparent"
  }
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("themeMode") === "dark";
    } catch {
      return false;
    }
  });
  const [currentDisplayMood, setCurrentDisplayMood] = useState<MoodType>("Relaxed");

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem("isLoggedIn") === "true";
    } catch {
      return false;
    }
  });
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Sub-modes for authentication (default to login mode first)
  const [authMode, setAuthMode] = useState<"register" | "login" | "google">("login");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerDisplayName, setRegisterDisplayName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerBio, setRegisterBio] = useState("");
  const [registerLocation, setRegisterLocation] = useState("");
  const [registerFavoriteSong, setRegisterFavoriteSong] = useState("");
  const [registerAvatar, setRegisterAvatar] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80");

  const handleCustomLogin = async (usernameStr: string) => {
    if (!usernameStr.trim()) {
      setLoginError("Please enter a username or select a profile below.");
      return;
    }
    try {
      setLoginError("");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameStr })
      });
      if (res.ok) {
        setIsLoggedIn(true);
        try {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("savedUsername", usernameStr.trim());
        } catch {}
        await bootstrapState();
      } else {
        const data = await res.json();
        setLoginError(data.error || "Login failed.");
      }
    } catch {
      setLoginError("Communication with authentication server failed.");
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCustomLogin(loginInput);
  };

  const handleGoogleLogin = async (email: string, name: string, avatar: string) => {
    try {
      setLoginError("");
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName: name, avatar })
      });
      if (res.ok) {
        setIsLoggedIn(true);
        try {
          localStorage.setItem("isLoggedIn", "true");
        } catch {}
        await bootstrapState();
      } else {
        setLoginError("Google Sign-In failed on the server.");
      }
    } catch {
      setLoginError("Google Sign-In connection failed.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUsername.trim() || !registerDisplayName.trim()) {
      setLoginError("Please enter both a username and a display name.");
      return;
    }
    try {
      setLoginError("");
      const res = await fetch("/api/auth/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerUsername,
          displayName: registerDisplayName,
          email: registerEmail,
          bio: registerBio,
          location: registerLocation,
          favoriteSong: registerFavoriteSong,
          avatar: registerAvatar,
        })
      });
      if (res.ok) {
        setIsLoggedIn(true);
        try {
          localStorage.setItem("isLoggedIn", "true");
        } catch {}
        await bootstrapState();
      } else {
        const errData = await res.json();
        setLoginError(errData.error || "Failed to create account.");
      }
    } catch {
      setLoginError("Failed to communicate with authentication server.");
    }
  };

  // Keyboard Escape listener for logging out
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isLoggedIn && event.key === "Escape") {
        setIsLoggedIn(false);
        try {
          localStorage.setItem("isLoggedIn", "false");
        } catch {}
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoggedIn]);

  // Navigation active tab index
  const [activeTab, setActiveTab] = useState<"home" | "discover" | "messages" | "analytics" | "profile" | "admin" | "playlists" | "workspace">("home");
  
  // PWA (Progressive Web App) Install States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(true); // Default to try showing install action controls
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Detect if already installed & running in PWA standalone window
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    if (isInStandaloneMode) {
      setIsAppInstalled(true);
      setShowInstallBanner(false);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      console.log('[PWA Engine] App successfully installed on this phone/computer!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerPwaInstallation = async () => {
    if (!deferredPrompt) {
      alert("📲 How to Download & Install:\n\n• ON PHONE (iOS Safari): Click the Share button at the bottom of the screen and select 'Add to Home Screen'.\n• ON PHONE (Android Chrome): Tap the three dots menu at the top-right and select 'Install app'.\n• ON LAPTOP / DESKTOP: Click the small monitor/arrow icon in the browser address bar at the top-right. Or tap 'Download App' within our layout panel!");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA Engine] User choice outcome: ${outcome}`);
    setDeferredPrompt(null);
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
      setShowInstallBanner(false);
    }
  };

  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [songsDb, setSongsDb] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [initialSelectedPlaylistId, setInitialSelectedPlaylistId] = useState<string | null>(null);

  // --- Real-time Persistent Global Player Engine States ---
  const [globalSong, setGlobalSong] = useState<Song | null>(null);
  const [isGlobalPlaying, setIsGlobalPlaying] = useState<boolean>(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState<boolean>(false);
  const [globalVolume, setGlobalVolume] = useState<number>(0.85);
  const [isGlobalMuted, setIsGlobalMuted] = useState<boolean>(false);
  const [globalCurrentTime, setGlobalCurrentTime] = useState<number>(0);
  const [globalDuration, setGlobalDuration] = useState<number>(1);
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);

  // Background Interactive Lyrics States
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [globalLyrics, setGlobalLyrics] = useState<string | null>(null);
  const [isLyricsLoading, setIsLyricsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!globalSong) {
      setGlobalLyrics(null);
      setIsLyricsOpen(false);
      return;
    }

    const fetchLyricsBackground = async () => {
      setIsLyricsLoading(true);
      setGlobalLyrics(null);
      try {
        const resp = await fetch(`/api/songs/lyrics?title=${encodeURIComponent(globalSong.title)}&artist=${encodeURIComponent(globalSong.artist)}`);
        if (resp.ok) {
          const data = await resp.json();
          setGlobalLyrics(data.lyrics || "Lyrics are preparing, tune in soon...");
        } else {
          setGlobalLyrics("No lyrics found for this beautiful track yet.");
        }
      } catch {
        setGlobalLyrics("Error compiling official lyrics from the Google AI ground search.");
      } finally {
        setIsLyricsLoading(false);
      }
    };

    fetchLyricsBackground();
  }, [globalSong?.trackId]);

  // --- Real-time Co-listening Lounge & AI DJ Radio States ---
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [sharedRoomListeners, setSharedRoomListeners] = useState<number>(0);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; char: string; left: number }[]>([]);
  const [sharedLoungeChat, setSharedLoungeChat] = useState<{
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    content: string;
    timestamp: string;
  }[]>([]);
  const [isAiDjSpeaking, setIsAiDjSpeaking] = useState<boolean>(false);
  const [aiDjSpeech, setAiDjSpeech] = useState<string>("");

  // Play a song globally
  const handlePlayGlobalSong = (song: Song, stationId: string | null = null) => {
    setIsPlayerMinimized(false);
    if (stationId) {
      setActiveStationId(stationId);
    } else {
      setActiveStationId(null);
    }

    setGlobalSong(song);
    setIsGlobalPlaying(true);

    if (mainAudioRef.current) {
      mainAudioRef.current.pause();
    }

    const audio = new Audio(song.previewUrl);
    audio.loop = true;
    audio.volume = isGlobalMuted ? 0 : globalVolume;
    mainAudioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      setGlobalCurrentTime(audio.currentTime);
    });
    audio.addEventListener("loadedmetadata", () => {
      setGlobalDuration(audio.duration || 180);
    });

    audio.play().catch((err) => {
      console.warn("Global browser playback blocked or interrupted:", err);
    });
  };

  const handlePauseGlobalSong = () => {
    setIsGlobalPlaying(false);
    if (mainAudioRef.current) {
      mainAudioRef.current.pause();
    }
  };

  const handleResumeGlobalSong = () => {
    if (globalSong) {
      setIsGlobalPlaying(true);
      if (mainAudioRef.current) {
        mainAudioRef.current.play().catch(() => {});
      }
    }
  };

  const handleSkipGlobal = (direction: number) => {
    if (songsDb.length === 0) return;
    const currentIndex = songsDb.findIndex(s => s.trackId === globalSong?.trackId);
    let nextIndex = currentIndex + direction;
    if (nextIndex >= songsDb.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = songsDb.length - 1;
    handlePlayGlobalSong(songsDb[nextIndex], activeStationId);
  };

  const handleSeekGlobal = (time: number) => {
    setGlobalCurrentTime(time);
    if (mainAudioRef.current) {
      mainAudioRef.current.currentTime = time;
    }
  };

  const handleVolumeGlobal = (vol: number) => {
    setGlobalVolume(vol);
    if (mainAudioRef.current) {
      mainAudioRef.current.volume = isGlobalMuted ? 0 : vol;
    }
  };

  const handleMuteGlobal = () => {
    const nextMute = !isGlobalMuted;
    setIsGlobalMuted(nextMute);
    if (mainAudioRef.current) {
      mainAudioRef.current.volume = nextMute ? 0 : globalVolume;
    }
  };

  const handleTuneToAiDjRadio = async () => {
    if (songsDb.length === 0) return;
    
    // Choose suitable songs
    let matchedSongs = songsDb.filter(s => {
      if (postMood === "Happy" || postMood === "Excited" || postMood === "Motivated") {
        return s.title === "Blinding Lights" || s.title === "Stronger" || s.title === "Feeling Good";
      }
      if (postMood === "Sad" || postMood === "Heartbroken") {
        return s.title === "Fix You" || s.title === "Ocean Eyes";
      }
      return s.title === "Midnight Lo-fi Vibe" || s.title === "As It Was" || s.title === "No Plan";
    });
    if (matchedSongs.length === 0) matchedSongs = songsDb;
    const song = matchedSongs[Math.floor(Math.random() * matchedSongs.length)] || songsDb[0];

    setIsAiDjSpeaking(true);
    setAiDjSpeech("DJ Spark is preparing to introduce the next song matching your mood... 🎙️");
    setActiveStationId("station_ai_radio");

    try {
      const resp = await fetch("/api/gemini/ai-dj/introduce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: currentUser?.displayName || "Listener",
          mood: postMood,
          songTitle: song.title,
          artist: song.artist
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setAiDjSpeech(data.introduction);
      } else {
        setAiDjSpeech(`Hey there ${currentUser?.displayName || "Friend"}! DJ Spark here on ọnọdụ AI Radio. I see you're carrying a lovely ${postMood} vibe. Let's float with "${song.title}" by ${song.artist}. Enjoy the sync.`);
      }
    } catch {
      setAiDjSpeech(`Welcome back to the stream, ${currentUser?.displayName || "Friend"}. This is DJ Spark selecting the perfect alignment for your ${postMood} day. Here is "${song.title}" by ${song.artist}. Tune in.`);
    }

    // Give 6.5 seconds of vocal monologue, then play the track
    setTimeout(() => {
      setIsAiDjSpeaking(false);
      handlePlayGlobalSong(song, "station_ai_radio");
    }, 6500);
  };

  // Simulated Co-listening Chat Rooms Comments Generator
  useEffect(() => {
    if (!activeStationId) {
      setSharedRoomListeners(0);
      setSharedLoungeChat([]);
      return;
    }

    const sampleChats: Record<string, typeof sharedLoungeChat> = {
      station_sun: [
        { id: "1", username: "chloe_vibe", displayName: "Chloe Harmony", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", content: "OMG i love this stream so much! Gold sunset hits on repeat! ☀️☀️", timestamp: "Just now" },
        { id: "2", username: "melody_maker", displayName: "Marcus Chase", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", content: "The bass sounds incredible. Co-listening is so satisfying right now.", timestamp: "1m ago" },
      ],
      station_cafe: [
        { id: "1", username: "lofi_girl", displayName: "Luna Beats", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", content: "Chilling to this in Paris! Dynamic late night lo-fi beats channel", timestamp: "Just now" },
        { id: "2", username: "jazz_hands", displayName: "Miles Davis", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", content: "Incredibly relaxing sound space, highly recommended.", timestamp: "3m ago" },
      ],
      station_ai_radio: [
        { id: "1", username: "spark_fan", displayName: "Aya Tanaka", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150", content: "DJ Spark is choosing absolute banger queue today!", timestamp: "Just now" },
        { id: "2", username: "robot_rocker", displayName: "Gearhead", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150", content: "Wow, DJ Spark just personalized that intro for iamdbonero! Impressive!", timestamp: "Just now" },
      ]
    };

    const roomKey = activeStationId.includes("sun") ? "station_sun" : activeStationId.includes("cafe") ? "station_cafe" : "station_ai_radio";
    setSharedLoungeChat(sampleChats[roomKey] || []);
    setSharedRoomListeners(Math.floor(Math.random() * 25) + 18);

    const interval = setInterval(() => {
      setSharedRoomListeners(prev => Math.max(8, prev + (Math.random() > 0.5 ? 2 : -2)));

      const commentators = [
        { username: "lucas_sound", displayName: "Lucas Foley", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" },
        { username: "clara_waves", displayName: "Clara Croft", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150" },
        { username: "retro_synth", displayName: "Kavinsky", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150" }
      ];

      const statements = [
        "Incredible dynamic vibrations, so good!",
        "Who else is co-listening in sync with me?",
        "Throwing hearts in the lounge! ❤️🎵",
        "Pure therapeutic resonance, honestly.",
        "Perfect song recommendations so far!",
        "Let's sync up our vibe themes!",
        "Onodu is officially keeping me motivated today."
      ];

      const chosenComm = commentators[Math.floor(Math.random() * commentators.length)];
      const chosenText = statements[Math.floor(Math.random() * statements.length)];

      setSharedLoungeChat(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          username: chosenComm.username,
          displayName: chosenComm.displayName,
          avatar: chosenComm.avatar,
          content: chosenText,
          timestamp: "Just now"
        }
      ].slice(-15));

      const emojiOptions = ["❤️", "🔥", "☀️", "🎉", "⚡", "✨", "🎵"];
      const newEmoji = {
        id: Math.random().toString(),
        char: emojiOptions[Math.floor(Math.random() * emojiOptions.length)],
        left: Math.floor(Math.random() * 80) + 10
      };
      setFloatingEmojis(prev => [...prev, newEmoji]);
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
      }, 3000);

    }, 4500);

    return () => {
      clearInterval(interval);
    };
  }, [activeStationId]);

  useEffect(() => {
    return () => {
      if (mainAudioRef.current) {
        mainAudioRef.current.pause();
      }
    };
  }, []);

  // State triggers
  const [isLoading, setIsLoading] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [tippingUser, setTippingUser] = useState<User | null>(null);
  const [profileViewMode, setProfileViewMode] = useState<"timeline" | "grid">("timeline");
  
  // Custom theme control triggered by Premium
  const [customTheme, setCustomTheme] = useState<"standard" | "royal" | "neon">("standard");

  // Post formulation state
  const [postContent, setPostContent] = useState("");
  const [postMood, setPostMood] = useState("Relaxed");
  const [lyricsDraft, setLyricsDraft] = useState("");
  const [highlightedLyrics, setHighlightedLyrics] = useState<string[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [attachedImageUrl, setAttachedImageUrl] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Profile editing details
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editFavoriteSong, setEditFavoriteSong] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editCoverPhoto, setEditCoverPhoto] = useState("");

  // Stories View modal
  const [viewingStory, setViewingStory] = useState<Story | null>(null);

  // Loaded music search panel inside post creator
  const [postSongSearch, setPostSongSearch] = useState("");
  const [matchedSearchSongs, setMatchedSearchSongs] = useState<Song[]>([]);
  const [searchSongOpen, setSearchSongOpen] = useState(false);

  // Fetch initial state
  const bootstrapState = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Users
      const uRes = await fetch("/api/users");
      const uData = await uRes.json();
      setUsers(uData);

      const rootUser = uData.find((u: User) => u.id === "currentUser") || uData[0];
      setCurrentUser(rootUser);
      setCustomTheme((rootUser?.isPremium) ? "royal" : "standard");

      // 2. Fetch standard songs list
      const sRes = await fetch("/api/music/search?q=");
      const sData = await sRes.json();
      setSongsDb(sData);

      // 3. Fetch Posts
      const pRes = await fetch("/api/posts");
      const pData = await pRes.json();
      setPosts(pData);

      // 4. Fetch Messages with Chloe initially
      const mRes = await fetch("/api/messages/chloe_vibe");
      const mData = await mRes.json();
      setMessages(mData);

      // 5. Fetch Stories
      const stRes = await fetch("/api/stories");
      const stData = await stRes.json();
      setStories(stData);

      // 6. Fetch Notifications
      const nRes = await fetch("/api/notifications");
      const nData = await nRes.json();
      setNotifications(nData);

      // 7. Fetch Playlists
      const plRes = await fetch("/api/playlists");
      if (plRes.ok) {
        const plData = await plRes.json();
        setPlaylists(plData);
      }

    } catch (err) {
      console.error("Failed to bootstrap state properly:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    bootstrapState();
  }, [activeTab]);

  // Periodic notifications ticker (Simulates unread peer additions over time)
  useEffect(() => {
    const timer = setInterval(() => {
      // Check if there are unread news from backend
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((data) => setNotifications(data))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Post search music stream alignment
  const performPostSongSearch = async (val: string) => {
    setPostSongSearch(val);
    if (val.trim().length === 0) {
      setMatchedSearchSongs([]);
      return;
    }
    try {
      const resp = await fetch(`/api/music/search?q=${encodeURIComponent(val)}`);
      const songs = await resp.json();
      setMatchedSearchSongs(songs);
    } catch {
      setMatchedSearchSongs([]);
    }
  };

  // Trigger server-side match-making AI
  const routeGeminiSuggest = async () => {
    if (!postContent.trim()) return alert("Write some words first so Gemini can analyze!");
    setIsAiLoading(true);
    try {
      const rep = await fetch("/api/gemini/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: postContent })
      });
      const match = await rep.json();
      
      // Update recommended values
      setPostMood(match.mood);
      setSelectedSong(match.suggestedSong);
      if (match.lyricsExcerpt) {
        setLyricsDraft(match.lyricsExcerpt);
        // Clean highlighted lyrics
        setHighlightedLyrics(match.lyricsExcerpt.split("\n"));
      }
    } catch {
      alert("Core recommender is offline. Fallback suggestions applied.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Generate dynamic poetic caption
  const generateAiCaption = async () => {
    setIsAiLoading(true);
    try {
      const payload = {
        mood: postMood,
        songTitle: selectedSong ? selectedSong.title : "this quiet silence",
        artist: selectedSong ? selectedSong.artist : "the clouds"
      };

      const resp = await fetch("/api/gemini/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (data.caption) {
        setPostContent(data.caption);
      }
    } catch {
      setPostContent(`Aesthetic vibe tune matching my ${postMood} afternoon.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Create Post Submission
  const createMusicPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !selectedSong) return;

    try {
      const payload = {
        content: postContent,
        mood: postMood,
        song: selectedSong || undefined,
        lyrics: lyricsDraft || undefined,
        highlightedLyrics: highlightedLyrics.length > 0 ? highlightedLyrics : undefined,
        attachedImages: attachedImageUrl ? [attachedImageUrl] : undefined
      };

      const resp = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const newPost = await resp.json();

      setPosts((prev) => [newPost, ...prev]);

      // Reset form draft
      setPostContent("");
      setLyricsDraft("");
      setHighlightedLyrics([]);
      setSelectedSong(null);
      setAttachedImageUrl("");
      
      // Return to feed
      setActiveTab("home");

    } catch (err) {
      alert("Failed to compile and publish post.");
    }
  };

  // Interactive lyrics lines highlight clicker
  const toggleLyricHighlightSelection = (line: string) => {
    if (highlightedLyrics.includes(line)) {
      setHighlightedLyrics(highlightedLyrics.filter((l) => l !== line));
    } else {
      setHighlightedLyrics([...highlightedLyrics, line]);
    }
  };

  // Feed Actions proxy
  const handleLike = async (postId: string) => {
    try {
      const resp = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      const updatedPost = await resp.json();
      setPosts(posts.map((p) => p.id === postId ? updatedPost : p));
    } catch {}
  };

  const handleSave = async (postId: string) => {
    try {
      const resp = await fetch(`/api/posts/${postId}/save`, { method: "POST" });
      const updatedPost = await resp.json();
      setPosts(posts.map((p) => p.id === postId ? updatedPost : p));
    } catch {}
  };

  const handleCommentSubmit = async (postId: string, content: string) => {
    try {
      const resp = await fetch(`/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      const updatedPost = await resp.json();
      setPosts(posts.map((p) => p.id === postId ? updatedPost : p));
    } catch {}
  };

  const handleRepostSubmit = async (postId: string, repostComment?: string) => {
    try {
      const resp = await fetch(`/api/posts/${postId}/repost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repostComment })
      });
      const data = await resp.json();
      setPosts((prev) => [data.newPost, ...prev]);
    } catch {}
  };

  const handleMuteAction = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mute" })
      });
      bootstrapState();
    } catch {}
  };

  const handleBlockAction = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "block" })
      });
      bootstrapState();
    } catch {}
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await fetch(`/api/posts/${postId}?admin=true`, { method: "DELETE" });
      setPosts(posts.filter((p) => p.id !== postId));
    } catch {}
  };

  // Direct messages router proxy
  const handleSendMessage = async (receiverId: string, content: string, extraPayload?: Partial<Message>) => {
    try {
      const resp = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId,
          content,
          ...extraPayload
        })
      });
      const newMsg = await resp.json();
      setMessages((prev) => [...prev, newMsg]);

      // Refetch after immediate mock timeout answer to retain dialogue
      setTimeout(() => {
        fetch(`/api/messages/${receiverId}`)
          .then((r) => r.json())
          .then((data) => setMessages(data))
          .catch(() => {});
      }, 2500);

    } catch {}
  };

  // Follow unfollow toggle
  const handleFollowToggle = async (userId: string) => {
    try {
      const resp = await fetch(`/api/users/${userId}/follow`, { method: "POST" });
      const data = await resp.json();
      setUsers(users.map((u) => u.id === userId ? data.targetUser : u));
      if (currentUser) {
        setCurrentUser(data.currentUser);
      }
    } catch {}
  };

  // Clear unreads
  const markAllNotificationsRead = async () => {
    try {
      await fetch("/api/notifications/read", { method: "POST" });
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  // Profile fields edits save to server
  const saveProfileEdits = async () => {
    if (!currentUser) return;
    try {
      const resp = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: editDisplayName || currentUser.displayName,
          bio: editBio || currentUser.bio,
          location: editLocation || currentUser.location,
          favoriteSong: editFavoriteSong || currentUser.favoriteSong,
          avatar: editAvatar || currentUser.avatar,
          coverPhoto: editCoverPhoto || currentUser.coverPhoto,
        })
      });
      const updated = await resp.json();
      setCurrentUser(updated);
      setUsers(users.map((u) => u.id === currentUser.id ? updated : u));
      setIsEditingProfile(false);
      setEditAvatar("");
      setEditCoverPhoto("");
    } catch {}
  };

  // Premium toggles
  const handleUpgradeToPremium = async () => {
    if (!currentUser) return;
    try {
      const resp = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPremium: true
        })
      });
      const updated = await resp.json();
      setCurrentUser(updated);
      setCustomTheme("royal");
      alert("Congratulations! Premium package is now locked! Visual templates, advanced analytics, and custom font colors are enabled with VIP crown badge.");
    } catch {}
  };

  // Peer creator tipping actions
  const supportTipCreator = (amount: number) => {
    if (!tippingUser) return;
    alert(`Thanks! Your support tip of $${amount} has been safely dispatched to @${tippingUser.username}. ⚡`);
    setTippingUser(null);
  };

  // Post story upload helper
  const uploadMockStory = async () => {
    try {
      const storyImages = [
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80"
      ];
      const selectedImg = storyImages[Math.floor(Math.random() * storyImages.length)];
      const randomSong = songsDb[Math.floor(Math.random() * songsDb.length)];

      const resp = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: selectedImg,
          song: randomSong,
          lyricsHighlight: "Tuning into some incredible background frequencies today! 🍃",
          mood: "Excited"
        })
      });
      const data = await resp.json();
      setStories((prev) => [data, ...prev]);
      alert("Disappearing 24h story uploaded!");
    } catch {}
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-indigo-500/10 filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-fuchsia-500/5 filter blur-[100px] pointer-events-none" />
        
        {/* Star Particles Simulation */}
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-md w-full px-6 py-12 text-center space-y-7 z-10 font-sans">
          {/* Pulsing Outer Disc */}
          <div className="relative inline-block mx-auto">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full filter blur-xl animate-pulse" />
            <div className="relative bg-slate-900 border border-indigo-500/30 p-5 rounded-3xl shadow-2xl text-indigo-400">
              <Disc className="w-14 h-14 animate-[spin_10s_linear_infinite]" />
            </div>
            <div className="absolute -top-1 -right-1 bg-gradient-to-tr from-amber-400 to-fuchsia-500 p-1.5 rounded-full text-white animate-bounce">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="font-display font-extrabold text-4xl tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              ọnọdụ
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              A collaborative social platform sharing music and moods in unified posts.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => { setAuthMode("login"); setLoginError(""); }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                authMode === "login" 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("register"); setLoginError(""); }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                authMode === "register" 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Join Orbit
            </button>
          </div>

          {/* SIGN IN FORM VIEW */}
          {authMode === "login" && (
            <div className="space-y-4 text-left">
              <form onSubmit={handleLoginSubmit} className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
                <div>
                  <h3 className="text-xs text-slate-200 font-bold uppercase tracking-wider block">Access Your Orbit</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Enter your handle username to log in.</p>
                </div>

                <div className="space-y-1">
                  <label htmlFor="login-username" className="text-[9.5px] text-slate-400 font-bold uppercase block">Username Handle</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">@</span>
                    <input
                      id="login-username"
                      type="text"
                      placeholder="iamdbonero"
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-700 font-mono"
                    />
                  </div>
                </div>

                {loginError && (
                  <p className="text-[10px] text-red-400 text-center font-medium animate-pulse">{loginError}</p>
                )}

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs tracking-wide shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Sign In</span>
                  <CheckCircle className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Login Preset Accounts */}
              <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-5 shadow-sm space-y-3.5">
                <div>
                  <h4 className="text-[10px] text-slate-300 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-indigo-400" /> Presets Accounts
                  </h4>
                  <p className="text-[9px] text-slate-400 mt-0.5">Click any standard creator to log in instantly:</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { username: "iamdbonero", name: "D. Bonero", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
                    { username: "chloe_vibe", name: "Chloe Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
                    { username: "leo_beats", name: "Leo King", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
                    { username: "guitar_hero", name: "Marcus Vance", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
                  ].map((pUser) => (
                    <button
                      key={pUser.username}
                      type="button"
                      onClick={() => {
                        setLoginInput(pUser.username);
                        handleCustomLogin(pUser.username);
                      }}
                      className="flex items-center gap-2.5 p-2 bg-slate-950/80 border border-slate-800/60 rounded-2xl hover:border-indigo-500 hover:bg-slate-900 transition-all text-left group cursor-pointer"
                    >
                      <img
                        src={pUser.avatar}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border border-slate-800 group-hover:border-indigo-400 transition-all shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold text-slate-200 truncate group-hover:text-indigo-300 transition-all">{pUser.name}</div>
                        <div className="text-[8px] text-slate-405 font-mono truncate">@{pUser.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* REGISTER FORM VIEW */}
          {authMode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4 text-left">
              <div>
                <h3 className="text-xs text-slate-200 font-bold uppercase tracking-wider block">Join the Orbit</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Establish your social music handle.</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9.5px]/none text-slate-405 font-bold uppercase tracking-wider block">Profile Image</span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80"
                  ].map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRegisterAvatar(imgUrl)}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                        registerAvatar === imgUrl 
                          ? "border-indigo-500 scale-105" 
                          : "border-slate-850 hover:border-slate-800"
                      }`}
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                      {registerAvatar === imgUrl && (
                        <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                          <Check className="w-4.5 h-4.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="reg-email" className="text-[9.5px] text-slate-400 font-bold uppercase block">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 bg-slate-905">
                <div className="space-y-1">
                  <label htmlFor="reg-user" className="text-[9.5px] text-slate-400 font-bold uppercase block">Username</label>
                  <input
                    id="reg-user"
                    type="text"
                    required
                    placeholder="synth_chao"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-disp" className="text-[9.5px] text-slate-400 font-bold uppercase block">Display Name</label>
                  <input
                    id="reg-disp"
                    type="text"
                    required
                    placeholder="Leo Wave"
                    value={registerDisplayName}
                    onChange={(e) => setRegisterDisplayName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-705"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label htmlFor="reg-location" className="text-[9.5px] text-slate-400 font-bold uppercase block">Location</label>
                  <input
                    id="reg-location"
                    type="text"
                    placeholder="Tokyo, JP"
                    value={registerLocation}
                    onChange={(e) => setRegisterLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-705"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-favsong" className="text-[9.5px] text-slate-400 font-bold uppercase block">Fav Song</label>
                  <input
                    id="reg-favsong"
                    type="text"
                    placeholder="Fix You"
                    value={registerFavoriteSong}
                    onChange={(e) => setRegisterFavoriteSong(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="reg-bio" className="text-[9.5px] text-slate-400 font-bold uppercase block">Stargazing Bio</label>
                <input
                  id="reg-bio"
                  type="text"
                  placeholder="Curating modular space beats..."
                  value={registerBio}
                  onChange={(e) => setRegisterBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-705"
                />
              </div>

              {loginError && (
                <p className="text-[10px] text-red-400 text-center font-medium animate-pulse">{loginError}</p>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs tracking-wide shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Create Account</span>
                <PlusCircle className="w-4 h-4" />
              </button>
            </form>
          )}

          <footer className="text-[10px] text-slate-500 tracking-wider">
            Click a **Preset profile** or use the tabs to Sign In / Join. Escape with <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[9px]">Esc</kbd> anytime.
          </footer>
        </div>
      </div>
    );
  }

  if (isLoading || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 font-sans text-xs text-gray-400 gap-3">
        <Disc className="w-10 h-10 animate-spin text-indigo-600" />
        <span className="font-display font-medium text-slate-200 tracking-wide">Syncing ọnọdụ and Spotify chords...</span>
      </div>
    );
  }

  const activeColorTheme = MOOD_THEMES[currentDisplayMood] || MOOD_THEMES.Relaxed;

  // Handle premium theme backdrops config
  const customBackgroundTheme = () => {
    if (isDarkMode) {
      return "bg-slate-950 text-slate-100 selection:bg-indigo-550/20";
    } else {
      return "bg-slate-50 text-slate-850 selection:bg-indigo-600/10";
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark " : ""}${customBackgroundTheme()} transition-all duration-300 font-sans relative flex text-slate-850 dark:text-slate-100`}>
      
      {/* Ambient Mood Backdrops (Page glows reflect emotional vibe) */}
      <div 
        className={`absolute top-0 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br ${activeColorTheme.glowClass} filter blur-[120px] opacity-60 dark:opacity-40 pointer-events-none -z-10 transition-all duration-1000 ease-in-out`} 
      />
      <div 
        className={`absolute bottom-20 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br ${activeColorTheme.glowClass} filter blur-[140px] opacity-45 dark:opacity-20 pointer-events-none -z-10 transition-all duration-1000 ease-in-out`} 
      />
      
      {/* 1. Left Sticky Navigation Sidebar (Desktop screens) */}
      <nav className={`hidden md:flex flex-col w-64 xl:w-72 border-r ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-gray-150 bg-white"} h-screen sticky top-0 px-5 py-6 shrink-0 justify-between select-none z-45 transition-colors`}>
        
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="px-3 cursor-pointer" onClick={() => setActiveTab("home")}>
            <h1 className="font-serif font-extrabold text-[27px] tracking-tight bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 bg-clip-text text-transparent italic select-none">
              ọnọdụ
            </h1>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-sans tracking-wide -mt-0.5 font-medium">Emotion-driven playlist feeds</p>
          </div>

          {/* Nav Links */}
          <div className="space-y-1.5">
            <button 
              onClick={() => setActiveTab("home")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "home" 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white border-l-[3.5px] border-indigo-600 dark:border-indigo-505 pl-[12.5px]"
                  : "text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <Home className="w-5 h-5 stroke-2" />
              <span>Home Feed</span>
            </button>

            <button 
              onClick={() => setActiveTab("discover")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "discover" 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white border-l-[3.5px] border-indigo-600 dark:border-indigo-505 pl-[12.5px]"
                  : "text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <Search className="w-5 h-5 stroke-2" />
              <span>Discover Music</span>
            </button>

            <button 
              onClick={() => setActiveTab("messages")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "messages" 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white border-l-[3.5px] border-indigo-600 dark:border-indigo-505 pl-[12.5px]"
                  : "text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5 stroke-2" />
                {notifications.some(n => n.type === "message" && !n.read) && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-indigo-650 rounded-full" />
                )}
              </div>
              <span>Direct Messages</span>
            </button>

            <button 
              onClick={() => setActiveTab("playlists")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "playlists" 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white border-l-[3.5px] border-indigo-600 dark:border-indigo-505 pl-[12.5px]"
                  : "text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <ListMusic className="w-5 h-5 stroke-2" />
              <span>Collab Playlists</span>
            </button>

            <button 
              onClick={() => setActiveTab("workspace")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "workspace" 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white border-l-[3.5px] border-indigo-600 dark:border-indigo-505 pl-[12.5px]"
                  : "text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <Crown className="w-5 h-5 stroke-2" />
              <span>Workspace Hub</span>
            </button>

            <button 
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "analytics" 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white border-l-[3.5px] border-indigo-600 dark:border-indigo-505 pl-[12.5px]"
                  : "text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <BarChart3 className="w-5 h-5 stroke-2" />
              <span>Mood Analytics</span>
            </button>

            <button 
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "profile" 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white border-l-[3.5px] border-indigo-600 dark:border-indigo-505 pl-[12.5px]"
                  : "text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <img src={currentUser.avatar} alt="" className="w-5 h-5 rounded-full object-cover border border-gray-200 dark:border-slate-800" />
              <span>My Profile</span>
            </button>

            {/* Admin Toggle */}
            <button 
              onClick={() => setActiveTab("admin")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "admin" 
                  ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-750 dark:text-indigo-400 border-l-[3.5px] border-indigo-600 dark:border-indigo-505 pl-[12.5px]"
                  : "text-red-500/70 hover:text-red-600 hover:bg-red-500/5 font-semibold"
              }`}
            >
              <Shield className="w-5 h-5 stroke-2" />
              <span>Admin Panel</span>
            </button>
          </div>

          <div className="pt-2">
            <button 
              onClick={() => setActiveTab("profile")}
              className="w-full py-3 px-4 bg-gradient-to-tr from-indigo-600 via-purple-600 to-rose-500 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Vibe</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-4 pt-4 border-t border-gray-150/65 dark:border-slate-800">
          
          {/* Quick Dark Toggle */}
          <div className="flex items-center justify-between px-3 text-xs font-bold text-gray-500 dark:text-gray-400">
            <span>Dark Appearance</span>
            <button 
              onClick={() => {
                const ns = !isDarkMode;
                setIsDarkMode(ns);
                localStorage.setItem("themeMode", ns ? "dark" : "light");
              }}
              className={`p-1.5 rounded-lg cursor-pointer border ${isDarkMode ? "bg-slate-800 border-slate-705 text-amber-400" : "bg-gray-100 border-gray-205 text-slate-800"}`}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Self User profile detail badge */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-805/50 border border-slate-100 dark:border-slate-800/60 p-2.5 rounded-xl">
            <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-full object-cover border dark:border-slate-700" referrerPolicy="no-referrer" />
            <div className="min-w-0 flex-1">
              <span className="font-display font-semibold text-[11px] text-slate-800 dark:text-white block truncate">{currentUser.displayName}</span>
              <span className="text-[9px] text-gray-400 block truncate">@{currentUser.username}</span>
            </div>
            <button 
              onClick={() => {
                setIsLoggedIn(false);
                try { localStorage.setItem("isLoggedIn", "false"); } catch {}
              }}
              className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50/50 dark:hover:bg-red-950/20"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </nav>

      {/* 2. Primary Layout content body container */}
      <div className="flex-1 min-w-0 flex flex-col relative">
        
        {/* Mobile Header (Sits on top, hidden on desktop screens) */}
        <header className={`md:hidden sticky top-0 ${isDarkMode ? "bg-slate-900/95 border-slate-800 text-white" : "bg-white/95 border-gray-150 text-slate-950"} backdrop-blur-md border-b px-4 h-15 flex items-center justify-between z-40 transition-colors`}>
          <div className="cursor-pointer flex items-center gap-1.5" onClick={() => setActiveTab("home")}>
            <h1 className="font-serif font-extrabold text-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 bg-clip-text text-transparent italic select-none">
              ọnọdụ
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Ambient Vibe Dropdown */}
            <select
              value={currentDisplayMood}
              onChange={(e) => {
                const m = e.target.value as MoodType;
                setCurrentDisplayMood(m);
                setPostMood(m);
              }}
              className={`appearance-none ${isDarkMode ? "bg-slate-800 border-slate-705 text-white" : "bg-gray-100 border-gray-205 text-slate-800"} text-[10px] font-bold pl-2.5 pr-6 py-1 rounded-full cursor-pointer focus:outline-none`}
            >
              {Object.values(MOOD_THEMES).map((theme) => (
                <option key={theme.name} value={theme.name}>
                  {theme.emoji} {theme.name}
                </option>
              ))}
            </select>

            {/* Dark appearance toggle */}
            <button 
              onClick={() => {
                const ns = !isDarkMode;
                setIsDarkMode(ns);
                localStorage.setItem("themeMode", ns ? "dark" : "light");
              }}
              className="text-gray-450 hover:text-slate-900 dark:text-gray-300 p-1.5"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications panel bell */}
            <div className="relative">
              <button 
                onClick={() => { setNotificationOpen(!notificationOpen); markAllNotificationsRead(); }}
                className="text-gray-400 hover:text-slate-900 p-1.5 rounded-full relative"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-indigo-650 rounded-full" />
                )}
              </button>

              {/* Mobile Quick Logout action button */}
              <button 
                onClick={() => {
                  setIsLoggedIn(false);
                  try { localStorage.setItem("isLoggedIn", "false"); } catch {}
                }}
                className="text-gray-400 hover:text-red-500 p-1.5 rounded-full"
                title="Logout"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
              
              {notificationOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-800 rounded-xl shadow-xl py-3 z-50 text-xs text-slate-900 dark:text-white max-h-80 overflow-y-auto">
                  <div className="px-3 pb-2 border-b border-gray-50 dark:border-slate-850 flex justify-between font-bold">
                    <span>Notifications</span>
                    <button onClick={() => setNotificationOpen(false)} className="text-[10px] text-gray-400">Close</button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-center italic text-gray-400 py-4 text-[10px]">No news actions</p>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex gap-2 items-start">
                        <img src={notif.senderAvatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold leading-none block truncate">{notif.senderDisplayName}</span>
                          <span className="text-[10px] text-gray-500 block truncate">{notif.content}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Column view frame */}
        <main className="flex-1 w-full flex flex-col">
          
          {/* Primary Layout content body */}
          <div className="flex-1 min-w-0 space-y-6 px-4 md:px-6 py-6">
            
            {/* HOME FEED VIEW */}
            {activeTab === "home" && (
              <div className="space-y-6">
                
                {/* A. 24-hour Stories Bubble section */}
                <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Disappearing Stories</span>
                    <button 
                      onClick={uploadMockStory}
                      className="text-[10px] text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      + Add Story
                    </button>
                  </div>
                  <div className="flex items-center gap-4 overflow-x-auto py-1 scrollbar-none">
                    
                    {/* Logged in self story uploader indicator */}
                    <div className="flex flex-col items-center shrink-0 cursor-pointer" onClick={uploadMockStory}>
                      <div className="w-14 h-14 bg-gray-50 border border-dashed border-gray-200 rounded-full flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors">
                        <PlusCircle className="w-5 h-5 text-indigo-500" />
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 font-medium">Your Story</span>
                    </div>

                    {/* Array of active stories */}
                    {stories.map((st) => (
                      <div 
                        key={st.id} 
                        onClick={() => setViewingStory(st)}
                        className="flex flex-col items-center shrink-0 cursor-pointer group"
                      >
                        <div className="p-0.5 bg-gradient-to-tr from-emerald-400 via-indigo-500 to-rose-500 rounded-full group-hover:scale-105 transition-transform">
                          <img 
                            src={st.avatar} 
                            alt={st.displayName} 
                            className="w-13 h-13 rounded-full object-cover border-2 border-white"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="text-[10px] text-slate-700 mt-1 truncate max-w-14 font-medium">{st.displayName.split(" ")[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* B. Create Post Bar Quick Launch */}
                <div 
                  className="bg-white border rounded-3xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setActiveTab("profile")} // Directly starts interactive poster inside profile/create
                >
                  <div className="flex items-center gap-3 flex-1">
                    <img src={currentUser.avatar} alt="Me" className="w-9 h-9 rounded-full object-cover shrink-0 border" referrerPolicy="no-referrer" />
                    <span className="text-xs text-gray-400">Share your emotions, paste favorite lyrics, or search song elements...</span>
                  </div>
                  <div className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-4 py-2 text-xs font-semibold flex items-center gap-1">
                    <PlusCircle className="w-4 h-4" />
                    Publish Vibe
                  </div>
                </div>

                {/* C. Home Feed Post chronos roll */}
                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <div className="text-center py-12 bg-white border rounded-3xl">
                      <p className="text-sm font-display text-gray-400">No active posts available. Create your safe vibe first!</p>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <FeedCard 
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onLike={handleLike}
                        onSave={handleSave}
                        onComment={handleCommentSubmit}
                        onRepost={handleRepostSubmit}
                        onMute={handleMuteAction}
                        onBlock={handleBlockAction}
                        onDelete={handleDeletePost}
                        currentPlayingSong={globalSong}
                        isPlayingGlobal={isGlobalPlaying}
                        onPlaySong={handlePlayGlobalSong}
                        onPauseSong={handlePauseGlobalSong}
                      />
                    ))
                  )}
                </div>

              </div>
            )}

            {/* DISCOVER TAB */}
            {activeTab === "discover" && (
              <Discovery 
                songsDb={songsDb}
                users={users}
                currentUser={currentUser}
                onFollowToggle={handleFollowToggle}
                onPostSelectSong={(song) => {
                  setSelectedSong(song);
                  setLyricsDraft("Paste lyrics dynamically to select highlights.");
                  setActiveTab("profile"); // Back to posting menu
                }}
                currentPlayingSong={globalSong}
                isPlayingGlobal={isGlobalPlaying}
                onPlaySong={handlePlayGlobalSong}
                onPauseSong={handlePauseGlobalSong}
                globalCurrentTime={globalCurrentTime}
                globalDuration={globalDuration}
                globalVolume={globalVolume}
                isGlobalMuted={isGlobalMuted}
                onSeekGlobal={handleSeekGlobal}
                onVolumeGlobal={handleVolumeGlobal}
                onMuteGlobal={handleMuteGlobal}
                activeStationId={activeStationId}
                sharedRoomListeners={sharedRoomListeners}
                floatingEmojis={floatingEmojis}
                sharedLoungeChat={sharedLoungeChat}
                isAiDjSpeaking={isAiDjSpeaking}
                aiDjSpeech={aiDjSpeech}
                onTuneToAiDjRadio={handleTuneToAiDjRadio}
                onSendLoungeReaction={(char) => {
                  const newEmoji = {
                    id: Math.random().toString(),
                    char,
                    left: Math.floor(Math.random() * 80) + 10
                  };
                  setFloatingEmojis(prev => [...prev, newEmoji]);
                  setTimeout(() => {
                    setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
                  }, 3000);
                }}
                onSendLoungeChat={(text) => {
                  setSharedLoungeChat(prev => [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      username: currentUser?.username || "me",
                      displayName: currentUser?.displayName || "Me",
                      avatar: currentUser?.avatar || "",
                      content: text,
                      timestamp: "Just now"
                    }
                  ]);
                }}
              />
            )}

            {/* DIRECT MESSAGES TAB */}
            {activeTab === "messages" && (
              <DirectMessages 
                currentUser={currentUser}
                users={users}
                messages={messages}
                onSendMessage={handleSendMessage}
                songsDbRef={songsDb}
                isDarkMode={isDarkMode}
              />
            )}

            {/* ANALYTICS TAB */}
            {activeTab === "analytics" && (
              <MoodAnalytics 
                currentUser={currentUser}
                onUpgradeToPremium={handleUpgradeToPremium}
              />
            )}

            {/* USER PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                
                {/* A. User Profile Card Header */}
                <div className="bg-white border rounded-3xl overflow-hidden shadow-xs">
                  {/* Cover photo */}
                  <div className="h-36 bg-slate-100 relative">
                    <img 
                      src={currentUser.coverPhoto} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Edit trigger */}
                    <button 
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      className="absolute bottom-3 right-3 bg-white/75 hover:bg-white border rounded-full px-4 py-1.5 text-[10px] font-bold text-gray-800 backdrop-blur-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit Profile ✏️
                    </button>
                  </div>

                  {/* Profile Metrics Summary */}
                  <div className="p-5 md:p-6 relative pt-0">
                    
                    {/* Avatar overlap */}
                    <div className="absolute -top-12 left-6">
                      <img 
                        src={currentUser.avatar} 
                        alt="My Profile Picture" 
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-10 gap-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="font-display font-semibold text-lg text-gray-900 leading-tight">{currentUser.displayName}</h2>
                          {currentUser.isPremium && (
                            <span className="bg-gradient-to-tr from-amber-500 to-yellow-400 text-white rounded-full p-1 shadow-xs" title="Premium Subscriber">
                              <Crown className="w-3.5 h-3.5 fill-white text-white" />
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">@{currentUser.username}</span>

                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                          {currentUser.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {currentUser.location}
                            </span>
                          )}
                          {currentUser.favoriteSong && (
                            <span className="flex items-center gap-1 max-w-xs truncate" title={currentUser.favoriteSong}>
                              <Music className="w-3.5 h-3.5" />
                              Fav: {currentUser.favoriteSong}
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 text-xs mt-3 leading-relaxed max-w-xl">{currentUser.bio}</p>
                      </div>

                      {/* Stat figures badges */}
                      <div className="flex gap-4 border border-gray-50 bg-gray-50/25 p-3 rounded-2xl">
                        <div className="text-center px-2">
                          <span className="font-display font-semibold block text-slate-900 text-sm">{currentUser.postsCount}</span>
                          <span className="text-[10px] text-gray-400">Posts</span>
                        </div>
                        <div className="text-center px-2 border-l border-gray-100">
                          <span className="font-display font-semibold block text-slate-900 text-sm">{currentUser.followersCount}</span>
                          <span className="text-[10px] text-gray-400">Followers</span>
                        </div>
                        <div className="text-center px-2 border-l border-gray-100">
                          <span className="font-display font-semibold block text-slate-900 text-sm">{currentUser.followingCount}</span>
                          <span className="text-[10px] text-gray-400">Following</span>
                        </div>
                        <div className="text-center px-2 border-l border-gray-100">
                          <span className="font-display font-semibold block text-indigo-600 text-sm">{currentUser.likesCount}</span>
                          <span className="text-[10px] text-gray-400">Likes</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Profile Editor Inline Dropdown form */}
                    {isEditingProfile && (
                      <div className="border-t border-gray-100 pt-5 mt-5 space-y-4 bg-gray-50/20 p-4 rounded-3xl">
                        <h4 className="font-display font-semibold text-xs text-gray-900 uppercase">Edit Profile Details</h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 uppercase font-semibold">Display Name</label>
                            <input 
                              type="text" 
                              value={editDisplayName} 
                              onChange={(e) => setEditDisplayName(e.target.value)} 
                              placeholder={currentUser.displayName}
                              className="w-full text-xs border border-gray-100 rounded-xl p-2 bg-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 uppercase font-semibold">Location</label>
                            <input 
                              type="text" 
                              value={editLocation} 
                              onChange={(e) => setEditLocation(e.target.value)} 
                              placeholder={currentUser.location || "City, Country"}
                              className="w-full text-xs border border-gray-100 rounded-xl p-2 bg-white"
                            />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[10px] text-gray-400 uppercase font-semibold">Favorite Artists / Song</label>
                            <input 
                              type="text" 
                              value={editFavoriteSong} 
                              onChange={(e) => setEditFavoriteSong(e.target.value)} 
                              placeholder={currentUser.favoriteSong || "Track name by Artist"}
                              className="w-full text-xs border border-gray-100 rounded-xl p-2 bg-white"
                            />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[10px] text-gray-400 uppercase font-semibold">Short Bio (160 max)</label>
                            <textarea 
                              value={editBio} 
                              onChange={(e) => setEditBio(e.target.value.substring(0, 160))} 
                              placeholder={currentUser.bio}
                              className="w-full text-xs border border-gray-100 rounded-xl p-2 h-16 bg-white resize-none"
                            />
                          </div>

                          {/* Image Uploaders */}
                          <div className="space-y-3 sm:col-span-2 border-t border-gray-100 pt-4">
                            <span className="text-[10px] text-gray-450 uppercase font-bold block">Change Display Pictures 🖼️</span>
                            <div className="grid sm:grid-cols-2 gap-4">
                              
                              {/* 1. Avatar (Profile Pic) Uploader */}
                              <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase font-bold block">Display Photo (Avatar)</label>
                                <div 
                                  id="avatar-dropzone"
                                  className="border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-2xl p-4 text-center cursor-pointer bg-white transition-all flex flex-col items-center justify-center min-h-[120px] relative overflow-hidden group"
                                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-indigo-500", "bg-indigo-50/20"); }}
                                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-indigo-500", "bg-indigo-50/20"); }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove("border-indigo-500", "bg-indigo-50/20");
                                    const file = e.dataTransfer.files?.[0];
                                    if (file && file.type.startsWith("image/")) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        if (typeof reader.result === "string") setEditAvatar(reader.result);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  onClick={() => document.getElementById("avatar-file-input")?.click()}
                                >
                                  <input 
                                    type="file" 
                                    id="avatar-file-input" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          if (typeof reader.result === "string") setEditAvatar(reader.result);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                  {editAvatar || currentUser.avatar ? (
                                    <div className="flex flex-col items-center gap-1.5 z-10">
                                      <img 
                                        src={editAvatar || currentUser.avatar} 
                                        alt="Selected Display Picture" 
                                        className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500 shadow-xs" 
                                      />
                                      <span className="text-[9px] text-indigo-600 font-mono font-bold uppercase tracking-wide">Image Loaded</span>
                                      <span className="text-[8px] text-gray-400">{editAvatar ? "New image selected" : "Current display picture"}</span>
                                    </div>
                                  ) : (
                                    <div className="text-gray-450 flex flex-col items-center gap-1 z-10">
                                      <Upload className="w-5 h-5 mb-0.5 text-gray-300 group-hover:text-indigo-500" />
                                      <p className="text-[10px] font-semibold text-gray-600 group-hover:text-indigo-600">Select or Drag Photo</p>
                                      <p className="text-[8px]">Supports JPEG, PNG, WEBP</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 2. Cover Photo Uploader */}
                              <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase font-bold block">Cover Banner Photo</label>
                                <div 
                                  id="cover-dropzone"
                                  className="border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-2xl p-4 text-center cursor-pointer bg-white transition-all flex flex-col items-center justify-center min-h-[120px] relative overflow-hidden group"
                                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-indigo-500", "bg-indigo-50/20"); }}
                                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-indigo-500", "bg-indigo-50/20"); }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove("border-indigo-500", "bg-indigo-50/20");
                                    const file = e.dataTransfer.files?.[0];
                                    if (file && file.type.startsWith("image/")) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        if (typeof reader.result === "string") setEditCoverPhoto(reader.result);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  onClick={() => document.getElementById("cover-file-input")?.click()}
                                >
                                  <input 
                                    type="file" 
                                    id="cover-file-input" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          if (typeof reader.result === "string") setEditCoverPhoto(reader.result);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                  {editCoverPhoto || currentUser.coverPhoto ? (
                                    <div className="flex flex-col items-center gap-1.5 z-10 w-full px-2">
                                      <img 
                                        src={editCoverPhoto || currentUser.coverPhoto} 
                                        alt="Selected Cover Picture" 
                                        className="h-10 w-full rounded-lg object-cover border-2 border-indigo-500 shadow-xs" 
                                      />
                                      <span className="text-[9px] text-indigo-600 font-mono font-bold uppercase tracking-wide">Banner Loaded</span>
                                      <span className="text-[8px] text-gray-400">{editCoverPhoto ? "New cover selected" : "Current cover picture"}</span>
                                    </div>
                                  ) : (
                                    <div className="text-gray-450 flex flex-col items-center gap-1 z-10">
                                      <Upload className="w-5 h-5 mb-0.5 text-gray-300 group-hover:text-indigo-500" />
                                      <p className="text-[10px] font-semibold text-gray-600 group-hover:text-indigo-600">Select or Drag Banner</p>
                                      <p className="text-[8px]">Supports horizontal images</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2.5">
                          <button onClick={() => setIsEditingProfile(false)} className="text-xs px-3.5 py-1.5 text-gray-500 hover:text-gray-800">Cancel</button>
                          <button onClick={saveProfileEdits} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-xs">Save Changes</button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* COLLABORATOR REVEAL PLAYLISTS PANEL */}
                <div className="bg-white border rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-display font-semibold text-gray-900 text-sm flex items-center gap-2">
                      <ListMusic className="w-5 h-5 text-indigo-500" />
                      Collaborative Playlists Joined ({playlists.filter(p => p.collaborators.includes(currentUser.id)).length})
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Active shared playlist channels you are collaborating on as a curator.</p>
                  </div>

                  {playlists.filter(p => p.collaborators.includes(currentUser.id)).length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-2xl">
                      <p className="text-xs text-gray-400">Not part of any shared playlists yet.</p>
                      <button 
                        onClick={() => setActiveTab("playlists")}
                        className="text-[10px] text-indigo-600 font-bold hover:underline mt-1"
                      >
                        Create one now +
                      </button>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {playlists
                        .filter(p => p.collaborators.includes(currentUser.id))
                        .map((pl) => (
                          <div 
                            key={pl.id}
                            onClick={() => {
                              setInitialSelectedPlaylistId(pl.id);
                              setActiveTab("playlists");
                            }}
                            className="flex items-center gap-3 p-3 border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-xs transition-all cursor-pointer bg-slate-50/50 group"
                          >
                            <img src={pl.coverUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-xs" />
                            <div className="min-w-0 flex-1">
                              <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">VIBE ROOM</span>
                              <h4 className="font-display font-bold text-slate-800 text-xs sm:text-sm truncate group-hover:text-indigo-650 transition-colors leading-tight mt-0.5">{pl.name}</h4>
                              <p className="text-[10px] text-gray-450 mt-1 truncate">{pl.songs.length} track{pl.songs.length !== 1 ? "s" : ""} • {pl.collaborators.length} collaborator{pl.collaborators.length !== 1 ? "s" : ""}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* B. Create Post Comprehensive Interactive Builder */}
                <div className="bg-white border rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <h3 className="font-display font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                      <PlusCircle className="w-5 h-5 text-indigo-500" />
                      Create New Post
                    </h3>
                    
                    {/* Gemini AI Action Belt */}
                    <div className="flex gap-2">
                      <button 
                        onClick={routeGeminiSuggest}
                        disabled={isAiLoading}
                        className="text-[9px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-full border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                        title="Analyze text and suggest corresponding popular Spotify songs & mood tags"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Mood Match
                      </button>
                      <button 
                        onClick={generateAiCaption}
                        disabled={isAiLoading}
                        className="text-[9px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-full border border-emerald-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                        title="Generate a poetic caption based on feelings"
                      >
                        Generate AI Caption
                      </button>
                    </div>
                  </div>

                  <form onSubmit={createMusicPost} className="space-y-4">
                    
                    {/* Text field */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-semibold uppercase">How is your day going?</label>
                      <textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="Today was stressful but staying beautiful... let Gemini match your style!"
                        className="w-full text-xs border border-gray-100 rounded-2xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-20 bg-gray-50 resize-none font-sans"
                      />
                    </div>

                    {/* Select Mood Indicator */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 font-semibold uppercase block">Select Current Mood</label>
                      <div className="flex flex-wrap gap-1.5">
                        {["Happy", "Sad", "Excited", "Motivated", "Relaxed", "Angry", "Heartbroken", "Grateful", "Tired"].map((m) => {
                          const isActive = postMood === m;
                          const mappedTheme = MOOD_THEMES[m as MoodType] || MOOD_THEMES.Relaxed;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setPostMood(m);
                                setCurrentDisplayMood(m as MoodType);
                              }}
                              className={`text-[10px] font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                                isActive 
                                  ? mappedTheme.primaryButton + " border-transparent"
                                  : "bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700/50 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300"
                              }`}
                            >
                              {mappedTheme.emoji} {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      
                      {/* Attached Spotify track selection widget */}
                      <div className="space-y-2 border border-dashed rounded-3xl p-4 bg-gray-50/20 relative">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase block">Attach Spotify Track</span>
                        
                        {selectedSong ? (
                          <div className="bg-slate-900 text-white rounded-2xl p-3 flex gap-3 items-center justify-between border">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img src={selectedSong.artworkUrl} alt={selectedSong.title} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                              <div className="min-w-0">
                                <h5 className="font-display font-semibold text-xs leading-none truncate text-white">{selectedSong.title}</h5>
                                <span className="text-[10px] text-gray-400 mt-1 block truncate">{selectedSong.artist}</span>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => { setSelectedSong(null); setLyricsDraft(""); setHighlightedLyrics([]); }}
                              className="text-gray-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <button
                              type="button"
                              onClick={() => setSearchSongOpen(!searchSongOpen)}
                              className="w-full text-xs bg-slate-900 active:scale-95 text-white hover:bg-black font-semibold py-2 px-3 rounded-full flex items-center justify-center gap-1.5"
                            >
                              <Music className="w-4 h-4 text-emerald-400" />
                              Search Music Stream Catalogue
                            </button>

                            {searchSongOpen && (
                              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-3xl shadow-lg p-3 z-10 max-h-52 overflow-y-auto space-y-1.5">
                                <input 
                                  type="text" 
                                  placeholder="Keyword, artist..."
                                  value={postSongSearch}
                                  onChange={(e) => performPostSongSearch(e.target.value)}
                                  className="w-full border text-xs px-3 py-1.5 rounded-xl bg-gray-50 focus:outline-none mb-2"
                                />
                                {matchedSearchSongs.map((s) => (
                                  <button
                                    key={s.trackId}
                                    type="button"
                                    onClick={() => {
                                      setSelectedSong(s);
                                      setSearchSongOpen(false);
                                      setPostSongSearch("");
                                      setMatchedSearchSongs([]);
                                    }}
                                    className="w-full flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-xl text-left text-xs"
                                  >
                                    <img src={s.artworkUrl} alt="" className="w-8 h-8 rounded shrink-0 object-cover" referrerPolicy="no-referrer" />
                                    <div className="truncate">
                                      <p className="font-semibold text-slate-800 leading-tight block">{s.title}</p>
                                      <span className="text-[10px] text-gray-400 block">{s.artist}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Attached media options */}
                      <div className="space-y-2 border border-dashed rounded-3xl p-4 bg-gray-50/20">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase block">Attach Cover Photo</span>
                        
                        {attachedImageUrl ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 justify-between bg-slate-100 rounded-2xl p-2 text-xs">
                              <span className="truncate max-w-xs">{attachedImageUrl.startsWith("data:") ? "Custom uploaded photo" : attachedImageUrl}</span>
                              <button type="button" onClick={() => setAttachedImageUrl("")} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <img src={attachedImageUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl border" />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Drag and Drop zone */}
                            <div 
                              id="post-image-dropzone"
                              className="border border-dashed border-gray-300 hover:border-indigo-450 rounded-2xl p-4 text-center cursor-pointer bg-white transition-all flex flex-col items-center justify-center min-h-[90px] relative group"
                              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-indigo-500", "bg-indigo-50/20"); }}
                              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-indigo-500", "bg-indigo-50/20"); }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove("border-indigo-500", "bg-indigo-50/20");
                                const file = e.dataTransfer.files?.[0];
                                if (file && file.type.startsWith("image/")) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === "string") setAttachedImageUrl(reader.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              onClick={() => document.getElementById("post-image-input")?.click()}
                            >
                              <input 
                                type="file" 
                                id="post-image-input" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      if (typeof reader.result === "string") setAttachedImageUrl(reader.result);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <div className="text-gray-400 flex flex-col items-center gap-1">
                                <Upload className="w-5 h-5 mb-0.5 text-gray-300 group-hover:text-indigo-500" />
                                <p className="text-[10px] font-semibold text-gray-600 group-hover:text-indigo-600">Drag or Click to Upload Image 📸</p>
                                <p className="text-[8px] text-gray-400">Supports JPEG, PNG, WEBP, GIF</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-gray-400 uppercase tracking-widest block font-bold">Or Quick Preset:</span>
                              <div className="flex-1 border-t border-gray-100"></div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setAttachedImageUrl("https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80")}
                                className="text-[9px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 py-1.5 px-3 rounded-full flex-1 transition-all cursor-pointer"
                              >
                                📷 Concert Preset
                              </button>
                              <button
                                type="button"
                                onClick={() => setAttachedImageUrl("https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80")}
                                className="text-[9px] bg-slate-50 text-slate-700 hover:bg-slate-100 border py-1.5 px-3 rounded-full flex-1 transition-all cursor-pointer"
                              >
                                🌌 Cozy Preset
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Complex Lyrics interactive Highlight widget */}
                    {selectedSong && (
                      <div className="space-y-2 border rounded-3xl p-4 bg-slate-50/50">
                        <div className="flex justify-between items-center mb-1">
                          <div>
                            <span className="text-[10px] text-slate-900 font-bold uppercase block">Interactive Song Lyrics Paste</span>
                            <p className="text-[9px] text-gray-400">Click on your favorite lyric lines to HIGHLIGHT them prominently on your published post!</p>
                          </div>
                          {lyricsDraft && (
                            <button 
                              type="button" 
                              onClick={() => setLyricsDraft("")}
                              className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              Clear Panel
                            </button>
                          )}
                        </div>

                        {lyricsDraft ? (
                          <div className="space-y-1.5 p-3.5 bg-white border rounded-2xl max-h-40 overflow-y-auto divide-y divide-gray-50">
                            {lyricsDraft.split("\n").map((line, idx) => {
                              const isSelected = highlightedLyrics.includes(line);
                              return (
                                <div 
                                  key={idx}
                                  onClick={() => toggleLyricHighlightSelection(line)}
                                  className={`py-1 px-2 rounded-lg cursor-pointer transition-colors text-xs font-mono select-none flex items-center justify-between ${
                                    isSelected 
                                      ? "bg-indigo-50 text-indigo-950 font-semibold border-l-2 border-indigo-500" 
                                      : "hover:bg-slate-50 text-gray-600"
                                  }`}
                                >
                                  <span>{line}</span>
                                  {isSelected && <span className="text-[8px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full uppercase scale-90">Highlighted</span>}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <textarea
                            value={lyricsDraft}
                            onChange={(e) => setLyricsDraft(e.target.value)}
                            placeholder="Well, good for you, I guess you moved on easily...&#10;Is it a fever dream high in the quiet night..."
                            className="w-full text-xs font-mono border border-gray-100 rounded-2xl p-2.5 h-20 bg-white"
                          />
                        )}
                      </div>
                    )}

                    {/* Submit Button form */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={!postContent.trim() && !selectedSong}
                        className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white disabled:bg-gray-100 disabled:text-gray-400 px-6 py-3 rounded-full text-xs font-semibold transition-all shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        Publish Post Log to Friends
                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    </div>

                  </form>
                </div>

                {/* C. Grid / Chronological view selector for own posts */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white border p-3 rounded-2xl">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">Your Feed History ({posts.filter(p => p.userId === currentUser.id).length})</span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => setProfileViewMode("timeline")}
                        className={`text-[9px] font-bold px-3 py-1 rounded-full border transition-all ${
                          profileViewMode === "timeline" ? "bg-indigo-100 border-indigo-200 text-indigo-700" : "bg-white text-gray-500"
                        }`}
                      >
                        Timeline View
                      </button>
                      <button 
                        onClick={() => setProfileViewMode("grid")}
                        className={`text-[9px] font-bold px-3 py-1 rounded-full border transition-all ${
                          profileViewMode === "grid" ? "bg-indigo-100 border-indigo-200 text-indigo-700" : "bg-white text-gray-500"
                        }`}
                      >
                        Grid View
                      </button>
                    </div>
                  </div>

                  {posts.filter(p => p.userId === currentUser.id).length === 0 ? (
                    <div className="text-center py-10 bg-white border rounded-3xl">
                      <p className="text-xs text-gray-400">You haven't posted any emotions or music yet!</p>
                    </div>
                  ) : profileViewMode === "timeline" ? (
                    <div className="space-y-4">
                      {posts
                        .filter((p) => p.userId === currentUser.id)
                        .map((post) => (
                          <FeedCard 
                            key={post.id}
                            post={post}
                            currentUser={currentUser}
                            onLike={handleLike}
                            onSave={handleSave}
                            onComment={handleCommentSubmit}
                            onRepost={handleRepostSubmit}
                            onDelete={handleDeletePost}
                            currentPlayingSong={globalSong}
                            isPlayingGlobal={isGlobalPlaying}
                            onPlaySong={handlePlayGlobalSong}
                            onPauseSong={handlePauseGlobalSong}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {posts
                        .filter((p) => p.userId === currentUser.id)
                        .map((post) => (
                          <div key={post.id} className="bg-white border p-4 rounded-3xl space-y-3 flex flex-col justify-between">
                            <div>
                              <span className="text-[9px] bg-indigo-50 text-indigo-700 border px-2 py-0.5 rounded-full">{post.mood}</span>
                              <p className="text-xs text-gray-700 font-sans line-clamp-3 mt-2">{post.content}</p>
                            </div>
                            {post.song && (
                              <div className="bg-slate-900 text-white rounded-xl p-2.5 flex items-center gap-2">
                                <img src={post.song.artworkUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" referrerPolicy="no-referrer" />
                                <span className="truncate text-[10px] block font-medium">{post.song.title}</span>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* SECURE ADMIN PANEL TAB */}
            {activeTab === "admin" && (
              <AdminPanel 
                posts={posts}
                onDeletePost={handleDeletePost}
              />
            )}

            {/* COLLABORATIVE PLAYLISTS TAB */}
            {activeTab === "playlists" && (
              <CollaborativePlaylists 
                currentUser={currentUser}
                users={users}
                songsDb={songsDb}
                initialSelectedPlaylistId={initialSelectedPlaylistId}
                onClearInitialPlaylistId={() => setInitialSelectedPlaylistId(null)}
                currentPlayingSong={globalSong}
                isPlayingGlobal={isGlobalPlaying}
                onPlaySong={handlePlayGlobalSong}
                onPauseSong={handlePauseGlobalSong}
              />
            )}

            {/* GOOGLE WORKSPACE HUB TAB */}
            {activeTab === "workspace" && (
              <WorkspaceHub 
                isDarkMode={isDarkMode}
                playlists={playlists}
              />
            )}

          </div>

        </main>

        {/* 3. Mobile Navigation Bottom Bar (Sticky at viewport bottom) */}
        <nav className={`fixed md:hidden bottom-0 left-0 right-0 h-16 ${isDarkMode ? "bg-slate-900/95 border-slate-800 text-white" : "bg-white/95 border-gray-150 text-slate-950"} backdrop-blur-md border-t flex items-center justify-around px-4 z-40 transition-colors shadow-lg`}>
          
          <button 
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-transform active:scale-95 ${activeTab === "home" ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-gray-450"}`}
          >
            <Home className="w-5.5 h-5.5 stroke-2" />
            <span className="text-[9px] mt-0.5 font-medium">Home</span>
          </button>

          <button 
            onClick={() => setActiveTab("discover")}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-transform active:scale-95 ${activeTab === "discover" ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-gray-450"}`}
          >
            <Search className="w-5.5 h-5.5 stroke-2" />
            <span className="text-[9px] mt-0.5 font-medium">Explore</span>
          </button>

          <button 
            onClick={() => setActiveTab("messages")}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-transform active:scale-95 relative ${activeTab === "messages" ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-gray-450"}`}
          >
            <MessageSquare className="w-5.5 h-5.5 stroke-2" />
            {notifications.some(n => n.type === "message" && !n.read) && (
              <span className="absolute top-1 right-6 w-2 h-2 bg-indigo-600 rounded-full" />
            )}
            <span className="text-[9px] mt-0.5 font-medium">DMs</span>
          </button>

          <button 
            onClick={() => setActiveTab("playlists")}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-transform active:scale-95 ${activeTab === "playlists" ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-gray-450"}`}
          >
            <ListMusic className="w-5.5 h-5.5 stroke-2" />
            <span className="text-[9px] mt-0.5 font-medium">Collab</span>
          </button>

          <button 
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-transform active:scale-95 ${activeTab === "profile" ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-gray-450"}`}
          >
            <img 
              src={currentUser.avatar} 
              alt="DP" 
              className={`w-6 h-6 rounded-full object-cover border ${activeTab === "profile" ? "border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/25" : "border-gray-300 dark:border-slate-700"}`}
              referrerPolicy="no-referrer"
            />
            <span className="text-[9px] mt-0.5 font-medium">Profile</span>
          </button>

        </nav>

        {/* ================= GLOBAL REAL-TIME AUDIO PLAYER ================= */}
        {globalSong && (
          isPlayerMinimized ? (
            /* Minimized Player View - Small floating badge */
            <div 
              className={`fixed bottom-[76px] md:bottom-6 right-4 z-40 p-2.5 rounded-2xl shadow-2xl border flex items-center gap-3 transition-all duration-300 hover:scale-[1.03] ${
                isDarkMode 
                  ? "bg-slate-900/95 border-slate-800 text-white backdrop-blur-md" 
                  : "bg-white/95 border-gray-150 text-slate-900 backdrop-blur-md"
              }`}
              style={{ minWidth: "190px", maxWidth: "260px" }}
            >
              <div 
                className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 shadow border border-white/10 cursor-pointer"
                onClick={() => setIsPlayerMinimized(false)}
                title="Expand Music Player"
              >
                <img 
                  src={globalSong.artworkUrl} 
                  alt={globalSong.title} 
                  className={`w-full h-full object-cover ${isGlobalPlaying ? "animate-[spin_6s_linear_infinite]" : "scale-95"}`}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Text details */}
              <div 
                className="min-w-0 flex-1 cursor-pointer" 
                onClick={() => setIsPlayerMinimized(false)} 
                title="Expand Music Player"
              >
                <p className="font-display font-semibold text-[11px] truncate leading-tight">
                  {globalSong.title}
                </p>
                <span className="text-[9px] text-gray-400 block truncate">{globalSong.artist}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={isGlobalPlaying ? handlePauseGlobalSong : handleResumeGlobalSong}
                  className="w-6 h-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
                  title={isGlobalPlaying ? "Pause" : "Play"}
                >
                  {isGlobalPlaying ? (
                    <Pause className="w-2.5 h-2.5 text-white fill-current" />
                  ) : (
                    <Play className="w-2.5 h-2.5 text-white fill-current ml-0.5" />
                  )}
                </button>

                <button 
                  onClick={() => setIsPlayerMinimized(false)}
                  className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                  title="Expand Player"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                
                <button 
                  onClick={() => {
                    handlePauseGlobalSong();
                    setGlobalSong(null);
                    setActiveStationId(null);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                  title="Cancel Music"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Full Audio Player Bar */
            <div 
              className={`fixed bottom-16 md:bottom-0 left-0 right-0 h-20 border-t backdrop-blur-lg z-30 transition-all shadow-2xl flex items-center px-4 md:px-8 justify-between gap-4 ${
                isDarkMode 
                  ? "bg-slate-950/90 border-slate-800/85 text-white" 
                  : "bg-white/95 border-gray-150 text-slate-900"
              }`}
            >
              {/* Left Track Branding info */}
              <div className="flex items-center gap-3.5 min-w-0 max-w-[280px]">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/10">
                  <img 
                    src={globalSong.artworkUrl} 
                    alt={globalSong.title} 
                    className={`w-full h-full object-cover transition-transform duration-500 ${isGlobalPlaying ? "animate-[spin_8s_linear_infinite]" : "scale-95"}`}
                    referrerPolicy="no-referrer"
                  />
                  
                  {isGlobalPlaying && (
                    <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h5 className="font-display font-semibold text-xs md:text-sm truncate leading-tight flex items-center gap-1.5">
                    {globalSong.title}
                  </h5>
                  <span className="text-[10px] text-gray-400 block truncate mt-0.5 font-medium">{globalSong.artist}</span>
                  
                  {/* Station channel tracker indicator */}
                  {activeStationId && (
                    <div className="flex items-center gap-1 mt-1 shrink-0">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-[8px] tracking-wider uppercase text-red-500 font-bold font-mono">
                        {activeStationId === "station_ai_radio" ? "AI Radio Active 📻" : "Live Room Sync 🎧"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Central Stream Playback Controls */}
              <div className="flex-1 flex flex-col items-center max-w-xl">
                {/* Monologue AI Subtitles Sheet */}
                {isAiDjSpeaking && (
                  <div className="absolute bottom-22 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-indigo-950/95 border border-indigo-500/35 backdrop-blur-md p-3 rounded-2xl shadow-xl z-50 text-center animate-bounce">
                    <span className="text-[9px] bg-indigo-500 text-white font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-md inline-block mb-1">
                      📻 DJ Spark Live
                    </span>
                    <p className="text-white font-mono italic text-[11px] leading-relaxed select-none">
                      "{aiDjSpeech}"
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-5">
                  {/* Skip back */}
                  <button 
                    onClick={() => handleSkipGlobal(-1)}
                    className="p-1.5 text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                    title="Previous song"
                  >
                    <ArrowLeft className="w-5 h-5 fill-current" />
                  </button>

                  {/* Main Action trigger play/pause */}
                  <button 
                    onClick={isGlobalPlaying ? handlePauseGlobalSong : handleResumeGlobalSong}
                    className="w-10 h-10 bg-indigo-650 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {isGlobalPlaying ? (
                      <Pause className="w-4.5 h-4.5 text-white fill-current" />
                    ) : (
                      <Play className="w-4.5 h-4.5 text-white fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Skip next */}
                  <button 
                    onClick={() => handleSkipGlobal(1)}
                    className="p-1.5 text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                    title="Next song"
                  >
                    <ArrowRight className="w-5 h-5 fill-current" />
                  </button>
                </div>

                {/* Progress Line bar */}
                <div className="w-full flex items-center gap-3 mt-1.5 text-[10px] font-mono font-medium text-gray-400">
                  <span className="w-8 text-right shrink-0">{Math.floor(globalCurrentTime / 60)}:{Math.floor(globalCurrentTime % 60) < 10 ? "0" : ""}{Math.floor(globalCurrentTime % 60)}</span>
                  
                  <input 
                    type="range"
                    min="0"
                    max={globalDuration}
                    step="0.5"
                    value={globalCurrentTime}
                    onChange={(e) => handleSeekGlobal(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 rounded-lg appearance-none bg-indigo-150 dark:bg-slate-800 accent-indigo-600 focus:outline-none cursor-pointer"
                  />

                  <span className="w-8 shrink-0">{Math.floor(globalDuration / 60)}:{Math.floor(globalDuration % 60) < 10 ? "0" : ""}{Math.floor(globalDuration % 60)}</span>
                </div>
              </div>

              {/* Right side Device adjustment sliders and View State triggers */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="hidden sm:flex items-center gap-3">
                  {/* Co-listening Reactions */}
                  {activeStationId && (
                    <div className="flex items-center gap-1.5 mr-2">
                      <button 
                        onClick={() => {
                          const newEmoji = {
                            id: Math.random().toString(),
                            char: "❤️",
                            left: Math.floor(Math.random() * 80) + 10
                          };
                          setFloatingEmojis(prev => [...prev, newEmoji]);
                          setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id)), 3000);
                        }}
                        className="p-1.5 bg-gray-50 dark:bg-slate-900 border rounded-full hover:scale-110 active:scale-95 text-xs transition-all cursor-pointer"
                        title="Send Heart"
                      >
                        ❤️
                      </button>
                      <button 
                        onClick={() => {
                          const newEmoji = {
                            id: Math.random().toString(),
                            char: "🔥",
                            left: Math.floor(Math.random() * 80) + 10
                          };
                          setFloatingEmojis(prev => [...prev, newEmoji]);
                          setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id)), 3000);
                        }}
                        className="p-1.5 bg-gray-50 dark:bg-slate-900 border rounded-full hover:scale-110 active:scale-95 text-xs transition-all cursor-pointer"
                        title="Send Fire"
                      >
                        🔥
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={handleMuteGlobal}
                    className="p-1.5 text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {isGlobalMuted ? (
                      <VolumeX className="w-4.5 h-4.5" />
                    ) : (
                      <Volume2 className="w-4.5 h-4.5" />
                    )}
                  </button>

                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isGlobalMuted ? 0 : globalVolume}
                    onChange={(e) => handleVolumeGlobal(parseFloat(e.target.value))}
                    className="w-20 md:w-24 h-1 rounded-lg appearance-none bg-indigo-150 dark:bg-slate-800 accent-indigo-600 focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Always visible player view state controls */}
                <div className="flex items-center gap-1.5 pl-2.5 border-l border-gray-250 dark:border-slate-800">
                  <button 
                    onClick={() => setIsLyricsOpen(!isLyricsOpen)}
                    className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 text-xs px-2.5 ${
                      isLyricsOpen 
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold" 
                        : "text-gray-400 hover:text-indigo-650 hover:bg-gray-100 dark:hover:bg-slate-850"
                    }`}
                    title="Toggle Song Lyrics"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden md:inline font-bold">Lyrics</span>
                  </button>
                  <button 
                    onClick={() => setIsPlayerMinimized(true)}
                    className="p-1.5 text-gray-400 hover:text-indigo-650 hover:bg-gray-100 dark:hover:bg-slate-850 rounded-full transition-all cursor-pointer"
                    title="Minimize Player"
                  >
                    <Minimize2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      handlePauseGlobalSong();
                      setGlobalSong(null);
                      setActiveStationId(null);
                      setIsLyricsOpen(false);
                    }}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-slate-850 rounded-full transition-all cursor-pointer"
                    title="Close Player"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {/* ================= FLOATING GLASSMORPHIC LYRICS SHEET ================= */}
        {isLyricsOpen && globalSong && (
          <div 
            className={`fixed right-4 md:right-8 bottom-24 w-[350px] max-w-[calc(100vw-2rem)] h-[450px] max-h-[60vh] rounded-3xl border z-40 flex flex-col shadow-2xl transition-all animate-in slide-in-from-bottom-5 duration-300 ${
              isDarkMode 
                ? "bg-slate-900/95 border-indigo-500/20 text-white backdrop-blur-xl" 
                : "bg-white/95 border-indigo-100 text-slate-900 backdrop-blur-xl"
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-850" : "border-gray-100"}`}>
              <div className="flex items-center gap-2 min-w-0">
                <Music className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-display font-semibold text-xs truncate leading-none">{globalSong.title}</h4>
                  <span className="text-[9px] text-gray-400 block truncate mt-1">Live Karaoke View • {globalSong.artist}</span>
                </div>
              </div>
              <button 
                onClick={() => setIsLyricsOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-red-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11.5px] leading-relaxed">
              {isLyricsLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3.5 text-center text-gray-400">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-[10px] max-w-[200px] leading-normal animate-pulse">Contacting Google AI Grounding Search to compile official verified lyrics sheet...</p>
                </div>
              ) : globalLyrics ? (
                globalLyrics.split("\n").filter(line => line.trim().length > 0).map((line, idx) => (
                  <div 
                    key={idx} 
                    className="group flex justify-between items-start gap-4 hover:bg-indigo-500/5 p-1.5 px-2 rounded-xl transition-all"
                  >
                    <span className="flex-1 text-slate-300 dark:text-gray-200 italic leading-snug">
                      {line}
                    </span>
                    <button 
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(line);
                        } catch {}
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-indigo-500 p-0.5 rounded transition-opacity shrink-0 cursor-pointer text-gray-400"
                      title="Copy line font excerpt"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500 active:scale-90" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                  <Music className="w-7 h-7 text-indigo-300 animate-bounce mb-2" />
                  <p className="text-[10px] italic">No active lyrics catalog. Stream another track to query AI grounding.</p>
                </div>
              )}
            </div>
            
            {/* Real-time sync footer */}
            <div className={`p-3 text-[9px] text-center tracking-wider font-semibold uppercase font-mono ${isDarkMode ? "bg-black/20 text-indigo-400 border-t border-slate-800" : "bg-gray-50 text-indigo-600 border-t border-gray-100"}`}>
              🎸 Powered by Google Gemini Grounding
            </div>
          </div>
        )}

      </div>

      {/* Disappearing Stories Immersive full-screen visual modal */}
      {viewingStory && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50">
          
          <div className="max-w-md w-full aspect-[9/16] bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl border border-white/5 flex flex-col justify-between">
            
            {/* Background Image blur cover */}
            <div className="absolute inset-0 z-0">
              <img src={viewingStory.imageUrl} alt="" className="w-full h-full object-cover blur-md opacity-25" referrerPolicy="no-referrer" />
            </div>

            {/* Bar progress indicators (Ticks 100%) */}
            <div className="relative z-10 px-4 pt-4 flex gap-1.5">
              <span className="h-1 bg-white flex-1 rounded-full animate-[pulse_10s_infinite]" />
              <span className="h-1 bg-white/20 flex-1 rounded-full" />
            </div>

            {/* Story profile Header metadata */}
            <div className="relative z-10 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3.5">
                <img src={viewingStory.avatar} alt="" className="w-9 h-9 rounded-full object-cover border" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="font-display font-semibold text-white text-xs">{viewingStory.displayName}</h4>
                  <span className="text-[9px] text-gray-300">@{viewingStory.username} • {viewingStory.timestamp}</span>
                </div>
              </div>
              <button 
                onClick={() => setViewingStory(null)}
                className="text-white/60 hover:text-white bg-black/25 hover:bg-black/40 p-2 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Story artwork focal panel with floating player */}
            <div className="relative z-10 mx-5 my-auto overflow-hidden rounded-2xl aspect-square border border-white/10 shadow-lg">
              <img src={viewingStory.imageUrl} alt="Story highlight focus" className="w-full h-full object-cover" />
              
              {/* Playback live track indicator */}
              {viewingStory.song && (
                <div className="absolute bottom-3 left-3 right-3 bg-black/60 border border-white/10 p-2.5 rounded-2xl backdrop-blur-md flex gap-2.5 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute top-1 right-1" />
                  <img src={viewingStory.song.artworkUrl} alt="" className="w-7.5 h-7.5 rounded-lg object-cover" referrerPolicy="no-referrer" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[8px] text-emerald-400 font-bold block leading-none">PLAYING BACKGROUND</span>
                    <h5 className="font-medium text-white text-[10px] truncate leading-tight mt-0.5">{viewingStory.song.title}</h5>
                  </div>
                </div>
              )}
            </div>

            {/* Highlighted text/lyrics footer context */}
            <div className="relative z-10 bg-gradient-to-t from-black via-black/85 to-transparent p-5 text-center space-y-2 mt-auto">
              <span className="inline-block text-[9px] bg-indigo-600/35 border border-indigo-400/20 text-indigo-200 px-3 py-0.5 rounded-full font-bold">
                Feeling: {viewingStory.mood}
              </span>
              <p className="text-white font-mono italic text-xs leading-relaxed">
                "{viewingStory.lyricsHighlight || "Sailing through the daily waveforms..."}"
              </p>
            </div>

          </div>
        </div>
      )}



    </div>
  );
}
