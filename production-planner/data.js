// ATC Produktionsplanungstool - Stammdaten
// Basierend auf VL-0006-A Projektübersicht 2026
// Letzte Bearbeitung: 04.02.2026 durch Philipp Engelbreit

const ATC_DATA = {
  customers: [
    { id: '10024', name: 'Menze Kunststofftechnik GmbH', contact: '', email: '', phone: '', contactEmail: '', password: '' },
    { id: '10023', name: 'MAM Electronic', contact: '', email: '', phone: '', contactEmail: '', password: '' },
    { id: '10022', name: 'Hans Mayer Elektrotechnik GmbH', contact: '', email: '', phone: '', contactEmail: '', password: '' },
    { id: '10021', name: 'BA Clearance GmbH', contact: '', email: '', phone: '', contactEmail: '', password: '' },
    { id: '10016', name: 'EP Arms GmbH', contact: '', email: '', phone: '', contactEmail: 'info@eparms.de', password: 'eparms2026' },
    { id: '10002', name: 'ATC SiPro GmbH', contact: '', email: '', phone: '', contactEmail: '', password: '' },
    { id: '10001', name: '1 MOA GmbH', contact: '', email: '', phone: '', contactEmail: '', password: '' }
  ],

  progressScales: {
    konstruktion: [
      { value: 0.00, label: 'Projekt noch nicht begonnen' },
      { value: 0.05, label: 'CAD Daten vorbereitet' },
      { value: 0.25, label: 'Konstruktion fertig' },
      { value: 0.50, label: 'Konstruktion fertig gestellt, Material- und Normteilbestellung' },
      { value: 0.75, label: 'Konstruktion fertig gestellt, Erstellen der Zeichnungen' },
      { value: 1.00, label: 'Konstruktion bereit für Fertigung' }
    ],
    fertigung: [
      { value: 0.00, label: 'Projekt noch nicht begonnen' },
      { value: 0.05, label: 'CAD Daten vorbereitet' },
      { value: 0.25, label: 'Materialzuschnitt und Vorbereitung' },
      { value: 0.50, label: 'Erstellen der Fräsprogramme' },
      { value: 0.75, label: 'Bearbeitung' },
      { value: 1.00, label: 'Fertigstellung für Montage' }
    ],
    montage: [
      { value: 0.00, label: 'Projekt noch nicht begonnen' },
      { value: 0.05, label: 'Auftrag in Montage eingegangen' },
      { value: 0.25, label: 'Anfertigung und Montage des Grundgestelles' },
      { value: 0.50, label: 'Anfertigung und Montage der Schutzumhausung und Pneumatikversorgung' },
      { value: 0.75, label: 'Montage der Vorrichtung, Feinjustage sofern Bauteile vorhanden' },
      { value: 1.00, label: 'Fertigstellung und Auslieferung' }
    ]
  },

  // Projekt-Status-Optionen
  projectStatuses: [
    'Angebot',
    'Auftragseingang',
    'In Produktion',
    'Qualit\u00e4tspr\u00fcfung',
    'Versandbereit',
    'Ausgeliefert',
    'Abgeschlossen'
  ],

  // Prioritäten
  priorities: ['Niedrig', 'Normal', 'Hoch', 'Dringend'],

  projects: [
    {
      id: 1,
      orderNumber: '2026010002',
      customerId: '10024',
      article: 'Eintaucharmatur Flasch PP',
      quantity: 50,
      unit: 'St\u00fcck',
      konstruktion: 0.00,
      fertigung: 0.25,
      montage: 0.00,
      // Sicherheitsaufschläge
      bufferMinutes: 0,
      bufferPercent: 0,
      // Erweiterte Felder
      status: 'In Produktion',
      priority: 'Normal',
      startDate: '',
      deadline: '',
      orderDate: '',
      deliveryDate: '',
      drawingNumber: '',
      material: 'PP (Polypropylen)',
      surfaceTreatment: '',
      toleranceClass: '',
      weight: '',
      unitPrice: 0,
      orderValue: 0,
      inspectionReq: '',
      packagingReq: '',
      deliveryAddress: '',
      internalNote: '',
      remarks: 'Material Beigestellt'
    },
    {
      id: 2,
      orderNumber: '2026010003',
      customerId: '10021',
      article: '100 Stck. TM-62 inkl. je 50 Stck. Z\u00fcnder MVCH-62 und MVP-62',
      quantity: 100,
      unit: 'St\u00fcck',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      bufferMinutes: 0, bufferPercent: 0,
      status: 'Auftragseingang',
      priority: 'Hoch',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    },
    {
      id: 3,
      orderNumber: '',
      customerId: '10023',
      article: '1.450 Stck. Ringe klein',
      quantity: 1450,
      unit: 'St\u00fcck',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      bufferMinutes: 0, bufferPercent: 0,
      status: 'Auftragseingang',
      priority: 'Normal',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    },
    {
      id: 4,
      orderNumber: '',
      customerId: '10016',
      article: 'ProLock Konterringe',
      quantity: 500,
      unit: 'St\u00fcck',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      bufferMinutes: 0, bufferPercent: 0,
      status: 'Auftragseingang',
      priority: 'Normal',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    },
    {
      id: 5,
      orderNumber: '',
      customerId: '10016',
      article: 'Spannhebel DD Sight Mag',
      quantity: 55,
      unit: 'St\u00fcck',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      bufferMinutes: 0, bufferPercent: 0,
      status: 'Auftragseingang',
      priority: 'Normal',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    },
    {
      id: 6, orderNumber: '', customerId: '10016', article: 'Klemmstein DD Sight Mag',
      quantity: 55, unit: 'St\u00fcck', konstruktion: 0.00, fertigung: 0.00, montage: 0.00,
      status: 'Auftragseingang', priority: 'Normal',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    },
    {
      id: 7, orderNumber: '', customerId: '10016', article: 'Spannschieber DD Sight Mag',
      quantity: 55, unit: 'St\u00fcck', konstruktion: 0.00, fertigung: 0.00, montage: 0.00,
      status: 'Auftragseingang', priority: 'Normal',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    },
    {
      id: 8, orderNumber: '', customerId: '10016', article: 'ProLock ZFH 51',
      quantity: 10, unit: 'St\u00fcck', konstruktion: 0.00, fertigung: 0.00, montage: 0.00,
      status: 'Auftragseingang', priority: 'Normal',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    },
    {
      id: 9, orderNumber: '', customerId: '10016', article: 'ProLock ZFH 64',
      quantity: 10, unit: 'St\u00fcck', konstruktion: 0.00, fertigung: 0.00, montage: 0.00,
      status: 'Auftragseingang', priority: 'Normal',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    },
    {
      id: 10, orderNumber: '', customerId: '10016', article: 'ProLock ZFH 61',
      quantity: 5, unit: 'St\u00fcck', konstruktion: 0.00, fertigung: 0.00, montage: 0.00,
      status: 'Auftragseingang', priority: 'Normal',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    },
    {
      id: 11, orderNumber: '', customerId: '10016', article: 'ProLock ZFH 60',
      quantity: 5, unit: 'St\u00fcck', konstruktion: 0.00, fertigung: 0.00, montage: 0.00,
      status: 'Auftragseingang', priority: 'Normal',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    },
    {
      id: 12, orderNumber: '', customerId: '10016', article: 'ProLock ZFH 56',
      quantity: 10, unit: 'St\u00fcck', konstruktion: 0.00, fertigung: 0.00, montage: 0.00,
      status: 'Auftragseingang', priority: 'Normal',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    },
    {
      id: 13, orderNumber: '', customerId: '10016', article: 'ProLock ZFH 54',
      quantity: 2, unit: 'St\u00fcck', konstruktion: 0.00, fertigung: 0.00, montage: 0.00,
      status: 'Auftragseingang', priority: 'Normal',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    },
    {
      id: 14, orderNumber: '', customerId: '10016', article: 'ProLock ZFH 49',
      quantity: 10, unit: 'St\u00fcck', konstruktion: 0.00, fertigung: 0.00, montage: 0.00,
      status: 'Auftragseingang', priority: 'Normal',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    },
    {
      id: 15, orderNumber: '', customerId: '10016', article: 'RotoClip ZFHL 62 + Halbschalen',
      quantity: 50, unit: 'St\u00fcck', konstruktion: 0.00, fertigung: 0.00, montage: 0.00,
      status: 'Auftragseingang', priority: 'Normal',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    },
    {
      id: 16, orderNumber: '', customerId: '10016', article: 'ProLock Ringe',
      quantity: 300, unit: 'St\u00fcck', konstruktion: 0.00, fertigung: 0.00, montage: 0.00,
      status: 'Auftragseingang', priority: 'Normal',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    },
    {
      id: 17, orderNumber: '', customerId: '10016', article: 'Roto 50 Pro Rohre',
      quantity: 50, unit: 'St\u00fcck', konstruktion: 0.00, fertigung: 0.00, montage: 0.00,
      status: 'Auftragseingang', priority: 'Normal',
      startDate: '', deadline: '', orderDate: '', deliveryDate: '',
      drawingNumber: '', material: '', surfaceTreatment: '', toleranceClass: '',
      weight: '', unitPrice: 0, orderValue: 0, inspectionReq: '', packagingReq: '',
      deliveryAddress: '', internalNote: '', remarks: ''
    }
  ],

  // Projekttypen
  projectTypes: [
    { value: 'anlage', label: 'Anlage', icon: '\u{1F3ED}', description: 'Komplette Anlage mit Baugruppen und Fertigungsteilen' },
    { value: 'baugruppe', label: 'Baugruppe', icon: '\u{1F9E9}', description: 'Funktionale Einheit aus mehreren Fertigungsteilen' },
    { value: 'fertigungsteil', label: 'Fertigungsteil', icon: '\u{2699}', description: 'Einzelnes Bauteil \u2013 kleinste produzierbare Einheit' }
  ],

  employees: [
    { id: 'PE', name: 'Philipp Engelbreit', role: 'Fertigung', pin: '1234', email: 'p.engelbreit@atc-sipro.de' },
    { id: 'AT', name: 'Arthur Thaut', role: 'Konstruktion', pin: '5678', email: 'a.thaut@atc-sipro.de' },
    { id: 'MA1', name: 'Mitarbeiter 1', role: 'Montage', pin: '1111', email: '' },
    { id: 'MA2', name: 'Mitarbeiter 2', role: 'Fertigung', pin: '2222', email: '' }
  ],

  // Admin-Passwort für Planer-Zugang (Standard: "atc2026")
  adminPassword: 'atc2026',

  // Beispiel-Arbeitsschritt-Vorlagen
  workStepTemplates: [
    { id: 'WS001', name: 'Materialzuschnitt', description: 'Zuschnitt des Rohmaterials nach Zeichnung', duration: 30, dryingTime: 0, category: 'Fertigung' },
    { id: 'WS002', name: 'CNC-Fr\u00e4sen', description: 'Fr\u00e4sbearbeitung nach CAM-Programm', duration: 60, dryingTime: 0, category: 'Fertigung' },
    { id: 'WS003', name: 'CNC-Drehen', description: 'Drehbearbeitung nach Zeichnung', duration: 45, dryingTime: 0, category: 'Fertigung' },
    { id: 'WS004', name: 'Entgraten', description: 'Entgraten und S\u00e4ubern der Werkst\u00fccke', duration: 15, dryingTime: 0, category: 'Fertigung' },
    { id: 'WS005', name: 'Oberfl\u00e4chenbehandlung', description: 'Oberfl\u00e4chenbehandlung (Eloxieren, Verzinken etc.)', duration: 20, dryingTime: 120, category: 'Fertigung' },
    { id: 'WS006', name: 'Qualit\u00e4tspr\u00fcfung', description: 'Ma\u00dfliche Pr\u00fcfung und Dokumentation', duration: 15, dryingTime: 0, category: 'Fertigung' },
    { id: 'WS007', name: 'Montage Baugruppe', description: 'Zusammenbau der Einzelteile zur Baugruppe', duration: 45, dryingTime: 0, category: 'Montage' },
    { id: 'WS008', name: 'Verpacken', description: 'Verpackung gem\u00e4\u00df Verpackungsvorschrift', duration: 10, dryingTime: 0, category: 'Montage' },
    { id: 'WS009', name: 'CAD-Konstruktion', description: 'Erstellung der 3D-CAD-Daten', duration: 120, dryingTime: 0, category: 'Konstruktion' },
    { id: 'WS010', name: 'Zeichnungserstellung', description: 'Fertigungszeichnungen aus CAD ableiten', duration: 60, dryingTime: 0, category: 'Konstruktion' }
  ],

  // Beispiel-Auftragsvorlagen
  orderTemplates: [
    {
      id: 'OT001',
      name: 'Standard Drehteil',
      description: 'Vorlage f\u00fcr einfache Drehteile mit Oberfl\u00e4chenbehandlung',
      steps: [
        { stepId: 'WS009', order: 1, dependsOn: [] },
        { stepId: 'WS010', order: 2, dependsOn: [1] },
        { stepId: 'WS001', order: 3, dependsOn: [2] },
        { stepId: 'WS003', order: 4, dependsOn: [3] },
        { stepId: 'WS004', order: 5, dependsOn: [4] },
        { stepId: 'WS005', order: 6, dependsOn: [5] },
        { stepId: 'WS006', order: 7, dependsOn: [6] },
        { stepId: 'WS008', order: 8, dependsOn: [7] }
      ]
    },
    {
      id: 'OT002',
      name: 'Fr\u00e4steil mit Montage',
      description: 'Fr\u00e4steil inkl. Baugruppenmontage',
      steps: [
        { stepId: 'WS009', order: 1, dependsOn: [] },
        { stepId: 'WS010', order: 2, dependsOn: [1] },
        { stepId: 'WS001', order: 3, dependsOn: [2] },
        { stepId: 'WS002', order: 4, dependsOn: [3] },
        { stepId: 'WS004', order: 5, dependsOn: [4] },
        { stepId: 'WS006', order: 6, dependsOn: [5] },
        { stepId: 'WS007', order: 7, dependsOn: [6] },
        { stepId: 'WS008', order: 8, dependsOn: [7] }
      ]
    }
  ],

  // Produkte - Stammdaten mit zugeordneten Arbeitsschritten
  products: [
    {
      id: 'PROD001',
      name: 'ProLock Konterring',
      articleNumber: 'PL-KR-001',
      description: 'Standard Konterring für ProLock System',
      category: 'Fertigung',
      material: 'Stahl',
      defaultSteps: [
        { stepId: 'WS001', order: 1, dependsOn: [], durationPerPiece: 5 },
        { stepId: 'WS003', order: 2, dependsOn: [1], durationPerPiece: 8 },
        { stepId: 'WS004', order: 3, dependsOn: [2], durationPerPiece: 3 },
        { stepId: 'WS005', order: 4, dependsOn: [3], durationPerPiece: 4 },
        { stepId: 'WS006', order: 5, dependsOn: [4], durationPerPiece: 2 },
        { stepId: 'WS008', order: 6, dependsOn: [5], durationPerPiece: 1 }
      ]
    },
    {
      id: 'PROD002',
      name: 'Spannhebel DD Sight',
      articleNumber: 'SH-DD-001',
      description: 'Spannhebel für DD Sight Mag System',
      category: 'Fertigung',
      material: 'Aluminium',
      defaultSteps: [
        { stepId: 'WS009', order: 1, dependsOn: [], durationPerPiece: 30 },
        { stepId: 'WS010', order: 2, dependsOn: [1], durationPerPiece: 15 },
        { stepId: 'WS001', order: 3, dependsOn: [2], durationPerPiece: 5 },
        { stepId: 'WS002', order: 4, dependsOn: [3], durationPerPiece: 20 },
        { stepId: 'WS004', order: 5, dependsOn: [4], durationPerPiece: 5 },
        { stepId: 'WS005', order: 6, dependsOn: [5], durationPerPiece: 4 },
        { stepId: 'WS006', order: 7, dependsOn: [6], durationPerPiece: 3 },
        { stepId: 'WS008', order: 8, dependsOn: [7], durationPerPiece: 2 }
      ]
    },
    {
      id: 'PROD003',
      name: 'Eintaucharmatur PP',
      articleNumber: 'EA-PP-001',
      description: 'Eintaucharmatur aus Polypropylen',
      category: 'Fertigung + Montage',
      material: 'PP (Polypropylen)',
      defaultSteps: [
        { stepId: 'WS001', order: 1, dependsOn: [], durationPerPiece: 10 },
        { stepId: 'WS002', order: 2, dependsOn: [1], durationPerPiece: 25 },
        { stepId: 'WS004', order: 3, dependsOn: [2], durationPerPiece: 5 },
        { stepId: 'WS006', order: 4, dependsOn: [3], durationPerPiece: 5 },
        { stepId: 'WS007', order: 5, dependsOn: [4], durationPerPiece: 15 },
        { stepId: 'WS008', order: 6, dependsOn: [5], durationPerPiece: 3 }
      ]
    }
  ],

  // Blocker-Gründe für Arbeitsschritte
  blockerReasons: [
    { id: 'material', label: 'Material fehlt', icon: '\u{1F4E6}' },
    { id: 'drawing', label: 'Zeichnung ausstehend', icon: '\u{1F4D0}' },
    { id: 'machine', label: 'Maschine nicht verfügbar', icon: '\u{1F527}' },
    { id: 'tool', label: 'Werkzeug fehlt', icon: '\u{1F6E0}' },
    { id: 'quality', label: 'Qualitätsproblem (Vorgänger)', icon: '\u26A0' },
    { id: 'external', label: 'Externe Zulieferung', icon: '\u{1F69A}' },
    { id: 'approval', label: 'Freigabe ausstehend', icon: '\u{1F4CB}' },
    { id: 'other', label: 'Sonstiger Grund', icon: '\u2753' }
  ],

  // Störungsarten
  disruptionTypes: [
    { id: 'machine_down', label: 'Maschinenausfall', icon: '\u{1F6A8}' },
    { id: 'material_delay', label: 'Materialverzögerung', icon: '\u{1F4E6}' },
    { id: 'employee_absent', label: 'Mitarbeiter abwesend', icon: '\u{1F937}' },
    { id: 'quality_reject', label: 'Ausschuss / Nacharbeit', icon: '\u274C' },
    { id: 'priority_change', label: 'Prioritätsänderung', icon: '\u{1F504}' },
    { id: 'other', label: 'Sonstiges', icon: '\u2753' }
  ],

  // Maschinen
  machines: [
    {
      id: 'M001', name: 'HURCO VMX60SRTi', type: '5-Achs CNC-Fr\u00e4szentrum',
      manufacturer: 'HURCO', model: 'VMX60SRTi',
      hourlyRate: 95, setupTime: 45, status: 'aktiv',
      specs: {
        travelX: 1524, travelY: 660, travelZ: 610,
        spindleSpeed: 12000, spindlePower: 26,
        toolChanger: 40, tableSize: '1524x660',
        weight: 9500, yearBuilt: 2022
      },
      location: 'Halle 1', inventoryNumber: 'INV-2022-001',
      notes: '5-Achs Simultanbearbeitung, WinMax Steuerung'
    },
    {
      id: 'M002', name: 'CNC-Drehmaschine', type: 'CNC-Drehmaschine',
      manufacturer: '', model: '',
      hourlyRate: 75, setupTime: 25, status: 'aktiv',
      specs: {}, location: 'Halle 1', inventoryNumber: '', notes: ''
    },
    {
      id: 'M003', name: 'Bands\u00e4ge', type: 'S\u00e4ge',
      manufacturer: '', model: '',
      hourlyRate: 35, setupTime: 10, status: 'aktiv',
      specs: {}, location: 'Halle 2', inventoryNumber: '', notes: ''
    },
    {
      id: 'M004', name: 'Montageplatz 1', type: 'Montage',
      manufacturer: '', model: '',
      hourlyRate: 0, setupTime: 0, status: 'aktiv',
      specs: {}, location: 'Halle 2', inventoryNumber: '', notes: ''
    }
  ]
};

