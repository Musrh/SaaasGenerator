<script setup>
import { ref, watch, computed } from "vue"
import { db } from "../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"

const props = defineProps({ uid: String })

/* ================= STATE ================= */
const site = ref({
  theme: {
    background: "#ffffff",
    text: "#111111"
  },
  pages: [
    {
      id: Date.now(),
      name: "Home",
      sections: []
    }
  ]
})

const mode = ref("edit")
const loading = ref(false)
const error = ref("")
const activeSectionIndex = ref(null)
const currentPageIndex = ref(0)

/* ================= SAFE PAGE ================= */
const currentPage = computed(() => {
  return site.value.pages?.[currentPageIndex.value] || {
    name: "Home",
    sections: []
  }
})

/* ================= LOAD ================= */
const loadSite = async (uid) => {
  if (!uid) return

  loading.value = true

  try {
    const snap = await getDoc(doc(db, "users", uid))

    if (snap.exists()) {
      const data = snap.data()

      site.value = {
        theme: data.theme || site.value.theme,
        pages: data.pages?.length
          ? data.pages
          : [{ id: Date.now(), name: "Home", sections: [] }]
      }
    }

  } catch (e) {
    error.value = "Erreur Firestore"
  }

  loading.value = false
}

watch(() => props.uid, (v) => v && loadSite(v), { immediate: true })

/* ================= PAGES ================= */
const addPage = () => {
  const name = "Page " + (site.value.pages.length + 1)

  site.value.pages.push({
    id: Date.now(),
    name,
    sections: []
  })

  currentPageIndex.value = site.value.pages.length - 1
}

const deletePage = (i) => {
  site.value.pages.splice(i, 1)

  if (currentPageIndex.value >= site.value.pages.length) {
    currentPageIndex.value = 0
  }
}

const goToPage = (i) => {
  currentPageIndex.value = i
  activeSectionIndex.value = null
}

/* ================= SECTIONS ================= */
const addSection = (type) => {
  const map = {
    hero: { type: "hero", title: "Hero", style: {} },
    text: { type: "text", content: "Texte...", style: {} },
    main: { type: "main", content: "Main...", style: {} },
    image: { type: "image", url: "" },
    gallery: { type: "gallery", images: [] },
    footer: { type: "footer", text: "Footer", style: {} }
  }

  currentPage.value.sections.push({
    id: Date.now(),
    ...map[type]
  })
}

const deleteSection = (i) => {
  currentPage.value.sections.splice(i, 1)
  activeSectionIndex.value = null
}

/* ================= SAVE ================= */
const saveSite = async () => {
  if (!props.uid) return

  await updateDoc(doc(db, "users", props.uid), {
    theme: site.value.theme,
    pages: site.value.pages
  })

  alert("Saved ✔")
}

/* ================= STYLE (RESTORED SAFE) ================= */
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

/* ================= MEDIA ================= */
const uploadImage = (e, section) => {
  const file = e.target.files[0]
  const reader = new FileReader()
  reader.onload = () => section.url = reader.result
  reader.readAsDataURL(file)
}
</script>

<template>
<div class="min-h-screen" :style="{backgroundColor: site.theme.background, color: site.theme.text}">

<!-- 🔥 MODE EDIT FIXED (toujours visible) -->
<div class="fixed top-0 w-full bg-white border-b p-2 z-50 flex justify-between">

  <div class="flex gap-2">
    <button @click="addSection('hero')">Hero</button>
    <button @click="addSection('text')">Text</button>
    <button @click="addSection('main')">Main</button>
    <button @click="addSection('image')">Image</button>
    <button @click="addSection('gallery')">Gallery</button>
    <button @click="addSection('footer')">Footer</button>
  </div>

  <div class="flex gap-2">
    <button @click="addPage" class="border px-2">+ Page</button>
    <button @click="saveSite" class="bg-green-600 text-white px-3">Save</button>
    <button @click="mode='preview'" class="bg-blue-600 text-white px-3">Preview</button>
    <button @click="mode='edit'" class="border px-3">Edit</button>
  </div>

</div>

<div class="pt-20 p-4">

<p v-if="loading">Loading...</p>
<p v-if="error" class="text-red-500">{{ error }}</p>

<!-- 🔥 MENU STABLE -->
<div class="flex gap-3 mb-6 border-b pb-2">

  <div
    v-for="(p,i) in site.pages"
    :key="p.id"
    @click="goToPage(i)"
    class="cursor-pointer px-3 py-1 border rounded"
    :class="currentPageIndex===i ? 'bg-black text-white' : ''"
  >
    {{ p.name }}
  </div>

</div>

<!-- 🔥 EDIT -->
<div v-if="mode==='edit'">

  <!-- sections -->
  <div
    v-for="(s,i) in currentPage.sections"
    :key="s.id"
    class="border p-3 mb-3 cursor-pointer"
    @click="activeSectionIndex=i"
    :style="s.style"
  >

    <button @click.stop="deleteSection(i)" class="text-red-500 float-right">✕</button>

    <input v-if="s.type==='hero'" v-model="s.title" class="border w-full"/>
    <input v-if="s.type==='text'" v-model="s.content" class="border w-full"/>

    <textarea v-if="s.type==='main'" v-model="s.content" class="w-full min-h-[300px] border"/>

    <div v-if="s.type==='image'">
      <input type="file" @change="uploadImage($event,s)" />
      <img v-if="s.url" :src="s.url"/>
    </div>

    <input v-if="s.type==='footer'" v-model="s.text" class="border w-full"/>

  </div>

</div>

<!-- 🔥 PREVIEW -->
<div v-else>

  <div v-for="s in currentPage.sections" :key="s.id" :style="s.style">

    <h2 v-if="s.type==='hero'">{{ s.title }}</h2>
    <p v-if="s.type==='text'">{{ s.content }}</p>

    <div v-if="s.type==='main'">{{ s.content }}</div>

    <img v-if="s.type==='image'" :src="s.url"/>

    <footer v-if="s.type==='footer'">{{ s.text }}</footer>

  </div>

</div>

</div>
</div>
</template>
