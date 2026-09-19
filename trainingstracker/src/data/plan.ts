/* ==========================================================================
   Der Trainingsplan „Zwölf Wochen zum Muscle-Up" vom 19. September 2026.

   Diese Datei ist die einzige Quelle. sql/02_seed.sql wird daraus erzeugt
   (npm run seed) — Datenbank und Client können also nicht auseinanderlaufen.
   Änderungen am Plan gehören hierher und danach in eine neue Migration.
   ========================================================================== */

import type {
  Block,
  MuscleUpBlock,
  MuscleUpDrill,
  Muskelgruppe,
  Uebung,
  Vorlage,
  VorlageId
} from '../lib/types'

export const UEBUNGEN: Uebung[] = [
  {
    id: 'bankdruecken-lh',
    name: 'Bankdrücken Langhantel',
    equipment: 'langhantel',
    unilateral: false,
    load_type: 'external',
    cue: 'Schulterblätter zusammen und nach unten, Ellbogen 45°, Stange zur unteren Brust.',
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps', 'front_delts']
  },
  {
    id: 'bankdruecken-kh',
    name: 'Bankdrücken Kurzhantel, flach',
    equipment: 'kurzhantel',
    unilateral: false,
    load_type: 'external',
    cue: 'Hanteln tiefer als die Stange führen, unten kurz Spannung halten.',
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps', 'front_delts']
  },
  {
    id: 'schraegbankdruecken-kh',
    name: 'Schrägbankdrücken Kurzhantel',
    equipment: 'kurzhantel',
    unilateral: false,
    load_type: 'external',
    cue: 'Bank auf 30°, oben nicht ganz durchstrecken.',
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps', 'front_delts']
  },
  {
    id: 'kabelzug-fly',
    name: 'Kabelzug-Fly, tiefe Endposition',
    equipment: 'kabel',
    unilateral: false,
    load_type: 'external',
    cue: 'Züge von oben, Hände unterhalb der Brust kreuzen, gedehnte Endlage betonen.',
    primary_muscles: ['chest'],
    secondary_muscles: []
  },
  {
    id: 'schulterdruecken-lh',
    name: 'Schulterdrücken Langhantel, stehend',
    equipment: 'langhantel',
    unilateral: false,
    load_type: 'external',
    cue: 'Rippen unten lassen, Kopf durch, keine Ausweichbewegung im Rücken.',
    primary_muscles: ['front_delts'],
    secondary_muscles: ['triceps']
  },
  {
    id: 'schulterdruecken-kh',
    name: 'Schulterdrücken Kurzhantel, sitzend',
    equipment: 'kurzhantel',
    unilateral: false,
    load_type: 'external',
    cue: 'Lehne steil, Hanteln auf Schulterhöhe starten, Handflächen leicht zueinander.',
    primary_muscles: ['front_delts'],
    secondary_muscles: ['triceps']
  },
  {
    id: 'dips-stange',
    name: 'Dips an der geraden Stange',
    equipment: 'stange',
    unilateral: false,
    load_type: 'bodyweight_plus',
    cue: 'Oberkörper leicht vorgeneigt, Ellbogen dicht am Rumpf, tief genug herunter.',
    primary_muscles: ['chest', 'triceps'],
    secondary_muscles: ['front_delts']
  },
  {
    id: 'trizeps-ueberkopf-kabel',
    name: 'Trizeps über Kopf am Kabel',
    equipment: 'kabel',
    unilateral: false,
    load_type: 'external',
    cue: 'Ellbogen zeigen nach vorn, gedehnte Position bewusst ausfahren.',
    primary_muscles: ['triceps'],
    secondary_muscles: []
  },
  {
    id: 'seitheben-kabel',
    name: 'Seitheben am Kabel, einarmig',
    equipment: 'kabel',
    unilateral: true,
    load_type: 'external',
    cue: 'Zug hinter dem Rücken, Bewegung aus der Schulter, kein Schwung aus der Hüfte.',
    primary_muscles: ['side_delts'],
    secondary_muscles: []
  },
  {
    id: 'klimmzuege-zusatzlast',
    name: 'Klimmzüge mit Zusatzlast',
    equipment: 'stange',
    unilateral: false,
    load_type: 'bodyweight_plus',
    cue: 'Brustbein zur Stange, Ellbogen nach hinten unten, unten voll aushängen.',
    primary_muscles: ['back_pull'],
    secondary_muscles: ['biceps']
  },
  {
    id: 'langhantelrudern',
    name: 'Langhantelrudern',
    equipment: 'langhantel',
    unilateral: false,
    load_type: 'external',
    cue: 'Oberkörper 30–45°, Stange zum Bauchnabel, Rücken bleibt starr.',
    primary_muscles: ['back_pull'],
    secondary_muscles: ['biceps']
  },
  {
    id: 'ringrudern',
    name: 'Ringrudern',
    equipment: 'ringe',
    unilateral: false,
    load_type: 'bodyweight_plus',
    cue: 'Körper eine Linie, Ringe zum Rippenbogen, oben auswärts drehen.',
    primary_muscles: ['back_pull'],
    secondary_muscles: ['biceps']
  },
  {
    id: 'latzug-eng',
    name: 'Latzug eng',
    equipment: 'kabel',
    unilateral: false,
    load_type: 'external',
    cue: 'Enger Parallelgriff, Griff zur Brust, Oberkörper kaum bewegen.',
    primary_muscles: ['back_pull'],
    secondary_muscles: ['biceps']
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    equipment: 'kabel',
    unilateral: false,
    load_type: 'external',
    cue: 'Seil auf Augenhöhe, Hände an den Ohren vorbei, außenrotieren.',
    primary_muscles: ['back_pull'],
    secondary_muscles: ['side_delts']
  },
  {
    id: 'hammercurl',
    name: 'Hammercurl',
    equipment: 'kurzhantel',
    unilateral: false,
    load_type: 'external',
    cue: 'Neutralgriff, Oberarm still, unten vollständig strecken.',
    primary_muscles: ['biceps'],
    secondary_muscles: []
  },
  {
    id: 'kniebeuge-hinten',
    name: 'Kniebeuge hinten, Langhantel',
    equipment: 'langhantel',
    unilateral: false,
    load_type: 'external',
    cue: 'Stange auf dem hinteren Deltoid, Knie über die Zehen, unter Parallele.',
    primary_muscles: ['quads'],
    secondary_muscles: ['hamstrings_glutes']
  },
  {
    id: 'rumaenisches-kreuzheben',
    name: 'Rumänisches Kreuzheben, Langhantel',
    equipment: 'langhantel',
    unilateral: false,
    load_type: 'external',
    cue: 'Hüfte nach hinten, Stange am Bein, bis die Beinrückseite zieht.',
    primary_muscles: ['hamstrings_glutes'],
    secondary_muscles: ['back_pull']
  },
  {
    id: 'kreuzheben',
    name: 'Kreuzheben konventionell, Langhantel',
    equipment: 'langhantel',
    unilateral: false,
    load_type: 'external',
    cue: 'Stange über der Mitte des Fußes, Spannung vor dem Anzug, Hüfte und Schulter steigen gemeinsam.',
    primary_muscles: ['hamstrings_glutes'],
    secondary_muscles: ['back_pull', 'quads']
  },
  {
    id: 'bulgarischer-split-squat',
    name: 'Bulgarischer Split Squat, Kurzhanteln',
    equipment: 'kurzhantel',
    unilateral: true,
    load_type: 'external',
    cue: 'Hinterer Fuß erhöht, Rumpf leicht vorgeneigt, vorderes Knie über den Fuß.',
    primary_muscles: ['quads'],
    secondary_muscles: ['hamstrings_glutes']
  },
  {
    id: 'gehende-ausfallschritte',
    name: 'Gehende Ausfallschritte, Kurzhanteln',
    equipment: 'kurzhantel',
    unilateral: true,
    load_type: 'external',
    cue: 'Langer Schritt, Knie bis knapp über den Boden, aufrecht bleiben.',
    primary_muscles: ['quads'],
    secondary_muscles: ['hamstrings_glutes']
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust, Langhantel',
    equipment: 'langhantel',
    unilateral: false,
    load_type: 'external',
    cue: 'Schulterblätter auf der Bank, Rippen unten, oben eine Sekunde halten.',
    primary_muscles: ['hamstrings_glutes'],
    secondary_muscles: []
  },
  {
    id: 'nordic-curl',
    name: 'Nordic Curl',
    equipment: 'koerpergewicht',
    unilateral: false,
    load_type: 'bodyweight',
    cue: 'Füße unter beladener Langhantel, Hüfte gestreckt, so lange bremsen wie möglich.',
    primary_muscles: ['hamstrings_glutes'],
    secondary_muscles: []
  },
  {
    id: 'kettlebell-swing',
    name: 'Kettlebell Swing, russisch',
    equipment: 'kettlebell',
    unilateral: false,
    load_type: 'external',
    cue: 'Hüftstoß, keine Kniebeuge, Kugel bis Brusthöhe, Arme bleiben locker.',
    primary_muscles: ['hamstrings_glutes'],
    secondary_muscles: []
  },
  {
    id: 'wadenheben-stehend',
    name: 'Wadenheben stehend, Langhantel im Nacken',
    equipment: 'langhantel',
    unilateral: false,
    load_type: 'external',
    cue: 'Ferse tief absenken, oben zwei Sekunden halten.',
    primary_muscles: ['calves'],
    secondary_muscles: []
  },
  {
    id: 'wadenheben-einbeinig',
    name: 'Wadenheben einbeinig, Kurzhantel',
    equipment: 'kurzhantel',
    unilateral: true,
    load_type: 'external',
    cue: 'Voller Bewegungsweg, freie Hand nur zum Ausbalancieren.',
    primary_muscles: ['calves'],
    secondary_muscles: []
  },
  {
    id: 'ab-wheel',
    name: 'Ab Wheel',
    equipment: 'koerpergewicht',
    unilateral: false,
    load_type: 'bodyweight',
    cue: 'Becken aufgerichtet, Rücken darf nicht durchhängen, nur so weit wie kontrolliert.',
    primary_muscles: ['abs'],
    secondary_muscles: []
  },
  {
    id: 'hollow-hold',
    name: 'Hollow Hold',
    equipment: 'koerpergewicht',
    unilateral: false,
    load_type: 'time',
    cue: 'Lendenwirbel am Boden, Beine tief, Schulterblätter frei.',
    primary_muscles: ['abs'],
    secondary_muscles: []
  },
  {
    id: 'haengendes-beinheben',
    name: 'Hängendes Beinheben, gestreckt',
    equipment: 'stange',
    unilateral: false,
    load_type: 'bodyweight',
    cue: 'Kein Schwung, Becken am Ende einrollen, langsam ablassen.',
    primary_muscles: ['abs'],
    secondary_muscles: []
  },
  {
    id: 'kabel-crunch',
    name: 'Gewichteter Crunch am Kabel',
    equipment: 'kabel',
    unilateral: false,
    load_type: 'external',
    cue: 'Kniend, Bewegung aus der Wirbelsäule, Hüfte bleibt ruhig.',
    primary_muscles: ['abs'],
    secondary_muscles: []
  },
  {
    id: 'pallof-press',
    name: 'Pallof Press',
    equipment: 'kabel',
    unilateral: true,
    load_type: 'external',
    cue: 'Gegen die Rotation halten, Arme langsam ausstrecken.',
    primary_muscles: ['abs'],
    secondary_muscles: []
  },
  {
    id: 'koffertragen',
    name: 'Kettlebell-Koffertragen',
    equipment: 'kettlebell',
    unilateral: true,
    load_type: 'distance',
    cue: 'Eine Kugel, Schultern waagerecht, nicht zur Gegenseite lehnen.',
    primary_muscles: ['abs'],
    secondary_muscles: []
  }
]

