/* ==========================================================================
   Konten anlegen, sperren, löschen.

   Warum es diese Funktion überhaupt gibt: Ein Konto entsteht in Supabase nur
   über die Admin-Schnittstelle, und die verlangt den service_role-Schlüssel.
   Der darf nicht in eine Datei, die jeder Browser herunterlädt. Also läuft
   der Schritt hier, auf dem Server, wo der Schlüssel als Umgebungsvariable
   bereitsteht und nie den Rechner verlässt.

   Die Berechtigungsprüfung steht bewusst NICHT in diesem Code. Sie steht in
   Postgres:

     - Wen darf ich anfassen?  darf_benutzer_verwalten() — aufgerufen mit dem
       Token des Aufrufers, also unter seinen eigenen Rechten.
     - Wo darf ich jemanden eintragen?  Die Mitgliedschaft wird ebenfalls mit
       dem Token des Aufrufers geschrieben; die RLS-Policy und der
       memberships_guard-Trigger entscheiden.

   Diese Funktion kann damit keine Rechte vergeben, die der Aufrufer nicht
   ohnehin hätte. Sie kann nur, was ein Browser technisch nicht kann.
   ========================================================================== */

const BASIS   = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON    = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const MIN_PASSWORT = 10;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function antwort(daten: unknown, status = 200): Response {
  return new Response(JSON.stringify(daten), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function fehler(text: string, status = 400): Response {
  return antwort({ fehler: text }, status);
}

/* --- Aufrufe mit dem Token des Aufrufers (seine Rechte gelten) ------------- */

async function alsAufrufer(token: string, pfad: string, init: RequestInit = {}) {
  return fetch(BASIS + pfad, {
    ...init,
    headers: {
      apikey: ANON,
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  });
}

/* --- Aufrufe mit dem service_role-Schlüssel (alles erlaubt) ---------------- */

async function alsDienst(pfad: string, init: RequestInit = {}) {
  return fetch(BASIS + pfad, {
    ...init,
    headers: {
      apikey: SERVICE,
      Authorization: 'Bearer ' + SERVICE,
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  });
}

async function textOderLeer(r: Response): Promise<string> {
  try { return (await r.text()).slice(0, 400); } catch { return ''; }
}

/* --- Prüfungen ------------------------------------------------------------ */

async function aufruferId(token: string): Promise<string | null> {
  const r = await alsAufrufer(token, '/auth/v1/user');
  if (!r.ok) return null;
  const u = await r.json();
  return u?.id ?? null;
}

async function darfVerwalten(token: string, userId: string): Promise<boolean> {
  const r = await alsAufrufer(token, '/rest/v1/rpc/darf_benutzer_verwalten', {
    method: 'POST',
    body: JSON.stringify({ p_user: userId })
  });
  if (!r.ok) return false;
  return (await r.json()) === true;
}

async function darfGesellschaftVerwalten(token: string, companyId: string): Promise<boolean> {
  const r = await alsAufrufer(token, '/rest/v1/rpc/admin_company_ids', { method: 'POST', body: '{}' });
  if (!r.ok) return false;
  const ids = await r.json();
  return Array.isArray(ids) && ids.indexOf(companyId) !== -1;
}

async function idZuEmail(email: string): Promise<string | null> {
  const r = await alsDienst('/rest/v1/rpc/benutzer_id_zu_email', {
    method: 'POST',
    body: JSON.stringify({ p_email: email })
  });
  if (!r.ok) return null;
  const id = await r.json();
  return typeof id === 'string' ? id : null;
}

/* --- Die einzelnen Vorgänge ------------------------------------------------ */

const ROLLEN = ['owner', 'admin', 'editor', 'viewer'];

async function anlegen(token: string, b: Record<string, unknown>) {
  const email = String(b.email ?? '').trim().toLowerCase();
  const name  = String(b.name ?? '').trim();
  const firma = String(b.company_id ?? '');
  const rolle = String(b.rolle ?? 'viewer');
  const modus = String(b.modus ?? 'passwort');
  const pass  = String(b.passwort ?? '');

  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) return fehler('Die E-Mail-Adresse sieht nicht aus wie eine.');
  if (!/^[0-9a-f-]{36}$/i.test(firma))             return fehler('Es fehlt die Gesellschaft.');
  if (ROLLEN.indexOf(rolle) === -1)                return fehler('Unbekannte Rolle.');
  if (modus === 'passwort' && pass.length < MIN_PASSWORT) {
    return fehler(`Das Passwort braucht mindestens ${MIN_PASSWORT} Zeichen.`);
  }

  if (!await darfGesellschaftVerwalten(token, firma)) {
    return fehler('Für diese Gesellschaft darfst du keine Zugänge vergeben.', 403);
  }

  // Gibt es das Konto schon, bekommt es nur die Mitgliedschaft dazu. Ein
  // zweites Konto zur selben Adresse kann Supabase ohnehin nicht anlegen.
  let userId = await idZuEmail(email);
  let neu = false;
  let hinweis = 'Das Konto gab es schon; es hat den Zugang dazubekommen.';

  if (!userId) {
    let r: Response;
    if (modus === 'einladung') {
      r = await alsDienst('/auth/v1/invite', {
        method: 'POST',
        body: JSON.stringify({ email, data: name ? { full_name: name } : {} })
      });
      hinweis = 'Einladung verschickt. Sichtbar wird der Zugang, sobald die Person ihr Passwort gesetzt hat.';
    } else {
      r = await alsDienst('/auth/v1/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email, password: pass, email_confirm: true,
          user_metadata: name ? { full_name: name } : {}
        })
      });
      hinweis = 'Konto angelegt. Die Person meldet sich mit Adresse und Passwort an.';
    }
    if (!r.ok) {
      const t = await textOderLeer(r);
      if (modus === 'einladung' && /rate|limit|smtp|email/i.test(t)) {
        return fehler('Die Einladung ging nicht raus — im Projekt ist kein eigener Mailversand hinterlegt, und der Supabase-Versand ist stark begrenzt. Vergib stattdessen ein Passwort.', 502);
      }
      return fehler('Supabase hat das Konto abgelehnt: ' + t, 502);
    }
    const u = await r.json();
    userId = u?.id ?? u?.user?.id ?? null;
    neu = true;
    if (!userId) return fehler('Supabase hat kein Konto zurückgegeben.', 502);
  }

  if (name) {
    await alsDienst(`/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH', body: JSON.stringify({ full_name: name })
    });
  }

  // Der entscheidende Schritt: mit dem Token des Aufrufers. Policy und Trigger
  // entscheiden, nicht dieser Code.
  const m = await alsAufrufer(token, '/rest/v1/memberships', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ user_id: userId, company_id: firma, role: rolle })
  });
  if (!m.ok) {
    const t = await textOderLeer(m);
    // Frisch angelegtes Konto ohne Zugang wäre Müll — wieder wegräumen.
    if (neu) await alsDienst(`/auth/v1/admin/users/${userId}`, { method: 'DELETE' });
    return fehler('Der Zugang ließ sich nicht eintragen: ' + t, 403);
  }

  return antwort({ ok: true, user_id: userId, neu, hinweis });
}

async function passwort(token: string, b: Record<string, unknown>) {
  const id   = String(b.user_id ?? '');
  const pass = String(b.passwort ?? '');
  if (pass.length < MIN_PASSWORT) return fehler(`Das Passwort braucht mindestens ${MIN_PASSWORT} Zeichen.`);
  if (!await darfVerwalten(token, id)) return fehler('Dieses Konto darfst du nicht ändern.', 403);

  const r = await alsDienst(`/auth/v1/admin/users/${id}`, {
    method: 'PUT', body: JSON.stringify({ password: pass })
  });
  if (!r.ok) return fehler('Supabase hat abgelehnt: ' + await textOderLeer(r), 502);
  return antwort({ ok: true, hinweis: 'Passwort gesetzt. Sag es der Person auf einem anderen Weg als per E-Mail.' });
}

async function sperre(token: string, b: Record<string, unknown>, sperren: boolean) {
  const id = String(b.user_id ?? '');
  if (!await darfVerwalten(token, id)) return fehler('Dieses Konto darfst du nicht ändern.', 403);

  const r = await alsDienst(`/auth/v1/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ban_duration: sperren ? '876000h' : 'none' })
  });
  if (!r.ok) return fehler('Supabase hat abgelehnt: ' + await textOderLeer(r), 502);
  return antwort({
    ok: true,
    hinweis: sperren
      ? 'Gesperrt. Die Zuordnung bleibt stehen, die Anmeldung schlägt fehl.'
      : 'Sperre aufgehoben.'
  });
}

