<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">

      <h2>➕ Ajouter un produit</h2>

      <input v-model="product.name" placeholder="Nom du produit" />
      <input v-model.number="product.price" type="number" placeholder="Prix (€)" />
      <textarea v-model="product.description" placeholder="Description"></textarea>

      <!-- IMAGE -->
      <input type="file" @change="onFileUpload" />

      <img v-if="product.image" :src="product.image" class="preview" />

      <div class="actions">
        <button @click="save">💾 Ajouter</button>
        <button @click="$emit('close')">❌ Annuler</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { auth, db } from "../firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

const emit = defineEmits(["close"])

const product = ref({
  name: "",
  price: 0,
  description: "",
  image: ""
})

const onFileUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    product.value.image = reader.result
  }
  reader.readAsDataURL(file)
}

const save = async () => {
  const user = auth.currentUser

  if (!user) {
    alert("❌ Connectez-vous")
    return
  }

  if (!product.value.name || !product.value.price) {
    alert("Nom et prix obligatoires")
    return
  }

  await addDoc(collection(db, "products"), {
    ...product.value,
    createdBy: user.uid,
    createdAt: serverTimestamp()
  })

  emit("close")
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-box {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 320px;
}

input, textarea {
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
}

.preview {
  width: 100%;
  margin-bottom: 10px;
}

.actions {
  display: flex;
  justify-content: space-between;
}
</style>
