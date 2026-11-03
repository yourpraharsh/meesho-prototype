import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  /* '/' locally and on Netlify; GitHub Pages builds with BASE_PATH=/<repo>/ */
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    host: true, /* reachable on LAN so you can open the app on your phone (same Wi‑Fi) */
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
