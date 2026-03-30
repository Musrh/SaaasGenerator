<script setup>
import { ref, computed, onMounted, watch } from "vue"

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

/* ================= CURRENT PAGE ================= */
const currentPage = computed(() => {
  return site.value.pages[currentPageIndex.value] || site.value.pages[0]
})

const activeSection = computed(() => {
  return currentPage.value?.sections?.[activeSectionIndex.value]
})

/* ================= LOAD ================= */
onMounted(() => {
  const saved = localStorage.getItem("siteData")
  if (saved) site.value = JSON.parse(saved)
})

watch(site, () => {}, { deep: true })

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
  if (site.value.pages.length === 0) {
    site.value.pages.push({
      id: Date.now(),
      name: "Nouvelle page",
      style: {},
      sections: []
    })
  }
  currentPageIndex.value = 0
}

/* ================= SECTIONS ================= */
const addSection = (type) => {
  const map = {
    text: { type: "text", content: "Texte..." },
    main: { type: "main", content: "Section principale..." },
    image: { type: "image", url: "" },
    form: { type: "form" }
  }

  currentPage.value.sections.push({
    id: Date.now(),
    ...map[type]
  })
}

const deleteSection = (i) => {
  currentPage.value.sections.splice(i, 1)
}

/* ================= STYLE ================= */
const setStyle = (type, value = null) => {
  const s = activeSection.value
  if (!s) return

  s.style ||= {}

  if (type === "bold") {
    s.style.fontWeight = s.style.fontWeight === "bold" ? "normal" : "bold"
  }

  if (type === "italic") {
    s.style.fontStyle = s.style.fontStyle === "italic" ? "normal" : "italic"
  }

  if (type === "color") {
    s.style.color = value
  }
}

const setPageStyle = (type, value) => {
  currentPage.value.style ||= {}
  if (type === "bg") currentPage.value.style.backgroundColor = value
  if (type === "color") currentPage.value.style.color = value
}

/* ================= IMAGE ================= */
const uploadImage = (e, section) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (ev) => {
    section.url = ev.target.result
  }
  reader.readAsDataURL(file)
}
</script>

<template>
<div class="min-h-screen">

<!-- ================= TOP BAR ================= -->
<div class="fixed top-0 w-full bg-white shadow z-50">

  <div v-if="mode==='edit'" class="p-2 bg-gray-100 flex gap-2 flex-wrap border-b">

    <button @click="addSection('text')">Text</button>
    <button @click="addSection('main')">Main</button>
    <button @click="addSection('image')">Image</button>
    <button @click="addSection('form')">Form</button>

    <div v-if="activeSection" class="flex gap-2 ml-4">
      <button @click="setStyle('bold')">B</button>
      <button @click="setStyle('italic')">I</button>
      <input type="color" @input="setStyle('color',$event.target.value)" />
    </div>

    <div class="flex gap-2 ml-4">
      🎨
      <input type="color" @input="setPageStyle('bg',$event.target.value)" />
      <input type="color" @input="setPageStyle('color',$event.target.value)" />
    </div>

  </div>

  <!-- MENU -->
  <div class="flex justify-between items-center px-4 py-3 border-b">

    <div class="font-bold">🌐 SaaS Builder</div>

    <div class="flex gap-3 items-center">

      <div v-for="(p,i) in site.pages" :key="p.id" class="flex items-center gap-2">

        <div
          @click="goToPage(i)"
          class="cursor-pointer px-2 py-1 border rounded"
          :class="currentPageIndex===i ? 'bg-black text-white' : ''"
        >
          {{ p.name }}
        </div>

        <input v-model="p.name" class="border px-2 text-sm w-28"/>

        <button v-if="mode==='edit'" @click="deletePage(i)" class="text-red-500">✕</button>

      </div>

      <button @click="addPage">➕</button>

    </div>

    <div class="flex gap-2">
      <button @click="mode='edit'" class="bg-black text-white px-3 rounded">✏️</button>
      <button @click="mode='preview'" class="bg-blue-500 text-white px-3 rounded">👁</button>
    </div>

  </div>

</div>

<!-- ================= CONTENT ================= -->
<div class="pt-32 p-4" :style="currentPage?.style">

  <!-- EDIT -->
  <div v-if="mode==='edit'">

    <div
      v-for="(s,i) in currentPage.sections"
      :key="s.id"
      class="border p-4 mb-3 rounded"
      @click="activeSectionIndex=i"
      :style="s.style"
    >

      <button @click.stop="deleteSection(i)" class="text-red-500 float-right">❌</button>

      <input v-if="s.type==='text'" v-model="s.content" class="border w-full p-2"/>

      <textarea v-if="s.type==='main'" v-model="s.content" class="w-full min-h-[180px] border"/>

      <div v-if="s.type==='image'">
        <input type="file" @change="uploadImage($event,s)" />
        <img v-if="s.url" :src="s.url" class="w-full mt-2"/>
      </div>

      <!-- ================= FORMULAIRE CORRIGÉ ================= -->
      <div v-if="s.type==='form'" class="space-y-3">

        <input placeholder="Nom" class="border w-full p-2 rounded"/>

        <input placeholder="Email" class="border w-full p-2 rounded"/>

        <textarea
          placeholder="Message"
          class="border w-full p-2 rounded min-h-[120px]"
        ></textarea>

        <div class="flex justify-end gap-2 pt-2">

          <button class="bg-green-500 text-white px-4 py-1 rounded">
            Ok
          </button>

          <button class="bg-gray-300 px-4 py-1 rounded">
            Annuler
          </button>

        </div>

      </div>

    </div>

  </div>

  <!-- PREVIEW -->
  <div v-else>

    <div v-for="s in currentPage.sections" :key="s.id" :style="s.style">

      <p v-if="s.type==='text'">{{ s.content }}</p>
      <div v-if="s.type==='main'">{{ s.content }}</div>
      <img v-if="s.type==='image'" :src="s.url"/>

      <!-- FORM PREVIEW -->
      <div v-if="s.type==='form'" class="space-y-3">

        <input placeholder="Nom" class="border w-full p-2 rounded"/>

        <input placeholder="Email" class="border w-full p-2 rounded"/>

        <textarea
          placeholder="Message"
          class="border w-full p-2 rounded min-h-[120px]"
        ></textarea>

        <div class="flex justify-end gap-2 pt-2">

          <button class="bg-green-500 text-white px-4 py-1 rounded">
            Ok
          </button>

          <button class="bg-gray-300 px-4 py-1 rounded">
            Annuler
          </button>

        </div>

      </div>

    </div>

  </div>

</div>

</div>
</template>