export const VORLAGEN: Vorlage[] = [
  {
    id: 'push_a',
    name: 'Push A',
    headline: 'Bankdrücken trägt den Tag',
    cycle_position: 1,
    planned_minutes: 58
  },
  {
    id: 'pull',
    name: 'Pull',
    headline: 'Der Muscle-Up steht vorn, solange die Arme frisch sind',
    cycle_position: 2,
    planned_minutes: 57
  },
  {
    id: 'legs_a',
    name: 'Beine A',
    headline: 'Kniebeuge trägt den Tag',
    cycle_position: 3,
    planned_minutes: 57
  },
  {
    id: 'push_b',
    name: 'Push B',
    headline: 'Die Schulter kommt zuerst',
    cycle_position: 5,
    planned_minutes: 58
  },
  {
    id: 'legs_b',
    name: 'Beine B',
    headline: 'Kreuzheben',
    cycle_position: 7,
    planned_minutes: 55
  }
]

/**
 * Block-Kennungen sind fest vergeben statt aus einer Sequenz gezogen: sets.block_id
 * verweist darauf, und die App muss die Vorlage auch offline kennen.
 *   1xx Push A · 2xx Push B · 3xx Pull · 4xx Beine A · 5xx Beine B
 *
 * Bei load_type 'time' sind rep_min/rep_max Sekunden, bei 'distance' Meter.
 */
