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

    // 3. Handle Sections & Structure
    // Get existing sections to determine what to delete/update/create
    const { data: currentSections } = await supabase
        .from('workout_sections')
        .select('section_id, order_index, sections(id, name, type)')
        .eq('workout_id', workoutId)
        .order('order_index')

    const currentSectionIds = currentSections?.map(cs => cs.section_id) || []
    const incomingSectionIds = data.sections.map(s => s.id).filter(id => id && id.length > 30) // Filter valid UUIDs

    // A. Delete removed sections
    const sectionsToDelete = currentSectionIds.filter(id => !incomingSectionIds.includes(id))
    if (sectionsToDelete.length > 0) {
        // Delete relationships first
        await supabase.from('workout_sections').delete().in('section_id', sectionsToDelete)
        await supabase.from('section_exercises').delete().in('section_id', sectionsToDelete)
        await supabase.from('sections').delete().in('id', sectionsToDelete)
    }

    // B. Process all sections (Update or Create)
    for (let i = 0; i < data.sections.length; i++) {
        const sectionData = data.sections[i]
        let sectionId = sectionData.id

        // Check if it's an existing section (UUID) or new
        if (sectionId && sectionId.length > 30 && currentSectionIds.includes(sectionId)) {
            // UPDATE existing section
            const { error: updateError } = await supabase
                .from('sections')
                .update({ name: sectionData.name, type: sectionData.orderType })
                .eq('id', sectionId)
            
            if (updateError) throw updateError
        } else {
            // CREATE new section
            const { data: newSection, error: createError } = await supabase
                .from('sections')
                .insert({ name: sectionData.name, type: sectionData.orderType })
                .select()
                .single()
            
            if (createError) throw createError
            sectionId = newSection.id
        }

        // C. Update Workout Link (Order)
        // We upsert to update the order_index
        await supabase.from('workout_sections').upsert({
            workout_id: workoutId,
            section_id: sectionId,
            order_index: i
        }, { onConflict: 'workout_id, section_id' })


        // D. Handle Exercises for this Section
        // 1. Clear existing links for this section to rewrite them (easiest way to handle reordering)
        // Note: This doesn't delete the exercises themselves, just the association to the section
        await supabase.from('section_exercises').delete().eq('section_id', sectionId)

        for (let j = 0; j < sectionData.exercises.length; j++) {
            const exData = sectionData.exercises[j]
            
            // Prepare payload for Exercise Definition
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

            // Handle Exercise ID
            if (exData.id && exData.id.length > 30) {
                exercisePayload.id = exData.id
            } else {
                delete exercisePayload.id // Ensure no temp IDs pass through
            }

            // Upsert Exercise Definition
            // This updates the exercise if it exists (and we own it/have rights), or creates new
            const { data: exercise, error: exError } = await supabase
                .from('exercises')
                .upsert(exercisePayload)
                .select()
                .single()

            if (exError) throw exError

            // Create Link
            await supabase.from('section_exercises').insert({
                section_id: sectionId,
                exercise_id: exercise.id,
                order_index: j,
                sets: exData.sets,
                reps: exData.reps,
                rest: exData.rest,
                duration: exData.duration,
                weight_kg: 0
            })
        }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Update Workout Error:', error)
    return { success: false, error: error.message }
  }
}