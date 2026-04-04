<!-- ============================================================
  SaaasGenerator/src/views/SiteViewer.vue
  
  Affiche le site PUBLIÉ d'un propriétaire de store.
  Mode : aperçu final uniquement — pas de barre d'édition.
  
  Route  : /site/:uid
  :uid   : UID Firestore direct OU slug convivial
  
  Résolution :
    1. users/{uid}/siteData          → UID direct
    2. slugs/{uid} → uid réel        → Slug
    3. Introuvable                   → Page 404 intégrée
  
  Paiement client :
    - Lit users/{resolvedUid}/config/payment  (storePaymentConfig)
    - Stripe Elements réel  → backend du STORE
    - PayPal SDK réel       → backend du STORE
    - Commande sauvegardée  → users/{resolvedUid}/orders/{id}
============================================================ -->

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import VoiceAssistantClient from "../components/VoiceAssistantClient.vue"
import { db } from "../firebase.js"
import { doc, getDoc, collection, addDoc } from "firebase/firestore"

// ── Props ─────────────────────────────────────────────────────
const props = defineProps({ uid: { type: String, required: true } })

// ── État global ───────────────────────────────────────────────
const site         = ref(null)
const loading      = ref(true)
const error        = ref("")
const resolvedUid  = ref("")
const siteMeta     = ref({})          // { name, logo }
const currentPageIndex = ref(0)

// ── Config paiement du store ──────────────────────────────────
const storePayConfig = ref({ stripe: null, paypal: null })

// ── Panier ────────────────────────────────────────────────────
const cart         = ref([])
const showCart     = ref(false)
const showPayModal = ref(false)
const payProvider  = ref("stripe")
const payProcessing = ref(false)
const paySuccess   = ref(false)
const payError     = ref("")
const customerName  = ref("")
const customerEmail = ref("")

// Stripe Checkout (redirect vers Stripe)
const stripeLoading = ref(false)

const cartCount    = computed(() => cart.value.reduce((s, i) => s + i.qty, 0))
const cartTotal    = computed(() => cart.value.reduce((s, i) => s + parseFloat(i.price || 0) * i.qty, 0).toFixed(2))
const cartCurrency = computed(() => cart.value[0]?.currency || "€")
const currentPage  = computed(() => site.value?.pages?.[currentPageIndex.value] || site.value?.pages?.[0])

// ── Panier — actions ──────────────────────────────────────────
const addToCart = (product) => {
  const ex = cart.value.find(i => i.id === product.id)
  ex ? ex.qty++ : cart.value.push({ ...product, qty: 1 })
  showCart.value = true
}
const removeFromCart = (id) => { cart.value = cart.value.filter(i => i.id !== id) }
const updateQty = (id, delta) => {
  const item = cart.value.find(i => i.id === id)
  if (item) item.qty = Math.max(1, item.qty + delta)
}

// ── Embed vidéo ───────────────────────────────────────────────
const getEmbedUrl = (url) => {
  if (!url) return ""
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return url
}

// ── Chargement site + config paiement ────────────────────────
const loadSite = async () => {
  loading.value = true
  error.value   = ""
  try {
    // Étape 1 : UID direct
    const userSnap = await getDoc(doc(db, "users", props.uid))
    if (userSnap.exists() && userSnap.data().siteData) {
      site.value       = userSnap.data().siteData
      siteMeta.value   = { name: userSnap.data().siteName || "", logo: userSnap.data().siteLogo || "" }
      resolvedUid.value = props.uid
      await loadPayConfig(props.uid)
      loading.value = false
      return
    }
    // Étape 2 : Slug
    const slugSnap = await getDoc(doc(db, "slugs", props.uid))
    if (slugSnap.exists()) {
      const realUid   = slugSnap.data().uid
      const realSnap  = await getDoc(doc(db, "users", realUid))
      if (realSnap.exists() && realSnap.data().siteData) {
        site.value        = realSnap.data().siteData
        siteMeta.value    = { name: realSnap.data().siteName || "", logo: realSnap.data().siteLogo || "" }
        resolvedUid.value = realUid
        await loadPayConfig(realUid)
        loading.value = false
        return
      }
    }
    error.value   = "Site introuvable. Vérifiez l'adresse."
    loading.value = false
  } catch (e) {
    error.value   = "Erreur de chargement : " + e.message
    loading.value = false
  }
}

