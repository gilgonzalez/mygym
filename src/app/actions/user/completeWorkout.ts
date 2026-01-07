'use server'

import { createClient } from '@/lib/supabase/server'

interface CompleteWorkoutParams {
  workoutId: string
  durationMinutes: number
  xpEarned: number
}

export async function completeWorkoutAction({ workoutId, durationMinutes, xpEarned }: CompleteWorkoutParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
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

    return { success: true, data }
  } catch (error: any) {
    console.error('Error in completeWorkoutAction:', error)
    return { success: false, error: error.message }
  }
}