export const BLOECKE: Block[] = [
  /* --- Push A ----------------------------------------------------------- */
  b(101, 'push_a', 1, '1', null, null, 'warmup', null, null, null, null, null, 6,
    'Rudergerät 2 Min, Bandzüge für die Rotatoren, 3 Steigerungssätze Bank.'),
  b(102, 'push_a', 2, '2', null, 'bankdruecken-lh', 'work', 5, 5, 7, '2', 165, 15, null),
  b(103, 'push_a', 3, '3', null, 'schulterdruecken-kh', 'work', 3, 8, 10, '2', 120, 7, null),
  b(104, 'push_a', 4, '4', null, 'dips-stange', 'work', 3, 6, 10, '1', 120, 7,
    'Muscle-Up-Baustein — der tiefe Endpunkt ist der Punkt, nicht die Wiederholungszahl.'),
  b(105, 'push_a', 5, '5a', 'pa5', 'schraegbankdruecken-kh', 'work', 3, 8, 12, '1', 60, 9, null),
  b(106, 'push_a', 6, '5b', 'pa5', 'trizeps-ueberkopf-kabel', 'work', 3, 10, 12, '0-1', 60, 0, null),
  b(107, 'push_a', 7, '6', null, 'seitheben-kabel', 'work', 4, 12, 20, '0-1', 45, 6, null),
  b(108, 'push_a', 8, '7a', 'pa7', 'ab-wheel', 'abs', 4, 8, 12, '1', 45, 8, null),
  b(109, 'push_a', 9, '7b', 'pa7', 'hollow-hold', 'abs', 4, 20, 30, '1', 45, 0, null),

  /* --- Push B ----------------------------------------------------------- */
  b(201, 'push_b', 1, '1', null, null, 'warmup', null, null, null, null, null, 6,
    'Schulterkreisen, Bandzüge, 3 Steigerungssätze Schulterdrücken.'),
  b(202, 'push_b', 2, '2', null, 'schulterdruecken-lh', 'work', 5, 5, 8, '2', 165, 15, null),
  b(203, 'push_b', 3, '3', null, 'bankdruecken-kh', 'work', 3, 8, 12, '1', 120, 7, null),
  b(204, 'push_b', 4, '4', null, 'dips-stange', 'work', 3, 5, 8, '1', 120, 7,
    'Mit Zusatzlast — Gürtel oder Hantel zwischen den Füßen.'),
  b(205, 'push_b', 5, '5a', 'pb5', 'kabelzug-fly', 'work', 3, 12, 15, '0-1', 60, 9, null),
  b(206, 'push_b', 6, '5b', 'pb5', 'trizeps-ueberkopf-kabel', 'work', 3, 10, 12, '0-1', 60, 0, null),
  b(207, 'push_b', 7, '6', null, 'seitheben-kabel', 'work', 4, 12, 20, '0-1', 45, 6, null),
  b(208, 'push_b', 8, '7a', 'pb7', 'ab-wheel', 'abs', 4, 8, 12, '1', 45, 8, null),
  b(209, 'push_b', 9, '7b', 'pb7', 'hollow-hold', 'abs', 4, 20, 30, '1', 45, 0, null),

  /* --- Pull ------------------------------------------------------------- */
  b(301, 'pull', 1, '1', null, null, 'warmup', null, null, null, null, null, 6,
    'Hängen 30 s, Bandzüge, Schulterblatt-Klimmzüge 2 × 8.'),
  b(302, 'pull', 2, '2', null, null, 'muscleup', null, null, null, '2-3', 90, 12,
    'Inhalt nach Phase — die Übungen stehen auf dem Muscle-Up-Schirm.'),
  b(303, 'pull', 3, '3', null, 'klimmzuege-zusatzlast', 'work', 4, 4, 6, '1', 150, 11,
    'Brustbein zur Stange.'),
  b(304, 'pull', 4, '4', null, 'langhantelrudern', 'work', 4, 6, 8, '2', 120, 9, null),
  b(305, 'pull', 5, '5a', 'pl5', 'ringrudern', 'work', 3, 10, 12, '1', 45, 11,
    'Alternative bei besetzten Ringen: Latzug eng, gleiche Vorgabe.'),
  b(306, 'pull', 6, '5b', 'pl5', 'face-pull', 'work', 3, 15, 20, '0-1', 45, 0, null),
  b(307, 'pull', 7, '5c', 'pl5', 'hammercurl', 'work', 3, 8, 12, '0-1', 45, 0, null),
  b(308, 'pull', 8, '6', null, 'haengendes-beinheben', 'abs', 4, 8, 12, '1', 45, 8, null),

  /* --- Beine A ---------------------------------------------------------- */
  b(401, 'legs_a', 1, '1', null, null, 'warmup', null, null, null, null, null, 6,
    'Seilspringen 2 Min, Hüftmobilisation, 3 Steigerungssätze Kniebeuge.'),
  b(402, 'legs_a', 2, '2', null, 'kniebeuge-hinten', 'work', 5, 5, 7, '2', 165, 15, null),
  b(403, 'legs_a', 3, '3', null, 'rumaenisches-kreuzheben', 'work', 4, 8, 10, '2', 120, 9, null),
  b(404, 'legs_a', 4, '4', null, 'bulgarischer-split-squat', 'work', 3, 10, 12, '1', 90, 10, null),
  b(405, 'legs_a', 5, '5a', 'la5', 'nordic-curl', 'work', 3, 5, 8, '1', 60, 9,
    'Füße unter beladener Langhantel.'),
  b(406, 'legs_a', 6, '5b', 'la5', 'wadenheben-stehend', 'work', 3, 10, 15, '0-1', 60, 0, null),
  b(407, 'legs_a', 7, '6a', 'la6', 'pallof-press', 'abs', 3, 10, 10, '1', 45, 8, null),
  b(408, 'legs_a', 8, '6b', 'la6', 'koffertragen', 'abs', 3, 30, 30, '1', 45, 0,
    '30 m je Satz, Seite wechseln.'),

  /* --- Beine B ---------------------------------------------------------- */
  b(501, 'legs_b', 1, '1', null, null, 'warmup', null, null, null, null, null, 7,
    'Seilspringen 3 Min, Katze-Kuh, Hüftöffner, 3 Steigerungssätze Kreuzheben.'),
  b(502, 'legs_b', 2, '2', null, 'kreuzheben', 'work', 5, 3, 5, '2', 180, 16, null),
  b(503, 'legs_b', 3, '3', null, 'hip-thrust', 'work', 3, 8, 12, '1', 90, 7, null),
  b(504, 'legs_b', 4, '4', null, 'gehende-ausfallschritte', 'work', 3, 10, 10, '1', 90, 8,
    'Zehn Schritte je Bein, ohne Zwischenstopp.'),
  b(505, 'legs_b', 5, '5a', 'lb5', 'kettlebell-swing', 'work', 3, 12, 15, '1', 60, 9, null),
  b(506, 'legs_b', 6, '5b', 'lb5', 'wadenheben-einbeinig', 'work', 3, 12, 15, '0-1', 60, 0, null),
  b(507, 'legs_b', 7, '6', null, 'kabel-crunch', 'abs', 4, 10, 12, '0-1', 45, 8, null)
]

