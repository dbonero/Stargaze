/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Mic, Image, Music, CheckCheck, Play, X, 
  Users, Plus, MessageSquare, Globe, ChevronLeft, ChevronRight, Menu, Search
} from "lucide-react";
import { Message, Song, User, GroupMessage, MusicGroup } from "../types";

interface DirectMessagesProps {
  currentUser: User;
  users: User[];
  messages: Message[];
  onSendMessage: (receiverId: string, content: string, payload?: Partial<Message>) => void;
  songsDbRef: Song[];
  isDarkMode?: boolean;
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
  isDarkMode = false,
}: DirectMessagesProps) {
  const [activeTab, setActiveTab] = useState<"dm" | "groups">("dm");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState("");

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

  // Filters for lists inside sidebar to manage congestion
  const filteredUsers = users
    .filter((u) => u.id !== currentUser.id)
    .filter((u) => {
      if (!sidebarSearchQuery) return true;
      return (
        u.displayName.toLowerCase().includes(sidebarSearchQuery.toLowerCase()) || 
        u.username.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
      );
    });

  const filteredGroups = groups.filter((g) => {
    if (!sidebarSearchQuery) return true;
    return (
      g.name.toLowerCase().includes(sidebarSearchQuery.toLowerCase()) || 
      (g.description && g.description.toLowerCase().includes(sidebarSearchQuery.toLowerCase()))
    );
  });

  return (
    <div className={`border rounded-3xl overflow-hidden shadow-sm h-[650px] flex flex-col font-sans transition-all duration-300 ${
      isDarkMode 
        ? "bg-slate-900 border-slate-800 text-white" 
        : "bg-white border-gray-150 text-slate-900"
    }`}>
      
      {/* Inner split window container */}
      <div className="flex-1 flex min-h-0">
        
        {/* ================= LEFT SIDE: DE-CONGESTED DYNAMIC DRAWER SIDEBAR ================= */}
        <div className={`transition-all duration-300 ease-in-out border-r flex flex-col shrink-0 ${
          isSidebarCollapsed 
            ? "w-16 md:w-20" 
            : "w-56 md:w-64"
        } ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50/20 border-gray-100"}`}>
          
          {/* A. Dynamic Tab switcher styled inside Left Sidebar */}
          {isSidebarCollapsed ? (
            /* Mini Icon column switcher when collapsed */
            <div className={`p-3 border-b flex flex-col items-center gap-3 shrink-0 ${isDarkMode ? "border-slate-850" : "border-gray-100"}`}>
              <button 
                onClick={() => { setActiveTab("dm"); setSidebarSearchQuery(""); }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === "dm" 
                    ? (isDarkMode ? "bg-indigo-650 text-white shadow-md shadow-indigo-900/40" : "bg-indigo-600 text-white shadow-sm") 
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800/60"
                }`}
                title="Creators Direct Messages"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { setActiveTab("groups"); setSidebarSearchQuery(""); }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === "groups" 
                    ? (isDarkMode ? "bg-indigo-650 text-white shadow-md shadow-indigo-900/40" : "bg-indigo-600 text-white shadow-sm") 
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800/60"
                }`}
                title="Active Group Forums"
              >
                <Users className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Premium, tiny pill toggler when expanded */
            <div className={`p-3 border-b flex flex-col shrink-0 gap-2.5 ${isDarkMode ? "border-slate-850" : "border-gray-100"}`}>
              <div className={`flex p-1 rounded-xl w-full ${isDarkMode ? "bg-slate-900/90" : "bg-gray-150/40"}`}>
                <button 
                  onClick={() => { setActiveTab("dm"); setSidebarSearchQuery(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold py-1.5 px-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "dm" 
                      ? (isDarkMode ? "bg-slate-800 text-white shadow-sm" : "bg-white text-indigo-750 shadow-xs") 
                      : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  DMs
                </button>
                <button 
                  onClick={() => { setActiveTab("groups"); setSidebarSearchQuery(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold py-1.5 px-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "groups" 
                      ? (isDarkMode ? "bg-slate-800 text-white shadow-sm" : "bg-white text-indigo-750 shadow-xs") 
                      : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Groups
                </button>
              </div>
            </div>
          )}

          {/* B. Integrated Micro-Search Filter when expanded */}
          {!isSidebarCollapsed && (
            <div className={`p-2 border-b flex items-center gap-2 ${isExpandedAndEmpty() ? "border-transparent" : (isDarkMode ? "border-slate-850 bg-slate-950/20" : "border-gray-100 bg-white")}`}>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] w-full border ${
                isDarkMode ? "bg-slate-900/70 border-slate-800 text-gray-300 focus-within:border-slate-700" : "bg-gray-50 border-gray-150 text-gray-500 focus-within:bg-white focus-within:border-gray-205"
              }`}>
                <Search className="w-3 h-3 text-gray-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder={activeTab === "dm" ? "Filter artists..." : "Filter forums..."}
                  value={sidebarSearchQuery}
                  onChange={(e) => setSidebarSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-[11px] w-full focus:outline-none p-0 focus:ring-0 leading-tight h-4"
                />
                {sidebarSearchQuery && (
                  <button onClick={() => setSidebarSearchQuery("")} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* C. Scrollable Creators or Channels Section */}
          <div className="flex-1 overflow-y-auto min-h-0 py-2">
            
            {activeTab === "dm" ? (
              /* DMs stream list */
              filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-gray-400 select-none italic">
                  {!isSidebarCollapsed ? `No matches found` : "Ø"}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = u.id === activeFriendId;
                  
                  if (isSidebarCollapsed) {
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          setActiveFriendId(u.id);
                          fetchDmMessages(u.id);
                        }}
                        className={`w-full py-3 flex justify-center relative transition-all cursor-pointer ${
                          isSelected ? "bg-indigo-50/40 dark:bg-slate-800/30" : "hover:bg-gray-100/50 dark:hover:bg-slate-800/10"
                        }`}
                        title={u.displayName}
                      >
                        {isSelected && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-600 rounded-r-md" />}
                        <div className="relative">
                          <img
                            src={u.avatar}
                            alt=""
                            className={`w-8.5 h-8.5 rounded-full object-cover border transition-all ${
                              isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20 scale-105" : "border-slate-200 dark:border-slate-850 hover:scale-105"
                            }`}
                          />
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                        </div>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setActiveFriendId(u.id);
                        fetchDmMessages(u.id);
                      }}
                      className={`w-[92%] mx-auto mb-1 p-2 flex gap-2.5 items-center rounded-xl transition-all cursor-pointer text-left ${
                        isSelected 
                          ? (isDarkMode ? "bg-slate-800 text-white font-medium shadow-sm border border-slate-750" : "bg-indigo-50/80 text-indigo-950 font-medium border border-indigo-100/45") 
                          : (isDarkMode ? "text-gray-300 hover:bg-slate-800/40 border border-transparent" : "text-gray-700 hover:bg-gray-100/50 border border-transparent")
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={u.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-gray-150/50"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold truncate leading-none">{u.displayName}</span>
                          {u.isPremium && (
                            <span className="text-[7.5px] bg-amber-500 text-white font-bold px-1 rounded uppercase tracking-wider scale-90">
                              PRO
                            </span>
                          )}
                        </div>
                        <span className={`text-[9.5px] block mt-0.5 truncate ${isSelected ? (isDarkMode ? "text-indigo-300" : "text-indigo-600") : "text-gray-400"}`}>
                          @{u.username}
                        </span>
                      </div>
                    </button>
                  );
                })
              )
            ) : (
              /* Groups stream list */
              filteredGroups.length === 0 ? (
                <div className="p-4 text-center text-[10px] text-gray-400 select-none italic">
                  {!isSidebarCollapsed ? "Create folder/group forums above!" : "Ø"}
                </div>
              ) : (
                filteredGroups.map((group) => {
                  const isSelected = group.id === activeGroupId;
                  
                  if (isSidebarCollapsed) {
                    return (
                      <button
                        key={group.id}
                        onClick={() => {
                          setActiveGroupId(group.id);
                          fetchGroupMessages(group.id);
                        }}
                        className={`w-full py-3 flex justify-center relative transition-all cursor-pointer ${
                          isSelected ? "bg-indigo-50/40 dark:bg-slate-800/30" : "hover:bg-gray-100/50 dark:hover:bg-slate-800/10"
                        }`}
                        title={group.name}
                      >
                        {isSelected && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-600 rounded-r-md" />}
                        <img
                          src={group.coverUrl}
                          alt=""
                          className={`w-8.5 h-8.5 rounded-xl object-cover border transition-all ${
                            isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20 scale-105" : "border-slate-200 dark:border-slate-850 hover:scale-105"
                          }`}
                        />
                      </button>
                    );
                  }

                  return (
                    <button
                      key={group.id}
                      onClick={() => {
                        setActiveGroupId(group.id);
                        fetchGroupMessages(group.id);
                      }}
                      className={`w-[92%] mx-auto mb-1 p-2 flex gap-2.5 items-center rounded-xl transition-all cursor-pointer text-left ${
                        isSelected 
                          ? (isDarkMode ? "bg-slate-800 text-white font-medium shadow-sm border border-slate-750" : "bg-indigo-50/80 text-indigo-950 font-medium border border-indigo-100/45") 
                          : (isDarkMode ? "text-gray-300 hover:bg-slate-800/40 border border-transparent" : "text-gray-700 hover:bg-gray-100/50 border border-transparent")
                      }`}
                    >
                      <img
                        src={group.coverUrl}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover border border-gray-150/50 shrink-0"
                      />
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold truncate leading-none">{group.name}</span>
                          <span className="text-[8px] text-gray-400 shrink-0 select-none">
                            {group.members?.length || 3} members
                          </span>
                        </div>
                        <p className="text-[9.5px] text-gray-400 truncate mt-0.5 select-none leading-none">
                          {group.description}
                        </p>
                      </div>
                    </button>
                  );
                })
              )
            )}
          </div>

          {/* D. Bottom side triggers inside sidebar */}
          {!isSidebarCollapsed && activeTab === "groups" && (
            <div className={`p-2.5 border-t shrink-0 flex ${isDarkMode ? "border-slate-850" : "border-gray-100"}`}>
              <button
                onClick={() => setIsNewGroupModalOpen(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-2xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                New Music Group
              </button>
            </div>
          )}

          {isSidebarCollapsed && activeTab === "groups" && (
            <div className={`p-3 border-t shrink-0 flex justify-center ${isDarkMode ? "border-slate-850" : "border-gray-100"}`}>
              <button
                onClick={() => setIsNewGroupModalOpen(true)}
                className="w-8 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center transition-all hover:scale-105"
                title="Create Group Forum"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

        {/* ================= RIGHT SIDE: FULLY EXPANDED IMMERSIVE DIALOGUE AREA ================= */}
        <div className="flex-1 flex flex-col min-h-0 bg-transparent">
          
          {/* Header Action Row */}
          {activeTab === "dm" ? (
            <div className={`p-3 md:p-3.5 flex justify-between items-center border-b flex-shrink-0 transition-colors ${
              isDarkMode ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-gray-150 text-slate-900"
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                    isDarkMode ? "hover:bg-slate-800 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                  }`}
                  title={isSidebarCollapsed ? "Show contact list" : "Hide list (Focus Screen)"}
                >
                  {isSidebarCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
                
                <div className="relative shrink-0">
                  <img
                    src={activeFriend.avatar}
                    alt={activeFriend.displayName}
                    className="w-8.5 h-8.5 rounded-full object-cover border-2 border-indigo-100/50"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white dark:border-slate-900 rounded-full" />
                </div>
                
                <div className="min-w-0">
                  <h4 className="font-display font-semibold text-xs leading-none">
                    {activeFriend.displayName}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1 select-none">
                    <span className="text-[10px] text-gray-450 truncate">@{activeFriend.username}</span>
                    <span className="text-gray-300 dark:text-slate-800 text-[10px]">•</span>
                    <span className="text-[9px] text-emerald-500 font-medium">Synced Dialogue link</span>
                  </div>
                </div>
              </div>
              
              <div className={`text-[9px] px-2.5 py-1 rounded-full font-mono select-none hidden sm:inline-block border ${
                isDarkMode ? "bg-slate-800/80 border-slate-700 text-gray-300" : "bg-gray-50 border-gray-100 text-gray-500"
              }`}>
                Location: {activeFriend.location || "Earth Orbit"}
              </div>
            </div>
          ) : activeGroup ? (
            <div className={`p-3 md:p-3.5 flex justify-between items-center border-b flex-shrink-0 transition-colors ${
              isDarkMode ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-gray-150 text-slate-900"
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                    isDarkMode ? "hover:bg-slate-800 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                  }`}
                  title={isSidebarCollapsed ? "Show contact list" : "Hide list (Focus Screen)"}
                >
                  {isSidebarCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
                
                <img
                  src={activeGroup.coverUrl}
                  alt=""
                  className="w-8.5 h-8.5 rounded-lg object-cover border shrink-0"
                />
                
                <div className="min-w-0">
                  <h4 className="font-display font-semibold text-xs leading-none truncate">
                    {activeGroup.name}
                  </h4>
                  <p className="text-[10px] text-gray-450 truncate mt-1 max-w-[200px] select-none text-left">
                    {activeGroup.description}
                  </p>
                </div>
              </div>
              
              <div className={`text-[9px] px-2.5 py-1 rounded-full font-mono select-none hidden sm:inline-block border shrink-0 ${
                isDarkMode ? "bg-slate-800/80 border-slate-700 text-gray-300" : "bg-gray-50 border-gray-100 text-gray-400"
              }`}>
                Forum Space • {activeGroup.createdAt}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-400 select-none">Choose a discussion forum to connect.</div>
          )}

          {/* Messages Scroller Window */}
          <div ref={chatContainerRef} className={`flex-1 p-4 overflow-y-auto space-y-4 ${
            isDarkMode ? "bg-slate-950/20 bg-linear-to-b from-slate-950/30 to-slate-950/5" : "bg-gray-50/25 bg-linear-to-b from-gray-50/20 to-gray-50/5"
          }`}>
            
            {activeTab === "dm" ? (
              localDmMessages.length === 0 ? (
                <div className={`mx-4 my-6 flex flex-col items-center justify-center p-8 text-center select-none rounded-2xl border border-dashed ${
                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
                }`}>
                  <span className="text-3xl animate-bounce">👋</span>
                  <p className="text-xs font-semibold mt-3">Start sharing waves & ideas with @{activeFriend.username}</p>
                  <p className="text-[10.5px] text-gray-400 max-w-xs mt-1.5 leading-normal">
                    This P2P chat supports instant acoustic wave transfers, lyric highlighting, and real-time reviews.
                  </p>
                </div>
              ) : (
                localDmMessages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} animate-fade-in`}>
                      <div className={`max-w-[72%] shadow-2xs ${
                        isMine 
                          ? "bg-linear-to-br from-indigo-500 to-indigo-650 text-white rounded-2xl rounded-tr-sm p-3 py-2.5" 
                          : `${isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-100" : "bg-white border border-gray-150 text-slate-850"} rounded-2xl rounded-tl-sm p-3 py-2.5`
                      }`}>
                        
                        {/* Embed dynamic track inside bubble */}
                        {msg.song && (
                          <div className={`mb-2 rounded-xl p-2 flex gap-2.5 items-center text-left ${
                            isMine ? "bg-black/20 text-white" : "bg-gray-50 dark:bg-slate-950 border dark:border-slate-850"
                          }`}>
                            <div className="relative w-8 h-8 rounded-md overflow-hidden shrink-0">
                              <img src={msg.song.artworkUrl} alt="" className="w-full h-full object-cover animate-[spin_10s_linear_infinite]" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-[7px] uppercase tracking-wider font-extrabold ${isMine ? "text-indigo-200" : "text-gray-400"}`}>
                                Shared Soundstream
                              </p>
                              <h5 className="font-semibold truncate text-[10.5px] leading-tight mt-0.5">{msg.song.title}</h5>
                              <span className="text-[9.5px] opacity-80 truncate block mt-0.2">{msg.song.artist}</span>
                            </div>
                          </div>
                        )}

                        {/* Lyrics highlight */}
                        {msg.lyricsLine && (
                          <blockquote className={`pl-2 border-l-2 mb-2 italic font-mono text-[9.5px] leading-relaxed ${
                            isMine ? "border-indigo-300 text-indigo-100/90" : "border-indigo-400 text-gray-500 dark:text-gray-400"
                          }`}>
                            "{msg.lyricsLine}"
                          </blockquote>
                        )}

                        {msg.imageUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-black/5 max-w-sm">
                            <img src={msg.imageUrl} alt="" className="max-h-32 w-full object-cover rounded-lg" />
                          </div>
                        )}

                        {/* Interactive audio progress simulation */}
                        {msg.isVoiceNote ? (
                          <div className={`flex items-center gap-2.5 py-1.5 px-2 rounded-xl select-none min-w-[200px] ${
                            isMine ? "bg-indigo-700/35" : "bg-gray-50 dark:bg-slate-950"
                          }`}>
                            <button className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all hover:scale-105 active:scale-90 cursor-pointer ${
                              isMine ? "bg-white text-indigo-600 border-indigo-200" : "bg-indigo-650 text-white border-indigo-500"
                            }`}>
                              <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                            </button>
                            <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                              <div className="flex items-end gap-[1.5px] h-4.5 pr-2">
                                <span className={`w-0.5 rounded-full ${isMine ? "bg-white/70" : "bg-indigo-400"} h-2.5`} />
                                <span className={`w-0.5 rounded-full ${isMine ? "bg-white/80" : "bg-indigo-400"} h-3.5`} />
                                <span className={`w-0.5 rounded-full ${isMine ? "bg-white" : "bg-indigo-600"} h-1.5`} />
                                <span className={`w-0.5 rounded-full ${isMine ? "bg-white/60" : "bg-indigo-300"} h-2`} />
                                <span className={`w-0.5 rounded-full ${isMine ? "bg-white/80" : "bg-indigo-400"} h-4.5`} />
                                <span className={`w-0.5 rounded-full ${isMine ? "bg-white" : "bg-indigo-600"} h-3`} />
                                <span className={`w-0.5 rounded-full ${isMine ? "bg-white/90" : "bg-indigo-500"} h-4`} />
                                <span className={`w-0.5 rounded-full ${isMine ? "bg-white/50" : "bg-indigo-300"} h-1.5`} />
                                <span className={`w-0.5 rounded-full ${isMine ? "bg-white/70" : "bg-indigo-400"} h-2`} />
                                <span className={`w-0.5 rounded-full ${isMine ? "bg-white" : "bg-indigo-600"} h-3.5`} />
                                <span className={`w-0.5 rounded-full ${isMine ? "bg-white/80" : "bg-indigo-400"} h-1`} />
                              </div>
                              <div className={`flex justify-between text-[8px] font-mono ${isMine ? "text-indigo-250/90" : "text-gray-400"}`}>
                                <span>Voice note</span>
                                <span>{msg.duration || "0:08"}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="leading-relaxed text-[11.5px] tracking-wide break-words">{msg.content}</p>
                        )}

                        <div className="flex justify-end gap-1.5 items-center mt-1.5 opacity-50 text-[8px] font-mono select-none">
                          <span>{msg.timestamp}</span>
                          {isMine && <CheckCheck className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* Groups forums visual messages list */
              isLoadingGroupMessages ? (
                <div className="py-8 text-center text-xs text-gray-400 italic">Syncing group alignment feeds...</div>
              ) : groupMessages.length === 0 ? (
                <div className={`mx-4 my-6 flex flex-col items-center justify-center p-8 text-center select-none rounded-2xl border border-dashed ${
                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
                }`}>
                  <span className="text-3xl animate-pulse">💬</span>
                  <p className="text-xs font-semibold mt-3">Initiate discussions in this forum</p>
                  <p className="text-[10.5px] text-gray-400 max-w-xs mt-1.5 leading-normal">
                    Everyone has access to review lyrical sheets, post tracks, and share feedback instantly.
                  </p>
                </div>
              ) : (
                groupMessages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;
                  const isSystem = msg.senderId === "system";

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center p-1.5 select-none animate-fade-in">
                        <span className={`text-[9px] font-mono border px-3 py-1 rounded-full text-center ${
                          isDarkMode 
                            ? "bg-slate-900 border-slate-800 text-indigo-300" 
                            : "bg-indigo-50 border-indigo-150 text-indigo-700"
                        }`}>
                          ⚙️ {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isMine ? "justify-end" : "justify-start"} animate-fade-in`}>
                      
                      {!isMine && (
                        <img
                          src={msg.senderAvatar}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover border mt-3 shrink-0 bg-gray-100"
                        />
                      )}

                      <div className="max-w-[72%] space-y-1">
                        {!isMine && (
                          <span className="text-[9px] font-sans font-bold text-gray-450 block leading-none ml-1">
                            {msg.senderDisplayName}
                          </span>
                        )}

                        <div className={`shadow-2xs ${
                          isMine 
                            ? "bg-linear-to-br from-indigo-500 to-indigo-650 text-white rounded-2xl rounded-tr-sm p-3 py-2.5" 
                            : `${isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-100" : "bg-white border border-gray-150 text-slate-850"} rounded-2xl rounded-tl-sm p-3 py-2.5`
                        }`}>
                          
                          {/* Embed Song inside bubble */}
                          {msg.song && (
                            <div className={`mb-2 rounded-xl p-2 flex gap-2.5 items-center text-left ${
                              isMine ? "bg-black/20 text-white" : "bg-gray-50 dark:bg-slate-950 border dark:border-slate-850"
                            }`}>
                              <div className="relative w-8 h-8 rounded-md overflow-hidden shrink-0">
                                <img src={msg.song.artworkUrl} alt="" className="w-full h-full object-cover animate-[spin_10s_linear_infinite]" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`text-[7px] uppercase tracking-wider font-extrabold ${isMine ? "text-indigo-250" : "text-gray-400"}`}>
                                  Shared Soundstream
                                </p>
                                <h5 className="font-semibold truncate text-[10.5px] leading-tight mt-0.5">{msg.song.title}</h5>
                                <span className="text-[9.5px] opacity-80 truncate block mt-0.2">{msg.song.artist}</span>
                              </div>
                            </div>
                          )}

                          {msg.lyricsLine && (
                            <blockquote className={`pl-2 border-l-2 mb-2 italic font-mono text-[9.5px] leading-relaxed ${
                              isMine ? "border-indigo-300 text-indigo-100/95" : "border-indigo-450 text-gray-500 dark:text-gray-400"
                            }`}>
                              "{msg.lyricsLine}"
                            </blockquote>
                          )}

                          {msg.imageUrl && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-black/5 max-w-sm">
                              <img src={msg.imageUrl} alt="" className="max-h-32 w-full object-cover rounded-lg" />
                            </div>
                          )}

                          {msg.isVoiceNote ? (
                            <div className={`flex items-center gap-2.5 py-1.5 px-2 rounded-xl select-none min-w-[200px] ${
                              isMine ? "bg-indigo-700/35" : "bg-gray-50 dark:bg-slate-950"
                            }`}>
                              <button className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all hover:scale-105 active:scale-90 cursor-pointer ${
                                isMine ? "bg-white text-indigo-600 border-indigo-200" : "bg-indigo-650 text-white border-indigo-500"
                              }`}>
                                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                              </button>
                              <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                                <div className="flex items-end gap-[1.5px] h-4.5 pr-2">
                                  <span className={`w-0.5 rounded-full ${isMine ? "bg-white/70" : "bg-indigo-400"} h-2.5`} />
                                  <span className={`w-0.5 rounded-full ${isMine ? "bg-white/80" : "bg-indigo-400"} h-3.5`} />
                                  <span className={`w-0.5 rounded-full ${isMine ? "bg-white" : "bg-indigo-600"} h-1.5`} />
                                  <span className={`w-0.5 rounded-full ${isMine ? "bg-white/60" : "bg-indigo-300"} h-2`} />
                                  <span className={`w-0.5 rounded-full ${isMine ? "bg-white/80" : "bg-indigo-400"} h-4.5`} />
                                  <span className={`w-0.5 rounded-full ${isMine ? "bg-white" : "bg-indigo-600"} h-3`} />
                                  <span className={`w-0.5 rounded-full ${isMine ? "bg-white/90" : "bg-indigo-500"} h-4`} />
                                  <span className={`w-0.5 rounded-full ${isMine ? "bg-white/50" : "bg-indigo-300"} h-1.5`} />
                                  <span className={`w-0.5 rounded-full ${isMine ? "bg-white/70" : "bg-indigo-400"} h-2`} />
                                  <span className={`w-0.5 rounded-full ${isMine ? "bg-white" : "bg-indigo-600"} h-3.5`} />
                                  <span className={`w-0.5 rounded-full ${isMine ? "bg-white/80" : "bg-indigo-400"} h-1`} />
                                </div>
                                <div className={`flex justify-between text-[8px] font-mono ${isMine ? "text-indigo-250/90" : "text-gray-400"}`}>
                                  <span>Voice note</span>
                                  <span>{msg.duration || "0:08"}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="leading-relaxed text-[11.5px] tracking-wide break-words">{msg.content}</p>
                          )}

                          <div className="flex justify-end gap-1 items-center mt-1.5 opacity-55 text-[8px] font-mono select-none">
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
            <div className={`px-4 py-2 border-t flex items-center gap-2 text-xs justify-between shrink-0 ${
              isDarkMode ? "bg-slate-900/80 border-slate-850 text-indigo-300" : "bg-indigo-50/60 border-indigo-100 text-indigo-900"
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold uppercase text-[9px] shrink-0 opacity-80 select-none">QUEUE:</span>
                {attachedSong && (
                  <span className={`px-2.5 py-1 rounded-full border font-medium text-[10px] truncate max-w-[200px] inline-flex items-center gap-1 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-indigo-455" : "bg-white border-indigo-100 text-indigo-705"
                  }`}>
                    🎵 {attachedSong.title}
                  </span>
                )}
                {attachedImage && (
                  <span className={`px-2.5 py-1 rounded-full border font-medium text-[10px] inline-flex items-center gap-1 ${
                    isDarkMode ? "bg-slate-950 border-slate-805 text-indigo-455" : "bg-white border-indigo-100 text-indigo-705"
                  }`}>
                    📷 Photo Attached
                  </span>
                )}
              </div>
              <button 
                onClick={() => { setAttachedSong(null); setAttachedLyrics(""); setAttachedImage(""); }}
                className="text-gray-405 hover:text-rose-500 p-1 rounded-full cursor-pointer transition-colors"
                title="Discard attachments"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Message Input console container */}
          <div className={`p-3 md:p-4 border-t flex-shrink-0 transition-colors ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-150"
          }`}>
            <div className={`flex items-center gap-2.5 p-1.5 px-3 rounded-2xl border transition-all ${
              isDarkMode 
                ? "bg-slate-950 border-slate-800 text-white focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/80" 
                : "bg-gray-50 border-gray-200 text-slate-800 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:shadow-xs"
            }`}>
              
              {/* Media attach panel micro-buttons */}
              {!isRecording && (
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => setIsSongSearchOpen(true)}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      isDarkMode ? "text-gray-450 hover:text-white hover:bg-slate-800" : "text-gray-450 hover:text-indigo-600 hover:bg-gray-150"
                    }`}
                    title="Attach Dynamic Soundstream track..."
                  >
                    <Music className="w-4 h-4" />
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
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      isDarkMode ? "text-gray-450 hover:text-white hover:bg-slate-800" : "text-gray-450 hover:text-indigo-600 hover:bg-gray-150"
                    }`}
                    title="Upload picture payload"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Text typing dynamic field */}
              {isRecording ? (
                <div className="flex-1 text-red-500 flex items-center justify-between text-xs font-semibold select-none py-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>Acoustic recording wave: {recordingSeconds}s</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={cancelRecording} className="text-gray-500 hover:text-gray-805 dark:hover:text-gray-300 text-[10.5px] font-bold cursor-pointer">Cancel</button>
                    <button onClick={stopRecordingAndSend} className="bg-red-650 hover:bg-red-700 text-white font-bold px-3 py-1 rounded-full text-[10.5px] cursor-pointer">Send</button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder={
                      activeTab === "dm" 
                        ? `Message @${activeFriend.username}... (Press enter)`
                        : `Post to "${activeGroup?.name || "forum"}"... (Press enter)`
                    }
                    value={activeTab === "dm" ? dmInputText : groupInputText}
                    onChange={(e) => activeTab === "dm" ? setDmInputText(e.target.value) : setGroupInputText(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, activeTab)}
                    className="flex-1 text-xs bg-transparent border-none focus:outline-none p-1.5 focus:ring-0 text-slate-800 dark:text-gray-100"
                  />

                  {/* Send & Dictate tools */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={startRecording}
                      className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                        isDarkMode ? "text-gray-400 hover:text-red-400 hover:bg-slate-800" : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                      }`}
                      title="Dictate voice note"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={activeTab === "dm" ? handleSendDm : handleSendGroupMsg}
                      disabled={
                        activeTab === "dm"
                          ? !dmInputText.trim() && !attachedSong && !attachedImage
                          : !groupInputText.trim() && !attachedSong && !attachedImage
                      }
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-transparent disabled:text-gray-400 text-white p-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* MODAL 1: Dynamic soundstream attachments overlay */}
      {isSongSearchOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className={`rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 ${
            isDarkMode ? "bg-slate-900 border border-slate-800 text-white" : "bg-white text-gray-900"
          }`}>
            <div className="flex justify-between items-center border-b pb-3 border-transparent">
              <h4 className="font-display font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-4 h-4 text-emerald-500" />
                Select original track link
              </h4>
              <button onClick={() => setIsSongSearchOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="relative">
              <input 
                type="text"
                placeholder="Search catalog by song or artist..."
                value={songSearchQuery}
                onChange={(e) => setSongSearchQuery(e.target.value)}
                className={`w-full text-xs border rounded-2xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-gray-50 border-gray-150 text-gray-800"
                }`}
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
                    key={s.trackId}
                    onClick={() => {
                      setAttachedSong(s);
                      setAttachedLyrics(s.title === "Almost an End" ? "Lights will guide you home" : `Sonic alignment: ${s.title}`);
                      setIsSongSearchOpen(false);
                      setSongSearchQuery("");
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                      isDarkMode 
                        ? "border-transparent hover:border-slate-800 hover:bg-slate-950" 
                        : "border-transparent hover:border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <img src={s.artworkUrl} alt={s.title} className="w-8 h-8 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight truncate">{s.title}</p>
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
          <div className={`rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 ${
            isDarkMode ? "bg-slate-900 border border-slate-800 text-white" : "bg-white text-gray-900"
          }`}>
            <div className="flex justify-between items-center border-b pb-3 border-transparent">
              <h4 className="font-display font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500 animate-pulse" />
                Initialize New Group Forum
              </h4>
              <button onClick={() => setIsNewGroupModalOpen(false)} className="text-gray-450 hover:text-gray-650 cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-450 uppercase">Group name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Dream Pop Collective, Synthesizer Club"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className={`w-full text-xs border rounded-2xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-550 ${
                    isDarkMode ? "bg-slate-950 border-slate-805 text-white" : "bg-white border-gray-150 text-gray-800"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-450 uppercase block">Group description</label>
                <textarea 
                  placeholder="What is the objective or vibe of this discussion group?"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  className={`w-full text-xs border rounded-2xl p-3 h-20 focus:outline-none focus:ring-1 focus:ring-indigo-550 ${
                    isDarkMode ? "bg-slate-950 border-slate-805 text-white" : "bg-white border-gray-150 text-gray-800"
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-450 uppercase block">Select header cover photo</label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COVERS.map((cover, idx) => {
                    const isSelected = cover === selectedCoverUrl;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedCoverUrl(cover)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                          isSelected ? "border-indigo-650 ring-2 ring-indigo-500/20" : "border-transparent opacity-70"
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
                  className="flex-1 bg-gray-105 dark:bg-slate-800 dark:text-gray-300 hover:bg-gray-200 text-gray-600 font-bold text-xs p-3.5 rounded-2xl active:scale-95 transition-all cursor-pointer"
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

  // Quick helper to evaluate expanded list state for visual decoration spacing
  function isExpandedAndEmpty() {
    if (isSidebarCollapsed) return false;
    if (activeTab === "dm") return filteredUsers.length === 0;
    return filteredGroups.length === 0;
  }
}
