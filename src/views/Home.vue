<script setup>
import { ref, watch } from "vue"
import { db } from "../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"

const props = defineProps({
  uid: String
})

/* ======================
   STATE
====================== */
const site = ref({
  plan: "free",
  theme: {
    primary: "#000000",
    background: "#ffffff",
    text: "#111111"
  },
  sections: []
})

const mode = ref("edit")
const loading = ref(false)
const error = ref("")

/* ======================
   LOAD SITE
====================== */
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
        theme: data.theme || {
          primary: "#000000",
          background: "#ffffff",
          text: "#111111"
        },
        sections: Array.isArray(data.sections) ? data.sections : []
      }
    } else {
      error.value = "Site introuvable"
    }

  } catch (e) {
    console.log(e)
    error.value = "Erreur Firestore"
  }

  loading.value = false
}

watch(
  () => props.uid,
  (v) => {
    if (v) loadSite(v)
  },
  { immediate: true }
)

/* ======================
   ADD SECTION
====================== */
const addSection = (type) => {
  const map = {
    hero: { type: "hero", title: "Hero title", style: {} },
    text: { type: "text", content: "Texte...", style: {} },
    main: { type: "main", content: "Main section...", style: {} },
    menu: { type: "menu", items: ["Home", "About", "Contact"] },
    image: { type: "image", url: "" },
    footer: { type: "footer", text: "Footer text", style: {} },
    banner: { type: "banner", text: "Banner text", style: {} },
    features: { type: "features", items: ["Feature 1", "Feature 2"] },
    gallery: { type: "gallery", images: [] },
    video: { type: "video", url: "" }
  }

  site.value.sections.push({
    id: Date.now(),
    ...map[type]
  })
}

/* ======================
   DELETE SECTION
====================== */
const deleteSection = (i) => {
  site.value.sections.splice(i, 1)
}

/* ======================
   SAVE SITE
====================== */
const saveSite = async () => {
  if (!props.uid) return

  try {
    await updateDoc(doc(db, "users", props.uid), {
      plan: site.value.plan,
      theme: site.value.theme,
      sections: site.value.sections
    })

    alert("Saved ✔")
  } catch (e) {
    console.log(e)
    alert("Save error")
  }
}

/* ======================
   IMAGE UPLOAD (BASE64)
====================== */
const uploadImage = (event, section) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()

  reader.onload = () => {
    section.url = reader.result
  }

  reader.readAsDataURL(file)
}

/* ======================
   GALLERY UPLOAD
====================== */
const uploadGallery = (e, section) => {
  const files = Array.from(e.target.files)

  files.forEach(file => {
    const reader = new FileReader()

    reader.onload = () => {
      section.images.push(reader.result)
    }

    reader.readAsDataURL(file)
  })
}

/* ======================
   STYLE EDITOR
====================== */
const setStyle = (section, type) => {
  section.style = section.style || {}

  if (type === "bold") {
    section.style.fontWeight =
      section.style.fontWeight === "bold" ? "normal" : "bold"
  }

  if (type === "italic") {
    section.style.fontStyle =
      section.style.fontStyle === "italic" ? "normal" : "italic"
  }

  if (type === "underline") {
    section.style.textDecoration =
      section.style.textDecoration === "underline" ? "none" : "underline"
  }
}

const setAlign = (section, value) => {
  section.style = section.style || {}
  section.style.textAlign = value
}

const setColor = (section, e) => {
  section.style = section.style || {}
  section.style.color = e.target.value
}

const setBg = (section, e) => {
  section.style = section.style || {}
  section.style.backgroundColor = e.target.value
}
</script>

