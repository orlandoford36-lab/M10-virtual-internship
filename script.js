import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "./auth/session.js";

const FOR_YOU_URL = "https://summarist.vercel.app/for-you";

const modal = document.getElementById("authModal");
const closeBtn = document.getElementById("closeModal");

const navLoginBtn = document.querySelector(".nav__list--login");
const homeCtaButtons = document.querySelectorAll(".home__cta--btn");
const logoutBtn = document.querySelector(".nav__list--logout");

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const loginEmailInput = document.getElementById("loginEmail");
const loginPasswordInput = document.getElementById("loginPassword");
const registerEmailInput = document.getElementById("registerEmail");
const registerPasswordInput = document.getElementById("registerPassword");
const registerConfirmPasswordInput = document.getElementById("registerConfirmPassword");

const loginErrorEl = document.getElementById("loginError");
const registerErrorEl = document.getElementById("registerError");

const guestBtn = document.querySelector(".modal__btn--guest");
const loginSubmitBtn = document.querySelector("#loginForm .modal__btn");
const registerSubmitBtn = document.querySelector("#signupForm .modal__btn");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const googleLoginBtn = document.getElementById("googleLoginBtn");

function openAuthModal() {
  if (!modal) return;
  modal.classList.add("show");
}

function closeAuthModal() {
  if (!modal) return;
  modal.classList.remove("show");
}

function redirectToForYou() {
  window.location.href = FOR_YOU_URL;
}

function setAuthUi(isLoggedIn) {
  if (isLoggedIn) {
    if (navLoginBtn) navLoginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "list-item";
    homeCtaButtons.forEach((button) => {
      button.textContent = "Open App";
    });
    closeAuthModal();
    return;
  }

  if (navLoginBtn) navLoginBtn.style.display = "list-item";
  if (logoutBtn) logoutBtn.style.display = "none";
  homeCtaButtons.forEach((button) => {
    button.textContent = "Login";
  });
}

function activateLoginTab() {
  if (loginTab) loginTab.classList.add("modal__tab--active");
  if (signupTab) signupTab.classList.remove("modal__tab--active");
  if (loginForm) loginForm.style.display = "flex";
  if (signupForm) signupForm.style.display = "none";
}

function activateSignupTab() {
  if (signupTab) signupTab.classList.add("modal__tab--active");
  if (loginTab) loginTab.classList.remove("modal__tab--active");
  if (signupForm) signupForm.style.display = "flex";
  if (loginForm) loginForm.style.display = "none";
}

function bindPseudoButton(el, handler) {
  if (!el) return;
  el.addEventListener("click", handler);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler();
    }
  });
}

function setLoginError(message = "") {
  if (loginErrorEl) loginErrorEl.textContent = message;
}

function setRegisterError(message = "") {
  if (registerErrorEl) registerErrorEl.textContent = message;
}

function mapLoginError(errorCode) {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Invalid email.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "User not found.";
    default:
      return "Unable to log in right now. Please try again.";
  }
}

function mapRegisterError(errorCode) {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Invalid email.";
    case "auth/weak-password":
      return "Short password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    default:
      return "Unable to register right now. Please try again.";
  }
}

bindPseudoButton(navLoginBtn, openAuthModal);

homeCtaButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (auth.currentUser) {
      redirectToForYou();
      return;
    }
    openAuthModal();
  });
});

if (closeBtn) {
  closeBtn.addEventListener("click", closeAuthModal);
}

if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeAuthModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAuthModal();
});

if (loginTab) {
  loginTab.addEventListener("click", () => {
    setLoginError("");
    setRegisterError("");
    activateLoginTab();
  });
}

if (signupTab) {
  signupTab.addEventListener("click", () => {
    setLoginError("");
    setRegisterError("");
    activateSignupTab();
  });
}

if (loginSubmitBtn) {
  loginSubmitBtn.addEventListener("click", async () => {
    const email = loginEmailInput?.value.trim() ?? "";
    const password = loginPasswordInput?.value ?? "";

    setLoginError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      redirectToForYou();
    } catch (error) {
      setLoginError(mapLoginError(error.code));
    }
  });
}

if (registerSubmitBtn) {
  registerSubmitBtn.addEventListener("click", async () => {
    const email = registerEmailInput?.value.trim() ?? "";
    const password = registerPasswordInput?.value ?? "";
    const confirmPassword = registerConfirmPasswordInput?.value ?? "";

    setRegisterError("");

    if (password !== confirmPassword) {
      setRegisterError("Passwords do not match.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      redirectToForYou();
    } catch (error) {
      setRegisterError(mapRegisterError(error.code));
    }
  });
}

if (guestBtn) {
  guestBtn.addEventListener("click", async () => {
    setLoginError("");

    try {
      await signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
      redirectToForYou();
    } catch (error) {
      setLoginError(mapLoginError(error.code));
    }
  });
}

if (forgotPasswordBtn) {
  forgotPasswordBtn.addEventListener("click", () => {
    window.alert("Forgot Password is coming soon.");
  });
}

if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", () => {
    window.alert("Google Login is coming soon.");
  });
}

bindPseudoButton(logoutBtn, async () => {
  try {
    await signOut(auth);
  } catch {
    setLoginError("Unable to log out right now. Please try again.");
  }
});

onAuthStateChanged(auth, (user) => {
  const isLoggedIn = Boolean(user);
  setAuthUi(isLoggedIn);
});

window.addEventListener("DOMContentLoaded", () => {
  activateLoginTab();
  setLoginError("");
  setRegisterError("");

  const params = new URLSearchParams(window.location.search);
  if (params.get("showLogin") === "1") {
    openAuthModal();
  }
});
