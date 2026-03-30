<template>
  <div class="p-4 overflow-x-hidden">

    <!-- HEADER INFO -->
    <div class="mb-4 p-3 border rounded">
      <p><b>UID client :</b> {{ uid }}</p>
      <p><b>Plan :</b> {{ site.plan }}</p>
    </div>

    <!-- MODE SWITCH -->
    <div class="flex gap-2 mb-4">
      <button class="border px-3 py-1" @click="mode='edit'">Édition</button>
      <button class="border px-3 py-1" @click="mode='preview'">Aperçu</button>
    </div>

    <!-- ADD SECTION -->
    <div v-if="mode==='edit'" class="flex flex-wrap gap-2 mb-4">
      <button @click="addSection('hero')" class="border px-2">+ Hero</button>
      <button @click="addSection('text')" class="border px-2">+ Text</button>
      <button @click="addSection('main')" class="border px-2">+ Main</button>
      <button @click="addSection('menu')" class="border px-2">+ Menu</button>
      <button @click="addSection('image')" class="border px-2">+ Image</button>
      <button @click="addSection('footer')" class="border px-2">+ Footer</button>
    </div>

    <!-- SECTIONS -->
    <div
      v-for="(s, i) in site.sections"
      :key="i"
      class="border rounded p-3 mb-4 hover:shadow"
    >

      <!-- HERO -->
      <div v-if="s.type==='hero'">
        <input v-if="mode==='edit'" v-model="s.title" class="border w-full p-2"/>
        <h1 v-else class="text-2xl font-bold">{{ s.title }}</h1>
      </div>

      <!-- TEXT -->
      <div v-if="s.type==='text'">
        <textarea
          v-if="mode==='edit'"
          v-model="s.content"
          class="w-full border p-2"
        />
        <p v-else>{{ s.content }}</p>
      </div>

      <!-- MAIN SECTION (FULL WIDTH + 500px) -->
      <div v-if="s.type==='main'">

        <textarea
          v-if="mode==='edit'"
          v-model="s.content"
          class="w-screen min-h-[500px] border p-3 text-lg"
        />

        <div
          v-else
          class="w-screen min-h-[500px] border p-4 text-lg"
        >
          {{ s.content }}
        </div>

      </div>

      <!-- MENU -->
      <div v-if="s.type==='menu'">
        <input v-if="mode==='edit'" v-model="s.content" class="border w-full p-2"/>
        <div v-else class="flex gap-3">
          <span v-for="item in (s.content || '').split(',')" :key="item">
            {{ item }}
          </span>
        </div>
      </div>

      <!-- IMAGE -->
      <div v-if="s.type==='image'">

        <input v-if="mode==='edit'" type="file" @change="uploadImage($event, s)" />

        <select v-if="mode==='edit'" v-model="s.fit" class="border mt-2">
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
        </select>

        <img
          v-if="s.url"
          :src="s.url"
          class="w-screen h-[400px]"
          :style="{ objectFit: s.fit || 'cover' }"
        />

      </div>

      <!-- FOOTER -->
      <div v-if="s.type==='footer'">
        <input v-if="mode==='edit'" v-model="s.content" class="border w-full p-2"/>
        <footer v-else class="text-center opacity-70">
          {{ s.content }}
        </footer>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue"
import { db, storage } from "../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage"

const props = defineProps({
  uid: String
})

const site = ref({
  plan: "",
  sections: []
})

const mode = ref("edit")

// LOAD DATA
onMounted(async () => {
  if (!props.uid) return

  const snap = await getDoc(doc(db, "users", props.uid))

  if (snap.exists()) {
    site.value = snap.data()
  } else {
    console.log("Site introuvable")
  }
})

// ADD SECTION
function addSection(type) {
  site.value.sections.push({
    type,
    content: "",
    title: "",
    url: "",
    fit: "cover"
  })
}

// IMAGE UPLOAD
async function uploadImage(e, section) {
  const file = e.target.files[0]
  if (!file) return

  const fileRef = sRef(storage, `sites/${props.uid}/${file.name}`)
  await uploadBytes(fileRef, file)

  const url = await getDownloadURL(fileRef)
  section.url = url
}

// AUTO SAVE
watch(
  () => site.value.sections,
  async () => {
    if (!props.uid) return

    await updateDoc(doc(db, "users", props.uid), {
      plan: site.value.plan,
      sections: site.value.sections
    })
  },
  { deep: true }
)
</script>
