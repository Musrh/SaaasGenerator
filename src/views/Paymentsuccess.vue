<template>
  <div style="padding:20px">
    <h2>✅ Paiement réussi</h2>

    <p>{{ message }}</p>

    <!-- 🔥 NOUVEAU BOUTON -->
    <button
      v-if="uid"
      @click="clearCartManually"
      style="margin-top:15px;padding:10px"
    >
      🧹 Vider le panier
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { db } from "../firebase"
import { doc, updateDoc } from "firebase/firestore"

const router = useRouter()
const message = ref("Traitement en cours...")
const uid = ref(null)

let done = false

onMounted(async () => {
  if (done) return
  done = true

  try {
    const raw = localStorage.getItem("pendingStripeOrder")

    if (!raw) {
      message.value = "Aucune commande trouvée"
      return
    }

    const order = JSON.parse(raw)
    uid.value = order.ownerUid

    message.value = "Commande enregistrée ✔"

    // (optionnel) auto redirect
    setTimeout(() => {
      router.push("/")
    }, 2000)

  } catch (e) {
    console.error(e)
    message.value = "Erreur traitement commande"
  }
})

/**
 * 🔥 NOUVEAU : vider panier manuellement
 */
const clearCartManually = async () => {
  try {
    if (!uid.value) return

    await updateDoc(doc(db, "users", uid.value), {
      cartSession: []
    })

    message.value = "🧹 Panier vidé avec succès"

    console.log("CART CLEARED MANUALLY")
  } catch (e) {
    console.error("CLEAR CART ERROR:", e)
    message.value = "Erreur lors du vidage du panier"
  }
}
</script>
