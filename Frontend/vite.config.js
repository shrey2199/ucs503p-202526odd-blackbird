import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

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
    port: 5173,
    https: (() => {
      // Check if HTTPS certificates exist
      const certPath = path.resolve(__dirname, '..', 'certs', 'localhost+1.pem');
      const keyPath = path.resolve(__dirname, '..', 'certs', 'localhost+1-key.pem');
      
      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        return {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath)
        };
      }
      return false; // Use HTTP if certificates don't exist
    })()
  },
  build: {
    // Ensure CSS is properly extracted and bundled
    cssCodeSplit: false,
    // Increase chunk size warning limit for Leaflet
    chunkSizeWarningLimit: 1000,
  },
})
