<!-- ============================================================
  SITEVIEWER.VUE — VERSION PRO (SECTIONS FIX + STRIPE FIX)
============================================================ -->

<script setup>
import { ref, onMounted, computed } from "vue"
import { useRouter } from "vue-router"
import { db } from "../firebase.js"
import { doc, getDoc } from "firebase/firestore"
import { getAuth, onAuthStateChanged } from "firebase/auth"

const clientAuth = getAuth()
const router = useRouter()

// ===================== PROPS =====================
const props = defineProps({
  uid: { type: String, required: true }
})

// ===================== STATE =====================
const site = ref(null)
const loading = ref(true)
const error = ref("")
const resolvedUid = ref("")

// CART
const cart = ref([])
const showCart = ref(false)

// CHECKOUT
const customerEmail = ref("")
const payProcessing = ref(false)
const payError = ref("")

// PAYMENT CONFIG
const storePayConfig = ref({ stripe: null, paypal: null })

// AUTH
const currentUser = ref(null)

// ===================== COMPUTED =====================
const cartCount = computed(() =>
  cart.value.reduce((s, i) => s + i.qty, 0)
)

const cartTotal = computed(() =>
  cart.value.reduce((s, i) => s + Number(i.price || 0) * i.qty, 0).toFixed(2)
)

// ===================== LOAD SITE =====================
const loadSite = async () => {
  loading.value = true
  error.value = ""

  try {
    const snap = await getDoc(doc(db, "users", props.uid))

    if (!snap.exists()) {
      error.value = "Site introuvable"
      return
    }

    const data = snap.data()

    // 🔥 IMPORTANT
    site.value = data.siteData || {}

    resolvedUid.value = props.uid

    console.log("SITE LOADED:", site.value)

  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// ===================== CART =====================
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

// ===================== STRIPE CHECKOUT =====================
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

  if (!cart.value.length) {
    payError.value = "Panier vide"
    return
  }

  payProcessing.value = true
  payError.value = ""

  try {
    // 🔥 FORMAT COMPATIBLE BACKEND
    const payload = {
      ownerUid: resolvedUid.value,
      email: customerEmail.value.trim().toLowerCase(),

      items: cart.value.map(i => ({
        nom: i.name,
        prix: Number(i.price),
        quantity: Number(i.qty)
      }))
    }

    const res = await fetch(cfg.backendUrl + "/create-store-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    const data = await res.json()

    if (!res.ok) throw new Error(data.error || "Erreur backend")

    window.location.href = data.url

  } catch (e) {
    payError.value = e.message
  } finally {
    payProcessing.value = false
  }
}

// ===================== AUTH =====================
onMounted(() => {
  loadSite()
  onAuthStateChanged(clientAuth, (user) => {
    currentUser.value = user
  })
})
</script>

<!-- ===================== TEMPLATE ===================== -->
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

      <!-- ================= SECTIONS ================= -->
      <div v-if="site.sections && site.sections.length">

        <div
          v-for="(section, index) in site.sections"
          :key="index"
          class="mb-10"
        >

          <!-- HERO -->
          <div v-if="section.type === 'hero'" class="text-center">
            <h1 class="text-3xl font-bold">
              {{ section.title }}
            </h1>
            <p class="text-gray-300">
              {{ section.subtitle }}
            </p>
          </div>

          <!-- PRODUCTS -->
          <div v-else-if="section.type === 'products'">
            <h2 class="text-xl font-bold mb-4">
              {{ section.title }}
            </h2>

            <div class="grid grid-cols-2 gap-4">
              <div
                v-for="p in (section.items || [])"
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
          </div>

          <!-- TEXT -->
          <div v-else-if="section.type === 'text'">
            <p class="text-gray-300">
              {{ section.content }}
            </p>
          </div>

          <!-- IMAGE -->
          <div v-else-if="section.type === 'image'">
            <img :src="section.url" class="rounded w-full" />
          </div>

        </div>

      </div>

      <!-- EMPTY -->
      <div v-else>
        <p class="text-gray-400">
          Aucune section disponible
        </p>
      </div>

      <!-- ================= CART ================= -->
      <div v-if="cart.length" class="mt-10 bg-gray-900 p-4 rounded">

        <h2 class="text-xl mb-2">Panier</h2>

        <div v-for="item in cart" :key="item.id">
          {{ item.name }} x{{ item.qty }}
        </div>

        <p class="mt-2">Total: {{ cartTotal }} €</p>

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
