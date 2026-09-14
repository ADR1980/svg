const crypto = require('crypto');
const SECRET = 'test-nur-lokal-mindestens-32-zeichen-lang!!';
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
module.exports = function token(sub) {
  const head = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64({ sub, role: 'authenticated', aud: 'authenticated',
                     iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 86400 });
  const sig = crypto.createHmac('sha256', SECRET).update(head + '.' + body).digest('base64url');
  return head + '.' + body + '.' + sig;
};
if (require.main === module) console.log(module.exports(process.argv[2]));
