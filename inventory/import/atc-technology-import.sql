-- Erzeugt von erzeuge_import.py — nicht von Hand ändern.
-- Inventar der ATC technology GmbH aus dem Bewertungsgutachten vom 05.08.2025.
begin;

-- Anschrift einmal, die Räume darunter.
insert into locations (company_id, name, kind, address)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'Betriebsstätte Röthenbach', 'site', 'Mühllach 11, 90552 Röthenbach an der Pegnitz');

insert into locations (company_id, parent_id, name, kind)
select '00b09d31-0231-4075-a44e-79a497419e72',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and kind = 'site'),
       r.name, 'room'
  from (values
           ('Halle Fertigung'),
           ('Lager'),
           ('Werkstattbüro'),
           ('Halle Montage'),
           ('Sägerei'),
           ('Kompressorraum'),
           ('Außenbereich/Zelt'),
           ('Außenbereich'),
           ('Lager EP-ARMS'),
           ('Büro EP-ARMS'),
           ('Serverraum'),
           ('Besprechungszimmer'),
           ('Konstruktionsbüro'),
           ('Büro Buchhaltung'),
           ('Fuhrpark')
       ) as r(name);

-- 103 Objekte in der Reihenfolge des Gutachtens, damit die
-- Inventarnummern der Positionsfolge entsprechen.
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', '2 Metall-Schubladenschränke Lista', 'Lista', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 100000, '{"afa_group": "MTA (15)", "set_size": 2}'::jsonb, '2 Metall-Schubladenschränke, Fabr. Lista, 4 Auszüge, Inhalt: Werkzeuge, u.a. Wechselschneidplatten, Fräser, Spannhülsen

Bemerkung des Gutachters: ggf. FE Luna Vermögensverwaltungsgesellschaft mbH, keine gesicherte Zuordnung möglich
Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 4, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Auffangwanne', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 8000, '{}'::jsonb, '1 Auffangwanne, ca. 2.000 x 800 mm, m. Gitterrostauflage

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 6, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'mobiles Fasstransportgestell', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 2000, '{}'::jsonb, '1 mobiles Fasstransportgestell

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 7, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', '4 mobile Werkbänke', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 40000, '{"afa_group": "MTA (15)", "set_size": 4}'::jsonb, '4 mobile Werkbänke, aus Aluprofilen, 2 Ebenen, 3 x m. Schubladenunterbau, Fabr. Garant

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 8, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Hartgestein-Messtisch', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 40000, '{}'::jsonb, '1 Hartgestein-Messtisch, 1.600 x 1.000 x 150 mm, Gewicht 768 kg, Untergestell, Hartgesteinplatte, m. Schraubhülsen versehen

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 9, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Druckluftkessel OKS', 'OKS', null,
       '8833', 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 20000, '{"year_built": 2016}'::jsonb, '1 Druckluftkessel, Fabr. OKS, Bj 2016, SN 8833, Fassungsvermögen 250 l, stehend

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 10, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Elektrokabel-Aufroller Elektron', 'Elektron', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 3000, '{}'::jsonb, '1 Elektrokabel-Aufroller, Fabr. Elektron

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 11, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Blechschrank CP', 'CP', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 3000, '{"afa_group": "BGA (16)", "dimensions": "1.500 x 600 mm"}'::jsonb, '1 Blechschrank, Fabr. CP, 2-türig, 1.500 x 600 mm

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 12, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'tragbare Umreifungsbandhaspel', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 8000, '{}'::jsonb, '1 tragbare Umreifungsbandhaspel, 2 manuelle Spann-/Verschlusszangen

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 13, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', '2 Montageregale', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 5000, '{"afa_group": "BGA (16)", "set_size": 2}'::jsonb, '2 Montageregale, L 1.000 mm, Schraub-/Stecksystem, 1 x m. Schrägböden, 4/5 Ebenen

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 14, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', '2 mobile Spänekippmulden Bauer SKK800', 'Bauer', 'SKK800',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 40000, '{"year_built": 2014}'::jsonb, '2 mobile Spänekippmulden, Fabr. Bauer, Typ SKK800, Bj 2014/2016, Fassungsvermögen 800 l, Tragfähigkeit 300 kg

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 15, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', '3 mobile Spänekippmulden', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 60000, '{}'::jsonb, '3 mobile Spänekippmulden, Fassungsvermögen 800 l

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 16, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Deichselhubwagen Ameise', 'Ameise', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 8000, '{}'::jsonb, '1 Deichselhubwagen, Fabr. Ameise, Tragfähigkeit 2.000 kg

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 17, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', '2 Etagenwagen Fetra', 'Fetra', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 8000, '{}'::jsonb, '2 Etagenwagen, Fabr. Fetra, 2 Ebenen

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 18, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Akku-Bohrschrauber Bosch GSR 18V-28', 'Bosch', 'GSR 18V-28',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 4000, '{}'::jsonb, '1 Akku-Bohrschrauber, Fabr. Bosch, Typ GSR 18V-28, Ladegerät, Ersatzakku, 2 Kabeltrommeln, 1 x Kunststoff, 2 LED-Strahler

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 19, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Tischbohrmaschine HG 8', 'HG', '8',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 8000, '{}'::jsonb, '1 Tischbohrmaschine, Fabr. HG, Typ 8, kleiner Schraubstock

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 20, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Metallwerkbank', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 8000, '{"afa_group": "BGA (16)"}'::jsonb, '1 Metallwerkbank, L 2.000 mm, m. Zwischenboden, Holz, Schublade, Gitterrückwand, 1 Posten Handwerkzeuge, geringer Umfang

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 21, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Druckluftkessel OKS', 'OKS', null,
       '8556', 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 20000, '{"year_built": 2015}'::jsonb, '1 Druckluftkessel, Fabr. OKS, Bj 2015, SN 8556, Fassungsvermögen 250 l

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 22, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'mobiler Industriesauger Ruwac SPS250-W24', 'Ruwac', 'SPS250-W24',
       'SPS250/20171045', 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 70000, '{"power_kw": 3.21}'::jsonb, '1 mobiler Industriesauger, Fabr. Ruwac, Typ SPS250-W24, 3,21 kW, SN SPS250/20171045

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 23, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Werkzeugschrumpfgerät Kelch i-tec L', 'Kelch', 'i-tec L',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 95000, '{"year_built": 2013}'::jsonb, '1 Werkzeugschrumpfgerät, Fabr. Kelch, Typ i-tec L, Bj 2013

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 25, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.
Alte Inventarnummer: 40006.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Werkzeug-Voreinstellgerät Promat Kenova Set Line V224', 'Promat', 'Kenova Set Line V224',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 70000, '{"year_built": 2013}'::jsonb, '1 Werkzeug-Voreinstellgerät, Fabr. Promat, Typ Kenova Set Line V224, Bj 2013

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 26, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.
Alte Inventarnummer: 22012.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Werkbank Garant', 'Garant', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 40000, '{"afa_group": "BGA (16)"}'::jsonb, '1 Werkbank, Fabr. Garant, 2 Unterschränke, 6 Auszüge bzw. 4 Auszüge/Tür, Auflageplatte m. Metallabdeckung, Schraubstock, Steilkegel-Einspannvorrichtung, Fabr. Knuth, Schubladeninhalt: Handwerkzeuge, Spannmittel, geringer Umfang

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 27, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'tragbares Batterieladegerät Ultimate Speed ULG12B3', 'Ultimate Speed', 'ULG12B3',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 5000, '{}'::jsonb, '1 tragbares Batterieladegerät, Fabr. Ultimate Speed, Typ ULG12B3

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 28, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', '2 Blechschränke', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 34000, '{"afa_group": "BGA (16)", "set_size": 2, "dimensions": "2.000 x 1.000 mm"}'::jsonb, '2 Blechschränke, 2.000 x 1.000 mm, 2-türig, Inhalt: Maschinenwerkzeuge, Fräser, in Lagersichtkästen, geringer Umfang, 1 Posten Werkzeugaufnahmen, SK40, ca. 50 Stck., 1 Posten Bohrer u. Fräser

