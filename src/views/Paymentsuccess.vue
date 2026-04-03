<!-- ============================================================
  PaymentSuccess.vue — VERSION STABLE & PRO
============================================================ -->
<template>
  <div class="ps-root">
    <div class="ps-card">

      <!-- Icône -->
      <div class="ps-icon-wrap">
        <div class="ps-circle">
          <span class="ps-check">✓</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="saving" class="ps-saving">
        <div class="ps-saving-spinner"></div>
        <p>Confirmation de votre paiement...</p>
      </div>

      <!-- Success -->
      <template v-else>
        <h1 class="ps-title">Paiement réussi 🎉</h1>

        <p class="ps-subtitle">
          Votre commande a bien été validée
        </p>

        <!-- Résumé -->
        <div v-if="orderData" class="ps-summary">
          <div class="ps-summary-row">
            <span>Montant</span>
            <strong>{{ orderData.total }} {{ orderData.currency }}</strong>
          </div>

          <div v-if="orderData.customerEmail" class="ps-summary-row">
            <span>Email</span>
            <strong>{{ orderData.customerEmail }}</strong>
          </div>

          <div v-if="orderData.items?.length" class="ps-items">
            <div class="ps-items-title">Articles</div>

            <div
              v-for="(item, i) in orderData.items"
              :key="i"
              class="ps-item"
            >
              <span>{{ item.nom || item.name }}</span>
              <span>× {{ item.quantity || item.qty }}</span>
              <strong>
                {{ (item.prix || item.price) * (item.quantity || item.qty) }}
              </strong>
            </div>
          </div>
        </div>

        <!-- fallback -->
        <div v-else class="ps-summary">
          <p class="ps-no-data">
            Paiement confirmé. Vous recevrez un email de confirmation.
          </p>
        </div>

        <!-- Actions -->
        <div class="ps-actions">
          <button class="ps-btn-primary" @click="goBack">
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
const saving = ref(true)

onMounted(() => {
  try {
    // 🔥 1. récupérer session Stripe
    const sessionId = route.query.session_id

    // 🔥 2. récupérer commande locale (si dispo)
    const raw =
      localStorage.getItem("pendingStripeOrder") ||
      localStorage.getItem("pendingOrder") ||
      sessionStorage.getItem("pendingOrder")

    if (raw) {
      orderData.value = JSON.parse(raw)
    }

    // 🔥 3. sécuriser : même sans données → succès affiché
    console.log("✅ PaymentSuccess loaded | session:", sessionId)

  } catch (err) {
    console.error("❌ PaymentSuccess error:", err)
  } finally {
    // 🔥 4. nettoyage GLOBAL (CRITIQUE)
    localStorage.removeItem("pendingStripeOrder")
    localStorage.removeItem("pendingOrder")
    localStorage.removeItem("stripeOwnerUid")
    localStorage.removeItem("stripeSiteSlug")
    localStorage.removeItem("cart")
    sessionStorage.removeItem("pendingOrder")

    // 🔥 éviter retour panier après refresh
    localStorage.setItem("lastPayment", "success")

    saving.value = false
  }
})

// 🔁 navigation
const goBack = () => {
  const siteUid =
    orderData.value?.siteSlug ||
    orderData.value?.ownerUid ||
    route.query.uid

  if (siteUid) {
    router.push(`/site/${siteUid}`)
  } else {
    router.push("/")
  }
}

const goHome = () => {
  router.push("/")
}
</script>

<style scoped>
.ps-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ps-card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  text-align: center;
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
  font-size: 30px;
}

.ps-title {
  font-size: 24px;
  margin-top: 20px;
}

.ps-summary {
  background: #f9fafb;
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
}

.ps-item {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.ps-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.ps-btn-primary {
  flex: 2;
  background: #10b981;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 10px;
}

.ps-btn-sec {
  flex: 1;
  background: #eee;
  padding: 12px;
  border-radius: 10px;
}
</style>
