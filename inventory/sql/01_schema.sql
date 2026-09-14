-- =============================================================================
-- Inventarverwaltung Snowflake Ventures — Schema
--
-- Ausführen im Supabase SQL Editor als erstes Skript.
-- Reihenfolge: 01_schema.sql → 02_rls.sql → 03_seed.sql
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- =============================================================================
-- 1. Gesellschaften und Zugänge
-- =============================================================================

create table if not exists companies (
    id          uuid primary key default gen_random_uuid(),
    parent_id   uuid references companies(id) on delete restrict,
    name        text not null,
    -- Kurzzeichen für die Inventarnummer, z. B. SFV-IT-2026-0042
    short_code  text not null unique check (short_code ~ '^[A-Z0-9]{2,8}$'),
    is_active   boolean not null default true,
    -- settings.finder_display: Fundanzeige beim Scan durch Fremde (Standard aus)
    -- settings.finder_contact: Kontaktadresse für die Fundanzeige
    settings    jsonb not null default '{}'::jsonb,
    created_at  timestamptz not null default now()
);

create index if not exists companies_parent_idx on companies(parent_id);

-- Zyklen in der Beteiligungskette verhindern (A → B → A)
create or replace function guard_company_cycle()
returns trigger language plpgsql as $$
declare
    walker uuid := new.parent_id;
    hops   int  := 0;
begin
    if new.parent_id is null then
        return new;
    end if;
    if new.parent_id = new.id then
        raise exception 'Eine Gesellschaft kann nicht ihre eigene Mutter sein';
    end if;
    while walker is not null loop
        hops := hops + 1;
        if walker = new.id then
            raise exception 'Zyklus in der Gesellschaftshierarchie';
        end if;
        if hops > 64 then
            raise exception 'Gesellschaftshierarchie zu tief verschachtelt';
        end if;
        select parent_id into walker from companies where id = walker;
    end loop;
    return new;
end;
$$;

drop trigger if exists companies_guard_cycle on companies;
create trigger companies_guard_cycle
    before insert or update of parent_id on companies
    for each row execute function guard_company_cycle();

create table if not exists profiles (
    id          uuid primary key references auth.users(id) on delete cascade,
    full_name   text,
    email       text,
    created_at  timestamptz not null default now()
);

-- Bestehende Auth-Nutzer nachtragen, falls das Profil-Trigger erst jetzt kommt.
insert into profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- user_id zeigt bewusst auf profiles und nicht direkt auf auth.users: PostgREST
-- kann nur über einen echten Fremdschlüssel einbetten, und die Zugangsliste in
-- der Oberfläche braucht zu jeder Mitgliedschaft den Namen. Über
-- profiles.id -> auth.users.id hängt die Kette trotzdem am Auth-Konto.
create table if not exists memberships (
    user_id     uuid not null references profiles(id) on delete cascade,
    company_id  uuid not null references companies(id) on delete cascade,
    role        text not null default 'viewer'
                check (role in ('owner', 'admin', 'editor', 'viewer')),
    created_at  timestamptz not null default now(),
    primary key (user_id, company_id)
);

create index if not exists memberships_company_idx on memberships(company_id);

-- Profil beim Anlegen eines Auth-Nutzers mitschreiben
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into public.profiles (id, email, full_name)
    values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
    on conflict (id) do update
        set email = excluded.email,
            full_name = coalesce(excluded.full_name, profiles.full_name);
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();

-- =============================================================================
-- 2. Standorte und Personen
-- =============================================================================

create table if not exists locations (
    id          uuid primary key default gen_random_uuid(),
    company_id  uuid not null references companies(id) on delete cascade,
    parent_id   uuid references locations(id) on delete set null,
    name        text not null,
    kind        text not null default 'room'
                check (kind in ('site', 'building', 'floor', 'room', 'vehicle', 'external')),
    address     text,
    created_at  timestamptz not null default now()
);

