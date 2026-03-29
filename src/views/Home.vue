<script setup>
import { ref, watch } from "vue"
import { db } from "../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"

const props = defineProps({
  uid: String
})

const site = ref(null)
const loading = ref(false)
const error = ref(null)


// ===============================
// 🔥 LOAD USER SITE
// ===============================
const loadSite = async (uid) => {
  if (!uid) return

  loading.value = true
  error.value = null

  try {
    const cleanUid = decodeURIComponent(uid).trim()

    console.log("🔥 UID =", cleanUid)

    const refDoc = doc(db, "users", cleanUid)
    const snap = await getDoc(refDoc)

    console.log("🔥 EXISTS =", snap.exists())

    if (snap.exists()) {
      const data = snap.data()

      site.value = {
        plan: data.plan || "free",
        sections: Array.isArray(data.sections) ? data.sections : []
      }

    } else {
      site.value = null
      error.value = "Site introuvable"
    }

  } catch (e) {
    console.error(e)
    error.value = "Erreur chargement Firestore"
  }

  loading.value = false
}


// ===============================
// 🔥 ADD SECTION
// ===============================
const addSection = (type) => {
  if (!site.value) return

  if (type === "text") {
    site.value.sections.push({
      type: "text",
      content: "Nouveau texte"
    })
  }

  if (type === "hero") {
    site.value.sections.push({
      type: "hero",
      title: "Nouvelle section Hero"
    })
  }
}


// ===============================
// 🔥 SAVE SITE
// ===============================
const saveSite = async () => {
  if (!props.uid || !site.value) return

  try {
    const refDoc = doc(db, "users", props.uid)

    await updateDoc(refDoc, {
      sections: site.value.sections
    })

    console.log("🔥 Site sauvegardé")
  } catch (e) {
    console.error("🔥 SAVE ERROR:", e)
  }
}


// ===============================
// 🔥 WATCH UID
// ===============================
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

    <!-- TITLE -->
    <h1 class="text-xl font-bold">
      SaaasGenerator
    </h1>

    <!-- UID -->
    <p v-if="uid">
      UID client : {{ uid }}
    </p>

    <!-- LOADING -->
    <p v-if="loading">
      Chargement...
    </p>

    <!-- ERROR -->
    <p v-if="error" class="text-red-500">
      {{ error }}
    </p>

    <!-- SITE -->
    <div v-if="site">

      <p class="font-bold mt-2">
        Plan: {{ site.plan }}
      </p>

      <!-- SECTIONS -->
      <div v-if="site.sections.length">

        <div
          v-for="(section, i) in site.sections"
          :key="i"
          class="border p-3 mt-2 rounded"
        >

          <!-- TEXT -->
          <div v-if="section.type === 'text'">
            <input
              v-model="section.content"
              class="border p-2 w-full"
            />
          </div>

          <!-- HERO -->
          <div v-else-if="section.type === 'hero'">
            <input
              v-model="section.title"
              class="border p-2 w-full text-xl font-bold"
            />
          </div>

          <!-- DELETE -->
          <button
            class="text-red-500 mt-2"
            @click="site.sections.splice(i, 1)"
          >
            Supprimer
          </button>

        </div>

      </div>

      <p v-else class="text-gray-500">
        Aucune section
      </p>

      <!-- ACTIONS -->
      <div class="mt-4 flex gap-2">

        <button
          class="bg-black text-white px-3 py-1"
          @click="addSection('text')"
        >
          + Text
        </button>

        <button
          class="bg-gray-800 text-white px-3 py-1"
          @click="addSection('hero')"
        >
          + Hero
        </button>

        <button
          class="bg-green-600 text-white px-3 py-1"
          @click="saveSite"
        >
          Save
        </button>

      </div>

    </div>

  </div>
</template>
