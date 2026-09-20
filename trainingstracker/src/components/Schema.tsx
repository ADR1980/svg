/* ==========================================================================
   Schematische Darstellung der Übungen.

   Eine Zeichnung je Bewegungsmuster, aus Gelenkpunkten gebaut: helle Linie =
   Ausgangslage, dunkle Linie = Endlage, Akzent für Last und Richtung. Keine
   Fotos, keine Videos — im Studio reicht der Blick, der bestätigt, dass man
   an der richtigen Übung steht.
   ========================================================================== */

import type { ReactNode } from 'react'

type P = [number, number]

interface Gelenke {
  kopf: P
  schulter: P
  ellbogen: P
  hand: P
  huefte: P
  knie: P
  fuss: P
  /** Zweites Bein, nur wo die Stellung es verlangt (Ausfallschritt, Split). */
  knie2?: P
  fuss2?: P
  /** Zweiter Arm, nötig in der Frontansicht — Fliegende, Face Pull, Pallof. */
  ellbogen2?: P
  hand2?: P
}

const g = (
  kopf: P,
  schulter: P,
  ellbogen: P,
  hand: P,
  huefte: P,
  knie: P,
  fuss: P,
  knie2?: P,
  fuss2?: P
): Gelenke => ({ kopf, schulter, ellbogen, hand, huefte, knie, fuss, knie2, fuss2 })

/** Spiegelt den Arm für die Frontansicht an der Körperachse. */
const zweiarmig = (j: Gelenke): Gelenke => ({
  ...j,
  ellbogen2: [2 * j.schulter[0] - j.ellbogen[0], j.ellbogen[1]],
  hand2: [2 * j.schulter[0] - j.hand[0], j.hand[1]]
})

