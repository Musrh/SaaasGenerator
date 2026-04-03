// ============================================================
//  SaaasGenerator/src/main.js
//  Remplace TOUT le contenu de votre main.js existant
// ============================================================
import { createApp } from "vue"
import App    from "./App.vue"
import router from "./router.js"

const app = createApp(App)
app.use(router)

// ── Détection retour Stripe ───────────────────────────────────
// Stripe redirige vers l'URL racine (il supprime le #fragment)
// On détecte au démarrage via localStorage et on redirige
router.isReady().then(() => {
  const pending = localStorage.getItem("pendingStripeOrder")
  if (pending && router.currentRoute.value.name === "home") {
    try {
      const order = JSON.parse(pending)
      const age   = Date.now() - new Date(order.createdAt).getTime()
      if (age < 30 * 60 * 1000) {   // moins de 30 minutes
        router.replace({ name: "payment-success" })
      } else {
        localStorage.removeItem("pendingStripeOrder")
        localStorage.removeItem("stripeOwnerUid")
        localStorage.removeItem("stripeSiteSlug")
      }
    } catch(e) {
      localStorage.removeItem("pendingStripeOrder")
    }
  }
})

app.mount("#app")
