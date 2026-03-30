<script setup>
import { ref, watch, computed } from "vue"
import { db } from "../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"

const props = defineProps({
  uid: String
})

const site = ref(null)
const loading = ref(false)
const error = ref(null)

// 🔥 MODE EDIT / PREVIEW
const mode = ref("edit") // "edit" | "preview"


// ===============================
// 🔥 LOAD SITE
// ===============================
const loadSite = async (uid) => {
  if (!uid) return

  loading.value = true
  error.value = null

  try {
    const cleanUid = decodeURIComponent(uid).trim()

    const refDoc = doc(db, "users", cleanUid)
    const snap = await getDoc(refDoc)

    if (snap.exists()) {
      const data = snap.data()

      site.value = {
        plan: data.plan || "free",
        sections: Array.isArray(data.sections) ? data.sections : []
      }
    } else {
      site.value = null
      error.value = "Site introuvable"
    }

  } catch (e) {
    error.value = "Erreur Firestore"
  }

  loading.value = false
}


// ===============================
// 🔥 ADD SECTION
// ===============================
const addSection = (type) => {
  if (!site.value) return

  if (type === "main") {
    site.value.sections.push({
      type: "main",
      content: "Contenu principal..."
    })
  }

  if (type === "text") {
    site.value.sections.push({
      type: "text",
      content: "Texte"
    })
  }

  if (type === "hero") {
    site.value.sections.push({
      type: "hero",
      title: "Hero"
    })
  }

  if (type === "menu") {
    site.value.sections.push({
      type: "menu",
      items: ["Home", "About", "Contact"]
    })
  }

  if (type === "footer") {
    site.value.sections.push({
      type: "footer",
      text: "Footer"
    })
  }

  if (type === "image") {
    site.value.sections.push({
      type: "image",
      url: "https://via.placeholder.com/800"
    })
  }
}


// ===============================
// 🔥 SAVE
// ===============================
const saveSite = async () => {
  if (!props.uid || !site.value) return

  const refDoc = doc(db, "users", props.uid)

  await updateDoc(refDoc, {
    sections: site.value.sections
  })
}


// ===============================
// 🔥 LOAD ON UID CHANGE
// ===============================
watch(
  () => props.uid,
  (newUid) => loadSite(newUid),
  { immediate: true }
)


// ===============================
// 🔥 PREVIEW MODE CLEAN VIEW
// ===============================
const isPreview = computed(() => mode.value === "preview")
</script>
