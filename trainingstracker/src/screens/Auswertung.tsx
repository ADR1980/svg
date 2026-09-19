/* ==========================================================================
   Auswertung. Vier Ansichten: Wochenvolumen gegen den Zielkorridor, 1RM je
   Übung, Gewicht mit gleitendem Mittel, und zwei Fotos nebeneinander.
   ========================================================================== */

import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { MUSKEL_NAMEN, MUSKEL_REIHENFOLGE, UEBUNGEN, ZIEL_VOLUMEN } from '../data/plan'
import { heute, isoWoche, kurz, montagDerWoche } from '../lib/datum'
import {
  aenderungsrate,
  bestes1RMJeWoche,
  gleitendesMittel,
  volumenJeWoche
} from '../lib/rechnen'
import { useSpeicher } from '../state/speicher'
import { letzterWert } from './Heute'

type Ansicht = 'volumen' | 'kraft' | 'gewicht' | 'fotos'

const ANSICHTEN: { id: Ansicht; name: string }[] = [
  { id: 'volumen', name: 'Volumen' },
  { id: 'kraft', name: 'Kraft' },
  { id: 'gewicht', name: 'Gewicht' },
  { id: 'fotos', name: 'Fotos' }
]

export function Auswertung() {
  const [ansicht, setAnsicht] = useState<Ansicht>('volumen')
  return (
    <div className="auftauchen">
      <p className="etikett">Auswertung</p>
      <h1 className="mt-1 font-sans text-2xl text-ink">Was die Zahlen sagen</h1>

      <nav className="mt-4 flex flex-wrap gap-x-5 border-b border-rule pb-2">
        {ANSICHTEN.map((a) => (
          <button
            key={a.id}
            type="button"
            className="ziel font-mono text-xs uppercase tracking-[0.12em]"
            style={{
              color: ansicht === a.id ? 'var(--ink)' : 'var(--ink-muted)',
              borderBottom: ansicht === a.id ? '1px solid var(--accent)' : '1px solid transparent'
            }}
            onClick={() => setAnsicht(a.id)}
          >
            {a.name}
          </button>
        ))}
      </nav>

      {ansicht === 'volumen' && <Volumen />}
      {ansicht === 'kraft' && <Kraft />}
      {ansicht === 'gewicht' && <Gewicht />}
      {ansicht === 'fotos' && <Fotos />}
    </div>
  )
}

/* --- Volumen ------------------------------------------------------------- */

