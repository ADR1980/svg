# Inventar ATC technology GmbH aus dem Bewertungsgutachten

`atc-technology-2025-08-05.csv` — 103 Positionen, abgetippt aus dem Scan
*„Bewertung Engelbreit & Sohn GmbH — Zuordnung nur Massebestandteil"*,
NetBid Auction & Valuation, Stand 05.08.2025, 12 Seiten.

Das PDF hat keine Textebene; die Positionen sind aus den Seitenbildern
übernommen. Die Gegenprobe ist die Summe am Fuß von Seite 12: **60.540,00 €**.
Die Summe der 103 CSV-Zeilen trifft diesen Wert auf den Cent. Ein Tippfehler in
einer Wertspalte hätte das zerrissen, ein übersehener oder doppelter Posten
ebenso.

Alle Positionen stehen unter Eigentum *Masse*, Rechtsart *freie Masse*.
Standort ist durchgehend **90552 Röthenbach an der Pegnitz, Mühllach 11**; die
Spalte `Standort` enthält nur den Raum innerhalb dieser Anschrift.

## Spalten

| Spalte | Herkunft |
|---|---|
| `Pos` | Nummernspalte des Gutachtens. Läuft von 4 bis 170 **mit Lücken** — die fehlenden Nummern sind im Gutachten nicht enthalten (sie gehören nicht zur Masse). |
| `Standort` | Raum, ohne die durchgehend gleiche Anschrift |
| `Bezeichnung` | wortgleich übernommen, inkl. Hersteller, Typ, Baujahr, Seriennummer |
| `Alte Inv.-Nr.` | Spalte *Inv.Nr.* des Gutachtens, bei 11 Positionen gefüllt |
| `Anlagengruppe` | MTA (15) Maschinen · BGA (16) Betriebs- und Geschäftsausstattung · KFZ (39) Fahrzeuge |
| `Fortführungswert EUR` | Spalte *Fortf.Wert (€)*, ganzzahlig |
| `Bemerkung Gutachten` | Spalte *Allg. Bemerkungen*, wortgleich |
| `Kategorie Vorschlag` | **nicht aus dem Gutachten** — die Kategorie der Anwendung: `it`, `furniture`, `machine`, `vehicle` |

## Verteilung

| | Anzahl | | Anzahl |
|---|---:|---|---:|
| Halle Fertigung | 28 | Lager EP-ARMS | 4 |
| Halle Montage | 25 | Außenbereich | 3 |
| Sägerei | 11 | Büro Buchhaltung | 3 |
| Serverraum | 7 | Werkstattbüro | 2 |
| Lager | 5 | Konstruktionsbüro | 2 |
| Außenbereich/Zelt | 5 | Kompressorraum | 1 |
| Fuhrpark | 5 | Büro EP-ARMS | 1 |
| | | Besprechungszimmer | 1 |

Anlagengruppen: 74 × BGA, 24 × MTA, 5 × KFZ.
Kategorien: 59 Maschine, 25 Mobiliar, 14 IT, 5 Fahrzeug.

## Offene Punkte vor dem Import

**1. Kategorie Fahrzeug — erledigt.** Es gab sie nicht; das Schema ließ nur
`it`, `furniture` und `machine` zu. `sql/05_fahrzeuge.sql` trägt `vehicle`
nach, samt Kurzzeichen KFZ im Nummernkreis und eigenen Feldern in
`js/catalog.js`. Die fünf KFZ-Positionen laufen als `vehicle` und bekommen
Nummern der Form `ATC-KFZ-2026-000x`.

**2. Der Fortführungswert ist kein Anschaffungswert — entschieden.** Er ist
der bewertete Zeitwert zum 05.08.2025. Er steht in `purchase_price_cents`,
`purchase_date` ist der 05.08.2025, und in der Bemerkung jedes Objekts steht
der Satz, dass die Zahl der Fortführungswert des Gutachtens ist und kein
gezahlter Kaufpreis.

**3. Positionen 111 und 147 stehen mit 0 €** (defekter Hochhubwagen, IT-Posten
zur Entsorgung). Beide sind erfasst, Status `retired`, Zustand `defect`.

**4. Sammelpositionen — bleibt offen.** Etliche Zeilen bündeln mehrere Geräte;
Position 69 listet auf 777 Zeichen zwanzig Handmaschinen als einen Posten.
Bewertungstechnisch richtig, für ein Inventar mit Einzelaufklebern nicht.
Einzeln erfassen lässt sich das nur mit Werten, die das Gutachten nicht
hergibt — das geht nur bei einer Begehung vor Ort.

## Import

Es gibt noch keine Importfunktion in der Anwendung. Der Ladevorgang wäre ein
einmaliges Skript gegen die Datenbank. Es ist nicht einfach zurückzunehmen: Der
Nummernkreis in `asset_counters` zählt hoch und lässt sich nicht
zurückdrehen — gelöschte Objekte hinterlassen Lücken in den Inventarnummern.
