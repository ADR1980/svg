# Inventarverwaltung Snowflake Ventures

Jede Tochtergesellschaft sieht ihr eigenes Inventar, Snowflake Ventures sieht alles.
Das ist die ganze Anforderung, und sie steckt nicht im JavaScript, sondern in Postgres:
Wer die Browserkonsole öffnet und mit dem öffentlichen Schlüssel eigene Abfragen absetzt,
bekommt dieselben Zeilen wie über die Oberfläche. Der Nachweis dafür ist
`sql/99_rls_test.sql`.

Erfasst wird IT-Technik, Mobiliar und Maschinen — mit Standort, Zuweisung an
Mitarbeitende, Anschaffungswert, Garantie sowie Prüf- und Wartungsterminen bis hin zu
DGUV V3. Jedes Objekt trägt einen Aufkleber mit QR-Code; wo Android im Spiel ist,
zusätzlich oder stattdessen einen NFC-Tag.

Technisch: statische Seiten plus Supabase. Kein Server, kein Build-Schritt, keine
Abhängigkeiten außer drei Bibliotheken vom CDN.

## Einrichtung

Sieben Schritte, ungefähr eine halbe Stunde.

**1 — Projekt anlegen.** Auf supabase.com ein neues Projekt erstellen, Region Frankfurt.

**2 — Schema einspielen.** Im SQL Editor nacheinander ausführen:

```
sql/01_schema.sql     Tabellen, Zähler, Trigger, Indizes
sql/02_rls.sql        Sichtbarkeit, Schreibrechte, Storage-Regeln
sql/03_seed.sql       Snowflake Ventures und zwei Demo-Töchter
```

Danach einmal `sql/99_rls_test.sql` laufen lassen. Es legt Testdaten an, prüft sechs
Fälle und verwirft am Ende alles. Kommt „Alle Prüfungen bestanden" zurück, ist die
Trennung dicht. Kommt etwas anderes, hier aufhören und den Fehler klären.

**3 — Anmeldung absichern.** Unter *Authentication → Providers → Email*:
Selbstregistrierung ausschalten, E-Mail-Bestätigung einschalten. Ohne diesen Schritt
kann sich mit dem öffentlichen Schlüssel jeder ein Konto anlegen. Sehen würde er
nichts, weil ihm die Zuordnung fehlt — aber ein Konto in fremder Datenbank ist kein
schöner Zustand.

**4 — Speicher.** Unter *Storage* einen Bucket `asset-photos` anlegen, **nicht**
öffentlich. Die Zugriffsregeln dazu hat Schritt 2 schon gesetzt.

**5 — Ersten Zugang schaffen.** Unter *Authentication → Users → Invite user* die eigene
Adresse einladen und das Passwort setzen. Dann im SQL Editor:

```sql
insert into memberships (user_id, company_id, role)
select id, '11111111-1111-4111-8111-111111111111', 'owner'
  from auth.users where email = 'DEINE-ADRESSE';
```

Die UUID ist Snowflake Ventures aus dem Seed. Wer hier `owner` ist, sieht und pflegt
alle Töchter darunter.

**6 — Verbinden.** Aus *Settings → API* die Project URL und den Schlüssel
`anon public` nach `config.js` übertragen, dazu unter `APP_URL` die Adresse, unter der
die Anwendung später läuft. Diese Adresse landet auf jedem gedruckten Etikett — sie
später zu ändern macht die alten Aufkleber wertlos.

Der anon key darf im Repository stehen. Er benennt nur das Projekt und trägt keine
Rechte. Der `service_role`-Schlüssel dagegen hebelt jede Regel aus und gehört
ausschließlich in die Supabase-Oberfläche.

**7 — Veröffentlichen.** Den Branch nach `main` mergen. Mehr ist nicht zu tun:
GitHub Pages liefert dieses Repository unter `svg.global` aus, Unterordner
eingeschlossen, und stellt `inventory/` nach ein paar Minuten unter
`https://svg.global/inventory/` bereit. Kein DNS-Eintrag, kein zweiter Hoster,
kein neues Zertifikat.

Zum Ausprobieren vorher reicht jeder lokale Webserver — `python3 -m http.server 8080`
im Repo-Wurzelverzeichnis, dann `http://localhost:8080/inventory/`. Dabei bleibt nur
der Service Worker stumm, der besteht auf HTTPS; nach dem Merge läuft er.

## Prüfen

`sql/99_rls_test.sql` lässt sich jederzeit im SQL Editor laufen; es legt
Testdaten an, prüft sechs Fälle und verwirft alles wieder.

Wer die ganze Anwendung ohne Supabase-Projekt durchfahren will, findet in
`test/` einen lokalen Aufbau: echtes Schema in einem leeren Postgres, PostgREST
davor, ein Stub nur für die Anmeldung, danach Playwright durch alle Ansichten.
`./test/run.sh` liefert am Ende eine Zeile pro Prüfung. Details in
`test/README.md`.

## Gesellschaften und Rollen

