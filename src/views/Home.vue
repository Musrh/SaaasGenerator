<script setup>
import { ref, watch } from "vue"
import { db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"

const props = defineProps({
  uid: String
})

const site = ref(null)
const loading = ref(false)

const loadSite = async (uid) => {
  if (!uid) return

  loading.value = true

  try {
    const cleanUid = uid.trim()

    console.log("🔥 UID:", cleanUid)

    const refDoc = doc(db, "users", cleanUid)
    const snap = await getDoc(refDoc)

    if (snap.exists()) {
      const data = snap.data()

      console.log("🔥 DATA FOUND:", data)

      site.value = {
        plan: data.plan || "free",
        sections: Array.isArray(data.sections) ? data.sections : []
      }
    } else {
      console.log("❌ DOC NOT FOUND")
      site.value = null
    }

  } catch (e) {
    console.error("🔥 ERROR:", e)
    site.value = null
  }

  loading.value = false
}

watch(() => props.uid, (newUid) => {
  loadSite(newUid)
}, { immediate: true })
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

    <div v-else-if="site">
      <p>Plan: {{ site.plan }}</p>

      <div v-if="site.sections.length">
        <div
          v-for="(section, i) in site.sections"
          :key="i"
          class="p-4 border mt-2"
        >
          <div v-if="section.type === 'text'">
            {{ section.content }}
          </div>

          <div v-else-if="section.type === 'hero'">
            <h2 class="text-2xl font-bold">
              {{ section.title }}
            </h2>
          </div>
        </div>
      </div>

      <p v-else>Aucune section</p>
    </div>

    <p v-else class="text-red-500">
      Site introuvable
    </p>

  </div>
</template>
