'use server'

import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { type Exercise } from '@/app/actions/exercises/list'
import type { Difficulty } from '@mygym/shared'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MAX_CANDIDATE_EXERCISES = 24
const MAX_EXERCISE_SCAN = 600
const EXERCISE_SCAN_BATCH_SIZE = 200
const OFF_TOPIC_ERROR = 'El asistente no esta disenado para este tipo de consultas.'
const DISALLOWED_SECTION_NAMES = new Set([
  'primer',
  'warm up',
  'warmup',
  'cool down',
  'cooldown',
  'finisher',
  'main set',
  'block a',
  'block b',
  'bloque a',
  'bloque b',
  'tabata central',
  'ignition',
  'the grind',
  'zen finish',
])

type WorkoutIntentClassification = {
  is_workout_request: boolean
}

type PromptFilters = {
  muscleGroups: string[]
  equipment: string[]
  difficulty?: Difficulty
  durationMinutes?: number | null
  avoidEquipment: boolean
  searchTerms: string[]
}

type GeneratedWorkoutExercise = {
  id: string
  name?: string
  sets?: number
  reps?: number
  rest?: number
  type?: 'reps' | 'time'
  duration?: number
  muscle_groups?: string[]
  equipment?: string[]
  description?: string
  difficulty?: Difficulty
  is_new_exercise?: boolean
}

type GeneratedWorkoutSection = {
  name: string
  exercises: GeneratedWorkoutExercise[]
}

type GeneratedWorkout = {
  title: string
  description: string
  difficulty?: Difficulty
  sections: GeneratedWorkoutSection[]
}

type NormalizedTutorial = {
  media_url: string | null
  media_id: string | null
  filename: string | null
  bucket_path: string | null
  media_type: 'image' | 'video' | 'audio' | null
  steps: Array<{
    id?: string
    title: string
    description: string
  }>
} | null

function normalizeWorkoutRequestPrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, ' ')
}

