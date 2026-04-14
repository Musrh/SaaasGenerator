<!-- ============================================================
  SITEVIEWER.VUE — VERSION CORRIGÉE (BACKEND COMPATIBLE)
============================================================ -->

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useRouter } from "vue-router"
import { db } from "../firebase.js"
import { doc, getDoc, collection, addDoc } from "firebase/firestore"
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth"

const clientAuth = getAuth()
const router = useRouter()

// ============================================================
// STATE
// ============================================================
const props = defineProps({ uid: { type: String, required: true } })

const site = ref(null)
const loading = ref(true)
const error = ref("")
const resolvedUid = ref("")

// AUTH CLIENT
const svCurrentUser = ref(null)

// CART
const cart = ref([])
const showCart = ref(false)

// CHECKOUT
const customerName = ref("")
const customerEmail = ref("")
const payProcessing = ref(false)
const payError = ref("")

// PAYMENT CONFIG
const storePayConfig = ref({ stripe: null, paypal: null })

// ============================================================
// COMPUTED
// ============================================================
const cartCount = computed(() =>
  cart.value.reduce((s, i) => s + i.qty, 0)
)

const cartTotal = computed(() =>
  cart.value
    .reduce((s, i) => s + Number(i.price || 0) * i.qty, 0)
    .toFixed(2)
)

// ============================================================
// LOAD SITE
// ============================================================
const loadSite = async () => {
  loading.value = true
  try {
    const snap = await getDoc(doc(db, "users", props.uid))

    if (snap.exists() && snap.data().siteData) {
      site.value = snap.data().siteData
      resolvedUid.value = props.uid
    } else {
      error.value = "Site introuvable"
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// ============================================================
// CART
// ============================================================
const addToCart = (product) => {
  if (!clientAuth.currentUser) {
    router.push(`/auth?store=${props.uid}`)
    return
  }

  const existing = cart.value.find(i => i.id === product.id)

  if (existing) {
    existing.qty++
  } else {
    cart.value.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      qty: 1
    })
  }

  showCart.value = true
}

const removeFromCart = (id) => {
  cart.value = cart.value.filter(i => i.id !== id)
}

// ============================================================
// 🔥 STRIPE CHECKOUT (FIXED BACKEND COMPATIBLE)
// ============================================================
const payWithStripe = async () => {
  const cfg = storePayConfig.value?.stripe

  if (!cfg?.backendUrl) {
    payError.value = "Backend Stripe non configuré"
    return
  }

  if (!customerEmail.value) {
    payError.value = "Email requis"
    return
  }

  if (!resolvedUid.value) {
    payError.value = "Store introuvable"
    return
  }

  if (!cart.value.length) {
    payError.value = "Panier vide"
    return
  }

  payProcessing.value = true
  payError.value = ""

  try {
    // =====================================================
    // 🔥 FORMAT EXACT BACKEND
    // =====================================================
    const payload = {
      ownerUid: resolvedUid.value,
      email: customerEmail.value.trim().toLowerCase(),

      items: cart.value.map(i => ({
        nom: i.name,
        prix: Number(i.price),
        quantity: Number(i.qty)
      }))
    }

    console.log("📦 PAYLOAD:", payload)

    const res = await fetch(
      cfg.backendUrl + "/create-store-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    )

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || "Erreur backend")
    }

    if (data.url) {
      window.location.href = data.url
    } else {
      throw new Error("URL Stripe manquante")
    }

  } catch (e) {
    console.error(e)
    payError.value = e.message
  } finally {
    payProcessing.value = false
  }
}

// ============================================================
// AUTH STATE
// ============================================================
onMounted(() => {
  loadSite()
  onAuthStateChanged(clientAuth, (user) => {
    svCurrentUser.value = user
  })
})
</script>

<template>
  <div class="p-6 text-white">
    
    <!-- LOADING -->
    <div v-if="loading">Chargement...</div>

    <!-- ERROR -->
    <div v-if="error" class="text-red-500">
      {{ error }}
    </div>

    <!-- SITE -->
    <div v-if="site">

      <h1 class="text-2xl font-bold">
        {{ site.title }}
      </h1>

      <!-- PRODUCTS -->
      <div class="grid grid-cols-2 gap-4 mt-6">
        <div
          v-for="p in site.products"
          :key="p.id"
          class="bg-gray-800 p-4 rounded"
        >
          <h3>{{ p.name }}</h3>
          <p>{{ p.price }} €</p>

          <button
            class="bg-blue-500 px-3 py-1 mt-2"
            @click="addToCart(p)"
          >
            Ajouter
          </button>
        </div>
      </div>

      <!-- CART -->
      <div v-if="cart.length" class="mt-10 bg-gray-900 p-4">
        <h2 class="text-xl">Panier</h2>

        <div v-for="item in cart" :key="item.id">
          {{ item.name }} x{{ item.qty }}
        </div>

        <p>Total: {{ cartTotal }} €</p>

        <input
          v-model="customerEmail"
          placeholder="Email"
          class="text-black p-2 mt-2"
        />

        <button
          class="bg-green-500 px-4 py-2 mt-2"
          :disabled="payProcessing"
          @click="payWithStripe"
        >
          Payer Stripe
        </button>

        <p v-if="payError" class="text-red-400">
          {{ payError }}
        </p>
      </div>

    </div>
  </div>
</template>
