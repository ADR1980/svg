-- =============================================================================
-- Inventarverwaltung Snowflake Ventures — Row Level Security
--
-- Ausführen nach 01_schema.sql.
--
-- Grundsatz: Die Trennung der Gesellschaften steckt in Postgres, nicht im
-- JavaScript. Wer die Konsole im Browser öffnet und mit dem anon key eigene
-- Abfragen absetzt, bekommt genau dieselben Zeilen wie über die Oberfläche.
-- =============================================================================

-- =============================================================================
-- 1. Sichtbarkeit und Schreibrecht
-- =============================================================================

-- Das Skript ist wiederholbar. CASCADE räumt die Policies mit weg, die auf den
-- Funktionen sitzen — sie werden weiter unten alle neu angelegt.
drop function if exists visible_company_ids()       cascade;
drop function if exists writable_company_ids()      cascade;
drop function if exists admin_company_ids()         cascade;
drop function if exists visible_user_ids()          cascade;
drop function if exists visible_company_ids_text()  cascade;
drop function if exists writable_company_ids_text() cascade;
drop function if exists finder_info(text)           cascade;

-- Alle Gesellschaften, die der angemeldete Nutzer sehen darf: die eigenen
-- Mitgliedschaften plus sämtliche darunterliegenden Töchter, beliebig tief.
--
-- SECURITY DEFINER ist hier kein Schlendrian, sondern nötig: Eine Policy auf
-- memberships, die selbst memberships liest, führt in Postgres zu 42P17
-- (infinite recursion detected in policy). Die Funktion umgeht RLS und
-- durchbricht damit den Kreis. UNION statt UNION ALL, damit ein versehentlicher
-- Zyklus in der Hierarchie die Rekursion nicht endlos laufen lässt.
create or replace function visible_company_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
    with recursive roots as (
        select company_id from memberships where user_id = auth.uid()
    ), tree as (
        select c.id, c.parent_id from companies c
         where c.id in (select company_id from roots)
        union
        select c.id, c.parent_id from companies c
         join tree t on c.parent_id = t.id
    )
    select distinct id from tree;
$$;

-- Dasselbe, aber nur für Mitgliedschaften mit Schreibrecht. Ein viewer bekommt
-- ein leeres Array — deshalb muss keine einzige Policy die Rolle selbst kennen.
create or replace function writable_company_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
    with recursive roots as (
        select company_id from memberships
         where user_id = auth.uid() and role in ('owner', 'admin', 'editor')
    ), tree as (
        select c.id, c.parent_id from companies c
         where c.id in (select company_id from roots)
        union
        select c.id, c.parent_id from companies c
         join tree t on c.parent_id = t.id
    )
    select distinct id from tree;
$$;

-- Gesellschaften, in denen der Nutzer Stammdaten und Zugänge verwalten darf.
create or replace function admin_company_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
    with recursive roots as (
        select company_id from memberships
         where user_id = auth.uid() and role in ('owner', 'admin')
    ), tree as (
        select c.id, c.parent_id from companies c
         where c.id in (select company_id from roots)
        union
        select c.id, c.parent_id from companies c
         join tree t on c.parent_id = t.id
    )
    select distinct id from tree;
$$;

-- Textvarianten für die Storage-Policies: storage.objects enthält auch Objekte
-- anderer Buckets, deren erstes Pfadsegment keine UUID ist. Ein ::uuid-Cast in
-- der Policy würde dort mit einem Fehler abbrechen, statt die Zeile nur
-- auszublenden — deshalb wird als Text verglichen.
create or replace function visible_company_ids_text()
returns setof text
language sql stable security definer set search_path = public
as $$ select id::text from visible_company_ids() id; $$;

create or replace function writable_company_ids_text()
returns setof text
language sql stable security definer set search_path = public
as $$ select id::text from writable_company_ids() id; $$;

-- Nutzer, deren Namen in der Oberfläche auftauchen dürfen (Historie, Zugänge).
create or replace function visible_user_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
    select distinct m.user_id
      from memberships m
     where m.company_id in (select visible_company_ids());
