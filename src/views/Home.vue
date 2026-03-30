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

/* ================= IMAGE UPLOAD ================= */
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
<div class="min-h-screen">

<!-- ================= TOOLBAR ================= -->
<div v-if="mode==='edit'" class="fixed top-0 w-full bg-white border-b p-2 flex justify-between z-50 flex-wrap">

  <!-- LEFT -->
  <div class="flex gap-2">
    <button @click="addSection('text')">Text</button>
    <button @click="addSection('main')">Main</button>
    <button @click="addSection('image')">Image</button>
    <button @click="addPage">+ Page</button>
  </div>

  <!-- STYLE BAR -->
  <div class="flex gap-2 items-center" v-if="activeSection">

    <button @click="setStyle(activeSection,'bold')">B</button>
    <button @click="setStyle(activeSection,'italic')">I</button>
    <button @click="setStyle(activeSection,'underline')">U</button>

    <button @click="setStyle(activeSection,'align','left')">⬅</button>
    <button @click="setStyle(activeSection,'align','center')">⬛</button>
    <button @click="setStyle(activeSection,'align','right')">➡</button>

    <input type="color" @input="setStyle(activeSection,'color',$event.target.value)" />
    <input type="color" @input="setStyle(activeSection,'bg',$event.target.value)" />

  </div>

  <!-- RIGHT -->
  <div class="flex gap-2">
    <button @click="showCode=true">Code</button>
    <button @click="mode='preview'" class="bg-blue-600 text-white px-3">
      Aperçu
    </button>
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
<div class="pt-20 p-4">

<!-- 🔥 MENU (HIDDEN IN PREVIEW) -->
<div v-if="mode==='edit'" class="flex gap-3 border-b pb-2 mb-4 flex-wrap">

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

    <input v-model="p.name" class="border px-2 w-28" />

    <button @click="deletePage(i)" class="text-red-500">✕</button>

  </div>

</div>

<!-- ================= EDIT ================= -->
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

    <textarea
      v-if="s.type==='main'"
      v-model="s.content"
      class="w-full min-h-[200px] border"
    />

    <!-- IMAGE -->
    <div v-if="s.type==='image'">
      <input type="file" @change="uploadImage($event,s)" />
      <img v-if="s.url" :src="s.url" class="w-full mt-2"/>
    </div>

  </div>

</div>

<!-- ================= PREVIEW ================= -->
<div v-else>

  <!-- 🔥 HEADER PREVIEW CLEAN -->
  <div class="fixed top-0 w-full bg-black text-white p-2 text-center z-50">
    Mode Aperçu
  </div>

  <div class="pt-12">

    <div v-for="s in currentPage.sections" :key="s.id" :style="s.style">

      <p v-if="s.type==='text'">{{ s.content }}</p>

      <div v-if="s.type==='main'" style="min-height:500px">
        {{ s.content }}
      </div>

      <img v-if="s.type==='image'" :src="s.url" class="w-full"/>

    </div>

  </div>

</div>

</div>
</div>
</template>
