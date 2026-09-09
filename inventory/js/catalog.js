/* ==========================================================================
   Feldkatalog und Vokabular.

   Eine Quelle für Formular, Filter, Liste und Etikett. Wer ein Feld ergänzt,
   ändert nur diese Datei — die Werte landen in assets.attributes (jsonb),
   das Schema muss dafür nicht angefasst werden.
   ========================================================================== */

const KATEGORIEN = {
  it:        { label: 'IT & Technik',   kurz: 'IT'  },
  furniture: { label: 'Mobiliar',       kurz: 'MOB' },
  machine:   { label: 'Maschine',       kurz: 'MAS' }
};

const STATUS = {
  in_stock:    'Auf Lager',
  in_use:      'Im Einsatz',
  maintenance: 'In Wartung',
  repair:      'In Reparatur',
  retired:     'Ausgemustert',
  lost:        'Verlust'
};

const ZUSTAND = {
  new:    'Neu',
  good:   'Gut',
  used:   'Gebraucht',
  defect: 'Defekt'
};

const STANDORT_ART = {
  site:     'Standort',
  building: 'Gebäude',
  floor:    'Etage',
  room:     'Raum',
  vehicle:  'Fahrzeug',
  external: 'Extern'
};

const WARTUNGSART = {
  service:         'Wartung',
  inspection:      'Prüfung',
  calibration:     'Kalibrierung',
  dguv_v3:         'DGUV V3',
  uvv:             'UVV',
  software_update: 'Software'
};

const ROLLEN = {
  owner:  'Inhaber',
  admin:  'Verwaltung',
  editor: 'Erfassung',
  viewer: 'Nur lesen'
};

/* Kategoriespezifische Felder. typ: text | number | date | bool | select */
const FELDER = {
  it: [
    { key: 'hostname',    label: 'Gerätename',      typ: 'text' },
    { key: 'os',          label: 'Betriebssystem',  typ: 'text' },
    { key: 'ram_gb',      label: 'Arbeitsspeicher', typ: 'number', einheit: 'GB' },
    { key: 'storage_gb',  label: 'Speicher',        typ: 'number', einheit: 'GB' },
    { key: 'mac',         label: 'MAC-Adresse',     typ: 'text' },
    { key: 'imei',        label: 'IMEI',            typ: 'text' },
    { key: 'encrypted',   label: 'Verschlüsselt',   typ: 'bool' }
  ],
  furniture: [
    { key: 'material',   label: 'Material',    typ: 'text' },
    { key: 'dimensions', label: 'Maße',        typ: 'text' },
    { key: 'set_size',   label: 'Stück im Set', typ: 'number' },
    { key: 'afa_group',  label: 'AfA-Gruppe',  typ: 'text' }
  ],
  machine: [
    { key: 'year_built',       label: 'Baujahr',        typ: 'number' },
    { key: 'power_kw',         label: 'Leistung',       typ: 'number', einheit: 'kW' },
    { key: 'operating_hours',  label: 'Betriebsstunden', typ: 'number', einheit: 'h' },
    { key: 'inspection_until', label: 'Prüfplakette bis', typ: 'date' },
    { key: 'operator_group',   label: 'Bedienerkreis',  typ: 'text' }
  ]
};

/* --- Formatierung ---------------------------------------------------------
   Deutsche Schreibweise durchgehend: Datum als TT.MM.JJJJ, Beträge mit
   Komma, geschütztes Leerzeichen vor der Einheit.                          */

const NBSP = ' ';

function fmtDatum(v) {
  if (!v) return '—';
  const d = new Date(v + (v.length === 10 ? 'T00:00:00' : ''));
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtZeit(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d)) return '—';
  return d.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function fmtGeld(cents, waehrung) {
  if (cents === null || cents === undefined || cents === '') return '—';
  return (cents / 100).toLocaleString('de-DE', {
    style: 'currency', currency: waehrung || 'EUR', minimumFractionDigits: 2
  });
}

function fmtZahl(n) {
  if (n === null || n === undefined || n === '') return '—';
  return Number(n).toLocaleString('de-DE');
}

/* Tage bis zu einem Stichtag; negativ heißt überfällig. */
function tageBis(datum) {
  if (!datum) return null;
  const heute = new Date(); heute.setHours(0, 0, 0, 0);
  const ziel = new Date(datum + 'T00:00:00');
  return Math.round((ziel - heute) / 86400000);
}

function fristText(tage) {
  if (tage === null) return '';
  if (tage < 0)  return 'überfällig, ' + Math.abs(tage) + NBSP + 'Tage';
  if (tage === 0) return 'heute fällig';
  if (tage === 1) return 'morgen fällig';
  return 'in ' + tage + NBSP + 'Tagen';
}

window.KATALOG = {
  KATEGORIEN, STATUS, ZUSTAND, STANDORT_ART, WARTUNGSART, ROLLEN, FELDER,
  NBSP, fmtDatum, fmtZeit, fmtGeld, fmtZahl, tageBis, fristText
};
