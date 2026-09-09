/* Minimaler Supabase-Nachbau vor PostgREST: /rest/v1 -> PostgREST,
   /auth/v1 -> selbst signierte JWTs. Nur zum lokalen Testen. */
const http = require('http');
const token = require('./jwt.js');

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
  let koerper = '';
  req.on('data', c => koerper += c);
  req.on('end', () => {
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
      if (koerper) p.write(koerper);
      return p.end();
    }

    res.writeHead(404); res.end('{}');
  });
}).listen(3002, () => console.log('Supabase-Stub auf 3002'));
