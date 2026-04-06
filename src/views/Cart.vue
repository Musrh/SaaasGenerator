<!-- ============================================================
  Cart.vue — SaaS Generator (PANIER PRO FIX)
============================================================ -->

<template>
  <div class="min-h-screen bg-gray-900 text-white p-6">

    <h1 class="text-2xl font-bold mb-6">🛒 Mon panier</h1>

    <!-- LOADING -->
    <div v-if="loading" class="text-center py-10">
      <div class="animate-spin w-10 h-10 border-4 border-gray-600 border-t-blue-400 rounded-full mx-auto"></div>
    </div>

    <!-- VIDE -->
    <div v-else-if="cart.length === 0" class="text-gray-400">
      Votre panier est vide.
    </div>

    <!-- CART LIST -->
    <div v-else>

      <div class="space-y-4">

        <div
          v-for="(item, index) in cart"
          :key="index"
          class="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center"
        >

          <div>
            <h2 class="font-bold">{{ item.name }}</h2>
            <p class="text-gray-400">{{ item.price }} €</p>
          </div>

          <button
            @click="removeItem(index)"
            class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg"
          >
            Supprimer
          </button>

        </div>

      </div>

      <!-- TOTAL -->
      <div class="mt-6 text-xl font-bold">
        Total : {{ total }} €
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"

const user = ref(null)
const cart = ref([])
const loading = ref(true)

// 🔥 AUTH FIX (OPTION B)
onMounted(() => {
  onAuthStateChanged(auth, (u) => {
    user.value = u

    if (!u) {
      loading.value = false
      return
    }

    const cartRef = doc(db, "users", u.uid)

    // 🔥 REALTIME CART
    onSnapshot(cartRef, (snap) => {
      const data = snap.data()
      cart.value = data?.cart || []
      loading.value = false
    })
  })
})

// 💰 TOTAL
const total = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.price || 0), 0)
})

// 🗑️ SUPPRESSION
const removeItem = async (index) => {
  if (!user.value) return

  const newCart = [...cart.value]
  newCart.splice(index, 1)

  const cartRef = doc(db, "users", user.value.uid)

  await updateDoc(cartRef, {
    cart: newCart
  })
}
</script>
