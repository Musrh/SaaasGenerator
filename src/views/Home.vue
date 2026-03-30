<script setup>
import { ref, computed } from "vue"

/* ================= SITE ================= */
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
          style: {}
        }
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

/* ================= NAV MENU ================= */
const goToPage = (i) => {
  currentPageIndex.value = i
  activeSectionIndex.value = null
}

/* ================= MENU → CREATE PAGE ================= */
const addMenuPage = () => {
  const name = prompt("Nom de la page ?")

  if (!name) return

  site.value.pages.push({
    id: Date.now(),
    name,
    sections: [
      {
        id: Date.now() + 1,
        type: "text",
        content: "Contenu de " + name,
        style: {}
      }
    ]
  })

  currentPageIndex.value = site.value.pages.length - 1
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
</script>

<template>
<div class="min-h-screen">

<!-- 🔥 TOOLBAR EDIT -->
<div v-if="mode==='edit'" class="fixed top-0 w-full bg-white border-b p-2 flex justify-between z-50">

  <!-- ADD -->
  <div class="flex gap-2">
    <button @click="addSection('text')">Text</button>
    <button @click="addSection('main')">Main</button>
    <button @click="addMenuPage" class="border px-2">+ Page Menu</button>
  </div>

  <!-- STYLE BAR -->
  <div v-if="activeSectionIndex !== null && currentPage.sections[activeSectionIndex]" class="flex gap-2">

    <button @click="setStyle(currentPage.sections[activeSectionIndex],'bold')">B</button>
    <button @click="setStyle(currentPage.sections[activeSectionIndex],'italic')">I</button>
    <button @click="setStyle(currentPage.sections[activeSectionIndex],'underline')">U</button>

    <button @click="setAlign(currentPage.sections[activeSectionIndex],'left')">⬅</button>
    <button @click="setAlign(currentPage.sections[activeSectionIndex],'center')">⬌</button>
    <button @click="setAlign(currentPage.sections[activeSectionIndex],'right')">➡</button>

    <input type="color" @input="e => setColor(currentPage.sections[activeSectionIndex], e)" />

  </div>

  <!-- MODE -->
  <div>
    <button @click="mode='preview'" class="bg-blue-600 text-white px-3">
      Aperçu
    </button>
  </div>

</div>

<!-- ================= CONTENT ================= -->
<div class="pt-20 p-4">

<!-- 🔥 MENU NAV -->
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
    <textarea v-if="s.type==='main'" v-model="s.content" class="w-full min-h-[200px] border"/>

  </div>

</div>

<!-- ================= PREVIEW ================= -->
<div v-else class="pt-10">

  <!-- 🔥 TOP BAR PREVIEW -->
  <div class="fixed top-0 w-full bg-black text-white p-2 flex justify-between z-50">
    <span>Mode Aperçu</span>
    <button @click="mode='edit'" class="bg-white text-black px-3 py-1 rounded">
      Retour Edit
    </button>
  </div>

  <!-- CONTENT -->
  <div class="pt-10">

    <div v-for="s in currentPage.sections" :key="s.id" :style="s.style">

      <p v-if="s.type==='text'">{{ s.content }}</p>
      <div v-if="s.type==='main'">{{ s.content }}</div>

    </div>

  </div>

</div>

</div>
</div>
</template>
