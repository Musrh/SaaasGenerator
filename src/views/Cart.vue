<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  doc, onSnapshot, updateDoc,
  collection, addDoc
} from "firebase/firestore"

const router = useRouter()

// STATE
const uid = ref(null)
const cart = ref([])
const loading = ref(true)
const paying = ref(false)
const payError = ref("")

const customerName = ref("")
const customerEmail = ref("")
const shippingAddress = ref("")

let userRef = null
let unsubCart = null

// COMPUTED
const total = computed(() =>
  cart.value.reduce((s, i) => s + i.price * i.qty, 0)
)

// AUTH
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (!user) return

    uid.value = user.uid
    userRef = doc(db, "users", user.uid)

    unsubCart = onSnapshot(userRef, (snap) => {
      cart.value = snap.data()?.cartSession || []
      loading.value = false
    })
  })
})

onUnmounted(() => unsubCart?.())

// PAIEMENT
const payWithStripe = async () => {
  if (!customerName.value || !customerEmail.value || !shippingAddress.value) {
    payError.value = "Tous les champs sont obligatoires"
    return
  }

  paying.value = true
  payError.value = ""

  try {
    const pendingOrder = {
      items: cart.value,
      total: total.value,
      customerName: customerName.value,
      customerEmail: customerEmail.value,
      shippingAddress: shippingAddress.value,
      ownerUid: uid.value,
      createdAt: new Date().toISOString()
    }

    localStorage.setItem("pendingStripeOrder", JSON.stringify(pendingOrder))

    const res = await fetch("https://backend-master-production-cf50.up.railway.app/create-stripe-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: cart.value,
        email: customerEmail.value
      })
    })

    const data = await res.json()

    window.location.href = data.url

  } catch (e) {
    payError.value = e.message
    paying.value = false
  }
}

// SAVE ORDER (corrigé)
const saveOrder = async (orderData) => {
  if (!uid.value) return

  const order = {
    ...orderData,
    status: "paid",
    createdAt: new Date().toISOString()
  }

  await addDoc(collection(db, "users", uid.value, "orders"), order)
  await addDoc(collection(db, "orders"), order)

  // vider panier
  await updateDoc(userRef, { cartSession: [] })
}

// ✅ IMPORTANT (remplace export)
defineExpose({ saveOrder })

</script>
