import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'   // ← move this to the top
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
