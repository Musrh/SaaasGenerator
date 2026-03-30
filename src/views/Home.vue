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

/* ================= CODE PANEL ================= */
const showCode = ref(false)

/* ================= PAGE ACTIVE ================= */
const currentPage = computed(() =>
  site.value.pages[currentPageIndex.value]
)

const pageCode = computed({
  get: () => JSON.stringify(currentPage.value, null, 2),
  set: (val) => {
    try {
      site.value.pages[currentPageIndex.value] = JSON.parse(val)
    } catch (e) {
      console.log("JSON invalide")
    }
  }
})

/* ================= MENU PAGES (RESTORED FULL) ================= */
const addPage = () => {
  site.value.pages.push({
    id: Date.now(),
    name: "Page " + (site.value.pages.length + 1),
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
    text: { type: "text", content: "Texte...", style: {} },
    main: { type: "main", content: "Zone...", style: {} },
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

/* ================= STYLE BAR (FIXED ALWAYS WORKING) ================= */
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

/* ================= SAFE ACTIVE SECTION ================= */
const activeSection = computed(() =>
  currentPage.value.sections?.[activeSectionIndex.value]
)
</script>

<template>
<div class="min-h-screen">

<!-- ================= TOOLBAR ================= -->
<div v-if="mode==='edit'" class="fixed top-0 w-full bg-white border-b p-2 flex justify-between z-50">

  <!-- ADD CONTROLS -->
  <div class="flex gap-2">
    <button @click="addSection('text')">Text</button>
    <button @click="addSection('main')">Main</button>
    <button @click="addSection('image')">Image</button>

    <!-- 🔥 RESTORED PAGE MENU ACTIONS -->
    <button @click="addPage" class="border px-2">+ Page</button>
  </div>

  <!-- 🔥 STYLE BAR (FIXED + ALWAYS ACTIVE WHEN SECTION SELECTED) -->
  <div v-if="activeSection" class="flex gap-2">

    <button @click="setStyle(activeSection,'bold')">B</button>
    <button @click="setStyle(activeSection,'italic')">I</button>
    <button @click="setStyle(activeSection,'underline')">U</button>

  </div>

  <!-- MODE -->
  <div class="flex gap-2">
    <button @click="showCode=!showCode" class="border px-2">
      Code
    </button>

    <button @click="mode='preview'" class="bg-blue-600 text-white px-3">
      Aperçu
    </button>
  </div>

</div>

<!-- ================= CONTENT ================= -->
<div class="pt-20 p-4">

<!-- 🔥 MENU + DELETE RESTORED -->
<div class="flex gap-3 border-b pb-2 mb-4">

  <div
    v-for="(p,i) in site.pages"
    :key="p.id"
    class="flex items-center gap-2"
  >

    <div
      @click="goToPage(i)"
      class="cursor-pointer px-3 py-1 border rounded"
      :class="currentPageIndex===i ? 'bg-black text-white' : ''"
    >
      {{ p.name }}
    </div>

    <button @click="deletePage(i)" class="text-red-500">✕</button>

  </div>

</div>

<!-- ================= EDIT ================= -->
<div v-if="mode==='edit'" class="grid grid-cols-2 gap-4">

  <!-- LEFT CONTENT -->
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

      <textarea v-if="s.type==='main'" v-model="s.content" class="w-full min-h-[150px] border"/>

      <div v-if="s.type==='image'">
        <input type="file" @change="e => uploadImage(e, s)" />
        <img v-if="s.url" :src="s.url" class="mt-2 max-w-full"/>
      </div>

    </div>

  </div>

  <!-- RIGHT CODE EDITABLE + CLOSE -->
  <div v-if="showCode" class="border p-3 bg-gray-50 relative">

    <button
      @click="showCode=false"
      class="absolute top-2 right-2 bg-red-500 text-white px-2"
    >
      Fermer
    </button>

    <h3 class="font-bold mb-2">Code Page (modifiable)</h3>

    <textarea
      v-model="pageCode"
      class="w-full h-[500px] text-xs border p-2 font-mono"
    ></textarea>

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

  <div class="pt-12">

    <div v-for="s in currentPage.sections" :key="s.id" :style="s.style">

      <p v-if="s.type==='text'">{{ s.content }}</p>

      <div v-if="s.type==='main'">{{ s.content }}</div>

      <img v-if="s.type==='image'" :src="s.url"/>

    </div>

  </div>

</div>

</div>
</div>
</template>
