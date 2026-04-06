<template>
  <div class="p-6">

    <h1 class="text-2xl font-bold mb-4">Produits</h1>

    <!-- DEBUG USER -->
    <div class="text-sm text-gray-500 mb-4">
      UID: {{ uid || "NULL (non connecté)" }}
    </div>

    <!-- BOUTON PANIER -->
    <button
      @click="goToCart"
      class="mb-6 bg-green-500 text-white px-4 py-2 rounded-lg"
    >
      Voir le panier 🛒
    </button>

    <!-- PRODUITS -->
    <div class="grid md:grid-cols-3 gap-6">

      <div
        v-for="product in products"
        :key="product.id"
        class="border p-4 rounded-lg shadow"
      >
        <h2 class="font-bold text-lg">{{ product.name }}</h2>
        <p class="text-gray-500">{{ product.price }} €</p>

        <button
          class="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg"
          @click="addToCart(product)"
        >
          Ajouter au panier
        </button>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"

// =====================
// ROUTER
// =====================
const router = useRouter()

const goToCart = () => {
  router.push("/cart")
}

// =====================
// PRODUCTS DEMO
// =====================
const products = ref([
  { id: "1", name: "Produit 1", price: 29.99 },
  { id: "2", name: "Produit 2", price: 49.99 },
  { id: "3", name: "Produit 3", price: 19.99 }
])

// =====================
// AUTH STATE
// =====================
const uid = ref(null)

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    console.log("AUTH USER =", user)

    if (user) {
      uid.value = user.uid
    } else {
      uid.value = null
    }
  })
})

// =====================
// ADD TO CART
// =====================
const addToCart = async (product) => {

  console.log("CLICK PRODUCT =", product)

  const user = auth.currentUser

  console.log("CURRENT USER =", user)

  if (!user) {
    alert("❌ Vous devez être connecté")
    return
  }

  const userId = user.uid

  const ref = doc(db, "users", userId)

  const snap = await getDoc(ref)

  let cart = []

  if (snap.exists()) {
    cart = snap.data().cart || []
  }

  console.log("OLD CART =", cart)

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

  console.log("NEW CART =", cart)

  await setDoc(ref, { cart }, { merge: true })

  alert("✅ Produit ajouté au panier")
}
</script>

<style scoped>
</style>
