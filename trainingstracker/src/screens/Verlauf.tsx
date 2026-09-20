/* ==========================================================================
   Verlauf. Absolvierte Einheiten rückwärts, jede lässt sich öffnen und
   nachträglich korrigieren — der Satz, der vergessen wurde, und der, der zu
   hoch eingetragen war.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { Blockgruppe } from '../components/Blockgruppe'
import type { SatzWerte } from '../components/SatzZeile'
import { bloeckeVon, vorlageVon } from '../data/plan'
import { dauerMinuten, kurz, lang } from '../lib/datum'
import { trainingsTonnage } from '../lib/rechnen'
import type { Block, Satz, Training } from '../lib/types'
import { useSpeicher } from '../state/speicher'
import { gruppiere, letzterWert } from './Heute'

export function Verlauf() {
  const { bestand } = useSpeicher()
  const [geoeffnet, setGeoeffnet] = useState<string | null>(null)

  const trainings = useMemo(
    () =>
      [...bestand.trainings].sort((a, b) =>
        a.performed_on === b.performed_on
          ? (b.created_at ?? '').localeCompare(a.created_at ?? '')
          : b.performed_on.localeCompare(a.performed_on)
      ),
    [bestand.trainings]
  )
  const koerpergewicht = letzterWert(bestand.koerperwerte)

  if (trainings.length === 0) {
    return (
      <div className="auftauchen">
        <p className="etikett">Verlauf</p>
        <h1 className="mt-1 font-sans text-2xl text-ink">Noch keine Einheit</h1>
        <p className="mt-4 max-w-[62ch]">
          Sobald der erste Satz steht, erscheint die Einheit hier — mit Dauer, Tonnage und allem,
          was sich später noch korrigieren lässt.
        </p>
      </div>
    )
  }

  return (
    <div className="auftauchen">
      <p className="etikett">
        Verlauf · {trainings.length} {trainings.length === 1 ? 'Einheit' : 'Einheiten'}
      </p>
      <h1 className="mt-1 font-sans text-2xl text-ink">Was gelaufen ist</h1>

      <div className="mt-8">
        {trainings.map((t) => {
          const saetze = bestand.saetze.filter((s) => s.workout_id === t.id)
          const dauer = dauerMinuten(t.started_at, t.finished_at)
          const tonnage = trainingsTonnage(saetze, koerpergewicht)
          const offen = geoeffnet === t.id
          return (
            <article key={t.id} className="border-b border-rule">
              <button
                type="button"
                className="ziel w-full py-3 text-left"
                onClick={() => setGeoeffnet(offen ? null : t.id)}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-sans text-base text-ink">
                    {vorlageVon(t.template_id).name}
                    {t.is_deload && (
                      <span className="ml-2 font-mono text-xs" style={{ color: 'var(--signal)' }}>
                        Entlastung
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-xs text-muted ziffern">{kurz(t.performed_on)}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 font-mono text-xs text-muted ziffern">
                  <span>{saetze.filter((s) => !s.is_warmup).length} Sätze</span>
                  {dauer ? <span>{dauer} Min</span> : null}
                  {tonnage != null && <span>{tonnage.toLocaleString('de-DE')} kg</span>}
                  {t.session_rpe != null && <span>Anstrengung {t.session_rpe}</span>}
                  {!t.finished_at && <span style={{ color: 'var(--signal)' }}>offen</span>}
                </div>
                {t.note && <p className="mt-1 text-sm italic text-body">{t.note}</p>}
              </button>
              {offen && <Korrektur training={t} saetze={saetze} />}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function Korrektur({ training, saetze }: { training: Training; saetze: Satz[] }) {
  const { bestand, satzSichern, satzLoeschen, trainingAendern, trainingLoeschen } = useSpeicher()
  const [offen, setOffen] = useState<string | null>(null)
  const [notiz, setNotiz] = useState(training.note ?? '')
  const gruppen = useMemo(
    () => gruppiere(bloeckeVon(training.template_id)).filter((g) => g[0].kind !== 'warmup' && g[0].kind !== 'muscleup'),
    [training.template_id]
  )

  const sichern = async (block: Block, index: number, alt: Satz | null, werte: SatzWerte) => {
    await satzSichern({
      id: alt?.id ?? crypto.randomUUID(),
      workout_id: training.id,
      user_id: training.user_id,
      block_id: block.id,
      exercise_id: block.exercise_id,
      set_index: index,
      weight_kg: werte.weight_kg,
      reps: werte.reps,
      seconds: werte.seconds,
      distance_m: werte.distance_m,
      rir: werte.rir,
      is_warmup: false,
      completed_at: alt?.completed_at ?? training.performed_on + 'T11:30:00.000Z'
    })
    setOffen(null)
  }

  return (
    <div className="auftauchen pb-8">
      <p className="etikett mt-2">{lang(training.performed_on)} · Korrektur</p>

      {gruppen.map((gruppe) => (
        <Blockgruppe
          key={gruppe.map((b) => b.id).join('-')}
          gruppe={gruppe}
          deload={training.is_deload}
          saetzeDesTrainings={saetze}
          alleSaetze={bestand.saetze}
          trainings={bestand.trainings}
          aktuellesTraining={training.id}
          offen={offen}
          setOffen={setOffen}
          sichern={sichern}
          loeschen={(id) => void satzLoeschen(id)}
        />
      ))}

      <div className="mt-8">
        <label className="etikett mb-1 block" htmlFor={'notiz-' + training.id}>
          Notiz
        </label>
        <input
          id={'notiz-' + training.id}
          className="feld font-serif text-base"
          value={notiz}
          onChange={(e) => setNotiz(e.target.value)}
          onBlur={() => void trainingAendern(training.id, { note: notiz || null })}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="knopf"
          onClick={() => void trainingAendern(training.id, { is_deload: !training.is_deload })}
        >
          {training.is_deload ? 'Keine Entlastung' : 'Als Entlastung'}
        </button>
        {!training.finished_at && (
          <button
            type="button"
            className="knopf"
            onClick={() => void trainingAendern(training.id, { finished_at: new Date().toISOString() })}
          >
            Als abgeschlossen
          </button>
        )}
        <button
          type="button"
          className="knopf"
          style={{ color: 'var(--signal)', borderColor: 'var(--signal)' }}
          onClick={() => {
            if (confirm('Einheit samt Sätzen löschen?')) void trainingLoeschen(training.id)
          }}
        >
          Einheit löschen
        </button>
      </div>
    </div>
  )
}
