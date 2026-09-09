/* ==========================================================================
   Router, Zustand und Ansichten.

   Hash-Routen, damit die Anwendung auf jedem statischen Hoster ohne
   Rewrite-Regel läuft und ein gedruckter QR-Code einen Hosterwechsel
   übersteht.
   ========================================================================== */

const K = window.KATALOG;
const QR_URL = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.1/qrcode.min.js';

const S = {
  sitzung: null,
  gesellschaften: [],
  sichtbar: [],
  schreibbar: [],
  verwaltbar: [],
  bereich: null,          /* null = alle sichtbaren Gesellschaften */
  standorte: [],
  personen: []
};

/* --- Kleinkram -------------------------------------------------------------- */

const $ = s => document.querySelector(s);
const esc = v => String(v === null || v === undefined ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function setzeInhalt(html) { $('#view').innerHTML = html; }

function meldung(text, art) {
  const b = $('#msg');
  if (!text) { b.hidden = true; b.textContent = ''; return; }
  b.hidden = false;
  b.className = 'msg' + (art === 'err' ? ' err' : '');
  b.textContent = text;
  if (art !== 'err') setTimeout(() => { if (b.textContent === text) b.hidden = true; }, 4000);
}

function firma(id) { return S.gesellschaften.find(c => c.id === id) || null; }
function firmenName(id) { const c = firma(id); return c ? c.name : '—'; }
function darfSchreiben(companyId) { return S.schreibbar.indexOf(companyId) !== -1; }
function darfVerwalten(companyId) { return S.verwaltbar.indexOf(companyId) !== -1; }

function bereichsFilter() { return S.bereich ? { company: S.bereich } : {}; }

function ladeSkript(url, global) {
  if (window[global]) return Promise.resolve();
  return new Promise((ok, fehler) => {
    const s = document.createElement('script');
    s.src = url; s.onload = ok;
    s.onerror = () => fehler(new Error('Bibliothek nicht erreichbar: ' + url));
    document.head.appendChild(s);
  });
}

function assetUrl(code) {
  return window.INVENTAR_CONFIG.APP_URL.replace(/\/+$/, '') + '/#/a/' + code;
}

/* --- Anmeldung ---------------------------------------------------------------- */

function zeigeAnmeldung(hinweis) {
  document.body.classList.add('anonym');
  $('#nav').hidden = true;
  $('#who').textContent = '';
  setzeInhalt(`
    <div class="login">
      <p class="label">Snowflake Ventures</p>
      <h1>Inventarverwaltung</h1>
      <p class="muted">Anmeldung mit der Adresse, an die die Einladung ging.</p>
      ${hinweis ? `<div class="msg">${esc(hinweis)}</div>` : ''}
      <form id="f-login">
        <div class="field">
          <label for="l-mail">E-Mail</label>
          <input id="l-mail" type="email" autocomplete="username" required>
        </div>
        <div class="field">
          <label for="l-pw">Passwort</label>
          <input id="l-pw" type="password" autocomplete="current-password" required>
        </div>
        <div class="btn-row">
          <button class="btn primary" type="submit">Anmelden</button>
        </div>
      </form>
    </div>`);

  $('#f-login').addEventListener('submit', async ev => {
    ev.preventDefault();
    const btn = $('#f-login button');
    btn.disabled = true;
    try {
      await DB.anmelden($('#l-mail').value.trim(), $('#l-pw').value);
      meldung('');
      await start();
    } catch (e) {
      meldung(e.message, 'err');
      btn.disabled = false;
    }
  });
}

/* --- Kopfzeile und Bereichswahl ------------------------------------------------ */

function zeichneKopf() {
  const mail = S.sitzung && S.sitzung.user ? S.sitzung.user.email : '';
  const holding = S.sichtbar.length > 1;
  $('#who').innerHTML =
    `<span class="mail">${esc(mail)}</span>` +
    (holding
      ? `<select id="bereich" aria-label="Gesellschaft">
            <option value="">Alle Gesellschaften</option>
            ${S.gesellschaften.map(c =>
              `<option value="${esc(c.id)}"${S.bereich === c.id ? ' selected' : ''}>${esc(c.name)}</option>`
            ).join('')}
          </select>`
      : (S.gesellschaften[0] ? `<span class="tag">${esc(S.gesellschaften[0].short_code)}</span>` : ''));

  const w = $('#bereich');
  if (w) {
    w.addEventListener('change', () => {
      S.bereich = w.value || null;
      try { localStorage.setItem('inv.bereich', S.bereich || ''); } catch (_) {}
      route();
    });
  }
}

/* --- Übersicht ------------------------------------------------------------------ */

async function zeigeUebersicht() {
  setzeInhalt('<p class="muted">Wird geladen …</p>');
  const [liste, faellig] = await Promise.all([
    DB.assets(bereichsFilter()),
    DB.faelligkeiten(S.bereich)
  ]);

  const aktiv = liste.filter(a => a.status !== 'retired');
  const wert = aktiv.reduce((s, a) => s + (a.purchase_price_cents || 0), 0);
  const ueberfaellig = faellig.filter(m => K.tageBis(m.due_date) < 0);
  const bald = faellig.filter(m => { const t = K.tageBis(m.due_date); return t >= 0 && t <= 60; });
  const garantie = aktiv.filter(a => {
    const t = K.tageBis(a.warranty_until); return t !== null && t >= 0 && t <= 90;
  });

  const jeFirma = {};
  aktiv.forEach(a => { jeFirma[a.company_id] = (jeFirma[a.company_id] || 0) + 1; });

  setzeInhalt(`
    <div class="busy">
      <p class="label">${esc(S.bereich ? firmenName(S.bereich) : 'Alle Gesellschaften')}</p>
      <h1>${aktiv.length === 0 ? 'Noch nichts erfasst'
            : ueberfaellig.length ? `${ueberfaellig.length} Prüfung${ueberfaellig.length === 1 ? '' : 'en'} ${ueberfaellig.length === 1 ? 'ist' : 'sind'} überfällig`
            : 'Alle Fristen sind eingehalten'}</h1>

      <div class="stats">
        <div class="stat">
          <p class="label">Im Bestand</p>
          <div class="value">${K.fmtZahl(aktiv.length)}</div>
          <p class="note">${liste.length - aktiv.length > 0
            ? K.fmtZahl(liste.length - aktiv.length) + ' ausgemustert' : 'ohne ausgemusterte'}</p>
        </div>
        <div class="stat">
          <p class="label">Anschaffungswert</p>
          <div class="value">${K.fmtGeld(wert, 'EUR')}</div>
          <p class="note">Summe der erfassten Kaufpreise</p>
        </div>
        <div class="stat">
          <p class="label">Fällig</p>
          <div class="value${ueberfaellig.length ? ' neg' : ''}">${K.fmtZahl(ueberfaellig.length + bald.length)}</div>
          <p class="note">${ueberfaellig.length} überfällig, ${bald.length} in den nächsten 60${K.NBSP}Tagen</p>
        </div>
      </div>

      ${S.sichtbar.length > 1 && !S.bereich ? `
        <h2>Verteilung</h2>
        <div class="rows">
          ${S.gesellschaften.map(c => `
            <a class="row plain" href="#/inventar?firma=${esc(c.id)}">
              <span class="t">${esc(c.name)}</span>
              <span class="m">${esc(c.short_code)}${c.parent_id ? '' : ' · Holding'}</span>
              <span class="r">${K.fmtZahl(jeFirma[c.id] || 0)}</span>
            </a>`).join('')}
        </div>` : ''}

      <h2>Als Nächstes fällig</h2>
      ${faellig.length === 0
        ? '<p class="empty">Keine offenen Termine.</p>'
        : `<div class="rows">${faellig.slice(0, 8).map(zeileFaellig).join('')}</div>
           ${faellig.length > 8 ? `<p><a href="#/faellig">Alle ${faellig.length} Termine</a></p>` : ''}`}

      ${garantie.length ? `
        <h2>Garantie läuft aus</h2>
        <div class="rows">${garantie.slice(0, 6).map(a => `
          <a class="row plain" href="#/objekt/${esc(a.id)}">
            <span class="t">${esc(a.name)}</span>
            <span class="m">${esc(a.asset_no)}</span>
            <span class="r">${esc(K.fmtDatum(a.warranty_until))}</span>
          </a>`).join('')}</div>` : ''}
    </div>`);
}

function zeileFaellig(m) {
  const tage = K.tageBis(m.due_date);
  const warn = tage < 0;
  return `<a class="row plain" href="#/objekt/${esc(m.asset_id)}">
    <span class="t">${esc(K.WARTUNGSART[m.kind] || m.kind)}${m.title ? ' · ' + esc(m.title) : ''}</span>
    <span class="m">${esc(m.assets ? m.assets.asset_no + ' · ' + m.assets.name : '')}</span>
    <span class="r${warn ? ' warn' : ''}">${esc(K.fmtDatum(m.due_date))}</span>
  </a>`;
}

/* --- Inventarliste --------------------------------------------------------------- */

const listenFilter = { suche: '', category: '', status: '', location: '' };

async function zeigeInventar(params) {
  if (params && params.get('firma')) {
    S.bereich = params.get('firma');
    zeichneKopf();
  }
  setzeInhalt(`
    <p class="label">${esc(S.bereich ? firmenName(S.bereich) : 'Alle Gesellschaften')}</p>
    <h1>Inventar</h1>
    <div class="filters">
      <div class="field search">
        <label for="f-suche">Suche</label>
        <input id="f-suche" type="search" placeholder="Name, Hersteller, Seriennummer, Nummer"
               value="${esc(listenFilter.suche)}">
      </div>
      <div class="field">
        <label for="f-kat">Kategorie</label>
        <select id="f-kat">${optionen(K.KATEGORIEN, listenFilter.category, 'Alle')}</select>
      </div>
      <div class="field">
        <label for="f-status">Status</label>
        <select id="f-status">${optionen(K.STATUS, listenFilter.status, 'Alle')}</select>
      </div>
    </div>
    <div id="liste"><p class="muted">Wird geladen …</p></div>`);

  const neu = () => {
    listenFilter.suche = $('#f-suche').value;
    listenFilter.category = $('#f-kat').value;
    listenFilter.status = $('#f-status').value;
    ladeListe();
  };
  let t = null;
  $('#f-suche').addEventListener('input', () => { clearTimeout(t); t = setTimeout(neu, 250); });
  $('#f-kat').addEventListener('change', neu);
  $('#f-status').addEventListener('change', neu);
  ladeListe();
}

async function ladeListe() {
  const ziel = $('#liste');
  if (!ziel) return;
  const liste = await DB.assets(Object.assign({}, bereichsFilter(), listenFilter));
  if (!liste.length) {
    ziel.innerHTML = '<p class="empty">Kein Treffer. Andere Filter probieren — oder das Objekt ist noch nicht erfasst.</p>';
    return;
  }
  ziel.innerHTML = `
    <p class="label" style="margin-top:16px">${K.fmtZahl(liste.length)} Objekte</p>
    <div class="rows">${liste.map(a => `
      <a class="row plain" href="#/objekt/${esc(a.id)}">
        <span class="t">${esc(a.name)}</span>
        <span class="m">${esc(a.asset_no)}${a.manufacturer ? ' · ' + esc(a.manufacturer) : ''}${
          !S.bereich && S.sichtbar.length > 1 ? ' · ' + esc(firmenName(a.company_id)) : ''}</span>
        <span class="r">${esc(K.STATUS[a.status] || a.status)}</span>
      </a>`).join('')}</div>`;
}

function optionen(map, gewaehlt, leerText) {
  return `<option value="">${esc(leerText || '—')}</option>` +
    Object.keys(map).map(k => {
      const v = typeof map[k] === 'string' ? map[k] : map[k].label;
      return `<option value="${esc(k)}"${gewaehlt === k ? ' selected' : ''}>${esc(v)}</option>`;
    }).join('');
}

/* --- Objektdetail ----------------------------------------------------------------- */

async function zeigeObjekt(id) {
  setzeInhalt('<p class="muted">Wird geladen …</p>');
  const a = await DB.asset(id);
  if (!a) return zeigeUnbekannt();
  await zeichneObjekt(a);
}

async function zeigeObjektPerCode(code) {
  setzeInhalt('<p class="muted">Wird gesucht …</p>');
  const a = await DB.assetPerCode(code);
  if (!a) return zeigeUnbekannt();
  await zeichneObjekt(a);
}

/* Ein Objekt, das der Nutzer nicht sehen darf, ist von einem nicht
   existierenden nicht zu unterscheiden. Genau so soll es sein: Der Aufkleber
   auf einem fremden Gerät verrät weder Firma noch Standort. */
function zeigeUnbekannt() {
  setzeInhalt(`
    <p class="label">Scan</p>
    <h1>Dazu ist hier nichts hinterlegt</h1>
    <p>Entweder gehört das Objekt zu einer Gesellschaft, für die du nicht
       freigeschaltet bist, oder der Aufkleber ist nicht vergeben.</p>
    <div class="btn-row">
      <a class="btn plain" href="#/scan">Nochmal scannen</a>
      <a class="btn quiet plain" href="#/inventar">Zur Liste</a>
    </div>`);
}

async function zeichneObjekt(a) {
  const kat = K.KATEGORIEN[a.category] || { label: a.category };
  const felder = K.FELDER[a.category] || [];
  const schreiben = darfSchreiben(a.company_id);
  const attr = a.attributes || {};

  setzeInhalt(`
    <div class="busy">
      <p class="label">${esc(kat.label)} · ${esc(firmenName(a.company_id))}</p>
      <h1>${esc(a.name)}</h1>
      <p class="lead mono">${esc(a.asset_no)}</p>

      <dl class="facts">
        ${zeile('Status', K.STATUS[a.status] || a.status)}
        ${a.condition ? zeile('Zustand', K.ZUSTAND[a.condition]) : ''}
        ${zeile('Hersteller', [a.manufacturer, a.model].filter(Boolean).join(' ') || '—')}
        ${zeile('Seriennummer', a.serial_number || '—', true)}
        ${zeile('Standort', a.locations ? a.locations.name : '—')}
        ${zeile('Zugewiesen an', a.people ? a.people.full_name : '—')}
        ${zeile('Angeschafft', K.fmtDatum(a.purchase_date))}
        ${zeile('Anschaffungswert', K.fmtGeld(a.purchase_price_cents, a.currency))}
        ${zeile('Garantie bis', K.fmtDatum(a.warranty_until))}
        ${a.depreciation_years ? zeile('Nutzungsdauer', a.depreciation_years + K.NBSP + 'Jahre') : ''}
        ${felder.map(f => attr[f.key] === undefined || attr[f.key] === null || attr[f.key] === ''
            ? '' : zeile(f.label, attrText(f, attr[f.key]), f.typ === 'text')).join('')}
      </dl>

      ${a.notes ? `<div class="sunk"><p>${esc(a.notes)}</p></div>` : ''}

      <div class="codeblock">
        <canvas id="qr" width="104" height="104"></canvas>
        <div>
          <p class="label">Aufkleber-Code</p>
          <p class="mono" style="margin:0">${esc(a.public_code)}</p>
          <p class="muted" style="font-size:14px;margin:6px 0 0">${esc(assetUrl(a.public_code))}</p>
        </div>
      </div>

      <div class="btn-row">
        ${schreiben ? `<a class="btn primary plain" href="#/bearbeiten/${esc(a.id)}">Bearbeiten</a>` : ''}
        <a class="btn plain" href="labels.html?code=${esc(a.public_code)}" target="_blank" rel="noopener">Etikett drucken</a>
        <button class="btn" id="b-nfc" hidden>Auf NFC-Tag schreiben</button>
        ${schreiben ? '<button class="btn quiet" id="b-ausgabe">Ausgabe / Rücknahme</button>' : ''}
      </div>

      <h2>Prüfung und Wartung</h2>
      <div id="wartung"><p class="muted">Wird geladen …</p></div>

      <h2>Fotos und Belege</h2>
      <div id="anhaenge"><p class="muted">Wird geladen …</p></div>
      ${schreiben ? `
        <div class="btn-row">
          <label class="filebtn" for="a-datei">Foto oder Beleg hinzufügen</label>
          <input id="a-datei" type="file" accept="image/*,application/pdf" capture="environment">
        </div>` : ''}

      <h2>Historie</h2>
      <div id="historie"><p class="muted">Wird geladen …</p></div>
    </div>`);

  zeichneQr('qr', assetUrl(a.public_code));

  if (SCAN.nfcVerfuegbar() && schreiben) {
    const b = $('#b-nfc');
    b.hidden = false;
    b.addEventListener('click', async () => {
      meldung('Tag an die Rückseite des Telefons halten …');
      try {
        await SCAN.nfcSchreiben(assetUrl(a.public_code));
        meldung('Tag beschrieben.');
      } catch (e) { meldung('NFC: ' + e.message, 'err'); }
    });
  }

  if ($('#b-ausgabe')) $('#b-ausgabe').addEventListener('click', () => zeigeAusgabe(a));
  if ($('#a-datei')) {
    $('#a-datei').addEventListener('change', async ev => {
      const d = ev.target.files[0];
      if (!d) return;
      meldung('Wird hochgeladen …');
      try {
        await DB.anhangHochladen(a, d, d.type === 'application/pdf' ? 'invoice' : 'photo');
        meldung('Hinzugefügt.');
        ladeAnhaenge(a);
      } catch (e) { meldung(e.message, 'err'); }
      ev.target.value = '';
    });
  }

  ladeWartung(a, schreiben);
  ladeAnhaenge(a);
  ladeHistorie(a);
}

function zeile(dt, dd, mono) {
  return `<div><dt>${esc(dt)}</dt><dd${mono ? ' class="mono"' : ''}>${esc(dd)}</dd></div>`;
}

function attrText(f, wert) {
  if (f.typ === 'bool') return wert ? 'Ja' : 'Nein';
  if (f.typ === 'date') return K.fmtDatum(wert);
  if (f.typ === 'number') return K.fmtZahl(wert) + (f.einheit ? K.NBSP + f.einheit : '');
  return String(wert);
}

async function zeichneQr(id, text) {
  try {
    await ladeSkript(QR_URL, 'QRCode');
    await window.QRCode.toCanvas(document.getElementById(id), text, {
      width: 104, margin: 1, errorCorrectionLevel: 'M',
      color: { dark: '#14161A', light: '#FBFAF8' }
    });
  } catch (_) {
    const c = document.getElementById(id);
    if (c) c.replaceWith(Object.assign(document.createElement('p'),
      { className: 'muted', textContent: 'QR-Code nicht darstellbar (offline).' }));
  }
}

async function ladeWartung(a, schreiben) {
  const ziel = $('#wartung');
  const liste = await DB.wartungenZuAsset(a.id);
  const offen = liste.filter(m => !m.is_done);
  ziel.innerHTML = (offen.length
    ? `<div class="rows">${offen.map(m => {
        const t = K.tageBis(m.due_date);
        return `<div class="row">
          <span class="t">${esc(K.WARTUNGSART[m.kind] || m.kind)}${m.title ? ' · ' + esc(m.title) : ''}</span>
          <span class="m">${esc(K.fristText(t))}${m.responsible ? ' · ' + esc(m.responsible) : ''}</span>
          <span class="r${t < 0 ? ' warn' : ''}">${esc(K.fmtDatum(m.due_date))}</span>
          ${schreiben ? `<span class="x"><button class="btn quiet" data-erledigt="${esc(m.id)}"
            style="min-height:0;padding:5px 12px">Erledigt</button></span>` : ''}
        </div>`;
      }).join('')}</div>`
    : '<p class="empty">Kein offener Termin.</p>')
    + (schreiben ? `<div class="btn-row"><button class="btn quiet" id="b-wartung">Termin anlegen</button></div>` : '');

  ziel.querySelectorAll('[data-erledigt]').forEach(b => {
    b.addEventListener('click', async () => {
      const m = offen.find(x => x.id === b.dataset.erledigt);
      b.disabled = true;
      try {
        await DB.wartungErledigen(Object.assign({ company_id: a.company_id, asset_id: a.id }, m));
        meldung(m.interval_months ? 'Erledigt, Folgetermin angelegt.' : 'Erledigt.');
        ladeWartung(a, schreiben);
      } catch (e) { meldung(e.message, 'err'); b.disabled = false; }
    });
  });
  if ($('#b-wartung')) $('#b-wartung').addEventListener('click', () => zeigeWartungsFormular(a, schreiben));
}

function zeigeWartungsFormular(a, schreiben) {
  const ziel = $('#wartung');
  const heute = new Date(); heute.setFullYear(heute.getFullYear() + 1);
  ziel.insertAdjacentHTML('beforeend', `
    <form id="f-wartung" class="sunk">
      <div class="grid2">
        <div class="field">
          <label for="w-art">Art</label>
          <select id="w-art">${optionen(K.WARTUNGSART, 'service', null).replace('<option value="">—</option>', '')}</select>
        </div>
        <div class="field">
          <label for="w-faellig">Fällig am</label>
          <input id="w-faellig" type="date" value="${heute.toISOString().slice(0, 10)}" required>
        </div>
        <div class="field">
          <label for="w-titel">Bezeichnung</label>
          <input id="w-titel" type="text" placeholder="z. B. Wiederholungsprüfung">
        </div>
        <div class="field">
          <label for="w-intervall">Intervall in Monaten</label>
          <input id="w-intervall" type="number" min="1" max="120" placeholder="leer = einmalig">
        </div>
        <div class="field">
          <label for="w-wer">Zuständig</label>
          <input id="w-wer" type="text">
        </div>
      </div>
      <div class="btn-row"><button class="btn primary" type="submit">Anlegen</button></div>
    </form>`);

  $('#f-wartung').addEventListener('submit', async ev => {
    ev.preventDefault();
    try {
      await DB.wartungAnlegen({
        company_id: a.company_id, asset_id: a.id,
        kind: $('#w-art').value, title: $('#w-titel').value.trim() || null,
        due_date: $('#w-faellig').value,
        interval_months: $('#w-intervall').value ? Number($('#w-intervall').value) : null,
        responsible: $('#w-wer').value.trim() || null
      });
      meldung('Termin angelegt.');
      ladeWartung(a, schreiben);
    } catch (e) { meldung(e.message, 'err'); }
  });
}

async function ladeAnhaenge(a) {
  const ziel = $('#anhaenge');
  const liste = await DB.anhaenge(a.id);
  if (!liste.length) { ziel.innerHTML = '<p class="empty">Nichts hinterlegt.</p>'; return; }
  const fotos = liste.filter(x => (x.content_type || '').startsWith('image/'));
  const rest = liste.filter(x => !(x.content_type || '').startsWith('image/'));
  ziel.innerHTML =
    (fotos.length ? '<div class="photos" id="fotos"></div>' : '') +
    (rest.length ? `<div class="rows">${rest.map(x => `
      <div class="row"><span class="t">${esc(x.filename)}</span>
        <span class="m">${esc(K.fmtZeit(x.created_at))}</span>
        <span class="r"><a href="#" data-datei="${esc(x.storage_path)}">Öffnen</a></span></div>`).join('')}</div>` : '');

  for (const f of fotos) {
    const url = await DB.anhangAdresse(f.storage_path);
    if (url && $('#fotos')) {
      $('#fotos').insertAdjacentHTML('beforeend',
        `<a href="${esc(url)}" target="_blank" rel="noopener" class="plain"><img src="${esc(url)}" alt="${esc(f.filename)}"></a>`);
    }
  }
  ziel.querySelectorAll('[data-datei]').forEach(el => {
    el.addEventListener('click', async ev => {
      ev.preventDefault();
      const url = await DB.anhangAdresse(el.dataset.datei);
      if (url) window.open(url, '_blank', 'noopener');
    });
  });
}

async function ladeHistorie(a) {
  const liste = await DB.historie(a.id);
  const txt = e => {
    if (e.type === 'created') return 'Angelegt';
    const p = e.payload || {};
    const teile = [];
    if (p.status) teile.push('Status: ' + (K.STATUS[p.status.von] || '—') + ' → ' + (K.STATUS[p.status.nach] || '—'));
    if (p.location_id) teile.push('Standort gewechselt');
    if (p.assigned_person_id) teile.push('Zuweisung geändert');
    return teile.join(' · ') || 'Geändert';
  };
  $('#historie').innerHTML = liste.length
    ? `<div class="timeline">${liste.map(e =>
        `<div><time>${esc(K.fmtZeit(e.at))}</time>${esc(txt(e))}</div>`).join('')}</div>`
    : '<p class="empty">Noch keine Einträge.</p>';
}

async function zeigeAusgabe(a) {
  if (!S.personen.length) S.personen = await DB.personen();
  const eigene = S.personen.filter(p => p.company_id === a.company_id && p.is_active);
  const box = document.createElement('div');
  box.className = 'sunk';
  box.innerHTML = `
    <p class="label">Ausgabe und Rücknahme</p>
    <div class="field">
      <label for="z-person">An wen</label>
      <select id="z-person">
        <option value="">— zurück ins Lager —</option>
        ${eigene.map(p => `<option value="${esc(p.id)}"${a.assigned_person_id === p.id ? ' selected' : ''}>${esc(p.full_name)}${p.department ? ' · ' + esc(p.department) : ''}</option>`).join('')}
      </select>
    </div>
    <div class="field"><label for="z-notiz">Notiz</label><input id="z-notiz" type="text"></div>
    <div class="btn-row"><button class="btn primary" id="z-ok">Übernehmen</button></div>`;
  $('#b-ausgabe').closest('.btn-row').insertAdjacentElement('afterend', box);
  $('#b-ausgabe').disabled = true;

  $('#z-ok').addEventListener('click', async () => {
    const p = $('#z-person').value;
    try {
      if (p) await DB.ausgeben(a, p, $('#z-notiz').value.trim());
      else await DB.zuruecknehmen(a, $('#z-notiz').value.trim());
      meldung('Übernommen.');
      location.hash = '#/objekt/' + a.id;
      zeigeObjekt(a.id);
    } catch (e) { meldung(e.message, 'err'); }
  });
}

/* --- Anlegen und Bearbeiten -------------------------------------------------------- */

async function zeigeFormular(id) {
  const bearbeiten = !!id;
  let a = null;
  if (bearbeiten) {
    a = await DB.asset(id);
    if (!a) return zeigeUnbekannt();
    if (!darfSchreiben(a.company_id)) {
      meldung('Für diese Gesellschaft hast du kein Schreibrecht.', 'err');
      return zeigeObjekt(id);
    }
  }

  const moeglich = S.gesellschaften.filter(c => darfSchreiben(c.id) && c.is_active);
  if (!moeglich.length) {
    setzeInhalt('<h1>Nur Lesezugriff</h1><p>Dein Zugang erlaubt kein Erfassen. Die Verwaltung deiner Gesellschaft kann das ändern.</p>');
    return;
  }
  const firmaId = a ? a.company_id : (S.bereich && darfSchreiben(S.bereich) ? S.bereich : moeglich[0].id);
  if (!S.standorte.length) S.standorte = await DB.standorte();
  if (!S.personen.length) S.personen = await DB.personen();

  setzeInhalt(`
    <p class="label">${bearbeiten ? esc(a.asset_no) : 'Neuerfassung'}</p>
    <h1>${bearbeiten ? 'Objekt bearbeiten' : 'Objekt anlegen'}</h1>
    <form id="f-asset">
      <div class="grid2">
        <div class="field">
          <label for="x-firma">Gesellschaft</label>
          <select id="x-firma"${bearbeiten ? ' disabled' : ''}>
            ${moeglich.map(c => `<option value="${esc(c.id)}"${c.id === firmaId ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="x-kat">Kategorie</label>
          <select id="x-kat"${bearbeiten ? ' disabled' : ''}>
            ${Object.keys(K.KATEGORIEN).map(k =>
              `<option value="${esc(k)}"${a && a.category === k ? ' selected' : ''}>${esc(K.KATEGORIEN[k].label)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="field">
        <label for="x-name">Bezeichnung</label>
        <input id="x-name" type="text" required value="${esc(a ? a.name : '')}">
      </div>

      <div class="grid2">
        <div class="field"><label for="x-hersteller">Hersteller</label>
          <input id="x-hersteller" type="text" value="${esc(a ? a.manufacturer : '')}"></div>
        <div class="field"><label for="x-modell">Modell</label>
          <input id="x-modell" type="text" value="${esc(a ? a.model : '')}"></div>
        <div class="field"><label for="x-seriennr">Seriennummer</label>
          <input id="x-seriennr" type="text" value="${esc(a ? a.serial_number : '')}"></div>
        <div class="field"><label for="x-status">Status</label>
          <select id="x-status">${optionen(K.STATUS, a ? a.status : 'in_stock', null).replace('<option value="">—</option>', '')}</select></div>
        <div class="field"><label for="x-zustand">Zustand</label>
          <select id="x-zustand">${optionen(K.ZUSTAND, a ? a.condition : '', '—')}</select></div>
        <div class="field"><label for="x-standort">Standort</label>
          <select id="x-standort"></select></div>
        <div class="field"><label for="x-person">Zugewiesen an</label>
          <select id="x-person"></select></div>
        <div class="field"><label for="x-kauf">Angeschafft am</label>
          <input id="x-kauf" type="date" value="${esc(a ? a.purchase_date : '')}"></div>
        <div class="field"><label for="x-preis">Anschaffungswert in Euro</label>
          <input id="x-preis" type="number" step="0.01" min="0"
                 value="${a && a.purchase_price_cents !== null ? (a.purchase_price_cents / 100) : ''}"></div>
        <div class="field"><label for="x-garantie">Garantie bis</label>
          <input id="x-garantie" type="date" value="${esc(a ? a.warranty_until : '')}"></div>
        <div class="field"><label for="x-nutzung">Nutzungsdauer in Jahren</label>
          <input id="x-nutzung" type="number" min="1" max="50" value="${esc(a ? a.depreciation_years : '')}"></div>
        <div class="field"><label for="x-lieferant">Lieferant</label>
          <input id="x-lieferant" type="text" value="${esc(a ? a.supplier : '')}"></div>
      </div>

      <h2>Kategoriespezifisch</h2>
      <div class="grid2" id="x-attr"></div>

      <div class="field"><label for="x-notiz">Bemerkung</label>
        <textarea id="x-notiz">${esc(a ? a.notes : '')}</textarea></div>

      <div class="btn-row">
        <button class="btn primary" type="submit">${bearbeiten ? 'Speichern' : 'Anlegen'}</button>
        ${bearbeiten ? `<a class="btn quiet plain" href="#/objekt/${esc(a.id)}">Abbrechen</a>`
                     : '<a class="btn quiet plain" href="#/inventar">Abbrechen</a>'}
      </div>
    </form>`);

  const fuelleAuswahl = () => {
    const f = $('#x-firma').value;
    $('#x-standort').innerHTML = '<option value="">—</option>' + S.standorte
      .filter(l => l.company_id === f)
      .map(l => `<option value="${esc(l.id)}"${a && a.location_id === l.id ? ' selected' : ''}>${esc(l.name)}</option>`).join('');
    $('#x-person').innerHTML = '<option value="">—</option>' + S.personen
      .filter(p => p.company_id === f && p.is_active)
      .map(p => `<option value="${esc(p.id)}"${a && a.assigned_person_id === p.id ? ' selected' : ''}>${esc(p.full_name)}</option>`).join('');
  };
  const fuelleAttribute = () => {
    const kat = $('#x-kat').value;
    const attr = (a && a.attributes) || {};
    $('#x-attr').innerHTML = (K.FELDER[kat] || []).map(f => {
      const v = attr[f.key];
      if (f.typ === 'bool') {
        return `<div class="field inline"><input id="at-${esc(f.key)}" type="checkbox"${v ? ' checked' : ''}>
                <label for="at-${esc(f.key)}">${esc(f.label)}</label></div>`;
      }
      const typ = f.typ === 'number' ? 'number' : f.typ === 'date' ? 'date' : 'text';
      return `<div class="field"><label for="at-${esc(f.key)}">${esc(f.label)}${
        f.einheit ? ' (' + esc(f.einheit) + ')' : ''}</label>
        <input id="at-${esc(f.key)}" type="${typ}" value="${esc(v === undefined || v === null ? '' : v)}"></div>`;
    }).join('');
  };
  fuelleAuswahl(); fuelleAttribute();
  $('#x-firma').addEventListener('change', fuelleAuswahl);
  $('#x-kat').addEventListener('change', fuelleAttribute);

  $('#f-asset').addEventListener('submit', async ev => {
    ev.preventDefault();
    const btn = $('#f-asset button[type=submit]');
    btn.disabled = true;
    const kat = $('#x-kat').value;
    const attr = {};
    (K.FELDER[kat] || []).forEach(f => {
      const el = document.getElementById('at-' + f.key);
      if (!el) return;
      if (f.typ === 'bool') { attr[f.key] = el.checked; return; }
      const v = el.value.trim();
      if (v === '') return;
      attr[f.key] = f.typ === 'number' ? Number(v) : v;
    });
    const preis = $('#x-preis').value;
    const werte = {
      name: $('#x-name').value.trim(),
      manufacturer: $('#x-hersteller').value.trim() || null,
      model: $('#x-modell').value.trim() || null,
      serial_number: $('#x-seriennr').value.trim() || null,
      status: $('#x-status').value,
      condition: $('#x-zustand').value || null,
      location_id: $('#x-standort').value || null,
      assigned_person_id: $('#x-person').value || null,
      purchase_date: $('#x-kauf').value || null,
      purchase_price_cents: preis === '' ? null : Math.round(Number(preis) * 100),
      warranty_until: $('#x-garantie').value || null,
      depreciation_years: $('#x-nutzung').value ? Number($('#x-nutzung').value) : null,
      supplier: $('#x-lieferant').value.trim() || null,
      notes: $('#x-notiz').value.trim() || null,
      attributes: attr
    };
    try {
      let ergebnis;
      if (bearbeiten) {
        ergebnis = await DB.assetAendern(a.id, werte);
        meldung('Gespeichert.');
      } else {
        werte.company_id = $('#x-firma').value;
        werte.category = kat;
        ergebnis = await DB.assetAnlegen(werte);
        meldung('Angelegt als ' + ergebnis.asset_no + '.');
      }
      location.hash = '#/objekt/' + ergebnis.id;
    } catch (e) { meldung(e.message, 'err'); btn.disabled = false; }
  });
}

/* --- Scannen ---------------------------------------------------------------------- */

async function zeigeScan() {
  setzeInhalt(`
    <p class="label">Kamera</p>
    <h1>Aufkleber scannen</h1>
    <p class="muted">QR-Code des Inventarobjekts in den Ausschnitt halten.</p>
    <div id="reader"></div>
    <div class="btn-row">
      <button class="btn" id="b-nfc-lesen" hidden>NFC-Tag lesen</button>
    </div>
    <form id="f-code">
      <div class="field">
        <label for="c-code">Oder Code abtippen</label>
        <input id="c-code" type="text" inputmode="latin" autocapitalize="off"
               spellcheck="false" placeholder="16 Zeichen vom Etikett">
      </div>
      <div class="btn-row"><button class="btn quiet" type="submit">Öffnen</button></div>
    </form>
    <p class="muted" id="scan-hinweis" style="font-size:14px"></p>`);

  const treffer = text => {
    const code = SCAN.codeAusText(text);
    if (!code) { meldung('Das ist kein Inventar-Aufkleber.', 'err'); return; }
    SCAN.stoppen();
    location.hash = '#/a/' + code;
  };

  try {
    const weg = await SCAN.starten('reader', treffer);
    $('#scan-hinweis').textContent = weg === 'nativ'
      ? 'Erkennung über den Browser.'
      : 'Erkennung über die nachgeladene Bibliothek.';
  } catch (e) {
    $('#reader').innerHTML = `<p class="empty" style="padding:24px">${esc(
      e.name === 'NotAllowedError'
        ? 'Kein Zugriff auf die Kamera. In den Browsereinstellungen für diese Seite freigeben — oder den Code unten abtippen.'
        : e.message)}</p>`;
  }

  if (SCAN.nfcVerfuegbar()) {
    const b = $('#b-nfc-lesen');
    b.hidden = false;
    b.addEventListener('click', async () => {
      meldung('Telefon an den Tag halten …');
      try {
        await SCAN.nfcLesen(url => { SCAN.nfcLesenBeenden(); treffer(url); },
                            e => meldung('NFC: ' + e.message, 'err'));
      } catch (e) { meldung('NFC: ' + e.message, 'err'); }
    });
  } else {
    $('#scan-hinweis').textContent += ' NFC bietet dieser Browser nicht an — das kann bisher nur Chrome auf Android.';
  }

  $('#f-code').addEventListener('submit', ev => {
    ev.preventDefault();
    treffer($('#c-code').value.trim());
  });
}

/* --- Fälligkeiten ------------------------------------------------------------------ */

async function zeigeFaellig() {
  setzeInhalt('<p class="muted">Wird geladen …</p>');
  const liste = await DB.faelligkeiten(S.bereich);
  const ueber = liste.filter(m => K.tageBis(m.due_date) < 0);
  setzeInhalt(`
    <div class="busy">
      <p class="label">${esc(S.bereich ? firmenName(S.bereich) : 'Alle Gesellschaften')}</p>
      <h1>${ueber.length ? `${ueber.length} Termin${ueber.length === 1 ? '' : 'e'} überfällig`
                         : 'Nichts überfällig'}</h1>
      ${liste.length
        ? `<div class="rows">${liste.map(zeileFaellig).join('')}</div>`
        : '<p class="empty">Keine offenen Prüf- oder Wartungstermine.</p>'}
    </div>`);
}

/* --- Verwaltung --------------------------------------------------------------------- */

/* Vorbelegung für „unter welcher Gesellschaft": die gerade gewählte, sonst die
   oberste verwaltbare — sonst landet eine neue Tochter versehentlich unter der
   ersten Gesellschaft in alphabetischer Reihenfolge. */
function vorgabeMutter() {
  if (S.bereich && darfVerwalten(S.bereich)) return S.bereich;
  const wurzel = S.gesellschaften.find(c => darfVerwalten(c.id) && !c.parent_id);
  if (wurzel) return wurzel.id;
  const erste = S.gesellschaften.find(c => darfVerwalten(c.id));
  return erste ? erste.id : null;
}

async function zeigeVerwaltung() {
  if (!S.verwaltbar.length) {
    setzeInhalt('<h1>Verwaltung</h1><p>Stammdaten und Zugänge pflegt die Verwaltung deiner Gesellschaft.</p>');
    return;
  }
  setzeInhalt('<p class="muted">Wird geladen …</p>');
  const [orte, leute, zugaenge] = await Promise.all([
    DB.standorte(), DB.personen(), DB.mitgliedschaften()
  ]);
  S.standorte = orte; S.personen = leute;

  setzeInhalt(`
    <div class="busy">
      <p class="label">Stammdaten</p>
      <h1>Verwaltung</h1>

      <h2>Gesellschaften</h2>
      <div class="rows">${S.gesellschaften.map(c => `
        <div class="row"><span class="t">${esc(c.name)}</span>
          <span class="m">${esc(c.short_code)}${c.parent_id ? ' · Tochter von ' + esc(firmenName(c.parent_id)) : ' · Holding'}</span>
          <span class="r">${c.is_active ? '' : 'stillgelegt'}</span></div>`).join('')}</div>
      <form id="f-firma" class="sunk">
        <p class="label">Tochtergesellschaft anlegen</p>
        <div class="grid2">
          <div class="field"><label for="n-name">Name</label><input id="n-name" required></div>
          <div class="field"><label for="n-code">Kurzzeichen für die Inventarnummer</label>
            <input id="n-code" required maxlength="8" pattern="[A-Za-z0-9]{2,8}" placeholder="z. B. SFD"></div>
          <div class="field"><label for="n-mutter">Unter welcher Gesellschaft</label>
            <select id="n-mutter">${S.gesellschaften.filter(c => darfVerwalten(c.id))
              .map(c => `<option value="${esc(c.id)}"${c.id === vorgabeMutter() ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        </div>
        <div class="btn-row"><button class="btn primary" type="submit">Anlegen</button></div>
      </form>

      <h2>Standorte</h2>
      ${orte.length ? `<div class="rows">${orte.map(l => `
        <div class="row"><span class="t">${esc(l.name)}</span>
          <span class="m">${esc(K.STANDORT_ART[l.kind] || l.kind)} · ${esc(firmenName(l.company_id))}</span></div>`).join('')}</div>`
        : '<p class="empty">Noch keine Standorte.</p>'}
      <form id="f-ort" class="sunk">
        <p class="label">Standort anlegen</p>
        <div class="grid2">
          <div class="field"><label for="o-name">Bezeichnung</label><input id="o-name" required></div>
          <div class="field"><label for="o-art">Art</label>
            <select id="o-art">${optionen(K.STANDORT_ART, 'room', null).replace('<option value="">—</option>', '')}</select></div>
          <div class="field"><label for="o-firma">Gesellschaft</label>
            <select id="o-firma">${S.gesellschaften.filter(c => darfSchreiben(c.id))
              .map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></div>
        </div>
        <div class="btn-row"><button class="btn primary" type="submit">Anlegen</button></div>
      </form>

      <h2>Personen</h2>
      ${leute.length ? `<div class="rows">${leute.map(p => `
        <div class="row"><span class="t">${esc(p.full_name)}</span>
          <span class="m">${esc(firmenName(p.company_id))}${p.department ? ' · ' + esc(p.department) : ''}${
            p.employee_no ? ' · ' + esc(p.employee_no) : ''}</span></div>`).join('')}</div>`
        : '<p class="empty">Noch keine Personen.</p>'}
      <form id="f-person" class="sunk">
        <p class="label">Person anlegen</p>
        <div class="grid2">
          <div class="field"><label for="p-name">Name</label><input id="p-name" required></div>
          <div class="field"><label for="p-abt">Abteilung</label><input id="p-abt"></div>
          <div class="field"><label for="p-nr">Personalnummer</label><input id="p-nr"></div>
          <div class="field"><label for="p-firma">Gesellschaft</label>
            <select id="p-firma">${S.gesellschaften.filter(c => darfSchreiben(c.id))
              .map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></div>
        </div>
        <div class="btn-row"><button class="btn primary" type="submit">Anlegen</button></div>
      </form>

      <h2>Zugänge</h2>
      <div class="scroll-x"><table>
        <thead><tr><th>Person</th><th>Gesellschaft</th><th>Rolle</th><th></th></tr></thead>
        <tbody>${zugaenge.map(z => `
          <tr>
            <td>${esc(z.profiles ? (z.profiles.full_name || z.profiles.email) : z.user_id)}</td>
            <td>${esc(firmenName(z.company_id))}</td>
            <td>${darfVerwalten(z.company_id)
              ? `<select data-rolle="${esc(z.user_id)}|${esc(z.company_id)}">
                   ${optionen(K.ROLLEN, z.role, null).replace('<option value="">—</option>', '')}</select>`
              : esc(K.ROLLEN[z.role] || z.role)}</td>
            <td class="num">${darfVerwalten(z.company_id) && z.user_id !== S.sitzung.user.id
              ? `<a href="#" data-weg="${esc(z.user_id)}|${esc(z.company_id)}">entziehen</a>` : ''}</td>
          </tr>`).join('')}</tbody>
      </table></div>
      <div class="sunk">
        <p class="label">Neuen Zugang einrichten</p>
        <p>Einladungen verschickt Supabase, nicht diese Anwendung: im Projekt unter
           <strong>Authentication → Users → Invite user</strong> die Adresse eintragen.
           Sobald die Person ihr Passwort gesetzt hat, taucht sie oben auf und bekommt
           hier ihre Rolle. Der Umweg hat einen Grund — für das Anlegen von Konten
           bräuchte diese Seite den service_role-Schlüssel, und der gehört nicht in
           eine Datei, die jeder Browser herunterlädt.</p>
      </div>
    </div>`);

  $('#f-firma').addEventListener('submit', async ev => {
    ev.preventDefault();
    try {
      await DB.gesellschaftAnlegen({
        name: $('#n-name').value.trim(),
        short_code: $('#n-code').value.trim().toUpperCase(),
        parent_id: $('#n-mutter').value
      });
      meldung('Gesellschaft angelegt.');
      await ladeStammdaten();
      zeigeVerwaltung();
    } catch (e) { meldung(e.message, 'err'); }
  });

  $('#f-ort').addEventListener('submit', async ev => {
    ev.preventDefault();
    try {
      await DB.standortAnlegen({
        name: $('#o-name').value.trim(), kind: $('#o-art').value,
        company_id: $('#o-firma').value
      });
      meldung('Standort angelegt.');
      S.standorte = []; zeigeVerwaltung();
    } catch (e) { meldung(e.message, 'err'); }
  });

  $('#f-person').addEventListener('submit', async ev => {
    ev.preventDefault();
    try {
      await DB.personAnlegen({
        full_name: $('#p-name').value.trim(),
        department: $('#p-abt').value.trim() || null,
        employee_no: $('#p-nr').value.trim() || null,
        company_id: $('#p-firma').value
      });
      meldung('Person angelegt.');
      S.personen = []; zeigeVerwaltung();
    } catch (e) { meldung(e.message, 'err'); }
  });

  document.querySelectorAll('[data-rolle]').forEach(sel => {
    sel.addEventListener('change', async () => {
      const [u, c] = sel.dataset.rolle.split('|');
      try { await DB.rolleSetzen(u, c, sel.value); meldung('Rolle geändert.'); }
      catch (e) { meldung(e.message, 'err'); }
    });
  });
  document.querySelectorAll('[data-weg]').forEach(el => {
    el.addEventListener('click', async ev => {
      ev.preventDefault();
      const [u, c] = el.dataset.weg.split('|');
      if (!confirm('Zugang zu dieser Gesellschaft entziehen?')) return;
      try { await DB.zugangEntziehen(u, c); meldung('Zugang entzogen.'); zeigeVerwaltung(); }
      catch (e) { meldung(e.message, 'err'); }
    });
  });
}

/* --- Router ------------------------------------------------------------------------- */

const ROUTEN = [
  [/^#?\/?$/,                    () => zeigeUebersicht()],
  [/^#\/inventar/,               (m, q) => zeigeInventar(q)],
  [/^#\/objekt\/([0-9a-f-]{36})$/i, m => zeigeObjekt(m[1])],
  [/^#\/a\/([0-9a-f]{16})$/i,    m => zeigeObjektPerCode(m[1].toLowerCase())],
  [/^#\/neu$/,                   () => zeigeFormular(null)],
  [/^#\/bearbeiten\/([0-9a-f-]{36})$/i, m => zeigeFormular(m[1])],
  [/^#\/scan$/,                  () => zeigeScan()],
  [/^#\/faellig$/,               () => zeigeFaellig()],
  [/^#\/verwaltung$/,            () => zeigeVerwaltung()]
];

async function route() {
  const roh = location.hash || '#/';
  const [pfad, abfrage] = roh.split('?');
  const q = new URLSearchParams(abfrage || '');

  if (!S.sitzung) return;
  SCAN.stoppen();

  document.querySelectorAll('#nav a').forEach(a => {
    const ziel = a.getAttribute('href');
    if (pfad === ziel || (ziel === '#/' && pfad === '#/')) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  for (const [re, fn] of ROUTEN) {
    const m = pfad.match(re);
    if (m) {
      try { await fn(m, q); }
      catch (e) {
        meldung(e.message, 'err');
        setzeInhalt(`<h1>Das ging schief</h1><p>${esc(e.message)}</p>
          <div class="btn-row"><a class="btn plain" href="#/">Zur Übersicht</a></div>`);
      }
      window.scrollTo(0, 0);
      return;
    }
  }
  setzeInhalt('<h1>Diese Adresse gibt es nicht</h1><div class="btn-row"><a class="btn plain" href="#/">Zur Übersicht</a></div>');
}

/* --- Start -------------------------------------------------------------------------- */

async function ladeStammdaten() {
  const [sicht, schreib, admin, firmen] = await Promise.all([
    DB.sichtbareGesellschaften(), DB.schreibbareGesellschaften(),
    DB.verwaltbareGesellschaften(), DB.gesellschaften()
  ]);
  S.sichtbar = sicht || [];
  S.schreibbar = schreib || [];
  S.verwaltbar = admin || [];
  S.gesellschaften = firmen || [];
  S.standorte = []; S.personen = [];
}

async function start() {
  if (!DB.konfiguriert()) {
    document.body.classList.add('anonym');
    $('#nav').hidden = true;
    setzeInhalt(`
      <h1>Noch nicht verbunden</h1>
      <p>In <span class="mono">inventory/config.js</span> fehlen Projekt-Adresse und
         anon key des Supabase-Projekts. Die Schritte dazu stehen in
         <span class="mono">inventory/README.md</span>.</p>`);
    return;
  }

  S.sitzung = await DB.sitzung();
  if (!S.sitzung) { zeigeAnmeldung(); return; }

  document.body.classList.remove('anonym');
  $('#nav').hidden = false;
  await ladeStammdaten();

  if (S.sichtbar.length === 0) {
    setzeInhalt(`
      <h1>Dein Zugang ist noch keiner Gesellschaft zugeordnet</h1>
      <p>Die Anmeldung hat geklappt, es fehlt aber die Freischaltung. Die
         Verwaltung von Snowflake Ventures kann sie in wenigen Sekunden setzen.</p>
      <div class="btn-row"><button class="btn quiet" id="b-abmelden">Abmelden</button></div>`);
    $('#b-abmelden').addEventListener('click', async () => { await DB.abmelden(); location.reload(); });
    $('#nav').hidden = true;
    return;
  }

  try {
    const gemerkt = localStorage.getItem('inv.bereich');
    if (gemerkt && S.sichtbar.indexOf(gemerkt) !== -1) S.bereich = gemerkt;
  } catch (_) {}
  if (S.sichtbar.length === 1) S.bereich = S.sichtbar[0];

  zeichneKopf();
  route();
}

window.addEventListener('hashchange', route);

document.addEventListener('DOMContentLoaded', () => {
  $('#b-logout').addEventListener('click', async ev => {
    ev.preventDefault();
    await DB.abmelden();
    S.sitzung = null;
    location.hash = '#/';
    location.reload();
  });
  start().catch(e => {
    setzeInhalt(`<h1>Start fehlgeschlagen</h1><p>${esc(e.message)}</p>`);
  });
});
