'use server'

import { createClient } from '@/lib/supabase/server'
import type { WorkoutChallengeResultInput } from '@/app/actions/workout/challenge'

interface CompleteWorkoutParams {
  workoutId: string
  durationMinutes: number
  xpEarned: number
  challengeResult?: WorkoutChallengeResultInput
}

export async function completeWorkoutAction({ workoutId, durationMinutes, xpEarned, challengeResult }: CompleteWorkoutParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('"isPremium"')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    if (!profile?.isPremium) {
      return { success: false, error: 'Premium subscription required to save workout progress' }
    }

    // Fallback Logic: Use workout defaults if calculated values are missing or zero
    if (!durationMinutes || durationMinutes <= 0 || !xpEarned || xpEarned <= 0) {
        const { data: workout } = await supabase
            .from('workouts')
            .select('estimated_time, exp_earned')
            .eq('id', workoutId)
            .single()
        
        if (workout) {
            if (!durationMinutes || durationMinutes <= 0) {
                durationMinutes = workout.estimated_time || 0
            }
            // Only fallback XP if it's effectively zero (calculated XP usually has a base)
            if (!xpEarned || xpEarned <= 0) {
                xpEarned = workout.exp_earned || 0
            }
        }
    }

    const { data, error } = await supabase.rpc('complete_workout_session', {
        p_user_id: user.id,
        p_workout_id: workoutId,
        p_duration_minutes: durationMinutes,
        p_xp_earned: xpEarned
    })

    if (error) {
        console.error('Error completing workout session:', error)
        return { success: false, error: error.message }
    }

    const logData = data as { log_id?: string } | null

    if (challengeResult && typeof logData?.log_id === 'string') {
        const { data: previousBest, error: bestError } = await supabase
            .from('workout_challenge_results')
            .select('score')
            .eq('user_id', user.id)
            .eq('workout_id', workoutId)
            .order('score', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (bestError) {
            return { success: false, error: bestError.message }
        }

        const isPr = challengeResult.score > (previousBest?.score || 0)

        const { error: challengeError } = await supabase
            .from('workout_challenge_results')
            .insert({
                workout_log_id: logData.log_id,
                workout_id: workoutId,
                user_id: user.id,
                mode: challengeResult.mode,
                rounds_completed: challengeResult.roundsCompleted,
                extra_reps: challengeResult.extraReps,
                score: challengeResult.score,
                time_cap_seconds: challengeResult.timeCapSeconds,
                is_pr: isPr,
            })

        if (challengeError) {
            return { success: false, error: challengeError.message }
        }

        return { success: true, data: { ...logData, challenge_result: { ...challengeResult, is_pr: isPr } } }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Error in completeWorkoutAction:', error)
    return { success: false, error: error.message }
  }
}
