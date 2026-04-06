<script setup>
import { ref, onMounted } from "vue"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"

const cart = ref([])
const loading = ref(true)
const uidDebug = ref(null)

onMounted(() => {

  onAuthStateChanged(auth, (user) => {

    console.log("🔥 USER =", user)

    if (!user) {
      console.log("❌ PAS CONNECTÉ")
      loading.value = false
      return
    }

    uidDebug.value = user.uid

    const cartRef = doc(db, "users", user.uid)

    console.log("📡 LISTEN FIRESTORE → users/", user.uid)

    onSnapshot(cartRef, (snap) => {

      if (!snap.exists()) {
        console.log("❌ DOC N'EXISTE PAS")
        cart.value = []
        loading.value = false
        return
      }

      const data = snap.data()

      console.log("📦 DATA =", data)

      cart.value = data.cart || []

      console.log("🛒 CART =", cart.value)

      loading.value = false
    })

  })

})
</script>

<template>
  <div style="padding:20px">

    <h1>🛒 PANIER</h1>

    <p>UID: {{ uidDebug }}</p>

    <div v-if="loading">Chargement...</div>

    <div v-else-if="cart.length === 0">
      ❌ Panier vide
    </div>

    <div v-else>
      <div v-for="(item, i) in cart" :key="i">
        <p>{{ item.name }} - {{ item.price }} €</p>
      </div>
    </div>

  </div>
</template>
