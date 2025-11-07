import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/track/" : "/",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
    manifest: true, // hilft beim PWA-Refresh
    chunkSizeWarningLimit: 2000,
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  }
}));