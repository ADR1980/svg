/* ==========================================================================
   Eine Satzzeile.

   Der Weg, auf den es ankommt: Zeile antippen, „Satz" antippen — fertig, mit
   den Werten vom letzten Mal. Alles andere ist ein Umweg für Ausnahmen.
   ========================================================================== */

import { useEffect, useState } from 'react'
import type { Satz, Uebung } from '../lib/types'
import type { Vorbelegung } from '../lib/vorbelegung'
import { Zahlenfeld } from './Zahlenfeld'

export interface SatzWerte {
  weight_kg: number | null
  reps: number | null
  seconds: number | null
  distance_m: number | null
  rir: number | null
}

interface Args {
  uebung: Uebung | undefined
  index: number
  satz: Satz | null
  vorbelegung: Vorbelegung
  offen: boolean
  oeffnen: () => void
  schliessen: () => void
  sichern: (werte: SatzWerte) => void
  loeschen: () => void
}

export function SatzZeile({
  uebung,
  index,
  satz,
  vorbelegung,
  offen,
  oeffnen,
  schliessen,
  sichern,
  loeschen
}: Args) {
  const art = uebung?.load_type ?? 'external'
  const [werte, setWerte] = useState<SatzWerte>(() => start(satz, vorbelegung, art))

  useEffect(() => {
    if (offen) setWerte(start(satz, vorbelegung, art))
    // Beim Öffnen frisch belegen; danach gehört das Feld dem Nutzer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen])

  if (!offen) {
    return (
      <button
        type="button"
        onClick={oeffnen}
        className="ziel flex w-full items-baseline gap-4 border-b border-rule px-1 py-2 text-left"
      >
        <span className="w-6 font-mono text-xs text-muted ziffern">{index}</span>
        <span className="flex-1 font-sans text-lg text-ink ziffern">
          {satz ? zusammenfassung(satz, art) : <span className="text-muted">— antippen</span>}
        </span>
        {satz?.rir != null && (
          <span className="font-mono text-xs text-muted">RIR {satz.rir}</span>
        )}
      </button>
    )
  }

  return (
    <div className="auftauchen border-b border-ink px-1 py-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="etikett">Satz {index}</span>
        {vorbelegung.herkunft !== 'plan' && !satz && (
          <span className="font-mono text-xs text-muted">
            {vorbelegung.herkunft === 'heute' ? 'wie voriger Satz' : 'wie letztes Mal'}
          </span>
        )}
      </div>

      <div className="flex gap-3">
        {(art === 'external' || art === 'bodyweight_plus' || art === 'distance') && (
          <Zahlenfeld
            etikett={art === 'bodyweight_plus' ? 'Zusatz' : 'Gewicht'}
            einheit="kg"
            schritt={2.5}
            wert={werte.weight_kg}
            aendern={(v) => setWerte((w) => ({ ...w, weight_kg: v }))}
          />
        )}
        {(art === 'external' || art === 'bodyweight_plus' || art === 'bodyweight') && (
          <Zahlenfeld
            etikett="Wdh"
            wert={werte.reps}
            aendern={(v) => setWerte((w) => ({ ...w, reps: v }))}
          />
        )}
        {art === 'time' && (
          <Zahlenfeld
            etikett="Zeit"
            einheit="s"
            schritt={5}
            wert={werte.seconds}
            aendern={(v) => setWerte((w) => ({ ...w, seconds: v }))}
          />
        )}
        {art === 'distance' && (
          <Zahlenfeld
            etikett="Strecke"
            einheit="m"
            schritt={5}
            wert={werte.distance_m}
            aendern={(v) => setWerte((w) => ({ ...w, distance_m: v }))}
          />
        )}
      </div>

      <div className="mt-3 flex gap-3">
        <Zahlenfeld
          etikett="RIR"
          wert={werte.rir}
          aendern={(v) => setWerte((w) => ({ ...w, rir: v }))}
        />
        <div className="flex-1" />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" className="knopf-stark flex-1" onClick={() => sichern(werte)}>
          {satz ? 'Ändern' : 'Satz'}
        </button>
        <button type="button" className="knopf" onClick={schliessen}>
          Zu
        </button>
        {satz && (
          <button
            type="button"
            className="knopf"
            style={{ color: 'var(--signal)', borderColor: 'var(--signal)' }}
            onClick={loeschen}
          >
            Weg
          </button>
        )}
      </div>
    </div>
  )
}

function start(satz: Satz | null, v: Vorbelegung, art: Uebung['load_type']): SatzWerte {
  if (satz) {
    return {
      weight_kg: satz.weight_kg,
      reps: satz.reps,
      seconds: satz.seconds,
      distance_m: satz.distance_m,
      rir: satz.rir
    }
  }
  return {
    weight_kg: art === 'bodyweight' || art === 'time' ? null : v.vorschlag ?? v.gewicht,
    reps: art === 'time' ? null : v.wiederholungen,
    seconds: art === 'time' ? v.sekunden : null,
    distance_m: art === 'distance' ? v.meter : null,
    rir: v.rir
  }
}

function zusammenfassung(s: Satz, art: Uebung['load_type']): string {
  const zahl = (n: number | null) => (n == null ? '—' : String(n).replace('.', ','))
  if (art === 'time') return `${zahl(s.seconds)} s`
  if (art === 'distance') return `${zahl(s.weight_kg)} kg · ${zahl(s.distance_m)} m`
  if (art === 'bodyweight') return `${zahl(s.reps)} Wdh`
  if (art === 'bodyweight_plus') return `+${zahl(s.weight_kg ?? 0)} kg × ${zahl(s.reps)}`
  return `${zahl(s.weight_kg)} kg × ${zahl(s.reps)}`
}
