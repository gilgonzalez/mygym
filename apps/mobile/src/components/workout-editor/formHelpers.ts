import type { ExerciseEditorInput, SectionEditorInput, VaultExercise } from '@/lib/workoutEditor'

// Helpers puros del editor de workout en mobile — mismo criterio que
// create/formHelpers.ts en la web (funciones sin estado, separadas de los
// componentes que las usan).

let idCounter = 0

// Ids solo para el `key` de las listas en React/DraggableFlatList — nunca se
// mandan al RPC como `id` real de una fila (eso lo decide `linkId`/`id` en
// ExerciseEditorInput, que quedan undefined hasta que el ejercicio/sección
// se persiste). Igual que ex-${Date.now()}-... en la web.
export function generateLocalId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now()}-${idCounter}`
}

export function createEmptyExercise(): ExerciseEditorInput {
  return {
    key: generateLocalId('exercise'),
    name: '',
    description: '',
    difficulty: 'beginner',
    muscleGroups: [],
    equipment: [],
    thumbnailUrl: null,
    thumbnailMediaId: null,
    thumbnailMimeType: null,
    type: 'reps',
    sets: 3,
    reps: 10,
    rest: 60,
    duration: 0,
    weightKg: null,
  }
}

export function createExerciseFromVault(exercise: VaultExercise): ExerciseEditorInput {
  return {
    key: generateLocalId('exercise'),
    id: exercise.id,
    name: exercise.name,
    description: exercise.description || '',
    difficulty: exercise.difficulty || 'beginner',
    muscleGroups: exercise.muscleGroups,
    equipment: exercise.equipment,
    thumbnailUrl: exercise.thumbnailUrl,
    thumbnailMediaId: null,
    // Los ejercicios del vault hoy solo guardan imágenes fijas (no hay
    // captura de GIF ahí todavía), así que esto siempre arranca en null —
    // isVideoThumbnail cae al chequeo por extensión igual si hiciera falta.
    thumbnailMimeType: null,
    type: 'reps',
    sets: 3,
    reps: 10,
    rest: 60,
    duration: 0,
    weightKg: null,
  }
}

export function createEmptySection(): SectionEditorInput {
  return {
    key: generateLocalId('section'),
    name: '',
    orderType: 'single',
    exercises: [],
  }
}
