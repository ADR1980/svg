/* ==========================================================================
   Datumsarithmetik. Ein Tag ist der Kalendertag in Europe/Berlin, nicht UTC —
   ein Training um 23:30 im Sommer gehört sonst auf den Folgetag.
   ========================================================================== */

import {
  addDays,
  differenceInCalendarDays,
  getISOWeek,
  getISOWeekYear,
  nextMonday,
  parseISO,
  startOfISOWeek
} from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

export const ZONE = 'Europe/Berlin'

export type IsoDatum = string // 'yyyy-MM-dd'

export function heute(jetzt: Date = new Date()): IsoDatum {
  return formatInTimeZone(jetzt, ZONE, 'yyyy-MM-dd')
}

export function alsDatum(d: IsoDatum): Date {
  return parseISO(d + 'T12:00:00')
}

export function tageDazu(d: IsoDatum, n: number): IsoDatum {
  return formatInTimeZone(addDays(alsDatum(d), n), ZONE, 'yyyy-MM-dd')
}

export function tageZwischen(von: IsoDatum, bis: IsoDatum): number {
  return differenceInCalendarDays(alsDatum(bis), alsDatum(von))
}

export function naechsterMontag(jetzt: Date = new Date()): IsoDatum {
  const lokal = toZonedTime(jetzt, ZONE)
  return formatInTimeZone(nextMonday(lokal), ZONE, 'yyyy-MM-dd')
}

/** Kennung einer ISO-Woche, sortierbar: '2026-W39'. */
export function isoWoche(d: IsoDatum): string {
  const dt = alsDatum(d)
  return `${getISOWeekYear(dt)}-W${String(getISOWeek(dt)).padStart(2, '0')}`
}

export function montagDerWoche(d: IsoDatum): IsoDatum {
  return formatInTimeZone(startOfISOWeek(alsDatum(d)), ZONE, 'yyyy-MM-dd')
}

const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const MONATE = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember'
]

export function lang(d: IsoDatum): string {
  const dt = alsDatum(d)
  return `${WOCHENTAGE[dt.getDay()]}, ${dt.getDate()}. ${MONATE[dt.getMonth()]} ${dt.getFullYear()}`
}

export function kurz(d: IsoDatum): string {
  const dt = alsDatum(d)
  return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`
}

/** Dauer in Minuten zwischen zwei Zeitstempeln, gerundet. */
export function dauerMinuten(von: string | null, bis: string | null): number | null {
  if (!von || !bis) return null
  const ms = new Date(bis).getTime() - new Date(von).getTime()
  if (!Number.isFinite(ms) || ms <= 0) return null
  return Math.round(ms / 60000)
}

export function mmss(sekunden: number): string {
  const s = Math.max(0, Math.round(sekunden))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
