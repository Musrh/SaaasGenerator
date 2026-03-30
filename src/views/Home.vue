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
const currentPageIndex = ref(0)
const activeSectionIndex = ref(null)

/* ================= SAFE PAGE ================= */
const currentPage = computed(() => {
  return site.value.pages[currentPageIndex.value] || {
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

/* ================= MENU / PAGES ================= */
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

/* ================= MENU SECTION (RESTORED) ================= */
const addMenuSection = () => {
  currentPage.value.sections.push({
    id: Date.now(),
    type: "menu",
    items: site.value.pages.map(p => p.name),
    style: {}
  })
}

/* ================= SECTIONS ================= */
const addSection = (type) => {
  const map = {
    hero: { type: "hero", title: "Hero", style: {} },
    text: { type: "text", content: "Texte...", style: {} },
    main: { type: "main", content: "Main...", style: {} },
    image: { type: "image", url: "" },
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

/* ================= STYLE BAR ================= */
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

<!-- 🔥 TOOLBAR ALWAYS VISIBLE (EDIT) -->
<div v-if="mode==='edit'" class="fixed top-0 w-full bg-white border-b p-2 z-50 flex justify-between">

  <!-- ADD SECTIONS -->
  <div class="flex gap-2">
    <button @click="addSection('hero')">Hero</button>
    <button @click="addSection('text')">Text</button>
    <button @click="addSection('main')">Main</button>
    <button @click="addSection('image')">Image</button>
    <button @click="addSection('footer')">Footer</button>

    <!-- 🔥 MENU SECTION RESTORED -->
    <button @click="addMenuSection" class="border px-2">Menu</button>
  </div>

  <!-- STYLE BAR RESTORED -->
  <div v-if="activeSectionIndex !== null" class="flex gap-2">
    <button @click="setStyle(currentPage.sections[activeSectionIndex],'bold')">B</button>
    <button @click="setStyle(currentPage.sections[activeSectionIndex],'italic')">I</button>
    <button @click="setStyle(currentPage.sections[activeSectionIndex],'underline')">U</button>

    <button @click="setAlign(currentPage.sections[activeSectionIndex],'left')">⬅</button>
    <button @click="setAlign(currentPage.sections[activeSectionIndex],'center')">⬌</button>
    <button @click="setAlign(currentPage.sections[activeSectionIndex],'right')">➡</button>

    <input type="color" @input="e => setColor(currentPage.sections[activeSectionIndex], e)" />
    <input type="color" @input="e => setBg(currentPage.sections[activeSectionIndex], e)" />
  </div>

  <!-- ACTIONS -->
  <div class="flex gap-2">
    <button @click="addPage" class="border px-2">+ Page</button>
    <button @click="saveSite" class="bg-green-600 text-white px-3">Save</button>
    <button @click="mode='preview'" class="bg-blue-600 text-white px-3">Preview</button>
  </div>

</div>

<div class="pt-20 p-4">

<p v-if="loading">Loading...</p>
<p v-if="error" class="text-red-500">{{ error }}</p>

<!-- 🔥 MENU PRINCIPAL (LINKED PAGES) -->
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

  <!-- pages editable (renommage = menu auto sync) -->
  <div class="mb-4">
    <div v-for="(p,i) in site.pages" :key="p.id" class="flex gap-2 mb-2">
      <input v-model="p.name" class="border px-2"/>
      <button @click="deletePage(i)" class="text-red-500">✕</button>
    </div>
  </div>

  <!-- sections -->
  <div
    v-for="(s,i) in currentPage.sections"
    :key="s.id"
    class="border p-3 mb-3 cursor-pointer"
    @click="activeSectionIndex=i"
    :style="s.style"
  >

    <button @click.stop="deleteSection(i)" class="text-red-500 float-right">✕</button>

    <div v-if="s.type==='menu'" class="flex gap-4">
      <span v-for="(m,mi) in site.pages" :key="mi">{{ m.name }}</span>
    </div>

    <input v-if="s.type==='hero'" v-model="s.title" class="border w-full"/>
    <input v-if="s.type==='text'" v-model="s.content" class="border w-full"/>
    <textarea v-if="s.type==='main'" v-model="s.content" class="w-full min-h-[300px] border"/>
    <input v-if="s.type==='footer'" v-model="s.text" class="border w-full"/>

    <div v-if="s.type==='image'">
      <input type="file" @change="uploadImage($event,s)" />
      <img v-if="s.url" :src="s.url"/>
    </div>

  </div>

</div>

<!-- 🔥 PREVIEW -->
<div v-else>

  <div v-for="s in currentPage.sections" :key="s.id" :style="s.style">

    <div v-if="s.type==='menu'" class="flex gap-4">
      <span v-for="(m,i) in site.pages" :key="i">{{ m.name }}</span>
    </div>

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
