/* ==========================================================================
   Die Rechenregeln aus der Spezifikation, an einer Stelle und ohne UI.
   Grundlage der Volumenmethodik: Pelland et al., Sports Medicine 2025.
   ========================================================================== */

import { UEBUNG_NACH_ID } from '../data/plan'
import { isoWoche, type IsoDatum } from './datum'
import type { Block, Koerperwert, Muskelgruppe, Satz, Training, Uebung } from './types'

const OBERKOERPER_SPRUNG = 2.5
const UNTERKOERPER_SPRUNG = 5
const UNTERKOERPER: Muskelgruppe[] = ['quads', 'hamstrings_glutes', 'calves']

export type VolumenZeile = Partial<Record<Muskelgruppe, number>>

/**
 * Gewichtete Satzzahl: jeder abgeschlossene Arbeitssatz zählt 1,0 für jeden
 * Primär- und 0,5 für jeden Sekundärmuskel seiner Übung. Aufwärmsätze zählen
 * nicht, und Sätze ohne hinterlegte Übung — der Muscle-Up-Block — auch nicht.
 */
export function gewichteteSaetze(
  saetze: Satz[],
  uebungen: Record<string, Uebung> = UEBUNG_NACH_ID
): VolumenZeile {
  const summe: VolumenZeile = {}
  for (const s of saetze) {
    if (s.is_warmup || !s.exercise_id) continue
    const u = uebungen[s.exercise_id]
    if (!u) continue
    for (const m of u.primary_muscles) summe[m] = (summe[m] ?? 0) + 1
    for (const m of u.secondary_muscles) summe[m] = (summe[m] ?? 0) + 0.5
  }
  return summe
}

/** Gewichtete Sätze je ISO-Woche. Datum kommt aus dem Training, nicht aus dem Satz. */
export function volumenJeWoche(
  trainings: Training[],
  saetze: Satz[],
  uebungen: Record<string, Uebung> = UEBUNG_NACH_ID
): Record<string, VolumenZeile> {
  const datumJeTraining = new Map(trainings.map((t) => [t.id, t.performed_on]))
  const nachWoche = new Map<string, Satz[]>()
  for (const s of saetze) {
    const datum = datumJeTraining.get(s.workout_id)
    if (!datum) continue
    const woche = isoWoche(datum)
    const liste = nachWoche.get(woche)
    if (liste) liste.push(s)
    else nachWoche.set(woche, [s])
  }
  const ergebnis: Record<string, VolumenZeile> = {}
  for (const [woche, liste] of nachWoche) ergebnis[woche] = gewichteteSaetze(liste, uebungen)
  return ergebnis
}

/**
 * Tonnage eines Satzes. Bei Körpergewichtsübungen mit Zusatzlast zählt das
 * zuletzt erfasste Körpergewicht plus Zusatzlast; fehlt ein Körpergewicht,
 * bleibt die Tonnage leer statt geschätzt.
 */
export function satzTonnage(
  satz: Satz,
  uebung: Uebung | undefined,
  koerpergewicht: number | null
): number | null {
  if (!uebung || !satz.reps) return null
  if (uebung.load_type === 'bodyweight_plus') {
    if (koerpergewicht == null) return null
    return (koerpergewicht + (satz.weight_kg ?? 0)) * satz.reps
  }
  if (uebung.load_type === 'external') {
    if (satz.weight_kg == null) return null
    return satz.weight_kg * satz.reps
  }
  return null
}

/** Tonnage einer Einheit; null, wenn kein einziger Satz rechenbar war. */
export function trainingsTonnage(
  saetze: Satz[],
  koerpergewicht: number | null,
  uebungen: Record<string, Uebung> = UEBUNG_NACH_ID
): number | null {
  let summe = 0
  let gezaehlt = 0
  for (const s of saetze) {
    if (s.is_warmup) continue
    const t = satzTonnage(s, s.exercise_id ? uebungen[s.exercise_id] : undefined, koerpergewicht)
    if (t != null) {
      summe += t
      gezaehlt++
    }
  }
  return gezaehlt ? Math.round(summe) : null
}

/** Epley. Über zehn Wiederholungen wird die Formel unbrauchbar, also: nichts. */
export function epley(gewicht: number | null, wiederholungen: number | null): number | null {
  if (gewicht == null || !wiederholungen || wiederholungen < 1 || wiederholungen > 10) return null
  if (gewicht <= 0) return null
  return gewicht * (1 + wiederholungen / 30)
}

export function satz1RM(
  satz: Satz,
  uebung: Uebung | undefined,
  koerpergewicht: number | null
): number | null {
  if (!uebung) return null
  if (uebung.load_type === 'bodyweight_plus') {
    if (koerpergewicht == null) return null
    return epley(koerpergewicht + (satz.weight_kg ?? 0), satz.reps)
  }
  if (uebung.load_type === 'external') return epley(satz.weight_kg, satz.reps)
  return null
}

