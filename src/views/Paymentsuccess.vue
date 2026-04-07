<script setup>
import { onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { getAuth } from "firebase/auth"
import { db } from "../firebase"
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore"

const loading = ref(true)
const success = ref(false)

const router = useRouter()
const auth = getAuth()

async function processPayment() {
  const user = auth.currentUser

  if (!user) {
    loading.value = false
    return
  }

  const refUser = doc(db, "users", user.uid)
  const snap = await getDoc(refUser)

  if (!snap.exists()) {
    loading.value = false
    return
  }

  const data = snap.data()
  const cart = data.cartSession || []

  if (cart.length === 0) {
    loading.value = false
    success.value = true
    return
  }

  // 💾 1. Créer commande dans orders
  await addDoc(collection(db, "orders"), {
    userId: user.uid,
    email: user.email,
    items: cart,
    createdAt: Date.now(),
    status: "paid"
  })

  // 🧹 2. Vider panier
  await updateDoc(refUser, {
    cartSession: []
  })

  success.value = true
  loading.value = false
}

function goHome() {
  router.push("/")
}

onMounted(() => {
  processPayment()
})
</script>

<template>
  <div style="text-align:center; padding:40px">

    <div v-if="loading">
      <h2>Traitement du paiement...</h2>
    </div>

    <div v-else-if="success">
      <h2>✅ Paiement réussi</h2>
      <p>Merci pour votre commande</p>

      <button @click="goHome">
        Retour accueil
      </button>
    </div>

    <div v-else>
      <h2>❌ Erreur de paiement</h2>
    </div>

  </div>
</template>
