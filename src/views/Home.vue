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
  sections: []
})

const mode = ref("edit")
const loading = ref(false)
const error = ref("")
const activeSectionIndex = ref(null)

/* ================= LOAD ================= */
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
        theme: data.theme || site.value.theme,
        sections: Array.isArray(data.sections) ? data.sections : []
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

/* ================= ADD ================= */
const addSection = (type) => {
  const map = {
    hero: { type: "hero", title: "Hero title", style: {}, class: "" },
    text: { type: "text", content: "Texte...\nNouvelle ligne", style: {}, class: "" },
    main: { type: "main", content: "Main section...\nNouvelle ligne", style: {}, class: "" },
    menu: { type: "menu", items: ["Home", "About"] },
    image: { type: "image", url: "" },
    gallery: { type: "gallery", images: [] },
    footer: { type: "footer", text: "Footer text", style: {}, class: "" }
  }

  site.value.sections.push({
    id: Date.now(),
    ...map[type]
  })
}

/* ================= DELETE ================= */
const deleteSection = (i) => {
  site.value.sections.splice(i, 1)
  activeSectionIndex.value = null
}

/* ================= SAVE ================= */
const saveSite = async () => {
  if (!props.uid) return

  await updateDoc(doc(db, "users", props.uid), {
    plan: site.value.plan,
    theme: site.value.theme,
    sections: site.value.sections
  })

  alert("Saved ✔")
}

/* ================= IMAGE ================= */
const uploadImage = (e, section) => {
  const file = e.target.files[0]
  if (!file) return

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

  if (type === "bold")
    section.style.fontWeight = section.style.fontWeight === "bold" ? "normal" : "bold"

  if (type === "italic")
    section.style.fontStyle = section.style.fontStyle === "italic" ? "normal" : "italic"

  if (type === "underline")
    section.style.textDecoration = section.style.textDecoration === "underline" ? "none" : "underline"
}

const setAlign = (section, val) => {
  section.style.textAlign = val
}

const setColor = (section, e) => {
  section.style.color = e.target.value
}

const setBg = (section, e) => {
  section.style.backgroundColor = e.target.value
}

/* ================= VIEW CODE ================= */
const viewCode = () => {
  if (activeSectionIndex.value === null) return

  const s = site.value.sections[activeSectionIndex.value]

  const code = `
<div class="${s.class || ""}" style='${JSON.stringify(s.style)}'>
${s.content || s.title || ""}
</div>
  `

  const sectionName = `section-${s.type}`

  const win = window.open("", "_blank")

  win.document.write(`
    <title>${sectionName}</title>
    <h2>${sectionName}</h2>
    <pre>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
  `)

  win.document.close()
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

    <!-- TOP BAR -->
    <div class="fixed top-0 left-0 w-full bg-white border-b p-2 z-50 flex flex-wrap gap-2 justify-between">

      <!-- ADD -->
      <div class="flex gap-2 flex-wrap">
        <button @click="addSection('hero')" class="border px-2">Hero</button>
        <button @click="addSection('text')" class="border px-2">Text</button>
        <button @click="addSection('main')" class="border px-2">Main</button>
        <button @click="addSection('menu')" class="border px-2">Menu</button>
        <button @click="addSection('image')" class="border px-2">Image</button>
        <button @click="addSection('gallery')" class="border px-2">Gallery</button>
        <button @click="addSection('footer')" class="border px-2">Footer</button>
      </div>

      <!-- STYLE -->
      <div v-if="activeSectionIndex !== null" class="flex gap-2 flex-wrap">
        <button @click="setStyle(site.sections[activeSectionIndex],'bold')" class="border px-2">B</button>
        <button @click="setStyle(site.sections[activeSectionIndex],'italic')" class="border px-2">I</button>
        <button @click="setStyle(site.sections[activeSectionIndex],'underline')" class="border px-2">U</button>

        <button @click="setAlign(site.sections[activeSectionIndex],'left')" class="border px-2">⬅</button>
        <button @click="setAlign(site.sections[activeSectionIndex],'center')" class="border px-2">⬌</button>
        <button @click="setAlign(site.sections[activeSectionIndex],'right')" class="border px-2">➡</button>

        <input type="color" @input="e => setColor(site.sections[activeSectionIndex], e)" />
        <input type="color" @input="e => setBg(site.sections[activeSectionIndex], e)" />

        <input
          v-model="site.sections[activeSectionIndex].class"
          placeholder="Tailwind classes"
          class="border px-2"
        />

        <button @click="viewCode" class="bg-black text-white px-2">
          Code
        </button>
      </div>

      <!-- ACTIONS -->
      <div class="flex gap-2">
        <button @click="saveSite" class="bg-green-600 text-white px-3">Save</button>
        <button @click="mode='preview'" class="bg-blue-600 text-white px-3">Preview</button>
        <button @click="mode='edit'" class="border px-3">Edit</button>
      </div>

    </div>

    <!-- CONTENT -->
    <div class="pt-20 p-6 space-y-6">

      <!-- EDIT -->
      <div v-if="mode==='edit'">

        <div
          v-for="(s,i) in site.sections"
          :key="s.id"
          class="border p-4 rounded-lg shadow-sm bg-white cursor-pointer"
          :class="activeSectionIndex===i ? 'border-blue-500' : ''"
          @click.stop="activeSectionIndex=i"
          :style="s.style"
        >

          <button class="text-red-500 float-right" @click.stop="deleteSection(i)">✕</button>

          <input v-if="s.type==='hero'" v-model="s.title" class="border w-full p-2"/>

          <textarea
            v-if="s.type==='text' || s.type==='main'"
            v-model="s.content"
            class="w-full min-h-[200px] border p-3 whitespace-pre-wrap"
          />

        </div>

      </div>

      <!-- PREVIEW -->
      <div v-else>

        <div
          v-for="s in site.sections"
          :key="s.id"
          class="mb-10"
          :class="s.class"
          :style="s.style"
        >

          <h2 v-if="s.type==='hero'">{{ s.title }}</h2>

          <p v-if="s.type==='text'" style="white-space: pre-line;">
            {{ s.content }}
          </p>

          <div v-if="s.type==='main'" style="white-space: pre-line;">
            {{ s.content }}
          </div>

        </div>

      </div>

    </div>
  </div>
</template>
