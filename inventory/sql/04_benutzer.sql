-- =============================================================================
-- Benutzer- und Rechteverwaltung
--
-- Ausführen nach 02_rls.sql. Die Datei ist wiederholbar.
--
-- Was hier steht, zerfällt in zwei Teile:
--
--   1. Leseseite. benutzer_liste() liefert der Oberfläche alles, was sie über
--      die Konten anzeigen darf — auch das, was in auth.users liegt und für
--      PostgREST unerreichbar ist. Ohne diese Funktion müsste die Anwendung
--      für jede Zeile den service_role-Schlüssel bemühen, und der gehört
--      nicht in einen Browser.
--
--   2. Schreibseite. Zwei Regeln, die keine Policy ausdrücken kann, weil sie
--      den alten Zustand und die Nachbarzeilen brauchen:
--        - Eine owner-Mitgliedschaft fasst nur an, wer dort selbst owner ist.
--          Sonst könnte sich eine Verwaltung zur Inhaberin befördern oder die
--          Inhaberin hinauswerfen.
--        - Die letzte owner-Mitgliedschaft einer Gesellschaft bleibt stehen.
--          Sonst sperrt sich eine Gesellschaft mit einem Klick selbst aus.
-- =============================================================================

-- =============================================================================
-- 1. Wer ist wo Inhaber
-- =============================================================================

-- Dieselbe Rekursion wie admin_company_ids(), nur enger: Wer die Holding
-- besitzt, ist auch Inhaber jeder Tochter darunter.
create or replace function owner_company_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $fn$
    with recursive roots as (
        select company_id from memberships
         where user_id = auth.uid() and role = 'owner'
    ), tree as (
        select c.id, c.parent_id from companies c
         where c.id in (select company_id from roots)
        union
        select c.id, c.parent_id from companies c
         join tree t on c.parent_id = t.id
    )
    select distinct id from tree;
$fn$;

-- =============================================================================
-- 2. Schutz der Mitgliedschaften
-- =============================================================================

create or replace function guard_membership()
returns trigger
language plpgsql security definer set search_path = public
as $fn$
declare
    v_ich          uuid := auth.uid();
    v_company      uuid := coalesce(new.company_id, old.company_id);
    v_betrifft_own boolean;
    v_rest         int;
begin
    -- Ohne angemeldeten Nutzer läuft das Skript als postgres oder service_role:
    -- Startbestand, Migration, Wiederherstellung. Da gilt der Schutz nicht,
    -- sonst ließe sich die erste Inhaberschaft überhaupt nicht setzen.
    if v_ich is null then
        return coalesce(new, old);
    end if;

    v_betrifft_own := (new is not null and new.role = 'owner')
                   or (old is not null and old.role = 'owner');

    if v_betrifft_own and v_company not in (select owner_company_ids()) then
        raise exception
            'Inhaber-Zugänge vergibt und entzieht nur, wer in dieser Gesellschaft selbst Inhaber ist.'
            using errcode = '42501';
    end if;

    -- Keine Gesellschaft ohne Inhaber zurücklassen. Gezählt wird nicht nur die
    -- Gesellschaft selbst, sondern die ganze Kette nach oben: Wer die Holding
    -- besitzt, ist auch Inhaber jeder Tochter. Den letzten Inhaber einer
    -- Tochter darf man also entfernen, solange über ihr noch jemand steht —
    -- den letzten Inhaber der obersten Gesellschaft nicht.
    if tg_op in ('UPDATE', 'DELETE')
       and old.role = 'owner'
       and (tg_op = 'DELETE' or new.role <> 'owner') then
        with recursive kette as (
            select c.id, c.parent_id from companies c where c.id = old.company_id
            union
            select c.id, c.parent_id from companies c
             join kette k on c.id = k.parent_id
        )
        select count(*) into v_rest
          from memberships m
         where m.company_id in (select id from kette)
           and m.role = 'owner'
           and not (m.user_id = old.user_id and m.company_id = old.company_id);
        if v_rest = 0 then
            raise exception
                'Danach hätte diese Gesellschaft keinen Inhaber mehr. Erst einen zweiten Inhaber eintragen, dann diesen entfernen.'
                using errcode = '42501';
        end if;
    end if;

    return coalesce(new, old);
end;
$fn$;

drop trigger if exists memberships_guard on memberships;
create trigger memberships_guard
    before insert or update or delete on memberships
    for each row execute function guard_membership();

-- =============================================================================
-- 3. Darf ich dieses Konto anfassen
-- =============================================================================

