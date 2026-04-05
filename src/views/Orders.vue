<template>
  <div class="orders-page">
    <h2>📦 Commandes</h2>

    <div v-if="loading">Chargement...</div>

    <div v-else>
      <div class="filters">
        <button @click="filter = 'all'">Toutes</button>
        <button @click="filter = 'pending'">Pending</button>
        <button @click="filter = 'paid'">Payées</button>
        <button @click="filter = 'shipped'">Expédiées</button>
        <button @click="filter = 'cancelled'">Annulées</button>
      </div>

      <div v-for="order in filteredOrders" :key="order.id" class="card">

        <div class="header">
          <div>
            <b>{{ order.email }}</b>
            <p class="small">{{ order.userId }}</p>
          </div>

          <div class="status" :class="order.status">
            {{ order.status }}
          </div>
        </div>

        <div class="items">
          <div v-for="(item, i) in order.items" :key="i" class="item">
            <span>{{ item.name }}</span>
            <span>x{{ item.qty }}</span>
            <span>{{ item.price }}€</span>
          </div>
        </div>

        <div class="footer">
          <b>Total: {{ order.total }} {{ order.currency }}</b>

          <select v-model="order.status" @change="updateStatus(order)">
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="shipped">shipped</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>

        <p class="date">
          {{ formatDate(order.createdAt) }}
        </p>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { db } from "../firebase"
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore"

const orders = ref([])
const loading = ref(true)
const filter = ref("all")

/**
 * 🔥 LOAD ORDERS
 */
onMounted(() => {
  onSnapshot(collection(db, "orders"), (snap) => {

    console.log("ORDERS SNAPSHOT =>", snap.docs.map(d => d.data()))

    orders.value = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    loading.value = false
  })
})

/**
 * 🔥 FILTER ORDERS
 */
const filteredOrders = computed(() => {
  if (filter.value === "all") return orders.value
  return orders.value.filter(o => o.status === filter.value)
})

/**
 * 🔥 UPDATE STATUS
 */
async function updateStatus(order) {
  try {
    await updateDoc(doc(db, "orders", order.id), {
      status: order.status,
      updatedAt: serverTimestamp()
    })
  } catch (e) {
    console.error("Erreur update status:", e)
  }
}

/**
 * 🔥 FORMAT DATE SAFE
 */
function formatDate(timestamp) {
  if (!timestamp) return "—"

  try {
    return new Date(timestamp.seconds * 1000).toLocaleString()
  } catch {
    return "—"
  }
}
</script>

<style scoped>
.orders-page {
  padding: 20px;
  color: #fff;
  background: #0f0f0f;
  min-height: 100vh;
}

.filters button {
  margin: 5px;
  padding: 6px 10px;
  cursor: pointer;
}

.card {
  background: #1a1a1a;
  padding: 15px;
  margin: 15px 0;
  border-radius: 10px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.small {
  font-size: 12px;
  opacity: 0.6;
}

.items {
  margin-top: 10px;
}

.item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.footer {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  align-items: center;
}

.status {
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 12px;
}

.status.pending {
  background: orange;
}

.status.paid {
  background: green;
}

.status.shipped {
  background: blue;
}

.status.cancelled {
  background: red;
}

.date {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 5px;
}
</style>
