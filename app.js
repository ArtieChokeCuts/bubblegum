"use strict";

const tracks = [
  {
    title: "daylight",
    file: "tracks/track_01.mp3",
    download: "01_daylight.mp3",
    description: "The opener steps into the morning with a clear-eyed push forward. Brightness and pressure share the same frame: a reset that knows the night is still close behind. It introduces Bubblegum Death Wish as a record built on contrast - sweetness against danger, calm against momentum."
  },
  {
    title: "Betteroffas2",
    file: "tracks/track_02.mp3",
    download: "02_Betteroffas2.mp3",
    description: "A reflection on chemistry, distance, and the idea that survival can feel easier when two people stop fighting the same battle alone. The title reads like a text message that became a promise, carrying the record from solitary thought toward partnership."
  },
  {
    title: "Ok U",
    file: "tracks/track_03.mp3",
    download: "03_Ok U.mp3",
    description: "Short, direct, and conversational. Ok U turns a casual phrase into a check-in: part reassurance, part challenge, and part unanswered question. Its place in the sequence keeps the record personal and close, like the listener has stepped inside a private exchange."
  },
  {
    title: "TV Aliens",
    file: "tracks/track_04.mp3",
    download: "04_TV Aliens.mp3",
    description: "Signals, screens, and people who feel real only through a glow. TV Aliens leans into the album's stranger edge, looking at the distance between what gets broadcast and what is actually lived. Familiar entertainment starts to feel slightly extraterrestrial."
  },
  {
    title: "In the Distance",
    file: "tracks/track_05.mp3",
    download: "05_In the Distance.mp3",
    description: "Space opens up here. The song looks toward something visible but not yet reachable: a person, a place, or a different version of life. It plays like a horizon track, giving the middle of the record room to breathe without letting the goal disappear."
  },
  {
    title: "you know",
    file: "tracks/track_06.mp3",
    download: "06_you know.mp3",
    description: "Built around everything that does not need to be explained out loud. You know lives in shared history, coded looks, and the weight of a phrase that can mean affection, warning, or resignation depending on who says it."
  },
  {
    title: "IllWeight 4U@theGate",
    file: "tracks/track_07.mp3",
    download: "07_IllWeight 4U@theGate.mp3",
    description: "The title reads like a message left before departure: loyal, impatient, digital, and strangely timeless. This is the threshold song, centered on waiting for somebody who may still arrive and deciding how long faith can hold the door open."
  },
  {
    title: "Choices",
    file: "tracks/track_08.mp3",
    download: "08_Choices.mp3",
    description: "Every turn has a cost. Choices brings consequence to the front of the album and asks what remains after instinct, pressure, and desire all make their case. It is less about finding a perfect decision than owning the road that follows."
  },
  {
    title: "Who Raised You",
    file: "tracks/track_09.mp3",
    download: "09_Who Raised You.mp3",
    description: "A sharp title with humor and heat behind it. The track confronts behavior, manners, and the histories people carry into a room. It can land as a joke, an accusation, or a genuine question - and that uncertainty gives it bite."
  },
  {
    title: "You Gone Love it",
    file: "tracks/track_10.mp3",
    download: "10_You Gone Love it.mp3",
    description: "Confidence becomes the hook before the listener even presses play. You Gone Love it is an invitation with no room for doubt: generous, playful, and self-assured. It shifts the album toward the pleasure of showing somebody exactly what you made."
  },
  {
    title: "Look at it",
    file: "tracks/track_11.mp3",
    download: "11_Look at it.mp3",
    description: "A command to stop scrolling past and really see what is in front of you. Repetition becomes focus here. The song sits between display and inspection, asking whether attention is admiration, judgment, or the beginning of understanding."
  },
  {
    title: "Bubble Gum Death Wish",
    file: "tracks/track_12.mp3",
    download: "12_Bubble Gum Death Wish.mp3",
    description: "The title track holds the album's central contradiction: sweetness with a dangerous aftertaste. Bright surfaces, reckless impulses, humor, and mortality occupy the same piece of candy. This is the record naming its own world."
  },
  {
    title: "Untitled Outro",
    file: "tracks/track_13.mp3",
    download: "13_Untitled Outro.mp3",
    description: "The final track leaves the door open instead of sealing the story shut. Framed as an outro but kept untitled, it feels like the room after the last conversation - a release, a memory, and enough unfinished space for the listener to carry the album forward."
  }
];