create index if not exists locations_company_idx on locations(company_id);
create index if not exists locations_parent_idx on locations(parent_id);

create table if not exists people (
    id           uuid primary key default gen_random_uuid(),
    company_id   uuid not null references companies(id) on delete cascade,
    full_name    text not null,
    email        text,
    employee_no  text,
    department   text,
    is_active    boolean not null default true,
    created_at   timestamptz not null default now()
);

create index if not exists people_company_idx on people(company_id);

-- =============================================================================
-- 3. Inventar
-- =============================================================================

create table if not exists asset_counters (
    company_id  uuid not null references companies(id) on delete cascade,
    category    text not null,
    year        int  not null,
    next_no     int  not null default 1,
    primary key (company_id, category, year)
);

create table if not exists assets (
    id                   uuid primary key default gen_random_uuid(),
    company_id           uuid not null references companies(id) on delete restrict,
    -- Sprechende Inventarnummer, per Trigger vergeben: SFV-IT-2026-0042
    asset_no             text,
    -- Wert auf dem QR-Aufkleber bzw. NFC-Tag. Opak, damit Bestände nicht
    -- durchzählbar sind und der Aufkleber die Gesellschaft nicht verrät.
    public_code          text not null unique default encode(gen_random_bytes(8), 'hex'),
    category             text not null check (category in ('it', 'furniture', 'machine')),
    name                 text not null,
    manufacturer         text,
    model                text,
    serial_number        text,
    status               text not null default 'in_stock'
                         check (status in ('in_stock', 'in_use', 'maintenance',
                                           'repair', 'retired', 'lost')),
    condition            text check (condition in ('new', 'good', 'used', 'defect')),
    location_id          uuid references locations(id) on delete set null,
    assigned_person_id   uuid references people(id) on delete set null,
    purchase_date        date,
    purchase_price_cents bigint check (purchase_price_cents >= 0),
    currency             text not null default 'EUR',
    supplier             text,
    warranty_until       date,
    depreciation_years   int check (depreciation_years between 1 and 50),
    -- Kategoriespezifische Felder, Katalog in inventory/js/catalog.js
    attributes           jsonb not null default '{}'::jsonb,
    tags                 text[] not null default '{}',
    notes                text,
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now(),
    created_by           uuid references auth.users(id) on delete set null,
    updated_by           uuid references auth.users(id) on delete set null,
    unique (company_id, asset_no)
);

create index if not exists assets_company_idx  on assets(company_id);
create index if not exists assets_category_idx on assets(company_id, category);
create index if not exists assets_status_idx   on assets(company_id, status);
create index if not exists assets_location_idx on assets(location_id);
create index if not exists assets_person_idx   on assets(assigned_person_id);
create index if not exists assets_warranty_idx on assets(warranty_until) where warranty_until is not null;

create index if not exists assets_search_idx on assets using gin (
    (coalesce(name, '') || ' ' || coalesce(manufacturer, '') || ' ' ||
     coalesce(model, '') || ' ' || coalesce(serial_number, '') || ' ' ||
     coalesce(asset_no, '')) gin_trgm_ops
);

create table if not exists assignments (
    id          uuid primary key default gen_random_uuid(),
    company_id  uuid not null references companies(id) on delete cascade,
    asset_id    uuid not null references assets(id) on delete cascade,
    person_id   uuid not null references people(id) on delete restrict,
    from_date   date not null default current_date,
    to_date     date,
    note        text,
    created_at  timestamptz not null default now(),
    created_by  uuid references auth.users(id) on delete set null,
    check (to_date is null or to_date >= from_date)
);

create index if not exists assignments_asset_idx on assignments(asset_id);
create index if not exists assignments_open_idx  on assignments(company_id) where to_date is null;

