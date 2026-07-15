'use client'

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { listExerciseFilterOptions, listExercises, type Exercise } from '@/app/actions/exercises/list'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
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
  X,
} from 'lucide-react'

interface ExercisesVaultProps {
  onSelect?: (exercise: Exercise) => void
  trigger?: ReactNode
}

interface ExerciseFilterOptions {
  muscleGroups: string[]
  equipment: string[]
}

type ExerciseSortOption = 'relevance' | 'recent' | 'name'
const MAX_VISIBLE_FILTER_OPTIONS = 10
const SORT_OPTIONS: Array<{ value: ExerciseSortOption; label: string }> = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'recent', label: 'Mas recientes' },
  { value: 'name', label: 'A-Z' },
]

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

function toggleFilterValue(values: string[], nextValue: string) {
  return values.includes(nextValue)
    ? values.filter((value) => value !== nextValue)
    : [...values, nextValue]
}

export function ExercisesVault({ onSelect, trigger }: ExercisesVaultProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersLoading, setFiltersLoading] = useState(false)
  const [count, setCount] = useState(0)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [filterOptions, setFilterOptions] = useState<ExerciseFilterOptions>({ muscleGroups: [], equipment: [] })

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<ExerciseSortOption>('relevance')
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)
  const [showAllMuscles, setShowAllMuscles] = useState(false)
  const [showAllEquipment, setShowAllEquipment] = useState(false)

  const limit = 12
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  const fetchFilterOptions = useCallback(async () => {
    if (!isOpen || filterOptions.muscleGroups.length > 0 || filterOptions.equipment.length > 0) return

    setFiltersLoading(true)

    try {
      const result = await listExerciseFilterOptions()

      if (result.error) {
        throw new Error(result.error)
      }

      setFilterOptions({
        muscleGroups: result.muscleGroups,
        equipment: result.equipment,
      })
    } catch (error) {
      console.error('Failed to fetch exercise filter options', error)
    } finally {
      setFiltersLoading(false)
    }
  }, [filterOptions.equipment.length, filterOptions.muscleGroups.length, isOpen])

  const fetchExercises = useCallback(async () => {
    if (!isOpen) return

    setLoading(true)
    setFetchError(null)

    try {
      const result = await listExercises({
        page,
        limit,
        search: debouncedSearch,
        muscleGroups: selectedMuscleGroups,
        equipment: selectedEquipment,
        sort,
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
  }, [page, debouncedSearch, selectedMuscleGroups, selectedEquipment, sort, isOpen])

  useEffect(() => {
    if (isOpen) {
      fetchExercises()
    }
  }, [fetchExercises, isOpen])

  useEffect(() => {
    if (isOpen) {
      fetchFilterOptions()
    }
  }, [fetchFilterOptions, isOpen])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, selectedMuscleGroups, selectedEquipment, sort])

  useEffect(() => {
    if (!isOpen) {
      setShowFiltersMobile(false)
      setShowAllMuscles(false)
      setShowAllEquipment(false)
    }
  }, [isOpen])

  const hasActiveFilters =
    Boolean(search.trim()) ||
    selectedMuscleGroups.length > 0 ||
    selectedEquipment.length > 0

  const totalPages = Math.max(1, Math.ceil(count / limit))
  const activeFiltersCount =
    Number(Boolean(search.trim())) +
    selectedMuscleGroups.length +
    selectedEquipment.length

  const visibleMuscleGroups = useMemo(
    () => (showAllMuscles ? filterOptions.muscleGroups : filterOptions.muscleGroups.slice(0, MAX_VISIBLE_FILTER_OPTIONS)),
    [filterOptions.muscleGroups, showAllMuscles]
  )

  const visibleEquipmentOptions = useMemo(
    () => (showAllEquipment ? filterOptions.equipment : filterOptions.equipment.slice(0, MAX_VISIBLE_FILTER_OPTIONS)),
    [filterOptions.equipment, showAllEquipment]
  )

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = []

    if (debouncedSearch.trim()) {
      chips.push({
        key: 'search',
        label: `Busqueda: ${debouncedSearch.trim()}`,
        onRemove: () => setSearch(''),
      })
    }

    selectedMuscleGroups.forEach((item) => {
      chips.push({
        key: `muscle-${item}`,
        label: item,
        onRemove: () => setSelectedMuscleGroups((currentValue) => currentValue.filter((value) => value !== item)),
      })
    })

    selectedEquipment.forEach((item) => {
      chips.push({
        key: `equipment-${item}`,
        label: item,
        onRemove: () => setSelectedEquipment((currentValue) => currentValue.filter((value) => value !== item)),
      })
    })

    return chips
  }, [debouncedSearch, selectedMuscleGroups, selectedEquipment])

  const clearFilters = useCallback(() => {
    setSearch('')
    setSort('relevance')
    setSelectedMuscleGroups([])
    setSelectedEquipment([])
  }, [])

  const filterPanel = (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[26px] border border-border/60 bg-background/85 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-4 pt-4">
            <div className="rounded-xl bg-orange-500/10 p-2 text-orange-600 dark:text-orange-300">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Musculos</p>
            </div>
          </div>
          {filtersLoading && <span className="px-4 pt-4 text-xs text-muted-foreground">Cargando...</span>}
        </div>

        <div className="border-t border-border/40 px-4 py-4">
          <div className="flex flex-wrap gap-2">
          {visibleMuscleGroups.map((item) => {
            const isActive = selectedMuscleGroups.includes(item)

            return (
              <button
                key={item}
                type="button"
                className={cn(
                  'rounded-2xl border px-3 py-2.5 text-xs font-semibold transition-colors',
                  isActive
                    ? 'border-orange-500/35 bg-orange-500/15 text-orange-600 dark:text-orange-300'
                    : 'border-border/60 bg-background text-muted-foreground hover:border-orange-500/25 hover:text-foreground'
                )}
                onClick={() => setSelectedMuscleGroups((currentValue) => toggleFilterValue(currentValue, item))}
              >
                {item}
              </button>
            )
          })}

          {filterOptions.muscleGroups.length > MAX_VISIBLE_FILTER_OPTIONS && (
            <button
              type="button"
              className="rounded-2xl border border-dashed border-border/60 px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-orange-500/25 hover:text-foreground"
              onClick={() => setShowAllMuscles((currentValue) => !currentValue)}
            >
              {showAllMuscles ? 'Ver menos' : `Ver ${filterOptions.muscleGroups.length - MAX_VISIBLE_FILTER_OPTIONS} mas`}
            </button>
          )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[26px] border border-border/60 bg-background/85 shadow-sm">
        <div className="flex items-center gap-2 px-4 pt-4">
          <div className="rounded-xl bg-sky-500/10 p-2 text-sky-600 dark:text-sky-300">
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Material</p>
          </div>
        </div>

        <div className="border-t border-border/40 px-4 py-4">
          <div className="flex flex-wrap gap-2">
          {visibleEquipmentOptions.map((item) => {
            const isActive = selectedEquipment.includes(item)

            return (
              <button
                key={item}
                type="button"
                className={cn(
                  'rounded-2xl border px-3 py-2.5 text-xs font-semibold transition-colors',
                  isActive
                    ? 'border-sky-500/35 bg-sky-500/15 text-sky-600 dark:text-sky-300'
                    : 'border-border/60 bg-background text-muted-foreground hover:border-sky-500/25 hover:text-foreground'
                )}
                onClick={() => setSelectedEquipment((currentValue) => toggleFilterValue(currentValue, item))}
              >
                {item}
              </button>
            )
          })}

          {filterOptions.equipment.length > MAX_VISIBLE_FILTER_OPTIONS && (
            <button
              type="button"
              className="rounded-2xl border border-dashed border-border/60 px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-sky-500/25 hover:text-foreground"
              onClick={() => setShowAllEquipment((currentValue) => !currentValue)}
            >
              {showAllEquipment ? 'Ver menos' : `Ver ${filterOptions.equipment.length - MAX_VISIBLE_FILTER_OPTIONS} mas`}
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  )

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

      <DialogContent className="flex h-[min(92dvh,920px)] w-[calc(100vw-20px)] !max-w-[calc(100vw-20px)] flex-col gap-0 overflow-hidden border border-border/60 bg-[#fcfbf8] p-0 shadow-[0_40px_120px_-50px_rgba(0,0,0,0.45)] dark:bg-[#0d0d0d] sm:w-[min(95vw,1420px)] sm:!max-w-[1420px]">
        <div className="border-b border-border/60 bg-gradient-to-b from-orange-500/10 via-background to-background">
          <div className="space-y-4 p-5 md:p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-left text-[1.15rem] font-semibold tracking-tight md:text-[1.35rem]">
                Elige ejercicios
              </DialogTitle>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Un vault limpio y util para encontrar ejercicios rapido, filtrar sin friccion y agregarlos al workout sin perder contexto.
              </p>
            </DialogHeader>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, descripcion, musculo o material..."
                  className="h-12 rounded-2xl border-border/60 bg-background/90 pl-10 shadow-none"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="min-w-[180px] flex-1 sm:flex-none sm:min-w-[220px]">
                  <Select value={sort} onValueChange={(value) => setSort(value as ExerciseSortOption)}>
                    <SelectTrigger className="h-12 rounded-2xl border-border/60 bg-background/90 shadow-none">
                      <SelectValue placeholder="Orden" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-2xl border-border/60 bg-background/90 px-4 lg:hidden"
                  onClick={() => setShowFiltersMobile((currentValue) => !currentValue)}
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filtros
                  <span className="ml-2 rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-600 dark:text-orange-300">
                    {activeFiltersCount}
                  </span>
                  {showFiltersMobile ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside
            className={cn(
              'min-h-0 border-b border-border/60 bg-muted/20 lg:block lg:border-b-0 lg:border-r',
              showFiltersMobile ? 'block' : 'hidden'
            )}
          >
            <div className="h-full overflow-y-auto p-4 md:p-5">
              {filterPanel}
            </div>
          </aside>

          <section className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-border/60 bg-background/85 px-5 py-4 backdrop-blur md:px-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full border-border/60 bg-background text-xs text-foreground">
                      {count} ejercicios
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-border/60 bg-background text-xs text-muted-foreground">
                      Pagina {page} de {totalPages}
                    </Badge>
                    {hasActiveFilters && (
                      <Badge variant="outline" className="rounded-full border-orange-500/20 bg-orange-500/10 text-xs text-orange-600 dark:text-orange-300">
                        {activeFiltersCount} filtros activos
                      </Badge>
                    )}
                  </div>

                  {activeFilterChips.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {activeFilterChips.map((chip) => (
                        <button
                          key={chip.key}
                          type="button"
                          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-orange-500/25"
                          onClick={chip.onRemove}
                        >
                          <span>{chip.label}</span>
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" className="rounded-xl" onClick={clearFilters}>
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
              {loading ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Cargando ejercicios...</p>
                    <p className="text-sm">Estamos preparando la mejor seleccion del vault.</p>
                  </div>
                </div>
              ) : fetchError ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 px-6 text-center text-muted-foreground">
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
              ) : exercises.length === 0 ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center text-muted-foreground">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-muted/40">
                    <Dumbbell className="h-7 w-7" />
                  </div>
                  <p className="mt-4 font-semibold text-foreground">
                    {hasActiveFilters ? 'No encontramos ejercicios con esos filtros' : 'La biblioteca aun no tiene ejercicios visibles'}
                  </p>
                  <p className="mt-1 max-w-md text-sm">
                    {hasActiveFilters
                      ? 'Prueba otra combinacion de filtros o reduce el texto de busqueda para volver a explorar.'
                      : 'Cuando agregues ejercicios a tu catalogo apareceran aqui listos para reutilizar.'}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="ghost" className="mt-4 rounded-xl" onClick={clearFilters}>
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                      Mostrando <span className="font-semibold text-foreground">{exercises.length}</span> ejercicios en esta pagina
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total: <span className="font-semibold text-foreground">{count}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {exercises.map((exercise) => {
                      const previewMedia = getPreviewMedia(exercise)
                      const isVideo = Boolean(previewMedia?.type?.startsWith('video'))
                      const muscles = exercise.muscle_group ?? []
                      const equipment = exercise.equipment ?? []
                      const muscleSummary = getPrimaryAndRemaining(muscles)
                      const equipmentSummary = getPrimaryAndRemaining(equipment)

                      return (
                        <article
                          key={exercise.id}
                          className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-border/60 bg-card/95 shadow-[0_18px_50px_-35px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-[0_30px_80px_-45px_rgba(0,0,0,0.55)]"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-[#f4f1eb] dark:bg-[#111111]">
                            {previewMedia?.url ? (
                              isVideo ? (
                                <video
                                  src={previewMedia.url}
                                  className="absolute -inset-px h-[calc(100%+2px)] w-[calc(100%+2px)] max-w-none object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.03]"
                                  muted
                                  loop
                                  playsInline
                                  onMouseOver={(event) => event.currentTarget.play()}
                                  onMouseOut={(event) => {
                                    event.currentTarget.pause()
                                    event.currentTarget.currentTime = 0
                                  }}
                                />
                              ) : (
                                <img
                                  src={previewMedia.url}
                                  alt={exercise.name}
                                  className="absolute -inset-px block h-[calc(100%+2px)] w-[calc(100%+2px)] max-w-none object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.03]"
                                />
                              )
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-white/60 dark:bg-white/[0.03]">
                                <Dumbbell className="h-10 w-10 text-muted-foreground" />
                              </div>
                            )}

                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/42 to-transparent" />

                            {onSelect && (
                              <div className="absolute inset-x-0 top-0">
                                <button
                                  type="button"
                                  className="flex h-11 w-full -translate-y-full items-center justify-center gap-2 bg-emerald-400/85 text-sm font-bold tracking-[0.08em] text-slate-950 opacity-0 shadow-[0_18px_36px_-26px_rgba(16,185,129,0.45)] backdrop-blur-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
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
                                <div className="flex min-w-0 items-center gap-1.5 rounded-full border border-orange-300/35 bg-orange-500/22 px-2.5 py-1.5 text-orange-50 backdrop-blur-md">
                                  <Target className="h-3.5 w-3.5 shrink-0 text-orange-200" />
                                  {muscleSummary.primary ? (
                                    <>
                                      <span className="max-w-[120px] truncate text-[11px] font-medium">
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

                                <div className="flex min-w-0 items-center gap-1.5 rounded-full border border-sky-300/35 bg-sky-500/22 px-2.5 py-1.5 text-sky-50 backdrop-blur-md">
                                  <Wrench className="h-3.5 w-3.5 shrink-0 text-sky-200" />
                                  {equipmentSummary.primary ? (
                                    <>
                                      <span className="max-w-[120px] truncate text-[11px] font-medium">
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

                          <div className="flex flex-1 flex-col gap-4 p-4">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {exercise.difficulty && (
                                  <span className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    {exercise.difficulty}
                                  </span>
                                )}
                                {exercise.type && (
                                  <span className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    {exercise.type === 'time' ? 'Time' : 'Reps'}
                                  </span>
                                )}
                              </div>

                              <h3 className="line-clamp-2 text-base font-semibold leading-5 tracking-tight text-foreground" title={exercise.name}>
                                {exercise.name}
                              </h3>

                              {exercise.description && (
                                <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                                  {exercise.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-auto grid grid-cols-2 gap-2 rounded-[20px] border border-border/60 bg-muted/20 p-3">
                              <div className="space-y-1">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Series</p>
                                <p className="text-sm font-semibold text-foreground">{exercise.sets ?? '-'}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                  {exercise.type === 'time' ? 'Duracion' : 'Reps'}
                                </p>
                                <p className="text-sm font-semibold text-foreground">
                                  {exercise.type === 'time' ? (exercise.duration ?? '-') : (exercise.reps ?? '-')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {(count > 0 || totalPages > 1) && (
              <div className="border-t border-border/60 bg-background/92 px-5 py-4 backdrop-blur md:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Pagina {page} de {totalPages}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {page === totalPages ? 'Estas viendo el ultimo bloque de resultados.' : 'Navega entre paginas sin perder tus filtros.'}
                    </p>
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

                    <div className="min-w-[82px] rounded-xl border border-border/60 bg-background px-3 py-2 text-center text-sm font-semibold text-foreground">
                      {page}/{totalPages}
                    </div>

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
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