Bemerkung des Gutachters: ggf. FE Luna Vermögensverwaltungsgesellschaft mbH, keine gesicherte Zuordnung möglich
Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 29, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Flaschenzug Chain Block HS', 'Chain Block', 'HS',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 8000, '{}'::jsonb, '1 Flaschenzug, Fabr. Chain Block, Typ HS, Tragfähigkeit 1 t, 1 Posten Luft- und Wasserschläuche, Überbrückungskabel, 1 Posten Rundschlingen u. Spanngurte, lagernd in Blechkiste

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 30, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'tragbarer Hochdruckreiniger Kränzle Power Jet', 'Kränzle', 'Power Jet',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 14000, '{}'::jsonb, '1 tragbarer Hochdruckreiniger, Fabr. Kränzle, Typ Power Jet, 115 bar, m. Sprühlanze

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 31, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Pneumatik-Fasspumpe', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 3000, '{}'::jsonb, '1 Pneumatik-Fasspumpe

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 32, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Alu-Anstellleiter Krause', 'Krause', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Fertigung' and kind = 'room'),
       '2025-08-05', 3000, '{}'::jsonb, '1 Alu-Anstellleiter, Fabr. Krause, 12-stufig

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 34, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Pneumatik-Kniehebelpresse Gechter 8KN HKPL', 'Gechter', '8KN HKPL',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Lager' and kind = 'room'),
       '2025-08-05', 68000, '{"year_built": 2015}'::jsonb, '1 Pneumatik-Kniehebelpresse, Fabr. Gechter, Typ 8KN HKPL, Bj 2015

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 35, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Druckluft-Kartuschenpresse', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Lager' and kind = 'room'),
       '2025-08-05', 8000, '{}'::jsonb, '1 Druckluft-Kartuschenpresse, 2 Aufnahmen

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 36, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', '2 Hochdruckspannstöcke Garant 36 0510 12', 'Garant', '36 0510 12',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Lager' and kind = 'room'),
       '2025-08-05', 140000, '{}'::jsonb, '2 Hochdruckspannstöcke, Fabr. Garant, Typ 36 0510 12

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 37, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', '6 Leichtbauregale', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Lager' and kind = 'room'),
       '2025-08-05', 10000, '{"afa_group": "BGA (16)", "set_size": 6}'::jsonb, '6 Leichtbauregale, verzinkt/blau, L 1.000 mm, 5 Ebenen, Blechschrank, 2-türig, Tresor, antik, 2-türig

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 38, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Posten Altbauteile', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Lager' and kind = 'room'),
       '2025-08-05', 50000, '{}'::jsonb, '1 Posten Altbauteile, u.a. Pneumatik, 1 Posten Schaltschränke, Elektro-/Datenkabel

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 39, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'it', 'PC Lenovo Thinkstation D20', 'Lenovo', 'Thinkstation D20',
       null, 'in_stock', 'defect',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Werkstattbüro' and kind = 'room'),
       '2025-08-05', 20000, '{}'::jsonb, '1 PC, Fabr. Lenovo, Typ Thinkstation D20, Xeon, PC, Fabr. HP, Typ Z620 Workstation, Xeon, PC, Noname, außer Betrieb, 4 27"-Monitore, Fabr. BenQ/Asus, 2 Tastaturen, 2 PC-Lautsprecher

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 41, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'it', 'Laserdrucker HP LaserJet CP1525N Color', 'HP', 'LaserJet CP1525N Color',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Werkstattbüro' and kind = 'room'),
       '2025-08-05', 2000, '{}'::jsonb, '1 Laserdrucker, Fabr. HP, Typ LaserJet CP1525N Color

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 42, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Etagenwagen Fetra', 'Fetra', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 3000, '{}'::jsonb, '1 Etagenwagen, Fabr. Fetra, 2 Ebenen

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 47, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Bohrhammer Hilti EE17', 'Hilti', 'EE17',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 14000, '{}'::jsonb, '1 Bohrhammer, Fabr. Hilti, Typ EE17, Zubehör, im Koffer

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 52, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Metall-Schubladenschrank Hahn & Kolb', 'Hahn & Kolb', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 8000, '{"afa_group": "BGA (16)"}'::jsonb, '1 Metall-Schubladenschrank, Fabr. Hahn & Kolb, L 2.000 mm, 8 Auszüge

