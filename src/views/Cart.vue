<template>
  <div class="p-6">

    <h1 class="text-2xl font-bold mb-4">Mon Panier</h1>

    <!-- DEBUG -->
    <div class="text-sm text-gray-500 mb-3">
      UID: {{ uid || "NULL" }}
    </div>

    <!-- NOT LOGGED -->
    <div v-if="!uid">
      ❌ Vous n’êtes pas connecté
    </div>

    <!-- CART -->
    <div v-else>

      <div v-if="cart.length === 0">
        🛒 Panier vide
      </div>

      <div v-else>

        <div
          v-for="item in cart"
          :key="item.id"
          class="border p-4 mb-3"
        >
          <h2 class="font-bold">{{ item.name }}</h2>
          <p>{{ item.price }} € x {{ item.qty }}</p>
        </div>

        <div class="mt-4 text-xl font-bold">
          Total : {{ total }} €
        </div>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"

// =====================
const uid = ref(null)
const cart = ref([])

// =====================
// 🔥 AUTH + FIRESTORE SYNC
// =====================
onMounted(() => {
  onAuthStateChanged(auth, (user) => {

    console.log("AUTH USER =", user)

    if (!user) {
      uid.value = null
      cart.value = []
      return
    }

    uid.value = user.uid

    const ref = doc(db, "users", user.uid)

    onSnapshot(ref, (snap) => {
      console.log("FIRESTORE DATA =", snap.data())
      cart.value = snap.data()?.cart || []
    })

  })
})

// =====================
const total = computed(() => {
  return cart.value.reduce((sum, item) => {
    return sum + item.price * item.qty
  }, 0)
})
</script>
