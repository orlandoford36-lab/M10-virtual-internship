import { addDoc, collection, db, onSnapshot } from "./firebase/init.js";
import { auth, onAuthStateChanged } from "./auth/session.js";

const STRIPE_PUBLISHABLE_KEY = window.__STRIPE_PUBLISHABLE_KEY__ || "";
const PRICE_IDS = {
  "premium-plus": window.__STRIPE_PRICE_YEARLY__ || "",
  premium: window.__STRIPE_PRICE_MONTHLY__ || "",
};

const cards = document.querySelectorAll(".plan__card[data-plan]");
const purchaseBtn = document.getElementById("purchaseBtn");
const planMessage = document.getElementById("planMessage");
const planDisclaimer = document.getElementById("planDisclaimer");
let selectedPlan = "premium-plus";
let loading = false;
let stripePromise = null;

function setMessage(message, type = "info") {
  if (!planMessage) return;
  planMessage.textContent = message;
  planMessage.style.color = type === "error" ? "#d64545" : "#0365f2";
}

function updateUI() {
  cards.forEach((card) => {
    const isActive = card.dataset.plan === selectedPlan;
    card.classList.toggle("plan__card--active", isActive);
    const dot = card.querySelector(".plan__card--dot");
    if (dot) dot.style.display = isActive ? "block" : "none";
  });

  if (purchaseBtn) {
    purchaseBtn.textContent = selectedPlan === "premium-plus" ? "Start your free 7-day trial" : "Start your first month";
  }

  if (planDisclaimer) {
    planDisclaimer.textContent = selectedPlan === "premium-plus"
      ? "Cancel your trial at any time before it ends, and you won’t be charged."
      : "30-day money back guarantee, no questions asked.";
  }
}

function getStripePromise() {
  if (stripePromise) return stripePromise;
  stripePromise = new Promise((resolve, reject) => {
    if (!STRIPE_PUBLISHABLE_KEY) {
      resolve(null);
      return;
    }

    const existing = document.querySelector('script[src^="https://js.stripe.com/v3"]');
    if (existing && window.Stripe) {
      resolve(window.Stripe(STRIPE_PUBLISHABLE_KEY));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3";
    script.onload = () => {
      if (!window.Stripe) {
        reject(new Error("Stripe.js not available"));
        return;
      }
      resolve(window.Stripe(STRIPE_PUBLISHABLE_KEY));
    };
    script.onerror = () => reject(new Error("Failed to load Stripe.js"));
    document.head.appendChild(script);
  });
  return stripePromise;
}

async function createCheckoutSession(plan) {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = "./index.html?showLogin=1";
    return;
  }

  const price = PRICE_IDS[plan];
  if (!price) {
    setMessage("Stripe price IDs are not configured yet.", "error");
    return;
  }

  if (!STRIPE_PUBLISHABLE_KEY) {
    setMessage("Stripe publishable key is not configured yet.", "error");
    return;
  }

  loading = true;
  purchaseBtn.disabled = true;
  setMessage("Preparing checkout...");

  try {
    const sessionRef = await addDoc(
      collection(db, "customers", user.uid, "checkout_sessions"),
      {
        price,
        success_url: `${window.location.origin}/for-you.html`,
        cancel_url: `${window.location.origin}/choose-plan.html`,
      }
    );

    const unsubscribe = onSnapshot(sessionRef, async (snap) => {
      const data = snap.data();
      if (!data || !data.sessionId) return;

      unsubscribe();
      const stripe = await getStripePromise();
      if (!stripe) {
        setMessage("Stripe is not configured yet.", "error");
        return;
      }

      const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (error) setMessage(error.message, "error");
    });
  } catch (error) {
    setMessage(error.message || "Unable to create checkout session.", "error");
  } finally {
    loading = false;
    purchaseBtn.disabled = false;
  }
}

cards.forEach((card) => {
  card.addEventListener("click", () => {
    selectedPlan = card.dataset.plan;
    setMessage("");
    updateUI();
  });
});

purchaseBtn.addEventListener("click", () => {
  if (loading) return;
  createCheckoutSession(selectedPlan);
});

onAuthStateChanged(auth, (user) => {
  if (user && user.subscriptionPlan) {
    window.location.href = "./for-you.html";
    return;
  }
  updateUI();
});

updateUI();
