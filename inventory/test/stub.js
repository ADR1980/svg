/* Minimaler Supabase-Nachbau vor PostgREST: /rest/v1 -> PostgREST,
   /auth/v1 -> selbst signierte JWTs, /storage/v1 -> Dateien im Arbeitsspeicher.
   Nur zum lokalen Testen.

   Der Speicher hier prüft bewusst KEINE Rechte. Die Storage-Policies aus
   02_rls.sql hängen an storage.objects und lassen sich ohne den echten Dienst
   nicht nachstellen; geprüft wird an dieser Stelle nur, dass die Anwendung
   hochlädt, anzeigt und löscht. Die Trennung der Gesellschaften weist
   sql/99_rls_test.sql nach, nicht dieser Stub. */
const http = require('http');
const token = require('./jwt.js');

const DATEIEN = new Map();   /* "bucket/pfad" -> { typ, daten } */

/* supabase-js schickt Dateien nicht roh, sondern als multipart/form-data mit
   den Feldern cacheControl und "" (die Datei). Der echte Storage-Dienst packt
   das aus; hier muss es genauso passieren, sonst landet der Umschlag in der
   Ablage und der Browser bekommt später kein gültiges Bild zurück. */
function auspacken(roh, typkopf) {
  const treffer = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(typkopf || '');
  if (!treffer) return { typ: typkopf, daten: roh };

  const grenze = Buffer.from('--' + (treffer[1] || treffer[2]).trim());
  let pos = 0;
  while (pos < roh.length) {
    const start = roh.indexOf(grenze, pos);
    if (start === -1) break;
    const kopfEnde = roh.indexOf('\r\n\r\n', start);
    if (kopfEnde === -1) break;
    const naechste = roh.indexOf(grenze, kopfEnde);
    const kopf = roh.slice(start, kopfEnde).toString('utf8');
    /* Die Datei ist der Teil mit einem Dateinamen; cacheControl hat keinen. */
    if (/filename=/i.test(kopf)) {
      const ende = naechste === -1 ? roh.length : naechste - 2;   /* \r\n vor der Grenze */
      const t = /content-type:\s*([^\r\n]+)/i.exec(kopf);
      return { typ: t ? t[1].trim() : 'application/octet-stream',
               daten: roh.slice(kopfEnde + 4, ende) };
    }
    if (naechste === -1) break;
    pos = naechste;
  }
  return { typ: typkopf, daten: roh };
}

const NUTZER = {
  'holding@test.invalid':    { id: 'aaaaaaaa-0000-4000-8000-000000000001', name: 'A. Holding' },
  'digital@test.invalid':    { id: 'aaaaaaaa-0000-4000-8000-000000000002', name: 'B. Digital' },
  'industrie@test.invalid':  { id: 'aaaaaaaa-0000-4000-8000-000000000003', name: 'C. Industrie' }
};
const PW = 'test1234';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'content-range, content-location');
}
function sitzung(u) {
  const t = token(u.id);
  return {
    access_token: t, token_type: 'bearer', expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: 'refresh-' + u.id,
    user: { id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email,
            app_metadata: { provider: 'email' }, user_metadata: { full_name: u.name },
            created_at: new Date().toISOString() }
  };
}

http.createServer((req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const u = new URL(req.url, 'http://x');

  /* Hochgeladene Dateien sind binär — deshalb Puffer sammeln, nicht Text. */
  const teile = [];
  req.on('data', c => teile.push(c));
  req.on('end', () => {
    const roh = Buffer.concat(teile);
    const koerper = roh.toString('utf8');

    if (u.pathname.startsWith('/storage/v1')) {
      const pfad = u.pathname.replace('/storage/v1', '');
      res.setHeader('Content-Type', 'application/json');

      /* Abruf einer signierten Adresse: liefert die Bytes. */
      if (req.method === 'GET' && pfad.startsWith('/object/sign/')) {
        const eintrag = DATEIEN.get(pfad.replace('/object/sign/', ''));
        if (!eintrag) { res.writeHead(404); return res.end('{}'); }
        res.writeHead(200, { 'Content-Type': eintrag.typ || 'application/octet-stream' });
        return res.end(eintrag.daten);
      }
      /* Signierte Adresse ausstellen. */
      if (req.method === 'POST' && pfad.startsWith('/object/sign/')) {
        const schluessel = pfad.replace('/object/sign/', '');
        if (!DATEIEN.has(schluessel)) { res.writeHead(404); return res.end(JSON.stringify({ message: 'not found' })); }
        res.writeHead(200);
        return res.end(JSON.stringify({ signedURL: `/object/sign/${schluessel}?token=lokal` }));
      }
      /* Löschen: der Client schickt die Pfade im Rumpf. */
      if (req.method === 'DELETE' && pfad.startsWith('/object/')) {
        const bucket = pfad.replace('/object/', '');
        let weg = [];
        try { weg = (JSON.parse(koerper || '{}').prefixes) || []; } catch (_) {}
        weg.forEach(p => DATEIEN.delete(bucket + '/' + p));
        res.writeHead(200);
        return res.end(JSON.stringify(weg.map(p => ({ name: p }))));
      }
      /* Hochladen. */
      if ((req.method === 'POST' || req.method === 'PUT') && pfad.startsWith('/object/')) {
        const schluessel = pfad.replace('/object/', '');
        DATEIEN.set(schluessel, auspacken(roh, req.headers['content-type']));
        res.writeHead(200);
        return res.end(JSON.stringify({ Id: schluessel, Key: schluessel }));
      }
      res.writeHead(404); return res.end('{}');
    }

    if (u.pathname.startsWith('/auth/v1')) {
      res.setHeader('Content-Type', 'application/json');
      if (u.pathname === '/auth/v1/token') {
        const b = JSON.parse(koerper || '{}');
        const n = NUTZER[(b.email || '').toLowerCase()];
        if (!n || b.password !== PW) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials', message: 'Invalid login credentials' }));
        }
        res.writeHead(200);
        return res.end(JSON.stringify(sitzung(Object.assign({ email: b.email }, n))));
      }
      if (u.pathname === '/auth/v1/user') {
        const auth = req.headers.authorization || '';
        const sub = (() => { try { return JSON.parse(Buffer.from(auth.split('.')[1], 'base64url')).sub; } catch (_) { return null; } })();
        const eintrag = Object.entries(NUTZER).find(([, v]) => v.id === sub);
        if (!eintrag) { res.writeHead(401); return res.end(JSON.stringify({ message: 'unauthorized' })); }
        res.writeHead(200);
        return res.end(JSON.stringify(sitzung({ id: eintrag[1].id, email: eintrag[0], name: eintrag[1].name }).user));
      }
      res.writeHead(204); return res.end();
    }

    if (u.pathname.startsWith('/rest/v1')) {
      const ziel = u.pathname.replace('/rest/v1', '') + (u.search || '');
      const p = http.request({ host: '127.0.0.1', port: 3001, path: ziel, method: req.method,
        headers: Object.assign({}, req.headers, { host: 'localhost:3001' }) }, r => {
          cors(res);
          res.writeHead(r.statusCode, Object.assign({}, r.headers, {
            'access-control-allow-origin': '*',
            'access-control-expose-headers': 'content-range, content-location'
          }));
          r.pipe(res);
        });
      p.on('error', e => { res.writeHead(502); res.end(JSON.stringify({ message: e.message })); });
      if (roh.length) p.write(roh);
      return p.end();
    }

    res.writeHead(404); res.end('{}');
  });
}).listen(3002, () => console.log('Supabase-Stub auf 3002'));
