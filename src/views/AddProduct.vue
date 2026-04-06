<!-- ============================================================
  Cart.vue — Page Panier
  
  Flux :
  1. Lit cartSession depuis users/{uid} (live via onSnapshot)
  2. Modifier quantités / supprimer articles
  3. Clic "Payer" → Stripe Checkout via backend
  4. Retour Stripe → PaymentSuccess.vue
     → saveOrder() écrit dans :
       a. users/{uid}/orders/{id}   (dashboard propriétaire)
       b. orders/{id}               (collection globale)
  5. CartSession vidée après paiement
============================================================ -->

<template>
  <div class="cart-root">

    <!-- ── HEADER ─────────────────────────────────────────── -->
    <header class="cart-header">
      <button class="back-btn" @click="$router.push('/')">← Retour</button>
      <h1 class="cart-title">🛒 Mon panier</h1>
      <span class="cart-header-count">{{ cartCount }} article{{ cartCount > 1 ? 's' : '' }}</span>
    </header>

    <!-- ── NON CONNECTÉ ────────────────────────────────────── -->
    <div v-if="!uid" class="state-empty">
      <span>🔐</span>
      <p>Connectez-vous pour voir votre panier</p>
      <button class="btn-primary" @click="$router.push('/auth')">Se connecter</button>
    </div>

    <!-- ── PANIER VIDE ──────────────────────────────────────── -->
    <div v-else-if="cart.length === 0 && !loading" class="state-empty">
      <span>🛍️</span>
      <p>Votre panier est vide</p>
      <button class="btn-primary" @click="$router.push('/')">Voir les produits</button>
    </div>

    <!-- ── LOADING ────────────────────────────────────────── -->
    <div v-else-if="loading" class="state-loading">
      <div class="spinner"></div>
      <p>Chargement...</p>
    </div>

    <!-- ── CONTENU PANIER ─────────────────────────────────── -->
    <div v-else class="cart-content">

      <!-- Liste articles -->
      <div class="cart-items">
        <div
          v-for="(item, index) in cart"
          :key="item.id || index"
          class="cart-item"
        >
          <!-- Image -->
          <div class="item-img">
            <img v-if="item.image" :src="item.image" :alt="item.name"/>
            <span v-else>🛍️</span>
          </div>

          <!-- Infos -->
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-price">{{ item.price }} €</div>
          </div>

          <!-- Quantité -->
          <div class="item-qty">
            <button class="qty-btn" @click="updateQty(index, item.qty - 1)" :disabled="item.qty <= 1">−</button>
            <span class="qty-val">{{ item.qty }}</span>
            <button class="qty-btn" @click="updateQty(index, item.qty + 1)">+</button>
          </div>

          <!-- Sous-total -->
          <div class="item-subtotal">{{ (item.price * item.qty).toFixed(2) }} €</div>

          <!-- Supprimer -->
          <button class="item-del" @click="removeItem(index)">✕</button>
        </div>
      </div>

      <!-- ── RÉCAPITULATIF ───────────────────────────────── -->
      <div class="cart-summary">

        <div class="summary-rows">
          <div class="summary-row">
            <span>Sous-total</span>
            <span>{{ total.toFixed(2) }} €</span>
          </div>
          <div class="summary-row">
            <span>Livraison</span>
            <span class="free-shipping">Gratuite</span>
          </div>
          <div class="summary-row total-row">
            <span>Total</span>
            <strong>{{ total.toFixed(2) }} €</strong>
          </div>
        </div>

        <!-- Infos client pour la commande -->
        <div class="customer-fields">
          <label>Votre nom *</label>
          <input v-model="customerName" placeholder="Nom complet" class="cust-input"/>
          <label>Votre email *</label>
          <input v-model="customerEmail" placeholder="Email" type="email" class="cust-input"/>
        </div>

        <p v-if="payError" class="pay-error">⚠ {{ payError }}</p>

        <!-- Bouton paiement Stripe -->
        <button
          class="pay-btn"
          @click="payWithStripe"
          :disabled="cart.length === 0 || paying"
        >
          <span v-if="paying" class="spinner-sm"></span>
          <span v-else>💳</span>
          {{ paying ? "Redirection Stripe..." : `Payer ${total.toFixed(2)} €` }}
        </button>

        <!-- Vider le panier -->
        <button class="clear-btn" @click="clearCart">Vider le panier</button>

      </div>
    </div>

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
  doc, onSnapshot, updateDoc, setDoc,
  collection, addDoc
} from "firebase/firestore"

const router = useRouter()

// ── State ─────────────────────────────────────────────────────
const uid           = ref(null)
const cart          = ref([])
const loading       = ref(true)
const paying        = ref(false)
const payError      = ref("")
const customerName  = ref("")
const customerEmail = ref("")
const toast         = ref("")
const toastType     = ref("success")

