'use client'

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { listExercises, type Exercise } from '@/app/actions/exercises/list'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Loader2,
  Search,
  Plus,
  Dumbbell,
  AlertCircle,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Target,
  Wrench,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface ExercisesVaultProps {
  onSelect?: (exercise: Exercise) => void
  trigger?: ReactNode
}

type ExerciseSourceFilter = 'all' | 'exercisedb' | 'other'

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

const SOURCE_OPTIONS: Array<{ value: ExerciseSourceFilter; label: string }> = [
  { value: 'all', label: 'Todos los sources' },
  { value: 'exercisedb', label: 'Solo ExerciseDB' },
  { value: 'other', label: 'Sin ExerciseDB' },
]

function normalizeSourceProvider(provider: string | null) {
  if (!provider) return 'manual'

  const normalized = provider.toLowerCase()
  const compact = normalized.replace(/[^a-z0-9]/g, '')
  if (compact.includes('exercisedb')) return 'exercisedb'
  return normalized
}

function getPreviewMedia(exercise: Exercise) {
  return exercise.thumbnail ?? exercise.tutorial?.media ?? null
}

function getPrimaryAndRemaining(items: string[] | null | undefined) {
  const normalized = (items ?? []).filter(Boolean)
  return {
    primary: normalized[0] ?? null,
    remaining: Math.max(0, normalized.length - 1),
  }
}

