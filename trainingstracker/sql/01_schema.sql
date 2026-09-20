-- ===========================================================================
-- Trainingstracker — Schema
--
-- Ein Nutzer, aber jede Zeile trägt ihren user_id: Mehrbenutzerfähigkeit ist
-- vorbereitet, nicht ausgebaut. Zeitstempel als timestamptz, Datumsangaben als
-- date in Europe/Berlin — der Kalendertag entsteht im Client, nicht hier.
--
-- Reihenfolge: 01_schema, 02_rls, 03_seed, 04_views, 05_storage.
-- ===========================================================================

-- --- Stammdaten ------------------------------------------------------------

create table if not exists exercises (
  id                text primary key,
  name              text not null,
  equipment         text not null check (equipment in
                      ('langhantel','kurzhantel','kettlebell','kabel','koerpergewicht','ringe','stange')),
  unilateral        boolean not null default false,
  load_type         text not null check (load_type in
                      ('external','bodyweight','bodyweight_plus','time','distance')),
  cue               text,
  primary_muscles   text[] not null,
  secondary_muscles text[] not null default '{}'
);

comment on column exercises.primary_muscles is 'zählen 1,0 im Volumen';
comment on column exercises.secondary_muscles is 'zählen 0,5 im Volumen';

create table if not exists session_templates (
  id              text primary key,
  name            text not null,
  headline        text not null,
  cycle_position  smallint not null,
  planned_minutes smallint not null
);

comment on column session_templates.cycle_position is 'Position 1..8 im Achttagezyklus, Pause = kein Eintrag';

create table if not exists template_blocks (
  id              bigint primary key,
  template_id     text not null references session_templates(id),
  ordinal         smallint not null,
  label           text not null,
  superset_group  text,
  exercise_id     text references exercises(id),
  kind            text not null check (kind in ('warmup','work','muscleup','abs')),
  target_sets     smallint,
  rep_min         smallint,
  rep_max         smallint,
  target_rir      text,
  rest_seconds    smallint,
  planned_minutes smallint not null,
  note            text,
  unique (template_id, ordinal)
);

comment on column template_blocks.superset_group is 'gleiche Kennung = im Wechsel ausführen';
comment on column template_blocks.rep_min is 'bei load_type time Sekunden, bei distance Meter';

-- --- Protokoll -------------------------------------------------------------

create table if not exists workouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  template_id  text not null references session_templates(id),
  performed_on date not null,
  started_at   timestamptz,
  finished_at  timestamptz,
  cycle_day    smallint not null check (cycle_day between 1 and 8),
  week_index   smallint not null,
  is_deload    boolean not null default false,
  session_rpe  smallint check (session_rpe between 1 and 10),
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists workouts_nutzer_tag on workouts (user_id, performed_on desc);

create table if not exists sets (
  id           uuid primary key default gen_random_uuid(),
  workout_id   uuid not null references workouts(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  block_id     bigint not null references template_blocks(id),
  exercise_id  text references exercises(id),
  set_index    smallint not null,
  weight_kg    numeric(6,2),
  reps         smallint,
  seconds      smallint,
  distance_m   smallint,
  rir          smallint,
  is_warmup    boolean not null default false,
  completed_at timestamptz not null default now()
);

create index if not exists sets_training on sets (workout_id);
create index if not exists sets_nutzer_uebung on sets (user_id, exercise_id);
create unique index if not exists sets_block_nummer on sets (workout_id, block_id, set_index);

comment on column sets.weight_kg is 'Zusatzlast bei load_type bodyweight_plus';

-- --- Muscle-Up-Progression -------------------------------------------------

create table if not exists muscleup_blocks (
  id        smallint primary key,
  name      text not null,
  week_from smallint not null,
  week_to   smallint not null,
  gate      text not null
);

create table if not exists muscleup_drills (
  id           bigint primary key,
  block_id     smallint not null references muscleup_blocks(id),
  ordinal      smallint not null,
  name         text not null,
  prescription text not null,
  cue          text,
  unique (block_id, ordinal)
);

create table if not exists muscleup_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  workout_id   uuid references workouts(id) on delete set null,
  drill_id     bigint references muscleup_drills(id),
  performed_on date not null,
  sets_done    smallint,
  reps_done    smallint,
  quality      smallint check (quality between 1 and 5),
  note         text
);

create index if not exists muscleup_log_nutzer_tag on muscleup_log (user_id, performed_on);

create table if not exists muscleup_milestones (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  block_id   smallint not null references muscleup_blocks(id),
  reached_on date not null,
  note       text,
  unique (user_id, block_id)
);

-- --- Körperdaten -----------------------------------------------------------

create table if not exists body_metrics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  measured_on date not null,
  weight_kg   numeric(5,2),
  waist_cm    numeric(5,2),
  note        text,
  unique (user_id, measured_on)
);

create table if not exists progress_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  taken_on     date not null,
  storage_path text not null,
  pose         text not null check (pose in ('front','side','back'))
);

create index if not exists fotos_nutzer_tag on progress_photos (user_id, taken_on);

-- --- Zykluszustand ---------------------------------------------------------

create table if not exists cycle_state (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  started_on       date not null,
  current_day      smallint not null check (current_day between 1 and 8),
  last_advanced_on date
);

-- Nachtrag zur Spezifikation: „Heute Pause" protokolliert den Grund, und im
-- vorgegebenen Modell gibt es dafür keine Spalte. Ein eigener Eintrag hält
-- außerdem die Verschiebung des Zyklus nachvollziehbar.
create table if not exists cycle_skips (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  on_date    date not null,
  from_day   smallint not null,
  to_day     smallint not null,
  reason     text,
  created_at timestamptz not null default now()
);

create index if not exists pausen_nutzer_tag on cycle_skips (user_id, on_date desc);
