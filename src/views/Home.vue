<script setup>
import { ref, computed } from "vue"

/* ================= SITE ================= */
const site = ref({
  pages: [
    {
      id: 1,
      name: "Home",
      sections: [
        { id: 1, type: "text", content: "Bienvenue", style: {} },
        { id: 2, type: "image", url: "", style: {} }
      ]
    }
  ]
})

const mode = ref("edit")
const currentPageIndex = ref(0)
const activeSectionIndex = ref(null)

/* ================= PAGE ACTIVE ================= */
const currentPage = computed(() =>
  site.value.pages[currentPageIndex.value]
)

/* ================= NAV ================= */
const goToPage = (i) => {
  currentPageIndex.value = i
  activeSectionIndex.value = null
}

/* ================= PAGE CODE ================= */
const pageCode = computed(() =>
  JSON.stringify(currentPage.value, null, 2)
)

/* ================= SECTIONS ================= */
const addSection = (type) => {
  const map = {
    text: { type: "text", content: "Texte...", style: {} },
    main: { type: "main", content: "Zone principale...", style: {} },
    image: { type: "image", url: "", style: {} }
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

/* ================= STYLE BAR ================= */
const setStyle = (section, type) => {
  section.style ||= {}

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
  section.style ||= {}
  section.style.textAlign = value
}

const setColor = (section, e) => {
  section.style ||= {}
  section.style.color = e.target.value
}

/* ================= IMAGE ================= */
const uploadImage = (e, section) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    section.url = reader.result
  }
  reader.readAsDataURL(file)
}
</script>

<template>
<div class="min-h-screen">

<!-- ================= EDIT TOOLBAR ================= -->
<div v-if="mode==='edit'" class="fixed top-0 w-full bg-white border-b p-2 flex justify-between z-50">

  <div class="flex gap-2">
    <button @click="addSection('text')">Text</button>
    <button @click="addSection('main')">Main</button>
    <button @click="addSection('image')">Image</button>
  </div>

  <!-- 🔥 STYLE BAR (TOUJOURS VISIBLE EN EDIT) -->
  <div v-if="activeSectionIndex !== null && currentPage.sections[activeSectionIndex]"
       class="flex gap-2">

    <button @click="setStyle(currentPage.sections[activeSectionIndex],'bold')">B</button>
    <button @click="setStyle(currentPage.sections[activeSectionIndex],'italic')">I</button>
    <button @click="setStyle(currentPage.sections[activeSectionIndex],'underline')">U</button>

    <button @click="setAlign(currentPage.sections[activeSectionIndex],'left')">⬅</button>
    <button @click="setAlign(currentPage.sections[activeSectionIndex],'center')">⬌</button>
    <button @click="setAlign(currentPage.sections[activeSectionIndex],'right')">➡</button>

    <input type="color" @input="e => setColor(currentPage.sections[activeSectionIndex], e)" />
  </div>

  <div>
    <button @click="mode='preview'" class="bg-blue-600 text-white px-3">
      Aperçu
    </button>
  </div>

</div>

<!-- ================= CONTENT ================= -->
<div class="pt-20 p-4">

<!-- 🔥 MENU -->
<div class="flex gap-3 border-b pb-2 mb-4">

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

<!-- ================= EDIT ================= -->
<div v-if="mode==='edit'" class="grid grid-cols-2 gap-4">

  <!-- LEFT : PAGE CONTENT -->
  <div>

    <div
      v-for="(s,i) in currentPage.sections"
      :key="s.id"
      class="border p-3 mb-2 cursor-pointer"
      @click="activeSectionIndex=i"
      :style="s.style"
    >

      <button @click.stop="deleteSection(i)" class="text-red-500 float-right">✕</button>

      <input v-if="s.type==='text'" v-model="s.content" class="border w-full"/>

      <textarea v-if="s.type==='main'" v-model="s.content" class="w-full min-h-[200px] border"/>

      <div v-if="s.type==='image'">
        <input type="file" @change="e => uploadImage(e, s)" />
        <img v-if="s.url" :src="s.url" class="mt-2 max-w-full"/>
      </div>

    </div>

  </div>

  <!-- RIGHT : PAGE CODE -->
  <div class="border p-3 bg-gray-50">

    <h3 class="font-bold mb-2">Code de la page</h3>

    <pre class="text-xs overflow-auto h-[500px]">
{{ pageCode }}
    </pre>

  </div>

</div>

<!-- ================= PREVIEW ================= -->
<div v-else>

  <!-- 🔥 TOP BAR ALWAYS FIRST -->
  <div class="fixed top-0 w-full bg-black text-white p-2 flex justify-between z-50">
    <span>Mode Aperçu</span>
    <button @click="mode='edit'" class="bg-white text-black px-3 py-1">
      Retour Edit
    </button>
  </div>

  <!-- CONTENT BELOW -->
  <div class="pt-12">

    <div v-for="s in currentPage.sections" :key="s.id">

      <p v-if="s.type==='text'">{{ s.content }}</p>

      <div v-if="s.type==='main'">{{ s.content }}</div>

      <img v-if="s.type==='image'" :src="s.url"/>

    </div>

  </div>

</div>

</div>
</div>
</template>
