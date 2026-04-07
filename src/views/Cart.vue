<script setup>
import { ref, computed, onMounted } from "vue"

// 🛒 PANIER
const cart = ref([])

// 👤 CLIENT
const name = ref("")
const email = ref("")
const address = ref("") // ✅ FIX ICI (erreur corrigée)

// 💰 TOTAL
const total = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.qty, 0)
)

// 📦 LOAD PANIER
onMounted(() => {
  loadCart()
})

function loadCart() {
  const saved = localStorage.getItem("cart")
  cart.value = saved ? JSON.parse(saved) : []
}

// 💾 SAVE PANIER
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart.value))
}

// 🛒 AJOUT PRODUIT
function addToCart(product) {
  const existing = cart.value.find(i => i.id === product.id)

  if (existing) {
    existing.qty++
  } else {
    cart.value.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image || "",
      qty: 1
    })
  }

  saveCart()
}

// ➕
function increase(item) {
  item.qty++
  saveCart()
}

// ➖
function decrease(item) {
  if (item.qty > 1) {
    item.qty--
  } else {
    remove(item)
  }
  saveCart()
}

// ❌ SUPPRIMER
function remove(item) {
  cart.value = cart.value.filter(i => i.id !== item.id)
  saveCart()
}

// 🗑️ VIDER PANIER
function clearCart() {
  cart.value = []
  localStorage.removeItem("cart")
}

// 💳 PAIEMENT STRIPE
async function pay() {
  try {
    if (!name.value || !email.value || !address.value) {
      alert("❌ Remplir toutes les informations client")
      return
    }

    if (cart.value.length === 0) {
      alert("❌ Panier vide")
      return
    }

    const payload = {
      items: cart.value.map(i => ({
        name: i.name,
        price: i.price,
        quantity: i.qty
      })),
      customer: {
        name: name.value,
        email: email.value,
        address: address.value
      }
    }

    console.log("📦 PAYLOAD :", payload)

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

    if (!res.ok) {
      const err = await res.text()
      console.error("BACKEND ERROR:", err)
      alert("❌ Erreur paiement backend")
      return
    }

    const data = await res.json()

    console.log("✅ STRIPE RESPONSE :", data)

    const url = data.url || data.checkoutUrl || data.sessionUrl

    if (url) {
      window.location.href = url
    } else {
      alert("❌ URL Stripe introuvable")
    }

  } catch (error) {
    console.error(error)
    alert("❌ Erreur paiement")
  }
}
</script>

<template>
  <div class="cart">

    <h1>🛒 Mon Panier</h1>

    <!-- PANIER VIDE -->
    <div v-if="cart.length === 0">
      <p>Panier vide</p>
    </div>

    <!-- PRODUITS -->
    <div v-else>
      <div v-for="item in cart" :key="item.id" class="item">

        <img v-if="item.image" :src="item.image" width="60" />

        <h3>{{ item.name }}</h3>
        <p>{{ item.price }} €</p>

        <button @click="decrease(item)">-</button>
        {{ item.qty }}
        <button @click="increase(item)">+</button>

        <button @click="remove(item)">❌</button>
      </div>

      <h2>Total : {{ total.toFixed(2) }} €</h2>

      <button @click="clearCart">
        🗑️ Vider le panier
      </button>
    </div>

    <hr />

    <!-- CLIENT -->
    <h2>Informations client</h2>

    <input v-model="name" placeholder="Nom" />
    <input v-model="email" placeholder="Email" />
    <textarea v-model="address" placeholder="Adresse de livraison"></textarea>

    <!-- PAIEMENT -->
    <button @click="pay">
      💳 Payer
    </button>

  </div>
</template>

<style scoped>
.cart {
  max-width: 600px;
  margin: auto;
}

.item {
  border-bottom: 1px solid #ddd;
  padding: 10px;
}

button {
  margin: 5px;
}

input, textarea {
  display: block;
  width: 100%;
  margin: 10px 0;
}
</style>
