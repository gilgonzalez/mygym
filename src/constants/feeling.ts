import { BatteryWarning, Frown, Meh, Smile, Zap } from 'lucide-react'
import { FEELING_LABELS, type FeelingType } from '@mygym/shared'

export type { FeelingType }

// Ícono + clases de Tailwind son específicos de la web (mobile tiene su
// propio ícono de lucide-react-native + hex, ver
// apps/mobile/src/components/workout/CommentCard.tsx) — los labels sí son
// compartidos, vienen de @mygym/shared para no desincronizarse con mobile.
const FEELING_STYLE: Record<FeelingType, { icon: typeof BatteryWarning; color: string; bg: string; border: string }> = {
  tired: { icon: BatteryWarning, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  sad: { icon: Frown, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  normal: { icon: Meh, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  happy: { icon: Smile, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  pumped: { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
}

export const FEELING_CONFIG = Object.fromEntries(
  (Object.keys(FEELING_STYLE) as FeelingType[]).map((key) => [
    key,
    { value: key, label: FEELING_LABELS[key], ...FEELING_STYLE[key] },
  ])
) as Record<FeelingType, { value: FeelingType; label: string } & (typeof FEELING_STYLE)[FeelingType]>
