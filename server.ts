/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { User, Post, Song, Story, Message, Notification, Comment, Playlist, PlaylistSong } from "./src/types";

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        geminiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (e) {
        console.warn("Failed to initialize GoogleGenAI client:", e);
      }
    }
  }
  return geminiClient;
}

// ----------------- Mock Data Store -----------------
const MOCK_PHOTOS = [
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80", // Concert
  "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&auto=format&fit=crop&q=80", // Vinyl record
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80", // Dj turntables
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80", // Microphone
  "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80", // Rainy window
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80", // Roadtrip neon
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80", // Retro bedroom
  "https://images.unsplash.com/photo-1487180142328-054b783fc471?w=600&auto=format&fit=crop&q=80", // Colorful cassette
];

const SONG_DATABASE: Song[] = [
  {
    spotifyId: "1",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    artworkUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&auto=format&fit=crop&q=80",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    externalUrl: "https://open.spotify.com/track/0VjIj7vR2Zg73GgXnZg6RE",
    durationMs: 200000,
  },
  {
    spotifyId: "2",
    title: "Fix You",
    artist: "Coldplay",
    album: "X&Y",
    artworkUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&auto=format&fit=crop&q=80",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    externalUrl: "https://open.spotify.com/track/7LVHVv6360Jg6JvUF6PK0w",
    durationMs: 295000,
  },
  {
    spotifyId: "3",
    title: "Good 4 U",
    artist: "Olivia Rodrigo",
    album: "SOUR",
    artworkUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    externalUrl: "https://open.spotify.com/track/4ZtFanR9U6ndgddIK35v98",
    durationMs: 178000,
  },
  {
    spotifyId: "4",
    title: "Midnight Lo-fi Vibe",
    artist: "Chillhop Beats",
    album: "Late Night Coffee",
    artworkUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    externalUrl: "https://open.spotify.com/track/3lVUkZpHbT8pYeeJlhIuB4",
    durationMs: 154000,
  },
  {
    spotifyId: "5",
    title: "As It Was",
    artist: "Harry Styles",
    album: "Harry's House",
    artworkUrl: "https://images.unsplash.com/photo-1481887328591-3e277f9473dc?w=300&auto=format&fit=crop&q=80",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    externalUrl: "https://open.spotify.com/track/4pt5fD685v7UPgNW7W96g6",
    durationMs: 167000,
  },
  {
    spotifyId: "6",
    title: "Cruel Summer",
    artist: "Taylor Swift",
    album: "Lover",
    artworkUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    externalUrl: "https://open.spotify.com/track/1BxfEXWb0xy6f06v2X06uA",
    durationMs: 178000,
  },
  {
    spotifyId: "7",
    title: "Ocean Eyes",
    artist: "Billie Eilish",
    album: "Don't Smile at Me",
    artworkUrl: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=300&auto=format&fit=crop&q=80",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    externalUrl: "https://open.spotify.com/track/7hDV9tEEgUbgY2uYfO619f",
    durationMs: 200000,
  },
  {
    spotifyId: "8",
    title: "Stronger",
    artist: "Kanye West",
    album: "Graduation",
    artworkUrl: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=300&auto=format&fit=crop&q=80",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    externalUrl: "https://open.spotify.com/track/4gph9UgEDm7vY48726Cg7A",
    durationMs: 311000,
  },
  {
    spotifyId: "9",
    title: "Feeling Good",
    artist: "Nina Simone",
    album: "I Put a Spell on You",
    artworkUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=300&auto=format&fit=crop&q=80",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    externalUrl: "https://open.spotify.com/track/3Xf9U9rFvOfev2Fsz3y6Fm",
    durationMs: 173000,
  },
  {
    spotifyId: "10",
    title: "No Plan",
    artist: "Hozier",
    album: "Wasteland, Baby!",
    artworkUrl: "https://images.unsplash.com/photo-1438183972690-6d4658e3290e?w=300&auto=format&fit=crop&q=80",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    externalUrl: "https://open.spotify.com/track/1bYWeGSkw8I35N7vjHivV4",
    durationMs: 331000,
  },
];

const INITIAL_USERS: User[] = [
  {
    id: "currentUser",
    username: "iamdbonero",
    displayName: "D. Bonero",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    coverPhoto: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
    bio: "Music curator and late night deep thinker. Living via Spotify previews. 🎧",
    location: "London, UK",
    favoriteSong: "Fix You by Coldplay",
    followersCount: 142,
    followingCount: 98,
    likesCount: 1540,
    postsCount: 3,
    isPremium: false,
    followingIds: ["chloe_vibe", "leo_beats"],
    blockedIds: [],
    mutedIds: [],
  },
  {
    id: "chloe_vibe",
    username: "chloe_vibe",
    displayName: "Chloe Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    coverPhoto: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
    bio: "Catch flights and concert front rows! Pop enthusiast. Cruel Summer is my permanent state of mind.",
    location: "New York, USA",
    favoriteSong: "Cruel Summer by Taylor Swift",
    followersCount: 1250,
    followingCount: 382,
    likesCount: 980,
    postsCount: 42,
    isPremium: true,
    followingIds: ["currentUser", "leo_beats"],
    blockedIds: [],
    mutedIds: [],
  },
  {
    id: "leo_beats",
    username: "leo_beats",
    displayName: "Leonardo King (Leo)",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    coverPhoto: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=1200&auto=format&fit=crop&q=80",
    bio: "Lo-fi developer producing dusty beats and cozy code. Minimalist & quiet.",
    location: "Tokyo, Japan",
    favoriteSong: "Midnight Lo-fi Vibe by Chillhop Beats",
    followersCount: 849,
    followingCount: 220,
    likesCount: 2450,
    postsCount: 18,
    isPremium: false,
    followingIds: ["currentUser"],
    blockedIds: [],
    mutedIds: [],
  },
  {
    id: "guitar_hero",
    username: "guitar_hero",
    displayName: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    coverPhoto: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=80",
    bio: "Indie rock vocalist. Heartbroken lyrics but excited guitars. Searching for local gigs.",
    location: "Austin, USA",
    favoriteSong: "Good 4 U by Olivia Rodrigo",
    followersCount: 412,
    followingCount: 512,
    likesCount: 380,
    postsCount: 12,
    isPremium: false,
    followingIds: ["chloe_vibe"],
    blockedIds: [],
    mutedIds: [],
  },
];