Bemerkung des Gutachters: Bewertung ohne Inhalt, da Umlaufvermögen
Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 53, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Blechschrank', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 5000, '{"afa_group": "BGA (16)", "dimensions": "1.600 x 600 mm"}'::jsonb, '1 Blechschrank, 2-türig, 1.600 x 600 mm, Inhalt: Lagersichtkästen, Schaltschrank, Fabr. Siemens, umgebaut zum Lagerschrank, Inhalt: div. Kunststoff-Sortimentskästen, u.a. Böllhoff, ohne Inhalt oder unvollständig, div. Werkzeuge

Bemerkung des Gutachters: Bewertung ohne Verbrauchsmaterial, da Umlaufvermögen
Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 54, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Werkstattwagen', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 12000, '{"afa_group": "BGA (16)"}'::jsonb, '1 Werkstattwagen, Inhalt: Handwerkzeuge, geringer Umfang

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 55, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Magnetbohrmaschine Duss D32 II', 'Duss', 'D32 II',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 15000, '{}'::jsonb, '1 Magnetbohrmaschine, Fabr. Duss, Typ D32 II, Magnetständer WS

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 60, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Metallschubladenschrank Kardex', 'Kardex', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 10000, '{"afa_group": "BGA (16)"}'::jsonb, '1 Metallschubladenschrank, Fabr. Kardex, Inhalt: Maschinenwerkzeuge, geringer Umfang, Blechkiste, Inhalt: Gewindeschneideisen

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 61, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Schaltschrank Siemens', 'Siemens', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 30000, '{"afa_group": "BGA (16)"}'::jsonb, '1 Schaltschrank, Fabr. Siemens, umgebaut zum Lagerschrank, Inhalt: 1 Posten Werkzeugaufnahmen, SK40, ca. 25 Stck., 1 Posten Werkzeuge, Fräser, Reibahle, Entmagnetisierplatte, Metallschrank, Fabr. Lampertz, Inhalt: Teilapparat, Spannmittel, Maschinenzubehör

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 62, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Entgratmaschine Günter Holl KS200', 'Günter Holl', 'KS200',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 5000, '{"year_built": 1968}'::jsonb, '1 Entgratmaschine, Fabr. Günter Holl, Typ KS200, Bj 1968

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 66, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Flachstahl-Handbiegevorrichtung', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 5000, '{}'::jsonb, '1 Flachstahl-Handbiegevorrichtung

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 67, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Bodenkehrmaschine Kärcher S650', 'Kärcher', 'S650',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 4000, '{}'::jsonb, '1 Bodenkehrmaschine, Fabr. Kärcher, Typ S650

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 68, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Posten Handmaschinen', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 50000, '{}'::jsonb, '1 Posten Handmaschinen, best. aus: Handkreissäge, Fabr. Flex, Typ CSM4060, Zubehör, im Koffer, Bohrhammer, Fabr. Impex, Typ DS70, m. Zubehör, im Koffer, Winkelschleifer, Fabr. Bosch, Typ GWS1100, Winkelschleifer, Fabr. Flex, Typ L1109FE, Winkelschleifer, Fabr. Kingcraft, Typ KAG125/950, Zweihand-Bohrmaschine, Fabr. Einhell, Typ BFMR1100, Winkelschleifer, Fabr. Hikoki, Bohrmaschine, Fabr. Fein, Winkelschleifer, Fabr. Kingcraft, Akku-Bohrschrauber, Fabr. Hilti, Typ SF2-A, Zubehör, im Koffer, Säbelsäge, Fabr. Dewalt, Typ DW304PK, Zubehör, im Koffer, Akku-Bohrschrauber, Fabr. Bosch, Akku-Handleuchte, Ersatzakku, Ladegerät, Koffer, Schlagbohrmaschine, Fabr. Metabo, Typ SBE900 Impuls, m. Koffer, 1 Posten Autogenschweißspitzen, im Blechkoffer, 4 Maschinenkoffer, ohne Inhalt

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 69, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Blechschrank', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 14000, '{"afa_group": "BGA (16)"}'::jsonb, '1 Blechschrank, 2-türig, Inhalt: Bohrer, Maschinenwerkzeuge

