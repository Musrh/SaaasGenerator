<template>
  <div class="p-6">

    <h1 class="text-2xl font-bold mb-4">🛒 Mon Panier</h1>

    <!-- DEBUG -->
    <div class="text-sm text-gray-500 mb-3">
      UID: {{ uid || "NULL" }}
    </div>

    <!-- NON CONNECTÉ -->
    <div v-if="!uid">
      ❌ Vous devez être connecté
    </div>

    <!-- PANIER -->
    <div v-else>

      <div v-if="cart.length === 0">
        🛒 Panier vide
      </div>

      <div v-else>

        <!-- LISTE PRODUITS -->
        <div
          v-for="item in cart"
          :key="item.id"
          class="border p-4 mb-3 rounded-lg"
        >
          <h2 class="font-bold">{{ item.name }}</h2>
          <p>{{ item.price }} € x {{ item.qty }}</p>
        </div>

        <!-- TOTAL -->
        <div class="mt-4 text-xl font-bold">
          Total : {{ total }} €
        </div>

        <!-- BOUTON PAYER -->
        <button
          @click="checkout"
          class="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg w-full"
        >
          💳 Payer
        </button>

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
// AUTH + FIRESTORE
// =====================
onMounted(() => {
  onAuthStateChanged(auth, (user) => {

    if (!user) {
      uid.value = null
      cart.value = []
      return
    }

    uid.value = user.uid

    const ref = doc(db, "users", user.uid)

    onSnapshot(ref, (snap) => {
      cart.value = snap.data()?.cart || []
    })

  })
})

// =====================
// TOTAL
// =====================
const total = computed(() => {
  return cart.value.reduce((sum, item) => {
    return sum + item.price * item.qty
  }, 0)
})

// =====================
// CHECKOUT (TEMPORAIRE)
// =====================
const checkout = () => {

  if (cart.value.length === 0) {
    alert("Panier vide")
    return
  }

  alert("💳 Paiement en cours... (étape suivante Stripe)")
}
</script>