$$;

-- =============================================================================
-- 2. Policies
-- =============================================================================

alter table companies      enable row level security;
alter table profiles       enable row level security;
alter table memberships    enable row level security;
alter table locations      enable row level security;
alter table people         enable row level security;
alter table assets         enable row level security;
alter table assignments    enable row level security;
alter table maintenance    enable row level security;
alter table asset_events   enable row level security;
alter table attachments    enable row level security;
alter table asset_counters enable row level security;

-- asset_counters bekommt bewusst keine einzige Policy: An die Tabelle kommt
-- nur next_asset_no() heran, und die läuft als SECURITY DEFINER.

-- --- Gesellschaften -----------------------------------------------------------
-- Der zweite Zweig sieht überflüssig aus, ist es aber nicht. Beim Anlegen einer
-- Tochter fragt PostgREST die Zeile mit RETURNING gleich wieder ab, und für ein
-- RETURNING prüft Postgres auch die SELECT-Policy. visible_company_ids() ist
-- STABLE und wird als InitPlan ausgewertet, bevor die neue Zeile existiert — die
-- frisch angelegte Tochter fiele also durch ihre eigene Leseprüfung.
-- Fachlich ändert der Zweig nichts: Wessen Mutter sichtbar ist, ist als deren
-- Nachfahre ohnehin sichtbar.
drop policy if exists companies_select on companies;
create policy companies_select on companies for select
    using (
        id in (select visible_company_ids())
        or parent_id in (select visible_company_ids())
    );

-- Eine neue Tochter darf nur unter eine Gesellschaft, die man verwaltet.
-- parent_id is null wäre eine zweite Holding — das macht nur der service_role.
drop policy if exists companies_insert on companies;
create policy companies_insert on companies for insert
    with check (parent_id in (select admin_company_ids()));

drop policy if exists companies_update on companies;
create policy companies_update on companies for update
    using      (id in (select admin_company_ids()))
    with check (id in (select admin_company_ids()));

-- Kein DELETE. Gesellschaften werden über is_active = false stillgelegt,
-- sonst hinge das Inventar an einer verschwundenen Zeile.

-- --- Profile ------------------------------------------------------------------
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
    using (id = auth.uid() or id in (select visible_user_ids()));

drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update
    using (id = auth.uid()) with check (id = auth.uid());

-- --- Mitgliedschaften ---------------------------------------------------------
drop policy if exists memberships_select on memberships;
create policy memberships_select on memberships for select
    using (company_id in (select visible_company_ids()));

drop policy if exists memberships_insert on memberships;
create policy memberships_insert on memberships for insert
    with check (company_id in (select admin_company_ids()));

drop policy if exists memberships_update on memberships;
create policy memberships_update on memberships for update
    using      (company_id in (select admin_company_ids()))
    with check (company_id in (select admin_company_ids()));

drop policy if exists memberships_delete on memberships;
create policy memberships_delete on memberships for delete
    using (company_id in (select admin_company_ids()));

