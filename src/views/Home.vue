<script setup>
import { ref, watch } from "vue"
import { db, storage } from "../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"

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

const mode = ref("edit")
const loading = ref(false)
const error = ref("")

// ======================
// LOAD SITE
// ======================
const loadSite = async (uid) => {
  if (!uid) return

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
  const map = {
    hero: { type: "hero", title: "Hero title" },
    text: { type: "text", content: "Texte..." },
    main: { type: "main", content: "Main section..." },
    menu: { type: "menu", items: ["Home", "About", "Contact"] },
    image: { type: "image", url: "", fit: "cover" },
    footer: { type: "footer", text: "Footer text" }
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
      plan: site.value.plan,
      sections: site.value.sections
    })

    alert("Saved ✔")
  } catch (e) {
    console.log(e)
    alert("Save error")
  }
}

// ======================
// IMAGE UPLOAD
// ======================
const uploadImage = async (event, section) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const path = `sites/${props.uid}/${Date.now()}-${file.name}`
    const fileRef = storageRef(storage, path)

    await uploadBytes(fileRef, file)
    const url = await getDownloadURL(fileRef)

    section.url = url
  } catch (e) {
    console.log(e)
    alert("Upload error")
  }
}
</script>

<template>
  <div class="p-4 overflow-x-hidden">

    <!-- HEADER -->
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">SaaS Builder</h1>

      <div class="flex gap-2">
        <button @click="mode='edit'" class="border px-3" :class="mode==='edit'?'bg-black text-white':''">
          Edit
        </button>

        <button @click="mode='preview'" class="border px-3" :class="mode==='preview'?'bg-black text-white':''">
          Preview
        </button>
      </div>
    </div>

    <!-- STATUS -->
    <p v-if="loading">Loading...</p>
    <p v-if="error" class="text-red-500">{{ error }}</p>

    <!-- PLAN -->
    <p class="mb-3 font-bold">
      Plan: {{ site.plan }}
    </p>

    <div v-if="site">

      <!-- ================= EDIT MODE ================= -->
      <div v-if="mode === 'edit'">

        <div
          v-for="(s,i) in site.sections"
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

          <!-- MAIN SECTION (FULL WIDTH FIX) -->
          <textarea v-if="s.type==='main'"
            v-model="s.content"
            class="w-screen h-[500px] border p-4 text-lg"
          />

          <!-- MENU -->
          <div v-if="s.type==='menu'">
            <input
              v-for="(m,idx) in (s.items || [])"
              :key="idx"
              v-model="s.items[idx]"
              class="border m-1 p-1"
            />
          </div>

          <!-- IMAGE UPLOAD -->
          <div v-if="s.type==='image'">

            <input type="file" @change="uploadImage($event, s)" />

            <select v-model="s.fit" class="border mt-2">
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>

            <img
              v-if="s.url"
              :src="s.url"
              class="w-screen h-[400px] mt-2"
              :style="{ objectFit: s.fit || 'cover' }"
            />

          </div>

          <!-- FOOTER -->
          <input v-if="s.type==='footer'"
            v-model="s.text"
            class="border p-2 w-full"
          />

          <!-- DELETE -->
          <button class="text-red-500 mt-2" @click="site.sections.splice(i,1)">
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

        <div v-for="(s,i) in site.sections" :key="i" class="mb-6">

          <h2 v-if="s.type==='hero'" class="text-3xl font-bold">
            {{ s.title }}
          </h2>

          <p v-if="s.type==='text'">
            {{ s.content }}
          </p>

          <div v-if="s.type==='main'" class="w-screen h-[500px] border p-4">
            {{ s.content }}
          </div>

          <div v-if="s.type==='menu'" class="flex gap-4">
            <span v-for="(m,i) in (s.items || [])" :key="i">
              {{ m }}
            </span>
          </div>

          <img
            v-if="s.type==='image' && s.url"
            :src="s.url"
            class="w-screen h-[400px] object-cover"
          />

          <footer v-if="s.type==='footer'" class="text-center">
            {{ s.text }}
          </footer>

        </div>

      </div>

    </div>

  </div>
</template>
