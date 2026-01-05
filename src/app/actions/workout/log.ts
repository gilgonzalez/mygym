"use server"
import { createClient } from "@/lib/supabase/server"

export async function logWorkoutCompletion(
  workoutId: string, 
  notes: string, 
  rating: number, 
  logId?: string | null,
  feeling?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    if (logId) {
      // Update existing log
      const { error } = await supabase
        .from('workout_logs')
        .update({
          notes: notes,
          rating: rating,
          feeling: feeling
        })
        .eq('id', logId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating workout log:', error)
        return { success: false, error: error.message }
      }
    } else {
      // Create new log (Fallback)
      const completedAt = new Date().toISOString()
      
      const { error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: user.id,
          workout_id: workoutId,
          completed_at: completedAt,
          notes: notes,
          rating: rating,
          feeling: feeling
        })

      if (error) {
        console.error('Error logging workout:', error)
        return { success: false, error: error.message }
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Server Action Error:', error)
    return { success: false, error: error.message }
  }
}