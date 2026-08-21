// Algoritmo de navegación de una sesión de workout (avanzar/retroceder entre
// sección → ejercicio → serie). Antes vivía duplicado: una versión completa
// en apps/web (src/lib/workout/sessionNavigation.ts) que sí respetaba
// section.orderType, y un puerto manual en
// apps/mobile/src/components/workout/ExecutionView.tsx que ignoraba
// orderType y siempre recorría en modo "circuito" (decisión: alinear mobile
// al comportamiento de la web, no al revés — ver conversación de la tarea de
// limpieza de código).
//
// Tipado estructural mínimo (no importamos LocalWorkout ni WorkoutDetail acá
// — packages/shared no puede depender de ningún tipo específico de una app)
// para que cada app siga usando sus propios tipos concretos de workout.
export interface SessionCursor {
  sectionIndex: number
  exerciseIndex: number
  set: number
}

export interface SessionExerciseLike {
  sets?: number | null
}

export interface SessionSectionLike<E extends SessionExerciseLike = SessionExerciseLike> {
  orderType?: 'linear' | 'single' | null
  exercises: readonly E[]
}

export interface SessionWorkoutLike<S extends SessionSectionLike = SessionSectionLike> {
  sections: readonly S[]
}

export interface SessionStepInfo<S extends SessionSectionLike> extends SessionCursor {
  section: S
  exercise: S['exercises'][number]
}

function getMaxSets(section: SessionSectionLike): number {
  if (section.exercises.length === 0) return 1
  return Math.max(...section.exercises.map((exercise) => exercise.sets || 1), 1)
}

export function getSessionStepInfo<S extends SessionSectionLike>(
  workout: SessionWorkoutLike<S>,
  cursor: SessionCursor
): SessionStepInfo<S> | null {
  const section = workout.sections[cursor.sectionIndex]
  const exercise = section?.exercises[cursor.exerciseIndex]

  if (!section || !exercise) {
    return null
  }

  return { ...cursor, section, exercise }
}

export function getFirstCursorFromSection<S extends SessionSectionLike>(
  workout: SessionWorkoutLike<S>,
  fromSectionIndex: number
): SessionCursor | null {
  for (let sectionIndex = fromSectionIndex; sectionIndex < workout.sections.length; sectionIndex += 1) {
    const section = workout.sections[sectionIndex]
    if (section.exercises.length > 0) {
      return { sectionIndex, exerciseIndex: 0, set: 1 }
    }
  }

  return null
}

function getLastCursorInSection(section: SessionSectionLike, sectionIndex: number): SessionCursor | null {
  if (section.exercises.length === 0) {
    return null
  }

  if ((section.orderType || 'single') === 'single') {
    const exerciseIndex = section.exercises.length - 1
    return {
      sectionIndex,
      exerciseIndex,
      set: section.exercises[exerciseIndex].sets || 1,
    }
  }

  const maxSets = getMaxSets(section)

  for (let exerciseIndex = section.exercises.length - 1; exerciseIndex >= 0; exerciseIndex -= 1) {
    if ((section.exercises[exerciseIndex].sets || 1) >= maxSets) {
      return { sectionIndex, exerciseIndex, set: maxSets }
    }
  }

  return null
}

function getLastCursorBeforeSection<S extends SessionSectionLike>(
  workout: SessionWorkoutLike<S>,
  fromSectionIndex: number
): SessionCursor | null {
  for (let sectionIndex = fromSectionIndex; sectionIndex >= 0; sectionIndex -= 1) {
    const section = workout.sections[sectionIndex]
    const cursor = getLastCursorInSection(section, sectionIndex)

    if (cursor) {
      return cursor
    }
  }

  return null
}

