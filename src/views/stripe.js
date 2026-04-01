// ============================================================
//  stripe.js — Configuration du serveur de paiement Stripe
// ============================================================

export const stripeConfig = {
  publishableKey: "pk_test_51T20K6AwgHqDmd0F8LcnioXKpuzSyQv7aPkDhhmtPEH9BA98KOzf6F43K2O4A5WjhHHVlguyp48W0bmqMbwSvcDm00YINXIME3",
  backendUrl: "https://stripe-backend-production-2ac4.up.railway.app",
  currency: "eur",
  storeName: "RmStore",
  successUrl: "https://musrh.github.io/SaaasGenerator/#/site/rmstore/merci",
  cancelUrl: "https://musrh.github.io/SaaasGenerator/#/site/rmstore/panier",
  mode: "test",
};

// ============================================================
//  Charger Stripe dynamiquement
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
    script.onerror = reject;

    document.head.appendChild(script);
  });
};
