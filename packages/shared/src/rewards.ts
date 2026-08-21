import type { Difficulty } from './workout'
import { StatType, TAG_STATS_WEIGHTS } from './tag-stats'
import type { WorkoutTag } from './workout-tags'

// Antes había dos fórmulas de XP que no coincidían: una plana (solo minutos,
// sin dificultad) usada para mostrar/otorgar XP, y otra ponderada por
// dificultad usada solo al guardar el workout (persistida en
// workouts.exp_earned). Esta es la única fórmula ahora — se usa tanto para
// calcular el exp_earned "de catálogo" de un workout (con su estimated_time)
// como para el XP que se otorga al completar una sesión real (con el tiempo
// efectivamente transcurrido), así lo mostrado y lo otorgado son siempre
// consistentes entre sí.
const DIFFICULTY_XP_MULTIPLIER: Record<Difficulty, number> = {
  beginner: 1,
  intermediate: 1.5,
  advanced: 2,
}

export function calcWorkoutXP(durationSeconds: number, difficulty?: Difficulty | string | null): number {
  const multiplier = DIFFICULTY_XP_MULTIPLIER[difficulty as Difficulty] ?? 1
  const minutes = Math.max(0, durationSeconds / 60)
  return Math.round(minutes * 10 * multiplier)
}

// Reparte expEarned entre los stats RPG del workout según sus tags (ver
// TAG_STATS_WEIGHTS en ./tag-stats). Si no hay tags con peso, reparte parejo
// entre los 5 stats en vez de dejar todo en cero.
export function computeWorkoutStats(
  tags: readonly string[] | null | undefined,
  expEarned: number
): Partial<Record<StatType, number>> {
  const rawStats: Record<StatType, number> = { strength: 0, cardio: 0, flexibility: 0, agility: 0, mind: 0 }
  let totalWeight = 0

  for (const tag of tags ?? []) {
    const weights = TAG_STATS_WEIGHTS[tag as WorkoutTag]
    if (!weights) continue
    for (const [stat, weight] of Object.entries(weights) as [StatType, number][]) {
      rawStats[stat] += weight
      totalWeight += weight
    }
  }

  if (totalWeight === 0) {
    rawStats.strength = 1
    rawStats.cardio = 1
    rawStats.flexibility = 1
    rawStats.agility = 1
    rawStats.mind = 1
    totalWeight = 5
  }

  const finalStats: Partial<Record<StatType, number>> = {}
  for (const [stat, weight] of Object.entries(rawStats) as [StatType, number][]) {
    if (weight > 0) finalStats[stat] = Math.round((weight / totalWeight) * expEarned)
  }
  return finalStats
}
