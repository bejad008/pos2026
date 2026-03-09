import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Konfigurasi ini memberitahu Vercel bahwa ini adalah project React
export default defineConfig({
  plugins: [react()],
})
