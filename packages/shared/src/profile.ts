// Catálogo de metas fitness para el selector del perfil (mobile:
// components/profile/EditProfileScreen — ver app/edit-profile.tsx) — mismo
// criterio que WORKOUT_TAGS (workout-tags.ts): lista fija compartida en vez
// de que cada app arme la suya, para que "metas" sea filtrable/consistente
// en vez de texto libre. "Metas" y "objetivos" se unificaron en un solo
// campo (goals en la tabla users): son el mismo concepto en la práctica y
// tener dos campos casi idénticos solo iba a generar confusión sobre cuál
// llenar.
export const FITNESS_GOALS = [
  'Perder peso',
  'Ganar músculo',
  'Aumentar fuerza',
  'Mejorar resistencia',
  'Mejorar flexibilidad',
  'Rendimiento deportivo',
  'Salud general',
  'Reducir estrés',
  'Mejorar postura',
  'Recuperación de lesión',
] as const

export type FitnessGoal = (typeof FITNESS_GOALS)[number]

// Edad a partir de la fecha de nacimiento (YYYY-MM-DD) — null si no hay
// fecha cargada. Resta un año si todavía no pasó el cumpleaños este año.
export function calculateAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null

  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())

  if (!hasHadBirthdayThisYear) age -= 1

  return age
}
