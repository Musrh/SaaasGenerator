<script setup>
import { ref, onMounted, computed } from "vue"
import { db, auth } from "../firebase.js"
import {
  collection,
  onSnapshot,
  updateDoc,
  doc
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

const orders = ref([])
const loading = ref(true)
const currentUser = ref(null)
const filter = ref("all")
const search = ref("")

// 🔥 CHARGEMENT USERS -> COMMANDES
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user

    const usersRef = collection(db, "users")

    onSnapshot(usersRef, (snap) => {
      const allOrders = []

      snap.docs.forEach((d) => {
        const u = d.data()

        if (u.items && Array.isArray(u.items) && u.items.length > 0) {
          const total = u.items.reduce(
            (sum, it) => sum + (parseFloat(it.price || 0) * (it.qty || 1)),
            0
          )

          allOrders.push({
            id: d.id,
            customerEmail: u.email,
            customerName: u.email?.split("@")[0],
            items: u.items,
            total: total.toFixed(2),
            currency: "€",
            status: u.paye ? "paid" : "pending",
            createdAt: u.createdAt || new Date().toISOString(),
            provider: u.provider || "stripe"
          })
        }
      })

      orders.value = allOrders
      loading.value = false
    })
  })
})

// 🔎 FILTRAGE
const filteredOrders = computed(() => {
  return orders.value
    .filter(o => filter.value === "all" || o.status === filter.value)
    .filter(o => {
      if (!search.value) return true
      const s = search.value.toLowerCase()
      return (
        (o.customerEmail || "").toLowerCase().includes(s) ||
        (o.id || "").toLowerCase().includes(s)
      )
    })
})

// 💰 REVENUS
const totalRevenue = computed(() =>
  orders.value
    .filter(o => o.status === "paid")
    .reduce((s, o) => s + parseFloat(o.total || 0), 0)
    .toFixed(2)
)

// 📊 STATS
const countByStatus = computed(() => ({
  all: orders.value.length,
  pending: orders.value.filter(o => o.status === "pending").length,
  paid: orders.value.filter(o => o.status === "paid").length,
}))

// 🔄 UPDATE STATUS (update users collection)
const updateStatus = async (userId, newStatus) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      paye: newStatus === "paid"
    })
  } catch (e) {
    console.error(e)
  }
}

// 🕒 DATE FORMAT
const formatDate = (d) => {
  if (!d) return "—"
  return new Date(d).toLocaleString("fr-FR")
}

// 🎨 LABELS
const statusLabel = {
  pending: "En attente",
  paid: "Payé"
}

const statusColor = {
  pending: "#f59e0b",
  paid: "#10b981"
}
</script>

<template>
<div class="orders-root">

  <div v-if="loading" class="orders-loading">
    <div class="spinner-lg"></div>
    <p>Chargement des commandes...</p>
  </div>

  <div v-else>

    <!-- HEADER -->
    <div class="orders-header">
      <div>
        <h1>📦 Commandes (users)</h1>
        <p>Commandes extraites depuis la collection users</p>
      </div>

      <div class="revenue-badge">
        Revenus : <strong>{{ totalRevenue }}€</strong>
      </div>
    </div>

    <!-- STATS -->
    <div class="stats-row">
      <div
        v-for="(label, key) in { all:'Toutes', pending:'En attente', paid:'Payées' }"
        :key="key"
        class="stat-card"
        :class="{ active: filter === key }"
        @click="filter = key"
      >
        <div class="stat-count">{{ countByStatus[key] }}</div>
        <div class="stat-label">{{ label }}</div>
      </div>
    </div>

    <!-- SEARCH -->
    <div class="search-bar">
      <input v-model="search" class="search-input" placeholder="Rechercher..." />
    </div>

    <!-- LIST -->
    <div class="orders-list">

      <div v-for="order in filteredOrders" :key="order.id" class="order-card">

        <div class="order-top">
          <div class="order-id">
            <span class="order-label">Client</span>
            <span class="order-num">{{ order.customerEmail }}</span>
          </div>

          <div class="order-date">
            {{ formatDate(order.createdAt) }}
          </div>

          <div
            class="order-status-badge"
            :style="{
              background: statusColor[order.status] + '22',
              color: statusColor[order.status]
            }"
          >
            {{ statusLabel[order.status] }}
          </div>
        </div>

        <!-- ITEMS -->
        <div class="order-items">
          <div v-for="(item, i) in order.items" :key="i" class="order-item">
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-qty">× {{ item.qty }}</div>
            </div>

            <div class="item-price">
              {{ (item.price * item.qty).toFixed(2) }}€
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="order-footer">
          <strong>Total : {{ order.total }}€</strong>

          <select
            class="status-select"
            :value="order.status"
            @change="updateStatus(order.id, $event.target.value)"
          >
            <option value="pending">En attente</option>
            <option value="paid">Payé</option>
          </select>
        </div>

      </div>

    </div>

  </div>
</div>
</template>
