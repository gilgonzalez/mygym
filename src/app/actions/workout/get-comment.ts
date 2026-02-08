'use server'

import { createClient } from '@/lib/supabase/server'

export type Comment = {
  id: string
  rating: number | null
  feeling: string | null
  notes: string | null
  completed_at: string | null
  user: {
    name: string | null
    avatar_url: string | null
    username: string
  }
}

export async function getWorkoutComments(workoutId: string, page: number = 0, pageSize: number = 10) {
  const supabase = await createClient()
  
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('workout_logs')
    .select(`
      id,
      rating,
      feeling,
      notes,
      completed_at,
      user:users (
        name,
        avatar_url,
        username
      )
    `)
    .eq('workout_id', workoutId)
    .not('notes', 'is', null)
    .neq('notes', '')
    .order('completed_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching comments:', error)
    return { success: false, error: error.message }
  }

  // Cast to ensure type safety with the joined relation
  return { success: true, data: data as unknown as Comment[] }
}