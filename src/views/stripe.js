// ============================================================
//  stripe.js — Configuration du serveur de paiement Stripe
//  Modifiez les valeurs ci-dessous avec vos propres clés
// ============================================================

export const stripeConfig = {

  // ----------------------------------------------------------
  //  Clés API Stripe
  //  Trouvez-les sur : https://dashboard.stripe.com/apikeys
  // ----------------------------------------------------------
  publishableKey: "pk_test_VOTRE_CLE_PUBLIQUE_ICI",

  // ⚠️  Ne jamais exposer la clé secrète côté client !
  //     Utilisez-la uniquement dans votre backend (Node.js, etc.)
  // secretKey: "sk_test_...",

  // ----------------------------------------------------------
  //  URL de votre backend qui crée le PaymentIntent
  //  Exemple : "https://api.votresite.com/create-payment-intent"
  // ----------------------------------------------------------
  backendUrl: "https://votre-backend.com/create-payment-intent",

  // ----------------------------------------------------------
  //  Devise utilisée pour les paiements (ISO 4217)
  //  Exemples : "eur", "usd", "mad", "gbp"
  // ----------------------------------------------------------
  currency: "eur",

  // ----------------------------------------------------------
  //  Nom affiché sur la page de paiement
  // ----------------------------------------------------------
  storeName: "Mon Boutique",

  // ----------------------------------------------------------
  //  URL de redirection après paiement réussi
  // ----------------------------------------------------------
  successUrl: "https://votresite.com/merci",

  // ----------------------------------------------------------
  //  URL de redirection en cas d'annulation
  // ----------------------------------------------------------
  cancelUrl: "https://votresite.com/panier",

  // ----------------------------------------------------------
  //  Mode : "test" ou "live"
  // ----------------------------------------------------------
  mode: "test",

}

// ============================================================
//  Fonction utilitaire : charger le SDK Stripe dynamiquement
// ============================================================
export const loadStripeSDK = () => {
  return new Promise((resolve, reject) => {
    if (window.Stripe) return resolve(window.Stripe(stripeConfig.publishableKey))
    const script = document.createElement("script")
    script.src = "https://js.stripe.com/v3/"
    script.onload = () => resolve(window.Stripe(stripeConfig.publishableKey))
    script.onerror = reject
    document.head.appendChild(script)
  })
}
