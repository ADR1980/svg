/* ==========================================================================
   Outbox und Abgleich.

   Geschriebene Sätze liegen zuerst örtlich, die Outbox schiebt sie nach, sobald
   die Verbindung zurück ist. Beim Zusammenführen gewinnt der örtliche Eintrag,
   solange er noch in der Outbox steht — bei einem einzelnen Nutzer ist ein
   echter Konflikt unwahrscheinlich, und der jüngere Schreibvorgang ist der
   gewollte.
   ========================================================================== */

import { fern } from './fern'
import type { Bestand } from './lager'
import type { Auftrag, TabellenName } from './types'

const MAX_VERSUCHE = 8

/** Welcher Bestandsschlüssel gehört zu welcher Tabelle. */
const ZUORDNUNG: Record<TabellenName, keyof Bestand | null> = {
  workouts: 'trainings',
  sets: 'saetze',
  body_metrics: 'koerperwerte',
  muscleup_log: 'muEintraege',
  muscleup_milestones: 'muMarken',
  progress_photos: 'fotos',
  cycle_skips: 'pausen',
  cycle_state: 'zyklus'
}

export function outboxSchluessel(auftrag: Auftrag): string {
  const id = (auftrag.payload as { id?: string; user_id?: string }).id
  return `${auftrag.table}:${id ?? (auftrag.payload as { user_id?: string }).user_id ?? ''}`
}

/**
 * Schiebt die Outbox in einem Durchgang nach. Aufträge, die scheitern, bleiben
 * mit erhöhtem Zähler liegen; nach acht Versuchen wandert der Fehler in den
 * Auftrag, damit die Oberfläche ihn zeigen kann.
 */
export async function schiebeOutbox(outbox: Auftrag[]): Promise<Auftrag[]> {
  if (!fern || outbox.length === 0) return outbox
  const rest: Auftrag[] = []
  for (const auftrag of outbox) {
    try {
      if (auftrag.op === 'delete') {
        const id = (auftrag.payload as { id: string }).id
        const { error } = await fern.from(auftrag.table).delete().eq('id', id)
        if (error) throw error
      } else {
        const { error } = await fern.from(auftrag.table).upsert(auftrag.payload)
        if (error) throw error
      }
    } catch (e) {
      const versuche = auftrag.versuche + 1
      rest.push({
        ...auftrag,
        versuche,
        fehler: versuche >= MAX_VERSUCHE ? String((e as Error).message ?? e) : undefined
      })
    }
  }
  return rest
}

/** Holt den Bestand des angemeldeten Nutzers. RLS entscheidet, was zurückkommt. */
export async function holeBestand(userId: string): Promise<Partial<Bestand>> {
  if (!fern) return {}
  const [trainings, saetze, koerperwerte, muEintraege, muMarken, fotos, pausen, zyklus] =
    await Promise.all([
      fern.from('workouts').select('*').order('performed_on', { ascending: false }),
      fern.from('sets').select('*').order('completed_at', { ascending: true }),
      fern.from('body_metrics').select('*').order('measured_on', { ascending: true }),
      fern.from('muscleup_log').select('*').order('performed_on', { ascending: true }),
      fern.from('muscleup_milestones').select('*').order('reached_on', { ascending: true }),
      fern.from('progress_photos').select('*').order('taken_on', { ascending: true }),
      fern.from('cycle_skips').select('*').order('on_date', { ascending: true }),
      fern.from('cycle_state').select('*').eq('user_id', userId).maybeSingle()
    ])

  const ersterFehler = [trainings, saetze, koerperwerte, muEintraege, muMarken, fotos, pausen]
    .map((r) => r.error)
    .find(Boolean)
  if (ersterFehler) throw ersterFehler

  return {
    trainings: trainings.data ?? [],
    saetze: saetze.data ?? [],
    koerperwerte: koerperwerte.data ?? [],
    muEintraege: muEintraege.data ?? [],
    muMarken: muMarken.data ?? [],
    fotos: fotos.data ?? [],
    pausen: pausen.data ?? [],
    zyklus: zyklus.data ?? null
  }
}

/**
 * Führt Server- und örtlichen Bestand zusammen. Alles, was noch in der Outbox
 * steht, bleibt örtlich stehen — es ist noch nicht drüben angekommen.
 */
export function fuehreZusammen(
  oertlich: Bestand,
  server: Partial<Bestand>,
  outbox: Auftrag[]
): Bestand {
  const offen = new Set(outbox.map(outboxSchluessel))
  // Eine noch nicht gesendete Löschung darf die Zeile nicht wieder einsammeln.
  const geloescht = new Set(outbox.filter((a) => a.op === 'delete').map(outboxSchluessel))
  const zusammen: Bestand = { ...oertlich }

  for (const [tabelle, schluessel] of Object.entries(ZUORDNUNG) as [
    TabellenName,
    keyof Bestand | null
  ][]) {
    if (!schluessel) continue
    if (schluessel === 'zyklus') {
      const offenerZyklus = offen.has(`cycle_state:${oertlich.user_id ?? ''}`)
      if (!offenerZyklus && server.zyklus) zusammen.zyklus = server.zyklus
      continue
    }
    const serverZeilen = server[schluessel] as { id: string }[] | undefined
    if (!serverZeilen) continue
    const oertlichZeilen = (oertlich[schluessel] as { id: string }[]) ?? []
    const behalten = oertlichZeilen.filter((z) => offen.has(`${tabelle}:${z.id}`))
    const behaltenIds = new Set(behalten.map((z) => z.id))
    const gemischt = [
      ...serverZeilen.filter(
        (z) => !behaltenIds.has(z.id) && !geloescht.has(`${tabelle}:${z.id}`)
      ),
      ...behalten
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(zusammen as any)[schluessel] = gemischt
  }
  return zusammen
}
