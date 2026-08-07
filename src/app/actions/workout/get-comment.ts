'use server'

import { createClient } from '@/lib/supabase/server'

export type ChallengeResultInfo = {
  score: number
  rounds_completed: number
  extra_reps: number
  mode: string
  is_pr: boolean
  time_cap_seconds: number
}

export type Comment = {
  id: string
  rating: number | null
  feeling: string | null
  notes: string | null
  completed_at: string | null
  user: {
    name: string | null
    avatar_url: string | null
    username: string
  }
  challenge?: ChallengeResultInfo | null
}

export async function countWorkoutComments(workoutId: string) {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('workout_logs')
    .select('*', { count: 'exact', head: true })
    .eq('workout_id', workoutId)
    .not('notes', 'is', null)
    .neq('notes', '')

  if (error) {
    console.error('Error counting comments:', error)
    return { success: false, error: error.message, count: 0 }
  }

  return { success: true, count: count ?? 0 }
}

export async function getWorkoutComments(
  workoutId: string,
  page: number = 0,
  pageSize: number = 10,
  isChallenge: boolean = false
) {
  const supabase = await createClient()
  
  const from = page * pageSize
  const to = from + pageSize - 1

  let data: any[] | null
  let error: any

  if (isChallenge) {
    const result = await supabase
      .from('workout_challenge_results')
      .select(`
        id:workout_log_id,
        score,
        rounds_completed,
        extra_reps,
        mode,
        is_pr,
        time_cap_seconds,
        workout_logs!inner (
          rating,
          feeling,
          notes,
          completed_at
        ),
        user:users (
          name,
          avatar_url,
          username
        )
      `)
      .eq('workout_id', workoutId)
      .not('workout_logs.notes', 'is', null)
      .neq('workout_logs.notes', '')
      .order('workout_logs(completed_at)', { ascending: false, nullsFirst: false })
      .range(from, to)

    data = result.data
    error = result.error

    if (data) {
      data = data.map((row: any) => ({
        id: row.id,
        rating: row.workout_logs?.rating ?? null,
        feeling: row.workout_logs?.feeling ?? null,
        notes: row.workout_logs?.notes ?? null,
        completed_at: row.workout_logs?.completed_at ?? null,
        user: row.user,
        challenge: {
          score: row.score,
          rounds_completed: row.rounds_completed,
          extra_reps: row.extra_reps,
          mode: row.mode,
          is_pr: row.is_pr,
          time_cap_seconds: row.time_cap_seconds,
        } satisfies ChallengeResultInfo
      }))
    }
  } else {
    const result = await supabase
      .from('workout_logs')
      .select(`
        id,
        rating,
        feeling,
        notes,
        completed_at,
        user:users (
          name,
          avatar_url,
          username
        )
      `)
      .eq('workout_id', workoutId)
      .not('notes', 'is', null)
      .neq('notes', '')
      .order('completed_at', { ascending: false })
      .range(from, to)

    data = result.data
    error = result.error
  }

  if (error) {
    console.error('Error fetching comments:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as unknown as Comment[] }
}