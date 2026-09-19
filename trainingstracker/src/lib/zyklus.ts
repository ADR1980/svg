/* ==========================================================================
   Der Achttagezyklus. Das Heute kommt aus cycle_state.current_day, nicht aus
   dem Kalender: Wer zwei Tage nichts macht, steht danach auf derselben Einheit.
   ========================================================================== */

import { ZYKLUS } from '../data/plan'
import { tageZwischen, type IsoDatum } from './datum'
import type { Block, VorlageId } from './types'

export const ZYKLUSLAENGE = ZYKLUS.length

export function einheitAmTag(tag: number): VorlageId | null {
  return ZYKLUS[(((tag - 1) % ZYKLUSLAENGE) + ZYKLUSLAENGE) % ZYKLUSLAENGE]
}

export function istPausentag(tag: number): boolean {
  return einheitAmTag(tag) === null
}

/** Eine abgeschlossene Einheit rückt genau eine Position weiter. */
export function naechsterTag(tag: number): number {
  return (tag % ZYKLUSLAENGE) + 1
}

/**
 * „Heute Pause": auf den nächsten Pausentag vorrücken. Der Zyklus verschiebt
 * sich dadurch dauerhaft, und das ist beabsichtigt.
 */
export function naechsterPausentag(tag: number): number {
  for (let i = 1; i <= ZYKLUSLAENGE; i++) {
    const kandidat = ((tag + i - 1) % ZYKLUSLAENGE) + 1
    if (istPausentag(kandidat)) return kandidat
  }
  return tag
}

/**
 * Woche 1 sind die Tage 0 bis 6 nach Zyklusstart. Vor dem Start zählt ebenfalls
 * Woche 1 — wer zwei Tage früher anfängt, steht nicht in Woche 0.
 */
export function wocheIndex(startedOn: IsoDatum, datum: IsoDatum): number {
  return Math.max(1, Math.floor(tageZwischen(startedOn, datum) / 7) + 1)
}

/** In der Entlastungswoche halbiert sich die Sollsatzzahl, die Last bleibt. */
export function sollSaetze(block: Block, deload: boolean): number | null {
  if (block.target_sets == null) return null
  return deload ? Math.ceil(block.target_sets / 2) : block.target_sets
}
