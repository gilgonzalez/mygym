import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

// --- Types based on Database ---
type DbExercise = Database['public']['Tables']['exercises']['Insert']
type DbSection = Database['public']['Tables']['sections']['Insert']
type DbWorkout = Database['public']['Tables']['workouts']['Insert']

// Input Types for the Service
export type ExerciseInput = Omit<DbExercise, 'id' | 'created_at' | 'created_by' | 'media_id' | 'is_public'> & {
    media_url?: string | null // Transient field for file upload
    media_id?: string | null
}

export type SectionInput = Omit<DbSection, 'id' | 'created_at'> & {
    orderType: DbSection['type'] // Map form field to db field if names differ, or just use 'type'
    exercises: ExerciseInput[]
}

export type WorkoutInput = Omit<DbWorkout, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'audio'> & {
    audio?: string[] // Transient: array of URLs/Files
    sections: SectionInput[]
}

async function uploadFile(fileUrl: string | undefined | null): Promise<string | null> {
  if (!fileUrl) return null
  if (!fileUrl.startsWith('blob:')) return fileUrl

  try {
    // 1. Get the file blob
    const response = await fetch(fileUrl)
    const blob = await response.blob()
    const fileType = blob.type
    const fileExt = fileType.split('/')[1] || 'bin'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // 2. Get Signed URL from our API
    const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: fileName,
            contentType: fileType
        })
    })

    if (!uploadRes.ok) {
        throw new Error('Failed to get upload URL')
    }

    const { url, publicUrl } = await uploadRes.json()

    // 3. Upload to R2 using the signed URL
    const r2UploadRes = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': fileType
        },
        body: blob
    })

    if (!r2UploadRes.ok) {
        throw new Error('Failed to upload file to R2')
    }

    return publicUrl
  } catch (error) {
    console.error('Error uploading file:', error)
    return null
  }
}

export async function submitWorkout(data: WorkoutInput, userId: string) {
  // 1. Upload Cover
  const coverUrl = await uploadFile(data.cover)
  
  // 2. Upload Audio
  const audioUrls = await Promise.all(
    (data.audio || []).map(url => uploadFile(url))
  )
  const validAudioUrls = audioUrls.filter((url): url is string => !!url)

  // Prepare data with resolved URLs
  const sectionsWithMedia = await Promise.all(data.sections.map(async (section) => {
      const exercisesWithMedia = await Promise.all(section.exercises.map(async (exercise) => {
          let finalMediaUrl = exercise.media_url
          if (exercise.media_url && exercise.media_url.startsWith('blob:')) {
              finalMediaUrl = await uploadFile(exercise.media_url)
          }
          return { ...exercise, media_url: finalMediaUrl }
      }))
      return { ...section, exercises: exercisesWithMedia }
  }))

  // 3. Create Workout
  const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert({
          user_id: userId,
          title: data.title,
          description: data.description,
          difficulty: data.difficulty,
          tags: data.tags,
          cover: coverUrl,
          audio: validAudioUrls
      })
      .select()
      .single()

  if (workoutError) throw workoutError


  // 4. Create Sections & Exercises
  for (const [index, section] of sectionsWithMedia.entries()) {
      const { data: sectionData, error: sectionError } = await supabase
        .from('sections')
        .insert({ 
            name: section.name, 
            type: section.orderType 
        })
        .select()
        .single()

      if (sectionError) throw sectionError

      await supabase.from('workout_sections').insert({
        workout_id: workout.id,
        section_id: sectionData.id,
        order_index: index
      })

      for (const [exIndex, exercise] of section.exercises.entries()) {
        let mediaId = exercise.media_id

        if (!mediaId && exercise.media_url) {
             const { data: media } = await supabase
                .from('media')
                .insert({
                  url: exercise.media_url,
                  uploader_id: userId,
                  type: exercise.media_url.includes('youtube') ? 'video' : 'image'
                })
                .select()
                .single()
             
             if (media) mediaId = media.id
        }

        const { data: exerciseData, error: exerciseError } = await supabase
          .from('exercises')
          .insert({
            name: exercise.name,
            description: exercise.description,
            media_id: mediaId,
            muscle_group: exercise.muscle_group,
            equipment: exercise.equipment,
            difficulty: exercise.difficulty,
            type: exercise.type,
            sets: Number(exercise.sets) || 0,
            reps: Number(exercise.reps) || 0,
            duration: Number(exercise.duration) || 0,
            rest: Number(exercise.rest) || 0,
            created_by: userId
          })
          .select()
          .single()

        if (exerciseError) throw exerciseError

        await supabase.from('section_exercises').insert({
          section_id: sectionData.id,
          exercise_id: exerciseData.id,
          order_index: exIndex
        })
      }
  }

  return workout
}