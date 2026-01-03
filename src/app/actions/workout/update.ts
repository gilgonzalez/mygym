'use server'

import { createClient } from "@/lib/supabase/server"
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
            visibility: data.visibility,
            estimated_time: data.estimated_time,
            exp_earned: data.exp_earned,
            stats: data.stats,
            updated_at: new Date().toISOString()
        })
        .eq('id', workoutId)

    if (updateError) throw updateError

    // 3. Handle Sections & Structure
    
    // A. Identify Sections to Keep vs Delete
    // Fetch current sections linked to this workout
    const { data: currentLinks } = await supabase
        .from('workout_sections')
        .select('id, section_id')
        .eq('workout_id', workoutId)

    const currentSectionIds = currentLinks?.map(l => l.section_id) || []
    const incomingSectionIds = data.sections
        .map(s => s.id)
        .filter(id => id && id.length > 30) // Valid UUIDs only

    // Calculate sections to remove (those in DB but not in incoming list)
    const sectionIdsToDelete = currentSectionIds.filter(id => !incomingSectionIds.includes(id))

    if (sectionIdsToDelete.length > 0) {
        // Cleanup removed sections
        // Note: cascading deletes might handle this, but being explicit is safer
        await supabase.from('workout_sections').delete().in('section_id', sectionIdsToDelete)
        // Only delete the actual section definition if it's not used elsewhere? 
        // Assuming strict composition for now as per previous logic:
        await supabase.from('sections').delete().in('id', sectionIdsToDelete)
    }

    // B. Process Incoming Sections
    for (let i = 0; i < data.sections.length; i++) {
        const sectionData = data.sections[i]
        let sectionId = sectionData.id

        // 1. Upsert Section Definition
        if (sectionId && sectionId.length > 30) {
            // Update existing
            const { error: secUpdateErr } = await supabase
                .from('sections')
                .update({ name: sectionData.name, type: sectionData.orderType })
                .eq('id', sectionId)
            if (secUpdateErr) throw secUpdateErr
        } else {
            // Create new
            const { data: newSection, error: secCreateErr } = await supabase
                .from('sections')
                .insert({ name: sectionData.name, type: sectionData.orderType })
                .select()
                .single()
            if (secCreateErr) throw secCreateErr
            sectionId = newSection.id
        }

        // 2. Manage Workout-Section Link
        // Ensure link exists and update order
        const { data: existingLink } = await supabase
            .from('workout_sections')
            .select('id')
            .eq('workout_id', workoutId)
            .eq('section_id', sectionId)
            .maybeSingle()

        if (existingLink) {
            await supabase
                .from('workout_sections')
                .update({ order_index: i })
                .eq('id', existingLink.id)
        } else {
            await supabase
                .from('workout_sections')
                .insert({
                    workout_id: workoutId,
                    section_id: sectionId,
                    order_index: i
                })
        }

        // 3. Handle Exercises for this Section
        // Strategy: "Replace All Links". 
        // This is the most robust way to handle reordering and removals within a section without complex diffing.
        // It deletes the *relationships* (section_exercises), not the exercise definitions.
        
        await supabase.from('section_exercises').delete().eq('section_id', sectionId)

        for (let j = 0; j < sectionData.exercises.length; j++) {
            const exData = sectionData.exercises[j]
            
            // 3.1 Upsert Exercise Definition
            const exercisePayload: any = {
                name: exData.name,
                type: exData.type,
                description: exData.description,
                muscle_group: exData.muscle_group,
                equipment: exData.equipment,
                difficulty: exData.difficulty,
                media_id: exData.media_id,
                user_id: user.id, // Ensure ownership/attribution
            }

            // Only attach ID if it's a real UUID (updates existing)
            if (exData.id && exData.id.length > 30) {
                exercisePayload.id = exData.id
            }

            // Perform Upsert on Definition
            const { data: exercise, error: exError } = await supabase
                .from('exercises')
                .upsert(exercisePayload)
                .select()
                .single()

            if (exError) throw exError

            // 3.2 Create Link
            await supabase.from('section_exercises').insert({
                section_id: sectionId,
                exercise_id: exercise.id,
                order_index: j,
                sets: exData.sets,
                reps: exData.reps,
                rest: exData.rest,
                duration: exData.duration,
                weight_kg: 0 // Default or from form if available
            })
        }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Update Workout Error:', error)
    return { success: false, error: error.message }
  }
}