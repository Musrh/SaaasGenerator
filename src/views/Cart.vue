<script setup>
import { ref, onMounted } from "vue"
import { auth, db } from "../firebase"
import { collection, onSnapshot, deleteDoc, doc, onAuthStateChanged } from "firebase/firestore"

const cart = ref([])
const loading = ref(true)

onMounted(() => {

  // 🔥 IMPORTANT : attendre auth
  onAuthStateChanged(auth, (user) => {

    if (!user) {
      console.log("❌ user not logged")
      loading.value = false
      return
    }

    console.log("✅ USER =", user.uid)

    const q = collection(db, "users", user.uid, "cart")

    onSnapshot(q, (snap) => {

      console.log("🛒 CART SIZE =", snap.size)

      cart.value = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }))

      console.log("📦 CART DATA =", cart.value)

      loading.value = false
    })
  })
})

async function removeItem(id) {
  const user = auth.currentUser
  if (!user) return

  await deleteDoc(doc(db, "users", user.uid, "cart", id))
}
</script>

<template>
  <div style="padding:20px">

    <h2>🛒 Mon Panier</h2>

    <div v-if="loading">Chargement...</div>

    <div v-else-if="cart.length === 0">
      ❌ Panier vide
    </div>

    <div v-else>
      <div
        v-for="item in cart"
        :key="item.id"
        style="border:1px solid #ddd;padding:10px;margin-bottom:10px"
      >

        <p><b>Produit:</b> {{ item.name }}</p>
        <p><b>Prix:</b> {{ item.price }} €</p>
        <p><b>Quantité:</b> {{ item.qty }}</p>
        <p><b>Total:</b> {{ item.total }} €</p>

        <button @click="removeItem(item.id)">
          ❌ Supprimer
        </button>

      </div>
    </div>

  </div>
</template>
