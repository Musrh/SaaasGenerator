<!-- ============================================================
  Home.vue — Page Catalogue Produits
  
  Fonctionnalités :
  - Liste des produits depuis Firestore (collection products)
  - Ajouter un produit : via Upload image OU Caméra
  - Champs : nom, prix, description, badge, stock
  - Bouton "Ajouter au panier" → cartSession dans Firestore
  - Navigation vers Cart.vue
  - Indicateur panier live (nb articles)
============================================================ -->

<template>
  <div class="home-root">

    <!-- ── TOPBAR ─────────────────────────────────────────── -->
    <header class="topbar">
      <div class="topbar-left">
        <span class="topbar-logo">🛍️</span>
        <h1 class="topbar-title">Catalogue</h1>
      </div>
      <div class="topbar-right">
        <!-- Bouton Panier avec badge -->
        <button class="cart-btn" @click="goToCart">
          🛒
          <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
        </button>
        <!-- Bouton Ajouter produit -->
        <button class="add-btn" @click="showAddModal = true">
          ＋ Produit
        </button>
      </div>
    </header>

    <!-- ── RECHERCHE ──────────────────────────────────────── -->
    <div class="search-bar">
      <input
        v-model="searchQuery"
        placeholder="🔍 Rechercher un produit..."
        class="search-input"
      />
    </div>

    <!-- ── LOADING ────────────────────────────────────────── -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Chargement des produits...</p>
    </div>

    <!-- ── LISTE PRODUITS ─────────────────────────────────── -->
    <div v-else class="products-grid">

      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-card"
      >
        <!-- Image produit -->
        <div class="product-img-wrap">
          <img
            v-if="product.image"
            :src="product.image"
            :alt="product.name"
            class="product-img"
          />
          <div v-else class="product-img-ph">🛍️</div>
          <span v-if="product.badge" class="product-badge">{{ product.badge }}</span>
          <!-- Supprimer produit -->
          <button
            v-if="uid"
            class="product-del"
            @click.stop="deleteProduct(product.id)"
            title="Supprimer"
          >✕</button>
        </div>

        <!-- Infos produit -->
        <div class="product-body">
          <h3 class="product-name">{{ product.name }}</h3>
          <p v-if="product.description" class="product-desc">{{ product.description }}</p>
          <div class="product-footer">
            <span class="product-price">{{ product.price }} €</span>
            <div class="product-stock" v-if="product.stock !== undefined">
              <span :class="product.stock > 0 ? 'in-stock' : 'out-stock'">
                {{ product.stock > 0 ? `${product.stock} en stock` : 'Rupture' }}
              </span>
            </div>
          </div>
          <button
            class="add-cart-btn"
            @click="addToCart(product)"
            :disabled="product.stock === 0"
          >
            <span>🛒</span>
            {{ addedIds.has(product.id) ? 'Ajouté ✓' : 'Ajouter au panier' }}
          </button>
        </div>
      </div>

      <!-- Aucun produit -->
      <div v-if="filteredProducts.length === 0 && !loading" class="empty-state">
        <span>📦</span>
        <p>Aucun produit trouvé</p>
        <button class="add-btn" @click="showAddModal = true">
          ＋ Ajouter le premier produit
        </button>
      </div>

    </div>

    <!-- ── MODAL AJOUT PRODUIT ─────────────────────────────── -->
    <Transition name="modal">
      <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
        <div class="modal-box">
          <button class="modal-close" @click="closeAddModal">✕</button>
          <h2 class="modal-title">{{ editingProduct ? '✏️ Modifier' : '➕ Nouveau produit' }}</h2>

          <!-- Image : Upload ou Caméra -->
          <div class="img-section">
            <div class="img-preview-wrap">
              <img v-if="newProduct.image" :src="newProduct.image" class="img-preview" />
              <div v-else class="img-placeholder">📷</div>
            </div>
            <div class="img-btns">
              <!-- Upload fichier -->
              <label class="img-btn upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  @change="onFileUpload"
                  hidden
                />
                📁 Upload
              </label>
              <!-- Caméra -->
              <label class="img-btn camera-btn">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  @change="onFileUpload"
                  hidden
                />
                📷 Caméra
              </label>
              <!-- Supprimer image -->
              <button
                v-if="newProduct.image"
                class="img-btn remove-btn"
                @click="newProduct.image = ''"
              >🗑</button>
            </div>
          </div>

          <!-- Champs produit -->
          <div class="form-fields">
            <div class="field">
              <label>Nom *</label>
              <input v-model="newProduct.name" placeholder="Nom du produit" class="field-input" />
            </div>
            <div class="field">
              <label>Prix (€) *</label>
              <input v-model.number="newProduct.price" type="number" min="0" step="0.01" placeholder="0.00" class="field-input" />
            </div>
            <div class="field">
              <label>Description</label>
              <textarea v-model="newProduct.description" placeholder="Description courte..." class="field-input field-textarea" rows="2"></textarea>
            </div>
            <div class="field-row">
              <div class="field">
                <label>Badge</label>
                <input v-model="newProduct.badge" placeholder="Ex: Nouveau, Promo..." class="field-input" />
              </div>
              <div class="field">
                <label>Stock</label>
                <input v-model.number="newProduct.stock" type="number" min="0" placeholder="Qté" class="field-input" />
              </div>
            </div>
          </div>

          <p v-if="addError" class="form-error">{{ addError }}</p>

          <div class="modal-actions">
            <button class="btn-cancel" @click="closeAddModal">Annuler</button>
            <button class="btn-save" @click="saveProduct" :disabled="saving">
              <span v-if="saving" class="spinner-sm"></span>
              {{ saving ? 'Sauvegarde...' : (editingProduct ? 'Modifier' : 'Ajouter') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── TOAST ──────────────────────────────────────────── -->
    <Transition name="toast">
      <div v-if="toast" class="toast" :class="toastType">{{ toast }}</div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  collection, doc, getDoc, setDoc, addDoc,
  onSnapshot, deleteDoc, query, orderBy
} from "firebase/firestore"

const router = useRouter()

// ── State ─────────────────────────────────────────────────────
const uid         = ref(null)
const products    = ref([])
const loading     = ref(true)
const searchQuery = ref("")
const cartCount   = ref(0)
const addedIds    = ref(new Set())

// Modal ajout produit
const showAddModal   = ref(false)
const editingProduct = ref(null)
const saving         = ref(false)
const addError       = ref("")
const newProduct     = ref({ name: "", price: 0, description: "", badge: "", stock: undefined, image: "" })

// Toast
const toast     = ref("")
const toastType = ref("success")
let toastTimer  = null

let unsubProducts = null
let unsubCart     = null

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

// ── Charger produits depuis Firestore (collection products) ───
const loadProducts = () => {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"))
  unsubProducts = onSnapshot(q, (snap) => {
    products.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loading.value  = false
  }, () => { loading.value = false })
}

// ── Écouter cartSession pour le badge ─────────────────────────
const listenCart = (userId) => {
  const userRef = doc(db, "users", userId)
  unsubCart = onSnapshot(userRef, (snap) => {
    const session = snap.data()?.cartSession || []
    cartCount.value = session.reduce((s, i) => s + (i.qty || 1), 0)
  })
}

// ── Produits filtrés ──────────────────────────────────────────
const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  const q = searchQuery.value.toLowerCase()
  return products.value.filter(p =>
    (p.name || "").toLowerCase().includes(q) ||
    (p.description || "").toLowerCase().includes(q)
  )
})