const audio = document.querySelector("#audioPlayer");
const playerFrame = document.querySelector("#playerFrame");
const spools = [...document.querySelectorAll(".spool")];
const trackNumber = document.querySelector("#trackNumber");
const trackTitle = document.querySelector("#trackTitle");
const currentTime = document.querySelector("#currentTime");
const duration = document.querySelector("#duration");
const seekControl = document.querySelector("#seekControl");
const previousControl = document.querySelector("#previousControl");
const playControl = document.querySelector("#playControl");
const stopControl = document.querySelector("#stopControl");
const nextControl = document.querySelector("#nextControl");
const downloadControl = document.querySelector("#downloadControl");
const fullscreenControl = document.querySelector("#fullscreenControl");
const linerTrackNumber = document.querySelector("#linerTrackNumber");
const linerScroll = document.querySelector("#linerScroll");
const linerCopy = document.querySelector("#linerCopy");
const linerTitle = document.querySelector("#linerTitle");
const linerDescription = document.querySelector("#linerDescription");
const tickerItems = [...document.querySelectorAll(".ticker-item")];

let currentIndex = 0;
let seeking = false;
let fullscreenRequestPending = false;
let fullscreenRequestSettled = window.matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches
  || window.navigator.standalone === true;

function getFullscreenElement() {
  return document.fullscreenElement
    || document.webkitFullscreenElement
    || document.msFullscreenElement
    || null;
}

async function requestAppFullscreen(force = false) {
  if ((!force && fullscreenRequestSettled) || fullscreenRequestPending || getFullscreenElement()) {
    return;
  }

  const target = document.documentElement;
  const standardRequest = target.requestFullscreen;
  const request = standardRequest || target.webkitRequestFullscreen || target.msRequestFullscreen;

  if (!request) {
    return;
  }

  fullscreenRequestPending = true;
  try {
    if (standardRequest) {
      await standardRequest.call(target, { navigationUI: "hide" });
    } else {
      await request.call(target);
    }
    window.scrollTo(0, 0);
    fullscreenRequestSettled = true;
  } catch (error) {
    // Browsers may reject until a later user gesture; keep the next tap eligible.
  } finally {
    fullscreenRequestPending = false;
  }
}

function updateFullscreenControl() {
  const active = Boolean(getFullscreenElement());
  const label = active ? "Exit full screen" : "Enter full screen";
  fullscreenControl.classList.toggle("is-active", active);
  fullscreenControl.setAttribute("aria-label", label);
  fullscreenControl.title = label;
}

async function toggleAppFullscreen() {
  const active = getFullscreenElement();
  if (active) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (exit) {
      await exit.call(document);
    }
    return;
  }

  fullscreenRequestSettled = false;
  await requestAppFullscreen(true);
}

