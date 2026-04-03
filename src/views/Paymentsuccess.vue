<!-- ============================================================
  PaymentSuccess.vue — VERSION CORRIGÉE
============================================================ -->
<template>
  <div class="ps-root">
    <div class="ps-card">

      <!-- Icône succès -->
      <div class="ps-icon-wrap">
        <div class="ps-circle">
          <span class="ps-check">✓</span>
        </div>
      </div>

      <!-- Chargement -->
      <div v-if="saving" class="ps-saving">
        <div class="ps-saving-spinner"></div>
        <p>Confirmation de votre commande...</p>
      </div>

      <!-- Succès -->
      <template v-else>
        <h1 class="ps-title">Commande confirmée !</h1>
        <p class="ps-subtitle">
          Paiement validé avec succès
          <span v-if="saved"> • Commande enregistrée ✓</span>
        </p>

        <!-- Résumé -->
        <div v-if="orderData" class="ps-summary">
          <div class="ps-summary-row">
            <span>Montant payé</span>
            <strong>{{ orderData.total }} {{ orderData.currency }}</strong>
          </div>

          <div class="ps-summary-row" v-if="orderData.customerEmail">
            <span>Email</span>
            <strong>{{ orderData.customerEmail }}</strong>
          </div>

          <div class="ps-items" v-if="orderData.items?.length">
            <div class="ps-items-title">Articles</div>

            <div
              v-for="item in orderData.items"
              :key="item.id"
              class="ps-item"
            >
              <div class="ps-item-img">
                <img v-if="item.image" :src="item.image" />
                <span v-else>🛍️</span>
              </div>

              <div class="ps-item-info">
                <span class="ps-item-name">{{ item.name }}</span>
                <span class="ps-item-qty">× {{ item.qty }}</span>
              </div>

              <span class="ps-item-price">
                {{ (item.price * item.qty).toFixed(2) }}
                {{ item.currency || orderData.currency }}
              </span>
            </div>
          </div>
        </div>

        <!-- fallback -->
        <div v-else class="ps-summary">
          <p class="ps-no-data">
            Votre commande a été traitée avec succès.
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
import { db } from "../firebase.js"
import { collection, addDoc } from "firebase/firestore"

const router = useRouter()
const route = useRoute()

const orderData = ref(null)
const saving = ref(true)
const saved = ref(false)

onMounted(async () => {
  try {
    // 🔥 1. récupérer la commande (résiste au redirect Stripe)
    const raw =
      localStorage.getItem("pendingStripeOrder") ||
      localStorage.getItem("pendingOrder") ||
      sessionStorage.getItem("pendingOrder")

    if (raw) {
      const order = JSON.parse(raw)
      orderData.value = order

      // 🔥 2. récupérer owner UID
      const ownerUid =
        order.ownerUid ||
        localStorage.getItem("stripeOwnerUid") ||
        route.query.uid

      // 🔥 3. sauvegarde Firestore
      if (ownerUid) {
        await addDoc(collection(db, "users", ownerUid, "orders"), {
          items: order.items || [],
          total: order.total,
          currency: order.currency,
          itemCount: order.itemCount,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          siteSlug: order.siteSlug || localStorage.getItem("stripeSiteSlug"),
          ownerUid,
          provider: "stripe",
          status: "paid",
          createdAt: new Date(),
          transactionId: "stripe-checkout",
        })

        saved.value = true
      }
    }
  } catch (err) {
    console.error("❌ Erreur PaymentSuccess:", err)
  } finally {
    // 🔥 4. nettoyage complet
    localStorage.removeItem("pendingStripeOrder")
    localStorage.removeItem("pendingOrder")
    localStorage.removeItem("stripeOwnerUid")
    localStorage.removeItem("stripeSiteSlug")
    localStorage.removeItem("cart")
    sessionStorage.removeItem("pendingOrder")

    saving.value = false
  }
})

const goBack = () => {
  const siteUid =
    orderData.value?.siteSlug ||
    orderData.value?.ownerUid ||
    route.query.uid

  if (siteUid) router.push(`/site/${siteUid}`)
  else router.push("/")
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
  font-family: sans-serif;
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
