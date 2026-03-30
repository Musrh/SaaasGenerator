<script setup>
import { ref, watch } from "vue"
import { db, storage } from "../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"

const props = defineProps({
  uid: String
})

// ======================
// STATE
// ======================
const site = ref({
  plan: "free",
  sections: []
})

const mode = ref("edit")
const loading = ref(false)
const error = ref("")

// ======================
// LOAD SITE + PLAN SAFE
// ======================
const loadSite = async (uid) => {
  if (!uid) return

  loading.value = true
  error.value = ""

  try {
    const snap = await getDoc(doc(db, "users", uid))

    if (snap.exists()) {
      const data = snap.data()

      site.value = {
        plan: data.plan || "free",   // ✅ PLAN SAFE
        sections: Array.isArray(data.sections) ? data.sections : []
      }
    } else {
      site.value = { plan: "free", sections: [] }
      error.value = "Site introuvable"
    }

  } catch (e) {
    console.log(e)
    error.value = "Erreur Firestore"
  }

  loading.value = false
}

// ======================
// WATCH UID
// ======================
watch(
  () => props.uid,
  (v) => v && loadSite(v),
  { immediate: true }
)

// ======================
// ADD SECTION
// ======================
const addSection = (type) => {
  const map = {
    hero: { type: "hero", title: "Hero" },
    text: { type: "text", content: "Text..." },
    main: { type: "main", content: "Main content..." },
    menu: { type: "menu", items: ["Home", "About"] },
    image: { type: "image", url: "" },
    footer: { type: "footer", text: "Footer" }
  }

  site.value.sections.push(map[type])
}

// ======================
// SAVE
// ======================
const saveSite = async () => {
  await updateDoc(doc(db, "users", props.uid), {
    sections: site.value.sections,
    plan: site.value.plan
  })
}

// ======================
// IMAGE UPLOAD (Firebase Storage)
// ======================
const uploadImage = async (event, section) => {
  const file = event.target.files[0]
  if (!file) return

  const path = `sites/${props.uid}/${Date.now()}-${file.name}`
  const fileRef = storageRef(storage, path)

  await uploadBytes(fileRef, file)
  const url = await getDownloadURL(fileRef)

  section.url = url
}
</script>
