// ============================================================
//  stripe.js — Configuration Stripe (Frontend - Checkout)
// ============================================================

export const stripeConfig = {
  publishableKey: "pk_test_51T20K6AwgHqDmd0F8LcnioXKpuzSyQv7aPkDhhmtPEH9BA98KOzf6F43K2O4A5WjhHHVlguyp48W0bmqMbwSvcDm00YINXIME3",

  // ✅ Nouveau backend Railway
  backendUrl: "https://backend-master-production-cf50.up.railway.app/create-stripe-session",

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
    console.log("🚀 Backend utilisé :", stripeConfig.backendUrl);

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
      const errorText = await response.text();
      console.error("❌ Erreur backend :", errorText);
      throw new Error("Erreur création session Stripe");
    }

    const data = await response.json();

    if (!data.url) {
      throw new Error("URL Stripe manquante");
    }

    // 🔥 Redirection vers Stripe Checkout
    window.location.href = data.url;

  } catch (error) {
    console.error("❌ Erreur paiement :", error);
    alert("Erreur lors du paiement");
  }
};

// ============================================================
// (Optionnel) Charger Stripe SDK
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
      reject("Erreur chargement Stripe");
    };

    document.head.appendChild(script);
  });
};
