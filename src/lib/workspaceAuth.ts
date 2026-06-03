import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize the shared Firebase instance
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add required OAuth scopes as provisioned
provider.addScope("https://www.googleapis.com/auth/drive");
provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
provider.addScope("https://www.googleapis.com/auth/gmail.modify");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Initiate actual Google popup authentication
export const googleSignIn = async (): Promise<{ user: FirebaseUser; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to extract access token from Google sign-in response.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Workspace OAuth Authentication failed:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Retrieve currently cached session token
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Disconnect from Google workspace & clear cache
export const disconnectWorkspace = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Google Drive: Fetch standard files list
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
}

export const fetchDriveFiles = async (token: string): Promise<DriveFile[]> => {
  const url = "https://www.googleapis.com/drive/v3/files?pageSize=15&fields=files(id,name,mimeType,webViewLink,createdTime)&orderBy=modifiedTime%20desc";
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorDetails = await res.text();
    throw new Error(`Failed listing Drive files: ${errorDetails}`);
  }
  const data = await res.json();
  return data.files || [];
};

// Google Drive: Backup customized playlist
export const backupPlaylistToDrive = async (
  token: string,
  playlistName: string,
  tracks: { title: string; artist: string; mood?: string }[]
): Promise<string> => {
  const fileName = `onodu_Backup_${playlistName.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
  const fileContent = JSON.stringify({
    onoduPlaylist: playlistName,
    backedUpTime: new Date().toISOString(),
    songsCount: tracks.length,
    tracks: tracks
  }, null, 2);

  // 1. Create file metadata in Drive
  const createMetaUrl = "https://www.googleapis.com/drive/v3/files";
  const metaRes = await fetch(createMetaUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: fileName,
      mimeType: "application/json"
    })
  });

  if (!metaRes.ok) {
    throw new Error("Failed establishing file metadata in Google Drive.");
  }
  const metaData = await metaRes.json();
  const fileId = metaData.id;

  // 2. Upload actual JSON content
  const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
  const uploadRes = await fetch(uploadUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: fileContent
  });

  if (!uploadRes.ok) {
    throw new Error("Failed uploading document streams to Google Drive.");
  }

  return fileId;
};

// Gmail: Fetch unread inbox emails
export interface GmailMessage {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

export const fetchInboxEmails = async (token: string): Promise<GmailMessage[]> => {
  // Get latest 5 messages
  const listUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=is:inbox";
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!listRes.ok) {
    throw new Error("Failed fetching initial inbox messages.");
  }
  const listData = await listRes.json();
  if (!listData.messages || listData.messages.length === 0) {
    return [];
  }

  const fetchedDetails: GmailMessage[] = [];
  for (const msg of listData.messages) {
    try {
      const detailsUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
      const detailRes = await fetch(detailsUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!detailRes.ok) continue;
      const detailData = await detailRes.json();
      
      const headers = detailData.payload?.headers || [];
      const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "No Subject";
      const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown Sender";
      const date = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";

      fetchedDetails.push({
        id: msg.id,
        snippet: detailData.snippet || "",
        subject,
        from,
        date
      });
    } catch {
      // Gracefully continue skip single error
    }
  }

  return fetchedDetails;
};

// Gmail: Send custom musical email from authenticated account
export const sendGmailUpdate = async (
  token: string, 
  to: string, 
  subject: string, 
  personalMessage: string,
  attachedTrack?: { title: string; artist: string; mood?: string }
): Promise<void> => {
  const cleanTo = to.trim();
  const cleanSubject = subject.trim();

  let trackHtml = "";
  if (attachedTrack) {
    trackHtml = `
      <div style="background-color: #1e1b4b; border: 1px solid #4f46e5; border-radius: 12px; padding: 16px; margin: 20px 0; max-width: 400px; color: #ffffff; font-family: sans-serif;">
        <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #a5b4fc; font-weight: bold;">ọnọdụ Vibe Tune</span>
        <h4 style="margin: 6px 0 2px 0; font-size: 16px; color: #ffffff;">🎵 ${attachedTrack.title}</h4>
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">by ${attachedTrack.artist}</p>
        ${attachedTrack.mood ? `<span style="display: inline-block; background-color: rgba(79, 70, 229, 0.4); font-size: 10px; padding: 2px 8px; border-radius: 9999px; color: #e0e7ff; margin-top: 8px;">Vibe: ${attachedTrack.mood}</span>` : ""}
      </div>
    `;
  }

  const emailHtml = `
    <html>
      <body style="font-family: sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #6366f1; margin: 0; font-size: 24px; letter-spacing: -0.025em;">✨ ọnọdụ</h2>
            <p style="color: #64748b; font-size: 11px; margin: 4px 0 0 0;">Emotion-driven social playlist webspace</p>
          </div>
          
          <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">Hello,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">A member of the <strong>ọnọdụ</strong> orbit wanted to share a musical moment with you:</p>
          
          <div style="background-color: #020617; border-left: 4px solid #6366f1; border-radius: 4px; padding: 12px 16px; font-style: italic; color: #e2e8f0; margin: 16px 0;">
            "${personalMessage.replace(/\n/g, "<br/>")}"
          </div>
          
          ${trackHtml}
          
          <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
          
          <p style="font-size: 11px; text-align: center; color: #64748b; margin: 0;">
            Sent with love from the ọnọdụ celestial sphere. 🔭🛰️<br/>
            Step into the music stream to find your orbit.
          </p>
        </div>
      </body>
    </html>
  `;

  const emailLines = [
    `To: ${cleanTo}`,
    `Subject: ${cleanSubject}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    emailHtml
  ];

  const rawMessage = btoa(unescape(encodeURIComponent(emailLines.join("\n"))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const sendResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw: rawMessage })
  });

  if (!sendResponse.ok) {
    const errText = await sendResponse.text();
    throw new Error(`Failed to transmit Gmail payload: ${errText}`);
  }
};
