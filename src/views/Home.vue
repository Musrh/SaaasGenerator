<script setup>
import { ref, watch } from "vue"
import { db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"

const props = defineProps({
  uid: String
})

const site = ref(null)
const loading = ref(false)
const error = ref(null)

const loadSite = async (uid) => {
  if (!uid) {
    error.value = "UID manquant"
    return
  }

  loading.value = true
  error.value = null

  try {
    const cleanUid = decodeURIComponent(uid).trim()

    console.log("🔥 CLEAN UID =", cleanUid)

    const docRef = doc(db, "users", cleanUid)
    const snap = await getDoc(docRef)

    console.log("🔥 EXISTS =", snap.exists())

    if (snap.exists()) {
      const data = snap.data()

      console.log("🔥 DATA =", data)

      site.value = {
        plan: data.plan || "free",
        sections: Array.isArray(data.sections) ? data.sections : []
      }
    } else {
      site.value = null
      error.value = "Site introuvable"
    }

  } catch (e) {
    console.error("🔥 FIRESTORE ERROR:", e)
    error.value = "Erreur chargement Firestore"
    site.value = null
  }

  loading.value = false
}

watch(
  () => props.uid,
  (newUid) => {
    loadSite(newUid)
  },
  { immediate: true }
)
</script>

<template>
  <div class="p-6">

    <h1 class="text-xl font-bold">
      SaaasGenerator
    </h1>

    <p v-if="uid">
      UID client : {{ uid }}
    </p>

    <p v-if="loading">
      Chargement...
    </p>

    <p v-if="error" class="text-red-500">
      {{ error }}
    </p>

    <div v-if="site">

      <p class="font-bold mt-2">
        Plan: {{ site.plan }}
      </p>

      <div v-if="site.sections.length">

        <div
          v-for="(section, i) in site.sections"
          :key="i"
          class="border p-3 mt-2 rounded"
        >

          <div v-if="section.type === 'text'">
            {{ section.content }}
          </div>

          <div v-else-if="section.type === 'hero'">
            <h2 class="text-2xl font-bold">
              {{ section.title }}
            </h2>
          </div>

          <div v-else>
            {{ section }}
          </div>

        </div>

      </div>

      <p v-else class="text-gray-500">
        Aucune section
      </p>

    </div>

  </div>
</template>
