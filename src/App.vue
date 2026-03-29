<script setup>
import Home from "./views/Home.vue"

const hash = window.location.hash

let uid = null

if (hash.includes("uid=")) {
  uid = hash.split("uid=")[1].split("&")[0]
}

if (uid) {
  uid = decodeURIComponent(uid).trim()
}

console.log("🔥 UID FINAL =", uid)
</script>

<template>
  <div>
    <Home :uid="uid" />
  </div>
</template>
