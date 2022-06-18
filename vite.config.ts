import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { logRelevantFileChanges } from "./devops/vite/change-observer.js";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [logRelevantFileChanges(), svelte()],
  publicDir: "public",
  logLevel: "error",
});
