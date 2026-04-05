<!-- ============================================================
  Orders.vue — lecture depuis users (items)
============================================================ -->

<script setup>
import { ref, onMounted, computed } from "vue"
import { db, auth } from "../firebase"
import { collection, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

const orders = ref([])
const loading = ref(true)
const currentUser = ref(null)

const filter = ref("all")
const search = ref("")

// 🔥 LOAD USERS → ORDERS
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user

    const usersRef = collection(db, "users")

    onSnapshot(usersRef, (snap) => {

      // 👇 DEBUG IMPORTANT
      console.log(
        "USERS SNAPSHOT",
        snap.docs.map(d => d.data())
      )

      const result = []

      snap.forEach(docSnap => {
        const u = docSnap.data()

        // si pas de panier / items → skip
        if (!u.items || !Array.isArray(u.items) || u.items.length === 0) return

        const total = u.items.reduce((sum, item) => {
          return sum + ((item.price || 0) * (item.qty || 1))
        }, 0)

        result.push({
          id: docSnap.id,
          email: u.email || "—",
          items: u.items,
          total: total.toFixed(2),
          paye: u.paye || false,
          createdAt: u.createdAt || null
        })
      })

      orders.value = result
      loading.value = false
    })
  })
})

// 🔎 FILTER + SEARCH
const filteredOrders = computed(() => {
  return orders.value
    .filter(o => {
      if (filter.value === "all") return true
      if (filter.value === "paid") return o.paye === true
      if (filter.value === "pending") return o.paye === false
    })
    .filter(o => {
      if (!search.value) return true
      const s = search.value.toLowerCase()
      return (
        o.email.toLowerCase().includes(s) ||
        o.id.toLowerCase().includes(s)
      )
    })
})

// 💰 TOTAL REVENUE
const totalRevenue = computed(() => {
  return orders.value
    .filter(o => o.paye)
    .reduce((sum, o) => sum + parseFloat(o.total || 0), 0)
    .toFixed(2)
})

// 📊 STATS
const stats = computed(() => ({
  all: orders.value.length,
  paid: orders.value.filter(o => o.paye).length,
  pending: orders.value.filter(o => !o.paye).length
}))

// 🕒 FORMAT DATE
const formatDate = (ts) => {
  if (!ts) return "—"
  return new Date(ts).toLocaleString("fr-FR")
}
</script>

<template>
<div class="orders">

  <!-- HEADER -->
  <div class="header">
    <div>
      <h1>📦 Commandes clients</h1>
      <p>Source : collection users</p>
    </div>

    <div class="revenue">
      💰 {{ totalRevenue }} €
    </div>
  </div>

  <!-- STATS -->
  <div class="stats">
    <button @click="filter='all'">Toutes ({{ stats.all }})</button>
    <button @click="filter='paid'">Payées ({{ stats.paid }})</button>
    <button @click="filter='pending'">En attente ({{ stats.pending }})</button>
  </div>

  <!-- SEARCH -->
  <input v-model="search" placeholder="Rechercher..." />

  <!-- LOADING -->
  <div v-if="loading">Chargement...</div>

  <!-- EMPTY -->
  <div v-else-if="filteredOrders.length === 0">
    Aucune commande trouvée
  </div>

  <!-- LIST -->
  <div v-else>

    <div v-for="order in filteredOrders" :key="order.id" class="card">

      <div class="top">
        <strong>{{ order.email }}</strong>
        <span>{{ order.paye ? "Payé" : "En attente" }}</span>
      </div>

      <div class="items">
        <div v-for="(item, i) in order.items" :key="i">
          {{ item.name }} × {{ item.qty }} — {{ item.price }}€
        </div>
      </div>

      <div class="bottom">
        Total : {{ order.total }} €
        <small>{{ formatDate(order.createdAt) }}</small>
      </div>

    </div>

  </div>

</div>
</template>

<style scoped>
.orders {
  padding: 20px;
  color: white;
  background: #0f0f11;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.revenue {
  background: #10b98122;
  padding: 10px 15px;
  border-radius: 8px;
}

.stats button {
  margin-right: 10px;
  padding: 8px 12px;
  background: #222;
  color: white;
  border: none;
  cursor: pointer;
}

.card {
  background: #1a1a1e;
  padding: 15px;
  margin: 10px 0;
  border-radius: 10px;
}

.top {
  display: flex;
  justify-content: space-between;
}

.items {
  margin: 10px 0;
  font-size: 14px;
  color: #bbb;
}

.bottom {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #888;
}
</style>
