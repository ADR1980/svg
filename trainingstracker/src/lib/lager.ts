/* ==========================================================================
   Örtlicher Bestand in IndexedDB. Geschrieben wird immer zuerst hierhin —
   die Outbox schiebt später nach. Über zwölf Wochen bleibt der Bestand klein
   genug, um ihn als einen Datensatz zu halten; das erspart ein Schema.
   ========================================================================== */

import { createStore, get, set } from 'idb-keyval'
import type {
  Auftrag,
  Foto,
  Koerperwert,
  MuscleUpEintrag,
  MuscleUpMarke,
  Pausensprung,
  Satz,
  Training,
  Zykluszustand
} from './types'

const laden = createStore('trainingstracker', 'bestand')

export interface Bestand {
  user_id: string | null
  zyklus: Zykluszustand | null
  trainings: Training[]
  saetze: Satz[]
  koerperwerte: Koerperwert[]
  muEintraege: MuscleUpEintrag[]
  muMarken: MuscleUpMarke[]
  fotos: Foto[]
  pausen: Pausensprung[]
}

export const LEERER_BESTAND: Bestand = {
  user_id: null,
  zyklus: null,
  trainings: [],
  saetze: [],
  koerperwerte: [],
  muEintraege: [],
  muMarken: [],
  fotos: [],
  pausen: []
}

export async function ladeBestand(): Promise<Bestand> {
  try {
    const b = await get<Bestand>('bestand', laden)
    return b ? { ...LEERER_BESTAND, ...b } : { ...LEERER_BESTAND }
  } catch {
    return { ...LEERER_BESTAND }
  }
}

export async function speichereBestand(b: Bestand): Promise<void> {
  try {
    await set('bestand', b, laden)
  } catch (e) {
    console.warn('Bestand nicht gespeichert', e)
  }
}

export async function ladeOutbox(): Promise<Auftrag[]> {
  try {
    return (await get<Auftrag[]>('outbox', laden)) ?? []
  } catch {
    return []
  }
}

export async function speichereOutbox(o: Auftrag[]): Promise<void> {
  try {
    await set('outbox', o, laden)
  } catch (e) {
    console.warn('Outbox nicht gespeichert', e)
  }
}

/** Kennung des Geräts, solange niemand angemeldet ist. */
export async function geraeteNutzer(): Promise<string> {
  const vorhanden = await get<string>('geraete-nutzer', laden)
  if (vorhanden) return vorhanden
  const neu = crypto.randomUUID()
  await set('geraete-nutzer', neu, laden)
  return neu
}

export async function letzterAbgleich(): Promise<string | null> {
  return (await get<string>('letzter-abgleich', laden)) ?? null
}

export async function merkeAbgleich(zeit: string): Promise<void> {
  await set('letzter-abgleich', zeit, laden)
}
