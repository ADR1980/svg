import { describe, expect, it } from 'vitest'
import { BLOCK_NACH_ID, UEBUNG_NACH_ID } from '../data/plan'
import type { Satz, Training } from './types'
import { zielFuerBlock, zielVorgabe } from './ziel'

const bank = BLOCK_NACH_ID[102] // Bankdrücken, 5 × 5–7, RIR 2
const beuge = BLOCK_NACH_ID[402] // Kniebeuge, 5 × 5–7, RIR 2
const hollow = BLOCK_NACH_ID[109] // Hollow Hold, 4 × 20–30 s

const training: Training = {
  id: 'alt',
  user_id: 'u1',
  template_id: 'push_a',
  performed_on: '2026-09-13',
  started_at: null,
  finished_at: '2026-09-13T10:00:00.000Z',
  cycle_day: 1,
  week_index: 1,
  is_deload: false,
  session_rpe: null,
  note: null,
  created_at: '2026-09-13',
  updated_at: '2026-09-13'
}

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

const fuenf = (teil: Partial<Satz>) =>
  Array.from({ length: 5 }, (_, i) => satz({ set_index: i + 1, ...teil }))

describe('Ziel je Übung', () => {
  it('nennt beim ersten Mal kein Gewicht, aber Sätze und Bereich', () => {
    const z = zielFuerBlock(bank, UEBUNG_NACH_ID['bankdruecken-lh'], [], [], null, false)
    expect(z.gewicht).toBeNull()
    expect(z.saetze).toBe(5)
    expect(z.von).toBe(5)
    expect(z.bis).toBe(7)
    expect(z.grund).toBe('erstes_mal')
    expect(zielVorgabe(z)).toBe('5 × 5–7 Wdh · RIR 2')
  })

  it('legt 2,5 kg drauf, wenn das letzte Mal oben ankam', () => {
    const z = zielFuerBlock(
      bank,
      UEBUNG_NACH_ID['bankdruecken-lh'],
      fuenf({ reps: 7, rir: 2 }),
      [training],
      null,
      false
    )
    expect(z.gewicht).toBe(82.5)
    expect(z.grund).toBe('mehr_last')
    expect(z.begruendung).toBe('Letztes Mal 5 × 7 bei 80 kg — obere Grenze erreicht, also 2,5 kg mehr.')
  })

  it('legt im Unterkörper 5 kg drauf', () => {
    const saetze = fuenf({
      block_id: 402,
      exercise_id: 'kniebeuge-hinten',
      weight_kg: 100,
      reps: 7,
      rir: 2
    })
    const z = zielFuerBlock(
      beuge,
      UEBUNG_NACH_ID['kniebeuge-hinten'],
      saetze,
      [{ ...training, template_id: 'legs_a' }],
      null,
      false
    )
    expect(z.gewicht).toBe(105)
    expect(z.begruendung).toContain('5 kg mehr')
  })

  it('hält das Gewicht, solange der Bereich nicht voll ist', () => {
    const saetze = fuenf({ reps: 6, rir: 2 })
    saetze[4] = satz({ set_index: 5, reps: 5, rir: 1 })
    const z = zielFuerBlock(bank, UEBUNG_NACH_ID['bankdruecken-lh'], saetze, [training], null, false)
    expect(z.gewicht).toBe(80)
    expect(z.grund).toBe('gehalten')
    expect(z.begruendung).toBe('Letztes Mal 5 × 5–6 bei 80 kg. Gewicht bleibt, bis der Bereich oben voll ist.')
  })

  it('halbiert in der Entlastungswoche die Sätze und lässt die Last stehen', () => {
    const z = zielFuerBlock(
      bank,
      UEBUNG_NACH_ID['bankdruecken-lh'],
      fuenf({ reps: 7, rir: 2 }),
      [training],
      null,
      true
    )
    expect(z.saetze).toBe(3)
    expect(z.gewicht).toBe(82.5)
  })

  it('misst Halteübungen in Sekunden', () => {
    const z = zielFuerBlock(hollow, UEBUNG_NACH_ID['hollow-hold'], [], [], null, false)
    expect(z.einheit).toBe('s')
    expect(zielVorgabe(z)).toBe('4 × 20–30 s · RIR 1')
  })

  it('fasst die letzten Halteübungen in Sekunden zusammen', () => {
    const saetze = Array.from({ length: 4 }, (_, i) =>
      satz({
        block_id: 109,
        exercise_id: 'hollow-hold',
        set_index: i + 1,
        weight_kg: null,
        reps: null,
        seconds: 22 + i
      })
    )
    const z = zielFuerBlock(hollow, UEBUNG_NACH_ID['hollow-hold'], saetze, [training], null, false)
    expect(z.begruendung).toContain('4 × 22–25 s')
  })
})
