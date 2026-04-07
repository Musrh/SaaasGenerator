<template>
  <div class="success-root">
    <h2>✅ Paiement réussi</h2>
    <p v-if="loading">Votre commande est en cours de traitement...</p>
    <p v-else>✔ Commande enregistrée</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { db } from "../firebase"
import { doc, addDoc, collection, updateDoc } from "firebase/firestore"

const loading = ref(true)
let done = false

onMounted(async () => {
  if (done) return
  done = true

  try {
    const raw = localStorage.getItem("pendingStripeOrder")

    if (!raw) {
      loading.value = false
      return
    }

    const order = JSON.parse(raw)

    if (!order.ownerUid) {
      console.error("❌ ownerUid manquant")
      loading.value = false
      return
    }

    const finalOrder = {
      items: order.items || [],
      total: order.total || 0,

      customerName: order.customerName || "",
      customerEmail: order.customerEmail || "",
      shippingAddress: order.shippingAddress || "",

      ownerUid: order.ownerUid,
      status: "paid",
      createdAt: new Date().toISOString()
    }

    // 🔥 FIRESTORE USER ORDERS
    await addDoc(
      collection(db, "users", finalOrder.ownerUid, "orders"),
      finalOrder
    )

    // 🔥 GLOBAL ORDERS
    await addDoc(collection(db, "orders"), finalOrder)

    // 🔥 CLEAR CART (IMPORTANT FIX)
    await updateDoc(
      doc(db, "users", finalOrder.ownerUid),
      { cartSession: [] }
    )

    // 🔥 CLEAN STORAGE
    localStorage.removeItem("pendingStripeOrder")

    loading.value = false

    console.log("✅ ORDER SAVED + CART CLEARED")

  } catch (e) {
    console.error("❌ PaymentSuccess ERROR:", e)
    loading.value = false
  }
})
</script>
