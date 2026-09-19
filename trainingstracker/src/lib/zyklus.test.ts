import { describe, expect, it } from 'vitest'
import { BLOCK_NACH_ID } from '../data/plan'
import { einheitAmTag, istPausentag, naechsterPausentag, naechsterTag, sollSaetze, wocheIndex } from './zyklus'

describe('Achttagezyklus', () => {
  it('rotiert Push, Pull, Beine, Pause', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(einheitAmTag)).toEqual([
      'push_a',
      'pull',
      'legs_a',
      null,
      'push_b',
      'pull',
      'legs_b',
      null
    ])
  })

  it('läuft nach Tag 8 wieder auf Tag 1', () => {
    expect(naechsterTag(8)).toBe(1)
    expect(naechsterTag(3)).toBe(4)
  })

  it('springt auf den nächsten Pausentag', () => {
    expect(naechsterPausentag(1)).toBe(4)
    expect(naechsterPausentag(3)).toBe(4)
    expect(naechsterPausentag(5)).toBe(8)
    expect(naechsterPausentag(4)).toBe(8)
    expect(naechsterPausentag(8)).toBe(4)
  })

  it('erkennt Pausentage', () => {
    expect(istPausentag(4)).toBe(true)
    expect(istPausentag(2)).toBe(false)
  })

  it('zählt Wochen ab Zyklusstart', () => {
    expect(wocheIndex("2026-09-21", "2026-09-21")).toBe(1)
    expect(wocheIndex("2026-09-21", "2026-09-19")).toBe(1)
    expect(wocheIndex('2026-09-21', '2026-09-27')).toBe(1)
    expect(wocheIndex('2026-09-21', '2026-09-28')).toBe(2)
    expect(wocheIndex('2026-09-21', '2026-12-13')).toBe(12)
  })

  it('halbiert in der Entlastungswoche die Sollsätze und lässt die Last stehen', () => {
    expect(sollSaetze(BLOCK_NACH_ID[102], false)).toBe(5)
    expect(sollSaetze(BLOCK_NACH_ID[102], true)).toBe(3)
    expect(sollSaetze(BLOCK_NACH_ID[101], true)).toBeNull()
  })
})