function b(
  id: number,
  template_id: VorlageId,
  ordinal: number,
  label: string,
  superset_group: string | null,
  exercise_id: string | null,
  kind: Block['kind'],
  target_sets: number | null,
  rep_min: number | null,
  rep_max: number | null,
  target_rir: string | null,
  rest_seconds: number | null,
  planned_minutes: number,
  note: string | null
): Block {
  return {
    id,
    template_id,
    ordinal,
    label,
    superset_group,
    exercise_id,
    kind,
    target_sets,
    rep_min,
    rep_max,
    target_rir,
    rest_seconds,
    planned_minutes,
    note
  }
}

/* --- Achttagezyklus ------------------------------------------------------ */

/** Position 1..8; null ist ein Pausentag. */
export const ZYKLUS: (VorlageId | null)[] = [
  'push_a',
  'pull',
  'legs_a',
  null,
  'push_b',
  'pull',
  'legs_b',
  null
]

/* --- Muscle-Up ---------------------------------------------------------- */

export const MU_BLOECKE: MuscleUpBlock[] = [
  {
    id: 1,
    name: 'Zugkraft und Falschgriff',
    week_from: 1,
    week_to: 4,
    gate: '5 Klimmzüge mit +10 kg, und die explosiven Wiederholungen treffen das Brustbein.'
  },
  {
    id: 2,
    name: 'Der Übergang',
    week_from: 5,
    week_to: 8,
    gate: '3 kontrollierte Negative ohne Einbruch im Übergang.'
  },
  {
    id: 3,
    name: 'Die ganze Bewegung',
    week_from: 9,
    week_to: 12,
    gate: 'Erster Ring-Muscle-Up, danach Übertrag auf die Stange.'
  }
]

