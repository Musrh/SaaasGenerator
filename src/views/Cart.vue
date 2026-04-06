<template>
  <div class="cart">

    <h2>🛒 Mon panier</h2>

    <p v-if="error" style="color:red">{{ error }}</p>

    <div v-if="cart.length === 0">
      <p>Panier vide</p>
    </div>

    <div v-for="(item, index) in cart" :key="item.id || index" class="item">

      <div class="info">
        <strong>{{ item.name }}</strong>
        <p>{{ item.price }} €</p>
      </div>

      <div class="qty">
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

    <button class="pay" @click="pay" :disabled="cart.length === 0">
      💳 Payer
    </button>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { onSnapshot, updateDoc, doc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { db } from "../firebase"

const cart = ref([])
const error = ref(null)

const auth = getAuth()
let cartRef = null

/* =========================================================
   🔥 FIRESTORE LISTENER (cart, PAS items)
========================================================= */
onMounted(() => {
  const user = auth.currentUser

  if (!user) {
    error.value = "Utilisateur non connecté"
    return
  }

  cartRef = doc(db, "carts", user.uid)

  onSnapshot(cartRef, (snap) => {
    console.log("🔥 SNAP =", snap.data())

    if (!snap.exists()) {
      cart.value = []
      return
    }

    cart.value = snap.data().cart || []
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

  await updateDoc(cartRef, {
    cart: updated
  })
}

/* =========================================================
   🗑 DELETE ITEM
========================================================= */
async function removeItem(index) {
  const updated = [...cart.value]
  updated.splice(index, 1)

  await updateDoc(cartRef, {
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

<style scoped>
.cart {
  max-width: 600px;
  margin: auto;
  padding: 20px;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #ddd;
  margin-bottom: 10px;
  border-radius: 8px;
}

.qty button {
  margin: 0 5px;
}

.delete {
  background: red;
  color: white;
  border: none;
  padding: 5px 10px;
}

.pay {
  width: 100%;
  padding: 10px;
  background: green;
  color: white;
  border: none;
  margin-top: 10px;
}
</style>
