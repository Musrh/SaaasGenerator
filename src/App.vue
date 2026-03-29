<script setup>
import { computed } from "vue"
import Home from "./views/Home.vue"

// 🔥 récupérer UID depuis URL (hash mode)
const hash = window.location.hash

let uid = null

if (hash.includes("uid=")) {
  uid = hash.split("uid=")[1]
}

// nettoyer si paramètres après &
if (uid && uid.includes("&")) {
  uid = uid.split("&")[0]
}

const userId = computed(() => uid)
</script>

<template>
  <div>

    <!-- HEADER SIMPLE -->
    <div class="p-4 border-b">
      <h1 class="text-2xl font-bold">
        SaaasGenerator
      </h1>

      <p v-if="userId" class="text-green-600">
        UID client : {{ userId }}
      </p>

      <p v-else class="text-red-500">
        Aucun UID reçu
      </p>
    </div>

    <!-- 🔥 HOME COMPONENT -->
    <Home v-if="userId" :uid="userId" />

  </div>
</template>
