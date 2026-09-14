-- =============================================================================
-- Inventarverwaltung Snowflake Ventures — Prüfung der Mandantentrennung
--
-- Im Supabase SQL Editor ausführen, nachdem 01_schema.sql und 02_rls.sql
-- gelaufen sind. Das Skript legt Testdaten an, prüft sie und verwirft am Ende
-- alles per ROLLBACK. Es hinterlässt nichts.
--
-- Geprüft wird gegen echte JWT-Claims und die Rolle authenticated, also genau
-- den Weg, den auch der Browser mit dem anon key nimmt. Schlägt ein Fall fehl,
-- bricht das Skript mit "FEHLGESCHLAGEN: …" ab.
-- =============================================================================

begin;

-- =============================================================================
-- Testaufbau (als postgres, RLS greift hier noch nicht)
-- =============================================================================

insert into companies (id, parent_id, name, short_code) values
    ('99999999-9999-4999-8999-999999999901', null,
     'Test-Holding', 'TSTH'),
    ('99999999-9999-4999-8999-999999999902', '99999999-9999-4999-8999-999999999901',
     'Test-Tochter A', 'TSTA'),
    ('99999999-9999-4999-8999-999999999903', '99999999-9999-4999-8999-999999999901',
     'Test-Tochter B', 'TSTB');

insert into auth.users (id, instance_id, aud, role, email) values
    ('99999999-9999-4999-8999-9999999990a1', '00000000-0000-0000-0000-000000000000',
     'authenticated', 'authenticated', 'rls-test-holding@example.invalid'),
    ('99999999-9999-4999-8999-9999999990a2', '00000000-0000-0000-0000-000000000000',
     'authenticated', 'authenticated', 'rls-test-a-admin@example.invalid'),
    ('99999999-9999-4999-8999-9999999990a3', '00000000-0000-0000-0000-000000000000',
     'authenticated', 'authenticated', 'rls-test-a-viewer@example.invalid'),
    ('99999999-9999-4999-8999-9999999990a4', '00000000-0000-0000-0000-000000000000',
     'authenticated', 'authenticated', 'rls-test-b-admin@example.invalid');

insert into memberships (user_id, company_id, role) values
    ('99999999-9999-4999-8999-9999999990a1', '99999999-9999-4999-8999-999999999901', 'owner'),
    ('99999999-9999-4999-8999-9999999990a2', '99999999-9999-4999-8999-999999999902', 'admin'),
    ('99999999-9999-4999-8999-9999999990a3', '99999999-9999-4999-8999-999999999902', 'viewer'),
    ('99999999-9999-4999-8999-9999999990a4', '99999999-9999-4999-8999-999999999903', 'admin');

insert into assets (id, company_id, category, name) values
    ('99999999-9999-4999-8999-9999999900a1', '99999999-9999-4999-8999-999999999902',
     'it', 'Testgerät A-1'),
    ('99999999-9999-4999-8999-9999999900a2', '99999999-9999-4999-8999-999999999902',
     'it', 'Testgerät A-2'),
    ('99999999-9999-4999-8999-9999999900b1', '99999999-9999-4999-8999-999999999903',
     'machine', 'Testmaschine B-1');

-- =============================================================================
-- Fall 1 — Tochter A sieht ausschließlich ihr eigenes Inventar
-- =============================================================================

set local role authenticated;
set local request.jwt.claims = '{"sub":"99999999-9999-4999-8999-9999999990a2","role":"authenticated"}';

do $$
declare n int;
begin
    select count(*) into n from assets;
    if n <> 2 then
        raise exception 'FEHLGESCHLAGEN 1a: Tochter A sieht % Objekte statt 2', n;
    end if;

    select count(*) into n from assets
     where company_id = '99999999-9999-4999-8999-999999999903';
    if n <> 0 then
        raise exception 'FEHLGESCHLAGEN 1b: Tochter A sieht % Objekte von Tochter B', n;
    end if;

    select count(*) into n from companies;
    if n <> 1 then
        raise exception 'FEHLGESCHLAGEN 1c: Tochter A sieht % Gesellschaften statt 1', n;
    end if;

    raise notice 'Fall 1 bestanden: Tochter A sieht nur die eigenen zwei Objekte.';
