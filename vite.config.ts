import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
// @ts-expect-error The Node-only Vite middleware is intentionally kept out of the browser bundle.
import { publicWebsite } from './server/vite-public.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), publicWebsite()],
  build: { rollupOptions: { input: { app: 'index.html', public: 'public.html' } } },
  server: {
    port: 3000,
    strictPort: true,
  },
})
