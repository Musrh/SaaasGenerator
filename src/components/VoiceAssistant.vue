<template>
  <div class="assistant-box">
    <h3>Assistant vocal</h3>

    <button @click="startListening" :disabled="isListening">
      🎤 Parler
    </button>

    <button @click="stopListening" v-if="isListening">
      ⛔ Stop
    </button>

    <p><strong>Vous :</strong> {{ userText }}</p>
    <p><strong>Assistant :</strong> {{ botReply }}</p>

    <button @click="$emit('close')">Fermer</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      recognition: null,
      isListening: false,
      userText: "",
      botReply: ""
    };
  },

  methods: {
    initSpeech() {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      this.recognition = new SpeechRecognition();
      this.recognition.lang = "fr-FR";

      this.recognition.onresult = async (event) => {
        this.userText = event.results[0][0].transcript;
        await this.sendToAI(this.userText);
      };
    },

    startListening() {
      if (!this.recognition) this.initSpeech();
      this.isListening = true;
      this.recognition.start();
    },

    stopListening() {
      this.isListening = false;
      this.recognition.stop();
    },

    async sendToAI(text) {
      const res = await fetch("https://ton-backend/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();
      this.botReply = data.reply;

      this.speak(data.reply);
    },

    speak(text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      speechSynthesis.speak(utterance);
    }
  }
};
</script>

<style>
.assistant-box {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  padding: 15px;
  border-radius: 10px;
  width: 300px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.2);
}
.voice-assistant-btn {
  position: fixed;
  bottom: 20px;
  left: 20px;
  padding: 10px;
}
</style>
