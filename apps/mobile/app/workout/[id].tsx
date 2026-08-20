import { useCallback, useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { RefreshCcw } from 'lucide-react-native'

import { StatusScreen } from '@/components/ui'
import { WorkoutOverview, WorkoutOverviewSkeleton } from '@/components/workout'
import { fetchWorkoutById, type WorkoutDetail } from '@/lib/workouts'

// Preview que se ve al tocar "Comenzar workout" en el feed — puerto de
// src/app/workout/[id]/page.tsx (apps/web), pero solo la parte de
// WorkoutOverview. "Empezar entrenamiento" navega a /session/[id] (ver
// app/session/[id].tsx), que orquesta ExecutionView/ChallengeExecutionView.
export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetchWorkoutById(id)
      .then(setWorkout)
      .catch((err: any) => setError(err?.message ?? 'No se pudo cargar el workout'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

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
