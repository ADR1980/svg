/* Der Schirm vor der App. Eine Zeile, ein Feld, ein Knopf. */

import { useState, type ReactNode } from 'react'
import { istOffen, merkeOffen, passt } from '../lib/schleuse'

export function Schleuse({ children }: { children: ReactNode }) {
  const [offen, setOffen] = useState(istOffen)
  const [passwort, setPasswort] = useState('')
  const [prueft, setPrueft] = useState(false)
  const [fehler, setFehler] = useState(false)

  if (offen) return <>{children}</>

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-[680px] flex-col justify-center px-4 py-16">
      <p className="etikett">Zwölf Wochen zum Muscle-Up</p>
      <h1 className="mt-1 font-sans text-2xl text-ink">Trainingstracker</h1>
      <p className="mt-4 max-w-[48ch]">
        Diese Seite ist nicht für die Allgemeinheit gedacht. Passwort eintippen, dann geht es
        weiter.
      </p>

      <form
        className="mt-8 max-w-[32ch]"
        onSubmit={async (e) => {
          e.preventDefault()
          setPrueft(true)
          setFehler(false)
          const richtig = await passt(passwort)
          setPrueft(false)
          if (richtig) {
            merkeOffen()
            setOffen(true)
          } else {
            setFehler(true)
            setPasswort('')
          }
        }}
      >
        <label className="etikett mb-1 block" htmlFor="schleuse">
          Passwort
        </label>
        <input
          id="schleuse"
          type="password"
          autoComplete="current-password"
          autoFocus
          className="feld font-serif text-base"
          value={passwort}
          onChange={(e) => setPasswort(e.target.value)}
        />
        <button type="submit" className="knopf-stark mt-6 disabled:opacity-40" disabled={prueft || !passwort}>
          {prueft ? 'Einen Moment' : 'Öffnen'}
        </button>
        {fehler && (
          <p className="mt-4 font-mono text-xs" style={{ color: 'var(--signal)' }}>
            Falsches Passwort.
          </p>
        )}
      </form>

      <p className="mt-16 max-w-[52ch] text-sm text-muted">
        Die Schleuse hält Neugierige ab, mehr nicht — sie prüft im Browser, und die Seite liegt
        öffentlich. Die Trainingsdaten selbst hängen an der Anmeldung gegen Supabase.
      </p>
    </div>
  )
}
