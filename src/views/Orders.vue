<script setup>
import { ref, onMounted, computed } from "vue"
import { db, auth } from "../firebase"
import { collection, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

const orders = ref([])
const loading = ref(true)
const filter = ref("all")

onMounted(() => {
  onAuthStateChanged(auth, () => {

    const usersRef = collection(db, "users")

    onSnapshot(usersRef, (snap) => {

      const result = []

      snap.forEach(docSnap => {
        const u = docSnap.data()

        if (!u.items || !Array.isArray(u.items)) return

        const total = u.items.reduce((sum, item) => {
          return sum + ((item.price || 0) * (item.qty || 1))
        }, 0)

        result.push({
          id: docSnap.id,
          email: u.email,
          items: u.items,
          total,
          paye: u.paye || false,
          createdAt: u.createdAt
        })
      })

      orders.value = result
      loading.value = false
    })

  })
})

const filtered = computed(() => {
  return orders.value.filter(o => {
    if (filter.value === "all") return true
    if (filter.value === "paid") return o.paye
    if (filter.value === "pending") return !o.paye
  })
})
</script>

<template>
<div style="padding:20px; color:white">

  <h1>Commandes</h1>

  <div v-if="loading">Chargement...</div>

  <div v-else>
    <div v-for="o in filtered" :key="o.id"
         style="border:1px solid #333; padding:10px; margin:10px 0">

      <p><strong>{{ o.email }}</strong></p>
      <p>Total : {{ o.total.toFixed(2) }}€</p>
      <p>Status : {{ o.paye ? "Payé" : "En attente" }}</p>

      <div v-for="(i, index) in o.items" :key="index">
        - {{ i.name }} x{{ i.qty }} ({{ i.price }}€)
      </div>

    </div>
  </div>

</div>
</template>