// ---- Supabase Integration ----
var SUPABASE_URL = 'https://wnaozzjcasdopspnlfsy.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_XnH1vzXIHOt5SeelpigcxA_-oisjcYV';
var _supabaseClient = null;

function getSupabase() {
  if (_supabaseClient) return _supabaseClient;
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    _supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabaseClient;
}

// Storage-Helfer (Hybrid: localStorage Cache + Supabase Persistence)
const Storage = {
  _prefix: 'atc_prod_',
  _initialized: false,
  _syncQueue: [],
  _syncTimer: null,

  // Synchron: localStorage als Cache
  save(key, data) {
    localStorage.setItem(this._prefix + key, JSON.stringify(data));
    this._syncToSupabase(key, data);
  },

  load(key, fallback) {
    if (fallback === undefined) fallback = null;
    const raw = localStorage.getItem(this._prefix + key);
    return raw ? JSON.parse(raw) : fallback;
  },

  remove(key) {
    localStorage.removeItem(this._prefix + key);
    this._deleteFromSupabase(key);
  },

  // Async: Supabase-Sync (fire-and-forget, gebündelt)
  _syncToSupabase(key, data) {
    var sb = getSupabase();
    if (!sb) return;
    // Debounce: gleichen Key in Queue ersetzen
    this._syncQueue = this._syncQueue.filter(function(item) { return item.key !== key; });
    this._syncQueue.push({ key: key, value: data });
    if (this._syncTimer) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(this._flushSync.bind(this), 300);
  },

  _flushSync() {
    var sb = getSupabase();
    if (!sb || this._syncQueue.length === 0) return;
    var batch = this._syncQueue.slice();
    this._syncQueue = [];
    batch.forEach(function(item) {
      sb.from('app_data')
        .upsert({ key: item.key, value: item.value }, { onConflict: 'key' })
        .then(function(res) {
          if (res.error) {
            console.warn('[Supabase] Sync-Fehler für Key "' + item.key + '":', res.error.message);
          }
        });
    });
  },

  _deleteFromSupabase(key) {
    var sb = getSupabase();
    if (!sb) return;
    sb.from('app_data').delete().eq('key', key).then(function(res) {
      if (res.error) console.warn('[Supabase] Delete-Fehler:', res.error.message);
    });
  },

  // Initialisierung: Alle Daten von Supabase laden und in localStorage cachen
  initFromSupabase() {
    var sb = getSupabase();
    if (!sb) {
      console.warn('[Supabase] Client nicht verfügbar, nutze nur localStorage.');
      this._initialized = true;
      return Promise.resolve();
    }
    var self = this;
    return sb.from('app_data')
      .select('key, value')
      .then(function(res) {
        if (res.error) {
          console.warn('[Supabase] Laden fehlgeschlagen:', res.error.message);
          self._initialized = true;
          return;
        }
        var rows = res.data || [];
        if (rows.length > 0) {
          console.log('[Supabase] ' + rows.length + ' Einträge von Supabase geladen.');
          rows.forEach(function(row) {
            localStorage.setItem(self._prefix + row.key, JSON.stringify(row.value));
          });
        } else {
          // Erstbefüllung: alle localStorage-Daten nach Supabase schreiben
          console.log('[Supabase] Keine Daten in Supabase, führe Erstbefüllung durch...');
          self._seedSupabase();
        }
        self._initialized = true;
      })
      .catch(function(err) {
        console.warn('[Supabase] Verbindungsfehler:', err);
        self._initialized = true;
      });
  },

  // Erstbefüllung: Alle existierenden localStorage-Daten nach Supabase pushen
  _seedSupabase() {
    var sb = getSupabase();
    if (!sb) return;
    var self = this;
    var prefix = this._prefix;
    var rows = [];
    for (var i = 0; i < localStorage.length; i++) {
      var fullKey = localStorage.key(i);
      if (fullKey && fullKey.indexOf(prefix) === 0) {
        var shortKey = fullKey.substring(prefix.length);
        try {
          var val = JSON.parse(localStorage.getItem(fullKey));
          rows.push({ key: shortKey, value: val });
        } catch(e) { /* skip invalid */ }
      }
    }
    // Auch Default-Daten seeden falls localStorage leer
    var defaults = {
      'projects': ATC_DATA.projects,
      'employees': ATC_DATA.employees,
      'customers': ATC_DATA.customers,
      'products': ATC_DATA.products,
      'workstep_templates': ATC_DATA.workStepTemplates,
      'order_templates': ATC_DATA.orderTemplates,
      'machines': ATC_DATA.machines
    };
    Object.keys(defaults).forEach(function(k) {
      if (!rows.some(function(r) { return r.key === k; })) {
        rows.push({ key: k, value: defaults[k] });
        localStorage.setItem(prefix + k, JSON.stringify(defaults[k]));
      }
    });
    if (rows.length > 0) {
      sb.from('app_data')
        .upsert(rows, { onConflict: 'key' })
        .then(function(res) {
          if (res.error) {
            console.warn('[Supabase] Seed-Fehler:', res.error.message);
          } else {
            console.log('[Supabase] ' + rows.length + ' Einträge initial synchronisiert.');
          }
        });
    }
  },

  load(key, fallback = null) {
    const raw = localStorage.getItem(this._prefix + key);
    return raw ? JSON.parse(raw) : fallback;
  },

  remove(key) {
    localStorage.removeItem(this._prefix + key);
  },

  // Projekte laden (mit Fallback auf Stammdaten, Abwärtskompatibilität für projectType)
  getProjects() {
    var projects = this.load('projects', ATC_DATA.projects);
    return projects.map(function(p) {
      return Object.assign({ projectType: 'fertigungsteil', parentId: null }, p);
    });
  },

  saveProjects(projects) {
    this.save('projects', projects);
  },

  // Tagesplanung laden/speichern
  getDailyPlan(date) {
    return this.load('plan_' + date, []);
  },

  saveDailyPlan(date, tasks) {
    this.save('plan_' + date, tasks);
  },

  // Tagesberichte laden/speichern
  getDailyReport(date, employeeId) {
    return this.load('report_' + date + '_' + employeeId, null);
  },

  saveDailyReport(date, employeeId, report) {
    this.save('report_' + date + '_' + employeeId, report);
  },

  // Mitarbeiter laden/speichern
  getEmployees() {
    return this.load('employees', ATC_DATA.employees);
  },

  saveEmployees(employees) {
    this.save('employees', employees);
  },

  // Alle Tagesberichte für ein Datum
  getAllReports(date) {
    const reports = [];
    const employees = this.getEmployees();
    employees.forEach(emp => {
      const r = this.getDailyReport(date, emp.id);
      if (r) reports.push({ ...r, employeeId: emp.id, employeeName: emp.name });
    });
    return reports;
  },

  // KW-Planung
  getWeekPlan(year, kw) {
    return this.load('weekplan_' + year + '_' + kw, []);
  },

  saveWeekPlan(year, kw, plan) {
    this.save('weekplan_' + year + '_' + kw, plan);
  },

  // Arbeitsschritt-Vorlagen
  getWorkStepTemplates() {
    return this.load('workstep_templates', ATC_DATA.workStepTemplates);
  },

  saveWorkStepTemplates(templates) {
    this.save('workstep_templates', templates);
  },

  // Auftragsvorlagen
  getOrderTemplates() {
    return this.load('order_templates', ATC_DATA.orderTemplates);
  },

  saveOrderTemplates(templates) {
    this.save('order_templates', templates);
  },

  // Maschinen
  getMachines() {
    return this.load('machines', ATC_DATA.machines);
  },

  saveMachines(machines) {
    this.save('machines', machines);
  },

  // Produktionsstörungen
  getDisruptions() {
    return this.load('disruptions', []);
  },

  saveDisruptions(disruptions) {
    this.save('disruptions', disruptions);
  },

  // Produkte laden/speichern
  getProducts() {
    return this.load('products', ATC_DATA.products);
  },

  saveProducts(products) {
    this.save('products', products);
  },

  // Arbeitsschritte pro Projekt
  getProjectSteps(projectId) {
    return this.load('project_steps_' + projectId, []);
  },

  saveProjectSteps(projectId, steps) {
    this.save('project_steps_' + projectId, steps);
  },

  // Kunden laden/speichern (mit Merge neuer Felder aus Defaults)
  getCustomers() {
    const stored = this.load('customers', ATC_DATA.customers);
    return stored.map(c => {
      const def = ATC_DATA.customers.find(d => d.id === c.id) || {};
      return {
        ...def,
        ...c,
        // Portal-Felder: gespeicherten Wert bevorzugen, sonst Default
        contactEmail: c.contactEmail || def.contactEmail || '',
        password: c.password || def.password || ''
      };
    });
  },

  saveCustomers(customers) {
    this.save('customers', customers);
  }
};

