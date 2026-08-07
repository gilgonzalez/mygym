'use client'

import { useMemo, useState } from 'react'
import WorkoutCard from '@/components/WorkoutCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, RefreshCcw, Search, Sparkles, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getWorkoutsAction } from '@/app/actions/workout/list'

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
      <div className="mx-auto flex w-full max-w-7xl justify-center px-4 py-6 sm:px-6">
        <div className="w-full max-w-5xl space-y-6">
          <div className="rounded-[28px] border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur sm:p-5 animate-pulse">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <div className="h-6 w-28 rounded-full bg-muted/70" />
                <div className="space-y-1.5">
                  <div className="h-8 w-56 rounded-md bg-muted/70 sm:h-9 sm:w-64" />
                  <div className="h-4 w-full max-w-lg rounded-md bg-muted/50" />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:min-w-[320px] sm:max-w-[360px]">
                <div className="h-10 w-full rounded-full bg-muted/60" />
                <div className="h-10 w-48 rounded-full bg-muted/60" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <FeedWorkoutCardSkeleton key={i} />
            ))}
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
                  Descubre Workouts
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Busca rapido y ordena por novedad o relevancia para encontrar un workout que encaje contigo.
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
                  : 'Cuando haya workouts visibles aqui, apareceran en este feed.'}
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

function FeedWorkoutCardSkeleton() {
  return (
    <div className="w-full rounded-[28px] border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden animate-pulse">
      {/* Mobile skeleton */}
      <div className="sm:hidden p-3 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted/70 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-28 rounded bg-muted/60" />
            <div className="h-2 w-20 rounded bg-muted/50" />
          </div>
          <div className="w-16 h-7 rounded-full bg-muted/60 shrink-0" />
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-border/60 min-h-[190px]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 dark:from-emerald-950 dark:via-slate-950 dark:to-black opacity-70" />
          <div className="relative z-10 p-4 min-h-[190px] flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="h-7 w-4/5 rounded-md bg-white/15" />
              <div className="h-6 w-1/2 rounded-md bg-white/10" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-9 w-20 rounded-xl bg-black/25 border border-white/10" />
              <div className="h-9 w-20 rounded-xl bg-black/25 border border-white/10" />
              <div className="flex-1 h-9 rounded-xl bg-gradient-to-br from-amber-500/25 to-orange-500/20 border border-amber-400/25" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-0.5 pt-0.5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-muted/60" />
              <div className="h-3 w-5 rounded bg-muted/60" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-muted/60" />
              <div className="h-3 w-5 rounded bg-muted/60" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-10 rounded-md bg-muted/50" />
            <div className="h-5 w-10 rounded-md bg-muted/50" />
          </div>
        </div>

        <div className="pt-1">
          <div className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500/70 to-emerald-400/70 shadow-[0_4px_20px_-6px_rgba(16,185,129,0.5)]" />
        </div>
      </div>

      {/* Desktop skeleton */}
      <div className="hidden sm:flex flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-muted/70 shrink-0" />
            <div className="flex flex-col min-w-0 space-y-1.5">
              <div className="h-3.5 w-32 rounded bg-muted/60" />
              <div className="h-2.5 w-24 rounded bg-muted/50" />
            </div>
          </div>
          <div className="h-9 w-24 rounded-md bg-muted/60 shrink-0" />
        </div>

        <div className="space-y-3 mb-5">
          <div className="h-4 w-3/4 rounded bg-muted/60" />
          <div className="h-4 w-1/2 rounded bg-muted/50" />
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-border/60">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950 opacity-80" />
          <div className="relative z-10 flex min-h-[260px] lg:min-h-[300px] flex-col gap-5 p-4 lg:gap-6 lg:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="h-10 w-60 rounded-md bg-white/15" />
              <div className="h-7 w-28 rounded-full bg-black/25 shrink-0" />
            </div>
            <div className="h-6 w-28 rounded-md bg-muted/50" />
            <div className="flex flex-row flex-wrap gap-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-[calc(50%-0.375rem)] xl:w-[calc(25%-0.5625rem)] h-20 rounded-2xl border border-white/10 bg-black/20" />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-border/50 pt-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="h-7 w-24 rounded-md bg-muted/60" />
              <div className="h-7 w-24 rounded-md bg-muted/50" />
            </div>
            <div className="h-6 w-64 rounded bg-muted/50" />
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-4 w-20 rounded bg-muted/60" />
              <div className="h-4 w-20 rounded bg-muted/60" />
              <div className="h-4 w-20 rounded bg-muted/60" />
              <div className="h-4 w-20 rounded bg-muted/50" />
              <div className="ml-auto h-5 w-24 rounded bg-muted/60" />
            </div>
          </div>
          <div className="lg:justify-self-end lg:w-full">
            <div className="w-full h-11 rounded-lg bg-primary/60" />
          </div>
        </div>
      </div>
    </div>
  )
}
