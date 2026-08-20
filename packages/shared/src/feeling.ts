// Mismo config que src/constants/feeling.ts (apps/web), sin los componentes
// de ícono (lucide-react allá, lucide-react-native acá — cada app mapea la
// key al ícono de su propio paquete). Usado en el detalle de una serie del
// log de un workout ("¿cómo te sentiste?") y en los comentarios/reseñas.
export const FEELING_LEVELS = {
  tired: 1,
  sad: 2,
  normal: 3,
  happy: 4,
  pumped: 5,
} as const

export const FEELING_LABELS: Record<FeelingType, string> = {
  tired: 'Cansado',
  sad: 'Mal',
  normal: 'Normal',
  happy: 'Bien',
  pumped: 'Con Energía',
}

// Hex directo en vez de clases de Tailwind — mismo criterio que
// getDifficultyColor en workout.ts.
export const FEELING_COLORS: Record<FeelingType, string> = {
  tired: '#ef4444',
  sad: '#f97316',
  normal: '#eab308',
  happy: '#22c55e',
  pumped: '#3b82f6',
}

export type FeelingType = keyof typeof FEELING_LEVELS
