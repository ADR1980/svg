/* ==========================================================================
   Passwortschleuse vor der App.
   ==========================================================================
   Was sie leistet: Wer die Adresse kennt, aber das Passwort nicht, sieht die
   App nicht. Das hält zufällige Besucher ab.

   Was sie nicht leistet: echten Schutz. Die Seite liegt statisch auf GitHub
   Pages, es gibt niemanden, der die Prüfung serverseitig vornehmen könnte —
   die Entscheidung fällt im Browser des Besuchers, also auf fremdem Gerät.
   Unten steht deshalb nicht das Passwort, sondern ein PBKDF2-Hash mit 310 000
   Runden: wer die Datei liest, muss raten, und jeder Rateversuch kostet ihn
   dieselbe Rechenzeit wie hier eine Anmeldung. Ein kurzes Passwort fällt
   trotzdem irgendwann.

   Die Daten selbst hängen nicht an dieser Schleuse. Sie hängen an der
   Anmeldung gegen Supabase und an den Policies aus sql/02_rls.sql — wer die
   Schleuse überwindet, sieht eine leere App, keine einzige Zeile.
   ========================================================================== */

const SALZ = '50eb4433d5a05f5624969960887aee31'
const HASH = '95d06b9fec1e1102f2dbdd92ee48543eabf318cc2992325d176c81a31988e5e1'
const RUNDEN = 310000
const MERKER = 'trainingstracker-schleuse'

function ausHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

function zuHex(puffer: ArrayBuffer): string {
  return [...new Uint8Array(puffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Vergleich ohne Zeitverrat — hier fast Zierde, aber es kostet nichts. */
function gleich(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let unterschied = 0
  for (let i = 0; i < a.length; i++) unterschied |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return unterschied === 0
}

export async function passt(passwort: string): Promise<boolean> {
  const roh = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passwort),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: ausHex(SALZ) as BufferSource, iterations: RUNDEN, hash: 'SHA-256' },
    roh,
    256
  )
  return gleich(zuHex(bits), HASH)
}

/** Einmal geöffnet, bleibt offen — sonst tippt man das vor jedem Satz. */
export function istOffen(): boolean {
  try {
    return localStorage.getItem(MERKER) === HASH.slice(0, 16)
  } catch {
    return false
  }
}

export function merkeOffen(): void {
  try {
    localStorage.setItem(MERKER, HASH.slice(0, 16))
  } catch {
    /* Privates Fenster: dann fragt sie beim nächsten Start wieder. */
  }
}

export function schliessen(): void {
  try {
    localStorage.removeItem(MERKER)
  } catch {
    /* nichts zu tun */
  }
}
