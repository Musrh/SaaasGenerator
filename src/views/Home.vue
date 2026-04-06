<template>
  <div style="padding:20px">

    <h1>🛍 Gestion des produits</h1>

    <button @click="addProduct">➕ Ajouter produit</button>

    <hr><br>

    <div v-for="(product, index) in products" :key="product.id" style="margin-bottom:30px; border:1px solid #ddd; padding:15px">

      <!-- IMAGE -->
      <div>
        <img
          v-if="product.image"
          :src="product.image"
          style="width:120px; height:120px; object-fit:cover"
        />

        <input type="file" @change="onImageChange($event, index)" />

        <!-- CAMERA MOBILE -->
        <input type="file" accept="image/*" capture="environment" @change="onImageChange($event, index)" />
      </div>

      <!-- NOM -->
      <input v-model="product.name" placeholder="Nom du produit" />

      <!-- PRIX -->
      <input v-model.number="product.price" type="number" placeholder="Prix" />

      <!-- DESCRIPTION -->
      <textarea v-model="product.description" placeholder="Description"></textarea>

      <br><br>

      <button @click="saveProducts">💾 Sauvegarder</button>

      <button @click="removeProduct(index)" style="color:red">
        🗑 Supprimer
      </button>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"

const products = ref([])
let userRef = null

/* =========================================================
   🔐 AUTH + LOAD PRODUCTS
========================================================= */
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

/* =========================================================
   ➕ ADD PRODUCT
========================================================= */
function addProduct() {
  products.value.push({
    id: Date.now().toString(),
    name: "",
    price: 0,
    description: "",
    image: ""
  })
}

/* =========================================================
   🗑 REMOVE PRODUCT
========================================================= */
function removeProduct(index) {
  products.value.splice(index, 1)
}

/* =========================================================
   🖼 IMAGE UPLOAD (BASE64 SIMPLE)
========================================================= */
function onImageChange(e, index) {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()

  reader.onload = () => {
    products.value[index].image = reader.result
  }

  reader.readAsDataURL(file)
}

/* =========================================================
   💾 SAVE PRODUCTS
========================================================= */
async function saveProducts() {
  if (!userRef) return

  await setDoc(userRef, {
    products: products.value
  }, { merge: true })

  alert("Produits sauvegardés ✅")
}
</script>
