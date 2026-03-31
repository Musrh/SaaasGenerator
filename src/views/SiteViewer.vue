
<!-- ============================================================
  SiteViewer.vue — SaaasGenerator
  Affiche un site publié à partir de Firestore.

  Route : /site/:uid
  :uid  peut être un UID Firestore OU un slug convivial.

  Algorithme de résolution :
    1. Cherche users/{uid}/siteData  (cas UID direct)
    2. Si absent → cherche slugs/{uid} → récupère le vrai uid
       → cherche users/{vrai uid}/siteData  (cas slug)
    3. Si toujours absent → affiche "Site introuvable"
============================================================ -->

<script setup>
import { ref, onMounted, computed } from "vue"
import { db } from "../firebase.js"
import { doc, getDoc } from "firebase/firestore"

// ── Props ─────────────────────────────────────────────────────
const props = defineProps({
  uid: { type: String, required: true }
})

// ── State ─────────────────────────────────────────────────────
const site        = ref(null)       // { pages: [...] }
const loading     = ref(true)
const error       = ref("")
const resolvedUid = ref("")
const currentPageIndex = ref(0)

// ── Panier ────────────────────────────────────────────────────
const cart         = ref([])
const showCart     = ref(false)
const showPayModal = ref(false)
const payProvider  = ref("stripe")

const cartCount = computed(() => cart.value.reduce((s, i) => s + i.qty, 0))
const cartTotal = computed(() => cart.value.reduce((s, i) => s + parseFloat(i.price || 0) * i.qty, 0).toFixed(2))
const cartCurrency = computed(() => cart.value[0]?.currency || "€")

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

// ── Pages ─────────────────────────────────────────────────────
const currentPage = computed(() => site.value?.pages?.[currentPageIndex.value] || site.value?.pages?.[0])

const goToPage = (i) => { currentPageIndex.value = i }

// ── Vidéo embed ───────────────────────────────────────────────
const getEmbedUrl = (url) => {
  if (!url) return ""
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return url
}

// ── Résolution UID / Slug ─────────────────────────────────────
const loadSite = async () => {
  loading.value = true
  error.value   = ""

  try {
    // ── Étape 1 : tenter users/{uid}/siteData ─────────────────
    const userRef  = doc(db, "users", props.uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists() && userSnap.data().siteData) {
      // C'est un UID Firestore direct ✓
      site.value        = userSnap.data().siteData
      resolvedUid.value = props.uid
      loading.value     = false
      return
    }

    // ── Étape 2 : tenter slugs/{uid} → vrai UID ───────────────
    const slugRef  = doc(db, "slugs", props.uid)
    const slugSnap = await getDoc(slugRef)

    if (slugSnap.exists()) {
      const realUid = slugSnap.data().uid

      // Charger le siteData depuis le vrai UID
      const realUserRef  = doc(db, "users", realUid)
      const realUserSnap = await getDoc(realUserRef)

      if (realUserSnap.exists() && realUserSnap.data().siteData) {
        site.value        = realUserSnap.data().siteData
        resolvedUid.value = realUid
        loading.value     = false
        return
      }
    }

    // ── Étape 3 : introuvable ──────────────────────────────────
    error.value   = "Site introuvable. Vérifiez l'adresse."
    loading.value = false

  } catch (e) {
    console.error("SiteViewer error:", e)
    error.value   = "Erreur de chargement : " + e.message
    loading.value = false
  }
}

onMounted(loadSite)
</script>

