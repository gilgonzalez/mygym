'use client'

import { useMemo, useState } from 'react'
import WorkoutCard from '@/components/WorkoutCard'
import { Button } from '@/components/Button'
import { Input } from '@/components/ui/input'
import { Loader2, RefreshCcw, Search, Sparkles, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getWorkoutsAction } from '../actions/workout/list'

type FeedSort = 'newest' | 'popular'

export default function Page() {
  const [sortBy, setSortBy] = useState<FeedSort>('newest')
  const [search, setSearch] = useState('')

  const {
    data: workouts = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const res = await getWorkoutsAction()
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  const filteredWorkouts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    const matching = workouts.filter((workout) => {
      if (!normalizedSearch) return true

      const haystack = [
        workout.title,
        workout.description,
        workout.user?.name,
        workout.user?.username,
        ...(workout.tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })

    return [...matching].sort((a, b) => {
      if (sortBy === 'popular') {
        const popularityA = (a.likes_count || 0) + (a.rating || 0) * 10
        const popularityB = (b.likes_count || 0) + (b.rating || 0) * 10
        return popularityB - popularityA
      }

      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
  }, [search, sortBy, workouts])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-3xl border border-border/60 bg-card/70 px-6 py-10 text-center shadow-sm backdrop-blur">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">Cargando workouts</p>
            <p className="text-sm text-muted-foreground">Estamos preparando tu feed con las rutinas publicas mas recientes.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="flex w-full max-w-lg flex-col items-center gap-4 rounded-[28px] border border-destructive/20 bg-destructive/5 px-6 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <RefreshCcw className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">No pudimos cargar el feed</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Ocurrio un error inesperado al cargar los workouts.'}
            </p>
          </div>
          <Button onClick={() => refetch()} disabled={isRefetching} className="gap-2">
            {isRefetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl justify-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-5xl space-y-6">
        <div className="rounded-[28px] border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                Feed publico
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-green-500 via-green-600 to-slate-900 bg-clip-text text-2xl font-bold tracking-tight text-transparent dark:from-emerald-400 dark:to-slate-300 sm:text-3xl">
                  Discover Workouts
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Busca rapido y ordena por novedad o relevancia para encontrar una rutina que encaje contigo.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:min-w-[320px] sm:max-w-[360px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por titulo, creador o tag"
                  className="h-10 rounded-full border-border/70 bg-background/80 pl-9"
                />
              </div>
              <div className="flex gap-1 self-start rounded-full bg-muted/60 p-1">
                <Button
                  variant={sortBy === 'newest' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs sm:text-sm"
                  onClick={() => setSortBy('newest')}
                >
                  Nuevo
                </Button>
                <Button
                  variant={sortBy === 'popular' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs sm:text-sm"
                  onClick={() => setSortBy('popular')}
                >
                  <TrendingUp className="mr-1 h-3.5 w-3.5" />
                  Popular
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          {filteredWorkouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
          {filteredWorkouts.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-border/70 bg-card/50 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted/70">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                {search ? 'No encontramos resultados para tu busqueda' : 'Todavia no hay workouts publicos'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? 'Prueba con otro titulo, creador o tag para seguir explorando.'
                  : 'Cuando haya rutinas visibles aqui, apareceran en este feed.'}
              </p>
              {search && (
                <Button variant="ghost" className="mt-4" onClick={() => setSearch('')}>
                  Limpiar busqueda
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
