/* ==========================================================================
   Datenzugriff.

   Alle Abfragen laufen ohne company_id-Filter im WHERE, wo es nicht der
   Bequemlichkeit dient: Was ein Nutzer sehen darf, entscheidet die Datenbank.
   Ein vergessener Filter im JavaScript kann hier also keine fremden Zeilen
   freilegen — er würde nur zu viele der eigenen anzeigen.
   ========================================================================== */

const CFG = window.INVENTAR_CONFIG;

let sb = null;
function client() {
  if (!sb) {
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('Die Supabase-Bibliothek wurde nicht geladen.');
    }
    sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }
  return sb;
}

function konfiguriert() {
  return CFG.SUPABASE_URL.indexOf('DEIN-PROJEKT') === -1 &&
         CFG.SUPABASE_ANON_KEY.indexOf('HIER-DEN') === -1;
}

/* Fehler aus PostgREST in eine Sprache übersetzen, die im Lager verständlich
   ist. 42501 ist die Row-Level-Security, 23505 eine doppelte Nummer. */
function fehlerText(e) {
  if (!e) return 'Unbekannter Fehler.';
  const c = e.code || '';
  if (c === '42501') return 'Dafür fehlt dir die Berechtigung.';
  if (c === '23505') return 'Diesen Eintrag gibt es schon.';
  if (c === '23503') return 'Ein verknüpfter Eintrag fehlt oder gehört zu einer anderen Gesellschaft.';
  if (c === 'PGRST301' || e.status === 401) return 'Die Sitzung ist abgelaufen. Bitte neu anmelden.';
  if (e.message && /Failed to fetch|NetworkError/i.test(e.message)) return 'Keine Verbindung.';
  return e.message || 'Unbekannter Fehler.';
}

async function pruefe(p) {
  const { data, error } = await p;
  if (error) { const err = new Error(fehlerText(error)); err.roh = error; throw err; }
  return data;
}

/* --- Anmeldung ------------------------------------------------------------ */

async function anmelden(email, passwort) {
  const { data, error } = await client().auth.signInWithPassword({ email, password: passwort });
  if (error) {
    throw new Error(error.message === 'Invalid login credentials'
      ? 'E-Mail-Adresse oder Passwort stimmt nicht.'
      : error.message);
  }
  return data.session;
}

async function abmelden() { await client().auth.signOut(); }

async function sitzung() {
  const { data } = await client().auth.getSession();
  return data.session || null;
}

function beiAnmeldewechsel(cb) {
  client().auth.onAuthStateChange((_e, s) => cb(s));
}

async function passwortSetzen(neues) {
  return pruefe(client().auth.updateUser({ password: neues }));
}

/* --- Wer bin ich, was darf ich -------------------------------------------- */

/* Die drei Funktionen spiegeln exakt die Ausdrücke in den RLS-Policies.
   Die Oberfläche blendet danach Knöpfe aus; verhindert wird der Zugriff
   trotzdem erst in Postgres. */
async function sichtbareGesellschaften() { return pruefe(client().rpc('visible_company_ids')); }
async function schreibbareGesellschaften() { return pruefe(client().rpc('writable_company_ids')); }
async function verwaltbareGesellschaften() { return pruefe(client().rpc('admin_company_ids')); }

async function gesellschaften() {
  return pruefe(client().from('companies')
    .select('id, parent_id, name, short_code, is_active, settings')
    .order('name'));
}

async function meineMitgliedschaften() {
  const s = await sitzung();
  if (!s) return [];
  return pruefe(client().from('memberships')
    .select('company_id, role').eq('user_id', s.user.id));
}

/* --- Inventar -------------------------------------------------------------- */

const ASSET_FELDER = `
  id, company_id, asset_no, public_code, category, name, manufacturer, model,
  serial_number, status, condition, location_id, assigned_person_id,
  purchase_date, purchase_price_cents, currency, supplier, warranty_until,
  depreciation_years, attributes, tags, notes, created_at, updated_at,
  locations ( id, name ), people ( id, full_name ), companies ( id, name, short_code )
`;

async function assets(filter) {
  const f = filter || {};
  let q = client().from('assets').select(ASSET_FELDER);
  if (f.company)  q = q.eq('company_id', f.company);
  if (f.category) q = q.eq('category', f.category);
  if (f.status)   q = q.eq('status', f.status);
  if (f.location) q = q.eq('location_id', f.location);
  if (f.person)   q = q.eq('assigned_person_id', f.person);
  if (f.suche) {
    const s = f.suche.replace(/[%,()]/g, ' ').trim();
    if (s) {
      q = q.or(['name', 'manufacturer', 'model', 'serial_number', 'asset_no']
        .map(sp => `${sp}.ilike.%${s}%`).join(','));
    }
  }
  return pruefe(q.order('asset_no', { ascending: true }).limit(f.limit || 500));
}

async function asset(id) {
  return pruefe(client().from('assets').select(ASSET_FELDER).eq('id', id).maybeSingle());
}

async function assetPerCode(code) {
  return pruefe(client().from('assets').select(ASSET_FELDER)
    .eq('public_code', code).maybeSingle());
}

