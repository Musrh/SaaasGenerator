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
const showAddMenu = ref(false)
const isSaved = ref(true)

/* ================= SAFE CURRENT PAGE ================= */
const currentPage = computed(() => {
  return site.value.pages[currentPageIndex.value] || site.value.pages[0]
})

const activeSection = computed(() => {
  return currentPage.value?.sections?.[activeSectionIndex.value]
})

/* ================= LOAD ================= */
onMounted(() => {
  const saved = localStorage.getItem("siteData")
  if (saved) {
    site.value = JSON.parse(saved)
  }
})

watch(site, () => {
  isSaved.value = false
}, { deep: true })

watch(currentPageIndex, () => {
  activeSectionIndex.value = null
})

/* ================= SAVE ================= */
const saveSite = () => {
  localStorage.setItem("siteData", JSON.stringify(site.value))
  isSaved.value = true
}

/* ================= PAGE ================= */
const goToPage = (i) => {
  currentPageIndex.value = i
  activeSectionIndex.value = null
}

/* 🔥 EDIT NAME PAGE */
const renamePage = (i, value) => {
  site.value.pages[i].name = value
}

/* 🔥 ADD PAGE */
const addPage = () => {
  site.value.pages.push({
    id: Date.now(),
    name: "Nouvelle page",
    style: {},
    sections: []
  })

  currentPageIndex.value = site.value.pages.length - 1
}

/* 🔥 DELETE PAGE SAFE */
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

  currentPageIndex.value = Math.max(0, site.value.pages.length - 1)
  activeSectionIndex.value = null
}

/* ================= SECTIONS ================= */
const addSection = (type) => {
  const map = {
    text: { type: "text", content: "Texte...", style: {} },
    main: { type: "main", content: "Section principale...", style: {} },
    image: { type: "image", url: "" },
    form: { type: "form", style: {} }
  }

  currentPage.value.sections.push({
    id: Date.now(),
    ...map[type]
  })

  showAddMenu.value = false
}

/* 🔥 DELETE SECTION */
const deleteSection = (i) => {
  currentPage.value.sections.splice(i, 1)
  activeSectionIndex.value = null
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

  if (type === "align") {
    s.style.textAlign = value
  }
}

/* ================= PAGE STYLE ================= */
const setPageStyle = (type, value) => {
  currentPage.value.style ||= {}

  if (type === "bg") currentPage.value.style.backgroundColor = value
  if (type === "color") currentPage.value.style.color = value
}

/* ================= PREVIEW ================= */
const goPreview = () => {
  mode.value = "preview"
}
</script>

<template>
<div class="min-h-screen">

<!-- ================= NAVBAR ================= -->
<div class="fixed top-0 w-full bg-white shadow z-50">

  <!-- MENU PAGES -->
  <div class="flex justify-between items-center px-4 py-3 border-b">

    <div class="font-bold">🌐 SaaS Builder</div>

    <div class="flex gap-4 items-center">

      <div class="flex gap-3 items-center">

        <div
          v-for="(p,i) in site.pages"
          :key="p.id"
          class="flex items-center gap-2"
        >

          <!-- PAGE BUTTON -->
          <div
            @click="goToPage(i)"
            class="cursor-pointer px-2 py-1 border rounded"
            :class="currentPageIndex===i ? 'bg-black text-white' : ''"
          >
            {{ p.name }}
          </div>

          <!-- EDIT NAME -->
          <input
            v-model="p.name"
            @input="renamePage(i, p.name)"
            class="border px-2 text-sm w-28"
          />

          <!-- DELETE PAGE -->
          <button @click="deletePage(i)" class="text-red-500">✕</button>

        </div>

      </div>

      <button @click="addPage" class="px-2">➕</button>

    </div>

    <div class="flex gap-2">
      <button @click="saveSite" class="bg-green-500 text-white px-3 rounded">💾</button>
      <button @click="goPreview" class="bg-blue-500 text-white px-3 rounded">👁</button>
      <button v-if="mode==='preview'" @click="mode='edit'" class="bg-black text-white px-3 rounded">✏️</button>
    </div>

  </div>

  <!-- TOOLBAR -->
  <div v-if="mode==='edit'" class="p-2 bg-gray-100 flex gap-2 flex-wrap">

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

</div>

<!-- ================= CONTENT ================= -->
<div class="pt-32 p-4" :style="currentPage?.style">

  <!-- EDIT MODE -->
  <div v-if="mode==='edit'">

    <div
      v-for="(s,i) in (currentPage?.sections || [])"
      :key="s.id"
      class="border p-4 mb-3 rounded"
      @click="activeSectionIndex=i"
      :style="s.style"
    >

      <button @click.stop="deleteSection(i)" class="text-red-500 float-right">❌</button>

      <!-- TEXT -->
      <input v-if="s.type==='text'" v-model="s.content" class="border w-full p-2"/>

      <!-- MAIN -->
      <textarea v-if="s.type==='main'" v-model="s.content" class="w-full min-h-[180px] border"/>

      <!-- IMAGE -->
      <div v-if="s.type==='image'">
        <input type="file" @change="uploadImage($event,s)" />
        <img v-if="s.url" :src="s.url" class="w-full mt-2"/>
      </div>

      <!-- FORM -->
      <div v-if="s.type==='form'" class="space-y-2">
        <input placeholder="Nom" class="border w-full p-2"/>
        <input placeholder="Email" class="border w-full p-2"/>
        <textarea placeholder="Message" class="border w-full p-2"/>
        <button class="bg-blue-500 text-white px-3 py-1 rounded">Envoyer</button>
      </div>

    </div>

  </div>

  <!-- PREVIEW -->
  <div v-else>

    <div v-for="s in currentPage.sections" :key="s.id" :style="s.style">

      <p v-if="s.type==='text'">{{ s.content }}</p>
      <div v-if="s.type==='main'">{{ s.content }}</div>
      <img v-if="s.type==='image'" :src="s.url"/>

      <div v-if="s.type==='form'">
        <input placeholder="Nom" class="border w-full"/>
        <input placeholder="Email" class="border w-full"/>
        <textarea class="border w-full"/>
        <button>Envoyer</button>
      </div>

    </div>

  </div>

</div>

</div>
</template>
