/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Heart, MessageCircle, Share2, Bookmark, Flame, Play, Pause, ExternalLink, Trash, 
  Smile, CornerDownRight, ArrowRight, BookOpen, Crown 
} from "lucide-react";
import { Post, Song, Comment, User } from "../types";

interface FeedCardProps {
  key?: string | number;
  post: Post;
  currentUser: User;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onRepost: (postId: string, repostComment?: string) => void;
  onUnfollow?: (userId: string) => void;
  onBlock?: (userId: string) => void;
  onMute?: (userId: string) => void;
  onDelete?: (postId: string) => void;
  isAdmin?: boolean;
}

export default function FeedCard({
  post,
  currentUser,
  onLike,
  onSave,
  onComment,
  onRepost,
  onUnfollow,
  onBlock,
  onMute,
  onDelete,
  isAdmin = false
}: FeedCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostText, setRepostText] = useState("");
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // Audio elements
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (post.song && post.song.previewUrl) {
      audioRef.current = new Audio(post.song.previewUrl);
      audioRef.current.loop = true;
      audioRef.current.onended = () => setIsPlaying(false);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [post.song]);

  const togglePlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Pause other playing players (by dispatching custom event if needed)
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onComment(post.id, commentInput.trim());
    setCommentInput("");
  };

  const triggerRepost = () => {
    onRepost(post.id, repostText.trim());
    setRepostText("");
    setShowRepostModal(false);
  };

  // Vibe indicators based on mood
  const getMoodStyles = (mood: string) => {
    switch (mood) {
      case "Happy":
        return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", emoji: "☀️" };
      case "Sad":
        return { bg: "bg-blue-50 text-blue-700 border-blue-200", emoji: "🌧️" };
      case "Excited":
        return { bg: "bg-orange-50 text-orange-700 border-orange-200", emoji: "⚡" };
      case "Motivated":
        return { bg: "bg-rose-50 text-rose-700 border-rose-200", emoji: "🔥" };
      case "Relaxed":
        return { bg: "bg-teal-50 text-teal-700 border-teal-200", emoji: "🍃" };
      case "Angry":
        return { bg: "bg-red-50 text-red-700 border-red-200", emoji: "💢" };
      case "Heartbroken":
        return { bg: "bg-purple-50 text-purple-700 border-purple-200", emoji: "💔" };
      case "Grateful":
        return { bg: "bg-amber-50 text-amber-700 border-amber-200", emoji: "🙏" };
      case "Tired":
        return { bg: "bg-slate-50 text-slate-700 border-slate-200", emoji: "💤" };
      default:
        return { bg: "bg-gray-50 text-gray-700 border-gray-200", emoji: "🎵" };
    }
  };

  const moodVibe = getMoodStyles(post.mood);

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all relative">
      
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img 
            src={post.avatar} 
            alt={post.displayName} 
            className="w-12 h-12 rounded-full object-cover border-2 border-white ring-2 ring-gray-100"
            referrerPolicy="no-referrer"
          />
          <div>
            <h4 className="font-display font-semibold text-gray-900 flex items-center gap-1.5 leading-tight">
              {post.displayName}
              {currentUser.id === post.userId && (
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-sans">You</span>
              )}
            </h4>
            <span className="text-xs text-gray-400">@{post.username} • {post.timestamp}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mood Badge */}
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${moodVibe.bg}`}>
            <span>{moodVibe.emoji}</span>
            <span>{post.mood}</span>
          </span>

          {/* Settings Menu Button */}
          <div className="relative">
            <button 
              onClick={() => setIsOptionsOpen(!isOptionsOpen)}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {isOptionsOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-10 font-sans text-xs">
                {currentUser.id !== post.userId && (
                  <>
                    {onMute && (
                      <button 
                        onClick={() => { onMute(post.userId); setIsOptionsOpen(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                      >
                        Mute @{post.username}
                      </button>
                    )}
                    {onBlock && (
                      <button 
                        onClick={() => { onBlock(post.userId); setIsOptionsOpen(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-500 hover:bg-red-600"
                      >
                        Block @{post.username}
                      </button>
                    )}
                  </>
                )}
                {(currentUser.id === post.userId || isAdmin) && onDelete && (
                  <button 
                    onClick={() => { if (confirm("Delete post?")) onDelete(post.id); setIsOptionsOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 hover:text-red-700 font-semibold"
                  >
                    Delete Post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Text Update */}
      <p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

      {/* Post Attached Images */}
      {post.attachedImages && post.attachedImages.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-2xl bg-gray-50 border border-gray-100 max-h-80 flex gap-2">
          {post.attachedImages.map((img, idx) => (
            <img 
              key={idx} 
              src={img} 
              alt="Post attachment" 
              className="w-full h-full max-h-80 object-cover hover:scale-[1.02] transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      )}

      {/* Spotify Integrated Player Widget */}
      {post.song && (
        <div className="mb-4 bg-slate-900 hover:bg-black rounded-2xl p-4 flex gap-4 items-center border border-white/10 transition-colors shadow-sm relative group overflow-hidden">
          
          {/* Glow backdrop alignment */}
          <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Cover art with hover play button */}
          <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-md shrink-0 bg-gray-800">
            <img 
              src={post.song.artworkUrl} 
              alt={post.song.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={togglePlayback}
              className="absolute inset-0 flex items-center justify-center bg-black/60 hover:bg-black/75 transition-colors text-white"
            >
              {isPlaying ? (
                <div className="flex gap-0.5 items-end h-6">
                  <span className="w-1 bg-emerald-400 animate-[pulse_0.8s_infinite] h-4" />
                  <span className="w-1 bg-emerald-400 animate-[pulse_1.2s_infinite] h-6" />
                  <span className="w-1 bg-emerald-400 animate-[pulse_0.9s_infinite] h-3" />
                  <span className="w-1 bg-emerald-400 animate-[pulse_1s_infinite] h-5" />
                </div>
              ) : (
                <Play className="w-6 h-6 fill-white text-white ml-0.5" />
              )}
            </button>
          </div>

          {/* Song Data */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">SPOTIFY PREVIEW</span>
              {isPlaying && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Playing live
                </span>
              )}
            </div>
            <h5 className="font-display font-medium text-white text-sm mt-0.5 truncate">{post.song.title}</h5>
            <p className="text-xs text-slate-400 truncate mt-0.5">{post.song.artist} — {post.song.album}</p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {post.song.externalUrl && (
              <a 
                href={post.song.externalUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                title="Open in Spotify"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Lyrics Excerpt Widget */}
      {post.lyrics && (
        <div className="mb-4 bg-slate-50 border border-gray-100 rounded-2xl p-4 font-mono text-[13px] leading-relaxed text-gray-600 relative overflow-hidden">
          <div className="absolute top-2 right-3 text-gray-300">
            <BookOpen className="w-4 h-4 opacity-40" />
          </div>
          <div className="space-y-1">
            {post.lyrics.split("\n").map((line, idx) => {
              const isHighlighted = post.highlightedLyrics?.some((hl) => 
                line.toLowerCase().trim() === hl.toLowerCase().trim() || 
                line.toLowerCase().trim().includes(hl.toLowerCase().trim())
              );
              return (
                <p 
                  key={idx} 
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    isHighlighted 
                      ? "bg-indigo-100/80 text-indigo-950 font-semibold border-l-2 border-indigo-500" 
                      : ""
                  }`}
                >
                  {line}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Reaction Interactions & Action Bar */}
      <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
        
        {/* Like Button */}
        <button 
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-full transition-colors ${
            post.likes.includes(currentUser.id)
              ? "text-rose-600 bg-rose-50"
              : "text-gray-500 hover:text-rose-600 hover:bg-rose-50/50"
          }`}
        >
          <Heart className={`w-4 h-4 ${post.likes.includes(currentUser.id) ? "fill-rose-600 text-rose-600" : ""}`} />
          <span className="font-medium">{post.likes.length}</span>
        </button>

        {/* Comment Roll Trigger */}
        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-full transition-colors ${
            showComments 
              ? "text-indigo-600 bg-indigo-50" 
              : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50"
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="font-medium">{post.comments.length}</span>
        </button>

        {/* Repost content button trigger */}
        <button 
          onClick={() => setShowRepostModal(true)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 hover:bg-emerald-50/50 py-1.5 px-3 rounded-full transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="font-medium">{post.repostCount}</span>
        </button>

        {/* Saved Bookmarks */}
        <button 
          onClick={() => onSave(post.id)}
          className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-full transition-colors ${
            post.savedBy.includes(currentUser.id)
              ? "text-amber-600 bg-amber-50"
              : "text-gray-500 hover:text-amber-600 hover:bg-amber-50/50"
          }`}
        >
          <Bookmark className={`w-4 h-4 ${post.savedBy.includes(currentUser.id) ? "fill-amber-600 text-amber-600" : ""}`} />
          <span className="font-medium">{post.savedBy.includes(currentUser.id) ? "Saved" : "Save"}</span>
        </button>
      </div>

      {/* Repost Options Modal */}
      {showRepostModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-display font-semibold text-lg text-gray-900 mb-2 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-500" />
              Repost original to feed
            </h3>
            <p className="text-xs text-gray-500 mb-4">You can optionally write a comment or thoughts to quote alongside @{post.username}'s music post.</p>
            
            <textarea 
              value={repostText}
              onChange={(e) => setRepostText(e.target.value)}
              placeholder="What are your thoughts on this vibe?"
              className="w-full text-sm border border-gray-100 rounded-2xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-24 resize-none mb-4 bg-gray-50/50"
            />

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowRepostModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={triggerRepost}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full transition-colors flex items-center gap-1"
              >
                Repost Now
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accordion Comments Section */}
      {showComments && (
        <div className="border-t border-gray-50 pt-4 mt-4 space-y-4">
          <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Replies • {post.comments.length}</h5>
          
          {post.comments.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">No updates yet. Be the first to start the vibe!</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {post.comments.map((com) => (
                <div key={com.id} className="flex gap-2.5 items-start bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100/50">
                  <img 
                    src={com.avatar} 
                    alt={com.displayName} 
                    className="w-8 h-8 rounded-full object-cover border border-white shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-950 truncate">{com.displayName}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{com.timestamp}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 block -mt-0.5">@{com.username}</span>
                    <p className="text-gray-600 text-xs mt-1 font-sans">{com.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit reply input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center mt-3 pt-1 border-t border-gray-50">
            <input 
              type="text" 
              placeholder="Inject some musical commentary..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="flex-1 text-xs px-4 py-2 border border-gray-100 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50"
            />
            <button 
              type="submit"
              disabled={!commentInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-100 disabled:text-gray-400 px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-sm flex items-center justify-center"
            >
              Reply
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