async function assetAnlegen(werte) {
  const rows = await pruefe(client().from('assets').insert(werte).select(ASSET_FELDER));
  return rows[0];
}

async function assetAendern(id, werte) {
  const rows = await pruefe(client().from('assets').update(werte).eq('id', id).select(ASSET_FELDER));
  if (!rows.length) throw new Error('Nichts geändert — fehlt dir das Schreibrecht?');
  return rows[0];
}

async function assetLoeschen(id) {
  return pruefe(client().from('assets').delete().eq('id', id));
}

/* --- Stammdaten ------------------------------------------------------------ */

async function standorte(company) {
  let q = client().from('locations').select('id, company_id, parent_id, name, kind, address');
  if (company) q = q.eq('company_id', company);
  return pruefe(q.order('name'));
}

async function personen(company) {
  let q = client().from('people')
    .select('id, company_id, full_name, email, employee_no, department, is_active');
  if (company) q = q.eq('company_id', company);
  return pruefe(q.order('full_name'));
}

async function standortAnlegen(w) { return (await pruefe(client().from('locations').insert(w).select()))[0]; }
async function personAnlegen(w)   { return (await pruefe(client().from('people').insert(w).select()))[0]; }
async function gesellschaftAnlegen(w) { return (await pruefe(client().from('companies').insert(w).select()))[0]; }
async function gesellschaftAendern(id, w) {
  return (await pruefe(client().from('companies').update(w).eq('id', id).select()))[0];
}

/* --- Wartung und Prüfung ---------------------------------------------------- */

async function faelligkeiten(company) {
  let q = client().from('maintenance')
    .select('id, company_id, asset_id, kind, title, interval_months, last_done, due_date, responsible, is_done, assets ( id, asset_no, name, category ), companies ( name, short_code )')
    .eq('is_done', false);
  if (company) q = q.eq('company_id', company);
  return pruefe(q.order('due_date', { ascending: true }).limit(300));
}

async function wartungenZuAsset(assetId) {
  return pruefe(client().from('maintenance')
    .select('id, kind, title, interval_months, last_done, due_date, responsible, is_done')
    .eq('asset_id', assetId).order('due_date'));
}

async function wartungAnlegen(w) { return (await pruefe(client().from('maintenance').insert(w).select()))[0]; }

/* Erledigt abhaken und, wenn ein Intervall hinterlegt ist, den nächsten
   Termin gleich anlegen. Sonst fällt die Prüfung nach dem Abhaken aus der
   Liste und niemand denkt in zwölf Monaten daran. */
async function wartungErledigen(w) {
  const heute = new Date().toISOString().slice(0, 10);
  await pruefe(client().from('maintenance')
    .update({ is_done: true, last_done: heute }).eq('id', w.id));
  if (w.interval_months) {
    const naechster = new Date(heute + 'T00:00:00');
    naechster.setMonth(naechster.getMonth() + w.interval_months);
    await wartungAnlegen({
      company_id: w.company_id, asset_id: w.asset_id, kind: w.kind, title: w.title,
      interval_months: w.interval_months, last_done: heute,
      due_date: naechster.toISOString().slice(0, 10), responsible: w.responsible
    });
  }
}

/* --- Ausgabe an Mitarbeitende ------------------------------------------------ */

async function zuweisungen(assetId) {
  return pruefe(client().from('assignments')
    .select('id, person_id, from_date, to_date, note, people ( full_name )')
    .eq('asset_id', assetId).order('from_date', { ascending: false }));
}

async function ausgeben(a, personId, notiz) {
  const heute = new Date().toISOString().slice(0, 10);
  await pruefe(client().from('assignments')
    .update({ to_date: heute }).eq('asset_id', a.id).is('to_date', null));
  await pruefe(client().from('assignments').insert({
    company_id: a.company_id, asset_id: a.id, person_id: personId,
    from_date: heute, note: notiz || null
  }));
  return assetAendern(a.id, { assigned_person_id: personId, status: 'in_use' });
}

async function zuruecknehmen(a, notiz) {
  const heute = new Date().toISOString().slice(0, 10);
  await pruefe(client().from('assignments')
    .update({ to_date: heute, note: notiz || null })
    .eq('asset_id', a.id).is('to_date', null));
  return assetAendern(a.id, { assigned_person_id: null, status: 'in_stock' });
}

/* --- Historie ---------------------------------------------------------------- */

async function historie(assetId) {
  return pruefe(client().from('asset_events')
    .select('id, at, type, payload, actor_id')
    .eq('asset_id', assetId).order('at', { ascending: false }).limit(80));
}

/* --- Fotos und Belege --------------------------------------------------------- */

async function anhaenge(assetId) {
  return pruefe(client().from('attachments')
    .select('id, storage_path, filename, content_type, byte_size, kind, created_at')
    .eq('asset_id', assetId).order('created_at', { ascending: false }));
}

