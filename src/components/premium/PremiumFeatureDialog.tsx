'use client'

import { Lock } from 'lucide-react'
import { Button } from '@/components/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PremiumFeatureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description: string
  confirmLabel?: string
}

export function PremiumFeatureDialog({
  open,
  onOpenChange,
  title = 'Funcionalidad premium',
  description,
  confirmLabel = 'Entendido',
}: PremiumFeatureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-[28px] border border-border/60 bg-background p-0">
        <div className="border-b border-border/60 bg-gradient-to-br from-amber-500/10 via-background to-background p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Lock className="h-5 w-5" />
          </div>
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="p-6 pt-4 sm:justify-end">
          <Button type="button" onClick={() => onOpenChange(false)}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
