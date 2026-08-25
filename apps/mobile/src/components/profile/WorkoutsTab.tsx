import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { RefreshCcw } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { FluidTabs, StatusScreen, type FluidTabOption } from '@/components/ui'
import { fetchMyWorkouts, type MyWorkout, type MyWorkoutsFilter } from '@/lib/workouts'
import { useAsyncData } from '@/hooks/useAsyncData'
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
// src/app/(app)/profile/page.tsx (apps/web). Crear workout nuevo vive en el
// botón central del tab bar (ver app/(tabs)/_layout.tsx), no acá — esta
// pantalla solo lista/edita/borra los que ya existen.
export function WorkoutsTab({ userId }: WorkoutsTabProps) {
  const theme = useTheme()
  const [filter, setFilter] = useState<MyWorkoutsFilter>('all')
  const {
    data: workouts,
    loading,
    error,
    reload: load,
  } = useAsyncData<MyWorkout[]>(() => fetchMyWorkouts(userId, filter), [userId, filter], 'No se pudieron cargar tus workouts')

  // useFocusEffect (no solo el fetch inicial de useAsyncData) para que la
  // lista se refresque sola al volver de editar un workout — el editor es un
  // push encima de este stack (mismo criterio que profile.tsx con
  // "Editar información"), así que este tab nunca se desmonta y un
  // useEffect común no se entera del cambio. El borrado ya se manejaba
  // (MyWorkoutCard llama a onDeleted={load} directo), pero editar no
  // disparaba ningún reload — la card seguía mostrando título/portada/etc.
  // viejos hasta salir y volver a entrar al tab a mano.
  //
  // `load` en un ref, no como dependencia directa del callback: `load`
  // cambia de identidad cada vez que cambia `filter` (useAsyncData lo
  // recrea por sus deps [userId, filter]), y si el callback de
  // useFocusEffect dependiera de eso, React Navigation lo vuelve a correr
  // de inmediato por el cambio de referencia, no por un foco real — pedía
  // la lista dos veces cada vez que tocabas un tab de visibilidad.
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  }, [load])

  useFocusEffect(
    useCallback(() => {
      loadRef.current({ silent: true })
    }, [])
  )

  return (
    <FlatList
      data={workouts ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <FluidTabs options={VISIBILITY_OPTIONS} value={filter} onChange={setFilter} scrollable />
        </View>
      }
      renderItem={({ item }) => <MyWorkoutCard workout={item} onDeleted={load} />}
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
