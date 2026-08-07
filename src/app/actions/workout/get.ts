'use server'

import { createClient } from '@/lib/supabase/server'
import type { FollowStatus } from '@/types/social'
import { Workout, WorkoutLikerPreview } from '@/types/workout/composite'

export async function getWorkoutById(id: string): Promise<{ success: boolean, data?: Workout, error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        challenge:workout_challenges(*),
        user:users!user_id(id, username, name, avatar_url),
        workout_sections(
          order_index,
          sections(
            *,
            section_exercises(
              id,
              order_index,
              type,
              reps,
              sets,
              duration,
              rest,
              exercises(
                *,
                thumbnail:media!exercises_thumbnail_media_id_fkey(
                  id,
                  url,
                  type,
                  filename,
                  bucket_path
                ),
                tutorial:exercise_tutorials(
                  media_id,
                  tutorial_media:media!exercise_tutorials_media_id_fkey(
                    id,
                    url,
                    type,
                    filename,
                    bucket_path
                  ),
                  steps:exercise_tutorial_steps(
                    id,
                    order_index,
                    title,
                    description
                  )
                )
              )
            )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) throw new Error('Workout no encontrado')

    let viewerFollowStatus: FollowStatus | undefined

    if (user?.id && data.user_id !== user.id) {
      const { data: relationship, error: followError } = await supabase
        .from('user_follows')
        .select('status')
        .eq('follower_id', user.id)
        .eq('followed_id', data.user_id)
        .maybeSingle()

      if (followError) throw followError

      if (relationship?.status === 'pending' || relationship?.status === 'accepted') {
        viewerFollowStatus = relationship.status
      } else {
        viewerFollowStatus = 'none'
      }
    }

    const { data: likesData, error: likesDataError } = await supabase
      .from('workout_likes')
      .select(`
        user_id,
        created_at,
        user:users!workout_likes_user_id_fkey(id, username, name, avatar_url)
      `)
      .eq('workout_id', id)
      .order('created_at', { ascending: false })

    if (likesDataError) throw likesDataError

    let likesCount = 0
    let isLiked = false
    const likesPreview: WorkoutLikerPreview[] = []

    for (const row of likesData ?? []) {
      likesCount += 1
      if (user?.id && row.user_id === user.id) {
        isLiked = true
      }
      const userRow = (row as any).user
      if (userRow && likesPreview.length < 3) {
        likesPreview.push({
          id: userRow.id,
          username: userRow.username ?? null,
          name: userRow.name ?? null,
          avatar_url: userRow.avatar_url ?? null,
        })
      }
    }

    // Transform deeply nested response to flat UI structure
    const challengeData = Array.isArray((data as any).challenge)
      ? (data as any).challenge[0]
      : (data as any).challenge

    const workout: Workout = {
      ...data,
      challenge: challengeData || null,
      user: data.user,
      likes_count: likesCount,
      is_liked: isLiked,
      likes_preview: likesPreview,
      viewer_follow_status: viewerFollowStatus,
      sections: (data.workout_sections || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((ws: any) => ({
          ...ws.sections,
          total_exercises: ws.sections.section_exercises?.length || 0,
          exercises: (ws.sections.section_exercises || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((se: any) => {
              const tutorialData = Array.isArray(se.exercises.tutorial)
                ? se.exercises.tutorial[0]
                : se.exercises.tutorial

              return {
                ...se.exercises,
                link_id: se.id,
                type: se.type || se.exercises.type || 'reps',
                reps: se.reps ?? 0,
                sets: se.sets ?? 0,
                duration: se.duration ?? 0,
                rest: se.rest ?? 0,
                thumbnail_url: se.exercises.thumbnail?.url || undefined,
                thumbnail_media_id: se.exercises.thumbnail?.id || se.exercises.thumbnail_media_id || undefined,
                filename: se.exercises.thumbnail?.filename || undefined,
                bucket_path: se.exercises.thumbnail?.bucket_path || undefined,
                tutorial: tutorialData
                  ? {
                      media_id: tutorialData.media_id,
                      media_url: tutorialData.tutorial_media?.url || undefined,
                      media_type: tutorialData.tutorial_media?.type || undefined,
                      filename: tutorialData.tutorial_media?.filename || undefined,
                      bucket_path: tutorialData.tutorial_media?.bucket_path || undefined,
                      steps: (tutorialData.steps || [])
                        .sort((a: any, b: any) => a.order_index - b.order_index)
                        .map((step: any) => ({
                          id: step.id,
                          title: step.title,
                          description: step.description,
                        })),
                    }
                  : null,
              }
            })
        }))
    }

    return { success: true, data: workout }
  } catch (error: any) {
    console.error('Error fetching workout:', error)
    return { success: false, error: error.message }
  }
}
