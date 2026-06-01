/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // We ship our own hand-crafted manifest at public/manifest.webmanifest —
      // tell the plugin to leave manifest generation alone.
      manifest: false,
      // Update silently in the background; new build wins on next navigation.
      registerType: "autoUpdate",
      // Inject the registration <script> into index.html for us.
      injectRegister: "auto",
      workbox: {
        // Precache every built web asset (HTML, JS, CSS, the SVG icon, and
        // the manifest itself). Exclude Cloudflare's _headers metadata.
        globPatterns: ["**/*.{js,css,html,svg,webmanifest}"],
        cleanupOutdatedCaches: true,
        // Any SPA-style navigation falls back to the precached index.html
        // when offline.
        navigateFallback: "/index.html",
      },
      devOptions: {
        // Don't run the SW in `npm run dev` — avoids stale-cache confusion.
        enabled: false,
      },
    }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
