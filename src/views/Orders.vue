<!-- ============================================================
  Orders.vue — VERSION CORRIGÉE
============================================================ -->
<script setup>
import { ref, onMounted, computed } from "vue"
import { db, auth } from "../firebase.js"
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

const orders      = ref([])
const loading     = ref(true)
const authReady   = ref(false)
const currentUser = ref(null)
const filter      = ref("all")
const search      = ref("")

// 🔎 FILTRE
const filteredOrders = computed(() => {
  return orders.value
    .filter(o => filter.value === "all" || o.status === filter.value)
    .filter(o => {
      if (!search.value) return true
      const s = search.value.toLowerCase()
      return (o.customerEmail || "").toLowerCase().includes(s) ||
             (o.id || "").toLowerCase().includes(s)
    })
})

// 💰 REVENUS
const totalRevenue = computed(() =>
  orders.value
    .filter(o => o.status === "paid" || o.status === "shipped")
    .reduce((s, o) => s + (parseFloat(o.total) || 0), 0)
    .toFixed(2)
)

// 📊 STATS
const countByStatus = computed(() => ({
  all:     orders.value.length,
  pending: orders.value.filter(o => o.status === "pending").length,
  paid:    orders.value.filter(o => o.status === "paid").length,
  shipped: orders.value.filter(o => o.status === "shipped").length,
}))

// 🔐 AUTH + LOAD DATA
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    authReady.value = true

    if (!user) {
      loading.value = false
      return
    }

    currentUser.value = user

    const q = query(
      collection(db, "users", user.uid, "orders"),
      orderBy("createdAt", "desc")
    )

    onSnapshot(q, (snap) => {
      orders.value = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }))
      loading.value = false
    })
  })
})

// 🔄 UPDATE STATUS
const updateStatus = async (orderId, newStatus) => {
  if (!currentUser.value) return

  try {
    await updateDoc(
      doc(db, "users", currentUser.value.uid, "orders", orderId),
      {
        status: newStatus,
        updatedAt: new Date().toISOString()
      }
    )
  } catch (e) {
    console.error("Erreur update status :", e)
  }
}

// 🕒 FORMAT DATE
const formatDate = (iso) => {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

// 🎨 UI
const statusLabel = {
  pending: "En attente",
  paid: "Payé",
  shipped: "Expédié",
  cancelled: "Annulé"
}

const statusColor = {
  pending: "#f59e0b",
  paid: "#10b981",
  shipped: "#6c63ff",
  cancelled: "#ef4444"
}
</script>

<template>
<div class="orders-root">

  <!-- ❌ PAS CONNECTÉ -->
  <div v-if="authReady && !currentUser" class="orders-empty">
    <span>🔒</span>
    <p>Vous devez être connecté pour voir les commandes.</p>
  </div>

  <!-- HEADER -->
  <div v-else>

    <div class="orders-header">
      <div>
        <h1>📦 Commandes</h1>
        <p>Gérez les commandes de vos clients</p>
      </div>

      <div class="revenue-badge">
        Revenus totaux : <strong>{{ totalRevenue }}€</strong>
      </div>
    </div>

    <!-- STATS -->
    <div class="stats-row">
      <div
        v-for="(label, key) in { all: 'Toutes', pending: 'En attente', paid: 'Payées', shipped: 'Expédiées' }"
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
      <input
        v-model="search"
        placeholder="🔍 Rechercher par email ou ID commande..."
        class="search-input"
      />
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="orders-loading">
      <div class="spinner-lg"/>
      <p>Chargement des commandes...</p>
    </div>

    <!-- EMPTY -->
    <div v-else-if="filteredOrders.length === 0" class="orders-empty">
      <span>📭</span>
      <p>
        Aucune commande
        {{ filter !== 'all' ? `"${statusLabel[filter]}"` : '' }}
        pour l'instant.
      </p>
    </div>

    <!-- LIST -->
    <div v-else class="orders-list">
      <div v-for="order in filteredOrders" :key="order.id" class="order-card">

        <!-- TOP -->
        <div class="order-top">
          <div class="order-id">
            <span class="order-label">Commande</span>
            <span class="order-num">
              #{{ order.id.slice(0,8).toUpperCase() }}
            </span>
          </div>

          <div class="order-date">
            {{ formatDate(order.createdAt) }}
          </div>

          <div
            class="order-status-badge"
            :style="{
              background: statusColor[order.status] + '22',
              color: statusColor[order.status],
              borderColor: statusColor[order.status] + '44'
            }"
          >
            {{ statusLabel[order.status] || order.status }}
          </div>
        </div>

        <!-- CLIENT -->
        <div class="order-customer">
          <div class="cust-row">
            <span class="cust-label">Client</span>
            {{ order.customerName || "Anonyme" }}
          </div>

          <div class="cust-row">
            <span class="cust-label">Email</span>
            {{ order.customerEmail || "—" }}
          </div>

          <div class="cust-row" v-if="order.provider">
            <span class="cust-label">Paiement</span>
            {{ order.provider }}
          </div>
        </div>

        <!-- ITEMS -->
        <div class="order-items">
          <div v-for="(item, i) in order.items" :key="i" class="order-item">
            <div class="item-img">
              <img v-if="item.image" :src="item.image" />
              <span v-else>🛍️</span>
            </div>

            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-qty">× {{ item.qty }}</div>
            </div>

            <div class="item-price">
              {{ (parseFloat(item.price) * item.qty).toFixed(2) }}
              {{ item.currency }}
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="order-footer">
          <div class="order-total">
            Total : <strong>{{ order.total }}{{ order.currency }}</strong>
          </div>

          <select
            class="status-select"
            :value="order.status"
            @change="updateStatus(order.id, $event.target.value)"
          >
            <option value="pending">En attente</option>
            <option value="paid">Payé</option>
            <option value="shipped">Expédié</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>

      </div>
    </div>

  </div>
