import { BatteryWarning, Frown, Meh, Smile, Zap } from 'lucide-react'

export const FEELING_CONFIG = {
  tired: { 
    value: 'tired',
    icon: BatteryWarning, 
    label: 'Tired', 
    color: 'text-red-500', 
    bg: 'bg-red-500/10', 
    border: 'border-red-500/20' 
  },
  sad: { 
    value: 'sad',
    icon: Frown, 
    label: 'Bad', 
    color: 'text-orange-500', 
    bg: 'bg-orange-500/10', 
    border: 'border-orange-500/20' 
  },
  normal: { 
    value: 'normal',
    icon: Meh, 
    label: 'Okay', 
    color: 'text-yellow-500', 
    bg: 'bg-yellow-500/10', 
    border: 'border-yellow-500/20' 
  },
  happy: { 
    value: 'happy',
    icon: Smile, 
    label: 'Good', 
    color: 'text-green-500', 
    bg: 'bg-green-500/10', 
    border: 'border-green-500/20' 
  },
  pumped: { 
    value: 'pumped',
    icon: Zap, 
    label: 'Pumped', 
    color: 'text-blue-500', 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/20' 
  },
} as const

export type FeelingType = keyof typeof FEELING_CONFIG