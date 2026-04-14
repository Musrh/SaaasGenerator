<script setup>
import { ref, onMounted, computed } from "vue"
import { useRouter } from "vue-router"
import { db } from "../firebase.js"
import { doc, getDoc } from "firebase/firestore"

const props = defineProps({ uid: String })
const router = useRouter()

// STATE
const site = ref(null)
const loading = ref(true)
const error = ref("")
const resolvedUid = ref("")

// CART / PAYMENT
const cart = ref([])
const showCart = ref(false)
const payProcessing = ref(false)
const payError = ref("")
const customerName = ref("")
const customerEmail = ref("")

// CONFIG
const storePayConfig = ref({})

// ✅ STORE READY
const isStoreReady = computed(() => {
  return !!resolvedUid.value && resolvedUid.value.trim() !== ""
})

// =======================================================
// LOAD SITE
// =======================================================
const loadSite = async () => {
  loading.value = true
  error.value = ""
  resolvedUid.value = "" // 🔴 IMPORTANT

  const uid = props.uid?.trim()

  if (!uid) {
    error.value = "UID manquant"
    loading.value = false
    return
  }

  try {
    // 1. UID direct
    const snap = await getDoc(doc(db, "users", uid))

    if (snap.exists() && snap.data().siteData) {
      site.value = snap.data().siteData
      resolvedUid.value = uid
      await loadPayConfig(uid)
      loading.value = false
      return
    }

    // 2. SLUG
    const slugSnap = await getDoc(doc(db, "slugs", uid))

    if (slugSnap.exists()) {
      const realUid = slugSnap.data().uid
      const realSnap = await getDoc(doc(db, "users", realUid))

      if (realSnap.exists() && realSnap.data().siteData) {
        site.value = realSnap.data().siteData
        resolvedUid.value = realUid
        await loadPayConfig(realUid)
        loading.value = false
        return
      }
    }

    error.value = "Site introuvable"
    loading.value = false

  } catch (e) {
    error.value = e.message
    loading.value = false
  }
}

// =======================================================
// LOAD PAYMENT CONFIG
// =======================================================
const loadPayConfig = async (uid) => {
  try {
    const snap = await getDoc(doc(db, "users", uid))
    if (snap.exists()) {
      storePayConfig.value = snap.data().storePaymentConfig || {}
    }
  } catch (e) {
    console.log("Pas de config paiement")
  }
}

// =======================================================
// CART
// =======================================================
const addToCart = (product) => {
  if (!isStoreReady.value) {
    alert("Chargement du store...")
    return
  }

  const ex = cart.value.find(i => i.id === product.id)
  ex ? ex.qty++ : cart.value.push({ ...product, qty: 1 })
  showCart.value = true
}

// =======================================================
// 💳 STRIPE PAYMENT FIX
// =======================================================
const payWithStripe = async () => {
  const cfg = storePayConfig.value?.stripe

  console.log("🚀 PAY CLICK")
  console.log("👉 resolvedUid:", resolvedUid.value)

  if (!isStoreReady.value) {
    payError.value = "❌ Store non chargé"
    return
  }

  if (!cfg?.backendUrl) {
    payError.value = "Backend Stripe non configuré"
    return
  }

  if (!customerName.value || !customerEmail.value) {
    payError.value = "Nom et email requis"
    return
  }

  if (!cart.value.length) {
    payError.value = "Panier vide"
    return
  }

  payProcessing.value = true
  payError.value = ""

  try {
    const ownerUid = resolvedUid.value.trim()

    const payload = {
      ownerUid,
      email: customerEmail.value,
      items: cart.value.map(i => ({
        nom: i.name,
        prix: parseFloat(i.price),
        quantity: i.qty,
      })),
    }

    console.log("📦 PAYLOAD:", payload)

    const res = await fetch(cfg.backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) throw new Error(data.error)
    if (!data.url) throw new Error("Pas d'URL Stripe")

    window.location.href = data.url

  } catch (e) {
    console.error(e)
    payError.value = e.message
    payProcessing.value = false
  }
}

onMounted(loadSite)
</script>

<template>
<div>

  <!-- DEBUG -->
  <div style="position:fixed;bottom:10px;left:10px;background:#000;color:#0f0;padding:6px;font-size:11px">
    UID: {{ resolvedUid || '❌ VIDE' }}
  </div>

  <!-- LOADING -->
  <div v-if="loading">Chargement...</div>

  <!-- ERROR -->
  <div v-else-if="error">
    ❌ {{ error }}
  </div>

  <!-- SITE -->
  <div v-else>

    <h1>Store</h1>

    <!-- PRODUCTS -->
    <div v-for="p in site.pages?.[0]?.sections?.[0]?.items || []" :key="p.id">
      <p>{{ p.name }} - {{ p.price }}€</p>
      <button @click="addToCart(p)">Ajouter</button>
    </div>

    <!-- CART -->
    <div v-if="showCart">
      <h2>Panier</h2>

      <div v-for="item in cart" :key="item.id">
        {{ item.name }} x{{ item.qty }}
      </div>

      <input v-model="customerName" placeholder="Nom" />
      <input v-model="customerEmail" placeholder="Email" />

      <p v-if="payError" style="color:red">{{ payError }}</p>

      <button
        @click="payWithStripe"
        :disabled="payProcessing || !isStoreReady"
      >
        {{ payProcessing ? "Chargement..." : "Payer" }}
      </button>
    </div>

  </div>
</div>
</template>
