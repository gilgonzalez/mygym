'use server'

import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/database"
import { WorkoutInput } from "./create"

export async function updateWorkoutAction(workoutId: string, data: WorkoutInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    // 1. Verify ownership
    const { data: existingWorkout, error: fetchError } = await supabase
        .from('workouts')
        .select('user_id')
        .eq('id', workoutId)
        .single()
    
    if (fetchError || !existingWorkout) throw new Error('Workout not found')
    if (existingWorkout.user_id !== user.id) throw new Error('Unauthorized')

    // 2. Update Metadata
    const { error: updateError } = await supabase
        .from('workouts')
        .update({
            title: data.title,
            description: data.description,
            difficulty: data.difficulty,
            tags: data.tags,
            cover: data.cover,
            audio: data.audio,
            updated_at: new Date().toISOString()
        })
        .eq('id', workoutId)

    if (updateError) throw updateError

    // 3. Cleanup Old Structure (Sections & Links)
    // We remove old sections to replace them with the new structure defined in the editor
    const { data: oldWorkoutSections } = await supabase.from('workout_sections').select('section_id').eq('workout_id', workoutId)
    const oldSectionIds = oldWorkoutSections?.map(ws => ws.section_id) || []

    await supabase.from('workout_sections').delete().eq('workout_id', workoutId)
    
    if (oldSectionIds.length > 0) {
        await supabase.from('section_exercises').delete().in('section_id', oldSectionIds)
        await supabase.from('sections').delete().in('id', oldSectionIds)
    }

    // 4. Re-create New Structure
    // (Loops through sections and exercises to insert them, similar to creation logic)
    for (let i = 0; i < data.sections.length; i++) {
        const sectionData = data.sections[i]
        
        // Create Section
        const { data: section, error: sectionError } = await supabase
            .from('sections')
            .insert({ name: sectionData.name, type: sectionData.orderType })
            .select().single()
        
        if (sectionError) throw sectionError
        
        // Link Section
        await supabase.from('workout_sections').insert({
            workout_id: workoutId,
            section_id: section.id,
            order_index: i
        })

        // Create/Update Exercises
        for (let j = 0; j < sectionData.exercises.length; j++) {
            const exData = sectionData.exercises[j]
            
            // Prepare payload
            const exercisePayload: any = {
                name: exData.name,
                type: exData.type,
                reps: exData.reps,
                sets: exData.sets,
                duration: exData.duration,
                rest: exData.rest,
                description: exData.description,
                muscle_group: exData.muscle_group,
                equipment: exData.equipment,
                difficulty: exData.difficulty,
                media_id: exData.media_id,
                created_by: user.id
            }

            // Only include ID if it's a valid UUID (not a temp ID like 'ex-1')
            // This ensures we UPDATE existing exercises instead of creating duplicates
            if (exData.id && exData.id.length > 30) {
                exercisePayload.id = exData.id
            }

            const { data: exercise, error: exError } = await supabase
                .from('exercises')
                .upsert(exercisePayload)
                .select()
                .single()

            if (exError) throw exError

            // Link Exercise
            await supabase.from('section_exercises').insert({
                section_id: section.id,
                exercise_id: exercise.id,
                order_index: j,
                sets: exData.sets,
                reps: exData.reps,
                rest: exData.rest,
                duration: exData.duration,
                weight_kg: 0 // Default
            })
        }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Update Workout Error:', error)
    return { success: false, error: error.message }
  }
}