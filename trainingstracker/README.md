# Trainingstracker

Zwölf Wochen, ein Ziel: der erste Muscle-Up. Die App begleitet den Plan vom
19. September 2026 — am Handy, zwischen zwei Sätzen, mit nassen Händen.

Sie läuft unter [svg.global/training](https://svg.global/training/), lässt sich
auf den Homescreen legen und funktioniert ohne Netz vollständig weiter. Ein
erfasster Satz liegt sofort in IndexedDB; die Outbox schiebt ihn nach Supabase,
sobald die Verbindung zurück ist.

## Die eine Bedienung, auf die es ankommt

Zeile antippen, „Satz" antippen. Zwei Antippen, wenn Gewicht und Wiederholungen
dem letzten Mal entsprechen — und das tun sie meistens. Im Feld steht bereits
der vorige Satz dieser Einheit, sonst der letzte Satz derselben Übung. Lief das
letzte Mal sauber über die obere Grenze des Wiederholungsbereichs bei
erreichtem Ziel-RIR, steht daneben ein Vorschlag mit 2,5 kg mehr im Oberkörper
oder 5 kg mehr im Unterkörper. Als antippbare Zahl, nicht als Zwang.

Nach jedem bestätigten Satz startet der Pausentimer mit der hinterlegten Zeit,
bleibt beim Scrollen am unteren Rand stehen und meldet sich am Ende mit Ton und
Vibration.

## Der Plan steht nur an einer Stelle

Vite, React 18, TypeScript, Tailwind, `vite-plugin-pwa`, `@supabase/supabase-js`,
Recharts, `date-fns`. Kein weiteres UI-Framework — die Oberfläche ist klein
genug, dass Tailwind mit den Tokens aus `src/index.css` reicht.

Der Trainingsplan steht genau einmal im Projekt, in `src/data/plan.ts`. Aus
dieser Datei erzeugt `npm run seed` die Datei `sql/03_seed.sql`; Datenbank und
Client können dadurch nicht auseinanderlaufen. Änderungen am Plan gehören nach
`plan.ts` und danach in eine neue Migration.

```
npm install
npm run dev       # Entwicklung
npm test          # 57 Tests: Volumen, Zyklus, Progression, Abgleich, Datum
npm run seed      # sql/03_seed.sql neu erzeugen
npm run build     # baut nach ../training, direkt von GitHub Pages ausgeliefert
```

Der Build landet bewusst im Repository: svg.global wird ohne CI direkt aus dem
Hauptzweig ausgeliefert. Wer `src/` ändert, gibt `npm run build` mit ins
Commit, sonst bleibt die veröffentlichte Fassung stehen.

## Supabase einrichten

Die Dateien in `sql/` laufen in dieser Reihenfolge in den SQL-Editor:
`01_schema.sql`, `02_rls.sql`, `03_seed.sql`, `04_views.sql`, `05_storage.sql`.
Danach `.env.example` nach `.env` kopieren und URL sowie publishable key
eintragen. Ohne diese Werte startet die App trotzdem, protokolliert aber nur
auf dem Gerät — brauchbar zum Ausprobieren, nicht zum Trainieren.

Jede Protokolltabelle trägt `user_id` und eine Policy `auth.uid() = user_id`.
Übungen, Vorlagen, Blöcke und Muscle-Up-Progression sind für angemeldete
Nutzer lesbar und sonst unveränderlich: einen Planeditor gibt es nicht. Fotos liegen im privaten Eimer `progress-photos` unter einem Pfad, der
mit der Nutzerkennung beginnt; die App holt für jede Anzeige eine signierte
Adresse mit zwei Minuten Laufzeit. Eine geratene URL bringt nichts.

## Wie das Volumen gerechnet wird

Jeder abgeschlossene Arbeitssatz zählt 1,0 für jeden Primär- und 0,5 für jeden
Sekundärmuskel seiner Übung; Aufwärmsätze zählen nicht, und der Muscle-Up-Block
zählt nicht, weil er keine Übung aus dem Stamm trägt. Die Methodik folgt Pelland
et al., *Sports Medicine* 2025.

Was der Plan über acht Tage liefert, auf sieben Tage normiert, gegen die
Zielkorridore der Spezifikation:

| Muskelgruppe | Plan je 7 Tage | Ziel |
|---|---:|---:|
| Rücken, Zug | 28,4 | 22 |
| Bauch | 29,8 | 19 |
| Beinrückseite, Gesäß | 20,6 | 17 |
| Brust | 17,5 | 15 |
| Trizeps | 18,8 | 15 |
| Bizeps | 14,9 | 15 |
| Oberschenkel vorn | 11,8 | 12 |
| Seitliche Schulter | 9,6 | 9 |
| Waden | 5,3 | 5 |

Bizeps, Oberschenkel, Waden und seitliche Schulter treffen ihren Korridor auf
die Nachkommastelle genau — vier unabhängige Bestätigungen, dass die Zählweise
dieselbe ist, nach der die Korridore entstanden sind. Rücken, Bauch,
Beinrückseite und Trizeps liegen darüber, weil der Plan ihnen mehr gibt, als
die Korridore verlangen.

Die Abnahmebedingung, das Wochenvolumen für `back_pull` müsse nach einer vollen
Woche zwischen 20 und 24 liegen, geht damit nicht auf. Eine Pull-Einheit bringt
14 direkte Sätze, und im Achttagezyklus stehen zwei davon; dazu kommen 4,5
indirekte aus Kreuzheben und rumänischem Kreuzheben. Das ergibt 32,5 je Zyklus,
28,4 je sieben Tage. Ein Sieben-Tage-Fenster mit nur einer Pull-Einheit käme auf
18,5. Zwischen 20 und 24 liegt kein Fenster des Plans. Die Rechenregel ist so
umgesetzt, wie sie in der Spezifikation steht — die Korridorzahl gehört
nachgeschärft, nicht der Code. `src/lib/rechnen.test.ts` hält alle drei Werte
fest, damit eine Planänderung auffällt.

## Was von der Spezifikation abweicht

`template_blocks.id` ist `bigint` mit fest vergebenen Kennungen statt
`bigserial`: `sets.block_id` verweist darauf, und die App muss die Vorlage auch
offline kennen. 1xx ist Push A, 2xx Push B, 3xx Pull, 4xx Beine A, 5xx Beine B.

Für „Heute Pause" gibt es die Tabelle `cycle_skips`. Das vorgegebene Modell hat
keine Spalte für den Grund, und die Verschiebung des Zyklus soll nachvollziehbar
bleiben.

Bei Halteübungen stehen in `rep_min` und `rep_max` Sekunden, beim Koffertragen
Meter. Das spart zwei Spalten, die sonst in 39 von 41 Blöcken leer stünden.

`session_templates.cycle_position` hält für Pull die Position 2. Pull steht
zweimal im Zyklus, auf Position 2 und 6; die Rotation selbst liegt in
`src/lib/zyklus.ts` und nicht in der Tabelle.

Das Aufwärmen wird abgehakt, aber nicht protokolliert — die drei
Steigerungssätze interessieren niemanden nachträglich. Fotos brauchen eine
Verbindung: ein Bild in die Outbox zu legen hieße, Megabytes in IndexedDB zu
parken, und der Eimer ist ohnehin nur online erreichbar.

## Nicht gebaut

Keine Anbindung an WHOOP oder Withings, keine Übungsdatenbank zum Stöbern,
keine Videos, keine sozialen Funktionen, kein Trainingsplan-Editor. Das
Datenmodell steht der späteren Ergänzung nicht im Weg; der Import von der Waage
wäre der nächste sinnvolle Schritt, sobald das Gewicht nicht mehr von Hand
kommt.
