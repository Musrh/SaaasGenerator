<!-- ============================================================
  VoiceAssistant.vue — SaaasGenerator
  src/components/VoiceAssistant.vue

  Assistant vocal du store qui :
  - S'active par bouton flottant 🎤 ou commande vocale
  - Écoute les commandes du PROPRIÉTAIRE du store
  - Peut : ajouter/supprimer des sections, changer les textes,
    modifier les couleurs, sauvegarder, publier
  - Répond vocalement (SpeechSynthesis)
  - Fonctionne en FR / EN / ES / AR
  - Intégré dans Home.vue via <VoiceAssistant>

  Commandes vocales exemples :
  FR : "ajoute une section hero" / "change le titre" /
       "sauvegarde" / "publie le site" / "aperçu"
  EN : "add hero section" / "save" / "preview"
============================================================ -->

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue"

// ── Props ─────────────────────────────────────────────────────
const props = defineProps({
  lang:        { type: String,  default: "fr" },  // langue courante du builder
  siteName:    { type: String,  default: "" },
  currentUser: { type: Object,  default: null },
  isRtl:       { type: Boolean, default: false },
})

// ── Emits vers Home.vue ───────────────────────────────────────
const emit = defineEmits([
  "add-section",      // { type: "hero"|"text"|"products"... }
  "delete-section",   // { index: number }
  "save-site",        // ()
  "preview",          // ()
  "publish",          // ()
  "set-mode",         // { mode: "edit"|"preview" }
  "change-title",     // { text: string }
  "add-page",         // ()
  "notify",           // { msg, type }
])

// ── État ──────────────────────────────────────────────────────
const isListening  = ref(false)
const isOpen       = ref(false)
const isSpeaking   = ref(false)
const transcript   = ref("")
const lastCommand  = ref("")
const conversation = ref([])   // historique des échanges
const pulse        = ref(false)

// Reconnaissance vocale
let recognition = null
let synthUtter  = null

// ── Support navigateur ─────────────────────────────────────────
const isSupported = computed(() =>
  "webkitSpeechRecognition" in window || "SpeechRecognition" in window
)

