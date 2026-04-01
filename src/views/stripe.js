// ============================================================
//  stripe.js — Configuration Stripe (Frontend - Checkout)
// ============================================================

export const stripeConfig = {
  publishableKey: "pk_test_51T20K6AwgHqDmd0F8LcnioXKpuzSyQv7aPkDhhmtPEH9BA98KOzf6F43K2O4A5WjhHHVlguyp48W0bmqMbwSvcDm00YINXIME3",

  // ✅ Route backend Stripe Checkout
  backendUrl: "https://stripe-backend-production-2ac4.up.railway.app/create-stripe-session",

  currency: "eur",
  storeName: "RmStore",

  successUrl: "https://musrh.github.io/SaaasGenerator/#/site/rmstore/merci",
  cancelUrl: "https://musrh.github.io/SaaasGenerator/#/site/rmstore/panier",

  mode: "test",
};

// ============================================================
// 🚀 Créer une session Stripe Checkout + redirection
// ============================================================

export const createCheckoutSession = async ({
  items,
  email,
  adresseLivraison,
  clientId,
  plan = "basic",
}) => {
  try {
    console.log("🚀 Envoi vers backend :", stripeConfig.backendUrl);

    const response = await fetch(stripeConfig.backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
        email,
        adresseLivraison,
        clientId,
        plan,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Erreur backend :", text);
      throw new Error("Erreur Stripe session");
    }

    const data = await response.json();

    if (!data.url) {
      throw new Error("URL Stripe manquante");
    }

    // 🔥 Redirection vers Stripe Checkout
    window.location.href = data.url;

  } catch (error) {
    console.error("❌ Checkout error :", error);
    alert("Erreur lors du paiement");
  }
};

// ============================================================
// (Optionnel) Charger Stripe SDK si besoin futur
// ============================================================

export const loadStripeSDK = () => {
  return new Promise((resolve, reject) => {
    if (window.Stripe) {
      return resolve(window.Stripe(stripeConfig.publishableKey));
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";

    script.onload = () => {
      resolve(window.Stripe(stripeConfig.publishableKey));
    };

    script.onerror = () => {
      reject("Erreur chargement Stripe SDK");
    };

    document.head.appendChild(script);
  });
};
