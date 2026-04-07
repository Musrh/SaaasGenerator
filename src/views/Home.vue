<template>
  <div class="home">

    <!-- HEADER -->
    <header class="header">

      <!-- LOGO -->
      <div class="logo">
        <img v-if="site.logo" :src="site.logo" />
        <span v-else>{{ site.name }}</span>
      </div>

      <!-- MENU (visible + clean in preview) -->
      <nav class="menu">
        <a v-for="page in site.pages" :key="page.id">
          {{ page.name }}
        </a>
      </nav>

      <!-- RIGHT -->
      <div class="right">

        <!-- LANGUAGE -->
        <select v-model="lang">
          <option v-for="l in languages" :key="l" :value="l">
            {{ l.toUpperCase() }}
          </option>
        </select>

        <!-- CART (VISIBLE IN PREVIEW) -->
        <div class="cart">
          🛒
          <span v-if="cartCount > 0" class="badge">
            {{ cartCount }}
          </span>
        </div>

      </div>
    </header>

    <!-- CONTENT -->
    <main>
      <h1>{{ site.name }}</h1>
      <p>Mode: {{ mode }}</p>
    </main>

  </div>
</template>

<script setup>
import { ref, computed } from "vue"

// MODE
const mode = ref("preview") // edit | preview

// SITE DATA
const site = ref({
  name: "WellShoppings",
  logo: "",
  pages: [
    { id: 1, name: "Accueil" },
    { id: 2, name: "Produits" },
    { id: 3, name: "Contact" }
  ]
})

// LANG
const languages = ["fr", "en", "ar"]
const lang = ref("fr")

// CART
const cart = ref([
  { id: 1, qty: 1 },
  { id: 2, qty: 2 }
])

const cartCount = computed(() =>
  cart.value.reduce((s, i) => s + i.qty, 0)
)
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #111;
  color: #fff;
}

.logo img {
  height: 40px;
}

.menu {
  display: flex;
  gap: 15px;
}

.menu a {
  cursor: pointer;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cart {
  position: relative;
  font-size: 22px;
}

.badge {
  position: absolute;
  top: -6px;
  right: -10px;
  background: red;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 50%;
  animation: pop 0.2s ease;
}
</style>

<style>
@keyframes pop {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}
</style>