Bemerkung des Gutachters: ggf. FE Luna Vermögensverwaltungsgesellschaft mbH, keine gesicherte Zuordnung möglich
Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 70, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Gewindeschneidkluppe Rems EVA', 'Rems', 'EVA',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 10000, '{}'::jsonb, '1 Gewindeschneidkluppe, Fabr. Rems, Typ EVA, 5 Einsätze, m. Blechkiste

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 71, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Akku-Spritzgerät Graco X-Force HD', 'Graco', 'X-Force HD',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 50000, '{}'::jsonb, '1 Akku-Spritzgerät, Fabr. Graco, Typ X-Force HD, m. Zubehör, Ersatzakku, Ladegerät, im Koffer

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 72, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.
Alte Inventarnummer: 40027.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Gewindeschneidmaschine HG 23N', 'HG', '23N',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 3000, '{}'::jsonb, '1 Gewindeschneidmaschine, Fabr. HG, Typ 23N

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 73, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Bürstenentgratmaschine Berg & Schmid BUE200', 'Berg & Schmid', 'BUE200',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 42000, '{"year_built": 2017}'::jsonb, '1 Bürstenentgratmaschine, Fabr. Berg & Schmid, Typ BUE200, Bj 2017

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 74, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Tischbohrmaschine Rascher/Wörner TIBO13', 'Rascher/Wörner', 'TIBO13',
       '14210', 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 8000, '{}'::jsonb, '1 Tischbohrmaschine, Fabr. Rascher/Wörner, Typ TIBO13, SN 14210, Schraubstock

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 75, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Tischbohrmaschine', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 20000, '{}'::jsonb, '1 Tischbohrmaschine, höhenverstellbarer Bohrtisch

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 76, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', '2 Arbeitstische', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 5000, '{"afa_group": "BGA (16)", "set_size": 2}'::jsonb, '2 Arbeitstische, Metall/Holz, m. Zwischenboden

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 77, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Metall-Schubladenschrank', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 75000, '{"afa_group": "BGA (16)"}'::jsonb, '1 Metall-Schubladenschrank, 7 Auszüge, Inhalt: Messmittel, Fräser, Wendeschneidplatten, Schneideisen, Spannmittel, Maschinenzubehör, u.a. Backenfutter

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 79, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', '3 Etagenwagen Fetra', 'Fetra', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 10000, '{}'::jsonb, '3 Etagenwagen, Fabr. Fetra, 2 Ebenen

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 81, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', '2 Etagenwagen', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 4000, '{}'::jsonb, '2 Etagenwagen, älter, 1 x m. Spanplattenauflage

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 82, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'tragbarer Schweißinverter Kjellberg GIF180', 'Kjellberg', 'GIF180',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 55000, '{}'::jsonb, '1 tragbarer Schweißinverter, Fabr. Kjellberg, Typ GIF180

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 87, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'mobile Schweißrauchabsaugung S.Tec M802', 'S.Tec', 'M802',
       '6907210171529', 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Halle Montage' and kind = 'room'),
       '2025-08-05', 50000, '{"year_built": 2013, "power_kw": 1.1, "operating_hours": 153}'::jsonb, '1 mobile Schweißrauchabsaugung, Fabr. S.Tec, Typ M802, Bj 2013, Volumenstrom 1.600 m³/h, Motorleistung 1,1 kW, SN 6907210171529, Betriebsstd. 153, flexibler Absaugschlauch

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 89, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Alu-Bockleiter Krause', 'Krause', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Sägerei' and kind = 'room'),
       '2025-08-05', 8000, '{}'::jsonb, '1 Alu-Bockleiter, Fabr. Krause, 10-stufig

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 90, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Metallregal Schäfer', 'Schäfer', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Sägerei' and kind = 'room'),
       '2025-08-05', 6000, '{"afa_group": "BGA (16)", "dimensions": "2.200 x 1.000 x 800 mm"}'::jsonb, '1 Metallregal, Fabr. Schäfer, 2.200 x 1.000 x 800 mm, 6 Ebenen

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 91, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', '2 Staubsauger Kärcher WD5.600MP', 'Kärcher', 'WD5.600MP',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Sägerei' and kind = 'room'),
       '2025-08-05', 6000, '{}'::jsonb, '2 Staubsauger, Fabr. Kärcher, Typ WD5.600MP, stark verschmutzt

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 92, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Industriesauger Nilfisk Alto Attix 751-21', 'Nilfisk Alto', 'Attix 751-21',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Sägerei' and kind = 'room'),
       '2025-08-05', 12000, '{}'::jsonb, '1 Industriesauger, Fabr. Nilfisk Alto, Typ Attix 751-21

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 93, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Kragarmregal', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Sägerei' and kind = 'room'),
       '2025-08-05', 12000, '{"afa_group": "BGA (16)"}'::jsonb, '1 Kragarmregal, best. aus: 3 Ständer, wandmontiert, verschweißt, 3 Ebenen

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 95, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Staubsauger Nilfisk Body II 18', 'Nilfisk', 'Body II 18',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Sägerei' and kind = 'room'),
       '2025-08-05', 3000, '{}'::jsonb, '1 Staubsauger, Fabr. Nilfisk, Typ Body II 18

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 97, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'tragbarer Stromverteiler Rev', 'Rev', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Sägerei' and kind = 'room'),
       '2025-08-05', 3000, '{}'::jsonb, '1 tragbarer Stromverteiler, Fabr. Rev, 2 x Kraftstrom, 4 x Lichtstrom

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 98, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', '2 Hochdruck-Spannstöcke Homge HPAC-1600S CNC Multipower', 'Homge', 'HPAC-1600S CNC Multipower',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Sägerei' and kind = 'room'),
       '2025-08-05', 200000, '{}'::jsonb, '2 Hochdruck-Spannstöcke, Fabr. Homge, Typ HPAC-1600S CNC Multipower

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 99, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.
Alte Inventarnummer: 22011.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'kleiner Metallschrank', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Sägerei' and kind = 'room'),
       '2025-08-05', 7000, '{"afa_group": "BGA (16)", "dimensions": "1.600 x 600 mm"}'::jsonb, '1 kleiner Metallschrank, 1.600 x 600 mm, 2-türig, Inhalt: Lagersichtkästen, Metallspind, 2-türig, Metall-Werkbank, Unterschrank, 4 Auszüge, Holz, defekt

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 101, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Dreiwalzen-Rohr- und Profilbiegemaschine Klaus Zopf CM2000 BPR', 'Klaus Zopf', 'CM2000 BPR',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Sägerei' and kind = 'room'),
       '2025-08-05', 35000, '{}'::jsonb, '1 Dreiwalzen-Rohr- und Profilbiegemaschine, Fabr. Klaus Zopf, Typ CM2000 BPR, mobiler Untertisch

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 102, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', '2 Stehhilfen', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Sägerei' and kind = 'room'),
       '2025-08-05', 2000, '{"afa_group": "BGA (16)", "set_size": 2}'::jsonb, '2 Stehhilfen

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 107, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Schraubenkompressor Kaeser Sigma-Profil SM11', 'Kaeser', 'Sigma-Profil SM11',
       '0119052', 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Kompressorraum' and kind = 'room'),
       '2025-08-05', 100000, '{"year_built": 1993, "power_kw": 7.5, "operating_hours": 24808}'::jsonb, '1 Schraubenkompressor, Fabr. Kaeser, Typ Sigma-Profil SM11, Bj 1993, SN 0119052, Leistung 7,5 kW, Volumenstrom 0,92 m³/min, Betriebsstd. 24.808, Druckluft-Kältetrockner, Fabr. Kaeser, Typ TA11, Druckluftbehälter, Fabr. Siap, Fassungsvermögen 400 l, Öl-Wasser-Trenner, Fabr. Kaeser, Typ Aquamat 2, Druckluftverrohrung, div. Filter

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 108, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Treibgas-Gabelstapler Linde H30T', 'Linde', 'H30T',
       'H2X393S00313', 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Außenbereich/Zelt' and kind = 'room'),
       '2025-08-05', 600000, '{"year_built": 2005, "operating_hours": 5956}'::jsonb, '1 Treibgas-Gabelstapler, Fabr. Linde, Typ H30T, Bj 2005, SN H2X393S00313, Tragfähigkeit 3.000 kg, hydr. Seitenschieber, Duplexmast, Betriebsstd. 5.956, Zubehör: 1 Paar Zinkenverlängerungen

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 110, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.
Alte Inventarnummer: 38004.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Elektro-Deichselhochhubwagen Pramac Lifter GX10/16', 'Pramac Lifter', 'GX10/16',
       'HL10080665', 'retired', 'defect',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Außenbereich/Zelt' and kind = 'room'),
       '2025-08-05', 0, '{"year_built": 2014}'::jsonb, '1 Elektro-Deichselhochhubwagen, Fabr. Pramac Lifter, Typ GX10/16, Bj 2014, SN HL10080665, defekt, außer Betrieb gelagert, Tragfähigkeit 1.000 kg

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 111, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'mobil Auffangwanne Bauer', 'Bauer', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Außenbereich/Zelt' and kind = 'room'),
       '2025-08-05', 14000, '{}'::jsonb, '1 mobil Auffangwanne, Fabr. Bauer, Fassungsvermögen 200 l

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 114, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Plattentransportwagen', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Außenbereich/Zelt' and kind = 'room'),
       '2025-08-05', 5000, '{}'::jsonb, '1 Plattentransportwagen, verstellbare Bügelgriffe

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 115, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Posten Metallregale Schäfer', 'Schäfer', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Außenbereich/Zelt' and kind = 'room'),
       '2025-08-05', 8000, '{"afa_group": "BGA (16)"}'::jsonb, '1 Posten Metallregale, Fabr. Schäfer, Böden teilw. verbogen, L 4.000 mm

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 117, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Kragarmregal Schulte KR-ES', 'Schulte', 'KR-ES',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Außenbereich' and kind = 'room'),
       '2025-08-05', 42000, '{"afa_group": "BGA (16)"}'::jsonb, '1 Kragarmregal, Fabr. Schulte, Typ KR-ES, Bj 2021, demontiert, best. aus: 3 Ständer, einseitig, 5 Ebenen, Kragarmlänge 500 mm, Ständerhöhe 2.300 mm

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 120, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.
Alte Inventarnummer: 40033.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Posten Altmaschinenteile', null, null,
       null, 'in_stock', 'defect',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Außenbereich' and kind = 'room'),
       '2025-08-05', 60000, '{}'::jsonb, '1 Posten Altmaschinenteile, lagernd auf Lafette (Schrott)

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 121, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Gasflaschenschrank Asecos', 'Asecos', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Außenbereich' and kind = 'room'),
       '2025-08-05', 20000, '{"afa_group": "BGA (16)"}'::jsonb, '1 Gasflaschenschrank, Fabr. Asecos, verzinkt, 1-türig, H 1.400 mm, B 700 mm, T 500 mm

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 122, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Lagerbühne', null, null,
       '215041', 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Lager EP-ARMS' and kind = 'room'),
       '2025-08-05', 750000, '{"afa_group": "BGA (16)", "dimensions": "7.000 x 9.000 mm"}'::jsonb, '1 Lagerbühne, SN 215041, Durchgangshöhe 2.000 mm, Belastung max. zul. 500 kg/m², 7.000 x 9.000 mm, Anbaumodul, 3.000 x 4.500 mm, Säulen-/Trageelemente verschraubt, Spanplattenauflage, im unteren Bereich m. Beleuchtung, seitl. m. Treppenaufgang, Rückbaukosten

