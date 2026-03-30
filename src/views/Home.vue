<script setup>
import { ref, computed } from "vue"

/* ================= SITE DATA ================= */
const site = ref({
  pages: [
    {
      id: 1,
      name: "Home",
      sections: [
        {
          id: 1,
          type: "text",
          content: "Bienvenue sur le site",
          style: {
            color: "#000000",
            backgroundColor: "transparent",
            textAlign: "left",
            fontWeight: "normal",
            fontStyle: "normal",
            textDecoration: "none"
          }
        }
      ]
    }
  ]
})

/* ================= STATE ================= */
const mode = ref("edit")
const currentPageIndex = ref(0)
const activeSectionIndex = ref(null)

/* ================= CURRENT PAGE ================= */
const currentPage = computed(() =>
  site.value.pages[currentPageIndex.value]
)

const activeSection = computed(() =>
  currentPage.value.sections?.[activeSectionIndex.value]
)

/* ================= NAVIGATION ================= */
const goToPage = (i) => {
  currentPageIndex.value = i
  activeSectionIndex.value = null
}

/* ================= PAGE ACTIONS ================= */
const addPage = () => {
  site.value.pages.push({
    id: Date.now(),
    name: "Nouvelle page",
    sections: [
      {
        id: Date.now() + 1,
        type: "text",
        content: "Contenu page",
        style: {
          color: "#000000",
          backgroundColor: "transparent",
          textAlign: "left",
          fontWeight: "normal",
          fontStyle: "normal",
          textDecoration: "none"
        }
      }
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
  const baseStyle = {
    color: "#000000",
    backgroundColor: "transparent",
    textAlign: "left",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none"
  }

  const map = {
    text: { type: "text", content: "Texte...", style: baseStyle },
    main: { type: "main", content: "Zone principale...", style: baseStyle }
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

/* ================= STYLE TOOL ================= */
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
      section.style.textDecoration === "underline"
        ? "none"
        : "underline"
  }
}
</script>

<template>
<div class="min-h-screen">

<!-- ================= TOOLBAR ================= -->
<div
  v-if="mode==='edit'"
  class="fixed top-0 w-full bg-white border-b p-2 flex justify-between z-50"
>

  <!-- LEFT ACTIONS -->
  <div class="flex gap-2 items-center">
    <button @click="addSection('text')" class="border px-2">Text</button>
    <button @click="addSection('main')" class="border px-2">Main</button>
    <button @click="addPage" class="border px-2">+ Page</button>
  </div>

  <!-- STYLE BAR -->
  <div class="flex gap-2 items-center" v-if="activeSection">

    <button @click="setStyle(activeSection,'bold')">B</button>
    <button @click="setStyle(activeSection,'italic')">I</button>
    <button @click="setStyle(activeSection,'underline')">U</button>

    <button @click="activeSection.style.textAlign='left'">⬅</button>
    <button @click="activeSection.style.textAlign='center'">⬛</button>
    <button @click="activeSection.style.textAlign='right'">➡</button>

    <input type="color" v-model="activeSection.style.color" />
    <input type="color" v-model="activeSection.style.backgroundColor" />

  </div>

  <!-- MODE SWITCH -->
  <button
    @click="mode='preview'"
    class="bg-blue-600 text-white px-3"
  >
    Aperçu
  </button>

</div>

<!-- ================= CONTENT ================= -->
<div class="pt-20 p-4">

<!-- ================= MENU ================= -->
<div class="flex gap-3 border-b pb-2 mb-4 flex-wrap">

  <div
    v-for="(p,i) in site.pages"
    :key="p.id"
    class="flex items-center gap-2"
  >

    <!-- PAGE LINK -->
    <div
      @click="goToPage(i)"
      class="cursor-pointer px-3 py-1 border rounded"
      :class="currentPageIndex===i ? 'bg-black text-white' : ''"
    >
      {{ p.name }}
    </div>

    <!-- RENAME PAGE -->
    <input
      v-model="p.name"
      class="border px-2 text-sm w-28"
    />

    <!-- DELETE PAGE -->
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

    <button
      @click.stop="deleteSection(i)"
      class="text-red-500 float-right"
    >
      ✕
    </button>

    <input
      v-if="s.type==='text'"
      v-model="s.content"
      class="border w-full p-2"
      :style="s.style"
    />

    <textarea
      v-if="s.type==='main'"
      v-model="s.content"
      class="w-full min-h-[150px] border p-2"
      :style="s.style"
    />

  </div>

</div>

<!-- ================= PREVIEW ================= -->
<div v-else>

  <!-- TOP BAR -->
  <div class="fixed top-0 w-full bg-black text-white p-2 flex justify-between z-50">
    <span>Mode Aperçu</span>
    <button @click="mode='edit'" class="bg-white text-black px-3">
      Retour Edit
    </button>
  </div>

  <div class="pt-12">

    <div v-for="s in currentPage.sections" :key="s.id">

      <div
        v-if="s.type==='text'"
        :style="s.style"
      >
        {{ s.content }}
      </div>

      <div
        v-if="s.type==='main'"
        :style="s.style"
      >
        {{ s.content }}
      </div>

    </div>

  </div>

</div>

</div>
</div>
</template>
