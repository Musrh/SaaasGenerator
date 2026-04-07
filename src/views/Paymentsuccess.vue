<template>
  <div class="success-root">
    <h2>✅ Paiement réussi</h2>
    <p>Votre commande est en cours de traitement...</p>
  </div>
</template>

<script setup>
import { onMounted } from "vue"
import { db, auth } from "../firebase"
import { doc, addDoc, collection, updateDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

let uid = null
let alreadySaved = false

onMounted(() => {

  onAuthStateChanged(auth, async (user) => {
    if (!user || alreadySaved) return

    uid = user.uid

    const raw = localStorage.getItem("pendingStripeOrder")
    if (!raw) return

    const order = JSON.parse(raw)

    try {
      alreadySaved = true

      const finalOrder = {
        items: order.items || [],
        total: order.total || 0,

        customerName: order.customerName || "",
        customerEmail: order.customerEmail || "",
        shippingAddress: order.shippingAddress || "",

        ownerUid: order.ownerUid || uid,
        status: "paid",
        createdAt: new Date().toISOString()
      }

      // 🔥 1. USER ORDERS
      await addDoc(
        collection(db, "users", finalOrder.ownerUid, "orders"),
        finalOrder
      )

      // 🔥 2. GLOBAL ORDERS
      await addDoc(collection(db, "orders"), finalOrder)

      // 🔥 3. CLEAR CART
      await updateDoc(
        doc(db, "users", finalOrder.ownerUid),
        { cartSession: [] }
      )

      // 🔥 4. CLEAN LOCAL STORAGE
      localStorage.removeItem("pendingStripeOrder")

      console.log("✅ Order saved successfully")

    } catch (e) {
      console.error("❌ PaymentSuccess error:", e)
      alreadySaved = false
    }
  })
})
</script>
