<!-- ============================================================
  Cart.vue — Page Panier (VERSION COMPLETE CORRIGÉE)
============================================================ -->

<template>
  <div class="cart-root">

    <!-- HEADER -->
    <header class="cart-header">
      <button class="back-btn" @click="$router.push('/')">← Retour</button>
      <h1 class="cart-title">🛒 Mon panier</h1>
      <span class="cart-header-count">{{ cartCount }} article{{ cartCount > 1 ? 's' : '' }}</span>
    </header>

    <!-- NON CONNECTÉ -->
    <div v-if="!uid" class="state-empty">
      <span>🔐</span>
      <p>Connectez-vous pour voir votre panier</p>
      <button class="btn-primary" @click="$router.push('/auth')">Se connecter</button>
    </div>

    <!-- PANIER VIDE -->
    <div v-else-if="cart.length === 0 && !loading" class="state-empty">
      <span>🛍️</span>
      <p>Votre panier est vide</p>
      <button class="btn-primary" @click="$router.push('/')">Voir les produits</button>
    </div>

    <!-- LOADING -->
    <div v-else-if="loading" class="state-loading">
      <div class="spinner"></div>
      <p>Chargement...</p>
    </div>

    <!-- CONTENU -->
    <div v-else class="cart-content">

      <!-- ITEMS -->
      <div class="cart-items">
        <div v-for="(item, index) in cart" :key="index" class="cart-item">
          <div class="item-img">
            <img v-if="item.image" :src="item.image"/>
            <span v-else>🛍️</span>
          </div>

          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-price">{{ item.price }} €</div>
          </div>

          <div class="item-qty">
            <button @click="updateQty(index, item.qty - 1)" :disabled="item.qty <= 1">−</button>
            <span>{{ item.qty }}</span>
            <button @click="updateQty(index, item.qty + 1)">+</button>
          </div>

          <div class="item-subtotal">{{ (item.price * item.qty).toFixed(2) }} €</div>

          <button class="item-del" @click="removeItem(index)">✕</button>
        </div>
      </div>

      <!-- SUMMARY -->
      <div class="cart-summary">

        <div class="summary-row">
          <span>Total</span>
          <strong>{{ total.toFixed(2) }} €</strong>
        </div>

        <!-- INFOS CLIENT -->
        <div class="customer-fields">
          <label>Nom *</label>
          <input v-model="customerName" class="cust-input"/>

          <label>Email *</label>
          <input v-model="customerEmail" type="email" class="cust-input"/>

          <!-- ✅ NOUVEAU -->
          <label>Adresse de livraison *</label>
          <textarea v-model="shippingAddress" class="cust-input"></textarea>
        </div>

        <p v-if="payError" class="pay-error">{{ payError }}</p>

        <button class="pay-btn" @click="payWithStripe">
          💳 Payer {{ total.toFixed(2) }} €
        </button>

        <button class="clear-btn" @click="clearCart">Vider panier</button>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot, updateDoc, addDoc, collection } from "firebase/firestore"

const router = useRouter()

const uid = ref(null)
const cart = ref([])
const loading = ref(true)

const customerName = ref("")
const customerEmail = ref("")
const shippingAddress = ref("") // ✅ NOUVEAU

const payError = ref("")

let userRef = null

// AUTH
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (!user) return
    uid.value = user.uid
    userRef = doc(db, "users", user.uid)

    onSnapshot(userRef, (snap) => {
      cart.value = snap.data()?.cartSession || []
      loading.value = false
    })
  })
})

// COMPUTED
const total = computed(() =>
  cart.value.reduce((s, i) => s + i.price * i.qty, 0)
)

const cartCount = computed(() =>
  cart.value.reduce((s, i) => s + i.qty, 0)
)

// UPDATE QTY
const updateQty = async (index, qty) => {
  if (qty < 1) return
  const updated = [...cart.value]
  updated[index].qty = qty
  await updateDoc(userRef, { cartSession: updated })
}

// REMOVE
const removeItem = async (index) => {
  const updated = [...cart.value]
  updated.splice(index, 1)
  await updateDoc(userRef, { cartSession: updated })
}

// CLEAR
const clearCart = async () => {
  await updateDoc(userRef, { cartSession: [] })
}

// STRIPE
const payWithStripe = async () => {

  // ✅ VALIDATION
  if (!customerName.value || !customerEmail.value || !shippingAddress.value) {
    payError.value = "Tous les champs sont obligatoires"
    return
  }

  const pendingOrder = {
    items: cart.value,
    total: total.value,
    customerName: customerName.value,
    customerEmail: customerEmail.value,
    shippingAddress: shippingAddress.value, // ✅
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem("pendingStripeOrder", JSON.stringify(pendingOrder))

  try {
    const res = await fetch("https://backend-master-production-cf50.up.railway.app/create-stripe-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.value.map(i => ({
          nom: i.name,
          prix: i.price,
          quantity: i.qty,
        })),
        email: customerEmail.value,
        name: customerName.value, // ✅
        address: shippingAddress.value, // ✅
      }),
    })

    const data = await res.json()
    window.location.href = data.url

  } catch (e) {
    payError.value = "Erreur paiement"
  }
}

// SAVE ORDER (appelé après retour Stripe)
export const saveOrder = async (orderData) => {
  if (!uid.value) return

  const order = {
    ...orderData,
    status: "paid",
    createdAt: new Date().toISOString(),
  }

  await addDoc(collection(db, "users", uid.value, "orders"), order)
  await addDoc(collection(db, "orders"), order)

  await updateDoc(userRef, { cartSession: [] }) // ✅ vider panier
}
</script>

<style scoped>
.cart-root{padding:20px}
.cart-item{display:flex;gap:10px;margin-bottom:10px}
.item-img img{width:50px;height:50px}
.pay-btn{background:#6c63ff;color:white;padding:10px}
.cust-input{width:100%;margin-bottom:10px}
</style>
