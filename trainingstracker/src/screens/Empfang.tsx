/* ==========================================================================
   Der Schirm vor dem Tracker, solange niemand angemeldet ist.

   Ohne Konto landet jeder Satz nur in IndexedDB — auf genau einem Gerät, und
   weg, sobald der Browserspeicher aufräumt. Das ist eine Entscheidung, keine
   Nebensache, also wird sie hier gefällt statt in einer roten Zeile am Rand.
   ========================================================================== */

import { Anmeldung } from '../components/Anmeldung'

export function Empfang({ ohneKonto }: { ohneKonto: () => void }) {
  return (
    <div className="mx-auto max-w-[680px] px-4 pb-24 pt-10">
      <p className="etikett">Zwölf Wochen zum Muscle-Up</p>
      <h1 className="mt-1 font-sans text-2xl text-ink">Anmelden</h1>
      <p className="mt-4 max-w-[58ch]">
        Mit Konto liegen Trainings, Körperwerte und Fotos in Supabase: Das Handy im Studio und der
        Rechner zu Hause zeigen denselben Stand, und ein verlorenes Gerät kostet keine Daten.
        Erfasst wird trotzdem zuerst örtlich — ohne Netz läuft die Einheit weiter, und was
        aufgelaufen ist, geht nach, sobald die Verbindung zurück ist.
      </p>

      <Anmeldung schliessen={() => undefined} />

      <hr className="linie mt-10" />
      <button type="button" className="knopf mt-6" onClick={ohneKonto}>
        Ohne Konto fortfahren
      </button>
      <p className="mt-3 max-w-[58ch] text-sm text-muted">
        Dann bleibt alles auf diesem Gerät. Meldest du dich später an, wandert das Aufgelaufene
        mit nach oben — nichts geht dabei verloren.
      </p>
    </div>
  )
}