Bemerkung des Gutachters: immobilienangepasst
Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 127, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.
Alte Inventarnummer: 40032.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Gabelhubwagen', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Lager EP-ARMS' and kind = 'room'),
       '2025-08-05', 8000, '{}'::jsonb, '1 Gabelhubwagen, grün, Tragfähigkeit 2.000 mm

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 129, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'Druckluftbehälter', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Lager EP-ARMS' and kind = 'room'),
       '2025-08-05', 20000, '{}'::jsonb, '1 Druckluftbehälter, vermutl. OKS, Fassungsvermögen 250 l

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 130, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', 'manuelle hydraulische Werkstattpresse BGS', 'BGS', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Lager EP-ARMS' and kind = 'room'),
       '2025-08-05', 20000, '{"year_built": 2024}'::jsonb, '1 manuelle hydraulische Werkstattpresse, Fabr. BGS, Kapazität 20 t, Bj. 2024, Hub 150 mm, B 530 mm, Arbeitsbereich 0 - 1.030 mm

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 131, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'it', 'Notebook Lenovo V320', 'Lenovo', 'V320',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Büro EP-ARMS' and kind = 'room'),
       '2025-08-05', 15000, '{}'::jsonb, '1 Notebook, Fabr. Lenovo, Typ V320, Intel Core i5

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 137, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'it', 'Server Synology RS818 Plus', 'Synology', 'RS818 Plus',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Serverraum' and kind = 'room'),
       '2025-08-05', 8000, '{}'::jsonb, '1 Server, Fabr. Synology, Typ RS818 Plus, 4 Festplatteneinschübe

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 142, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'it', 'Firewall Sophos SG-125', 'Sophos', 'SG-125',
       null, 'in_stock', 'defect',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Serverraum' and kind = 'room'),
       '2025-08-05', 5000, '{}'::jsonb, '1 Firewall, Fabr. Sophos, Typ SG-125, lt. Aussage End Of Life

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 143, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'it', 'Server HP Proviant DL 380P', 'HP', 'Proviant DL 380P',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Serverraum' and kind = 'room'),
       '2025-08-05', 15000, '{}'::jsonb, '1 Server, Fabr. HP, Typ Proviant DL 380P, Gen 8, 4 Festplatten

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 144, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'it', 'Server HP Proviant DL 360E', 'HP', 'Proviant DL 360E',
       null, 'in_stock', 'defect',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Serverraum' and kind = 'room'),
       '2025-08-05', 5000, '{}'::jsonb, '1 Server, Fabr. HP, Typ Proviant DL 360E, Gen 8, 4 Festplatten, Prozessor Intel Xeon, vermutl. außer Betrieb

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 145, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'it', 'USV APC Smart UPS 1500', 'APC', 'Smart UPS 1500',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Serverraum' and kind = 'room'),
       '2025-08-05', 8000, '{}'::jsonb, '1 USV, Fabr. APC, Typ Smart UPS 1500

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 146, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'it', 'Posten IT-Hardware', null, null,
       null, 'retired', 'defect',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Serverraum' and kind = 'room'),
       '2025-08-05', 0, '{}'::jsonb, '1 Posten IT-Hardware, best. aus: 5 Rechner/Server, Switch, 2 Monitore, UPS, End Of Life

