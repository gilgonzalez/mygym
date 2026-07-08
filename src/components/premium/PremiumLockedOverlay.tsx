'use client'

import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PremiumLockedOverlayProps {
  className?: string
  children: ReactNode
  onUnlockClick: () => void
  title?: string
  description?: string
}

export function PremiumLockedOverlay({
  className,
  children,
  onUnlockClick,
  title = 'Disponible en premium',
  description = 'Pulsa para descubrir como desbloquear esta funcionalidad.',
}: PremiumLockedOverlayProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      <div className="pointer-events-none select-none opacity-55 blur-[1.5px]">{children}</div>

      <button
        type="button"
        onClick={onUnlockClick}
        className="absolute inset-0 flex items-center justify-center bg-background/38 p-4 text-left backdrop-blur-[2px]"
      >
        <div className="max-w-sm rounded-3xl border border-amber-500/25 bg-background/90 px-5 py-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}