end;
$$;

-- =============================================================================
-- Fall 2 — Tochter A kann nichts in eine fremde Gesellschaft schreiben
-- =============================================================================

do $$
declare n int;
begin
    -- Einfügen mit fremder company_id muss an der WITH-CHECK-Klausel scheitern
    begin
        insert into assets (company_id, category, name)
        values ('99999999-9999-4999-8999-999999999903', 'it', 'Eingeschmuggelt');
        raise exception 'FEHLGESCHLAGEN 2a: Insert mit fremder company_id war erlaubt';
    exception
        when insufficient_privilege then null;
    end;

    -- Verschieben eines eigenen Objekts in eine fremde Gesellschaft ebenso
    begin
        update assets
           set company_id = '99999999-9999-4999-8999-999999999903'
         where id = '99999999-9999-4999-8999-9999999900a1';
        raise exception 'FEHLGESCHLAGEN 2b: Umhängen in fremde Gesellschaft war erlaubt';
    exception
        when insufficient_privilege or raise_exception then null;
    end;

    -- Ein fremdes Objekt ändern trifft schlicht keine Zeile
    update assets set name = 'Übernommen'
     where id = '99999999-9999-4999-8999-9999999900b1';
    get diagnostics n = row_count;
    if n <> 0 then
        raise exception 'FEHLGESCHLAGEN 2c: % fremde Zeilen geändert', n;
    end if;

    -- Löschen eines fremden Objekts ebenfalls nicht
    delete from assets where id = '99999999-9999-4999-8999-9999999900b1';
    get diagnostics n = row_count;
    if n <> 0 then
        raise exception 'FEHLGESCHLAGEN 2d: % fremde Zeilen gelöscht', n;
    end if;

    -- Das eigene Inventar darf sie natürlich pflegen
    insert into assets (company_id, category, name)
    values ('99999999-9999-4999-8999-999999999902', 'furniture', 'Regal A-3');

    raise notice 'Fall 2 bestanden: Schreibzugriff endet an der Gesellschaftsgrenze.';
end;
$$;

-- =============================================================================
-- Fall 3 — viewer darf lesen, aber nichts anlegen
-- =============================================================================

set local request.jwt.claims = '{"sub":"99999999-9999-4999-8999-9999999990a3","role":"authenticated"}';

do $$
declare n int;
begin
    select count(*) into n from assets;
    if n <> 3 then
        raise exception 'FEHLGESCHLAGEN 3a: viewer sieht % Objekte statt 3', n;
    end if;

    begin
        insert into assets (company_id, category, name)
        values ('99999999-9999-4999-8999-999999999902', 'it', 'Von einem viewer');
        raise exception 'FEHLGESCHLAGEN 3b: viewer durfte anlegen';
    exception
        when insufficient_privilege then null;
    end;

    update assets set name = 'Umbenannt durch viewer'
     where id = '99999999-9999-4999-8999-9999999900a1';
    get diagnostics n = row_count;
    if n <> 0 then
        raise exception 'FEHLGESCHLAGEN 3c: viewer hat % Zeilen geändert', n;
    end if;

    raise notice 'Fall 3 bestanden: viewer liest, schreibt aber nicht.';
end;
$$;

-- =============================================================================
-- Fall 4 — die Holding sieht alles und darf auch in den Töchtern arbeiten
-- =============================================================================

set local request.jwt.claims = '{"sub":"99999999-9999-4999-8999-9999999990a1","role":"authenticated"}';

