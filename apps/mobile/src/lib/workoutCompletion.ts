import type { FeelingType } from '@mygym/shared'

import { supabase } from './supabase'

// Data layer de "terminar workout" — puerto de completeWorkoutAction.ts +
// logWorkoutCompletion.ts (apps/web) fusionados en dos funciones: acá no hay
// gate de Premium (la app todavía no tiene ese concepto implementado), así
// que cualquier usuario autenticado puede guardar su progreso.
export interface ChallengeResultInput {
  mode: string
  roundsCompleted: number
  score: number
  timeCapSeconds: number
}

export interface CompleteWorkoutSessionResult {
  logId: string
  durationMinutes: number
  xpEarned: number
  levelUp: boolean
  challengeIsPr: boolean
}

// Crea el workout_log (vía la misma RPC que usa la web: suma XP, actualiza
// racha/nivel/stats) y, si el workout tenía una sección de reto, la fila de
// workout_challenge_results asociada — con el mismo cálculo de "nueva
// marca" que completeWorkoutAction.ts: el score le gana al mejor score
// previo del usuario para este workout.
export async function completeWorkoutSession(params: {
  userId: string
  workoutId: string
  durationMinutes: number
  xpEarned: number
  challengeResult?: ChallengeResultInput | null
}): Promise<CompleteWorkoutSessionResult> {
  const { userId, workoutId, challengeResult } = params
  let { durationMinutes, xpEarned } = params

  // Mismo fallback que completeWorkoutAction.ts: si la duración/XP calculados
  // en el cliente vinieron en cero (workout sin ejercicios con timer, etc.),
  // usa los valores por defecto del workout en vez de guardar un log vacío.
  if (!durationMinutes || durationMinutes <= 0 || !xpEarned || xpEarned <= 0) {
    const { data: workout } = await supabase
      .from('workouts')
      .select('estimated_time, exp_earned')
      .eq('id', workoutId)
      .single()

    if (workout) {
      if (!durationMinutes || durationMinutes <= 0) durationMinutes = workout.estimated_time || 0
      if (!xpEarned || xpEarned <= 0) xpEarned = workout.exp_earned || 0
    }
  }

  const { data, error } = await supabase.rpc('complete_workout_session', {
    p_user_id: userId,
    p_workout_id: workoutId,
    p_duration_minutes: durationMinutes,
    p_xp_earned: xpEarned,
  })

  if (error) throw error

  const logData = data as { log_id?: string; level_up?: boolean } | null
  const logId = logData?.log_id
  if (!logId) throw new Error('No se pudo registrar el workout')

  let challengeIsPr = false

  if (challengeResult) {
    const { data: previousBest, error: bestError } = await supabase
      .from('workout_challenge_results')
      .select('score')
      .eq('user_id', userId)
      .eq('workout_id', workoutId)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (bestError) throw bestError

    challengeIsPr = challengeResult.score > (previousBest?.score || 0)

    const { error: challengeError } = await supabase.from('workout_challenge_results').insert({
      workout_log_id: logId,
      workout_id: workoutId,
      user_id: userId,
      mode: challengeResult.mode,
      rounds_completed: challengeResult.roundsCompleted,
      score: challengeResult.score,
      time_cap_seconds: challengeResult.timeCapSeconds,
      is_pr: challengeIsPr,
    })

    if (challengeError) throw challengeError
  }

  return { logId, durationMinutes, xpEarned, levelUp: Boolean(logData?.level_up), challengeIsPr }
}

// Guarda notas/rating/sensación sobre un log ya creado por
// completeWorkoutSession — equivalente a la rama "update" de
// logWorkoutCompletion.ts (acá el log siempre existe ya, así que no hace
// falta la rama de creación de esa acción).
export async function saveWorkoutLogDetails(params: {
  logId: string
  userId: string
  notes: string
  rating: number
  feeling: FeelingType
}): Promise<void> {
  const { logId, userId, notes, rating, feeling } = params

  const { error } = await supabase
    .from('workout_logs')
    .update({ notes, rating, feeling })
    .eq('id', logId)
    .eq('user_id', userId)

  if (error) throw error
}
