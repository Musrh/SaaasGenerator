<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  collection, doc, getDoc, setDoc, addDoc,
  onSnapshot, deleteDoc, query, orderBy, serverTimestamp
} from "firebase/firestore"

const router = useRouter()

// STATE
const uid         = ref(null)
const products    = ref([])
const loading     = ref(true)
const searchQuery = ref("")
const cartCount   = ref(0)
const addedIds    = ref(new Set())

const showAddModal   = ref(false)
const saving         = ref(false)
const addError       = ref("")
const newProduct     = ref({ name: "", price: 0, description: "", badge: "", stock: undefined, image: "" })

const toast     = ref("")
const toastType = ref("success")

let unsubProducts = null
let unsubCart     = null

// AUTH
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    uid.value = user ? user.uid : null
    loadProducts()
    if (user) listenCart(user.uid)
  })
})

onUnmounted(() => {
  unsubProducts?.()
  unsubCart?.()
})

// LOAD PRODUCTS (REALTIME)
const loadProducts = () => {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"))

  unsubProducts = onSnapshot(q, (snap) => {
    products.value = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }))
    loading.value = false
  })
}

// CART BADGE
const listenCart = (userId) => {
  const userRef = doc(db, "users", userId)

  unsubCart = onSnapshot(userRef, (snap) => {
    const session = snap.data()?.cartSession || []
    cartCount.value = session.reduce((s, i) => s + (i.qty || 1), 0)
  })
}

// FILTER
const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return products.value

  const q = searchQuery.value.toLowerCase()

  return products.value.filter(p =>
    (p.name || "").toLowerCase().includes(q) ||
    (p.description || "").toLowerCase().includes(q) ||
    (p.badge || "").toLowerCase().includes(q)
  )
})

// IMAGE UPLOAD
const onFileUpload = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (ev) => {
    newProduct.value.image = ev.target.result
  }
  reader.readAsDataURL(file)
}

// SAVE PRODUCT
const saveProduct = async () => {

  addError.value = ""

  if (!newProduct.value.name.trim()) {
    addError.value = "Nom obligatoire"
    return
  }

  if (!newProduct.value.price || newProduct.value.price <= 0) {
    addError.value = "Prix invalide"
    return
  }

  if (!uid.value) {
    addError.value = "Connectez-vous"
    return
  }

  saving.value = true

  try {
    const data = {
      name: newProduct.value.name,
      price: Number(newProduct.value.price),
      description: newProduct.value.description,
      badge: newProduct.value.badge,
      stock: newProduct.value.stock,
      image: newProduct.value.image || "",
      createdBy: uid.value,
      createdAt: serverTimestamp()
    }

    const docRef = await addDoc(collection(db, "products"), data)

    // ⚡ AJOUT INSTANT UI
    products.value.unshift({
      id: docRef.id,
      ...data
    })

    showToast("Produit ajouté ✅")
    closeAddModal()

  } catch(e) {
    addError.value = e.message
  }

  saving.value = false
}

// DELETE
const deleteProduct = async (id) => {
  await deleteDoc(doc(db, "products", id))
}

// ADD TO CART
const addToCart = async (product) => {
  const user = auth.currentUser
  if (!user) return

  const userRef = doc(db, "users", user.uid)

  const snap = await getDoc(userRef)

  let cartSession = snap.exists() ? snap.data().cartSession || [] : []

  const idx = cartSession.findIndex(p => p.id === product.id)

  if (idx >= 0) {
    cartSession[idx].qty = 1
  } else {
    cartSession.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: 1
    })
  }

  await setDoc(userRef, { cartSession }, { merge: true })

  showToast("Ajouté au panier")
}

// NAV
const goToCart = () => router.push("/cart")

// MODAL
const closeAddModal = () => {
  showAddModal.value = false
  newProduct.value = { name: "", price: 0, description: "", badge: "", stock: undefined, image: "" }
}

// TOAST
const showToast = (msg) => {
  toast.value = msg
  setTimeout(() => toast.value = "", 2000)
}
</script>

<template>
<div class="home-root">

  <!-- TOPBAR -->
  <header class="topbar">
    <h1>🛍 Catalogue</h1>

    <div>
      <button @click="goToCart">
        🛒 {{ cartCount }}
      </button>

      <button @click="showAddModal = true">
        ＋ Produit
      </button>
    </div>
  </header>

  <!-- SEARCH -->
  <div class="search-bar">
    <input v-model="searchQuery" placeholder="🔍 Rechercher..." />

    <button v-if="searchQuery" @click="searchQuery = ''">
      ❌
    </button>
  </div>

  <!-- MESSAGE SI AUCUN RESULTAT -->
  <div v-if="searchQuery && filteredProducts.length === 0" class="empty-state">
    🔍 Aucun résultat pour "{{ searchQuery }}"
  </div>

  <!-- PRODUITS -->
  <div class="products-grid">

    <div
      v-for="product in (searchQuery ? filteredProducts : products)"
      :key="product.id"
      class="product-card"
    >

      <img v-if="product.image" :src="product.image" />

      <h3>{{ product.name }}</h3>
      <p>{{ product.price }} €</p>

      <button @click="addToCart(product)">
        🛒 Ajouter
      </button>

      <button v-if="uid" @click="deleteProduct(product.id)">
        🗑
      </button>

    </div>

  </div>

  <!-- MODAL -->
  <div v-if="showAddModal" class="modal">
    <input v-model="newProduct.name" placeholder="Nom" />
    <input v-model="newProduct.price" type="number" placeholder="Prix" />
    <textarea v-model="newProduct.description" placeholder="Description" />

    <input type="file" @change="onFileUpload" />

    <button @click="saveProduct">Ajouter</button>
    <button @click="closeAddModal">Annuler</button>
  </div>

  <!-- TOAST -->
  <div v-if="toast" class="toast">
    {{ toast }}
  </div>

</div>
</template>
