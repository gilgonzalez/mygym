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
