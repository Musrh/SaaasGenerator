
<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  collection, doc, getDoc, setDoc,
  onSnapshot, deleteDoc, query, orderBy
} from "firebase/firestore"

import AddProduct from "./AddProduct.vue" // ✅ IMPORT

const router = useRouter()

const uid         = ref(null)
const products    = ref([])
const loading     = ref(true)
const searchQuery = ref("")
const cartCount   = ref(0)

const showAddModal = ref(false) // ✅ MODAL

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

// LOAD PRODUCTS
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

// CART
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
    (p.description || "").toLowerCase().includes(q)
  )
})

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
}

// NAV
const goToCart = () => router.push("/cart")
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

      <!-- ✅ OUVERTURE MODAL -->
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

  <!-- MESSAGE RECHERCHE -->
  <div v-if="searchQuery && filteredProducts.length === 0">
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

  <!-- ✅ MODAL ADD PRODUCT -->
  <AddProduct
    v-if="showAddModal"
    @close="showAddModal = false"
  />

</div>
</template>
