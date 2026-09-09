# Lokaler Durchlauf

Prüft Schema, Policies und Oberfläche gegen ein leeres Postgres — ohne dass
irgendwo ein Supabase-Projekt angelegt werden muss. Aufgebaut wird die echte
Datenbank aus `sql/01`–`03`; ersetzt sind nur die Teile, die Supabase als Dienst
beisteuert: ein paar Tabellen und Funktionen (`supabase_shim.sql`) sowie die
Anmeldung (`stub.js`, gibt selbst signierte JWTs aus). Der REST-Weg läuft über
PostgREST, also über dieselbe Schicht, die auch Supabase betreibt.

## Voraussetzungen

- Postgres 15 oder neuer mit `pgcrypto` und `pg_trgm`, erreichbar für den
  aufrufenden Benutzer
- [PostgREST](https://postgrest.org) im `PATH`
- Node mit Playwright und einem installierten Chromium
- Python 3 (für den Webserver)
- Die drei CDN-Bibliotheken lokal, damit der Lauf nicht am Netz hängt:

```sh
mkdir -p vendor && cd vendor
curl -sSLO https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js
curl -sSLO https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.1/qrcode.min.js
curl -sSLO https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js
```

## Starten

```sh
./run.sh
```

Erst läuft `sql/99_rls_test.sql` gegen die frische Datenbank, dann fährt
Playwright die Anwendung als Tochter-Nutzer und als Holding durch. Screenshots
landen in `shots/`.

## Was geprüft wird

Anmeldung mit falschem Passwort wird abgewiesen. Eine Tochter sieht vier
Objekte, die Holding neun. Der Gesellschaftsumschalter erscheint nur dort, wo
es mehr als eine Gesellschaft gibt. Ein Aufkleber aus einer fremden Gesellschaft
zeigt weder Name noch Standort. Erfassen vergibt die nächste Inventarnummer.
Der QR-Code wird wirklich gezeichnet, nicht nur ein leeres Canvas. Die
Etiketten messen nachgemessen 45,7 × 21,2 mm beziehungsweise 63,5 × 29,6 mm.
Die Verwaltung lädt und legt eine neue Tochtergesellschaft an. Am Ende darf
keine einzige JavaScript-Ausnahme aufgelaufen sein.

Die Konten heißen `holding@`, `digital@` und `industrie@test.invalid`, das
Passwort steht in `stub.js`. Beides existiert nur lokal.
