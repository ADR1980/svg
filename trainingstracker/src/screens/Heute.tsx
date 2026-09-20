/* ==========================================================================
   Heute. Startschirm und der einzige Schirm, der zwischen zwei Sätzen bedient
   wird: anstehende Einheit, ihre Blöcke in Reihenfolge, Sätze als antippbare
   Zeilen mit dem Gewicht vom letzten Mal.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { Blockgruppe } from '../components/Blockgruppe'
import { Zyklusband } from '../components/Zyklusband'
import { MuscleUpUeben } from '../components/MuscleUpUeben'
import type { SatzWerte } from '../components/SatzZeile'
import { MU_BLOECKE, UEBUNG_NACH_ID, bloeckeVon, vorlageVon } from '../data/plan'
import { heute, lang, mmss } from '../lib/datum'
import { gewaehlterBlock } from '../lib/muscleup'
import { trainingsTonnage } from '../lib/rechnen'
import type { Block, Satz, Training } from '../lib/types'
import { einheitAmTag, naechsterTag, wocheIndex } from '../lib/zyklus'
import { useSpeicher } from '../state/speicher'
import { useTimer } from '../state/timer'
import { Einrichtung } from './Einrichtung'

export function Heute() {
  const speicher = useSpeicher()
  const { bestand } = speicher
  const zyklus = bestand.zyklus

  if (!zyklus) return <Einrichtung />

  const tag = zyklus.current_day
  const vorlageId = einheitAmTag(tag)
  const woche = wocheIndex(zyklus.started_on, heute())

  if (!vorlageId) return <Pausentag tag={tag} woche={woche} />
  return <Einheit vorlageId={vorlageId} tag={tag} woche={woche} />
}

/* --- Pausentag ----------------------------------------------------------- */

function Pausentag({ tag, woche }: { tag: number; woche: number }) {
  const { zyklusTagSetzen } = useSpeicher()
  return (
    <div className="auftauchen">
      <p className="etikett">
        Tag {tag} · Woche {woche}
      </p>
      <h1 className="font-sans text-2xl text-ink">Pause</h1>
      <Zyklusband tag={tag} />
      <p className="mt-6 max-w-[62ch]">
        Nichts zu tun. Die Pause gehört zum Plan wie die Kniebeuge — zwei von acht Tagen, sonst
        trägt die Schulter die Frequenz nicht.
      </p>
      <p className="mt-4 max-w-[62ch] text-muted">
        Ein guter Tag für Gewicht und Bauchumfang, und alle vierzehn Tage für ein Foto.
      </p>
      <button type="button" className="knopf-stark mt-8" onClick={() => void zyklusTagSetzen(naechsterTag(tag))}>
        Pause abhaken
      </button>
    </div>
  )
}

/* --- Einheit ------------------------------------------------------------- */