function Volumen() {
  const { bestand } = useSpeicher()
  const jeWoche = useMemo(
    () => volumenJeWoche(bestand.trainings, bestand.saetze),
    [bestand.trainings, bestand.saetze]
  )
  const wochen = Object.keys(jeWoche).sort().reverse()
  const [woche, setWoche] = useState<string>(() => isoWoche(heute()))
  const gewaehlt = wochen.includes(woche) ? woche : (wochen[0] ?? isoWoche(heute()))
  const volumen = jeWoche[gewaehlt] ?? {}

  const daten = MUSKEL_REIHENFOLGE.map((m) => ({
    muskel: MUSKEL_NAMEN[m],
    wert: Math.round((volumen[m] ?? 0) * 10) / 10,
    ziel: ZIEL_VOLUMEN[m] ?? null
  }))
  const hoechster = Math.max(10, ...daten.map((d) => Math.max(d.wert, d.ziel ?? 0)))
  const obergrenze = Math.ceil(hoechster / 5) * 5

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-sans text-lg text-ink">Gewichtete Sätze je Muskelgruppe</h2>
        <select
          className="ziel border border-rule bg-transparent px-2 font-mono text-xs text-ink"
          value={gewaehlt}
          onChange={(e) => setWoche(e.target.value)}
        >
          {(wochen.length ? wochen : [gewaehlt]).map((w) => (
            <option key={w} value={w}>
              {w} · ab {kurz(montagDerWoche(erstesDatumDerWoche(w)))}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 max-w-[62ch] text-sm text-muted">
        Ein Arbeitssatz zählt 1,0 für jeden Primär- und 0,5 für jeden Sekundärmuskel. Aufwärmsätze
        zählen nicht. Der Strich markiert den Zielkorridor.
      </p>

      <div className="mt-6 h-[420px]">
        <ResponsiveContainer>
          <BarChart
            data={daten}
            layout="vertical"
            margin={{ top: 4, right: 40, bottom: 0, left: 8 }}
            barCategoryGap={8}
          >
            <CartesianGrid stroke="var(--rule)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, obergrenze]}
              tickCount={obergrenze / 5 + 1}
              tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-muted)' }}
              stroke="var(--rule)"
            />
            <YAxis
              type="category"
              dataKey="muskel"
              width={118}
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
              formatter={(v: number, name: string) => [v, name === 'wert' ? 'Sätze' : 'Ziel']}
            />
            <Bar
              dataKey="wert"
              fill="var(--accent)"
              background={{ fill: 'transparent' }}
              shape={<Balken grenze={obergrenze} />}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="mt-6 w-full">
        <thead>
          <tr>
            <th>Muskelgruppe</th>
            <th className="num">Sätze</th>
            <th className="num">Ziel</th>
          </tr>
        </thead>
        <tbody>
          {daten.map((d) => (
            <tr key={d.muskel}>
              <td>{d.muskel}</td>
              <td
                className="num"
                style={{
                  color:
                    d.wert > 0 && d.ziel != null && d.wert < d.ziel
                      ? 'var(--signal)'
                      : 'var(--ink)'
                }}
              >
                {d.wert.toLocaleString('de-DE')}
              </td>
              <td className="num text-muted">{d.ziel ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

/**
 * Balken im Akzent, unterhalb des Korridors im Signalton, dahinter der
 * Zielstrich. Die Skala kommt aus der Breite der Zeichenfläche und der oberen
 * Achsengrenze — sonst hätte eine Muskelgruppe ohne Satz keinen Zielstrich.
 */
interface BalkenArgs {
  grenze: number
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: { wert: number; ziel: number | null }
  background?: { x: number; width: number }
}

function Balken({ grenze, x = 0, y = 0, width = 0, height = 0, payload, background }: BalkenArgs) {
  if (!payload) return null
  const flaeche = background?.width ?? width
  const start = background?.x ?? x
  const skala = grenze > 0 ? flaeche / grenze : 0
  const unterZiel = payload.ziel != null && payload.wert < payload.ziel
  const farbe = payload.wert === 0 ? 'var(--rule)' : unterZiel ? 'var(--signal)' : 'var(--accent)'
  const zielX = payload.ziel != null ? start + payload.ziel * skala : null
  return (
    <g>
      <rect x={start} y={y} width={Math.max(1, payload.wert * skala)} height={height} fill={farbe} />
      {zielX != null && <rect x={zielX} y={y - 3} width={1.5} height={height + 6} fill="var(--ink)" />}
    </g>
  )
}

function erstesDatumDerWoche(woche: string): string {
  // '2026-W39' → irgendein Tag dieser Woche; für die Beschriftung genügt das.
  const [jahr, w] = woche.split('-W')
  const vierter = new Date(Date.UTC(Number(jahr), 0, 4))
  const versatz = ((vierter.getUTCDay() + 6) % 7) - 3
  const montag = new Date(vierter.getTime() + ((Number(w) - 1) * 7 - versatz) * 86400000)
  return montag.toISOString().slice(0, 10)
}

/* --- Kraft --------------------------------------------------------------- */

function Kraft() {
  const { bestand } = useSpeicher()
  const koerpergewicht = letzterWert(bestand.koerperwerte)
  const moeglich = useMemo(
    () =>
      UEBUNGEN.filter(
        (u) =>
          (u.load_type === 'external' || u.load_type === 'bodyweight_plus') &&
          bestand.saetze.some((s) => s.exercise_id === u.id && !s.is_warmup)
      ),
    [bestand.saetze]
  )
  const [uebung, setUebung] = useState<string>(moeglich[0]?.id ?? 'bankdruecken-lh')
  const gewaehlt = moeglich.find((u) => u.id === uebung) ?? moeglich[0]
  const verlauf = useMemo(
    () =>
      gewaehlt
        ? bestes1RMJeWoche(gewaehlt.id, bestand.trainings, bestand.saetze, koerpergewicht)
        : [],
    [gewaehlt, bestand.trainings, bestand.saetze, koerpergewicht]
  )

  if (moeglich.length === 0) {
    return (
      <p className="mt-8 max-w-[62ch] text-sm text-muted">
        Noch kein Satz mit Gewicht im Protokoll. Der Verlauf braucht mindestens eine Woche.
      </p>
    )
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-sans text-lg text-ink">Geschätztes Maximum, bestes je Woche</h2>
        <select
          className="ziel max-w-[60vw] border border-rule bg-transparent px-2 font-mono text-xs text-ink"
          value={gewaehlt?.id}
          onChange={(e) => setUebung(e.target.value)}
        >
          {moeglich.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 max-w-[62ch] text-sm text-muted">
        Nach Epley, nur aus Sätzen bis zehn Wiederholungen. Bei Zusatzlast rechnet die App mit dem
        letzten Körpergewicht{koerpergewicht ? ` (${koerpergewicht} kg)` : ' — das fehlt noch'}.
      </p>

      {verlauf.length < 2 ? (
        <p className="mt-6 text-sm text-muted">
          {verlauf.length === 1
            ? `Ein Punkt bisher: ${verlauf[0].wert.toLocaleString('de-DE')} kg in ${verlauf[0].woche}.`
            : 'Für diese Übung lässt sich noch nichts rechnen.'}
        </p>
      ) : (
        <div className="mt-6 h-[260px]">
          <ResponsiveContainer>
            <LineChart data={verlauf} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="var(--rule)" vertical={false} />
              <XAxis
                dataKey="woche"
                tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-muted)' }}
                stroke="var(--rule)"
              />
              <YAxis
                domain={['auto', 'auto']}
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
                formatter={(v: number) => [`${v.toLocaleString('de-DE')} kg`, '1RM']}
              />
              <Line
                type="monotone"
                dataKey="wert"
                stroke="var(--accent)"
                strokeWidth={1.5}
                dot={{ r: 2, fill: 'var(--accent)' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

/* --- Gewicht ------------------------------------------------------------- */

function Gewicht() {
  const { bestand } = useSpeicher()
  const punkte = useMemo(() => gleitendesMittel(bestand.koerperwerte), [bestand.koerperwerte])
  const rate = aenderungsrate(punkte)
  const letzter = punkte[punkte.length - 1]

  if (punkte.length === 0) {
    return (
      <p className="mt-8 max-w-[62ch] text-sm text-muted">
        Noch kein Gewicht erfasst. Der Schirm „Körper" nimmt es auf.
      </p>
    )
  }

  return (
    <section className="mt-8">
      <h2 className="font-sans text-lg text-ink">Körpergewicht, geglättet über sieben Tage</h2>
      <div className="mt-6 flex flex-wrap gap-12">
        <div>
          <p className="etikett">Mittel heute</p>
          <p className="font-sans text-3xl text-ink ziffern">
            {letzter.mittel?.toLocaleString('de-DE') ?? '—'}
            <span className="ml-1 text-lg text-muted">kg</span>
          </p>
        </div>
        <div>
          <p className="etikett">Rate je Woche</p>
          <p
            className="font-sans text-3xl ziffern"
            style={{ color: rate != null && rate < -1 ? 'var(--signal)' : 'var(--ink)' }}
          >
            {rate == null ? '—' : `${rate > 0 ? '+' : ''}${rate.toLocaleString('de-DE')} %`}
          </p>
          <p className="mt-1 max-w-[24ch] text-sm text-muted">
            Ziel liegt bei 0,5 % Abnahme je Woche.
          </p>
        </div>
      </div>

      <div className="mt-8 h-[260px]">
        <ResponsiveContainer>
          <LineChart
            data={punkte.map((p) => ({ ...p, datum: kurz(p.datum).slice(0, 5) }))}
            margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
          >
            <CartesianGrid stroke="var(--rule)" vertical={false} />
            <XAxis
              dataKey="datum"
              tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-muted)' }}
              stroke="var(--rule)"
            />
            <YAxis
              domain={['auto', 'auto']}
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
              formatter={(v: number, name: string) => [
                `${v.toLocaleString('de-DE')} kg`,
                name === 'mittel' ? 'Mittel' : 'Messung'
              ]}
            />
            <Line
              type="linear"
              dataKey="wert"
              stroke="#8B9199"
              strokeWidth={1}
              dot={{ r: 1.5, fill: '#8B9199' }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="mittel"
              stroke="var(--accent)"
              strokeWidth={1.75}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

/* --- Fotos --------------------------------------------------------------- */

function Fotos() {
  const { bestand, fotoAdresse } = useSpeicher()
  const termine = useMemo(
    () => [...new Set(bestand.fotos.map((f) => f.taken_on))].sort().reverse(),
    [bestand.fotos]
  )
  const [links, setLinks] = useState(termine[termine.length - 1] ?? '')
  const [rechts, setRechts] = useState(termine[0] ?? '')

  if (termine.length === 0) {
    return (
      <p className="mt-8 max-w-[62ch] text-sm text-muted">
        Noch keine Fotos. Der Schirm „Körper" nimmt sie auf — alle vierzehn Tage, gleiche Ecke,
        gleiches Licht.
      </p>
    )
  }

  return (
    <section className="mt-8">
      <h2 className="font-sans text-lg text-ink">Gegenüberstellung</h2>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {[
          { wert: links, setzen: setLinks },
          { wert: rechts, setzen: setRechts }
        ].map((seite, i) => (
          <div key={i}>
            <select
              className="ziel w-full border border-rule bg-transparent px-2 font-mono text-xs text-ink"
              value={seite.wert}
              onChange={(e) => seite.setzen(e.target.value)}
            >
              {termine.map((t) => (
                <option key={t} value={t}>
                  {kurz(t)}
                </option>
              ))}
            </select>
            <div className="mt-2 space-y-2">
              {bestand.fotos
                .filter((f) => f.taken_on === seite.wert)
                .map((f) => (
                  <Bild key={f.id} pfad={f.storage_path} pose={f.pose} laden={fotoAdresse} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Bild({
  pfad,
  pose,
  laden
}: {
  pfad: string
  pose: string
  laden: (pfad: string) => Promise<string | null>
}) {
  const [adresse, setAdresse] = useState<string | null>(null)
  useEffect(() => {
    let weg = false
    void laden(pfad).then((a) => !weg && setAdresse(a))
    return () => {
      weg = true
    }
  }, [pfad, laden])

  return (
    <figure>
      {adresse ? (
        <img src={adresse} alt={pose} className="w-full" />
      ) : (
        <div className="aspect-[3/4] w-full bg-sunk" />
      )}
      <figcaption className="mt-1 font-mono text-xs text-muted">{pose}</figcaption>
    </figure>
  )
}
