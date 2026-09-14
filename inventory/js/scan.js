/* ==========================================================================
   Scannen: QR über die Kamera, dazu NFC lesen und schreiben.

   Zwei Wege für den QR-Code. Wo der Browser BarcodeDetector mitbringt
   (Chrome und Edge auf Android, Chrome auf ChromeOS), wird der genommen —
   nichts nachzuladen, spürbar schneller. Sonst kommt html5-qrcode vom CDN,
   das auch auf iOS-Safari zuverlässig erkennt.

   NFC läuft über Web NFC. Die gibt es nur in Chrome, Edge, Opera und
   Samsung Internet auf Android. Auf allen anderen Geräten wird der Knopf
   erst gar nicht angeboten.
   ========================================================================== */

const FALLBACK_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js';

let stream = null;
let video = null;
let laeuft = false;
let h5q = null;

function nativVerfuegbar() {
  return typeof window.BarcodeDetector !== 'undefined';
}

function ladeFallback() {
  if (window.Html5Qrcode) return Promise.resolve();
  return new Promise((ok, fehler) => {
    const s = document.createElement('script');
    s.src = FALLBACK_URL;
    s.onload = ok;
    s.onerror = () => fehler(new Error('Die Scanner-Bibliothek ließ sich nicht laden.'));
    document.head.appendChild(s);
  });
}

/* Aus dem gescannten Text den Aufkleber-Code herausziehen. Erlaubt sind die
   volle URL, der Pfadteil und der nackte Code — Letzteres, damit auch ein
   abgetippter Code funktioniert. */
function codeAusText(text) {
  if (!text) return null;
  const t = String(text).trim();
  const m = t.match(/([0-9a-f]{16})\s*$/i);
  if (m) return m[1].toLowerCase();
  return null;
}

async function starten(elementId, beiCode, beiFehler) {
  if (laeuft) await stoppen();
  const ziel = document.getElementById(elementId);
  if (!ziel) throw new Error('Kein Platz für die Kameraansicht gefunden.');
  ziel.innerHTML = '';
  laeuft = true;

  if (nativVerfuegbar()) {
    try {
      await nativStarten(ziel, beiCode);
      return 'nativ';
    } catch (e) {
      // Kein Kamerazugriff oder kein passendes Format: nicht auf den
      // Fallback ausweichen, der scheitert an derselben Stelle.
      if (e && e.name === 'NotAllowedError') { laeuft = false; throw e; }
    }
  }

  await ladeFallback();
  const halter = document.createElement('div');
  halter.id = elementId + '-h5q';
  ziel.appendChild(halter);
  h5q = new window.Html5Qrcode(halter.id, { verbose: false });
  await h5q.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 240, height: 240 } },
    text => beiCode(text),
    () => {}                     /* Einzelbilder ohne Treffer sind normal */
  ).catch(e => { laeuft = false; throw e; });
  return 'fallback';
}

async function nativStarten(ziel, beiCode) {
  const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } }, audio: false
  });
  video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.muted = true;
  video.srcObject = stream;
  ziel.appendChild(video);
  await video.play();

  let letzter = '';
  const runde = async () => {
    if (!laeuft) return;
    try {
      const treffer = await detector.detect(video);
      if (treffer.length && treffer[0].rawValue !== letzter) {
        letzter = treffer[0].rawValue;
        beiCode(letzter);
      }
    } catch (_) { /* einzelne Bilder dürfen scheitern */ }
    if (laeuft) requestAnimationFrame(runde);
  };
  requestAnimationFrame(runde);
}

async function stoppen() {
  laeuft = false;
  if (h5q) {
    try { await h5q.stop(); h5q.clear(); } catch (_) {}
    h5q = null;
  }
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  if (video) { video.srcObject = null; video.remove(); video = null; }
}

/* --- NFC ------------------------------------------------------------------- */

function nfcVerfuegbar() { return 'NDEFReader' in window; }

let nfcAbbruch = null;

async function nfcLesen(beiUrl, beiFehler) {
  if (!nfcVerfuegbar()) throw new Error('Dieses Gerät kann kein NFC im Browser.');
  const leser = new window.NDEFReader();
  nfcAbbruch = new AbortController();
  await leser.scan({ signal: nfcAbbruch.signal });
  leser.onreading = ev => {
    for (const r of ev.message.records) {
      if (r.recordType === 'url' || r.recordType === 'absolute-url') {
        beiUrl(new TextDecoder().decode(r.data));
        return;
      }
    }
    if (beiFehler) beiFehler(new Error('Auf dem Tag steht keine Adresse.'));
  };
  leser.onreadingerror = () => {
    if (beiFehler) beiFehler(new Error('Der Tag ließ sich nicht lesen.'));
  };
}

function nfcLesenBeenden() {
  if (nfcAbbruch) { nfcAbbruch.abort(); nfcAbbruch = null; }
}

async function nfcSchreiben(url) {
  if (!nfcVerfuegbar()) throw new Error('Dieses Gerät kann kein NFC im Browser.');
  const schreiber = new window.NDEFReader();
  await schreiber.write({ records: [{ recordType: 'url', data: url }] });
}

window.SCAN = {
  starten, stoppen, codeAusText, nativVerfuegbar,
  nfcVerfuegbar, nfcLesen, nfcLesenBeenden, nfcSchreiben
};
