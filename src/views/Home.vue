<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Produits</h1>

    <div v-if="!authReady" class="text-gray-500">
      Chargement...
    </div>

    <div v-else class="grid md:grid-cols-3 gap-6">
      <div
        v-for="product in products"
        :key="product.id"
        class="border p-4 rounded-lg shadow"
      >
        <h2 class="font-bold text-lg">{{ product.name }}</h2>
        <p class="text-gray-500">{{ product.price }} €</p>

        <button
          @click="addToCart(product)"
          class="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Ajouter au panier
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"

// =====================
// PRODUCTS DEMO
// =====================
const products = ref([
  { id: "1", name: "Produit 1", price: 29.99 },
  { id: "2", name: "Produit 2", price: 49.99 },
  { id: "3", name: "Produit 3", price: 19.99 }
])

// =====================
// AUTH STATE (STABLE)
// =====================
const authReady = ref(false)

onMounted(() => {
  onAuthStateChanged(auth, () => {
    authReady.value = true
  })
})

// =====================
// SAFE UID (IMPORTANT FIX)
// =====================
const getUid = () => {
  return auth.currentUser?.uid || null
}

// =====================
// ADD TO CART
// =====================
const addToCart = async (product) => {
  const uid = getUid()

  if (!uid) {
    alert("Vous devez être connecté")
    return
  }

  const ref = doc(db, "users", uid)
  const snap = await getDoc(ref)

  const data = snap.exists() ? snap.data() : {}
  let cart = data.cart || []

  const index = cart.findIndex(p => p.id === product.id)

  if (index >= 0) {
    cart[index].qty += 1
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: 1
    })
  }

  await setDoc(ref, { cart }, { merge: true })
}
</script>
