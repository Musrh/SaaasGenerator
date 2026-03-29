<script setup>
import { ref, onMounted } from "vue"
import { db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"

const props = defineProps({
  uid: String
})

const userData = ref(null)
const loading = ref(true)

const loadSite = async () => {
  try {
    const snap = await getDoc(doc(db, "users", props.uid))

    if (snap.exists()) {
      userData.value = snap.data()
    }

  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadSite)
</script>

<template>
  <div class="p-6">

    <div v-if="loading">
      Chargement...
    </div>

    <div v-else-if="!userData">
      Site introuvable
    </div>

    <div v-else>

      <h2 class="text-xl font-bold mb-4">
        Plan: {{ userData.plan }}
      </h2>

      <div v-for="(section, i) in userData.sections" :key="i" class="mb-3">

        <p v-if="section.type === 'text'">
          {{ section.content }}
        </p>

      </div>

    </div>

  </div>
</template>
