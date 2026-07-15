'use server'

import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/database"

export type Exercise = Database['public']['Tables']['exercises']['Row'] & {
  thumbnail?: {
    url: string
    type: string | null
  } | null
  tutorial?: {
    media?: {
      url: string
      type: string | null
    } | null
    steps?: Array<{
      id: string
      title: string
      description: string
      order_index: number
    }>
  } | null
}

interface ListExercisesParams {
  page?: number
  limit?: number
  search?: string
  muscleGroups?: string[]
  equipment?: string[]
  sort?: 'relevance' | 'recent' | 'name'
}

interface ListExercisesResult {
  data: Exercise[]
  count: number
  error: string | null
}

interface ExerciseFilterOptionsResult {
  muscleGroups: string[]
  equipment: string[]
  error: string | null
}

type SearchableExerciseRow = Pick<
  Database['public']['Tables']['exercises']['Row'],
  'id' | 'name' | 'description' | 'muscle_group' | 'equipment' | 'type' | 'created_at'
>

function normalizeSearchValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function uniqueSortedValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((left, right) => left.localeCompare(right, 'es', { sensitivity: 'base' }))
}

function getSearchScore(exercise: SearchableExerciseRow, search: string) {
  const normalizedSearch = normalizeSearchValue(search)
  if (!normalizedSearch) return 0

  const tokens = normalizedSearch.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return 0

  const normalizedName = normalizeSearchValue(exercise.name)
  const normalizedDescription = normalizeSearchValue(exercise.description ?? '')
  const normalizedMuscles = (exercise.muscle_group ?? []).map(normalizeSearchValue)
  const normalizedEquipment = (exercise.equipment ?? []).map(normalizeSearchValue)

  let score = 0

  for (const token of tokens) {
    let tokenScore = 0

    if (normalizedName === token) {
      tokenScore = Math.max(tokenScore, 120)
    }

    if (normalizedName.startsWith(token)) {
      tokenScore = Math.max(tokenScore, 90)
    }

    if (normalizedName.includes(token)) {
      tokenScore = Math.max(tokenScore, 70)
    }

    if (normalizedDescription.includes(token)) {
      tokenScore = Math.max(tokenScore, 32)
    }

    if (normalizedMuscles.some((item) => item === token)) {
      tokenScore = Math.max(tokenScore, 52)
    } else if (normalizedMuscles.some((item) => item.includes(token))) {
      tokenScore = Math.max(tokenScore, 40)
    }

    if (normalizedEquipment.some((item) => item === token)) {
      tokenScore = Math.max(tokenScore, 48)
    } else if (normalizedEquipment.some((item) => item.includes(token))) {
      tokenScore = Math.max(tokenScore, 36)
    }

    if (tokenScore === 0) {
      return 0
    }

    score += tokenScore
  }

  if (normalizedName === normalizedSearch) {
    score += 120
  } else if (normalizedName.startsWith(normalizedSearch)) {
    score += 80
  } else if (normalizedName.includes(normalizedSearch)) {
    score += 50
  }

  return score
}

function sortExerciseRows(
  exercises: SearchableExerciseRow[],
  sort: NonNullable<ListExercisesParams['sort']>,
  search: string
) {
  const withScores = exercises.map((exercise) => ({
    exercise,
    score: getSearchScore(exercise, search),
  }))

  withScores.sort((left, right) => {
    if (sort === 'name') {
      return left.exercise.name.localeCompare(right.exercise.name, 'es', { sensitivity: 'base' })
    }

    if (sort === 'recent') {
      return new Date(right.exercise.created_at ?? 0).getTime() - new Date(left.exercise.created_at ?? 0).getTime()
    }

    if (right.score !== left.score) {
      return right.score - left.score
    }

    return new Date(right.exercise.created_at ?? 0).getTime() - new Date(left.exercise.created_at ?? 0).getTime()
  })

  return withScores
}

export async function listExercises({
  page = 1,
  limit = 10,
  search = '',
  muscleGroups = [],
  equipment = [],
  sort = 'relevance',
}: ListExercisesParams): Promise<ListExercisesResult> {
  const supabase = await createClient()

  let baseQuery = supabase
    .from('exercises')
    .select('id, name, description, muscle_group, equipment, type, created_at')

  if (muscleGroups.length > 0) {
    baseQuery = baseQuery.overlaps('muscle_group', muscleGroups)
  }

  if (equipment.length > 0) {
    baseQuery = baseQuery.overlaps('equipment', equipment)
  }

  const { data: searchRows, error: searchError } = await baseQuery

  if (searchError) {
    console.error('Error fetching exercise search rows:', searchError)
    return { data: [], count: 0, error: searchError.message }
  }

  const normalizedSearch = search.trim()
  const filteredRows = normalizedSearch
    ? (searchRows ?? []).filter((exercise) => getSearchScore(exercise, normalizedSearch) > 0)
    : (searchRows ?? [])

  const sortedRows = sortExerciseRows(filteredRows, sort, normalizedSearch)
  const count = sortedRows.length
  const from = (page - 1) * limit
  const paginatedIds = sortedRows.slice(from, from + limit).map(({ exercise }) => exercise.id)

  if (paginatedIds.length === 0) {
    return { data: [], count, error: null }
  }

  const { data, error } = await supabase
    .from('exercises')
    .select(`
      *,
      thumbnail:media!exercises_thumbnail_media_id_fkey(url, type),
      tutorial:exercise_tutorials(
        media:media!exercise_tutorials_media_id_fkey(url, type),
        steps:exercise_tutorial_steps(id, title, description, order_index)
      )
    `)
    .in('id', paginatedIds)

  if (error) {
    console.error('Error fetching exercises:', error)
    return { data: [], count: 0, error: error.message }
  }

  const exerciseMap = new Map<string, Exercise>(
    (data ?? []).map((exercise) => [exercise.id, exercise as Exercise])
  )
  const orderedData = paginatedIds.flatMap((id) => {
    const exercise = exerciseMap.get(id)
    return exercise ? [exercise] : []
  })

  return {
    data: orderedData,
    count,
    error: null
  }
}

export async function listExerciseFilterOptions(): Promise<ExerciseFilterOptionsResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('exercises')
    .select('muscle_group, equipment')

  if (error) {
    console.error('Error fetching exercise filter options:', error)
    return {
      muscleGroups: [],
      equipment: [],
      error: error.message,
    }
  }

  return {
    muscleGroups: uniqueSortedValues((data ?? []).flatMap((exercise) => exercise.muscle_group ?? [])),
    equipment: uniqueSortedValues((data ?? []).flatMap((exercise) => exercise.equipment ?? [])),
    error: null,
  }
}
