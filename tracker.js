import { getFirebaseServices } from "./firebase-config.js";

// Session identification (persists during the active tab/browser session)
function getSessionId() {
  try {
    let id = sessionStorage.getItem("bgdw_session_id");
    if (!id) {
      id = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
      sessionStorage.setItem("bgdw_session_id", id);
    }
    return id;
  } catch {
    return "sess_anonymous";
  }
}

// Device detection
function getDeviceType() {
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "iOS";
  }
  if (/Android/.test(ua)) {
    return "Android";
  }
  if (/Macintosh|Mac OS X/.test(ua)) {
    return "Mac";
  }
  if (/Windows/.test(ua)) {
    return "Windows";
  }
  return "Other";
}

// Clean referrer hostname
function getReferrer() {
  try {
    if (!document.referrer) return "direct";
    const refUrl = new URL(document.referrer);
    return refUrl.hostname.replace(/^www\./, "").slice(0, 100);
  } catch {
    return "direct";
  }
}

class AudioTracker {
  constructor() {
    this.sessionId = getSessionId();
    this.device = getDeviceType();
    this.referrer = getReferrer();

    this.currentTrackId = null;
    this.currentTrackTitle = "";
    this.cumulativeTime = 0;
    this.lastTime = 0;
    this.hasLoggedPlay = false;
    this.hasLoggedComplete = false;
    this.playThresholdSeconds = 10;
  }

  setTrack(trackId, trackTitle) {
    this.currentTrackId = Number(trackId);
    this.currentTrackTitle = String(trackTitle);
    this.cumulativeTime = 0;
    this.lastTime = 0;
    this.hasLoggedPlay = false;
    this.hasLoggedComplete = false;
  }

  onTimeUpdate(currentTime, duration) {
    if (!this.currentTrackId) return;

    // Track cumulative listening time to prevent false positives from scrubbing
    if (this.lastTime > 0) {
      const delta = currentTime - this.lastTime;
      if (delta > 0 && delta < 2) {
        this.cumulativeTime += delta;
      }
    }
    this.lastTime = currentTime;

    // Trigger 'play' event when threshold reached
    if (!this.hasLoggedPlay && this.cumulativeTime >= this.playThresholdSeconds) {
      this.hasLoggedPlay = true;
      this.sendEvent("play", {
        durationPlayed: Math.round(this.cumulativeTime)
      });
    }

    // Trigger 'complete' event when listener completes track (at least 92% or near end)
    if (!this.hasLoggedComplete && duration > 0 && currentTime / duration >= 0.92) {
      this.hasLoggedComplete = true;
      this.sendEvent("complete", {
        durationPlayed: Math.round(currentTime)
      });
    }
  }

  onEnded() {
    if (!this.hasLoggedComplete && this.hasLoggedPlay) {
      this.hasLoggedComplete = true;
      this.sendEvent("complete", {
        durationPlayed: Math.round(this.cumulativeTime)
      });
    }
  }

  logDownload(trackId, trackTitle) {
    this.sendEvent("download", {
      overrideTrackId: Number(trackId),
      overrideTrackTitle: String(trackTitle)
    });
  }

  async sendEvent(eventType, extra = {}) {
    try {
      const { db } = await getFirebaseServices();
      if (!db) return; // Firebase not yet configured; silently skip

      const { collection, addDoc, serverTimestamp } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
      );

      const trackId = extra.overrideTrackId || this.currentTrackId;
      const trackTitle = extra.overrideTrackTitle || this.currentTrackTitle;

      if (!trackId || !trackTitle) return;

      const docData = {
        trackId: Number(trackId),
        trackTitle: String(trackTitle),
        eventType: String(eventType),
        sessionId: this.sessionId,
        device: this.device,
        referrer: this.referrer,
        timestamp: serverTimestamp()
      };

      if (typeof extra.durationPlayed === "number") {
        docData.durationPlayed = extra.durationPlayed;
      }

      await addDoc(collection(db, "plays"), docData);
    } catch (err) {
      // Never crash or disrupt audio playback on network or tracking errors
      console.debug("Telemetry notice:", err.message);
    }
  }
}

export const tracker = new AudioTracker();
