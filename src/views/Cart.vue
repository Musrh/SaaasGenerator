<template>
  <div class="cart-root">

    <!-- HEADER -->
    <header class="cart-header">
      <button class="back-btn" @click="$router.push('/')">← Retour</button>
      <h1 class="cart-title">🛒 Mon panier</h1>
      <span class="cart-header-count">
        {{ cartCount }} article{{ cartCount > 1 ? 's' : '' }}
      </span>
    </header>

    <!-- NON CONNECTÉ -->
    <div v-if="!uid" class="state-empty">
      <span>🔐</span>
      <p>Connectez-vous pour voir votre panier</p>
      <button class="btn-primary" @click="$router.push('/auth')">
        Se connecter
      </button>
    </div>

    <!-- PANIER VIDE -->
    <div v-else-if="cart.length === 0 && !loading" class="state-empty">
      <span>🛍️</span>
      <p>Votre panier est vide</p>
      <button class="btn-primary" @click="$router.push('/')">
        Voir les produits
      </button>
    </div>

    <!-- LOADING -->
    <div v-else-if="loading" class="state-loading">
      <div class="spinner"></div>
      <p>Chargement...</p>
    </div>

    <!-- CONTENT -->
    <div v-else class="cart-content">

      <!-- ITEMS -->
      <div class="cart-items">
        <div
          v-for="(item, index) in cart"
          :key="item.id || index"
          class="cart-item"
        >

          <div class="item-img">
            <img v-if="item.image" :src="item.image" />
            <span v-else>🛍️</span>
          </div>

          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-price">{{ item.price }} €</div>
          </div>

          <div class="item-qty">
            <button @click="updateQty(index, item.qty - 1)" :disabled="item.qty <= 1">−</button>
            {{ item.qty }}
            <button @click="updateQty(index, item.qty + 1)">+</button>
          </div>

          <div class="item-subtotal">
            {{ (item.price * item.qty).toFixed(2) }} €
          </div>

          <button class="item-del" @click="removeItem(index)">✕</button>
        </div>
      </div>

      <!-- SUMMARY -->
      <div class="cart-summary">

        <div class="summary-row">
          <span>Total</span>
          <strong>{{ total.toFixed(2) }} €</strong>
        </div>

        <!-- CLIENT -->
        <div class="customer-fields">
          <label>Nom *</label>
          <input v-model="customerName" />

          <label>Email *</label>
          <input v-model="customerEmail" type="email" />
        </div>

        <p v-if="payError" class="pay-error">{{ payError }}</p>

        <!-- PAY BUTTON -->
        <button
          class="pay-btn"
          @click="payWithStripe"
          :disabled="cart.length === 0 || paying"
        >
          {{ paying ? "Redirection..." : `💳 Payer ${total.toFixed(2)} €` }}
        </button>

        <!-- CLEAR -->
        <button class="clear-btn" @click="clearCart">
          Vider le panier
        </button>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"

const router = useRouter()

const uid = ref(null)
const cart = ref([])
const loading = ref(true)
const paying = ref(false)
const payError = ref("")
const customerName = ref("")
const customerEmail = ref("")

let userRef = null
let unsubCart = null

// TOTAL
const total = computed(() =>
  cart.value.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0)
)

const cartCount = computed(() =>
  cart.value.reduce((s, i) => s + (i.qty || 1), 0)
)

// AUTH + CART
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      uid.value = null
      cart.value = []
      loading.value = false
      return
    }

    uid.value = user.uid
    userRef = doc(db, "users", user.uid)

    unsubCart = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) {
        cart.value = []
        loading.value = false
        return
      }

      const data = snap.data()
      cart.value = Array.isArray(data.cartSession)
        ? data.cartSession
        : []

      loading.value = false
    })
  })
})

onUnmounted(() => unsubCart?.())

// UPDATE CART SAFE
const save = async (newCart) => {
  if (!userRef) return
  cart.value = newCart
  await updateDoc(userRef, { cartSession: newCart })
}

// QTY
const updateQty = async (index, qty) => {
  if (qty < 1) return
  const updated = [...cart.value]
  updated[index].qty = qty
  await save(updated)
}

// REMOVE
const removeItem = async (index) => {
  const updated = [...cart.value]
  updated.splice(index, 1)
  await save(updated)
}

// CLEAR
const clearCart = async () => {
  if (!confirm("Vider le panier ?")) return
  await updateDoc(userRef, { cartSession: [] })
  cart.value = []
}

// STRIPE PAY
const payWithStripe = async () => {
  if (!customerName.value || !customerEmail.value) {
    payError.value = "Nom et email requis"
    return
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.value)
  if (!emailOk) {
    payError.value = "Email invalide"
    return
  }

  paying.value = true
  payError.value = ""

  try {
    localStorage.setItem("pendingStripeOrder", JSON.stringify({
      items: cart.value,
      total: total.value,
      customerName: customerName.value,
      customerEmail: customerEmail.value,
      ownerUid: uid.value
    }))

    const BACKEND = "https://backend-master-production-cf50.up.railway.app"

    const res = await fetch(`${BACKEND}/create-stripe-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.value.map(i => ({
          nom: i.name,
          prix: i.price,
          quantity: i.qty
        })),
        email: customerEmail.value,
        clientId: uid.value,
        successUrl: window.location.origin + window.location.pathname,
        cancelUrl: window.location.origin + window.location.pathname
      })
    })

    const data = await res.json()

    if (!data.url) throw new Error("Stripe error")

    window.location.href = data.url

  } catch (e) {
    payError.value = e.message
    paying.value = false
  }
}
</script>
