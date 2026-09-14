const { chromium } = require('playwright');
const BASIS = 'http://localhost:8099/inventory';

const CONFIG = `window.INVENTAR_CONFIG = {
  SUPABASE_URL: 'http://localhost:3002',
  SUPABASE_ANON_KEY: 'lokaler-test-key',
  APP_URL: 'http://localhost:8099/inventory',
  BUCKET: 'asset-photos'
};`;

/* CDN-Bibliotheken aus dem lokalen Vorrat bedienen und Google Fonts abklemmen,
   damit der Test nicht am Netz hängt. */
const fs = require('fs');
async function verdrahte(ctx) {
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (u.includes('supabase.min.js'))
      return route.fulfill({ contentType: 'application/javascript',
        body: fs.readFileSync('./vendor/supabase.min.js', 'utf8') });
    if (u.includes('/qrcode/1.5.1/'))
      return route.fulfill({ contentType: 'application/javascript',
        body: fs.readFileSync('./vendor/qrcode.min.js', 'utf8') });
    if (u.includes('html5-qrcode'))
      return route.fulfill({ contentType: 'application/javascript',
        body: fs.readFileSync('./vendor/html5-qrcode.min.js', 'utf8') });
    if (u.endsWith('/inventory/config.js'))
      return route.fulfill({ contentType: 'application/javascript', body: CONFIG });
    if (u.includes('fonts.googleapis.com'))
      return route.fulfill({ contentType: 'text/css', body: '' });
    if (u.includes('fonts.gstatic.com'))
      return route.fulfill({ status: 404, body: '' });
    return route.continue();
  });
}

let fehler = 0;
function pruefe(bedingung, text) {
  console.log((bedingung ? '  ok   ' : '  FEHL ') + text);
  if (!bedingung) fehler++;
}

