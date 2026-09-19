/* ==========================================================================
   Feldkatalog und Vokabular.

   Eine Quelle für Formular, Filter, Liste und Etikett. Wer ein Feld ergänzt,
   ändert nur diese Datei — die Werte landen in assets.attributes (jsonb),
   das Schema muss dafür nicht angefasst werden.
   ========================================================================== */

const KATEGORIEN = {
  it:        { label: 'IT & Technik',   kurz: 'IT'  },
  furniture: { label: 'Mobiliar',       kurz: 'MOB' },
  machine:   { label: 'Maschine',       kurz: 'MAS' },
  vehicle:   { label: 'Fahrzeug',       kurz: 'KFZ' }
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

/* Die Werte stehen so in der check-Bedingung von attachments.kind — wer hier
   etwas ergänzt, muss sql/01_schema.sql mitziehen. */
const ANHANGART = {
  photo:       'Foto',
  invoice:     'Rechnung, Lieferschein',
  manual:      'Anleitung, Datenblatt',
  certificate: 'Zertifikat, Prüfprotokoll',
  other:       'Sonstiges'
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
  ],
  /* Beim Fahrzeug steht die Fahrgestellnummer im Feld Seriennummer — sie ist
     die Seriennummer des Fahrzeugs, und so findet die Suche sie auch. */
  vehicle: [
    { key: 'plate',            label: 'Kennzeichen',     typ: 'text' },
    { key: 'first_reg',        label: 'Erstzulassung',   typ: 'date' },
    { key: 'fuel',             label: 'Kraftstoff',      typ: 'text' },
    { key: 'power_kw',         label: 'Leistung',        typ: 'number', einheit: 'kW' },
    { key: 'mileage_km',       label: 'Kilometerstand',  typ: 'number', einheit: 'km' },
    { key: 'inspection_until', label: 'HU bis',          typ: 'date' },
    { key: 'trailer_hitch',    label: 'Anhängerkupplung', typ: 'bool' }
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

/* Dateigrößen in der Einheit, die zur Zahl passt. kB und MB zu 1000, nicht zu
   1024 — so steht es auch im Dateimanager des Telefons. */
function fmtGroesse(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1000) return bytes + NBSP + 'Bytes';
  if (bytes < 1000000) return Math.round(bytes / 1000) + NBSP + 'kB';
  return (bytes / 1000000).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + NBSP + 'MB';
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
  KATEGORIEN, STATUS, ZUSTAND, STANDORT_ART, WARTUNGSART, ROLLEN, ANHANGART, FELDER,
  NBSP, fmtDatum, fmtZeit, fmtGeld, fmtZahl, fmtGroesse, tageBis, fristText
};
