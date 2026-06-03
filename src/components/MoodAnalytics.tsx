/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Sparkles, BarChart2, TrendingUp, Music, ArrowUpRight, ShieldAlert, Zap } from "lucide-react";
import { MoodAnalyticSummary, Song, User } from "../types";

interface MoodAnalyticsProps {
  currentUser: User;
  onUpgradeToPremium: () => void;
}

export default function MoodAnalytics({
  currentUser,
  onUpgradeToPremium,
}: MoodAnalyticsProps) {
  const [insightText, setInsightText] = useState("");
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  
  // Simulated analytics data
  const ANALYTICS_DATA: MoodAnalyticSummary = {
    mostUsedMoods: [
      { name: "Relaxed", count: 8, color: "#14b8a6" },  // Teal
      { name: "Happy", count: 5, color: "#10b981" },    // Emerald
      { name: "Excited", count: 3, color: "#f97316" },  // Orange
      { name: "Sad", count: 2, color: "#3b82f6" },      // Blue
      { name: "Tired", count: 2, color: "#64748b" },    // Slate
    ],
    favoriteSongs: [
      {
        song: {
          spotifyId: "4",
          title: "Midnight Lo-fi Vibe",
          artist: "Chillhop Beats",
          album: "Late Night Coffee",
          artworkUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80",
          previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        },
        count: 14,
      },
      {
        song: {
          spotifyId: "6",
          title: "Cruel Summer",
          artist: "Taylor Swift",
          album: "Lover",
          artworkUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80",
          previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
        },
        count: 8,
      },
      {
        song: {
          spotifyId: "2",
          title: "Fix You",
          artist: "Coldplay",
          album: "X&Y",
          artworkUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&auto=format&fit=crop&q=80",
          previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        },
        count: 5,
      }
    ],
    listeningTrends: [
      { day: "Mon", happy: 30, sad: 40, relaxed: 80, energetic: 20 },
      { day: "Tue", happy: 50, sad: 20, relaxed: 70, energetic: 40 },
      { day: "Wed", happy: 40, sad: 30, relaxed: 90, energetic: 30 },
      { day: "Thu", happy: 60, sad: 10, relaxed: 60, energetic: 50 },
      { day: "Fri", happy: 80, sad: 10, relaxed: 50, energetic: 85 },
      { day: "Sat", happy: 90, sad: 15, relaxed: 40, energetic: 90 },
      { day: "Sun", happy: 70, sad: 20, relaxed: 85, energetic: 60 },
    ],
    moodHistory: [
      { day: "May 27", mood: "Relaxed", intensity: 4 },
      { day: "May 28", mood: "Relaxed", intensity: 4 },
      { day: "May 29", mood: "Sad", intensity: 3 },
      { day: "May 30", mood: "Happy", intensity: 5 },
      { day: "May 31", mood: "Excited", intensity: 5 },
      { day: "Jun 01", mood: "Tired", intensity: 2 },
      { day: "Jun 02", mood: "Relaxed", intensity: 4 },
    ]
  };

  const loadAIInsight = async () => {
    setIsLoadingInsight(true);
    try {
      const resp = await fetch("/api/gemini/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          historyLogs: ANALYTICS_DATA.moodHistory
        })
      });
      const data = await resp.json();
      if (data.insight) {
        setInsightText(data.insight);
      } else {
        setInsightText("Failed to retrieve insights from the core therapist model.");
      }
    } catch {
      setInsightText("Fallback: You are in an incredibly balanced emotional flow! You fluctuate beautifully through healthy ambient listening landscapes, assisting in integrating stressors.");
    } finally {
      setIsLoadingInsight(false);
    }
  };

  useEffect(() => {
    // Proactively load on first transition if normal or premium
    loadAIInsight();
  }, []);

  return (
    <div className="space-y-6">
      


      {/* Analytics Main Dashboard Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left column - Week Mood breakdown pie */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="font-display font-semibold text-gray-900 text-base flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              Emotional Proportions
            </h4>
            <p className="text-xs text-gray-400 mt-1">Which moods you share most frequently on your posts feed</p>
          </div>

          {/* Recharts Pie rendering */}
          <div className="h-48 w-full flex items-center justify-center relative my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ANALYTICS_DATA.mostUsedMoods}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {ANALYTICS_DATA.mostUsedMoods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-display font-bold text-slate-800">20</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Total Logs</span>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 font-sans">
            {ANALYTICS_DATA.mostUsedMoods.map((m, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                <span className="truncate">{m.name} ({m.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center column - Mood trend lines */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-xs md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-display font-semibold text-gray-900 text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Vibe Fluctuations
              </h4>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-50 border px-2.5 py-1 rounded-full">Weekly log</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Interactive monitoring of serene (Relaxed) vs ambient active (Energetic) states</p>
          </div>

          <div className="h-52 w-full my-4 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ANALYTICS_DATA.listeningTrends}>
                <defs>
                  <linearGradient id="colorRelaxed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEnergetic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="relaxed" name="Relaxed Vibe" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorRelaxed)" />
                <Area type="monotone" dataKey="energetic" name="Energetic Level" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorEnergetic)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-50 pt-3">
            <span>Peak Day: <strong className="text-slate-800">Saturday</strong> (Energetics)</span>
            <span>Most Harmonious Segment: <strong className="text-slate-800">Wednesday</strong> (Lo-Fi relaxation)</span>
          </div>
        </div>

      </div>

      {/* Row 2: AI Clinical/Therapist Insights Card */}
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 md:p-6 shadow-inner">
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div className="bg-indigo-600 text-white p-3.5 rounded-2xl shadow-md shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-semibold text-slate-900 text-base">Gemini Therapist Mood Match Insight</h4>
              <button 
                onClick={loadAIInsight}
                disabled={isLoadingInsight}
                className="text-xs bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 font-semibold px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1 disabled:opacity-50"
              >
                {isLoadingInsight ? (
                  <span>Decoding...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Re-Analyze Vibe
                  </>
                )}
              </button>
            </div>
            
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line font-sans">
              {isLoadingInsight 
                ? "Connecting with therapist brain. Analyzing text updates, attached Spotify chords, and mood frequencies for the past 7 days..." 
                : insightText || "Generate AI insight to analyze your weekly balance."}
            </p>
          </div>
        </div>
      </div>

      {/* Row 3: Favorite Songs Alignment */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-xs">
        <h4 className="font-display font-semibold text-gray-900 text-base flex items-center gap-2 mb-4">
          <Music className="w-5 h-5 text-rose-500" />
          Top Mood Aligning Songs
        </h4>
        <div className="space-y-3.5">
          {ANALYTICS_DATA.favoriteSongs.map((fav, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 rounded-2xl border border-gray-100/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-gray-400 w-5 text-center">#{idx + 1}</span>
                <img 
                  src={fav.song.artworkUrl} 
                  alt={fav.song.title} 
                  className="w-10 h-10 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h5 className="font-display font-medium text-gray-900 text-sm">{fav.song.title}</h5>
                  <p className="text-xs text-gray-400">{fav.song.artist}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                  {fav.count} plays this week
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