// ── Upload image (fichier ou caméra) ──────────────────────────
const onFileUpload = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => { newProduct.value.image = ev.target.result }
  reader.readAsDataURL(file)
  e.target.value = "" // reset input
}

// ── Sauvegarder produit dans Firestore ────────────────────────
const saveProduct = async () => {
  addError.value = ""
  if (!newProduct.value.name.trim()) { addError.value = "Nom obligatoire."; return }
  if (!newProduct.value.price || newProduct.value.price <= 0) { addError.value = "Prix invalide."; return }
  if (!uid.value) { addError.value = "Connectez-vous d'abord."; return }

  saving.value = true
  try {
    const data = {
      name:        newProduct.value.name.trim(),
      price:       Number(newProduct.value.price),
      description: newProduct.value.description.trim(),
      badge:       newProduct.value.badge.trim(),
      stock:       newProduct.value.stock !== undefined ? Number(newProduct.value.stock) : null,
      image:       newProduct.value.image || "",
      createdBy:   uid.value,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    }
    if (editingProduct.value) {
      await setDoc(doc(db, "products", editingProduct.value), data, { merge: true })
      showToast("Produit modifié ✓")
    } else {
      await addDoc(collection(db, "products"), data)
      showToast("Produit ajouté ✓")
    }
    closeAddModal()
  } catch(e) {
    addError.value = "Erreur : " + e.message
  } finally {
    saving.value = false
  }
}

