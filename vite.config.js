import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // CRITICAL for WebToAPK / WebToEXE: assets must use relative paths
  base: './',
  build: {
    // Inline small assets to avoid path issues in WebView
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // Predictable chunk names for WebView
        manualChunks: undefined,
      },
    },
  },
})