// ── Commandes par langue ──────────────────────────────────────
const commands = {
  fr: {
    sections: {
      hero:     ["hero", "titre", "bannière", "entête"],
      text:     ["texte", "paragraphe", "contenu"],
      image:    ["image", "photo", "illustration"],
      gallery:  ["galerie", "images"],
      video:    ["vidéo", "youtube", "vimeo"],
      products: ["produits", "catalogue", "boutique", "shop"],
      features: ["avantages", "features", "caractéristiques"],
      payment:  ["paiement", "stripe", "paypal", "acheter"],
      form:     ["formulaire", "contact", "message"],
      divider:  ["séparateur", "ligne", "divider"],
    },
    actions: {
      add:     ["ajoute", "ajouter", "crée", "créer", "nouvelle"],
      delete:  ["supprime", "supprimer", "efface", "effacer", "enlève"],
      save:    ["sauvegarde", "sauvegarder", "enregistre", "enregistrer"],
      preview: ["aperçu", "prévisualise", "prévisualiser", "voir le site"],
      publish: ["publie", "publier", "mettre en ligne"],
      edit:    ["éditer", "édite", "modifier", "retour édition"],
      undo:    ["annule", "annuler"],
      help:    ["aide", "commandes", "help"],
    },
    responses: {
      add:     (s) => `Section ${s} ajoutée ✓`,
      delete:  () => `Section supprimée ✓`,
      save:    () => `Site sauvegardé ✓`,
      preview: () => `Mode aperçu activé`,
      publish: () => `Ouverture de la publication...`,
      edit:    () => `Mode édition activé`,
      noCmd:   () => `Je n'ai pas compris. Dites "aide" pour les commandes disponibles.`,
      help:    () => `Commandes : "ajoute section hero", "sauvegarde", "aperçu", "publie le site", "ajoute une page"`,
      welcome: (name) => `Bonjour${name ? ` ${name}` : ""}. Je suis votre assistant vocal. Dites "aide" pour les commandes.`,
    }
  },
  en: {
    sections: {
      hero:     ["hero", "title", "banner", "header"],
      text:     ["text", "paragraph", "content"],
      image:    ["image", "photo"],
      gallery:  ["gallery", "images"],
      video:    ["video", "youtube"],
      products: ["products", "catalog", "shop", "store"],
      features: ["features", "benefits"],
      payment:  ["payment", "stripe", "paypal"],
      form:     ["form", "contact"],
      divider:  ["divider", "line", "separator"],
    },
    actions: {
      add:     ["add", "create", "new", "insert"],
      delete:  ["delete", "remove", "erase"],
      save:    ["save", "store", "keep"],
      preview: ["preview", "view site", "show"],
      publish: ["publish", "deploy", "go live"],
      edit:    ["edit", "back to edit"],
      undo:    ["undo", "cancel"],
      help:    ["help", "commands", "what can you do"],
    },
    responses: {
      add:     (s) => `${s} section added ✓`,
      delete:  () => `Section deleted ✓`,
      save:    () => `Site saved ✓`,
      preview: () => `Preview mode activated`,
      publish: () => `Opening publish settings...`,
      edit:    () => `Edit mode activated`,
      noCmd:   () => `I didn't understand. Say "help" for available commands.`,
      help:    () => `Commands: "add hero section", "save", "preview", "publish site", "add page"`,
      welcome: (name) => `Hello${name ? ` ${name}` : ""}. I'm your voice assistant. Say "help" for commands.`,
    }
  },
  es: {
    sections: {
      hero:     ["hero", "título", "banner"],
      text:     ["texto", "párrafo"],
      image:    ["imagen", "foto"],
      gallery:  ["galería", "imágenes"],
      video:    ["vídeo", "youtube"],
      products: ["productos", "catálogo", "tienda"],
      features: ["características", "ventajas"],
      payment:  ["pago", "stripe", "paypal"],
      form:     ["formulario", "contacto"],
      divider:  ["separador", "línea"],
    },
    actions: {
      add:     ["añade", "añadir", "crea", "crear", "nueva", "nuevo"],
      delete:  ["elimina", "eliminar", "borra", "borrar"],
      save:    ["guarda", "guardar"],
      preview: ["vista previa", "previsualizar"],
      publish: ["publica", "publicar"],
      edit:    ["editar", "edición"],
      undo:    ["deshacer"],
      help:    ["ayuda", "comandos"],
    },
    responses: {
      add:     (s) => `Sección ${s} añadida ✓`,
      delete:  () => `Sección eliminada ✓`,
      save:    () => `Sitio guardado ✓`,
      preview: () => `Modo vista previa activado`,
      publish: () => `Abriendo publicación...`,
      edit:    () => `Modo edición activado`,
      noCmd:   () => `No entendí. Di "ayuda" para ver los comandos.`,
      help:    () => `Comandos: "añade sección hero", "guarda", "vista previa", "publica"`,
      welcome: (name) => `Hola${name ? ` ${name}` : ""}. Soy tu asistente de voz.`,
    }
  },
  ar: {
    sections: {
      hero:     ["بطل", "عنوان", "رئيسي"],
      text:     ["نص", "فقرة"],
      image:    ["صورة"],
      gallery:  ["معرض", "صور"],
      video:    ["فيديو", "يوتيوب"],
      products: ["منتجات", "كتالوج", "متجر"],
      features: ["مميزات", "خصائص"],
      payment:  ["دفع", "دفع"],
      form:     ["نموذج", "تواصل"],
      divider:  ["فاصل", "خط"],
    },
    actions: {
      add:     ["أضف", "إضافة", "أنشئ", "جديد"],
      delete:  ["احذف", "حذف", "إزالة"],
      save:    ["احفظ", "حفظ"],
      preview: ["معاينة", "عرض"],
      publish: ["انشر", "نشر"],
      edit:    ["تعديل", "تحرير"],
      undo:    ["تراجع", "إلغاء"],
      help:    ["مساعدة", "أوامر"],
    },
    responses: {
      add:     (s) => `تمت إضافة القسم ${s} ✓`,
      delete:  () => `تم حذف القسم ✓`,
      save:    () => `تم حفظ الموقع ✓`,
      preview: () => `تم تفعيل وضع المعاينة`,
      publish: () => `فتح إعدادات النشر...`,
      edit:    () => `تم تفعيل وضع التحرير`,
      noCmd:   () => `لم أفهم. قل "مساعدة" للأوامر المتاحة.`,
      help:    () => `الأوامر: "أضف قسم"، "احفظ"، "معاينة"، "انشر"`,
      welcome: (name) => `مرحباً${name ? ` ${name}` : ""}. أنا مساعدك الصوتي.`,
    }
  }
}

