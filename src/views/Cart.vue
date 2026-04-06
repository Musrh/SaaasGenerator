<template>
  <div style="padding:20px">

    <h1>🛒 Mon panier</h1>

    <p v-if="error" style="color:red">{{ error }}</p>

    <div v-if="cart.length === 0">
      <p>Panier vide</p>
    </div>

    <!-- PRODUITS -->
    <div v-for="(item, index) in cart" :key="item.id || index" style="margin-bottom:15px">

      <h3>{{ item.name }}</h3>
      <p>{{ item.price }} €</p>

      <div style="display:flex; gap:10px; align-items:center">

        <button @click="updateQty(index, item.qty - 1)">-</button>

        <span>{{ item.qty }}</span>

        <button @click="updateQty(index, item.qty + 1)">+</button>

        <button @click="removeItem(index)" style="color:red">
          🗑
        </button>

      </div>

    </div>

    <hr>

    <h2>Total : {{ total }} €</h2>

    <button @click="pay" :disabled="cart.length === 0">
      💳 Payer
    </button>

  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { db } from "../firebase"

const cart = ref([])
const error = ref(null)

const auth = getAuth()
let userRef = null

/* =========================================================
   🔥 AUTH SAFE + FIRESTORE LISTENER
========================================================= */
onAuthStateChanged(auth, (user) => {

  if (!user) {
    cart.value = []
    error.value = "Utilisateur non connecté"
    return
  }

  userRef = doc(db, "users", user.uid)

  onSnapshot(userRef, (snap) => {

    if (!snap.exists()) {
      cart.value = []
      return
    }

    const data = snap.data()

    console.log("🔥 CART LIVE =", data)

    cart.value = data.cart || []   // ✅ IMPORTANT
  })
})

/* =========================================================
   🧮 TOTAL
========================================================= */
const total = computed(() => {
  return cart.value.reduce((sum, item) => {
    return sum + item.price * item.qty
  }, 0)
})

/* =========================================================
   ➕➖ QUANTITY
========================================================= */
async function updateQty(index, qty) {
  if (qty < 1) return

  const updated = [...cart.value]
  updated[index].qty = qty

  await updateDoc(userRef, {
    cart: updated
  })
}

/* =========================================================
   🗑 DELETE ITEM
========================================================= */
async function removeItem(index) {
  const updated = [...cart.value]
  updated.splice(index, 1)

  await updateDoc(userRef, {
    cart: updated
  })
}

/* =========================================================
   💳 PAY BUTTON
========================================================= */
async function pay() {
  try {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cart: cart.value,
        total: total.value
      })
    })

    const data = await res.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      alert("Erreur paiement")
    }

  } catch (e) {
    console.error(e)
  }
}
</script>
