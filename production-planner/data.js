// ATC Produktionsplanungstool - Stammdaten
// Basierend auf VL-0006-A Projektübersicht 2026
// Letzte Bearbeitung: 04.02.2026 durch Philipp Engelbreit

const ATC_DATA = {
  customers: [
    { id: '10024', name: 'Menze Kunststofftechnik GmbH', contact: '', email: '', phone: '', contactEmail: '', password: '' },
    { id: '10023', name: 'MAM Electronic', contact: '', email: '', phone: '', contactEmail: '', password: '' },
    { id: '10022', name: 'Hans Mayer Elektrotechnik GmbH', contact: '', email: '', phone: '', contactEmail: '', password: '' },
    { id: '10021', name: 'BA Clearance GmbH', contact: '', email: '', phone: '', contactEmail: '', password: '' },
    { id: '10016', name: 'EP Arms GmbH', contact: '', email: '', phone: '', contactEmail: '', password: '' },
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
        { stepId: 'WS010', order: 2, dependsOn: ['WS009'] },
        { stepId: 'WS001', order: 3, dependsOn: ['WS010'] },
        { stepId: 'WS003', order: 4, dependsOn: ['WS001'] },
        { stepId: 'WS004', order: 5, dependsOn: ['WS003'] },
        { stepId: 'WS005', order: 6, dependsOn: ['WS004'] },
        { stepId: 'WS006', order: 7, dependsOn: ['WS005'] },
        { stepId: 'WS008', order: 8, dependsOn: ['WS006'] }
      ]
    },
    {
      id: 'OT002',
      name: 'Fr\u00e4steil mit Montage',
      description: 'Fr\u00e4steil inkl. Baugruppenmontage',
      steps: [
        { stepId: 'WS009', order: 1, dependsOn: [] },
        { stepId: 'WS010', order: 2, dependsOn: ['WS009'] },
        { stepId: 'WS001', order: 3, dependsOn: ['WS010'] },
        { stepId: 'WS002', order: 4, dependsOn: ['WS001'] },
        { stepId: 'WS004', order: 5, dependsOn: ['WS002'] },
        { stepId: 'WS006', order: 6, dependsOn: ['WS004'] },
        { stepId: 'WS007', order: 7, dependsOn: ['WS006'] },
        { stepId: 'WS008', order: 8, dependsOn: ['WS007'] }
      ]
    }
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

  // Arbeitsschritte pro Projekt
  getProjectSteps(projectId) {
    return this.load('project_steps_' + projectId, []);
  },

  saveProjectSteps(projectId, steps) {
    this.save('project_steps_' + projectId, steps);
  },

  // Kunden laden/speichern
  getCustomers() {
    return this.load('customers', ATC_DATA.customers);
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
