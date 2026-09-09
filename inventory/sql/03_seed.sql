-- =============================================================================
-- Inventarverwaltung Snowflake Ventures — Startbestand
--
-- Ausführen nach 02_rls.sql. Läuft im SQL Editor als postgres und umgeht
-- deshalb RLS. Das Skript ist wiederholbar: alles hängt an festen UUIDs.
--
-- Die beiden Töchter sind Beispiele zum Anfassen. Echte Gesellschaften legt
-- Snowflake Ventures danach in der Oberfläche an; diese hier können über
-- is_active = false stillgelegt oder gelöscht werden, solange kein Inventar
-- daran hängt.
-- =============================================================================

-- =============================================================================
-- 1. Gesellschaften
-- =============================================================================

insert into companies (id, parent_id, name, short_code, settings) values
    ('11111111-1111-4111-8111-111111111111', null,
     'Snowflake Ventures', 'SFV',
     '{"finder_display": false}'::jsonb),
    ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111',
     'Snowflake Digital GmbH', 'SFD',
     '{"finder_display": false}'::jsonb),
    ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111',
     'Snowflake Industrieservice GmbH', 'SFI',
     '{"finder_display": false}'::jsonb)
on conflict (id) do update
    set name = excluded.name,
        parent_id = excluded.parent_id,
        short_code = excluded.short_code;

-- =============================================================================
-- 2. Standorte
-- =============================================================================

insert into locations (id, company_id, parent_id, name, kind, address) values
    ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
     null, 'Zentrale', 'site', 'Mühlach 11'),
    ('a0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
     'a0000000-0000-4000-8000-000000000001', 'Geschäftsleitung', 'room', null),

    ('b0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
     null, 'Büro Münster', 'site', null),
    ('b0000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
     'b0000000-0000-4000-8000-000000000001', 'Entwicklung, 2. OG', 'room', null),
    ('b0000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222',
     'b0000000-0000-4000-8000-000000000001', 'Besprechung „Nord"', 'room', null),

    ('c0000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333',
     null, 'Werk Ost', 'site', null),
    ('c0000000-0000-4000-8000-000000000002', '33333333-3333-4333-8333-333333333333',
     'c0000000-0000-4000-8000-000000000001', 'Halle 1', 'building', null),
    ('c0000000-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333',
     'c0000000-0000-4000-8000-000000000001', 'Werkstatt', 'room', null)
on conflict (id) do nothing;

-- =============================================================================
-- 3. Personen
-- =============================================================================

insert into people (id, company_id, full_name, email, employee_no, department) values
    ('d0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
     'Lena Brinkmann', null, 'SFD-014', 'Entwicklung'),
    ('d0000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
     'Tobias Averbeck', null, 'SFD-021', 'Vertrieb'),
    ('d0000000-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333',
     'Murat Yildirim', null, 'SFI-007', 'Instandhaltung')
on conflict (id) do nothing;

-- =============================================================================
-- 4. Inventar
-- =============================================================================