Neue Töchter legt die Verwaltung in der Oberfläche an, unter *Verwaltung →
Tochtergesellschaft anlegen*. Die Hierarchie ist beliebig tief; eine Tochter kann
eigene Töchter haben, und der Blick nach oben bleibt jeder verwehrt.

| Rolle | Darf |
|---|---|
| `owner` | alles, einschließlich Gesellschaften und Zugängen |
| `admin` | dasselbe, gedacht für die Verwaltung einer Tochter |
| `editor` | Inventar erfassen, ändern, ausgeben |
| `viewer` | nur lesen |

Die Rolle gilt für die Gesellschaft der Mitgliedschaft und alles darunter. Ein
`admin` bei Snowflake Digital kommt an deren Töchter heran, an die Schwestergesellschaft
nicht und an die Holding erst recht nicht.

Weitere Nutzer kommen über *Authentication → Users → Invite user* ins Projekt und
bekommen danach in der Oberfläche ihre Rolle. Der Umweg ist Absicht: Konten anlegen
könnte diese Seite nur mit dem `service_role`-Schlüssel.

## QR-Aufkleber und NFC-Tags

Auf dem Etikett steht eine Adresse der Form
`https://svg.global/inventory/#/a/<code>`. Der Code ist eine Zufallsfolge aus
16 Zeichen, nicht die Inventarnummer — sonst ließen sich Bestände durchzählen und aus
dem Präfix die Gesellschaft ablesen. Die Inventarnummer steht trotzdem lesbar daneben,
etwa `SFD-IT-2026-0042`.

Gedruckt wird über `labels.html`. Zwei Raster sind hinterlegt, beide aus Averys
Typenschild-Reihe aus mattbeschichtetem Polyester, öl-, UV- und wasserfest von −40 °C
bis +150 °C:

- **L6009-20** — 45,7 × 21,2 mm, 48 je Bogen. Für Notebooks, Monitore, Kleingeräte.
- **L6011-20** — 63,5 × 29,6 mm, 27 je Bogen. Für Maschinen und Mobiliar.

Vor dem ersten Serienlauf einen Bogen auf normales Papier drucken und gegen die Folie
halten. Die Randmaße lassen sich in der Maske korrigieren, ohne dass jemand Code
anfassen muss.

Gescannt wird mit der Kamera. Wo der Browser `BarcodeDetector` mitbringt, wird der
genommen; sonst lädt die Seite html5-qrcode nach. Auf dem iPhone tut es auch die
Kamera-App: Sie erkennt den Code und öffnet die Adresse.

NFC-Tags beschreibt die Anwendung über Web NFC — Chrome, Edge, Opera und Samsung
Internet auf Android. Unter iOS gibt es das nicht, weil WebKit `NDEFReader` nicht
kennt. Ein Tag, der auf einem Android-Gerät mit der Adresse beschrieben wurde, öffnet
sie beim Antippen allerdings auch auf neueren iPhones; das erledigt iOS selbst.

Ein gescannter Aufkleber, der zu einer fremden Gesellschaft gehört, zeigt nichts als
den Hinweis, dass nichts hinterlegt ist — kein Name, kein Standort, kein Beleg dafür,
dass es das Objekt überhaupt gibt. Wer für ein verlorenes Gerät einen Rückgabehinweis
möchte, schaltet ihn je Gesellschaft in `companies.settings` frei:

```sql
update companies
   set settings = settings || '{"finder_display": true,
                                "finder_contact": "fundsachen@example.de"}'::jsonb
 where short_code = 'SFD';
```

## Dateien

```
index.html              Anwendung: Anmeldung, Übersicht, Liste, Detail, Erfassung, Scan
labels.html             Etikettenbogen zum Drucken
config.js               Projekt-Adresse, anon key, Adresse für die Aufkleber
css/app.css             Haus-Design, mobil zuerst
js/catalog.js           Feldkatalog je Kategorie, Vokabular, Formatierung
js/db.js                Supabase-Zugriff
js/scan.js              Kamera und NFC
js/app.js               Router und Ansichten
sw.js                   Service Worker: App-Hülle offline, Daten nie
manifest.webmanifest    Installation auf dem Startbildschirm
sql/01_schema.sql       Tabellen, Zähler, Trigger
sql/02_rls.sql          Row Level Security
sql/03_seed.sql         Startbestand
sql/99_rls_test.sql     Nachweis der Mandantentrennung
test/                   Lokaler Durchlauf ohne Supabase-Projekt
```

## Was nicht drin ist

Offline erfassen. Der Service Worker hält die Oberfläche und die Bibliotheken vor, so
dass Scannen und Nachschlagen im Funkloch weiterlaufen; neue Objekte brauchen Netz.
Ein Schreibpuffer mit Konfliktauflösung wäre eigenständige Arbeit von mehreren Tagen
und lohnt erst, wenn jemand tatsächlich im Keller erfasst.

Abschreibungen werden nicht gerechnet. Erfasst sind Anschaffungswert, Kaufdatum und
Nutzungsdauer — genug, um die Zahlen an die Anlagenbuchhaltung zu geben, die sie
ohnehin führt.
