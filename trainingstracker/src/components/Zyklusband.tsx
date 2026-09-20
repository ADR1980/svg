/* ==========================================================================
   Der Achttagezyklus als Band.

   Ohne diese Zeile ist „Tag 5" eine Zahl ohne Bedeutung: Der Plan rotiert
   unabhängig vom Wochentag, man kann also nicht im Kalender nachsehen, was
   morgen ansteht. Das Band zeigt alle acht Tage, markiert den heutigen und
   beantwortet auf Antippen, was an einem anderen Tag ansteht.
   ========================================================================== */

import { useState } from 'react'
import { ZYKLUS, bloeckeVon, vorlageVon } from '../data/plan'
import { UEBUNG_NACH_ID } from '../data/plan'
import { einheitAmTag } from '../lib/zyklus'

const KURZ: Record<string, [string, string]> = {
  push_a: ['Push', 'A'],
  push_b: ['Push', 'B'],
  pull: ['Pull', ''],
  legs_a: ['Beine', 'A'],
  legs_b: ['Beine', 'B']
}

export function Zyklusband({ tag }: { tag: number }) {
  const [gewaehlt, setGewaehlt] = useState<number | null>(null)
  const zeigt = gewaehlt ?? tag

  return (
    <div className="mt-5">
      <div className="flex gap-[3px]">
        {ZYKLUS.map((einheit, i) => {
          const n = i + 1
          const heute = n === tag
          const [wort, variante] = einheit ? KURZ[einheit] : ['Pause', '']
          return (
            <button
              key={n}
              type="button"
              className="ziel min-w-0 flex-1 overflow-hidden border-t-2 pb-1 pt-[6px] text-left"
              style={{
                borderColor: heute ? 'var(--accent)' : 'var(--rule)',
                opacity: einheit ? 1 : 0.55
              }}
              onClick={() => setGewaehlt(n === zeigt ? null : n)}
              aria-label={`Tag ${n}: ${wort} ${variante}`.trim()}
            >
              <span
                className="block font-mono text-[11px] ziffern"
                style={{ color: heute ? 'var(--accent)' : 'var(--ink-muted)' }}
              >
                {n}
              </span>
              <span
                className="block font-mono text-[11px] leading-tight"
                style={{ color: heute ? 'var(--ink)' : 'var(--ink-muted)' }}
              >
                {wort}
              </span>
              <span className="block font-mono text-[11px] leading-tight text-muted">
                {variante || ' '}
              </span>
            </button>
          )
        })}
      </div>

      <Auskunft tag={zeigt} heute={tag} zurueck={() => setGewaehlt(null)} />
    </div>
  )
}

function Auskunft({ tag, heute, zurueck }: { tag: number; heute: number; zurueck: () => void }) {
  const einheit = einheitAmTag(tag)
  const eigenerTag = tag === heute

  if (!einheit) {
    return (
      <p className="mt-2 text-sm text-muted">
        Tag {tag} ist Pausentag.{' '}
        {!eigenerTag && (
          <button type="button" className="underline" onClick={zurueck}>
            zurück zu heute
          </button>
        )}
      </p>
    )
  }

  const vorlage = vorlageVon(einheit)
  const traeger = bloeckeVon(einheit)
    .filter((b) => b.kind === 'work' && b.exercise_id)
    .slice(0, 3)
    .map((b) => UEBUNG_NACH_ID[b.exercise_id!]?.name.split(',')[0])
    .join(' · ')

  return (
    <p className="mt-2 text-sm leading-snug text-muted">
      <span className="text-ink">
        Tag {tag} · {vorlage.name}
      </span>
      {' — '}
      {traeger}.{' '}
      {!eigenerTag && (
        <button type="button" className="underline" onClick={zurueck}>
          zurück zu heute
        </button>
      )}
    </p>
  )
}
