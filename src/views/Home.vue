<script setup>
import { ref, watch } from "vue"
import { db } from "../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"

const props = defineProps({ uid: String })

/* STATE */
const site = ref({
  plan: "free",
  theme: {
    background: "#ffffff",
    text: "#111111"
  },
  sections: []
})

const mode = ref("edit")
const loading = ref(false)
const error = ref("")
const activeSectionIndex = ref(null)

/* LOAD */
const loadSite = async (uid) => {
  if (!uid) return

  loading.value = true

  try {
    const snap = await getDoc(doc(db, "users", uid))

    if (snap.exists()) {
      const data = snap.data()

      site.value = {
        plan: data.plan || "free",
        theme: data.theme || site.value.theme,
        sections: data.sections || []
      }
    } else {
      error.value = "Site introuvable"
    }

  } catch (e) {
    error.value = "Erreur Firestore"
  }

  loading.value = false
}

watch(() => props.uid, (v) => v && loadSite(v), { immediate: true })

/* ADD SECTION */
const addSection = (type) => {
  const map = {
    hero: { type: "hero", title: "Hero", style: {} },
    text: { type: "text", content: "Texte...", style: {} },
    main: { type: "main", content: "Main section...", style: {} },
    menu: { type: "menu", items: ["Home", "About"] },
    image: { type: "image", url: "" },
    gallery: { type: "gallery", images: [] },
    footer: { type: "footer", text: "Footer", style: {} }
  }

  site.value.sections.push({
    id: Date.now(),
    ...map[type]
  })
}

/* DELETE */
const deleteSection = (i) => {
  site.value.sections.splice(i, 1)
  activeSectionIndex.value = null
}

/* SAVE */
const saveSite = async () => {
  if (!props.uid) return

  await updateDoc(doc(db, "users", props.uid), {
    theme: site.value.theme,
    sections: site.value.sections
  })

  alert("Saved ✔")
}

/* UPLOAD (FileReader) */
const uploadImage = (e, section) => {
  const file = e.target.files[0]
  const reader = new FileReader()

  reader.onload = () => section.url = reader.result
  reader.readAsDataURL(file)
}

const uploadGallery = (e, section) => {
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader()
    reader.onload = () => section.images.push(reader.result)
    reader.readAsDataURL(file)
  })
}

/* STYLE */
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
    class="min-h-screen"
    :style="{
      backgroundColor: site.theme.background,
      color: site.theme.text
    }"
    @click.self="activeSectionIndex=null"
  >

    <!-- 🔥 TOP BAR -->
    <div
      v-if="mode==='edit'"
      class="fixed top-0 left-0 w-full bg-white border-b p-2 z-50 flex justify-between flex-wrap gap-2"
    >

      <!-- SECTIONS -->
      <div class="flex gap-2 flex-wrap">
        <button @click="addSection('hero')" class="border px-2">Hero</button>
        <button @click="addSection('text')" class="border px-2">Text</button>
        <button @click="addSection('main')" class="border px-2">Main</button>
        <button @click="addSection('menu')" class="border px-2">Menu</button>
        <button @click="addSection('image')" class="border px-2">Image</button>
        <button @click="addSection('gallery')" class="border px-2">Gallery</button>
        <button @click="addSection('footer')" class="border px-2">Footer</button>
      </div>

      <!-- FORMAT -->
      <div v-if="activeSectionIndex !== null" class="flex gap-2">
        <button @click="setStyle(site.sections[activeSectionIndex],'bold')" class="border px-2">B</button>
        <button @click="setStyle(site.sections[activeSectionIndex],'italic')" class="border px-2">I</button>
        <button @click="setStyle(site.sections[activeSectionIndex],'underline')" class="border px-2">U</button>

        <button @click="setAlign(site.sections[activeSectionIndex],'left')" class="border px-2">⬅</button>
        <button @click="setAlign(site.sections[activeSectionIndex],'center')" class="border px-2">⬌</button>
        <button @click="setAlign(site.sections[activeSectionIndex],'right')" class="border px-2">➡</button>

        <input type="color" @input="e => setColor(site.sections[activeSectionIndex], e)" />
        <input type="color" @input="e => setBg(site.sections[activeSectionIndex], e)" />
      </div>

      <!-- ACTIONS -->
      <div class="flex gap-2">
        <button @click="saveSite" class="bg-green-600 text-white px-3">Save</button>
        <button @click="mode='preview'" class="bg-blue-600 text-white px-3">Preview</button>
        <button @click="mode='edit'" class="border px-3">Edit</button>
      </div>

    </div>

    <!-- CONTENT -->
    <div class="pt-20 p-4">

      <p v-if="loading">Loading...</p>
      <p v-if="error" class="text-red-500">{{ error }}</p>

      <!-- EDIT -->
      <div v-if="mode==='edit'">

        <div
          v-for="(s,i) in site.sections"
          :key="s.id"
          class="border p-3 mb-3 cursor-pointer"
          :class="activeSectionIndex===i ? 'border-blue-500' : ''"
          @click.stop="activeSectionIndex=i"
          :style="s.style"
        >

          <button class="text-red-500 float-right" @click.stop="deleteSection(i)">✕</button>

          <input v-if="s.type==='hero'" v-model="s.title" class="border w-full"/>
          <input v-if="s.type==='text'" v-model="s.content" class="border w-full"/>

          <textarea
            v-if="s.type==='main'"
            v-model="s.content"
            class="w-full min-h-[500px] border"
          />

          <div v-if="s.type==='menu'">
            <input v-for="(m,i) in s.items" :key="i" v-model="s.items[i]" class="border m-1"/>
          </div>

          <div v-if="s.type==='image'">
            <input type="file" @change="uploadImage($event,s)" />
            <img v-if="s.url" :src="s.url" class="w-full"/>
          </div>

          <div v-if="s.type==='gallery'">
            <input type="file" multiple @change="uploadGallery($event,s)" />
          </div>

          <input v-if="s.type==='footer'" v-model="s.text" class="border w-full"/>

        </div>

      </div>

      <!-- PREVIEW -->
      <div v-else>

        <div v-for="s in site.sections" :key="s.id" :style="s.style" class="mb-6">

          <h2 v-if="s.type==='hero'">{{ s.title }}</h2>
          <p v-if="s.type==='text'">{{ s.content }}</p>

          <div v-if="s.type==='main'" class="min-h-[500px]">
            {{ s.content }}
          </div>

          <div v-if="s.type==='menu'" class="flex gap-4">
            <span v-for="(m,i) in s.items" :key="i">{{ m }}</span>
          </div>

          <img v-if="s.type==='image'" :src="s.url" class="w-full"/>

          <div v-if="s.type==='gallery'" class="grid grid-cols-3 gap-2">
            <img v-for="(img,i) in s.images" :key="i" :src="img"/>
          </div>

          <footer v-if="s.type==='footer'">{{ s.text }}</footer>

        </div>

      </div>

    </div>
  </div>
</template>
