<script setup>
import { createOrder } from "@/services/orders"
import { auth } from "@/firebase"
import { useRouter } from "vue-router"

const router = useRouter()

const cartItems = [
  { name: "Produit 1", price: 49.99, qty: 2 },
  { name: "Produit 2", price: 29.99, qty: 1 }
]

async function handleCheckout() {
  try {
    const user = auth.currentUser

    if (!user) {
      alert("Utilisateur non connecté")
      return
    }

    const orderId = await createOrder(user, cartItems)

    console.log("✅ Order created:", orderId)

    router.push(`/orders/${orderId}`)

  } catch (err) {
    console.error("❌ Checkout error:", err)
  }
}
</script>

<template>
  <button @click="handleCheckout">
    Payer / Commander
  </button>
</template>
