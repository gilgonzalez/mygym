import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import { RefreshCcw } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { FluidTabs, StatusScreen, type FluidTabOption } from '@/components/ui'
import { fetchMyWorkouts, type MyWorkout, type MyWorkoutsFilter } from '@/lib/workouts'
import { MyWorkoutCard } from './MyWorkoutCard'

const VISIBILITY_OPTIONS: FluidTabOption<MyWorkoutsFilter>[] = [
  { value: 'all', label: 'Todos' },
  { value: 'public', label: 'Públicos' },
  { value: 'followers', label: 'Seguidores' },
  { value: 'draft', label: 'Borradores' },
  { value: 'private', label: 'Privados' },
]

interface WorkoutsTabProps {
  userId: string
}

// Tab "Workouts" del perfil: los workouts que generó el usuario, filtrados
// por visibilidad — puerto de la sección "Tus workouts" de
// src/app/(app)/profile/page.tsx (apps/web), sin el buscador ni "crear
// nuevo" (el editor todavía no está portado a mobile).
export function WorkoutsTab({ userId }: WorkoutsTabProps) {
  const theme = useTheme()
  const [filter, setFilter] = useState<MyWorkoutsFilter>('all')
  const [workouts, setWorkouts] = useState<MyWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchMyWorkouts(userId, filter)
      .then(setWorkouts)
      .catch((err: any) => setError(err?.message ?? 'No se pudieron cargar tus workouts'))
      .finally(() => setLoading(false))
  }, [userId, filter])

  useEffect(() => {
    load()
  }, [load])

  return (
    <FlatList
      data={workouts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <FluidTabs options={VISIBILITY_OPTIONS} value={filter} onChange={setFilter} scrollable />
        </View>
      }
      renderItem={({ item }) => <MyWorkoutCard workout={item} />}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.centered} />
        ) : error ? (
          <StatusScreen
            fill={false}
            icon={RefreshCcw}
            tone="error"
            title="No pudimos cargar tus workouts"
            description={error}
            primaryAction={{ label: 'Reintentar', onPress: load }}
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
