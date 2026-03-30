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
const isSaved = ref(true)
const showAddMenu = ref(false)

/* ================= LOAD ================= */
onMounted(() => {
  const saved = localStorage.getItem("siteData")
  if (saved) site.value = JSON.parse(saved)
})

watch(site, () => {
  isSaved.value = false
}, { deep: true })

/* ================= SAVE ================= */
const saveSite = () => {
  localStorage.setItem("siteData", JSON.stringify(site.value))
  isSaved.value = true
  alert("✅ Sauvegardé")
}

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
    style: {},
    sections: []
  })
}

/* ================= SECTIONS ================= */
const addSection = (type) => {
  const map = {
    text: { type: "text", content: "Texte...", style: {} },
    main: { type: "main", content: "Section...", style: {} },
    image: { type: "image", url: "" },
    form: { type: "form", style: {} }
  }

  currentPage.value.sections.push({
    id: Date.now(),
    ...map[type]
  })

  showAddMenu.value = false
}

/* ================= IMAGE FIX ================= */
const uploadImage = (e, section) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()

  reader.onload = (event) => {
    section.url = event.target.result
  }

  reader.readAsDataURL(file)
}

/* ================= STYLE SECTION ================= */
const activeSection = computed(() =>
  currentPage.value.sections?.[activeSectionIndex.value]
)

const setStyle = (type, value=null) => {
  const s = activeSection.value
  if (!s) return

  s.style ||= {}

  if (type === "bold") s.style.fontWeight = s.style.fontWeight === "bold" ? "normal" : "bold"
  if (type === "italic") s.style.fontStyle = s.style.fontStyle === "italic" ? "normal" : "italic"
  if (type === "align") s.style.textAlign = value
  if (type === "color") s.style.color = value
}

/* ================= STYLE PAGE ================= */
const setPageStyle = (type, value) => {
  currentPage.value.style ||= {}

  if (type === "bg") currentPage.value.style.backgroundColor = value
  if (type === "color") currentPage.value.style.color = value
  if (type === "align") currentPage.value.style.textAlign = value
}

/* ================= PREVIEW ================= */
const goPreview = () => {
  if (!isSaved.value) {
    alert("⚠️ Sauvegarde avant")
    return
  }
  mode.value = "preview"
}
</script>

<template>
<div class="min-h-screen">

<!-- ================= NAVBAR ================= -->
<div class="fixed top-0 w-full bg-white shadow z-50">

  <!-- MENU -->
  <div class="flex justify-between items-center px-4 py-3 border-b">

    <div class="font-bold">🌐 Mon Site</div>

    <div class="flex gap-4">

      <div
        v-for="(p,i) in site.pages"
        :key="p.id"
        @click="goToPage(i)"
        class="cursor-pointer"
        :class="currentPageIndex===i ? 'text-blue-600 font-bold' : ''"
      >
        {{ p.name }}
      </div>

      <button @click="addPage">➕</button>

    </div>

    <!-- ACTIONS -->
    <div class="flex gap-2">

      <button @click="saveSite" class="bg-green-500 text-white px-3 rounded">
        💾
      </button>

      <button @click="goPreview" class="bg-blue-500 text-white px-3 rounded">
        👁
      </button>

      <button v-if="mode==='preview'" @click="mode='edit'" class="bg-black text-white px-3 rounded">
        ✏️
      </button>

    </div>

  </div>

  <!-- ================= TOOLBAR ================= -->
  <div v-if="mode==='edit'" class="p-2 bg-gray-100 flex flex-wrap gap-2">

    <!-- ADD MENU -->
    <div class="relative">
      <button @click="showAddMenu = !showAddMenu" class="btn">➕ Ajouter</button>

      <div v-if="showAddMenu" class="absolute bg-white shadow p-2 mt-1 rounded z-50">

        <div @click="addSection('text')" class="item">📝 Texte</div>
        <div @click="addSection('main')" class="item">📦 Section</div>
        <div @click="addSection('image')" class="item">🖼 Image</div>
        <div @click="addSection('form')" class="item">📩 Formulaire</div>

      </div>
    </div>

    <!-- SECTION STYLE -->
    <div v-if="activeSection" class="flex gap-2 ml-4">
      <button @click="setStyle('bold')" class="btn">B</button>
      <button @click="setStyle('italic')" class="btn">I</button>

      <input type="color" @input="setStyle('color',$event.target.value)" />
    </div>

    <!-- PAGE STYLE -->
    <div class="flex gap-2 ml-6">
      🎨 Page:
      <input type="color" @input="setPageStyle('bg',$event.target.value)" />
      <input type="color" @input="setPageStyle('color',$event.target.value)" />

      <button @click="setPageStyle('align','left')" class="btn">⬅</button>
      <button @click="setPageStyle('align','center')" class="btn">⬛</button>
      <button @click="setPageStyle('align','right')" class="btn">➡</button>
    </div>

  </div>

</div>

<!-- ================= CONTENT ================= -->
<div class="pt-28 p-4" :style="currentPage.style">

  <!-- EDIT -->
  <div v-if="mode==='edit'">

    <div
      v-for="(s,i) in currentPage.sections"
      :key="s.id"
      class="bg-white p-4 mb-3 rounded shadow"
      @click="activeSectionIndex=i"
      :style="s.style"
    >

      <button @click.stop="currentPage.sections.splice(i,1)" class="float-right text-red-500">
        ❌
      </button>

      <input v-if="s.type==='text'" v-model="s.content" class="w-full border p-2"/>

      <textarea v-if="s.type==='main'" v-model="s.content" class="w-full min-h-[200px] border"/>

      <!-- IMAGE FIX -->
      <div v-if="s.type==='image'">
        <input type="file" @change="uploadImage($event,s)" />
        <img v-if="s.url" :src="s.url" class="w-full mt-2"/>
      </div>

      <!-- FORM -->
      <div v-if="s.type==='form'" class="space-y-2">
        <input placeholder="Nom" class="border p-2 w-full"/>
        <input placeholder="Email" class="border p-2 w-full"/>
        <textarea placeholder="Message" class="border p-2 w-full"></textarea>
        <button class="bg-blue-500 text-white px-4 py-2 rounded">
          Envoyer
        </button>
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
        <input placeholder="Nom" class="border p-2 w-full"/>
        <input placeholder="Email" class="border p-2 w-full"/>
        <textarea placeholder="Message" class="border p-2 w-full"></textarea>
        <button class="bg-blue-500 text-white px-4 py-2 rounded">
          Envoyer
        </button>
      </div>

    </div>

  </div>

</div>
</div>
</template>

<style scoped>
.btn {
  background: white;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.item {
  padding: 6px;
  cursor: pointer;
}
.item:hover {
  background: #f3f4f6;
}
</style>
