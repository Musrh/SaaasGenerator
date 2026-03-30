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
          content: "Bienvenue",
          style: {}
        }
      ]
    }
  ]
})

const mode = ref("edit")
const currentPageIndex = ref(0)
const activeSectionIndex = ref(null)

/* ================= MODAL PAGE ================= */
const showPageModal = ref(false)
const newPageName = ref("")

/* ================= PAGE ACTIVE ================= */
const currentPage = computed(() =>
  site.value.pages[currentPageIndex.value]
)

/* ================= NAV ================= */
const goToPage = (i) => {
  currentPageIndex.value = i
  activeSectionIndex.value = null
}

/* ================= ADD PAGE (FIXED) ================= */
const openAddPageModal = () => {
  newPageName.value = ""
  showPageModal.value = true
}

const confirmAddPage = () => {
  if (!newPageName.value.trim()) return

  site.value.pages.push({
    id: Date.now(),
    name: newPageName.value,
    sections: [
      {
        id: Date.now() + 1,
        type: "text",
        content: "Contenu de " + newPageName.value,
        style: {}
      }
    ]
  })

  currentPageIndex.value = site.value.pages.length - 1
  showPageModal.value = false
}

const cancelAddPage = () => {
  showPageModal.value = false
  newPageName.value = ""
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

/* ================= STYLE ================= */
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
</script>

<template>
<div class="min-h-screen">

<!-- 🔥 TOOLBAR -->
<div v-if="mode==='edit'" class="fixed top-0 w-full bg-white border-b p-2 flex justify-between z-50">

  <div class="flex gap-2">
    <button @click="addSection('text')">Text</button>
    <button @click="addSection('main')">Main</button>
    <button @click="addSection('image')">Image</button>

    <button @click="openAddPageModal" class="border px-2">
      + Page Menu
    </button>
  </div>

  <div>
    <button @click="mode='preview'" class="bg-blue-600 text-white px-3">
      Aperçu
    </button>
  </div>

</div>

<!-- ================= PAGE MODAL ================= -->
<div v-if="showPageModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

  <div class="bg-white p-4 rounded w-80">

    <h3 class="text-lg font-bold mb-2">Nom de la page</h3>

    <input v-model="newPageName" class="border w-full p-2 mb-3" placeholder="Ex: Contact" />

    <div class="flex justify-end gap-2">

      <button @click="cancelAddPage" class="px-3 py-1 border">
        Annuler
      </button>

      <button @click="confirmAddPage" class="px-3 py-1 bg-green-600 text-white">
        OK
      </button>

    </div>

  </div>

</div>

<!-- ================= CONTENT ================= -->
<div class="pt-20 p-4">

<!-- 🔥 MENU -->
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

<!-- ================= EDIT ================= -->
<div v-if="mode==='edit'">

  <div
    v-for="(s,i) in currentPage.sections"
    :key="s.id"
    class="border p-3 mb-2 cursor-pointer"
    @click="activeSectionIndex=i"
  >

    <button @click.stop="deleteSection(i)" class="text-red-500 float-right">✕</button>

    <input v-if="s.type==='text'" v-model="s.content" class="border w-full"/>

    <textarea v-if="s.type==='main'" v-model="s.content" class="w-full min-h-[200px] border"/>

    <div v-if="s.type==='image'">
      <input type="file" @change="e => uploadImage(e, s)" />
      <img v-if="s.url" :src="s.url" class="mt-2 max-w-full"/>
    </div>

  </div>

</div>

<!-- ================= PREVIEW ================= -->
<div v-else class="pt-10">

  <div class="fixed top-0 w-full bg-black text-white p-2 flex justify-between z-50">
    <span>Mode Aperçu</span>
    <button @click="mode='edit'" class="bg-white text-black px-3 py-1">
      Retour Edit
    </button>
  </div>

  <div class="pt-10">

    <div v-for="s in currentPage.sections" :key="s.id">

      <p v-if="s.type==='text'">{{ s.content }}</p>

      <div v-if="s.type==='main'">{{ s.content }}</div>

      <img v-if="s.type==='image'" :src="s.url"/>

    </div>

  </div>

</div>

</div>
</div>
</template>
