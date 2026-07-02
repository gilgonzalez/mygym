import { LocalExercise, LocalSection, LocalWorkout } from '@/types/workout/viewTypes'

export interface WorkoutCursor {
  sectionIndex: number
  exerciseIndex: number
  set: number
}

export interface WorkoutStepInfo extends WorkoutCursor {
  section: LocalSection
  exercise: LocalExercise
}

function getSection(workout: LocalWorkout, sectionIndex: number) {
  return workout.sections[sectionIndex]
}

function getMaxSets(section: LocalSection) {
  if (section.exercises.length === 0) return 1
  return Math.max(...section.exercises.map((exercise) => exercise.sets || 1), 1)
}

export function getStepInfo(workout: LocalWorkout, cursor: WorkoutCursor): WorkoutStepInfo | null {
  const section = getSection(workout, cursor.sectionIndex)
  const exercise = section?.exercises[cursor.exerciseIndex]

  if (!section || !exercise) {
    return null
  }

  return {
    ...cursor,
    section,
    exercise,
  }
}

function getFirstCursorFromSection(workout: LocalWorkout, fromSectionIndex: number): WorkoutCursor | null {
  for (let sectionIndex = fromSectionIndex; sectionIndex < workout.sections.length; sectionIndex += 1) {
    const section = workout.sections[sectionIndex]
    if (section.exercises.length > 0) {
      return {
        sectionIndex,
        exerciseIndex: 0,
        set: 1,
      }
    }
  }

  return null
}

function getLastCursorInSection(section: LocalSection, sectionIndex: number): WorkoutCursor | null {
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
      return {
        sectionIndex,
        exerciseIndex,
        set: maxSets,
      }
    }
  }

  return null
}

function getLastCursorBeforeSection(workout: LocalWorkout, fromSectionIndex: number): WorkoutCursor | null {
  for (let sectionIndex = fromSectionIndex; sectionIndex >= 0; sectionIndex -= 1) {
    const section = workout.sections[sectionIndex]
    const cursor = getLastCursorInSection(section, sectionIndex)

    if (cursor) {
      return cursor
    }
  }

  return null
}

export function getNextWorkoutCursor(workout: LocalWorkout, cursor: WorkoutCursor): WorkoutCursor | null {
  const stepInfo = getStepInfo(workout, cursor)

  if (!stepInfo) {
    return null
  }

  const { section, exercise, sectionIndex, exerciseIndex, set } = stepInfo
  const totalSets = exercise.sets || 1
  const orderType = section.orderType || 'single'

  if (orderType === 'single') {
    if (set < totalSets) {
      return {
        sectionIndex,
        exerciseIndex,
        set: set + 1,
      }
    }

    if (exerciseIndex < section.exercises.length - 1) {
      return {
        sectionIndex,
        exerciseIndex: exerciseIndex + 1,
        set: 1,
      }
    }

    return getFirstCursorFromSection(workout, sectionIndex + 1)
  }

  for (let nextExerciseIndex = exerciseIndex + 1; nextExerciseIndex < section.exercises.length; nextExerciseIndex += 1) {
    if (set <= (section.exercises[nextExerciseIndex].sets || 1)) {
      return {
        sectionIndex,
        exerciseIndex: nextExerciseIndex,
        set,
      }
    }
  }

  const nextSet = set + 1
  for (let nextExerciseIndex = 0; nextExerciseIndex < section.exercises.length; nextExerciseIndex += 1) {
    if (nextSet <= (section.exercises[nextExerciseIndex].sets || 1)) {
      return {
        sectionIndex,
        exerciseIndex: nextExerciseIndex,
        set: nextSet,
      }
    }
  }

  return getFirstCursorFromSection(workout, sectionIndex + 1)
}

export function getPreviousWorkoutCursor(workout: LocalWorkout, cursor: WorkoutCursor): WorkoutCursor | null {
  const stepInfo = getStepInfo(workout, cursor)

  if (!stepInfo) {
    return null
  }

  const { section, sectionIndex, exerciseIndex, set } = stepInfo
  const orderType = section.orderType || 'single'

  if (orderType === 'single') {
    if (set > 1) {
      return {
        sectionIndex,
        exerciseIndex,
        set: set - 1,
      }
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
      return {
        sectionIndex,
        exerciseIndex: previousExerciseIndex,
        set,
      }
    }
  }

  const previousSet = set - 1
  if (previousSet >= 1) {
    for (let previousExerciseIndex = section.exercises.length - 1; previousExerciseIndex >= 0; previousExerciseIndex -= 1) {
      if (previousSet <= (section.exercises[previousExerciseIndex].sets || 1)) {
        return {
          sectionIndex,
          exerciseIndex: previousExerciseIndex,
          set: previousSet,
        }
      }
    }
  }

  return getLastCursorBeforeSection(workout, sectionIndex - 1)
}
