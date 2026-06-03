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
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-all relative font-sans">
      
      {/* Instagram Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-slate-800/40">
        <div className="flex items-center gap-3">
          {/* Instagram Avatar with Gradient Ring */}
          <div className="p-[2.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 rounded-full">
            <img 
              src={post.avatar} 
              alt={post.displayName} 
              className="w-9 h-9 rounded-full object-cover border border-white dark:border-slate-900"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xs text-slate-900 dark:text-slate-100 leading-none hover:underline cursor-pointer">
                {post.displayName}
              </span>
              {currentUser.id === post.userId && (
                <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-sans font-semibold">You</span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 block">@{post.username} • {post.timestamp}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Elegant Mood Tag */}
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${moodVibe.bg.replace('bg-', 'bg-opacity-80 bg-')}`}>
            <span>{moodVibe.emoji}</span>
            <span>{post.mood}</span>
          </span>

          {/* More Options dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsOptionsOpen(!isOptionsOpen)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {isOptionsOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-750 rounded-xl shadow-lg py-1.5 z-10 text-xs">
                {currentUser.id !== post.userId && (
                  <>
                    {onMute && (
                      <button 
                        onClick={() => { onMute(post.userId); setIsOptionsOpen(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-600 dark:text-gray-300 hover:text-gray-900"
                      >
                        Mute @{post.username}
                      </button>
                    )}
                    {onBlock && (
                      <button 
                        onClick={() => { onBlock(post.userId); setIsOptionsOpen(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-red-500 hover:text-red-400"
                      >
                        Block @{post.username}
                      </button>
                    )}
                  </>
                )}
                {(currentUser.id === post.userId || isAdmin) && onDelete && (
                  <button 
                    onClick={() => { if (confirm("Delete this post?")) onDelete(post.id); setIsOptionsOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/35 text-red-650 hover:text-red-500 font-semibold"
                  >
                    Delete Post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Instagram Post Body / Media Layer (Full-width like Instagram) */}
      <div className="relative bg-slate-50 dark:bg-slate-950/20">
        
        {/* Post Text Caption Overlay as main cover if no image */}
        {(!post.attachedImages || post.attachedImages.length === 0) ? (
          <div className="px-6 py-10 text-center flex flex-col items-center justify-center min-h-[220px] bg-linear-to-tr from-slate-50 to-indigo-50/40 dark:from-slate-900/40 dark:to-slate-950/80">
            <p className="text-gray-800 dark:text-gray-200 text-sm md:text-base font-medium leading-relaxed max-w-md whitespace-pre-wrap italic">
              "{post.content}"
            </p>
          </div>
        ) : (
          /* Full Edge Image Layout */
          <div className="overflow-hidden bg-gray-900 flex justify-center items-center select-none relative aspect-square">
            {post.attachedImages.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                alt="Feed Media" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
        )}
      </div>

      {/* Spotify & Music Layer Integration (If present) */}
      {post.song && (
        <div className="border-t border-b border-gray-50 dark:border-slate-800/40 bg-slate-50/70 dark:bg-slate-900/60 px-4 py-3 flex gap-3.5 items-center relative group overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Compact album artwork */}
          <div className="relative w-11 h-11 rounded-lg overflow-hidden shadow-xs shrink-0 bg-gray-800 border dark:border-slate-700">
            <img 
              src={post.song.artworkUrl} 
              alt={post.song.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={togglePlayback}
              className="absolute inset-0 flex items-center justify-center bg-black/60 hover:bg-black/75 transition-colors text-white cursor-pointer"
            >
              {isPlaying ? (
                <div className="flex gap-0.5 items-end h-4">
                  <span className="w-0.5 bg-emerald-400 animate-[pulse_0.8s_infinite] h-2.5" />
                  <span className="w-0.5 bg-emerald-400 animate-[pulse_1.2s_infinite] h-4" />
                  <span className="w-0.5 bg-emerald-400 animate-[pulse_0.9s_infinite] h-2" />
                </div>
              ) : (
                <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
              )}
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <h5 className="font-semibold text-gray-900 dark:text-slate-150 text-xs truncate leading-tight">{post.song.title}</h5>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{post.song.artist} — {post.song.album}</p>
          </div>

          <span className="text-[8px] tracking-wider font-bold text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded-full shrink-0 uppercase">Preview</span>

          {post.song.externalUrl && (
            <a 
              href={post.song.externalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Open on Spotify"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Excerpted Lyrics Frame */}
      {post.lyrics && (
        <div className="px-5 py-3 border-b border-gray-50 dark:border-slate-800/40 bg-slate-50/20 dark:bg-slate-950/10 font-mono text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 relative">
          <div className="absolute top-2 right-4 text-gray-300">
            <BookOpen className="w-3.5 h-3.5 opacity-30" />
          </div>
          <div className="space-y-1 pl-2 border-l border-indigo-200 dark:border-slate-800">
            {post.lyrics.split("\n").map((line, idx) => {
              const isHighlighted = post.highlightedLyrics?.some((hl) => 
                line.toLowerCase().trim() === hl.toLowerCase().trim() || 
                line.toLowerCase().trim().includes(hl.toLowerCase().trim())
              );
              return (
                <p 
                  key={idx} 
                  className={`px-1 rounded ${
                    isHighlighted 
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-350 font-semibold" 
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

      {/* Instagram Action Toolbars */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button 
              onClick={() => onLike(post.id)}
              className="text-gray-700 dark:text-gray-200 hover:text-rose-500 dark:hover:text-rose-450 transition-transform active:scale-90 cursor-pointer"
            >
              <Heart className={`w-6 h-6 ${post.likes.includes(currentUser.id) ? "fill-rose-500 text-rose-500" : "stroke-2"}`} />
            </button>

            {/* Comment */}
            <button 
              onClick={() => setShowComments(!showComments)}
              className="text-gray-700 dark:text-gray-200 hover:text-indigo-650 dark:hover:text-indigo-400 transition-transform active:scale-90 cursor-pointer"
            >
              <MessageCircle className="w-6 h-6 stroke-2" />
            </button>

            {/* Repost */}
            <button 
              onClick={() => setShowRepostModal(true)}
              className="text-gray-700 dark:text-gray-200 hover:text-emerald-500 dark:hover:text-emerald-400 transition-transform active:scale-90 cursor-pointer"
            >
              <Share2 className="w-5.5 h-5.5 stroke-2" />
            </button>
          </div>

          {/* Bookmark Save */}
          <button 
            onClick={() => onSave(post.id)}
            className="text-gray-700 dark:text-gray-200 hover:text-amber-500 dark:hover:text-amber-455 transition-transform active:scale-90 cursor-pointer"
          >
            <Bookmark className={`w-6 h-6 ${post.savedBy.includes(currentUser.id) ? "fill-amber-500 text-amber-500" : "stroke-2"}`} />
          </button>
        </div>

        {/* Likes Count Bold */}
        <div className="text-xs font-bold text-gray-900 dark:text-slate-100 cursor-pointer hover:opacity-80 transition-opacity">
          {post.likes.length === 0 ? (
            <span>Be the first to like this</span>
          ) : post.likes.length === 1 ? (
            <span>1 like</span>
          ) : (
            <span>{post.likes.length.toLocaleString()} likes</span>
          )}
        </div>

        {/* Captions Section */}
        {post.attachedImages && post.attachedImages.length > 0 && (
          <div className="text-xs text-gray-800 dark:text-gray-150 mt-1 leading-relaxed">
            <span className="font-bold text-gray-900 dark:text-slate-100 mr-2 hover:underline cursor-pointer">
              {post.displayName}
            </span>
            <span className="whitespace-pre-wrap">{post.content}</span>
          </div>
        )}

        {/* Repost Tracker Label */}
        {post.repostCount > 0 && (
          <div className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-1 flex items-center gap-1">
            <Share2 className="w-3 h-3" />
            <span>Shared {post.repostCount} times across channels</span>
          </div>
        )}

        {/* Instagram Inline Reply Previews (2-3 items) */}
        {!showComments && post.comments.length > 0 && (
          <div className="mt-2 space-y-1">
            <button 
              onClick={() => setShowComments(true)}
              className="text-gray-400 dark:text-gray-500 text-[11px] font-medium leading-none hover:underline focus:outline-none"
            >
              View all {post.comments.length} replies
            </button>
            {post.comments.slice(-2).map((com) => (
              <div key={com.id} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1 leading-relaxed">
                <span className="font-bold text-gray-900 dark:text-slate-100 mr-1.5 shrink-0 hover:underline cursor-pointer">
                  {com.displayName.split(" ")[0]}
                </span>
                <span className="truncate">{com.content}</span>
              </div>
            ))}
          </div>
        )}

        {/* Time Stamp */}
        <span className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold block mt-1.5">
          {post.timestamp}
        </span>
      </div>

      {/* Expandable Comments Drawer Area */}
      {showComments && (
        <div className="border-t border-gray-50 dark:border-slate-800/40 p-4 space-y-3 bg-slate-50/20 dark:bg-slate-900/10">
          <div className="flex justify-between items-center mb-1">
            <h5 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Discussion Thread • {post.comments.length}</h5>
            <button 
              onClick={() => setShowComments(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-[10px] font-bold focus:outline-none"
            >
              Minimize
            </button>
          </div>
          
          {post.comments.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2">No comments yet. Start the conversation!</p>
          ) : (
            <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
              {post.comments.map((com) => (
                <div key={com.id} className="flex gap-2.5 items-start">
                  <img 
                    src={com.avatar} 
                    alt={com.displayName} 
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-100 dark:border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-slate-200 hover:underline cursor-pointer">{com.displayName}</span>
                      <span className="text-[9px] text-gray-400">{com.timestamp}</span>
                    </div>
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 block -mt-1">@{com.username}</span>
                    <p className="text-gray-600 dark:text-gray-300 text-xs mt-1 leading-relaxed font-sans">{com.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instagram Bottom Inline Comment Composer */}
      <div className="border-t border-gray-100 dark:border-slate-800/40 px-4 py-2 bg-white dark:bg-slate-900 flex items-center justify-between">
        <form onSubmit={handleCommentSubmit} className="w-full flex gap-3 items-center">
          <Smile className="w-5.5 h-5.5 text-gray-400 dark:text-gray-500 shrink-0 cursor-pointer hover:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Add a comment..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            className="flex-1 text-xs border-0 py-2.5 focus:ring-0 focus:outline-none bg-transparent placeholder-gray-400 dark:placeholder-gray-500 text-slate-800 dark:text-slate-150"
          />
          <button 
            type="submit"
            disabled={!commentInput.trim()}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-0 transition-opacity cursor-pointer shrink-0"
          >
            Post
          </button>
        </form>
      </div>

      {/* Repost Options Modal */}
      {showRepostModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-500 animate-pulse" />
              Repost original to feed
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">You can optionally write a comment or thoughts to quote alongside @{post.username}'s music post.</p>
            
            <textarea 
              value={repostText}
              onChange={(e) => setRepostText(e.target.value)}
              placeholder="What are your thoughts on this vibe?"
              className="w-full text-xs border border-gray-100 dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-24 resize-none mb-4 bg-gray-50/50 dark:bg-slate-950/70 text-slate-800 dark:text-slate-200"
            />

            <div className="flex justify-end gap-3 z-50">
              <button 
                onClick={() => setShowRepostModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
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
    </div>
  );
}
