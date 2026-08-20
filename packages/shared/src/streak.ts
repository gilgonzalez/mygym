// Racha "efectiva" a nivel de lectura — ver la nota en la migración
// 20260820_0001_extend_user_profile.sql (supabase/migrations): la escritura
// de streak_current/streak_longest ya es atómica y correcta, la hace
// complete_workout_session() en cada workout completado. Lo que falta es la
// lectura: streak_current queda "congelado" si el usuario deja de entrenar
// (recién se corrige la próxima vez que loguea un workout), así que un
// perfil podría mostrar "racha de 12 días" cuando en realidad hace una
// semana que no entrena. Esta función deriva el valor real sin tocar la
// fila ni necesitar un cron/trigger que la "rompa" a medianoche.
export type StreakStatus = 'active_today' | 'at_risk' | 'broken' | 'none'

export interface StreakInfo {
  // Racha real a día de hoy — 0 si last_activity_date quedó demasiado atrás,
  // sin importar lo que diga streak_current en la fila.
  current: number
  status: StreakStatus
}

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function computeEffectiveStreak(lastActivityDate: string | null, streakCurrent: number): StreakInfo {
  if (!lastActivityDate || streakCurrent <= 0) {
    return { current: 0, status: 'none' }
  }

  const today = startOfDay(new Date())
  const last = startOfDay(new Date(lastActivityDate))
  const diffDays = Math.round((today.getTime() - last.getTime()) / 86_400_000)

  // Ya entrenó hoy: la racha sigue como está.
  if (diffDays <= 0) return { current: streakCurrent, status: 'active_today' }
  // Todavía no entrenó hoy pero sí ayer: la racha sigue viva, en riesgo de
  // romperse si no entrena antes de medianoche.
  if (diffDays === 1) return { current: streakCurrent, status: 'at_risk' }
  // Pasó más de un día sin actividad: se rompió, aunque la fila diga otra
  // cosa hasta el próximo workout.
  return { current: 0, status: 'broken' }
}
