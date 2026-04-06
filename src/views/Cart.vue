<template>
  <div class="cart-container">

    <h2>🛒 Mon panier</h2>

    <div v-if="cart.length === 0">
      <p>Votre panier est vide</p>
    </div>

    <div v-for="(item, index) in cart" :key="index" class="cart-item">

      <div class="info">
        <strong>{{ item.name }}</strong>
        <p>{{ item.price }} €</p>
      </div>

      <div class="qty-controls">
        <button @click="updateQty(index, item.qty - 1)">-</button>

        <span>{{ item.qty }}</span>

        <button @click="updateQty(index, item.qty + 1)">+</button>
      </div>

      <button class="delete" @click="removeItem(index)">
        🗑
      </button>

    </div>

    <hr />

    <h3>Total : {{ total }} €</h3>

    <button class="pay-btn" @click="pay" :disabled="cart.length === 0">
      💳 Payer
    </button>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { onSnapshot, updateDoc } from "firebase/firestore"

// ⚠️ cartRef doit être importé ou passé depuis ton firebase.js
// import { cartRef } from "@/firebase"

const cart = ref([])

/* =========================================================
   1. ÉCOUTE FIRESTORE
========================================================= */
onSnapshot(cartRef, (snap) => {
  const data = snap.data()
  console.log("🔥 SNAP =", data)

  cart.value = data?.items || []
})

/* =========================================================
   2. TOTAL COMMANDE
========================================================= */
const total = computed(() => {
  return cart.value.reduce((sum, item) => {
    return sum + item.price * item.qty
  }, 0)
})

/* =========================================================
   3. MODIFIER QUANTITÉ
========================================================= */
async function updateQty(index, newQty) {
  if (newQty < 1) return

  const updated = [...cart.value]
  updated[index].qty = newQty

  await updateDoc(cartRef, {
    items: updated
  })
}

/* =========================================================
   4. SUPPRIMER PRODUIT
========================================================= */
async function removeItem(index) {
  const updated = [...cart.value]
  updated.splice(index, 1)

  await updateDoc(cartRef, {
    items: updated
  })
}

/* =========================================================
   5. PAIEMENT
========================================================= */
async function pay() {
  try {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: cart.value,
        total: total.value
      })
    })

    const data = await res.json()

    if (data?.url) {
      window.location.href = data.url
    } else {
      alert("Erreur paiement")
    }

  } catch (err) {
    console.error("Erreur paiement:", err)
  }
}
</script>

<style scoped>
.cart-container {
  max-width: 600px;
  margin: auto;
  padding: 20px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.qty-controls button {
  margin: 0 5px;
}

.delete {
  background: red;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}

.pay-btn {
  width: 100%;
  padding: 10px;
  background: green;
  color: white;
  border: none;
  cursor: pointer;
  margin-top: 10px;
}
</style>
