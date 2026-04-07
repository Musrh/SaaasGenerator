<script setup>
import { ref, onMounted, computed } from "vue"
import { db } from "../firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const cart = ref([])
const loading = ref(true)

const name = ref("")
const email = ref("")
const address = ref("")

const auth = getAuth()

const total = computed(() =>
  cart.value.reduce((sum, i) => sum + i.price * i.qty, 0)
)

// 🔥 CHARGER CART SESSION FIRESTORE
async function loadCart() {
  const user = auth.currentUser
  if (!user) return

  const refDoc = doc(db, "cartSession", user.uid)
  const snap = await getDoc(refDoc)

  if (snap.exists()) {
    cart.value = snap.data().items || []
  } else {
    cart.value = []
  }

  loading.value = false
}

// 🔥 METTRE À JOUR FIRESTORE
async function saveCart() {
  const user = auth.currentUser
  if (!user) return

  const refDoc = doc(db, "cartSession", user.uid)

  await setDoc(refDoc, {
    items: cart.value,
    updatedAt: Date.now()
  })
}

// ➕ QUANTITÉ
function increase(item) {
  item.qty++
  saveCart()
}

function decrease(item) {
  if (item.qty > 1) item.qty--
  saveCart()
}

// ❌ REMOVE
function remove(item) {
  cart.value = cart.value.filter(i => i.id !== item.id)
  saveCart()
}

// 🗑️ CLEAR CART
async function clearCart() {
  cart.value = []
  await saveCart()
}

// 💳 PAYER (Stripe backend)
async function pay() {
  const user = auth.currentUser

  if (!user) return alert("Login requis")
  if (cart.value.length === 0) return alert("Panier vide")

  const payload = {
    items: cart.value,
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  )

  const data = await res.json()

  if (data.url) {
    window.location.href = data.url
  } else {
    alert("Erreur paiement")
  }
}

onMounted(loadCart)
</script>

<template>
  <div>

    <h2>Panier</h2>

    <div v-if="loading">Chargement...</div>

    <div v-else>
      <div v-if="cart.length === 0">
        Panier vide
      </div>

      <div v-for="item in cart" :key="item.id">
        <p>{{ item.name }} - {{ item.price }} €</p>

        <button @click="decrease(item)">-</button>
        {{ item.qty }}
        <button @click="increase(item)">+</button>

        <button @click="remove(item)">❌</button>
      </div>

      <h3>Total: {{ total }} €</h3>

      <button @click="clearCart">Vider panier</button>

      <hr />

      <input v-model="name" placeholder="Nom" />
      <input v-model="email" placeholder="Email" />
      <input v-model="address" placeholder="Adresse" />

      <button @click="pay">Payer</button>
    </div>

  </div>
</template>
