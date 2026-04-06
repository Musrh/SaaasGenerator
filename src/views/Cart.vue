<template>
  <div style="padding:20px">

    <h1>🛒 Mon panier</h1>

    <p v-if="error" style="color:red">{{ error }}</p>

    <!-- PANIER VIDE -->
    <div v-if="cart.length === 0">
      <p>Panier vide</p>
    </div>

    <!-- PRODUITS -->
    <div
      v-for="(item, index) in cart"
      :key="item.id || index"
      style="margin-bottom:15px"
    >

      <h3>{{ item.name }}</h3>
      <p>{{ item.price }} €</p>

      <div style="display:flex; gap:10px; align-items:center">

        <!-- QUANTITY -->
        <button @click="updateQty(index, item.qty - 1)">-</button>

        <span>{{ item.qty }}</span>

        <button @click="updateQty(index, item.qty + 1)">+</button>

        <!-- DELETE -->
        <button @click="removeItem(index)" style="color:red">
          🗑
        </button>

      </div>

    </div>

    <hr>

    <!-- TOTAL -->
    <h2>Total : {{ total }} €</h2>

    <!-- PAYER -->
    <button @click="pay" :disabled="cart.length === 0">
      💳 Payer
    </button>

  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { db } from "@/firebase"

const cart = ref([])
const error = ref(null)

const auth = getAuth()
let userRef = null

/* =========================================================
   🔐 AUTH + LIVE CART SESSION
========================================================= */
onAuthStateChanged(auth, (user) => {

  if (!user) {
    cart.value = []
    error.value = "Utilisateur non connecté"
    return
  }

  userRef = doc(db, "users", user.uid)

  onSnapshot(userRef, (snap) => {

    const data = snap.data()

    // 🔥 IMPORTANT : cartSession
    cart.value = data?.cartSession || []

    console.log("🔥 CART SESSION =", cart.value)
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
   ➕➖ QUANTITY UPDATE
========================================================= */
async function updateQty(index, qty) {
  if (qty < 1) return

  const updated = [...cart.value]
  updated[index].qty = qty

  await updateDoc(userRef, {
    cartSession: updated
  })
}

/* =========================================================
   🗑 DELETE ITEM
========================================================= */
async function removeItem(index) {
  const updated = [...cart.value]
  updated.splice(index, 1)

  await updateDoc(userRef, {
    cartSession: updated
  })
}

/* =========================================================
   💳 PAY → MOVE TO ORDERS + CLEAR CART
========================================================= */
async function pay() {

  const user = auth.currentUser
  if (!user) return

  const order = {
    items: cart.value,
    total: total.value,
    createdAt: Date.now(),
    status: "paid"
  }

  try {

    // 🔥 1. ADD TO ORDERS
    await updateDoc(userRef, {
      orders: arrayUnion(order)
    })

    // 🧹 2. CLEAR CART SESSION
    await updateDoc(userRef, {
      cartSession: []
    })

    alert("Paiement réussi 🎉")

  } catch (e) {
    console.error(e)
    alert("Erreur paiement")
  }
}
</script>
