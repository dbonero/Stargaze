/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, Music, Users, ArrowUpRight, TrendingUp, Play, Pause, Library, Heart, Sparkles } from "lucide-react";
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
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  // Audio state
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const toggleSongPlay = (song: Song) => {
    if (playingId === song.spotifyId) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(song.previewUrl);
      audioRef.current.loop = true;
      audioRef.current.play().catch(() => {});
      setPlayingId(song.spotifyId);
    }
  };

  React.useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // Filtering songs & profiles
  const matchingSongs = songsDb.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      
      {/* Central Interactive Column: Search list */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Search header panel */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display font-semibold text-gray-900 text-lg">Search & Discovery</h3>
              <p className="text-xs text-gray-400">Scan artists, songs, mood tags, and creators on MoodTunes</p>
            </div>
            <Library className="w-5 h-5 text-indigo-500" />
          </div>

          {/* Input field */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
            <input 
              type="text" 
              placeholder="Search by song name, artist, username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-11 pr-4 py-3 border border-gray-100 rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/50 text-gray-800"
            />
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
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-3">
                <Music className="w-4 h-4 text-emerald-500" />
                Audio Alignments ({matchingSongs.length})
              </h4>

              {matchingSongs.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 italic">No songs found in standard libraries. Search dynamically above!</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {matchingSongs.map((song) => (
                    <div 
                      key={song.spotifyId} 
                      className="p-3 bg-gray-50/40 hover:bg-gray-50 rounded-2xl border border-gray-100/40 transition-colors flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                          <img src={song.artworkUrl} alt={song.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            onClick={() => toggleSongPlay(song)}
                            className="absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          >
                            {playingId === song.spotifyId ? (
                              <div className="flex gap-0.5 items-end h-3">
                                <span className="w-0.5 bg-white h-2 animate-[pulse_0.8s_infinite]" />
                                <span className="w-0.5 bg-white h-3 animate-[pulse_1.2s_infinite]" />
                                <span className="w-0.5 bg-white h-1.5 animate-[pulse_0.9s_infinite]" />
                              </div>
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                          </button>
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-display font-medium text-gray-900 text-xs truncate leading-tight">{song.title}</h5>
                          <span className="text-[10px] text-gray-400 truncate block mt-0.5">{song.artist} — {song.album}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
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
                            className="p-1 text-gray-400 hover:text-green-500 rounded hover:bg-gray-100 transition-colors"
                            title="Listen on Spotify"
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
                            className="w-9 h-9 rounded-full object-cover border"
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

      {/* Right Sidebar: Hashtag trends & music statistics */}
      <div className="space-y-6">
        
        {/* Trending moods panel */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <h4 className="font-display font-semibold text-gray-900 text-sm flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            Trending Moods
          </h4>
          <div className="divide-y divide-gray-50">
            {TRENDING_MOODS.map((tm, idx) => (
              <div key={idx} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-gray-300 w-4">#{idx+1}</span>
                  <span className="text-sm">{tm.emoji}</span>
                  <span className="font-medium text-gray-800">{tm.mood}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-800 font-mono block">{tm.count} shares</span>
                  <span className="text-[9px] text-emerald-500 font-bold block">{tm.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending lyrics with quick visual quotes */}
        <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-2 right-2 text-indigo-400/20">
            <Sparkles className="w-16 h-16 pointer-events-none" />
          </div>
          <h4 className="font-display font-semibold text-gray-900 text-sm flex items-center gap-1.5 relative">
            Trending Highlighted Lyrics
          </h4>
          
          <div className="space-y-3 relative z-10 text-xs">
            {TRENDING_LYRICS.map((lyr, idx) => (
              <div key={idx} className="bg-white border rounded-2xl p-3 flex flex-col justify-between shadow-xs">
                <blockquote className="italic text-gray-600 mb-2 font-mono font-medium leading-relaxed">
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
