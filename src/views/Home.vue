
<script setup>
import { ref, watch } from "vue"
import { db } from "../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"

const props = defineProps({ uid: String })

/* STATE */
const site = ref({
  theme: {
    background: "#ffffff",
    text: "#111111"
  },
  sections: []
})

const mode = ref("edit")
const activeSectionIndex = ref(null)
const loading = ref(false)
const error = ref("")

/* LOAD */
const loadSite = async (uid) => {
  if (!uid) return

  loading.value = true

  try {
    const snap = await getDoc(doc(db, "users", uid))

    if (snap.exists()) {
      const data = snap.data()

      site.value = {
        theme: data.theme || site.value.theme,
        sections: data.sections || []
      }
    } else {
      error.value = "Site introuvable"
    }

  } catch {
    error.value = "Erreur Firestore"
  }

  loading.value = false
}

watch(() => props.uid, (v) => v && loadSite(v), { immediate: true })

/* ADD SECTION */
const addSection = (type) => {
  const map = {
    hero: { type: "hero", title: "Hero", style: {}, class: "" },
    text: { type: "text", content: "Texte...", style: {}, class: "" },
    main: { type: "main", content: "Main...", style: {}, class: "" },
    image: { type: "image", url: "" },
    footer: { type: "footer", text: "Footer", style: {}, class: "" }
  }

  site.value.sections.push({
    id: Date.now(),
    ...map[type]
  })
}

/* SAVE */
const saveSite = async () => {
  await updateDoc(doc(db, "users", props.uid), {
    theme: site.value.theme,
    sections: site.value.sections
  })

  alert("Saved ✔")
}

/* FILE UPLOAD */
const uploadImage = (e, section) => {
  const file = e.target.files[0]
  const reader = new FileReader()

  reader.onload = () => section.url = reader.result
  reader.readAsDataURL(file)
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

const setAlign = (section, val) => {
  section.style = section.style || {}
  section.style.textAlign = val
}

const setColor = (section, e) => {
  section.style.color = e.target.value
}

const setBg = (section, e) => {
  section.style.backgroundColor = e.target.value
}

/* 🔥 NEW: VIEW CODE */
const viewCode = () => {
  if (activeSectionIndex.value === null) return

  const section = site.value.sections[activeSectionIndex.value]

  const code = `
<div class="${section.class || ""}" style="${JSON.stringify(section.style)}">
  ${section.content || section.title || ""}
</div>
  `

  const win = window.open()
  win.document.write(`<pre>${code}</pre>`)
}

/* DELETE */
const deleteSection = (i) => {
  site.value.sections.splice(i, 1)
  activeSectionIndex.value = null
}
</script>

<template>
  <div
    class="min-h-screen"
    :style="{ backgroundColor: site.theme.background, color: site.theme.text }"
    @click.self="activeSectionIndex=null"
  >

    <!-- 🔥 TOP BAR -->
    <div class="fixed top-0 w-full bg-white border p-2 z-50 flex flex-wrap gap-2 justify-between">

      <!-- SECTIONS -->
      <div class="flex gap-2">
        <button @click="addSection('hero')" class="border px-2">Hero</button>
        <button @click="addSection('text')" class="border px-2">Text</button>
        <button @click="addSection('main')" class="border px-2">Main</button>
        <button @click="addSection('image')" class="border px-2">Image</button>
        <button @click="addSection('footer')" class="border px-2">Footer</button>
      </div>

      <!-- STYLE BAR -->
      <div v-if="activeSectionIndex!==null" class="flex gap-2 items-center">

        <button @click="setStyle(site.sections[activeSectionIndex],'bold')" class="border px-2">B</button>
        <button @click="setStyle(site.sections[activeSectionIndex],'italic')" class="border px-2">I</button>
        <button @click="setStyle(site.sections[activeSectionIndex],'underline')" class="border px-2">U</button>

        <button @click="setAlign(site.sections[activeSectionIndex],'left')" class="border px-2">⬅</button>
        <button @click="setAlign(site.sections[activeSectionIndex],'center')" class="border px-2">⬌</button>
        <button @click="setAlign(site.sections[activeSectionIndex],'right')" class="border px-2">➡</button>

        <input type="color" @input="e => setColor(site.sections[activeSectionIndex], e)" />
        <input type="color" @input="e => setBg(site.sections[activeSectionIndex], e)" />

        <!-- 🔥 TAILWIND CLASSES -->
        <input
          v-model="site.sections[activeSectionIndex].class"
          placeholder="ex: text-xl bg-blue-500 p-4"
          class="border px-2"
        />

        <!-- 🔥 VIEW CODE -->
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
    <div class="pt-20 p-4">

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

          <!-- 🔥 TEXTAREA WITH LINE BREAK -->
          <textarea
            v-if="s.type==='text' || s.type==='main'"
            v-model="s.content"
            class="w-full min-h-[200px] border p-2 whitespace-pre-wrap"
          />

          <div v-if="s.type==='image'">
            <input type="file" @change="uploadImage($event,s)" />
            <img v-if="s.url" :src="s.url" class="w-full"/>
          </div>

          <input v-if="s.type==='footer'" v-model="s.text" class="border w-full"/>

        </div>

      </div>

      <!-- PREVIEW -->
      <div v-else>

        <div
          v-for="s in site.sections"
          :key="s.id"
          :class="s.class"
          :style="s.style"
          class="mb-6"
        >

          <h2 v-if="s.type==='hero'">{{ s.title }}</h2>

          <!-- 🔥 LINE BREAK SUPPORT -->
          <p v-if="s.type==='text'" style="white-space: pre-wrap;">
            {{ s.content }}
          </p>

          <div v-if="s.type==='main'" class="min-h-[500px]" style="white-space: pre-wrap;">
            {{ s.content }}
          </div>

          <img v-if="s.type==='image'" :src="s.url"/>

          <footer v-if="s.type==='footer'">{{ s.text }}</footer>

        </div>

      </div>

    </div>
  </div>
</template>
