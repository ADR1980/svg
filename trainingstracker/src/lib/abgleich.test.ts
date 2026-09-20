import { describe, expect, it } from 'vitest'
import { aufNutzerUmschreiben, fuehreZusammen, outboxSchluessel } from './abgleich'
import { LEERER_BESTAND, type Bestand } from './lager'
import type { Auftrag, Satz, Training } from './types'

const training = (id: string): Training => ({
  id,
  user_id: 'u1',
  template_id: 'pull',
  performed_on: '2026-09-22',
  started_at: null,
  finished_at: null,
  cycle_day: 2,
  week_index: 1,
  is_deload: false,
  session_rpe: null,
  note: null,
  created_at: '2026-09-22T09:00:00.000Z',
  updated_at: '2026-09-22T09:00:00.000Z'
})

const satzMit = (id: string, reps: number): Satz => ({
  id,
  workout_id: 'w1',
  user_id: 'u1',
  block_id: 303,
  exercise_id: 'klimmzuege-zusatzlast',
  set_index: 1,
  weight_kg: 10,
  reps,
  seconds: null,
  distance_m: null,
  rir: 1,
  is_warmup: false,
  completed_at: '2026-09-22T09:20:00.000Z'
})

const auftrag = (teil: Partial<Auftrag>): Auftrag => ({
  id: 'a1',
  table: 'sets',
  op: 'upsert',
  payload: { id: 's1' },
  queued_at: '2026-09-22T09:20:00.000Z',
  versuche: 0,
  ...teil
})

describe('Zusammenführen', () => {
  const oertlich = (teil: Partial<Bestand>): Bestand => ({
    ...LEERER_BESTAND,
    user_id: 'u1',
    ...teil
  })

  it('übernimmt Serverzeilen, die örtlich fehlen', () => {
    const b = fuehreZusammen(oertlich({}), { trainings: [training('w1')] }, [])
    expect(b.trainings.map((t) => t.id)).toEqual(['w1'])
  })

  it('lässt den örtlichen Satz stehen, solange er in der Outbox liegt', () => {
    const b = fuehreZusammen(
      oertlich({ saetze: [satzMit('s1', 6)] }),
      { saetze: [satzMit('s1', 4)] },
      [auftrag({})]
    )
    expect(b.saetze).toHaveLength(1)
    expect(b.saetze[0].reps).toBe(6)
  })

  it('nimmt die Serverzeile, wenn nichts mehr offen ist', () => {
    const b = fuehreZusammen(oertlich({ saetze: [satzMit('s1', 6)] }), { saetze: [satzMit('s1', 4)] }, [])
    expect(b.saetze[0].reps).toBe(4)
  })

  it('sammelt eine noch nicht gesendete Löschung nicht wieder ein', () => {
    const b = fuehreZusammen(
      oertlich({ saetze: [] }),
      { saetze: [satzMit('s1', 4)] },
      [auftrag({ op: 'delete' })]
    )
    expect(b.saetze).toHaveLength(0)
  })

  it('schützt den örtlichen Zykluszustand, solange er offen ist', () => {
    const zustand = { user_id: 'u1', started_on: '2026-09-21', current_day: 3, last_advanced_on: null }
    const b = fuehreZusammen(
      oertlich({ zyklus: zustand }),
      { zyklus: { ...zustand, current_day: 1 } },
      [auftrag({ table: 'cycle_state', payload: { user_id: 'u1' } })]
    )
    expect(b.zyklus?.current_day).toBe(3)
  })

  it('bildet den Schlüssel aus Tabelle und Kennung', () => {
    expect(outboxSchluessel(auftrag({}))).toBe('sets:s1')
    expect(outboxSchluessel(auftrag({ table: 'cycle_state', payload: { user_id: 'u1' } }))).toBe(
      'cycle_state:u1'
    )
  })
})

describe('Umschreiben auf den angemeldeten Nutzer', () => {
  it('setzt Bestand und wartende Aufträge auf die neue Kennung', () => {
    const geraet = 'geraet-1'
    const bestand: Bestand = {
      ...LEERER_BESTAND,
      user_id: geraet,
      trainings: [{ ...training('w1'), user_id: geraet }],
      saetze: [{ ...satzMit('s1', 5), user_id: geraet }],
      zyklus: { user_id: geraet, started_on: '2026-09-21', current_day: 2, last_advanced_on: null }
    }
    const outbox = [
      auftrag({ payload: { id: 's1', user_id: geraet } }),
      auftrag({ id: 'a2', table: 'cycle_state', payload: { user_id: geraet, current_day: 2 } }),
      auftrag({ id: 'a3', op: 'delete', payload: { id: 's9' } })
    ]
    const neu = aufNutzerUmschreiben(bestand, outbox, 'nutzer-1')

    expect(neu.bestand.user_id).toBe('nutzer-1')
    expect(neu.bestand.trainings[0].user_id).toBe('nutzer-1')
    expect(neu.bestand.saetze[0].user_id).toBe('nutzer-1')
    expect(neu.bestand.zyklus?.user_id).toBe('nutzer-1')
    expect(neu.outbox[0].payload.user_id).toBe('nutzer-1')
    expect(neu.outbox[1].payload.user_id).toBe('nutzer-1')
    // Eine Löschung trägt keine Kennung und bleibt unangetastet.
    expect(neu.outbox[2].payload).toEqual({ id: 's9' })
  })

  it('lässt alles stehen, wenn die Kennung schon stimmt', () => {
    const bestand: Bestand = { ...LEERER_BESTAND, user_id: 'u1' }
    const outbox = [auftrag({})]
    const neu = aufNutzerUmschreiben(bestand, outbox, 'u1')
    expect(neu.bestand).toBe(bestand)
    expect(neu.outbox).toBe(outbox)
  })
})