export const MU_UEBUNGEN: MuscleUpDrill[] = [
  {
    id: 1,
    block_id: 1,
    ordinal: 1,
    name: 'Explosive Klimmzüge',
    prescription: '6 × 3',
    cue: 'Satz endet, sobald die Geschwindigkeit nachlässt — auch nach zwei Wiederholungen.'
  },
  {
    id: 2,
    block_id: 1,
    ordinal: 2,
    name: 'Falschgriff-Hang an den Ringen',
    prescription: '4 × 20–30 s',
    cue: 'Handgelenk über den Ring, Ring in der Handwurzel. Brennt, gehört dazu.'
  },
  {
    id: 3,
    block_id: 2,
    ordinal: 1,
    name: 'Negative Ring-Muscle-Ups vom Kasten',
    prescription: '5 × 3',
    cue: 'Abstieg 4–5 s, im Übergang nicht durchrutschen.'
  },
  {
    id: 4,
    block_id: 2,
    ordinal: 2,
    name: 'Übergangswiederholungen mit Fußkontakt',
    prescription: '4 × 5',
    cue: 'Füße geben nur so viel, wie der Übergang braucht.'
  },
  {
    id: 5,
    block_id: 2,
    ordinal: 3,
    name: 'Explosive Klimmzüge',
    prescription: '3 × 3',
    cue: 'Kurz halten, Qualität vor Zahl.'
  },
  {
    id: 6,
    block_id: 3,
    ordinal: 1,
    name: 'Versuche',
    prescription: '6 × 1',
    cue: '2–3 Minuten Pause. Jeder Versuch frisch.'
  },
  {
    id: 7,
    block_id: 3,
    ordinal: 2,
    name: 'Bandunterstützt an den Ringen',
    prescription: '3 × 3',
    cue: 'Band so dünn wie möglich.'
  },
  {
    id: 8,
    block_id: 3,
    ordinal: 3,
    name: 'Hohe Klimmzüge zur unteren Rippe',
    prescription: '3 × 3',
    cue: 'So hoch wie es geht, ohne den Griff zu lösen.'
  }
]

