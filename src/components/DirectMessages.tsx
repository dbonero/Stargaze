/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Send, Mic, Image, Music, FileText, ChevronRight, CheckCheck, Play, Pause, X } from "lucide-react";
import { Message, Song, User } from "../types";

interface DirectMessagesProps {
  currentUser: User;
  users: User[];
  messages: Message[];
  onSendMessage: (receiverId: string, content: string, payload?: Partial<Message>) => void;
  songsDbRef: Song[];
}

export default function DirectMessages({
  currentUser,
  users,
  messages,
  onSendMessage,
  songsDbRef,
}: DirectMessagesProps) {
  const [activeFriendId, setActiveFriendId] = useState<string>("chloe_vibe");
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [attachedSong, setAttachedSong] = useState<Song | null>(null);
  const [attachedLyrics, setAttachedLyrics] = useState("");
  const [attachedImage, setAttachedImage] = useState("");
  const [isSongSearchOpen, setIsSongSearchOpen] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState("");

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, activeFriendId]);

  // Filter messages for currently active thread
  const activeMessages = messages.filter(
    (m) =>
      (m.senderId === currentUser.id && m.receiverId === activeFriendId) ||
      (m.senderId === activeFriendId && m.receiverId === currentUser.id)
  );

  const activeFriend = users.find((u) => u.id === activeFriendId) || users[1];

  const handleSend = () => {
    if (!inputText.trim() && !attachedSong && !attachedImage) return;

    const payload: Partial<Message> = {};
    if (attachedSong) payload.song = attachedSong;
    if (attachedLyrics) payload.lyricsLine = attachedLyrics;
    if (attachedImage) payload.imageUrl = attachedImage;

    onSendMessage(activeFriendId, inputText.trim(), payload);
    
    // Clear attachment state
    setInputText("");
    setAttachedSong(null);
    setAttachedLyrics("");
    setAttachedImage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  // Simulate Voice Note recording states
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
    onSendMessage(activeFriendId, "Voice Note (Playback Simulated)", {
      isVoiceNote: true,
      duration: durationStr || "0:08",
    });
    setRecordingSeconds(0);
  };

  const cancelRecording = () => {
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Curated photo picker mock options
  const attachMockPhoto = () => {
    const images = [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80",
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80",
      "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&q=80"
    ];
    setAttachedImage(images[Math.floor(Math.random() * images.length)]);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs h-[550px] flex">
      
      {/* Left Sidebar: Conversations list */}
      <div className="w-1/3 border-r border-gray-50 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-gray-50 bg-white">
          <h4 className="font-display font-semibold text-gray-900 text-sm">Conversations</h4>
          <p className="text-[10px] text-gray-400">Share songs & lyrics in realtime</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50/50">
          {users
            .filter((u) => u.id !== currentUser.id)
            .map((u) => {
              const isSelected = u.id === activeFriendId;
              // Get last message in thread
              const lastMsgInThread = messages
                .filter((m) => (m.senderId === u.id || m.receiverId === u.id))
                .slice(-1)[0];

              return (
                <button
                  key={u.id}
                  onClick={() => setActiveFriendId(u.id)}
                  className={`w-full p-3 flex gap-3 items-center text-left transition-colors ${
                    isSelected ? "bg-indigo-50/80 border-r-4 border-indigo-600" : "hover:bg-gray-50"
                  }`}
                >
                  <img
                    src={u.avatar}
                    alt={u.displayName}
                    className="w-10 h-10 rounded-full object-cover border shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-900 truncate">{u.displayName}</span>
                      {u.isPremium && <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-sans">Pro</span>}
                    </div>
                    <span className="text-[10px] text-gray-400 truncate block">@{u.username}</span>
                    <p className="text-[10px] text-gray-400 truncate mt-1">
                      {lastMsgInThread ? lastMsgInThread.content : "Start chatting!"}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Right side: Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        
        {/* Chat window Header */}
        <div className="p-4 flex justify-between items-center border-b border-gray-50">
          <div className="flex items-center gap-3">
            <img
              src={activeFriend.avatar}
              alt={activeFriend.displayName}
              className="w-10 h-10 rounded-full object-cover border"
              referrerPolicy="no-referrer"
            />
            <div>
              <h4 className="font-display font-semibold text-gray-900 text-sm">{activeFriend.displayName}</h4>
              <span className="text-[10px] text-emerald-500 font-medium">● Online</span>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full font-mono">
            Location: {activeFriend.location || "Earth"}
          </div>
        </div>

        {/* Messaging Box Roll */}
        <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/35">
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-4 text-center">
              <span className="text-4xl">👋</span>
              <p className="text-xs text-gray-400 mt-2 font-display">No message history yet. Connect with @{activeFriend.username} by sharing custom tunes!</p>
            </div>
          ) : (
            activeMessages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-3xl p-3 md:p-4 text-xs ${
                    isMine ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-900"
                  }`}>
                    
                    {/* Embedded Song inside DM bubble */}
                    {msg.song && (
                      <div className={`mb-2 rounded-2xl p-2.5 flex gap-2 items-center text-left ${
                        isMine ? "bg-black/20 text-white" : "bg-white text-gray-900 border border-gray-200"
                      }`}>
                        <img
                          src={msg.song.artworkUrl}
                          alt={msg.song.title}
                          className="w-10 h-10 rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] uppercase tracking-wider opacity-60">SHARED SPOTIFY TRACK</p>
                          <h5 className="font-medium truncate leading-tight">{msg.song.title}</h5>
                          <span className="text-[10px] opacity-75">{msg.song.artist}</span>
                        </div>
                      </div>
                    )}

                    {/* Highly selected highlighted lyrics snippet */}
                    {msg.lyricsLine && (
                      <blockquote className={`pl-2 border-l-2 mb-2 italic font-mono text-[10px] ${
                        isMine ? "border-indigo-300 text-indigo-100" : "border-indigo-500 text-gray-600"
                      }`}>
                        "{msg.lyricsLine}"
                      </blockquote>
                    )}

                    {/* Shared Image attachment */}
                    {msg.imageUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden border">
                        <img src={msg.imageUrl} alt="Attached attachment" className="max-h-40 w-full object-cover" referrerPolicy="no-referrer"/>
                      </div>
                    )}

                    {/* Simulated Voice Message playback */}
                    {msg.isVoiceNote ? (
                      <div className="flex items-center gap-3 py-1">
                        <button className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs ${isMine ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"}`}>
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>
                        <div className="flex-1">
                          <div className="flex gap-0.5 items-end h-5">
                            <span className="w-0.5 h-3 bg-current/40 animate-pulse" />
                            <span className="w-0.5 h-4 bg-current/70" />
                            <span className="w-0.5 h-2 bg-current" />
                            <span className="w-0.5 h-3 bg-current/50" />
                            <span className="w-0.5 h-1 bg-current" />
                            <span className="w-0.5 h-3 bg-current/60" />
                            <span className="w-0.5 h-4 bg-current" />
                          </div>
                        </div>
                        <span className="text-[9px] opacity-70 font-mono shrink-0">{msg.duration || "0:12"}</span>
                      </div>
                    ) : (
                      <p className="leading-relaxed font-sans">{msg.content}</p>
                    )}

                    {/* Message metadata details */}
                    <div className="flex justify-end gap-1 items-center mt-1.5 opacity-60 text-[9px] font-mono select-none">
                      <span>{msg.timestamp}</span>
                      {isMine && <CheckCheck className="w-3 h-3" />}
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pending attachments info bar */}
        {(attachedSong || attachedImage) && (
          <div className="bg-indigo-50/80 px-4 py-2 border-t border-indigo-100 flex items-center gap-3 text-xs justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-semibold uppercase text-[9px]">Attachment:</span>
              {attachedSong && <span className="bg-white px-2 py-0.5 rounded-full border text-indigo-700 font-medium font-display">🎵 {attachedSong.title}</span>}
              {attachedImage && <span className="bg-white px-2 py-0.5 rounded-full border text-indigo-700 font-medium">📷 Photo Attached</span>}
            </div>
            <button 
              onClick={() => { setAttachedSong(null); setAttachedLyrics(""); setAttachedImage(""); }}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Panel Controls */}
        <div className="p-3 border-t border-gray-50 bg-white">
          <div className="flex items-center gap-2">
            
            {/* Quick Actions tool belt */}
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => setIsSongSearchOpen(true)}
                className="text-gray-400 hover:text-indigo-600 p-1.5 rounded-full hover:bg-gray-50"
                title="Send Spotify track"
              >
                <Music className="w-4.5 h-4.5" />
              </button>
              <button 
                onClick={attachMockPhoto}
                className="text-gray-400 hover:text-indigo-600 p-1.5 rounded-full hover:bg-gray-50"
                title="Send image"
              >
                <Image className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Main Text / Voice recording inputs */}
            {isRecording ? (
              <div className="flex-1 bg-red-50 text-red-600 rounded-full px-4 py-2 flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>Recording: {recordingSeconds}s</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={cancelRecording} className="text-gray-400 hover:text-gray-600 text-[10px]">Cancel</button>
                  <button onClick={stopRecordingAndSend} className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px]">Send Note</button>
                </div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder={`Write message to @${activeFriend.username}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1 text-xs border border-gray-100 rounded-full px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50"
                />

                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={startRecording}
                    className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-gray-50 transition-colors"
                    title="Record voice note"
                  >
                    <Mic className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim() && !attachedSong && !attachedImage}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-100 disabled:text-gray-400 p-2 rounded-full transition-all shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

          </div>
        </div>

      </div>

      {/* Spotify Track Drawer Picker */}
      {isSongSearchOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-display font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                <Music className="w-4 h-4 text-emerald-500" />
                Select Song to DM
              </h4>
              <button onClick={() => setIsSongSearchOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <input 
              type="text"
              placeholder="Search mock database..."
              value={songSearchQuery}
              onChange={(e) => setSongSearchQuery(e.target.value)}
              className="w-full text-xs border border-gray-100 rounded-2xl p-2.5 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-3"
            />

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
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
                      setAttachedLyrics(s.title === "Fix You" ? "Lights will guide you home" : `Tuned beautifully with ${s.title}`);
                      setIsSongSearchOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 text-left border border-transparent hover:border-gray-100 transition-all text-xs"
                  >
                    <img src={s.artworkUrl} alt={s.title} className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <p className="font-semibold text-gray-900 leading-tight truncate">{s.title}</p>
                      <span className="text-[10px] text-gray-400">{s.artist}</span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