<template>
<div class="sv-root">

  <!-- ── LOADING ─────────────────────────────────────────── -->
  <div v-if="loading" class="sv-loading">
    <div class="sv-spinner"/>
    <p>Chargement du site...</p>
  </div>

  <!-- ── ERROR ──────────────────────────────────────────── -->
  <div v-else-if="error" class="sv-error">
    <span>🔍</span>
    <h2>{{ error }}</h2>
    <p>L'adresse <code>{{ props.uid }}</code> ne correspond à aucun site publié.</p>
  </div>

  <!-- ── SITE ───────────────────────────────────────────── -->
  <template v-else-if="site">

    <!-- NAV -->
    <nav class="sv-nav">
      <span class="sv-brand">{{ site.name || '◈ Site' }}</span>
      <div class="sv-page-tabs">
        <button
          v-for="(p, i) in site.pages"
          :key="p.id"
          class="sv-tab"
          :class="{ active: currentPageIndex === i }"
          @click="goToPage(i)"
        >{{ p.name }}</button>
      </div>
      <button v-if="cartCount > 0" class="sv-cart-btn" @click="showCart=true">
        🛒 <span class="sv-cart-badge">{{ cartCount }}</span>
      </button>
    </nav>

    <!-- PAGE CONTENT -->
    <main class="sv-page" :style="currentPage?.style">
      <template v-for="s in currentPage?.sections" :key="s.id">

        <!-- HERO -->
        <div v-if="s.type==='hero'" class="sv-hero" :style="s.style">
          <h1 class="sv-hero-title">{{ s.content }}</h1>
          <p class="sv-hero-sub">{{ s.subtitle }}</p>
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
            <iframe :src="getEmbedUrl(s.url)" allowfullscreen/>
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
                  <button class="sv-product-btn" @click="addToCart(p)">
                    🛒 Acheter
                  </button>
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
          <p class="sv-payment-desc">{{ s.description }}</p>
          <div class="sv-payment-amount">{{ s.amount }}{{ s.currency }}</div>
          <div class="sv-payment-btns">
            <button class="sv-pay-btn sv-stripe" @click="payProvider='stripe'; showPayModal=true">
              💳 Payer avec Stripe
            </button>
            <button class="sv-pay-btn sv-paypal" @click="payProvider='paypal'; showPayModal=true">
              🅿 Payer avec PayPal
            </button>
          </div>
        </div>

        <!-- FORM -->
        <div v-else-if="s.type==='form'" class="sv-form" :style="s.style">
          <h3>Contactez-nous</h3>
          <input placeholder="Nom complet"/>
          <input placeholder="Email"/>
          <textarea rows="4" placeholder="Votre message..."/>
          <button type="button">Envoyer →</button>
        </div>

        <!-- DIVIDER -->
        <div v-else-if="s.type==='divider'" class="sv-divider" :style="s.style">
          <hr/>
        </div>

      </template>
    </main>

    <!-- ── CART MODAL ──────────────────────────────────── -->
    <Transition name="sv-modal">
      <div v-if="showCart" class="sv-modal-overlay" @click.self="showCart=false">
        <div class="sv-modal-box">
          <button class="sv-modal-close" @click="showCart=false">✕</button>
          <div class="sv-modal-header">
            <span>🛒</span>
            <h2>Mon panier</h2>
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

    <!-- ── PAYMENT MODAL ──────────────────────────────── -->
    <Transition name="sv-modal">
      <div v-if="showPayModal" class="sv-modal-overlay" @click.self="showPayModal=false">
        <div class="sv-modal-box sv-pay-box">
          <button class="sv-modal-close" @click="showPayModal=false">✕</button>
          <div class="sv-modal-header">
            <span>💳</span>
            <h2>Finaliser le paiement</h2>
            <div class="sv-pay-amount">{{ cartTotal || '—' }}{{ cartCurrency }}</div>
          </div>

          <div class="sv-pay-tabs">
            <button :class="{active:payProvider==='stripe'}" @click="payProvider='stripe'">💳 Stripe</button>
            <button :class="{active:payProvider==='paypal'}" @click="payProvider='paypal'">🅿 PayPal</button>
          </div>

          <div v-if="payProvider==='stripe'" class="sv-pay-form">
            <label>Numéro de carte</label>
            <div class="sv-card-mock">4242 4242 4242 4242</div>
            <div class="sv-pay-row2">
              <div><label>Expiration</label><div class="sv-card-mock">12 / 27</div></div>
              <div><label>CVC</label><div class="sv-card-mock">123</div></div>
            </div>
            <p class="sv-pay-note">🔒 Paiement sécurisé via Stripe</p>
            <button class="sv-btn-primary sv-pay-btn-submit">
              Payer {{ cartTotal }}{{ cartCurrency }}
            </button>
          </div>

          <div v-else class="sv-paypal-info">
            <div class="sv-paypal-logo">PayPal</div>
            <p>Vous serez redirigé vers PayPal pour finaliser votre paiement.</p>
            <button class="sv-btn-paypal">Payer avec PayPal</button>
          </div>
        </div>
      </div>
    </Transition>

  </template>
</div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap');

