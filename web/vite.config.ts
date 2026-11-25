import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Built output is served by the Python app, so the UI and the API share one origin and one
// deploy. No proxy, no CORS, no second host to keep alive.
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5174, proxy: { '/api': 'http://127.0.0.1:8770' } },
})
