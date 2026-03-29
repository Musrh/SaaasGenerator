<script setup>

// 🔥 récupérer UID depuis URL (SANS vue-router)
const hash = window.location.hash

let uid = null

if (hash.includes("uid=")) {
  uid = hash.split("uid=")[1]
}

console.log("UID =", uid)

</script>

<template>
  <div class="p-6">

    <h1 class="text-2xl font-bold">
      SaaasGenerator
    </h1>

    <p v-if="uid">
      UID client : {{ uid }}
    </p>

    <p v-else class="text-red-500">
      Aucun UID reçu
    </p>

  </div>
</template>
