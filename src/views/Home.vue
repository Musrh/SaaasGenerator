//home à améliorer 
<script setup>
import { ref, computed } from "vue"

/* ================= SITE ================= */
const site = ref({
  pages: [
    {
      id: 1,
      name: "Home",
      sections: [
        { id: 1, type: "text", content: "Bienvenue", style: {} }
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

/* ================= MENU NAV ================= */
const goToPage = (i) => {
  currentPageIndex.value = i
  activeSectionIndex.value = null
}

/* ================= MENU SYNC NAME EDIT ================= */
const renamePage = (i, event) => {
  site.value.pages[i].name = event.target.value
}

/* ================= ADD / DELETE PAGE ================= */
const addPage = () => {
  site.value.pages.push({
    id: Date.now(),
    name: "Nouvelle page",
    sections: [
      { id: Date.now() + 1, type: "text", content: "Contenu", style: {} }
    ]
  })

  currentPageIndex.value = site.value.pages.length - 1
}

const deletePage = (i) => {
  site.value.pages.splice(i, 1)

  if (currentPageIndex.value >= site.value.pages.length) {
    currentPageIndex.value = 0
  }
}

/* ================= SECTIONS ================= */
const addSection = (type) => {
  const map = {
    text: { type: "text", content: "Texte...", style: {} },
    main: { type: "main", content: "Zone principale...", style: {} }
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

/* ================= SAFE ACTIVE SECTION ================= */
const activeSection = computed(() =>
  currentPage.value.sections?.[activeSectionIndex.value]
)

/* ================= STYLE BAR (FIXED 100%) ================= */
const setStyle = (section, type) => {
  if (!section) return
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
</script>

<template>
<div class="min-h-screen">

<!-- ================= TOOLBAR ================= -->
<div v-if="mode==='edit'" class="fixed top-0 w-full bg-white border-b p-2 flex justify-between z-50">

  <div class="flex gap-2">
    <button @click="addSection('text')">Text</button>
    <button @click="addSection('main')">Main</button>
    <button @click="addPage" class="border px-2">+ Page</button>
  </div>

  <!-- 🔥 STYLE BAR FIXED (IMPORTANT: MUST NOT DEPEND ON NULL INDEX) -->
  <div class="flex gap-2" v-if="activeSection">

    <button @click="setStyle(activeSection,'bold')">B</button>
    <button @click="setStyle(activeSection,'italic')">I</button>
    <button @click="setStyle(activeSection,'underline')">U</button>

  </div>

  <button @click="mode='preview'" class="bg-blue-600 text-white px-3">
    Aperçu
  </button>

</div>

<!-- ================= CONTENT ================= -->
<div class="pt-20 p-4">

<!-- 🔥 MENU + RENAMING + DELETE -->
<div class="flex gap-3 border-b pb-2 mb-4">

  <div
    v-for="(p,i) in site.pages"
    :key="p.id"
    class="flex items-center gap-2"
  >

    <!-- CLICK PAGE -->
    <div
      @click="goToPage(i)"
      class="cursor-pointer px-3 py-1 border rounded"
      :class="currentPageIndex===i ? 'bg-black text-white' : ''"
    >
      {{ p.name }}
    </div>

    <!-- 🔥 EDIT NAME (SYNC LIVE) -->
    <input
      v-model="p.name"
      @input="renamePage(i, $event)"
      class="border px-2 text-sm w-28"
    />

    <!-- DELETE -->
    <button @click="deletePage(i)" class="text-red-500">✕</button>

  </div>

</div>

<!-- ================= EDIT MODE ================= -->
<div v-if="mode==='edit'">

  <div
    v-for="(s,i) in currentPage.sections"
    :key="s.id"
    class="border p-3 mb-2 cursor-pointer"
    @click="activeSectionIndex=i"
    :style="s.style"
  >

    <button @click.stop="deleteSection(i)" class="text-red-500 float-right">✕</button>

    <input v-if="s.type==='text'" v-model="s.content" class="border w-full"/>

    <textarea v-if="s.type==='main'" v-model="s.content" class="w-full min-h-[150px] border"/>

  </div>

</div>

<!-- ================= PREVIEW ================= -->
<div v-else>

  <div class="fixed top-0 w-full bg-black text-white p-2 flex justify-between z-50">
    <span>Mode Aperçu</span>
    <button @click="mode='edit'" class="bg-white text-black px-3">
      Retour Edit
    </button>
  </div>

  <div class="pt-12">

    <div v-for="s in currentPage.sections" :key="s.id" :style="s.style">

      <p v-if="s.type==='text'">{{ s.content }}</p>

      <div v-if="s.type==='main'">{{ s.content }}</div>

    </div>

  </div>

</div>

</div>
</div>
</template>
