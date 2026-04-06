<template>
  <div style="padding:20px">

    <h1>🛍 Produits</h1>

    <!-- UID DEBUG -->
    <p><b>UID:</b> {{ uid || "NON CONNECTÉ" }}</p>

    <!-- BOUTON PANIER -->
    <button @click="goToCart">
      🛒 Voir le panier
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
import { doc, getDoc, setDoc } from "firebase/firestore"

const router = useRouter()
const uid = ref(null)

/* =========================================================
   🔐 AUTH
========================================================= */
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    uid.value = user ? user.uid : null
  })
})

/* =========================================================
   🛍 PRODUITS (TEST)
========================================================= */
const products = ref([
  { id: "1", name: "Produit 1", price: 29.99 },
  { id: "2", name: "Produit 2", price: 49.99 },
  { id: "3", name: "Produit 3", price: 19.99 }
])

/* =========================================================
   🛒 NAVIGATION
========================================================= */
const goToCart = () => {
  router.push("/cart")
}

/* =========================================================
   🛒 AJOUT AU PANIER SESSION
========================================================= */
const addToCart = async (product) => {

  const user = auth.currentUser

  if (!user) {
    alert("❌ Vous devez être connecté")
    return
  }

  const userRef = doc(db, "users", user.uid)

  try {
    const snap = await getDoc(userRef)

    let cartSession = []

    if (snap.exists()) {
      cartSession = snap.data().cartSession || []
    }

    // 🔥 logique PRO : pas d'accumulation cachée
    const index = cartSession.findIndex(p => p.id === product.id)

    if (index >= 0) {
      cartSession[index].qty = 1   // session = 1 seul achat actif
    } else {
      cartSession.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1
      })
    }

    await setDoc(userRef, {
      cartSession
    }, { merge: true })

    console.log("🛒 CART SESSION =", cartSession)

    alert("Produit ajouté au panier ✅")

  } catch (e) {
    console.error(e)
    alert("Erreur panier")
  }
}
</script>
