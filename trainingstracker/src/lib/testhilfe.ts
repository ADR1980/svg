/* Sätze aus der Vorlage erzeugen — nur für Tests und die Planprüfung. */
import { bloeckeVon } from '../data/plan'
import type { Satz, VorlageId } from './types'

export function saetzeNachPlan(vorlage: VorlageId, trainingId: string): Satz[] {
  const saetze: Satz[] = []
  for (const b of bloeckeVon(vorlage)) {
    if (!b.exercise_id || !b.target_sets) continue
    for (let i = 1; i <= b.target_sets; i++) {
      saetze.push({
        id: `${b.id}-${i}`,
        workout_id: trainingId,
        user_id: 'test',
        block_id: b.id,
        exercise_id: b.exercise_id,
        set_index: i,
        weight_kg: 50,
        reps: b.rep_max ?? 10,
        seconds: null,
        distance_m: null,
        rir: 1,
        is_warmup: false,
        completed_at: '2026-09-21T11:30:00.000Z'
      })
    }
  }
  return saetze
}