function Einheit({
  vorlageId,
  tag,
  woche
}: {
  vorlageId: NonNullable<ReturnType<typeof einheitAmTag>>
  tag: number
  woche: number
}) {
  const speicher = useSpeicher()
  const { bestand, satzSichern, satzLoeschen, trainingSichern, trainingAendern, trainingAbschliessen } =
    speicher
  const { starten } = useTimer()
  const [offen, setOffen] = useState<string | null>(null)
  const [aufgewaermt, setAufgewaermt] = useState(false)
  const [rpe, setRpe] = useState<number | null>(null)
  const [notiz, setNotiz] = useState('')
  const [abschluss, setAbschluss] = useState(false)

  const vorlage = vorlageVon(vorlageId)
  const bloecke = useMemo(() => bloeckeVon(vorlageId), [vorlageId])
  const tagHeute = heute()

  const training: Training | undefined = bestand.trainings.find(
    (t) => t.performed_on === tagHeute && t.template_id === vorlageId
  )
  const saetzeDesTrainings = useMemo(
    () => (training ? bestand.saetze.filter((s) => s.workout_id === training.id) : []),
    [bestand.saetze, training]
  )
  const deload = training?.is_deload ?? false

  const gruppen = useMemo(() => gruppiere(bloecke), [bloecke])
  const letztesGewicht = letzterWert(bestand.koerperwerte)
  const tonnage = trainingsTonnage(saetzeDesTrainings, letztesGewicht)

  const sichern = async (block: Block, index: number, alt: Satz | null, werte: SatzWerte) => {
    const t = training ?? (await trainingSichern(vorlageId))
    const satz: Satz = {
      id: alt?.id ?? crypto.randomUUID(),
      workout_id: t.id,
      user_id: t.user_id,
      block_id: block.id,
      exercise_id: block.exercise_id,
      set_index: index,
      weight_kg: werte.weight_kg,
      reps: werte.reps,
      seconds: werte.seconds,
      distance_m: werte.distance_m,
      rir: werte.rir,
      is_warmup: false,
      completed_at: alt?.completed_at ?? new Date().toISOString()
    }
    await satzSichern(satz)
    setOffen(null)
    if (block.rest_seconds) {
      starten(block.rest_seconds, kurzname(block))
    }
  }

  return (
    <div className="auftauchen">
      <header>
        <p className="etikett">
          {lang(tagHeute)} · Tag {tag} · Woche {woche}
        </p>
        <h1 className="mt-1 font-sans text-2xl text-ink">{vorlage.name}</h1>
        <p className="mt-1 text-lg text-ink">{vorlage.headline}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-muted ziffern">
          <span>{vorlage.planned_minutes} Min ab 11:00</span>
          <span>{saetzeDesTrainings.filter((s) => !s.is_warmup).length} Sätze erfasst</span>
          {tonnage != null && <span>{tonnage.toLocaleString('de-DE')} kg</span>}
          {deload && <span style={{ color: 'var(--signal)' }}>Entlastung</span>}
        </div>
        <Zyklusband tag={tag} />
      </header>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="knopf"
          onClick={async () => {
            const t = training ?? (await trainingSichern(vorlageId))
            await trainingAendern(t.id, { is_deload: !t.is_deload })
          }}
        >
          {deload ? 'Entlastung aus' : 'Entlastungswoche'}
        </button>
        <HeutePause />
      </div>

      {bloecke
        .filter((b) => b.kind === 'warmup')
        .map((b) => (
          <section key={b.id} className="mt-10">
            <header className="border-b border-ink pb-2">
              <div className="flex items-baseline justify-between">
                <h2 className="font-sans text-lg text-ink">
                  <span className="mr-2 font-mono text-xs text-muted">{b.label}</span>
                  Aufwärmen
                </h2>
                <span className="font-mono text-xs text-muted">{b.planned_minutes} Min</span>
              </div>
            </header>
            <p className="mt-2 text-sm text-body">{b.note}</p>
            <button
              type="button"
              className={aufgewaermt ? 'knopf-stark mt-3' : 'knopf mt-3'}
              onClick={() => setAufgewaermt((x) => !x)}
            >
              {aufgewaermt ? 'Aufgewärmt' : 'Abhaken'}
            </button>
          </section>
        ))}

      {gruppen.map((gruppe) => {
        const erster = gruppe[0]
        if (erster.kind === 'warmup') return null
        if (erster.kind === 'muscleup') {
          const block = gewaehlterBlock(woche)
          const beschreibung = MU_BLOECKE.find((m) => m.id === block)
          return (
            <section key={erster.id} className="mt-10">
              <header className="border-b border-ink pb-2">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-sans text-lg text-ink">
                    <span className="mr-2 font-mono text-xs text-muted">{erster.label}</span>
                    Muscle-Up · {beschreibung?.name}
                  </h2>
                  <span className="font-mono text-xs text-muted">{erster.planned_minutes} Min</span>
                </div>
                <p className="mt-1 font-mono text-xs text-muted ziffern">
                  RIR {erster.target_rir} · Pause {mmss(erster.rest_seconds ?? 90)}
                </p>
              </header>
              <MuscleUpUeben
                blockId={block}
                trainingId={training?.id ?? null}
                pauseSekunden={erster.rest_seconds ?? 90}
              />
            </section>
          )
        }
        return (
          <Blockgruppe
            key={gruppe.map((b) => b.id).join('-')}
            gruppe={gruppe}
            deload={deload}
            saetzeDesTrainings={saetzeDesTrainings}
            alleSaetze={bestand.saetze}
            trainings={bestand.trainings}
            aktuellesTraining={training?.id ?? null}
            offen={offen}
            setOffen={setOffen}
            sichern={sichern}
            loeschen={(id) => void satzLoeschen(id)}
          />
        )
      })}

      <hr className="linie mt-12" />

      {training?.finished_at ? (
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.12em] text-muted">
          Abgeschlossen · der Zähler steht auf Tag {bestand.zyklus?.current_day}
        </p>
      ) : !abschluss ? (
        <button type="button" className="knopf-stark mt-6" onClick={() => setAbschluss(true)}>
          Einheit abschließen
        </button>
      ) : (
        <div className="auftauchen mt-6">
          <p className="etikett">Anstrengung der Einheit · 1 bis 10</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className="ziel w-[44px] border font-mono text-sm ziffern"
                style={{
                  borderColor: rpe === n ? 'var(--accent)' : 'var(--rule)',
                  color: rpe === n ? 'var(--accent)' : 'var(--ink-muted)'
                }}
                onClick={() => setRpe(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <label className="etikett mt-4 block" htmlFor="notiz">
            Notiz
          </label>
          <input
            id="notiz"
            className="feld font-serif text-base"
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
            placeholder="Schulter links zickt"
          />
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="knopf-stark"
              onClick={async () => {
                const t = training ?? (await trainingSichern(vorlageId))
                await trainingAbschliessen(t.id, rpe, notiz || null)
                setAbschluss(false)
              }}
            >
              Fertig, Zähler weiter
            </button>
            <button type="button" className="knopf" onClick={() => setAbschluss(false)}>
              Zurück
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function HeutePause() {
  const { pauseHeute } = useSpeicher()
  const [offen, setOffen] = useState(false)
  const [grund, setGrund] = useState('')

  if (!offen) {
    return (
      <button type="button" className="knopf" onClick={() => setOffen(true)}>
        Heute Pause
      </button>
    )
  }
  return (
    <div className="auftauchen w-full border-t border-rule pt-3">
      <p className="max-w-[62ch] text-sm text-body">
        Der Zähler springt auf den nächsten Pausentag, ohne eine Einheit zu zählen. Der Zyklus
        verschiebt sich dadurch dauerhaft.
      </p>
      <label className="etikett mt-3 block" htmlFor="grund">
        Grund
      </label>
      <input
        id="grund"
        className="feld font-serif text-base"
        value={grund}
        onChange={(e) => setGrund(e.target.value)}
        placeholder="Erholung 31, vier Stunden Schlaf"
      />
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          className="knopf-stark"
          onClick={async () => {
            await pauseHeute(grund)
            setOffen(false)
            setGrund('')
          }}
        >
          Pause eintragen
        </button>
        <button type="button" className="knopf" onClick={() => setOffen(false)}>
          Abbrechen
        </button>
      </div>
    </div>
  )
}

/* --- Hilfen -------------------------------------------------------------- */

/** Blöcke mit derselben Superset-Kennung gehören in eine Gruppe. */
export function gruppiere(bloecke: Block[]): Block[][] {
  const gruppen: Block[][] = []
  for (const b of bloecke) {
    const letzte = gruppen[gruppen.length - 1]
    if (b.superset_group && letzte && letzte[0].superset_group === b.superset_group) {
      letzte.push(b)
    } else {
      gruppen.push([b])
    }
  }
  return gruppen
}

function kurzname(block: Block): string {
  const u = block.exercise_id ? UEBUNG_NACH_ID[block.exercise_id] : undefined
  return u?.name ?? 'Pause'
}

export function letzterWert(werte: { measured_on: string; weight_kg: number | null }[]): number | null {
  const mit = werte.filter((w) => w.weight_kg != null).sort((a, b) => a.measured_on.localeCompare(b.measured_on))
  return mit.length ? Number(mit[mit.length - 1].weight_kg) : null
}
