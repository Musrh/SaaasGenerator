<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Mon Panier</h1>

    <div v-if="!authReady" class="text-gray-500">
      Chargement...
    </div>

    <div v-else>
      <div v-if="cart.length === 0">
        Panier vide 🛒
      </div>

      <div v-else>
        <div
          v-for="(item, index) in cart"
          :key="item.id"
          class="border p-4 mb-3 rounded-lg flex justify-between items-center"
        >
          <div>
            <h2 class="font-bold">{{ item.name }}</h2>
            <p class="text-gray-500">
              {{ item.price }} € x {{ item.qty }}
            </p>
          </div>

          <button
            @click="removeItem(index)"
            class="bg-red-500 text-white px-3 py-1 rounded"
          >
            Supprimer
          </button>
        </div>

        <div class="mt-6 text-xl font-bold">
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
import { doc, onSnapshot, updateDoc } from "firebase/firestore"

// =====================
// STATE
// =====================
const cart = ref([])
const authReady = ref(false)

// =====================
// AUTH STATE (SIMPLE & SAFE)
// =====================
onMounted(() => {
  onAuthStateChanged(auth, () => {
    authReady.value = true
  })
})

// =====================
// SAFE UID
// =====================
const getUid = () => {
  return auth.currentUser?.uid || null
}

// =====================
// LOAD CART
// =====================
onMounted(() => {
  const uid = getUid()

  if (!uid) return

  const ref = doc(db, "users", uid)

  onSnapshot(ref, (snap) => {
    cart.value = snap.data()?.cart || []
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
// REMOVE ITEM
// =====================
const removeItem = async (index) => {
  const uid = getUid()

  if (!uid) return

  const ref = doc(db, "users", uid)

  const newCart = [...cart.value]
  newCart.splice(index, 1)

  await updateDoc(ref, {
    cart: newCart
  })
}
</script>
