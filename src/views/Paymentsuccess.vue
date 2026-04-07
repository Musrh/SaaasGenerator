<template>
  <div class="success">

    <h1>✅ Paiement réussi</h1>

    <p>Votre commande est en cours de traitement...</p>

    <button @click="clearCart">
      🧹 Vider le panier
    </button>

    <button @click="goHome">
      🏠 Retour boutique
    </button>

  </div>
</template>

<script setup>
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import { getAuth } from "firebase/auth"
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"

const router = useRouter()
const auth = getAuth()

const order = JSON.parse(localStorage.getItem("pendingStripeOrder") || "{}")

const uid = auth.currentUser?.uid

// 🔥 CRÉATION COMMANDE FIRESTORE AU CHARGEMENT
onMounted(async () => {
  if (!uid || !order.items) return

  const userRef = doc(db, "users", uid)

  // 1. créer commande
  await addDoc(collection(db, "users", uid, "orders"), {
    items: order.items,
    total: order.total,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    status: "paid",
    createdAt: serverTimestamp()
  })

  // 2. vider panier Firestore
  await updateDoc(userRef, {
    cartSession: []
  })

  // 3. vider localStorage
  localStorage.removeItem("pendingStripeOrder")
})

// 🧹 clear manuel
const clearCart = async () => {
  if (!uid) return

  await updateDoc(doc(db, "users", uid), {
    cartSession: []
  })

  localStorage.removeItem("pendingStripeOrder")
}

// 🏠 retour
const goHome = () => {
  router.push("/")
}
</script>
