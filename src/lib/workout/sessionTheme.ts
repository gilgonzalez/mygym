import type { WorkoutSegmentKind } from './segmentKind'

// Funciones puras de "qué mostrar en cada etapa de la sesión" — extraídas de
// WorkoutExecutionView.tsx (que las definía inline) para que se puedan leer
// y, en teoría, testear sin el componente entero alrededor.
export type SessionStage = 'prepare' | 'rest' | 'exercise-timed' | 'exercise-reps' | 'exercise-emom'

export function getStrokeColor(stage: SessionStage) {
  switch (stage) {
    case 'prepare':
      return '#38bdf8'
    case 'rest':
      return '#f97316'
    case 'exercise-timed':
      return '#22c55e'
    case 'exercise-emom':
      return '#ec4899'
    default:
      return '#8b5cf6'
  }
}

// Copy shown during the rest that follows the very last exercise/round of a section, when
// the section coming next plays by different rules than the one just finished (e.g. handing
// off into the AMRAP circuit). Keyed by the upcoming section's kind so a future mode (EMOM…)
// just needs a new case here.
export function getRestTransitionTheme(upcomingKind: WorkoutSegmentKind, sectionName?: string) {
  if (upcomingKind === 'amrap') {
    return {
      badge: 'Después del descanso',
      badgeClass: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
      headline: 'Se acerca un reto AMRAP',
      subline: sectionName
        ? `${sectionName}: aguanta el ritmo, viene contrarreloj`
        : 'Aguanta el ritmo, viene contrarreloj',
    }
  }

  return {
    badge: 'Después del descanso',
    badgeClass: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
    headline: 'Cambia el formato del entrenamiento',
    subline: sectionName ? `A continuación: ${sectionName}` : 'Prepárate para el nuevo formato',
  }
}

export function getStageTheme(stage: SessionStage) {
  switch (stage) {
    case 'prepare':
      return {
        badge: 'Prepárate',
        badgeClass: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
        headline: 'Prepárate',
        subline: 'Comenzamos en 5 segundos',
      }
    case 'rest':
      return {
        badge: 'Descanso',
        badgeClass: 'border-orange-400/30 bg-orange-400/10 text-orange-300',
        headline: 'Recupera y prepárate',
        subline: 'La siguiente actividad ya está lista',
      }
    case 'exercise-timed':
      return {
        badge: 'Actividad',
        badgeClass: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
        headline: 'Mantén el ritmo',
        subline: 'Sigue el temporizador y controla la técnica',
      }
    case 'exercise-emom':
      return {
        badge: 'EMOM',
        badgeClass: 'border-pink-400/30 bg-pink-400/10 text-pink-300',
        // No mention of "descanso" here on purpose — there's no separate rest stage for
        // EMOM, whatever's left of the window after the reps are done just plays out on
        // this same clock.
        headline: 'Completa las repeticiones a tiempo',
        subline: 'Mantén el ritmo hasta que se acabe el tiempo asignado',
      }
    case 'exercise-reps':
      return {
        badge: 'Actividad',
        badgeClass: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
        headline: 'Completa la serie',
        subline: 'Marca la serie cuando termines',
      }
    default:
      return {
        badge: 'Actividad',
        badgeClass: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
        headline: 'Completa la serie',
        subline: 'Marca la serie cuando termines',
      }
  }
}