// Let's seed initial posts
let MOCK_POSTS: Post[] = [
  {
    id: "post_1",
    userId: "chloe_vibe",
    username: "chloe_vibe",
    displayName: "Chloe Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    content: "Waking up with the biggest smile today! Sunshine, hot iced latte, and absolute pop perfection in my ears. Life is good!",
    mood: "Happy",
    attachedImages: ["https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80"],
    song: SONG_DATABASE[5], // Cruel Summer
    lyrics: "Fever dream high in the quiet of the night\nYou know that I caught it\nBad, bad boy, shiny toy with a price\nYou know that I bought it",
    highlightedLyrics: ["Fever dream high in the quiet of the night", "You know that I caught it"],
    likes: ["leo_beats", "currentUser"],
    comments: [
      {
        id: "com_1",
        userId: "currentUser",
        username: "iamdbonero",
        displayName: "D. Bonero",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        content: "This song is an absolute anthem! Instant dopamine hit.",
        timestamp: "2 hours ago",
      }
    ],
    repostCount: 5,
    savedBy: ["currentUser"],
    timestamp: "3 hours ago",
  },
  {
    id: "post_2",
    userId: "leo_beats",
    username: "leo_beats",
    displayName: "Leonardo King (Leo)",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    content: "Writing typescript with some soothing vinyl rain sounds in the background. The mood is extremely relaxed. Grateful for quiet mornings.",
    mood: "Relaxed",
    attachedImages: ["https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80"],
    song: SONG_DATABASE[3], // Midnight Lo-fi Vibe
    lyrics: "Raindrops fall on the dusty neon pane,\nEverything slow, everything sane,\nJust coffee in a cup and code in the main.",
    highlightedLyrics: ["Everything slow, everything sane,"],
    likes: ["currentUser"],
    comments: [],
    repostCount: 1,
    savedBy: [],
    timestamp: "5 hours ago",
  },
  {
    id: "post_3",
    userId: "guitar_hero",
    username: "guitar_hero",
    displayName: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    content: "Another heartbreak ballad in the making. Sometimes it's anger, sometimes it's just Olivia screaming the exact feelings.",
    mood: "Heartbroken",
    attachedImages: ["https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80"],
    song: SONG_DATABASE[2], // Good 4 U
    lyrics: "Well, good for you, I guess you moved on really easily\nYou found a new girl and it only took a couple weeks\nRemember when you said that you wanted to give me the world?",
    highlightedLyrics: ["Well, good for you, I guess you moved on really easily"],
    likes: ["chloe_vibe"],
    comments: [
      {
        id: "com_2",
        userId: "chloe_vibe",
        username: "chloe_vibe",
        displayName: "Chloe Chen",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
        content: "Scream it out Marcus! 🎸 It gets better.",
        timestamp: "4 hours ago",
      }
    ],
    repostCount: 2,
    savedBy: [],
    timestamp: "Yesterday",
  }
];

let MOCK_STORIES: Story[] = [
  {
    id: "story_1",
    userId: "chloe_vibe",
    username: "chloe_vibe",
    displayName: "Chloe Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    song: SONG_DATABASE[0], // Blinding Lights
    lyricsHighlight: "I said, ooh, I'm blinded by the lights",
    mood: "Excited",
    timestamp: "2 hours ago",
  },
  {
    id: "story_2",
    userId: "leo_beats",
    username: "leo_beats",
    displayName: "Leonardo King (Leo)",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    song: SONG_DATABASE[6], // Ocean Eyes
    lyricsHighlight: "No fair. You really know how to make me cry.",
    mood: "Relaxed",
    timestamp: "4 hours ago",
  },
];

let MOCK_MESSAGES: Message[] = [
  {
    id: "msg_1",
    senderId: "chloe_vibe",
    receiverId: "currentUser",
    content: "Heey! Are you going to the indie festival next weekend?? Marcus is performing a cover set!",
    timestamp: "10:30 AM",
  },
  {
    id: "msg_2",
    senderId: "currentUser",
    receiverId: "chloe_vibe",
    content: "Oh really? Marcus is amazing live. I haven't bought tickets yet but count me in!",
    timestamp: "10:45 AM",
  },
  {
    id: "msg_3",
    senderId: "chloe_vibe",
    receiverId: "currentUser",
    content: "Listen to this track he sent me! Incredible inspiration.",
    song: SONG_DATABASE[1], // Fix You
    lyricsLine: "Lights will guide you home, And ignite your bones",
    timestamp: "10:46 AM",
  }
];

let MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif_1",
    type: "like",
    senderId: "chloe_vibe",
    senderUsername: "chloe_vibe",
    senderDisplayName: "Chloe Chen",
    senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    postId: "post_1",
    content: "liked your comment on her post",
    timestamp: "1 hour ago",
    read: false,
  },
  {
    id: "notif_2",
    type: "follow",
    senderId: "guitar_hero",
    senderUsername: "guitar_hero",
    senderDisplayName: "Marcus Vance",
    senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    content: "started following you",
    timestamp: "Yesterday",
    read: true,
  },
  {
    id: "notif_3",
    type: "comment",
    senderId: "leo_beats",
    senderUsername: "leo_beats",
    senderDisplayName: "Leonardo King (Leo)",
    senderAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    postId: "post_2",
    content: "commented: 'Clean setups inspire clean vibes.'",
    timestamp: "2 days ago",
    read: true,
  }
];

// In-Memory user list for database updates
let userDatabaseMap = new Map<string, User>(INITIAL_USERS.map((u) => [u.id, u]));

let MOCK_PLAYLISTS: Playlist[] = [
  {
    id: "playlist_1",
    name: "Late Night Dev Coding Chords",
    description: "Soothing lo-fi tracks and chill ambient acoustics for midnight compiler sessions.",
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    createdByUserId: "leo_beats",
    collaborators: ["leo_beats", "currentUser"],
    createdAt: "May 28, 2026",
    songs: [
      {
        id: "ps_1",
        song: SONG_DATABASE[3], // Midnight Lo-fi Vibe
        addedByUserId: "leo_beats",
        addedByDisplayName: "Leonardo King (Leo)",
        addedByAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
        addedAt: "5 hours ago",
        comments: [
          {
            id: "ps_com_1",
            userId: "leo_beats",
            username: "leo_beats",
            displayName: "Leonardo King (Leo)",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
            content: "The bassline on this matches standard heartbeat patterns. Extremely centering.",
            timestamp: "5 hours ago"
          },
          {
            id: "ps_com_2",
            userId: "currentUser",
            username: "iamdbonero",
            displayName: "D. Bonero",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
            content: "Agreed! Absolutely lovely for working with React hook triggers.",
            timestamp: "4 hours ago"
          }
        ]
      },
      {
        id: "ps_2",
        song: SONG_DATABASE[1], // Fix You
        addedByUserId: "currentUser",
        addedByDisplayName: "D. Bonero",
        addedByAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        addedAt: "4 hours ago",
        comments: [
          {
            id: "ps_com_3",
            userId: "leo_beats",
            username: "leo_beats",
            displayName: "Leonardo King (Leo)",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
            content: "Classic keyboard build up. Great suggestion DB!",
            timestamp: "2 hours ago"
          }
        ]
      }
    ]
  },
  {
    id: "playlist_2",
    name: "Summer Roadtrip Anthems",
    description: "Sunroof open, iced drinks, volume to maximum! Collab with the Austin live music crew.",
    coverUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80",
    createdByUserId: "chloe_vibe",
    collaborators: ["chloe_vibe", "currentUser", "guitar_hero"],
    createdAt: "May 30, 2026",
    songs: [
      {
        id: "ps_3",
        song: SONG_DATABASE[5], // Cruel Summer
        addedByUserId: "chloe_vibe",
        addedByDisplayName: "Chloe Chen",
        addedByAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
        addedAt: "Yesterday",
        comments: [
          {
            id: "ps_com_4",
            userId: "guitar_hero",
            username: "guitar_hero",
            displayName: "Marcus Vance",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
            content: "Those bridge vocals are pristine pop writing, honestly.",
            timestamp: "Yesterday"
          }
        ]
      },
      {
        id: "ps_4",
        song: SONG_DATABASE[0], // Blinding Lights
        addedByUserId: "currentUser",
        addedByDisplayName: "D. Bonero",
        addedByAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        addedAt: "Yesterday",
        comments: []
      }
    ]
  }
];

// ----------------- API Endpoints -----------------

// PLAYLIST ENDPOINTS

// 1. Get all playlists for which currentUser is a participant
app.get("/api/playlists", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  if (!current) return res.status(401).json({ error: "Unauthorized" });

  const userPlaylists = MOCK_PLAYLISTS.filter((p) => p.collaborators.includes(current.id));
  res.json(userPlaylists);
});

