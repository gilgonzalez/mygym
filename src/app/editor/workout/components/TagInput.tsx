'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Extraído de create/page.tsx (ver ese archivo para el porqué de la
// separación). Input de texto libre + Enter/botón "+" que arma una lista de
// tags como Badges removibles — no confundir con WorkoutTagSelector (ese
// elige de un catálogo fijo, este acepta cualquier texto).
interface TagInputProps {
  value?: string[]
  onChange: (val: string[]) => void
  placeholder?: string
  icon?: React.ReactNode
  variant?: 'default' | 'orange' | 'blue'
  compact?: boolean
  disabled?: boolean
}

export function TagInput({
  value = [],
  onChange,
  placeholder,
  icon,
  variant = 'default',
  compact = false,
  disabled = false,
}: TagInputProps) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    if (input.trim()) {
      onChange([...value, input.trim()])
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const bgClass =
    variant === 'orange'
      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600'
      : variant === 'blue'
        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
        : 'bg-muted/50 text-foreground'

  return (
    <div className="space-y-2">
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50">{icon}</div>}
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'border-transparent focus:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 transition-all',
            compact ? 'h-8 text-xs' : 'h-9 text-sm',
            bgClass,
            icon ? 'pl-9 pr-9' : 'pr-9'
          )}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={disabled}
          className={cn(
            'absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary',
            compact ? 'h-6 w-6' : 'h-7 w-7'
          )}
          onClick={handleAdd}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, i) => (
            <Badge
              key={i}
              variant="secondary"
              className={cn(
                compact ? 'gap-1 pr-1 text-[10px] font-medium' : 'gap-1 pr-1 font-medium',
                variant === 'orange' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' :
                variant === 'blue' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''
              )}
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                  className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
