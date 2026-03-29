<script setup>
import { ref, watch } from "vue"
import { db } from "../firebase"
import { collection, query, where, getDocs } from "firebase/firestore"

const props = defineProps({
  uid: String
})

const site = ref(null)
const loading = ref(false)

const loadSite = async (uid) => {
  if (!uid) return

  loading.value = true

  try {
    // 🔥 QUERY PAR userId
    const q = query(
      collection(db, "sites"),
      where("userId", "==", uid)
    )

    const snap = await getDocs(q)

    if (!snap.empty) {
      const data = snap.docs[0].data()

      site.value = {
        ...data,
        sections: Array.isArray(data.sections) ? data.sections : []
      }

      console.log("🔥 SITE CHARGÉ =", site.value)
    } else {
      site.value = null
      console.log("❌ Aucun site trouvé pour userId =", uid)
    }

  } catch (e) {
    console.error("Firestore error:", e)
  }

  loading.value = false
}

// 🔥 reactive au changement de uid
watch(
  () => props.uid,
  (v) => loadSite(v),
  { immediate: true }
)
</script>

<template>
  <div class="p-6">

    <h1 class="text-xl font-bold mb-4">
      SaaasGenerator
    </h1>

    <p class="text-gray-500 mb-4">
      UID client : {{ props.uid }}
    </p>

    <div v-if="loading">
      Chargement...
    </div>

    <div v-else-if="site">

      <h2 class="font-bold text-lg mb-2">
        Plan: {{ site.plan }}
      </h2>

      <!-- SECTIONS -->
      <div v-if="site.sections.length">

        <div
          v-for="(section, index) in site.sections"
          :key="index"
          class="border p-2 mb-2"
        >

          <!-- HERO -->
          <div v-if="section.type === 'hero'">
            <h2 class="text-2xl font-bold">
              {{ section.title }}
            </h2>
          </div>

          <!-- TEXT -->
          <div v-else-if="section.type === 'text'">
            <p>
              {{ section.content }}
            </p>
          </div>

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