function Koerper({ j, hell }: { j: Gelenke; hell?: boolean }) {
  const farbe = hell ? 'var(--ink-muted)' : 'var(--ink)'
  const pfad = (punkte: P[]) => punkte.map((p) => p.join(',')).join(' ')
  return (
    <g
      fill="none"
      stroke={farbe}
      strokeWidth={hell ? 1.6 : 2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={hell ? 0.45 : 1}
    >
      <circle cx={j.kopf[0]} cy={j.kopf[1]} r={5} />
      <polyline points={pfad([j.schulter, j.huefte])} />
      <polyline points={pfad([j.schulter, j.ellbogen, j.hand])} />
      <polyline points={pfad([j.huefte, j.knie, j.fuss])} />
      {j.knie2 && j.fuss2 && <polyline points={pfad([j.huefte, j.knie2, j.fuss2])} />}
      {j.ellbogen2 && j.hand2 && <polyline points={pfad([j.schulter, j.ellbogen2, j.hand2])} />}
    </g>
  )
}

/** Die Last am Griff: Langhantel im Anschnitt, Kurzhantel, Kugel, Griff. */
function Last({ p, art = 'lang' }: { p: P; art?: 'lang' | 'kurz' | 'kugel' | 'griff' | 'ring' }) {
  const [x, y] = p
  if (art === 'kurz') {
    return (
      <g fill="var(--accent)">
        <rect x={x - 5} y={y - 3} width={10} height={6} rx={1} />
      </g>
    )
  }
  if (art === 'kugel') {
    return (
      <g fill="var(--accent)" stroke="var(--accent)" strokeWidth={1.6} fillOpacity={0.9}>
        <circle cx={x} cy={y + 4} r={5} />
        <path d="M0 0" />
        <polyline points={`${x - 3},${y} ${x - 3},${y - 3} ${x + 3},${y - 3} ${x + 3},${y}`} fill="none" />
      </g>
    )
  }
  if (art === 'griff') {
    return <rect x={x - 2} y={y - 5} width={4} height={10} rx={2} fill="var(--accent)" />
  }
  if (art === 'ring') {
    return <circle cx={x} cy={y} r={5} fill="none" stroke="var(--accent)" strokeWidth={2} />
  }
  return (
    <g fill="var(--accent)">
      <circle cx={x} cy={y} r={4.5} />
      <circle cx={x} cy={y} r={7.5} fill="none" stroke="var(--accent)" strokeWidth={1.4} />
    </g>
  )
}

function Pfeil({ von, bis }: { von: P; bis: P }) {
  return (
    <line
      x1={von[0]}
      y1={von[1]}
      x2={bis[0]}
      y2={bis[1]}
      stroke="var(--accent)"
      strokeWidth={1.8}
      markerEnd="url(#spitze)"
    />
  )
}

function Strich({ von, bis }: { von: P; bis: P }) {
  return (
    <line
      x1={von[0]}
      y1={von[1]}
      x2={bis[0]}
      y2={bis[1]}
      stroke="var(--rule)"
      strokeWidth={2.4}
      strokeLinecap="round"
    />
  )
}

const BODEN = <Strich von={[6, 84]} bis={[114, 84]} />

/** Das Seil eines Kabelzugs, damit die Richtung des Widerstands sichtbar ist. */
function Seil({ von, bis, hell }: { von: P; bis: P; hell?: boolean }) {
  return (
    <line
      x1={von[0]}
      y1={von[1]}
      x2={bis[0]}
      y2={bis[1]}
      stroke="var(--accent)"
      strokeWidth={1.2}
      opacity={hell ? 0.3 : 0.6}
    />
  )
}

/* --- Die Muster ---------------------------------------------------------- */

interface Muster {
  kulisse?: ReactNode
  start: Gelenke
  ende: Gelenke
  /** Last an der Hand, sofern die Übung eine trägt. */
  last?: 'lang' | 'kurz' | 'kugel' | 'griff' | 'ring'
  /** Wo die Last sitzt — die Kniebeuge trägt sie auf der Schulter. */
  lastAn?: 'hand' | 'schulter' | 'huefte'
  /** Umlenkpunkt eines Kabelzugs; von dort läuft ein Seil zur Hand. */
  kabel?: P
  /** Zusätzliche Last an der Ausgangslage zeichnen. */
  lastStart?: boolean
  pfeil?: [P, P]
  zusatz?: ReactNode
}

const MUSTER: Record<string, Muster> = {
  /* Drücken liegend: Bank waagerecht, Hantel über der Brust nach oben. */
  bankdruecken: {
    kulisse: (
      <>
        {BODEN}
        <Strich von={[24, 56]} bis={[92, 56]} />
        <Strich von={[32, 56]} bis={[32, 84]} />
        <Strich von={[84, 56]} bis={[84, 84]} />
      </>
    ),
    start: g([30, 50], [44, 52], [36, 44], [46, 44], [72, 54], [84, 68], [92, 84]),
    ende: g([30, 50], [44, 52], [46, 38], [48, 24], [72, 54], [84, 68], [92, 84]),
    last: 'lang',
    lastStart: true,
    pfeil: [[64, 44], [64, 26]]
  },

  /* Schrägbank: dieselbe Bewegung, Lehne auf dreißig Grad. */
  schraegbank: {
    kulisse: (
      <>
        {BODEN}
        <Strich von={[30, 68]} bis={[88, 44]} />
        <Strich von={[40, 64]} bis={[40, 84]} />
        <Strich von={[80, 48]} bis={[80, 84]} />
      </>
    ),
    start: g([84, 34], [74, 44], [66, 40], [72, 34], [46, 54], [40, 68], [30, 78]),
    ende: g([84, 34], [74, 44], [72, 32], [70, 20], [46, 54], [40, 68], [30, 78]),
    last: 'lang',
    lastStart: true,
    pfeil: [[86, 36], [84, 22]]
  },

  /* Fliegende am Kabel, von vorn: Arme weit, dann tief vor dem Körper. */
  fly: {
    kulisse: (
      <>
        {BODEN}
        <Strich von={[10, 12]} bis={[10, 72]} />
        <Strich von={[110, 12]} bis={[110, 72]} />
      </>
    ),
    start: zweiarmig(g([60, 16], [60, 28], [42, 26], [24, 26], [60, 52], [56, 68], [52, 84], [64, 68], [68, 84])),
    ende: zweiarmig(g([60, 16], [60, 28], [50, 40], [58, 52], [60, 52], [56, 68], [52, 84], [64, 68], [68, 84])),
    last: 'griff',
    lastStart: true,
    pfeil: [[30, 34], [52, 50]],
    zusatz: (
      <g stroke="var(--accent)" strokeWidth={1.2} opacity={0.5}>
        <line x1={10} y1={26} x2={24} y2={26} />
        <line x1={110} y1={26} x2={96} y2={26} />
        <line x1={10} y1={26} x2={58} y2={52} />
        <line x1={110} y1={26} x2={62} y2={52} />
      </g>
    )
  },

  /* Drücken über Kopf, stehend. */
  schulterdruecken: {
    kulisse: BODEN,
    start: g([54, 22], [54, 32], [44, 38], [46, 30], [54, 54], [56, 68], [58, 84]),
    ende: g([54, 22], [54, 32], [50, 22], [48, 10], [54, 54], [56, 68], [58, 84]),
    last: 'lang',
    lastStart: true,
    pfeil: [[70, 30], [70, 12]]
  },

  /* Dips an der geraden Stange. */
  /*
   * Dips als Doppellage sind unlesbar: oben und unten steht der Körper fast
   * senkrecht, die beiden Lagen decken einander. Gezeigt wird die tiefe
   * Position — die ist der Punkt der Übung — und der Weg nach oben.
   */
  dips: {
    kulisse: (
      <>
        {BODEN}
        <Strich von={[18, 30]} bis={[46, 30]} />
        <Strich von={[68, 30]} bis={[98, 30]} />
      </>
    ),
    start: g([62, 46], [58, 54], [42, 46], [56, 30], [58, 72], [48, 80], [36, 74]),
    ende: g([62, 46], [58, 54], [42, 46], [56, 30], [58, 72], [48, 80], [36, 74]),
    pfeil: [[84, 58], [84, 38]],
    zusatz: <Last p={[56, 30]} art="griff" />
  },

  /* Trizeps über Kopf am Kabel. */
  trizeps: {
    kulisse: (
      <>
        {BODEN}
        <Strich von={[106, 8]} bis={[106, 44]} />
      </>
    ),
    start: g([52, 22], [52, 32], [62, 18], [74, 28], [52, 54], [54, 68], [56, 84]),
    ende: g([52, 22], [52, 32], [62, 18], [82, 12], [52, 54], [54, 68], [56, 84]),
    last: 'griff',
    lastStart: true,
    kabel: [106, 12],
    pfeil: [[78, 34], [88, 18]]
  },

  /* Seitheben, von vorn. */
  seitheben: {
    kulisse: (
      <>
        {BODEN}
        <Strich von={[108, 20]} bis={[108, 76]} />
      </>
    ),
    start: g([60, 16], [60, 26], [66, 38], [70, 50], [60, 52], [56, 68], [52, 84], [64, 68], [68, 84]),
    ende: g([60, 16], [60, 26], [78, 26], [96, 26], [60, 52], [56, 68], [52, 84], [64, 68], [68, 84]),
    last: 'griff',
    lastStart: true,
    kabel: [108, 62],
    pfeil: [[80, 46], [94, 32]]
  },

  /* Klimmzug: unten aushängen, oben Brustbein zur Stange. */
  klimmzug: {
    kulisse: <Strich von={[20, 14]} bis={[100, 14]} />,
    start: g([58, 34], [58, 44], [58, 30], [58, 16], [58, 66], [56, 80], [60, 88]),
    ende: g([58, 18], [58, 28], [48, 24], [58, 16], [58, 50], [54, 64], [58, 72]),
    pfeil: [[82, 44], [82, 26]],
    zusatz: <Last p={[58, 16]} art="griff" />
  },

  /* Langhantelrudern, Oberkörper zwischen dreißig und fünfundvierzig Grad. */
  rudern: {
    kulisse: BODEN,
    start: g([30, 30], [42, 36], [44, 50], [44, 64], [70, 48], [72, 66], [74, 84]),
    ende: g([30, 30], [42, 36], [50, 46], [46, 52], [70, 48], [72, 66], [74, 84]),
    last: 'lang',
    lastStart: true,
    pfeil: [[30, 62], [30, 50]]
  },

  /* Ringrudern: Körper eine Linie, Ringe zum Rippenbogen. */
  ringrudern: {
    kulisse: (
      <>
        {BODEN}
        <Strich von={[88, 6]} bis={[88, 24]} />
      </>
    ),
    start: g([84, 40], [72, 46], [80, 34], [88, 24], [44, 62], [28, 72], [14, 80]),
    ende: g([88, 26], [76, 32], [64, 28], [88, 24], [48, 48], [30, 60], [14, 70]),
    pfeil: [[56, 76], [66, 60]],
    zusatz: <Last p={[88, 24]} art="ring" />
  },

  /* Latzug eng, sitzend. */
  latzug: {
    kulisse: (
      <>
        {BODEN}
        <Strich von={[54, 6]} bis={[54, 12]} />
        <Strich von={[34, 62]} bis={[74, 62]} />
        <Strich von={[40, 62]} bis={[40, 84]} />
      </>
    ),
    start: g([52, 30], [52, 40], [56, 28], [58, 16], [52, 60], [74, 66], [88, 80]),
    ende: g([52, 30], [52, 40], [44, 42], [56, 46], [52, 60], [74, 66], [88, 80]),
    last: 'lang',
    lastStart: true,
    kabel: [54, 10],
    pfeil: [[74, 22], [70, 42]]
  },

  /* Face Pull: Seil auf Augenhöhe, Ellbogen nach hinten. */
  facepull: {
    kulisse: (
      <>
        {BODEN}
        <Strich von={[108, 10]} bis={[108, 44]} />
      </>
    ),
    start: zweiarmig(g([54, 20], [54, 30], [68, 24], [84, 20], [54, 54], [50, 68], [46, 84], [58, 68], [62, 84])),
    ende: zweiarmig(g([54, 20], [54, 30], [40, 18], [56, 14], [54, 54], [50, 68], [46, 84], [58, 68], [62, 84])),
    last: 'griff',
    lastStart: true,
    kabel: [108, 18],
    pfeil: [[86, 34], [64, 26]]
  },

  /* Curl mit Kurzhanteln. */
  curl: {
    kulisse: BODEN,
    start: g([54, 20], [54, 30], [56, 44], [58, 56], [54, 54], [56, 68], [58, 84]),
    ende: g([54, 20], [54, 30], [58, 44], [48, 36], [54, 54], [56, 68], [58, 84]),
    last: 'kurz',
    lastStart: true,
    pfeil: [[74, 54], [70, 38]]
  },

  /* Kniebeuge hinten: Stange auf dem hinteren Deltoid, unter Parallele. */
  kniebeuge: {
    kulisse: BODEN,
    start: g([56, 16], [56, 28], [48, 34], [44, 28], [56, 50], [58, 66], [58, 84]),
    ende: g([44, 34], [48, 46], [42, 54], [38, 48], [50, 64], [64, 70], [58, 84]),
    last: 'lang',
    lastAn: 'schulter',
    lastStart: true,
    pfeil: [[84, 36], [84, 58]]
  },

  /* Hüftbeuge: rumänisches Kreuzheben, Kreuzheben, Swing. */
  hinge: {
    kulisse: BODEN,
    start: g([56, 16], [56, 26], [56, 40], [56, 52], [56, 50], [58, 66], [58, 84]),
    ende: g([32, 34], [42, 40], [46, 54], [48, 68], [66, 52], [64, 68], [60, 84]),
    last: 'lang',
    lastStart: true,
    pfeil: [[84, 34], [84, 58]]
  },

  /* Ausfallschritt und bulgarischer Split Squat. */
  ausfallschritt: {
    kulisse: BODEN,
    start: g([54, 16], [54, 26], [48, 38], [46, 50], [54, 50], [36, 66], [30, 84], [72, 66], [78, 84]),
    ende: g([54, 26], [54, 36], [48, 48], [46, 60], [54, 60], [34, 70], [28, 84], [74, 74], [82, 84]),
    last: 'kurz',
    lastStart: true,
    pfeil: [[92, 40], [92, 60]]
  },

  /* Hip Thrust: Schulterblätter auf der Bank, Hüfte hoch. */
  hipthrust: {
    kulisse: (
      <>
        {BODEN}
        <Strich von={[12, 50]} bis={[44, 50]} />
        <Strich von={[18, 50]} bis={[18, 84]} />
      </>
    ),
    start: g([22, 40], [34, 48], [40, 58], [46, 64], [64, 74], [84, 72], [92, 84]),
    ende: g([22, 40], [34, 48], [40, 54], [46, 58], [64, 56], [84, 64], [92, 84]),
    last: 'lang',
    lastAn: 'huefte',
    lastStart: true,
    pfeil: [[64, 72], [64, 52]]
  },

  /* Nordic Curl: Füße fixiert, Oberkörper bremst nach vorn. */
  nordic: {
    kulisse: (
      <>
        {BODEN}
        <Last p={[92, 78]} art="lang" />
      </>
    ),
    start: g([56, 18], [56, 28], [50, 38], [48, 48], [56, 52], [72, 66], [90, 74]),
    ende: g([26, 34], [36, 40], [30, 50], [26, 58], [56, 56], [72, 66], [90, 74]),
    pfeil: [[42, 26], [24, 44]]
  },

  /* Kettlebell Swing: Hüftstoß, Kugel bis Brusthöhe. */
  swing: {
    kulisse: BODEN,
    start: g([36, 34], [46, 40], [54, 52], [58, 64], [70, 50], [70, 68], [64, 84]),
    ende: g([56, 16], [56, 26], [48, 32], [34, 32], [56, 52], [58, 68], [58, 84]),
    last: 'kugel',
    lastStart: true,
    pfeil: [[52, 62], [38, 40]]
  },

  /* Wadenheben: Ferse tief, dann hoch. */
  waden: {
    kulisse: (
      <>
        {BODEN}
        <Strich von={[46, 78]} bis={[74, 78]} />
      </>
    ),
    start: g([56, 18], [56, 28], [50, 40], [48, 52], [56, 52], [58, 66], [62, 84]),
    ende: g([56, 12], [56, 22], [50, 34], [48, 46], [56, 46], [58, 60], [62, 78]),
    last: 'kurz',
    lastStart: true,
    pfeil: [[86, 62], [86, 46]]
  },

  /* Ab Wheel: aus dem Knien nach vorn ausrollen. */
  abwheel: {
    kulisse: BODEN,
    start: g([44, 40], [50, 48], [56, 60], [62, 72], [56, 62], [70, 74], [86, 80]),
    ende: g([24, 56], [34, 60], [22, 66], [14, 72], [58, 66], [72, 76], [86, 80]),
    pfeil: [[62, 82], [20, 82]],
    zusatz: (
      <g>
        <circle cx={62} cy={74} r={6} fill="none" stroke="var(--accent)" strokeWidth={1.4} opacity={0.45} />
        <circle cx={14} cy={74} r={6} fill="none" stroke="var(--accent)" strokeWidth={2} />
      </g>
    )
  },

  /* Hollow Hold: halten, keine zweite Lage. */
  hollow: {
    kulisse: BODEN,
    start: g([30, 62], [42, 66], [32, 58], [22, 54], [70, 72], [88, 66], [102, 62]),
    ende: g([30, 62], [42, 66], [32, 58], [22, 54], [70, 72], [88, 66], [102, 62]),
    zusatz: (
      <text x={60} y={30} fontFamily="IBM Plex Mono, monospace" fontSize={11} fill="var(--accent)" textAnchor="middle">
        halten
      </text>
    )
  },

  /* Hängendes Beinheben. */
  beinheben: {
    kulisse: <Strich von={[24, 12]} bis={[96, 12]} />,
    start: g([58, 30], [58, 40], [58, 26], [58, 14], [58, 60], [58, 74], [60, 86]),
    ende: g([58, 30], [58, 40], [58, 26], [58, 14], [58, 60], [78, 56], [96, 50]),
    pfeil: [[72, 82], [88, 62]],
    zusatz: <Last p={[58, 14]} art="griff" />
  },

  /* Gewichteter Crunch am Kabel, kniend. */
  kabelcrunch: {
    kulisse: (
      <>
        {BODEN}
        <Strich von={[102, 6]} bis={[102, 16]} />
      </>
    ),
    start: g([52, 24], [52, 34], [62, 26], [72, 20], [52, 60], [70, 72], [86, 78]),
    ende: g([44, 44], [48, 50], [56, 38], [70, 22], [52, 62], [70, 72], [86, 78]),
    last: 'griff',
    lastStart: true,
    kabel: [102, 10],
    pfeil: [[38, 32], [34, 52]]
  },

  /* Pallof Press: gegen die Rotation halten, von vorn. */
  pallof: {
    kulisse: (
      <>
        {BODEN}
        <Strich von={[108, 18]} bis={[108, 64]} />
      </>
    ),
    start: g([54, 18], [54, 30], [64, 34], [70, 40], [54, 54], [50, 68], [46, 84], [60, 68], [64, 84]),
    ende: g([54, 18], [54, 30], [74, 36], [92, 40], [54, 54], [50, 68], [46, 84], [60, 68], [64, 84]),
    last: 'griff',
    lastStart: true,
    kabel: [108, 40],
    pfeil: [[76, 50], [94, 50]]
  },

  /* Koffertragen: eine Kugel, Schultern waagerecht, laufen. */
  koffertragen: {
    kulisse: BODEN,
    start: g([54, 16], [54, 26], [66, 38], [70, 52], [54, 52], [46, 68], [40, 84], [62, 68], [68, 84]),
    ende: g([54, 16], [54, 26], [66, 38], [70, 52], [54, 52], [46, 68], [40, 84], [62, 68], [68, 84]),
    zusatz: (
      <>
        <Last p={[70, 58]} art="kugel" />
        <Pfeil von={[16, 72]} bis={[34, 72]} />
      </>
    )
  }
}

/** Welche Übung zeigt welches Muster. */
const ZUORDNUNG: Record<string, keyof typeof MUSTER> = {
  'bankdruecken-lh': 'bankdruecken',
  'bankdruecken-kh': 'bankdruecken',
  'schraegbankdruecken-kh': 'schraegbank',
  'kabelzug-fly': 'fly',
  'schulterdruecken-lh': 'schulterdruecken',
  'schulterdruecken-kh': 'schulterdruecken',
  'dips-stange': 'dips',
  'trizeps-ueberkopf-kabel': 'trizeps',
  'seitheben-kabel': 'seitheben',
  'klimmzuege-zusatzlast': 'klimmzug',
  langhantelrudern: 'rudern',
  ringrudern: 'ringrudern',
  'latzug-eng': 'latzug',
  'face-pull': 'facepull',
  hammercurl: 'curl',
  'kniebeuge-hinten': 'kniebeuge',
  'rumaenisches-kreuzheben': 'hinge',
  kreuzheben: 'hinge',
  'bulgarischer-split-squat': 'ausfallschritt',
  'gehende-ausfallschritte': 'ausfallschritt',
  'hip-thrust': 'hipthrust',
  'nordic-curl': 'nordic',
  'kettlebell-swing': 'swing',
  'wadenheben-stehend': 'waden',
  'wadenheben-einbeinig': 'waden',
  'ab-wheel': 'abwheel',
  'hollow-hold': 'hollow',
  'haengendes-beinheben': 'beinheben',
  'kabel-crunch': 'kabelcrunch',
  'pallof-press': 'pallof',
  koffertragen: 'koffertragen'
}

export function Schema({ uebungId, breite = 120 }: { uebungId: string; breite?: number }) {
  const muster = MUSTER[ZUORDNUNG[uebungId]]
  if (!muster) return null
  const last = muster.last

  return (
    <svg
      viewBox="0 0 120 90"
      width={breite}
      height={(breite * 90) / 120}
      role="img"
      aria-label="Schematische Darstellung der Übung"
      style={{ display: 'block' }}
    >
      <defs>
        <marker id="spitze" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
        </marker>
      </defs>
      {muster.kulisse}
      {muster.kabel && <Seil von={muster.kabel} bis={griff(muster.start, muster)} hell />}
      <Koerper j={muster.start} hell />
      {last && muster.lastStart && (
        <g opacity={0.45}>
          <Last p={griff(muster.start, muster)} art={last} />
        </g>
      )}
      {muster.kabel && <Seil von={muster.kabel} bis={griff(muster.ende, muster)} />}
      <Koerper j={muster.ende} />
      {last && <Last p={griff(muster.ende, muster)} art={last} />}
      {muster.zusatz}
      {muster.pfeil && <Pfeil von={muster.pfeil[0]} bis={muster.pfeil[1]} />}
    </svg>
  )
}

function griff(j: Gelenke, m: Muster): P {
  if (m.lastAn === 'schulter') return j.schulter
  if (m.lastAn === 'huefte') return j.huefte
  return j.hand
}

export function hatSchema(uebungId: string | null | undefined): boolean {
  return Boolean(uebungId && ZUORDNUNG[uebungId])
}
