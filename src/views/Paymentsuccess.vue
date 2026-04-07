<template>
  <div class="success">

    <div v-if="loading" class="box">
      <div class="spinner"></div>
      <p>Validation du paiement...</p>
    </div>

    <div v-else class="box">
      <h1>✅ Paiement réussi</h1>
      <p>Votre commande est confirmée.</p>

      <button @click="goHome">🏠 Accueil</button>
      <button @click="goCart">🛒 Voir panier</button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { db } from "../firebase"
import { doc, addDoc, collection, updateDoc } from "firebase/firestore"

const router = useRouter()
const loading = ref(true)

let order = null

onMounted(async () => {
  try {
    // 1. récupérer commande stockée avant Stripe redirect
    const raw = localStorage.getItem("pendingStripeOrder")

    if (!raw) {
      loading.value = false
      return
    }

    order = JSON.parse(raw)

    const uid = order.ownerUid

    if (!uid) throw new Error("UID manquant")

    // 2. ref user
    const userRef = doc(db, "users", uid)

    // 3. ENRICHIR commande
    const fullOrder = {
      ...order,
      status: "paid",
      createdAt: new Date(),
    }

    // 4. sauvegarde Firestore (user orders)
    await addDoc(collection(db, "users", uid, "orders"), fullOrder)

    // 5. sauvegarde globale
    await addDoc(collection(db, "orders"), fullOrder)

    // 6. vider panier Firestore
    await updateDoc(userRef, {
      cartSession: []
    })

    // 7. nettoyer localStorage
    localStorage.removeItem("pendingStripeOrder")
    localStorage.removeItem("stripeOwnerUid")

    loading.value = false

  } catch (e) {
    console.error(e)
    loading.value = false
  }
})

// navigation
const goHome = () => router.push("/")
const goCart = () => router.push("/cart")
</script>

<style scoped>
.success{
  display:flex;
  justify-content:center;
  align-items:center;
  height:100vh;
  background:#f8f9fa;
  font-family:sans-serif;
}

.box{
  text-align:center;
  background:white;
  padding:30px;
  border-radius:12px;
  box-shadow:0 10px 30px rgba(0,0,0,.1);
}

button{
  margin:10px;
  padding:10px 16px;
  border:none;
  border-radius:8px;
  cursor:pointer;
  background:#6c63ff;
  color:white;
}

.spinner{
  width:30px;
  height:30px;
  border:3px solid #eee;
  border-top-color:#6c63ff;
  border-radius:50%;
  margin:auto;
  animation:spin 1s linear infinite;
}

@keyframes spin{
  to{transform:rotate(360deg)}
}
</style>