// Hilfsfunktionen
function getCustomerName(customerId) {
  const stored = Storage.load('customers', ATC_DATA.customers);
  const c = stored.find(c => c.id === customerId);
  return c ? c.name : 'Unbekannt';
}

// Projekt-Hierarchie Hilfsfunktionen
function getProjectChildren(projectId, projects) {
  return projects.filter(function(p) { return p.parentId === projectId; });
}

function getProjectParent(project, projects) {
  if (!project.parentId) return null;
  return projects.find(function(p) { return p.id === project.parentId; }) || null;
}

function getProjectRoot(project, projects) {
  var current = project;
  var maxDepth = 10;
  while (current.parentId && maxDepth-- > 0) {
    var parent = projects.find(function(p) { return p.id === current.parentId; });
    if (!parent) break;
    current = parent;
  }
  return current;
}

function getProjectTypeLabel(type) {
  var t = ATC_DATA.projectTypes.find(function(pt) { return pt.value === type; });
  return t ? t.label : 'Fertigungsteil';
}

function getProjectTypeIcon(type) {
  var t = ATC_DATA.projectTypes.find(function(pt) { return pt.value === type; });
  return t ? t.icon : '\u2699';
}

// Berechnet den aggregierten Fortschritt eines Elternprojekts aus seinen Kindern
function calcAggregatedProgress(project, projects) {
  var children = getProjectChildren(project.id, projects);
  if (children.length === 0) {
    return { konstruktion: project.konstruktion, fertigung: project.fertigung, montage: project.montage };
  }
  var sumK = 0, sumF = 0, sumM = 0;
  children.forEach(function(c) {
    var cp = calcAggregatedProgress(c, projects);
    sumK += cp.konstruktion;
    sumF += cp.fertigung;
    sumM += cp.montage;
  });
  return {
    konstruktion: sumK / children.length,
    fertigung: sumF / children.length,
    montage: sumM / children.length
  };
}