const loadPayConfig = async (uid) => {
  try {
    // Chercher d'abord dans users/{uid}/config/payment (sous-collection)
    const snap = await getDoc(doc(db, "users", uid, "config", "payment"))
    if (snap.exists()) { storePayConfig.value = snap.data(); return }
    // Fallback : storePaymentConfig dans le document principal
    const mainSnap = await getDoc(doc(db, "users", uid))
    if (mainSnap.exists() && mainSnap.data().storePaymentConfig) {
      storePayConfig.value = mainSnap.data().storePaymentConfig
    }
  } catch (e) { console.warn("Pas de config paiement:", e.message) }
}

onMounted(loadSite)

// ── Stripe Checkout (redirect) ───────────────────────────────
// Le backend retourne { url } → on redirige vers Stripe Checkout
// Pas besoin de Stripe Elements (formulaire inline)

// ── PayPal buttons ────────────────────────────────────────────
const initPaypal = async () => {
  const cfg = storePayConfig.value?.paypal
  if (!cfg?.clientId || cfg.clientId.length < 5) {
    payError.value = "Paiement PayPal non configuré pour ce store."
    return
  }
  try {
    if (!window.paypal || window.paypal._clientId !== cfg.clientId) {
      const old = document.getElementById("paypal-sdk")
      if (old) old.remove()
      await new Promise((res, rej) => {
        const s = document.createElement("script")
        s.id  = "paypal-sdk"
        s.src = `https://www.paypal.com/sdk/js?client-id=${cfg.clientId}&currency=${cfg.currency || "EUR"}`
        s.onload = () => { window.paypal._clientId = cfg.clientId; res() }
        s.onerror = rej
        document.head.appendChild(s)
      })
    }
    const container = document.getElementById("sv-paypal-container")
    if (container) container.innerHTML = ""
    await new Promise(r => setTimeout(r, 100))
    window.paypal.Buttons({
      createOrder: async () => {
        if (!cfg.createOrderUrl) throw new Error("createOrderUrl non défini")
        const res = await fetch(cfg.createOrderUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount:   cartTotal.value,
            currency: cfg.currency || "EUR",
            items:    cart.value.map(i => ({ name: i.name, unit_amount: parseFloat(i.price), quantity: i.qty })),
          }),
        })
        const data = await res.json()
        return data.orderID
      },
      onApprove: async (data) => {
        payProcessing.value = true
        if (cfg.captureOrderUrl) {
          const res = await fetch(cfg.captureOrderUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID: data.orderID }),
          })
          const result = await res.json()
          if (result.status === "COMPLETED") {
            await saveOrder("paypal", result.id)
            paySuccess.value    = true
            payProcessing.value = false
          }
        }
      },
      onError: (err) => { payError.value = "Erreur PayPal : " + String(err) },
    }).render("#sv-paypal-container")
  } catch (e) { payError.value = "Erreur PayPal : " + e.message }
}

// ── Watch payment modal → init PayPal si nécessaire ─────────
watch([showPayModal, payProvider], ([open, provider]) => {
  if (!open) return
  payError.value = ""
  if (provider === "paypal") setTimeout(initPaypal, 150)
})

