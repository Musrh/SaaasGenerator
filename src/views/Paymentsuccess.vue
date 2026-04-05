<!-- ============================================================
  PaymentSuccess.vue — VERSION PRO (BACKEND STRIPE WEBHOOK)
============================================================ -->
<template>
  <div class="ps-root">
    <div class="ps-card">

      <!-- ICON -->
      <div class="ps-icon-wrap">
        <div class="ps-circle">
          <span class="ps-check">✓</span>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="ps-saving">
        <div class="ps-spinner"></div>
        <p>Confirmation de votre paiement...</p>
        <p class="ps-sub">Merci de patienter quelques secondes</p>
      </div>

      <!-- SUCCESS -->
      <template v-else>
        <h1 class="ps-title">Paiement réussi 🎉</h1>

        <p class="ps-subtitle">
          Votre commande a été confirmée
        </p>

        <!-- ORDER DATA -->
        <div v-if="orderData" class="ps-summary">

          <div class="ps-row">
            <span>Commande</span>
            <strong>#{{ orderData.sessionId?.slice(0,8) }}</strong>
          </div>

          <div class="ps-row">
            <span>Montant</span>
            <strong>{{ orderData.montant }} €</strong>
          </div>

          <div v-if="orderData.email" class="ps-row">
            <span>Email</span>
            <strong>{{ orderData.email }}</strong>
          </div>

          <!-- ITEMS -->
          <div v-if="orderData.items?.length" class="ps-items">
            <div class="ps-items-title">Articles</div>

            <div
              v-for="(item, i) in orderData.items"
              :key="i"
              class="ps-item"
            >
              <span>
                {{ item.nom || item.name }}
              </span>

              <span>
                × {{ item.quantity || item.qty }}
              </span>

              <strong>
                {{
                  (item.prix || item.price || 0) *
                  (item.quantity || item.qty || 1)
                }} €
              </strong>
            </div>
          </div>

          <div v-if="orderData.status" class="ps-row">
            <span>Statut</span>
            <strong>{{ orderData.status }}</strong>
          </div>

        </div>

        <!-- FALLBACK -->
        <div v-else class="ps-summary">
          <p>
            Paiement confirmé ✔<br>
            Votre commande est en cours de traitement.
          </p>
        </div>

        <!-- ACTIONS -->
        <div class="ps-actions">
          <button class="ps-btn-primary" @click="goStore">
            ← Retour au store
          </button>

          <button class="ps-btn-sec" @click="goHome">
            Accueil
          </button>
        </div>

      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter, useRoute } from "vue-router"

const router = useRouter()
const route = useRoute()

const orderData = ref(null)
const loading = ref(true)

const API_URL = "https://TON-BACKEND-URL.com" // 🔥 change ici

// ======================================================
// FETCH ORDER WITH RETRY (important Stripe delay)
// ======================================================
const fetchOrder = async (sessionId) => {
  let attempts = 0

  while (attempts < 5) {
    try {
      const res = await fetch(`${API_URL}/api/order/${sessionId}`)

      if (res.ok) {
        const data = await res.json()
        return data
      }
    } catch (e) {
      console.warn("Retry fetch order...")
    }

    await new Promise((r) => setTimeout(r, 1200))
    attempts++
  }

  return null
}

// ======================================================
// INIT
// ======================================================
onMounted(async () => {
  try {
    const sessionId = route.query.session_id

    console.log("💳 PaymentSuccess session:", sessionId)

    if (sessionId) {
      orderData.value = await fetchOrder(sessionId)
    }

  } catch (err) {
    console.error("❌ PaymentSuccess error:", err)
  } finally {
    loading.value = false
  }
})

// ======================================================
// NAVIGATION
// ======================================================
const goStore = () => {
  router.push("/")
}

const goHome = () => {
  router.push("/")
}
</script>

<style scoped>
.ps-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  padding: 20px;
}

.ps-card {
  background: white;
  width: 100%;
  max-width: 500px;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.ps-circle {
  width: 80px;
  height: 80px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto;
}

.ps-check {
  color: white;
  font-size: 32px;
}

.ps-title {
  font-size: 24px;
  margin-top: 20px;
}

.ps-subtitle {
  color: #666;
  margin-bottom: 20px;
}

.ps-summary {
  background: #f9fafb;
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
  text-align: left;
}

.ps-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.ps-items {
  margin-top: 15px;
}

.ps-items-title {
  font-weight: bold;
  margin-bottom: 10px;
}

.ps-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 8px;
}

.ps-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.ps-btn-primary {
  flex: 2;
  background: #10b981;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 10px;
}

.ps-btn-sec {
  flex: 1;
  background: #eee;
  border: none;
  padding: 12px;
  border-radius: 10px;
}

/* spinner */
.ps-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #ddd;
  border-top-color: #10b981;
  border-radius: 50%;
  margin: auto;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