// Baut eine Baumstruktur aus flachen Projekten auf
function buildProjectTree(projects) {
  var roots = [];
  var childMap = {};
  projects.forEach(function(p) {
    if (!childMap[p.id]) childMap[p.id] = [];
  });
  projects.forEach(function(p) {
    if (p.parentId && childMap[p.parentId] !== undefined) {
      childMap[p.parentId].push(p);
    } else {
      roots.push(p);
    }
  });
  return { roots: roots, childMap: childMap };
}

function getProgressLabel(type, value) {
  const scale = ATC_DATA.progressScales[type];
  if (!scale) return '';
  const step = scale.find(s => s.value === value);
  return step ? step.label : `${Math.round(value * 100)}%`;
}

function getProgressColor(value) {
  if (value === 0) return '#e74c3c';
  if (value < 0.25) return '#e67e22';
  if (value < 0.50) return '#f1c40f';
  if (value < 0.75) return '#3498db';
  if (value < 1.00) return '#2ecc71';
  return '#27ae60';
}

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getISODate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function getKW(date) {
  const d = new Date(date);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ---- Authentifizierung ----
const Auth = {
  _sessionKey: 'atc_auth_session',
  _sessionTimeout: 8 * 60 * 60 * 1000, // 8 Stunden

  // Admin-Login (Planer)
  loginAdmin(password) {
    const adminPw = Storage.load('admin_password', ATC_DATA.adminPassword);
    if (password === adminPw) {
      const session = {
        type: 'admin',
        loginAt: Date.now(),
        expiresAt: Date.now() + this._sessionTimeout
      };
      localStorage.setItem(this._sessionKey + '_admin', JSON.stringify(session));
      return true;
    }
    return false;
  },

  // Mitarbeiter-Login (App) - per Email + PIN
  loginEmployee(email, pin) {
    const employees = Storage.getEmployees();
    const emp = employees.find(e => e.email && e.email.toLowerCase() === email.toLowerCase());
    if (!emp) return false;
    const storedPin = emp.pin || ATC_DATA.employees.find(e => e.id === emp.id)?.pin;
    if (pin === storedPin) {
      const session = {
        type: 'employee',
        employeeId: emp.id,
        loginAt: Date.now(),
        expiresAt: Date.now() + this._sessionTimeout
      };
      localStorage.setItem(this._sessionKey + '_employee', JSON.stringify(session));
      return emp;
    }
    return false;
  },

  // Prüfen ob Admin eingeloggt
  isAdminLoggedIn() {
    const raw = localStorage.getItem(this._sessionKey + '_admin');
    if (!raw) return false;
    const session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      this.logoutAdmin();
      return false;
    }
    return true;
  },

  // Prüfen ob Mitarbeiter eingeloggt
  getLoggedInEmployee() {
    const raw = localStorage.getItem(this._sessionKey + '_employee');
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      this.logoutEmployee();
      return null;
    }
    const employees = Storage.getEmployees();
    return employees.find(e => e.id === session.employeeId) || null;
  },

  logoutAdmin() {
    localStorage.removeItem(this._sessionKey + '_admin');
  },

  logoutEmployee() {
    localStorage.removeItem(this._sessionKey + '_employee');
  },

  // Admin-Passwort ändern
  changeAdminPassword(oldPw, newPw) {
    const currentPw = Storage.load('admin_password', ATC_DATA.adminPassword);
    if (oldPw !== currentPw) return false;
    Storage.save('admin_password', newPw);
    return true;
  },

  // Mitarbeiter-PIN ändern
  changeEmployeePin(employeeId, oldPin, newPin) {
    const employees = Storage.getEmployees();
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return false;
    const currentPin = emp.pin || ATC_DATA.employees.find(e => e.id === employeeId)?.pin;
    if (oldPin !== currentPin) return false;
    emp.pin = newPin;
    Storage.saveEmployees(employees);
    return true;
  },

  // Kunden-Login (Kundenportal) - per contactEmail + Passwort
  loginCustomer(email, password) {
    const customers = Storage.getCustomers();
    const cust = customers.find(c => c.contactEmail && c.contactEmail.toLowerCase() === email.toLowerCase());
    if (!cust || !cust.password) return false;
    if (password === cust.password) {
      const session = {
        type: 'customer',
        customerId: cust.id,
        loginAt: Date.now(),
        expiresAt: Date.now() + this._sessionTimeout
      };
      localStorage.setItem(this._sessionKey + '_customer', JSON.stringify(session));
      return cust;
    }
    return false;
  },

  getLoggedInCustomer() {
    const raw = localStorage.getItem(this._sessionKey + '_customer');
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      this.logoutCustomer();
      return null;
    }
    const customers = Storage.getCustomers();
    return customers.find(c => c.id === session.customerId) || null;
  },

  logoutCustomer() {
    localStorage.removeItem(this._sessionKey + '_customer');
  }
};

