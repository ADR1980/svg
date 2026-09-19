#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Erzeugt aus atc-technology-2025-08-05.csv das Import-SQL für ATC technology GmbH.

Das Gutachten nennt zu jedem Posten einen Fließtext. Daraus werden hier die
Felder der Anwendung gezogen — Bezeichnung, Hersteller, Typ, Seriennummer,
Baujahr, Leistung, Betriebsstunden. Was sich nicht sicher zuordnen lässt,
bleibt leer; der vollständige Wortlaut steht ohnehin in der Bemerkung, damit
später niemand ins Gutachten zurückmuss.

Aufruf:  python3 erzeuge_import.py > atc-technology-import.sql
"""
import csv, json, re, sys, os

FIRMA   = '00b09d31-0231-4075-a44e-79a497419e72'   # ATC technology GmbH
ANLEGER = '2877314a-1231-4767-ab24-0a6c4b466d47'   # andreas@del.re
STICHTAG = '2025-08-05'
ANSCHRIFT = 'Mühllach 11, 90552 Röthenbach an der Pegnitz'
QUELLE = ('Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation '
          'vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur '
          'Massebestandteil), Position %s, Anlagengruppe %s.')

def q(s):
    """Postgres-Literal. None wird zu NULL, Hochkommas werden verdoppelt."""
    if s is None or s == '':
        return 'null'
    return "'" + str(s).replace("'", "''") + "'"

# --- aus dem Fließtext lesen ------------------------------------------------

def teile(text):
    """Zerlegt an Kommas, aber nicht innerhalb von Zahlen wie "0,92 kW"."""
    return [t.strip() for t in re.split(r',(?!\d)', text)]

def kopf_und_anzahl(text):
    """"2 Metall-Schubladenschränke" -> (2, "Metall-Schubladenschränke")."""
    kopf = teile(text)[0]
    m = re.match(r'^(\d+)\s+(.*)$', kopf)
    if not m:
        return 1, kopf
    return int(m.group(1)), m.group(2).strip()

def hersteller_und_typ(text):
    """Nur aus den ersten beiden Segmenten nach dem Kopf.

    Der Abbruch beim ersten Segment, das weder Fabrikat noch Typ ist, ist der
    eigentliche Schutz. Position 69 bündelt zwanzig Handmaschinen und beginnt
    mit "best. aus: Handkreissäge"; das dahinter stehende "Fabr. Flex" gehört
    zur ersten Maschine des Postens, nicht zum Posten. Ohne den Abbruch hieße
    die Position "Posten Handmaschinen Flex"."""
    fabr = typ = None
    for seg in teile(text)[1:3]:
        m = re.match(r'^Fabr\.\s+(.+)$', seg)
        if m and not fabr:
            fabr = m.group(1).strip()
            continue
        m = re.match(r'^Typ\s+(.+)$', seg)
        if m and not typ:
            typ = m.group(1).strip()
            continue
        break
    return fabr, typ

def seriennummer(text):
    """FIN geht vor SN — bei Fahrzeugen ist sie die amtliche Kennung."""
    m = re.search(r'\bFIN\s+([A-Z0-9]{8,})', text)
    if m:
        return m.group(1)
    m = re.search(r'\bSN\s+([A-Za-z0-9][A-Za-z0-9/\-]{3,})', text)
    return m.group(1) if m else None

def zustand(text):
    """"defekt" gilt nur, wenn es den ganzen Posten meint.

    Beim Audi A4 (Position 166) steht es hinten im Fließtext und betrifft
    Navigation und Klimaautomatik — das Auto fährt. Deshalb zählt das Wort nur
    in den ersten drei Segmenten. Die anderen Wendungen meinen immer den
    ganzen Posten und gelten überall im Text."""
    t = text.lower()
    if any(w in t for w in ('außer betrieb', 'end of life', 'schrott', 'entsorgung')):
        return 'defect'
    if 'defekt' in ', '.join(teile(text)[:3]).lower():
        return 'defect'
    return 'used'

MONATSENDE = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30,
              7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31}

def merkmale(text, kategorie, anlagengruppe, anzahl):
    a = {}
    if kategorie == 'vehicle':
        m = re.search(r'amtl\. Kennz\.\s+([A-ZÄÖÜ]{1,3}-[A-Z]{1,2}\s*\d{1,4})', text)
        if m:
            a['plate'] = m.group(1).strip()
        m = re.search(r'\bEZ\s+(\d{2})/(\d{2})', text)
        if m:
            a['first_reg'] = '20%s-%s-01' % (m.group(2), m.group(1))
        m = re.search(r'\b(Diesel|Benzin/Erdgas|Benzin|Elektro)\b', text)
        if m:
            a['fuel'] = m.group(1)
        m = re.search(r'(\d+)\s*kW', text)
        if m:
            a['power_kw'] = int(m.group(1))
        m = re.search(r'km-Stand\s+([\d.]+)', text)
        if m:
            a['mileage_km'] = int(m.group(1).replace('.', ''))
        # "TÜV 06/25" heißt: gültig bis Ende Juni 2025, nicht bis zum Ersten.
        m = re.search(r'TÜV\s+(\d{2})/(\d{2})', text)
        if m:
            a['inspection_until'] = '20%s-%s-%02d' % (m.group(2), m.group(1),
                                                      MONATSENDE[int(m.group(1))])
        if 'Anhängerkupplung' in text:
            a['trailer_hitch'] = True
    elif kategorie == 'machine':
        m = re.search(r'\bBj\.?\s*(\d{4})', text)
        if m:
            a['year_built'] = int(m.group(1))
        m = re.search(r'(\d+(?:,\d+)?)\s*kW', text)
        if m:
            a['power_kw'] = float(m.group(1).replace(',', '.'))
        m = re.search(r'Betriebsstd\.\s*([\d.]+)', text)
        if m:
            a['operating_hours'] = int(m.group(1).replace('.', ''))
    elif kategorie == 'furniture':
        a['afa_group'] = anlagengruppe
        if anzahl > 1:
            a['set_size'] = anzahl
        m = re.search(r'(\d[\d.]*\s*x\s*\d[\d.]*(?:\s*x\s*\d[\d.]*)?\s*mm)', text)
        if m:
            a['dimensions'] = m.group(1)
    return a

# --- Hauptlauf --------------------------------------------------------------

hier = os.path.dirname(os.path.abspath(__file__))
zeilen = list(csv.DictReader(open(os.path.join(hier, 'atc-technology-2025-08-05.csv'),
                                  encoding='utf-8'), delimiter=';'))

raeume = []
for z in zeilen:
    if z['Standort'] not in raeume:
        raeume.append(z['Standort'])

aus = sys.stdout.write
aus('-- Erzeugt von erzeuge_import.py — nicht von Hand ändern.\n')
aus('-- Inventar der ATC technology GmbH aus dem Bewertungsgutachten vom 05.08.2025.\n')
aus('begin;\n\n')

aus('-- Anschrift einmal, die Räume darunter.\n')
aus("insert into locations (company_id, name, kind, address)\n"
    "values (%s, 'Betriebsstätte Röthenbach', 'site', %s);\n\n" % (q(FIRMA), q(ANSCHRIFT)))

aus('insert into locations (company_id, parent_id, name, kind)\n'
    'select %s,\n'
    '       (select id from locations where company_id = %s and kind = %s),\n'
    '       r.name, %s\n'
    '  from (values\n' % (q(FIRMA), q(FIRMA), q('site'), q('room')))
aus(',\n'.join('           (%s)' % q(r) for r in raeume))
aus('\n       ) as r(name);\n\n')

aus('-- 103 Objekte in der Reihenfolge des Gutachtens, damit die\n'
    '-- Inventarnummern der Positionsfolge entsprechen.\n')

summe = 0
for z in zeilen:
    text = z['Bezeichnung']
    kat = z['Kategorie Vorschlag']
    anzahl, kopf = kopf_und_anzahl(text)
    fabr, typ = hersteller_und_typ(text)

    name = kopf if anzahl == 1 else '%d %s' % (anzahl, kopf)
    for zusatz in (fabr, typ):
        if zusatz and len(name) + len(zusatz) + 1 <= 80:
            name += ' ' + zusatz

    wert = int(z['Fortführungswert EUR'])
    summe += wert
    status = 'retired' if wert == 0 else 'in_stock'

    bemerkung = [text, '',
                 QUELLE % (z['Pos'], z['Anlagengruppe']),
                 'Der Anschaffungswert ist der Fortführungswert des Gutachtens, '
                 'kein gezahlter Kaufpreis.']
    if z['Bemerkung Gutachten']:
        bemerkung.insert(2, 'Bemerkung des Gutachters: ' + z['Bemerkung Gutachten'])
    if z['Alte Inv.-Nr.']:
        bemerkung.append('Alte Inventarnummer: ' + z['Alte Inv.-Nr.'] + '.')

    attr = merkmale(text, kat, z['Anlagengruppe'], anzahl)

    aus("insert into assets (company_id, category, name, manufacturer, model,\n"
        "       serial_number, status, condition, location_id, purchase_date,\n"
        "       purchase_price_cents, attributes, notes, created_by)\n"
        "values (%s, %s, %s, %s, %s,\n"
        "       %s, %s, %s,\n"
        "       (select id from locations where company_id = %s and name = %s and kind = 'room'),\n"
        "       %s, %d, %s, %s, %s);\n"
        % (q(FIRMA), q(kat), q(name), q(fabr), q(typ),
           q(seriennummer(text)), q(status), q(zustand(text)),
           q(FIRMA), q(z['Standort']),
           q(STICHTAG), wert * 100, q(json.dumps(attr, ensure_ascii=False)) + '::jsonb',
           q('\n'.join(bemerkung)), q(ANLEGER)))

aus('\n-- Gegenprobe: 103 Objekte, Summe 60.540,00 EUR wie auf Seite 12 des Gutachtens.\n')
aus("do $blk$\ndeclare v_n int; v_s bigint;\nbegin\n"
    "    select count(*), coalesce(sum(purchase_price_cents), 0) into v_n, v_s\n"
    "      from assets where company_id = " + q(FIRMA) + ";\n"
    "    if v_n <> 103 or v_s <> 6054000 then\n"
    "        raise exception 'Import weicht ab: % Objekte, % Cent', v_n, v_s;\n"
    "    end if;\n"
    "    raise notice 'Import in Ordnung: % Objekte, % Cent', v_n, v_s;\n"
    "end $blk$;\n\n")
aus('commit;\n')

sys.stderr.write('%d Zeilen, Summe %d EUR, %d Räume\n' % (len(zeilen), summe, len(raeume)))
