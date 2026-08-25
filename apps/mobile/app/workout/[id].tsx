import { useCallback, useEffect, useRef } from 'react'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { RefreshCcw } from 'lucide-react-native'

import { StatusScreen } from '@/components/ui'
import { WorkoutOverview, WorkoutOverviewSkeleton } from '@/components/workout'
import { fetchWorkoutById, type WorkoutDetail } from '@/lib/workouts'
import { useAsyncData } from '@/hooks/useAsyncData'

// Preview que se ve al tocar "Comenzar workout" en el feed — puerto de
// src/app/workout/[id]/page.tsx (apps/web), pero solo la parte de
// WorkoutOverview. "Empezar entrenamiento" navega a /session/[id] (ver
// app/session/[id].tsx), que orquesta ExecutionView/ChallengeExecutionView.
export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const {
    data: workout,
    loading,
    error,
    reload: load,
  } = useAsyncData<WorkoutDetail>(() => (id ? fetchWorkoutById(id) : null), [id], 'No se pudo cargar el workout')

  // Si el usuario edita este workout desde otra pestaña (acá no hay botón
  // de editar, pero sí en WorkoutCard/MyWorkoutCard) mientras esta pantalla
  // sigue montada más abajo en el stack del tab Feed (Expo Router no la
  // desmonta al cambiar de tab), se refresca sola al volver — silent:true
  // para no taparla con el skeleton solo por volver de "Empezar
  // entrenamiento" (el caso común, sin ningún cambio real de por medio).
  // `load` en un ref (no como dependencia directa) por lo mismo que en
  // WorkoutsTab.tsx: si cambiara `id` con la pantalla ya enfocada, un
  // callback dependiente de `load` dispararía el refetch dos veces.
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  }, [load])

  useFocusEffect(
    useCallback(() => {
      loadRef.current({ silent: true })
    }, [])
  )

  // `!workout` primero en las dos condiciones (no `loading`/`error` solos):
  // el refresh silencioso del useFocusEffect puede dejar `loading`/`error`
  // en cualquier estado de fondo sin tocar `workout` si ya lo teníamos
  // cargado — sin este orden, un refresh de fondo que tarda o falla al
  // volver de la sesión reemplazaba una vista que ya andaba bien por un
  // skeleton o una pantalla de error, cuando lo correcto es que un refresh
  // silencioso sea eso: silencioso.
  if (loading && !workout) {
    return <WorkoutOverviewSkeleton />
  }

  if (!workout) {
    return (
      <StatusScreen
        icon={RefreshCcw}
        tone="error"
        title="No pudimos cargar el workout"
        description={error ?? 'Workout no encontrado'}
        primaryAction={{ label: 'Reintentar', onPress: load }}
        secondaryAction={{ label: 'Volver', onPress: () => router.back() }}
      />
    )
  }

  return (
    <WorkoutOverview
      workout={workout}
      onBack={() => router.back()}
      onStart={() => router.push({ pathname: '/session/[id]', params: { id: workout.id } })}
    />
  )
}
