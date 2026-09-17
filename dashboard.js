import { getFirebaseServices, isFirebaseConfigured, ADMIN_EMAIL } from "./firebase-config.js";

const ALBUM_TRACKS = [
  { id: 1, title: "daylight" },
  { id: 2, title: "Betteroffas2" },
  { id: 3, title: "Ok U" },
  { id: 4, title: "TV Aliens" },
  { id: 5, title: "In the Distance" },
  { id: 6, title: "you know" },
  { id: 7, title: "IllWeight 4U@theGate" },
  { id: 8, title: "Choices" },
  { id: 9, title: "Who Raised You" },
  { id: 10, title: "You Gone Love it" },
  { id: 11, title: "Look at it" },
  { id: 12, title: "Bubble Gum Death Wish" },
  { id: 13, title: "Untitled Outro" }
];

// DOM elements
const authPrompt = document.getElementById("authPrompt");
const authMessage = document.getElementById("authMessage");
const dashView = document.getElementById("dashView");
const signInBtn = document.getElementById("signInBtn");
const promptSignInBtn = document.getElementById("promptSignInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const userInfo = document.getElementById("userInfo");
const userEmail = document.getElementById("userEmail");
const setupBanner = document.getElementById("setupBanner");
const liveBadge = document.getElementById("liveBadge");
const refreshBtn = document.getElementById("refreshBtn");
const timeFilter = document.getElementById("timeFilter");

// Metrics
const totalPlaysEl = document.getElementById("totalPlays");
const uniqueListenersEl = document.getElementById("uniqueListeners");
const totalCompletionsEl = document.getElementById("totalCompletions");
const completionRateEl = document.getElementById("completionRate");
const totalDownloadsEl = document.getElementById("totalDownloads");
const tracksTableBody = document.getElementById("tracksTableBody");
const activityFeed = document.getElementById("activityFeed");

let activeFilter = "all";
let rawEvents = [];
let unsubscribeSnapshot = null;
let currentAuth = null;
let currentDb = null;

// Format relative time (e.g. "Just now", "5m ago")
function formatRelativeTime(date) {
  if (!date) return "--";
  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / 1000);

  if (diffSec < 45) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

// Check configuration on startup
if (!isFirebaseConfigured()) {
  setupBanner.style.display = "flex";
}

// Initialize Auth & Data
async function initDashboard() {
  const { auth, db } = await getFirebaseServices();
  if (!auth || !db) return;

  currentAuth = auth;
  currentDb = db;

  const { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } = await import(
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
  );

  const provider = new GoogleAuthProvider();

  async function handleSignIn() {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        console.error("Sign-in failed:", err);
        alert("Sign-in error: " + err.message);
      }
    }
  }

  signInBtn.addEventListener("click", handleSignIn);
  promptSignInBtn.addEventListener("click", handleSignIn);
  signOutBtn.addEventListener("click", () => signOut(auth));

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const email = (user.email || "").toLowerCase();
      if (email === ADMIN_EMAIL.toLowerCase()) {
        // Authenticated as Admin
        authPrompt.style.display = "none";
        dashView.style.display = "block";
        signInBtn.style.display = "none";
        userInfo.style.display = "flex";
        userEmail.textContent = user.email;
        liveBadge.style.display = "flex";

        startRealtimeListener(db);
      } else {
        // Logged in with different email
        authPrompt.style.display = "block";
        dashView.style.display = "none";
        authMessage.innerHTML = `<span style="color: var(--danger)">Access Denied:</span> <code>${user.email}</code> is not authorized to view this dashboard. Please sign in with <code>${ADMIN_EMAIL}</code>.`;
        userInfo.style.display = "flex";
        userEmail.textContent = user.email;
        signInBtn.style.display = "none";
        liveBadge.style.display = "none";
      }
    } else {
      // Signed out
      authPrompt.style.display = "block";
      dashView.style.display = "none";
      authMessage.innerHTML = `Sign in with your authorized Google Account (<code>${ADMIN_EMAIL}</code>) to access the album play counter and listening telemetry.`;
      userInfo.style.display = "none";
      signInBtn.style.display = "inline-flex";
      liveBadge.style.display = "none";

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
    }
  });
}

// Start Firestore live listener
async function startRealtimeListener(db) {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
  }

  const { collection, query, orderBy, limit, onSnapshot } = await import(
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
  );

  const playsRef = collection(db, "plays");
  const q = query(playsRef, orderBy("timestamp", "desc"), limit(2000));

  unsubscribeSnapshot = onSnapshot(
    q,
    (snapshot) => {
      rawEvents = snapshot.docs.map((doc) => {
        const data = doc.data();
        let date = null;
        if (data.timestamp && typeof data.timestamp.toDate === "function") {
          date = data.timestamp.toDate();
        } else if (data.timestamp) {
          date = new Date(data.timestamp);
        }
        return {
          id: doc.id,
          ...data,
          date
        };
      });

      renderDashboard();
    },
    (error) => {
      console.error("Firestore listener error:", error);
      if (error.code === "permission-denied") {
        authMessage.innerHTML = `<span style="color: var(--danger)">Permission Denied:</span> Security rules rejected access. Verify firestore.rules has been deployed.`;
        dashView.style.display = "none";
        authPrompt.style.display = "block";
      }
    }
  );
}

