/* ==========================================================================
   Das Ziel einer Übung für heute.

   Es steht nicht im Plan — der Plan gibt Sätze, Wiederholungsbereich und RIR
   vor, die Last ergibt sich aus dem letzten Mal. Genau das rechnet diese
   Datei: Wer das letzte Mal in allen Arbeitssätzen die obere Grenze bei
   erreichtem Ziel-RIR geschafft hat, bekommt mehr Last vorgegeben — 2,5 kg im
   Oberkörper, 5 kg im Unterkörper. Sonst bleibt das Gewicht stehen, bis der
   Bereich voll ist.
   ========================================================================== */

import { progressionsVorschlag } from './rechnen'
import type { Block, Satz, Training, Uebung } from './types'
import { frueherSaetze } from './vorbelegung'
import { sollSaetze } from './zyklus'

export type Zielgrund = 'erstes_mal' | 'gehalten' | 'mehr_last'

export interface Ziel {
  /** Last in kg; bei Körpergewichtsübungen die Zusatzlast, sonst null. */
  gewicht: number | null
  saetze: number | null
  von: number | null
  bis: number | null
  /** 'kg' · 's' · 'm' — woran der Bereich bemessen ist. */
  einheit: 'wdh' | 's' | 'm'
  rir: string | null
  grund: Zielgrund
  /** Ein Satz, der die Vorgabe begründet. Steht unter dem Ziel. */
  begruendung: string
}

export function zielFuerBlock(
  block: Block,
  uebung: Uebung | undefined,
  alleSaetze: Satz[],
  trainings: Training[],
  aktuellesTraining: string | null,
  deload: boolean
): Ziel {
  const einheit: Ziel['einheit'] =
    uebung?.load_type === 'time' ? 's' : uebung?.load_type === 'distance' ? 'm' : 'wdh'

  const grundgeruest = {
    saetze: sollSaetze(block, deload),
    von: block.rep_min,
    bis: block.rep_max,
    einheit,
    rir: block.target_rir
  }

  const frueher = frueherSaetze(block, alleSaetze, trainings, aktuellesTraining)
  if (frueher.length === 0) {
    return {
      ...grundgeruest,
      gewicht: null,
      grund: 'erstes_mal',
      begruendung: 'Noch kein Wert. Heute einpendeln, ab dem nächsten Mal rechnet die App.'
    }
  }

  const vorschlag = progressionsVorschlag(block, uebung, frueher)
  const letzteLast = letztesGewicht(frueher)
  const gemacht = zusammenfassung(frueher, einheit)

  if (vorschlag?.grund === 'mehr_last') {
    const sprung = Math.round((vorschlag.gewicht - (letzteLast ?? 0)) * 10) / 10
    return {
      ...grundgeruest,
      gewicht: vorschlag.gewicht,
      grund: 'mehr_last',
      begruendung: `Letztes Mal ${gemacht} — obere Grenze erreicht, also ${zahl(sprung)} kg mehr.`
    }
  }

  return {
    ...grundgeruest,
    gewicht: letzteLast,
    grund: 'gehalten',
    begruendung: `Letztes Mal ${gemacht}. Gewicht bleibt, bis der Bereich oben voll ist.`
  }
}

/** '5 × 7 bei 80 kg' oder '4 × 25 s' — knapp genug für eine Zeile. */
function zusammenfassung(saetze: Satz[], einheit: Ziel['einheit']): string {
  const werte = saetze.map((s) =>
    einheit === 's' ? s.seconds : einheit === 'm' ? s.distance_m : s.reps
  )
  const vorhanden = werte.filter((w): w is number => w != null)
  const spanne =
    vorhanden.length === 0
      ? '—'
      : Math.min(...vorhanden) === Math.max(...vorhanden)
        ? String(Math.min(...vorhanden))
        : `${Math.min(...vorhanden)}–${Math.max(...vorhanden)}`
  const anhang = einheit === 's' ? ' s' : einheit === 'm' ? ' m' : ''
  const last = letztesGewicht(saetze)
  return `${saetze.length} × ${spanne}${anhang}` + (last != null ? ` bei ${zahl(last)} kg` : '')
}

function letztesGewicht(saetze: Satz[]): number | null {
  for (let i = saetze.length - 1; i >= 0; i--) {
    if (saetze[i].weight_kg != null) return Number(saetze[i].weight_kg)
  }
  return null
}

export function zahl(n: number): string {
  return String(Math.round(n * 100) / 100).replace('.', ',')
}

/** '5 × 5–7 Wdh · RIR 2' für den Blockkopf. */
export function zielVorgabe(ziel: Ziel): string {
  const bereich =
    ziel.von == null
      ? 'variabel'
      : ziel.bis == null || ziel.bis === ziel.von
        ? String(ziel.von)
        : `${ziel.von}–${ziel.bis}`
  const anhang = ziel.einheit === 's' ? ' s' : ziel.einheit === 'm' ? ' m' : ' Wdh'
  return (
    `${ziel.saetze ?? '—'} × ${bereich}${anhang}` + (ziel.rir ? ` · RIR ${ziel.rir}` : '')
  )
}
