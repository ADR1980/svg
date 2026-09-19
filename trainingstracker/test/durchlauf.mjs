/* ==========================================================================
   Durchlauf durch die ganze App im Browser: Einrichtung, sechs Sätze davon
   einer ohne Netz, Abschluss mit Zykluszähler, „Heute Pause", Körperwert,
   Verlauf, Auswertung, Muscle-Up. Schreibt Bildschirmfotos nach /tmp.

   Kein Bestandteil von npm test — das hier ist zum Nachsehen da.

     npm run build && npx vite preview --port 4173 &
     npm install --no-save playwright-core
     node test/durchlauf.mjs
   ========================================================================== */
import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox']
})
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'de-DE' })
const s = await ctx.newPage()
const fehler = []
s.on('pageerror', (e) => fehler.push('SEITENFEHLER ' + e.message))
s.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_CERT')) fehler.push('KONSOLE ' + m.text()) })

const ablage = process.env.ABLAGE ?? '/tmp'
const schuss = (n) => s.screenshot({ path: `${ablage}/durchlauf-${n}.png`, fullPage: true })

await s.goto('http://localhost:4173/training/', { waitUntil: 'networkidle' })
await s.getByRole('button', { name: 'Zyklus beginnen' }).click()
await s.waitForTimeout(400)

// Bankdrücken: fünf Sätze in je zwei Antippen
for (let i = 0; i < 5; i++) {
  await s.locator('button:has-text("antippen")').first().click()
  await s.waitForTimeout(120)
  await s.getByRole('button', { name: 'Satz', exact: true }).first().click()
  await s.waitForTimeout(150)
}
console.log('Sätze erfasst:', await s.locator('text=/\\d+ Sätze erfasst/').first().innerText())

// Offline weiterarbeiten
await ctx.setOffline(true)
await s.locator('button:has-text("antippen")').first().click()
await s.waitForTimeout(120)
await s.getByRole('button', { name: 'Satz', exact: true }).first().click()
await s.waitForTimeout(200)
console.log('Offline erfasst:', await s.locator('text=/\\d+ Sätze erfasst/').first().innerText())
await ctx.setOffline(false)

// Einheit abschließen — der Zähler muss eine Position weiter stehen
await s.getByRole('button', { name: 'Einheit abschließen' }).click()
await s.waitForTimeout(150)
await s.getByRole('button', { name: 'Fertig, Zähler weiter' }).click()
await s.waitForTimeout(400)
await schuss('abgeschlossen')
console.log('Nach Abschluss:', await s.locator('header p.etikett, main p').first().innerText())
console.log('Einheit jetzt:', await s.locator('main h1').first().innerText())

// Heute Pause: Zähler springt auf Tag 4
await s.getByRole('button', { name: 'Heute Pause' }).click()
await s.waitForTimeout(150)
await s.getByRole('button', { name: 'Pause eintragen' }).click()
await s.waitForTimeout(400)
console.log('Nach Heute Pause:', await s.locator('main h1').first().innerText(), '|', await s.locator('main p').first().innerText())
await schuss('pausentag')

// Körperwert
await s.getByRole('button', { name: 'Körper' }).click()
await s.waitForTimeout(300)
await s.locator('input[type=number]').first().fill('84.2')
await s.getByRole('button', { name: 'Eintragen' }).click()
await s.waitForTimeout(300)
await schuss('koerper')

// Verlauf
await s.getByRole('button', { name: 'Verlauf' }).click()
await s.waitForTimeout(300)
console.log('Verlauf:', await s.locator('main article').first().innerText())
await schuss('verlauf')

// Auswertung
await s.getByRole('button', { name: 'Auswertung' }).click()
await s.waitForTimeout(800)
await schuss('auswertung')
const zeilen = await s.locator('tbody tr').allInnerTexts()
console.log('Volumen:', zeilen.join(' | '))

// Muscle-Up
await s.getByRole('button', { name: 'Muscle-Up' }).click()
await s.waitForTimeout(600)
await schuss('muscleup')

console.log(fehler.length ? fehler.join('\n') : 'Keine Fehler in der Konsole.')
await browser.close()
