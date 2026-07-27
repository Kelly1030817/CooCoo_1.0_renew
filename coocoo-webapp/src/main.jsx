import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '../../src/dream-space/single-goal.js'
import '../../src/dream-space/single-goal-app.js'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