function normalizeLookupValue(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function extractDurationMinutes(prompt: string) {
  const normalizedPrompt = normalizeLookupValue(prompt)
  const directMinutesMatch = normalizedPrompt.match(/(\d+)\s*(min|minuto|minutos)\b/)

  if (directMinutesMatch) {
    return Number(directMinutesMatch[1])
  }

  const rangeMinutesMatch = normalizedPrompt.match(/(\d+)\s*-\s*(\d+)\s*(min|minuto|minutos)\b/)
  if (rangeMinutesMatch) {
    return Math.round((Number(rangeMinutesMatch[1]) + Number(rangeMinutesMatch[2])) / 2)
  }

  return null
}

function extractPromptFilters(prompt: string): PromptFilters {
  const normalizedPrompt = normalizeLookupValue(prompt)

  const muscleAliases: Array<{ canonical: string; aliases: string[] }> = [
    { canonical: 'chest', aliases: ['pecho', 'pector', 'chest'] },
    { canonical: 'biceps', aliases: ['biceps', 'bíceps', 'brazo', 'brazos'] },
    { canonical: 'triceps', aliases: ['triceps', 'tríceps', 'brazo', 'brazos'] },
    { canonical: 'shoulders', aliases: ['hombro', 'hombros', 'shoulder', 'deltoid'] },
    { canonical: 'back', aliases: ['espalda', 'dorsal', 'dorsales', 'back', 'lats', 'remo'] },
    { canonical: 'quadriceps', aliases: ['quad', 'quads', 'cuadriceps', 'cuádriceps'] },
    { canonical: 'hamstrings', aliases: ['isquio', 'isquios', 'hamstring', 'femor'] },
    { canonical: 'glutes', aliases: ['glute', 'gluteo', 'gluteos', 'glúteo', 'glúteos'] },
    { canonical: 'calves', aliases: ['gemelo', 'gemelos', 'calf', 'calves'] },
    { canonical: 'abs', aliases: ['abdomen', 'abdominal', 'abdominales', 'abs', 'core'] },
    { canonical: 'obliques', aliases: ['oblique', 'oblicuo', 'oblicuos'] },
    { canonical: 'forearms', aliases: ['antebrazo', 'antebrazos', 'forearm', 'forearms'] },
    { canonical: 'full body', aliases: ['full body', 'cuerpo completo', 'fullbody'] },
  ]

  const equipmentAliases: Array<{ canonical: string; aliases: string[] }> = [
    { canonical: 'body weight', aliases: ['sin material', 'sin equipo', 'peso corporal', 'bodyweight', 'body weight'] },
    { canonical: 'barbell', aliases: ['barra', 'barbell'] },
    { canonical: 'dumbbell', aliases: ['mancuerna', 'mancuernas', 'dumbbell', 'dumbbells'] },
    { canonical: 'cable', aliases: ['polea', 'poleas', 'cable'] },
    { canonical: 'machine', aliases: ['maquina', 'máquina', 'machine'] },
    { canonical: 'kettlebell', aliases: ['kettlebell', 'pesa rusa'] },
    { canonical: 'band', aliases: ['banda', 'band', 'goma', 'banda elastica', 'banda elástica'] },
    { canonical: 'pull-up bar', aliases: ['barra de dominadas', 'pull-up bar', 'barra fija'] },
    { canonical: 'bench', aliases: ['banco', 'bench'] },
    { canonical: 'dip station', aliases: ['paralelas', 'dip station', 'fondos'] },
  ]

  const muscleGroups = uniqueValues(
    muscleAliases
      .filter(({ aliases }) => aliases.some((alias) => normalizedPrompt.includes(normalizeLookupValue(alias))))
      .map(({ canonical }) => canonical)
  )

  const noEquipmentRequested =
    normalizedPrompt.includes('sin material') ||
    normalizedPrompt.includes('sin equipo') ||
    normalizedPrompt.includes('sin equipamiento') ||
    normalizedPrompt.includes('no equipment') ||
    normalizedPrompt.includes('bodyweight') ||
    normalizedPrompt.includes('peso corporal')

  const equipment = uniqueValues(
    equipmentAliases
      .filter(({ aliases, canonical }) => {
        if (noEquipmentRequested && canonical !== 'body weight') return false
        return aliases.some((alias) => normalizedPrompt.includes(normalizeLookupValue(alias)))
      })
      .map(({ canonical }) => canonical)
  )

  const difficulty = normalizedPrompt.includes('advanced') || normalizedPrompt.includes('avanzad')
    ? 'advanced'
    : normalizedPrompt.includes('intermediate') || normalizedPrompt.includes('intermedio')
      ? 'intermediate'
      : normalizedPrompt.includes('beginner') || normalizedPrompt.includes('principiante') || normalizedPrompt.includes('inicial')
        ? 'beginner'
        : undefined

  const searchTerms = uniqueValues(
    normalizedPrompt
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4)
      .filter((token) => ![
        'quiero', 'rutina', 'workout', 'nivel', 'duracion', 'duracion', 'minutos',
        'minuto', 'sienta', 'quiero', 'hoy', 'intermedio', 'avanzado', 'principiante',
        'dinamica', 'dinamico', 'activadora', 'activador', 'retadora', 'retador',
        'fuerte', 'sesion', 'estructura', 'bloques', 'catalogo', 'disponible',
      ].includes(token))
  )

  return {
    muscleGroups,
    equipment,
    difficulty,
    durationMinutes: extractDurationMinutes(prompt),
    avoidEquipment: noEquipmentRequested,
    searchTerms,
  }
}

function clampPositiveNumber(value: number | undefined, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    return fallback
  }

  return Math.round(value)
}

function normalizeExerciseType(
  value: GeneratedWorkoutExercise['type'],
  fallback: 'reps' | 'time' | undefined
): 'reps' | 'time' {
  if (value === 'time' || value === 'reps') {
    return value
  }

  return fallback === 'time' ? 'time' : 'reps'
}

function normalizeTutorial(exercise: Exercise): NormalizedTutorial {
  const tutorial = Array.isArray(exercise.tutorial) ? exercise.tutorial[0] : exercise.tutorial

  if (!tutorial) {
    return null
  }

  return {
    media_url: tutorial.media?.url || null,
    media_id: null,
    filename: null,
    bucket_path: null,
    media_type: (tutorial.media?.type as 'image' | 'video' | 'audio' | null) || null,
    steps: (tutorial.steps || []).map((step: { id?: string; title: string; description: string }) => ({
      id: step.id,
      title: step.title,
      description: step.description,
    })),
  }
}

async function classifyWorkoutIntent(prompt: string, language: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are a strict intent classifier for a workout builder assistant.
Return JSON only with:
{
  "is_workout_request": boolean
}

Mark true only if the user is asking to create, structure, personalize, modify, or plan a workout/training routine.
Mark false for any other request, including:
- general knowledge
- trivia
- casual conversation
- nutrition-only questions
- supplements
- injuries or medical advice
- technique explanations without requesting a workout
- unrelated productivity or coding requests

Treat the language code "${language}" as informational only. Do not answer the user request.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const content = completion.choices[0].message.content
  if (!content) {
    throw new Error('No content generated during intent classification')
  }

  const parsed = JSON.parse(content) as WorkoutIntentClassification
  return Boolean(parsed.is_workout_request)
}

