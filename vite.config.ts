import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // fsevents-overvågning er upålidelig på denne maskine; polling sikrer at HMR fanger ændringer
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})