<template>
  <div
    class="p-4 min-h-screen"
    :style="{
      backgroundColor: site.theme.background,
      color: site.theme.text
    }"
  >

    <!-- HEADER -->
    <div class="flex justify-between mb-4">
      <h1 class="font-bold text-xl">SaaS Builder</h1>

      <div class="flex gap-2">
        <button @click="mode='edit'" :class="mode==='edit'?'bg-black text-white':'border'" class="px-3">
          Edit
        </button>

        <button @click="mode='preview'" :class="mode==='preview'?'bg-black text-white':'border'" class="px-3">
          Preview
        </button>
      </div>
    </div>

    <p v-if="loading">Loading...</p>
    <p v-if="error" class="text-red-500">{{ error }}</p>

    <p class="font-bold mb-3">Plan: {{ site.plan }}</p>

    <!-- ================= THEME ================= -->
    <div v-if="mode==='edit'" class="border p-2 mb-4">

      <h3 class="font-bold">🎨 Theme</h3>

      <input type="color" v-model="site.theme.primary" />
      <input type="color" v-model="site.theme.background" />
      <input type="color" v-model="site.theme.text" />

    </div>

    <!-- ================= EDIT MODE ================= -->
    <div v-if="mode==='edit'">

      <div
        v-for="(s,i) in site.sections"
        :key="s.id"
        class="border p-3 mb-3 relative"
        :style="s.style"
      >

        <button
          class="absolute top-1 right-1 text-red-500"
          @click="deleteSection(i)"
        >
          ✕
        </button>

        <!-- TOOLBAR -->
        <div class="flex gap-2 mb-2 flex-wrap text-xs" v-if="s.type!=='image'">

          <button @click="setStyle(s,'bold')" class="border px-2">B</button>
          <button @click="setStyle(s,'italic')" class="border px-2">I</button>
          <button @click="setStyle(s,'underline')" class="border px-2">U</button>

          <button @click="setAlign(s,'left')" class="border px-2">⬅</button>
          <button @click="setAlign(s,'center')" class="border px-2">⬌</button>
          <button @click="setAlign(s,'right')" class="border px-2">➡</button>

          <input type="color" @input="e=>setColor(s,e)" />
          <input type="color" @input="e=>setBg(s,e)" />

        </div>

        <!-- HERO -->
        <input v-if="s.type==='hero'" v-model="s.title" class="border p-2 w-full text-xl"/>

        <!-- TEXT -->
        <input v-if="s.type==='text'" v-model="s.content" class="border p-2 w-full"/>

        <!-- MAIN -->
        <textarea v-if="s.type==='main'" v-model="s.content" class="w-full h-[500px] border p-4"/>

        <!-- MENU -->
        <div v-if="s.type==='menu'">
          <input v-for="(m,i) in s.items" :key="i" v-model="s.items[i]" class="border m-1 p-1"/>
        </div>

        <!-- IMAGE -->
        <div v-if="s.type==='image'">
          <input type="file" @change="uploadImage($event,s)"/>
          <img v-if="s.url" :src="s.url" class="w-full mt-2"/>
        </div>

        <!-- GALLERY -->
        <div v-if="s.type==='gallery'">
          <input type="file" multiple @change="uploadGallery($event,s)"/>
        </div>

        <!-- FEATURES -->
        <div v-if="s.type==='features'">
          <input v-for="(f,i) in s.items" :key="i" v-model="s.items[i]" class="border m-1 p-1"/>
        </div>

        <!-- VIDEO -->
        <input v-if="s.type==='video'" v-model="s.url" class="border p-2 w-full"/>

        <!-- FOOTER -->
        <input v-if="s.type==='footer'" v-model="s.text" class="border p-2 w-full"/>

      </div>

      <!-- ACTIONS -->
      <div class="flex flex-wrap gap-2 mt-4">

        <button @click="addSection('hero')" class="border px-2">Hero</button>
        <button @click="addSection('text')" class="border px-2">Text</button>
        <button @click="addSection('main')" class="border px-2">Main</button>
        <button @click="addSection('menu')" class="border px-2">Menu</button>
        <button @click="addSection('image')" class="border px-2">Image</button>
        <button @click="addSection('footer')" class="border px-2">Footer</button>
        <button @click="addSection('banner')" class="border px-2">Banner</button>
        <button @click="addSection('features')" class="border px-2">Features</button>
        <button @click="addSection('gallery')" class="border px-2">Gallery</button>
        <button @click="addSection('video')" class="border px-2">Video</button>

        <button @click="saveSite" class="bg-green-600 text-white px-3">
          Save
        </button>

      </div>

    </div>

    <!-- ================= PREVIEW ================= -->
    <div v-else>

      <div v-for="s in site.sections" :key="s.id" class="mb-6" :style="s.style">

        <h2 v-if="s.type==='hero'" class="text-3xl font-bold">{{ s.title }}</h2>

        <p v-if="s.type==='text'">{{ s.content }}</p>

        <div v-if="s.type==='main'" class="h-[500px] border p-4">
          {{ s.content }}
        </div>

        <div v-if="s.type==='menu'" class="flex gap-4">
          <span v-for="(m,i) in s.items" :key="i">{{ m }}</span>
        </div>

        <img v-if="s.type==='image'" :src="s.url" class="w-full"/>

        <div v-if="s.type==='gallery'" class="grid grid-cols-3 gap-2">
          <img v-for="(img,i) in s.images" :key="i" :src="img"/>
        </div>

        <div v-if="s.type==='features'">
          <div v-for="(f,i) in s.items" :key="i">{{ f }}</div>
        </div>

        <iframe v-if="s.type==='video'" :src="s.url" class="w-full h-64"/>

        <footer v-if="s.type==='footer'" class="text-center">
          {{ s.text }}
        </footer>

      </div>

    </div>

  </div>
</template>
