<template>
  <div class="success">
    <h2>✅ Paiement réussi</h2>
    <p>{{ message }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { db } from "../firebase"
import { doc, addDoc, collection, updateDoc } from "firebase/firestore"

const router = useRouter()
const message = ref("Traitement de la commande...")
let executed = false

onMounted(async () => {
  if (executed) return
  executed = true

  try {
    const raw = localStorage.getItem("pendingStripeOrder")

    if (!raw) {
      message.value = "Aucune commande trouvée"
      return
    }

    const order = JSON.parse(raw)

    const uid = order.ownerUid
    if (!uid) throw new Error("UID manquant")

    const finalOrder = {
      items: order.items || [],
      total: order.total || 0,
      customerName: order.customerName || "",
      customerEmail: order.customerEmail || "",
      shippingAddress: order.shippingAddress || "",
      status: "paid",
      createdAt: new Date()
    }

    // 🔥 1. SAVE USER ORDERS
    await addDoc(
      collection(db, "users", uid, "orders"),
      finalOrder
    )

    // 🔥 2. GLOBAL ORDERS
    await addDoc(collection(db, "orders"), {
      ...finalOrder,
      ownerUid: uid
    })

    // 🔥 3. CLEAR CART SESSION (IMPORTANT)
    await updateDoc(doc(db, "users", uid), {
      cartSession: []
    })

    // 🔥 4. CLEAN LOCAL STORAGE
    localStorage.removeItem("pendingStripeOrder")

    message.value = "Commande enregistrée ✔"

    // 🔥 5. AUTO REDIRECT (IMPORTANT FIX ÉCRAN BLOQUÉ)
    setTimeout(() => {
      router.push("/cart") // ou "/store"
    }, 2000)

  } catch (e) {
    console.error("PAYMENT ERROR:", e)
    message.value = "Erreur lors du traitement"
  }
})
</script>
