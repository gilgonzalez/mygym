'use server'

import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/database"

export type Exercise = Database['public']['Tables']['exercises']['Row'] & {
  media?: {
    url: string
    type: string | null
  } | null
}

interface ListExercisesParams {
  page?: number
  limit?: number
  search?: string
  difficulty?: string
  muscleGroup?: string
}

interface ListExercisesResult {
  data: Exercise[]
  count: number
  error: string | null
}

export async function listExercises({
  page = 1,
  limit = 10,
  search = '',
  difficulty,
  muscleGroup
}: ListExercisesParams): Promise<ListExercisesResult> {
  const supabase = await createClient()
  
  let query = supabase
    .from('exercises')
    .select('*, media(url, type)', { count: 'exact' })
  
  if (search) {
    query = query.ilike('name', `%${search}%`)
  }
  
  if (difficulty && difficulty !== 'all') {
    query = query.eq('difficulty', difficulty)
  }
  
  if (muscleGroup && muscleGroup !== 'all') {
    // muscle_group is an array in the DB, so we use contains
    query = query.contains('muscle_group', [muscleGroup])
  }
  
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error fetching exercises:', error)
    return { data: [], count: 0, error: error.message }
  }
  
  return {
    data: data || [],
    count: count || 0,
    error: null
  }
}