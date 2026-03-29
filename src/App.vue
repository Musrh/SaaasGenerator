<script setup>
import Home from "./views/Home.vue"

const hash = window.location.hash

let uid = null

if (hash.includes("uid=")) {
  uid = hash.split("uid=")[1].split("&")[0].trim()
}
</script>

<template>
  <Home :uid="uid" />
</template>
