// Helpers puros para mostrar workouts, compartidos entre apps/web y
// apps/mobile. Portados de src/lib/time.ts y src/lib/workout-utils.ts
// (apps/web) — misma lógica, sin nada específico de DOM/React Native para
// poder importarse desde cualquiera de las dos apps.

export function formatCount(count: number): string | number {
  return count > 99 ? '+99' : count
}

export const DIFFICULTY_VALUES = ['beginner', 'intermediate', 'advanced'] as const
export type Difficulty = (typeof DIFFICULTY_VALUES)[number]

// En vez de clases de Tailwind (como en la web), acá exponemos un color hex
// crudo: en React Native no hay className, cada pantalla lo usa en su propio
// StyleSheet.
export function getDifficultyColor(difficulty: string | null): string {
  switch (difficulty) {
    case 'beginner':
      return '#10b981' // emerald-500
    case 'intermediate':
      return '#f59e0b' // amber-500
    case 'advanced':
      return '#f43f5e' // rose-500
    default:
      return '#6b7280' // muted-foreground gris
  }
}

export function getDifficultyLabel(difficulty: string | null): string {
  switch (difficulty) {
    case 'beginner':
      return 'Principiante'
    case 'intermediate':
      return 'Intermedio'
    case 'advanced':
      return 'Avanzado'
    default:
      return 'General'
  }
}

export type TimeAgoStyle = 'compact' | 'verbose'

interface TimeAgoOptions {
  style?: TimeAgoStyle
}

// Antes había dos versiones de esta misma cascada segundo/minuto/hora/día/
// mes/año escritas por separado (una compacta, "hace 5m", y otra más
// verbosa, "Hace 5 min") — el estilo es la única diferencia real, así que
// ahora es un parámetro en vez de dos funciones.
export function timeAgo(dateString: string | null | undefined, options: TimeAgoOptions = {}): string {
  const { style = 'compact' } = options

  if (!dateString) return style === 'verbose' ? 'Reciente' : 'ahora mismo'

  const date = new Date(dateString)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (style === 'verbose') {
    if (seconds < 60) return 'Hace un momento'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `Hace ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Hace ${hours} h`
    const days = Math.floor(hours / 24)
    if (days < 30) return `Hace ${days} d`
    const months = Math.floor(days / 30)
    if (months < 12) return `Hace ${months} mes${months === 1 ? '' : 'es'}`
    const years = Math.floor(months / 12)
    return `Hace ${years} ano${years === 1 ? '' : 's'}`
  }

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

type DurationFormatStyle = 'human' | 'clock'

interface FormatDurationOptions {
  style?: DurationFormatStyle
}

function normalizeDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  return { hours, minutes, seconds, totalSeconds: safeSeconds }
}

export const visibilityLabelMap = {
  draft: 'Borrador',
  private: 'Privado',
  followers: 'Solo seguidores',
  public: 'Publico',
} as const

export type WorkoutVisibility = keyof typeof visibilityLabelMap

export function formatDuration(totalSeconds: number, options: FormatDurationOptions = {}) {
  const { style = 'human' } = options
  const normalized = normalizeDuration(totalSeconds)
  const { hours, minutes, seconds } = normalized

  if (style === 'clock') {
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    const totalMinutes = Math.floor(normalized.totalSeconds / 60)
    return `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const parts: string[] = []

  if (hours > 0) parts.push(`${hours} h`)
  if (minutes > 0) parts.push(`${minutes} min`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} s`)

  return parts.join(' ')
}

export function formatDurationFromMinutes(totalMinutes: number, options: FormatDurationOptions = {}) {
  return formatDuration(totalMinutes * 60, options)
}
