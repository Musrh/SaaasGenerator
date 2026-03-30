<script setup>
import { ref, computed } from "vue"

/* ================= SITE ================= */
const site = ref({
  pages: [
    {
      id: 1,
      name: "Accueil",
      sections: [
        { id: 1, type: "text", content: "Bienvenue 👋", style: {} }
      ]
    }
  ]
})

const mode = ref("edit")
const currentPageIndex = ref(0)
const activeSectionIndex = ref(null)

/* ================= PAGE ================= */
const currentPage = computed(() =>
  site.value.pages[currentPageIndex.value]
)

const goToPage = (i) => {
  currentPageIndex.value = i
  activeSectionIndex.value = null
}

const addPage = () => {
  site.value.pages.push({
    id: Date.now(),
    name: "Nouvelle page",
    sections: [
      { id: Date.now(), type: "text", content: "Nouvelle page ✨", style: {} }
    ]
  })
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
}

/* ================= ACTIVE ================= */
const activeSection = computed(() =>
  currentPage.value.sections?.[activeSectionIndex.value]
)

/* ================= STYLE ================= */
const setStyle = (type, value=null) => {
  const s = activeSection.value
  if (!s) return

  s.style ||= {}

  if (type === "bold") {
    s.style.fontWeight = s.style.fontWeight === "bold" ? "normal" : "bold"
  }

  if (type === "italic") {
    s.style.fontStyle = s.style.fontStyle === "italic" ? "normal" : "italic"
  }

  if (type === "underline") {
    s.style.textDecoration = s.style.textDecoration === "underline" ? "none" : "underline"
  }

  if (type === "align") {
    s.style.textAlign = value
  }

  if (type === "color") {
    s.style.color = value
  }

  if (type === "bg") {
    s.style.backgroundColor = value
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
</script>

<template>
<div class="min-h-screen bg-gray-50">

<!-- ================= NAVBAR SITE ================= -->
<div class="fixed top-0 w-full bg-white shadow z-50">

  <!-- MENU SITE -->
  <div class="flex items-center justify-between px-4 py-3 border-b">

    <div class="font-bold text-lg">🌐 Mon Site</div>

    <div class="flex gap-4 items-center">

      <div
        v-for="(p,i) in site.pages"
        :key="p.id"
        @click="goToPage(i)"
        class="cursor-pointer hover:text-blue-500"
        :class="currentPageIndex===i ? 'text-blue-600 font-bold' : ''"
      >
        {{ p.name }}
      </div>

      <!-- EDIT ONLY -->
      <button v-if="mode==='edit'" @click="addPage" class="text-green-600">
        ➕
      </button>

    </div>

    <!-- MODE SWITCH -->
    <button
      v-if="mode==='edit'"
      @click="mode='preview'"
      class="bg-blue-500 text-white px-3 py-1 rounded"
    >
      👁 Aperçu
    </button>

    <button
      v-else
      @click="mode='edit'"
      class="bg-black text-white px-3 py-1 rounded"
    >
      ✏️ Edit
    </button>

  </div>

  <!-- ================= TOOLBAR ================= -->
  <div v-if="mode==='edit'" class="flex flex-wrap gap-2 p-2 bg-gray-100">

    <button @click="addSection('text')" class="btn">📝 Texte</button>
    <button @click="addSection('main')" class="btn">📦 Section</button>
    <button @click="addSection('image')" class="btn">🖼 Image</button>

    <div v-if="activeSection" class="flex gap-2 ml-4">

      <button @click="setStyle('bold')" class="btn">𝐁</button>
      <button @click="setStyle('italic')" class="btn">𝑰</button>
      <button @click="setStyle('underline')" class="btn">U̲</button>

      <button @click="setStyle('align','left')" class="btn">⬅</button>
      <button @click="setStyle('align','center')" class="btn">⬛</button>
      <button @click="setStyle('align','right')" class="btn">➡</button>

      🎨 <input type="color" @input="setStyle('color',$event.target.value)" />
      🧱 <input type="color" @input="setStyle('bg',$event.target.value)" />

    </div>

  </div>

</div>

<!-- ================= CONTENT ================= -->
<div class="pt-28 p-4">

  <!-- EDIT MODE -->
  <div v-if="mode==='edit'">

    <div
      v-for="(s,i) in currentPage.sections"
      :key="s.id"
      class="bg-white p-4 mb-3 rounded shadow cursor-pointer"
      @click="activeSectionIndex=i"
      :style="s.style"
    >

      <button @click.stop="deleteSection(i)" class="float-right text-red-500">
        ❌
      </button>

      <input
        v-if="s.type==='text'"
        v-model="s.content"
        class="w-full border p-2 rounded"
      />

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

  <!-- PREVIEW MODE -->
  <div v-else>

    <div
      v-for="s in currentPage.sections"
      :key="s.id"
      :style="s.style"
      class="mb-4"
    >

      <p v-if="s.type==='text'">{{ s.content }}</p>

      <div v-if="s.type==='main'" class="min-h-[300px]">
        {{ s.content }}
      </div>

      <img v-if="s.type==='image'" :src="s.url" class="w-full"/>

    </div>

  </div>

</div>
</div>
</template>

<style scoped>
.btn {
  background: white;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #ddd;
}
.btn:hover {
  background: #f3f4f6;
}
</style>
