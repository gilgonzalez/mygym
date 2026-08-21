import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Antes cada pantalla/diálogo maquetaba a mano su propio "no hay nada acá"
// (icono + título + descripción, a veces con una acción abajo) — mismo
// layout, código distinto cada vez. Dos variantes de icono: en un círculo
// con fondo tintado (el default) o "bare" (icono opaco sin círculo, como
// usaba el EmptyState local de WorkoutCommentsSheet.tsx).
interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  tone?: 'muted' | 'destructive'
  bare?: boolean
  compact?: boolean
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = 'muted',
  bare = false,
  compact = false,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground',
        compact ? 'py-6' : 'py-12',
        className
      )}
    >
      {bare ? (
        <Icon className={cn('opacity-20', compact ? 'h-10 w-10' : 'h-12 w-12')} />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full p-4',
            tone === 'destructive' ? 'bg-destructive/10' : 'bg-muted/50'
          )}
        >
          <Icon className={cn(tone === 'destructive' ? 'text-destructive' : 'opacity-50', 'h-8 w-8')} />
        </div>
      )}

      <div className="space-y-1">
        <p className={cn('font-semibold text-foreground', compact ? 'text-sm' : 'text-base')}>{title}</p>
        {description && (
          <p className={cn(compact ? 'text-[11px]' : 'text-sm')}>{description}</p>
        )}
      </div>

      {action}
    </div>
  )
}
