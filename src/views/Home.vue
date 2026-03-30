<script setup>
import { ref, computed, onMounted } from "vue"

/* ================= SITE ================= */
const site = ref({
  pages: [
    {
      id: 1,
      name: "Accueil",
      style: {},
      sections: [
        { id: 1, type: "text", content: "Bienvenue 👋", style: {} }
      ]
    }
  ]
})

const mode = ref("edit")
const currentPageIndex = ref(0)
const activeSectionIndex = ref(null)

/* ================= CODE VIEW ================= */
const showCode = ref(false)

/* ================= CURRENT PAGE ================= */
const currentPage = computed(() => {
  return site.value.pages[currentPageIndex.value] || site.value.pages[0]
})

/* ================= PAGE ================= */
const goToPage = (i) => {
  currentPageIndex.value = i
  activeSectionIndex.value = null
}

const addPage = () => {
  site.value.pages.push({
    id: Date.now(),
    name: "Nouvelle page",
    style: {},
    sections: []
  })

  currentPageIndex.value = site.value.pages.length - 1
}

const deletePage = (i) => {
  site.value.pages.splice(i, 1)
  currentPageIndex.value = 0
}

/* ================= SECTIONS ================= */
const addSection = (type) => {
  const map = {
    text: { type: "text", content: "Texte..." },
    main: { type: "main", content: "Main..." },
    image: { type: "image", url: "" },
    form: { type: "form" },

    // 🆕 GALLERY
    gallery: {
      type: "gallery",
      images: []
    }
  }

  currentPage.value.sections.push({
    id: Date.now(),
    ...map[type]
  })
}

const deleteSection = (i) => {
  currentPage.value.sections.splice(i, 1)
}

/* ================= IMAGE UPLOAD ================= */
const uploadImage = (e, section) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (ev) => {
    section.url = ev.target.result
  }
  reader.readAsDataURL(file)
}

/* ================= GALLERY UPLOAD ================= */
const uploadGallery = (e, section) => {
  const files = Array.from(e.target.files)

  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      section.images.push(ev.target.result)
    }
    reader.readAsDataURL(file)
  })
}
</script>

<template>
<div class="min-h-screen">

<!-- ================= TOP BAR ================= -->
<div class="fixed top-0 w-full bg-white shadow z-50">

  <!-- MENU -->
  <div class="flex justify-between items-center px-4 py-3 border-b">

    <div class="font-bold">🌐 SaaS Builder</div>

    <div class="flex gap-3 items-center">

      <div v-for="(p,i) in site.pages" :key="p.id" class="flex gap-2 items-center">

        <div
          @click="goToPage(i)"
          class="px-2 py-1 border cursor-pointer"
          :class="currentPageIndex===i ? 'bg-black text-white' : ''"
        >
          {{ p.name }}
        </div>

        <button v-if="mode==='edit'" @click="deletePage(i)" class="text-red-500">✕</button>

      </div>

      <button @click="addPage">➕</button>

    </div>

    <div class="flex gap-2">
      <button @click="mode='edit'" class="bg-black text-white px-3 rounded">Edit</button>
      <button @click="mode='preview'" class="bg-blue-500 text-white px-3 rounded">Preview</button>
    </div>

  </div>

  <!-- TOOLBAR -->
  <div v-if="mode==='edit'" class="p-2 bg-gray-100 flex gap-2">

    <button @click="addSection('text')">Text</button>
    <button @click="addSection('main')">Main</button>
    <button @click="addSection('image')">Image</button>
    <button @click="addSection('form')">Form</button>

    <!-- 🆕 GALLERY BUTTON -->
    <button @click="addSection('gallery')">Gallery</button>

    <!-- CODE BUTTONS -->
    <button @click="showCode = true" class="ml-4 bg-gray-300 px-2 rounded">
      Afficher code
    </button>

    <button v-if="showCode" @click="showCode = false" class="bg-red-400 text-white px-2 rounded">
      Fermer code
    </button>

  </div>

</div>

<!-- ================= CODE VIEW ================= -->
<div v-if="showCode" class="p-4 mt-32 bg-black text-green-400 overflow-auto">

  <pre>{{ currentPage }}</pre>

</div>

<!-- ================= CONTENT ================= -->
<div v-else class="pt-32 p-4">

  <!-- EDIT -->
  <div v-if="mode==='edit'">

    <div
      v-for="(s,i) in currentPage.sections"
      :key="s.id"
      class="border p-3 mb-3"
    >

      <button @click="deleteSection(i)" class="text-red-500 float-right">❌</button>

      <!-- TEXT -->
      <input v-if="s.type==='text'" v-model="s.content" class="border w-full p-2"/>

      <!-- MAIN -->
      <textarea v-if="s.type==='main'" v-model="s.content" class="border w-full min-h-[120px]"/>

      <!-- IMAGE -->
      <div v-if="s.type==='image'">
        <input type="file" @change="uploadImage($event,s)" />
        <img v-if="s.url" :src="s.url" class="w-full mt-2"/>
      </div>

      <!-- FORM -->
      <div v-if="s.type==='form'" class="space-y-2">
        <input placeholder="Nom" class="border w-full p-2"/>
        <input placeholder="Email" class="border w-full p-2"/>
        <textarea placeholder="Message" class="border w-full p-2 min-h-[100px]"/>
      </div>

      <!-- 🆕 GALLERY -->
      <div v-if="s.type==='gallery'">

        <input type="file" multiple @change="uploadGallery($event,s)" />

        <div class="grid grid-cols-3 gap-2 mt-2">
          <img v-for="(img,idx) in s.images" :key="idx" :src="img" class="w-full h-20 object-cover"/>
        </div>

      </div>

    </div>

  </div>

  <!-- PREVIEW -->
  <div v-else>

    <div v-for="s in currentPage.sections" :key="s.id">

      <p v-if="s.type==='text'">{{ s.content }}</p>
      <div v-if="s.type==='main'">{{ s.content }}</div>

      <img v-if="s.type==='image'" :src="s.url"/>

      <!-- FORM -->
      <div v-if="s.type==='form'">
        <input placeholder="Nom" class="border w-full"/>
        <input placeholder="Email" class="border w-full"/>
        <textarea class="border w-full"/>
      </div>

      <!-- 🆕 GALLERY PREVIEW -->
      <div v-if="s.type==='gallery'" class="grid grid-cols-3 gap-2">
        <img v-for="(img,i) in s.images" :key="i" :src="img" class="w-full h-20 object-cover"/>
      </div>

    </div>

  </div>

</div>

</div>
</template>
