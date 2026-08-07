export function formatCount(count: number): string | number {
  return count > 99 ? '+99' : count
}

export function calcWorkoutXP(durationSecondsOrMinutes: number, fromSeconds = true): number {
  const durationMinutes = fromSeconds
    ? Math.max(1, Math.ceil(durationSecondsOrMinutes / 60))
    : Math.max(1, Math.ceil(durationSecondsOrMinutes))
  return Math.ceil(durationMinutes * 5) + 50
}

export function getDifficultyColor(difficulty: string): string {
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

export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'ahora mismo'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `hace ${months}mes`
  return `hace ${Math.floor(months / 12)}a`
}

export const visibilityLabelMap = {
  draft: 'Borrador',
  private: 'Privado',
  followers: 'Solo seguidores',
  public: 'Publico',
} as const
