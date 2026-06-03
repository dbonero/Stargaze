/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Mic, Image, Music, FileText, ChevronRight, CheckCheck, Play, Pause, X, 
  Users, Plus, MessageSquare, Info, Star, Calendar, Sparkles, Globe, Copy, Check 
} from "lucide-react";
import { Message, Song, User, GroupMessage, MusicGroup } from "../types";

interface DirectMessagesProps {
  currentUser: User;
  users: User[];
  messages: Message[];
  onSendMessage: (receiverId: string, content: string, payload?: Partial<Message>) => void;
  songsDbRef: Song[];
}

const PRESET_COVERS = [
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1453090927415-5f45085b65c0?w=400&auto=format&fit=crop&q=80"
];

export default function DirectMessages({
  currentUser,
  users,
  messages,
  onSendMessage,
  songsDbRef,
}: DirectMessagesProps) {
  const [activeTab, setActiveTab] = useState<"dm" | "groups">("dm");

  // Direct Messages (Peer-to-Peer) states
  const [activeFriendId, setActiveFriendId] = useState<string>("chloe_vibe");
  const [localDmMessages, setLocalDmMessages] = useState<Message[]>([]);
  const [dmInputText, setDmInputText] = useState("");

  // Music Groups states
  const [groups, setGroups] = useState<MusicGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>("group_1");
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupInputText, setGroupInputText] = useState("");

  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingGroupMessages, setIsLoadingGroupMessages] = useState(false);

  // Group creation modal state
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedCoverUrl, setSelectedCoverUrl] = useState(PRESET_COVERS[0]);

  // Audio / Attachments states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [attachedSong, setAttachedSong] = useState<Song | null>(null);
  const [attachedLyrics, setAttachedLyrics] = useState("");
  const [attachedImage, setAttachedImage] = useState("");
  const [isSongSearchOpen, setIsSongSearchOpen] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState("");

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch direct messages for active peer dialogue
  const fetchDmMessages = async (friendId: string) => {
    try {
      const resp = await fetch(`/api/messages/${friendId}`);
      if (resp.ok) {
        const data = await resp.json();
        setLocalDmMessages(data);
      }
    } catch (e) {
      console.warn("Failed P2P message list retrieval", e);
    }
  };

  // Fetch groups list
  const fetchGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const resp = await fetch("/api/groups");
      if (resp.ok) {
        const data = await resp.json();
        setGroups(data);
      }
    } catch (e) {
      console.warn("Failed groups fetch", e);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  // Fetch group messages for selected group
  const fetchGroupMessages = async (groupId: string) => {
    setIsLoadingGroupMessages(true);
    try {
      const resp = await fetch(`/api/groups/${groupId}/messages`);
      if (resp.ok) {
        const data = await resp.json();
        setGroupMessages(data);
      }
    } catch (e) {
      console.warn("Failed group messages retrieval", e);
    } finally {
      setIsLoadingGroupMessages(false);
    }
  };

  // Poll intervals to make the experience real-time & interactive
  useEffect(() => {
    if (activeTab === "dm") {
      fetchDmMessages(activeFriendId);
      const interval = setInterval(() => {
        fetchDmMessages(activeFriendId);
      }, 3500);
      return () => clearInterval(interval);
    } else {
      fetchGroupMessages(activeGroupId);
      const interval = setInterval(() => {
        fetchGroupMessages(activeGroupId);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [activeTab, activeFriendId, activeGroupId]);

  // Initial groups fetch
  useEffect(() => {
    fetchGroups();
  }, []);

  // auto scroll container when state updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [localDmMessages, groupMessages, activeFriendId, activeGroupId, activeTab]);

  const activeFriend = users.find((u) => u.id === activeFriendId) || users[1];
  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  // Send Direct Message P2P
  const handleSendDm = () => {
    if (!dmInputText.trim() && !attachedSong && !attachedImage) return;

    const payload: Partial<Message> = {};
    if (attachedSong) payload.song = attachedSong;
    if (attachedLyrics) payload.lyricsLine = attachedLyrics;
    if (attachedImage) payload.imageUrl = attachedImage;

    onSendMessage(activeFriendId, dmInputText.trim(), payload);
    
    // Optimistic UI append
    const optMsg: Message = {
      id: "msg_opt_" + Date.now(),
      senderId: currentUser.id,
      receiverId: activeFriendId,
      content: dmInputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ...payload
    };
    setLocalDmMessages(prev => [...prev, optMsg]);

    setDmInputText("");
    setAttachedSong(null);
    setAttachedLyrics("");
    setAttachedImage("");
  };

  // Send Group Message
  const handleSendGroupMsg = async () => {
    if (!groupInputText.trim() && !attachedSong && !attachedImage) return;

    const body = {
      content: groupInputText.trim(),
      song: attachedSong || undefined,
      lyricsLine: attachedLyrics || undefined,
      imageUrl: attachedImage || undefined
    };

    try {
      const resp = await fetch(`/api/groups/${activeGroupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (resp.ok) {
        const newMsg = await resp.json();
        setGroupMessages(prev => [...prev, newMsg]);
      }
    } catch (e) {
      console.warn("Failed group message post", e);
    }

    setGroupInputText("");
    setAttachedSong(null);
    setAttachedLyrics("");
    setAttachedImage("");
  };

  // Keyboard events
  const handleKeyPress = (e: React.KeyboardEvent, mode: "dm" | "groups") => {
    if (e.key === "Enter") {
      if (mode === "dm") handleSendDm();
      else handleSendGroupMsg();
    }
  };

  // Create Music Group onSubmit
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const resp = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDescription.trim(),
          coverUrl: selectedCoverUrl
        })
      });
      if (resp.ok) {
        const newGroup = await resp.json();
        setGroups(prev => [newGroup, ...prev]);
        setActiveGroupId(newGroup.id);
        setActiveTab("groups");
        setIsNewGroupModalOpen(false);
        setNewGroupName("");
        setNewGroupDescription("");
        fetchGroupMessages(newGroup.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate Voice notes recording
  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimer.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecordingAndSend = () => {
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    setIsRecording(false);
    const durationStr = `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, "0")}`;
    
    if (activeTab === "dm") {
      onSendMessage(activeFriendId, "Voice Note (Playback Simulated)", {
        isVoiceNote: true,
        duration: durationStr || "0:08",
      });
    } else {
      fetch(`/api/groups/${activeGroupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Voice Note (Playback Simulated)",
          isVoiceNote: true,
          duration: durationStr || "0:08",
        })
      }).then(() => fetchGroupMessages(activeGroupId));
    }
    setRecordingSeconds(0);
  };

  const cancelRecording = () => {
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const attachMockPhoto = () => {
    const images = [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80",
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80",
      "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&q=80",
      "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80"
    ];
    setAttachedImage(images[Math.floor(Math.random() * images.length)]);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs h-[640px] flex flex-col font-sans">
      
      {/* Dynamic Subheader Tab bar */}
      <div className="bg-slate-50 border-b border-gray-100 p-3 px-5 flex justify-between items-center shrink-0">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab("dm")}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
              activeTab === "dm" 
                ? "bg-indigo-600 text-white shadow-xs" 
                : "bg-white text-gray-600 hover:text-gray-900 border border-gray-100"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Direct Messages
          </button>
          <button 
            onClick={() => setActiveTab("groups")}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
              activeTab === "groups" 
                ? "bg-indigo-600 text-white shadow-xs" 
                : "bg-white text-gray-600 hover:text-gray-900 border border-gray-100"
            }`}
          >
            <Users className="w-4 h-4" />
            Music Groups
          </button>
        </div>

        {/* Action triggers */}
        <div>
          {activeTab === "groups" ? (
            <button
              onClick={() => setIsNewGroupModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Create Music Group
            </button>
          ) : (
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold tracking-wider px-2.5 py-1 rounded-full uppercase border border-indigo-100 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "10s" }} /> Realtime Dialogue
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        
        {/* Left Side: Navigation Lists (Buddies or Active Groups) */}
        <div className="w-1/3 border-r border-gray-100 flex flex-col bg-slate-50/20">
          
          {/* Direct message buddy selection role */}
          {activeTab === "dm" ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-3 bg-white border-b border-gray-100 flex-shrink-0">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Creators Online</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50/50">
                {users
                  .filter((u) => u.id !== currentUser.id)
                  .map((u) => {
                    const isSelected = u.id === activeFriendId;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          setActiveFriendId(u.id);
                          fetchDmMessages(u.id);
                        }}
                        className={`w-full p-4 flex gap-3 items-center text-left transition-colors cursor-pointer ${
                          isSelected ? "bg-indigo-50/85 border-r-4 border-indigo-600" : "hover:bg-gray-50/50"
                        }`}
                      >
                        <img
                          src={u.avatar}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border shrink-0 bg-gray-100"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-950 truncate leading-tight">{u.displayName}</span>
                            {u.isPremium && <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-sans scale-90">Pro</span>}
                          </div>
                          <span className="text-[10px] text-gray-400 block mt-0.5">@{u.username}</span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          ) : (
            // Music groups listing role
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-3 bg-white border-b border-gray-100 flex-shrink-0">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Group Forums</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50/50">
                {isLoadingGroups ? (
                  <div className="py-12 text-center text-xs text-gray-400 select-none">Syncing community list...</div>
                ) : groups.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 italic leading-relaxed">No music groups found. Create one above to initiate ideas!</div>
                ) : (
                  groups.map((group) => {
                    const isSelected = group.id === activeGroupId;
                    return (
                      <button
                        key={group.id}
                        onClick={() => {
                          setActiveGroupId(group.id);
                          fetchGroupMessages(group.id);
                        }}
                        className={`w-full p-4 flex gap-3 items-start text-left transition-colors cursor-pointer ${
                          isSelected ? "bg-indigo-50/85 border-r-4 border-indigo-600" : "hover:bg-gray-50/50"
                        }`}
                      >
                        <img
                          src={group.coverUrl}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border shrink-0 bg-gray-200"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-semibold text-gray-950 truncate leading-tight">{group.name}</h5>
                          <p className="text-[10px] text-gray-400 truncate mt-1 select-none leading-relaxed">{group.description}</p>
                          <span className="inline-flex items-center gap-1 text-[9px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded-md mt-1.5 font-mono">
                            <Users className="w-2.5 h-2.5" /> {group.members?.length || 3} members
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Actively Displayed Chat Dialogue Frame */}
        <div className="flex-1 flex flex-col bg-white min-h-0">
          
          {/* Header Panel */}
          {activeTab === "dm" ? (
            <div className="p-4 flex justify-between items-center border-b border-gray-150 flex-shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={activeFriend.avatar}
                  alt={activeFriend.displayName}
                  className="w-10 h-10 rounded-full object-cover border"
                />
                <div>
                  <h4 className="font-display font-semibold text-gray-900 text-xs leading-none">{activeFriend.displayName}</h4>
                  <span className="text-[10px] text-emerald-500 font-semibold block mt-1 select-none">● Online dialogue link</span>
                </div>
              </div>
              <div className="text-[9px] text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full font-mono select-none">
                Location: {activeFriend.location || "Earth Orbit"}
              </div>
            </div>
          ) : activeGroup ? (
            <div className="p-4 flex justify-between items-center border-b border-gray-150 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={activeGroup.coverUrl}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover border"
                />
                <div className="min-w-0">
                  <h4 className="font-display font-semibold text-gray-950 text-xs truncate leading-none">{activeGroup.name}</h4>
                  <p className="text-[10px] text-gray-400 truncate mt-1 select-none leading-relaxed">{activeGroup.description}</p>
                </div>
              </div>
              <div className="text-[9px] text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full font-mono select-none">
                Created: {activeGroup.createdAt}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-400 Select-none">Please choose a conversation.</div>
          )}

          {/* Messages Scroller Window */}
          <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/30">
            {activeTab === "dm" ? (
              localDmMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none bg-white rounded-2xl m-4 border border-dashed border-gray-200">
                  <span className="text-4xl animate-bounce">👋</span>
                  <p className="text-xs text-gray-400 mt-3 font-semibold">Start sharing acoustic waves & lyrics with @{activeFriend.username}</p>
                  <p className="text-[10px] text-gray-400 max-w-xs mt-1">Direct messaging enables immediate lyric transfers, track link pins, and peer reviews.</p>
                </div>
              ) : (
                localDmMessages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-3xl p-3 md:p-3.5 text-xs ${
                        isMine ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-900 border border-gray-200/50"
                      }`}>
                        
                        {/* Embed Song inside bubble */}
                        {msg.song && (
                          <div className={`mb-2 rounded-2xl p-2 flex gap-2.5 items-center text-left ${
                            isMine ? "bg-black/20 text-white" : "bg-white text-gray-900 border"
                          }`}>
                            <img src={msg.song.artworkUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
                            <div className="min-w-0 flex-1">
                              <p className={`text-[8px] uppercase tracking-wider font-bold ${isMine ? "text-indigo-200" : "text-gray-400"}`}>Spotify track Link</p>
                              <h5 className="font-semibold truncate text-[11px] leading-tight mt-0.5">{msg.song.title}</h5>
                              <span className="text-[10px] opacity-75 truncate block mt-0.5">{msg.song.artist}</span>
                            </div>
                          </div>
                        )}

                        {/* Embed highlights */}
                        {msg.lyricsLine && (
                          <blockquote className={`pl-2 border-l-2 mb-2 italic font-mono text-[10px] leading-relaxed ${
                            isMine ? "border-indigo-400 text-indigo-100" : "border-indigo-400 text-gray-600"
                          }`}>
                            "{msg.lyricsLine}"
                          </blockquote>
                        )}

                        {msg.imageUrl && (
                          <div className="mb-2 rounded-xl overflow-hidden border">
                            <img src={msg.imageUrl} alt="" className="max-h-36 w-full object-cover" />
                          </div>
                        )}

                        {/* Audio clip simulation */}
                        {msg.isVoiceNote ? (
                          <div className="flex items-center gap-2 py-1 select-none">
                            <button className={`w-7 h-7 rounded-full flex items-center justify-center p-0 ${isMine ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"}`}>
                              <Play className="w-3 h-3 fill-current ml-0.5" />
                            </button>
                            <span className="text-[10px] font-mono opacity-80 shrink-0">Simulated Audio Recording ({msg.duration || "0:12"})</span>
                          </div>
                        ) : (
                          <p className="leading-relaxed text-[11px]">{msg.content}</p>
                        )}

                        <div className="flex justify-end gap-1.5 items-center mt-1.5 opacity-60 text-[8px] font-mono select-none">
                          <span>{msg.timestamp}</span>
                          {isMine && <CheckCheck className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              // Music Group Message rendering
              isLoadingGroupMessages ? (
                <div className="py-12 text-center text-xs text-gray-400 italic">Retuning group alignment feeds...</div>
              ) : groupMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none bg-white rounded-2xl m-4 border border-dashed border-gray-200">
                  <span className="text-4xl animate-pulse">💬</span>
                  <p className="text-xs text-gray-400 mt-3 font-semibold">Initiate discussions in this forum</p>
                  <p className="text-[10px] text-gray-400 max-w-xs mt-1">All members can observe the alignment progress, review lyrical sheets, and discuss tracks.</p>
                </div>
              ) : (
                groupMessages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;
                  const isSystem = msg.senderId === "system";

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center p-2 select-none">
                        <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-150 text-indigo-700 p-1.5 px-3 rounded-full text-center">
                          ⚙️ {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isMine ? "justify-end" : "justify-start"}`}>
                      
                      {!isMine && (
                        <img
                          src={msg.senderAvatar}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover border mt-1 shrink-0 bg-gray-150"
                        />
                      )}

                      <div className="max-w-[75%] space-y-1">
                        {!isMine && (
                          <span className="text-[9px] font-sans font-bold text-gray-500 block leading-none ml-1">
                            {msg.senderDisplayName}
                          </span>
                        )}

                        <div className={`rounded-3xl p-3 md:p-3.5 text-xs ${
                          isMine ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-900 border border-gray-200/50"
                        }`}>
                          
                          {msg.song && (
                            <div className={`mb-2 rounded-2xl p-2 flex gap-2.5 items-center text-left ${
                              isMine ? "bg-black/20 text-white" : "bg-white text-gray-900 border"
                            }`}>
                              <img src={msg.song.artworkUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
                              <div className="min-w-0 flex-1">
                                <p className={`text-[8px] uppercase tracking-wider font-bold ${isMine ? "text-indigo-200" : "text-gray-400"}`}>Shared song link</p>
                                <h5 className="font-semibold truncate text-[11px] leading-tight mt-0.5">{msg.song.title}</h5>
                                <span className="text-[10px] opacity-75 truncate block mt-0.5">{msg.song.artist}</span>
                              </div>
                            </div>
                          )}

                          {msg.lyricsLine && (
                            <blockquote className={`pl-2 border-l-2 mb-2 italic font-mono text-[10px] leading-relaxed ${
                              isMine ? "border-indigo-400 text-indigo-100" : "border-indigo-400 text-gray-600"
                            }`}>
                              "{msg.lyricsLine}"
                            </blockquote>
                          )}

                          {msg.imageUrl && (
                            <div className="mb-2 rounded-xl overflow-hidden border">
                              <img src={msg.imageUrl} alt="" className="max-h-36 w-full object-cover" />
                            </div>
                          )}

                          {msg.isVoiceNote ? (
                            <div className="flex items-center gap-2 py-1 select-none">
                              <button className={`w-7 h-7 rounded-full flex items-center justify-center p-0 ${isMine ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"}`}>
                                <Play className="w-3 h-3 fill-current ml-0.5" />
                              </button>
                              <span className="text-[10px] font-mono opacity-80 shrink-0">Voice note ({msg.duration || "0:12"})</span>
                            </div>
                          ) : (
                            <p className="leading-relaxed text-[11px]">{msg.content}</p>
                          )}

                          <div className="flex justify-end gap-1 items-center mt-1 opacity-60 text-[8px] font-mono select-none">
                            <span>{msg.timestamp}</span>
                            {isMine && <CheckCheck className="w-2.5 h-2.5" />}
                          </div>

                        </div>
                      </div>

                    </div>
                  );
                })
              )
            )}
          </div>

          {/* Pending Attachments indicator status */}
          {(attachedSong || attachedImage) && (
            <div className="bg-indigo-50/80 px-4 py-2 border-t border-indigo-100 flex items-center gap-3 text-xs justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-indigo-900 font-bold uppercase text-[9px] shrink-0">Queue block:</span>
                {attachedSong && <span className="bg-white px-2.5 py-1 rounded-full border text-indigo-700 font-medium font-mono text-[10px] truncate max-w-sm">🎵 {attachedSong.title}</span>}
                {attachedImage && <span className="bg-white px-2.5 py-1 rounded-full border text-indigo-700 font-medium text-[10px]">📷 Photo attached</span>}
              </div>
              <button 
                onClick={() => { setAttachedSong(null); setAttachedLyrics(""); setAttachedImage(""); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Message Input container */}
          <div 
            className="p-3 border-t border-gray-150 bg-white flex-shrink-0 transition-colors"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-indigo-50/20"); }}
            onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove("bg-indigo-50/20"); }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("bg-indigo-50/20");
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (typeof reader.result === "string") setAttachedImage(reader.result);
                };
                reader.readAsDataURL(file);
              }
            }}
          >
            <div className="flex items-center gap-2">
              
              {/* Media attach panel */}
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => setIsSongSearchOpen(true)}
                  className="text-gray-400 hover:text-indigo-600 hover:bg-gray-50 p-2 rounded-full cursor-pointer"
                  title="Attach Spotify Track"
                >
                  <Music className="w-4.5 h-4.5" />
                </button>
                <input 
                  type="file" 
                  id="chat-image-input" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === "string") setAttachedImage(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <button 
                  onClick={() => document.getElementById("chat-image-input")?.click()}
                  className="text-gray-400 hover:text-indigo-600 hover:bg-gray-50 p-2 rounded-full cursor-pointer"
                  title="Upload & Attach Any Photo 📸"
                >
                  <Image className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Text input form block */}
              {isRecording ? (
                <div className="flex-1 bg-red-50 text-red-600 rounded-2xl px-4 py-2 flex items-center justify-between text-xs font-semibold select-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span>Live recording soundwaves... {recordingSeconds}s</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={cancelRecording} className="text-gray-500 hover:text-gray-800 text-[10px] font-bold cursor-pointer">Cancel</button>
                    <button onClick={stopRecordingAndSend} className="bg-red-600 text-white font-bold px-3 py-1 rounded-full text-[10px] cursor-pointer">Send</button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder={
                      activeTab === "dm" 
                        ? `Message @${activeFriend.username}... (Press enter to dispatch)`
                        : `Post idea to "${activeGroup?.name || "group"}"... (Press enter)`
                    }
                    value={activeTab === "dm" ? dmInputText : groupInputText}
                    onChange={(e) => activeTab === "dm" ? setDmInputText(e.target.value) : setGroupInputText(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, activeTab)}
                    className="flex-1 text-xs border border-gray-150 rounded-2xl px-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800"
                  />

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={startRecording}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-full cursor-pointer transition-colors"
                      title="Dictate voice notes"
                    >
                      <Mic className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={activeTab === "dm" ? handleSendDm : handleSendGroupMsg}
                      disabled={
                        activeTab === "dm"
                          ? !dmInputText.trim() && !attachedSong && !attachedImage
                          : !groupInputText.trim() && !attachedSong && !attachedImage
                      }
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white p-2.5 rounded-2xl transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* MODAL 1: Spotify Track Picker Overlay */}
      {isSongSearchOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <h4 className="font-display font-semibold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-4 h-4 text-emerald-500" />
                Select Song to attach
              </h4>
              <button onClick={() => setIsSongSearchOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="relative">
              <input 
                type="text"
                placeholder="Search songs or artists by name..."
                value={songSearchQuery}
                onChange={(e) => setSongSearchQuery(e.target.value)}
                className="w-full text-xs border border-gray-150 rounded-2xl p-3 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800"
              />
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {songsDbRef
                .filter((s) => 
                  s.title.toLowerCase().includes(songSearchQuery.toLowerCase()) || 
                  s.artist.toLowerCase().includes(songSearchQuery.toLowerCase())
                )
                .map((s) => (
                  <button
                    key={s.spotifyId}
                    onClick={() => {
                      setAttachedSong(s);
                      setAttachedLyrics(s.title === "Fix You" ? "Lights will guide you home" : `Sonic alignment: ${s.title}`);
                      setIsSongSearchOpen(false);
                      setSongSearchQuery("");
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 text-left border border-transparent hover:border-gray-100 transition-all text-xs cursor-pointer"
                  >
                    <img src={s.artworkUrl} alt={s.title} className="w-8 h-8 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-950 leading-tight truncate">{s.title}</p>
                      <span className="text-[10px] text-gray-400 block mt-0.5 truncate">{s.artist}</span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Music Group Form */}
      {isNewGroupModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <h4 className="font-display font-semibold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600 animate-pulse" />
                Initialize New Music Group
              </h4>
              <button onClick={() => setIsNewGroupModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Group name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Dream Pop Collective, Synthesizer Club"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full text-xs border border-gray-150 rounded-2xl p-3 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Group description</label>
                <textarea 
                  placeholder="What is the objective or vibe of this discussion group?"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  className="w-full text-xs border border-gray-150 rounded-2xl p-3 h-20 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase block">Select header cover photo</label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COVERS.map((cover, idx) => {
                    const isSelected = cover === selectedCoverUrl;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedCoverUrl(cover)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                          isSelected ? "border-indigo-600 ring-2 ring-indigo-100" : "border-transparent opacity-70"
                        }`}
                      >
                        <img src={cover} alt="" className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-x-0 bottom-0 bg-indigo-600/80 text-white text-[8px] py-0.5 text-center font-bold font-mono">
                            ACTIVE
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewGroupModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs p-3.5 rounded-2xl active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs p-3.5 rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
