import { calcWorkoutXP, computeWorkoutStats, type Difficulty, type WorkoutVisibility } from '@mygym/shared'

import { supabase } from './supabase'

// Data layer de la pantalla de creación/edición de workout (ver
// components/workout-editor/ y app/workout-editor/[id].tsx). No hay
// equivalente de src/app/actions/workout/create.ts (Server Action) acá: el
// cliente llama directo a los mismos RPC de Postgres (create_complete_workout
// / update_complete_workout, ver supabase/migrations/20260702_0002_workout_functions.sql
// y 20260824_0001_drop_exercise_instance_columns_and_audio.sql) que ya usan
// esas Server Actions — un solo contrato de persistencia para las dos
// plataformas, sin duplicar la lógica de insert/update en SQL.
//
// Alcance v1 de este editor en mobile (decisión deliberada, no un olvido):
// - Sin reto AMRAP/challenge (secciones siempre "linear"/"single" normales).
//   La web sí lo soporta; portar eso es un scope aparte.
// - Sin subida de imagen (portada/miniatura): mobile no tiene hoy ninguna
//   capacidad de subir archivos (no hay expo-image-picker, y el endpoint de
//   subida de la web se autentica por cookie de sesión, no por bearer token).
//   Los ejercicios del vault ya traen su thumbnail; los ejercicios nuevos
//   creados desde mobile quedan sin miniatura hasta que se editen desde la web.
// - Sin editor de tutorial (pasos + media) por ejercicio.

export interface ExerciseEditorInput {
  // Key local para listas/DraggableFlatList — nunca se manda al RPC (no es
  // el id de ninguna fila real, ver formHelpers.generateLocalId).
  key: string
  // Id de la fila en `exercises` (el vault) que ya existe — presente cuando
  // el ejercicio viene del vault; ausente para un ejercicio genuinamente
  // nuevo (resolve_workout_exercise_id crea la fila en ese caso).
  id?: string
  // Id de la fila en `section_exercises` que ya existe — solo al editar un
  // workout existente; ausente al crear o al agregar una instancia nueva
  // dentro de una edición (el RPC hace INSERT en vez de UPDATE).
  linkId?: string
  name: string
  description: string
  difficulty: Difficulty
  muscleGroups: string[]
  equipment: string[]
  thumbnailUrl?: string | null
  thumbnailMediaId?: string | null
  type: 'reps' | 'time' | 'emom'
  sets: number
  reps: number
  rest: number
  duration: number
  weightKg?: number | null
}

export interface SectionEditorInput {
  key: string
  id?: string
  name: string
  orderType: 'linear' | 'single'
  exercises: ExerciseEditorInput[]
}

export interface WorkoutEditorInput {
  title: string
  description: string
  difficulty: Difficulty
  tags: string[]
  cover: string | null
  visibility: WorkoutVisibility
  sections: SectionEditorInput[]
}

// Misma estimación que create/page.tsx (apps/web): 3s por rep para
// ejercicios por reps, la duración configurada para time/emom, más el
// descanso de cada serie (0 para emom, el resto que sobra de la ventana ya
// lo cubre eso, no un campo de rest aparte).
function estimateWorkoutDurationSeconds(sections: SectionEditorInput[]): number {
  return sections.reduce((total, section) => {
    return (
      total +
      section.exercises.reduce((sectionTotal, exercise) => {
        const sets = exercise.sets || 1
        const rest = exercise.type === 'emom' ? 0 : exercise.rest || 0
        const duration = exercise.duration || 0
        const reps = exercise.reps || 0

        const executionTime = exercise.type === 'time' || exercise.type === 'emom' ? duration * sets : reps * 3 * sets
        const restTime = rest * sets

        return sectionTotal + executionTime + restTime
      }, 0)
    )
  }, 0)
}

function buildExercisePayload(exercise: ExerciseEditorInput) {
  return {
    id: exercise.id,
    link_id: exercise.linkId,
    name: exercise.name,
    description: exercise.description,
    difficulty: exercise.difficulty,
    muscle_groups: exercise.muscleGroups,
    equipment: exercise.equipment,
    thumbnail_url: exercise.thumbnailUrl,
    thumbnail_media_id: exercise.thumbnailMediaId,
    type: exercise.type,
    sets: exercise.sets,
    reps: exercise.reps,
    rest: exercise.rest,
    duration: exercise.duration,
    weight_kg: exercise.weightKg ?? null,
  }
}

function buildWorkoutPayload(input: WorkoutEditorInput) {
  const estimatedTime = estimateWorkoutDurationSeconds(input.sections)
  const expEarned = calcWorkoutXP(estimatedTime, input.difficulty)
  const stats = computeWorkoutStats(input.tags, expEarned)

  return {
    title: input.title,
    description: input.description,
    difficulty: input.difficulty,
    tags: input.tags,
    cover: input.cover,
    visibility: input.visibility,
    estimated_time: estimatedTime,
    exp_earned: expEarned,
    stats,
    sections: input.sections.map((section) => ({
      id: section.id,
      name: section.name,
      orderType: section.orderType,
      exercises: section.exercises.map(buildExercisePayload),
    })),
  }
}