function getPromptExerciseScore(exercise: Exercise, prompt: string, filters: PromptFilters) {
  const normalizedPrompt = normalizeLookupValue(prompt)
  const normalizedName = normalizeLookupValue(exercise.name)
  const normalizedDescription = normalizeLookupValue(exercise.description || '')
  const muscles = (exercise.muscle_group || []).map(normalizeLookupValue)
  const equipment = (exercise.equipment || []).map(normalizeLookupValue)

  let score = 0

  for (const term of filters.searchTerms) {
    if (normalizedName.includes(term)) score += 18
    if (normalizedDescription.includes(term)) score += 8
    if (muscles.some((item) => item.includes(term))) score += 14
    if (equipment.some((item) => item.includes(term))) score += 12
  }

  for (const muscle of filters.muscleGroups) {
    const normalizedMuscle = normalizeLookupValue(muscle)
    if (muscles.some((item) => item.includes(normalizedMuscle))) {
      score += 32
    }
  }

  for (const tool of filters.equipment) {
    const normalizedEquipment = normalizeLookupValue(tool)
    if (equipment.some((item) => item.includes(normalizedEquipment))) {
      score += 24
    }
  }

  if (filters.difficulty && exercise.difficulty === filters.difficulty) {
    score += 10
  }

  if (normalizedName && normalizedPrompt.includes(normalizedName)) {
    score += 30
  }

  return score
}

async function fetchExercisesForAi(filters: PromptFilters) {
  const supabase = await createClient()
  const rows: Exercise[] = []
  let from = 0
  let hasMore = true

  while (hasMore && rows.length < MAX_EXERCISE_SCAN) {
    let query = supabase
      .from('exercises')
      .select(`
        *,
        thumbnail:media!exercises_thumbnail_media_id_fkey(url, type),
        tutorial:exercise_tutorials(
          media:media!exercise_tutorials_media_id_fkey(url, type),
          steps:exercise_tutorial_steps(id, title, description, order_index)
        )
      `)
      .range(from, from + EXERCISE_SCAN_BATCH_SIZE - 1)

    if (filters.muscleGroups.length > 0) {
      query = query.overlaps('muscle_group', filters.muscleGroups)
    }

    if (filters.equipment.length > 0) {
      query = query.overlaps('equipment', filters.equipment)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    const batch = (data ?? []) as Exercise[]
    rows.push(...batch)
    hasMore = batch.length === EXERCISE_SCAN_BATCH_SIZE
    from += EXERCISE_SCAN_BATCH_SIZE
  }

  return rows
}

function selectTopCandidateExercises(exercises: Exercise[], prompt: string, filters: PromptFilters) {
  const scored = exercises
    .map((exercise) => ({
      exercise,
      score: getPromptExerciseScore(exercise, prompt, filters),
    }))
    .sort((left, right) => right.score - left.score)

  const strongMatches = scored.filter(({ score }) => score > 0).map(({ exercise }) => exercise)
  const fallbackMatches = scored.map(({ exercise }) => exercise)

  return (strongMatches.length > 0 ? strongMatches : fallbackMatches).slice(0, MAX_CANDIDATE_EXERCISES)
}

async function getCandidateExercises(prompt: string) {
  const filters = extractPromptFilters(prompt)

  let fetchedExercises = await fetchExercisesForAi(filters)

  if (fetchedExercises.length === 0 && (filters.muscleGroups.length > 0 || filters.equipment.length > 0)) {
    fetchedExercises = await fetchExercisesForAi({
      ...filters,
      muscleGroups: [],
      equipment: filters.avoidEquipment ? filters.equipment : [],
    })
  }

  const candidates = selectTopCandidateExercises(fetchedExercises, prompt, filters)

  return {
    filters,
    candidates,
    fetchedCount: fetchedExercises.length,
  }
}

function buildCandidateCatalog(candidates: Exercise[]) {
  return candidates.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    description: exercise.description || '',
    muscle_groups: exercise.muscle_group || [],
    equipment: exercise.equipment || [],
    difficulty: exercise.difficulty || 'intermediate',
  }))
}