// 2. Create a collaborative playlist
app.post("/api/playlists", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  if (!current) return res.status(401).json({ error: "Unauthorized" });

  const { name, description, coverUrl, collaborators } = req.body;
  
  const selectedCover = coverUrl || MOCK_PHOTOS[Math.floor(Math.random() * MOCK_PHOTOS.length)];
  const colIds = collaborators || [];
  if (!colIds.includes(current.id)) {
    colIds.push(current.id);
  }

  const newPlaylist: Playlist = {
    id: "playlist_" + Date.now(),
    name: name || "Untitled Collab Vibes",
    description: description || "Fresh soundwaves shared between peers.",
    coverUrl: selectedCover,
    createdByUserId: current.id,
    collaborators: colIds,
    songs: [],
    createdAt: "Just now"
  };

  MOCK_PLAYLISTS.unshift(newPlaylist);

  // Send notifications to invited friends
  colIds.forEach((friendId) => {
    if (friendId !== current.id) {
      const friend = userDatabaseMap.get(friendId);
      if (friend) {
        MOCK_NOTIFICATIONS.unshift({
          id: "notif_pl_" + Date.now(),
          type: "comment",
          senderId: current.id,
          senderUsername: current.username,
          senderDisplayName: current.displayName,
          senderAvatar: current.avatar,
          content: `invited you to collaborate on the playlist "${newPlaylist.name}"`,
          timestamp: "Just now",
          read: false
        });
      }
    }
  });

  res.json(newPlaylist);
});

// 3. Get single playlist
app.get("/api/playlists/:id", (req: Request, res: Response) => {
  const playlist = MOCK_PLAYLISTS.find(p => p.id === req.params.id);
  if (!playlist) return res.status(404).json({ error: "Playlist not found" });
  res.json(playlist);
});

// 4. Invite friends to collaborative playlist
app.post("/api/playlists/:id/invite", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  if (!current) return res.status(401).json({ error: "Unauthorized" });

  const playlist = MOCK_PLAYLISTS.find(p => p.id === req.params.id);
  if (!playlist) return res.status(404).json({ error: "Playlist not found" });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  if (!playlist.collaborators.includes(userId)) {
    playlist.collaborators.push(userId);

    // Send notification to friend
    const friend = userDatabaseMap.get(userId);
    if (friend) {
      MOCK_NOTIFICATIONS.unshift({
        id: "notif_pli_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        type: "comment",
        senderId: current.id,
        senderUsername: current.username,
        senderDisplayName: current.displayName,
        senderAvatar: current.avatar,
        content: `invited you to join the playlist "${playlist.name}"`,
        timestamp: "Just now",
        read: false
      });
    }
  }

  res.json(playlist);
});

// 5. Add song to playlist
app.post("/api/playlists/:id/songs", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  if (!current) return res.status(401).json({ error: "Unauthorized" });

  const playlist = MOCK_PLAYLISTS.find(p => p.id === req.params.id);
  if (!playlist) return res.status(404).json({ error: "Playlist not found" });

  const { song } = req.body;
  if (!song) return res.status(400).json({ error: "song object is required" });

  const newPlaylistSong: PlaylistSong = {
    id: "ps_" + Date.now(),
    song,
    addedByUserId: current.id,
    addedByDisplayName: current.displayName,
    addedByAvatar: current.avatar,
    addedAt: "Just now",
    comments: []
  };

  playlist.songs.push(newPlaylistSong);

  // Notify other collaborators of the added song
  playlist.collaborators.forEach((userId) => {
    if (userId !== current.id) {
      MOCK_NOTIFICATIONS.unshift({
        id: "notif_song_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        type: "comment",
        senderId: current.id,
        senderUsername: current.username,
        senderDisplayName: current.displayName,
        senderAvatar: current.avatar,
        content: `added "${song.title}" to the playlist "${playlist.name}"`,
        timestamp: "Just now",
        read: false
      });
    }
  });

  res.json(playlist);
});

// 6. Delete song from playlist
app.delete("/api/playlists/:id/songs/:playlistSongId", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  if (!current) return res.status(401).json({ error: "Unauthorized" });

  const playlist = MOCK_PLAYLISTS.find(p => p.id === req.params.id);
  if (!playlist) return res.status(404).json({ error: "Playlist not found" });

  const removedSong = playlist.songs.find(s => s.id === req.params.playlistSongId);
  playlist.songs = playlist.songs.filter(s => s.id !== req.params.playlistSongId);

  if (removedSong) {
    playlist.collaborators.forEach((userId) => {
      if (userId !== current.id) {
        MOCK_NOTIFICATIONS.unshift({
          id: "notif_rem_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
          type: "comment",
          senderId: current.id,
          senderUsername: current.username,
          senderDisplayName: current.displayName,
          senderAvatar: current.avatar,
          content: `removed "${removedSong.song.title}" from the playlist "${playlist.name}"`,
          timestamp: "Just now",
          read: false
        });
      }
    });
  }

  res.json(playlist);
});

// 7. Reorder songs in playlist
app.post("/api/playlists/:id/reorder", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  if (!current) return res.status(401).json({ error: "Unauthorized" });

  const playlist = MOCK_PLAYLISTS.find(p => p.id === req.params.id);
  if (!playlist) return res.status(404).json({ error: "Playlist not found" });

  const { orderedSongIds } = req.body;
  if (!Array.isArray(orderedSongIds)) {
    return res.status(400).json({ error: "orderedSongIds must be an array" });
  }

  const songMap = new Map<string, PlaylistSong>(playlist.songs.map(s => [s.id, s]));
  const reordered: PlaylistSong[] = [];
  
  orderedSongIds.forEach((songId) => {
    const song = songMap.get(songId);
    if (song) {
      reordered.push(song);
    }
  });

  playlist.songs.forEach((originalSong) => {
    if (!orderedSongIds.includes(originalSong.id)) {
      reordered.push(originalSong);
    }
  });

  playlist.songs = reordered;

  res.json(playlist);
});

