<!-- ============================================================
  ListeProducts.vue
  src/components/ListeProducts.vue

  Utilisé dans deux contextes :
  1. Standalone : route /products  (page catalogue complète)
  2. Embedded   : dans Home.vue    (section catalogue du builder)
     → prop :embedded="true"
     → prop :preview-mode="true"  (mode preview / aperçu public)

  Fonctionnalités :
  - Charge les produits depuis Firestore (collection "products")
  - Upload image + Caméra pour ajouter un produit
  - Ajouter au panier → cartSession dans users/{uid}
  - Navigation vers Cart.vue
============================================================ -->

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter }            from "vue-router"
import { auth, db }             from "../firebase"
import { onAuthStateChanged }   from "firebase/auth"
import {
  collection, doc, getDoc, setDoc, addDoc,
  onSnapshot, deleteDoc, query, orderBy
} from "firebase/firestore"

import AddProduct from "./AddProduct.vue"

// ── Props ─────────────────────────────────────────────────────
const props = defineProps({
  embedded:    { type: Boolean, default: false },  // intégré dans le builder
  previewMode: { type: Boolean, default: false },  // mode aperçu (pas d'édition)
  sectionId:   { type: [String, Number], default: null },
})

const router = useRouter()

// ── State ─────────────────────────────────────────────────────
const uid          = ref(null)
const products     = ref([])
const loading      = ref(true)
const searchQuery  = ref("")
const cartCount    = ref(0)
const addedIds     = ref(new Set())
const showAddModal = ref(false)
const toast        = ref("")
const toastType    = ref("success")
let toastTimer     = null

let unsubProducts  = null
let unsubCart      = null

// ── Auth + chargement ─────────────────────────────────────────
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    uid.value = user ? user.uid : null
    loadProducts()
    if (user) listenCart(user.uid)
  })
})

onUnmounted(() => {
  unsubProducts?.()
  unsubCart?.()
})

// ── Charger produits ──────────────────────────────────────────
const loadProducts = () => {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"))
  unsubProducts = onSnapshot(q, (snap) => {
    products.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loading.value  = false
  }, () => { loading.value = false })
}

// ── Écouter cartSession (badge) ───────────────────────────────
const listenCart = (userId) => {
  unsubCart = onSnapshot(doc(db, "users", userId), (snap) => {
    const session   = snap.data()?.cartSession || []
    cartCount.value = session.reduce((s, i) => s + (i.qty || 1), 0)
  })
}

// ── Produits filtrés ──────────────────────────────────────────
const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return products.value
  const q = searchQuery.value.toLowerCase()
  return products.value.filter(p =>
    (p.name        || "").toLowerCase().includes(q) ||
    (p.description || "").toLowerCase().includes(q)
  )
})

// ── Supprimer produit ─────────────────────────────────────────
const deleteProduct = async (id) => {
  if (!confirm("Supprimer ce produit ?")) return
  await deleteDoc(doc(db, "products", id))
  showToast("Produit supprimé")
}

// ── Ajouter au panier → cartSession ──────────────────────────
const addToCart = async (product) => {
  const user = auth.currentUser
  if (!user) { showToast("Connectez-vous pour acheter", "error"); return }
  if (product.stock === 0) { showToast("Stock insuffisant", "error"); return }

  const userRef = doc(db, "users", user.uid)
  try {
    const snap        = await getDoc(userRef)
    let cartSession   = snap.exists() ? (snap.data().cartSession || []) : []
    const idx         = cartSession.findIndex(p => p.id === product.id)

    if (idx >= 0) {
      cartSession[idx].qty = (cartSession[idx].qty || 1) + 1
    } else {
      cartSession.push({
        id:          product.id,
        name:        product.name,
        price:       product.price,
        image:       product.image || "",
        description: product.description || "",
        qty:         1,
      })
    }

    await setDoc(userRef, { cartSession }, { merge: true })

    addedIds.value.add(product.id)
    showToast(`✓ ${product.name} ajouté`)
    setTimeout(() => { addedIds.value.delete(product.id) }, 1500)
  } catch(e) {
    showToast("Erreur panier", "error")
    console.error(e)
  }
}

// ── Navigation ────────────────────────────────────────────────
const goToCart = () => router.push("/cart")

// ── Toast ─────────────────────────────────────────────────────
const showToast = (msg, type = "success") => {
  clearTimeout(toastTimer)
  toast.value     = msg
  toastType.value = type
  toastTimer      = setTimeout(() => { toast.value = "" }, 2800)
}
</script>

