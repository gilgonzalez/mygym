import { useCallback, useEffect, useRef, useState } from 'react'
import { router } from 'expo-router'
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { RefreshCcw, Search, TrendingUp, Users } from 'lucide-react-native'

import { useSession } from '@/lib/session'
import { useTheme } from '@/theme'
import { SegmentedControl, StatusScreen, TextField, type SegmentedOption } from '@/components/ui'
import { CommentsSheet, WorkoutCard, WorkoutCardSkeleton } from '@/components/workout'
import {
  fetchFeedPage,
  setWorkoutLiked,
  type FeedFilter,
  type FeedSort,
  type FeedWorkout,
} from '@/lib/workouts'

// Feed autenticado — puerto de src/app/(app)/feed/page.tsx (apps/web). Vive
// bajo el grupo (tabs) (ver _layout.tsx de acá al lado): la sesión ya está
// garantizada por <Stack.Protected guard={!!session}> en el layout raíz, así
// que a diferencia del viejo app/index.tsx esta pantalla no necesita
// resolver "¿hay sesión o no?" ella misma, solo leerla con useSession().
const SORT_OPTIONS: SegmentedOption<'newest' | 'popular' | 'following'>[] = [
  { value: 'newest', label: 'Nuevo' },
  { value: 'popular', label: 'Popular', icon: TrendingUp },
  { value: 'following', label: 'Mi círculo', icon: Users },
]

