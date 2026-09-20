/* ==========================================================================
   Die Muscle-Up-Übungen eines Blocks, mit Protokoll.

   Explosive Klimmzüge haben eine eigene Bedienung: Der Satz endet, sobald die
   Geschwindigkeit nachlässt. Das Formular besteht deshalb nicht auf der
   Sollzahl und fragt stattdessen, wo der Abfall kam.
   ========================================================================== */

import { useState } from 'react'
import { MU_UEBUNGEN } from '../data/plan'
import { heute } from '../lib/datum'
import { useSpeicher } from '../state/speicher'
import { useTimer } from '../state/timer'
import { Zahlenfeld } from './Zahlenfeld'

interface Args {
  blockId: number
  trainingId: string | null
  pauseSekunden?: number
}

export function MuscleUpUeben({ blockId, trainingId, pauseSekunden = 90 }: Args) {
  const { bestand, muEintragSichern } = useSpeicher()
  const { starten } = useTimer()
  const [offen, setOffen] = useState<number | null>(null)
  const uebungen = MU_UEBUNGEN.filter((d) => d.block_id === blockId).sort(
    (a, b) => a.ordinal - b.ordinal
  )
  const tag = heute()

  return (
    <div className="mt-3">
      {uebungen.map((d) => {
        const heuteGetan = bestand.muEintraege.filter(
          (e) => e.drill_id === d.id && e.performed_on === tag
        )
        return (
          <div key={d.id} className="border-b border-rule py-3">
            <button
              type="button"
              className="ziel w-full text-left"
              onClick={() => setOffen(offen === d.id ? null : d.id)}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-sans text-base text-ink">{d.name}</span>
                <span className="font-mono text-xs text-muted ziffern">{d.prescription}</span>
              </div>
              {d.cue && <p className="mt-1 text-sm leading-snug text-muted">{d.cue}</p>}
              {heuteGetan.length > 0 && (
                <p className="mt-1 font-mono text-xs ziffern" style={{ color: 'var(--accent)' }}>
                  heute: {heuteGetan.map((e) => `${e.sets_done ?? '—'} × ${e.reps_done ?? '—'}`).join(', ')}
                </p>
              )}
            </button>
            {offen === d.id && (
              <Formular
                explosiv={/explosiv/i.test(d.name)}
                sichern={async (werte) => {
                  await muEintragSichern({
                    id: crypto.randomUUID(),
                    workout_id: trainingId,
                    drill_id: d.id,
                    performed_on: tag,
                    sets_done: werte.saetze,
                    reps_done: werte.wdh,
                    quality: werte.qualitaet,
                    note: werte.abfall != null ? `Geschwindigkeit fiel ab bei Wdh. ${werte.abfall}` : null
                  })
                  setOffen(null)
                  starten(pauseSekunden, d.name)
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

interface Werte {
  saetze: number | null
  wdh: number | null
  qualitaet: number | null
  abfall: number | null
}

function Formular({
  explosiv,
  sichern
}: {
  explosiv: boolean
  sichern: (werte: Werte) => void
}) {
  const [werte, setWerte] = useState<Werte>({ saetze: 1, wdh: null, qualitaet: 3, abfall: null })

  return (
    <div className="auftauchen mt-3">
      <div className="flex gap-3">
        <Zahlenfeld
          etikett="Sätze"
          wert={werte.saetze}
          aendern={(v) => setWerte((w) => ({ ...w, saetze: v }))}
        />
        <Zahlenfeld
          etikett="Wdh oder s"
          wert={werte.wdh}
          aendern={(v) => setWerte((w) => ({ ...w, wdh: v }))}
        />
      </div>
      {explosiv && (
        <div className="mt-3">
          <Zahlenfeld
            etikett="Abfall bei Wdh"
            wert={werte.abfall}
            aendern={(v) => setWerte((w) => ({ ...w, abfall: v }))}
          />
        </div>
      )}
      <div className="mt-3">
        <div className="etikett mb-1">Qualität</div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((q) => (
            <button
              key={q}
              type="button"
              className="ziel flex-1 border font-mono text-sm ziffern"
              style={{
                borderColor: werte.qualitaet === q ? 'var(--accent)' : 'var(--rule)',
                color: werte.qualitaet === q ? 'var(--accent)' : 'var(--ink-muted)'
              }}
              onClick={() => setWerte((w) => ({ ...w, qualitaet: q }))}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className="knopf-stark mt-4 w-full" onClick={() => sichern(werte)}>
        Eintragen
      </button>
    </div>
  )
}