<template>
<!-- Mode embedded (dans le builder Home.vue) -->
<div :class="['lp-root', { 'lp-embedded': embedded }]">

  <!-- ── TOPBAR (seulement en standalone) ────────────────── -->
  <header v-if="!embedded" class="lp-topbar">
    <div class="lp-topbar-left">
      <span>🛍️</span>
      <h1 class="lp-title">Catalogue</h1>
    </div>
    <div class="lp-topbar-right">
      <button class="lp-cart-btn" @click="goToCart">
        🛒
        <span v-if="cartCount > 0" class="lp-cart-badge">{{ cartCount }}</span>
      </button>
      <button v-if="uid" class="lp-add-btn" @click="showAddModal = true">
        ＋ Produit
      </button>
    </div>
  </header>

  <!-- ── TOOLBAR EMBEDDED (dans le builder, mode edit) ────── -->
  <div v-if="embedded && !previewMode" class="lp-embed-toolbar">
    <span class="lp-embed-label">🛍️ Catalogue produits (Firestore)</span>
    <button v-if="uid" class="lp-add-btn-sm" @click="showAddModal = true">
      ＋ Ajouter produit
    </button>
    <button class="lp-cart-btn-sm" @click="goToCart">
      🛒 <span v-if="cartCount > 0">({{ cartCount }})</span>
    </button>
  </div>

  <!-- ── SEARCH (standalone uniquement) ────────────────────── -->
  <div v-if="!embedded" class="lp-search">
    <input v-model="searchQuery" placeholder="🔍 Rechercher un produit..." class="lp-search-input"/>
    <button v-if="searchQuery" @click="searchQuery = ''" class="lp-search-clear">✕</button>
  </div>

  <!-- ── LOADING ────────────────────────────────────────────── -->
  <div v-if="loading" class="lp-loading">
    <div class="lp-spinner"></div>
  </div>

  <!-- ── VIDE ───────────────────────────────────────────────── -->
  <div v-else-if="filteredProducts.length === 0" class="lp-empty">
    <span>📦</span>
    <p>Aucun produit</p>
    <button v-if="uid && !previewMode" class="lp-add-btn" @click="showAddModal = true">
      ＋ Ajouter le premier produit
    </button>
  </div>

  <!-- ── GRILLE PRODUITS ────────────────────────────────────── -->
  <div v-else class="lp-grid" :class="{ 'lp-grid-embedded': embedded }">
    <div
      v-for="product in filteredProducts"
      :key="product.id"
      class="lp-card"
    >
      <!-- Image -->
      <div class="lp-card-img">
        <img v-if="product.image" :src="product.image" :alt="product.name"/>
        <span v-else>🛍️</span>
        <span v-if="product.badge" class="lp-badge">{{ product.badge }}</span>
        <!-- Supprimer (edit mode uniquement) -->
        <button
          v-if="uid && !previewMode"
          class="lp-del-btn"
          @click.stop="deleteProduct(product.id)"
          title="Supprimer"
        >✕</button>
      </div>

      <!-- Body -->
      <div class="lp-card-body">
        <div class="lp-card-name">{{ product.name }}</div>
        <div v-if="product.description" class="lp-card-desc">{{ product.description }}</div>
        <div class="lp-card-footer">
          <span class="lp-card-price">{{ product.price }} €</span>
          <span v-if="product.stock === 0" class="lp-out-stock">Rupture</span>
          <span v-else-if="product.stock !== null && product.stock !== undefined" class="lp-in-stock">
            {{ product.stock }} en stock
          </span>
        </div>
        <button
          class="lp-buy-btn"
          :class="{ added: addedIds.has(product.id) }"
          @click="addToCart(product)"
          :disabled="product.stock === 0"
        >
          <span>{{ addedIds.has(product.id) ? '✓ Ajouté' : '🛒 Ajouter' }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ── MODAL AJOUT PRODUIT ────────────────────────────────── -->
  <AddProduct
    v-if="showAddModal"
    @close="showAddModal = false"
  />

  <!-- ── TOAST ──────────────────────────────────────────────── -->
  <Transition name="lp-toast">
    <div v-if="toast" class="lp-toast" :class="toastType">{{ toast }}</div>
  </Transition>

</div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}

