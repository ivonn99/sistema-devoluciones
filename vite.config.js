import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    copyPublicDir: true
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['sistema-devoluciones-ncah.onrender.com', 'localhost']
  }
})