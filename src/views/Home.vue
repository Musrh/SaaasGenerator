<template>
  <div class="container">

    <h1>🛍 Gestion des produits</h1>

    <button @click="addProduct">➕ Ajouter produit</button>

    <hr />

    <div
      v-for="(product, index) in products"
      :key="product.id"
      class="product-card"
    >

      <!-- IMAGE -->
      <img
        v-if="product.image"
        :src="product.image"
        class="product-image"
      />

      <!-- BOUTONS IMAGE -->
      <div class="image-buttons">
        <input type="file" @change="onUpload($event, index)" />
        <input type="file" accept="image/*" capture="environment" @change="onUpload($event, index)" />
      </div>

      <!-- NOM -->
      <input
        v-model="product.name"
        placeholder="Nom du produit"
        class="input"
      />

      <!-- PRIX -->
      <input
        v-model.number="product.price"
        type="number"
        placeholder="Prix du produit"
        class="input"
      />

      <!-- DESCRIPTION -->
      <textarea
        v-model="product.description"
        placeholder="Description du produit"
        class="input"
      ></textarea>

      <!-- ACTIONS -->
      <div class="actions">
        <button @click="saveProducts">💾 Sauvegarder</button>

        <button @click="removeProduct(index)" class="delete">
          🗑 Supprimer
        </button>
      </div>

    </div>

    <hr />

    <!-- BOUTON GLOBAL PAYER -->
    <button class="pay-btn">
      💳 Payer
    </button>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"

const products = ref([])
let userRef = null

/* =========================
   AUTH + LOAD
========================= */
onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return

    userRef = doc(db, "users", user.uid)

    const snap = await getDoc(userRef)

    if (snap.exists()) {
      products.value = snap.data().products || []
    }
  })
})

/* =========================
   ADD PRODUCT
========================= */
function addProduct() {
  products.value.push({
    id: Date.now().toString(),
    name: "",
    price: 0,
    description: "",
    image: ""
  })
}

/* =========================
   REMOVE
========================= */
function removeProduct(index) {
  products.value.splice(index, 1)
}

/* =========================
   IMAGE UPLOAD
========================= */
function onUpload(e, index) {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()

  reader.onload = () => {
    products.value[index].image = reader.result
  }

  reader.readAsDataURL(file)
}

/* =========================
   SAVE
========================= */
async function saveProducts() {
  if (!userRef) return

  await setDoc(userRef, {
    products: products.value
  }, { merge: true })

  alert("Produits sauvegardés ✅")
}
</script>

<style scoped>
.container {
  padding: 20px;
  max-width: 600px;
  margin: auto;
}

.product-card {
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 10px;
}

.product-image {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  margin-bottom: 10px;
}

.image-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.input {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
}

.actions {
  display: flex;
  justify-content: space-between;
}

.delete {
  background: red;
  color: white;
}

.pay-btn {
  width: 100%;
  padding: 15px;
  background: green;
  color: white;
  font-size: 18px;
}
</style>
