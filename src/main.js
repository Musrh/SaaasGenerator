// ============================================================
//  SaaasGenerator/src/main.js
//  ⚠️  Ce fichier REMPLACE votre main.js existant
//  Chemin : SaaasGenerator/src/main.js
// ============================================================

import { createApp } from "vue"
import App    from "./App.vue"
import router from "./router.js"

const app = createApp(App)
app.use(router)

// ── Détection automatique du retour Stripe ───────────────────
// Stripe redirige vers l'URL racine car il supprime le fragment #
// On détecte au démarrage si une commande est en attente
// via localStorage et on redirige vers /payment-success
router.isReady().then(() => {
  const pending = localStorage.getItem("pendingStripeOrder")
  const route   = router.currentRoute.value

  if (pending && route.name === "home") {
    try {
      const order = JSON.parse(pending)
      // Vérifier que la commande date de moins de 30 minutes
      const age = Date.now() - new Date(order.createdAt).getTime()
      if (age < 30 * 60 * 1000) {
        router.push({ name: "payment-success" })
      } else {
        // Trop ancienne → nettoyer
        localStorage.removeItem("pendingStripeOrder")
        localStorage.removeItem("stripeOwnerUid")
        localStorage.removeItem("stripeSiteSlug")
      }
    } catch (e) {
      localStorage.removeItem("pendingStripeOrder")
    }
  }
})

app.mount("#app")
