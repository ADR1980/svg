/* Erster Start: der Tag, an dem Tag 1 des Zyklus liegt. Voreinstellung ist der
   nächste Montag — der Zyklus läuft danach ohne Rücksicht auf Wochentage. */

import { useState } from 'react'
import { heute, lang, naechsterMontag } from '../lib/datum'
import { useSpeicher } from '../state/speicher'

export function Einrichtung() {
  const { zyklusStarten } = useSpeicher()
  const [start, setStart] = useState(naechsterMontag())
  const [laeuft, setLaeuft] = useState(false)

  return (
    <div className="auftauchen">
      <p className="etikett">Erster Start</p>
      <h1 className="font-sans text-2xl text-ink">Zwölf Wochen zum Muscle-Up</h1>
      <p className="mt-4 max-w-[62ch]">
        Der Plan läuft als Achttagezyklus: Push A, Pull, Beine A, Pause, Push B, Pull, Beine B,
        Pause. Er kennt keine Wochentage, also auch kein Wochenende. Über sieben Tage ergeben sich
        im Mittel 5,25 Einheiten.
      </p>
      <p className="mt-4 max-w-[62ch]">
        Fehlt ein Tag, verschiebt sich alles — der Zähler steht still, bis eine Einheit
        abgeschlossen ist. Das ist gewollt.
      </p>

      <div className="mt-8 max-w-[24ch]">
        <label className="etikett mb-1 block" htmlFor="start">
          Tag 1 des Zyklus
        </label>
        <input
          id="start"
          type="date"
          className="feld"
          value={start}
          min={heute()}
          onChange={(e) => setStart(e.target.value)}
        />
        <p className="mt-2 font-mono text-xs text-muted">{lang(start)}</p>
      </div>

      <button
        type="button"
        className="knopf-stark mt-8"
        disabled={laeuft}
        onClick={() => {
          setLaeuft(true)
          void zyklusStarten(start)
        }}
      >
        Zyklus beginnen
      </button>
    </div>
  )
}
