import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Import Leaflet CSS globally to ensure it's bundled in production
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
