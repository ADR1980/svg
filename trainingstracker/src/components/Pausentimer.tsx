/* Leiste am unteren Rand. Bleibt beim Scrollen stehen, respektiert die
   Safe Area des iPhones und verschwindet, wenn nichts läuft. */

import { mmss } from '../lib/datum'
import { useTimer } from '../state/timer'

export function Pausentimer() {
  const { rest, gesamt, laeuft, anhalten, verlaengern, beschriftung } = useTimer()
  if (!laeuft || rest == null) return null

  const anteil = gesamt ? Math.max(0, Math.min(1, 1 - rest / gesamt)) : 0
  const vorbei = rest === 0

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 border-t border-ink bg-paper"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      <div className="h-[2px] bg-rule">
        <div
          className="h-[2px] transition-[width] duration-200 ease-out"
          style={{ width: `${anteil * 100}%`, background: vorbei ? 'var(--signal)' : 'var(--accent)' }}
        />
      </div>
      <div className="mx-auto flex max-w-[680px] items-center gap-4 px-4 py-2">
        <div
          className="font-mono text-2xl ziffern tabular-nums"
          style={{ color: vorbei ? 'var(--signal)' : 'var(--ink)' }}
        >
          {mmss(rest)}
        </div>
        <div className="flex-1 truncate font-mono text-xs uppercase tracking-[0.12em] text-muted">
          {vorbei ? 'Pause vorbei' : beschriftung}
        </div>
        <button type="button" className="knopf" onClick={() => verlaengern(30)}>
          +30 s
        </button>
        <button type="button" className="knopf" onClick={anhalten}>
          Weg
        </button>
      </div>
    </div>
  )
}
