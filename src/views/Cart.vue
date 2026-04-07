<template>
  <div class="cart">

    <h2>🛒 Mon panier</h2>

    <!-- PRODUITS -->
    <div v-if="cart.length">
      <div v-for="item in cart" :key="item.id" class="item">
        <h3>{{ item.name }}</h3>
        <p>{{ item.price }} € x {{ item.qty }}</p>
      </div>

      <h3>Total : {{ total }} €</h3>
    </div>

    <p v-else>Panier vide</p>

    <!-- FORMULAIRE CLIENT -->
    <div class="form" v-if="cart.length">
      <h3>📦 Informations client</h3>

      <input v-model="customerName" placeholder="Nom complet" />
      <input v-model="customerEmail" placeholder="Email" />
      <textarea v-model="customerAddress" placeholder="Adresse de livraison"></textarea>
    </div>

    <!-- BOUTON PAYER -->
    <button v-if="cart.length" @click="checkout">
      💳 Payer
    </button>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { getAuth } from "firebase/auth"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { db } from "../firebase"

const auth = getAuth()

const cart = ref([])

// 🔥 FORMULAIRE CLIENT
const customerName = ref("")
const customerEmail = ref("")
const customerAddress = ref("")

// 🔥 TOTAL
const total = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.qty, 0)
)

// 🔥 CHARGEMENT PANIER FIRESTORE
onMounted(() => {
  const user = auth.currentUser
  if (!user) return

  const refUser = doc(db, "users", user.uid)

  onSnapshot(refUser, (snap) => {
    cart.value = snap.data()?.cartSession || []
  })
})

// 🔥 CHECKOUT
const checkout = async () => {
  const user = auth.currentUser
  if (!user) return alert("Non connecté")

  // ⚠️ validation simple
  if (!customerName.value || !customerEmail.value || !customerAddress.value) {
    return alert("Remplis toutes les informations")
  }

  const orderData = {
    items: cart.value,
    total: total.value,
    customerName: customerName.value,
    customerEmail: customerEmail.value,
    customerAddress: customerAddress.value
  }

  // 🔥 1. sauver dans Firestore (cartSession enrichi)
  await updateDoc(doc(db, "users", user.uid), {
    cartSession: cart.value
  })

  // 🔥 2. sauver temporairement pour PaymentSuccess
  localStorage.setItem("pendingStripeOrder", JSON.stringify(orderData))

  // 🔥 3. envoyer au backend Stripe
  const res = await fetch("https://ton-backend-stripe.com/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: total.value * 100,
      currency: "eur",
      items: cart.value,
      customerName: customerName.value,
      customerEmail: customerEmail.value,
      customerAddress: customerAddress.value,
      uid: user.uid
    })
  })

  const data = await res.json()

  // 🔥 4. redirection Stripe
  window.location.href = data.url
}
</script>

<style scoped>
.cart {
  padding: 20px;
}

.item {
  border-bottom: 1px solid #ddd;
  margin-bottom: 10px;
}

.form {
  margin-top: 20px;
}

input, textarea {
  display: block;
  margin-bottom: 10px;
  width: 100%;
  padding: 10px;
}
</style>