async function anhangHochladen(a, datei, art) {
  const endung = (datei.name.split('.').pop() || 'bin').toLowerCase().slice(0, 8);
  const pfad = `${a.company_id}/${a.id}/${crypto.randomUUID()}.${endung}`;
  const { error } = await client().storage.from(CFG.BUCKET)
    .upload(pfad, datei, { contentType: datei.type || undefined, upsert: false });
  if (error) throw new Error(fehlerText(error));
  return (await pruefe(client().from('attachments').insert({
    company_id: a.company_id, asset_id: a.id, storage_path: pfad,
    filename: datei.name, content_type: datei.type || null,
    byte_size: datei.size, kind: art || 'photo'
  }).select()))[0];
}

/* Der Bucket ist privat. Die Anzeige braucht daher signierte Adressen, die
   nach einer Stunde verfallen. */
async function anhangAdresse(pfad) {
  const { data, error } = await client().storage.from(CFG.BUCKET).createSignedUrl(pfad, 3600);
  if (error) return null;
  return data.signedUrl;
}

async function anhangLoeschen(anhang) {
  await client().storage.from(CFG.BUCKET).remove([anhang.storage_path]);
  return pruefe(client().from('attachments').delete().eq('id', anhang.id));
}

/* --- Zugänge ------------------------------------------------------------------ */

async function mitgliedschaften(company) {
  let q = client().from('memberships')
    .select('user_id, company_id, role, profiles ( id, full_name, email )');
  if (company) q = q.eq('company_id', company);
  return pruefe(q);
}

/* Eine Zeile je Konto, mit allen Rollen als jsonb und den Angaben aus
   auth.users, an die PostgREST nicht herankommt. Was zurückkommt, entscheidet
   benutzer_liste() in der Datenbank — die Oberfläche filtert nichts nach. */
async function benutzerListe() { return pruefe(client().rpc('benutzer_liste')); }

async function zugangGeben(userId, companyId, rolle) {
  return pruefe(client().from('memberships')
    .insert({ user_id: userId, company_id: companyId, role: rolle }));
}

async function rolleSetzen(userId, companyId, rolle) {
  const rows = await pruefe(client().from('memberships')
    .update({ role: rolle }).eq('user_id', userId).eq('company_id', companyId).select());
  if (!rows.length) throw new Error('Nichts geändert — fehlt dir das Recht dafür?');
  return rows[0];
}

async function zugangEntziehen(userId, companyId) {
  return pruefe(client().from('memberships')
    .delete().eq('user_id', userId).eq('company_id', companyId));
}

/* --- Konten: alles, was den service_role-Schlüssel braucht --------------------- */

/* Läuft nicht im Browser, sondern in der Edge-Function `benutzer`. Sie prüft
   die Rechte nicht selbst, sondern lässt Postgres prüfen — siehe den Kommentar
   im Kopf von supabase/functions/benutzer/index.ts. */
async function kontoRuf(aktion, daten) {
  const s = await sitzung();
  if (!s) throw new Error('Die Sitzung ist abgelaufen. Bitte neu anmelden.');

  let antwort;
  try {
    antwort = await fetch(CFG.SUPABASE_URL.replace(/\/+$/, '') + '/functions/v1/benutzer', {
      method: 'POST',
      headers: {
        apikey: CFG.SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + s.access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(Object.assign({ aktion }, daten))
    });
  } catch (_) {
    throw new Error('Die Benutzerverwaltung ist nicht erreichbar.');
  }

  let d = {};
  try { d = await antwort.json(); } catch (_) {}
  if (!antwort.ok) {
    if (antwort.status === 404) {
      throw new Error('Die Edge-Function „benutzer" ist im Projekt nicht eingespielt.');
    }
    throw new Error(d.fehler || ('Die Benutzerverwaltung hat abgelehnt (' + antwort.status + ').'));
  }
  return d;
}

const kontoAnlegen    = w  => kontoRuf('anlegen', w);
const kontoPasswort   = (u, p) => kontoRuf('passwort', { user_id: u, passwort: p });
const kontoSperren    = u  => kontoRuf('sperren', { user_id: u });
const kontoEntsperren = u  => kontoRuf('entsperren', { user_id: u });
const kontoLoeschen   = u  => kontoRuf('loeschen', { user_id: u });

window.DB = {
  client, konfiguriert, fehlerText,
  anmelden, abmelden, sitzung, beiAnmeldewechsel, passwortSetzen,
  sichtbareGesellschaften, schreibbareGesellschaften, verwaltbareGesellschaften,
  gesellschaften, meineMitgliedschaften,
  assets, asset, assetPerCode, assetAnlegen, assetAendern, assetLoeschen,
  standorte, personen, standortAnlegen, personAnlegen,
  gesellschaftAnlegen, gesellschaftAendern,
  faelligkeiten, wartungenZuAsset, wartungAnlegen, wartungErledigen,
  zuweisungen, ausgeben, zuruecknehmen,
  historie, anhaenge, anhangHochladen, anhangAdresse, anhangLoeschen,
  mitgliedschaften, benutzerListe, zugangGeben, rolleSetzen, zugangEntziehen,
  kontoAnlegen, kontoPasswort, kontoSperren, kontoEntsperren, kontoLoeschen
};
