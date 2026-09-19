import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'
import { SpeicherProvider } from './state/speicher'
import { TimerProvider } from './state/timer'

createRoot(document.getElementById('wurzel')!).render(
  <StrictMode>
    <SpeicherProvider>
      <TimerProvider>
        <App />
      </TimerProvider>
    </SpeicherProvider>
  </StrictMode>
)