function inferWorkoutFocusLabel(prompt: string) {
  const normalizedPrompt = normalizeLookupValue(prompt)

  if (normalizedPrompt.includes('pecho') && (normalizedPrompt.includes('brazo') || normalizedPrompt.includes('biceps') || normalizedPrompt.includes('triceps'))) {
    return 'pecho y brazos'
  }

  if (normalizedPrompt.includes('pierna') || normalizedPrompt.includes('quad') || normalizedPrompt.includes('glute')) {
    return 'tren inferior'
  }

  if (normalizedPrompt.includes('espalda') || normalizedPrompt.includes('remo') || normalizedPrompt.includes('dorsal')) {
    return 'espalda'
  }

  if (normalizedPrompt.includes('hombro')) {
    return 'hombros'
  }

  if (normalizedPrompt.includes('core') || normalizedPrompt.includes('abdomen')) {
    return 'core'
  }

  if (normalizedPrompt.includes('cardio') || normalizedPrompt.includes('hiit')) {
    return 'cardio'
  }

  return 'rendimiento'
}

function getFallbackSectionName(index: number, prompt: string) {
  const focus = inferWorkoutFocusLabel(prompt)
  const fallbackNames = [
    `Activacion de ${focus}`,
    `Bloque de tension de ${focus}`,
    `Cadena principal de ${focus}`,
    `Bloque de bombeo de ${focus}`,
    `Cierre tecnico de ${focus}`,
  ]

  return fallbackNames[index] || `Bloque de ${focus} ${index + 1}`
}

function sanitizeSectionName(name: string | undefined, index: number, prompt: string, usedNames: Set<string>) {
  const trimmedName = (name || '').trim()
  const normalizedName = normalizeLookupValue(trimmedName)
  const isGenericName =
    !normalizedName ||
    DISALLOWED_SECTION_NAMES.has(normalizedName) ||
    /^(section|seccion|bloque|block|parte|part)\s+[a-z0-9]+$/.test(normalizedName)

  let finalName = isGenericName ? getFallbackSectionName(index, prompt) : trimmedName
  let normalizedFinalName = normalizeLookupValue(finalName)
  let collisionIndex = 2

  while (usedNames.has(normalizedFinalName)) {
    finalName = `${getFallbackSectionName(index, prompt)} ${collisionIndex}`
    normalizedFinalName = normalizeLookupValue(finalName)
    collisionIndex += 1
  }

  usedNames.add(normalizedFinalName)
  return finalName
}

function findAlternativeExercise(
  currentExercise: Exercise,
  usedExerciseIds: Set<string>,
  candidates: Exercise[]
) {
  const currentMuscles = currentExercise.muscle_group || []
  const currentEquipment = currentExercise.equipment || []

  return candidates.find((candidate) => {
    if (usedExerciseIds.has(candidate.id) || candidate.id === currentExercise.id) {
      return false
    }

    const sharesMuscle = (candidate.muscle_group || []).some((muscle) => currentMuscles.includes(muscle))
    const sharesEquipment =
      currentEquipment.length === 0 ||
      (candidate.equipment || []).some((equipment) => currentEquipment.includes(equipment))

    return sharesMuscle && sharesEquipment
  })
}

function isNewExerciseMarker(generatedExercise: GeneratedWorkoutExercise) {
  const rawId = (generatedExercise.id || '').trim()
  if (generatedExercise.is_new_exercise === true) return true
  if (rawId.startsWith('new-')) return true
  if (rawId.length > 0 && rawId.length <= 30) return true
  return false
}

function validateNewExerciseStructure(generatedExercise: GeneratedWorkoutExercise) {
  const name = (generatedExercise.name || '').trim()
  if (!name) return 'El ejercicio nuevo debe tener nombre.'

  const muscles = generatedExercise.muscle_groups || []
  if (!Array.isArray(muscles) || muscles.length === 0) {
    return `El ejercicio "${name}" debe incluir al menos un grupo muscular.`
  }

  const equipment = generatedExercise.equipment || []
  if (!Array.isArray(equipment)) {
    return `El ejercicio "${name}" debe tener equipamiento como array.`
  }

  return null
}