// ── Paiement Stripe Checkout (redirect) ──────────────────────
const payWithStripe = async () => {
  const cfg = storePayConfig.value?.stripe
  if (!cfg?.backendUrl) { payError.value = "backendUrl Stripe non configuré."; return }
  if (!customerName.value || !customerEmail.value) {
    payError.value = "Nom et email obligatoires."; return
  }
  payProcessing.value = true
  payError.value = ""
  try {
    // ── Sauvegarder la commande dans localStorage (pas sessionStorage)
    // sessionStorage est effacé par Stripe sur certains navigateurs mobiles
    const pendingOrder = {
      items:         cart.value.map(i => ({ id: i.id, name: i.name, price: i.price, currency: i.currency, qty: i.qty, image: i.image || "" })),
      total:         cartTotal.value,
      currency:      cartCurrency.value,
      itemCount:     cartCount.value,
      customerName:  customerName.value,
      customerEmail: customerEmail.value,
      siteSlug:      props.uid,
      ownerUid:      resolvedUid.value,
      provider:      "stripe",
      createdAt:     new Date().toISOString(),
    }
    localStorage.setItem("pendingStripeOrder", JSON.stringify(pendingOrder))
    localStorage.setItem("stripeOwnerUid", resolvedUid.value)
    localStorage.setItem("stripeSiteSlug", props.uid)

    // ── URLs de retour Stripe
    // Stripe supprime tout ce qui est après #
    // Solution : URL racine simple, la détection se fait dans main.js
    // via localStorage("pendingStripeOrder") au démarrage de l'app
    const origin     = "https://musrh.github.io/SaaasGenerator"
    const successUrl = cfg.successUrl || `${origin}/`
    const cancelUrl  = cfg.cancelUrl  || `${origin}/`

    // ── Appel backend
    const res = await fetch(cfg.backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount:           Math.round(parseFloat(cartTotal.value) * 100),
        currency:         cfg.currency || "eur",
        description:      `Commande — ${cartCount.value} article(s)`,
        items:            cart.value.map(i => ({
          nom:      i.name,
          prix:     parseFloat(i.price),
          quantity: i.qty,
        })),
        email:            customerEmail.value,
        clientId:         resolvedUid.value,
        plan:             "store-order",
        storeName:        cfg.storeName || "Store",
        adresseLivraison: "",
        successUrl,
        cancelUrl,
      }),
    })
    if (!res.ok) throw new Error("Erreur serveur " + res.status)
    const data = await res.json()

    if (data.url) {
      // Fermer les modales avant redirect
      showCart.value     = false
      showPayModal.value = false
      window.location.href = data.url
      return
    }
    throw new Error(data.error || "Pas d'URL Stripe reçue")
  } catch (e) {
    payError.value      = e.message
    payProcessing.value = false
  }
}

// ── Sauvegarde commande Firestore ─────────────────────────────
// Écrit dans : users/{ownerUid}/orders/{orderId}
const saveOrder = async (provider, transactionId) => {
  if (!resolvedUid.value) return
  try {
    await addDoc(collection(db, "users", resolvedUid.value, "orders"), {
      items: cart.value.map(i => ({
        id: i.id, name: i.name, price: i.price,
        currency: i.currency, qty: i.qty, image: i.image || "",
      })),
      total:         cartTotal.value,
      currency:      cartCurrency.value,
      itemCount:     cartCount.value,
      provider,
      transactionId,
      customerName:  customerName.value,
      customerEmail: customerEmail.value,
      status:        "paid",
      createdAt:     new Date().toISOString(),
      siteSlug:      props.uid,
    })
    cart.value = []  // vider le panier après commande
    // Stocker la commande dans sessionStorage pour la page de succès
    sessionStorage.setItem("lastOrder", JSON.stringify(orderData))
  } catch (e) { console.error("Erreur sauvegarde commande:", e) }
}
</script>

