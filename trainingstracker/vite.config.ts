import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Die gebaute Anwendung liegt im Repository unter /training und wird von
// GitHub Pages direkt ausgeliefert — deshalb baut Vite eine Ebene hoeher
// hinein statt in ein eigenes dist/.
export default defineConfig({
  base: '/training/',
  build: {
    outDir: '../training',
    emptyOutDir: true,
    target: 'es2020'
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Trainingstracker — Zwölf Wochen zum Muscle-Up',
        short_name: 'Training',
        description: 'Achttagezyklus aus Push, Pull, Beinen und Pause, protokolliert zwischen den Sätzen.',
        lang: 'de',
        dir: 'ltr',
        start_url: '/training/',
        scope: '/training/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FBFAF8',
        theme_color: '#FBFAF8',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/training/index.html',
        runtimeCaching: [
          {
            // Schriften duerfen in den Cache, Supabase-Daten niemals:
            // die App haelt ihren eigenen Bestand in IndexedDB.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'schriften',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
})
