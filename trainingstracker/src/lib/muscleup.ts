/* Auswahl des aktiven Muscle-Up-Blocks: nach Woche, aber übersteuerbar. */

import { MU_BLOECKE } from '../data/plan'

const SCHLUESSEL = 'trainingstracker-mublock'

export function blockFuerWoche(woche: number): number {
  const treffer = MU_BLOECKE.find((b) => woche >= b.week_from && woche <= b.week_to)
  if (treffer) return treffer.id
  return woche < MU_BLOECKE[0].week_from ? MU_BLOECKE[0].id : MU_BLOECKE[MU_BLOECKE.length - 1].id
}

export function gewaehlterBlock(woche: number): number {
  const eigen = ladeWahl()
  return eigen ?? blockFuerWoche(woche)
}

export function ladeWahl(): number | null {
  try {
    const roh = localStorage.getItem(SCHLUESSEL)
    return roh ? Number(roh) : null
  } catch {
    return null
  }
}

export function speichereWahl(block: number | null): void {
  try {
    if (block == null) localStorage.removeItem(SCHLUESSEL)
    else localStorage.setItem(SCHLUESSEL, String(block))
  } catch {
    /* Privates Fenster: dann gilt eben die Woche. */
  }
}
