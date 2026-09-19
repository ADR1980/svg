-- =============================================================================
-- 05. Kategorie Fahrzeug
--
-- Nachtrag für Datenbanken, die bereits mit 01_schema.sql aufgebaut wurden.
-- Ein frischer Aufbau braucht diese Datei nicht — dort steht beides schon in
-- 01_schema.sql. Die Datei ist mehrfach ausführbar.
--
-- Fahrzeuge passten vorher in keine der drei Kategorien. Sie als Maschine zu
-- führen ginge, aber dann heißt der Firmenwagen ATC-MAS-2026-0104 und steht in
-- der Liste zwischen Bohrmaschinen. Ein eigenes Kurzzeichen kostet nichts und
-- macht Inventarnummer wie Etikett auf einen Blick lesbar.
-- =============================================================================

alter table assets drop constraint if exists assets_category_check;
alter table assets add  constraint assets_category_check
      check (category in ('it', 'furniture', 'machine', 'vehicle'));

-- Unverändert bis auf die Zeile für 'vehicle'. CREATE OR REPLACE behält die
-- vergebenen Rechte; der grant unten steht trotzdem da, damit die Datei auch
-- allein läuft.
create or replace function next_asset_no(p_company uuid, p_category text)
returns text language plpgsql security definer set search_path = public as $fn$
declare
    v_year  int := extract(year from current_date)::int;
    v_no    int;
    v_code  text;
    -- Kurzzeichen statt der internen Kategorie: auf einem 45,7-mm-Etikett
    -- zählt jedes Zeichen. IT-Technik, Mobiliar, Maschine, Fahrzeug.
    v_cat   text := case p_category
                        when 'it'        then 'IT'
                        when 'furniture' then 'MOB'
                        when 'machine'   then 'MAS'
                        when 'vehicle'   then 'KFZ'
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
$fn$;

revoke execute on function next_asset_no(uuid, text) from public;
grant  execute on function next_asset_no(uuid, text) to authenticated;
