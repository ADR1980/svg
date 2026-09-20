/* ==========================================================================
   Plan. Alle fünf Einheiten zum Nachschlagen — mit Vorgabe, Ausführungshinweis
   und Zeichnung, aber ohne Eingabefelder.

   Protokolliert wird auf „Heute", und nur dort: Ein zweiter Ort, an dem Sätze
   entstehen könnten, wäre ein zweiter Ort, an dem sie verloren gehen.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { MuscleUpUeben } from '../components/MuscleUpUeben'
import { Schema, hatSchema } from '../components/Schema'
import { MU_BLOECKE, UEBUNG_NACH_ID, VORLAGEN, ZYKLUS, bloeckeVon, vorlageVon } from '../data/plan'
import { heute, mmss } from '../lib/datum'
import { gewaehlterBlock } from '../lib/muscleup'
import type { Block, VorlageId } from '../lib/types'
import { zahl, zielFuerBlock, zielVorgabe } from '../lib/ziel'
import { einheitAmTag, wocheIndex } from '../lib/zyklus'
import { useSpeicher } from '../state/speicher'
import { gruppiere } from './Heute'

export function Plan() {
  const { bestand } = useSpeicher()
  const zyklus = bestand.zyklus
  const heutige = zyklus ? einheitAmTag(zyklus.current_day) : null
  const [gewaehlt, setGewaehlt] = useState<VorlageId>(heutige ?? 'push_a')
  const vorlage = vorlageVon(gewaehlt)
  const gruppen = useMemo(() => gruppiere(bloeckeVon(gewaehlt)), [gewaehlt])
  const woche = zyklus ? wocheIndex(zyklus.started_on, heute()) : 1

  const tage = ZYKLUS.map((v, i) => (v === gewaehlt ? i + 1 : null)).filter((t): t is number => t != null)

  return (
    <div className="auftauchen">
      <p className="etikett">Plan · Achttagezyklus</p>
      <h1 className="mt-1 font-sans text-2xl text-ink">Die fünf Einheiten</h1>

      <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-b border-rule pb-2">
        {VORLAGEN.map((v) => (
          <button
            key={v.id}
            type="button"
            className="ziel font-mono text-xs uppercase tracking-[0.12em]"
            style={{
              color: gewaehlt === v.id ? 'var(--ink)' : 'var(--ink-muted)',
              borderBottom: gewaehlt === v.id ? '1px solid var(--accent)' : '1px solid transparent'
            }}
            onClick={() => setGewaehlt(v.id)}
          >
            {v.name}
          </button>
        ))}
      </nav>

      <header className="mt-8">
        <h2 className="font-sans text-xl text-ink">{vorlage.name}</h2>
        <p className="mt-1 text-lg text-ink">{vorlage.headline}</p>
        <p className="mt-2 font-mono text-xs text-muted ziffern">
          {vorlage.planned_minutes} Min · Tag {tage.join(' und ')} im Zyklus
          {heutige === gewaehlt ? ' · heute' : ''}
        </p>
      </header>

      {gruppen.map((gruppe) => (
        <Gruppe key={gruppe.map((b) => b.id).join('-')} gruppe={gruppe} woche={woche} />
      ))}

      <p className="mt-12 max-w-[62ch] text-sm text-muted">
        Eingetragen wird auf „Heute". Die Last oben ist das, was beim nächsten Mal ansteht —
        gerechnet aus dem, was zuletzt im Protokoll stand.
      </p>
    </div>
  )
}

function Gruppe({ gruppe, woche }: { gruppe: Block[]; woche: number }) {
  const { bestand } = useSpeicher()
  const erster = gruppe[0]
  const superset = gruppe.length > 1
  const geplant = gruppe.reduce((s, b) => s + b.planned_minutes, 0)

  if (erster.kind === 'warmup') {
    return (
      <section className="mt-10">
        <header className="flex items-baseline justify-between gap-3 border-b border-ink pb-2">
          <h3 className="font-sans text-lg text-ink">
            <span className="mr-2 font-mono text-xs text-muted">{erster.label}</span>
            Aufwärmen
          </h3>
          <span className="whitespace-nowrap font-mono text-xs text-muted">{geplant} Min</span>
        </header>
        <p className="mt-2 text-sm text-body">{erster.note}</p>
      </section>
    )
  }

  if (erster.kind === 'muscleup') {
    const block = gewaehlterBlock(woche)
    const beschreibung = MU_BLOECKE.find((m) => m.id === block)
    return (
      <section className="mt-10">
        <header className="flex items-baseline justify-between gap-3 border-b border-ink pb-2">
          <h3 className="font-sans text-lg text-ink">
            <span className="mr-2 font-mono text-xs text-muted">{erster.label}</span>
            Muscle-Up · {beschreibung?.name}
          </h3>
          <span className="whitespace-nowrap font-mono text-xs text-muted">{geplant} Min</span>
        </header>
        <p className="mt-1 font-mono text-xs text-muted ziffern">
          RIR {erster.target_rir} · Pause {mmss(erster.rest_seconds ?? 90)}
        </p>
        <MuscleUpUeben blockId={block} trainingId={null} pauseSekunden={erster.rest_seconds ?? 90} />
      </section>
    )
  }

  return (
    <section className="mt-10">
      <header className="border-b border-ink pb-2">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-sans text-lg text-ink">
            <span className="mr-2 font-mono text-xs text-muted">
              {gruppe.map((b) => b.label).join(' + ')}
            </span>
            {gruppe.map((b) => (b.exercise_id ? UEBUNG_NACH_ID[b.exercise_id]?.name : '')).join(' · ')}
          </h3>
          <span className="whitespace-nowrap font-mono text-xs text-muted">{geplant} Min</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 font-mono text-xs text-muted ziffern">
          {erster.rest_seconds ? <span>Pause {mmss(erster.rest_seconds)}</span> : null}
          {superset && <span className="uppercase tracking-[0.12em]">Im Wechsel</span>}
        </div>
      </header>

      {gruppe.map((b) => {
        const u = b.exercise_id ? UEBUNG_NACH_ID[b.exercise_id] : undefined
        const ziel = zielFuerBlock(b, u, bestand.saetze, bestand.trainings, null, false)
        return (
          <div key={b.id} className="mt-3 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              {superset && <p className="etikett mb-1">{u?.name}</p>}
              <p className="font-sans text-lg text-ink ziffern">
                {ziel.gewicht != null ? `${zahl(ziel.gewicht)} kg` : 'Last frei'}
                <span className="ml-2 font-mono text-xs uppercase tracking-[0.12em] text-muted">
                  {ziel.grund === 'erstes_mal' ? 'noch offen' : 'nächstes Mal'}
                </span>
              </p>
              <p className="mt-[2px] font-mono text-xs text-muted ziffern">{zielVorgabe(ziel)}</p>
              {u?.cue && <p className="mt-2 text-sm leading-snug text-body">{u.cue}</p>}
              {b.note && <p className="mt-1 text-sm italic text-body">{b.note}</p>}
              {u?.unilateral && (
                <p className="mt-1 font-mono text-xs text-muted">Eine Zeile ist ein Satz je Seite.</p>
              )}
            </div>
            {hatSchema(b.exercise_id) && (
              <div className="shrink-0">
                <Schema uebungId={b.exercise_id!} breite={104} />
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}
