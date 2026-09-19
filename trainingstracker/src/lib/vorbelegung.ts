/* ==========================================================================
   Was im Feld steht, bevor der Nutzer es anfasst.

   Regel der Spezifikation: der zuletzt verwendete Wert derselben Übung steht
   bereits drin. Innerhalb einer Einheit ist das der vorige Satz, sonst das
   letzte Mal — und wenn das letzte Mal sauber durchlief, der nächste Schritt.
   ========================================================================== */

import { progressionsVorschlag } from './rechnen'
import type { Block, Satz, Training, Uebung } from './types'

export interface Vorbelegung {
  gewicht: number | null
  wiederholungen: number | null
  sekunden: number | null
  meter: number | null
  rir: number | null
  /** Vorschlag für mehr Last, wenn das letzte Mal oben ankam. */
  vorschlag: number | null
  herkunft: 'heute' | 'letztes_mal' | 'plan'
}

export function vorbelegung(
  block: Block,
  uebung: Uebung | undefined,
  saetzeDesTrainings: Satz[],
  alleSaetze: Satz[],
  trainings: Training[],
  aktuellesTraining: string | null
): Vorbelegung {
  const plan: Vorbelegung = {
    gewicht: null,
    wiederholungen: block.rep_min ?? null,
    sekunden: uebung?.load_type === 'time' ? block.rep_min ?? null : null,
    meter: uebung?.load_type === 'distance' ? block.rep_min ?? null : null,
    rir: null,
    vorschlag: null,
    herkunft: 'plan'
  }

  const eigene = saetzeDesTrainings
    .filter((s) => s.block_id === block.id && !s.is_warmup)
    .sort((a, b) => a.set_index - b.set_index)
  if (eigene.length > 0) {
    return { ...ausSatz(eigene[eigene.length - 1], plan), vorschlag: null, herkunft: 'heute' }
  }

  const frueher = frueherSaetze(block, alleSaetze, trainings, aktuellesTraining)
  if (frueher.length === 0) return plan

  const letzter = frueher[frueher.length - 1]
  const vorschlag = progressionsVorschlag(block, uebung, frueher)
  return {
    ...ausSatz(letzter, plan),
    vorschlag: vorschlag?.grund === 'mehr_last' ? vorschlag.gewicht : null,
    herkunft: 'letztes_mal'
  }
}

function ausSatz(s: Satz, plan: Vorbelegung): Vorbelegung {
  return {
    ...plan,
    gewicht: s.weight_kg,
    wiederholungen: s.reps ?? plan.wiederholungen,
    sekunden: s.seconds ?? plan.sekunden,
    meter: s.distance_m ?? plan.meter,
    rir: s.rir
  }
}

/**
 * Die Sätze desselben Blocks aus der jüngsten früheren Einheit. Gibt es den
 * Block dort nicht, gilt die Übung — Trizeps am Kabel steht in Push A und B.
 */
export function frueherSaetze(
  block: Block,
  alleSaetze: Satz[],
  trainings: Training[],
  aktuellesTraining: string | null
): Satz[] {
  const sortiert = [...trainings]
    .filter((t) => t.id !== aktuellesTraining)
    .sort((a, b) => (a.performed_on < b.performed_on ? 1 : a.performed_on > b.performed_on ? -1 : 0))

  for (const t of sortiert) {
    const desBlocks = alleSaetze
      .filter((s) => s.workout_id === t.id && s.block_id === block.id && !s.is_warmup)
      .sort((a, b) => a.set_index - b.set_index)
    if (desBlocks.length > 0) return desBlocks
  }
  if (!block.exercise_id) return []
  for (const t of sortiert) {
    const derUebung = alleSaetze
      .filter((s) => s.workout_id === t.id && s.exercise_id === block.exercise_id && !s.is_warmup)
      .sort((a, b) => a.set_index - b.set_index)
    if (derUebung.length > 0) return derUebung
  }
  return []
}
