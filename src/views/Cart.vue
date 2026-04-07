<!-- ============================================================
  Cart.vue — SaaasGenerator/src/views/Cart.vue

  Flux :
  1. Lit cartSession depuis users/{uid} (live Firestore)
  2. Saisie : nom, email, adresse de livraison
  3. Clic "Payer" :
     a. Sauvegarde pendingStripeOrder dans localStorage
     b. Appelle backend /create-stripe-session
     c. Redirige vers Stripe Checkout
  4. Stripe redirige vers l'URL racine
  5. main.js détecte pendingStripeOrder → router.push("payment-success")
  6. PaymentSuccess.vue : vide cartSession + écrit orders
============================================================ -->
<template>
  <div class="cart-root">

    <header class="cart-header">
      <button class="back-btn" @click="$router.push('/')">← Retour</button>
      <h1 class="cart-title">🛒 Mon panier</h1>
      <span class="cart-count">{{ cartCount }} article{{ cartCount > 1 ? 's' : '' }}</span>
    </header>

    <!-- Non connecté -->
    <div v-if="!uid" class="cart-state">
      <span>🔐</span><p>Connectez-vous pour voir votre panier</p>
    </div>

    <!-- Panier vide -->
    <div v-else-if="!loading && cart.length === 0" class="cart-state">
      <span>🛍️</span><p>Votre panier est vide</p>
      <button class="btn-primary" @click="$router.push('/')">Voir les produits</button>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="cart-state">
      <div class="spinner"></div><p>Chargement...</p>
    </div>

    <!-- Contenu -->
    <div v-else class="cart-body">

      <!-- ── LISTE ARTICLES ─────────────────────────────── -->
      <div class="cart-items">
        <div v-for="(item, idx) in cart" :key="item.id || idx" class="cart-item">
          <div class="item-img">
            <img v-if="item.image" :src="item.image" :alt="item.name"/>
            <span v-else>🛍️</span>
          </div>
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-price">{{ item.price }} €</div>
            <div v-if="item.description" class="item-desc">{{ item.description }}</div>
          </div>
          <div class="item-qty">
            <button class="qty-btn" @click="updateQty(idx, item.qty - 1)" :disabled="item.qty <= 1">−</button>
            <span class="qty-val">{{ item.qty }}</span>
            <button class="qty-btn" @click="updateQty(idx, item.qty + 1)">+</button>
          </div>
          <div class="item-subtotal">{{ (item.price * item.qty).toFixed(2) }} €</div>
          <button class="item-del" @click="removeItem(idx)">✕</button>
        </div>
      </div>

      <!-- ── FORMULAIRE CLIENT + LIVRAISON ──────────────── -->
      <div class="cart-form">

        <div class="form-section">
          <div class="form-section-title">👤 Informations client</div>
          <div class="form-row">
            <div class="form-field">
              <label>Nom complet *</label>
              <input v-model="name" placeholder="Jean Dupont" class="form-input"/>
            </div>
            <div class="form-field">
              <label>Email *</label>
              <input v-model="email" placeholder="jean@email.com" type="email" class="form-input"/>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title">📦 Adresse de livraison</div>
          <div class="form-field">
            <label>Adresse *</label>
            <input v-model="address" placeholder="123 rue de la Paix" class="form-input"/>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Code postal</label>
              <input v-model="zip" placeholder="75001" class="form-input"/>
            </div>
            <div class="form-field">
              <label>Ville</label>
              <input v-model="city" placeholder="Paris" class="form-input"/>
            </div>
          </div>
          <div class="form-field">
            <label>Pays</label>
            <select v-model="country" class="form-input form-select">
              <option>France</option>
              <option>Maroc</option>
              <option>Belgique</option>
              <option>Suisse</option>
              <option>Canada</option>
              <option>Algérie</option>
              <option>Tunisie</option>
              <option>Sénégal</option>
              <option>Côte d'Ivoire</option>
            </select>
          </div>
        </div>

        <!-- ── TOTAL + PAIEMENT ─────────────────────────── -->
        <div class="cart-summary">
          <div class="summary-row">
            <span>Sous-total ({{ cartCount }} article{{ cartCount > 1 ? 's' : '' }})</span>
            <span>{{ total.toFixed(2) }} €</span>
          </div>
          <div class="summary-row">
            <span>Livraison</span>
            <span class="free">Gratuite</span>
          </div>
          <div class="summary-row total">
            <span>Total</span>
            <strong>{{ total.toFixed(2) }} €</strong>
          </div>
        </div>

        <p v-if="payError" class="pay-error">⚠ {{ payError }}</p>

        <button class="pay-btn" @click="pay" :disabled="paying || cart.length === 0">
          <span v-if="paying" class="spinner-sm"></span>
          <span v-else>💳</span>
          {{ paying ? "Redirection vers Stripe..." : `Payer ${total.toFixed(2)} €` }}
        </button>

        <p class="secure-note">🔒 Paiement sécurisé · Powered by Stripe</p>

        <button class="clear-btn" @click="clearCart">Vider le panier</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { db } from "../firebase"

