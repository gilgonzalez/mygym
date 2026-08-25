'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import WorkoutCard from '@/components/WorkoutCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Heart,
  Loader2,
  RefreshCcw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  getWorkoutsAction,
  type FeedSort,
  type FeedFilter,
} from '@/app/actions/workout/list'
import { useFeedRealtimeUpdates } from '@/hooks/useFeedRealtimeUpdates'

const PAGE_SIZE = 8

export default function Page() {
  const [sortBy, setSortBy] = useState<FeedSort>('newest')
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [newestCreatedAt, setNewestCreatedAt] = useState<string | null>(null)
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [followingIds, setFollowingIds] = useState<string[]>([])
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let active = true
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!active) return
      setViewerId(user?.id ?? null)
    })()
    return () => {
      active = false
    }
  }, [])

  useQuery({
    queryKey: ['feed-following-ids', { viewerId, filter }],
    queryFn: async () => {
      if (filter !== 'following' || !viewerId) {
        setFollowingIds([])
        return [] as string[]
      }

      const { data, error } = await supabase
        .from('user_follows')
        .select('followed_id')
        .eq('follower_id', viewerId)
        .eq('status', 'accepted')

      if (error) return [] as string[]
      const ids = (data ?? []).map((r) => r.followed_id)
      setFollowingIds(ids)
      return ids
    },
    enabled: filter === 'following' && !!viewerId,
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['workouts', { sortBy, filter, search: debouncedSearch }],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getWorkoutsAction({
        page: pageParam as number,
        pageSize: PAGE_SIZE,
        sortBy,
        filter,
        search: debouncedSearch,
      })
      if (!res.success) throw new Error(res.error)
      return res.data!
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.hasMore) return undefined
      return allPages.length + 1
    },
  })

  const allWorkouts = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((p) => p.workouts ?? [])
  }, [data])

  useEffect(() => {
    if (allWorkouts.length > 0) {
      const dates = allWorkouts
        .map((w) => w.created_at)
        .filter(Boolean) as string[]
      if (dates.length > 0) {
        dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        setNewestCreatedAt(dates[0])
      }
    }
  }, [allWorkouts])

  const { newCount: realtimeNewCount, resetCount: resetRealtimeNewCount } = useFeedRealtimeUpdates({
    newestCreatedAt,
    filter,
    sortBy,
    viewerId,
    followingIds,
    debouncedSearch,
  })

  useEffect(() => {
    const element = sentinelRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      {
        rootMargin: '200px',
        threshold: 0,
      }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const handleLoadNew = async () => {
    resetRealtimeNewCount()
    await refetch()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const newWorkoutsCount = realtimeNewCount

  return (
    <div className="mx-auto flex w-full max-w-7xl justify-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-5xl space-y-6">
        <div className="rounded-[28px] border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                {filter === 'following' ? 'Mi circulo' : filter === 'favorites' ? 'Favoritos' : 'Feed publico'}
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
              <div className="flex self-start rounded-full bg-muted/60 p-1">
                <Button
                  variant={sortBy === 'newest' && filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs sm:text-sm"
                  onClick={() => {
                    setSortBy('newest')
                    setFilter('all')
                  }}
                >
                  Nuevo
                </Button>
                <Button
                  variant={sortBy === 'popular' && filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs sm:text-sm"
                  onClick={() => {
                    setSortBy('popular')
                    setFilter('all')
                  }}
                >
                  <TrendingUp className="mr-1 h-3.5 w-3.5" />
                  Popular
                </Button>
                <Button
                  variant={filter === 'following' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs sm:text-sm"
                  onClick={() => {
                    setFilter('following')
                    setSortBy('newest')
                  }}
                >
                  <Users className="mr-1 h-3.5 w-3.5" />
                  Mi circulo
                </Button>
                <Button
                  variant={filter === 'favorites' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs sm:text-sm"
                  onClick={() => {
                    setFilter('favorites')
                    setSortBy('newest')
                  }}
                >
                  <Heart className="mr-1 h-3.5 w-3.5" />
                  Favoritos
                </Button>
              </div>
            </div>
          </div>
        </div>

        {(newWorkoutsCount ?? 0) > 0 && !isLoading && (
          <div className="sticky top-4 z-20">
            <button
              type="button"
              onClick={handleLoadNew}
              className="group flex w-full items-center gap-3 rounded-full border border-border/70 bg-background/80 px-3.5 py-2.5 text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-200 hover:bg-muted/40 hover:border-border active:scale-[0.998] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:gap-4 sm:px-4 sm:py-2.5"
            >
              <span className="relative flex shrink-0">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="absolute inset-0 flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping opacity-60" />
              </span>

              <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-foreground sm:text-[15px]">
                {newWorkoutsCount === 1 ? '1 workout nuevo' : `${newWorkoutsCount} workouts nuevos`}
              </span>

              <span className="flex shrink-0 items-center justify-center rounded-full text-foreground/70 transition-all duration-200 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="m5 12 7-7 7 7" />
                </svg>
              </span>
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <FeedWorkoutCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="flex items-center justify-center px-2 py-4">
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
        )}

        {!isLoading && !error && (
          <div className="flex flex-col gap-6">
            {allWorkouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}

            <div ref={sentinelRef} />

            {isFetchingNextPage && (
              <div className="flex flex-col items-center justify-center gap-4 py-6">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                <p className="text-sm text-muted-foreground">Cargando mas workouts...</p>
              </div>
            )}

            {!hasNextPage && !isFetchingNextPage && allWorkouts.length > 0 && (
              <div className="flex items-center justify-center py-6">
                <p className="text-xs text-muted-foreground">
                  Has visto todos los workouts disponibles
                </p>
              </div>
            )}

            {allWorkouts.length === 0 && !isFetchingNextPage && (
              <div className="rounded-[28px] border border-dashed border-border/70 bg-card/50 px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted/70">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">
                  {debouncedSearch
                    ? 'No encontramos resultados para tu busqueda'
                    : filter === 'following'
                    ? 'Aun no hay workouts de tu circulo'
                    : filter === 'favorites'
                    ? 'Aun no tienes favoritos'
                    : 'Todavia no hay workouts publicos'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {debouncedSearch
                    ? 'Prueba con otro titulo, creador o tag para seguir explorando.'
                    : filter === 'following'
                    ? 'Empieza a seguir a gente o crea tu propio workout para verlo aqui.'
                    : filter === 'favorites'
                    ? 'Toca el corazon de un workout para guardarlo aqui.'
                    : 'Cuando haya workouts visibles aqui, apareceran en este feed.'}
                </p>
                {(debouncedSearch || filter === 'following' || filter === 'favorites') && (
                  <Button
                    variant="ghost"
                    className="mt-4"
                    onClick={() => {
                      setSearch('')
                      setFilter('all')
                    }}
                  >
                    {debouncedSearch ? 'Limpiar busqueda' : 'Ver feed publico'}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
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
