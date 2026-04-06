<!-- ============================================================
  ProductPage.vue — SaaS Generator (FIX AUTH + CART)
============================================================ -->

<template>
  <div class="min-h-screen bg-gray-900 text-white p-6">

    <!-- LOADING AUTH -->
    <div v-if="loading" class="text-center py-20">
      <div class="animate-spin w-10 h-10 border-4 border-gray-600 border-t-blue-400 rounded-full mx-auto"></div>
    </div>

    <!-- PRODUITS -->
    <div v-else>

      <h1 class="text-2xl font-bold mb-6">Produits</h1>

      <div class="grid md:grid-cols-3 gap-6">

        <div
          v-for="product in products"
          :key="product.id"
          class="bg-gray-800 p-4 rounded-xl border border-gray-700"
        >
          <h2 class="font-bold text-lg">{{ product.name }}</h2>
          <p class="text-gray-400">{{ product.price }} €</p>

          <button
            @click="addToCart(product)"
            class="mt-4 w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg"
          >
            Ajouter au panier
          </button>
        </div>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"

const user = ref(null)
const loading = ref(true)

// PRODUITS TEST (remplace par Firestore si besoin)
const products = ref([
  { id: "1", name: "Produit 1", price: 29.99 },
  { id: "2", name: "Produit 2", price: 49.99 },
  { id: "3", name: "Produit 3", price: 19.99 }
])

// 🔥 AUTH PROPRE (OPTION B FIX)
onMounted(() => {
  onAuthStateChanged(auth, (u) => {
    user.value = u
    loading.value = false
  })
})

// 🛒 AJOUT AU PANIER (FIX COMPLET)
const addToCart = async (product) => {

  // ❌ sécurité
  if (!user.value) {
    alert("Vous devez être connecté")
    return
  }

  const uid = user.value.uid

  const cartRef = doc(db, "users", uid)

  try {
    const snap = await getDoc(cartRef)

    if (!snap.exists()) {
      // création user doc + cart
      await setDoc(cartRef, {
        cart: [product]
      })
    } else {
      // ajout produit au panier
      await updateDoc(cartRef, {
        cart: arrayUnion(product)
      })
    }

    alert("Produit ajouté au panier ✅")

  } catch (e) {
    console.error("Erreur panier:", e)
    alert("Erreur lors de l'ajout")
  }
}
</script>

<style scoped>
</style>
