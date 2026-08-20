import { getDifficultyColor, getDifficultyLabel } from '@mygym/shared'

import { Badge } from '@/components/ui'

// Antes vivía inline en WorkoutCard — se necesita igual en el resumen del
// workout (WorkoutOverview) y en el editor, así que ahora es su propio
// componente.
export function DifficultyBadge({ difficulty }: { difficulty: string | null }) {
  return <Badge label={getDifficultyLabel(difficulty)} color={getDifficultyColor(difficulty)} />
}
