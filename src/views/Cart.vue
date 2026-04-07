<script setup>
import { ref, computed, onMounted } from "vue"

// 🛒 panier
const cart = ref([])

// 👤 infos client
const name = ref("")
const email = ref("")
const address = ref("")

// 💰 total
const total = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.qty, 0)
)

// 📦 charger panier
onMounted(() => {
  const saved = localStorage.getItem("cart")
  if (saved) {
    cart.value = JSON.parse(saved)
  }
})

// 💾 sauvegarder panier
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart.value))
}

// ➕ quantité
function increase(item) {
  item.qty++
  saveCart()
}

// ➖ quantité
function decrease(item) {
  if (item.qty > 1) {
    item.qty--
  } else {
    remove(item)
  }
  saveCart()
}

// ❌ supprimer
function remove(item) {
  cart.value = cart.value.filter(i => i.id !== item.id)
  saveCart()
}

// 🗑️ vider panier
function clearCart() {
  cart.value = []
  localStorage.removeItem("cart")
}

// 💳 PAIEMENT STRIPE
async function pay() {
  try {
    if (!name.value || !email.value || !address.value) {
      alert("Remplir toutes les informations client")
      return
    }

    if (cart.value.length === 0) {
      alert("Panier vide")
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

    console.log("📦 Envoi backend :", payload)

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
      const text = await res.text()
      console.error("❌ ERREUR BACKEND :", text)
      alert("Erreur paiement backend")
      return
    }

    const data = await res.json()

    console.log("✅ Réponse backend :", data)

    // ⚠️ IMPORTANT : vérifier clé retournée
    const url = data.url || data.checkoutUrl || data.sessionUrl

    if (url) {
      window.location.href = url
    } else {
      alert("URL Stripe non reçue")
    }

  } catch (err) {
    console.error("❌ ERREUR :", err)
    alert("Erreur paiement")
  }
}
</script>

<template>
  <div class="cart">
    <h1>🛒 Panier</h1>

    <div v-if="cart.length === 0">
      Panier vide
    </div>

    <div v-else>
      <div v-for="item in cart" :key="item.id" class="item">
        <h3>{{ item.name }}</h3>
        <p>{{ item.price }} €</p>

        <button @click="decrease(item)">-</button>
        {{ item.qty }}
        <button @click="increase(item)">+</button>

        <button @click="remove(item)">❌</button>
      </div>

      <h2>Total: {{ total }} €</h2>

      <button @click="clearCart">
        🗑️ Vider le panier
      </button>
    </div>

    <hr />

    <h2>Informations client</h2>

    <input v-model="name" placeholder="Nom" />
    <input v-model="email" placeholder="Email" />
    <textarea v-model="address" placeholder="Adresse de livraison"></textarea>

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