create table if not exists maintenance (
    id               uuid primary key default gen_random_uuid(),
    company_id       uuid not null references companies(id) on delete cascade,
    asset_id         uuid not null references assets(id) on delete cascade,
    kind             text not null default 'service'
                     check (kind in ('service', 'inspection', 'calibration',
                                     'dguv_v3', 'uvv', 'software_update')),
    title            text,
    interval_months  int check (interval_months between 1 and 120),
    last_done        date,
    due_date         date not null,
    responsible      text,
    notes            text,
    is_done          boolean not null default false,
    created_at       timestamptz not null default now()
);

create index if not exists maintenance_asset_idx on maintenance(asset_id);
create index if not exists maintenance_due_idx   on maintenance(company_id, due_date) where is_done = false;

create table if not exists asset_events (
    id          uuid primary key default gen_random_uuid(),
    company_id  uuid not null references companies(id) on delete cascade,
    asset_id    uuid not null references assets(id) on delete cascade,
    at          timestamptz not null default now(),
    actor_id    uuid references auth.users(id) on delete set null,
    type        text not null,
    payload     jsonb not null default '{}'::jsonb
);

create index if not exists asset_events_asset_idx on asset_events(asset_id, at desc);

create table if not exists attachments (
    id            uuid primary key default gen_random_uuid(),
    company_id    uuid not null references companies(id) on delete cascade,
    asset_id      uuid not null references assets(id) on delete cascade,
    storage_path  text not null unique,
    filename      text not null,
    content_type  text,
    byte_size     bigint,
    kind          text not null default 'photo'
                  check (kind in ('photo', 'invoice', 'manual', 'certificate', 'other')),
    created_at    timestamptz not null default now(),
    created_by    uuid references auth.users(id) on delete set null
);

create index if not exists attachments_asset_idx on attachments(asset_id);

-- =============================================================================
-- 4. Inventarnummern
-- =============================================================================

-- Atomarer Zähler je Gesellschaft, Kategorie und Jahr. Das
-- INSERT … ON CONFLICT DO UPDATE … RETURNING läuft in einem Statement,
-- zwei gleichzeitige Erfassungen können sich also keine Nummer teilen.
create or replace function next_asset_no(p_company uuid, p_category text)
returns text language plpgsql security definer set search_path = public as $$
declare
    v_year  int := extract(year from current_date)::int;
    v_no    int;
    v_code  text;
    -- Kurzzeichen statt der internen Kategorie: auf einem 45,7-mm-Etikett
    -- zählt jedes Zeichen. IT-Technik, Mobiliar, Maschine.
    v_cat   text := case p_category
                        when 'it'        then 'IT'
                        when 'furniture' then 'MOB'
                        when 'machine'   then 'MAS'
                        else upper(left(p_category, 3))
                    end;
begin
    select short_code into v_code from companies where id = p_company;
    if v_code is null then
        raise exception 'Unbekannte Gesellschaft %', p_company;
    end if;

    insert into asset_counters (company_id, category, year, next_no)
    values (p_company, p_category, v_year, 1)
    on conflict (company_id, category, year)
        do update set next_no = asset_counters.next_no + 1
    returning next_no into v_no;

    return v_code || '-' || v_cat || '-' || v_year || '-' || lpad(v_no::text, 4, '0');
end;
$$;

-- =============================================================================
-- 5. Trigger auf assets
-- =============================================================================

create or replace function assets_before_insert()
returns trigger language plpgsql as $$
begin
    if new.asset_no is null or btrim(new.asset_no) = '' then
        new.asset_no := next_asset_no(new.company_id, new.category);
    end if;
    new.created_by := coalesce(new.created_by, auth.uid());
    new.updated_by := new.created_by;
    new.created_at := now();
    new.updated_at := now();
    return new;
end;
$$;