let userRef    = null
let unsubCart  = null
let toastTimer = null

// ── Computed ──────────────────────────────────────────────────
const total = computed(() =>
  cart.value.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0)
)

const cartCount = computed(() =>
  cart.value.reduce((s, i) => s + (i.qty || 1), 0)
)

// ── Auth + écoute cartSession ──────────────────────────────────
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      uid.value     = null
      cart.value    = []
      loading.value = false
      return
    }
    uid.value = user.uid
    userRef   = doc(db, "users", user.uid)

    // Écoute en temps réel de cartSession
    unsubCart = onSnapshot(userRef, (snap) => {
      cart.value    = snap.data()?.cartSession || []
      loading.value = false
    })
  })
})

onUnmounted(() => { unsubCart?.() })

// ── Modifier quantité ─────────────────────────────────────────
const updateQty = async (index, qty) => {
  if (qty < 1) return
  const updated          = JSON.parse(JSON.stringify(cart.value))
  updated[index].qty     = qty
  await updateDoc(userRef, { cartSession: updated })
}

// ── Supprimer article ─────────────────────────────────────────
const removeItem = async (index) => {
  const updated = JSON.parse(JSON.stringify(cart.value))
  updated.splice(index, 1)
  await updateDoc(userRef, { cartSession: updated })
  showToast("Article retiré")
}

// ── Vider le panier ───────────────────────────────────────────
const clearCart = async () => {
  if (!confirm("Vider le panier ?")) return
  await updateDoc(userRef, { cartSession: [] })
  showToast("Panier vidé")
}

