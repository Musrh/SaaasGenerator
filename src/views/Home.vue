<script setup>
import { ref, watch, computed } from "vue"
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
  pages: []
})

const activePageIndex = ref(0)
const activeSectionIndex = ref(null)
const mode = ref("edit")
const showCode = ref(false)
const loading = ref(false)
const error = ref("")

/* ================= LOAD ================= */
const loadSite = async (uid) => {
  if (!uid) return

  loading.value = true

  const snap = await getDoc(doc(db, "users", uid))

  if (snap.exists()) {
    const data = snap.data()

    site.value = {
      plan: data.plan || "free",
      theme: data.theme || site.value.theme,
      pages: data.pages || [
        {
          name: "Home",
          menuName: "Home",
          sections: []
        }
      ]
    }
  } else {
    error.value = "Site introuvable"
  }

  loading.value = false
}

watch(() => props.uid, v => v && loadSite(v), { immediate: true })

/* ================= CURRENT PAGE ================= */
const currentPage = computed(() =>
  site.value.pages[activePageIndex.value]
)

/* ================= SAVE ================= */
const saveSite = async () => {
  await updateDoc(doc(db, "users", props.uid), {
    plan: site.value.plan,
    theme: site.value.theme,
    pages: site.value.pages
  })

  alert("Saved ✔")
}

/* ================= MENU ================= */
const addPage = () => {
  site.value.pages.push({
    name: "New Page",
    menuName: "New Page",
    sections: []
  })
}

const deletePage = (i) => {
  site.value.pages.splice(i, 1)
  if (activePageIndex.value >= site.value.pages.length) {
    activePageIndex.value = 0
  }
}

/* ================= SYNC MENU NAME ================= */
const syncMenuName = (page) => {
  page.name = page.menuName
}

/* ================= SECTIONS ================= */
const addSection = (type) => {
  const page = currentPage.value

  const map = {
    hero: { id: Date.now(), type: "hero", title: "Hero", style: {} },
    text: { id: Date.now(), type: "text", content: "" },
    main: { id: Date.now(), type: "main", content: "" },
    footer: { id: Date.now(), type: "footer", text: "" },
    image: { id: Date.now(), type: "image", url: "" }
  }

  page.sections.push(map[type])
}

const deleteSection = (i) => {
  currentPage.value.sections.splice(i, 1)
}

/* ================= STYLE ================= */
const setStyle = (section, type) => {
  section.style = section.style || {}

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

const setAlign = (section, val) => {
  section.style = section.style || {}
  section.style.textAlign = val
}

/* ================= CODE VIEW ================= */
const getPageCode = () => {
  return JSON.stringify(currentPage.value, null, 2)
}
</script>

<template>
  <div class="min-h-screen" :style="site.theme">

    <!-- ================= TOP BAR ================= -->
    <div class="fixed top-0 left-0 w-full bg-white border-b p-2 z-50 flex flex-wrap gap-2">

      <!-- MENU PAGES -->
      <div class="flex gap-2 items-center">
        <button
          v-for="(p,i) in site.pages"
          :key="i"
          @click="activePageIndex=i"
          class="border px-2"
        >
          {{ p.menuName }}
        </button>

        <button @click="addPage">＋ Page</button>
      </div>

      <!-- EDIT PAGE NAME -->
      <div v-if="currentPage" class="flex gap-2">
        <input v-model="currentPage.menuName" @input="syncMenuName(currentPage)" />
        <button @click="deletePage(activePageIndex)">🗑</button>
      </div>

      <!-- ACTIONS -->
      <div class="ml-auto flex gap-2">
        <button @click="mode='edit'">Edit</button>
        <button @click="mode='preview'">Preview</button>
        <button @click="saveSite">Save</button>
        <button @click="showCode=true">Code</button>
      </div>
    </div>

    <!-- ================= CODE VIEWER ================= -->
    <div v-if="showCode" class="fixed inset-0 bg-black/80 z-50 p-10">

      <button @click="showCode=false" class="bg-red-500 text-white px-3 mb-3">
        Close
      </button>

      <pre class="bg-white p-4 overflow-auto h-full">
{{ getPageCode() }}
      </pre>

    </div>

    <!-- ================= CONTENT ================= -->
    <div class="pt-20 p-4">

      <!-- ================= EDIT ================= -->
      <div v-if="mode==='edit'">

        <button @click="addSection('hero')">Hero</button>
        <button @click="addSection('text')">Text</button>
        <button @click="addSection('main')">Main</button>
        <button @click="addSection('footer')">Footer</button>
        <button @click="addSection('image')">Image</button>

        <div
          v-for="(s,i) in currentPage.sections"
          :key="s.id"
          class="border p-3 mt-3"
        >

          <button @click="deleteSection(i)">✕</button>

          <input v-if="s.type==='hero'" v-model="s.title" class="border w-full"/>

          <textarea
            v-if="s.type==='text' || s.type==='main'"
            v-model="s.content"
            class="w-full min-h-[150px] border"
          />

          <input v-if="s.type==='footer'" v-model="s.text" class="border w-full"/>

          <input v-if="s.type==='image'" v-model="s.url" class="border w-full"/>

        </div>

      </div>

      <!-- ================= PREVIEW ================= -->
      <div v-else>

        <div v-for="s in currentPage.sections" :key="s.id">

          <h2 v-if="s.type==='hero'">{{ s.title }}</h2>

          <p v-if="s.type==='text'">{{ s.content }}</p>

          <div v-if="s.type==='main'" style="min-height:500px">
            {{ s.content }}
          </div>

          <footer v-if="s.type==='footer'">{{ s.text }}</footer>

          <img v-if="s.type==='image'" :src="s.url" />

        </div>

      </div>

    </div>
  </div>
</template>