/* ROOT */
.lp-root{font-family:'DM Sans',sans-serif;color:#374151;background:#fafafa;min-height:100px}
.lp-embedded{padding:12px;background:#fafafa;border-radius:8px}

/* TOPBAR (standalone) */
.lp-topbar{background:white;border-bottom:1px solid #e5e7eb;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;box-shadow:0 1px 6px rgba(0,0,0,.06)}
.lp-topbar-left{display:flex;align-items:center;gap:8px}
.lp-title{font-size:18px;font-weight:700;color:#1a1a2e}
.lp-topbar-right{display:flex;align-items:center;gap:8px}
.lp-cart-btn{position:relative;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:7px 12px;font-size:16px;cursor:pointer;transition:all .15s}
.lp-cart-btn:hover{background:#ede9fe;border-color:#6c63ff}
.lp-cart-badge{position:absolute;top:-5px;right:-5px;background:#6c63ff;color:white;font-size:9px;font-weight:700;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.lp-add-btn{background:#6c63ff;color:white;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.lp-add-btn:hover{background:#5b52ee}

/* TOOLBAR EMBEDDED */
.lp-embed-toolbar{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#1f1f23;border-radius:8px 8px 0 0;margin-bottom:0}
.lp-embed-label{font-size:11px;font-weight:600;color:#8a8a9a;text-transform:uppercase;letter-spacing:.5px;flex:1}
.lp-add-btn-sm{background:#6c63ff;color:white;border:none;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
.lp-cart-btn-sm{background:#2a2a2f;color:#8a8a9a;border:1px solid #35353c;border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.lp-cart-btn-sm:hover{border-color:#6c63ff;color:#6c63ff}

/* SEARCH */
.lp-search{padding:10px 16px;display:flex;align-items:center;gap:8px;background:white;border-bottom:1px solid #e5e7eb}
.lp-search-input{flex:1;padding:9px 14px;border:1px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .15s}
.lp-search-input:focus{border-color:#6c63ff}
.lp-search-clear{background:none;border:none;color:#9ca3af;cursor:pointer;font-size:14px;padding:4px 8px;border-radius:6px}
.lp-search-clear:hover{background:#f3f4f6;color:#374151}

/* LOADING / EMPTY */
.lp-loading{display:flex;justify-content:center;padding:32px}
.lp-spinner{width:28px;height:28px;border:3px solid #e5e7eb;border-top-color:#6c63ff;border-radius:50%;animation:lp-spin .7s linear infinite}
@keyframes lp-spin{to{transform:rotate(360deg)}}
.lp-empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:32px 16px;color:#9ca3af;text-align:center}
.lp-empty span{font-size:36px;opacity:.5}
.lp-empty p{font-size:14px}

/* GRILLE */
.lp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:12px}
.lp-grid-embedded{grid-template-columns:repeat(2,1fr)}
@media(min-width:500px){.lp-grid{grid-template-columns:repeat(3,1fr)}}
@media(min-width:700px){.lp-grid{grid-template-columns:repeat(4,1fr)}}

/* CARD */
.lp-card{background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;transition:transform .2s,box-shadow .2s;display:flex;flex-direction:column}
.lp-card:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.08)}
.lp-card-img{position:relative;aspect-ratio:1;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:32px;overflow:hidden}
.lp-card-img img{width:100%;height:100%;object-fit:cover;display:block}
.lp-badge{position:absolute;top:6px;left:6px;background:#fef3c7;color:#92400e;font-size:9px;font-weight:700;padding:2px 7px;border-radius:100px;text-transform:uppercase}
.lp-del-btn{position:absolute;top:6px;right:6px;background:rgba(0,0,0,.55);color:white;border:none;width:20px;height:20px;border-radius:50%;cursor:pointer;font-size:9px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s}
.lp-card:hover .lp-del-btn{opacity:1}
.lp-card-body{padding:10px;display:flex;flex-direction:column;gap:4px;flex:1}
.lp-card-name{font-size:13px;font-weight:600;color:#111;line-height:1.3}
.lp-card-desc{font-size:11px;color:#6b7280;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lp-card-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px;margin-top:auto}
.lp-card-price{font-size:15px;font-weight:700;color:#6c63ff}
.lp-in-stock{font-size:10px;color:#10b981;font-weight:600}
.lp-out-stock{font-size:10px;color:#ef4444;font-weight:600}
.lp-buy-btn{width:100%;padding:8px;background:#6c63ff;color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;margin-top:6px;display:flex;align-items:center;justify-content:center;gap:5px}
.lp-buy-btn.added{background:#10b981}
.lp-buy-btn:hover:not(:disabled){background:#5b52ee}
.lp-buy-btn:disabled{opacity:.5;cursor:not-allowed}

/* TOAST */
.lp-toast{position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:white;padding:9px 20px;border-radius:100px;font-size:12px;font-weight:500;z-index:9999;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.3);pointer-events:none}
.lp-toast.error{background:#ef4444}
.lp-toast-enter-active,.lp-toast-leave-active{transition:all .3s ease}
.lp-toast-enter-from,.lp-toast-leave-to{opacity:0;transform:translateX(-50%) translateY(10px)}
</style>