Bemerkung des Gutachters: Entsorgung
Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 147, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'it', 'W-LAN-Modem AVM FRITZ!Box', 'AVM', 'FRITZ!Box',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Serverraum' and kind = 'room'),
       '2025-08-05', 4000, '{}'::jsonb, '1 W-LAN-Modem, Fabr. AVM, Typ FRITZ!Box

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 148, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'furniture', 'Flipchart', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Besprechungszimmer' and kind = 'room'),
       '2025-08-05', 2000, '{"afa_group": "BGA (16)"}'::jsonb, '1 Flipchart, mobil

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 150, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'machine', '3D-Messarm HEXAGON Absolute Arm RA-7312-4', 'HEXAGON', 'Absolute Arm RA-7312-4',
       '7312-5548-FA', 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Konstruktionsbüro' and kind = 'room'),
       '2025-08-05', 750000, '{"year_built": 2018}'::jsonb, '1 3D-Messarm, Fabr. HEXAGON, Typ Absolute Arm RA-7312-4, Bj 2018, SN 7312-5548-FA, Hartgesteinmessplatte, Fabr. Hommel, Typ Dura, Metall-Untergestell, Transportkoffer

Bemerkung des Gutachters: ehem. Inv.-Nr. 21022
Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 151, Anlagengruppe MTA (15).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'it', '6 27"-Monitore Dell/BenQ/Samsung', 'Dell/BenQ/Samsung', null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Konstruktionsbüro' and kind = 'room'),
       '2025-08-05', 18000, '{}'::jsonb, '6 27"-Monitore, Fabr. Dell/BenQ/Samsung

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 153, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'it', '2 PC', null, null,
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Büro Buchhaltung' and kind = 'room'),
       '2025-08-05', 6000, '{}'::jsonb, '2 PC, älter, u.a. Fabr. XTPC, Intel Core i3, 2 27"-Monitore, Fabr. BenQ/Acer, 2 Tastaturen, 2 Mäuse

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 157, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'it', 'Multifunktionsdrucker HP LaserJet Pro 200 Color MFP', 'HP', 'LaserJet Pro 200 Color MFP',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Büro Buchhaltung' and kind = 'room'),
       '2025-08-05', 5000, '{}'::jsonb, '1 Multifunktionsdrucker, Fabr. HP, Typ LaserJet Pro 200 Color MFP

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 158, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'it', 'Aktenvernichter Schäfer Shop 420S', 'Schäfer Shop', '420S',
       null, 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Büro Buchhaltung' and kind = 'room'),
       '2025-08-05', 5000, '{}'::jsonb, '1 Aktenvernichter, Fabr. Schäfer Shop, Typ 420S

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 159, Anlagengruppe BGA (16).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'vehicle', 'Pkw Audi A4 2,0 TDI Avant', 'Audi', 'A4 2,0 TDI Avant',
       'WAUZZZ8K0DA060638', 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Fuhrpark' and kind = 'room'),
       '2025-08-05', 700000, '{"plate": "LAU-ES 114", "first_reg": "2012-06-01", "fuel": "Diesel", "power_kw": 88, "mileage_km": 91496, "inspection_until": "2025-06-30"}'::jsonb, '1 Pkw, Fabr. Audi, Typ A4 2,0 TDI Avant, amtl. Kennz. LAU-ES 114, EZ 06/12, FIN WAUZZZ8K0DA060638, Diesel, Euro 5, 88 kW, 1.968 cm³, abgel. km-Stand 91.496, Außenfarbe dunkelblau, TÜV 06/25, allgemeine Gebrauchsspuren, schlechte Lackqualität, 8-fach bereift, Räder auf Alu-Leichtmetallfelgen, Innenausstattung Stoff, anthrazit, 6-Gang Schaltgetriebe, Navigationssystem (defekt), Klimaautomatik (defekt)

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 166, Anlagengruppe KFZ (39).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.
Alte Inventarnummer: 32002.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'vehicle', 'Pkw/Transporter Volkswagen Caddy 2,0 Ecofuel', 'Volkswagen', 'Caddy 2,0 Ecofuel',
       'WV2ZZZ2KZDX113677', 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Fuhrpark' and kind = 'room'),
       '2025-08-05', 450000, '{"plate": "LAU-ES 60", "first_reg": "2013-04-01", "fuel": "Benzin/Erdgas", "power_kw": 80, "mileage_km": 129679, "trailer_hitch": true}'::jsonb, '1 Pkw/Transporter, Fabr. Volkswagen, Typ Caddy 2,0 Ecofuel, amtl. Kennz. LAU-ES 60, EZ 04/13, FIN WV2ZZZ2KZDX113677, Benzin/Erdgas, Euro 5, 80 kW, 1.984 cm³, überm. km-Stand 129.679, Außenfarbe weiß, 5-Gang Schaltgetriebe, Klimaanlage, 2 Schiebetüren, Heckklappe, hinten m. Doppelsitz/Einzelsitz, entnehmbar, Mängel: schlechte Lackqualität, Rost, allgemeine Gebrauchsspuren, Anhängerkupplung, starr, PDC hinten

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 167, Anlagengruppe KFZ (39).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.
Alte Inventarnummer: 32005.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'vehicle', 'Pkw Audi A3 Sportback 2,0 TDI', 'Audi', 'A3 Sportback 2,0 TDI',
       'WAUZZZ8P09AU43597', 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Fuhrpark' and kind = 'room'),
       '2025-08-05', 190000, '{"plate": "LAU-ES 777", "first_reg": "2008-10-01", "fuel": "Diesel", "power_kw": 103, "mileage_km": 219632}'::jsonb, '1 Pkw, Fabr. Audi, Typ A3 Sportback 2,0 TDI, amtl. Kennz. LAU-ES 777, EZ 10/08, FIN WAUZZZ8P09AU43597, Diesel, Euro 4, 103 kW, 1.968 cm³, überm. km-Stand 219.632, 4-Türer, Außenfarbe blau, Innenausstattung Stoff, anthrazit, m. Klimaanlage, 6-Gang Schaltgetriebe, PDC vorne/hinten, allgemeine Gebrauchsspuren, schlechte Lackqualität, Lackkratzer, Steinschlagschäden, Scheinwerfer blind

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 168, Anlagengruppe KFZ (39).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.
Alte Inventarnummer: 32003.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'vehicle', 'Pkw-Anhänger TPV Prikolice C42', 'TPV Prikolice', 'C42',
       'ZY2EUAAAAA0068982', 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Fuhrpark' and kind = 'room'),
       '2025-08-05', 45000, '{"plate": "LAU-ES 181", "first_reg": "2012-04-01"}'::jsonb, '1 Pkw-Anhänger, Fabr. TPV Prikolice, Typ C42, amtl. Kennz. LAU-ES 181, EZ 04/12, FIN ZY2EUAAAAA0068982, zul. GG 750 kg, Ladebordwände starr, m. Plane/Spriegel, 1-achsig

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 169, Anlagengruppe KFZ (39).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.', '2877314a-1231-4767-ab24-0a6c4b466d47');
insert into assets (company_id, category, name, manufacturer, model,
       serial_number, status, condition, location_id, purchase_date,
       purchase_price_cents, attributes, notes, created_by)
