const SESSION_KEY = "summarist_session_user";
const REGISTERED_KEY = "summarist_registered_user";

const DEMO_EMAIL = "guest@gmail.com";
const DEMO_PASSWORD = "guest123";

const listeners = new Set();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeParse(json) {
  try {
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

function createUser(email) {
  const normalized = normalizeEmail(email);
  return {
    uid: `demo-${normalized.replace(/[^a-z0-9]/g, "") || "user"}`,
    email: normalized,
    subscriptionPlan: null,
  };
}

function getRegisteredUser() {
  return safeParse(localStorage.getItem(REGISTERED_KEY));
}

function setRegisteredUser(user) {
  localStorage.setItem(REGISTERED_KEY, JSON.stringify(user));
}

function setSessionUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSessionUser() {
  localStorage.removeItem(SESSION_KEY);
}

function notifyAuthListeners() {
  const user = getCurrentUser();
  listeners.forEach((callback) => callback(user));
}

function getAllowedAccounts() {
  const accounts = [{ email: DEMO_EMAIL, password: DEMO_PASSWORD }];
  const registered = getRegisteredUser();
  if (registered?.email && registered?.password) {
    accounts.push({ email: normalizeEmail(registered.email), password: registered.password });
  }
  return accounts;
}

const auth = {
  get currentUser() {
    return getCurrentUser();
  },
};

function getCurrentUser() {
  return safeParse(localStorage.getItem(SESSION_KEY));
}

function onAuthStateChanged(_auth, callback) {
  if (typeof callback !== "function") return () => {};
  listeners.add(callback);
  callback(getCurrentUser());
  return () => {
    listeners.delete(callback);
  };
}

function signOut() {
  clearSessionUser();
  notifyAuthListeners();
  return Promise.resolve();
}

function signInWithEmailAndPassword(_auth, email, password) {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    return Promise.reject({ code: "auth/invalid-email" });
  }

  const match = getAllowedAccounts().find(
    (account) => account.email === normalizedEmail && account.password === String(password || "")
  );

  if (!match) {
    return Promise.reject({ code: "auth/user-not-found" });
  }

  const user = createUser(normalizedEmail);
  setSessionUser(user);
  notifyAuthListeners();
  return Promise.resolve({ user });
}

function createUserWithEmailAndPassword(_auth, email, password) {
  const normalizedEmail = normalizeEmail(email);
  const safePassword = String(password || "");

  if (!isValidEmail(normalizedEmail)) {
    return Promise.reject({ code: "auth/invalid-email" });
  }

  if (safePassword.length < 6) {
    return Promise.reject({ code: "auth/weak-password" });
  }

  setRegisteredUser({ email: normalizedEmail, password: safePassword });
  const user = createUser(normalizedEmail);
  setSessionUser(user);
  notifyAuthListeners();
  return Promise.resolve({ user });
}

export {
  auth,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  createUserWithEmailAndPassword,
  getCurrentUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
};
