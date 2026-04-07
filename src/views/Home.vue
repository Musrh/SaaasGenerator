<template>
  <div class="products-page">

    <!-- HEADER -->
    <div class="header">
      <h2>📦 Produits</h2>

      <div class="actions">
        <!-- Recherche -->
        <input
          v-model="search"
          type="text"
          placeholder="Rechercher un produit..."
        />

        <!-- Bouton Ajouter -->
        <button @click="showAddModal = true">
          + Produit
        </button>
      </div>
    </div>

    <!-- LISTE PRODUITS -->
    <div v-if="filteredProducts.length" class="products-grid">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-card"
      >
        <img v-if="product.image" :src="product.image" />

        <h3>{{ product.name }}</h3>

        <!-- ✅ DESCRIPTION AJOUTÉE -->
        <p class="description">
          {{ product.description || "Pas de description" }}
        </p>

        <p class="price">{{ product.price }} €</p>
      </div>
    </div>

    <!-- AUCUN PRODUIT -->
    <p v-else>📦 Aucun produit trouvé</p>

    <!-- MODAL ADD PRODUCT -->
    <div v-if="showAddModal" class="modal">
      <div class="modal-content">

        <button class="close" @click="closeModal">✖</button>

        <!-- Appel du composant -->
        <AddProduct @product-added="onProductAdded" />

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import { db } from "../firebase"
import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore"

import AddProduct from "./AddProduct.vue"

// STATE
const products = ref([])
const search = ref("")
const showAddModal = ref(false)

// USER (à adapter si auth différente)
const uid = localStorage.getItem("uid")

// LOAD PRODUITS
const loadProducts = async () => {
  try {
    const q = query(
      collection(db, "products"),
      where("createdBy", "==", uid)
    )

    const snap = await getDocs(q)

    products.value = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

  } catch (err) {
    console.error("Erreur chargement produits:", err)
  }
}

// SEARCH + LISTE COMPLETE
const filteredProducts = computed(() => {
  if (!search.value) return products.value

  return products.value.filter(p =>
    p.name?.toLowerCase().includes(search.value.toLowerCase())
  )
})

// CALLBACK APRÈS AJOUT
const onProductAdded = () => {
  closeModal()
  loadProducts()
}

// CLOSE MODAL
const closeModal = () => {
  showAddModal.value = false
}

// INIT
onMounted(loadProducts)
</script>

<style scoped>
.products-page {
  padding: 20px;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  gap: 10px;
}

input {
  padding: 8px;
}

/* GRID */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

/* CARD */
.product-card {
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 10px;
  background: white;
}

.product-card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

/* DESCRIPTION */
.description {
  font-size: 14px;
  color: #555;
  margin: 5px 0;
}

/* PRICE */
.price {
  font-weight: bold;
}

/* MODAL */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.6);

  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 400px;
  position: relative;
}

.close {
  position: absolute;
  right: 10px;
  top: 10px;
  cursor: pointer;
}
</style>