const langCode = computed(() => {
  const map = { fr: "fr-FR", en: "en-US", es: "es-ES", ar: "ar-SA" }
  return map[props.lang] || "fr-FR"
})

const cmd = computed(() => commands[props.lang] || commands.fr)

// ── Synthèse vocale ───────────────────────────────────────────
const speak = (text) => {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = langCode.value
  u.rate = 1.05
  u.pitch = 1
  u.onstart = () => { isSpeaking.value = true }
  u.onend   = () => { isSpeaking.value = false }
  window.speechSynthesis.speak(u)
  synthUtter = u
}

// ── Ajout au transcript ────────────────────────────────────────
const addMessage = (who, text) => {
  conversation.value.push({ who, text, time: new Date().toLocaleTimeString() })
  if (conversation.value.length > 20) conversation.value.shift()
}

// ── Traitement de la commande ─────────────────────────────────
const processCommand = (text) => {
  const lower = text.toLowerCase().trim()
  lastCommand.value = text
  addMessage("user", text)

  // Aide
  if (cmd.value.actions.help.some(k => lower.includes(k))) {
    const r = cmd.value.responses.help()
    speak(r); addMessage("bot", r); return
  }

  // Ajouter une section
  if (cmd.value.actions.add.some(k => lower.includes(k))) {
    for (const [type, keywords] of Object.entries(cmd.value.sections)) {
      if (keywords.some(k => lower.includes(k))) {
        emit("add-section", { type })
        const r = cmd.value.responses.add(type)
        speak(r); addMessage("bot", r); return
      }
    }
    // "ajoute une page"
    if (lower.includes("page")) {
      emit("add-page")
      const r = props.lang === "fr" ? "Nouvelle page ajoutée ✓"
              : props.lang === "en" ? "New page added ✓"
              : props.lang === "es" ? "Nueva página añadida ✓"
              : "تمت إضافة صفحة جديدة ✓"
      speak(r); addMessage("bot", r); return
    }
  }

  // Supprimer section
  if (cmd.value.actions.delete.some(k => lower.includes(k))) {
    emit("delete-section", {})
    const r = cmd.value.responses.delete()
    speak(r); addMessage("bot", r); return
  }

  // Sauvegarder
  if (cmd.value.actions.save.some(k => lower.includes(k))) {
    emit("save-site")
    const r = cmd.value.responses.save()
    speak(r); addMessage("bot", r); return
  }

  // Aperçu / Preview
  if (cmd.value.actions.preview.some(k => lower.includes(k))) {
    emit("set-mode", { mode: "preview" })
    const r = cmd.value.responses.preview()
    speak(r); addMessage("bot", r); return
  }

  // Mode Edit
  if (cmd.value.actions.edit.some(k => lower.includes(k))) {
    emit("set-mode", { mode: "edit" })
    const r = cmd.value.responses.edit()
    speak(r); addMessage("bot", r); return
  }

  // Publier
  if (cmd.value.actions.publish.some(k => lower.includes(k))) {
    emit("publish")
    const r = cmd.value.responses.publish()
    speak(r); addMessage("bot", r); return
  }

  // Commande non reconnue
  const r = cmd.value.responses.noCmd()
  speak(r); addMessage("bot", r)
}