<template>
<div class="sv-root">

  <!-- LOADING -->
  <div v-if="loading" class="sv-loading">
    <div class="sv-spinner"></div>
    <p>Chargement du site...</p>
  </div>

  <!-- ERREUR -->
  <div v-else-if="error" class="sv-error">
    <span>🔍</span>
    <h2>{{ error }}</h2>
    <p>L'adresse <code>{{ props.uid }}</code> ne correspond à aucun site publié.</p>
  </div>

  <!-- SITE -->
  <template v-else-if="site">

    <!-- NAV du store -->
    <nav class="sv-nav">
      <div class="sv-brand">
        <img v-if="siteMeta.logo" :src="siteMeta.logo" class="sv-brand-logo" alt="logo"/>
        <span v-else class="sv-brand-icon">◈</span>
        <span class="sv-brand-name">{{ siteMeta.name || site.pages?.[0]?.name || 'Mon Store' }}</span>
      </div>
      <div class="sv-page-tabs">
        <button
          v-for="(p, i) in site.pages" :key="p.id"
          class="sv-tab" :class="{ active: currentPageIndex === i }"
          @click="currentPageIndex = i"
        >{{ p.name }}</button>
      </div>
      <button v-if="cartCount > 0" class="sv-cart-btn" @click="showCart = true">
        🛒 <span class="sv-cart-badge">{{ cartCount }}</span>
      </button>
    </nav>

    <!-- CONTENU PAGE -->
    <main class="sv-page" :style="currentPage?.style">
      <template v-for="s in currentPage?.sections" :key="s.id">

        <!-- HERO -->
        <div v-if="s.type==='hero'" class="sv-hero" :style="s.style">
          <h1 class="sv-hero-title">{{ s.content }}</h1>
          <p  class="sv-hero-sub">{{ s.subtitle }}</p>
          <button v-if="s.cta" class="sv-hero-cta">{{ s.cta }}</button>
        </div>

        <!-- TEXT -->
        <div v-else-if="s.type==='text'" class="sv-text" :style="s.style">
          <p>{{ s.content }}</p>
        </div>

        <!-- IMAGE -->
        <div v-else-if="s.type==='image'" class="sv-image" :style="s.style">
          <img v-if="s.url" :src="s.url" :alt="s.alt"/>
        </div>

        <!-- GALLERY -->
        <div v-else-if="s.type==='gallery'" class="sv-gallery" :style="s.style">
          <div class="sv-gallery-grid" :style="`grid-template-columns:repeat(${s.columns||3},1fr)`">
            <div v-for="img in s.images" :key="img.id" class="sv-gallery-item">
              <img :src="img.url" :alt="img.alt"/>
            </div>
          </div>
        </div>

        <!-- VIDEO -->
        <div v-else-if="s.type==='video'" class="sv-video" :style="s.style">
          <h3 v-if="s.title" class="sv-video-title">{{ s.title }}</h3>
          <div v-if="s.url" class="sv-video-wrap">
            <iframe :src="getEmbedUrl(s.url)" allowfullscreen></iframe>
          </div>
        </div>

        <!-- PRODUCTS -->
        <div v-else-if="s.type==='products'" class="sv-products" :style="s.style">
          <div class="sv-products-grid">
            <div v-for="p in s.items" :key="p.id" class="sv-product-card">
              <div class="sv-product-img-wrap">
                <img v-if="p.image" :src="p.image" :alt="p.name" class="sv-product-img"/>
                <div v-else class="sv-product-img-ph">🛍️</div>
                <span v-if="p.badge" class="sv-product-badge">{{ p.badge }}</span>
              </div>
              <div class="sv-product-body">
                <div class="sv-product-name">{{ p.name }}</div>
                <div class="sv-product-desc">{{ p.description }}</div>
                <div class="sv-product-footer">
                  <span class="sv-product-price">{{ p.price }}{{ p.currency }}</span>
                  <button class="sv-product-btn" @click="addToCart(p)">🛒 Acheter</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FEATURES -->
        <div v-else-if="s.type==='features'" class="sv-features" :style="s.style">
          <div class="sv-features-grid">
            <div v-for="(item, fi) in s.items" :key="fi" class="sv-feature-card">
              <span class="sv-feat-icon">{{ item.icon }}</span>
              <strong>{{ item.title }}</strong>
              <p>{{ item.desc }}</p>
            </div>
          </div>
        </div>

        <!-- PAYMENT -->
        <div v-else-if="s.type==='payment'" class="sv-payment" :style="s.style">
          <h2 class="sv-payment-title">{{ s.title }}</h2>
          <p  class="sv-payment-desc">{{ s.description }}</p>
          <div class="sv-payment-amount">{{ s.amount }}{{ s.currency }}</div>
          <div class="sv-payment-btns">
            <button class="sv-pay-btn sv-stripe"
              @click="cart=[{...s, id:'direct', qty:1, price:s.amount}]; payProvider='stripe'; showPayModal=true">
              💳 Payer avec Stripe
            </button>
            <button class="sv-pay-btn sv-paypal"
              @click="cart=[{...s, id:'direct', qty:1, price:s.amount}]; payProvider='paypal'; showPayModal=true">
              🅿 Payer avec PayPal
            </button>
          </div>
        </div>

        <!-- FORM -->
        <div v-else-if="s.type==='form'" class="sv-form" :style="s.style">
          <h3>Contactez-nous</h3>
          <input placeholder="Nom complet"/>
          <input placeholder="Email"/>
          <textarea rows="4" placeholder="Votre message..."></textarea>
          <button type="button">Envoyer →</button>
        </div>

        <!-- DIVIDER -->
        <div v-else-if="s.type==='divider'" class="sv-divider" :style="s.style">
          <hr/>
        </div>

      </template>
    </main>

    <!-- ── MODAL PANIER ─────────────────────────────────────── -->
    <Transition name="sv-modal">
      <div v-if="showCart" class="sv-modal-overlay" @click.self="showCart=false">
        <div class="sv-modal-box">
          <button class="sv-modal-close" @click="showCart=false">✕</button>
          <div class="sv-modal-header">
            <span>🛒</span><h2>Mon panier</h2>
          </div>

          <div v-if="cart.length === 0" class="sv-cart-empty">
            <span>🛍️</span><p>Votre panier est vide</p>
          </div>

          <div v-else class="sv-cart-items">
            <div v-for="item in cart" :key="item.id" class="sv-cart-item">
              <div class="sv-ci-img">
                <img v-if="item.image" :src="item.image" :alt="item.name"/>
                <span v-else>🛍️</span>
              </div>
              <div class="sv-ci-info">
                <div class="sv-ci-name">{{ item.name }}</div>
                <div class="sv-ci-price">{{ item.price }}{{ item.currency }}</div>
              </div>
              <div class="sv-ci-qty">
                <button @click="updateQty(item.id,-1)">−</button>
                <span>{{ item.qty }}</span>
                <button @click="updateQty(item.id,1)">+</button>
              </div>
              <div class="sv-ci-subtotal">{{ (parseFloat(item.price)*item.qty).toFixed(2) }}{{ item.currency }}</div>
              <button class="sv-ci-del" @click="removeFromCart(item.id)">✕</button>
            </div>
          </div>

          <div v-if="cart.length > 0" class="sv-cart-footer">
            <div class="sv-cart-total">
              <span>Total</span>
              <strong>{{ cartTotal }}{{ cartCurrency }}</strong>
            </div>
            <div class="sv-cart-actions">
              <button class="sv-btn-sec" @click="showCart=false">Continuer</button>
              <button class="sv-btn-primary" @click="showCart=false; showPayModal=true">
                💳 Finaliser la commande
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── MODAL PAIEMENT ───────────────────────────────────── -->
    <Transition name="sv-modal">
      <div v-if="showPayModal" class="sv-modal-overlay" @click.self="showPayModal=false">
        <div class="sv-modal-box sv-pay-box">
          <button class="sv-modal-close" @click="showPayModal=false">✕</button>

          <!-- Succès -->
          <div v-if="paySuccess" class="sv-pay-success">
            <div class="sv-success-icon">✓</div>
            <h2>Commande confirmée !</h2>
            <p>Merci pour votre achat. Un email de confirmation vous sera envoyé à <strong>{{ customerEmail }}</strong>.</p>
            <button class="sv-btn-primary" style="margin-top:20px;width:100%" @click="showPayModal=false; paySuccess=false">
              Fermer
            </button>
          </div>

          <template v-else>
            <div class="sv-modal-header">
              <span>💳</span>
              <h2>Paiement</h2>
              <div class="sv-pay-amount">{{ cartTotal }}{{ cartCurrency }}</div>
            </div>

            <!-- Infos client -->
            <div class="sv-customer-fields">
              <input v-model="customerName"  class="sv-cust-input" placeholder="Votre nom complet *"/>
              <input v-model="customerEmail" class="sv-cust-input" placeholder="Votre email *" type="email"/>
            </div>

            <!-- Erreur -->
            <div v-if="payError" class="sv-pay-error">⚠️ {{ payError }}</div>

            <!-- Tabs -->
            <div class="sv-pay-tabs">
              <button :class="{active:payProvider==='stripe'}"
                @click="payProvider='stripe'">💳 Stripe</button>
              <button :class="{active:payProvider==='paypal'}"
                @click="payProvider='paypal'">🅿 PayPal</button>
            </div>

            <!-- Stripe Checkout (redirect) -->
            <div v-if="payProvider==='stripe'" class="sv-pay-form">
              <div class="sv-stripe-checkout-info">
                <div class="sv-stripe-logo">
                  <span>stripe</span>
                </div>
                <p class="sv-stripe-checkout-desc">
                  Vous allez être redirigé vers la page de paiement sécurisée Stripe.
                  Vos données bancaires sont traitées directement par Stripe.
                </p>
                <div class="sv-stripe-badges">
                  <span>🔒 SSL</span>
                  <span>💳 Visa / MC / CB</span>
                  <span>🛡 3D Secure</span>
                </div>
              </div>
              <button class="sv-pay-submit" :disabled="payProcessing" @click="payWithStripe">
                <span v-if="payProcessing" class="sv-spinner-sm"></span>
                <span v-else>💳</span>
                {{ payProcessing ? "Redirection vers Stripe..." : `Payer ${cartTotal}${cartCurrency} par Stripe` }}
              </button>
            </div>

            <!-- PayPal -->
            <div v-else class="sv-pay-form">
              <div id="sv-paypal-container" class="sv-paypal-wrap"></div>
              <p class="sv-pay-note">🔒 Paiement sécurisé via PayPal</p>
            </div>
          </template>
        </div>
      </div>
    </Transition>

  </template>
  <!-- ASSISTANT VOCAL CLIENT (Groq IA) -->
  <VoiceAssistantClient
    v-if="resolvedUid"
    :store-uid="resolvedUid"
    :store-name="siteMeta.name || 'Notre boutique'"
    :store-email="storePayConfig?.stripe?.storeName || ''"
    :lang="'fr'"
    :backend-url="'https://backend-master-production-cf50.up.railway.app'"
  />