// ---- Email-Benachrichtigungen ----
const Notify = {
  // Statusmeldung an Mitarbeiter senden (öffnet Email-Client)
  sendStatus(employeeId, subject, body) {
    const employees = Storage.getEmployees();
    const emp = employees.find(e => e.id === employeeId);
    if (!emp || !emp.email) return false;
    const mailto = 'mailto:' + encodeURIComponent(emp.email)
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);
    window.open(mailto, '_blank');
    return true;
  },

  // Aufgabenzuweisung benachrichtigen
  notifyTaskAssigned(employeeId, taskDesc, projectName, weekLabel) {
    const subject = 'ATC Produktion - Neue Aufgabe zugewiesen';
    const body = 'Hallo,\n\n'
      + 'Ihnen wurde eine neue Aufgabe zugewiesen:\n\n'
      + 'Projekt: ' + projectName + '\n'
      + 'Zeitraum: ' + weekLabel + '\n'
      + 'Aufgabe: ' + taskDesc + '\n\n'
      + 'Bitte öffnen Sie die Mitarbeiter-App für weitere Details.\n\n'
      + 'Mit freundlichen Grüßen\nATC Produktionsplanung';
    return this.sendStatus(employeeId, subject, body);
  },

  // Tagesbericht-Erinnerung
  notifyReportReminder(employeeId) {
    const subject = 'ATC Produktion - Tagesbericht ausstehend';
    const body = 'Hallo,\n\n'
      + 'Ihr Tagesbericht für heute steht noch aus.\n'
      + 'Bitte öffnen Sie die Mitarbeiter-App und reichen Sie Ihren Bericht ein.\n\n'
      + 'Mit freundlichen Grüßen\nATC Produktionsplanung';
    return this.sendStatus(employeeId, subject, body);
  },

  // Bericht eingegangen - Bestätigung an Mitarbeiter
  notifyReportReceived(employeeId, projectName, date) {
    const subject = 'ATC Produktion - Bericht eingegangen';
    const body = 'Hallo,\n\n'
      + 'Ihr Tagesbericht wurde erfolgreich eingereicht:\n\n'
      + 'Datum: ' + date + '\n'
      + 'Projekt: ' + projectName + '\n\n'
      + 'Vielen Dank!\n\n'
      + 'Mit freundlichen Grüßen\nATC Produktionsplanung';
    return this.sendStatus(employeeId, subject, body);
  },

  // Abweichung melden - an Planer
  notifyDeviationToAdmin(employeeName, projectName, reason, date) {
    const adminEmail = Storage.load('admin_email', '');
    if (!adminEmail) return false;
    const subject = 'ATC Produktion - Abweichung gemeldet von ' + employeeName;
    const body = 'Abweichungsmeldung:\n\n'
      + 'Mitarbeiter: ' + employeeName + '\n'
      + 'Datum: ' + date + '\n'
      + 'Projekt: ' + projectName + '\n'
      + 'Grund: ' + reason + '\n\n'
      + 'Bitte prüfen Sie die Details in der Planer-Ansicht.';
    const mailto = 'mailto:' + encodeURIComponent(adminEmail)
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);
    window.open(mailto, '_blank');
    return true;
  }
};