// ── Démarrer l'écoute ─────────────────────────────────────────
const startListening = () => {
  if (!isSupported.value) {
    emit("notify", { msg: "Reconnaissance vocale non supportée sur ce navigateur.", type: "error" })
    return
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  recognition = new SR()
  recognition.lang = langCode.value
  recognition.continuous = false
  recognition.interimResults = true

  recognition.onstart = () => {
    isListening.value = true
    transcript.value  = ""
    pulse.value       = true
  }

  recognition.onresult = (event) => {
    let interim = ""
    let final   = ""
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript
      event.results[i].isFinal ? (final += t) : (interim += t)
    }
    transcript.value = final || interim
    if (final) {
      recognition.stop()
      processCommand(final)
    }
  }

  recognition.onerror = (e) => {
    isListening.value = false; pulse.value = false
    if (e.error !== "no-speech") {
      emit("notify", { msg: `Erreur micro: ${e.error}`, type: "error" })
    }
  }

  recognition.onend = () => {
    isListening.value = false
    pulse.value       = false
    transcript.value  = ""
  }

  recognition.start()
}

const stopListening = () => {
  recognition?.stop()
  isListening.value = false
  pulse.value       = false
}

const toggleListen = () => {
  if (isListening.value) stopListening()
  else startListening()
}

const toggleOpen = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value && conversation.value.length === 0) {
    const w = cmd.value.responses.welcome(props.siteName)
    setTimeout(() => { speak(w); addMessage("bot", w) }, 400)
  }
}

onUnmounted(() => {
  recognition?.stop()
  window.speechSynthesis?.cancel()
})
</script>

<template>
<div class="va-root" :dir="isRtl ? 'rtl' : 'ltr'">

  <!-- BOUTON FLOTTANT -->
  <button
    class="va-fab"
    :class="{ listening: isListening, speaking: isSpeaking, open: isOpen }"
    @click="toggleOpen"
    title="Assistant vocal"
  >
    <span v-if="isListening" class="va-fab-icon">🎙️</span>
    <span v-else-if="isSpeaking" class="va-fab-icon">🔊</span>
    <span v-else class="va-fab-icon">🤖</span>
    <span v-if="isListening" class="va-pulse-ring"></span>
  </button>

  <!-- PANEL ASSISTANT -->
  <Transition name="va-slide">
    <div v-if="isOpen" class="va-panel">

      <!-- Header -->
      <div class="va-header">
        <div class="va-header-left">
          <span class="va-avatar">🤖</span>
          <div>
            <div class="va-title">Assistant vocal</div>
            <div class="va-status">
              <span class="va-dot" :class="{ active: isListening, speaking: isSpeaking }"></span>
              {{ isListening ? "Écoute en cours..." : isSpeaking ? "En train de répondre..." : "En attente" }}
            </div>
          </div>
        </div>
        <button class="va-close" @click="isOpen = false">✕</button>
      </div>

      <!-- Conversation -->
      <div class="va-conversation" ref="convEl">
        <div
          v-for="(msg, i) in conversation"
          :key="i"
          class="va-msg"
          :class="msg.who"
        >
          <span class="va-msg-icon">{{ msg.who === "user" ? "👤" : "🤖" }}</span>
          <div class="va-msg-bubble">
            <p>{{ msg.text }}</p>
            <span class="va-msg-time">{{ msg.time }}</span>
          </div>
        </div>

        <div v-if="conversation.length === 0" class="va-empty">
          <span>🎤</span>
          <p>Cliquez sur le micro et parlez</p>
        </div>

        <!-- Transcript en cours -->
        <div v-if="transcript" class="va-interim">
          <span class="va-interim-dot"></span>
          {{ transcript }}
        </div>
      </div>

      <!-- Commandes rapides -->
      <div class="va-quick">
        <button @click="processCommand(cmd.actions.save[0])">💾 Sauvegarder</button>
        <button @click="processCommand(cmd.actions.preview[0])">👁 Aperçu</button>
        <button @click="processCommand(cmd.actions.publish[0])">🌐 Publier</button>
        <button @click="processCommand(cmd.actions.help[0])">❓ Aide</button>
      </div>

      <!-- Bouton micro principal -->
      <button
        class="va-mic-btn"
        :class="{ active: isListening }"
        @click="toggleListen"
      >
        <span v-if="isListening" class="va-mic-icon">⏹</span>
        <span v-else class="va-mic-icon">🎤</span>
        <span>{{ isListening ? "Arrêter" : "Parler" }}</span>
        <span v-if="isListening" class="va-listening-wave">
          <span></span><span></span><span></span><span></span><span></span>
        </span>
      </button>

      <!-- Aide commandes -->
      <div class="va-hints">
        <div class="va-hints-title">Commandes disponibles</div>
        <div class="va-hints-grid">
          <span>"ajoute section hero"</span>
          <span>"ajoute section produits"</span>
          <span>"sauvegarde"</span>
          <span>"aperçu"</span>
          <span>"publie le site"</span>
          <span>"ajoute une page"</span>
        </div>
      </div>

    </div>
  </Transition>
