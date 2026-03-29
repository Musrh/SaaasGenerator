<script setup>
import { ref, onMounted } from "vue"
import { db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"

const props = defineProps({
  uid: String
})

const site = ref(null)
const loading = ref(true)
const error = ref(false)

/* 🔥 LOAD FIRESTORE SITE */
const loadSite = async () => {
  try {

    if (!props.uid) {
      error.value = true
      loading.value = false
      return
    }

    // 🔥 COLLECTION CORRECTE : sites
    const snap = await getDoc(doc(db, "sites", props.uid))

    if (snap.exists()) {
      site.value = snap.data()
    } else {
      console.log("Site introuvable")
      error.value = true
    }

  } catch (e) {
    console.error("Firestore error:", e)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(loadSite)
</script>

<template>
  <div class="p-6">

    <!-- LOADING -->
    <div v-if="loading" class="text-center text-gray-500">
      Chargement du site...
    </div>

    <!-- ERROR -->
    <div v-else-if="error" class="text-red-500 text-center">
      Site introuvable ou erreur de chargement
    </div>

    <!-- SITE RENDER -->
    <div v-else>

      <!-- PLAN -->
      <h1 class="text-2xl font-bold mb-4">
        Plan: {{ site.plan }}
      </h1>

      <!-- SECTIONS -->
      <div v-if="site.sections && site.sections.length">

        <div
          v-for="(section, index) in site.sections"
          :key="index"
          class="mb-4"
        >

          <!-- TEXT -->
          <p v-if="section.type === 'text'" class="text-lg">
            {{ section.content }}
          </p>

          <!-- TITLE (bonus futur) -->
          <h2 v-else-if="section.type === 'title'" class="text-2xl font-bold">
            {{ section.content }}
          </h2>

          <!-- IMAGE (bonus futur) -->
          <img
            v-else-if="section.type === 'image'"
            :src="section.url"
            class="w-full rounded-lg"
          />

          <!-- BUTTON (bonus futur) -->
          <a
            v-else-if="section.type === 'button'"
            :href="section.link"
            class="inline-block bg-blue-500 text-white px-4 py-2 rounded"
          >
            {{ section.text }}
          </a>

        </div>

      </div>

      <!-- EMPTY STATE -->
      <div v-else class="text-gray-400 text-center">
        Aucune section disponible
      </div>

    </div>

  </div>
</template>
