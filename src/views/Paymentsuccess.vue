<template>
  <div style="padding:20px">
    <h2>✅ Paiement réussi</h2>

    <p>{{ message }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { db } from "../firebase"
import { doc, addDoc, collection, updateDoc, getDoc } from "firebase/firestore"

const router = useRouter()
const message = ref("Traitement en cours...")

let done = false

onMounted(async () => {
  if (done) return
  done = true

  try {
    const raw = localStorage.getItem("pendingStripeOrder")
    if (!raw) {
      message.value = "Aucune commande"
      return
    }

    const order = JSON.parse(raw)

    const uid = order.ownerUid
    if (!uid) throw new Error("UID manquant")

    const finalOrder = {
      items: order.items,
      total: order.total,
      status: "paid",
      createdAt: new Date()
    }

    // 🧾 1. SAVE ORDERS (USER)
    await addDoc(
      collection(db, "users", uid, "orders"),
      finalOrder
    )

    // 🌍 2. GLOBAL ORDERS
    await addDoc(collection(db, "orders"), {
      ...finalOrder,
      ownerUid: uid
    })

    // 🧹 3. CLEAR CART SESSION (IMPORTANT FIX)
    await updateDoc(doc(db, "users", uid), {
      cartSession: []
    })

    // 🔄 force refresh Firestore snapshot
    await getDoc(doc(db, "users", uid))

    // 🧽 4. CLEAN STORAGE
    localStorage.removeItem("pendingStripeOrder")

    message.value = "Commande enregistrée ✔"

    // 🚀 5. AUTO REDIRECT (IMPORTANT ANTI BLOQUAGE)
    setTimeout(() => {
      router.push("/")
    }, 1500)

  } catch (e) {
    console.error(e)
    message.value = "Erreur traitement commande"
  }
})
</script>
