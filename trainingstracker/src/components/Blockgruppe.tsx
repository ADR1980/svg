/* ==========================================================================
   Ein Block oder ein Superset. Supersets sind eine Einheit: Runde 1 von 3,
   beide Übungen untereinander — so wird sie auch ausgeführt.
   ========================================================================== */

import { UEBUNG_NACH_ID } from '../data/plan'
import { mmss } from '../lib/datum'
import type { Block, Satz, Training } from '../lib/types'
import { vorbelegung } from '../lib/vorbelegung'
import { zahl, zielFuerBlock, zielVorgabe } from '../lib/ziel'
import { sollSaetze } from '../lib/zyklus'
import { Schema, hatSchema } from './Schema'
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
          {gruppe[0].rest_seconds ? <span>Pause {mmss(gruppe[0].rest_seconds)}</span> : null}
          {superset && <span className="uppercase tracking-[0.12em]">Im Wechsel</span>}
        </div>
      </header>

      {gruppe.map((b) => {
        const u = b.exercise_id ? UEBUNG_NACH_ID[b.exercise_id] : undefined
        const ziel = zielFuerBlock(
          b,
          u,
          args.alleSaetze,
          args.trainings,
          args.aktuellesTraining,
          deload
        )
        return (
          <div key={'ziel-' + b.id} className="mt-3 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              {superset && <p className="etikett mb-1">{u?.name}</p>}
              <p className="font-sans text-lg text-ink ziffern">
                {ziel.gewicht != null ? `${zahl(ziel.gewicht)} kg` : 'Last frei'}
                <span className="ml-2 font-mono text-xs uppercase tracking-[0.12em] text-muted">
                  Ziel
                </span>
              </p>
              <p className="mt-[2px] font-mono text-xs text-muted ziffern">{zielVorgabe(ziel)}</p>
              <p className="mt-1 text-sm leading-snug text-muted">{ziel.begruendung}</p>
              {u?.cue && <p className="mt-2 text-sm leading-snug text-body">{u.cue}</p>}
              {b.note && <p className="mt-1 text-sm italic text-body">{b.note}</p>}
              {u?.unilateral && (
                <p className="mt-1 font-mono text-xs text-muted">
                  Eine Zeile ist ein Satz je Seite.
                </p>
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

      <div className="mt-4">
        <p className="etikett border-b border-rule pb-1">Erreicht</p>
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
