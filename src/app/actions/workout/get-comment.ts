'use server'

import { createClient } from '@/lib/supabase/server'

export type ChallengeResultInfo = {
  score: number
  rounds_completed: number
  mode: string
  is_pr: boolean
  time_cap_seconds: number
  is_workout_record?: boolean
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
        ),
        workout_challenge_results!left (
          score,
          rounds_completed,
          mode,
          is_pr,
          time_cap_seconds
        )
      `)
      .eq('workout_id', workoutId)
      .not('notes', 'is', null)
      .neq('notes', '')
      .order('completed_at', { ascending: false })
      .range(from, to)

    data = result.data
    error = result.error

    if (data) {
      data = data.map((row: any) => {
        const chall = Array.isArray(row.workout_challenge_results)
          ? row.workout_challenge_results[0]
          : row.workout_challenge_results

        return {
          id: row.id,
          rating: row.rating ?? null,
          feeling: row.feeling ?? null,
          notes: row.notes ?? null,
          completed_at: row.completed_at ?? null,
          user: row.user,
          challenge: chall ? {
            score: chall.score,
            rounds_completed: chall.rounds_completed,
            mode: chall.mode,
            is_pr: chall.is_pr,
            time_cap_seconds: chall.time_cap_seconds,
          } satisfies ChallengeResultInfo : undefined
        }
      })
    }
  }

  if (error) {
    console.error('Error fetching comments:', error)
    return { success: false, error: error.message }
  }

  if (Array.isArray(data)) {
    const challs: { id: string; score: number; completed_at: string | null }[] = data
      .filter((c: any) => c.challenge && typeof c.challenge.score === 'number')
      .map((c: any) => ({
        id: c.id as string,
        score: c.challenge.score as number,
        completed_at: c.completed_at as string | null
      }))

    if (challs.length > 0) {
      const bestScore = Math.max(...challs.map(c => c.score))
      const tiesForBest = challs
        .filter(c => c.score === bestScore)
        .sort((a, b) => {
          const at = a.completed_at ? new Date(a.completed_at).getTime() : 0
          const bt = b.completed_at ? new Date(b.completed_at).getTime() : 0
          return at - bt
        })
      const recordId = tiesForBest[0]?.id

      data = (data as any[]).map((c: any) => {
        if (c.challenge && typeof c.challenge.score === 'number' && c.id === recordId) {
          return {
            ...c,
            challenge: {
              ...c.challenge,
              is_workout_record: true
            }
          }
        }
        return c
      })

      data.sort((a: any, b: any) => {
        const aRec = a.id === recordId ? 0 : 1
        const bRec = b.id === recordId ? 0 : 1
        if (aRec !== bRec) return aRec - bRec
        const at = a.completed_at ? new Date(a.completed_at).getTime() : 0
        const bt = b.completed_at ? new Date(b.completed_at).getTime() : 0
        return bt - at
      })
    }
  }

  return { success: true, data: data as unknown as Comment[] }
}