const router = useRouter()
const auth   = getAuth()

// ── State ─────────────────────────────────────────────────────
const uid     = ref(null)
const cart    = ref([])
const loading = ref(true)
const paying  = ref(false)
const payError = ref("")

// Infos client
const name    = ref("")
const email   = ref("")
const address = ref("")
const zip     = ref("")
const city    = ref("")
const country = ref("France")

let userRef   = null
let unsubCart = null

// ── Computed ──────────────────────────────────────────────────
const total     = computed(() => cart.value.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0))
const cartCount = computed(() => cart.value.reduce((s, i) => s + (i.qty || 1), 0))

// ── Auth + écoute cartSession ──────────────────────────────────
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (!user) { loading.value = false; return }
    uid.value   = user.uid
    email.value = user.email || ""
    userRef     = doc(db, "users", user.uid)

    unsubCart = onSnapshot(userRef, (snap) => {
      cart.value    = snap.data()?.cartSession || []
      loading.value = false
    })
  })
})

onUnmounted(() => unsubCart?.())

// ── Modifier quantité ─────────────────────────────────────────
async function updateQty(idx, qty) {
  if (qty < 1) return
  const updated     = JSON.parse(JSON.stringify(cart.value))
  updated[idx].qty  = qty
  await updateDoc(userRef, { cartSession: updated })
}

// ── Supprimer article ─────────────────────────────────────────
async function removeItem(idx) {
  const updated = JSON.parse(JSON.stringify(cart.value))
  updated.splice(idx, 1)
  await updateDoc(userRef, { cartSession: updated })
}

// ── Vider panier ──────────────────────────────────────────────
async function clearCart() {
  if (!confirm("Vider le panier ?")) return
  await updateDoc(userRef, { cartSession: [] })
}

// ── Paiement Stripe ───────────────────────────────────────────
async function pay() {
  // Validation
  if (!name.value.trim())    { payError.value = "Nom obligatoire.";             return }
  if (!email.value.trim())   { payError.value = "Email obligatoire.";           return }
  if (!address.value.trim()) { payError.value = "Adresse de livraison requise."; return }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
  if (!emailOk)              { payError.value = "Email invalide.";              return }

  paying.value    = true
  payError.value  = ""

  const adresseLivraison = [address.value, zip.value, city.value, country.value]
    .filter(Boolean).join(", ")

  // ── 1. Sauvegarder pendingStripeOrder en localStorage ────────
  //    main.js lit ce champ au démarrage → redirige vers /payment-success
  const pendingOrder = {
    items: cart.value.map(i => ({
      id:          i.id          || "",
      name:        i.name        || "",
      price:       i.price       || 0,
      currency:    i.currency    || "€",
      qty:         i.qty         || 1,
      image:       i.image       || "",
      description: i.description || "",
    })),
    total:            total.value.toFixed(2),
    currency:         "€",
    itemCount:        cartCount.value,
    customerName:     name.value.trim(),
    customerEmail:    email.value.trim().toLowerCase(),
    customerAddress:  adresseLivraison,
    ownerUid:         uid.value,
    siteSlug:         uid.value,
    provider:         "stripe",
    createdAt:        new Date().toISOString(),
  }
  localStorage.setItem("pendingStripeOrder", JSON.stringify(pendingOrder))
  localStorage.setItem("stripeOwnerUid",     uid.value)

  // ── 2. Appel backend — format que le backend attend ──────────
  const BACKEND = "https://backend-master-production-cf50.up.railway.app"

  // successUrl = URL racine sans # (Stripe efface tout ce qui est après #)
  // main.js détecte pendingStripeOrder et redirige vers /payment-success
  const origin     = "https://musrh.github.io/SaaasGenerator"
  const successUrl = `${origin}/`
  const cancelUrl  = `${origin}/`

  try {
    const res = await fetch(`${BACKEND}/create-stripe-session`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // ⚠️ Format exact attendu par le backend
        items: cart.value.map(i => ({
          nom:      i.name  || "Produit",
          prix:     Number(i.price) || 0,
          quantity: i.qty   || 1,
        })),
        amount:           Math.round(total.value * 100),
        currency:         "eur",
        description:      `Commande — ${cartCount.value} article(s)`,
        email:            email.value.trim().toLowerCase(),
        clientId:         uid.value,
        storeName:        name.value.trim(),
        adresseLivraison,
        customerName:     name.value.trim(),
        successUrl,
        cancelUrl,
      }),
    })

    if (!res.ok) throw new Error("Erreur serveur " + res.status)
    const data = await res.json()

    if (!data.url) throw new Error(data.error || "Pas d'URL Stripe reçue")

    // ── 3. Redirect Stripe Checkout ──────────────────────────
    window.location.href = data.url

  } catch(e) {
    payError.value = e.message
    paying.value   = false
    // Nettoyer localStorage si erreur
    localStorage.removeItem("pendingStripeOrder")
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}

