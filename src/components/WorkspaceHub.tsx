import React, { useState, useEffect } from "react";
import { 
  Cloud, Mail, FileJson, CheckCircle2, Send, RefreshCw, LogOut, ArrowRight,
  ExternalLink, Eye, Info, Database, Lock, Inbox, Disc, ChevronRight, FileText
} from "lucide-react";
import { Playlist, Song } from "../types";
import { 
  initAuth, 
  googleSignIn, 
  disconnectWorkspace, 
  fetchDriveFiles, 
  backupPlaylistToDrive, 
  fetchInboxEmails,
  sendGmailUpdate,
  DriveFile,
  GmailMessage 
} from "../lib/workspaceAuth";
import { User as FirebaseUser } from "firebase/auth";

interface WorkspaceHubProps {
  isDarkMode: boolean;
  playlists: Playlist[];
}

export default function WorkspaceHub({ isDarkMode, playlists }: WorkspaceHubProps) {
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Drive States
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState<boolean>(false);
  const [driveError, setDriveError] = useState<string>("");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [backupSuccessId, setBackupSuccessId] = useState<string>("");

  // Gmail States
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [loadingEmails, setLoadingEmails] = useState<boolean>(false);
  const [gmailError, setGmailError] = useState<string>("");
  const [emailTo, setEmailTo] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("🎵 Beautiful melody shared from ọnọdụ!");
  const [emailMessage, setEmailMessage] = useState<string>("Checking out this amazing playlist on ọnọdụ. These tunes match my stargazing afternoon vibe perfectly!");
  const [selectedSongToEmail, setSelectedSongToEmail] = useState<string>("none");
  const [emailSending, setEmailSending] = useState<boolean>(false);
  const [emailSuccess, setEmailSuccess] = useState<boolean>(false);

  // Initialize auth state
  useEffect(() => {
    setAuthChecking(true);
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        setAuthChecking(false);
        // Pre-fetch workspace info since we are successfully connected
        loadDriveFiles(token);
        loadInbox(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
        setAuthChecking(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleConnect = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        // Load initial Workspace feeds
        loadDriveFiles(result.accessToken);
        loadInbox(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      alert("Sign-In popup cancelled or failed. Please check that popups are enabled.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm("Disconnect Google Workspace services from ọnọdụ?")) {
      await disconnectWorkspace();
      setGoogleUser(null);
      setAccessToken(null);
      setDriveFiles([]);
      setEmails([]);
    }
  };

  const loadDriveFiles = async (token: string) => {
    setLoadingDrive(true);
    setDriveError("");
    try {
      const files = await fetchDriveFiles(token);
      setDriveFiles(files);
    } catch (err: any) {
      setDriveError("Unable to retrieve Google Drive file list.");
      console.error(err);
    } finally {
      setLoadingDrive(false);
    }
  };

  const loadInbox = async (token: string) => {
    setLoadingEmails(true);
    setGmailError("");
    try {
      const liveEmails = await fetchInboxEmails(token);
      setEmails(liveEmails);
    } catch (err: any) {
      setGmailError("Unable to load Gmail inbox summary.");
      console.error(err);
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleBackupPlaylist = async () => {
    if (!accessToken) return;
    const targetPl = playlists.find(p => p.id === selectedPlaylistId);
    if (!targetPl) {
      alert("Please select a playlist to backup.");
      return;
    }

    const confirmBackup = window.confirm(
      `Backup "${targetPl.name}" (${targetPl.songs.length} song(s)) directly to your Google Drive? This will create a secure backup JSON.`
    );
    if (!confirmBackup) return;

    setLoadingDrive(true);
    try {
      const tracks = targetPl.songs.map(ps => ({
        title: ps.song.title,
        artist: ps.song.artist,
        addedBy: ps.addedByDisplayName
      }));
      const fileId = await backupPlaylistToDrive(accessToken, targetPl.name, tracks);
      setBackupSuccessId(fileId);
      // Reload Drive explorer
      await loadDriveFiles(accessToken);
      setTimeout(() => setBackupSuccessId(""), 8000);
    } catch (err: any) {
      alert("Google Drive upload failed.");
      console.error(err);
    } finally {
      setLoadingDrive(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!emailTo.trim() || !emailTo.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    const confirmSend = window.confirm(
      `ọnọdụ is about to request Gmail to draft and transmitt this recommendation to ${emailTo}. Proceeds?`
    );
    if (!confirmSend) return;

    setEmailSending(true);
    setEmailSuccess(false);

    try {
      // Find attached track details if any
      let attached: Song | undefined;
      playlists.forEach(pl => {
        const found = pl.songs.find(s => s.song.spotifyId === selectedSongToEmail);
        if (found) attached = found.song;
      });

      await sendGmailUpdate(
        accessToken,
        emailTo,
        emailSubject,
        emailMessage,
        attached ? { title: attached.title, artist: attached.artist } : undefined
      );

      setEmailSuccess(true);
      setEmailTo("");
      // Reload emails in feed
      await loadInbox(accessToken);
      setTimeout(() => setEmailSuccess(false), 6000);
    } catch (err: any) {
      alert("Gmail delivery pipeline failed.");
      console.error(err);
    } finally {
      setEmailSending(false);
    }
  };

  // Compile full database of unique tracks from all playlists to offer for attachments
  const allSongs: Song[] = [];
  const addedIds = new Set<string>();
  playlists.forEach(p => {
    p.songs.forEach(ps => {
      if (!addedIds.has(ps.song.spotifyId)) {
        addedIds.add(ps.song.spotifyId);
        allSongs.push(ps.song);
      }
    });
  });

  return (
    <div className={`space-y-6 max-w-4xl mx-auto p-1 font-sans ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
      
      {/* Title Header */}
      <div className={`rounded-3xl p-6 ${isDarkMode ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-gray-100"} shadow-sm relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
          <Cloud className="w-48 h-48 text-indigo-505" />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 px-2.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Authorized Cloud services
              </span>
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight text-white mb-1 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-indigo-400" /> Google Workspace Integration
            </h1>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Connect Google Drive and Gmail to backup custom curated celestial playlists, search drive-hosted audio snippets, and email melody recommendations safely.
            </p>
          </div>

          {!authChecking && !googleUser && (
            <button
              onClick={handleConnect}
              disabled={isLoggingIn}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-650 to-indigo-550 hover:from-indigo-600 hover:to-indigo-500 border border-indigo-500/30 text-white font-semibold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/15 cursor-pointer hover:scale-[1.02] transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoggingIn ? "animate-spin" : ""}`} />
              {isLoggingIn ? "Authorizing..." : "Link Google Workspace"}
            </button>
          )}

          {googleUser && (
            <div className="flex items-center gap-3 bg-slate-950/40 p-2.5 rounded-2xl border border-slate-800">
              <img 
                src={googleUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                alt="" 
                className="w-8 h-8 rounded-full border border-indigo-500/35"
              />
              <div className="text-left min-w-0 max-w-36">
                <p className="text-[11px] font-bold text-slate-200 truncate">{googleUser.displayName}</p>
                <p className="text-[9px] text-slate-400 truncate font-mono">{googleUser.email}</p>
              </div>
              <button
                onClick={handleDisconnect}
                title="Disconnect from Google Core"
                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {authChecking && (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Synchronizing OAuth connections with ọnọdụ...</p>
        </div>
      )}

      {/* Disconnected State Mock Dashboard */}
      {!authChecking && !googleUser && (
        <div className={`rounded-3xl border border-dashed ${isDarkMode ? "border-slate-800 bg-slate-900/10" : "border-gray-200 bg-gray-50/40"} p-12 text-center max-w-2xl mx-auto space-y-6`}>
          <div className="w-16 h-16 bg-slate-950/40 border border-slate-805 rounded-2xl flex items-center justify-center mx-auto shadow-inner text-indigo-400">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-200">Google Workspace authorization is required</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              We never store your passwords or session tokens. Integrating links your own secure Google API access securely in-memory to share music with your contacts.
            </p>
          </div>

          <button 
            onClick={handleConnect}
            className="mx-auto flex items-center gap-3 px-5 py-3 rounded-2xl bg-white text-slate-900 border border-slate-300 hover:border-indigo-500 font-semibold text-xs shadow-md shadow-black/10 transition-all hover:scale-[1.01] cursor-pointer"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span>Connect securely with Google</span>
          </button>
        </div>
      )}

      {/* Connected Workspace Dashboard */}
      {!authChecking && googleUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT PANEL: GMAIL */}
          <div className="space-y-6">
            
            {/* EMAIL SHARE BOX */}
            <div className={`rounded-3xl p-5 ${isDarkMode ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-gray-100"} shadow-sm space-y-4`}>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400" /> Send Melody recommendation
                </h3>
                <span className="text-[9px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Gmail Live Pipe
                </span>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-3 text-left">
                <div className="space-y-1">
                  <label htmlFor="email-recipient" className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Recipient Email</label>
                  <input
                    id="email-recipient"
                    type="email"
                    required
                    placeholder="friend@domain.com"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="email-subj" className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Subject Line</label>
                  <input
                    id="email-subj"
                    type="text"
                    required
                    placeholder="Enter email subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="email-attach" className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Attach Song Card</label>
                    <select
                      id="email-attach"
                      value={selectedSongToEmail}
                      onChange={(e) => setSelectedSongToEmail(e.target.value)}
                      className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 select-none text-white focus:ring-indigo-500/20"
                    >
                      <option value="none">-- No Attachment --</option>
                      {allSongs.map(s => (
                        <option key={s.spotifyId} value={s.spotifyId}>
                          {s.title} ({s.artist})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="email-body" className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Personal message</label>
                  <textarea
                    id="email-body"
                    required
                    rows={3}
                    placeholder="Type customized recommendation vibe..."
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="w-full text-xs font-medium p-3 rounded-xl border border-slate-800 bg-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-700"
                  />
                </div>

                {emailSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Message delivered successfully via your personal Gmail!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={emailSending}
                  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
                >
                  {emailSending ? (
                     <>
                       <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                       Routing Transmission...
                     </>
                  ) : (
                     <>
                       <Send className="w-3.5 h-3.5" />
                       Send via Gmail
                     </>
                  )}
                </button>
              </form>
            </div>

            {/* GMAIL RECENT INBOX FEED */}
            <div className={`rounded-3xl p-5 ${isDarkMode ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-gray-100"} shadow-sm space-y-4`}>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-indigo-400" /> Recent Inbox Digests
                </h3>
                <button
                  onClick={() => loadInbox(accessToken!)}
                  disabled={loadingEmails}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Reload Unread Mail Feed"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingEmails ? "animate-spin" : ""}`} />
                </button>
              </div>

              {gmailError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  {gmailError}
                </div>
              )}

              {loadingEmails && emails.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">
                  <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mx-auto mb-2" />
                  Synchronizing mailbox alerts...
                </div>
              ) : emails.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-medium">
                  No active inbox notifications found in this sphere.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {emails.map((m) => (
                    <div key={m.id} className="p-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-800/50 rounded-2xl transition-all space-y-1.5 text-left group">
                      <div className="flex justify-between items-start gap-3 min-w-0">
                        <div className="min-w-0">
                          <p className="text-[10.5px] font-bold text-slate-200 group-hover:text-indigo-400 transition-colors truncate">{m.from}</p>
                          <h4 className="text-[11px] font-semibold text-white mt-0.5 truncate">{m.subject}</h4>
                        </div>
                        <span className="text-[8.5px] font-mono text-slate-500 shrink-0 mt-0.5">{m.date.split(",")[1]?.trim() || m.date.slice(0, 16)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{m.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT PANEL: GOOGLE DRIVE */}
          <div className="space-y-6">

            {/* DRIVE PLAYLIST BACKUP */}
            <div className={`rounded-3xl p-5 ${isDarkMode ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-gray-100"} shadow-sm space-y-4`}>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" /> Vault Playlist backup
                </h3>
                <span className="text-[9px] font-semibold text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                  Drive Backup
                </span>
              </div>

              <div className="space-y-3.5 text-left">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Select any of your cooperative playlists below to back them up securely as a persistent, standardized metadata config file on your Google Drive.
                  </p>
                </div>

                <div className="space-y-1">
                  <label htmlFor="playlist-select" className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Target Playlist</label>
                  <select
                    id="playlist-select"
                    value={selectedPlaylistId}
                    onChange={(e) => setSelectedPlaylistId(e.target.value)}
                    className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 select-none text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- Select Playlist --</option>
                    {playlists.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.songs.length} song(s))
                      </option>
                    ))}
                  </select>
                </div>

                {backupSuccessId && (
                  <div className="p-3 bg-indigo-550/10 border border-indigo-500/25 rounded-xl text-indigo-300 text-[11px] font-medium space-y-1 relative">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      Playlist Backup Uploaded!
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                      File ID: {backupSuccessId.slice(0, 16)}...
                    </p>
                  </div>
                )}

                <button
                  onClick={handleBackupPlaylist}
                  disabled={loadingDrive || !selectedPlaylistId}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-650 to-indigo-550 hover:from-indigo-600 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  Backup Playlist to Drive
                </button>
              </div>
            </div>

            {/* DRIVE EXPLORER LIST */}
            <div className={`rounded-3xl p-5 ${isDarkMode ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-gray-100"} shadow-sm space-y-4`}>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-indigo-400" /> My Drive Metadata Archives
                </h3>
                <button
                  onClick={() => loadDriveFiles(accessToken!)}
                  disabled={loadingDrive}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Reload Drive File List"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingDrive ? "animate-spin" : ""}`} />
                </button>
              </div>

              {driveError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  {driveError}
                </div>
              )}

              {loadingDrive && driveFiles.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">
                  <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mx-auto mb-2" />
                  Mapping active file structures...
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-medium">
                  No active backup files located in this capsule.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto scrollbar-none pr-1">
                  {driveFiles.map((file) => (
                    <div key={file.id} className="p-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-800/50 rounded-2xl transition-all flex items-center justify-between gap-3 group text-left">
                      <div className="min-w-0 flex items-start gap-2.5">
                        <div className="p-2 bg-slate-900 rounded-xl text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-950/20 transition-all shrink-0 mt-0.5">
                          {file.mimeType.includes("json") ? (
                            <FileJson className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[11px] font-semibold text-white truncate max-w-44 group-hover:text-indigo-300 transition-colors">{file.name}</h4>
                          <span className="text-[8.5px] font-mono text-slate-500 block mt-0.5">
                            Created: {file.createdTime ? file.createdTime.slice(0, 10) : "N/A"}
                          </span>
                        </div>
                      </div>

                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 px-2.5 rounded-lg bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/35 text-[10px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                        >
                          <span>Explore</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Info Notice card footer */}
      <div className="rounded-2xl bg-indigo-500/5 border border-indigo-500/10 p-4 flex gap-3 text-left">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-[10.5px] font-bold text-slate-300 uppercase tracking-wider">Celestial Security Protocol</h4>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            ọnọdụ routes all connection handshakes through secure Google OAuth frameworks. No passwords are ever accessed, recorded, or written to backend filesystems. Your private space data stays private.
          </p>
        </div>
      </div>

    </div>
  );
}