insert into assets (
    id, company_id, category, name, manufacturer, model, serial_number,
    status, condition, location_id, assigned_person_id,
    purchase_date, purchase_price_cents, warranty_until, depreciation_years,
    attributes, tags, notes
) values
    -- Holding
    ('e0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
     'it', 'MacBook Pro 14"', 'Apple', 'M4 Pro', 'C02XK1TEST01',
     'in_use', 'good', 'a0000000-0000-4000-8000-000000000002', null,
     '2026-02-17', 289900, '2029-02-17', 3,
     '{"hostname": "sfv-gl-01", "ram_gb": 24, "storage_gb": 1024, "os": "macOS 15", "encrypted": true}'::jsonb,
     '{geschaeftsleitung}', null),

    -- Snowflake Digital
    ('e0000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
     'it', 'ThinkPad T14s', 'Lenovo', 'Gen 5', 'PF3TEST02',
     'in_use', 'good', 'b0000000-0000-4000-8000-000000000002',
     'd0000000-0000-4000-8000-000000000001',
     '2025-09-01', 149000, '2028-09-01', 3,
     '{"hostname": "sfd-dev-04", "ram_gb": 32, "storage_gb": 1024, "os": "Ubuntu 24.04", "encrypted": true}'::jsonb,
     '{entwicklung}', null),
    ('e0000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222',
     'it', 'Dell UltraSharp U2723QE', 'Dell', 'U2723QE', 'CN0TEST03',
     'in_use', 'good', 'b0000000-0000-4000-8000-000000000002',
     'd0000000-0000-4000-8000-000000000001',
     '2025-09-01', 49900, '2028-09-01', 5,
     '{}'::jsonb, '{}', null),
    ('e0000000-0000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222',
     'furniture', 'Schreibtisch, elektrisch höhenverstellbar', 'Kinnarps', 'Oberon', null,
     'in_use', 'good', 'b0000000-0000-4000-8000-000000000002',
     'd0000000-0000-4000-8000-000000000002',
     '2024-04-08', 89000, null, 13,
     '{"material": "Linoleum/Stahl", "dimensions": "180 × 80 cm", "set_size": 1, "afa_group": "Büromöbel"}'::jsonb,
     '{}', null),
    ('e0000000-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222',
     'furniture', 'Konferenztisch, 10 Plätze', 'Sedus', 'Temptation', null,
     'in_use', 'used', 'b0000000-0000-4000-8000-000000000003', null,
     '2021-11-30', 234000, null, 13,
     '{"material": "Eiche furniert", "dimensions": "320 × 120 cm", "set_size": 1}'::jsonb,
     '{}', 'Kante rechts hinten abgestoßen.'),

    -- Snowflake Industrieservice
    ('e0000000-0000-4000-8000-000000000006', '33333333-3333-4333-8333-333333333333',
     'machine', 'Säulenbohrmaschine', 'Optimum', 'B 34 H', 'OPT-2019-4471',
     'in_use', 'used', 'c0000000-0000-4000-8000-000000000002',
     'd0000000-0000-4000-8000-000000000003',
     '2019-06-11', 218000, null, 10,
     '{"year_built": 2019, "power_kw": 1.5, "operating_hours": 4210, "inspection_until": "2027-03-31"}'::jsonb,
     '{halle1}', null),
    ('e0000000-0000-4000-8000-000000000007', '33333333-3333-4333-8333-333333333333',
     'machine', 'Akku-Schlagschrauber', 'Makita', 'DTW1002', 'MAK-TEST-07',
     'in_stock', 'good', 'c0000000-0000-4000-8000-000000000003', null,
     '2024-08-19', 39900, '2027-08-19', 5,
     '{"power_kw": 0.0, "operator_group": "Instandhaltung"}'::jsonb,
     '{werkzeug}', null),
    ('e0000000-0000-4000-8000-000000000008', '33333333-3333-4333-8333-333333333333',
     'it', 'Industrie-Tablet', 'Zebra', 'ET40', 'ZBR-TEST-08',
     'repair', 'defect', 'c0000000-0000-4000-8000-000000000003', null,
     '2023-03-02', 99000, '2026-03-02', 3,
     '{"os": "Android 13", "imei": "350000000000008", "encrypted": true}'::jsonb,
     '{}', 'Display gerissen, Kostenvoranschlag liegt bei der Werkstatt.')
on conflict (id) do nothing;

-- =============================================================================
-- 5. Prüf- und Wartungstermine
-- =============================================================================

insert into maintenance (id, company_id, asset_id, kind, title, interval_months,
                         last_done, due_date, responsible) values
    ('f0000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333',
     'e0000000-0000-4000-8000-000000000006', 'dguv_v3',
     'Wiederholungsprüfung ortsfeste Anlage', 12,
     '2026-03-24', '2027-03-24', 'Elektro Wehmeyer'),
    ('f0000000-0000-4000-8000-000000000002', '33333333-3333-4333-8333-333333333333',
     'e0000000-0000-4000-8000-000000000007', 'dguv_v3',
     'Prüfung ortsveränderliches Gerät', 12,
     '2025-10-06', '2026-10-06', 'Elektro Wehmeyer'),
    ('f0000000-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333',
     'e0000000-0000-4000-8000-000000000006', 'service',
     'Spindel schmieren, Keilriemen prüfen', 6,
     '2026-05-12', '2026-11-12', 'Murat Yildirim'),
    ('f0000000-0000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222',
     'e0000000-0000-4000-8000-000000000002', 'software_update',
     'Betriebssystem-Hauptversion prüfen', 12,
     '2026-04-02', '2027-04-02', 'IT')
on conflict (id) do nothing;

-- =============================================================================
-- 6. Offene Ausgabe an Mitarbeitende
-- =============================================================================

insert into assignments (id, company_id, asset_id, person_id, from_date, note) values
    ('f1000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
     'e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001',
     '2025-09-02', 'Übergabe inklusive Netzteil und Dock.'),
    ('f1000000-0000-4000-8000-000000000002', '33333333-3333-4333-8333-333333333333',
     'e0000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000003',
     '2024-01-15', 'Bedienerfreigabe liegt vor.')
on conflict (id) do nothing;

-- =============================================================================
-- 7. Zähler auf den Stand der Seed-Daten heben
-- =============================================================================
-- Die Assets oben haben ihre Nummern per Trigger bekommen. Damit die nächste
-- Erfassung in der Oberfläche nicht kollidiert, ist hier nichts weiter zu tun —
-- next_asset_no() hat den Zähler beim Einfügen bereits mitgezogen.

select c.name as gesellschaft, count(a.id) as inventarobjekte
  from companies c
  left join assets a on a.company_id = c.id
 group by c.name
 order by c.name;
