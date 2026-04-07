<template>
  <div style="padding:20px">

    <h1>🛒 Mon panier</h1>

    <p v-if="error" style="color:red">{{ error }}</p>

    <!-- CLIENT INFOS -->
    <div style="margin-bottom:20px; padding:10px; border:1px solid #ddd">

      <h3>👤 Informations client</h3>

      <input
        v-model="name"
        placeholder="Nom complet"
        style="display:block; margin-bottom:10px; padding:5px"
      />

      <input
        v-model="email"
        placeholder="Email"
        style="display:block; margin-bottom:10px; padding:5px"
      />

      <input
        v-model="address"
        placeholder="Adresse de livraison"
        style="display:block; margin-bottom:10px; padding:5px"
      />

    </div>

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
        <button @click="updateQty(index, item.qty - 1)">-</button>
        <span>{{ item.qty }}</span>
        <button @click="updateQty(index, item.qty + 1)">+</button>

        <button @click="removeItem(index)" style="color:red">🗑</button>
      </div>
    </div>

    <hr>

    <!-- TOTAL -->
    <h2>Total : {{ total }} €</h2>

    <!-- PAYER -->
    <button
      @click="pay"
      :disabled="cart.length === 0"
      style="background:green;color:white;padding:10px"
    >
      💳 Payer avec Stripe
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

const name = ref("")
const email = ref("")
const address = ref("")

const auth = getAuth()
let userRef = null

/* =========================
   AUTH + CART
========================= */
onAuthStateChanged(auth, (user) => {

  if (!user) {
    cart.value = []
    error.value = "Utilisateur non connecté"
    return
  }

  userRef = doc(db, "users", user.uid)

  onSnapshot(userRef, (snap) => {
    const data = snap.data()

    cart.value = data?.cartSession || []

    // auto-fill email
    email.value = user.email || ""
  })
})

/* =========================
   TOTAL
========================= */
const total = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.qty, 0)
)

/* =========================
   UPDATE QTY
========================= */
async function updateQty(index, qty) {
  if (qty < 1) return

  const updated = [...cart.value]
  updated[index].qty = qty

  await updateDoc(userRef, {
    cartSession: updated
  })
}

/* =========================
   REMOVE ITEM
========================= */
async function removeItem(index) {
  const updated = [...cart.value]
  updated.splice(index, 1)

  await updateDoc(userRef, {
    cartSession: updated
  })
}

/* =========================
   💳 STRIPE PAY
========================= */
async function pay() {
  const user = auth.currentUser
  if (!user) return

  try {
    const payload = {
      items: cart.value,
      total: total.value,
      customer: {
        uid: user.uid,
        name: name.value,
        email: email.value,
        address: address.value
      }
    }

    const res = await fetch(
      "https://backend-master-production-cf50.up.railway.app/create-stripe-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    )

    const data = await res.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      console.error(data)
      alert("Erreur paiement Stripe")
    }

  } catch (e) {
    console.error(e)
    alert("Erreur serveur paiement")
  }
}
</script>
