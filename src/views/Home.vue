<script setup>
import { ref, watch } from "vue"
import { db } from "../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"

const props = defineProps({
  uid: String
})

// ======================
// STATE SAFE
// ======================
const site = ref({
  plan: "free",
  sections: []
})

const loading = ref(false)
const error = ref("")
const mode = ref("edit")

// ======================
// LOAD SITE SAFE
// ======================
const loadSite = async (uid) => {
  if (!uid) {
    error.value = "UID manquant"
    return
  }

  loading.value = true
  error.value = ""

  try {
    const snap = await getDoc(doc(db, "users", uid))

    if (snap.exists()) {
      const data = snap.data()

      site.value = {
        plan: data.plan || "free",
        sections: Array.isArray(data.sections) ? data.sections : []
      }
    } else {
      site.value = { plan: "free", sections: [] }
      error.value = "Site introuvable"
    }

  } catch (e) {
    console.log(e)
    error.value = "Erreur Firestore"
  }

  loading.value = false
}

// ======================
// WATCH UID
// ======================
watch(
  () => props.uid,
  (v) => {
    if (v) loadSite(v)
  },
  { immediate: true }
)

// ======================
// ADD SECTION
// ======================
const addSection = (type) => {
  if (!site.value.sections) site.value.sections = []

  const map = {
    hero: { type: "hero", title: "Hero title" },
    text: { type: "text", content: "Texte..." },
    main: { type: "main", content: "Main section..." },
    menu: { type: "menu", items: ["Home", "About", "Contact"] },
    image: { type: "image", url: "https://via.placeholder.com/800" },
    footer: { type: "footer", text: "Footer content" }
  }

  site.value.sections.push(map[type])
}

// ======================
// SAVE SITE
// ======================
const saveSite = async () => {
  if (!props.uid) return

  try {
    await updateDoc(doc(db, "users", props.uid), {
      sections: site.value.sections
    })

    alert("Saved ✔")
  } catch (e) {
    console.log(e)
    alert("Save error")
  }
}
</script>

<template>
  <div class="p-4">

    <!-- HEADER -->
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">SaaS Generator</h1>

      <div class="flex gap-2">
        <button @click="mode='edit'" :class="mode==='edit'?'bg-black text-white':''" class="px-3 border">
          Edit
        </button>

        <button @click="mode='preview'" :class="mode==='preview'?'bg-black text-white':''" class="px-3 border">
          Preview
        </button>
      </div>
    </div>

    <!-- STATUS -->
    <p v-if="loading">Loading...</p>
    <p v-if="error" class="text-red-500">{{ error }}</p>

    <!-- SITE -->
    <div v-if="site">

      <p class="mb-2 font-bold">Plan: {{ site.plan }}</p>

      <!-- ================= EDIT MODE ================= -->
      <div v-if="mode === 'edit'">

        <div
          v-for="(s, i) in site.sections"
          :key="i"
          class="border p-3 mt-3"
        >

          <!-- HERO -->
          <input v-if="s.type==='hero'"
            v-model="s.title"
            class="border p-2 w-full text-xl"
          />

          <!-- TEXT -->
          <input v-if="s.type==='text'"
            v-model="s.content"
            class="border p-2 w-full"
          />

          <!-- MAIN (BIG AREA 700px + FULL WIDTH) -->
          <textarea v-if="s.type==='main'"
            v-model="s.content"
            class="w-screen h-[700px] p-4 border text-lg"
          />

          <!-- MENU -->
          <div v-if="s.type==='menu'">
            <input
              v-for="(m, idx) in s.items"
              :key="idx"
              v-model="s.items[idx]"
              class="border m-1 p-1"
            />
          </div>

          <!-- IMAGE -->
          <input v-if="s.type==='image'"
            v-model="s.url"
            class="border p-2 w-full"
          />

          <!-- FOOTER -->
          <input v-if="s.type==='footer'"
            v-model="s.text"
            class="border p-2 w-full"
          />

          <!-- DELETE -->
          <button
            class="text-red-500 mt-2"
            @click="site.sections.splice(i,1)"
          >
            Supprimer
          </button>

        </div>

        <!-- ACTIONS -->
        <div class="mt-4 flex flex-wrap gap-2">

          <button @click="addSection('hero')" class="border px-2">Hero</button>
          <button @click="addSection('text')" class="border px-2">Text</button>
          <button @click="addSection('main')" class="border px-2">Main</button>
          <button @click="addSection('menu')" class="border px-2">Menu</button>
          <button @click="addSection('image')" class="border px-2">Image</button>
          <button @click="addSection('footer')" class="border px-2">Footer</button>

          <button
            @click="saveSite"
            class="bg-green-600 text-white px-3"
          >
            Save
          </button>

        </div>

      </div>

      <!-- ================= PREVIEW MODE ================= -->
      <div v-else>

        <div v-for="(s, i) in site.sections" :key="i" class="mb-6">

          <h2 v-if="s.type==='hero'" class="text-3xl font-bold">
            {{ s.title }}
          </h2>

          <p v-if="s.type==='text'">
            {{ s.content }}
          </p>

          <div v-if="s.type==='main'" class="w-full h-[700px] border p-4">
            {{ s.content }}
          </div>

          <div v-if="s.type==='menu'" class="flex gap-4">
            <span v-for="(m,i) in s.items" :key="i">
              {{ m }}
            </span>
          </div>

          <img v-if="s.type==='image'" :src="s.url" class="w-full" />

          <footer v-if="s.type==='footer'" class="text-center">
            {{ s.text }}
          </footer>

        </div>

      </div>

    </div>

  </div>
</template>
