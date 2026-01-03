'use server'

import { createClient } from '@/lib/supabase/server'

export async function getWorkoutLogsAction(userId: string, startDate: string, endDate: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*, workouts(title)')
      .eq('user_id', userId)
      .gte('completed_at', startDate)
      .lte('completed_at', endDate)
    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Error fetching workout logs:', error)
    return { success: false, error: error.message }
  }
}