// 8. Comment on song inside playlist
app.post("/api/playlists/:id/songs/:playlistSongId/comments", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  if (!current) return res.status(401).json({ error: "Unauthorized" });

  const playlist = MOCK_PLAYLISTS.find(p => p.id === req.params.id);
  if (!playlist) return res.status(404).json({ error: "Playlist not found" });

  const playlistSong = playlist.songs.find(s => s.id === req.params.playlistSongId);
  if (!playlistSong) return res.status(404).json({ error: "Song not found in playlist" });

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: "Comment text content is required" });

  const newComment: Comment = {
    id: "ps_com_" + Date.now(),
    userId: current.id,
    username: current.username,
    displayName: current.displayName,
    avatar: current.avatar,
    content: content,
    timestamp: "Just now"
  };

  playlistSong.comments.push(newComment);

  playlist.collaborators.forEach((userId) => {
    if (userId !== current.id) {
      MOCK_NOTIFICATIONS.unshift({
        id: "notif_plcom_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        type: "comment",
        senderId: current.id,
        senderUsername: current.username,
        senderDisplayName: current.displayName,
        senderAvatar: current.avatar,
        content: `commented on "${playlistSong.song.title}" in playlist "${playlist.name}": "${content.substring(0, 20)}..."`,
        timestamp: "Just now",
        read: false
      });
    }
  });

  res.json(playlist);
});

// 9. Delete a playlist
app.delete("/api/playlists/:id", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  if (!current) return res.status(401).json({ error: "Unauthorized" });

  const index = MOCK_PLAYLISTS.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Playlist not found" });

  if (MOCK_PLAYLISTS[index].createdByUserId !== current.id) {
    return res.status(403).json({ error: "Only the creator is allowed to delete this playlist" });
  }

  MOCK_PLAYLISTS.splice(index, 1);
  res.json({ success: true });
});

// USER ENDPOINTS
app.get("/api/users", (req: Request, res: Response) => {
  res.json(Array.from(userDatabaseMap.values()));
});

app.get("/api/users/:id", (req: Request, res: Response) => {
  const user = userDatabaseMap.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

app.put("/api/users/:id", (req: Request, res: Response) => {
  const user = userDatabaseMap.get(req.params.id);
  if (!user) {
    return res.status(444).json({ error: "User not found" });
  }
  const updated = { ...user, ...req.body };
  userDatabaseMap.set(req.params.id, updated);
  res.json(updated);
});

app.post("/api/users/:id/follow", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  const target = userDatabaseMap.get(req.params.id);
  if (!current || !target) {
    return res.status(404).json({ error: "Users not found" });
  }

  const isFollowing = current.followingIds.includes(target.id);
  if (isFollowing) {
    current.followingIds = current.followingIds.filter((id) => id !== target.id);
    target.followersCount = Math.max(0, target.followersCount - 1);
  } else {
    current.followingIds.push(target.id);
    target.followersCount += 1;

    // Create follow notification
    MOCK_NOTIFICATIONS.unshift({
      id: "notif_" + Date.now(),
      type: "follow",
      senderId: current.id,
      senderUsername: current.username,
      senderDisplayName: current.displayName,
      senderAvatar: current.avatar,
      content: "started following you",
      timestamp: "Just now",
      read: false,
    });
  }

  userDatabaseMap.set("currentUser", current);
  userDatabaseMap.set(target.id, target);

  res.json({ isFollowing: !isFollowing, currentUser: current, targetUser: target });
});

// BLOCK & MUTE Action
app.post("/api/users/:id/action", (req: Request, res: Response) => {
  const { action } = req.body; // "block" or "mute"
  const current = userDatabaseMap.get("currentUser");
  if (!current) {
    return res.status(404).json({ error: "Current user not found" });
  }

  const targetId = req.params.id;
  if (action === "block") {
    if (current.blockedIds.includes(targetId)) {
      current.blockedIds = current.blockedIds.filter((id) => id !== targetId);
    } else {
      current.blockedIds.push(targetId);
      // Unfollow if blocked
      current.followingIds = current.followingIds.filter((id) => id !== targetId);
    }
  } else if (action === "mute") {
    if (current.mutedIds.includes(targetId)) {
      current.mutedIds = current.mutedIds.filter((id) => id !== targetId);
    } else {
      current.mutedIds.push(targetId);
    }
  }

  userDatabaseMap.set("currentUser", current);
  res.json(current);
});

// GET POSTS
app.get("/api/posts", (req: Request, res: Response) => {
  // Filters out muted and blocked users
  const current = userDatabaseMap.get("currentUser");
  let filtered = MOCK_POSTS;
  if (current) {
    filtered = MOCK_POSTS.filter(
      (post) => !current.blockedIds.includes(post.userId) && !current.mutedIds.includes(post.userId)
    );
  }
  res.json(filtered);
});

// CREATE POST
app.post("/api/posts", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  if (!current) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { content, mood, attachedImages, song, lyrics, highlightedLyrics } = req.body;
  
  const newPost: Post = {
    id: "post_" + Date.now(),
    userId: current.id,
    username: current.username,
    displayName: current.displayName,
    avatar: current.avatar,
    content: content || "",
    mood: mood || "Happy",
    attachedImages: attachedImages || [],
    song,
    lyrics,
    highlightedLyrics,
    likes: [],
    comments: [],
    repostCount: 0,
    savedBy: [],
    timestamp: "Just now",
  };

  current.postsCount += 1;
  userDatabaseMap.set("currentUser", current);

  MOCK_POSTS.unshift(newPost);
  res.json(newPost);
});

