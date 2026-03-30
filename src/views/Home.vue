<script setup>
import { ref, computed } from "vue"

/* ================= STATE ================= */
const mode = ref("edit")
const selectedSectionId = ref(null)

const site = ref({
  pages: [
    {
      id: 1,
      name: "Accueil",
      sections: [
        {
          id: 1,
          type: "hero",
          content: "Bienvenue sur mon site",
          style: "text-center text-3xl font-bold",
          bg: "",
          color: ""
        }
      ]
    }
  ]
})

const currentPage = computed(() => site.value.pages[0])

/* ================= SELECT SECTION ================= */
const selectSection = (id) => {
  selectedSectionId.value = id
}

const selectedSection = computed(() =>
  currentPage.value.sections.find(s => s.id === selectedSectionId.value)
)

/* ================= SECTIONS ================= */
const addSection = (type) => {
  const base = {
    id: Date.now(),
    style: "",
    bg: "",
    color: ""
  }

  const map = {
    hero: { ...base, type: "hero", content: "Hero section" },
    text: { ...base, type: "text", content: "Texte..." },
    image: { ...base, type: "image", url: "" },
    spacer: { ...base, type: "spacer" },

    form: {
      ...base,
      type: "form",
      fields: {
        name: "",
        email: "",
        message: ""
      }
    },

    gallery: {
      ...base,
      type: "gallery",
      images: []
    },

    container: {
      ...base,
      type: "container",
      children: []
    }
  }

  currentPage.value.sections.push(map[type])
}

/* ================= DELETE ================= */
const deleteSection = (id) => {
  currentPage.value.sections =
    currentPage.value.sections.filter(s => s.id !== id)
}

/* ================= IMAGE ================= */
const uploadImage = (e, section) => {
  const file = e.target.files[0]
  const reader = new FileReader()
  reader.onload = (ev) => section.url = ev.target.result
  reader.readAsDataURL(file)
}

/* ================= GALLERY ================= */
const uploadGallery = (e, section) => {
  const files = Array.from(e.target.files)
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (ev) => section.images.push(ev.target.result)
    reader.readAsDataURL(file)
  })
}
</script>

<template>
<div class="h-screen flex flex-col">

<!-- ================= TOP BAR ================= -->
<div class="bg-black text-white flex justify-between p-3">

  <div class="font-bold">⚡ Webflow SaaS Builder</div>

  <div class="flex gap-2">
    <button @click="mode='edit'" class="px-3 bg-gray-700 rounded">Edit</button>
    <button @click="mode='preview'" class="px-3 bg-blue-600 rounded">Preview</button>
  </div>

</div>

<!-- ================= TOOLBAR ================= -->
<div v-if="mode==='edit'" class="bg-gray-100 p-2 flex gap-2 flex-wrap">

  <button @click="addSection('hero')">Hero</button>
  <button @click="addSection('text')">Text</button>
  <button @click="addSection('image')">Image</button>
  <button @click="addSection('form')">Form</button>
  <button @click="addSection('gallery')">Gallery</button>
  <button @click="addSection('container')">Container</button>
  <button @click="addSection('spacer')">Spacer</button>

</div>

<!-- ================= EDIT PANEL ================= -->
<div v-if="mode==='edit' && selectedSection" class="bg-white border p-2">

  <div class="font-bold mb-2">Style Editor</div>

  <input v-model="selectedSection.style" placeholder="Tailwind classes"
         class="border w-full p-1 mb-2"/>

  <input v-model="selectedSection.bg" placeholder="Background color"
         class="border w-full p-1 mb-2"/>

  <input v-model="selectedSection.color" placeholder="Text color"
         class="border w-full p-1"/>

</div>

<!-- ================= CONTENT ================= -->
<div class="flex-1 overflow-auto p-4">

  <!-- EDIT MODE -->
  <div v-if="mode==='edit'">

    <div
      v-for="s in currentPage.sections"
      :key="s.id"
      @click="selectSection(s.id)"
      class="border p-4 mb-3 cursor-pointer"
      :class="selectedSectionId===s.id ? 'ring-2 ring-blue-500' : ''"
      :style="{ background: s.bg, color: s.color }"
    >

      <button @click.stop="deleteSection(s.id)" class="text-red-500 float-right">✕</button>

      <!-- HERO -->
      <h1 v-if="s.type==='hero'" :class="s.style">
        {{ s.content }}
      </h1>

      <!-- TEXT -->
      <p v-if="s.type==='text'" :class="s.style">
        {{ s.content }}
      </p>

      <!-- IMAGE -->
      <div v-if="s.type==='image'">
        <input type="file" @change="uploadImage($event,s)" />
        <img v-if="s.url" :src="s.url" class="mt-2 max-w-full"/>
      </div>

      <!-- FORM -->
      <div v-if="s.type==='form'" class="flex flex-col">
        <input placeholder="Nom" class="border p-2 mb-2"/>
        <input placeholder="Email" class="border p-2 mb-2"/>
        <textarea placeholder="Message" class="border p-2 mb-2"/>
        <div class="flex justify-end gap-2">
          <button class="bg-green-500 text-white px-3">OK</button>
          <button class="bg-gray-300 px-3">Annuler</button>
        </div>
      </div>

      <!-- GALLERY -->
      <div v-if="s.type==='gallery'">
        <input type="file" multiple @change="uploadGallery($event,s)" />
        <div class="grid grid-cols-3 gap-2 mt-2">
          <img v-for="(img,i) in s.images" :key="i" :src="img"/>
        </div>
      </div>

      <!-- SPACER -->
      <div v-if="s.type==='spacer'" class="h-10"></div>

    </div>

  </div>

  <!-- PREVIEW MODE -->
  <div v-else>

    <div v-for="s in currentPage.sections" :key="s.id">

      <h1 v-if="s.type==='hero'" :class="s.style">{{ s.content }}</h1>
      <p v-if="s.type==='text'">{{ s.content }}</p>

      <img v-if="s.type==='image'" :src="s.url"/>

      <div v-if="s.type==='form'">
        <input placeholder="Nom" class="border p-2 mb-2 w-full"/>
        <input placeholder="Email" class="border p-2 mb-2 w-full"/>
        <textarea class="border p-2 w-full mb-2"/>
        <button class="bg-green-500 text-white px-3">Envoyer</button>
      </div>

      <div v-if="s.type==='gallery'" class="grid grid-cols-3 gap-2">
        <img v-for="(img,i) in s.images" :key="i" :src="img"/>
      </div>

    </div>

  </div>

</div>

</div>
</template>
