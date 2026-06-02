import React, { useState, useEffect } from "react";
import { 
  Plus, Music, Trash2, ArrowUp, ArrowDown, UserPlus, Disc, Users, X, 
  Clock, Send, ChevronRight, MessageSquare, User, CheckCircle
} from "lucide-react";
import { Playlist, PlaylistSong, Song, User as AppUser, Comment } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface CollaborativePlaylistsProps {
  currentUser: AppUser;
  users: AppUser[];
  songsDb: Song[];
  initialSelectedPlaylistId?: string | null;
  onClearInitialPlaylistId?: () => void;
}

export default function CollaborativePlaylists({ 
  currentUser, 
  users, 
  songsDb,
  initialSelectedPlaylistId,
  onClearInitialPlaylistId
}: CollaborativePlaylistsProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Playlist Form State
  const [isCreating, setIsCreating] = useState(false);
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pCover, setPCover] = useState("");
  const [pCollabIds, setPCollabIds] = useState<string[]>([]);

  // Song Search State inside Detail
  const [songSearchQuery, setSongSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Song Comment state
  const [expandedSongComments, setExpandedSongComments] = useState<Record<string, boolean>>({});
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});

  // Preset covers to select from
  const PRESET_COVERS = [
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80", // Concert purple
    "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&auto=format&fit=crop&q=80", // Vinyl
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80", // Dj deck
    "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80", // Lo-fi coffee
    "https://images.unsplash.com/photo-1487180142328-054b783fc471?w=600&auto=format&fit=crop&q=80", // Cassette colorful
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80"  // Neon road
  ];

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/playlists");
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
        
        // Auto select if initialSelectedPlaylistId is provided
        if (initialSelectedPlaylistId) {
          const found = data.find((p: Playlist) => p.id === initialSelectedPlaylistId);
          if (found) {
            setSelectedPlaylist(found);
          }
          if (onClearInitialPlaylistId) {
            onClearInitialPlaylistId();
          }
        } else if (selectedPlaylist) {
          const updatedSelected = data.find((p: Playlist) => p.id === selectedPlaylist.id);
          if (updatedSelected) {
            setSelectedPlaylist(updatedSelected);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load collaborative playlists:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [initialSelectedPlaylistId]);

  // Update selected playlist references
  const refreshSinglePlaylist = async (playlistId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPlaylist(data);
        // Also update list
        setPlaylists(prev => prev.map(p => p.id === playlistId ? data : p));
      }
    } catch (err) {
      console.error("Failed to refresh single playlist:", err);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;

    try {
      const payload = {
        name: pName,
        description: pDesc,
        coverUrl: pCover || PRESET_COVERS[0],
        collaborators: pCollabIds
      };

      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newPl = await res.json();
        setPlaylists(prev => [newPl, ...prev]);
        setIsCreating(false);
        // Reset state
        setPName("");
        setPDesc("");
        setPCover("");
        setPCollabIds([]);
        // Load details immediately
        setSelectedPlaylist(newPl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSong = async (song: Song) => {
    if (!selectedPlaylist) return;
    try {
      const res = await fetch(`/api/playlists/${selectedPlaylist.id}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song })
      });
      if (res.ok) {
        await refreshSinglePlaylist(selectedPlaylist.id);
        setSongSearchQuery("");
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Failed to add song:", err);
    }
  };

  const handleRemoveSong = async (playlistSongId: string) => {
    if (!selectedPlaylist) return;
    if (!confirm("Are you sure you want to remove this song from the playlist?")) return;
    try {
      const res = await fetch(`/api/playlists/${selectedPlaylist.id}/songs/${playlistSongId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await refreshSinglePlaylist(selectedPlaylist.id);
      }
    } catch (err) {
      console.error("Failed to remove song:", err);
    }
  };

  const handleReorderSong = async (index: number, direction: "up" | "down") => {
    if (!selectedPlaylist) return;
    const songs = [...selectedPlaylist.songs];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= songs.length) return;

    // Swap songs in local helper array
    const temp = songs[index];
    songs[index] = songs[targetIndex];
    songs[targetIndex] = temp;

    const orderedSongIds = songs.map(s => s.id);

    try {
      const res = await fetch(`/api/playlists/${selectedPlaylist.id}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedSongIds })
      });
      if (res.ok) {
        await refreshSinglePlaylist(selectedPlaylist.id);
      }
    } catch (err) {
      console.error("Failed to reorder songs:", err);
    }
  };

  const handleInviteUser = async (userId: string) => {
    if (!selectedPlaylist) return;
    try {
      const res = await fetch(`/api/playlists/${selectedPlaylist.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        await refreshSinglePlaylist(selectedPlaylist.id);
      }
    } catch (err) {
      console.error("Failed to invite user:", err);
    }
  };

  const handleSongSearchChange = async (val: string) => {
    setSongSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(val)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Error searching songs:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSongComment = async (playlistSongId: string) => {
    const text = newCommentText[playlistSongId];
    if (!text || !text.trim() || !selectedPlaylist) return;

    try {
      const res = await fetch(`/api/playlists/${selectedPlaylist.id}/songs/${playlistSongId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text })
      });
      if (res.ok) {
        setNewCommentText(prev => ({ ...prev, [playlistSongId]: "" }));
        await refreshSinglePlaylist(selectedPlaylist.id);
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const toggleCommentsExpansion = (playlistSongId: string) => {
    setExpandedSongComments(prev => ({
      ...prev,
      [playlistSongId]: !prev[playlistSongId]
    }));
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm("Are you sure you want to permanently delete this collaborative playlist? Only the creator can perform this.")) return;
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setPlaylists(prev => prev.filter(p => p.id !== playlistId));
        setSelectedPlaylist(null);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete.");
      }
    } catch (err) {
      console.error("Failed to delete playlist:", err);
    }
  };

  const toggleCollaboratorInNewList = (userId: string) => {
    setPCollabIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Helper resolvers
  const getUserAvatar = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.avatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100";
  };

  const getUserDisplayName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.displayName : "Collaborator";
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Section Header */}
      <div className="bg-white border rounded-3xl p-5 md:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
            <Users className="w-5.5 h-5.5 text-indigo-500 animate-pulse" />
            Spotify Collaborative Playlists
          </h2>
          <p className="text-xs text-gray-400 mt-1">Invite friends, add tracks, comment, and dynamically reorder music together.</p>
        </div>

        <div className="flex gap-2 shrink-0">
          {selectedPlaylist && (
            <button 
              onClick={() => setSelectedPlaylist(null)}
              className="text-xs font-semibold px-4 py-2 border rounded-full hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              All Playlists
            </button>
          )}
          <button 
            onClick={() => { setIsCreating(!isCreating); setSelectedPlaylist(null); }}
            className="text-xs font-bold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer transition-transform duration-200 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Playlist
          </button>
        </div>
      </div>

      {/* Main Playlist Body Router */}
      <AnimatePresence mode="wait">
        
        {/* CREATE PLAYLIST FORM VIEW */}
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border rounded-3xl p-5 md:p-6 shadow-sm space-y-5"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-display font-semibold text-sm text-gray-950">Create Collaborative Playlist</h3>
              <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-650">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                
                {/* Text entries */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Playlist Name</label>
                    <input 
                      type="text"
                      required
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      placeholder="e.g., Midnight Sunset Drives"
                      className="w-full text-xs border rounded-xl p-2.5 h-10 focus:outline-none focus:border-indigo-500 bg-gray-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Description</label>
                    <textarea 
                      value={pDesc}
                      onChange={(e) => setPDesc(e.target.value)}
                      placeholder="Specify your mood or vibe so friends can add relevant style songs."
                      className="w-full text-xs border rounded-xl p-2.5 h-20 resize-none focus:outline-none focus:border-indigo-500 bg-gray-50"
                    />
                  </div>
                </div>

                {/* Cover presets */}
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 font-bold uppercase block">Select Cover Artwork</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_COVERS.map((cov, i) => (
                      <div 
                        key={i} 
                        onClick={() => setPCover(cov)}
                        className={`aspect-video rounded-xl overflow-hidden cursor-pointer border-2 relative select-none ${
                          pCover === cov || (!pCover && i === 0) ? "border-indigo-600 scale-95 shadow-sm" : "border-transparent opacity-75 hover:opacity-100"
                        }`}
                      >
                        <img src={cov} alt="" className="w-full h-full object-cover" />
                        {(pCover === cov || (!pCover && i === 0)) && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white bg-indigo-600 px-1.5 py-0.5 rounded-full uppercase">Selected</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Select initial friends to invite */}
              <div className="space-y-2 border-t pt-4">
                <label className="text-[10px] text-gray-400 font-bold uppercase block">Invite Initial Collaborators</label>
                <div className="flex flex-wrap gap-2">
                  {users.filter(u => u.id !== currentUser.id).map((u) => {
                    const isSelected = pCollabIds.includes(u.id);
                    return (
                      <div 
                        key={u.id}
                        onClick={() => toggleCollaboratorInNewList(u.id)}
                        className={`flex items-center gap-2 p-2 rounded-2xl border cursor-pointer select-none transition-all ${
                          isSelected ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white hover:bg-gray-50 text-gray-600"
                        }`}
                      >
                        <img src={u.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-xs font-semibold">{u.displayName}</span>
                        {isSelected && <span className="text-[9px] bg-indigo-600 text-white rounded-full px-1.5">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 py-2 px-4"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-full py-2 px-6 shadow"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* SELECTED SINGLE PLAYLIST FULL INTERACTION VIEW */}
        {selectedPlaylist && !isCreating && (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            
            {/* Left Col (Playlist details, collaborators and song-adding search box) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Cover card */}
              <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
                <div className="h-40 relative">
                  <img src={selectedPlaylist.coverUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[9px] uppercase bg-indigo-600 text-white font-bold px-2.5 py-0.5 rounded-full">Shared Stream</span>
                    <h3 className="font-display font-bold text-white text-base mt-1 leading-tight">{selectedPlaylist.name}</h3>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <p className="text-xs text-gray-500 leading-relaxed italic">"{selectedPlaylist.description}"</p>
                  
                  {/* Playlist Creator reference */}
                  <div className="border-t pt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>Creator:</span>
                    <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                      <img src={getUserAvatar(selectedPlaylist.createdByUserId)} className="w-4.5 h-4.5 rounded-full object-cover" />
                      {getUserDisplayName(selectedPlaylist.createdByUserId)}
                    </span>
                  </div>

                  {/* Joined collaborators list stacked nicely */}
                  <div className="space-y-2 border-t pt-3">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Active Collaborators ({selectedPlaylist.collaborators.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPlaylist.collaborators.map((cid) => (
                        <div key={cid} className="flex items-center gap-1 bg-slate-50 border border-gray-100 rounded-full py-1 px-2.5" title={getUserDisplayName(cid)}>
                          <img src={getUserAvatar(cid)} className="w-4 h-4 rounded-full object-cover" />
                          <span className="text-[10px] font-semibold text-slate-800">{getUserDisplayName(cid).split(" ")[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delete Option for original owner */}
                  {selectedPlaylist.createdByUserId === currentUser.id && (
                    <button 
                      onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                      className="w-full text-center text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold text-[10px] border border-red-200/50 rounded-2xl py-2 cursor-pointer transition-colors"
                    >
                      Delete Playlist
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Invites / Suggest to join space */}
              <div className="bg-white border rounded-3xl p-4 shadow-sm space-y-3.5">
                <div>
                  <h4 className="font-display font-semibold text-xs text-gray-900 uppercase">Invite More Friends</h4>
                  <p className="text-[10px] text-gray-400">Co-curators can add, delete, comments and reorder items inside this playlist instantly.</p>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {users
                    .filter((u) => !selectedPlaylist.collaborators.includes(u.id))
                    .map((userToInvite) => (
                      <div key={userToInvite.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-2xl border border-transparent">
                        <div className="flex items-center gap-2 max-w-[70%]">
                          <img src={userToInvite.avatar} alt="" className="w-7 h-7 rounded-full object-cover border" />
                          <span className="text-xs font-semibold text-gray-700 truncate">{userToInvite.displayName}</span>
                        </div>
                        <button 
                          onClick={() => handleInviteUser(userToInvite.id)}
                          className="text-[9px] bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-full cursor-pointer flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          Invite
                        </button>
                      </div>
                    ))}
                  {users.filter((u) => !selectedPlaylist.collaborators.includes(u.id)).length === 0 && (
                    <p className="text-[10px] text-gray-400 italic text-center py-2">Whole peer squad has been invited!</p>
                  )}
                </div>
              </div>

              {/* Song Search - Collaborative insertions */}
              <div className="bg-white border rounded-3xl p-4 shadow-sm space-y-3">
                <div>
                  <h4 className="font-display font-semibold text-xs text-gray-900 border-b pb-1.5 flex items-center gap-1">
                    <Music className="w-4 h-4 text-indigo-500 animate-spin" />
                    Add Spotify Tracks
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-1">Search millions of chords or let our backend Spotify memory find tracks.</p>
                </div>

                <div className="relative">
                  <input 
                    type="text"
                    value={songSearchQuery}
                    onChange={(e) => handleSongSearchChange(e.target.value)}
                    placeholder="Search song title or artist..."
                    className="w-full text-xs border rounded-xl p-2.5 h-10 pr-8 focus:outline-none focus:border-indigo-500 bg-gray-50/50"
                  />
                  {songSearchQuery && (
                    <button onClick={() => { setSongSearchQuery(""); setSearchResults([]); }} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                      <X className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>

                {isSearching ? (
                  <div className="text-center py-4 text-[10px] text-gray-400">Syncing with Spotify index...</div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {searchResults.map((song) => (
                      <div key={song.spotifyId} className="flex items-center justify-between p-2 bg-slate-50 border border-gray-100 rounded-2xl">
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                          <img src={song.artworkUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h5 className="font-semibold text-slate-800 text-xs truncate leading-tight">{song.title}</h5>
                            <span className="text-[10px] text-gray-400 block truncate">{song.artist}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleAddSong(song)}
                          className="p-1.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-full shrink-0 cursor-pointer shadow-sm transition-transform active:scale-90"
                          title="Add song to playlist"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {songSearchQuery && searchResults.length === 0 && (
                      <p className="text-[10px] text-gray-400 italic text-center py-2">No matching tunes found.</p>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Right Cols (Song sequence, reordering controls, and individual song comment threads) */}
            <div className="lg:col-span-2 space-y-4">
              
              <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h4 className="font-display font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                    <Disc className="w-4.5 h-4.5 text-indigo-500 animate-spin" />
                    Playlist Songs ({selectedPlaylist.songs.length})
                  </h4>
                  <span className="text-[10px] font-medium text-gray-400">Curators sync in real-time</span>
                </div>

                <div className="space-y-3.5">
                  {selectedPlaylist.songs.length === 0 ? (
                    <div className="text-center py-16">
                      <Music className="w-8 h-8 text-indigo-200 mx-auto animate-bounce" />
                      <p className="text-xs font-display text-gray-400 mt-3">This collaborative stream is empty.</p>
                      <span className="text-[10px] text-gray-400 block mt-1">Use the Spotify search box on the left to start adding your fav songs!</span>
                    </div>
                  ) : (
                    selectedPlaylist.songs.map((playlistSong, index) => {
                      const commentsExpanded = !!expandedSongComments[playlistSong.id];
                      return (
                        <div 
                          key={playlistSong.id}
                          className="bg-white border border-gray-100 rounded-3xl p-3 md:p-4 hover:border-indigo-150 transition-all shadow-xs"
                        >
                          {/* Inner row */}
                          <div className="flex items-center justify-between gap-3">
                            
                            {/* Track details */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="text-xs font-mono font-bold text-gray-300 w-4 shrink-0 text-center">
                                {index + 1}
                              </span>
                              <img 
                                src={playlistSong.song.artworkUrl} 
                                alt="" 
                                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-50 shadow-xs" 
                              />
                              <div className="min-w-0 flex-1">
                                <h5 className="font-semibold text-gray-900 text-xs sm:text-sm truncate leading-tight flex items-center gap-1.5">
                                  {playlistSong.song.title}
                                </h5>
                                <span className="text-[10px] text-gray-400 block truncate mt-0.5 font-medium">{playlistSong.song.artist} • {playlistSong.song.album}</span>
                                
                                {/* Added by details block */}
                                <div className="flex items-center gap-1.5 mt-2">
                                  <img src={playlistSong.addedByAvatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover border" />
                                  <span className="text-[9px] text-gray-400 font-medium">Added by {playlistSong.addedByDisplayName} • {playlistSong.addedAt}</span>
                                </div>
                              </div>
                            </div>

                            {/* Custom Actions (Reordering & Comment & Trash) */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              
                              {/* Move Up */}
                              <button 
                                onClick={() => handleReorderSong(index, "up")}
                                disabled={index === 0}
                                className="p-1 px-1.5 rounded-lg border hover:bg-gray-50 text-gray-400 hover:text-slate-900 disabled:opacity-25 transition-colors cursor-pointer"
                                title="Move track up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>

                              {/* Move Down */}
                              <button 
                                onClick={() => handleReorderSong(index, "down")}
                                disabled={index === selectedPlaylist.songs.length - 1}
                                className="p-1 px-1.5 rounded-lg border hover:bg-gray-50 text-gray-400 hover:text-slate-900 disabled:opacity-25 transition-colors cursor-pointer"
                                title="Move track down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Comments Dropdown view toggle */}
                              <button 
                                onClick={() => toggleCommentsExpansion(playlistSong.id)}
                                className={`p-1.5 px-2 rounded-2xl border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                  commentsExpanded 
                                    ? "bg-indigo-50 border-indigo-250 text-indigo-700" 
                                    : "bg-white hover:bg-gray-50 text-gray-500"
                                }`}
                                title="Comment threads about song"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>{playlistSong.comments.length}</span>
                              </button>

                              {/* Delete option */}
                              {selectedPlaylist.collaborators.includes(currentUser.id) && (
                                <button
                                  onClick={() => handleRemoveSong(playlistSong.id)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                  title="Remove track"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                            </div>

                          </div>

                          {/* EXPANDED SONG COMMENTARY AREA */}
                          {commentsExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-50 bg-slate-50/50 p-3 rounded-2xl space-y-3.5">
                              <span className="text-[9px] uppercase text-gray-400 font-bold tracking-wider block">Discussion Thread</span>
                              
                              {/* User review entries */}
                              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                {playlistSong.comments.length === 0 ? (
                                  <p className="text-[10px] text-gray-450 italic py-2 text-center">No commentary added on this match. Be the first!</p>
                                ) : (
                                  playlistSong.comments.map((comObj) => (
                                    <div key={comObj.id} className="flex gap-2.5 items-start text-[11px]">
                                      <img src={comObj.avatar} alt="" className="w-6.5 h-6.5 rounded-full object-cover border" />
                                      <div className="flex-1 bg-white p-2 rounded-2xl border border-gray-100">
                                        <div className="flex justify-between items-center">
                                          <span className="font-bold text-gray-800 leading-none">{comObj.displayName}</span>
                                          <span className="text-[8px] text-gray-400">{comObj.timestamp}</span>
                                        </div>
                                        <p className="text-gray-600 mt-1 text-xs leading-relaxed">{comObj.content}</p>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Commentary formulater */}
                              <div className="flex gap-2 pt-2 border-t border-gray-100">
                                <input 
                                  type="text"
                                  value={newCommentText[playlistSong.id] || ""}
                                  onChange={(e) => setNewCommentText(prev => ({ ...prev, [playlistSong.id]: e.target.value }))}
                                  placeholder="Write a comment about this track addition..."
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddSongComment(playlistSong.id);
                                  }}
                                  className="flex-1 text-xs border rounded-xl px-2.5 h-9 bg-white focus:outline-none focus:border-indigo-400"
                                />
                                <button 
                                  onClick={() => handleAddSongComment(playlistSong.id)}
                                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm cursor-pointer shrink-0 transition-transform active:scale-95"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>

                            </div>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>

          </motion.div>
        )}

        {/* DEFAULT OVERVIEWS PLAYLISTS GRID */}
        {!selectedPlaylist && !isCreating && (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {isLoading ? (
              <div className="text-center py-20 bg-white border rounded-3xl">
                <Disc className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs font-display text-gray-400 mt-3">Sourcing playlist databases...</p>
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-16 bg-white border rounded-3xl">
                <Users className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
                <p className="text-sm font-display text-gray-500 font-semibold">No collaborative playlists yet.</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Click 'New Playlist' above to launch a shared music playlist channel and invite your friends!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {playlists.map((pl) => (
                  <div 
                    key={pl.id}
                    className="bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-indigo-150 transition-all hover:shadow-md flex flex-col group"
                  >
                    {/* Visual Art cover */}
                    <div className="h-32 bg-slate-100 relative overflow-hidden shrink-0">
                      <img src={pl.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                        <span className="text-[8px] uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          {pl.songs.length} Track{pl.songs.length !== 1 ? "s" : ""}
                        </span>
                        
                        {/* Member count overlay */}
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {pl.collaborators.slice(0, 3).map((uid) => (
                            <img 
                              key={uid} 
                              src={getUserAvatar(uid)} 
                              alt="" 
                              className="w-5.5 h-5.5 rounded-full object-cover border border-white" 
                              title={getUserDisplayName(uid)}
                            />
                          ))}
                          {pl.collaborators.length > 3 && (
                            <div className="w-5.5 h-5.5 rounded-full bg-slate-800 text-[8px] font-mono font-bold text-white flex items-center justify-center border border-white">
                              +{pl.collaborators.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metadata Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-display font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">{pl.name}</h4>
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed italic">"{pl.description}"</p>
                      </div>

                      {/* Launch view button */}
                      <div className="pt-3 border-t flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-bold text-gray-400 uppercase">Created by:</span>
                          <span className="text-[9px] font-semibold text-gray-600">{getUserDisplayName(pl.createdByUserId).split(" ")[0]}</span>
                        </div>
                        <button 
                          onClick={() => setSelectedPlaylist(pl)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          Vibe Together
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
