// El algoritmo de navegación (circuito o secuencial según section.orderType)
// vive en @mygym/shared, compartido con apps/mobile — ver
// packages/shared/src/workout/sessionNavigation.ts. Este archivo es un
// adaptador fino sobre los tipos concretos de la web (LocalWorkout) para no
// tener que tocar los imports existentes (WorkoutExecutionView.tsx,
// ActiveSession.tsx, workOutStore.ts, app/workout/[id]/page.tsx).
import {
  getFirstCursorFromSection as getFirstCursorFromSectionShared,
  getNextSessionCursor,
  getPreviousSessionCursor,
  getSessionStepInfo,
  type SessionCursor,
  type SessionStepInfo,
} from '@mygym/shared'
import { LocalSection, LocalWorkout } from '@/types/workout/viewTypes'

export type WorkoutCursor = SessionCursor
export type WorkoutStepInfo = SessionStepInfo<LocalSection>

export function getStepInfo(workout: LocalWorkout, cursor: WorkoutCursor): WorkoutStepInfo | null {
  return getSessionStepInfo(workout, cursor)
}

export function getFirstCursorFromSection(workout: LocalWorkout, fromSectionIndex: number): WorkoutCursor | null {
  return getFirstCursorFromSectionShared(workout, fromSectionIndex)
}

export function getNextWorkoutCursor(workout: LocalWorkout, cursor: WorkoutCursor): WorkoutCursor | null {
  return getNextSessionCursor(workout, cursor)
}

export function getPreviousWorkoutCursor(workout: LocalWorkout, cursor: WorkoutCursor): WorkoutCursor | null {
  return getPreviousSessionCursor(workout, cursor)
}