create or replace function assets_before_update()
returns trigger language plpgsql as $$
begin
    -- Ein Umhängen in eine andere Gesellschaft ist auch für die Holding gesperrt.
    -- Ohne das ließe sich die Mandantentrennung per UPDATE aushebeln.
    if new.company_id is distinct from old.company_id then
        raise exception 'Die Gesellschaft eines Inventarobjekts kann nicht geändert werden';
    end if;
    if new.public_code is distinct from old.public_code then
        raise exception 'Der Aufkleber-Code kann nicht geändert werden';
    end if;
    new.updated_by := auth.uid();
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists assets_bi on assets;
create trigger assets_bi before insert on assets
    for each row execute function assets_before_insert();

drop trigger if exists assets_bu on assets;
create trigger assets_bu before update on assets
    for each row execute function assets_before_update();

-- Historie mitschreiben
create or replace function assets_log_event()
returns trigger language plpgsql as $$
declare
    v_changes jsonb := '{}'::jsonb;
begin
    if tg_op = 'INSERT' then
        insert into asset_events (company_id, asset_id, actor_id, type, payload)
        values (new.company_id, new.id, auth.uid(), 'created',
                jsonb_build_object('asset_no', new.asset_no, 'status', new.status));
        return new;
    end if;

    if new.status is distinct from old.status then
        v_changes := v_changes || jsonb_build_object('status',
            jsonb_build_object('von', old.status, 'nach', new.status));
    end if;
    if new.location_id is distinct from old.location_id then
        v_changes := v_changes || jsonb_build_object('location_id',
            jsonb_build_object('von', old.location_id, 'nach', new.location_id));
    end if;
    if new.assigned_person_id is distinct from old.assigned_person_id then
        v_changes := v_changes || jsonb_build_object('assigned_person_id',
            jsonb_build_object('von', old.assigned_person_id, 'nach', new.assigned_person_id));
    end if;

    if v_changes <> '{}'::jsonb then
        insert into asset_events (company_id, asset_id, actor_id, type, payload)
        values (new.company_id, new.id, auth.uid(), 'changed', v_changes);
    end if;
    return new;
end;
$$;

drop trigger if exists assets_ai on assets;
create trigger assets_ai after insert on assets
    for each row execute function assets_log_event();

drop trigger if exists assets_au on assets;
create trigger assets_au after update on assets
    for each row execute function assets_log_event();

-- =============================================================================
-- 6. Referenzielle Klammer: Kindzeilen gehören derselben Gesellschaft
-- =============================================================================

create or replace function enforce_same_company_as_asset()
returns trigger language plpgsql as $$
declare
    v_company uuid;
begin
    select company_id into v_company from assets where id = new.asset_id;
    if v_company is null then
        raise exception 'Unbekanntes Inventarobjekt %', new.asset_id;
    end if;
    if new.company_id is distinct from v_company then
        raise exception 'company_id passt nicht zum Inventarobjekt';
    end if;
    return new;
end;
$$;

do $$
declare t text;
begin
    foreach t in array array['assignments', 'maintenance', 'asset_events', 'attachments'] loop
        execute format('drop trigger if exists %I_same_company on %I', t, t);
        execute format(
            'create trigger %I_same_company before insert or update on %I
             for each row execute function enforce_same_company_as_asset()', t, t);
    end loop;
end;
$$;

-- Zugewiesene Person und Standort müssen zur selben Gesellschaft gehören
create or replace function enforce_asset_refs_same_company()
returns trigger language plpgsql as $$
declare
    v_company uuid;
begin
    if new.location_id is not null then
        select company_id into v_company from locations where id = new.location_id;
        if v_company is distinct from new.company_id then
            raise exception 'Standort gehört zu einer anderen Gesellschaft';
        end if;
    end if;
    if new.assigned_person_id is not null then
        select company_id into v_company from people where id = new.assigned_person_id;
        if v_company is distinct from new.company_id then
            raise exception 'Person gehört zu einer anderen Gesellschaft';
        end if;
    end if;
    return new;
end;
$$;

drop trigger if exists assets_refs on assets;
create trigger assets_refs before insert or update on assets
    for each row execute function enforce_asset_refs_same_company();
