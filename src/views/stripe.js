// ============================================================
//  stripe.js — Configuration Stripe (Frontend)
// ============================================================

export const stripeConfig = {
  publishableKey: "pk_test_51T20K6AwgHqDmd0F8LcnioXKpuzSyQv7aPkDhhmtPEH9BA98KOzf6F43K2O4A5WjhHHVlguyp48W0bmqMbwSvcDm00YINXIME3",

  // ✅ IMPORTANT : bonne route backend (corrige le 404)
  backendUrl: "https://stripe-backend-production-2ac4.up.railway.app/create-payment-intent",

  currency: "eur",
  storeName: "RmStore",

  successUrl: "https://musrh.github.io/SaaasGenerator/#/site/rmstore/merci",
  cancelUrl: "https://musrh.github.io/SaaasGenerator/#/site/rmstore/panier",

  mode: "test",
};

// ============================================================
// 🔥 Créer un PaymentIntent (appel backend)
// ============================================================

export const createPaymentIntent = async (amount) => {
  console.log("🚀 URL Stripe appelée :", stripeConfig.backendUrl);

  const response = await fetch(stripeConfig.backendUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: stripeConfig.currency,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("❌ Erreur backend :", text);
    throw new Error("Erreur Stripe backend");
  }

  const data = await response.json();
  return data.clientSecret;
};

// ============================================================
// 🔄 Charger Stripe dynamiquement
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