</div>
</template>

<style scoped>
/* ROOT */
.va-root{position:fixed;bottom:24px;right:24px;z-index:8000;display:flex;flex-direction:column;align-items:flex-end;gap:12px}
[dir="rtl"] .va-root{right:auto;left:24px;align-items:flex-start}

/* FAB */
.va-fab{width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 20px rgba(0,0,0,.3);transition:all .25s;background:linear-gradient(135deg,#6c63ff,#a78bfa);position:relative;outline:none}
.va-fab:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(108,99,255,.5)}
.va-fab.listening{background:linear-gradient(135deg,#ef4444,#f97316);animation:va-bounce .6s infinite alternate}
.va-fab.speaking{background:linear-gradient(135deg,#10b981,#059669)}
.va-fab.open{border-radius:14px}
@keyframes va-bounce{from{transform:scale(1)}to{transform:scale(1.12)}}
.va-fab-icon{line-height:1}

/* PULSE RING */
.va-pulse-ring{position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(239,68,68,.5);animation:va-pulse 1s ease-out infinite}
@keyframes va-pulse{0%{transform:scale(.9);opacity:1}100%{transform:scale(1.4);opacity:0}}

/* PANEL */
.va-panel{width:320px;background:#17171a;border:1px solid #2a2a2f;border-radius:20px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.5);display:flex;flex-direction:column;max-height:560px}
.va-slide-enter-active,.va-slide-leave-active{transition:all .3s cubic-bezier(.34,1.56,.64,1)}
.va-slide-enter-from,.va-slide-leave-to{opacity:0;transform:translateY(20px) scale(.95)}

/* HEADER */
.va-header{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #2a2a2f;background:#1f1f23}
.va-header-left{display:flex;align-items:center;gap:10px}
.va-avatar{font-size:28px;line-height:1}
.va-title{font-size:14px;font-weight:700;color:#f0f0f0;font-family:'DM Sans',sans-serif}
.va-status{display:flex;align-items:center;gap:6px;font-size:11px;color:#8a8a9a;font-family:'DM Sans',sans-serif}
.va-dot{width:7px;height:7px;border-radius:50%;background:#35353c;transition:background .3s}
.va-dot.active{background:#ef4444;animation:va-blink .8s infinite}
.va-dot.speaking{background:#10b981}
@keyframes va-blink{50%{opacity:.4}}
.va-close{background:none;border:none;color:#8a8a9a;cursor:pointer;font-size:16px;padding:4px 8px;border-radius:6px;transition:all .15s}
.va-close:hover{background:#2a2a2f;color:#f0f0f0}

/* CONVERSATION */
.va-conversation{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;max-height:220px;scrollbar-width:thin;scrollbar-color:#2a2a2f transparent}
.va-msg{display:flex;align-items:flex-end;gap:8px}
.va-msg.bot{flex-direction:row}
.va-msg.user{flex-direction:row-reverse}
.va-msg-icon{font-size:16px;flex-shrink:0}
.va-msg-bubble{max-width:220px}
.va-msg.bot .va-msg-bubble{background:#2a2a2f;border-radius:14px 14px 14px 4px;padding:10px 14px}
.va-msg.user .va-msg-bubble{background:linear-gradient(135deg,#6c63ff,#a78bfa);border-radius:14px 14px 4px 14px;padding:10px 14px}
.va-msg-bubble p{font-size:13px;color:#f0f0f0;line-height:1.5;font-family:'DM Sans',sans-serif;margin:0}
.va-msg-time{font-size:10px;color:#5a5a6a;margin-top:4px;display:block}
.va-empty{text-align:center;padding:20px;color:#5a5a6a;display:flex;flex-direction:column;align-items:center;gap:8px}
.va-empty span{font-size:28px;opacity:.5}
.va-empty p{font-size:12px;font-family:'DM Sans',sans-serif}
.va-interim{background:rgba(108,99,255,.1);border:1px solid rgba(108,99,255,.2);border-radius:8px;padding:8px 12px;font-size:12px;color:#a78bfa;font-style:italic;display:flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif}
.va-interim-dot{width:6px;height:6px;border-radius:50%;background:#6c63ff;animation:va-blink .6s infinite}

/* QUICK BUTTONS */
.va-quick{display:flex;gap:6px;padding:10px 12px;border-top:1px solid #2a2a2f;flex-wrap:wrap}
.va-quick button{background:#2a2a2f;border:1px solid #35353c;color:#8a8a9a;font-size:11px;padding:5px 10px;border-radius:100px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;white-space:nowrap}
.va-quick button:hover{background:#35353c;color:#f0f0f0;border-color:#6c63ff}

/* MIC BUTTON */
.va-mic-btn{margin:0 12px 12px;width:calc(100% - 24px);padding:14px;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;background:linear-gradient(135deg,#6c63ff,#a78bfa);color:white;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .2s;position:relative;overflow:hidden}
.va-mic-btn.active{background:linear-gradient(135deg,#ef4444,#f97316)}
.va-mic-btn:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(108,99,255,.4)}
.va-mic-icon{font-size:18px;line-height:1}

/* LISTENING WAVES */
.va-listening-wave{display:flex;align-items:center;gap:3px;height:20px}
.va-listening-wave span{display:block;width:3px;background:rgba(255,255,255,.8);border-radius:3px;animation:va-wave 1s ease-in-out infinite}
.va-listening-wave span:nth-child(1){height:6px;animation-delay:0s}
.va-listening-wave span:nth-child(2){height:14px;animation-delay:.1s}
.va-listening-wave span:nth-child(3){height:20px;animation-delay:.2s}
.va-listening-wave span:nth-child(4){height:14px;animation-delay:.3s}
.va-listening-wave span:nth-child(5){height:6px;animation-delay:.4s}
@keyframes va-wave{0%,100%{transform:scaleY(.5)}50%{transform:scaleY(1)}}

/* HINTS */
.va-hints{padding:0 12px 12px}
.va-hints-title{font-size:10px;font-weight:700;color:#5a5a6a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;font-family:'DM Sans',sans-serif}
.va-hints-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.va-hints-grid span{background:#1f1f23;border:1px solid #2a2a2f;color:#8a8a9a;font-size:10px;padding:5px 8px;border-radius:6px;font-family:'DM Sans',sans-serif;font-style:italic}
</style>
