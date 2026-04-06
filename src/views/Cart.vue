<template>
  <div style="padding:20px">

    <h1>🛒 Mon panier</h1>

    <!-- DEBUG -->
    <p><b>UID:</b> {{ uid || "NULL" }}</p>

    <!-- NON CONNECTÉ -->
    <div v-if="!uid">
      ❌ Non connecté
    </div>

    <!-- PANIER -->
    <div v-else>

      <div v-if="cart.length === 0">
        ❌ Panier vide
      </div>

      <div v-else>

        <div
          v-for="item in cart"
          :key="item.id"
          style="border:1px solid #ccc; padding:10px; margin-bottom:10px"
        >
          <h3>{{ item.name }}</h3>
          <p>{{ item.price }} €</p>
          <p>Quantité : {{ item.qty }}</p>
        </div>

        <h2>Total : {{ total }} €</h2>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"

const uid = ref(null)
const cart = ref([])

// 🔥 AUTH + FIRESTORE
onMounted(() => {
  onAuthStateChanged(auth, (user) => {

    console.log("USER =", user)

    if (!user) {
      uid.value = null
      cart.value = []
      return
    }

    uid.value = user.uid

    const ref = doc(db, "users", user.uid)

    onSnapshot(ref, (snap) => {
      const data = snap.data()

      console.log("🔥 FIRESTORE DATA =", data)

      cart.value = data?.cart || []
    })

  })
})

// 💰 TOTAL
const total = computed(() => {
  return cart.value.reduce((sum, item) => {
    return sum + (item.price * item.qty)
  }, 0)
})
</script>