export function ExercisesVault({ onSelect, trigger }: ExercisesVaultProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState<string>('all')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [sourceProvider, setSourceProvider] = useState<ExerciseSourceFilter>('all')
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)

  const limit = 12
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
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
        muscleGroup: muscleGroup === 'all' ? undefined : muscleGroup,
        sourceProvider,
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
  }, [page, debouncedSearch, difficulty, muscleGroup, sourceProvider, isOpen])

  useEffect(() => {
    if (isOpen) {
      fetchExercises()
    }
  }, [fetchExercises, isOpen])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, difficulty, muscleGroup, sourceProvider])

  useEffect(() => {
    if (!isOpen) {
      setShowFiltersMobile(false)
    }
  }, [isOpen])

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(muscleGroup.trim()) ||
    difficulty !== 'all' ||
    sourceProvider !== 'all'

  const totalPages = Math.max(1, Math.ceil(count / limit))

  const visibleExercises = useMemo(() => {
    return [...exercises].sort((left, right) => {
      const leftIsExerciseDb = normalizeSourceProvider(left.source_provider) === 'exercisedb'
      const rightIsExerciseDb = normalizeSourceProvider(right.source_provider) === 'exercisedb'
      return Number(rightIsExerciseDb) - Number(leftIsExerciseDb)
    })
  }, [exercises])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button variant="outline" className="gap-2">
            <Dumbbell className="h-4 w-4" />
            Open Exercise Library
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="flex h-[min(90dvh,940px)] w-[calc(100vw-24px)] !max-w-[calc(100vw-24px)] flex-col gap-0 overflow-hidden border border-border/60 p-0 sm:w-[min(94vw,1320px)] sm:!max-w-[1320px]">
        <div className="border-b border-border/60 bg-gradient-to-b from-orange-500/10 via-background to-background">
          <div className="space-y-4 p-5 md:p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-left text-xl font-semibold tracking-tight">
                Elige ejercicios
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Vista limpia para encontrar y añadir ejercicios sin ruido.
              </p>
            </DialogHeader>

            <div className="lg:hidden">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-between rounded-xl border-border/60 bg-background/70"
                onClick={() => setShowFiltersMobile((currentValue) => !currentValue)}
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Mostrar filtros
                </span>
                {showFiltersMobile ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            <div className={`${showFiltersMobile ? 'flex' : 'hidden'} flex-wrap gap-3 lg:flex`}>
              <div className="relative min-w-[280px] flex-[2_1_420px]">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre..."
                  className="h-11 rounded-xl border-border/60 bg-background/80 pl-9 shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="min-w-[210px] flex-[1_1_220px]">
                <Select value={sourceProvider} onValueChange={(value) => setSourceProvider(value as ExerciseSourceFilter)}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-border/60 bg-background/80 shadow-sm">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[190px] flex-[1_1_190px]">
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-border/60 bg-background/80 shadow-sm">
                    <SelectValue placeholder="Dificultad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {DIFFICULTIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[220px] flex-[1_1_240px]">
                <Input
                  placeholder="Músculo..."
                  className="h-11 rounded-xl border-border/60 bg-background/80 shadow-sm"
                  value={muscleGroup}
                  onChange={(e) => setMuscleGroup(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full border-border/60 bg-background/70 text-xs text-muted-foreground">
                  {count} ejercicios
                </Badge>
                {sourceProvider !== 'all' && (
                  <Badge variant="outline" className="rounded-full border-border/60 bg-background/70 text-xs">
                    {SOURCE_OPTIONS.find((option) => option.value === sourceProvider)?.label}
                  </Badge>
                )}
                {difficulty !== 'all' && (
                  <Badge variant="outline" className="rounded-full border-border/60 bg-background/70 text-xs">
                    {difficulty}
                  </Badge>
                )}
                {muscleGroup.trim() && (
                  <Badge variant="outline" className="rounded-full border-border/60 bg-background/70 text-xs">
                    {muscleGroup}
                  </Badge>
                )}
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => {
                    setSearch('')
                    setMuscleGroup('')
                    setDifficulty('all')
                    setSourceProvider('all')
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Cargando ejercicios...</p>
                <p className="text-sm">Estamos preparando la mejor vista disponible para tu vault.</p>
              </div>
            </div>
          ) : fetchError ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-muted-foreground">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">No pudimos cargar los ejercicios</p>
                <p className="text-sm">{fetchError}</p>
              </div>
              <Button variant="outline" onClick={() => fetchExercises()} className="gap-2 rounded-xl">
                <RefreshCcw className="h-4 w-4" />
                Reintentar
              </Button>
            </div>
          ) : visibleExercises.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center text-muted-foreground">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-muted/40">
                <Dumbbell className="h-7 w-7" />
              </div>
              <p className="mt-4 font-semibold text-foreground">
                {hasActiveFilters ? 'No encontramos ejercicios con esos filtros' : 'La biblioteca aun no tiene ejercicios visibles'}
              </p>
              <p className="mt-1 max-w-md text-sm">
                {hasActiveFilters
                  ? 'Prueba otro source, reduce el texto de busqueda o limpia los filtros para volver a explorar.'
                  : 'Cuando agregues ejercicios a tu catalogo apareceran aqui listos para reutilizar.'}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  className="mt-4 rounded-xl"
                  onClick={() => {
                    setSearch('')
                    setMuscleGroup('')
                    setDifficulty('all')
                    setSourceProvider('all')
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Mostrando <span className="font-medium text-foreground">{visibleExercises.length}</span> de{' '}
                  <span className="font-medium text-foreground">{count}</span> ejercicios
                </p>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Pagina {page} de {totalPages}
                </p>
              </div>

              <div className="flex flex-row flex-wrap gap-4">
                {visibleExercises.map((exercise) => {
                  const previewMedia = getPreviewMedia(exercise)
                  const isVideo = Boolean(previewMedia?.type?.startsWith('video'))
                  const muscles = exercise.muscle_group ?? []
                  const equipment = exercise.equipment ?? []
                  const muscleSummary = getPrimaryAndRemaining(muscles)
                  const equipmentSummary = getPrimaryAndRemaining(equipment)

                  return (
                    <article
                      key={exercise.id}
                      className="group flex min-h-[340px] min-w-[220px] flex-[1_1_230px] flex-col overflow-hidden rounded-[24px] border border-border/60 bg-card/95 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-[0_20px_60px_-40px_rgba(0,0,0,0.55)] md:min-h-[360px] md:min-w-[240px] md:flex-[1_1_250px] xl:max-w-[292px]"
                    >
                      <div className="relative aspect-square overflow-hidden bg-[#f4f1eb] dark:bg-[#111111]">
                        {previewMedia?.url ? (
                          isVideo ? (
                            <div className="relative h-full w-full bg-[#f4f1eb] dark:bg-[#111111]">
                              <video
                                src={previewMedia.url}
                                className="absolute -inset-px h-[calc(100%+2px)] w-[calc(100%+2px)] max-w-none object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.02]"
                                muted
                                loop
                                playsInline
                                onMouseOver={(event) => event.currentTarget.play()}
                                onMouseOut={(event) => {
                                  event.currentTarget.pause()
                                  event.currentTarget.currentTime = 0
                                }}
                              />
                            </div>
                          ) : (
                            <div className="h-full w-full bg-[#f4f1eb] dark:bg-[#111111]">
                              <img
                                src={previewMedia.url}
                                alt={exercise.name}
                                className="absolute -inset-px block h-[calc(100%+2px)] w-[calc(100%+2px)] max-w-none object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.02]"
                              />
                            </div>
                          )
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#f4f1eb] dark:bg-[#111111]">
                            <div className="flex h-full w-full items-center justify-center bg-white/60 dark:bg-white/[0.03]">
                              <Dumbbell className="h-10 w-10 text-muted-foreground" />
                            </div>
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/80 via-black/42 to-transparent" />

                        {onSelect && (
                          <div className="absolute inset-x-0 top-6">
                            <button
                              type="button"
                              className="flex h-11 w-full translate-y-2 items-center justify-center gap-2 bg-emerald-500 text-sm font-semibold tracking-[0.08em] text-emerald-50 opacity-0 shadow-[0_12px_28px_-18px_rgba(52,211,153,0.32)] backdrop-blur-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-emerald-500"
                              onClick={() => {
                                onSelect(exercise)
                                setIsOpen(false)
                              }}
                            >
                              <Plus className="h-4 w-4" />
                              Agregar al workout
                            </button>
                          </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 px-3 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex min-w-0 items-center gap-1.5 rounded-full border border-orange-300/35 bg-orange-500/22 px-2.5 py-1.5 text-orange-50 shadow-[0_10px_24px_-18px_rgba(249,115,22,0.4)] backdrop-blur-md">
                              <Target className="h-3.5 w-3.5 shrink-0 text-orange-200" />
                              {muscleSummary.primary ? (
                                <>
                                  <span className="max-w-[110px] truncate text-[11px] font-medium">
                                    {muscleSummary.primary}
                                  </span>
                                  {muscleSummary.remaining > 0 && (
                                    <span className="text-[11px] text-orange-100">+{muscleSummary.remaining}</span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[11px] text-orange-100">Sin tags</span>
                              )}
                            </div>

                            <div className="flex min-w-0 items-center gap-1.5 rounded-full border border-sky-300/35 bg-sky-500/22 px-2.5 py-1.5 text-sky-50 shadow-[0_10px_24px_-18px_rgba(56,189,248,0.4)] backdrop-blur-md">
                              <Wrench className="h-3.5 w-3.5 shrink-0 text-sky-200" />
                              {equipmentSummary.primary ? (
                                <>
                                  <span className="max-w-[110px] truncate text-[11px] font-medium">
                                    {equipmentSummary.primary}
                                  </span>
                                  {equipmentSummary.remaining > 0 && (
                                    <span className="text-[11px] text-sky-100">+{equipmentSummary.remaining}</span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[11px] text-sky-100">Sin equipo</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-3 p-4">
                        <div className="space-y-2">
                          <h3 className="line-clamp-2 text-[15px] font-semibold leading-5 tracking-tight text-foreground" title={exercise.name}>
                            {exercise.name}
                          </h3>
                          {exercise.difficulty && (
                            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                              {exercise.difficulty}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-background/80 px-5 py-4 md:px-6">
            <div className="text-sm text-muted-foreground">
              Pagina <span className="font-medium text-foreground">{page}</span> de{' '}
              <span className="font-medium text-foreground">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                disabled={page === totalPages || loading}
              >
                Siguiente
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
