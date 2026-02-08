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
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log({userDatabase: user, authError})
    if (!user || authError) {
      return { success: false, error: 'User not authenticated: ' + (authError?.message || 'No session') }
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

    // Update Workout Rating
    try {
      const { data: currentWorkout } = await supabase
        .from('workouts')
        .select('rating')
        .eq('id', workoutId)
        .single()

      let newRating = rating
      
      if (currentWorkout && currentWorkout.rating !== null) {
         newRating = (Number(currentWorkout.rating) + Number(rating)) / 2
      }
      
      // Round to 1 decimal place
      newRating = Math.round(newRating * 10) / 10

      const { error: updateError } = await supabase
        .from('workouts')
        .update({ rating: newRating })
        .eq('id', workoutId)
        
      if (updateError) {
         console.error('Error updating workout rating:', updateError)
      }
    } catch (err) {
      console.error('Failed to calculate new rating', err)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Server Action Error:', error)
    return { success: false, error: error.message }
  }
}