// Filter events by timeframe
function filterEvents() {
  const now = Date.now();
  return rawEvents.filter((item) => {
    if (!item.date) return true;
    const itemTime = item.date.getTime();

    if (activeFilter === "24h") {
      return now - itemTime <= 24 * 60 * 60 * 1000;
    }
    if (activeFilter === "7d") {
      return now - itemTime <= 7 * 24 * 60 * 60 * 1000;
    }
    if (activeFilter === "30d") {
      return now - itemTime <= 30 * 24 * 60 * 60 * 1000;
    }
    return true; // "all"
  });
}

// Render metrics, leaderboard, and activity feed
function renderDashboard() {
  const events = filterEvents();

  let totalPlays = 0;
  let totalCompletions = 0;
  let totalDownloads = 0;
  const uniqueSessions = new Set();

  // Track aggregates
  const trackStats = ALBUM_TRACKS.map((t) => ({
    id: t.id,
    title: t.title,
    plays: 0,
    completions: 0,
    downloads: 0
  }));

  events.forEach((evt) => {
    const trackObj = trackStats.find((t) => t.id === evt.trackId);

    if (evt.eventType === "play") {
      totalPlays++;
      if (evt.sessionId) uniqueSessions.add(evt.sessionId);
      if (trackObj) trackObj.plays++;
    } else if (evt.eventType === "complete") {
      totalCompletions++;
      if (trackObj) trackObj.completions++;
    } else if (evt.eventType === "download") {
      totalDownloads++;
      if (trackObj) trackObj.downloads++;
    }
  });

  // Metric Cards
  totalPlaysEl.textContent = totalPlays.toLocaleString();
  uniqueListenersEl.textContent = uniqueSessions.size.toLocaleString();
  totalCompletionsEl.textContent = totalCompletions.toLocaleString();
  totalDownloadsEl.textContent = totalDownloads.toLocaleString();

  const compRate = totalPlays > 0 ? Math.round((totalCompletions / totalPlays) * 100) : 0;
  completionRateEl.textContent = `${compRate}% track retention rate`;

  // Sort tracks by plays descending
  const sortedTracks = [...trackStats].sort((a, b) => b.plays - a.plays);
  const maxPlays = Math.max(...sortedTracks.map((t) => t.plays), 1);

  // Render Table
  tracksTableBody.innerHTML = sortedTracks
    .map((track, idx) => {
      const share = Math.round((track.plays / maxPlays) * 100);
      const trackNumber = String(track.id).padStart(2, "0");
      return `
        <tr>
          <td class="col-rank">${idx + 1}</td>
          <td class="col-title" title="${track.title}">
            <span style="color: var(--gold-dim); font-size: 0.75rem; margin-right: 6px;">${trackNumber}</span>
            ${track.title}
          </td>
          <td class="col-bar">
            <div class="bar-container">
              <div class="bar-fill" style="width: ${share}%;"></div>
            </div>
          </td>
          <td class="col-plays">${track.plays}</td>
          <td class="col-complete">${track.completions}</td>
          <td class="col-dl">${track.downloads}</td>
        </tr>
      `;
    })
    .join("");

  // Render Activity Feed (latest 25 events)
  const recentEvents = events.slice(0, 25);
  if (recentEvents.length === 0) {
    activityFeed.innerHTML = '<div class="empty-feed">No activity in this timeframe yet.</div>';
  } else {
    activityFeed.innerHTML = recentEvents
      .map((evt) => {
        let badgeClass = "badge-play";
        let badgeLabel = "PLAY";
        if (evt.eventType === "complete") {
          badgeClass = "badge-complete";
          badgeLabel = "COMPLETE";
        } else if (evt.eventType === "download") {
          badgeClass = "badge-download";
          badgeLabel = "DOWNLOAD";
        }

        const device = evt.device || "Web";
        const source = evt.referrer && evt.referrer !== "direct" ? ` · via ${evt.referrer}` : "";
        const timeStr = formatRelativeTime(evt.date);

        return `
          <div class="activity-item">
            <span class="activity-badge ${badgeClass}">${badgeLabel}</span>
            <div class="activity-details">
              <div class="activity-title">${evt.trackTitle || `Track ${evt.trackId}`}</div>
              <div class="activity-meta">${device}${source}</div>
            </div>
            <div class="activity-time">${timeStr}</div>
          </div>
        `;
      })
      .join("");
  }
}

// Time filter buttons
timeFilter.addEventListener("click", (e) => {
  const pill = e.target.closest(".pill");
  if (!pill) return;

  timeFilter.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
  pill.classList.add("active");
  activeFilter = pill.dataset.range;
  renderDashboard();
});

refreshBtn.addEventListener("click", () => {
  renderDashboard();
});

// Periodic relative time update
setInterval(() => {
  if (dashView.style.display !== "none" && rawEvents.length > 0) {
    renderDashboard();
  }
}, 30000);

initDashboard();