async function anmelden(seite, mail) {
  await seite.goto(BASIS + '/index.html', { waitUntil: 'networkidle' });
  await seite.fill('#l-mail', mail);
  await seite.fill('#l-pw', 'test1234');
  await seite.click('#f-login button');
  await seite.waitForSelector('.stats', { timeout: 15000 });
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-DE' });
  await ctx.addInitScript(CONFIG);           /* config.js überschreiben */
  await verdrahte(ctx);

  const konsole = [];
  ctx.on('weberror', e => konsole.push('pageerror: ' + e.error().message));

  const s = await ctx.newPage();
  const erwartet = t => /status of 400/.test(t);   /* absichtlich falsches Passwort */
  s.on('console', m => { if (m.type() === 'error' && !erwartet(m.text())) konsole.push('console: ' + m.text()); });
  s.on('pageerror', e => konsole.push('pageerror: ' + e.message));

  /* --- 0. Anmeldebildschirm --------------------------------------------- */
  console.log('\nAnmeldung');
  await s.goto(BASIS + '/index.html', { waitUntil: 'networkidle' });
  await s.waitForSelector('#f-login');
  pruefe(!(await s.locator('#nav').isVisible()), 'ohne Anmeldung keine Navigation');
  await s.fill('#l-mail', 'digital@test.invalid');
  await s.fill('#l-pw', 'falsch');
  await s.click('#f-login button');
  await s.waitForTimeout(2000);
  pruefe(/stimmt nicht/.test(await s.textContent('#msg')), 'falsches Passwort wird abgewiesen');

  /* --- 1. Tochter Snowflake Digital ------------------------------------- */
  console.log('\nSnowflake Digital (admin, eine Gesellschaft)');
  await anmelden(s, 'digital@test.invalid');
  await s.screenshot({ path: './shots/01-uebersicht-tochter.png', fullPage: true });

  const bestand = await s.textContent('.stat .value');
  pruefe(bestand.trim() === '4', 'Übersicht zeigt 4 Objekte, gesehen: ' + bestand.trim());
  pruefe(await s.locator('#bereich').count() === 0, 'kein Gesellschaftsumschalter für eine Tochter');

  await s.click('a[href="#/inventar"]');
  await s.waitForSelector('#liste .rows a', { timeout: 10000 });
  const zeilen = await s.locator('#liste .rows a').count();
  pruefe(zeilen === 4, 'Liste zeigt 4 Zeilen, gesehen: ' + zeilen);
  await s.screenshot({ path: './shots/02-liste.png', fullPage: true });

  await s.fill('#f-suche', 'ThinkPad');
  await s.waitForTimeout(800);
  pruefe(await s.locator('#liste .rows a').count() === 1, 'Suche nach ThinkPad findet genau eins');

  await s.locator('#liste .rows a').first().click();
  await s.waitForSelector('#qr canvas, #qr', { timeout: 10000 });
  await s.waitForTimeout(1200);
  const nummer = (await s.textContent('.lead.mono')).trim();
  pruefe(/^SFD-IT-2026-\d{4}$/.test(nummer), 'Detail zeigt Inventarnummer ' + nummer);
  const qrGemalt = await s.evaluate(() => {
    const c = document.querySelector('#qr');
    if (!c || c.tagName !== 'CANVAS') return false;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let dunkel = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] < 100) dunkel++;
    return dunkel > 500;
  });
  pruefe(qrGemalt, 'QR-Code ist tatsächlich gezeichnet');
  await s.screenshot({ path: './shots/03-detail.png', fullPage: true });

  pruefe(!(await s.locator('#b-nfc').isVisible()),
    'NFC-Knopf bleibt weg, wo der Browser kein Web NFC kann');

  /* --- 2. Fremder Aufkleber --------------------------------------------- */
  console.log('\nFremder Aufkleber');
  const codeFremd = process.env.FREMD_CODE;
  await s.goto(BASIS + '/index.html#/a/' + codeFremd, { waitUntil: 'networkidle' });
  await s.waitForTimeout(1500);
  const txt = await s.textContent('#view');
  pruefe(/Dazu ist hier nichts hinterlegt/.test(txt), 'fremdes Objekt bleibt unsichtbar');
  pruefe(!/Säulenbohr|Industrieservice/i.test(txt), 'kein Name und keine Firma verraten');
  await s.screenshot({ path: './shots/04-fremder-code.png', fullPage: true });

  /* --- 3. Erfassen ------------------------------------------------------- */
  console.log('\nErfassen');
  await s.goto(BASIS + '/index.html#/neu', { waitUntil: 'networkidle' });
  await s.waitForSelector('#f-asset');
  await s.fill('#x-name', 'Testmonitor aus dem Browsertest');
  await s.fill('#x-hersteller', 'Eizo');
  await s.fill('#x-preis', '349,00'.replace(',', '.'));
  await s.click('#f-asset button[type=submit]');
  await s.waitForSelector('.lead.mono', { timeout: 15000 });
  const neueNr = (await s.textContent('.lead.mono')).trim();
  pruefe(/^SFD-IT-2026-\d{4}$/.test(neueNr), 'neu erfasst als ' + neueNr);
  const preisZeile = await s.textContent('dl.facts');
  pruefe(/349,00/.test(preisZeile), 'Anschaffungswert 349,00 € übernommen');
  await s.screenshot({ path: './shots/05-neu-erfasst.png', fullPage: true });

  /* --- 4. Holding -------------------------------------------------------- */
  console.log('\nSnowflake Ventures (Holding)');
  const h = await ctx.newPage();
  h.on('pageerror', e => konsole.push('pageerror: ' + e.message));
  await h.evaluate(() => {}).catch(() => {});
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'de-DE' });
  await ctx2.addInitScript(CONFIG);
  await verdrahte(ctx2);
  const gh = await ctx2.newPage();
  gh.on('pageerror', e => konsole.push('pageerror: ' + e.message));
  gh.on('console', m => { if (m.type() === 'error') konsole.push('console: ' + m.text()); });
  await anmelden(gh, 'holding@test.invalid');
  const gesamt = (await gh.textContent('.stat .value')).trim();
  pruefe(gesamt === '9', 'Holding sieht 9 Objekte (8 aus dem Seed + 1 neues), gesehen: ' + gesamt);
  pruefe(await gh.locator('#bereich').count() === 1, 'Holding bekommt den Gesellschaftsumschalter');
  const optionen = await gh.locator('#bereich option').count();
  pruefe(optionen === 4, 'Umschalter listet alle drei Gesellschaften plus „Alle", gesehen: ' + optionen);
  await gh.screenshot({ path: './shots/06-holding-desktop.png', fullPage: true });

  await gh.selectOption('#bereich', { label: 'Snowflake Industrieservice GmbH' });
  await gh.waitForTimeout(1500);
  const nurIndustrie = (await gh.textContent('.stat .value')).trim();
  pruefe(nurIndustrie === '3', 'auf Industrieservice umgeschaltet: 3 Objekte, gesehen: ' + nurIndustrie);

  await gh.goto(BASIS + '/index.html#/faellig', { waitUntil: 'networkidle' });
  await gh.waitForTimeout(1200);
  pruefe(/DGUV V3/.test(await gh.textContent('#view')), 'Fristenliste zeigt DGUV-V3-Termine');
  await gh.screenshot({ path: './shots/07-fristen.png', fullPage: true });

  /* --- 4b. Verwaltung ---------------------------------------------------- */
  console.log('\nVerwaltung');
  await gh.goto(BASIS + '/index.html#/verwaltung', { waitUntil: 'networkidle' });
  await gh.waitForTimeout(2000);
  const vw = await gh.textContent('#view');
  pruefe(!/ging schief|schema cache/i.test(vw), 'Verwaltung lädt ohne Fehler');
  pruefe(/holding@test.invalid|A\. Holding/.test(vw), 'Zugangsliste nennt die Person zur Mitgliedschaft');
  pruefe(await gh.locator('#f-firma').count() === 1, 'Formular für neue Tochtergesellschaft ist da');
  const rollenWahl = await gh.locator('[data-rolle]').count();
  pruefe(rollenWahl === 3, 'drei Zugänge mit änderbarer Rolle, gesehen: ' + rollenWahl);
  await gh.screenshot({ path: './shots/10-verwaltung.png', fullPage: true });

  console.log('\nNeue Tochtergesellschaft');
  await gh.fill('#n-name', 'Snowflake Labor GmbH');
  await gh.fill('#n-code', 'SFL');
  await gh.click('#f-firma button[type=submit]');
  await gh.waitForTimeout(2500);
  pruefe(/Snowflake Labor GmbH/.test(await gh.textContent('#view')), 'Tochtergesellschaft angelegt');

  /* --- 5. Etikettenbogen -------------------------------------------------- */
  console.log('\nEtikettenbogen');
  const et = await ctx2.newPage();
  et.on('pageerror', e => konsole.push('pageerror: ' + e.message));
  await et.goto(BASIS + '/labels.html', { waitUntil: 'networkidle' });
  await et.waitForSelector('#b-bauen:not([disabled])', { timeout: 10000 });
  await et.click('#b-bauen');
  await et.waitForSelector('.sheet .cell canvas', { timeout: 15000 });
  await et.waitForTimeout(1500);
  const etiketten = await et.locator('.sheet .cell:not(.blank)').count();
  pruefe(etiketten === 9, '9 Etiketten erzeugt, gesehen: ' + etiketten);
  const masse = await et.evaluate(() => {
    const c = document.querySelector('.sheet .cell');
    const r = c.getBoundingClientRect();
    const mm = px => Math.round(px / (96 / 25.4) * 10) / 10;
    return { b: mm(r.width), h: mm(r.height) };
  });
  pruefe(masse.b === 45.7 && masse.h === 21.2,
    'Etikett misst ' + masse.b + ' × ' + masse.h + ' mm (Soll 45,7 × 21,2)');
  await et.screenshot({ path: './shots/08-etiketten.png', fullPage: false });
  await et.pdf({ path: './shots/etiketten-L6009.pdf', format: 'A4', printBackground: true });

  await et.selectOption('#l-raster', 'L6011');
  await et.click('#b-bauen');
  await et.waitForTimeout(2000);
  const masse2 = await et.evaluate(() => {
    const c = document.querySelector('.sheet .cell');
    const r = c.getBoundingClientRect();
    const mm = px => Math.round(px / (96 / 25.4) * 10) / 10;
    return { b: mm(r.width), h: mm(r.height) };
  });
  pruefe(masse2.b === 63.5 && masse2.h === 29.6,
    'zweites Raster misst ' + masse2.b + ' × ' + masse2.h + ' mm (Soll 63,5 × 29,6)');

  /* --- 6. Abmelden -------------------------------------------------------- */
  console.log('\nAbmelden');
  await gh.goto(BASIS + '/index.html', { waitUntil: 'networkidle' });
  await gh.waitForSelector('.stats');
  await gh.click('#b-logout');
  await gh.waitForSelector('#f-login', { timeout: 10000 });
  pruefe(true, 'nach dem Abmelden erscheint wieder die Anmeldung');
  await gh.screenshot({ path: './shots/09-anmeldung.png', fullPage: true });

  await browser.close();

  console.log('\nJavaScript-Fehler: ' + (konsole.length ? '\n  ' + konsole.join('\n  ') : 'keine'));
  console.log(fehler === 0 ? '\nAlle Prüfungen bestanden.' : '\n' + fehler + ' Prüfung(en) fehlgeschlagen.');
  process.exit(fehler === 0 && konsole.length === 0 ? 0 : 1);
})().catch(e => { console.error('ABBRUCH:', e); process.exit(2); });