// LIKE POST
app.post("/api/posts/:id/like", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  if (!current) return res.status(401).json({ error: "Unauthorized" });

  const post = MOCK_POSTS.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const hasLiked = post.likes.includes(current.id);
  if (hasLiked) {
    post.likes = post.likes.filter((uid) => uid !== current.id);
  } else {
    post.likes.push(current.id);

    // Create Notification
    if (post.userId !== current.id) {
      MOCK_NOTIFICATIONS.unshift({
        id: "notif_" + Date.now(),
        type: "like",
        senderId: current.id,
        senderUsername: current.username,
        senderDisplayName: current.displayName,
        senderAvatar: current.avatar,
        postId: post.id,
        content: `liked your MoodTunes post: "${post.content.substring(0, 30)}..."`,
        timestamp: "Just now",
        read: false,
      });
    }
  }

  res.json(post);
});

// SAVE POST
app.post("/api/posts/:id/save", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  if (!current) return res.status(401).json({ error: "Unauthorized" });

  const post = MOCK_POSTS.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const hasSaved = post.savedBy.includes(current.id);
  if (hasSaved) {
    post.savedBy = post.savedBy.filter((uid) => uid !== current.id);
  } else {
    post.savedBy.push(current.id);
  }

  res.json(post);
});

// REPOST Content
app.post("/api/posts/:id/repost", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  if (!current) return res.status(401).json({ error: "Unauthorized" });

  const post = MOCK_POSTS.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  post.repostCount += 1;

  // Add a repost visual to feed
  const repostText = req.body.repostComment || "";
  const newPost: Post = {
    id: "post_repost_" + Date.now(),
    userId: current.id,
    username: current.username,
    displayName: current.displayName,
    avatar: current.avatar,
    content: repostText ? `Repost with thoughts: "${repostText}"\n\n[Original by @${post.username}]:\n${post.content}` : `Reposted from @${post.username}: ${post.content}`,
    mood: post.mood,
    attachedImages: post.attachedImages,
    song: post.song,
    lyrics: post.lyrics,
    highlightedLyrics: post.highlightedLyrics,
    likes: [],
    comments: [],
    repostCount: 0,
    savedBy: [],
    timestamp: "Just now",
  };

  current.postsCount += 1;
  userDatabaseMap.set("currentUser", current);
  MOCK_POSTS.unshift(newPost);

  // Notify original poster
  if (post.userId !== current.id) {
    MOCK_NOTIFICATIONS.unshift({
      id: "notif_rep_" + Date.now(),
      type: "repost",
      senderId: current.id,
      senderUsername: current.username,
      senderDisplayName: current.displayName,
      senderAvatar: current.avatar,
      postId: post.id,
      content: `reposted your MoodTunes post`,
      timestamp: "Just now",
      read: false,
    });
  }

  res.json({ originalPost: post, newPost });
});

// COMMENT POST
app.post("/api/posts/:id/comment", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  if (!current) return res.status(401).json({ error: "Unauthorized" });

  const post = MOCK_POSTS.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const { content } = req.body;
  const newComment: Comment = {
    id: "com_" + Date.now(),
    userId: current.id,
    username: current.username,
    displayName: current.displayName,
    avatar: current.avatar,
    content: content || "",
    timestamp: "Just now",
  };

  post.comments.push(newComment);

  // Send comment notification
  if (post.userId !== current.id) {
    MOCK_NOTIFICATIONS.unshift({
      id: "notif_" + Date.now(),
      type: "comment",
      senderId: current.id,
      senderUsername: current.username,
      senderDisplayName: current.displayName,
      senderAvatar: current.avatar,
      postId: post.id,
      content: `commented: "${content.substring(0, 30)}..."`,
      timestamp: "Just now",
      read: false,
    });
  }

  res.json(post);
});

// DELETE POST (Admin / Owner control)
app.delete("/api/posts/:id", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  const postIndex = MOCK_POSTS.findIndex((p) => p.id === req.params.id);
  if (postIndex === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  const post = MOCK_POSTS[postIndex];
  // check ownership or if request states admin
  const isAdmin = req.query.admin === "true";
  const isOwner = current && post.userId === current.id;

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "Forbidden: You are not authorized to delete this post." });
  }

  MOCK_POSTS.splice(postIndex, 1);
  if (isOwner && current) {
    current.postsCount = Math.max(0, current.postsCount - 1);
    userDatabaseMap.set("currentUser", current);
  }

  res.json({ success: true, message: "Post deleted successfully" });
});

// DIRECT MESSAGING
app.get("/api/messages/:otherId", (req: Request, res: Response) => {
  const currentId = "currentUser";
  const otherId = req.params.otherId;

  const messages = MOCK_MESSAGES.filter(
    (m) =>
      (m.senderId === currentId && m.receiverId === otherId) ||
      (m.senderId === otherId && m.receiverId === currentId)
  );
  res.json(messages);
});

