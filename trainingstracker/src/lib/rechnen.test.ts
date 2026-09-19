import { describe, expect, it } from 'vitest'
import { BLOCK_NACH_ID, UEBUNG_NACH_ID, ZYKLUS } from '../data/plan'
import {
  aenderungsrate,
  bestes1RMJeWoche,
  epley,
  gewichteteSaetze,
  gleitendesMittel,
  obereRirGrenze,
  progressionsVorschlag,
  satzTonnage,
  trainingsTonnage,
  volumenJeWoche
} from './rechnen'
import { saetzeNachPlan } from './testhilfe'
import type { Koerperwert, Satz, Training, VorlageId } from './types'

function satz(teil: Partial<Satz>): Satz {
  return {
    id: crypto.randomUUID(),
    workout_id: 'w1',
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
    completed_at: '2026-09-21T09:30:00.000Z',
    ...teil
  }
}

function training(id: string, datum: string, vorlage: VorlageId = 'pull'): Training {
  return {
    id,
    user_id: 'u1',
    template_id: vorlage,
    performed_on: datum,
    started_at: datum + 'T09:00:00.000Z',
    finished_at: datum + 'T09:58:00.000Z',
    cycle_day: 2,
    week_index: 1,
    is_deload: false,
    session_rpe: 7,
    note: null,
    created_at: datum + 'T09:58:00.000Z',
    updated_at: datum + 'T09:58:00.000Z'
  }
}

describe('gewichtete Sätze', () => {
  it('zählt Primärmuskeln mit 1,0 und Sekundärmuskeln mit 0,5', () => {
    const v = gewichteteSaetze([satz({}), satz({})])
    expect(v.chest).toBe(2)
    expect(v.triceps).toBe(1)
    expect(v.front_delts).toBe(1)
  })

  it('lässt Aufwärmsätze aus', () => {
    expect(gewichteteSaetze([satz({ is_warmup: true })]).chest).toBeUndefined()
  })

  it('lässt Sätze ohne Übung aus — der Muscle-Up-Block zählt nicht ins Volumen', () => {
    expect(gewichteteSaetze([satz({ exercise_id: null, block_id: 302 })])).toEqual({})
  })

  it('zählt eine Übung mit zwei Primärmuskeln doppelt: Dips auf Brust und Trizeps', () => {
    const v = gewichteteSaetze([satz({ exercise_id: 'dips-stange', block_id: 104 })])
    expect(v.chest).toBe(1)
    expect(v.triceps).toBe(1)
    expect(v.front_delts).toBe(0.5)
  })

  it('schlägt Sätze der ISO-Woche des Trainings zu, nicht der des Satzes', () => {
    const t = [training('w1', '2026-09-20'), training('w2', '2026-09-21')]
    const s = [satz({ workout_id: 'w1' }), satz({ workout_id: 'w2' })]
    const v = volumenJeWoche(t, s)
    expect(Object.keys(v).sort()).toEqual(['2026-W38', '2026-W39'])
  })
})

/*
 * Das Wochenvolumen ist der beste Einzeltest für die Volumenlogik, weil es
 * direkte und indirekte Sätze mischt. Die Zahlen unten sind aus dem Plan
 * nachgerechnet — ändert sich der Plan, fällt der Test.
 */
describe('Wochenvolumen Rücken', () => {
  const je = (v: VorlageId) => gewichteteSaetze(saetzeNachPlan(v, 'w-' + v))
  const rueckenAusZyklus = (tage: number[]) =>
    tage.reduce((s, tag) => {
      const v = ZYKLUS[tag - 1]
      return v ? s + (je(v).back_pull ?? 0) : s
    }, 0)

  it('Woche mit beiden Pull-Einheiten: 32,5 gewichtete Sätze', () => {
    // 2 × 14 direkt, dazu Kreuzheben 5 × 0,5 und rumänisches Kreuzheben 4 × 0,5
    expect(rueckenAusZyklus([1, 2, 3, 4, 5, 6, 7])).toBe(32.5)
  })

  it('Woche mit einer Pull-Einheit: 18,5 gewichtete Sätze', () => {
    expect(rueckenAusZyklus([3, 4, 5, 6, 7, 8, 1])).toBe(18.5)
  })

  it('auf sieben Tage normiert liegt der Plan bei 28,4', () => {
    const jeZyklus = rueckenAusZyklus([1, 2, 3, 4, 5, 6, 7, 8])
    expect(Math.round(((jeZyklus * 7) / 8) * 10) / 10).toBe(28.4)
  })
})

describe('Tonnage', () => {
  it('rechnet Gewicht mal Wiederholungen', () => {
    expect(satzTonnage(satz({ weight_kg: 80, reps: 5 }), UEBUNG_NACH_ID['bankdruecken-lh'], 82))
      .toBe(400)
  })

  it('rechnet bei Zusatzlast mit Körpergewicht plus Zusatzlast', () => {
    const s = satz({ exercise_id: 'klimmzuege-zusatzlast', weight_kg: 10, reps: 5 })
    expect(satzTonnage(s, UEBUNG_NACH_ID['klimmzuege-zusatzlast'], 82)).toBe(460)
  })

  it('bleibt leer, wenn das Körpergewicht fehlt — nicht geschätzt', () => {
    const s = satz({ exercise_id: 'klimmzuege-zusatzlast', weight_kg: 10, reps: 5 })
    expect(satzTonnage(s, UEBUNG_NACH_ID['klimmzuege-zusatzlast'], null)).toBeNull()
  })

  it('lässt Aufwärmsätze aus der Einheitssumme heraus', () => {
    const s = [satz({ weight_kg: 40, reps: 10, is_warmup: true }), satz({ weight_kg: 80, reps: 5 })]
    expect(trainingsTonnage(s, 82)).toBe(400)
  })

  it('gibt für eine Einheit ohne rechenbaren Satz null zurück', () => {
    expect(trainingsTonnage([satz({ exercise_id: 'hollow-hold', reps: null, seconds: 25 })], 82))
      .toBeNull()
  })
})

