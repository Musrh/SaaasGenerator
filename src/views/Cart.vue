<template>
  <div style="padding:20px">

    <h1>Mon panier</h1>

    <div v-if="cart.length === 0">
      Panier vide
    </div>

    <div v-for="item in cart" :key="item.id" style="margin-bottom:10px">
      <p>
        {{ item.name }} - {{ item.price }} €
      </p>

      <div>
        <button @click="decrease(item)">-</button>
        {{ item.qty }}
        <button @click="increase(item)">+</button>
      </div>

      <button @click="remove(item)">🗑</button>
    </div>

    <hr>

    <h3>Total : {{ total }} €</h3>

    <button @click="pay" :disabled="cart.length === 0">
      💳 Payer
    </button>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { getAuth } from "firebase/auth"
import { db } from "../firebase"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { useRouter } from "vue-router"

const auth = getAuth()
const router = useRouter()

const cart = ref([])
const uid = ref(null)

onMounted(() => {
  auth.onAuthStateChanged((user) => {
    if (!user) return

    uid.value = user.uid

    const refDoc = doc(db, "users", user.uid)

    onSnapshot(refDoc, (snap) => {
      if (!snap.exists()) {
        cart.value = []
        return
      }

      const data = snap.data()

      // 🔥 IMPORTANT: cartSession uniquement
      cart.value = data.cartSession || []
    })
  })
})

const total = computed(() =>
  cart.value.reduce((sum, i) => sum + i.price * i.qty, 0)
)

// ➕
const increase = async (item) => {
  item.qty++
  await save()
}

// ➖
const decrease = async (item) => {
  if (item.qty > 1) {
    item.qty--
  } else {
    cart.value = cart.value.filter(i => i.id !== item.id)
  }
  await save()
}

// 🗑
const remove = async (item) => {
  cart.value = cart.value.filter(i => i.id !== item.id)
  await save()
}

// 💾
const save = async () => {
  if (!uid.value) return

  await updateDoc(doc(db, "users", uid.value), {
    cartSession: cart.value
  })
}

// 💳 PAY
const pay = () => {
  const order = {
    items: cart.value,
    total: total.value,
    ownerUid: uid.value
  }

  localStorage.setItem("pendingStripeOrder", JSON.stringify(order))

  router.push("/payment-success")
}
</script>