app.post("/api/messages", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  if (!current) return res.status(401).json({ error: "Unauthorized" });

  const { receiverId, content, song, lyricsLine, isVoiceNote, duration, imageUrl } = req.body;

  const newMessage: Message = {
    id: "msg_" + Date.now(),
    senderId: current.id,
    receiverId,
    content: content || "",
    song,
    lyricsLine,
    isVoiceNote,
    duration,
    imageUrl,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  MOCK_MESSAGES.push(newMessage);

  // Generate instant automatic reply from mock friend if desired, makes it interactive!
  setTimeout(() => {
    const friend = userDatabaseMap.get(receiverId);
    if (friend) {
      // Simulate real-time DM typing
      const replies = [
        "That's beautiful music! Added to my daily queue. 🎵",
        "Oh wow, I feel these lyrics deeply today.",
        "That matches my mood perfectly as well. Let me share what I'm listening to!",
        "Stellar tune, love the guitar riffs in this one!",
        "Thanks for sharing! We should make a shared MoodTunes playlist soon.",
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      
      MOCK_MESSAGES.push({
        id: "msg_reply_" + Date.now(),
        senderId: receiverId,
        receiverId: current.id,
        content: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });

      // Send unread notification to currentUser
      MOCK_NOTIFICATIONS.unshift({
        id: "notif_msg_" + Date.now(),
        type: "message",
        senderId: friend.id,
        senderUsername: friend.username,
        senderDisplayName: friend.displayName,
        senderAvatar: friend.avatar,
        content: `sent you a message: "${randomReply.substring(0, 30)}..."`,
        timestamp: "Just now",
        read: false,
      });
    }
  }, 2000);

  res.json(newMessage);
});

// STORIES
app.get("/api/stories", (req: Request, res: Response) => {
  res.json(MOCK_STORIES);
});

app.post("/api/stories", (req: Request, res: Response) => {
  const current = userDatabaseMap.get("currentUser");
  if (!current) return res.status(401).json({ error: "Unauthorized" });

  const { imageUrl, song, lyricsHighlight, mood } = req.body;
  const newStory: Story = {
    id: "story_" + Date.now(),
    userId: current.id,
    username: current.username,
    displayName: current.displayName,
    avatar: current.avatar,
    imageUrl: imageUrl || MOCK_PHOTOS[Math.floor(Math.random() * MOCK_PHOTOS.length)],
    song,
    lyricsHighlight,
    mood: mood || "Exited",
    timestamp: "Just now",
  };

  MOCK_STORIES.unshift(newStory);
  res.json(newStory);
});

// NOTIFICATIONS
app.get("/api/notifications", (req: Request, res: Response) => {
  res.json(MOCK_NOTIFICATIONS);
});

app.post("/api/notifications/read", (req: Request, res: Response) => {
  MOCK_NOTIFICATIONS.forEach((n) => (n.read = true));
  res.json({ success: true });
});

// SPOTIFY SEARCH & SMART MOCK INTEGRATION
app.get("/api/spotify/search", async (req: Request, res: Response) => {
  const query = (req.query.q as string || "").toLowerCase();
  
  // Filter standard database first
  let results = SONG_DATABASE.filter(
    (s) => s.title.toLowerCase().includes(query) || s.artist.toLowerCase().includes(query)
  );

  // If search query is extremely unique or contains moods, and Gemini is available, let's inject a Dynamic song result!
  if (results.length === 0 && query.length > 2 && getGemini()) {
    try {
      const g = getGemini();
      if (g) {
        const geminiRes = await g.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `The user wanted to search Spotify for: "${query}". Generate one realistic song name, artist, popular album, and hypothetical brief lyrics snippet. Respond ONLY as a parsing-friendly JSON object with keys: title, artist, album, and briefLyrics.`,
          config: {
            responseMimeType: "application/json"
          }
        });
        
        const textOutput = geminiRes.text;
        if (textOutput) {
          const parsed = JSON.parse(textOutput.trim());
          const generatedSong: Song = {
            spotifyId: "gen_" + Date.now(),
            title: parsed.title || "Custom Aesthetic Beat",
            artist: parsed.artist || "MoodTunes Artists",
            album: parsed.album || "Creative Mindsets",
            artworkUrl: MOCK_PHOTOS[Math.floor(Math.random() * MOCK_PHOTOS.length)],
            previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            externalUrl: "https://open.spotify.com",
            durationMs: 180000,
          };
          
          results.push(generatedSong);
        }
      }
    } catch (err) {
      console.warn("Spotify dynamic creative search failed, returning fallback:", err);
    }
  }

  // Fallback default search result if nothing else works
  if (results.length === 0) {
    results = [SONG_DATABASE[0], SONG_DATABASE[1], SONG_DATABASE[4]];
  }

  res.json(results);
});


// ----------------- SERVER SIDE GEMINI API ROUTES -----------------

