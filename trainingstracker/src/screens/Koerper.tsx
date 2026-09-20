/* ==========================================================================
   Körper. Gewicht, auf Wunsch Bauchumfang, und Fotos. Die Fotos liegen in
   einem privaten Eimer; abrufbar sind sie nur über kurzlebige signierte
   Adressen, also nicht ohne Sitzung und nicht über eine geratene URL.
   ========================================================================== */

import { useState } from 'react'
import { Zahlenfeld } from '../components/Zahlenfeld'
import { heute, kurz, lang, tageZwischen } from '../lib/datum'
import type { Foto } from '../lib/types'
import { useSpeicher } from '../state/speicher'
import { letzterWert } from './Heute'

const POSEN: { id: Foto['pose']; name: string }[] = [
  { id: 'front', name: 'Vorn' },
  { id: 'side', name: 'Seite' },
  { id: 'back', name: 'Rücken' }
]

export function Koerper() {
  const { bestand, koerperwertSichern, fotoHochladen, angemeldet } = useSpeicher()
  const tag = heute()
  const heutiger = bestand.koerperwerte.find((k) => k.measured_on === tag)
  const [gewicht, setGewicht] = useState<number | null>(
    heutiger?.weight_kg != null ? Number(heutiger.weight_kg) : letzterWert(bestand.koerperwerte)
  )
  const [umfang, setUmfang] = useState<number | null>(
    heutiger?.waist_cm != null ? Number(heutiger.waist_cm) : null
  )
  const [notiz, setNotiz] = useState(heutiger?.note ?? '')
  const [gesichert, setGesichert] = useState(false)
  const [meldung, setMeldung] = useState<string | null>(null)
  const [laedt, setLaedt] = useState<Foto['pose'] | null>(null)

  const letztesFoto = [...bestand.fotos].sort((a, b) => b.taken_on.localeCompare(a.taken_on))[0]
  const tageSeitFoto = letztesFoto ? tageZwischen(letztesFoto.taken_on, tag) : null
  const fotoFaellig = tageSeitFoto == null || tageSeitFoto >= 14

  const sichern = async () => {
    await koerperwertSichern({
      id: heutiger?.id ?? crypto.randomUUID(),
      measured_on: tag,
      weight_kg: gewicht,
      waist_cm: umfang,
      note: notiz || null
    })
    setGesichert(true)
    window.setTimeout(() => setGesichert(false), 2000)
  }

  const hochladen = async (pose: Foto['pose'], datei: File | undefined) => {
    if (!datei) return
    setLaedt(pose)
    const fehler = await fotoHochladen(datei, pose, tag)
    setLaedt(null)
    setMeldung(fehler)
  }

  const letzte = [...bestand.koerperwerte]
    .sort((a, b) => b.measured_on.localeCompare(a.measured_on))
    .slice(0, 14)

  return (
    <div className="auftauchen">
      <p className="etikett">{lang(tag)}</p>
      <h1 className="mt-1 font-sans text-2xl text-ink">Körper</h1>

      <section className="mt-8">
        <div className="flex gap-4">
          <Zahlenfeld etikett="Gewicht" einheit="kg" schritt={0.1} wert={gewicht} aendern={setGewicht} />
          <Zahlenfeld etikett="Bauch" einheit="cm" schritt={0.5} wert={umfang} aendern={setUmfang} />
        </div>
        <label className="etikett mt-4 block" htmlFor="kbnotiz">
          Notiz
        </label>
        <input
          id="kbnotiz"
          className="feld font-serif text-base"
          value={notiz}
          onChange={(e) => setNotiz(e.target.value)}
          placeholder="nach dem Aufstehen, nüchtern"
        />
        <button type="button" className="knopf-stark mt-4" onClick={() => void sichern()}>
          {gesichert ? 'Gespeichert' : heutiger ? 'Heute ändern' : 'Eintragen'}
        </button>
      </section>

      <hr className="linie mt-10" />

      <section className="mt-8">
        <h2 className="font-sans text-lg text-ink">Fotos</h2>
        <p className="mt-2 max-w-[62ch] text-sm text-muted">
          {fotoFaellig
            ? tageSeitFoto == null
              ? 'Noch kein Foto. Das erste ist das wichtigste — ohne Anfang kein Vergleich.'
              : `Das letzte Foto ist ${tageSeitFoto} Tage alt. Alle vierzehn Tage genügt.`
            : `Letztes Foto vor ${tageSeitFoto} Tagen. Das nächste in ${14 - (tageSeitFoto ?? 0)} Tagen.`}
        </p>

        {!angemeldet && (
          <p className="mt-3 font-mono text-xs" style={{ color: 'var(--signal)' }}>
            Fotos brauchen eine Anmeldung — sie gehen in den privaten Eimer, nicht auf das Gerät.
          </p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          {POSEN.map((p) => {
            const heuteSchon = bestand.fotos.some((f) => f.taken_on === tag && f.pose === p.id)
            return (
              <label
                key={p.id}
                className="ziel flex cursor-pointer flex-col items-center justify-center border border-rule py-3 font-mono text-xs uppercase tracking-[0.12em]"
                style={{ color: heuteSchon ? 'var(--accent)' : 'var(--ink-muted)' }}
              >
                {laedt === p.id ? '…' : p.name}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  disabled={!angemeldet || laedt != null}
                  onChange={(e) => void hochladen(p.id, e.target.files?.[0])}
                />
              </label>
            )
          })}
        </div>
        {meldung && (
          <p className="mt-3 font-mono text-xs" style={{ color: 'var(--signal)' }}>
            {meldung}
          </p>
        )}
        {bestand.fotos.length > 0 && (
          <p className="mt-3 font-mono text-xs text-muted ziffern">
            {bestand.fotos.length} Fotos an {new Set(bestand.fotos.map((f) => f.taken_on)).size}{' '}
            Terminen · Gegenüberstellung in der Auswertung
          </p>
        )}
      </section>

      {letzte.length > 0 && (
        <section className="mt-10">
          <h2 className="font-sans text-lg text-ink">Die letzten Messungen</h2>
          <table className="mt-3 w-full">
            <thead>
              <tr>
                <th>Tag</th>
                <th className="num">Gewicht</th>
                <th className="num">Bauch</th>
              </tr>
            </thead>
            <tbody>
              {letzte.map((k) => (
                <tr key={k.id}>
                  <td className="font-mono text-xs">{kurz(k.measured_on)}</td>
                  <td className="num">
                    {k.weight_kg != null ? `${Number(k.weight_kg).toLocaleString('de-DE')} kg` : '—'}
                  </td>
                  <td className="num">
                    {k.waist_cm != null ? `${Number(k.waist_cm).toLocaleString('de-DE')} cm` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
