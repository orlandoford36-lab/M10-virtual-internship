import { auth, onAuthStateChanged, signOut } from "./auth/session.js";

const loadingState = document.getElementById("loadingState");
const loggedOutState = document.getElementById("loggedOutState");
const loggedInState = document.getElementById("loggedInState");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const subscriptionStatus = document.getElementById("subscriptionStatus");
const userEmail = document.getElementById("userEmail");
const upgradeBtn = document.getElementById("upgradeBtn");
const topSearchInput = document.getElementById("topSearchInput");

function showState(state) {
  loadingState.classList.add("is-hidden");
  loggedOutState.classList.add("is-hidden");
  loggedInState.classList.add("is-hidden");
  state.classList.remove("is-hidden");
}

function setLoggedOut() {
  showState(loggedOutState);
}

function setLoggedIn(user) {
  showState(loggedInState);
  userEmail.textContent = user.email ?? "";
  const plan = user.subscriptionPlan || null;
  subscriptionStatus.textContent = plan || "Basic";
  upgradeBtn.classList.toggle("is-hidden", Boolean(plan));
}

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    window.location.href = "./index.html?showLogin=1";
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
    setLoggedOut();
    return;
  }
  setLoggedIn(user);
});
