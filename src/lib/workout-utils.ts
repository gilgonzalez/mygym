// formatCount, timeAgo, visibilityLabelMap y calcWorkoutXP viven en
// @mygym/shared (compartidos con apps/mobile) — importalos de ahí. Lo único
// que se queda acá es getDifficultyColor: en la web devuelve clases de
// Tailwind (className), que no tiene sentido en @mygym/shared porque no
// puede depender de ningún framework de UI (mobile usa su propia versión que
// devuelve hex, en el mismo paquete).
export function getDifficultyColor(difficulty: string | null): string {
  switch (difficulty) {
    case 'beginner':
      return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    case 'intermediate':
      return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    case 'advanced':
      return 'text-rose-500 bg-rose-500/10 border-rose-500/20'
    default:
      return 'text-muted-foreground bg-muted border-muted-foreground/20'
  }
}
