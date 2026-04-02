// ============================================================
//  SaaasGenerator/src/router.js
//  Router du BUILDER (SaaasGenerator)
// ============================================================
import { createRouter, createWebHashHistory } from "vue-router"
import Home       from "./views/Home.vue"
import SiteViewer from "./views/SiteViewer.vue"
import Orders     from "./views/Orders.vue"
import NotFound   from "./views/NotFound.vue"

const routes = [
  // ── Builder principal (Home = SaasBuilder.vue) ─────────────
  { path: "/",          name: "home",   component: Home       },

  // ── Site publié — accès par UID Firestore ou slug ──────────
  // ex: /#/site/n8xPVQ87...  ou  /#/site/ma-boutique
  { path: "/site/:uid", name: "site",   component: SiteViewer, props: true },

  // ── Commandes du store (propriétaire connecté) ─────────────
  { path: "/orders",    name: "orders", component: Orders     },

  // ── 404 ───────────────────────────────────────────────────
  { path: "/:pathMatch(.*)*", name: "not-found", component: NotFound },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
