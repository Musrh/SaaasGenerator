<template>
  <div class="cart-root">

    <header class="cart-header">
      <button @click="$router.push('/')">← Retour</button>
      <h2>🛒 Mon panier</h2>
    </header>

    <!-- LOADING -->
    <div v-if="loading">
      <p>Chargement...</p>
    </div>

    <!-- EMPTY -->
    <div v-else-if="cart.length === 0">
      <p>Panier vide</p>
    </div>

    <!-- CART -->
    <div v-else>

      <div v-for="(item, i) in cart" :key="i">
        <p>{{ item.name }} - {{ item.qty }} x {{ item.price }}€</p>

        <button @click="updateQty(i, item.qty - 1)">-</button>
        <button @click="updateQty(i, item.qty + 1)">+</button>
        <button @click="removeItem(i)">Supprimer</button>
      </div>

      <h3>Total : {{ total.toFixed(2) }} €</h3>

      <!-- CLIENT INFOS -->
      <input v-model="customerName" placeholder="Nom complet" />
      <input v-model="customerEmail" placeholder="Email" />
      <textarea v-model="shippingAddress" placeholder="Adresse de livraison"></textarea>

      <p style="color:red">{{ payError }}</p>

      <button @click="payWithStripe" :disabled="paying">
        {{ paying ? "Paiement..." : "Payer" }}
      </button>

      <button @click="clearCart">Vider panier</button>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  addDoc
} from "firebase/firestore"

// STATE
const uid = ref(null)
const cart = ref([])
const loading = ref(true)
const paying = ref(false)
const payError = ref("")

const customerName = ref("")
const customerEmail = ref("")
const shippingAddress = ref("")

let userRef = null
let unsubCart = null

// TOTAL
const total = computed(() =>
  cart.value.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0)
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
      cart.value = snap.data()?.cartSession || []
      loading.value = false
    })
  })
})

onUnmounted(() => unsubCart?.())

// UPDATE QTY
const updateQty = async (i, qty) => {
  if (qty < 1) return
  const updated = [...cart.value]
  updated[i].qty = qty
  await updateDoc(userRef, { cartSession: updated })
}

// REMOVE ITEM
const removeItem = async (i) => {
  const updated = [...cart.value]
  updated.splice(i, 1)
  await updateDoc(userRef, { cartSession: updated })
}

// CLEAR CART
const clearCart = async () => {
  await updateDoc(userRef, { cartSession: [] })
}

// PAY STRIPE
const payWithStripe = async () => {

  // VALIDATION
  if (!customerName.value || !customerEmail.value || !shippingAddress.value) {
    payError.value = "Nom, email et adresse obligatoires"
    return
  }

  paying.value = true
  payError.value = ""

  try {

    // 🔥 IMPORTANT: objet complet sauvegardé
    const pendingOrder = {
      items: cart.value,
      total: total.value,
      customerName: customerName.value,
      customerEmail: customerEmail.value,
      shippingAddress: shippingAddress.value,
      ownerUid: uid.value,
      createdAt: new Date().toISOString()
    }

    localStorage.setItem("pendingStripeOrder", JSON.stringify(pendingOrder))

    // 👉 ENVOI BACKEND (FIX IMPORTANT)
    const res = await fetch(
      "https://backend-master-production-cf50.up.railway.app/create-stripe-session",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.value,
          email: customerEmail.value,

          // ✅ FIX BACKEND
          customerName: customerName.value,
          shippingAddress: shippingAddress.value
        })
      }
    )

    const data = await res.json()

    if (!data.url) throw new Error("Stripe session error")

    window.location.href = data.url

  } catch (e) {
    payError.value = e.message
    paying.value = false
  }
}

// SAVE ORDER (CORRIGÉ SANS export)
const saveOrder = async (orderData) => {
  if (!uid.value) return

  const order = {
    ...orderData,
    status: "paid",
    createdAt: new Date().toISOString()
  }

  await addDoc(collection(db, "users", uid.value, "orders"), order)
  await addDoc(collection(db, "orders"), order)

  await updateDoc(userRef, { cartSession: [] })
}

// expose pour PaymentSuccess.vue
defineExpose({ saveOrder })

</script>
