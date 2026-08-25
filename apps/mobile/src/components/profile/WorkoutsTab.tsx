import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { RefreshCcw } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { FluidTabs, StatusScreen, type FluidTabOption } from '@/components/ui'
import { CommentsSheet, WorkoutCard } from '@/components/workout'
import {
  fetchFavoriteWorkouts,
  fetchMyWorkouts,
  setWorkoutLiked,
  type FeedWorkout,
  type MyWorkout,
  type MyWorkoutsFilter,
} from '@/lib/workouts'
import { useAsyncData } from '@/hooks/useAsyncData'
import { MyWorkoutCard } from './MyWorkoutCard'

const VISIBILITY_OPTIONS: FluidTabOption<MyWorkoutsFilter>[] = [
  { value: 'all', label: 'Todos' },
  { value: 'public', label: 'Públicos' },
  { value: 'followers', label: 'Seguidores' },
  { value: 'draft', label: 'Borradores' },
  { value: 'private', label: 'Privados' },
  { value: 'favorites', label: 'Favoritos' },
]

interface WorkoutsTabProps {
  userId: string
}

// Tab "Workouts" del perfil: los workouts del usuario, filtrados por
// visibilidad — puerto de la sección "Tus workouts" de
// src/app/(app)/profile/page.tsx (apps/web). Crear workout nuevo vive en el
// botón central del tab bar (ver app/(tabs)/_layout.tsx), no acá.
//
// "Favoritos" es un filtro más de la misma fila, pero una fuente de datos
// distinta: no son los workouts que CREÓ el usuario (fetchMyWorkouts,
// siempre .eq('user_id', userId)) sino los que LIKEÓ (fetchFavoriteWorkouts,
// de cualquier autor) — por eso usa <WorkoutCard>, la genérica del feed que
// sabe mostrar o no los botones de editar/borrar según ownership, en vez de
// <MyWorkoutCard> (que asume que todo lo que lista es propio).
export function WorkoutsTab({ userId }: WorkoutsTabProps) {
  const theme = useTheme()
  const [filter, setFilter] = useState<MyWorkoutsFilter>('all')
  const isFavorites = filter === 'favorites'

  const {
    data: workouts,
    loading: workoutsLoading,
    error: workoutsError,
    reload: loadWorkouts,
  } = useAsyncData<MyWorkout[]>(
    () => (isFavorites ? null : fetchMyWorkouts(userId, filter)),
    [userId, filter],
    'No se pudieron cargar tus workouts'
  )

  const {
    data: favorites,
    loading: favoritesLoading,
    error: favoritesError,
    reload: loadFavorites,
  } = useAsyncData<FeedWorkout[]>(
    () => (isFavorites ? fetchFavoriteWorkouts(userId) : null),
    [userId, filter],
    'No se pudieron cargar tus favoritos'
  )

  const [commentsWorkoutId, setCommentsWorkoutId] = useState<string | null>(null)
  const [likePendingIds, setLikePendingIds] = useState<Set<string>>(new Set())

  // Same pattern as WorkoutsTab.tsx's original useFocusEffect: refresca
  // (silencioso) al volver de editar/borrar en otra pantalla — sea cual sea
  // el loader activo en este momento.
  const loadRef = useRef(isFavorites ? loadFavorites : loadWorkouts)
  useEffect(() => {
    loadRef.current = isFavorites ? loadFavorites : loadWorkouts
  }, [isFavorites, loadFavorites, loadWorkouts])

  useFocusEffect(
    useCallback(() => {
      loadRef.current({ silent: true })
    }, [])
  )

  const handleToggleLike = async (workout: FeedWorkout) => {
    if (likePendingIds.has(workout.id)) return
    const nextLiked = !workout.is_liked
    setLikePendingIds((prev) => new Set(prev).add(workout.id))

    try {
      await setWorkoutLiked(workout.id, userId, nextLiked)
      // A diferencia del feed (donde "unlike" solo apaga el corazón),
      // sacarle el like a un workout ACÁ significa que deja de ser
      // favorito — recargar en vez de mutar en memoria para que la lista
      // quede consistente con lo que hay en workout_likes.
      loadFavorites({ silent: true })
    } finally {
      setLikePendingIds((prev) => {
        const next = new Set(prev)
        next.delete(workout.id)
        return next
      })
    }
  }

  const handleStartWorkout = (workout: FeedWorkout) => {
    router.push({ pathname: '/workout/[id]', params: { id: workout.id } })
  }

  const header = (
    <View style={styles.listHeader}>
      <FluidTabs options={VISIBILITY_OPTIONS} value={filter} onChange={setFilter} scrollable />
    </View>
  )

  if (isFavorites) {
    return (
      <>
        <FlatList
          data={favorites ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={header}
          renderItem={({ item }) => (
            <WorkoutCard
              workout={item}
              onToggleLike={handleToggleLike}
              onStart={handleStartWorkout}
              onOpenComments={(w) => setCommentsWorkoutId(w.id)}
              likePending={likePendingIds.has(item.id)}
              viewerId={userId}
              onDeleted={() => loadFavorites({ silent: true })}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            favoritesLoading ? (
              <ActivityIndicator color={theme.colors.primary} style={styles.centered} />
            ) : favoritesError ? (
              <StatusScreen
                fill={false}
                icon={RefreshCcw}
                tone="error"
                title="No pudimos cargar tus favoritos"
                description={favoritesError}
                primaryAction={{ label: 'Reintentar', onPress: () => loadFavorites() }}
              />
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
                Todavía no marcaste ningún workout como favorito.
              </Text>
            )
          }
        />
        <CommentsSheet workoutId={commentsWorkoutId} onClose={() => setCommentsWorkoutId(null)} />
      </>
    )
  }

  return (
    <FlatList
      data={workouts ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={header}
      renderItem={({ item }) => <MyWorkoutCard workout={item} onDeleted={loadWorkouts} />}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListEmptyComponent={
        workoutsLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.centered} />
        ) : workoutsError ? (
          <StatusScreen
            fill={false}
            icon={RefreshCcw}
            tone="error"
            title="No pudimos cargar tus workouts"
            description={workoutsError}
            primaryAction={{ label: 'Reintentar', onPress: loadWorkouts }}
          />
        ) : (
          <Text style={[styles.emptyText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
            {filter === 'all' ? 'Todavía no creaste workouts.' : 'No tenés workouts con este filtro.'}
          </Text>
        )
      }
    />
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 14,
  },
  centered: {
    marginTop: 24,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
})