</div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
.sv-root{min-height:100vh;font-family:'DM Sans',sans-serif;color:#374151;background:#fff}

/* LOADING / ERROR */
.sv-loading,.sv-error{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;color:#6b7280;text-align:center;padding:20px}
.sv-spinner{width:40px;height:40px;border:3px solid #e5e7eb;border-top-color:#6c63ff;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.sv-error span{font-size:48px}.sv-error h2{font-size:22px;color:#374151}
.sv-error p{font-size:14px}.sv-error code{background:#f3f4f6;padding:2px 8px;border-radius:4px}

/* NAV */
.sv-nav{background:#fff;border-bottom:1px solid #e5e7eb;padding:12px 32px;display:flex;align-items:center;gap:16px;position:sticky;top:0;z-index:100;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.sv-brand{display:flex;align-items:center;gap:8px;margin-right:auto}
.sv-brand-logo{width:32px;height:32px;border-radius:6px;object-fit:contain}
.sv-brand-icon{font-size:20px;color:#6c63ff}
.sv-brand-name{font-family:'Playfair Display',serif;font-size:18px;color:#1a1a2e;font-weight:600}
.sv-page-tabs{display:flex;gap:4px;flex-wrap:wrap}
.sv-tab{background:transparent;border:1px solid transparent;color:#6b7280;font-size:14px;padding:6px 14px;border-radius:6px;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.sv-tab:hover{background:#f3f4f6;color:#111}
.sv-tab.active{background:#6c63ff;color:white;border-color:#6c63ff}
.sv-cart-btn{display:flex;align-items:center;gap:6px;background:#f3f4f6;border:1px solid #e5e7eb;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:14px;font-family:'DM Sans',sans-serif;transition:all .15s}
.sv-cart-btn:hover{background:#ede9fe;border-color:#6c63ff}
.sv-cart-badge{background:#6c63ff;color:white;font-size:10px;font-weight:700;padding:2px 7px;border-radius:100px}
.sv-page{min-height:calc(100vh - 57px)}

/* HERO */
.sv-hero{padding:100px 60px;background:linear-gradient(135deg,#f8f7ff,#ede9fe);text-align:center}
.sv-hero-title{font-family:'Playfair Display',serif;font-size:52px;font-weight:600;color:#1a1a2e;line-height:1.15;white-space:pre-line;margin-bottom:16px}
.sv-hero-sub{font-size:20px;color:#6b7280;margin-bottom:32px}
.sv-hero-cta{background:#6c63ff;color:white;border:none;border-radius:10px;padding:14px 32px;font-size:16px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:transform .2s}
.sv-hero-cta:hover{transform:translateY(-2px)}
/* TEXT */
.sv-text{padding:48px 60px}.sv-text p{font-size:17px;line-height:1.8;color:#374151;max-width:720px}
/* IMAGE */
.sv-image{padding:32px 60px}.sv-image img{width:100%;border-radius:12px;display:block}
/* GALLERY */
.sv-gallery{padding:32px 60px}.sv-gallery-grid{display:grid;gap:10px}
.sv-gallery-item{border-radius:10px;overflow:hidden;aspect-ratio:1}
.sv-gallery-item img{width:100%;height:100%;object-fit:cover;display:block}
/* VIDEO */
.sv-video{padding:32px 60px}
.sv-video-title{font-family:'Playfair Display',serif;font-size:24px;color:#1a1a2e;margin-bottom:16px}
.sv-video-wrap{border-radius:12px;overflow:hidden}
.sv-video-wrap iframe{width:100%;height:400px;border:none;display:block}
/* PRODUCTS */
.sv-products{padding:48px 60px;background:#fafafa}
.sv-products-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.sv-product-card{background:white;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);transition:transform .2s}
.sv-product-card:hover{transform:translateY(-4px)}
.sv-product-img-wrap{position:relative}
.sv-product-img{width:100%;height:200px;object-fit:cover;display:block}
.sv-product-img-ph{width:100%;height:200px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:48px}
.sv-product-badge{position:absolute;top:12px;left:12px;background:#fef3c7;color:#92400e;font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;text-transform:uppercase;letter-spacing:.5px}
.sv-product-body{padding:18px}
.sv-product-name{font-size:16px;font-weight:600;color:#111;margin-bottom:6px}
.sv-product-desc{font-size:13px;color:#6b7280;line-height:1.5;margin-bottom:14px}
.sv-product-footer{display:flex;align-items:center;justify-content:space-between}
.sv-product-price{font-size:20px;font-weight:700;color:#6c63ff}
.sv-product-btn{background:#6c63ff;color:white;border:none;border-radius:8px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;display:flex;align-items:center;gap:6px}
.sv-product-btn:hover{background:#5b52ee;transform:translateY(-1px)}
/* FEATURES */
.sv-features{padding:60px;background:#fafafa}
.sv-features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:840px;margin:0 auto}
.sv-feature-card{background:white;border:1px solid #e5e7eb;border-radius:14px;padding:28px 24px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.04)}
.sv-feat-icon{font-size:32px;display:block;margin-bottom:12px}
.sv-feature-card strong{font-size:16px;color:#111;display:block;margin-bottom:6px}
.sv-feature-card p{font-size:14px;color:#6b7280;line-height:1.5}
/* PAYMENT */
.sv-payment{padding:80px 60px;background:linear-gradient(135deg,#f8f7ff,#ede9fe);text-align:center}
.sv-payment-title{font-family:'Playfair Display',serif;font-size:36px;color:#1a1a2e;margin-bottom:10px}
.sv-payment-desc{font-size:16px;color:#6b7280;margin-bottom:24px}
.sv-payment-amount{font-size:64px;font-weight:700;color:#6c63ff;margin-bottom:36px}
.sv-payment-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.sv-pay-btn{padding:14px 32px;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:transform .2s}
.sv-pay-btn:hover{transform:translateY(-2px)}
.sv-stripe{background:#635bff;color:white}.sv-paypal{background:#ffc439;color:#003087}
/* FORM */
.sv-form{padding:60px;background:#f8f7ff;display:flex;flex-direction:column;align-items:center;gap:12px}
.sv-form h3{font-family:'Playfair Display',serif;font-size:30px;color:#1a1a2e;margin-bottom:12px}
.sv-form input,.sv-form textarea{width:100%;max-width:500px;padding:12px 16px;border:1px solid #e5e7eb;border-radius:10px;font-size:15px;font-family:'DM Sans',sans-serif;background:white}
.sv-form button{background:#6c63ff;color:white;border:none;border-radius:10px;padding:13px 28px;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
/* DIVIDER */
.sv-divider hr{border:none;border-top:1px solid #e5e7eb;margin:8px 60px}

/* MODALS */
.sv-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px}
.sv-modal-box{background:white;border-radius:16px;padding:32px;position:relative;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.18)}
.sv-modal-close{position:absolute;top:16px;right:16px;background:#f3f4f6;border:none;color:#6b7280;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center}
.sv-modal-header{text-align:center;margin-bottom:20px}
.sv-modal-header span{font-size:36px;display:block;margin-bottom:10px}
.sv-modal-header h2{font-family:'Playfair Display',serif;font-size:22px;color:#1a1a2e}
.sv-modal-enter-active,.sv-modal-leave-active{transition:all .25s ease}
.sv-modal-enter-from,.sv-modal-leave-to{opacity:0;transform:scale(.95)}
/* CART */
.sv-cart-empty{text-align:center;padding:40px;color:#9ca3af;display:flex;flex-direction:column;align-items:center;gap:12px}
.sv-cart-empty span{font-size:40px;opacity:.5}
.sv-cart-items{display:flex;flex-direction:column;gap:10px;margin-bottom:20px;max-height:340px;overflow-y:auto}
.sv-cart-item{display:grid;grid-template-columns:48px 1fr auto auto 24px;align-items:center;gap:10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:10px 12px}
.sv-ci-img{width:48px;height:48px;border-radius:8px;overflow:hidden;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.sv-ci-img img{width:100%;height:100%;object-fit:cover}
.sv-ci-info{min-width:0}
.sv-ci-name{font-size:13px;font-weight:600;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sv-ci-price{font-size:12px;color:#6b7280}
.sv-ci-qty{display:flex;align-items:center;gap:6px}
.sv-ci-qty button{background:#e5e7eb;border:none;color:#374151;width:24px;height:24px;border-radius:5px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center}
.sv-ci-qty span{font-size:13px;font-weight:600;min-width:20px;text-align:center}
.sv-ci-subtotal{font-size:13px;font-weight:700;color:#6c63ff;white-space:nowrap}
.sv-ci-del{background:none;border:none;color:#9ca3af;cursor:pointer;font-size:14px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:4px}
.sv-ci-del:hover{background:#fee2e2;color:#ef4444}
.sv-cart-footer{border-top:1px solid #e5e7eb;padding-top:16px}
.sv-cart-total{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.sv-cart-total span{font-size:14px;color:#6b7280}
.sv-cart-total strong{font-size:24px;font-weight:700;color:#6c63ff}
.sv-cart-actions{display:flex;gap:10px}
.sv-btn-sec{flex:1;padding:11px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;font-size:14px;font-family:'DM Sans',sans-serif;color:#374151}
.sv-btn-primary{flex:2;padding:12px;background:#6c63ff;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif}
.sv-btn-primary:hover{background:#5b52ee}
/* PAYMENT MODAL */
.sv-pay-box{max-width:440px}
.sv-pay-amount{font-size:34px;font-weight:700;color:#6c63ff;margin-top:6px}
.sv-customer-fields{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.sv-cust-input{width:100%;padding:10px 14px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;font-family:'DM Sans',sans-serif;outline:none}
.sv-cust-input:focus{border-color:#6c63ff}
.sv-pay-error{background:#fef2f2;border:1px solid #fecaca;color:#ef4444;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:12px}
.sv-pay-tabs{display:flex;gap:8px;margin-bottom:16px}
.sv-pay-tabs button{flex:1;padding:10px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif;color:#6b7280;transition:all .15s}
.sv-pay-tabs button.active{background:#635bff;color:white;border-color:#635bff}
.sv-pay-form{display:flex;flex-direction:column;gap:12px}
.sv-stripe-checkout-info{background:#f8f9ff;border:1px solid #e0e7ff;border-radius:10px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}
.sv-stripe-logo{background:#635bff;color:white;font-size:13px;font-weight:800;letter-spacing:2px;padding:6px 16px;border-radius:6px;text-transform:lowercase}
.sv-stripe-checkout-desc{font-size:13px;color:#6b7280;line-height:1.6}
.sv-stripe-badges{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.sv-stripe-badges span{background:#f3f4f6;border:1px solid #e5e7eb;color:#374151;font-size:11px;font-weight:600;padding:3px 10px;border-radius:100px}
.sv-paypal-wrap{min-height:50px}
.sv-pay-note{font-size:11px;color:#9ca3af;text-align:center}
.sv-pay-submit{width:100%;padding:14px;background:#635bff;color:white;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px}
.sv-pay-submit:disabled{opacity:.6;cursor:not-allowed}
.sv-spinner-sm{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .6s linear infinite}
/* PAY SUCCESS */
.sv-pay-success{text-align:center;padding:16px 0}
.sv-success-icon{width:64px;height:64px;background:#10b981;border-radius:50%;color:white;font-size:28px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.sv-pay-success h2{font-family:'Playfair Display',serif;font-size:22px;color:#1a1a2e;margin-bottom:8px}
.sv-pay-success p{font-size:14px;color:#6b7280;line-height:1.6}

@media(max-width:768px){
  .sv-nav{padding:10px 16px;flex-wrap:wrap}
  .sv-hero{padding:60px 24px}.sv-hero-title{font-size:34px}
  .sv-text,.sv-image,.sv-gallery,.sv-video,.sv-products,.sv-features,.sv-payment,.sv-form{padding-left:20px;padding-right:20px}
  .sv-products-grid{grid-template-columns:1fr 1fr}.sv-features-grid{grid-template-columns:1fr}
}
@media(max-width:480px){
  .sv-products-grid{grid-template-columns:1fr}
  .sv-cart-item{grid-template-columns:40px 1fr auto 24px}
  .sv-ci-subtotal{display:none}
}
</style>
