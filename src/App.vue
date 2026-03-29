<script setup>
import { useRoute } from "vue-router"

const route = useRoute()

// 🔥 récupérer uid depuis URL
const uid = route.query.uid

console.log("USER ID =", uid)
</script>

<template>
  <div>
    <h1>SaaasGenerator</h1>
    <p>UID : {{ uid }}</p>
  </div>
</template>
