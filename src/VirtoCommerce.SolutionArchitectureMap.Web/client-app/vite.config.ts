import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// The platform serves each manifest <app> from {module}/Content/{appId} at
// /apps/{appId} (see vc-platform ApplicationBuilderExtensions.UseModulesAndAppsFiles),
// and FAILS STARTUP if that folder is missing — so we build directly into it.
// Relative base keeps asset URLs correct under the /apps/... mount path.
export default defineConfig({
  plugins: [vue()],
  base: "./",
  build: {
    outDir: "../Content/solution-architecture-map",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5173,
    // In `vite dev` the app uses the in-repo mock provider (see src/api/client.ts).
    // To hit a running platform instead, set VITE_USE_MOCK=false and proxy:
    // proxy: { "/api": { target: "http://localhost:5000", changeOrigin: true } },
  },
});
