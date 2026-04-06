<template>
  <div class="cart-container">

    <h2>🛒 Mon panier</h2>

    <p v-if="error" style="color:red">{{ error }}</p>

    <div v-if="cart.length === 0">
      <p>Panier vide</p>
    </div>

    <div v-for="(item, index) in cart" :key="index" class="cart-item">

      <div>
        <strong>{{ item.name }}</strong>
        <p>{{ item.price }} €</p>
      </div>

      <div>
        <button @click="updateQty(index, item.qty - 1)">-</button>
        <span>{{ item.qty }}</span>
        <button @click="updateQty(index, item.qty + 1)">+</button>
      </div>

      <button @click="removeItem(index)">🗑</button>

    </div>

    <hr />

    <h3>Total : {{ total }} €</h3>

    <button @click="pay" :disabled="cart.length === 0">
      💳 Payer
    </button>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { onSnapshot, updateDoc } from "firebase/firestore"

// ⚠️ IMPORT IMPORTANT (à adapter à ton projet)
import { db } from "../firebase"
import { doc } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const cart = ref([])
const error = ref(null)

let cartRef = null

const auth = getAuth()

/* =========================================================
   INIT SAFE
========================================================= */
onMounted(() => {
  try {
    const user = auth.currentUser

    if (!user) {
      error.value = "Utilisateur non connecté"
      return
    }

    cartRef = doc(db, "carts", user.uid)

    onSnapshot(cartRef, (snap) => {
      const data = snap.data()
      cart.value = data?.items || []
    })

  } catch (e) {
    console.error(e)
    error.value = "Erreur chargement panier"
  }
})

/* =========================================================
   TOTAL
========================================================= */
const total = computed(() => {
  return cart.value.reduce((sum, i) => sum + i.price * i.qty, 0)
})

/* =========================================================
   QTY
========================================================= */
async function updateQty(index, qty) {
  if (qty < 1) return

  const updated = [...cart.value]
  updated[index].qty = qty

  await updateDoc(cartRef, {
    items: updated
  })
}

/* =========================================================
   DELETE
========================================================= */
async function removeItem(index) {
  const updated = [...cart.value]
  updated.splice(index, 1)

  await updateDoc(cartRef, {
    items: updated
  })
}

/* =========================================================
   PAY
========================================================= */
async function pay() {
  try {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.value,
        total: total.value
      })
    })

    const data = await res.json()

    if (data.url) {
      window.location.href = data.url
    }
  } catch (e) {
    console.error(e)
  }
}
</script>
