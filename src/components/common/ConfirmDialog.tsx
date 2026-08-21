'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// Antes este diálogo (glass card + ícono + fila de contexto opcional) vivía
// solo dentro de ProfileSocialSheet.tsx, maquetado a mano para sus 4 acciones
// de aceptar/rechazar/eliminar seguidor. Es el mismo look que necesita
// cualquier confirmación destructiva del resto de la app (ej. borrar un
// workout, ver useWorkoutCardActions.ts) — antes esos casos usaban
// window.confirm() en vez de esto.
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  icon?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmButtonClassName?: string
  onConfirm: () => void
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmButtonClassName,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.10),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_28%),linear-gradient(180deg,rgba(12,16,30,0.98),rgba(8,11,22,0.96))] p-0 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
      >
        <div className="p-5">
          <DialogHeader className="items-center text-center">
            {icon && (
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
                {icon}
              </div>
            )}
            <DialogTitle className="text-lg font-black tracking-tight text-foreground">{title}</DialogTitle>
            {description && (
              <DialogDescription className="mt-1 text-sm leading-relaxed text-white/60">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>

          {children}

          <DialogFooter className="mt-5 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-2xl border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06] hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              className={cn(
                'h-10 rounded-2xl',
                confirmButtonClassName || 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
