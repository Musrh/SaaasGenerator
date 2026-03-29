<template>
  <div class="p-6">

    <!-- LOADING -->
    <div v-if="loading" class="text-center">
      Chargement du site...
    </div>

    <!-- SITE RENDER -->
    <div v-else>

      <h1 class="text-2xl font-bold mb-4">
        Plan: {{ userData.plan }}
      </h1>

      <!-- SECTIONS -->
      <div v-for="(section, index) in userData.sections" :key="index" class="mb-4">

        <!-- TEXT SECTION -->
        <p v-if="section.type === 'text'" class="text-lg">
          {{ section.content }}
        </p>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";

import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const route = useRoute();

const userData = ref({
  plan: "",
  sections: []
});

const loading = ref(true);

/* 🔥 FETCH FIRESTORE BY UID */
const loadSite = async () => {
  try {

    const uid = route.query.uid;

    if (!uid) {
      console.error("UID manquant dans l'URL");
      loading.value = false;
      return;
    }

    const snap = await getDoc(doc(db, "users", uid));

    if (!snap.exists()) {
      console.error("Utilisateur introuvable");
      loading.value = false;
      return;
    }

    userData.value = snap.data();

  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadSite();
});
</script>
