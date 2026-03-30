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
const showCode = ref(false)
const showFileMenu = ref(false)

/* ================= PAGE ACTIVE ================= */
const currentPage = computed(() =>
  site.value.pages[currentPageIndex.value]
)

/* ================= NAV ================= */
const goToPage = (i) => {
  currentPageIndex.value = i
  activeSectionIndex.value = null
}

/* ================= PAGE ================= */
const addPage = () => {
  site.value.pages.push({
    id: Date.now(),
    name: "Nouvelle page",
    sections: []
  })
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

/* ================= ACTIVE ================= */
const activeSection = computed(() =>
  currentPage.value.sections?.[activeSectionIndex.value]
)

/* ================= STYLE ================= */
const setStyle = (section, type, value = null) => {
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

  if (type === "align") section.style.textAlign = value
  if (type === "color") section.style.color = value
  if (type === "bg") section.style.backgroundColor = value
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

/* ================= CODE ================= */
const getPageCode = () => {
  return JSON.stringify(currentPage.value, null, 2)
}
</script>

<template>
<div class="min-h-screen bg-gray-100">

<!-- ================= WORD UI ================= -->
<div v-if="mode==='edit'" class="fixed top-0 w-full z-50 shadow">

  <!-- 🔷 MENU BAR -->
  <div class="bg-gray-100 border-b px-4 py-2 flex gap-6 text-sm font-medium">

    <!-- FILE MENU -->
    <div class="relative">
      <button @click="showFileMenu=!showFileMenu">File</button>

      <div v-if="showFileMenu" class="absolute bg-white border shadow p-2 mt-1 w-40">
        <div class="menu-item">New</div>
        <div class="menu-item">Save</div>
        <div class="menu-item">Export</div>
      </div>
    </div>

    <div>Edit</div>
    <div>View</div>
    <div>Insert</div>
    <div>Format</div>
    <div>Tools</div>

  </div>

  <!-- 🔷 TOOLBAR -->
  <div class="bg-white px-4 py-2 flex flex-wrap items-center gap-3 border-b">

    <!-- INSERT -->
    <div class="flex gap-2 border-r pr-3">
      <button @click="addSection('text')" class="btn">Text</button>
      <button @click="addSection('main')" class="btn">Main</button>
      <button @click="addSection('image')" class="btn">Image</button>
      <button @click="addPage" class="btn bg-green-500 text-white">+ Page</button>
    </div>

    <!-- STYLE -->
    <div v-if="activeSection" class="flex gap-2 border-r pr-3">

      <button @click="setStyle(activeSection,'bold')" class="btn font-bold">B</button>
      <button @click="setStyle(activeSection,'italic')" class="btn italic">I</button>
      <button @click="setStyle(activeSection,'underline')" class="btn underline">U</button>

      <button @click="setStyle(activeSection,'align','left')" class="btn">⬅</button>
      <button @click="setStyle(activeSection,'align','center')" class="btn">⬛</button>
      <button @click="setStyle(activeSection,'align','right')" class="btn">➡</button>

      <input type="color" @input="setStyle(activeSection,'color',$event.target.value)" />
      <input type="color" @input="setStyle(activeSection,'bg',$event.target.value)" />

    </div>

    <!-- ACTION -->
    <div class="flex gap-2 ml-auto">
      <button @click="showCode=true" class="btn">Code</button>
      <button @click="mode='preview'" class="bg-blue-600 text-white px-4 py-2 rounded">
        Aperçu
      </button>
    </div>

  </div>

</div>

<!-- ================= CODE VIEW ================= -->
<div v-if="showCode" class="fixed inset-0 bg-black/70 z-50 p-6">

  <div class="bg-white h-full p-4 overflow-auto">

    <div class="flex justify-between mb-3">
      <h2>Code page</h2>
      <button @click="showCode=false" class="bg-red-500 text-white px-3">
        Fermer
      </button>
    </div>

    <pre>{{ getPageCode() }}</pre>

  </div>

</div>

<!-- ================= CONTENT ================= -->
<div class="pt-28 p-4">

<!-- 🔥 MENU PAGES -->
<div v-if="mode==='edit'" class="flex gap-3 border-b pb-2 mb-4 flex-wrap">

  <div v-for="(p,i) in site.pages" :key="p.id" class="flex items-center gap-2">

    <div
      @click="goToPage(i)"
      class="cursor-pointer px-3 py-1 border rounded"
      :class="currentPageIndex===i ? 'bg-black text-white' : ''"
    >
      {{ p.name }}
    </div>

    <input v-model="p.name" class="border px-2 w-28" />

    <button @click="deletePage(i)" class="text-red-500">✕</button>

  </div>

</div>

<!-- ================= EDIT ================= -->
<div v-if="mode==='edit'">

  <div
    v-for="(s,i) in currentPage.sections"
    :key="s.id"
    class="border p-3 mb-2 cursor-pointer bg-white"
    @click="activeSectionIndex=i"
    :style="s.style"
  >

    <button @click.stop="deleteSection(i)" class="text-red-500 float-right">✕</button>

    <input v-if="s.type==='text'" v-model="s.content" class="border w-full p-2"/>

    <textarea
      v-if="s.type==='main'"
      v-model="s.content"
      class="w-full min-h-[300px] border p-2"
    />

    <!-- IMAGE -->
    <div v-if="s.type==='image'">
      <input type="file" @change="uploadImage($event,s)" />
      <img v-if="s.url" :src="s.url" class="w-full mt-2 rounded"/>
    </div>

  </div>

</div>

<!-- ================= PREVIEW ================= -->
<div v-else>

  <div class="fixed top-0 w-full bg-black text-white p-2 text-center z-50">
    Mode Aperçu
  </div>

  <div class="pt-12 bg-white min-h-screen">

    <div v-for="s in currentPage.sections" :key="s.id" :style="s.style">

      <p v-if="s.type==='text'" class="p-2">{{ s.content }}</p>

      <div v-if="s.type==='main'" class="p-4 min-h-[500px]">
        {{ s.content }}
      </div>

      <img v-if="s.type==='image'" :src="s.url" class="w-full"/>

    </div>

  </div>

</div>

</div>
</div>
</template>

<style>
.btn {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  transition: 0.2s;
}

.btn:hover {
  background: #f3f4f6;
}

.menu-item {
  padding: 6px;
  cursor: pointer;
}

.menu-item:hover {
  background: #eee;
}
</style>
