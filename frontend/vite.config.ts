import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { writeFileSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'generate-version-json',
      closeBundle() {
        const version = {
          bundleId: Date.now().toString(),
          buildTime: new Date().toISOString(),
        }
        writeFileSync('dist/version.json', JSON.stringify(version, null, 2))
      },
    },
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
