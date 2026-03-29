<script setup>
import Home from "./views/Home.vue"

const hash = window.location.hash

let uid = null

if (hash.includes("uid=")) {
  uid = hash.split("uid=")[1]

// 🔥 IMPORTANT: nettoyer params URL
  uid = uid.split("&")[0]
  uid = uid.trim()
}

console.log("🔥 CLEAN UID =", uid)
</script>

<template>
  <div>
    <Home :uid="uid" />
  </div>
</template>
