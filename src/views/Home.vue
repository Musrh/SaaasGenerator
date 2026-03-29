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

    const refDoc = doc(db, "users", cleanUid)
    const snap = await getDoc(refDoc)

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
// 🔥 ADD SECTION (ALL TYPES)
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
      title: "Hero Title"
    })
  }

  if (type === "menu") {
    site.value.sections.push({
      type: "menu",
      items: ["Home", "About", "Contact"]
    })
  }

  if (type === "main") {
    site.value.sections.push({
      type: "main",
      content: "Contenu principal..."
    })
  }

  if (type === "footer") {
    site.value.sections.push({
      type: "footer",
      text: "© 2026 My SaaS"
    })
  }

  if (type === "image") {
    site.value.sections.push({
      type: "image",
      url: "https://via.placeholder.com/800"
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
    console.error("SAVE ERROR:", e)
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

    <h1 class="text-xl font-bold">
      SaaasGenerator
    </h1>

    <p v-if="uid">
      UID client : {{ uid }}
    </p>

    <p v-if="loading">Chargement...</p>
    <p v-if="error" class="text-red-500">{{ error }}</p>


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
          class="border p-3 mt-3 rounded"
        >

          <!-- HERO -->
          <div v-if="section.type === 'hero'">
            <input
              v-model="section.title"
              class="border p-2 w-full text-xl font-bold"
              placeholder="Hero title"
            />
          </div>


          <!-- TEXT -->
          <div v-if="section.type === 'text'">
            <input
              v-model="section.content"
              class="border p-2 w-full"
              placeholder="Text content"
            />
          </div>


          <!-- MENU -->
          <div v-if="section.type === 'menu'">
            <div class="font-bold mb-2">Menu</div>

            <input
              v-for="(item, idx) in section.items"
              :key="idx"
              v-model="section.items[idx]"
              class="border p-1 m-1"
            />
          </div>


          <!-- MAIN SECTION (BIG EDITOR) -->
          <div v-if="section.type === 'main'">

            <div class="font-bold mb-2">Main Section</div>

            <textarea
              v-model="section.content"
              class="w-full min-h-[300px] max-h-[600px] p-5 border rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Écris ton contenu principal..."
            />

          </div>


          <!-- IMAGE -->
          <div v-if="section.type === 'image'">
            <input
              v-model="section.url"
              class="border p-2 w-full"
              placeholder="Image URL"
            />

            <img
              :src="section.url"
              class="mt-2 w-full max-w-md rounded"
            />
          </div>


          <!-- FOOTER -->
          <div v-if="section.type === 'footer'">
            <input
              v-model="section.text"
              class="border p-2 w-full"
              placeholder="Footer text"
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
      <div class="mt-5 flex flex-wrap gap-2">

        <button @click="addSection('hero')">+ Hero</button>
        <button @click="addSection('text')">+ Text</button>
        <button @click="addSection('menu')">+ Menu</button>
        <button @click="addSection('main')">+ Main</button>
        <button @click="addSection('image')">+ Image</button>
        <button @click="addSection('footer')">+ Footer</button>

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