// 1. AI MOOD & SONG MATCH SUGGESTER
app.post("/api/gemini/suggest", async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text prompt is required" });
  }

  const client = getGemini();
  if (!client) {
    // Elegant fallback if API key is not configured
    const moods = ["Happy", "Sad", "Excited", "Motivated", "Relaxed", "Angry", "Heartbroken", "Grateful", "Tired"];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    const fallbackSongs = SONG_DATABASE.slice(0, 3);
    const mockSuggestedCaption = `"${text.substring(0, 30)}..." is giving major ${randomMood} energy today.`;
    return res.json({
      mood: randomMood,
      suggestedSong: fallbackSongs[Math.floor(Math.random() * fallbackSongs.length)],
      caption: mockSuggestedCaption,
      lyricsExcerpt: "Step forward, take a breath, let the rhythms settle.",
      insight: "A beautiful, transient state of alignment."
    });
  }

  try {
    const prompt = `
      Analyze this user update of their day: "${text}"
      Assign one of the following exact moods: Happy, Sad, Excited, Motivated, Relaxed, Angry, Heartbroken, Grateful, Tired.
      Then, search your musical memory to suggest a really popular song that perfectly represents this emotional vibe.
      Also, write a poetic song lyric style excerpt (2 lines) that aligns with this vibe.
      Finally, write a 1-sentence supportive or validating aesthetic emotional insight.

      Respond ONLY in JSON format with these keys:
      - mood: (one of the specific exact moods)
      - songTitle: (The suggested song title)
      - songArtist: (The artist name)
      - lyricsExcerpt: (2 lines of lyrics)
      - insight: (The emotional validating insight sentence)
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text.trim());
    
    // Find if the suggested song matches one of our databases, otherwise build a nice customized Song structure!
    let matchedSong = SONG_DATABASE.find(
      (s) => s.title.toLowerCase().includes(parsed.songTitle.toLowerCase()) || 
             s.artist.toLowerCase().includes(parsed.songArtist.toLowerCase())
    );

    if (!matchedSong) {
      matchedSong = {
        spotifyId: "gemini_song_" + Date.now(),
        title: parsed.songTitle,
        artist: parsed.songArtist,
        album: "Aesthetic recommendation",
        artworkUrl: MOCK_PHOTOS[Math.floor(Math.random() * MOCK_PHOTOS.length)],
        previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        externalUrl: "https://open.spotify.com",
        durationMs: 180000,
      };
    }

    res.json({
      mood: parsed.mood || "Relaxed",
      suggestedSong: matchedSong,
      caption: parsed.insight,
      lyricsExcerpt: parsed.lyricsExcerpt || "Sailing through the highs, standing in the storm.",
      insight: parsed.insight
    });
  } catch (error: any) {
    res.status(500).json({ error: "Gemini execution failed", details: error.message });
  }
});

// 2. AI CAPION GENERATOR
app.post("/api/gemini/caption", async (req: Request, res: Response) => {
  const { mood, songTitle, artist } = req.body;
  const client = getGemini();

  if (!client) {
    const defaultCaptions = [
      "Finding peace in the chaos.",
      "One song says what I can't.",
      "Moving at the speed of my favorite soundtrack.",
      "Some moods don't need translations, just a volume dial."
    ];
    return res.json({ caption: defaultCaptions[Math.floor(Math.random() * defaultCaptions.length)] });
  }

  try {
    const prompt = `Write a single, smart, emotional post caption (maximum 12 words) for a social media update. 
    The poster feels "${mood}" right now and is listening to "${songTitle}" by "${artist}". 
    Make it deeply aesthetic, poetic, and resonant. Avoid hashtags or cliches.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ caption: response.text.trim().replace(/^"(.*)"$/, "$1") }); // Clean quotes
  } catch (error: any) {
    res.json({ caption: `Tuned to the frequency of ${songTitle || "this beauty"}. 🎧` });
  }
});

// 3. AI WEEKLY EMOTIONAL ANALYTICS SUMMARY
app.post("/api/gemini/analytics", async (req: Request, res: Response) => {
  const { historyLogs } = req.body; // Array of { mood: string, day: string }
  const client = getGemini();

  if (!client) {
    return res.json({
      insight: "Your emotional cycle is heavily anchored in serene, relaxed frames. The weekend transition highlights an expansion into motivated and happy loops as you connect with peer music styles. Keep cultivating these soothing daily auditory intervals!"
    });
  }

  try {
    const logsStr = JSON.stringify(historyLogs);
    const prompt = `
      Here is the user's weekly mood history log demonstrating their daily emotional state:
      ${logsStr}

      As a compassionate and brilliant musical therapist, provide a 2-3 sentence personalized, encouraging, and medically-insightful emotional analysis. Connect how their music habits and moods intertwine. Keep it deeply human, aesthetic, clean, and inspiring.
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ insight: response.text.trim() });
  } catch (error: any) {
    res.json({
      insight: "You fluctuate beautifully through varied audio landscapes. Connecting your emotional beats with curated playlists assists you in integrating stress and finding active joy!"
    });
  }
});

// PLATFORM METRICS (For administrator dashboards)
app.get("/api/admin/metrics", (req: Request, res: Response) => {
  const users = Array.from(userDatabaseMap.values());
  const premiumCount = users.filter((u) => u.isPremium).length;
  const moodCounts: Record<string, number> = {};
  
  MOCK_POSTS.forEach((p) => {
    moodCounts[p.mood] = (moodCounts[p.mood] || 0) + 1;
  });

  res.json({
    totalUsers: users.length,
    premiumUsers: premiumCount,
    totalPosts: MOCK_POSTS.length,
    totalMessages: MOCK_MESSAGES.length,
    moodDistribution: Object.entries(moodCounts).map(([name, count]) => ({ name, count })),
    reportedItems: [
      { id: "p1", type: "Post", reason: "Spam content", author: "guitar_hero", date: "June 2, 2026" },
    ],
  });
});

// ----------------- Vite Setup -----------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