function resolveCandidateExercise(generatedExercise: GeneratedWorkoutExercise, candidates: Exercise[]) {
  const rawId = generatedExercise.id?.trim()
  if (rawId && rawId.length > 30) {
    const exactById = candidates.find((exercise) => exercise.id === rawId)
    if (exactById) {
      return exactById
    }
  }

  const normalizedName = normalizeLookupValue(generatedExercise.name)
  if (normalizedName) {
    const exactByName = candidates.find(
      (exercise) => normalizeLookupValue(exercise.name) === normalizedName
    )
    if (exactByName) {
      return exactByName
    }

    const inclusiveByName = candidates.find((exercise) => {
      const candidateName = normalizeLookupValue(exercise.name)
      return candidateName.includes(normalizedName) || normalizedName.includes(candidateName)
    })
    if (inclusiveByName) {
      return inclusiveByName
    }
  }

  return null
}

function enrichGeneratedWorkout(workout: GeneratedWorkout, candidates: Exercise[], prompt: string) {
  const usedSectionNames = new Set<string>()
  const usedExerciseIds = new Set<string>()
  const usedExerciseSlugs = new Set<string>()

  return {
    title: workout.title,
    description: workout.description,
    difficulty: workout.difficulty || 'intermediate',
    sections: (workout.sections || []).map((section, sectionIndex) => ({
      name: sanitizeSectionName(section.name, sectionIndex, prompt, usedSectionNames),
      exercises: (section.exercises || []).map((generatedExercise) => {
        const matchedExercise = resolveCandidateExercise(generatedExercise, candidates)
        const treatAsNew = !matchedExercise && isNewExerciseMarker(generatedExercise)

        if (!matchedExercise && !treatAsNew) {
          throw new Error(
            `No se pudo mapear el ejercicio generado al catalogo. id="${generatedExercise.id || ''}" name="${generatedExercise.name || ''}"`
          )
        }

        if (treatAsNew) {
          const validationError = validateNewExerciseStructure(generatedExercise)
          if (validationError) {
            throw new Error(validationError)
          }

          const rawId = (generatedExercise.id || '').trim()
          const newExerciseSlug = rawId.startsWith('new-')
            ? rawId
            : `new-${normalizeLookupValue(generatedExercise.name || '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}`

          if (usedExerciseSlugs.has(newExerciseSlug)) {
            throw new Error(`Ejercicio duplicado (nuevo): "${generatedExercise.name || newExerciseSlug}"`)
          }
          usedExerciseSlugs.add(newExerciseSlug)

          const normalizedType = normalizeExerciseType(generatedExercise.type, 'reps')

          return {
            id: newExerciseSlug,
            name: (generatedExercise.name || '').trim(),
            sets: clampPositiveNumber(generatedExercise.sets, 3),
            reps: normalizedType === 'reps' ? clampPositiveNumber(generatedExercise.reps, 10) : 0,
            rest: clampPositiveNumber(generatedExercise.rest, 60),
            type: normalizedType,
            duration: normalizedType === 'time' ? clampPositiveNumber(generatedExercise.duration, 30) : 0,
            muscle_groups: generatedExercise.muscle_groups || [],
            equipment: generatedExercise.equipment || [],
            description: (generatedExercise.description || '').trim(),
            difficulty: generatedExercise.difficulty || 'intermediate',
            thumbnail_url: '',
            thumbnail_media_id: undefined as string | undefined,
            tutorial: null,
            is_new_exercise: true as const,
          }
        }

        let finalMatched = matchedExercise as Exercise

        if (usedExerciseIds.has(finalMatched.id)) {
          const alternativeExercise = findAlternativeExercise(finalMatched, usedExerciseIds, candidates)
          if (alternativeExercise) {
            finalMatched = alternativeExercise
          }
        }

        usedExerciseIds.add(finalMatched.id)

        const normalizedType = normalizeExerciseType(generatedExercise.type, 'reps')

        return {
          id: finalMatched.id,
          name: finalMatched.name,
          sets: clampPositiveNumber(generatedExercise.sets, 3),
          reps: normalizedType === 'reps' ? clampPositiveNumber(generatedExercise.reps, 10) : 0,
          rest: clampPositiveNumber(generatedExercise.rest, 60),
          type: normalizedType,
          duration:
            normalizedType === 'time'
              ? clampPositiveNumber(generatedExercise.duration, 30)
              : 0,
          muscle_groups: finalMatched.muscle_group || [],
          equipment: finalMatched.equipment || [],
          description: (generatedExercise.description || finalMatched.description || '').trim(),
          difficulty: finalMatched.difficulty || 'intermediate',
          thumbnail_url: finalMatched.thumbnail?.url || '',
          thumbnail_media_id: finalMatched.thumbnail_media_id,
          tutorial: normalizeTutorial(finalMatched),
          is_new_exercise: false as const,
        }
      }),
    })),
  }
}

