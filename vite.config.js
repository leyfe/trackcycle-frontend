import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
    manifest: true, // hilft beim PWA-Refresh
    chunkSizeWarningLimit: 2000,
  },
});