import { router, useLocalSearchParams } from 'expo-router'
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

  if (loading) {
    return <WorkoutOverviewSkeleton />
  }

  if (error || !workout) {
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
