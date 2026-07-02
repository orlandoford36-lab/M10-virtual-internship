import { auth, onAuthStateChanged, signOut } from "./auth/session.js";

const API_BASE = "https://us-central1-summaristt.cloudfunctions.net";

const loadingEl = document.getElementById("playerLoading");
const contentEl = document.getElementById("playerContent");
const logoutBtn = document.getElementById("logoutBtn");

const bookTitleEl = document.getElementById("bookTitle");
const bookSummaryEl = document.getElementById("bookSummary");
const bookImageEl = document.getElementById("bookImage");
const trackTitleEl = document.getElementById("trackTitle");
const trackAuthorEl = document.getElementById("trackAuthor");
const audioEl = document.getElementById("audioEl");
const backBtn = document.getElementById("backBtn");
const playBtn = document.getElementById("playBtn");
const forwardBtn = document.getElementById("forwardBtn");
const currentTimeEl = document.getElementById("currentTime");
const durationTimeEl = document.getElementById("durationTime");
const progressBarEl = document.getElementById("progressBar");
const volumeBarEl = document.getElementById("volumeBar");
const muteBtn = document.getElementById("muteBtn");
const topSearchInput = document.getElementById("topSearchInput");

let currentBookId = null;
let isPlaying = false;
let rafId = null;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getBookId() {
  const params = new URLSearchParams(window.location.search);
  const queryId = params.get("id");
  if (queryId) return queryId;

  const match = window.location.pathname.match(/\/player\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

async function fetchBook(id) {
  const response = await fetch(`${API_BASE}/getBook?id=${id}`);
  return response.json();
}

function setProgressBackground() {
  if (!progressBarEl) return;
  const max = Number(progressBarEl.max || 0);
  const value = Number(progressBarEl.value || 0);
  const percent = max ? (value / max) * 100 : 0;
  progressBarEl.style.background = `linear-gradient(to right, #2bd97c ${percent}%, #6D787D ${percent}%)`;
}

function stopRaf() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

function syncProgress() {
  if (!audioEl || !progressBarEl) return;
  progressBarEl.value = String(audioEl.currentTime || 0);
  currentTimeEl.textContent = formatTime(audioEl.currentTime || 0);
  setProgressBackground();
  if (isPlaying) {
    rafId = requestAnimationFrame(syncProgress);
  }
}

function togglePlay() {
  if (!audioEl) return;
  if (audioEl.paused) {
    audioEl.play();
    isPlaying = true;
    playBtn.textContent = "⏸";
    rafId = requestAnimationFrame(syncProgress);
  } else {
    audioEl.pause();
    isPlaying = false;
    playBtn.textContent = "▶";
    stopRaf();
  }
}

function loadBook(book) {
  currentBookId = book.id;

  bookTitleEl.textContent = book.title ?? "";
  bookSummaryEl.textContent = book.summary ?? book.bookDescription ?? "";
  bookImageEl.src = book.imageLink ?? "";
  bookImageEl.alt = book.title ?? "Book cover";
  trackTitleEl.textContent = book.title ?? "";
  trackAuthorEl.textContent = book.author ?? "";

  audioEl.src = book.audioLink ?? "";
  audioEl.volume = Number(volumeBarEl.value) / 100;
  audioEl.muted = false;

  audioEl.onloadedmetadata = () => {
    progressBarEl.max = String(audioEl.duration || 0);
    durationTimeEl.textContent = formatTime(audioEl.duration || 0);
    currentTimeEl.textContent = formatTime(0);
    setProgressBackground();
  };

  audioEl.onended = () => {
    isPlaying = false;
    playBtn.textContent = "▶";
    stopRaf();
    audioEl.currentTime = 0;
    progressBarEl.value = "0";
    currentTimeEl.textContent = "00:00";
    setProgressBackground();
  };

  progressBarEl.value = "0";
  currentTimeEl.textContent = "00:00";
  durationTimeEl.textContent = "00:00";
  playBtn.textContent = "▶";
  loadingEl.classList.add("is-hidden");
  contentEl.classList.remove("is-hidden");
  window.history.replaceState({}, "", `/player/${book.id}`);
}

async function init() {
  const id = getBookId();
  if (!id) {
    loadingEl.textContent = "Book not found.";
    return;
  }

  currentBookId = id;

  try {
    const book = await fetchBook(id);
    loadBook(book);
  } catch {
    loadingEl.textContent = "Unable to load player.";
  }
}

if (playBtn) {
  playBtn.addEventListener("click", togglePlay);
}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    if (!audioEl) return;
    audioEl.currentTime = Math.max(0, audioEl.currentTime - 10);
    syncProgress();
  });
}

if (forwardBtn) {
  forwardBtn.addEventListener("click", () => {
    if (!audioEl) return;
    audioEl.currentTime = Math.min(audioEl.duration || audioEl.currentTime + 10, audioEl.currentTime + 10);
    syncProgress();
  });
}

if (progressBarEl) {
  progressBarEl.addEventListener("input", () => {
    if (!audioEl) return;
    audioEl.currentTime = Number(progressBarEl.value);
    currentTimeEl.textContent = formatTime(audioEl.currentTime);
    setProgressBackground();
  });
}

if (volumeBarEl) {
  volumeBarEl.addEventListener("input", () => {
    if (!audioEl) return;
    audioEl.volume = Number(volumeBarEl.value) / 100;
    audioEl.muted = false;
    muteBtn.textContent = Number(volumeBarEl.value) === 0 ? "Unmute" : "Mute";
  });
}

if (muteBtn) {
  muteBtn.addEventListener("click", () => {
    if (!audioEl) return;
    audioEl.muted = !audioEl.muted;
    muteBtn.textContent = audioEl.muted ? "Unmute" : "Mute";
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "./index.html";
  });
}

if (topSearchInput) {
  topSearchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const query = topSearchInput.value.trim();
    const target = query ? `./search.html?q=${encodeURIComponent(query)}` : "./search.html";
    window.location.href = target;
  });
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "./index.html";
    return;
  }

  if (logoutBtn) {
    logoutBtn.textContent = "Logout";
  }
});

init();
