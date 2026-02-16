import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

const base = '/Vanture_v3/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Disable navigateFallback: workbox requires the fallback URL to exist in precache.
        // With base path, precache has "index.html" (relative to dist) but createHandlerBoundToURL
        // expects an exact match. Disabling lets navigation hit the network; 404.html handles SPA routing.
        navigateFallback: null,
      },
      manifest: {
        name: 'Vantura',
        short_name: 'Vantura',
        description: 'Local-first finance app synced with Up Bank',
        theme_color: '#FF7A59',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/vite.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
