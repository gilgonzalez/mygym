'use client'

import { useState, useEffect, useCallback } from 'react'
import { listExercises, Exercise } from '@/app/actions/exercises/list'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Search, Plus, Dumbbell, Play, AlertCircle, RefreshCcw } from 'lucide-react'

interface ExercisesVaultProps {
  onSelect?: (exercise: Exercise) => void
  trigger?: React.ReactNode
}

const DIFFICULTIES = [
  'beginner', 'intermediate', 'advanced'
]

export function ExercisesVault({ onSelect, trigger }: ExercisesVaultProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [fetchError, setFetchError] = useState<string | null>(null)
  
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState<string>('all')
  const [muscleGroup, setMuscleGroup] = useState<string>('')

  const limit = 9
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchExercises = useCallback(async () => {
    if (!isOpen) return
    
    setLoading(true)
    setFetchError(null)
    try {
      const result = await listExercises({
        page,
        limit,
        search: debouncedSearch,
        difficulty: difficulty === 'all' ? undefined : difficulty,
        muscleGroup: muscleGroup === 'all' ? undefined : muscleGroup
      })
      if (result.error) {
        throw new Error(result.error)
      }
      setExercises(result.data)
      setCount(result.count)
    } catch (error) {
      console.error('Failed to fetch exercises', error)
      setExercises([])
      setCount(0)
      setFetchError(error instanceof Error ? error.message : 'No pudimos cargar la biblioteca de ejercicios.')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, difficulty, muscleGroup, isOpen])

  useEffect(() => {
    if (isOpen) {
      fetchExercises()
    }
  }, [fetchExercises, isOpen])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, difficulty, muscleGroup])

  const totalPages = Math.ceil(count / limit)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button variant="outline" className="gap-2">
            <Dumbbell className="h-4 w-4" />
            Open Exercise Library
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col gap-0 p-0 overflow-hidden">
        <div className="p-6 border-b space-y-4">
          <DialogHeader>
            <DialogTitle>Exercise Library</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                {DIFFICULTIES.map(d => (
                  <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search muscle..."
              className="w-full md:w-[150px]"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Cargando biblioteca de ejercicios...</p>
            </div>
          ) : fetchError ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-muted-foreground px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">No pudimos cargar los ejercicios</p>
                <p className="text-sm">{fetchError}</p>
              </div>
              <Button variant="outline" onClick={() => fetchExercises()} className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Reintentar
              </Button>
            </div>
          ) : exercises.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Dumbbell className="h-6 w-6" />
              </div>
              <p className="mt-4 font-semibold text-foreground">
                {search || muscleGroup || difficulty !== 'all' ? 'No encontramos ejercicios con esos filtros' : 'La biblioteca aun no tiene ejercicios visibles'}
              </p>
              <p className="mt-1 text-sm">
                {search || muscleGroup || difficulty !== 'all'
                  ? 'Prueba con otros filtros o limpia la busqueda para volver a explorar.'
                  : 'Cuando agregues ejercicios a tu catalogo, apareceran aqui listos para reutilizar.'}
              </p>
              {(search || muscleGroup || difficulty !== 'all') && (
                <Button
                  variant="ghost"
                  className="mt-3"
                  onClick={() => {
                    setSearch('')
                    setMuscleGroup('')
                    setDifficulty('all')
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:bg-accent/50"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {exercise.thumbnail?.url ? (
                      exercise.thumbnail.type?.startsWith('video') ? (
                        <div className="relative h-full w-full">
                          <video 
                            src={exercise.thumbnail.url} 
                            className="h-full w-full object-cover" 
                            muted 
                            loop 
                            playsInline
                            onMouseOver={e => e.currentTarget.play()}
                            onMouseOut={e => {
                              e.currentTarget.pause()
                              e.currentTarget.currentTime = 0
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:hidden pointer-events-none">
                            <Play className="h-8 w-8 text-white opacity-70" />
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={exercise.thumbnail.url} 
                          alt={exercise.name} 
                          className="h-full w-full object-cover" 
                        />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-secondary">
                        <Dumbbell className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {onSelect && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            onSelect(exercise)
                            setIsOpen(false)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Add to Workout
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="p-3 space-y-2">
                    <h3 className="font-semibold line-clamp-1" title={exercise.name}>{exercise.name}</h3>
                    <div className="flex flex-wrap gap-1">
                      {exercise.difficulty && (
                        <Badge variant="secondary" className="text-[10px] px-1 h-5">
                          {exercise.difficulty}
                        </Badge>
                      )}
                      {exercise.muscle_group?.slice(0, 2).map((m) => (
                        <Badge key={m} variant="outline" className="text-[10px] px-1 h-5">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
