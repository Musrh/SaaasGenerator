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

  const cleanUid = uid.trim().replace(/\s/g, "")

  loading.value = true

  try {
    const snap = await getDoc(doc(db, "sites", cleanUid))

    if (snap.exists()) {
      const data = snap.data()

      console.log("🔥 RAW DATA =", data)

      site.value = {
        ...data,
        sections: Array.isArray(data.sections) ? data.sections : []
      }

      console.log("🔥 SECTIONS =", site.value.sections)

    } else {
      site.value = null
    }

  } catch (e) {
    console.error("Firestore error:", e)
  }

  loading.value = false
}

watch(
  () => props.uid,
  (v) => loadSite(v),
  { immediate: true }
)
</script>

<template>
  <div class="p-6">

    <h1 class="text-xl font-bold">SaaasGenerator</h1>

    <p class="text-gray-500 mb-4">
      UID: {{ props.uid }}
    </p>

    <div v-if="loading">Chargement...</div>

    <div v-else-if="site">

      <h2 class="font-bold">
        Plan: {{ site.plan }}
      </h2>

      <div v-if="site.sections.length">

        <div
          v-for="(s, i) in site.sections"
          :key="i"
          class="border p-2 mt-2"
        >
          <p v-if="s.type === 'text'">
            {{ s.content }}
          </p>
        </div>

      </div>

      <p v-else class="text-red-500">
        Aucune section disponible
      </p>

    </div>

    <div v-else class="text-red-500">
      Site introuvable
    </div>

  </div>
</template>