export default function FeedScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { session } = useSession()
  // Garantizado por el guard del layout raíz — esta pantalla no se monta sin
  // sesión.
  const viewerId = session!.user.id

  const [sortBy, setSortBy] = useState<FeedSort>('newest')
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [workouts, setWorkouts] = useState<FeedWorkout[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [likePendingIds, setLikePendingIds] = useState<Set<string>>(new Set())
  const [spotlightId, setSpotlightId] = useState<string | null>(null)
  // Una sola instancia del sheet de comentarios para todo el feed, no una
  // por card (ver CommentsSheet.tsx) — acá solo guardamos cuál workout tiene
  // que mostrar.
  const [commentsWorkoutId, setCommentsWorkoutId] = useState<string | null>(null)

  const requestId = useRef(0)
  // La card 100% visible en pantalla es la que prende el NeonBorder (ver
  // WorkoutCard). Referencias estables para que FlatList no las recree en
  // cada render (viewabilityConfig/onViewableItemsChanged tienen que ser
  // las mismas funciones entre renders o React Native tira warning).
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 100 }).current
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item: FeedWorkout }> }) => {
    setSpotlightId(viewableItems[0]?.item.id ?? null)
  }).current

  // El SegmentedControl trabaja con un solo valor activo; lo derivamos de
  // (sortBy, filter) y lo traducimos de vuelta al cambiar.
  const activeSegment = filter === 'following' ? 'following' : sortBy === 'popular' ? 'popular' : 'newest'
  const handleSegmentChange = (next: 'newest' | 'popular' | 'following') => {
    if (next === 'following') {
      setFilter('following')
      setSortBy('newest')
    } else {
      setFilter('all')
      setSortBy(next)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const loadPage = useCallback(
    async (pageToLoad: number, mode: 'replace' | 'append') => {
      const myRequestId = ++requestId.current
      if (mode === 'replace') {
        setLoadingInitial(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      try {
        const result = await fetchFeedPage({
          page: pageToLoad,
          sortBy,
          filter,
          search: debouncedSearch,
          viewerId,
        })
        if (myRequestId !== requestId.current) return

        setWorkouts((prev) => (mode === 'replace' ? result.workouts : [...prev, ...result.workouts]))
        setHasMore(result.hasMore)
        setPage(pageToLoad)
      } catch (err: any) {
        if (myRequestId !== requestId.current) return
        setError(err?.message ?? 'Ocurrió un error inesperado al cargar el feed.')
      } finally {
        if (myRequestId === requestId.current) {
          setLoadingInitial(false)
          setLoadingMore(false)
          setRefreshing(false)
        }
      }
    },
    [sortBy, filter, debouncedSearch, viewerId]
  )

  // Se resetea a la página 1 cada vez que cambian los filtros/búsqueda.
  useEffect(() => {
    loadPage(1, 'replace')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, filter, debouncedSearch, viewerId])

  const handleRefresh = () => {
    setRefreshing(true)
    loadPage(1, 'replace')
  }

  const handleLoadMore = () => {
    if (loadingInitial || loadingMore || !hasMore) return
    loadPage(page + 1, 'append')
  }

  const handleToggleLike = async (workout: FeedWorkout) => {
    if (likePendingIds.has(workout.id)) return

    const nextLiked = !workout.is_liked
    setLikePendingIds((prev) => new Set(prev).add(workout.id))
    // Update optimista, igual que useWorkoutCardActions en la web.
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workout.id
          ? { ...w, is_liked: nextLiked, likes_count: w.likes_count + (nextLiked ? 1 : -1) }
          : w
      )
    )

    try {
      await setWorkoutLiked(workout.id, viewerId, nextLiked)
    } catch {
      // Revert si falla.
      setWorkouts((prev) =>
        prev.map((w) =>
          w.id === workout.id
            ? { ...w, is_liked: workout.is_liked, likes_count: workout.likes_count }
            : w
        )
      )
    } finally {
      setLikePendingIds((prev) => {
        const next = new Set(prev)
        next.delete(workout.id)
        return next
      })
    }
  }

  // Abre el preview (WorkoutOverview, ver app/workout/[id].tsx) — la
  // ejecución real todavía no está portada, así que el feedback honesto
  // ("Próximamente...") se movió un paso más adentro, al botón "Empezar
  // entrenamiento" de esa pantalla.
  const handleStartWorkout = (workout: FeedWorkout) => {
    router.push({ pathname: '/workout/[id]', params: { id: workout.id } })
  }

  return (
    <View style={[styles.feedContainer, { backgroundColor: theme.colors.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.feedHeader}>
        <TextField
          icon={Search}
          placeholder="Buscar por título o descripción"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          pill
        />

        <View style={styles.tabs}>
          <SegmentedControl options={SORT_OPTIONS} value={activeSegment} onChange={handleSegmentChange} />
        </View>
      </View>

      {loadingInitial ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={i > 1 && styles.skeletonSpacing}>
              <WorkoutCardSkeleton />
            </View>
          ))}
        </ScrollView>
      ) : error ? (
        <StatusScreen
          icon={RefreshCcw}
          tone="error"
          title="No pudimos cargar el feed"
          description={error}
          primaryAction={{ label: 'Reintentar', onPress: () => loadPage(1, 'replace') }}
        />
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(280).delay(Math.min(index, 6) * 40)}>
              <WorkoutCard
                workout={item}
                onToggleLike={handleToggleLike}
                onStart={handleStartWorkout}
                onOpenComments={(w) => setCommentsWorkoutId(w.id)}
                likePending={likePendingIds.has(item.id)}
                spotlight={item.id === spotlightId}
              />
            </Animated.View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
          }
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          onEndReachedThreshold={0.4}
          onEndReached={handleLoadMore}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={[styles.subtitle, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
                {debouncedSearch
                  ? 'No encontramos resultados para tu búsqueda'
                  : filter === 'following'
                  ? 'Todavía no hay workouts de tu círculo'
                  : 'Todavía no hay workouts públicos'}
              </Text>
            </View>
          }
        />
      )}

      <CommentsSheet workoutId={commentsWorkoutId} onClose={() => setCommentsWorkoutId(null)} />
    </View>
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  feedContainer: {
    flex: 1,
  },
  feedHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  skeletonSpacing: {
    marginTop: 14,
  },
  footerLoading: {
    paddingVertical: 20,
  },
})
