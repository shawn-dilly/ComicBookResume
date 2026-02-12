import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // Force re-bundling of page-flip and react-pageflip when they change
    force: true
  },
  server: {
    watch: {
      // Required for WSL2 with files on Windows-mounted drives (/mnt/*)
      usePolling: true,
      interval: 1000,
    },
  },
})
