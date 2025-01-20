import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import TermSelect from './pages/TermSelect/TermSelect.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TermSelect />
  </StrictMode>,
)
