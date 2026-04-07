// ============================================================
//  router.js — SaaasGenerator
//  Vue Router avec la route /site/:uid (slug ou UID Firestore)
// ============================================================

import { createRouter, createWebHashHistory } from "vue-router"
import Home        from "./views/Home.vue"
import SiteViewer  from "./views/SiteViewer.vue"
import NotFound    from "./views/NotFound.vue"

import Success from "./views/Paymentsuccess.vue"
import Orders from "./views/Orders.vue"

import Cart from "./views/Cart.vue"
const routes = [

  // ── Page d'accueil de SaaasGenerator ──────────────────────
  {
    path: "/",
    name: "home",
    component: Home,
  },

  {
    path: "/cart",
    component: Cart
  },
  {
    path: "/success",
    component: Success 
  },

  // ── Affichage d'un site publié ────────────────────────────
  // :uid peut être :
  //   • un UID Firestore réel   → ex: n8xPVQ87HfYECHlIkAqB0vssCIp2
  //   • un slug convivial       → ex: ma-boutique
  // SiteViewer résout les deux cas automatiquement.
  {
    path: "/site/:uid",
    name: "site",
    component: SiteViewer,
    props: true,          // passe uid comme prop au composant
  },

  // ── Pages résultat paiement client du store ───────────────
  { path: "/payment-success", name: "payment-success",
    component: () => import("./views/Paymentsuccess.vue") },
  { path: "/payment-cancel",  name: "payment-cancel",
    component: () => import("./views/Paymentcancel.vue")  },

  
  {
    path: "/orders",
    name: "Orders",
    component: Orders
  }

  

]

const router = createRouter({
  history: createWebHashHistory(), // utilise le mode Hash (#/)
  routes,
})

export default router