// ── Paiement Stripe Checkout ──────────────────────────────────
const payWithStripe = async () => {
  if (!customerName.value.trim() || !customerEmail.value.trim()) {
    payError.value = "Nom et email obligatoires."; return
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.value)
  if (!emailOk) { payError.value = "Email invalide."; return }

  paying.value   = true
  payError.value = ""

  try {
    // Sauvegarder la commande en localStorage AVANT le redirect
    // (Stripe efface tout ce qui est après # dans l'URL)
    const pendingOrder = {
      items:         cart.value.map(i => ({
        id: i.id, name: i.name, price: i.price,
        image: i.image || "", qty: i.qty,
      })),
      total:         total.value.toFixed(2),
      currency:      "eur",
      itemCount:     cartCount.value,
      customerName:  customerName.value.trim(),
      customerEmail: customerEmail.value.trim().toLowerCase(),
      ownerUid:      uid.value,
      siteSlug:      uid.value,
      provider:      "stripe",
      createdAt:     new Date().toISOString(),
    }
    localStorage.setItem("pendingStripeOrder", JSON.stringify(pendingOrder))
    localStorage.setItem("stripeOwnerUid",     uid.value)

    // URL de retour — simple sans fragment
    const origin     = window.location.origin + window.location.pathname
    const successUrl = `${origin}`   // main.js détecte pendingStripeOrder au boot
    const cancelUrl  = `${origin}`

    // Appel backend Stripe
    const BACKEND = "https://backend-master-production-cf50.up.railway.app"
    const res = await fetch(`${BACKEND}/create-stripe-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items:       cart.value.map(i => ({
          nom:      i.name,
          prix:     i.price,
          quantity: i.qty,
        })),
        email:       customerEmail.value,
        clientId:    uid.value,
        plan:        "store-order",
        storeName:   "Ma Boutique",
        successUrl,
        cancelUrl,
      }),
    })

    if (!res.ok) throw new Error("Erreur serveur " + res.status)
    const data = await res.json()

    if (!data.url) throw new Error(data.error || "Pas d'URL Stripe")

    // Redirect vers Stripe Checkout
    window.location.href = data.url

  } catch(e) {
    payError.value = e.message
    paying.value   = false
  }
}

// ── Sauvegarder commande Firestore ────────────────────────────
// Appelé depuis PaymentSuccess.vue après retour de Stripe
// OU directement ici si paiement sans redirect (ex: test)
const saveOrder = async (orderData) => {
  if (!uid.value) return
  try {
    const order = {
      ...orderData,
      storeUid:  uid.value,
      ownerUid:  uid.value,
      clientId:  uid.value,
      status:    "paid",
      createdAt: orderData.createdAt || new Date().toISOString(),
    }

    // 1. users/{uid}/orders/  → visible dans Orders.vue
    await addDoc(collection(db, "users", uid.value, "orders"), order)

    // 2. orders/ (collection racine) → compatible webhook Stripe
    await addDoc(collection(db, "orders"), order)

    // 3. Vider cartSession
    await updateDoc(userRef, { cartSession: [] })

    showToast("✓ Commande enregistrée !")
    console.log("✅ Order saved for uid:", uid.value)
  } catch(e) {
    console.error("Order save error:", e)
    showToast("Erreur sauvegarde commande", "error")
  }
}

// Exposer saveOrder pour PaymentSuccess.vue si besoin
defineExpose({ saveOrder })

// ── Toast ─────────────────────────────────────────────────────
const showToast = (msg, type = "success") => {
  clearTimeout(toastTimer)
  toast.value     = msg
  toastType.value = type
  toastTimer      = setTimeout(() => { toast.value = "" }, 2800)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}

.cart-root{min-height:100vh;background:#f8f9fa;font-family:'DM Sans',sans-serif;color:#374151}

/* HEADER */
.cart-header{background:white;border-bottom:1px solid #e5e7eb;padding:14px 20px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:50;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.back-btn{background:none;border:1px solid #e5e7eb;color:#6b7280;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif;transition:all .15s}
.back-btn:hover{background:#f3f4f6}
.cart-title{font-family:'Playfair Display',serif;font-size:20px;color:#1a1a2e;flex:1;text-align:center}
.cart-header-count{font-size:12px;color:#6b7280;white-space:nowrap}

/* STATES */
.state-empty,.state-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:16px;color:#6b7280;text-align:center}
.state-empty span{font-size:56px;opacity:.5}
.state-empty p{font-size:16px}
.spinner{width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#6c63ff;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* CONTENT */
.cart-content{padding:16px;max-width:600px;margin:0 auto;display:flex;flex-direction:column;gap:16px}

/* CART ITEMS */
.cart-items{background:white;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden}
.cart-item{display:grid;grid-template-columns:52px 1fr auto auto 26px;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #f3f4f6}
.cart-item:last-child{border-bottom:none}
.item-img{width:52px;height:52px;border-radius:10px;overflow:hidden;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.item-img img{width:100%;height:100%;object-fit:cover}
.item-info{min-width:0}
.item-name{font-size:13px;font-weight:600;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.item-price{font-size:12px;color:#6b7280;margin-top:2px}
.item-qty{display:flex;align-items:center;gap:6px}
.qty-btn{width:26px;height:26px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:6px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all .15s;font-family:'DM Sans',sans-serif}
.qty-btn:hover:not(:disabled){background:#e5e7eb}
.qty-btn:disabled{opacity:.4;cursor:default}
.qty-val{font-size:14px;font-weight:600;min-width:22px;text-align:center}
.item-subtotal{font-size:13px;font-weight:700;color:#6c63ff;white-space:nowrap}
.item-del{background:none;border:none;color:#9ca3af;cursor:pointer;font-size:14px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:6px;transition:all .15s}
.item-del:hover{background:#fef2f2;color:#ef4444}

/* SUMMARY */
.cart-summary{background:white;border-radius:16px;border:1px solid #e5e7eb;padding:20px;display:flex;flex-direction:column;gap:16px}
.summary-rows{display:flex;flex-direction:column;gap:10px;border-bottom:1px solid #f3f4f6;padding-bottom:14px}
.summary-row{display:flex;justify-content:space-between;font-size:14px;color:#6b7280}
.free-shipping{color:#10b981;font-weight:600}
.total-row{font-size:16px;color:#111;padding-top:6px}
.total-row strong{font-size:20px;color:#6c63ff}

/* CUSTOMER FIELDS */
.customer-fields{display:flex;flex-direction:column;gap:8px}
.customer-fields label{font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
.cust-input{padding:10px 14px;border:1px solid #e5e7eb;border-radius:9px;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .15s}
.cust-input:focus{border-color:#6c63ff}

/* ERRORS */
.pay-error{background:#fef2f2;border:1px solid #fecaca;color:#ef4444;padding:10px 14px;border-radius:8px;font-size:13px}

/* BUTTONS */
.btn-primary{background:#6c63ff;color:white;border:none;border-radius:12px;padding:13px 28px;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.btn-primary:hover{background:#5b52ee;transform:translateY(-1px)}
.pay-btn{width:100%;padding:16px;background:linear-gradient(135deg,#6c63ff,#a78bfa);color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .2s}
.pay-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 20px rgba(108,99,255,.4)}
.pay-btn:disabled{opacity:.6;cursor:not-allowed}
.clear-btn{width:100%;padding:11px;background:#f3f4f6;color:#6b7280;border:1px solid #e5e7eb;border-radius:10px;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.clear-btn:hover{background:#e5e7eb}
.spinner-sm{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .6s linear infinite}

/* TOAST */
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:white;padding:10px 22px;border-radius:100px;font-size:13px;font-weight:500;z-index:9999;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.3)}
.toast.error{background:#ef4444}
.toast-enter-active,.toast-leave-active{transition:all .3s ease}
.toast-enter-from,.toast-leave-to{opacity:0;transform:translateX(-50%) translateY(12px)}
</style>
