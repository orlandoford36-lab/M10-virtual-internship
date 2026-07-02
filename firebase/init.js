import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBQi9Ft7UsWOkshiG92xZn7U5l01nqrcE0",
  authDomain: "advanced-virtual-interns-e6d89.firebaseapp.com",
  projectId: "advanced-virtual-interns-e6d89",
  storageBucket: "advanced-virtual-interns-e6d89.firebasestorage.app",
  messagingSenderId: "734436406536",
  appId: "1:734436406536:web:c78ecf074f508c80c728bd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  app,
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  addDoc,
  collection,
  doc,
  onSnapshot,
};