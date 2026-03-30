<template>
  <div class="h-screen flex bg-gray-100">

    <!-- LEFT PANEL -->
    <div v-if="mode === 'edit'" class="w-64 bg-white border-r p-4 overflow-y-auto">

      <h2 class="font-bold mb-3">📄 Pages</h2>

      <div
        v-for="(p, i) in pages"
        :key="p.id"
        @click="currentPageIndex = i"
        class="p-2 rounded cursor-pointer mb-1"
        :class="currentPageIndex === i ? 'bg-blue-100 font-bold' : ''"
      >
        {{ p.name }}
      </div>

      <button @click="addPage" class="w-full mt-2 bg-green-500 text-white p-2 rounded">
        + Page
      </button>

      <hr class="my-4" />

      <h2 class="font-bold mb-2">🧱 Ajouter section</h2>

      <select v-model="selectedSectionType" class="w-full border p-2 mb-2 rounded">
        <option disabled value="">Choisir une section</option>
        <option v-for="name in filteredSections" :key="name" :value="name">
          {{ name }}
        </option>
      </select>

      <button @click="addSelectedSection" class="w-full bg-blue-500 text-white p-2 rounded">
        Ajouter
      </button>

    </div>

    <!-- CENTER -->
    <div class="flex-1 flex flex-col">

      <!-- TOP BAR -->
      <div v-if="mode === 'edit'" class="bg-white border-b p-3 flex gap-2">

        <button @click="saveData" class="bg-green-500 text-white px-3 py-1 rounded">
          💾 Save
        </button>

        <button @click="mode='preview'" class="bg-blue-500 text-white px-3 py-1 rounded">
          👁 Preview
        </button>

        <button @click="mode='edit'" class="bg-gray-500 text-white px-3 py-1 rounded">
          ✏ Edit
        </button>

      </div>

      <!-- CANVAS -->
      <div class="flex-1 overflow-y-auto p-6">

        <div class="w-full bg-white shadow rounded p-6">

          <LogoSection />
          <HeaderSection />
          <MenuSection />

          <!-- MAIN SECTION (FULL WIDTH + 500px) -->
          <div class="w-full">
            <textarea
              v-if="mode==='edit'"
              v-model="pages[currentPageIndex].content"
              class="w-full h-[500px] border p-3 text-lg"
              placeholder="Main section..."
            />

            <div v-else v-html="pages[currentPageIndex].content"></div>
          </div>

          <!-- SECTIONS -->
          <div
            v-for="section in pages[currentPageIndex].sections"
            :key="section.id"
            class="border mb-3 p-3 relative rounded"
            :style="section.props.style"
          >

            <!-- DELETE -->
            <button
              v-if="mode==='edit'"
              @click.stop="deleteSection(section.id)"
              class="absolute top-1 right-1 text-red-500"
            >
              ✕
            </button>

            <!-- TOOLBAR -->
            <div v-if="mode==='edit'" class="flex gap-2 mb-2 text-xs flex-wrap">

              <button @click="setAlign(section,'left')" class="px-2 bg-gray-200">⬅</button>
              <button @click="setAlign(section,'center')" class="px-2 bg-gray-200">⬌</button>
              <button @click="setAlign(section,'right')" class="px-2 bg-gray-200">➡</button>

              <button @click="toggleBold(section)" class="px-2 bg-gray-200">B</button>
              <button @click="toggleItalic(section)" class="px-2 bg-gray-200">I</button>
              <button @click="toggleUnderline(section)" class="px-2 bg-gray-200">U</button>

              <input type="color" @input="e => setColor(section,e)" />
              <input type="color" @input="e => setBg(section,e)" />

            </div>

            <!-- IMAGE -->
            <div v-if="section.type==='ImageSection'">

              <input v-if="mode==='edit'" type="file" @change="uploadImage($event, section)" />

              <img v-if="section.props.src" :src="section.props.src" class="w-full rounded" />

            </div>

            <!-- TEXT -->
            <textarea
              v-if="mode==='edit' && section.type!=='ImageSection'"
              v-model="section.props.content"
              class="w-full border p-2"
              :style="section.props.style"
            />

            <div v-else-if="section.type!=='ImageSection'" v-html="section.props.content"></div>

          </div>

          <FooterSection />

        </div>
      </div>

    </div>

    <!-- RIGHT PANEL -->
    <div v-if="mode==='edit'" class="w-72 bg-white border-l p-4">
      <h2 class="font-bold mb-3">📁 Sections</h2>
      <p class="text-xs text-gray-500">Builder actif</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"

import LogoSection from "../components/sections/LogoSection.vue"
import HeaderSection from "../components/sections/HeaderSection.vue"
import MenuSection from "../components/sections/MenuSection.vue"
import FooterSection from "../components/sections/FooterSection.vue"

const mode = ref("edit")

const pages = ref([])
const currentPageIndex = ref(0)

const selectedSectionType = ref("")

onMounted(() => {
  const saved = localStorage.getItem("builderData")

  pages.value = saved ? JSON.parse(saved) : [{
    id: 1,
    name: "Accueil",
    content: "",
    sections: []
  }]
})

const saveData = () => {
  localStorage.setItem("builderData", JSON.stringify(pages.value))
  alert("Saved")
}

const addPage = () => {
  pages.value.push({
    id: Date.now(),
    name: "Page",
    content: "",
    sections: []
  })
}

const filteredSections = computed(() => {
  return ["TextSection", "ImageSection", "BannerSection"]
})

const addSelectedSection = () => {
  pages.value[currentPageIndex.value].sections.push({
    id: Date.now(),
    type: selectedSectionType.value,
    props: {
      content: "",
      style: {}
    }
  })
}

const deleteSection = (id) => {
  const page = pages.value[currentPageIndex.value]
  page.sections = page.sections.filter(s => s.id !== id)
}

/* IMAGE UPLOAD FIX */
const uploadImage = (e, section) => {
  const file = e.target.files[0]
  const reader = new FileReader()

  reader.onload = () => {
    section.props.src = reader.result
  }

  reader.readAsDataURL(file)
}

/* TEXT STYLE */
const setAlign = (section, value) => {
  section.props.style.textAlign = value
}

const toggleBold = (section) => {
  section.props.style.fontWeight =
    section.props.style.fontWeight === "bold" ? "normal" : "bold"
}

const toggleItalic = (section) => {
  section.props.style.fontStyle =
    section.props.style.fontStyle === "italic" ? "normal" : "italic"
}

const toggleUnderline = (section) => {
  section.props.style.textDecoration =
    section.props.style.textDecoration === "underline" ? "none" : "underline"
}

const setColor = (section, e) => {
  section.props.style.color = e.target.value
}

const setBg = (section, e) => {
  section.props.style.backgroundColor = e.target.value
}
</script>