// ---- Zeitplan-Helfer ----
const Schedule = {
  // Berechnet den Soll-Fortschritt basierend auf Start/Ende-Datum
  getExpectedProgress(startDate, endDate, today) {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = today ? new Date(today) : new Date();
    if (now <= start) return 0;
    if (now >= end) return 1;
    const total = end - start;
    const elapsed = now - start;
    return elapsed / total;
  },

  // Ampelstatus: vergleicht tatsächlichen mit geplantem Fortschritt
  getStatus(actualProgress, expectedProgress) {
    if (expectedProgress === null || expectedProgress === undefined) return 'unknown';
    const diff = actualProgress - expectedProgress;
    if (diff >= -0.05) return 'green';    // im Plan oder voraus
    if (diff >= -0.20) return 'yellow';   // leichte Verzögerung
    return 'red';                          // kritische Verzögerung
  },

  // Prognose: Hochrechnung Fertigstellungsdatum
  estimateCompletion(startDate, actualProgress, today) {
    if (!startDate || actualProgress <= 0) return null;
    const start = new Date(startDate);
    const now = today ? new Date(today) : new Date();
    const elapsed = now - start;
    if (elapsed <= 0) return null;
    const totalEstimated = elapsed / actualProgress;
    return new Date(start.getTime() + totalEstimated);
  },

  // Verbleibende Arbeitstage bis Deadline
  getRemainingWorkdays(endDate, today) {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = today ? new Date(today) : new Date();
    let count = 0;
    const d = new Date(now);
    while (d < end) {
      d.setDate(d.getDate() + 1);
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) count++;
    }
    return count;
  },

  /**
   * Berechnet die Gesamtfertigungsdauer eines Projekts.
   * Berücksichtigt:
   * - Bearbeitungsdauer × Stückzahl pro Arbeitsschritt
   * - Trockenzeiten (einmalig pro Schritt, nicht pro Stück)
   * - Abhängigkeiten (kritischer Pfad)
   * - Sicherheitsaufschläge (absolut + prozentual)
   * - Ist-Abweichungen (extrapoliert restliche Arbeit anhand bisheriger Abweichung)
   *
   * Rückgabe: {
   *   sollMinutes:        Geplante Gesamtdauer (ohne Sicherheit)
   *   sollWithBuffer:     Geplante Dauer inkl. Sicherheit
   *   istMinutes:         Bisher angefallene Ist-Zeit
   *   remainingSoll:      Verbleibende Soll-Zeit
   *   remainingAdjusted:  Verbleibende Zeit korrigiert um Ist-Abweichung
   *   projectedTotal:     Hochgerechnete Gesamtdauer (Ist + korrigiert Rest)
   *   projectedWithBuffer: Hochgerechnet inkl. Sicherheit
   *   bufferMinutes:      Absoluter Aufschlag
   *   bufferPercent:      Prozentualer Aufschlag
   *   totalBuffer:        Gesamtpuffer in Minuten
   *   deviationFactor:    Abweichungsfaktor (>1 = langsamer, <1 = schneller)
   *   criticalPathMin:    Kritischer Pfad Dauer (mit Abhängigkeiten)
   *   criticalPathAdj:    Kritischer Pfad korrigiert
   *   stepDetails:        Details pro Schritt
   *   progressPercent:    Gesamtfortschritt in %
   * }
   */
  calcProjectDuration(projectId) {
    const project = Storage.getProjects().find(p => p.id === projectId);
    if (!project) return null;
    const steps = Storage.getProjectSteps(projectId);
    if (steps.length === 0) return null;

    const bufferMin = project.bufferMinutes || 0;
    const bufferPct = project.bufferPercent || 0;

    // Pro Schritt berechnen
    const stepDetails = steps.map(s => {
      const sollWork = s.plannedDuration * s.totalQty;        // Arbeitszeit Soll
      const drying = s.dryingTime || 0;                       // Trockenzeit (einmalig)
      const sollTotal = sollWork + drying;                     // Soll gesamt
      const ist = s.actualDuration || 0;                       // bisherige Ist-Zeit
      const doneQty = s.completedQty || 0;
      const remainQty = Math.max(0, s.totalQty - doneQty);

      // Abweichungsfaktor pro Schritt
      let devFactor = 1;
      if (doneQty > 0 && s.plannedDuration > 0) {
        const istPerPiece = ist / doneQty;
        devFactor = istPerPiece / s.plannedDuration;
      }

      // Verbleibende Arbeitszeit korrigiert
      const remainSoll = s.plannedDuration * remainQty + (s.status !== 'abgeschlossen' ? drying : 0);
      const remainAdj = (s.plannedDuration * devFactor) * remainQty + (s.status !== 'abgeschlossen' ? drying : 0);

      return {
        id: s.id,
        order: s.order,
        name: s.name,
        status: s.status,
        dependsOn: s.dependsOn || [],
        sollTotal: sollTotal,
        ist: ist,
        remainSoll: s.status === 'abgeschlossen' ? 0 : remainSoll,
        remainAdj: s.status === 'abgeschlossen' ? 0 : remainAdj,
        devFactor: devFactor,
        doneQty: doneQty,
        totalQty: s.totalQty,
        pct: s.totalQty > 0 ? Math.round(doneQty / s.totalQty * 100) : 0
      };
    });

    // Gesamtsummen (sequenziell)
    const sollMinutes = stepDetails.reduce((s, d) => s + d.sollTotal, 0);
    const istMinutes = stepDetails.reduce((s, d) => s + d.ist, 0);
    const remainingSoll = stepDetails.reduce((s, d) => s + d.remainSoll, 0);
    const remainingAdjusted = stepDetails.reduce((s, d) => s + d.remainAdj, 0);

    // Globaler Abweichungsfaktor
    const totalDoneWork = stepDetails.reduce((s, d) => s + d.ist, 0);
    const totalPlannedDoneWork = stepDetails.reduce((s, d) => {
      if (d.doneQty > 0) return s + (d.sollTotal * (d.doneQty / d.totalQty));
      return s;
    }, 0);
    const deviationFactor = totalPlannedDoneWork > 0 ? totalDoneWork / totalPlannedDoneWork : 1;

    // Kritischer Pfad (mit Abhängigkeiten) - topologische Berechnung
    const endTimes = {};       // Soll-Endzeit pro Schritt
    const endTimesAdj = {};    // Korrigierte Endzeit pro Schritt
    const stepMap = {};
    stepDetails.forEach(d => { stepMap[d.id] = d; });

    function calcEnd(stepId, adjusted) {
      const cache = adjusted ? endTimesAdj : endTimes;
      if (cache[stepId] !== undefined) return cache[stepId];
      const d = stepMap[stepId];
      if (!d) return 0;
      let start = 0;
      (d.dependsOn || []).forEach(depId => {
        start = Math.max(start, calcEnd(depId, adjusted));
      });
      const dur = adjusted ? (d.ist + d.remainAdj) : d.sollTotal;
      cache[stepId] = start + dur;
      return cache[stepId];
    }

    let criticalPathMin = 0;
    let criticalPathAdj = 0;
    stepDetails.forEach(d => {
      criticalPathMin = Math.max(criticalPathMin, calcEnd(d.id, false));
      criticalPathAdj = Math.max(criticalPathAdj, calcEnd(d.id, true));
    });

    // Puffer berechnen
    const baseForBuffer = criticalPathMin;
    const pctBuffer = Math.round(baseForBuffer * bufferPct / 100);
    const totalBuffer = bufferMin + pctBuffer;

    const sollWithBuffer = criticalPathMin + totalBuffer;
    const projectedTotal = istMinutes + remainingAdjusted;
    const projectedWithBuffer = criticalPathAdj + totalBuffer;

    // Gesamtfortschritt
    const totalQtyAll = stepDetails.reduce((s, d) => s + d.totalQty, 0);
    const doneQtyAll = stepDetails.reduce((s, d) => s + d.doneQty, 0);
    const progressPercent = totalQtyAll > 0 ? Math.round(doneQtyAll / totalQtyAll * 100) : 0;

    return {
      sollMinutes,
      sollWithBuffer,
      istMinutes,
      remainingSoll,
      remainingAdjusted,
      projectedTotal,
      projectedWithBuffer,
      bufferMinutes: bufferMin,
      bufferPercent: bufferPct,
      totalBuffer,
      deviationFactor,
      criticalPathMin,
      criticalPathAdj,
      stepDetails,
      progressPercent
    };
  },

  /**
   * Rückwärtsterminierung: Berechnet Starttermine ausgehend vom Liefertermin.
   * Geht von deliveryDate rückwärts durch alle Arbeitsschritte (kritischer Pfad).
   * Berücksichtigt 8h/Tag, Mo-Fr Arbeitszeit.
   *
   * Rückgabe: Array von { stepId, stepName, latestStart, latestEnd, minutesBefore }
   */
  backwardSchedule(projectId) {
    const project = Storage.getProjects().find(p => p.id === projectId);
    if (!project || !project.deliveryDate) return null;
    const steps = Storage.getProjectSteps(projectId);
    if (steps.length === 0) return null;

    const deliveryDate = new Date(project.deliveryDate);
    deliveryDate.setHours(17, 0, 0, 0); // Arbeitstag endet 17:00

    const minutesPerDay = 480; // 8h
    const stepMap = {};
    steps.forEach(s => { stepMap[s.id] = s; });

    // Berechne Dauer pro Schritt (Soll × Reststück + Trockenzeit)
    function stepDuration(s) {
      const remainQty = Math.max(0, (s.totalQty || 0) - (s.completedQty || 0));
      if (s.status === 'abgeschlossen') return 0;
      return (s.plannedDuration || 0) * remainQty + (s.dryingTime || 0);
    }

    // Finde Schritte die von diesem abhängen (Nachfolger)
    function getSuccessors(stepId) {
      return steps.filter(s => (s.dependsOn || []).indexOf(stepId) >= 0);
    }

    // Finde Schritte ohne Nachfolger (Endschritte)
    const endSteps = steps.filter(s => getSuccessors(s.id).length === 0);

    // Rückwärts: latestEnd für Endschritte = deliveryDate
    const latestEnd = {};
    const latestStart = {};

    // Arbeitstage-Subtraktion
    function subtractWorkMinutes(fromDate, minutes) {
      const d = new Date(fromDate);
      let remaining = minutes;
      while (remaining > 0) {
        const dow = d.getDay();
        if (dow === 0) { d.setDate(d.getDate() - 1); d.setHours(17, 0, 0, 0); continue; }
        if (dow === 6) { d.setDate(d.getDate() - 1); d.setHours(17, 0, 0, 0); continue; }
        // Verfügbare Minuten heute (von 9:00 bis aktuelle Uhrzeit)
        const hourStart = 9;
        const todayAvail = (d.getHours() - hourStart) * 60 + d.getMinutes();
        if (todayAvail <= 0) { d.setDate(d.getDate() - 1); d.setHours(17, 0, 0, 0); continue; }
        if (remaining <= todayAvail) {
          d.setMinutes(d.getMinutes() - remaining);
          remaining = 0;
        } else {
          remaining -= todayAvail;
          d.setDate(d.getDate() - 1);
          d.setHours(17, 0, 0, 0);
        }
      }
      return d;
    }

    // Topologische Rückwärtsberechnung
    function calcLatestEnd(stepId) {
      if (latestEnd[stepId] !== undefined) return latestEnd[stepId];
      const succs = getSuccessors(stepId);
      if (succs.length === 0) {
        latestEnd[stepId] = deliveryDate;
      } else {
        let earliest = deliveryDate;
        succs.forEach(s => {
          const sStart = calcLatestStart(s.id);
          if (sStart < earliest) earliest = sStart;
        });
        latestEnd[stepId] = earliest;
      }
      return latestEnd[stepId];
    }

    function calcLatestStart(stepId) {
      if (latestStart[stepId] !== undefined) return latestStart[stepId];
      const end = calcLatestEnd(stepId);
      const dur = stepDuration(stepMap[stepId]);
      latestStart[stepId] = subtractWorkMinutes(end, dur);
      return latestStart[stepId];
    }

    // Alle berechnen
    const result = steps.map(s => {
      const lEnd = calcLatestEnd(s.id);
      const lStart = calcLatestStart(s.id);
      const now = new Date();
      return {
        stepId: s.id,
        stepName: s.name,
        order: s.order,
        status: s.status,
        latestStart: lStart,
        latestEnd: lEnd,
        duration: stepDuration(s),
        isOverdue: lStart < now && s.status !== 'abgeschlossen',
        isCritical: lStart.getTime() - now.getTime() < 2 * 24 * 60 * 60 * 1000 && s.status !== 'abgeschlossen'
      };
    });

    result.sort((a, b) => a.latestStart - b.latestStart);

    // Frühester benötigter Start
    const earliestStart = result.length > 0 ? result[0].latestStart : deliveryDate;

    return {
      deliveryDate: deliveryDate,
      earliestStart: earliestStart,
      steps: result,
      isOverdue: earliestStart < new Date()
    };
  },

  /**
   * Vorwärtsterminierung: Berechnet Start/End pro Schritt ab einem Startdatum.
   * Berücksichtigt Maschinenverteilung und Mitarbeiterverfügbarkeit.
   */
  forwardSchedule(projectId, startDate) {
    const project = Storage.getProjects().find(p => p.id === projectId);
    if (!project) return null;
    const steps = Storage.getProjectSteps(projectId);
    if (steps.length === 0) return null;

    const start = startDate ? new Date(startDate) : (project.startDate ? new Date(project.startDate) : new Date());
    start.setHours(9, 0, 0, 0);

    const stepMap = {};
    steps.forEach(s => { stepMap[s.id] = s; });

    function stepDuration(s) {
      const remainQty = Math.max(0, (s.totalQty || 0) - (s.completedQty || 0));
      if (s.status === 'abgeschlossen') return 0;
      return (s.plannedDuration || 0) * remainQty + (s.dryingTime || 0);
    }

    function addWorkMinutes(fromDate, minutes) {
      const d = new Date(fromDate);
      let remaining = minutes;
      while (remaining > 0) {
        const dow = d.getDay();
        if (dow === 0) { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); continue; }
        if (dow === 6) { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); continue; }
        const todayRemain = 17 * 60 - (d.getHours() * 60 + d.getMinutes());
        if (todayRemain <= 0) { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); continue; }
        if (remaining <= todayRemain) {
          d.setMinutes(d.getMinutes() + remaining);
          remaining = 0;
        } else {
          remaining -= todayRemain;
          d.setDate(d.getDate() + 1);
          d.setHours(9, 0, 0, 0);
        }
      }
      return d;
    }

    const earliestStart = {};
    const earliestEnd = {};

    function calcEarliestStart(stepId) {
      if (earliestStart[stepId] !== undefined) return earliestStart[stepId];
      const s = stepMap[stepId];
      if (!s) return start;
      let latest = new Date(start);
      (s.dependsOn || []).forEach(depId => {
        const depEnd = calcEarliestEnd(depId);
        if (depEnd > latest) latest = depEnd;
      });
      earliestStart[stepId] = latest;
      return latest;
    }

    function calcEarliestEnd(stepId) {
      if (earliestEnd[stepId] !== undefined) return earliestEnd[stepId];
      const s = stepMap[stepId];
      const sStart = calcEarliestStart(stepId);
      earliestEnd[stepId] = addWorkMinutes(sStart, stepDuration(s));
      return earliestEnd[stepId];
    }

    const result = steps.map(s => {
      const eStart = calcEarliestStart(s.id);
      const eEnd = calcEarliestEnd(s.id);
      return {
        stepId: s.id,
        stepName: s.name,
        order: s.order,
        status: s.status,
        earliestStart: eStart,
        earliestEnd: eEnd,
        duration: stepDuration(s),
        machineId: s.machineId || null,
        assignedTo: s.assignedTo || null
      };
    });

    result.sort((a, b) => a.earliestStart - b.earliestStart);

    const projectEnd = result.reduce((latest, s) => s.earliestEnd > latest ? s.earliestEnd : latest, start);

    return {
      startDate: start,
      projectEnd: projectEnd,
      steps: result,
      exceedsDeadline: project.deliveryDate ? projectEnd > new Date(project.deliveryDate) : false
    };
  },

  /**
   * Prüft Ressourcen-Konflikte: Gleiche Maschine/Person doppelt belegt?
   */
  checkResourceConflicts() {
    const projects = Storage.getProjects();
    const conflicts = [];

    // Sammel alle aktiven Schritte mit geplanten Zeiten
    const allScheduled = [];
    projects.forEach(p => {
      const fwd = this.forwardSchedule(p.id);
      if (!fwd) return;
      fwd.steps.forEach(s => {
        if (s.status === 'abgeschlossen') return;
        allScheduled.push({
          projectId: p.id,
          projectName: p.article,
          stepId: s.stepId,
          stepName: s.stepName,
          start: s.earliestStart,
          end: s.earliestEnd,
          machineId: s.machineId,
          assignedTo: s.assignedTo
        });
      });
    });

    // Maschinenüberschneidungen prüfen
    const byMachine = {};
    allScheduled.forEach(s => {
      if (s.machineId) {
        if (!byMachine[s.machineId]) byMachine[s.machineId] = [];
        byMachine[s.machineId].push(s);
      }
    });
    Object.keys(byMachine).forEach(machId => {
      const slots = byMachine[machId].sort((a, b) => a.start - b.start);
      for (let i = 0; i < slots.length - 1; i++) {
        if (slots[i].end > slots[i + 1].start) {
          conflicts.push({
            type: 'machine',
            resourceId: machId,
            step1: slots[i],
            step2: slots[i + 1]
          });
        }
      }
    });

    // Mitarbeiterüberschneidungen prüfen
    const byEmployee = {};
    allScheduled.forEach(s => {
      if (s.assignedTo) {
        if (!byEmployee[s.assignedTo]) byEmployee[s.assignedTo] = [];
        byEmployee[s.assignedTo].push(s);
      }
    });
    Object.keys(byEmployee).forEach(empId => {
      const slots = byEmployee[empId].sort((a, b) => a.start - b.start);
      for (let i = 0; i < slots.length - 1; i++) {
        if (slots[i].end > slots[i + 1].start) {
          conflicts.push({
            type: 'employee',
            resourceId: empId,
            step1: slots[i],
            step2: slots[i + 1]
          });
        }
      }
    });

    return conflicts;
  },

  /**
   * Berechnet Ausschuss-Auswirkungen: Wenn Ausschuss gemeldet wird,
   * erhöht sich die offene Menge und damit die Restdauer.
   */
  applyScrap(projectId, stepId, scrapQty, reason) {
    const steps = Storage.getProjectSteps(projectId);
    const step = steps.find(s => s.id === stepId);
    if (!step) return false;

    // Ausschuss protokollieren
    if (!step.scrapLog) step.scrapLog = [];
    step.scrapLog.push({
      qty: scrapQty,
      reason: reason || '',
      timestamp: new Date().toISOString()
    });

    // Fertigmenge reduzieren (Ausschuss zählt nicht als gute Stücke)
    step.completedQty = Math.max(0, (step.completedQty || 0) - scrapQty);

    // Wenn Schritt schon abgeschlossen war, wieder öffnen
    if (step.status === 'abgeschlossen' && step.completedQty < step.totalQty) {
      step.status = 'in_bearbeitung';
    }

    Storage.saveProjectSteps(projectId, steps);
    return true;
  }
};

// ---- Foto-Storage pro Aufgabe ----
const TaskPhotos = {
  _key(employeeId, date, projectId) {
    return 'task_photos_' + employeeId + '_' + date + '_' + projectId;
  },

  getPhotos(employeeId, date, projectId) {
    return Storage.load(this._key(employeeId, date, projectId), []);
  },

  savePhotos(employeeId, date, projectId, photos) {
    Storage.save(this._key(employeeId, date, projectId), photos);
  },

  addPhoto(employeeId, date, projectId, photoDataUrl) {
    const photos = this.getPhotos(employeeId, date, projectId);
    photos.push({
      data: photoDataUrl,
      timestamp: new Date().toISOString()
    });
    this.savePhotos(employeeId, date, projectId, photos);
    return photos;
  },

  removePhoto(employeeId, date, projectId, index) {
    const photos = this.getPhotos(employeeId, date, projectId);
    photos.splice(index, 1);
    this.savePhotos(employeeId, date, projectId, photos);
    return photos;
  }
};
