import { describe, expect, it } from 'vitest'
import { BLOCK_NACH_ID, UEBUNG_NACH_ID } from '../data/plan'
import type { Satz, Training } from './types'
import { vorbelegung } from './vorbelegung'

const bank = BLOCK_NACH_ID[102]

const training = (id: string, datum: string): Training => ({
  id,
  user_id: 'u1',
  template_id: 'push_a',
  performed_on: datum,
  started_at: null,
  finished_at: datum + 'T10:00:00.000Z',
  cycle_day: 1,
  week_index: 1,
  is_deload: false,
  session_rpe: null,
  note: null,
  created_at: datum,
  updated_at: datum
})

const satz = (teil: Partial<Satz>): Satz => ({
  id: crypto.randomUUID(),
  workout_id: 'alt',
  user_id: 'u1',
  block_id: 102,
  exercise_id: 'bankdruecken-lh',
  set_index: 1,
  weight_kg: 80,
  reps: 7,
  seconds: null,
  distance_m: null,
  rir: 2,
  is_warmup: false,
  completed_at: '2026-09-13T10:00:00.000Z',
  ...teil
})

describe('Vorbelegung', () => {
  it('nimmt ohne Vorgeschichte die untere Grenze des Plans', () => {
    const v = vorbelegung(bank, UEBUNG_NACH_ID['bankdruecken-lh'], [], [], [], 'heute')
    expect(v).toMatchObject({ gewicht: null, wiederholungen: 5, herkunft: 'plan' })
  })

  it('nimmt innerhalb der Einheit den vorigen Satz', () => {
    const eigene = [satz({ workout_id: 'heute', weight_kg: 82.5, reps: 6, set_index: 1 })]
    const v = vorbelegung(bank, UEBUNG_NACH_ID['bankdruecken-lh'], eigene, eigene, [], 'heute')
    expect(v).toMatchObject({ gewicht: 82.5, wiederholungen: 6, herkunft: 'heute' })
  })

  it('nimmt sonst das letzte Mal und schlägt mehr Last vor, wenn alles oben ankam', () => {
    const alt = Array.from({ length: 5 }, (_, i) =>
      satz({ set_index: i + 1, weight_kg: 80, reps: 7, rir: 2 })
    )
    const v = vorbelegung(
      bank,
      UEBUNG_NACH_ID['bankdruecken-lh'],
      [],
      alt,
      [training('alt', '2026-09-13')],
      'heute'
    )
    expect(v.gewicht).toBe(80)
    expect(v.vorschlag).toBe(82.5)
    expect(v.herkunft).toBe('letztes_mal')
  })

  it('schlägt nichts vor, wenn das letzte Mal die obere Grenze verfehlte', () => {
    const alt = Array.from({ length: 5 }, (_, i) => satz({ set_index: i + 1, reps: 5, rir: 2 }))
    const v = vorbelegung(
      bank,
      UEBUNG_NACH_ID['bankdruecken-lh'],
      [],
      alt,
      [training('alt', '2026-09-13')],
      'heute'
    )
    expect(v.vorschlag).toBeNull()
    expect(v.gewicht).toBe(80)
  })

  it('greift auf dieselbe Übung aus einem anderen Block zurück', () => {
    // Trizeps über Kopf steht in Push A (Block 106) und Push B (Block 206).
    const alt = [satz({ block_id: 206, exercise_id: 'trizeps-ueberkopf-kabel', weight_kg: 30, reps: 12 })]
    const v = vorbelegung(
      BLOCK_NACH_ID[106],
      UEBUNG_NACH_ID['trizeps-ueberkopf-kabel'],
      [],
      alt,
      [training('alt', '2026-09-17')],
      'heute'
    )
    expect(v.gewicht).toBe(30)
  })

  it('nimmt bei Halteübungen die Sekunden aus dem Plan', () => {
    const v = vorbelegung(BLOCK_NACH_ID[109], UEBUNG_NACH_ID['hollow-hold'], [], [], [], 'heute')
    expect(v.sekunden).toBe(20)
  })
})
