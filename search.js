import { auth, onAuthStateChanged, signOut } from "./auth/session.js";

const API_BASE = "https://us-central1-summaristt.cloudfunctions.net";

const searchInput = document.getElementById("searchInput");
const searchState = document.getElementById("searchState");
const results = document.getElementById("results");
const logoutBtn = document.getElementById("logoutBtn");

let searchTimer = null;

function skeletonCardsMarkup(count = 3) {
  return Array.from({ length: count })
    .map(
      () => `
        <div class="result-card result-card--skeleton">
          <div class="skeleton skeleton-thumb"></div>
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line skeleton-w-80"></div>
          <div class="skeleton skeleton-line skeleton-w-60"></div>
        </div>
      `
    )
    .join("");
}

function formatSeconds(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "--:--";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getDurationFromAudio(audioUrl) {
  return new Promise((resolve) => {
    if (!audioUrl) {
      resolve("--:--");
      return;
    }

    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => resolve(formatSeconds(audio.duration));
    audio.onerror = () => resolve("--:--");
    audio.src = audioUrl;
  });
}

async function searchBooks(query) {
  const response = await fetch(`${API_BASE}/getBooksByAuthorOrTitle?search=${encodeURIComponent(query)}`);
  return response.json();
}

function renderResults(books) {
  if (!Array.isArray(books) || books.length === 0) {
    results.innerHTML = "";
    searchState.textContent = "No books found.";
    return;
  }

  searchState.textContent = `${books.length} result${books.length === 1 ? "" : "s"} found.`;

  Promise.all(
    books.map(async (book) => {
      const duration = await getDurationFromAudio(book.audioLink);
      return `
        <a class="result-card" href="./book.html?id=${book.id}">
          ${book.subscriptionRequired ? '<div class="book__pill">Premium</div>' : ""}
          <img class="result-card__img" src="${book.imageLink}" alt="${book.title}" />
          <div class="result-card__title">${book.title}</div>
          <div class="result-card__author">${book.author}</div>
          <div class="result-card__sub">${book.subTitle ?? ""}</div>
          <div class="result-card__details"><span>${duration}</span><span>${book.averageRating ?? "-"}</span></div>
        </a>
      `;
    })
  ).then((cards) => {
    results.innerHTML = cards.join("");
  });
}

async function runSearch(value) {
  const query = value.trim();
  if (!query) {
    results.innerHTML = "";
    searchState.textContent = "Type to search for books.";
    return;
  }

  results.innerHTML = skeletonCardsMarkup();
  searchState.textContent = "Searching...";
  try {
    const books = await searchBooks(query);
    renderResults(books);
  } catch {
    results.innerHTML = "";
    searchState.textContent = "Unable to search right now.";
  }
}

if (searchInput) {
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";
  searchInput.value = initialQuery;
  if (initialQuery) runSearch(initialQuery);

  searchInput.addEventListener("input", (event) => {
    clearTimeout(searchTimer);
    const value = event.target.value;
    searchTimer = setTimeout(() => runSearch(value), 250);
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    clearTimeout(searchTimer);
    runSearch(searchInput.value);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "./index.html";
  });
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "./index.html";
  }
});
