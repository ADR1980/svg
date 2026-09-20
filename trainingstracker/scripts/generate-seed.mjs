/* ==========================================================================
   Erzeugt sql/03_seed.sql aus src/data/plan.ts.

   Damit gibt es genau eine Quelle für den Trainingsplan. Nach jeder Änderung
   an plan.ts: npm run seed — und die Ausgabe in eine neue Migration geben.
   ========================================================================== */

import { build } from 'esbuild'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const ORDNER = new URL('..', import.meta.url).pathname

const zwischen = await mkdtemp(join(tmpdir(), 'plan-'))
const gebaut = join(zwischen, 'plan.mjs')
await build({
  entryPoints: [join(ORDNER, 'src/data/plan.ts')],
  outfile: gebaut,
  bundle: true,
  format: 'esm',
  platform: 'node',
  logLevel: 'silent'
})
const plan = await import(pathToFileURL(gebaut).href)

const t = (wert) =>
  wert === null || wert === undefined ? 'null' : `'${String(wert).replace(/'/g, "''")}'`
const z = (wert) => (wert === null || wert === undefined ? 'null' : String(wert))
const b = (wert) => (wert ? 'true' : 'false')
const feld = (liste) =>
  liste.length === 0 ? `'{}'` : `'{${liste.join(',')}}'`

const zeilen = []
zeilen.push(`-- ===========================================================================
-- Trainingsplan „Zwölf Wochen zum Muscle-Up", Stand 19. September 2026.
--
-- ERZEUGT von scripts/generate-seed.mjs aus src/data/plan.ts — nicht von Hand
-- ändern. Änderungen am Plan gehören in plan.ts und danach in eine neue
-- Migration; der Seed ist idempotent und lässt sich erneut einspielen.
-- ===========================================================================
`)

zeilen.push(`insert into exercises
  (id, name, equipment, unilateral, load_type, cue, primary_muscles, secondary_muscles)
values`)
zeilen.push(
  plan.UEBUNGEN.map(
    (u) =>
      `  (${t(u.id)}, ${t(u.name)}, ${t(u.equipment)}, ${b(u.unilateral)}, ${t(u.load_type)},\n   ${t(u.cue)}, ${feld(u.primary_muscles)}, ${feld(u.secondary_muscles)})`
  ).join(',\n')
)
zeilen.push(`on conflict (id) do update set
  name = excluded.name, equipment = excluded.equipment, unilateral = excluded.unilateral,
  load_type = excluded.load_type, cue = excluded.cue,
  primary_muscles = excluded.primary_muscles, secondary_muscles = excluded.secondary_muscles;
`)

zeilen.push(`-- Pull steht zweimal im Zyklus, auf Position 2 und 6; die Tabelle hält nur eine
-- Position, die Rotation selbst liegt in src/lib/zyklus.ts.
insert into session_templates (id, name, headline, cycle_position, planned_minutes)
values`)
zeilen.push(
  plan.VORLAGEN.map(
    (v) => `  (${t(v.id)}, ${t(v.name)}, ${t(v.headline)}, ${z(v.cycle_position)}, ${z(v.planned_minutes)})`
  ).join(',\n')
)
zeilen.push(`on conflict (id) do update set
  name = excluded.name, headline = excluded.headline,
  cycle_position = excluded.cycle_position, planned_minutes = excluded.planned_minutes;
`)

zeilen.push(`-- Feste Kennungen: sets.block_id verweist darauf, und die App kennt die Vorlage
-- auch offline. 1xx Push A, 2xx Push B, 3xx Pull, 4xx Beine A, 5xx Beine B.
insert into template_blocks
  (id, template_id, ordinal, label, superset_group, exercise_id, kind,
   target_sets, rep_min, rep_max, target_rir, rest_seconds, planned_minutes, note)
values`)
zeilen.push(
  plan.BLOECKE.map(
    (x) =>
      `  (${z(x.id)}, ${t(x.template_id)}, ${z(x.ordinal)}, ${t(x.label)}, ${t(x.superset_group)},\n   ${t(x.exercise_id)}, ${t(x.kind)}, ${z(x.target_sets)}, ${z(x.rep_min)}, ${z(x.rep_max)},\n   ${t(x.target_rir)}, ${z(x.rest_seconds)}, ${z(x.planned_minutes)}, ${t(x.note)})`
  ).join(',\n')
)
zeilen.push(`on conflict (id) do update set
  template_id = excluded.template_id, ordinal = excluded.ordinal, label = excluded.label,
  superset_group = excluded.superset_group, exercise_id = excluded.exercise_id,
  kind = excluded.kind, target_sets = excluded.target_sets, rep_min = excluded.rep_min,
  rep_max = excluded.rep_max, target_rir = excluded.target_rir,
  rest_seconds = excluded.rest_seconds, planned_minutes = excluded.planned_minutes,
  note = excluded.note;
`)

zeilen.push(`insert into muscleup_blocks (id, name, week_from, week_to, gate)
values`)
zeilen.push(
  plan.MU_BLOECKE.map(
    (m) => `  (${z(m.id)}, ${t(m.name)}, ${z(m.week_from)}, ${z(m.week_to)}, ${t(m.gate)})`
  ).join(',\n')
)
zeilen.push(`on conflict (id) do update set
  name = excluded.name, week_from = excluded.week_from,
  week_to = excluded.week_to, gate = excluded.gate;
`)

zeilen.push(`insert into muscleup_drills (id, block_id, ordinal, name, prescription, cue)
values`)
zeilen.push(
  plan.MU_UEBUNGEN.map(
    (d) =>
      `  (${z(d.id)}, ${z(d.block_id)}, ${z(d.ordinal)}, ${t(d.name)}, ${t(d.prescription)}, ${t(d.cue)})`
  ).join(',\n')
)
zeilen.push(`on conflict (id) do update set
  block_id = excluded.block_id, ordinal = excluded.ordinal, name = excluded.name,
  prescription = excluded.prescription, cue = excluded.cue;
`)

await writeFile(join(ORDNER, 'sql/03_seed.sql'), zeilen.join('\n') + '\n', 'utf8')
await rm(zwischen, { recursive: true, force: true })
console.log(
  `sql/03_seed.sql geschrieben: ${plan.UEBUNGEN.length} Übungen, ${plan.VORLAGEN.length} Vorlagen, ` +
    `${plan.BLOECKE.length} Blöcke, ${plan.MU_UEBUNGEN.length} Muscle-Up-Übungen.`
)