// ── Supprimer produit ─────────────────────────────────────────
const deleteProduct = async (productId) => {
  if (!confirm("Supprimer ce produit ?")) return
  try {
    await deleteDoc(doc(db, "products", productId))
    showToast("Produit supprimé")
  } catch(e) { showToast("Erreur suppression", "error") }
}

// ── Ajouter au panier (cartSession dans users/{uid}) ──────────
const addToCart = async (product) => {
  const user = auth.currentUser
  if (!user) { showToast("Connectez-vous d'abord", "error"); return }
  if (product.stock === 0) { showToast("Stock insuffisant", "error"); return }

  const userRef = doc(db, "users", user.uid)
  try {
    const snap = await getDoc(userRef)
    let cartSession = snap.exists() ? (snap.data().cartSession || []) : []

    const idx = cartSession.findIndex(p => p.id === product.id)
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

    // Feedback visuel temporaire
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

// ── Modal ─────────────────────────────────────────────────────
const closeAddModal = () => {
  showAddModal.value   = false
  editingProduct.value = null
  addError.value       = ""
  newProduct.value     = { name: "", price: 0, description: "", badge: "", stock: undefined, image: "" }
}

// ── Toast ─────────────────────────────────────────────────────
const showToast = (msg, type = "success") => {
  clearTimeout(toastTimer)
  toast.value     = msg
  toastType.value = type
  toastTimer = setTimeout(() => { toast.value = "" }, 2800)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}

.home-root{min-height:100vh;background:#f8f9fa;font-family:'DM Sans',sans-serif;color:#374151}

/* TOPBAR */
.topbar{background:white;border-bottom:1px solid #e5e7eb;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.topbar-left{display:flex;align-items:center;gap:10px}
.topbar-logo{font-size:24px}
.topbar-title{font-family:'Playfair Display',serif;font-size:20px;color:#1a1a2e;font-weight:600}
.topbar-right{display:flex;align-items:center;gap:10px}
.cart-btn{position:relative;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:10px;padding:8px 14px;font-size:18px;cursor:pointer;transition:all .15s}
.cart-btn:hover{background:#ede9fe;border-color:#6c63ff}
.cart-badge{position:absolute;top:-6px;right:-6px;background:#6c63ff;color:white;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.add-btn{background:#6c63ff;color:white;border:none;border-radius:10px;padding:8px 16px;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.add-btn:hover{background:#5b52ee;transform:translateY(-1px)}

/* SEARCH */
.search-bar{padding:16px 20px}
.search-input{width:100%;padding:11px 16px;border:1px solid #e5e7eb;border-radius:12px;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;background:white;transition:border-color .15s}
.search-input:focus{border-color:#6c63ff;box-shadow:0 0 0 3px rgba(108,99,255,.1)}

/* LOADING */
.loading-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:16px;color:#6b7280}
.spinner{width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#6c63ff;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* PRODUCTS GRID */
.products-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;padding:0 16px 80px}
@media(min-width:600px){.products-grid{grid-template-columns:repeat(3,1fr)}}
@media(min-width:900px){.products-grid{grid-template-columns:repeat(4,1fr)}}

/* PRODUCT CARD */
.product-card{background:white;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.05);transition:transform .2s,box-shadow .2s;display:flex;flex-direction:column}
.product-card:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.1)}
.product-img-wrap{position:relative;aspect-ratio:1}
.product-img{width:100%;height:100%;object-fit:cover;display:block}
.product-img-ph{width:100%;height:100%;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:40px}
.product-badge{position:absolute;top:8px;left:8px;background:#fef3c7;color:#92400e;font-size:9px;font-weight:700;padding:3px 8px;border-radius:100px;text-transform:uppercase;letter-spacing:.5px}
.product-del{position:absolute;top:8px;right:8px;background:rgba(0,0,0,.5);color:white;border:none;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s}
.product-card:hover .product-del{opacity:1}
.product-body{padding:12px;display:flex;flex-direction:column;gap:6px;flex:1}
.product-name{font-size:14px;font-weight:600;color:#111;line-height:1.3}
.product-desc{font-size:12px;color:#6b7280;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.product-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px;margin-top:auto}
.product-price{font-size:16px;font-weight:700;color:#6c63ff}
.in-stock{font-size:10px;color:#10b981;font-weight:600}
.out-stock{font-size:10px;color:#ef4444;font-weight:600}
.add-cart-btn{width:100%;padding:9px;background:#6c63ff;color:white;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px;margin-top:8px}
.add-cart-btn:hover:not(:disabled){background:#5b52ee}
.add-cart-btn:disabled{opacity:.5;cursor:not-allowed}

/* EMPTY */
.empty-state{grid-column:1/-1;text-align:center;padding:60px 20px;display:flex;flex-direction:column;align-items:center;gap:14px;color:#6b7280}
.empty-state span{font-size:48px;opacity:.5}

/* MODAL */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:500;display:flex;align-items:flex-end;justify-content:center;padding:0}
@media(min-width:600px){.modal-overlay{align-items:center;padding:20px}}
.modal-box{background:white;border-radius:20px 20px 0 0;padding:24px 20px;width:100%;max-width:480px;max-height:92vh;overflow-y:auto}
@media(min-width:600px){.modal-box{border-radius:20px;max-height:90vh}}
.modal-close{position:absolute;top:16px;right:16px;background:#f3f4f6;border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center}
.modal-title{font-family:'Playfair Display',serif;font-size:20px;color:#1a1a2e;margin-bottom:16px}
.modal-overlay .modal-box{position:relative}

/* IMAGE SECTION */
.img-section{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.img-preview-wrap{width:80px;height:80px;border-radius:12px;overflow:hidden;border:2px solid #e5e7eb;flex-shrink:0;background:#f3f4f6;display:flex;align-items:center;justify-content:center}
.img-preview{width:100%;height:100%;object-fit:cover}
.img-placeholder{font-size:28px;color:#9ca3af}
.img-btns{display:flex;flex-wrap:wrap;gap:8px}
.img-btn{display:flex;align-items:center;gap:4px;padding:7px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;border:none;transition:all .15s}
.upload-btn{background:#ede9fe;color:#6c63ff}
.upload-btn:hover{background:#ddd6fe}
.camera-btn{background:#ecfdf5;color:#059669}
.camera-btn:hover{background:#d1fae5}
.remove-btn{background:#fef2f2;color:#ef4444}
.remove-btn:hover{background:#fee2e2}

/* FORM */
.form-fields{display:flex;flex-direction:column;gap:12px;margin-bottom:16px}
.field{display:flex;flex-direction:column;gap:4px}
.field label{font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
.field-input{padding:10px 14px;border:1px solid #e5e7eb;border-radius:9px;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;color:#374151;transition:border-color .15s}
.field-input:focus{border-color:#6c63ff}
.field-textarea{resize:none}
.field-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.form-error{color:#ef4444;font-size:12px;padding:8px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:8px}
.modal-actions{display:flex;gap:10px}
.btn-cancel{flex:1;padding:12px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;font-size:14px;font-family:'DM Sans',sans-serif;color:#374151}
.btn-save{flex:2;padding:12px;background:#6c63ff;color:white;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px}
.btn-save:disabled{opacity:.6;cursor:not-allowed}
.spinner-sm{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .6s linear infinite}

/* TRANSITION MODAL */
.modal-enter-active,.modal-leave-active{transition:all .25s ease}
.modal-enter-from,.modal-leave-to{opacity:0;transform:translateY(30px)}
@media(min-width:600px){
  .modal-enter-from,.modal-leave-to{transform:scale(.95);transform:none;opacity:0}
}

/* TOAST */
.toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:white;padding:10px 22px;border-radius:100px;font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif;z-index:9999;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.3)}
.toast.error{background:#ef4444}
.toast-enter-active,.toast-leave-active{transition:all .3s ease}
.toast-enter-from,.toast-leave-to{opacity:0;transform:translateX(-50%) translateY(12px)}
</style>
