import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: "/SaaasGenerator/", // 🔥 IMPORTANT
  plugins: [vue()],
  build: {
    cssMinify: "esbuild", // 👈 au lieu de lightningcss
  },
});
