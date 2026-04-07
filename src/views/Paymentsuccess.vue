<script setup>
import { onMounted } from "vue"
import { getAuth } from "firebase/auth"
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"
import { db } from "../firebase"

const auth = getAuth()

onMounted(async () => {
  const user = auth.currentUser
  if (!user) return

  const ref = doc(db, "users", user.uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) return

  const data = snap.data()
  const cart = data.cartSession || []

  if (cart.length === 0) return

  // ✅ 1. ADD ORDER
  await updateDoc(ref, {
    orders: arrayUnion({
      items: cart,
      total: cart.reduce((s, i) => s + i.price * i.qty, 0),
      createdAt: Date.now(),
      status: "paid"
    })
  })

  // 🧹 2. CLEAR CART
  await updateDoc(ref, {
    cartSession: []
  })

  // optional redirect
  window.location.href = "/#/success"
})
</script>

<template>
  <div style="text-align:center;padding:40px">
    <h2>Traitement paiement...</h2>
  </div>
</template>
