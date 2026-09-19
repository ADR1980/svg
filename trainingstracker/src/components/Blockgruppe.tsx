/* ==========================================================================
   Ein Block oder ein Superset. Supersets sind eine Einheit: Runde 1 von 3,
   beide Übungen untereinander — so wird sie auch ausgeführt.
   ========================================================================== */

import { UEBUNG_NACH_ID } from '../data/plan'
import { mmss } from '../lib/datum'
import type { Block, Satz, Training } from '../lib/types'
import { vorbelegung } from '../lib/vorbelegung'
import { sollSaetze } from '../lib/zyklus'
import { SatzZeile, type SatzWerte } from './SatzZeile'

interface Args {
  gruppe: Block[]
  deload: boolean
  saetzeDesTrainings: Satz[]
  alleSaetze: Satz[]
  trainings: Training[]
  aktuellesTraining: string | null
  offen: string | null
  setOffen: (schluessel: string | null) => void
  sichern: (block: Block, index: number, satz: Satz | null, werte: SatzWerte) => void
  loeschen: (satzId: string) => void
}

export function Blockgruppe(args: Args) {
  const { gruppe, deload } = args
  const superset = gruppe.length > 1
  const runden = Math.max(...gruppe.map((b) => sollSaetze(b, deload) ?? 1))
  const geplant = gruppe.reduce((s, b) => s + b.planned_minutes, 0)

  return (
    <section className="mt-10">
      <header className="border-b border-ink pb-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-sans text-lg text-ink">
            <span className="mr-2 font-mono text-xs text-muted">
              {gruppe.map((b) => b.label).join(' + ')}
            </span>
            {gruppe.map((b) => (b.exercise_id ? UEBUNG_NACH_ID[b.exercise_id]?.name : '')).join(' · ')}
          </h2>
          {geplant > 0 && (
            <span className="whitespace-nowrap font-mono text-xs text-muted">{geplant} Min</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 font-mono text-xs text-muted ziffern">
          {gruppe.map((b) => (
            <span key={b.id}>
              {sollSaetze(b, deload)} × {bereich(b)}
              {b.target_rir ? ` · RIR ${b.target_rir}` : ''}
              {b.rest_seconds ? ` · Pause ${mmss(b.rest_seconds)}` : ''}
            </span>
          ))}
        </div>
        {superset && (
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.12em] text-muted">
            Im Wechsel
          </p>
        )}
      </header>

      {gruppe.map((b) => {
        const u = b.exercise_id ? UEBUNG_NACH_ID[b.exercise_id] : undefined
        return (
          <div key={'hinweis-' + b.id} className="mt-2">
            {u?.cue && (
              <p className="text-sm leading-snug text-muted">
                {superset ? `${u.name}: ` : ''}
                {u.cue}
              </p>
            )}
            {b.note && <p className="mt-1 text-sm italic text-body">{b.note}</p>}
            {u?.unilateral && (
              <p className="mt-1 font-mono text-xs text-muted">
                Eine Zeile ist ein Satz je Seite.
              </p>
            )}
          </div>
        )
      })}

      <div className="mt-3">
        {Array.from({ length: runden }, (_, r) => r + 1).map((runde) => (
          <div key={runde} className={superset ? 'mb-4' : ''}>
            {superset && (
              <p className="etikett mt-2 mb-1">
                Runde {runde} von {runden}
              </p>
            )}
            {gruppe.map((b) => {
              const u = b.exercise_id ? UEBUNG_NACH_ID[b.exercise_id] : undefined
              const satz =
                args.saetzeDesTrainings.find(
                  (s) => s.block_id === b.id && s.set_index === runde && !s.is_warmup
                ) ?? null
              const schluessel = `${b.id}:${runde}`
              const belegung = vorbelegung(
                b,
                u,
                args.saetzeDesTrainings,
                args.alleSaetze,
                args.trainings,
                args.aktuellesTraining
              )
              return (
                <div key={schluessel}>
                  {superset && (
                    <p className="mt-2 font-mono text-xs text-muted">{u?.name}</p>
                  )}
                  <SatzZeile
                    block={b}
                    uebung={u}
                    index={runde}
                    satz={satz}
                    vorbelegung={belegung}
                    offen={args.offen === schluessel}
                    oeffnen={() => args.setOffen(schluessel)}
                    schliessen={() => args.setOffen(null)}
                    sichern={(werte) => args.sichern(b, runde, satz, werte)}
                    loeschen={() => satz && args.loeschen(satz.id)}
                  />
                </div>
              )
            })}
          </div>
        ))}

        {/* Zusätzliche Sätze über den Plan hinaus bleiben sichtbar. */}
        {gruppe.map((b) =>
          args.saetzeDesTrainings
            .filter((s) => s.block_id === b.id && s.set_index > runden)
            .sort((x, y) => x.set_index - y.set_index)
            .map((s) => {
              const u = b.exercise_id ? UEBUNG_NACH_ID[b.exercise_id] : undefined
              const schluessel = `${b.id}:${s.set_index}`
              return (
                <SatzZeile
                  key={schluessel}
                  block={b}
                  uebung={u}
                  index={s.set_index}
                  satz={s}
                  vorbelegung={vorbelegung(
                    b,
                    u,
                    args.saetzeDesTrainings,
                    args.alleSaetze,
                    args.trainings,
                    args.aktuellesTraining
                  )}
                  offen={args.offen === schluessel}
                  oeffnen={() => args.setOffen(schluessel)}
                  schliessen={() => args.setOffen(null)}
                  sichern={(werte) => args.sichern(b, s.set_index, s, werte)}
                  loeschen={() => args.loeschen(s.id)}
                />
              )
            })
        )}

        <div className="mt-2 flex gap-3">
          {gruppe.map((b) => (
            <button
              key={'mehr-' + b.id}
              type="button"
              className="knopf"
              onClick={() => {
                const hoechster = args.saetzeDesTrainings
                  .filter((s) => s.block_id === b.id)
                  .reduce((m, s) => Math.max(m, s.set_index), 0)
                args.setOffen(`${b.id}:${Math.max(runden, hoechster) + 1}`)
              }}
            >
              Satz dazu{gruppe.length > 1 ? ` ${b.label}` : ''}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function bereich(b: Block): string {
  const einheit = b.exercise_id && UEBUNG_NACH_ID[b.exercise_id]?.load_type
  const zusatz = einheit === 'time' ? ' s' : einheit === 'distance' ? ' m' : ''
  if (b.rep_min == null) return 'variabel'
  if (b.rep_max == null || b.rep_max === b.rep_min) return `${b.rep_min}${zusatz}`
  return `${b.rep_min}–${b.rep_max}${zusatz}`
}