do $$
declare n int;
begin
    select count(*) into n from assets;
    if n <> 4 then
        raise exception 'FEHLGESCHLAGEN 4a: Holding sieht % Objekte statt 4', n;
    end if;

    select count(*) into n from companies;
    if n <> 3 then
        raise exception 'FEHLGESCHLAGEN 4b: Holding sieht % Gesellschaften statt 3', n;
    end if;

    insert into assets (company_id, category, name)
    values ('99999999-9999-4999-8999-999999999903', 'it', 'Von der Holding erfasst');

    -- Neue Tochter unter der eigenen Holding: erlaubt. RETURNING gehört zum
    -- Test dazu — PostgREST fragt beim Anlegen genauso zurück, und dabei greift
    -- zusätzlich die SELECT-Policy auf einer Zeile, die es eben noch nicht gab.
    declare v_neu uuid;
    begin
        insert into companies (parent_id, name, short_code)
        values ('99999999-9999-4999-8999-999999999901', 'Test-Tochter C', 'TSTC')
        returning id into v_neu;
        if v_neu is null then
            raise exception 'FEHLGESCHLAGEN 4c: RETURNING lieferte nichts zurück';
        end if;
    end;

    -- Eine zweite Holding ohne Mutter dagegen nicht
    begin
        insert into companies (parent_id, name, short_code)
        values (null, 'Fremde Holding', 'TSTX');
        raise exception 'FEHLGESCHLAGEN 4d: Anlegen einer wurzellosen Gesellschaft war erlaubt';
    exception
        when insufficient_privilege then null;
    end;

    raise notice 'Fall 4 bestanden: Holding sieht und pflegt den Gesamtbestand.';
end;
$$;

-- =============================================================================
-- Fall 5 — Tochter B blickt weder nach oben noch zur Schwester
-- =============================================================================

set local request.jwt.claims = '{"sub":"99999999-9999-4999-8999-9999999990a4","role":"authenticated"}';

do $$
declare n int;
begin
    select count(*) into n from assets;
    if n <> 2 then
        raise exception 'FEHLGESCHLAGEN 5a: Tochter B sieht % Objekte statt 2', n;
    end if;

    select count(*) into n from memberships;
    if n <> 1 then
        raise exception 'FEHLGESCHLAGEN 5b: Tochter B sieht % Mitgliedschaften statt 1', n;
    end if;

    -- Sich selbst in die Holding schreiben: ausgeschlossen
    begin
        insert into memberships (user_id, company_id, role)
        values ('99999999-9999-4999-8999-9999999990a4',
                '99999999-9999-4999-8999-999999999901', 'owner');
        raise exception 'FEHLGESCHLAGEN 5c: Selbstbeförderung in die Holding war erlaubt';
    exception
        when insufficient_privilege then null;
    end;

    raise notice 'Fall 5 bestanden: Tochter B bleibt in ihrer Gesellschaft.';
end;
$$;

-- =============================================================================
-- Fall 6 — der Zähler vergibt fortlaufende, kollisionsfreie Nummern
-- =============================================================================

reset role;

do $$
declare a text; b text;
begin
    select asset_no into a from assets
     where id = '99999999-9999-4999-8999-9999999900a1';
    if a !~ '^TSTA-IT-[0-9]{4}-[0-9]{4}$' then
        raise exception 'FEHLGESCHLAGEN 6a: unerwartete Inventarnummer %', a;
    end if;

    select asset_no into b from assets
     where id = '99999999-9999-4999-8999-9999999900a2';
    if a = b then
        raise exception 'FEHLGESCHLAGEN 6b: zwei Objekte mit derselben Nummer %', a;
    end if;

    raise notice 'Fall 6 bestanden: Nummernkreis läuft (% und %).', a, b;
end;
$$;

-- =============================================================================
-- Fall 7 — ohne Anmeldung kommt niemand an die Funktionen
-- =============================================================================
-- Der Fall existiert wegen eines echten Fehlgriffs: Ein "revoke ... from anon"
-- allein lässt EXECUTE über den PUBLIC-Grant bestehen. next_asset_no() war
-- dadurch unangemeldet aufrufbar und gab zu einer bekannten Gesellschafts-UUID
-- deren Kurzzeichen heraus.

