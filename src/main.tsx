import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.tsx'
import { listenForInstallPrompt } from './features/install/nativeInstallPrompt.ts'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Element #root not found in index.html')
}

// Before mounting React: the browser may offer to install the app right after loading
listenForInstallPrompt()

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
