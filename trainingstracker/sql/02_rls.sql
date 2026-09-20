-- ===========================================================================
-- Row Level Security.
--
-- Protokolltabellen: auth.uid() = user_id, für Lesen und Schreiben. Stammdaten
-- (Übungen, Vorlagen, Blöcke, Muscle-Up-Progression) sind für angemeldete
-- Nutzer lesbar und nur über eine Migration änderbar — kein Planeditor.
-- ===========================================================================

alter table exercises          enable row level security;
alter table session_templates  enable row level security;
alter table template_blocks    enable row level security;
alter table muscleup_blocks    enable row level security;
alter table muscleup_drills    enable row level security;

alter table workouts            enable row level security;
alter table sets                enable row level security;
alter table muscleup_log        enable row level security;
alter table muscleup_milestones enable row level security;
alter table body_metrics        enable row level security;
alter table progress_photos     enable row level security;
alter table cycle_state         enable row level security;
alter table cycle_skips         enable row level security;

-- --- Stammdaten: lesen genügt ---------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['exercises','session_templates','template_blocks','muscleup_blocks','muscleup_drills']
  loop
    execute format('drop policy if exists %I on %I', t || '_lesen', t);
    execute format(
      'create policy %I on %I for select to authenticated using (true)',
      t || '_lesen', t);
  end loop;
end $$;

-- --- Protokoll: nur die eigenen Zeilen ------------------------------------

do $$
declare t text;
begin
  foreach t in array array['workouts','sets','muscleup_log','muscleup_milestones',
                           'body_metrics','progress_photos','cycle_state','cycle_skips']
  loop
    execute format('drop policy if exists %I on %I', t || '_eigene', t);
    execute format(
      'create policy %I on %I for all to authenticated
         using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_eigene', t);
  end loop;
end $$;

-- Rechte gegen PUBLIC schließen: die Policies entscheiden, nicht das Grant.
revoke all on all tables in schema public from anon;
grant select on exercises, session_templates, template_blocks, muscleup_blocks, muscleup_drills to authenticated;
grant select, insert, update, delete on
  workouts, sets, muscleup_log, muscleup_milestones,
  body_metrics, progress_photos, cycle_state, cycle_skips to authenticated;
