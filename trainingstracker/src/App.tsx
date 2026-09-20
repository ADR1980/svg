/* ==========================================================================
   Gerüst: Kopf, fünf Schirme, Pausentimer am unteren Rand.
   ========================================================================== */

import { Suspense, lazy, useEffect, useState } from 'react'
import { Anmeldung } from './components/Anmeldung'
import { Pausentimer } from './components/Pausentimer'
import { Heute } from './screens/Heute'
import { Plan } from './screens/Plan'
import { Koerper } from './screens/Koerper'
import { Verlauf } from './screens/Verlauf'
import { useSpeicher } from './state/speicher'

// Die Diagramme wiegen mehr als der Rest der App zusammen. Wer zwischen zwei
// Sätzen „Heute" öffnet, soll sie nicht mitladen.
const Auswertung = lazy(() => import('./screens/Auswertung').then((m) => ({ default: m.Auswertung })))
const MuscleUp = lazy(() => import('./screens/MuscleUp').then((m) => ({ default: m.MuscleUp })))

type Schirm = 'heute' | 'plan' | 'muscleup' | 'verlauf' | 'auswertung' | 'koerper'

const SCHIRME: { id: Schirm; name: string }[] = [
  { id: 'heute', name: 'Heute' },
  { id: 'plan', name: 'Plan' },
  { id: 'muscleup', name: 'Muscle-Up' },
  { id: 'verlauf', name: 'Verlauf' },
  { id: 'auswertung', name: 'Auswertung' },
  { id: 'koerper', name: 'Körper' }
]

type Schema = 'system' | 'hell' | 'dunkel'

export function App() {
  const { bereit, online, offen, angemeldet, fernbetrieb } = useSpeicher()
  const [schirm, setSchirm] = useState<Schirm>('heute')
  const [konto, setKonto] = useState(false)
  const [schema, setSchema] = useState<Schema>(() => ladeSchema())

  useEffect(() => {
    const wurzel = document.documentElement
    if (schema === 'system') wurzel.removeAttribute('data-schema')
    else wurzel.setAttribute('data-schema', schema)
    try {
      localStorage.setItem('trainingstracker-schema', schema)
    } catch {
      /* Privates Fenster: dann gilt das System. */
    }
  }, [schema])

  if (!bereit) {
    return (
      <div className="mx-auto max-w-[680px] px-4 py-16">
        <p className="etikett">Einen Moment</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[680px] px-4 pb-32 pt-6">
      <header className="border-b border-ink pb-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
            Zwölf Wochen zum Muscle-Up
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="font-mono text-xs uppercase tracking-[0.12em] text-muted"
              onClick={() => setSchema(schema === 'dunkel' ? 'hell' : schema === 'hell' ? 'system' : 'dunkel')}
              title={`Farbschema: ${schema}`}
            >
              {schema === 'dunkel' ? 'Dunkel' : schema === 'hell' ? 'Hell' : 'System'}
            </button>
            <button
              type="button"
              className="font-mono text-xs uppercase tracking-[0.12em]"
              style={{ color: konto ? 'var(--accent)' : 'var(--ink-muted)' }}
              onClick={() => setKonto((x) => !x)}
            >
              Konto
            </button>
          </div>
        </div>
      </header>

      {(!online || (fernbetrieb && (offen > 0 || !angemeldet))) && (
        <p className="mt-2 font-mono text-xs ziffern" style={{ color: 'var(--signal)' }}>
          {!online && 'Kein Netz — es wird örtlich protokolliert. '}
          {fernbetrieb && angemeldet && offen > 0 && `${offen} Änderungen warten.`}
          {fernbetrieb && !angemeldet && 'Nicht angemeldet — alles bleibt auf dem Gerät.'}
        </p>
      )}

      {konto && <Anmeldung schliessen={() => setKonto(false)} />}

      <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-b border-rule pb-2">
        {SCHIRME.map((s) => (
          <button
            key={s.id}
            type="button"
            className="ziel font-mono text-xs uppercase tracking-[0.12em]"
            style={{
              color: schirm === s.id ? 'var(--ink)' : 'var(--ink-muted)',
              borderBottom: schirm === s.id ? '1px solid var(--accent)' : '1px solid transparent'
            }}
            onClick={() => setSchirm(s.id)}
          >
            {s.name}
          </button>
        ))}
      </nav>

      <main className="mt-8">
        <Suspense fallback={<p className="etikett">Einen Moment</p>}>
          {schirm === 'heute' && <Heute />}
          {schirm === 'plan' && <Plan />}
          {schirm === 'muscleup' && <MuscleUp />}
          {schirm === 'verlauf' && <Verlauf />}
          {schirm === 'auswertung' && <Auswertung />}
          {schirm === 'koerper' && <Koerper />}
        </Suspense>
      </main>

      <footer className="mt-16 border-t border-rule pt-2 font-mono text-xs text-muted">
        Plan vom 19. September 2026 · Volumenmethodik nach Pelland et al., Sports Medicine 2025
      </footer>

      <Pausentimer />
    </div>
  )
}

function ladeSchema(): Schema {
  try {
    const roh = localStorage.getItem('trainingstracker-schema')
    if (roh === 'hell' || roh === 'dunkel' || roh === 'system') return roh
  } catch {
    /* dann eben System */
  }
  return 'system'
}
