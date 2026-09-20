/* ==========================================================================
   Die Typen folgen 1:1 den Tabellen aus sql/01_schema.sql. Wo der Client
   zusaetzliche Felder braucht, stehen sie in eigenen Typen weiter unten.
   ========================================================================== */

export type Muskelgruppe =
  | 'chest'
  | 'back_pull'
  | 'side_delts'
  | 'front_delts'
  | 'triceps'
  | 'biceps'
  | 'quads'
  | 'hamstrings_glutes'
  | 'calves'
  | 'abs'

export type Geraet =
  | 'langhantel'
  | 'kurzhantel'
  | 'kettlebell'
  | 'kabel'
  | 'koerpergewicht'
  | 'ringe'
  | 'stange'

export type Lastart = 'external' | 'bodyweight' | 'bodyweight_plus' | 'time' | 'distance'

export type Blockart = 'warmup' | 'work' | 'muscleup' | 'abs'

export type VorlageId = 'push_a' | 'push_b' | 'pull' | 'legs_a' | 'legs_b'

export interface Uebung {
  id: string
  name: string
  equipment: Geraet
  unilateral: boolean
  load_type: Lastart
  cue: string | null
  primary_muscles: Muskelgruppe[]
  secondary_muscles: Muskelgruppe[]
}

export interface Vorlage {
  id: VorlageId
  name: string
  headline: string
  cycle_position: number
  planned_minutes: number
}

export interface Block {
  id: number
  template_id: VorlageId
  ordinal: number
  label: string
  superset_group: string | null
  exercise_id: string | null
  kind: Blockart
  target_sets: number | null
  rep_min: number | null
  rep_max: number | null
  target_rir: string | null
  rest_seconds: number | null
  planned_minutes: number
  note: string | null
}

export interface Training {
  id: string
  user_id: string
  template_id: VorlageId
  performed_on: string
  started_at: string | null
  finished_at: string | null
  cycle_day: number
  week_index: number
  is_deload: boolean
  session_rpe: number | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface Satz {
  id: string
  workout_id: string
  user_id: string
  block_id: number
  exercise_id: string | null
  set_index: number
  weight_kg: number | null
  reps: number | null
  seconds: number | null
  distance_m: number | null
  rir: number | null
  is_warmup: boolean
  completed_at: string
}

export interface MuscleUpBlock {
  id: number
  name: string
  week_from: number
  week_to: number
  gate: string
}

export interface MuscleUpDrill {
  id: number
  block_id: number
  ordinal: number
  name: string
  prescription: string
  cue: string | null
}

export interface MuscleUpEintrag {
  id: string
  user_id: string
  workout_id: string | null
  drill_id: number | null
  performed_on: string
  sets_done: number | null
  reps_done: number | null
  quality: number | null
  note: string | null
}

export interface MuscleUpMarke {
  id: string
  user_id: string
  block_id: number
  reached_on: string
  note: string | null
}

export interface Koerperwert {
  id: string
  user_id: string
  measured_on: string
  weight_kg: number | null
  waist_cm: number | null
  note: string | null
}

export interface Foto {
  id: string
  user_id: string
  taken_on: string
  storage_path: string
  pose: 'front' | 'side' | 'back'
}

export interface Zykluszustand {
  user_id: string
  started_on: string
  current_day: number
  last_advanced_on: string | null
}

/** Zusatztabelle: „Heute Pause" protokolliert Sprung und Grund. */
export interface Pausensprung {
  id: string
  user_id: string
  on_date: string
  from_day: number
  to_day: number
  reason: string | null
  created_at: string
}

/* --- Nur im Client ------------------------------------------------------- */

export type TabellenName =
  | 'workouts'
  | 'sets'
  | 'body_metrics'
  | 'muscleup_log'
  | 'muscleup_milestones'
  | 'cycle_state'
  | 'cycle_skips'
  | 'progress_photos'

export interface Auftrag {
  id: string
  table: TabellenName
  op: 'upsert' | 'delete'
  payload: Record<string, unknown>
  queued_at: string
  versuche: number
  fehler?: string
}
