import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { Schleuse } from './components/Schleuse'
import './index.css'
import { SpeicherProvider } from './state/speicher'
import { TimerProvider } from './state/timer'

createRoot(document.getElementById('wurzel')!).render(
  <StrictMode>
    <Schleuse>
      <SpeicherProvider>
        <TimerProvider>
          <App />
        </TimerProvider>
      </SpeicherProvider>
    </Schleuse>
  </StrictMode>
)
