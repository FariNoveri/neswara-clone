import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "./app.css"; // Pastikan ini ada
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
