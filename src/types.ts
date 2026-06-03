/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Song {
  spotifyId: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  previewUrl: string;
  externalUrl?: string;
  durationMs?: number;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  coverPhoto: string;
  bio: string;
  email?: string;
  location?: string;
  favoriteSong?: string;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  postsCount: number;
  isPremium: boolean;
  followingIds: string[];
  blockedIds: string[];
  mutedIds: string[];
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  displayName: string;
  content: string;
  timestamp: string;
  replies?: Comment[];
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  content: string;
  mood: string;
  attachedImages: string[];
  song?: Song;
  lyrics?: string;
  highlightedLyrics?: string[];
  likes: string[]; // List of userIds
  comments: Comment[];
  repostCount: number;
  savedBy: string[]; // List of userIds
  timestamp: string;
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  imageUrl: string;
  song?: Song;
  lyricsHighlight?: string;
  mood: string;
  timestamp: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  imageUrl?: string;
  song?: Song;
  lyricsLine?: string;
  isVoiceNote?: boolean;
  duration?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: "follow" | "like" | "comment" | "message" | "repost" | "save";
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatar: string;
  postId?: string;
  content?: string; // Preview of message, comment, or description
  timestamp: string;
  read: boolean;
}

export interface MoodAnalyticSummary {
  mostUsedMoods: { name: string; count: number; color: string }[];
  favoriteSongs: { song: Song; count: number }[];
  listeningTrends: { day: string; happy: number; sad: number; relaxed: number; energetic: number }[];
  moodHistory: { day: string; mood: string; intensity: number }[];
}

export interface PlaylistSong {
  id: string;
  song: Song;
  addedByUserId: string;
  addedByDisplayName: string;
  addedByAvatar: string;
  addedAt: string;
  comments: Comment[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  createdByUserId: string;
  collaborators: string[]; // User IDs (includes creator)
  songs: PlaylistSong[];
  createdAt: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderDisplayName: string;
  senderAvatar: string;
  content: string;
  imageUrl?: string;
  song?: Song;
  lyricsLine?: string;
  isVoiceNote?: boolean;
  duration?: string;
  timestamp: string;
}

export interface MusicGroup {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  createdById: string;
  members: string[]; // List of userIds
  createdAt: string;
}

export type MoodType = "Happy" | "Sad" | "Excited" | "Motivated" | "Relaxed" | "Angry" | "Heartbroken" | "Grateful" | "Tired";