values ('00b09d31-0231-4075-a44e-79a497419e72', 'vehicle', 'Transporter Fiat Ducato 3,0 JTD 160 Multijet Kasten', 'Fiat', 'Ducato 3,0 JTD 160 Multijet Kasten',
       'ZFA25000001976988', 'in_stock', 'used',
       (select id from locations where company_id = '00b09d31-0231-4075-a44e-79a497419e72' and name = 'Fuhrpark' and kind = 'room'),
       '2025-08-05', 350000, '{"plate": "LAU-ES 747", "first_reg": "2011-06-01", "fuel": "Diesel", "power_kw": 116, "mileage_km": 375614, "trailer_hitch": true}'::jsonb, '1 Transporter, Fabr. Fiat, Typ Ducato 3,0 JTD 160 Multijet Kasten, amtl. Kennz. LAU-ES 747, EZ 06/11, FIN ZFA25000001976988, Diesel, 116 kW, 2.999 cm³, überm. km-Stand 375.614, geschlossener Kasten, Hochdach, Radstand ca. 4.200 mm, Außenfarbe weiß, 6-Gang Schaltgetriebe, Anhängerkupplung, starr, Mängel: schlechter Allgemeinzustand, Lack stark verwittert, Hecktür verbogen, Beulen, Anfahrschaden rechts, Rostbefall

Übernommen aus dem Bewertungsgutachten der NetBid Auction & Valuation vom 05.08.2025 ("Bewertung Engelbreit & Sohn GmbH", Zuordnung nur Massebestandteil), Position 170, Anlagengruppe KFZ (39).
Der Anschaffungswert ist der Fortführungswert des Gutachtens, kein gezahlter Kaufpreis.
Alte Inventarnummer: 38005.', '2877314a-1231-4767-ab24-0a6c4b466d47');

-- Gegenprobe: 103 Objekte, Summe 60.540,00 EUR wie auf Seite 12 des Gutachtens.
do $blk$
declare v_n int; v_s bigint;
begin
    select count(*), coalesce(sum(purchase_price_cents), 0) into v_n, v_s
      from assets where company_id = '00b09d31-0231-4075-a44e-79a497419e72';
    if v_n <> 103 or v_s <> 6054000 then
        raise exception 'Import weicht ab: % Objekte, % Cent', v_n, v_s;
    end if;
    raise notice 'Import in Ordnung: % Objekte, % Cent', v_n, v_s;
end $blk$;

commit;
