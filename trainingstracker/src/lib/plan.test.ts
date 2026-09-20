import { describe, expect, it } from 'vitest'
import { BLOECKE, MUSKEL_REIHENFOLGE, UEBUNG_NACH_ID, VORLAGEN, ZYKLUS, bloeckeVon } from '../data/plan'
import { gewichteteSaetze } from './rechnen'
import { saetzeNachPlan } from './testhilfe'
import type { Muskelgruppe, VorlageId } from './types'

describe('Plan', () => {
  it('jede Vorlage kommt auf ihre geplanten Minuten', () => {
    for (const v of VORLAGEN) {
      const summe = bloeckeVon(v.id).reduce((s, b) => s + b.planned_minutes, 0)
      expect(summe, v.name).toBe(v.planned_minutes)
    }
  })

  it('jeder Block mit Übung verweist auf eine bekannte Übung', () => {
    for (const b of BLOECKE) {
      if (b.exercise_id) expect(UEBUNG_NACH_ID[b.exercise_id], b.exercise_id).toBeDefined()
    }
  })

  it('Aufwärmen und Muscle-Up-Block tragen keine Übung', () => {
    for (const b of BLOECKE) {
      if (b.kind === 'warmup' || b.kind === 'muscleup') expect(b.exercise_id).toBeNull()
      else expect(b.exercise_id).not.toBeNull()
    }
  })

  it('Block-Kennungen sind eindeutig', () => {
    expect(new Set(BLOECKE.map((b) => b.id)).size).toBe(BLOECKE.length)
  })

  it('der Zyklus hat acht Tage mit zwei Pausen und zwei Pull-Einheiten', () => {
    expect(ZYKLUS).toHaveLength(8)
    expect(ZYKLUS.filter((x) => x === null)).toHaveLength(2)
    expect(ZYKLUS.filter((x) => x === 'pull')).toHaveLength(2)
  })
})

describe('Volumen nach Plan', () => {
  const je = (v: VorlageId) => gewichteteSaetze(saetzeNachPlan(v, 'w-' + v))

  it('eine Pull-Einheit ergibt 14 direkte Rückensätze', () => {
    const pull = je('pull')
    // Klimmzüge 4 + Rudern 4 + Ringrudern 3 + Face Pull 3
    expect(pull.back_pull).toBe(14)
    // Bizeps indirekt: (4 + 4 + 3) × 0,5 + Hammercurl 3
    expect(pull.biceps).toBe(8.5)
    expect(pull.side_delts).toBe(1.5)
    expect(pull.abs).toBe(4)
  })

  it('Push A zählt Dips auf Brust und Trizeps gleichzeitig', () => {
    const push = je('push_a')
    expect(push.chest).toBe(11)
    expect(push.triceps).toBe(11.5)
    expect(push.abs).toBe(8)
  })

  it('ein voller Achttagezyklus deckt jede Zielgruppe ab', () => {
    const summe: Partial<Record<Muskelgruppe, number>> = {}
    for (const tag of ZYKLUS) {
      if (!tag) continue
      for (const [m, n] of Object.entries(je(tag))) {
        summe[m as Muskelgruppe] = (summe[m as Muskelgruppe] ?? 0) + (n as number)
      }
    }
    // Auf sieben Tage normiert, weil der Zyklus acht Tage lang ist.
    const jeWoche = (m: Muskelgruppe) => Math.round((((summe[m] ?? 0) * 7) / 8) * 10) / 10
    expect(jeWoche('biceps')).toBe(14.9)
    expect(jeWoche('quads')).toBe(11.8)
    expect(jeWoche('calves')).toBe(5.3)
    expect(jeWoche('side_delts')).toBe(9.6)
    expect(jeWoche('chest')).toBe(17.5)
    expect(jeWoche('back_pull')).toBe(28.4)
    for (const m of MUSKEL_REIHENFOLGE) expect(jeWoche(m), m).toBeGreaterThan(0)
  })
})
