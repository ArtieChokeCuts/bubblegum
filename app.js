"use strict";

const tracks = [
  { title: "daylight", file: "tracks/track_01.mp3", download: "01_daylight.mp3" },
  { title: "Betteroffas2", file: "tracks/track_02.mp3", download: "02_Betteroffas2.mp3" },
  { title: "Ok U", file: "tracks/track_03.mp3", download: "03_Ok U.mp3" },
  { title: "TV Aliens", file: "tracks/track_04.mp3", download: "04_TV Aliens.mp3" },
  { title: "In the Distance", file: "tracks/track_05.mp3", download: "05_In the Distance.mp3" },
  { title: "you know", file: "tracks/track_06.mp3", download: "06_you know.mp3" },
  { title: "IllWeight 4U@theGate", file: "tracks/track_07.mp3", download: "07_IllWeight 4U@theGate.mp3" },
  { title: "Choices", file: "tracks/track_08.mp3", download: "08_Choices.mp3" },
  { title: "Who Raised You", file: "tracks/track_09.mp3", download: "09_Who Raised You.mp3" },
  { title: "You Gone Love it", file: "tracks/track_10.mp3", download: "10_You Gone Love it.mp3" },
  { title: "Look at it", file: "tracks/track_11.mp3", download: "11_Look at it.mp3" },
  { title: "Bubble Gum Death Wish", file: "tracks/track_12.mp3", download: "12_Bubble Gum Death Wish.mp3" },
  { title: "Untitled Outro", file: "tracks/track_13.mp3", download: "13_Untitled Outro.mp3" }
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

let currentIndex = 0;
let seeking = false;

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
  trackNumber.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${tracks.length}`;
  trackTitle.textContent = track.title;
  trackTitle.classList.toggle("long-title", track.title.length > 16);
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
