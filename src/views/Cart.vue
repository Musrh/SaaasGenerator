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

    <!-- BOUTON -->
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

// 🔥 INFOS CLIENT
const customerName = ref("")
const customerEmail = ref("")
const customerAddress = ref("")

// 🔥 TOTAL
const total = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.qty, 0)
)

// 🔥 SYNC PANIER FIRESTORE
onMounted(() => {
  const user = auth.currentUser
  if (!user) return

  const userRef = doc(db, "users", user.uid)

  onSnapshot(userRef, (snap) => {
    cart.value = snap.data()?.cartSession || []
  })
})

// 🔥 CHECKOUT STRIPE
const checkout = async () => {
  const user = auth.currentUser
  if (!user) {
    alert("Non connecté")
    return
  }

  if (!customerName.value || !customerEmail.value || !customerAddress.value) {
    alert("Remplis toutes les infos")
    return
  }

  try {
    const orderData = {
      items: cart.value,
      total: total.value,
      customerName: customerName.value,
      customerEmail: customerEmail.value,
      customerAddress: customerAddress.value
    }

    // ✅ sauvegarde temporaire
    localStorage.setItem("pendingStripeOrder", JSON.stringify(orderData))

    console.log("📦 Envoi backend =", orderData)

    // 🔥 TON BACKEND RAILWAY
    const res = await fetch("https://backend-master-production-cf50.up.railway.app/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Math.round(total.value * 100),
        currency: "eur",
        items: cart.value,
        customerName: customerName.value,
        customerEmail: customerEmail.value,
        customerAddress: customerAddress.value,
        uid: user.uid
      })
    })

    const data = await res.json()

    console.log("🔥 Réponse backend =", data)

    if (!data.url) {
      alert("Erreur Stripe : URL manquante")
      return
    }

    // ✅ REDIRECTION STRIPE
    window.location.href = data.url

  } catch (err) {
    console.error("❌ Erreur checkout:", err)
    alert("Erreur paiement")
  }
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

button {
  margin-top: 20px;
  padding: 12px;
  width: 100%;
  background: black;
  color: white;
  border: none;
  cursor: pointer;
}
</style>
