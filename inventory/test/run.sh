#!/bin/sh
# ============================================================================
# Lokaler Durchlauf ohne Supabase-Projekt.
#
# Baut aus einem leeren Postgres eine Datenbank mit dem echten Schema und den
# echten Policies, stellt PostgREST davor, ersetzt nur die Anmeldung durch
# einen Stub und fährt die Anwendung im Browser durch. Damit lässt sich die
# Mandantentrennung prüfen, ohne irgendwo ein Projekt anzulegen.
#
# Voraussetzungen: Postgres mit pgcrypto und pg_trgm, PostgREST im PATH,
# Node mit playwright, dazu die drei CDN-Bibliotheken unter test/vendor/
# (siehe test/README.md).
# ============================================================================
set -e
BASIS=$(cd "$(dirname "$0")" && pwd)
cd "$BASIS"
DB=${DB:-inv_test}
PSQL=${PSQL:-"psql"}
# PostgREST spricht TCP, psql darf auch über den Socket gehen. Läuft Postgres
# nicht auf dem Standardport, beides hier setzen.
PGHOST_TCP=${PGHOST_TCP:-localhost}
PGPORT_TCP=${PGPORT_TCP:-5432}

echo "→ Datenbank $DB neu aufbauen"
$PSQL -q -d postgres -c "select pg_terminate_backend(pid) from pg_stat_activity where datname='$DB'" >/dev/null 2>&1 || true
dropdb --if-exists "$DB"
createdb "$DB"
export PGOPTIONS="-c client_min_messages=warning"
for f in supabase_shim ../sql/01_schema ../sql/02_rls ../sql/04_benutzer ../sql/03_seed users; do
  $PSQL -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f.sql" >/dev/null
done

echo "→ Mandantentrennung in SQL prüfen"
# Das Ergebnis muss erst in eine Datei, nicht in eine Pipe: Der Rückgabewert
# einer Pipe ist der von grep, und ein "|| true" dahinter verschluckt auch den
# Abbruch von psql. Ein Fall, der mitten im Skript die Transaktion zerreißt,
# lief so unbemerkt durch — der Rest wurde übersprungen, und der Durchlauf
# meldete trotzdem Erfolg.
SOLL=$(grep -c "raise notice 'Fall .* bestanden" ../sql/99_rls_test.sql)
PGOPTIONS="" $PSQL -q -v ON_ERROR_STOP=1 -d "$DB" -f ../sql/99_rls_test.sql > /tmp/inv-rls.log 2>&1 || true
grep -E "bestanden|FEHLGESCHLAGEN" /tmp/inv-rls.log | sed 's/^.*NOTICE:  /  /' || true
IST=$(grep -cE "Fall .* bestanden" /tmp/inv-rls.log || true)
if [ "$IST" -ne "$SOLL" ]; then
  echo "  FEHLER: $IST von $SOLL SQL-Fällen bestanden. Erste Meldung:"
  grep -E "ERROR|FEHLGESCHLAGEN" /tmp/inv-rls.log | head -3 | sed 's/^/    /'
  exit 1
fi

echo "→ Rolle für PostgREST"
$PSQL -q -d "$DB" -c "create role authenticator noinherit login password 'authpw'" >/dev/null 2>&1 || true
$PSQL -q -d "$DB" -c "grant anon, authenticated to authenticator" >/dev/null

FREMD=$($PSQL -tAq -d "$DB" -c "select public_code from assets where company_id='33333333-3333-4333-8333-333333333333' order by asset_no limit 1")

echo "→ PostgREST, Auth-Stub und Webserver starten"
cat > /tmp/inv-pgrst.conf <<CONF
db-uri = "postgres://authenticator:authpw@${PGHOST_TCP:-localhost}:${PGPORT_TCP:-5432}/$DB"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "test-nur-lokal-mindestens-32-zeichen-lang!!"
server-port = 3001
CONF
postgrest /tmp/inv-pgrst.conf >/tmp/inv-pgrst.log 2>&1 &
PID_REST=$!
node "$BASIS/stub.js" >/tmp/inv-stub.log 2>&1 &
PID_STUB=$!
(cd "$BASIS/../.." && python3 -m http.server 8099 --bind 127.0.0.1 >/tmp/inv-http.log 2>&1) &
PID_WEB=$!
aufraeumen() { kill $PID_REST $PID_STUB $PID_WEB 2>/dev/null; }
trap aufraeumen EXIT INT TERM
sleep 6

echo "→ Anwendung im Browser durchfahren"
mkdir -p "$BASIS/shots"
set +e
FREMD_CODE="$FREMD" node "$BASIS/e2e.js"
ERGEBNIS=$?
exit $ERGEBNIS
