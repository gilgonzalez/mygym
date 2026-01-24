'use server'

import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/database"

type DbWorkout = Database['public']['Tables']['workouts']['Insert']
type DbExercise = Database['public']['Tables']['exercises']['Insert']
type DbSection = Database['public']['Tables']['sections']['Insert']

export type ExerciseInput = Omit<DbExercise, 'id' | 'created_at' | 'created_by' | 'media_id' | 'is_public'> & {
    id?: string
    media_url?: string | null 
    media_id?: string | null
    filename?: string | null
    bucket_path?: string | null
}

export type SectionInput = Omit<DbSection, 'id' | 'created_at'> & {
    id?: string
    orderType: DbSection['type'] 
    exercises: ExerciseInput[]
}
export type WorkoutInput = Omit<DbWorkout, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'audio' | 'is_public'> & {
    audio?: string[]
    exp_earned?: number
    stats?: Record<string, number>
    sections: SectionInput[]
}


export async function preprocessWorkoutData(supabase: any, user_id: string, data: WorkoutInput): Promise<WorkoutInput> {
  const exerciseIds = data.sections
      .flatMap(s => s.exercises)
      .map(e => e.id)
      .filter((id): id is string => !!id)

  if (exerciseIds.length === 0) return data

  const { data: existingExercises } = await supabase
      .from('exercises')
      .select('id, user_id, description, name')
      .in('id', exerciseIds)

  const exerciseMap = new Map(existingExercises?.map((e: any) => [e.id, e]))
  const updates: Promise<any>[] = []

  const newSections = data.sections.map(section => ({
      ...section,
      exercises: section.exercises.map(exercise => {
          if (!exercise.id) return exercise // Already new

          const existing = exerciseMap.get(exercise.id)
          if (!existing) return exercise // ID not found in DB? Treat as is

          const isOwner = existing.user_id === user_id
          
          // Normalize for comparison
          const newDesc = exercise.description || ''
          const oldDesc = existing.description || ''
          const hasDescChanged = newDesc !== oldDesc
          
          const newName = exercise.name
          const oldName = existing.name
          const hasNameChanged = newName !== oldName

          if (isOwner) {
              // Update if changed
              if (hasDescChanged || hasNameChanged) {
                  updates.push(
                      supabase.from('exercises').update({
                          description: exercise.description,
                          name: exercise.name,
                      }).eq('id', exercise.id)
                  )
              }
              return exercise // Keep ID
          } else {
              // Not owner
              if (hasDescChanged || hasNameChanged) {
                  // Clone it (remove ID) to save new description
                  const { id, ...rest } = exercise
                  return { ...rest, id: undefined } as ExerciseInput
              }
              return exercise // No change, link to existing
          }
      })
  }))

  if (updates.length > 0) {
      await Promise.all(updates)
  }

  return {
      ...data,
      sections: newSections
  }
}

export async function createWorkoutAction(data: WorkoutInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated, you cannot create anything, just watch')
    }

    // Preprocess data to handle exercise updates/cloning
    const processedData = await preprocessWorkoutData(supabase, user.id, data)

    const { data: workoutId, error } = await supabase.rpc('create_complete_workout', {
      p_user_id: user.id,
      p_workout_data: processedData
    })

    if (error) {
      console.error('RPC Error:', error)
      throw new Error(`Transaction failed: ${error.message}`)
    }

    return { success: true, workoutId }
  } catch (error: any) {
    console.error('Server Action Error:', error)
    return { success: false, error: error.message }
  }
}