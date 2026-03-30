<script setup>
import { ref, computed } from "vue"

/* ================= SITE ================= */
const site = ref({
  pages: [
    {
      id: 1,
      name: "Home",
      sections: [
        { id: 1, type: "text", content: "Bienvenue 👋", style: {} }
      ]
    }
  ]
})

const mode = ref("edit")
const currentPageIndex = ref(0)
const activeSectionIndex = ref(null)
const showCode = ref(false)

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
    sections: [
      { id: Date.now(), type: "text", content: "Nouvelle page ✨", style: {} }
    ]
  })
}

const deletePage = (i) => {
  site.value.pages.splice(i, 1)
  currentPageIndex.value = 0
}

/* ================= SECTIONS ================= */
const addSection = (type) => {
  const map = {
    text: { type: "text", content: "Texte...", style: {} },
    main: { type: "main", content: "Zone principale...", style: {} },
    image: { type: "image", url: "" }
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
const setStyle = (section, type, value=null) => {
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

  if (type === "align") {
    section.style.textAlign = value
  }

  if (type === "color") {
    section.style.color = value
  }

  if (type === "bg") {
    section.style.backgroundColor = value
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

/* ================= CODE ================= */
const getPageCode = () => {
  return JSON.stringify(currentPage.value, null, 2)
}
</script>

<template>
<div class="min-h-screen bg-gray-50">

<!-- ================= WORD BAR ================= -->
<div v-if="mode==='edit'" class="fixed top-0 w-full bg-white shadow z-50">

  <!-- MENU WORD -->
  <div class="flex gap-6 px-4 py-2 border-b text-sm font-semibold">
    <span class="cursor-pointer">📁 File</span>
    <span class="cursor-pointer">✏️ Edit</span>
    <span class="cursor-pointer">➕ Insert</span>
    <span class="cursor-pointer">🎨 Format</span>
    <span class="cursor-pointer">🛠 Tools</span>
  </div>

  <!-- TOOLBAR -->
  <div class="flex flex-wrap items-center gap-2 px-4 py-2">

    <button @click="addSection('text')" class="btn">📝 Texte</button>
    <button @click="addSection('main')" class="btn">📦 Section</button>
    <button @click="addSection('image')" class="btn">🖼 Image</button>
    <button @click="addPage" class="btn">📄 Page</button>

    <!-- STYLE -->
    <div v-if="activeSection" class="flex gap-2 ml-4">
      <button @click="setStyle(activeSection,'bold')" class="btn">𝐁</button>
      <button @click="setStyle(activeSection,'italic')" class="btn">𝑰</button>
      <button @click="setStyle(activeSection,'underline')" class="btn">U̲</button>

      <button @click="setStyle(activeSection,'align','left')" class="btn">⬅</button>
      <button @click="setStyle(activeSection,'align','center')" class="btn">⬛</button>
      <button @click="setStyle(activeSection,'align','right')" class="btn">➡</button>

      🎨 <input type="color" @input="setStyle(activeSection,'color',$event.target.value)" />
      🧱 <input type="color" @input="setStyle(activeSection,'bg',$event.target.value)" />
    </div>

    <!-- RIGHT -->
    <div class="ml-auto flex gap-2">
      <button @click="showCode=true" class="btn">💻 Code</button>
      <button @click="mode='preview'" class="bg-blue-600 text-white px-3 py-1 rounded">
        👁 Aperçu
      </button>
    </div>

  </div>
</div>

<!-- ================= CODE ================= -->
<div v-if="showCode" class="fixed inset-0 bg-black/70 z-50 p-6">
  <div class="bg-white h-full p-4 overflow-auto rounded">
    <div class="flex justify-between mb-3">
      <h2 class="font-bold">💻 Code page</h2>
      <button @click="showCode=false" class="bg-red-500 text-white px-3 rounded">
        Fermer
      </button>
    </div>
    <pre>{{ getPageCode() }}</pre>
  </div>
</div>

<!-- ================= CONTENT ================= -->
<div class="pt-28 p-4">

<!-- MENU PAGES -->
<div v-if="mode==='edit'" class="flex gap-3 mb-4 flex-wrap">
  <div v-for="(p,i) in site.pages" :key="p.id" class="flex items-center gap-2">

    <button
      @click="goToPage(i)"
      class="px-3 py-1 rounded border"
      :class="currentPageIndex===i ? 'bg-black text-white' : ''"
    >
      📄 {{ p.name }}
    </button>

    <input v-model="p.name" class="border px-2 rounded w-28" />

    <button @click="deletePage(i)" class="text-red-500">❌</button>

  </div>
</div>

<!-- EDIT MODE -->
<div v-if="mode==='edit'">
  <div
    v-for="(s,i) in currentPage.sections"
    :key="s.id"
    class="bg-white p-4 mb-3 rounded shadow cursor-pointer"
    @click="activeSectionIndex=i"
    :style="s.style"
  >

    <button @click.stop="deleteSection(i)" class="float-right text-red-500">❌</button>

    <input v-if="s.type==='text'" v-model="s.content" class="w-full border p-2 rounded"/>

    <textarea
      v-if="s.type==='main'"
      v-model="s.content"
      class="w-full min-h-[200px] border p-2 rounded"
    />

    <div v-if="s.type==='image'">
      <input type="file" @change="uploadImage($event,s)" />
      <img v-if="s.url" :src="s.url" class="w-full mt-2 rounded"/>
    </div>

  </div>
</div>

<!-- PREVIEW -->
<div v-else>

  <div class="fixed top-0 w-full bg-black text-white p-2 text-center">
    👁 Mode Aperçu
  </div>

  <div class="pt-12">
    <div v-for="s in currentPage.sections" :key="s.id" :style="s.style">

      <p v-if="s.type==='text'">{{ s.content }}</p>

      <div v-if="s.type==='main'" style="min-height:400px">
        {{ s.content }}
      </div>

      <img v-if="s.type==='image'" :src="s.url" class="w-full"/>

    </div>
  </div>

</div>

</div>
</div>
</template>

<style scoped>
.btn {
  background: #f3f4f6;
  padding: 6px 10px;
  border-radius: 6px;
}
.btn:hover {
  background: #e5e7eb;
}
</style>
