<!-- ============================================================
  ProductPage.vue — VERSION FINALE FIX NAV + CART
============================================================ -->

<template>
  <div style="padding:20px">

    <h1>Produits</h1>

    <!-- DEBUG UID -->
    <p><b>UID:</b> {{ uid || "NON CONNECTÉ" }}</p>

    <!-- 🔥 BOUTON PANIER (FIX) -->
    <button @click="goToCart">
      Voir le panier 🛒
    </button>

    <hr><br>

    <!-- LISTE PRODUITS -->
    <div v-for="product in products" :key="product.id" style="margin-bottom:20px">

      <h2>{{ product.name }}</h2>
      <p>{{ product.price }} €</p>

      <button @click="addToCart(product)">
        Ajouter au panier
      </button>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"

// =====================
const router = useRouter()
const uid = ref(null)

// =====================
// AUTH
// =====================
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    console.log("USER =", user)

    if (user) {
      uid.value = user.uid
    } else {
      uid.value = null
    }
  })
})

// =====================
// PRODUITS
// =====================
const products = ref([
  { id: "1", name: "Produit 1", price: 29.99 },
  { id: "2", name: "Produit 2", price: 49.99 },
  { id: "3", name: "Produit 3", price: 19.99 }
])

// =====================
// NAVIGATION PANIER (FIX)
// =====================
const goToCart = () => {
  console.log("➡️ NAVIGATION /cart")
  router.push("/cart")
}

// =====================
// AJOUT PANIER (FIX TOTAL)
// =====================
const addToCart = async (product) => {

  const user = auth.currentUser

  if (!user) {
    alert("❌ Vous devez être connecté")
    return
  }

  const userRef = doc(db, "users", user.uid)

  try {
    const snap = await getDoc(userRef)

    let cart = []

    if (snap.exists()) {
      cart = snap.data().cart || []
    } else {
      await setDoc(userRef, { cart: [] })
    }

    // Vérifier si produit existe déjà
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

    await updateDoc(userRef, { cart })

    console.log("🛒 CART UPDATED =", cart)

    alert("✅ Produit ajouté au panier")

  } catch (e) {
    console.error("ERREUR FIRESTORE:", e)
    alert("Erreur panier")
  }
}
</script>
