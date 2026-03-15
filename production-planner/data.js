// ATC Produktionsplanungstool - Stammdaten
// Basierend auf VL-0006-A Projektübersicht 2026
// Letzte Bearbeitung: 04.02.2026 durch Philipp Engelbreit

const ATC_DATA = {
  customers: [
    { id: '10024', name: 'Menze Kunststofftechnik GmbH' },
    { id: '10023', name: 'MAM Electronic' },
    { id: '10022', name: 'Hans Mayer Elektrotechnik GmbH' },
    { id: '10021', name: 'BA Clearance GmbH' },
    { id: '10016', name: 'EP Arms GmbH' },
    { id: '10002', name: 'ATC SiPro GmbH' },
    { id: '10001', name: '1 MOA GmbH' }
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

  projects: [
    {
      id: 1,
      orderNumber: '2026010002',
      customerId: '10024',
      article: 'Eintaucharmatur Flasch PP',
      quantity: 50,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.25,
      montage: 0.00,
      remarks: 'Material Beigestellt'
    },
    {
      id: 2,
      orderNumber: '2026010003',
      customerId: '10021',
      article: '100 Stck. TM-62 inkl. je 50 Stck. Zünder MVCH-62 und MVP-62',
      quantity: 100,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    },
    {
      id: 3,
      orderNumber: '',
      customerId: '10023',
      article: '1.450 Stck. Ringe klein',
      quantity: 1450,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    },
    {
      id: 4,
      orderNumber: '',
      customerId: '10016',
      article: 'ProLock Konterringe',
      quantity: 500,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    },
    {
      id: 5,
      orderNumber: '',
      customerId: '10016',
      article: 'Spannhebel DD Sight Mag',
      quantity: 55,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    },
    {
      id: 6,
      orderNumber: '',
      customerId: '10016',
      article: 'Klemmstein DD Sight Mag',
      quantity: 55,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    },
    {
      id: 7,
      orderNumber: '',
      customerId: '10016',
      article: 'Spannschieber DD Sight Mag',
      quantity: 55,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    },
    {
      id: 8,
      orderNumber: '',
      customerId: '10016',
      article: 'ProLock ZFH 51',
      quantity: 10,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    },
    {
      id: 9,
      orderNumber: '',
      customerId: '10016',
      article: 'ProLock ZFH 64',
      quantity: 10,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    },
    {
      id: 10,
      orderNumber: '',
      customerId: '10016',
      article: 'ProLock ZFH 61',
      quantity: 5,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    },
    {
      id: 11,
      orderNumber: '',
      customerId: '10016',
      article: 'ProLock ZFH 60',
      quantity: 5,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    },
    {
      id: 12,
      orderNumber: '',
      customerId: '10016',
      article: 'ProLock ZFH 56',
      quantity: 10,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    },
    {
      id: 13,
      orderNumber: '',
      customerId: '10016',
      article: 'ProLock ZFH 54',
      quantity: 2,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    },
    {
      id: 14,
      orderNumber: '',
      customerId: '10016',
      article: 'ProLock ZFH 49',
      quantity: 10,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    },
    {
      id: 15,
      orderNumber: '',
      customerId: '10016',
      article: 'RotoClip ZFHL 62 + Halbschalen',
      quantity: 50,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    },
    {
      id: 16,
      orderNumber: '',
      customerId: '10016',
      article: 'ProLock Ringe',
      quantity: 300,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    },
    {
      id: 17,
      orderNumber: '',
      customerId: '10016',
      article: 'Roto 50 Pro Rohre',
      quantity: 50,
      unit: 'Stück',
      konstruktion: 0.00,
      fertigung: 0.00,
      montage: 0.00,
      remarks: ''
    }
  ],

  employees: [
    { id: 'PE', name: 'Philipp Engelbreit', role: 'Fertigung' },
    { id: 'AT', name: 'Arthur Thaut', role: 'Konstruktion' },
    { id: 'MA1', name: 'Mitarbeiter 1', role: 'Montage' },
    { id: 'MA2', name: 'Mitarbeiter 2', role: 'Fertigung' }
  ]
};

// Storage-Helfer
const Storage = {
  _prefix: 'atc_prod_',

  save(key, data) {
    localStorage.setItem(this._prefix + key, JSON.stringify(data));
  },

  load(key, fallback = null) {
    const raw = localStorage.getItem(this._prefix + key);
    return raw ? JSON.parse(raw) : fallback;
  },

  remove(key) {
    localStorage.removeItem(this._prefix + key);
  },

  // Projekte laden (mit Fallback auf Stammdaten)
  getProjects() {
    return this.load('projects', ATC_DATA.projects);
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
  }
};

// Hilfsfunktionen
function getCustomerName(customerId) {
  const c = ATC_DATA.customers.find(c => c.id === customerId);
  return c ? c.name : 'Unbekannt';
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
