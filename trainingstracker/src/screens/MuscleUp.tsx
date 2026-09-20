/* ==========================================================================
   Muscle-Up. Aktiver Block, seine Übungen, die Freigabe als Checkliste und der
   Verlauf der Selbsteinschätzungen. Oben zwölf Wochen als Balken.
   ========================================================================== */

import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MuscleUpUeben } from '../components/MuscleUpUeben'
import { MU_BLOECKE, MU_UEBUNGEN } from '../data/plan'
import { heute, kurz } from '../lib/datum'
import { blockFuerWoche, gewaehlterBlock, ladeWahl, speichereWahl } from '../lib/muscleup'
import { wocheIndex } from '../lib/zyklus'
import { useSpeicher } from '../state/speicher'

export function MuscleUp() {
  const { bestand, markeSetzen } = useSpeicher()
  const zyklus = bestand.zyklus
  const woche = zyklus ? wocheIndex(zyklus.started_on, heute()) : 1
  const [wahl, setWahl] = useState<number | null>(ladeWahl())
  const aktiv = wahl ?? gewaehlterBlock(woche)
  const block = MU_BLOECKE.find((b) => b.id === aktiv) ?? MU_BLOECKE[0]
  const nachWoche = blockFuerWoche(woche)
  const training = bestand.trainings.find((t) => t.performed_on === heute() && !t.finished_at)

  const marke = bestand.muMarken.find((m) => m.block_id === block.id)
  const verlauf = bestand.muEintraege
    .filter((e) => e.quality != null)
    .sort((a, b) => a.performed_on.localeCompare(b.performed_on))
    .map((e) => ({
      datum: kurz(e.performed_on).slice(0, 5),
      qualitaet: e.quality,
      name: MU_UEBUNGEN.find((d) => d.id === e.drill_id)?.name ?? 'Übung'
    }))

  const setzen = (id: number | null) => {
    setWahl(id)
    speichereWahl(id)
  }

  return (
    <div className="auftauchen">
      <p className="etikett">Woche {woche} von 12</p>
      <h1 className="mt-1 font-sans text-2xl text-ink">Muscle-Up</h1>

      <div className="mt-4 flex gap-[3px]">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
          <div
            key={w}
            className="h-2 flex-1"
            style={{ background: w <= woche ? 'var(--accent)' : 'var(--rule)' }}
            title={`Woche ${w}`}
          />
        ))}
      </div>

      <section className="mt-10">
        <header className="flex items-baseline justify-between gap-3 border-b border-ink pb-2">
          <h2 className="font-sans text-lg text-ink">
            <span className="mr-2 font-mono text-xs text-muted">Block {block.id}</span>
            {block.name}
          </h2>
          <span className="font-mono text-xs text-muted ziffern">
            Woche {block.week_from}–{block.week_to}
          </span>
        </header>

        {aktiv !== nachWoche && (
          <p className="mt-2 font-mono text-xs" style={{ color: 'var(--signal)' }}>
            Von Hand gewählt — nach Woche {woche} wäre Block {nachWoche} fällig.{' '}
            <button type="button" className="underline" onClick={() => setzen(null)}>
              Zurück zur Woche
            </button>
          </p>
        )}

        <MuscleUpUeben blockId={block.id} trainingId={training?.id ?? null} />

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="knopf"
            disabled={block.id <= 1}
            onClick={() => setzen(Math.max(1, block.id - 1))}
          >
            Block zurück
          </button>
          <button
            type="button"
            className="knopf"
            disabled={block.id >= MU_BLOECKE.length}
            onClick={() => setzen(Math.min(MU_BLOECKE.length, block.id + 1))}
          >
            Block vor
          </button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="border-b border-ink pb-2 font-sans text-lg text-ink">Freigabe</h2>
        <div className="mt-3">
          {MU_BLOECKE.map((b) => {
            const erreicht = bestand.muMarken.find((m) => m.block_id === b.id)
            return (
              <div key={b.id} className="flex items-start gap-3 border-b border-rule py-3">
                <button
                  type="button"
                  className="ziel -ml-[10px] flex shrink-0 items-center justify-center"
                  aria-label={`Block ${b.id} erreicht`}
                  onClick={() => !erreicht && void markeSetzen(b.id, null)}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center border font-sans text-base leading-none"
                    style={{
                      borderColor: erreicht ? 'var(--accent)' : 'var(--rule)',
                      color: 'var(--accent)'
                    }}
                  >
                    {erreicht ? '×' : ''}
                  </span>
                </button>
                <div>
                  <p className="text-base text-body">{b.gate}</p>
                  <p className="mt-1 font-mono text-xs text-muted ziffern">
                    Block {b.id} · {erreicht ? `erreicht am ${kurz(erreicht.reached_on)}` : 'offen'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        {marke && (
          <p className="mt-3 text-sm italic text-muted">
            Block {block.id} steht seit {kurz(marke.reached_on)}. Weiter im nächsten.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="border-b border-ink pb-2 font-sans text-lg text-ink">
          Qualität der Wiederholungen
        </h2>
        {verlauf.length < 2 ? (
          <p className="mt-3 text-sm text-muted">
            Ab zwei Einträgen zeichnet die App hier eine Linie. Die Selbsteinschätzung nach jedem
            Satz reicht.
          </p>
        ) : (
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer>
              <LineChart data={verlauf} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid stroke="var(--rule)" vertical={false} />
                <XAxis
                  dataKey="datum"
                  tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-muted)' }}
                  stroke="var(--rule)"
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-muted)' }}
                  stroke="var(--rule)"
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--paper)',
                    border: '1px solid var(--rule)',
                    borderRadius: 0,
                    fontFamily: 'IBM Plex Mono',
                    fontSize: 11
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="qualitaet"
                  stroke="var(--accent)"
                  strokeWidth={1.5}
                  dot={{ r: 2, fill: 'var(--accent)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  )
}
