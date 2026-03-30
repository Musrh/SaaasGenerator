<script setup>
import { ref, watch } from "vue"
import { db } from "../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"

const props = defineProps({ uid: String })

/* ================= STATE ================= */
const site = ref({
  plan: "free",
  theme: {
    background: "#ffffff",
    text: "#111"
  },
  pages: [],
  menu: []
})

const mode = ref("edit")
const currentPageIndex = ref(0)
const activeSectionIndex = ref(null)

/* ================= LOAD ================= */
const loadSite = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid))

  if (snap.exists()) {
    const data = snap.data()

    site.value = {
      ...site.value,
      pages: data.pages || [{
        name: "Accueil",
        sections: []
      }],
      menu: data.menu || ["Accueil"]
    }
  }
}

watch(() => props.uid, (v) => v && loadSite(v), { immediate: true })

/* ================= PAGE ================= */
const addPage = () => {
  site.value.pages.push({
    name: "Nouvelle page",
    sections: []
  })
}

const deletePage = (i) => {
  site.value.pages.splice(i, 1)
  currentPageIndex.value = 0
}

/* ================= MENU ================= */
const addMenuItem = () => {
  site.value.menu.push("Nouvelle page")
}

const deleteMenuItem = (i) => {
  site.value.menu.splice(i, 1)
}

/* ================= SECTION ================= */
const addSection = (type) => {
  const map = {
    text: { type: "text", content: "Texte..." },
    main: { type: "main", content: "Main..." },
    image: { type: "image", url: "" }
  }

  site.value.pages[currentPageIndex.value].sections.push({
    id: Date.now(),
    ...map[type]
  })
}

const deleteSection = (i) => {
  site.value.pages[currentPageIndex.value].sections.splice(i, 1)
}

/* ================= DRAG DROP ================= */
const dragIndex = ref(null)

const dragStart = (i) => {
  dragIndex.value = i
}

const drop = (i) => {
  const list = site.value.pages[currentPageIndex.value].sections
  const item = list.splice(dragIndex.value, 1)[0]
  list.splice(i, 0, item)
}

/* ================= SAVE ================= */
const saveSite = async () => {
  await updateDoc(doc(db, "users", props.uid), {
    pages: site.value.pages,
    menu: site.value.menu
  })

  alert("Saved ✔")
}

/* ================= VIEW CODE ================= */
const viewCode = () => {
  const s = site.value.pages[currentPageIndex.value].sections[activeSectionIndex.value]

  const code = `<div>${s.content || ""}</div>`

  const url = `/section-code.html?code=${encodeURIComponent(code)}`
  window.open(url, "_blank")
}

/* ================= MENU NAV ================= */
const goToPage = (name) => {
  const index = site.value.pages.findIndex(p => p.name === name)
  if (index !== -1) currentPageIndex.value = index
}
</script>

<template>
<div class="min-h-screen" :style="{background:site.theme.background,color:site.theme.text}">

<!-- 🔥 TOP BAR -->
<div class="fixed top-0 w-full bg-white p-2 flex justify-between">

  <div class="flex gap-2">
    <button @click="addSection('text')" class="border px-2">Text</button>
    <button @click="addSection('image')" class="border px-2">Image</button>
    <button @click="addSection('main')" class="border px-2">Main</button>
  </div>

  <div class="flex gap-2">
    <button @click="saveSite" class="bg-green-500 text-white px-3">Save</button>
    <button @click="mode='preview'" class="bg-blue-500 text-white px-3">Preview</button>
    <button @click="mode='edit'" class="border px-3">Edit</button>
  </div>

</div>

<div class="pt-16 p-4">

<!-- 🔥 MENU -->
<div class="flex gap-4 mb-6 border-b pb-2">

  <div
    v-for="(m,i) in site.menu"
    :key="i"
    @click="goToPage(m)"
    class="cursor-pointer"
  >
    {{ m }}
  </div>

</div>

<!-- 🔥 EDIT MENU -->
<div v-if="mode==='edit'" class="mb-4">
  <button @click="addMenuItem">+ Menu</button>

  <div v-for="(m,i) in site.menu" :key="i">
    <input v-model="site.menu[i]" class="border"/>
    <button @click="deleteMenuItem(i)">✕</button>
  </div>
</div>

<!-- 🔥 PAGES -->
<div class="mb-4">
  <button @click="addPage">+ Page</button>

  <div v-for="(p,i) in site.pages" :key="i">
    <input v-model="p.name" class="border"/>
    <button @click="deletePage(i)">✕</button>
  </div>
</div>

<!-- 🔥 SECTIONS -->
<div v-if="mode==='edit'">

  <div
    v-for="(s,i) in site.pages[currentPageIndex].sections"
    :key="s.id"
    draggable="true"
    @dragstart="dragStart(i)"
    @drop="drop(i)"
    @dragover.prevent
    class="border p-3 mb-3"
    @click="activeSectionIndex=i"
  >

    <button @click.stop="deleteSection(i)" class="text-red-500">✕</button>

    <textarea
      v-if="s.type==='text' || s.type==='main'"
      v-model="s.content"
      class="w-full min-h-[120px]"
      style="white-space: pre-wrap"
    />

    <div v-if="s.type==='image'">
      <input type="file" @change="e=>{
        const r=new FileReader()
        r.onload=()=>s.url=r.result
        r.readAsDataURL(e.target.files[0])
      }"/>
      <img v-if="s.url" :src="s.url"/>
    </div>

  </div>

  <button @click="viewCode" class="bg-black text-white px-2">
    Voir code
  </button>

</div>

<!-- 🔥 PREVIEW -->
<div v-else>

  <div v-for="s in site.pages[currentPageIndex].sections">

    <p v-if="s.type==='text'" style="white-space: pre-wrap">
      {{ s.content }}
    </p>

    <div v-if="s.type==='main'" style="white-space: pre-wrap">
      {{ s.content }}
    </div>

    <img v-if="s.type==='image'" :src="s.url"/>

  </div>

</div>

</div>
</div>
</template>