export async function createWorkout(userId: string, input: WorkoutEditorInput): Promise<string> {
  const { data: workoutId, error } = await supabase.rpc('create_complete_workout', {
    p_user_id: userId,
    p_workout_data: buildWorkoutPayload(input),
  })

  if (error) throw error
  if (!workoutId) throw new Error('No se recibió el id del workout creado')
  return workoutId
}

export async function updateWorkout(workoutId: string, userId: string, input: WorkoutEditorInput): Promise<void> {
  const { error } = await supabase.rpc('update_complete_workout', {
    p_workout_id: workoutId,
    p_user_id: userId,
    p_workout_data: buildWorkoutPayload(input),
  })

  if (error) throw error
}

// ---------------------------------------------------------------------------
// Vault de ejercicios (picker "Agregar desde vault", ver ExerciseVaultSheet) —
// versión mobile de src/app/actions/exercises/list.ts, simplificada: sin el
// scoring de relevancia por tokens, un ilike simple sobre nombre/descripción
// alcanza para el picker (no es el catálogo completo de la web, es una lista
// corta dentro de un sheet).
export interface VaultExercise {
  id: string
  name: string
  description: string | null
  difficulty: Difficulty | null
  muscleGroups: string[]
  equipment: string[]
  thumbnailUrl: string | null
}

const VAULT_SELECT = `
  id, name, description, difficulty, muscle_group, equipment,
  thumbnail:media!exercises_thumbnail_media_id_fkey(url)
`
const VAULT_PAGE_SIZE = 30

export async function fetchExerciseVault(userId: string, search: string): Promise<VaultExercise[]> {
  let query = supabase
    .from('exercises')
    .select(VAULT_SELECT)
    .or(`is_public.eq.true,user_id.eq.${userId}`)
    .order('name', { ascending: true })
    .limit(VAULT_PAGE_SIZE)

  const term = search.trim()
  if (term) {
    const escaped = term.replace(/[%,]/g, '')
    query = query.or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    difficulty: row.difficulty as Difficulty | null,
    muscleGroups: row.muscle_group ?? [],
    equipment: row.equipment ?? [],
    thumbnailUrl: (row.thumbnail as { url: string } | null)?.url ?? null,
  }))
}

// ---------------------------------------------------------------------------
// Carga de un workout propio para editar — distinto de fetchWorkoutById
// (lib/workouts.ts): ese está pensado para mostrar/ejecutar el workout y no
// trae lo que el editor necesita para hacer un UPDATE parcial correcto
// (el id de la fila de section_exercises como linkId, el id del ejercicio
// del vault como id para bloquear sus campos propios, weight_kg).
const EDIT_SELECT = `
  id, title, description, tags, difficulty, cover, visibility,
  workout_sections(
    order_index,
    sections(
      id, name, type,
      section_exercises(
        id, order_index, type, reps, sets, duration, rest, weight_kg,
        exercises(
          id, name, description, difficulty, muscle_group, equipment,
          thumbnail:media!exercises_thumbnail_media_id_fkey(url)
        )
      )
    )
  )
`

export async function fetchWorkoutForEdit(workoutId: string): Promise<WorkoutEditorInput & { id: string }> {
  const { data, error } = await supabase.from('workouts').select(EDIT_SELECT).eq('id', workoutId).single()
  if (error) throw error
  if (!data) throw new Error('Workout no encontrado')

  const raw = data as any

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? '',
    difficulty: (raw.difficulty as Difficulty) || 'beginner',
    tags: raw.tags ?? [],
    cover: raw.cover,
    visibility: (raw.visibility as WorkoutVisibility) || 'private',
    sections: ((raw.workout_sections ?? []) as any[])
      .sort((a, b) => a.order_index - b.order_index)
      .map((ws) => ({
        key: `section-${ws.sections.id}`,
        id: ws.sections.id as string,
        name: ws.sections.name as string,
        orderType: ((ws.sections.type as 'linear' | 'single') || 'single'),
        exercises: ((ws.sections.section_exercises ?? []) as any[])
          .sort((a, b) => a.order_index - b.order_index)
          .map((se) => ({
            key: `exercise-${se.id}`,
            id: se.exercises.id as string,
            linkId: se.id as string,
            name: se.exercises.name as string,
            description: se.exercises.description ?? '',
            difficulty: (se.exercises.difficulty as Difficulty) || 'beginner',
            muscleGroups: se.exercises.muscle_group ?? [],
            equipment: se.exercises.equipment ?? [],
            thumbnailUrl: se.exercises.thumbnail?.url ?? null,
            thumbnailMediaId: null,
            type: ((se.type as 'reps' | 'time' | 'emom') || 'reps'),
            sets: se.sets ?? 3,
            reps: se.reps ?? 10,
            rest: se.rest ?? 60,
            duration: se.duration ?? 0,
            weightKg: se.weight_kg ?? null,
          })),
      })),
  }
}
