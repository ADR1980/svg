import { describe, expect, it } from 'vitest'
import { dauerMinuten, heute, isoWoche, kurz, mmss, montagDerWoche, naechsterMontag, tageDazu, tageZwischen } from './datum'

describe('Datum in Europe/Berlin', () => {
  it('nimmt den Berliner Kalendertag, nicht den UTC-Tag', () => {
    // 22:30 in London ist in Berlin schon der Folgetag.
    expect(heute(new Date('2026-09-21T22:30:00Z'))).toBe('2026-09-22')
    expect(heute(new Date('2026-09-21T21:30:00Z'))).toBe('2026-09-21')
  })

  it('rechnet über die Zeitumstellung hinweg in Tagen', () => {
    expect(tageDazu('2026-10-24', 3)).toBe('2026-10-27')
    expect(tageZwischen('2026-10-24', '2026-10-27')).toBe(3)
  })

  it('findet den nächsten Montag', () => {
    expect(naechsterMontag(new Date('2026-09-19T10:00:00Z'))).toBe('2026-09-21')
  })

  it('kennt ISO-Wochen und ihren Montag', () => {
    expect(isoWoche('2026-09-21')).toBe('2026-W39')
    expect(isoWoche('2026-09-20')).toBe('2026-W38')
    expect(montagDerWoche('2026-09-23')).toBe('2026-09-21')
  })

  it('formatiert Dauer und Datum', () => {
    expect(dauerMinuten('2026-09-21T09:00:00Z', '2026-09-21T09:58:00Z')).toBe(58)
    expect(dauerMinuten(null, '2026-09-21T09:58:00Z')).toBeNull()
    expect(mmss(165)).toBe('2:45')
    expect(kurz('2026-09-21')).toBe('21.09.2026')
  })
})