export async function generateWorkoutAction(prompt: string, language: string = 'es-ES') {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Debes iniciar sesion para usar el asistente de IA.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('"isPremium"')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  if (!profile?.isPremium) {
    return { success: false, error: 'El asistente de IA esta disponible solo para usuarios premium.' }
  }

  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: 'OpenAI API Key not configured' }
  }

  const normalizedPrompt = normalizeWorkoutRequestPrompt(prompt)
  if (!normalizedPrompt) {
    return { success: false, error: 'Describe el workout que quieres generar.' }
  }

  try {
    const isWorkoutRequest = await classifyWorkoutIntent(normalizedPrompt, language)

    if (!isWorkoutRequest) {
      return { success: false, error: OFF_TOPIC_ERROR }
    }

    const candidateResult = await getCandidateExercises(normalizedPrompt)
    const { candidates } = candidateResult

    const candidateCatalog = buildCandidateCatalog(candidates)
    const catalogCount = candidates.length
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an elite Personal Trainer and Fitness Architect known for creating highly original, bespoke, and signature workout experiences.

## EXERCISE SELECTION STRATEGY (CRITICAL)
1. **PRIORITY 1 — Use the catalog first**: Prefer exercises from the provided catalog whenever they match the user's intent (muscles, equipment, difficulty, movement patterns). Catalog exercises have "id" as a UUID-like string.
2. **PRIORITY 2 — Create new exercises when needed**: If the catalog does not contain enough appropriate exercises for the user's request (e.g., the catalog is small, lacks specific movements, or the user wants something very specific), you MAY invent new exercises.
   - For new exercises, set "id" to a short kebab-case slug prefixed with "new-", for example "new-push-up-lento-con-pausa".
   - Set "is_new_exercise": true for every invented exercise.
   - New exercises MUST include valid "muscle_groups", "equipment", "type", "difficulty" and a clear "description".
   - Do NOT set "is_new_exercise" on catalog exercises.

## ADDITIONAL CONSTRAINTS
- Respect the user's intent, requested duration, difficulty, equipment, and target muscles.
- Avoid obvious or cookie-cutter exercise pairings when a similarly valid alternative exists in the catalog.
- Do not repeat the same exercise (by name or slug) in multiple sections unless the user explicitly asks for that repetition.
- Vary the workout flow so adjacent sections feel different in stimulus and pacing.
- Do not use generic section names such as "Primer", "Tabata central", "Warm Up", "Cool Down", "Finisher", "Block A", or "Block B".

## LANGUAGE INSTRUCTION
- Generate the response in language code "${language}".
- Use natural, modern fitness terminology appropriate for that language.
- Keep the tone energetic, encouraging, and personal.
- Write exercise names, muscle groups and equipment in "${language}".

## WORKOUT DESIGN PHILOSOPHY
1. Avoid generic templates unless they are the best fit for the request.
2. Make sections feel purposeful and well-sequenced.
3. Keep coaching cues concise and actionable.
4. Prefer quality over quantity.
5. Create sections with distinct identities instead of repeating the same structure with different names.
6. Prioritize variety in movement patterns and perceived effort across the session.

## AVAILABLE EXERCISE CATALOG (${catalogCount} exercises)
${JSON.stringify(candidateCatalog)}

## OUTPUT FORMAT (JSON ONLY)
Return a single valid JSON object. Do not include markdown formatting.
{
  "title": "Engaging, motivating title",
  "description": "Professional summary of the session's focus and benefits (max 2 sentences).",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "sections": [
    {
      "name": "Section name",
      "exercises": [
        {
          "id": "catalog exercise id or new-xxx slug",
          "name": "Exercise name",
          "sets": number,
          "reps": number,
          "rest": number,
          "type": "reps" | "time",
          "duration": number,
          "muscle_groups": ["Primary Muscle", "Secondary Muscle"],
          "equipment": ["Required Equipment"],
          "difficulty": "beginner" | "intermediate" | "advanced",
          "description": "A precise, actionable coaching cue (max 20 words).",
          "is_new_exercise": true | false
        }
      ]
    }
  ]
}`
        },
        { role: "user", content: normalizedPrompt }
      ],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('No content generated')
    
    const workout = JSON.parse(content) as GeneratedWorkout
    const enrichedWorkout = enrichGeneratedWorkout(workout, candidates, normalizedPrompt)
    return { success: true, data: enrichedWorkout }
  } catch (error) {
    console.error('AI Generation Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo generar el workout',
    }
  }
}