/* --- Zielkorridore ------------------------------------------------------ */

/** Gewichtete Sätze je Muskelgruppe und Woche, gegen die die App misst. */
export const ZIEL_VOLUMEN: Partial<Record<Muskelgruppe, number>> = {
  back_pull: 22,
  abs: 19,
  hamstrings_glutes: 17,
  chest: 15,
  triceps: 15,
  biceps: 15,
  quads: 12,
  side_delts: 9,
  calves: 5
}

export const MUSKEL_NAMEN: Record<Muskelgruppe, string> = {
  chest: 'Brust',
  back_pull: 'Rücken, Zug',
  side_delts: 'Seitliche Schulter',
  front_delts: 'Vordere Schulter',
  triceps: 'Trizeps',
  biceps: 'Bizeps',
  quads: 'Oberschenkel vorn',
  hamstrings_glutes: 'Beinrückseite, Gesäß',
  calves: 'Waden',
  abs: 'Bauch'
}

/** Reihenfolge in der Auswertung: nach Zielkorridor absteigend. */
export const MUSKEL_REIHENFOLGE: Muskelgruppe[] = [
  'back_pull',
  'abs',
  'hamstrings_glutes',
  'chest',
  'triceps',
  'biceps',
  'quads',
  'front_delts',
  'side_delts',
  'calves'
]

export const UEBUNG_NACH_ID: Record<string, Uebung> = Object.fromEntries(
  UEBUNGEN.map((u) => [u.id, u])
)

export const BLOCK_NACH_ID: Record<number, Block> = Object.fromEntries(
  BLOECKE.map((x) => [x.id, x])
)

export function bloeckeVon(vorlage: VorlageId): Block[] {
  return BLOECKE.filter((x) => x.template_id === vorlage).sort((a, c) => a.ordinal - c.ordinal)
}

export function vorlageVon(id: VorlageId): Vorlage {
  const v = VORLAGEN.find((x) => x.id === id)
  if (!v) throw new Error('Unbekannte Vorlage: ' + id)
  return v
}
