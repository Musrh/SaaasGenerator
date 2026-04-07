<template>
  <div style="padding:20px">

    <h1>Mon panier</h1>

    <div v-if="cart.length === 0">
      Panier vide
    </div>

    <div v-for="item in cart" :key="item.id" style="margin-bottom:10px">
      <p>{{ item.name }} - {{ item.price }} €</p>

      <div>
        <button @click="decrease(item.id)">-</button>
        {{ item.qty }}
        <button @click="increase(item.id)">+</button>
      </div>

      <button @click="remove(item.id)">🗑</button>
    </div>

    <hr>

    <h3>Total : {{ total }} €</h3>

    <!-- 🔥 NOUVEAU BOUTON -->
    <button @click="clearCart" :disabled="cart.length === 0">
      🧹 Vider le panier
    </button>

    <br><br>

    <!-- 💳 PAYER -->
    <button @click="pay" :disabled="cart.length === 0 || !uid">
      💳 Payer
    </button>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue"
import { getAuth } from "firebase/auth"
import { db } from "../firebase"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { useRouter } from "vue-router"

const auth = getAuth()
const router = useRouter()

const cart = ref([])
const uid = ref(null)

let unsub = null

// 🔥 SNAPSHOT
onMounted(() => {
  auth.onAuthStateChanged((user) => {
    if (!user) return

    uid.value = user.uid

    const refDoc = doc(db, "users", user.uid)

    unsub = onSnapshot(refDoc, (snap) => {
      if (!snap.exists()) {
        cart.value = []
        return
      }

      const data = snap.data()
      cart.value = data.cartSession || []
    })
  })
})

onBeforeUnmount(() => {
  if (unsub) unsub()
})

// 💾 SAVE
const save = async (newCart) => {
  if (!uid.value) return

  cart.value = newCart

  await updateDoc(doc(db, "users", uid.value), {
    cartSession: newCart
  })
}

// ➕
const increase = async (id) => {
  const newCart = cart.value.map(p =>
    p.id === id ? { ...p, qty: p.qty + 1 } : p
  )
  await save(newCart)
}

// ➖
const decrease = async (id) => {
  let newCart = cart.value.map(p =>
    p.id === id ? { ...p, qty: p.qty - 1 } : p
  )

  newCart = newCart.filter(p => p.qty > 0)

  await save(newCart)
}

// 🗑
const remove = async (id) => {
  const newCart = cart.value.filter(p => p.id !== id)
  await save(newCart)
}

// 🧹 VIDER PANIER (NOUVEAU)
const clearCart = async () => {
  if (!uid.value) return

  await updateDoc(doc(db, "users", uid.value), {
    cartSession: []
  })

  cart.value = []
}

// 💰 TOTAL
const total = computed(() =>
  cart.value.reduce((sum, i) => sum + i.price * i.qty, 0)
)

// 💳 PAYER (FIX COMPLET)
const pay = () => {
  if (!uid.value) {
    alert("Utilisateur non connecté")
    return
  }

  if (cart.value.length === 0) {
    alert("Panier vide")
    return
  }

  const order = {
    items: cart.value,
    total: total.value,
    ownerUid: uid.value
  }

  localStorage.setItem("pendingStripeOrder", JSON.stringify(order))

  console.log("➡️ REDIRECT PAYMENT SUCCESS")

  router.push("/payment-success")
}
</script>