function wrapIndex(index) {
  return (index + tracks.length) % tracks.length;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "--:--";
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function setSpinning(active) {
  playerFrame.classList.toggle("is-playing", active);
  spools.forEach((spool) => spool.classList.toggle("is-spinning", active));
  playControl.setAttribute("aria-pressed", String(active));
}

function renderTrack() {
  const track = tracks[currentIndex];
  const displayNumber = String(currentIndex + 1).padStart(2, "0");
  trackNumber.textContent = `${displayNumber} / ${tracks.length}`;
  trackTitle.textContent = track.title;
  trackTitle.classList.toggle("long-title", track.title.length > 16);
  linerTrackNumber.textContent = `TRACK ${displayNumber}`;
  linerTitle.textContent = track.title;
  linerDescription.textContent = track.description;
  linerScroll.scrollTop = 0;
  linerCopy.classList.remove("is-changing");
  requestAnimationFrame(() => linerCopy.classList.add("is-changing"));
  const tickerText = `TRACK ${displayNumber} // ${track.title} // ARTIECHOKE // BUBBLEGUM DEATH WISH`;
  tickerItems.forEach((item) => {
    item.textContent = tickerText;
  });
  downloadControl.href = track.file;
  downloadControl.download = track.download;
  document.title = `${track.title} | ARTIECHOKE`;
}

function resetTimeline() {
  currentTime.textContent = "0:00";
  duration.textContent = "--:--";
  seekControl.value = "0";
}

function loadTrack(index, autoplay = false) {
  currentIndex = wrapIndex(index);
  const track = tracks[currentIndex];
  setSpinning(false);
  renderTrack();
  resetTimeline();
  audio.src = track.file;
  audio.load();
  if (autoplay) {
    playTrack();
  }
}

async function playTrack() {
  try {
    await audio.play();
  } catch (error) {
    setSpinning(false);
    if (error.name !== "NotAllowedError") {
      console.error("Audio playback failed", error);
    }
  }
}

function stopTrack() {
  setSpinning(false);
  audio.pause();
  audio.currentTime = 0;
  currentTime.textContent = "0:00";
  seekControl.value = "0";
}

function changeTrack(offset) {
  const shouldResume = !audio.paused && !audio.ended;
  loadTrack(currentIndex + offset, shouldResume);
}

function updateTimeline() {
  if (seeking) {
    return;
  }
  const progress = Number.isFinite(audio.duration) && audio.duration > 0
    ? (audio.currentTime / audio.duration) * 1000
    : 0;
  seekControl.value = String(progress);
  currentTime.textContent = formatTime(audio.currentTime);
}

previousControl.addEventListener("click", () => changeTrack(-1));
playControl.addEventListener("click", playTrack);
stopControl.addEventListener("click", stopTrack);
nextControl.addEventListener("click", () => changeTrack(1));

fullscreenControl.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleAppFullscreen();
});
document.addEventListener("click", () => requestAppFullscreen());
document.addEventListener("fullscreenchange", updateFullscreenControl);
document.addEventListener("webkitfullscreenchange", updateFullscreenControl);

seekControl.addEventListener("input", () => {
  seeking = true;
  if (Number.isFinite(audio.duration)) {
    currentTime.textContent = formatTime((Number(seekControl.value) / 1000) * audio.duration);
  }
});

seekControl.addEventListener("change", () => {
  if (Number.isFinite(audio.duration)) {
    audio.currentTime = (Number(seekControl.value) / 1000) * audio.duration;
  }
  seeking = false;
  updateTimeline();
});

audio.addEventListener("loadedmetadata", () => {
  duration.textContent = formatTime(audio.duration);
  updateTimeline();
});
audio.addEventListener("durationchange", () => {
  duration.textContent = formatTime(audio.duration);
});
audio.addEventListener("timeupdate", updateTimeline);
audio.addEventListener("play", () => setSpinning(true));
audio.addEventListener("playing", () => setSpinning(true));
audio.addEventListener("pause", () => setSpinning(false));
audio.addEventListener("ended", () => loadTrack(currentIndex + 1, true));
audio.addEventListener("error", () => {
  setSpinning(false);
  duration.textContent = "ERR";
});

document.addEventListener("keydown", (event) => {
  if (!event.repeat) {
    requestAppFullscreen();
  }
  if (event.target instanceof HTMLInputElement) {
    return;
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (audio.paused) {
      playTrack();
    } else {
      audio.pause();
    }
  } else if (event.code === "ArrowLeft") {
    changeTrack(-1);
  } else if (event.code === "ArrowRight") {
    changeTrack(1);
  }
});

loadTrack(0);
