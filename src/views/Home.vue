<script setup>
import { ref, watch } from "vue"
import { db } from "../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"

const props = defineProps({ uid: String })

/* ================= STATE ================= */
const site = ref({
  plan: "free",
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
  ],
  menu: ["Home"]
})

const mode = ref("edit")
const loading = ref(false)
const error = ref("")
const activeSectionIndex = ref(null)
const currentPageIndex = ref(0)

/* ================= LOAD ================= */
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
        pages: data.pages?.length
          ? data.pages
          : [{ id: Date.now(), name: "Home", sections: [] }],
        menu: data.menu?.length ? data.menu : ["Home"]
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

/* ================= PAGES ================= */
const addPage = () => {
  const newName = "Page " + (site.value.pages.length + 1)

  site.value.pages.push({
    id: Date.now(),
    name: newName,
    sections: []
  })

  site.value.menu.push(newName)
}

const deletePage = (i) => {
  site.value.pages.splice(i, 1)
  site.value.menu.splice(i, 1)

  if (currentPageIndex.value >= site.value.pages.length) {
    currentPageIndex.value = 0
  }
}

/* ================= MENU NAV ================= */
const goToPage = (index) => {
  currentPageIndex.value = index
  activeSectionIndex.value = null
}

/* ================= SECTIONS ================= */
const addSection = (type) => {
  const map = {
    hero: { type: "hero", title: "Hero", style: {} },
    text: { type: "text", content: "Texte...", style: {} },
    main: { type: "main", content: "Main section...", style: {} },
    image: { type: "image", url: "" },
    gallery: { type: "gallery", images: [] },
    footer: { type: "footer", text: "Footer", style: {} }
  }

  site.value.pages[currentPageIndex.value].sections.push({
    id: Date.now(),
    ...map[type]
  })
}

const deleteSection = (i) => {
  site.value.pages[currentPageIndex.value].sections.splice(i, 1)
  activeSectionIndex.value = null
}

/* ================= SAVE ================= */
const saveSite = async () => {
  if (!props.uid) return

  await updateDoc(doc(db, "users", props.uid), {
    theme: site.value.theme,
    pages: site.value.pages,
    menu: site.value.menu
  })

  alert("Saved ✔")
}

/* ================= UPLOAD ================= */
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

/* ================= STYLE ================= */
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
>

<!-- 🔥 TOP BAR -->
<div v-if="mode==='edit'" class="fixed top-0 w-full bg-white p-2 flex justify-between z-50">

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
  </div>

</div>

<div class="pt-20 p-4">

<p v-if="loading">Loading...</p>
<p v-if="error" class="text-red-500">{{ error }}</p>

<!-- 🔥 MENU -->
<div class="flex gap-4 mb-6 border-b pb-2">

  <div
    v-for="(m,i) in site.menu"
    :key="i"
    @click="goToPage(i)"
    class="cursor-pointer px-2 py-1 border rounded"
    :class="currentPageIndex===i ? 'bg-black text-white' : ''"
  >
    {{ m }}
  </div>

</div>

<!-- 🔥 EDIT -->
<div v-if="mode==='edit'">

  <!-- pages edit -->
  <div class="mb-4">
    <div v-for="(p,i) in site.pages" :key="p.id" class="flex gap-2 mb-2">

      <input v-model="p.name" class="border px-2"/>

      <button @click="deletePage(i)" class="text-red-500">✕</button>
    </div>
  </div>

  <!-- sections -->
  <div
    v-for="(s,i) in site.pages[currentPageIndex].sections"
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
      <img v-if="s.url" :src="s.url" class="w-full"/>
    </div>

    <div v-if="s.type==='gallery'">
      <input type="file" multiple @change="uploadGallery($event,s)" />
    </div>

    <input v-if="s.type==='footer'" v-model="s.text" class="border w-full"/>

  </div>

</div>

<!-- 🔥 PREVIEW -->
<div v-else>

  <div v-for="s in site.pages[currentPageIndex].sections" :key="s.id" :style="s.style">

    <h2 v-if="s.type==='hero'">{{ s.title }}</h2>
    <p v-if="s.type==='text'">{{ s.content }}</p>

    <div v-if="s.type==='main'">{{ s.content }}</div>

    <img v-if="s.type==='image'" :src="s.url"/>

    <div v-if="s.type==='gallery'">
      <img v-for="(img,i) in s.images" :key="i" :src="img"/>
    </div>

    <footer v-if="s.type==='footer'">{{ s.text }}</footer>

  </div>

</div>

</div>
</div>
</template>
