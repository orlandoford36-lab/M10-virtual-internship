import { auth, onAuthStateChanged, signOut } from "./auth/session.js";

const API_BASE = "https://us-central1-summaristt.cloudfunctions.net";

const loadingEl = document.getElementById("bookLoading");
const contentEl = document.getElementById("bookContent");
const logoutBtn = document.getElementById("logoutBtn");

const bookTitleEl = document.getElementById("bookTitle");
const bookAuthorEl = document.getElementById("bookAuthor");
const bookSubtitleEl = document.getElementById("bookSubtitle");
const bookRatingEl = document.getElementById("bookRating");
const bookTotalRatingEl = document.getElementById("bookTotalRating");
const bookDurationEl = document.getElementById("bookDuration");
const bookTypeEl = document.getElementById("bookType");
const bookKeyIdeasEl = document.getElementById("bookKeyIdeas");
const bookTagsEl = document.getElementById("bookTags");
const bookDescriptionEl = document.getElementById("bookDescription");
const authorDescriptionEl = document.getElementById("authorDescription");
const bookImageEl = document.getElementById("bookImage");
const readBtn = document.getElementById("readBtn");
const listenBtn = document.getElementById("listenBtn");
const bookmarkBtn = document.getElementById("bookmarkBtn");
const topSearchInput = document.getElementById("topSearchInput");

let currentBookId = null;

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--:--";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function getBookId() {
  const params = new URLSearchParams(window.location.search);
  const queryId = params.get("id");
  if (queryId) return queryId;

  const match = window.location.pathname.match(/\/book\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

function openPlayerPage() {
  if (!currentBookId) return;
  window.location.href = `./player.html?id=${currentBookId}`;
}

async function fetchBook(id) {
  const response = await fetch(`${API_BASE}/getBook?id=${id}`);
  return response.json();
}

function renderTags(tags = []) {
  if (!bookTagsEl) return;
  bookTagsEl.innerHTML = tags.map((tag) => `<div class="inner-book__tag">${tag}</div>`).join("");
}

function showBook(book, duration) {
  if (!book) {
    loadingEl.textContent = "Book not found.";
    return;
  }

  bookTitleEl.textContent = `${book.title}${book.subscriptionRequired ? " (Premium)" : ""}`;
  bookAuthorEl.textContent = book.author ?? "";
  bookSubtitleEl.textContent = book.subTitle ?? "";
  const averageRating = Number(book.averageRating);
  bookRatingEl.textContent = Number.isFinite(averageRating) ? averageRating.toFixed(1) : (book.averageRating ?? "");
  bookTotalRatingEl.textContent = `(${book.totalRating ?? 0} ratings)`;
  bookDurationEl.textContent = duration;
  bookTypeEl.textContent = book.type ?? "";
  bookKeyIdeasEl.textContent = `${book.keyIdeas ?? 0} Key ideas`;
  bookDescriptionEl.textContent = book.bookDescription ?? "";
  authorDescriptionEl.textContent = book.authorDescription ?? "";
  if (book.imageLink) {
    bookImageEl.src = book.imageLink;
    bookImageEl.alt = book.title ?? "Book cover";
  }
  renderTags(book.tags);

  contentEl.classList.remove("is-hidden");
  loadingEl.classList.add("is-hidden");

  const canonicalPath = `/book/${book.id}`;
  if (window.location.pathname !== canonicalPath) {
    window.history.replaceState({}, "", canonicalPath);
  }

  if (bookmarkBtn) {
    bookmarkBtn.textContent = "Add title to My Library";
  }
}

async function getDurationFromAudio(audioUrl) {
  if (!audioUrl) return "--:--";

  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => resolve(formatDuration(audio.duration));
    audio.onerror = () => resolve("--:--");
    audio.src = audioUrl;
  });
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
    const duration = await getDurationFromAudio(book.audioLink);
    showBook(book, duration);
  } catch {
    loadingEl.textContent = "Unable to load book.";
  }
}

if (readBtn) {
  readBtn.addEventListener("click", () => {
    openPlayerPage();
  });
}

if (listenBtn) {
  listenBtn.addEventListener("click", () => {
    openPlayerPage();
  });
}

if (bookmarkBtn) {
  bookmarkBtn.addEventListener("click", () => {
    window.alert("My Library integration is coming soon.");
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