describe('Epley', () => {
  it('80 kg × 5 ergibt 93,3 kg', () => {
    expect(epley(80, 5)).toBeCloseTo(93.33, 2)
  })

  it('gibt oberhalb von zehn Wiederholungen nichts aus', () => {
    expect(epley(60, 11)).toBeNull()
    expect(epley(60, 10)).toBeCloseTo(80, 5)
  })

  it('zeigt je Kalenderwoche nur den besten Satz', () => {
    const t = [training('w1', '2026-09-21'), training('w2', '2026-09-23')]
    const s = [
      satz({ workout_id: 'w1', weight_kg: 80, reps: 5 }),
      satz({ workout_id: 'w2', weight_kg: 85, reps: 5 }),
      satz({ workout_id: 'w2', weight_kg: 70, reps: 8 })
    ]
    const verlauf = bestes1RMJeWoche('bankdruecken-lh', t, s, 82)
    expect(verlauf).toEqual([{ woche: '2026-W39', wert: 99.2 }])
  })
})

describe('RIR-Grenze', () => {
  it('liest die obere Grenze aus dem Textfeld', () => {
    expect(obereRirGrenze('2')).toBe(2)
    expect(obereRirGrenze('0-1')).toBe(1)
    expect(obereRirGrenze('2-3')).toBe(3)
    expect(obereRirGrenze(null)).toBeNull()
  })
})

describe('Progressionsvorschlag', () => {
  const bank = BLOCK_NACH_ID[102] // 5 × 5–7, RIR 2
  const beuge = BLOCK_NACH_ID[402] // 5 × 5–7, RIR 2

  const fuenf = (teil: Partial<Satz>) => Array.from({ length: 5 }, () => satz(teil))

  it('legt im Oberkörper 2,5 kg drauf, wenn alle Sätze oben ankamen', () => {
    const v = progressionsVorschlag(bank, UEBUNG_NACH_ID['bankdruecken-lh'], fuenf({ reps: 7, rir: 2 }))
    expect(v).toEqual({ gewicht: 82.5, wiederholungen: 5, grund: 'mehr_last' })
  })

  it('legt im Unterkörper 5 kg drauf', () => {
    const s = fuenf({ exercise_id: 'kniebeuge-hinten', block_id: 402, weight_kg: 100, reps: 7, rir: 2 })
    const v = progressionsVorschlag(beuge, UEBUNG_NACH_ID['kniebeuge-hinten'], s)
    expect(v).toEqual({ gewicht: 105, wiederholungen: 5, grund: 'mehr_last' })
  })

  it('bleibt beim Gewicht, wenn ein Satz die obere Grenze verfehlt', () => {
    const s = [...fuenf({ reps: 7, rir: 2 })]
    s[3] = satz({ reps: 6, rir: 1 })
    expect(progressionsVorschlag(bank, UEBUNG_NACH_ID['bankdruecken-lh'], s)?.grund).toBe('gleich')
  })

  it('bleibt beim Gewicht, wenn der Ziel-RIR unterschritten wurde', () => {
    const s = fuenf({ reps: 7, rir: 4 })
    expect(progressionsVorschlag(bank, UEBUNG_NACH_ID['bankdruecken-lh'], s)?.grund).toBe('gleich')
  })

  it('bleibt beim Gewicht, wenn weniger Sätze als geplant im Protokoll stehen', () => {
    const s = [satz({ reps: 7, rir: 2 }), satz({ reps: 7, rir: 2 })]
    expect(progressionsVorschlag(bank, UEBUNG_NACH_ID['bankdruecken-lh'], s)?.grund).toBe('gleich')
  })

  it('gibt ohne Vorgeschichte keinen Vorschlag', () => {
    expect(progressionsVorschlag(bank, UEBUNG_NACH_ID['bankdruecken-lh'], [])).toBeNull()
  })
})

describe('Körpergewicht', () => {
  const messung = (datum: string, kg: number): Koerperwert => ({
    id: datum,
    user_id: 'u1',
    measured_on: datum,
    weight_kg: kg,
    waist_cm: null,
    note: null
  })

  it('mittelt über sieben Tage, nicht über sieben Einträge', () => {
    const werte = [
      messung('2026-09-01', 84),
      messung('2026-09-02', 83),
      messung('2026-09-10', 82)
    ]
    const punkte = gleitendesMittel(werte)
    expect(punkte[1].mittel).toBe(83.5)
    // Der 10. September hat keinen Nachbarn im Fenster.
    expect(punkte[2].mittel).toBe(82)
  })

  it('rechnet die Rate in Prozent pro Woche', () => {
    const werte = Array.from({ length: 15 }, (_, i) =>
      messung(`2026-09-${String(i + 1).padStart(2, '0')}`, 84 - i * 0.06)
    )
    const rate = aenderungsrate(gleitendesMittel(werte))
    expect(rate).not.toBeNull()
    expect(rate!).toBeLessThan(0)
    expect(rate!).toBeGreaterThan(-1)
  })

  it('gibt unter zwei Wochen keine Rate aus', () => {
    const werte = [messung('2026-09-01', 84), messung('2026-09-03', 83.8)]
    expect(aenderungsrate(gleitendesMittel(werte))).toBeNull()
  })
})
