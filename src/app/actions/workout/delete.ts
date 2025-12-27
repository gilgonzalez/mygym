'use server'

import { createClient } from '@/lib/supabase/server'

export async function deleteWorkoutAction(workoutId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Unauthorized')
    }

    // 1. Verify ownership
    const { data: workout, error: fetchError } = await supabase
        .from('workouts')
        .select('user_id')
        .eq('id', workoutId)
        .single()
    
    if (fetchError || !workout) throw new Error('Workout not found')
    if (workout.user_id !== user.id) throw new Error('Unauthorized')

    // 2. Get related Section IDs before deleting the workout
    const { data: workoutSections } = await supabase
        .from('workout_sections')
        .select('section_id')
        .eq('workout_id', workoutId)
    
    const sectionIds = workoutSections?.map(ws => ws.section_id) || []

    // 3. Delete Workout (Cascades to workout_sections)
    const { error: deleteError } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId)

    if (deleteError) throw deleteError

    // 4. Cleanup Sections and Exercises links
    if (sectionIds.length > 0) {
        await supabase.from('section_exercises').delete().in('section_id', sectionIds)
        await supabase.from('sections').delete().in('id', sectionIds)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Delete Workout Error:', error)
    return { success: false, error: error.message }
  }
}