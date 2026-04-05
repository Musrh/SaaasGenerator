<script setup>
import { ref, computed } from "vue"
import { auth, db } from "../firebase"
import { addDoc, collection } from "firebase/firestore"

const product = ref({
  id: "p1",
  name: "Produit 1",
  price: 49.99,
  description: "Produit de test SaaS",
  image: "https://via.placeholder.com/300"
})

const qty = ref(1)

const total = computed(() => {
  return (product.value.price * qty.value).toFixed(2)
})

// ➜ Ajouter au panier Firestore
async function addToCart() {
  const user = auth.currentUser

  if (!user) {
    alert("Vous devez être connecté")
    return
  }

  await addDoc(collection(db, "users", user.uid, "cart"), {
    productId: product.value.id,
    name: product.value.name,
    price: product.value.price,
    qty: qty.value,
    total: product.value.price * qty.value
  })

  alert("Produit ajouté au panier ✅")
}
</script>

<template>
  <div style="max-width:600px;margin:auto;padding:20px">

    <h1>{{ product.name }}</h1>

    <img :src="product.image" style="width:100%;border-radius:10px" />

    <p>{{ product.description }}</p>

    <p><b>Prix:</b> {{ product.price }} €</p>

    <div style="margin:10px 0">
      <label>Quantité:</label>
      <input type="number" v-model="qty" min="1" />
    </div>

    <h3>Total: {{ total }} €</h3>

    <button @click="addToCart" style="padding:10px 20px">
      Ajouter au panier 🛒
    </button>

  </div>
</template>
