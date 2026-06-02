/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Shield, Sparkles, Activity, AlertTriangle, Trash2, CheckCircle, RefreshCw, Layers } from "lucide-react";
import { Post } from "../types";

interface AdminPanelProps {
  posts: Post[];
  onDeletePost: (postId: string) => void;
}

interface AdminMetrics {
  totalUsers: number;
  premiumUsers: number;
  totalPosts: number;
  totalMessages: number;
  moodDistribution: { name: string; count: number }[];
  reportedItems: { id: string; type: string; reason: string; author: string; date: string }[];
}

export default function AdminPanel({
  posts,
  onDeletePost,
}: AdminPanelProps) {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionDoneMsg, setActionDoneMsg] = useState("");

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/metrics");
      const data = await resp.json();
      setMetrics(data);
    } catch {
      // Offline fallback metrics
      setMetrics({
        totalUsers: 4,
        premiumUsers: 1,
        totalPosts: posts.length,
        totalMessages: 6,
        moodDistribution: [
          { name: "Relaxed", count: 8 },
          { name: "Happy", count: 5 },
          { name: "Excited", count: 3 },
          { name: "Heartbroken", count: 2 },
        ],
        reportedItems: [
          { id: "post_3", type: "Post", reason: "Copyright dispute on lyrics selection", author: "guitar_hero", date: "June 2, 2026" }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [posts]);

  const handleModerationAction = (postId: string) => {
    onDeletePost(postId);
    setActionDoneMsg("Inappropriate post deleted from database.");
    setTimeout(() => setActionDoneMsg(""), 3000);
  };

  if (!metrics) {
    return (
      <div className="flex justify-center items-center h-64 font-sans text-xs text-gray-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Booting Secure Management Node...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border border-red-500/10 rounded-3xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden flex items-center gap-4">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Shield className="w-24 h-24 text-red-500" />
        </div>
        <div className="bg-red-500/10 text-red-400 p-3.5 rounded-2xl border border-red-500/20 shrink-0">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] bg-red-500/20 text-red-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">SYSTEM AUTHORITY LEVEL 3</span>
          <h3 className="font-display font-semibold text-lg mt-1.5">MoodTunes Platform Admin Control</h3>
          <p className="text-gray-300 text-xs mt-1">Review live metrics, moderate posted text/lyrics, and manage premium flags.</p>
        </div>
      </div>

      {actionDoneMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{actionDoneMsg}</span>
        </div>
      )}

      {/* Grid: Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white border rounded-3xl p-4 shadow-xs">
          <span className="text-[10px] uppercase text-gray-400 font-bold">Total Accounts</span>
          <p className="text-xl font-display font-semibold text-gray-900 mt-1">{metrics.totalUsers}</p>
          <span className="text-[9px] text-gray-400 block mt-1">3 active seed accounts</span>
        </div>

        <div className="bg-white border rounded-3xl p-4 shadow-xs">
          <span className="text-[10px] uppercase text-gray-400 font-bold">Premium Tier</span>
          <p className="text-xl font-display font-semibold text-indigo-600 mt-1">{metrics.premiumUsers}</p>
          <span className="text-[9px] text-indigo-400 block mt-1">{(metrics.premiumUsers / metrics.totalUsers * 100).toFixed(0)}% penetration</span>
        </div>

        <div className="bg-white border rounded-3xl p-4 shadow-xs">
          <span className="text-[10px] uppercase text-gray-400 font-bold">Total Posts</span>
          <p className="text-xl font-display font-semibold text-gray-900 mt-1">{metrics.totalPosts}</p>
          <span className="text-[9px] text-gray-400 block mt-1">Instant database sync</span>
        </div>

        <div className="bg-white border rounded-3xl p-4 shadow-xs">
          <span className="text-[10px] uppercase text-gray-400 font-bold">Encrypted DMs</span>
          <p className="text-xl font-display font-semibold text-emerald-600 mt-1">{metrics.totalMessages}</p>
          <span className="text-[9px] text-emerald-400 block mt-1">Peer chatting logs</span>
        </div>

      </div>

      {/* Grid Main body */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Moderation Panel List */}
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <h4 className="font-display font-semibold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-50 pb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            Live Moderation Console
          </h4>
          
          <div className="divide-y divide-gray-50 space-y-3.5 max-h-96 overflow-y-auto pr-1">
            {posts.map((post) => (
              <div key={post.id} className="pt-3 flex gap-3 justify-between items-start first:pt-0">
                <div className="min-w-0 flex-1">
                  <div className="flex gap-2 items-center">
                    <img src={post.avatar} alt="Author" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <span className="text-xs font-semibold text-gray-900">{post.displayName}</span>
                    <span className="text-[10px] text-gray-300">@{post.username}</span>
                  </div>
                  <p className="text-xs text-gray-600 font-sans mt-2 line-clamp-2 italic bg-slate-50 p-2.5 rounded-2xl border border-slate-100/50">
                    "{post.content}"
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[9px] text-gray-400">
                    <span>Mood: <strong className="text-slate-600">{post.mood}</strong></span>
                    <span>•</span>
                    <span>Likes: <strong>{post.likes.length}</strong></span>
                    {post.song && (
                      <>
                        <span>•</span>
                        <span className="truncate">Attached: {post.song.title}</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleModerationAction(post.id)}
                  className="bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 text-red-600 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                  title="Remove content"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Aggregated distribution logs */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="font-display font-semibold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-50 pb-3">
              <Layers className="w-4 h-4 text-indigo-500" />
              Mood Frequencies
            </h4>
            <div className="space-y-3 mt-3">
              {metrics.moodDistribution.map((m) => (
                <div key={m.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>{m.name}</span>
                    <span>{m.count} post logs</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(m.count / metrics.totalPosts * 100) || 20}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 text-xs text-indigo-950 flex flex-col gap-1.5 mt-4">
            <span className="font-bold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              Automated Sentinel Guard
            </span>
            <p className="text-[10px] leading-relaxed text-indigo-800">
              Platform is backed by server-side safety checks from the Gemini LLM model, scanning metadata content upon creation.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
