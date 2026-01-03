import React, { useState, useMemo } from 'react'
import { Check, Plus, X, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/Dropdown'
import { WORKOUT_TAGS } from '@/constants/workout-tags'
import { cn } from '@/lib/utils'

interface WorkoutTagSelectorProps {
  value?: string[]
  onChange: (value: string[]) => void
}

export function WorkoutTagSelector({ value = [], onChange }: WorkoutTagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTags = useMemo(() => {
    if (!searchTerm) return WORKOUT_TAGS
    return WORKOUT_TAGS.filter(tag => 
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  const toggleTag = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag))
    } else {
      onChange([...value, tag])
    }
  }

  return (
    <div className="flex flex-col gap-3">
        {/* Trigger Button */}
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="outline" 
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-background border-border/50 h-10 rounded-xl px-3"
                >
                    <span className="text-muted-foreground font-normal">
                        {value.length > 0 ? `${value.length} tags selected` : "Select tags..."}
                    </span>
                    <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[300px] p-0" align="start">
                <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                       className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                       placeholder="Search tags..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       autoFocus
                    />
                </div>
                <div className="max-h-[300px] overflow-y-auto p-1">
                    {filteredTags.length === 0 && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No tags found.
                        </div>
                    )}
                    {filteredTags.map((tag) => {
                        const isSelected = value.includes(tag)
                        return (
                            <DropdownMenuItem 
                                key={tag} 
                                onClick={(e) => {
                                    e.preventDefault()
                                    toggleTag(tag)
                                }}
                                className="cursor-pointer"
                            >
                                <div className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                    isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                )}>
                                    <Check className={cn("h-4 w-4")} />
                                </div>
                                <span>{tag}</span>
                            </DropdownMenuItem>
                        )
                    })}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>

        {/* Selected Tags Display (Below) */}
        {value.length > 0 && (
            <div className="flex flex-wrap gap-2">
                {value.map((tag) => (
                    <Badge 
                        key={tag} 
                        variant="default"
                        className="pl-3 pr-1 py-1.5 h-8 text-sm font-semibold gap-2 bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm transition-all cursor-pointer group animate-in fade-in zoom-in-95 duration-200"
                        onClick={() => toggleTag(tag)}
                    >
                        {tag}
                        <div className="rounded-full bg-background/20 group-hover:bg-background/30 p-0.5 transition-colors">
                             <X className="h-3.5 w-3.5" />
                        </div>
                    </Badge>
                ))}
            </div>
        )}
    </div>
  )
}