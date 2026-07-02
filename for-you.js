import { auth, onAuthStateChanged, signOut } from "./auth/session.js";

const API_BASE = "https://us-central1-summaristt.cloudfunctions.net";

const selectedBookContainer = document.getElementById("selectedBookContainer");
const recommendedBooksContainer = document.getElementById("recommendedBooksContainer");
const suggestedBooksContainer = document.getElementById("suggestedBooksContainer");
const logoutBtn = document.getElementById("logoutBtn");
const topSearchInput = document.getElementById("topSearchInput");

function formatSeconds(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "--:--";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getAudioDuration(audioUrl) {
  return new Promise((resolve) => {
    if (!audioUrl) {
      resolve("--:--");
      return;
    }

    const audio = document.createElement("audio");
    audio.preload = "metadata";

    const done = (value) => {
      audio.src = "";
      resolve(value);
    };

    audio.onloadedmetadata = () => done(formatSeconds(audio.duration));
    audio.onerror = () => done("--:--");
    audio.src = audioUrl;
  });
}

async function fetchSelectedBook() {
  const response = await fetch(`${API_BASE}/getBook?status=selected`);
  return response.json();
}

async function fetchRecommendedBooks() {
  const response = await fetch(`${API_BASE}/getBooks?status=recommended`);
  return response.json();
}

async function fetchSuggestedBooks() {
  const response = await fetch(`${API_BASE}/getBooks?status=suggested`);
  return response.json();
}

function bookPillMarkup(subscriptionRequired) {
  return subscriptionRequired ? '<div class="book__pill">Premium</div>' : "";
}

function selectedBookMarkup(book, duration) {
  return `
    <a class="selected__book" href="/book/${book.id}" data-book-id="${book.id}">
      <div class="selected__book--sub-title">${book.subTitle ?? ""}</div>
      <div class="selected__book--line"></div>
      <div class="selected__book--content">
        <img class="selected__book--img" src="${book.imageLink}" alt="${book.title}" />
        <div class="selected__book--text">
          <div class="selected__book--title">${book.title}</div>
          <div class="selected__book--author">${book.author}</div>
          <div class="selected__book--duration">${duration}</div>
        </div>
      </div>
    </a>
  `;
}

function recommendedBookMarkup(book, duration) {
  return `
    <a class="for-you__recommended--books-link" href="/book/${book.id}" data-book-id="${book.id}">
      ${bookPillMarkup(book.subscriptionRequired)}
      <img class="recommended__book--img" src="${book.imageLink}" alt="${book.title}" />
      <div class="recommended__book--title">${book.title}</div>
      <div class="recommended__book--author">${book.author}</div>
      <div class="recommended__book--sub-title">${book.subTitle ?? ""}</div>
      <div class="recommended__book--details-wrapper">
        <div>${duration}</div>
        <div>${book.averageRating ?? "-"}</div>
      </div>
    </a>
  `;
}

function bindBookLinks() {
  document.querySelectorAll('a[href^="/book/"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const bookId = link.dataset.bookId || link.getAttribute("href").split("/").pop();
      window.location.href = `./book.html?id=${bookId}`;
    });
  });
}

async function renderSelectedBook() {
  try {
    const selectedBook = await fetchSelectedBook();
    if (!selectedBook) {
      selectedBookContainer.textContent = "No selected book found.";
      return;
    }

    const duration = await getAudioDuration(selectedBook.audioLink);
    selectedBookContainer.classList.remove("selected__book--skeleton");
    selectedBookContainer.innerHTML = selectedBookMarkup(selectedBook, duration);
  } catch {
    selectedBookContainer.textContent = "Unable to load selected book.";
  }
}

async function renderBookList(container, books) {
  if (!Array.isArray(books) || books.length === 0) {
    container.innerHTML = "No books found.";
    return;
  }

  const cards = await Promise.all(
    books.map(async (book) => {
      const duration = await getAudioDuration(book.audioLink);
      return recommendedBookMarkup(book, duration);
    })
  );

  container.innerHTML = cards.join("");
  bindBookLinks();
}

async function initForYouPage() {
  try {
    const [recommendedBooks, suggestedBooks] = await Promise.all([
      fetchRecommendedBooks(),
      fetchSuggestedBooks(),
      renderSelectedBook(),
    ]);

    await Promise.all([
      renderBookList(recommendedBooksContainer, recommendedBooks),
      renderBookList(suggestedBooksContainer, suggestedBooks),
    ]);
  } catch {
    recommendedBooksContainer.textContent = "Unable to load recommended books.";
    suggestedBooksContainer.textContent = "Unable to load suggested books.";
  }
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
    return;
  }

  initForYouPage();
});

if (topSearchInput) {
  topSearchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const query = topSearchInput.value.trim();
    const target = query ? `./search.html?q=${encodeURIComponent(query)}` : "./search.html";
    window.location.href = target;
  });
}
