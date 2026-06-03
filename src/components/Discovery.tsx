/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Music, Users, ArrowUpRight, TrendingUp, Play, Pause, 
  Library, Sparkles, Globe, Volume2, VolumeX, Copy, PlusCircle, Check, Disc
} from "lucide-react";
import { Song, User } from "../types";

interface DiscoveryProps {
  songsDb: Song[];
  users: User[];
  currentUser: User;
  onFollowToggle: (userId: string) => void;
  onPostSelectSong?: (song: Song) => void;
}

export default function Discovery({
  songsDb,
  users,
  currentUser,
  onFollowToggle,
  onPostSelectSong,
}: DiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "songs" | "creators">("all");
  
  // Global search & lyrics state
  const [globalSongs, setGlobalSongs] = useState<Song[]>([]);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  const [lyricsSong, setLyricsSong] = useState<Song | null>(null);
  const [fullLyrics, setFullLyrics] = useState("");
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [copiedLineIdx, setCopiedLineIdx] = useState<number | null>(null);

  // Audio playback state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchLyrics = async (song: Song) => {
    setIsLoadingLyrics(true);
    setFullLyrics("");
    try {
      const resp = await fetch(`/api/songs/lyrics?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`);
      if (resp.ok) {
        const data = await resp.json();
        setFullLyrics(data.lyrics || "Lyrics are preparing, tune in soon...");
      } else {
        setFullLyrics("Lyrics are temporarily offline. Enjoy the alignment of the rhythm.");
      }
    } catch {
      setFullLyrics("Failed to link lyrics database. Feel free to sail through the waves.");
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  const handleGlobalSearch = async (term: string) => {
    if (!term || term.trim().length < 2) return;
    setIsGlobalSearching(true);
    try {
      const resp = await fetch(`/api/spotify/search?q=${encodeURIComponent(term)}`);
      if (resp.ok) {
        const data = await resp.json();
        setGlobalSongs(data);
      }
    } catch (err) {
      console.warn("Global Spotify AI locator failed:", err);
    } finally {
      setIsGlobalSearching(false);
    }
  };

  const toggleSongPlay = (song: Song) => {
    if (playingId === song.spotifyId) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(song.previewUrl);
      audio.loop = true;
      audio.volume = isMuted ? 0 : audioVolume;
      audioRef.current = audio;

      // Register listeners
      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
      });
      audio.addEventListener("loadedmetadata", () => {
        setTotalDuration(audio.duration || 180);
      });

      audio.play().catch(() => {});
      setPlayingId(song.spotifyId);
      setLyricsSong(song);
      fetchLyrics(song);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setAudioVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : val;
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioRef.current) {
      audioRef.current.volume = nextMute ? 0 : audioVolume;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekVal = parseFloat(e.target.value);
    setCurrentTime(seekVal);
    if (audioRef.current) {
      audioRef.current.currentTime = seekVal;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const copyLyricLine = (line: string, idx: number) => {
    navigator.clipboard.writeText(line);
    setCopiedLineIdx(idx);
    setTimeout(() => {
      setCopiedLineIdx(null);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // Filter local standard list
  const matchingSongs = songsDb.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Merge local list and globally found songs ensuring no duplicate spotifyId
  const combinedMap = new Map<string, Song>();
  matchingSongs.forEach((s) => combinedMap.set(s.spotifyId, s));
  globalSongs.forEach((s) => combinedMap.set(s.spotifyId, s));
  const displayedSongs = Array.from(combinedMap.values());

  const matchingCreators = users.filter(
    (u) =>
      u.id !== currentUser.id &&
      (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.bio && u.bio.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const TRENDING_LYRICS = [
    { text: "Fever dream high in the quiet of the night", song: "Cruel Summer", artist: "Taylor Swift" },
    { text: "Well, good for you, I guess you moved on easily", song: "Good 4 U", artist: "Olivia Rodrigo" },
    { text: "Lights will guide you home", song: "Fix You", artist: "Coldplay" },
  ];

  const TRENDING_MOODS = [
    { mood: "Relaxed", count: 840, change: "+14%", emoji: "🍃" },
    { mood: "Happy", count: 520, change: "+8%", emoji: "☀️" },
    { mood: "Excited", count: 320, change: "+25%", emoji: "⚡" },
    { mood: "Sad", count: 180, change: "-4%", emoji: "🌧️" },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-6 font-sans">
      
      {/* Central Interactive Column: Search & Results */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Search header panel */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display font-semibold text-gray-900 text-lg">World Song Directory</h3>
              <p className="text-xs text-gray-400">Search globally to locate, play, and extract lyrics of any song around the earth</p>
            </div>
            <Globe className="w-5 h-5 text-indigo-500 animate-spin" style={{ animationDuration: "12s" }} />
          </div>

          {/* Interactive Global Input Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
              <input 
                type="text" 
                placeholder="Search locally, or type ANY song in the world (e.g. 'Bohemian Rhapsody')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleGlobalSearch(searchQuery);
                  }
                }}
                className="w-full text-xs pl-11 pr-4 py-3 border border-gray-100 rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/50 text-gray-800"
              />
            </div>
            <button
              onClick={() => handleGlobalSearch(searchQuery)}
              disabled={isGlobalSearching || searchQuery.trim().length < 2}
              className={`px-4 text-xs font-semibold rounded-2xl flex items-center gap-1.5 transition-all text-white active:scale-95 cursor-pointer selection-none ${
                isGlobalSearching 
                  ? "bg-indigo-400 cursor-not-allowed" 
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-md"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {isGlobalSearching ? "Locating..." : "Locate via AI"}
            </button>
          </div>

          {/* Filtering tabs */}
          <div className="flex gap-2">
            {(["all", "songs", "creators"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs px-4 py-1.5 rounded-full font-semibold capitalize transition-all ${
                  activeTab === tab 
                    ? "bg-slate-900 text-white" 
                    : "bg-gray-50 border border-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Query Results Roll */}
        <div className="space-y-4">
          
          {/* Songs matches */}
          {(activeTab === "all" || activeTab === "songs") && (
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-emerald-500" />
                  Available Alignments ({displayedSongs.length})
                </span>
                {isGlobalSearching && (
                  <span className="text-[10px] text-indigo-500 animate-pulse flex items-center gap-1">
                    <Globe className="w-3 h-3 animate-spin" /> Deep searching global catalogs...
                  </span>
                )}
              </h4>

              {displayedSongs.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 italic">No matches locally. Type your song and hit 'Locate via AI' for global lookup!</div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {displayedSongs.map((song) => (
                    <div 
                      key={song.spotifyId} 
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-4 group ${
                        playingId === song.spotifyId 
                          ? "bg-gradient-to-r from-indigo-50/80 to-white border-indigo-200 shadow-sm" 
                          : "bg-gray-50/40 hover:bg-gray-50 border-gray-100/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-slate-800 shadow-xs">
                          <img src={song.artworkUrl} alt={song.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            onClick={() => toggleSongPlay(song)}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          >
                            {playingId === song.spotifyId ? (
                              <Pause className="w-4.5 h-4.5" />
                            ) : (
                              <Play className="w-4.5 h-4.5 fill-current" />
                            )}
                          </button>
                          
                          {playingId === song.spotifyId && (
                            <div className="absolute bottom-1 right-1 flex gap-0.5 items-end h-2.5 bg-black/50 px-1 rounded-xs">
                              <span className="w-0.5 bg-indigo-400 h-1.5 animate-[pulse_0.8s_infinite]" />
                              <span className="w-0.5 bg-indigo-400 h-2.5 animate-[pulse_1.2s_infinite]" />
                              <span className="w-0.5 bg-indigo-400 h-1 animate-[pulse_0.9s_infinite]" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-display font-medium text-gray-900 text-xs truncate leading-tight flex items-center gap-1.5">
                            {song.title}
                            {song.spotifyId.startsWith("gen_grounded_") && (
                              <span className="text-[8px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">World</span>
                            )}
                          </h5>
                          <span className="text-[10px] text-gray-400 truncate block mt-0.5">{song.artist} — {song.album}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setLyricsSong(song);
                            fetchLyrics(song);
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors shrink-0"
                        >
                          Lyrics
                        </button>

                        {onPostSelectSong && (
                          <button 
                            onClick={() => onPostSelectSong(song)}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors shrink-0"
                          >
                            Attach to post
                          </button>
                        )}
                        {song.externalUrl && (
                          <a 
                            href={song.externalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-1 px-1.5 text-gray-400 hover:text-green-500 rounded hover:bg-gray-100 transition-colors flex items-center"
                            title="Open on Spotify"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Creators Matches */}
          {(activeTab === "all" || activeTab === "creators") && (
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-3">
                <Users className="w-4 h-4 text-indigo-500" />
                Featured Creators ({matchingCreators.length})
              </h4>

              {matchingCreators.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 italic">No creators matching query found.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {matchingCreators.map((creator) => {
                    const isFollowing = currentUser.followingIds.includes(creator.id);
                    return (
                      <div 
                        key={creator.id} 
                        className="p-3 bg-gray-50/50 border border-gray-100 rounded-2xl flex flex-col justify-between h-36"
                      >
                        <div className="flex gap-3 items-start min-w-0">
                          <img 
                            src={creator.avatar} 
                            alt={creator.displayName} 
                            className="w-9 h-9 rounded-full object-cover border animate-pulse"
                            style={{ animationDuration: "10s" }}
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h5 className="font-display font-semibold text-gray-950 text-xs truncate leading-tight">{creator.displayName}</h5>
                            <span className="text-[10px] text-gray-400 block">@{creator.username}</span>
                            <p className="text-[10px] text-gray-600 line-clamp-2 mt-1 leading-normal font-sans">{creator.bio}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-gray-100">
                          <div className="text-[9px] text-gray-400 font-mono">
                            <span>{creator.followersCount} followers</span>
                          </div>
                          <button
                            onClick={() => onFollowToggle(creator.id)}
                            className={`text-[9px] font-bold px-3 py-1 rounded-full transition-all ${
                              isFollowing 
                                ? "bg-gray-100 text-gray-500 hover:bg-gray-200" 
                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}
                          >
                            {isFollowing ? "Following" : "Follow"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Right Sidebar: Active Live Player, Lyrics Sheet, & Trends */}
      <div className="space-y-6">
        
        {/* Dynamic AI Lyrics & Live Media Player Interface */}
        {lyricsSong && (
          <div className="bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 text-white border border-indigo-500/20 rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Disc className="w-40 h-40 animate-spin text-white" style={{ animationDuration: "4s" }} />
            </div>

            <div className="relative z-10 space-y-4">
              
              {/* Top Header Label */}
              <div className="flex justify-between items-center">
                <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 font-semibold tracking-wider text-[9px] uppercase px-2.5 py-0.5 rounded-full border border-indigo-400/30 font-mono">
                  <Sparkles className="w-3 h-3 text-indigo-300" /> Grounded AI Player
                </span>
                
                {playingId === lyricsSong.spotifyId && (
                  <div className="flex gap-1 items-end h-4 font-mono text-[9px] text-emerald-400">
                    <span className="w-1 bg-emerald-400 h-2 animate-[pulse_0.7s_infinite]" />
                    <span className="w-1 bg-emerald-400 h-4 animate-[pulse_1s_infinite]" />
                    <span className="w-1 bg-emerald-400 h-1.5 animate-[pulse_0.8s_infinite]" />
                    <span className="font-semibold ml-1">Live Synth</span>
                  </div>
                )}
              </div>

              {/* Dynamic Song Info Card */}
              <div className="flex gap-3 items-center">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-md bg-indigo-900 border border-white/10 flex-shrink-0 animate-pulse" style={{ animationDuration: "8s" }}>
                  <img src={lyricsSong.artworkUrl} alt="" className="w-full h-full object-cover" />
                  {playingId === lyricsSong.spotifyId && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/40 py-0.5 flex justify-center">
                      <Music className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-semibold text-white text-sm truncate leading-snug">{lyricsSong.title}</h4>
                  <p className="text-gray-400 text-xs truncate">{lyricsSong.artist}</p>
                  <p className="text-gray-500 text-[10px] truncate leading-normal italic mt-0.5">{lyricsSong.album}</p>
                </div>
              </div>

              {/* Interactive Player Controls */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-3 space-y-2 text-xs">
                {/* Seek Slider bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-400 font-mono w-8 text-right">{formatTime(currentTime)}</span>
                  <input 
                    type="range"
                    min="0"
                    max={totalDuration}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 accent-indigo-400 bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer selection:outline-none"
                  />
                  <span className="text-[9px] text-gray-400 font-mono w-8">{formatTime(totalDuration)}</span>
                </div>

                {/* Sub-controls panel */}
                <div className="flex justify-between items-center pt-1">
                  
                  {/* Play & Pause core button */}
                  <button 
                    onClick={() => toggleSongPlay(lyricsSong)}
                    className="bg-indigo-600 hover:bg-indigo-500 rounded-full p-2.5 shadow-md flex items-center justify-center active:scale-95 transition-all text-white cursor-pointer"
                  >
                    {playingId === lyricsSong.spotifyId ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Volume Slider bar */}
                  <div className="flex items-center gap-2 max-w-[120px] bg-black/10 px-2.5 py-1 rounded-xl border border-white/5">
                    <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={audioVolume}
                      onChange={handleVolumeChange}
                      className="w-12 accent-indigo-400 cursor-pointer h-1 rounded-lg appearance-none bg-white/20"
                    />
                  </div>

                  {/* Add reference button */}
                  {onPostSelectSong && (
                    <button 
                      onClick={() => onPostSelectSong(lyricsSong)}
                      className="bg-white/10 hover:bg-white/25 hover:text-emerald-300 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Post Link
                    </button>
                  )}
                </div>
              </div>

              {/* Verified Song Lyrics Terminal Sheet */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-mono uppercase tracking-widest text-indigo-300/80 font-bold flex items-center gap-1 bg-black/20 p-2 rounded-xl">
                  <Globe className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Live Karaoke Lyrics
                </h5>

                <div className="bg-black/30 border border-white/5 rounded-2xl p-3.5 max-h-[300px] overflow-y-auto space-y-2.5 font-mono text-[11px] leading-relaxed select-text text-gray-200">
                  {isLoadingLyrics ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                      <Globe className="w-8 h-8 text-indigo-400 animate-spin" />
                      <p className="text-[10px] text-gray-400 text-center animate-pulse">Contacting Google AI Grounding Search to compile official verified lyrics sheet...</p>
                    </div>
                  ) : fullLyrics ? (
                    fullLyrics.split("\n").filter(line => line.trim().length > 0).map((line, idx) => (
                      <div 
                        key={idx} 
                        className="group flex justify-between items-start gap-3 hover:bg-white/5 p-1 px-1.5 rounded-lg transition-colors"
                      >
                        <span className="flex-1 text-gray-100 italic">
                          {line}
                        </span>
                        <button 
                          onClick={() => copyLyricLine(line, idx)}
                          className="opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-indigo-300 p-0.5 rounded focus:opacity-100 transition-opacity flex-shrink-0 cursor-pointer"
                          title="Copy this lyric line"
                        >
                          {copiedLineIdx === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic text-center py-6">No lyrics are retrieved for this alignment yet. Play above to trigger grounding search.</p>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Trending moods panel */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <h4 className="font-display font-semibold text-gray-900 text-sm flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            Trending Moods
          </h4>
          <div className="divide-y divide-gray-50">
            {TRENDING_MOODS.map((tm, idx) => (
              <div key={idx} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="font-bold text-gray-300 w-4">#{idx+1}</span>
                  <span className="text-sm">{tm.emoji}</span>
                  <span className="font-semibold text-gray-800">{tm.mood}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-800 font-mono block font-bold">{tm.count} shares</span>
                  <span className="text-[9px] text-emerald-500 font-bold block">{tm.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending lyrics with quick visual quotes */}
        <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-2 right-2 text-indigo-400/20">
            <Sparkles className="w-16 h-16 pointer-events-none animate-pulse" />
          </div>
          <h4 className="font-display font-semibold text-gray-900 text-sm flex items-center gap-1.5 relative">
            Trending Highlighted Lyrics
          </h4>
          
          <div className="space-y-3 relative z-10 text-xs text-gray-600">
            {TRENDING_LYRICS.map((lyr, idx) => (
              <div key={idx} className="bg-white border rounded-2xl p-3 flex flex-col justify-between shadow-xs">
                <blockquote className="italic mb-2 font-mono font-medium leading-relaxed">
                  "{lyr.text}"
                </blockquote>
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span className="font-semibold truncate text-slate-800 leading-tight block">{lyr.song}</span>
                  <span className="text-[9px] font-mono shrink-0 font-medium">{lyr.artist}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