-- Prüft nicht die Rolle, sondern die Reichweite: Ein Konto verwaltet, wer
-- mindestens eine Gesellschaft verwaltet, in der das Konto steht. Inhaber
-- bleiben Inhabern vorbehalten, das eigene Konto ist immer tabu — sonst
-- löscht sich jemand im Eifer selbst.
create or replace function darf_benutzer_verwalten(p_user uuid)
returns boolean
language sql stable security definer set search_path = public
as $fn$
    select case
        when p_user is null or p_user = auth.uid() then false
        when exists (select 1 from memberships m
                      where m.user_id = p_user and m.role = 'owner'
                        and m.company_id not in (select owner_company_ids()))
            then false
        when exists (select 1 from memberships m
                      where m.user_id = p_user
                        and m.company_id in (select admin_company_ids()))
            then true
        -- Konten ganz ohne Zuordnung sieht und räumt nur die oberste Verwaltung.
        when not exists (select 1 from memberships m where m.user_id = p_user)
         and exists (select 1 from companies c
                      where c.parent_id is null
                        and c.id in (select admin_company_ids()))
            then true
        else false
    end;
$fn$;

-- =============================================================================
-- 4. Die Liste für die Oberfläche
-- =============================================================================

-- Liest auth.users — deshalb SECURITY DEFINER. Herausgegeben wird nur, was
-- auf dem Bildschirm steht: Adresse, Name, Zeitstempel, Sperrzustand. Kein
-- Passwort-Hash, kein Token, keine Metadaten.
--
-- rollen enthält ausschließlich Mitgliedschaften in sichtbaren Gesellschaften.
-- Gehört jemand zusätzlich zu einem fremden Zweig, bleibt das verborgen.
create or replace function benutzer_liste()
returns table (
    id                uuid,
    email             text,
    full_name         text,
    angelegt          timestamptz,
    letzte_anmeldung  timestamptz,
    bestaetigt        boolean,
    gesperrt          boolean,
    verwaltbar        boolean,
    rollen            jsonb
)
language sql stable security definer set search_path = public, auth
as $fn$
    with admin_ids as (
        select id from admin_company_ids() id
    ), ist_wurzel as (
        select exists (
            select 1 from companies c
             where c.parent_id is null and c.id in (select id from admin_ids)
        ) as ja
    ), kandidaten as (
        select distinct m.user_id as uid
          from memberships m
         where m.company_id in (select id from admin_ids)
        union
        select p.id
          from profiles p
         where (select ja from ist_wurzel)
           and not exists (select 1 from memberships m where m.user_id = p.id)
    )
    select u.id,
           u.email::text,
           p.full_name,
           u.created_at,
           u.last_sign_in_at,
           u.email_confirmed_at is not null,
           coalesce(u.banned_until > now(), false),
           darf_benutzer_verwalten(u.id),
           coalesce((
               select jsonb_agg(jsonb_build_object('company_id', m.company_id, 'role', m.role)
                                order by m.company_id)
                 from memberships m
                where m.user_id = u.id
                  and m.company_id in (select visible_company_ids())
           ), '[]'::jsonb)
      from kandidaten k
      join auth.users u on u.id = k.uid
      left join profiles p on p.id = u.id
     order by coalesce(p.full_name, u.email::text);
$fn$;

-- Nachschlagen einer Adresse. Bewusst nur für service_role: Sonst hätte jede
-- Verwaltung ein Werkzeug, um fremde Adressen durchzuprobieren. Die
-- Edge-Function ruft sie, nicht der Browser.
create or replace function benutzer_id_zu_email(p_email text)
returns uuid
language sql stable security definer set search_path = public, auth
as $fn$
    select u.id from auth.users u where lower(u.email) = lower(trim(p_email)) limit 1;
$fn$;

-- =============================================================================
-- 5. Rechte auf die neuen Funktionen
-- =============================================================================
-- Postgres vergibt EXECUTE standardmäßig an PUBLIC, und anon erbt das darüber.
-- Jede neue Funktion muss deshalb erst entzogen und dann gezielt vergeben
-- werden. Dieselbe Falle wie bei next_asset_no() — siehe Kommentar in
-- 02_rls.sql.

revoke execute on function owner_company_ids()          from public, anon;
revoke execute on function guard_membership()           from public, anon;
revoke execute on function darf_benutzer_verwalten(uuid) from public, anon;
revoke execute on function benutzer_liste()             from public, anon;
revoke execute on function benutzer_id_zu_email(text)   from public, anon;

grant execute on function owner_company_ids()           to authenticated;
grant execute on function darf_benutzer_verwalten(uuid) to authenticated;
grant execute on function benutzer_liste()              to authenticated;

-- Nur der Schlüssel, der ohnehin alles darf.
revoke execute on function benutzer_id_zu_email(text) from authenticated;
grant  execute on function benutzer_id_zu_email(text) to service_role;