</div>
</template>

<style scoped>
/* ✅ TON STYLE INCHANGÉ */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
.orders-root{min-height:100vh;background:#0f0f11;font-family:'DM Sans',sans-serif;padding:32px;color:#f0f0f0}
.orders-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:12px}
.orders-header h1{font-family:'Playfair Display',serif;font-size:28px;margin-bottom:4px}
.orders-header p{font-size:14px;color:#8a8a9a}
.revenue-badge{background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);color:#10b981;padding:10px 20px;border-radius:10px;font-size:14px}
.revenue-badge strong{font-size:20px;display:block;margin-top:2px}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.stat-card{background:#17171a;border:2px solid #2a2a2f;border-radius:12px;padding:16px 20px;cursor:pointer;transition:all .15s;text-align:center}
.stat-card:hover,.stat-card.active{border-color:#6c63ff;background:#1f1f23}
.stat-count{font-size:28px;font-weight:700;color:#f0f0f0}
.stat-label{font-size:12px;color:#8a8a9a;margin-top:2px}
.search-bar{margin-bottom:20px}
.search-input{width:100%;background:#17171a;border:1px solid #2a2a2f;color:#f0f0f0;padding:11px 16px;border-radius:10px;font-size:14px}
.orders-loading,.orders-empty{text-align:center;padding:60px 20px;color:#8a8a9a}
.orders-empty span{font-size:40px;display:block;margin-bottom:12px;opacity:.5}
.spinner-lg{width:40px;height:40px;border:3px solid #2a2a2f;border-top-color:#6c63ff;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 16px}
@keyframes spin{to{transform:rotate(360deg)}}
.orders-list{display:flex;flex-direction:column;gap:16px}
.order-card{background:#17171a;border:1px solid #2a2a2f;border-radius:14px;overflow:hidden}
.order-top{display:flex;align-items:center;gap:16px;padding:16px 20px;border-bottom:1px solid #2a2a2f;flex-wrap:wrap}
.order-id{display:flex;flex-direction:column}
.order-label{font-size:10px;color:#5a5a6a;text-transform:uppercase}
.order-num{font-size:15px;font-weight:700;font-family:monospace}
.order-date{font-size:13px;color:#8a8a9a;margin-left:auto}
.order-status-badge{font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;border:1px solid;text-transform:uppercase}
.order-customer{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 20px;background:#1a1a1e;border-bottom:1px solid #2a2a2f}
.order-items{padding:12px 20px;display:flex;flex-direction:column;gap:8px;border-bottom:1px solid #2a2a2f}
.order-item{display:flex;align-items:center;gap:12px}
.item-img{width:40px;height:40px;border-radius:6px;background:#2a2a2f;display:flex;align-items:center;justify-content:center}
.item-img img{width:100%;height:100%;object-fit:cover}
.item-info{flex:1}
.item-price{font-size:14px;font-weight:600;color:#6c63ff}
.order-footer{display:flex;align-items:center;justify-content:space-between;padding:12px 20px}
.status-select{background:#1f1f23;border:1px solid #35353c;color:#f0f0f0;padding:7px 12px;border-radius:8px}
</style>
