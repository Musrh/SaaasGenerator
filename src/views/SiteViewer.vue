<template>
  <div class="va-container">
    <!-- Bouton -->
    <button class="va-btn" @click="toggleListening">
      {{ isListening ? "🎤 Stop" : "🎤 Parler" }}
    </button>

    <!-- Texte -->
    <div v-if="transcript" class="va-box user">
      {{ transcript }}
    </div>

    <!-- Réponse -->
    <div v-if="response" class="va-box ai">
      {{ response }}
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"

const props = defineProps({
  storeUid: String,
  storeName: String,
  storeEmail: String,
  lang: String,
  backendUrl: String
})

const isListening = ref(false)
const transcript = ref("")
const response = ref("")

let recognition = null

// 🎤 INIT
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  recognition = new SpeechRecognition()
  recognition.lang = props.lang || "fr-FR"
  recognition.continuous = false
  recognition.interimResults = false

  recognition.onresult = async (event) => {
    transcript.value = event.results[0][0].transcript
    isListening.value = false
    await sendToAI(transcript.value)
  }

  recognition.onerror = () => {
    isListening.value = false
  }
}

// 🎤 START / STOP
const toggleListening = () => {
  if (!recognition) return alert("Micro non supporté")

  if (isListening.value) {
    recognition.stop()
    isListening.value = false
  } else {
    transcript.value = ""
    recognition.start()
    isListening.value = true
  }
}

// 🤖 BACKEND IA
const sendToAI = async (text) => {
  response.value = "..."
  try {
    const res = await fetch(props.backendUrl + "/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        storeUid: props.storeUid,
        storeName: props.storeName
      })
    })

    const data = await res.json()
    response.value = data.reply || "Pas de réponse"

    speak(response.value)

  } catch (e) {
    response.value = "Erreur IA"
  }
}

// 🔊 TEXT TO SPEECH
const speak = (text) => {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = props.lang || "fr-FR"
  speechSynthesis.speak(utterance)
}
</script>

<style scoped>
.va-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 999;
}

.va-btn {
  background: #6c63ff;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bold;
}

.va-box {
  padding: 10px;
  border-radius: 10px;
  font-size: 13px;
}

.user {
  background: #f3f4f6;
}

.ai {
  background: #ede9fe;
}
</style>
