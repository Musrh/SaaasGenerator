<!-- ============================================================
  SaaasGenerator/src/views/PaymentSuccess.vue
  Affiché après un paiement client RÉUSSI dans un store.
  - Le client vient d'acheter dans le store d'un propriétaire
  - La commande a déjà été sauvegardée dans Firestore
    par SiteViewer.vue (users/{ownerUid}/orders/{id})
  - Cette page confirme visuellement le succès
============================================================ -->
<template>
  <div class="ps-root">
    <div class="ps-card">

      <!-- Icône succès animée -->
      <div class="ps-icon-wrap">
        <div class="ps-circle">
          <span class="ps-check">✓</span>
        </div>
      </div>

      <h1 class="ps-title">Commande confirmée !</h1>
      <p class="ps-subtitle">Votre paiement a bien été traité.</p>

      <!-- Récapitulatif -->
      <div v-if="orderData" class="ps-summary">
        <div class="ps-summary-row">
          <span>Montant payé</span>
          <strong>{{ orderData.total }}{{ orderData.currency }}</strong>
        </div>
        <div class="ps-summary-row" v-if="orderData.provider">
          <span>Via</span>
          <strong class="ps-provider" :class="orderData.provider">{{ orderData.provider }}</strong>
        </div>
        <div class="ps-summary-row" v-if="orderData.customerEmail">
          <span>Email</span>
          <strong>{{ orderData.customerEmail }}</strong>
        </div>
        <div class="ps-items" v-if="orderData.items?.length">
          <div class="ps-items-title">Articles commandés</div>
          <div v-for="item in orderData.items" :key="item.id" class="ps-item">
            <div class="ps-item-img">
              <img v-if="item.image" :src="item.image" :alt="item.name"/>
              <span v-else>🛍️</span>
            </div>
            <div class="ps-item-info">
              <span class="ps-item-name">{{ item.name }}</span>
              <span class="ps-item-qty">× {{ item.qty }}</span>
            </div>
            <span class="ps-item-price">{{ (parseFloat(item.price) * item.qty).toFixed(2) }}{{ item.currency }}</span>
          </div>
        </div>
      </div>

      <!-- Message si pas de données (accès direct) -->
      <div v-else class="ps-summary">
        <p class="ps-no-data">Votre commande a été enregistrée. Vous recevrez une confirmation par email.</p>
      </div>

      <div class="ps-actions">
        <button class="ps-btn-primary" @click="goBack">
          ← Retourner au store
        </button>
        <button class="ps-btn-sec" @click="goHome">
          Accueil
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter, useRoute } from "vue-router"

const router    = useRouter()
const route     = useRoute()
const orderData = ref(null)

onMounted(() => {
  // Récupérer les données de commande depuis sessionStorage (placé par SiteViewer)
  const raw = sessionStorage.getItem("lastOrder")
  if (raw) {
    try {
      orderData.value = JSON.parse(raw)
      sessionStorage.removeItem("lastOrder")
    } catch(e) { console.warn(e) }
  }
})

const goBack = () => {
  // Retourner au store depuis lequel le client venait
  const siteUid = route.query.uid || orderData.value?.siteSlug
  if (siteUid) router.push(`/site/${siteUid}`)
  else router.push("/")
}

const goHome = () => router.push("/")
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
.ps-root{min-height:100vh;background:linear-gradient(135deg,#f0fdf4,#dcfce7);display:flex;align-items:center;justify-content:center;padding:24px;font-family:'DM Sans',sans-serif}
.ps-card{background:white;border-radius:24px;padding:48px 36px;max-width:480px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(16,185,129,.15)}

/* Icône */
.ps-icon-wrap{display:flex;justify-content:center;margin-bottom:24px}
.ps-circle{width:80px;height:80px;background:linear-gradient(135deg,#10b981,#059669);border-radius:50%;display:flex;align-items:center;justify-content:center;animation:pop .4s cubic-bezier(.175,.885,.32,1.275)}
@keyframes pop{0%{transform:scale(0);opacity:0}100%{transform:scale(1);opacity:1}}
.ps-check{color:white;font-size:36px;font-weight:700;line-height:1}

.ps-title{font-family:'Playfair Display',serif;font-size:28px;color:#111;margin-bottom:8px}
.ps-subtitle{font-size:15px;color:#6b7280;margin-bottom:28px}

/* Résumé */
.ps-summary{background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:20px;margin-bottom:28px;text-align:left}
.ps-summary-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:14px;color:#6b7280}
.ps-summary-row:not(:last-child){border-bottom:1px solid #f3f4f6}
.ps-summary-row strong{color:#111}
.ps-provider{text-transform:capitalize;background:#f3f4f6;padding:2px 10px;border-radius:100px;font-size:12px}
.ps-provider.stripe{background:rgba(99,91,255,.1);color:#635bff}
.ps-provider.paypal{background:rgba(255,196,57,.2);color:#92400e}
.ps-items{margin-top:14px;padding-top:14px;border-top:1px solid #e5e7eb}
.ps-items-title{font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px}
.ps-item{display:flex;align-items:center;gap:10px;padding:6px 0}
.ps-item-img{width:36px;height:36px;border-radius:6px;overflow:hidden;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.ps-item-img img{width:100%;height:100%;object-fit:cover}
.ps-item-info{flex:1;display:flex;flex-direction:column}
.ps-item-name{font-size:13px;font-weight:600;color:#111}
.ps-item-qty{font-size:11px;color:#9ca3af}
.ps-item-price{font-size:13px;font-weight:700;color:#10b981;white-space:nowrap}
.ps-no-data{font-size:14px;color:#6b7280;line-height:1.6;text-align:center;padding:8px 0}

/* Actions */
.ps-actions{display:flex;gap:10px}
.ps-btn-primary{flex:2;background:#10b981;color:white;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.ps-btn-primary:hover{background:#059669;transform:translateY(-1px)}
.ps-btn-sec{flex:1;background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;border-radius:12px;padding:14px;font-size:14px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.ps-btn-sec:hover{background:#e5e7eb}
</style>