-- --- Inhaltstabellen ----------------------------------------------------------
-- Alle sieben nach demselben Schnitt. Zwei Feinheiten, die hier drinstecken:
--
-- 1. WITH CHECK steht auch am UPDATE. Fehlt es, könnte ein Tochter-Admin ein
--    eigenes Objekt per company_id-Änderung in eine fremde Gesellschaft
--    schieben. Bei assets sperrt zusätzlich ein Trigger den Wechsel ganz.
-- 2. "in (select f())" mit einer Funktion, die setof uuid liefert. Die
--    Unterabfrage hat keinen Bezug auf die Zeile, Postgres wertet sie deshalb
--    als InitPlan einmal je Statement aus und hasht das Ergebnis — nicht einmal
--    je Zeile. Ein "= any (f())" mit Array-Rückgabe wäre inhaltlich dasselbe,
--    liefe aber je Zeile erneut durch die rekursive Abfrage.
do $$
declare t text;
begin
    foreach t in array array['locations', 'people', 'assets', 'assignments',
                             'maintenance', 'asset_events', 'attachments'] loop
        execute format('drop policy if exists %I_select on %I', t, t);
        execute format('drop policy if exists %I_insert on %I', t, t);
        execute format('drop policy if exists %I_update on %I', t, t);
        execute format('drop policy if exists %I_delete on %I', t, t);

        execute format(
            'create policy %I_select on %I for select
                using (company_id in (select visible_company_ids()))', t, t);
        execute format(
            'create policy %I_insert on %I for insert
                with check (company_id in (select writable_company_ids()))', t, t);
        execute format(
            'create policy %I_update on %I for update
                using      (company_id in (select writable_company_ids()))
                with check (company_id in (select writable_company_ids()))', t, t);
        execute format(
            'create policy %I_delete on %I for delete
                using (company_id in (select writable_company_ids()))', t, t);
    end loop;
end;
$$;

-- Die Historie soll niemand nachträglich glattbügeln.
drop policy if exists asset_events_update on asset_events;
drop policy if exists asset_events_delete on asset_events;

-- =============================================================================
-- 3. Rechte
-- =============================================================================

-- Supabase legt für neue Tabellen in public Standardrechte an, unter anderem
-- für anon. Die werden hier wieder eingesammelt: Ohne Anmeldung gibt es keinen
-- Tabellenzugriff, RLS ist dann nur noch die zweite Verteidigungslinie.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function visible_company_ids()  to authenticated;
grant execute on function writable_company_ids() to authenticated;
grant execute on function admin_company_ids()    to authenticated;
grant execute on function visible_user_ids()     to authenticated;
grant execute on function visible_company_ids_text()  to authenticated;
grant execute on function writable_company_ids_text() to authenticated;
grant execute on function next_asset_no(uuid, text) to authenticated;

revoke all on asset_counters from authenticated;

-- =============================================================================
-- 4. Fundanzeige für nicht angemeldete Scans
-- =============================================================================

-- Standardmäßig zeigt ein gescannter Aufkleber einem Fremden nichts. Schaltet
-- eine Gesellschaft settings.finder_display ein, gibt diese Funktion Name und
-- Kontakt heraus — mehr nicht, insbesondere weder Standort noch Nutzer.
create or replace function finder_info(p_code text)
returns table (company_name text, contact text)
language sql stable security definer set search_path = public
as $$
    select c.name, c.settings ->> 'finder_contact'
      from assets a
      join companies c on c.id = a.company_id
     where a.public_code = p_code
       and coalesce((c.settings ->> 'finder_display')::boolean, false) = true;
$$;

grant execute on function finder_info(text) to anon, authenticated;

-- =============================================================================
-- 5. Speicher für Fotos und Belege
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('asset-photos', 'asset-photos', false)
on conflict (id) do nothing;

-- Pfadschema: <company_id>/<asset_id>/<dateiname>. Die Policy schneidet am
-- ersten Segment, damit für Dateien dieselbe Hierarchie gilt wie für Zeilen.
drop policy if exists asset_photos_select on storage.objects;
create policy asset_photos_select on storage.objects for select
    using (
        bucket_id = 'asset-photos'
        and (storage.foldername(name))[1] in (select visible_company_ids_text())
    );

drop policy if exists asset_photos_insert on storage.objects;
create policy asset_photos_insert on storage.objects for insert
    with check (
        bucket_id = 'asset-photos'
        and (storage.foldername(name))[1] in (select writable_company_ids_text())
    );

drop policy if exists asset_photos_update on storage.objects;
create policy asset_photos_update on storage.objects for update
    using (
        bucket_id = 'asset-photos'
        and (storage.foldername(name))[1] in (select writable_company_ids_text())
    );

drop policy if exists asset_photos_delete on storage.objects;
create policy asset_photos_delete on storage.objects for delete
    using (
        bucket_id = 'asset-photos'
        and (storage.foldername(name))[1] in (select writable_company_ids_text())
    );