set local role anon;

do $$
declare n int;
begin
    begin
        perform next_asset_no('99999999-9999-4999-8999-999999999902', 'it');
        raise exception 'FEHLGESCHLAGEN 7a: next_asset_no war ohne Anmeldung aufrufbar';
    exception when insufficient_privilege then null;
    end;

    begin
        perform visible_company_ids();
        raise exception 'FEHLGESCHLAGEN 7b: visible_company_ids war ohne Anmeldung aufrufbar';
    exception when insufficient_privilege then null;
    end;

    -- benutzer_liste() liest auth.users. Käme sie ohne Anmeldung durch, läge
    -- die Adressliste aller Konten offen.
    begin
        perform * from benutzer_liste();
        raise exception 'FEHLGESCHLAGEN 7d: benutzer_liste war ohne Anmeldung aufrufbar';
    exception when insufficient_privilege then null;
    end;

    begin
        perform benutzer_id_zu_email('rls-test-holding@example.invalid');
        raise exception 'FEHLGESCHLAGEN 7e: benutzer_id_zu_email war ohne Anmeldung aufrufbar';
    exception when insufficient_privilege then null;
    end;

    -- Die Fundanzeige ist die einzige bewusste Ausnahme und muss weiter gehen.
    select count(*) into n from finder_info('0000000000000000');
    if n <> 0 then
        raise exception 'FEHLGESCHLAGEN 7c: finder_info lieferte % Zeilen statt 0', n;
    end if;

    raise notice 'Fall 7 bestanden: Ohne Anmeldung ist keine Funktion erreichbar.';
end;
$$;

reset role;

-- =============================================================================
-- Fall 8 — eine Verwaltung kann sich nicht zur Inhaberin machen
-- =============================================================================
-- Die Policy auf memberships lässt den Schreibzugriff durch: Tochter A steht
-- in admin_company_ids() des Nutzers. Gestoppt wird er erst vom Trigger
-- memberships_guard, und genau das wird hier geprüft.

set local role authenticated;
set local request.jwt.claims = '{"sub":"99999999-9999-4999-8999-9999999990a2","role":"authenticated"}';

do $$
begin
    begin
        insert into memberships (user_id, company_id, role)
        values ('99999999-9999-4999-8999-9999999990a3',
                '99999999-9999-4999-8999-999999999902', 'owner');
        raise exception 'FEHLGESCHLAGEN 8a: admin konnte einen Inhaber-Zugang vergeben';
    exception when insufficient_privilege then null;
    end;

    begin
        update memberships set role = 'owner'
         where user_id = '99999999-9999-4999-8999-9999999990a2'
           and company_id = '99999999-9999-4999-8999-999999999902';
        raise exception 'FEHLGESCHLAGEN 8b: admin konnte sich selbst zum Inhaber machen';
    exception when insufficient_privilege then null;
    end;

    -- Eine Rolle unterhalb von owner darf die Verwaltung sehr wohl setzen.
    update memberships set role = 'editor'
     where user_id = '99999999-9999-4999-8999-9999999990a3'
       and company_id = '99999999-9999-4999-8999-999999999902';
    if not found then
        raise exception 'FEHLGESCHLAGEN 8c: admin konnte keine gewöhnliche Rolle setzen';
    end if;

    raise notice 'Fall 8 bestanden: Inhaber-Zugaenge bleiben Inhabern vorbehalten.';
end;
$$;

-- =============================================================================
-- Fall 9 — der Inhaber darf vergeben, aber sich nicht selbst aussperren
-- =============================================================================

set local request.jwt.claims = '{"sub":"99999999-9999-4999-8999-9999999990a1","role":"authenticated"}';