async function loeschen(token: string, b: Record<string, unknown>) {
  const id = String(b.user_id ?? '');
  if (!await darfVerwalten(token, id)) return fehler('Dieses Konto darfst du nicht löschen.', 403);

  // Zugänge zuerst, damit der Trigger greift: Der letzte Inhaber einer
  // Gesellschaft lässt sich so auch über den Umweg Kontolöschung nicht
  // entfernen.
  const w = await alsAufrufer(token, `/rest/v1/memberships?user_id=eq.${id}`, { method: 'DELETE' });
  if (!w.ok) return fehler('Die Zugänge ließen sich nicht entfernen: ' + await textOderLeer(w), 403);

  const r = await alsDienst(`/auth/v1/admin/users/${id}`, { method: 'DELETE' });
  if (!r.ok) return fehler('Supabase hat abgelehnt: ' + await textOderLeer(r), 502);
  return antwort({ ok: true, hinweis: 'Konto gelöscht.' });
}

/* --- Eingang --------------------------------------------------------------- */

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST')    return fehler('Nur POST.', 405);
  if (!BASIS || !SERVICE)       return fehler('Die Funktion ist nicht vollständig eingerichtet.', 500);

  const kopf = req.headers.get('Authorization') ?? '';
  const token = kopf.startsWith('Bearer ') ? kopf.slice(7) : '';
  if (!token) return fehler('Nicht angemeldet.', 401);
  if (!await aufruferId(token)) return fehler('Die Sitzung gilt nicht mehr.', 401);

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return fehler('Kein lesbarer Rumpf.'); }

  switch (String(b.aktion ?? '')) {
    case 'anlegen':    return anlegen(token, b);
    case 'passwort':   return passwort(token, b);
    case 'sperren':    return sperre(token, b, true);
    case 'entsperren': return sperre(token, b, false);
    case 'loeschen':   return loeschen(token, b);
    default:           return fehler('Unbekannte Aktion.');
  }
});