.cart-root{min-height:100vh;background:#f8f9fa;font-family:'DM Sans',sans-serif;color:#374151}

/* HEADER */
.cart-header{background:white;border-bottom:1px solid #e5e7eb;padding:14px 20px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:50;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.back-btn{background:#f3f4f6;border:1px solid #e5e7eb;color:#6b7280;padding:7px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif;transition:all .15s}
.back-btn:hover{background:#e5e7eb}
.cart-title{font-family:'Playfair Display',serif;font-size:20px;color:#1a1a2e;flex:1;text-align:center}
.cart-count{font-size:12px;color:#6b7280;white-space:nowrap}

/* STATE */
.cart-state{display:flex;flex-direction:column;align-items:center;gap:14px;padding:80px 20px;color:#6b7280;text-align:center}
.cart-state span{font-size:52px;opacity:.5}
.spinner{width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#6c63ff;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* BODY */
.cart-body{max-width:640px;margin:0 auto;padding:20px 16px;display:flex;flex-direction:column;gap:16px}

/* ITEMS */
.cart-items{background:white;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden}
.cart-item{display:grid;grid-template-columns:52px 1fr auto auto 26px;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #f3f4f6}
.cart-item:last-child{border-bottom:none}
.item-img{width:52px;height:52px;border-radius:10px;overflow:hidden;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.item-img img{width:100%;height:100%;object-fit:cover}
.item-info{min-width:0}
.item-name{font-size:13px;font-weight:600;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.item-price{font-size:12px;color:#6b7280;margin-top:2px}
.item-desc{font-size:11px;color:#9ca3af;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.item-qty{display:flex;align-items:center;gap:6px}
.qty-btn{width:26px;height:26px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:6px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all .15s}
.qty-btn:hover:not(:disabled){background:#e5e7eb}
.qty-btn:disabled{opacity:.35;cursor:default}
.qty-val{font-size:14px;font-weight:600;min-width:22px;text-align:center}
.item-subtotal{font-size:13px;font-weight:700;color:#6c63ff;white-space:nowrap}
.item-del{background:none;border:none;color:#9ca3af;cursor:pointer;font-size:14px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:6px;transition:all .15s}
.item-del:hover{background:#fef2f2;color:#ef4444}

/* FORM */
.cart-form{background:white;border:1px solid #e5e7eb;border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:16px}
.form-section{display:flex;flex-direction:column;gap:10px}
.form-section-title{font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;padding-bottom:4px;border-bottom:1px solid #f3f4f6}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.form-field{display:flex;flex-direction:column;gap:4px}
.form-field label{font-size:11px;color:#6b7280;font-weight:500}
.form-input{padding:10px 12px;border:1px solid #e5e7eb;border-radius:9px;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;color:#374151;transition:border-color .15s;width:100%}
.form-input:focus{border-color:#6c63ff}
.form-select{cursor:pointer}

/* SUMMARY */
.cart-summary{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:8px}
.summary-row{display:flex;justify-content:space-between;font-size:14px;color:#6b7280}
.summary-row.total{font-size:16px;color:#111;padding-top:8px;border-top:1px solid #e5e7eb;margin-top:4px}
.summary-row.total strong{font-size:20px;color:#6c63ff}
.free{color:#10b981;font-weight:600}

/* PAYMENT */
.pay-error{background:#fef2f2;border:1px solid #fecaca;color:#ef4444;padding:10px 14px;border-radius:8px;font-size:13px}
.pay-btn{width:100%;padding:16px;background:linear-gradient(135deg,#6c63ff,#a78bfa);color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .2s}
.pay-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 20px rgba(108,99,255,.35)}
.pay-btn:disabled{opacity:.6;cursor:not-allowed}
.spinner-sm{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .6s linear infinite}
.secure-note{text-align:center;font-size:11px;color:#9ca3af}
.clear-btn{width:100%;padding:10px;background:#f9fafb;color:#9ca3af;border:1px solid #e5e7eb;border-radius:9px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.clear-btn:hover{background:#f3f4f6;color:#6b7280}
.btn-primary{background:#6c63ff;color:white;border:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
</style>
