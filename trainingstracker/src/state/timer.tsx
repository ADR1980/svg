/* ==========================================================================
   Pausentimer. Er läuft über einen Zielzeitpunkt, nicht über einen Zähler —
   ein Handy, das den Bildschirm sperrt, hält sonst den Takt an.
   ========================================================================== */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'

interface Timer {
  rest: number | null
  gesamt: number | null
  laeuft: boolean
  starten: (sekunden: number, beschriftung: string) => void
  anhalten: () => void
  verlaengern: (sekunden: number) => void
  beschriftung: string
}

const Zusammenhang = createContext<Timer | null>(null)

export function useTimer(): Timer {
  const t = useContext(Zusammenhang)
  if (!t) throw new Error('useTimer außerhalb des Providers')
  return t
}

function piep() {
  try {
    const Klang = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Klang()
    const jetzt = ctx.currentTime
    for (let i = 0; i < 2; i++) {
      const ton = ctx.createOscillator()
      const laut = ctx.createGain()
      ton.type = 'sine'
      ton.frequency.value = 880
      laut.gain.setValueAtTime(0.0001, jetzt + i * 0.28)
      laut.gain.exponentialRampToValueAtTime(0.25, jetzt + i * 0.28 + 0.02)
      laut.gain.exponentialRampToValueAtTime(0.0001, jetzt + i * 0.28 + 0.22)
      ton.connect(laut).connect(ctx.destination)
      ton.start(jetzt + i * 0.28)
      ton.stop(jetzt + i * 0.28 + 0.24)
    }
    setTimeout(() => void ctx.close(), 1200)
  } catch {
    /* Ohne Ton ist es eben still. */
  }
}

function ruettle() {
  try {
    navigator.vibrate?.([400, 120, 400])
  } catch {
    /* Geräte ohne Vibration ignorieren das. */
  }
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [ziel, setZiel] = useState<number | null>(null)
  const [gesamt, setGesamt] = useState<number | null>(null)
  const [rest, setRest] = useState<number | null>(null)
  const [beschriftung, setBeschriftung] = useState('')
  const abgelaufen = useRef(false)

  useEffect(() => {
    if (ziel == null) return
    const takt = () => {
      const uebrig = Math.max(0, Math.round((ziel - Date.now()) / 1000))
      setRest(uebrig)
      if (uebrig === 0 && !abgelaufen.current) {
        abgelaufen.current = true
        piep()
        ruettle()
      }
    }
    takt()
    const id = window.setInterval(takt, 250)
    return () => window.clearInterval(id)
  }, [ziel])

  const starten = useCallback((sekunden: number, text: string) => {
    abgelaufen.current = false
    setGesamt(sekunden)
    setBeschriftung(text)
    setZiel(Date.now() + sekunden * 1000)
  }, [])

  const anhalten = useCallback(() => {
    setZiel(null)
    setRest(null)
    setGesamt(null)
    setBeschriftung('')
  }, [])

  const verlaengern = useCallback((sekunden: number) => {
    setZiel((z) => (z == null ? Date.now() + sekunden * 1000 : Math.max(Date.now(), z) + sekunden * 1000))
    setGesamt((g) => (g ?? 0) + sekunden)
    abgelaufen.current = false
  }, [])

  const wert = useMemo<Timer>(
    () => ({ rest, gesamt, laeuft: ziel != null, starten, anhalten, verlaengern, beschriftung }),
    [rest, gesamt, ziel, starten, anhalten, verlaengern, beschriftung]
  )

  return <Zusammenhang.Provider value={wert}>{children}</Zusammenhang.Provider>
}
