/* Anmeldung und Zustand der Verbindung. Ohne Supabase-Zugang bleibt alles auf
   dem Gerät — das steht dann auch hier. */

import { useState } from 'react'
import { useSpeicher } from '../state/speicher'

export function Anmeldung({ schliessen }: { schliessen: () => void }) {
  const {
    angemeldet,
    emailAdresse,
    anmelden,
    passwortAendern,
    abmelden,
    abgleichen,
    offen,
    letzterAbgleich,
    fernbetrieb,
    meldung
  } = useSpeicher()
  const [email, setEmail] = useState('')
  const [passwort, setPasswort] = useState('')
  const [neu, setNeu] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [laeuft, setLaeuft] = useState(false)

  return (
    <div className="auftauchen mt-6 border-t border-ink pt-6">
      {!fernbetrieb ? (
        <p className="max-w-[62ch] text-sm text-body">
          Diese Ausgabe läuft ohne Supabase-Zugang: alles liegt in IndexedDB auf diesem Gerät und
          geht mit dem Browserspeicher verloren. Für den Abgleich brauchen{' '}
          <code className="font-mono text-xs">VITE_SUPABASE_URL</code> und{' '}
          <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> einen Wert.
        </p>
      ) : angemeldet ? (
        <div>
          <p className="etikett">Angemeldet</p>
          <p className="mt-1 font-sans text-lg text-ink">{emailAdresse}</p>
          <p className="mt-2 font-mono text-xs text-muted ziffern">
            {offen === 0 ? 'Nichts offen' : `${offen} Änderungen in der Warteschlange`}
            {letzterAbgleich && ` · Abgleich ${new Date(letzterAbgleich).toLocaleTimeString('de-DE')}`}
          </p>
          <div className="mt-4 flex gap-3">
            <button type="button" className="knopf" onClick={() => void abgleichen()}>
              Jetzt abgleichen
            </button>
            <button type="button" className="knopf" onClick={() => void abmelden()}>
              Abmelden
            </button>
          </div>
          <Passwortwechsel aendern={passwortAendern} />
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setLaeuft(true)
            const antwort = await anmelden(email, passwort, neu)
            setLaeuft(false)
            setFehler(antwort)
            if (!antwort) schliessen()
          }}
        >
          <p className="etikett">{neu ? 'Zugang anlegen' : 'Anmelden'}</p>
          <div className="mt-3 max-w-[38ch]">
            <label className="etikett mb-1 block" htmlFor="email">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="feld font-serif text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className="etikett mb-1 mt-4 block" htmlFor="passwort">
              Passwort
            </label>
            <input
              id="passwort"
              type="password"
              autoComplete={neu ? 'new-password' : 'current-password'}
              className="feld font-serif text-base"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" className="knopf-stark" disabled={laeuft}>
              {neu ? 'Anlegen' : 'Anmelden'}
            </button>
            <button type="button" className="knopf" onClick={() => setNeu((x) => !x)}>
              {neu ? 'Ich habe schon einen' : 'Neuer Zugang'}
            </button>
          </div>
          {fehler && (
            <p className="mt-3 font-mono text-xs" style={{ color: 'var(--signal)' }}>
              {fehler}
            </p>
          )}
          <p className="mt-4 max-w-[62ch] text-sm text-muted">
            Ohne Anmeldung protokolliert die App weiter, aber nur hier. Sobald ein Zugang steht,
            wandert alles in der Warteschlange nach oben.
          </p>
        </form>
      )}
      {meldung && (
        <p className="mt-3 font-mono text-xs" style={{ color: 'var(--signal)' }}>
          {meldung}
        </p>
      )}
    </div>
  )
}

/** Passwort ändern, ohne den Umweg über Supabase. */
function Passwortwechsel({ aendern }: { aendern: (neu: string) => Promise<string | null> }) {
  const [offen, setOffen] = useState(false)
  const [neu, setNeu] = useState('')
  const [antwort, setAntwort] = useState<string | null>(null)
  const [fertig, setFertig] = useState(false)

  if (!offen) {
    return (
      <button type="button" className="knopf mt-3" onClick={() => setOffen(true)}>
        Passwort ändern
      </button>
    )
  }

  return (
    <form
      className="auftauchen mt-4 max-w-[32ch]"
      onSubmit={async (e) => {
        e.preventDefault()
        const fehler = await aendern(neu)
        setAntwort(fehler)
        if (!fehler) {
          setFertig(true)
          setNeu('')
          setOffen(false)
        }
      }}
    >
      <label className="etikett mb-1 block" htmlFor="neuespasswort">
        Neues Passwort
      </label>
      <input
        id="neuespasswort"
        type="password"
        autoComplete="new-password"
        className="feld font-serif text-base"
        value={neu}
        onChange={(e) => setNeu(e.target.value)}
        minLength={8}
        required
      />
      <div className="mt-3 flex gap-3">
        <button type="submit" className="knopf-stark">
          Übernehmen
        </button>
        <button type="button" className="knopf" onClick={() => setOffen(false)}>
          Abbrechen
        </button>
      </div>
      {antwort && (
        <p className="mt-3 font-mono text-xs" style={{ color: 'var(--signal)' }}>
          {antwort}
        </p>
      )}
      {fertig && <p className="mt-3 font-mono text-xs text-muted">Passwort gewechselt.</p>}
    </form>
  )
}