export function getNextSessionCursor<S extends SessionSectionLike>(
  workout: SessionWorkoutLike<S>,
  cursor: SessionCursor
): SessionCursor | null {
  const stepInfo = getSessionStepInfo(workout, cursor)

  if (!stepInfo) {
    return null
  }

  const { section, exercise, sectionIndex, exerciseIndex, set } = stepInfo
  const totalSets = exercise.sets || 1
  const orderType = section.orderType || 'single'

  if (orderType === 'single') {
    if (set < totalSets) {
      return { sectionIndex, exerciseIndex, set: set + 1 }
    }

    if (exerciseIndex < section.exercises.length - 1) {
      return { sectionIndex, exerciseIndex: exerciseIndex + 1, set: 1 }
    }

    return getFirstCursorFromSection(workout, sectionIndex + 1)
  }

  for (let nextExerciseIndex = exerciseIndex + 1; nextExerciseIndex < section.exercises.length; nextExerciseIndex += 1) {
    if (set <= (section.exercises[nextExerciseIndex].sets || 1)) {
      return { sectionIndex, exerciseIndex: nextExerciseIndex, set }
    }
  }

  const nextSet = set + 1
  for (let nextExerciseIndex = 0; nextExerciseIndex < section.exercises.length; nextExerciseIndex += 1) {
    if (nextSet <= (section.exercises[nextExerciseIndex].sets || 1)) {
      return { sectionIndex, exerciseIndex: nextExerciseIndex, set: nextSet }
    }
  }

  return getFirstCursorFromSection(workout, sectionIndex + 1)
}

export function getPreviousSessionCursor<S extends SessionSectionLike>(
  workout: SessionWorkoutLike<S>,
  cursor: SessionCursor
): SessionCursor | null {
  const stepInfo = getSessionStepInfo(workout, cursor)

  if (!stepInfo) {
    return null
  }

  const { section, sectionIndex, exerciseIndex, set } = stepInfo
  const orderType = section.orderType || 'single'

  if (orderType === 'single') {
    if (set > 1) {
      return { sectionIndex, exerciseIndex, set: set - 1 }
    }

    if (exerciseIndex > 0) {
      const previousExerciseIndex = exerciseIndex - 1
      return {
        sectionIndex,
        exerciseIndex: previousExerciseIndex,
        set: section.exercises[previousExerciseIndex].sets || 1,
      }
    }

    return getLastCursorBeforeSection(workout, sectionIndex - 1)
  }

  for (let previousExerciseIndex = exerciseIndex - 1; previousExerciseIndex >= 0; previousExerciseIndex -= 1) {
    if (set <= (section.exercises[previousExerciseIndex].sets || 1)) {
      return { sectionIndex, exerciseIndex: previousExerciseIndex, set }
    }
  }

  const previousSet = set - 1
  if (previousSet >= 1) {
    for (let previousExerciseIndex = section.exercises.length - 1; previousExerciseIndex >= 0; previousExerciseIndex -= 1) {
      if (previousSet <= (section.exercises[previousExerciseIndex].sets || 1)) {
        return { sectionIndex, exerciseIndex: previousExerciseIndex, set: previousSet }
      }
    }
  }

  return getLastCursorBeforeSection(workout, sectionIndex - 1)
}

// Posición (1-based) del cursor dentro del orden real de ejecución de SU
// sección, y el total de posiciones que tiene esa sección — para el chip
// "Ronda X/Y" de apps/mobile. Cuenta pasando por getNextSessionCursor en vez
// de tener su propio criterio de orden, así el número siempre coincide con
// el recorrido real (circuito o secuencial según orderType).
export function getSectionPositionInfo<S extends SessionSectionLike>(
  workout: SessionWorkoutLike<S>,
  cursor: SessionCursor
): { current: number; total: number } {
  const section = workout.sections[cursor.sectionIndex]
  if (!section || section.exercises.length === 0) {
    return { current: 1, total: 1 }
  }

  const positions: SessionCursor[] = []
  let walking: SessionCursor | null = { sectionIndex: cursor.sectionIndex, exerciseIndex: 0, set: 1 }

  while (walking && walking.sectionIndex === cursor.sectionIndex) {
    positions.push(walking)
    const next: SessionCursor | null = getNextSessionCursor(workout, walking)
    walking = next && next.sectionIndex === cursor.sectionIndex ? next : null
  }

  const currentIndex = positions.findIndex(
    (position) => position.exerciseIndex === cursor.exerciseIndex && position.set === cursor.set
  )

  return { current: currentIndex === -1 ? 1 : currentIndex + 1, total: positions.length || 1 }
}
