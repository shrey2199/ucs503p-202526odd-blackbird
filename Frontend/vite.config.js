import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Load .env from project root (one level up from Frontend)
  envDir: path.resolve(__dirname, '..'),
  envPrefix: 'VITE_',
  server: {
    host: '0.0.0.0', // Allow access from network
    port: 5173
  },
})