*{box-sizing:border-box;margin:0;padding:0}
.sv-root{min-height:100vh;font-family:'DM Sans',sans-serif;color:#374151;background:#fff}

/* LOADING / ERROR */
.sv-loading,.sv-error{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;color:#6b7280}
.sv-spinner{width:40px;height:40px;border:3px solid #e5e7eb;border-top-color:#6c63ff;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.sv-error span{font-size:48px}
.sv-error h2{font-size:22px;color:#374151}
.sv-error p{font-size:14px}
.sv-error code{background:#f3f4f6;padding:2px 8px;border-radius:4px;font-size:13px}

/* NAV */
.sv-nav{background:#fff;border-bottom:1px solid #e5e7eb;padding:12px 32px;display:flex;align-items:center;gap:16px;position:sticky;top:0;z-index:100;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.sv-brand{font-family:'Playfair Display',serif;font-size:18px;color:#1a1a2e;margin-right:auto;font-weight:600}
.sv-page-tabs{display:flex;gap:4px;flex-wrap:wrap}
.sv-tab{background:transparent;border:1px solid transparent;color:#6b7280;font-size:14px;padding:6px 14px;border-radius:6px;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.sv-tab:hover{background:#f3f4f6;color:#111}
.sv-tab.active{background:#6c63ff;color:white;border-color:#6c63ff}
.sv-cart-btn{display:flex;align-items:center;gap:6px;background:#f3f4f6;border:1px solid #e5e7eb;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:14px;font-family:'DM Sans',sans-serif;transition:all .15s}
.sv-cart-btn:hover{background:#ede9fe;border-color:#6c63ff}
.sv-cart-badge{background:#6c63ff;color:white;font-size:10px;font-weight:700;padding:2px 7px;border-radius:100px}

/* PAGE */
.sv-page{min-height:calc(100vh - 57px)}

/* HERO */
.sv-hero{padding:100px 60px;background:linear-gradient(135deg,#f8f7ff,#ede9fe);text-align:center}
.sv-hero-title{font-family:'Playfair Display',serif;font-size:52px;font-weight:600;color:#1a1a2e;line-height:1.15;white-space:pre-line;margin-bottom:16px}
.sv-hero-sub{font-size:20px;color:#6b7280;margin-bottom:32px}
.sv-hero-cta{background:#6c63ff;color:white;border:none;border-radius:10px;padding:14px 32px;font-size:16px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:transform .2s}
.sv-hero-cta:hover{transform:translateY(-2px)}

/* TEXT */
.sv-text{padding:48px 60px}
.sv-text p{font-size:17px;line-height:1.8;color:#374151;max-width:720px}

/* IMAGE */
.sv-image{padding:32px 60px}
.sv-image img{width:100%;border-radius:12px;display:block}

/* GALLERY */
.sv-gallery{padding:32px 60px}
.sv-gallery-grid{display:grid;gap:10px}
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
.sv-stripe{background:#635bff;color:white}
.sv-paypal{background:#ffc439;color:#003087}

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
.sv-modal-header{text-align:center;margin-bottom:24px}
.sv-modal-header span{font-size:36px;display:block;margin-bottom:10px}
.sv-modal-header h2{font-family:'Playfair Display',serif;font-size:22px;color:#1a1a2e}
.sv-modal-enter-active,.sv-modal-leave-active{transition:all .25s ease}
.sv-modal-enter-from,.sv-modal-leave-to{opacity:0;transform:scale(.95)}

/* CART MODAL */
.sv-cart-empty{text-align:center;padding:40px;color:#9ca3af;display:flex;flex-direction:column;align-items:center;gap:12px}
.sv-cart-empty span{font-size:40px;opacity:.5}
.sv-cart-items{display:flex;flex-direction:column;gap:10px;margin-bottom:20px;max-height:360px;overflow-y:auto}
.sv-cart-item{display:grid;grid-template-columns:48px 1fr auto auto 24px;align-items:center;gap:10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:10px 12px}
.sv-ci-img{width:48px;height:48px;border-radius:8px;overflow:hidden;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.sv-ci-img img{width:100%;height:100%;object-fit:cover}
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
.sv-pay-amount{font-size:38px;font-weight:700;color:#6c63ff;margin-top:8px}
.sv-pay-tabs{display:flex;gap:8px;margin-bottom:20px}
.sv-pay-tabs button{flex:1;padding:10px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif;color:#6b7280;transition:all .15s}
.sv-pay-tabs button.active{background:#635bff;color:white;border-color:#635bff}
.sv-pay-form{display:flex;flex-direction:column;gap:14px}
.sv-pay-form label{display:block;font-size:11px;color:#6b7280;margin-bottom:4px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.sv-card-mock{background:#f3f4f6;border:1px solid #e5e7eb;padding:10px 14px;border-radius:8px;font-size:14px;font-family:monospace;letter-spacing:1px;color:#9ca3af}
.sv-pay-row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sv-pay-note{font-size:11px;color:#9ca3af;text-align:center}
.sv-pay-btn-submit{width:100%;padding:14px;background:#635bff;color:white;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;margin-top:4px}
.sv-paypal-info{text-align:center;display:flex;flex-direction:column;gap:14px;align-items:center}
.sv-paypal-logo{font-size:22px;font-weight:800;color:#003087;background:#ffc439;padding:8px 24px;border-radius:8px;display:inline-block}
.sv-paypal-info p{font-size:14px;color:#6b7280}
.sv-btn-paypal{background:#ffc439;color:#003087;border:none;border-radius:8px;padding:13px 28px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;width:100%}

@media(max-width:768px){
  .sv-nav{padding:10px 16px;flex-wrap:wrap}
  .sv-hero{padding:60px 24px}
  .sv-hero-title{font-size:34px}
  .sv-text,.sv-image,.sv-gallery,.sv-video,.sv-products,.sv-features,.sv-payment,.sv-form{padding-left:20px;padding-right:20px}
  .sv-products-grid{grid-template-columns:1fr 1fr}
  .sv-features-grid{grid-template-columns:1fr}
}
@media(max-width:480px){
  .sv-products-grid{grid-template-columns:1fr}
  .sv-cart-item{grid-template-columns:40px 1fr auto 24px}
  .sv-ci-subtotal{display:none}
}
</style>
