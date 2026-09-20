-- ===========================================================================
-- Auswertung in der Datenbank.
--
-- Die App rechnet das Wochenvolumen im Client — über zwölf Wochen sind das
-- wenige tausend Zeilen, und offline muss es ohnehin ohne Datenbank gehen.
-- Diese Sicht ist für den Blick von außen: SQL-Editor, Export, Nachprüfen.
--
-- security_invoker sorgt dafür, dass die Sicht die Policies des Aufrufers
-- erbt statt sie mit den Rechten des Eigentümers zu umgehen.
-- ===========================================================================

create or replace view weekly_volume
with (security_invoker = on) as
select
  s.user_id,
  to_char(w.performed_on, 'IYYY-"W"IW') as iso_week,
  beitrag.muscle                        as muscle,
  sum(beitrag.gewichtung)               as weighted_sets
from sets s
  join workouts w  on w.id = s.workout_id
  join exercises e on e.id = s.exercise_id
  cross join lateral (
    select unnest(e.primary_muscles) as muscle, 1.0::numeric as gewichtung
    union all
    select unnest(e.secondary_muscles), 0.5::numeric
  ) as beitrag
where not s.is_warmup
group by s.user_id, to_char(w.performed_on, 'IYYY-"W"IW'), beitrag.muscle;

comment on view weekly_volume is
  'Gewichtete Satzzahl je ISO-Woche und Muskelgruppe: Primär 1,0, Sekundär 0,5, Aufwärmen zählt nicht.';

-- Tonnage je Einheit und Übung. Körpergewichtsübungen mit Zusatzlast bleiben
-- leer — das Körpergewicht steht in body_metrics und gehört nicht in eine
-- Sicht, die sonst nur Sätze liest.
create or replace view workout_tonnage
with (security_invoker = on) as
select
  s.user_id,
  s.workout_id,
  w.performed_on,
  s.exercise_id,
  sum(s.weight_kg * s.reps) as tonnage_kg
from sets s
  join workouts w  on w.id = s.workout_id
  join exercises e on e.id = s.exercise_id
where not s.is_warmup
  and e.load_type = 'external'
  and s.weight_kg is not null
  and s.reps is not null
group by s.user_id, s.workout_id, w.performed_on, s.exercise_id;

grant select on weekly_volume, workout_tonnage to authenticated;