do $$
begin
    insert into memberships (user_id, company_id, role)
    values ('99999999-9999-4999-8999-9999999990a4',
            '99999999-9999-4999-8999-999999999902', 'owner');

    begin
        delete from memberships
         where user_id = '99999999-9999-4999-8999-9999999990a1'
           and company_id = '99999999-9999-4999-8999-999999999901';
        raise exception 'FEHLGESCHLAGEN 9a: der letzte Inhaber der Holding liess sich entfernen';
    exception when insufficient_privilege then null;
    end;

    begin
        update memberships set role = 'viewer'
         where user_id = '99999999-9999-4999-8999-9999999990a1'
           and company_id = '99999999-9999-4999-8999-999999999901';
        raise exception 'FEHLGESCHLAGEN 9b: der letzte Inhaber konnte sich herabstufen';
    exception when insufficient_privilege then null;
    end;

    -- Der eben vergebene Inhaber der Tochter darf dagegen wieder weg: Über
    -- Tochter A steht die Holding, und die hat einen Inhaber.
    delete from memberships
     where user_id = '99999999-9999-4999-8999-9999999990a4'
       and company_id = '99999999-9999-4999-8999-999999999902';
    if not found then
        raise exception 'FEHLGESCHLAGEN 9c: der Inhaber einer Tochter liess sich nicht entfernen';
    end if;

    raise notice 'Fall 9 bestanden: Der letzte Inhaber der obersten Gesellschaft bleibt stehen.';
end;
$$;

-- =============================================================================
-- Fall 10 — die Kontoliste endet an derselben Grenze wie das Inventar
-- =============================================================================
-- benutzer_liste() liest auth.users und laeuft als SECURITY DEFINER. Eine
-- Policy schuetzt hier also nichts; die Auswahl steckt in der Funktion selbst.

set local request.jwt.claims = '{"sub":"99999999-9999-4999-8999-9999999990a2","role":"authenticated"}';

do $$
declare ids uuid[];
begin
    select array_agg(id) into ids from benutzer_liste();

    if not (ids @> array['99999999-9999-4999-8999-9999999990a2'::uuid,
                         '99999999-9999-4999-8999-9999999990a3'::uuid]) then
        raise exception 'FEHLGESCHLAGEN 10a: die eigenen Konten fehlen in der Liste';
    end if;
    if ids && array['99999999-9999-4999-8999-9999999990a1'::uuid,
                    '99999999-9999-4999-8999-9999999990a4'::uuid] then
        raise exception 'FEHLGESCHLAGEN 10b: fremde Konten standen in der Liste';
    end if;

    raise notice 'Fall 10a bestanden: Die Tochter sieht nur die eigenen Konten.';
end;
$$;

set local request.jwt.claims = '{"sub":"99999999-9999-4999-8999-9999999990a1","role":"authenticated"}';

do $$
declare ids uuid[];
begin
    select array_agg(id) into ids from benutzer_liste();
    if not (ids @> array['99999999-9999-4999-8999-9999999990a1'::uuid,
                         '99999999-9999-4999-8999-9999999990a2'::uuid,
                         '99999999-9999-4999-8999-9999999990a3'::uuid,
                         '99999999-9999-4999-8999-9999999990a4'::uuid]) then
        raise exception 'FEHLGESCHLAGEN 10c: der Holding fehlen Konten aus den Toechtern';
    end if;

    -- Das eigene Konto darf niemand loeschen oder sperren, auch der Inhaber nicht.
    if darf_benutzer_verwalten('99999999-9999-4999-8999-9999999990a1') then
        raise exception 'FEHLGESCHLAGEN 10d: das eigene Konto galt als verwaltbar';
    end if;
    if not darf_benutzer_verwalten('99999999-9999-4999-8999-9999999990a2') then
        raise exception 'FEHLGESCHLAGEN 10e: ein Konto der Tochter galt als nicht verwaltbar';
    end if;

    raise notice 'Fall 10b bestanden: Die Holding sieht alle Konten, das eigene bleibt tabu.';
end;
$$;

reset role;

do $$
begin
    raise notice '--------------------------------------------------';
    raise notice 'Alle Prüfungen bestanden. Änderungen werden verworfen.';
    raise notice '--------------------------------------------------';
end;
$$;

rollback;