/** Bestes geschätztes 1RM je Kalenderwoche für eine Übung. */
export function bestes1RMJeWoche(
  uebungId: string,
  trainings: Training[],
  saetze: Satz[],
  koerpergewicht: number | null,
  uebungen: Record<string, Uebung> = UEBUNG_NACH_ID
): { woche: string; wert: number }[] {
  const datumJeTraining = new Map(trainings.map((t) => [t.id, t.performed_on]))
  const beste = new Map<string, number>()
  for (const s of saetze) {
    if (s.exercise_id !== uebungId || s.is_warmup) continue
    const datum = datumJeTraining.get(s.workout_id)
    if (!datum) continue
    const wert = satz1RM(s, uebungen[uebungId], koerpergewicht)
    if (wert == null) continue
    const woche = isoWoche(datum)
    const alt = beste.get(woche)
    if (alt == null || wert > alt) beste.set(woche, wert)
  }
  return [...beste.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([woche, wert]) => ({ woche, wert: Math.round(wert * 10) / 10 }))
}

/**
 * Progressionsvorschlag: Hat die Übung beim letzten Mal in allen Arbeitssätzen
 * die obere Grenze des Bereichs bei erreichtem Ziel-RIR geschafft, kommt Last
 * dazu — 2,5 kg im Oberkörper, 5 kg im Unterkörper. Der Vorschlag ist eine
 * antippbare Zahl, kein Zwang.
 */
export function progressionsVorschlag(
  block: Block,
  uebung: Uebung | undefined,
  letzteSaetze: Satz[]
): { gewicht: number; wiederholungen: number; grund: 'mehr_last' | 'gleich' } | null {
  const arbeit = letzteSaetze.filter((s) => !s.is_warmup)
  if (!uebung || arbeit.length === 0) return null
  const letztesGewicht = letztesGesetztesGewicht(arbeit)
  const zielReps = block.rep_max ?? block.rep_min ?? null
  const rirGrenze = obereRirGrenze(block.target_rir)

  const alleOben =
    zielReps != null &&
    arbeit.length >= (block.target_sets ?? arbeit.length) &&
    arbeit.every((s) => (s.reps ?? 0) >= zielReps) &&
    arbeit.every((s) => s.rir == null || rirGrenze == null || s.rir <= rirGrenze)

  if (!alleOben || letztesGewicht == null) {
    return {
      gewicht: letztesGewicht ?? 0,
      wiederholungen: letzteReps(arbeit) ?? block.rep_min ?? 0,
      grund: 'gleich'
    }
  }
  const sprung = uebung.primary_muscles.some((m) => UNTERKOERPER.includes(m))
    ? UNTERKOERPER_SPRUNG
    : OBERKOERPER_SPRUNG
  return {
    gewicht: Math.round((letztesGewicht + sprung) * 100) / 100,
    wiederholungen: block.rep_min ?? zielReps,
    grund: 'mehr_last'
  }
}

function letztesGesetztesGewicht(saetze: Satz[]): number | null {
  for (let i = saetze.length - 1; i >= 0; i--) {
    if (saetze[i].weight_kg != null) return saetze[i].weight_kg
  }
  return null
}

function letzteReps(saetze: Satz[]): number | null {
  for (let i = saetze.length - 1; i >= 0; i--) {
    if (saetze[i].reps != null) return saetze[i].reps
  }
  return null
}

/** '0-1' → 1, '2' → 2, '2-3' → 3. Die obere Grenze ist die weichere. */
export function obereRirGrenze(rir: string | null): number | null {
  if (!rir) return null
  const zahlen = rir.match(/\d+/g)
  if (!zahlen) return null
  return Math.max(...zahlen.map(Number))
}

/* --- Körpergewicht ------------------------------------------------------- */

export interface Gewichtspunkt {
  datum: IsoDatum
  wert: number
  mittel: number | null
}

/**
 * Gleitendes Mittel über sieben Tage. Gerechnet wird über das Zeitfenster, nicht
 * über die letzten sieben Einträge — bei Lücken ist das der ehrlichere Wert.
 */
export function gleitendesMittel(werte: Koerperwert[], fenster = 7): Gewichtspunkt[] {
  const punkte = werte
    .filter((w): w is Koerperwert & { weight_kg: number } => w.weight_kg != null)
    .map((w) => ({ datum: w.measured_on, wert: Number(w.weight_kg) }))
    .sort((a, b) => a.datum.localeCompare(b.datum))

  return punkte.map((p, i) => {
    const grenze = new Date(p.datum).getTime() - (fenster - 1) * 86400000
    let summe = 0
    let n = 0
    for (let j = i; j >= 0; j--) {
      if (new Date(punkte[j].datum).getTime() < grenze) break
      summe += punkte[j].wert
      n++
    }
    return { ...p, mittel: n ? Math.round((summe / n) * 100) / 100 : null }
  })
}

/**
 * Änderungsrate in Prozent pro Woche, aus dem gleitenden Mittel über die
 * letzten 14 Tage. Weniger als zwei Wochen Daten ergeben keine Rate.
 */
export function aenderungsrate(punkte: Gewichtspunkt[]): number | null {
  const mitMittel = punkte.filter((p) => p.mittel != null)
  if (mitMittel.length < 2) return null
  const letzter = mitMittel[mitMittel.length - 1]
  const grenze = new Date(letzter.datum).getTime() - 14 * 86400000
  const frueher = mitMittel.find((p) => new Date(p.datum).getTime() >= grenze) ?? mitMittel[0]
  const tage = (new Date(letzter.datum).getTime() - new Date(frueher.datum).getTime()) / 86400000
  if (tage < 7 || !frueher.mittel || !letzter.mittel) return null
  const faktor = letzter.mittel / frueher.mittel - 1
  return Math.round((faktor / (tage / 7)) * 1000) / 10
}
