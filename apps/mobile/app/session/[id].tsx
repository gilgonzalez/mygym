import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { RefreshCcw } from 'lucide-react-native'

import { StatusScreen } from '@/components/ui'
import { ChallengeExecutionView, ExecutionView, WorkoutCompletedView } from '@/components/workout'
import { fetchWorkoutById, type WorkoutDetail, type WorkoutDetailSection } from '@/lib/workouts'

// Orquesta la sesión completa de un workout — el pedacito que faltaba entre
// WorkoutOverview ("Empezar entrenamiento") y los componentes de ejecución
// (ver ExecutionView.tsx/ChallengeExecutionView.tsx: cada uno ya es
// independiente y se basta solo, pero ninguno sabe del otro). Acá sí se
// decide "cuál toca ahora":
//   - Sin sección de reto: un solo segmento, ExecutionView con todas las
//     secciones.
//   - Con sección de reto: hasta 3 segmentos en orden — las secciones antes
//     del reto (ExecutionView), el reto (ChallengeExecutionView), las
//     secciones después (ExecutionView) — salteando los que queden vacíos.
// No es la orquestación completa de la web (WorkoutChangeTypeView como
// pantalla de transición entre segmentos, resume de sesión activa): acá el
// cambio de segmento es directo. Al terminar el último sí se registra el
// workout_log — como en la web — vía WorkoutCompletedView.tsx.
type Segment = { kind: 'normal'; sections: WorkoutDetailSection[] } | { kind: 'challenge' }

function buildSegments(workout: WorkoutDetail): Segment[] {
  const challengeIndex = workout.challenge
    ? workout.sections.findIndex((s) => s.id === workout.challenge!.challengeSectionId)
    : -1

  if (challengeIndex < 0) {
    return workout.sections.length > 0 ? [{ kind: 'normal', sections: workout.sections }] : []
  }

  const before = workout.sections.slice(0, challengeIndex)
  const after = workout.sections.slice(challengeIndex + 1)
  const segments: Segment[] = []
  if (before.length > 0) segments.push({ kind: 'normal', sections: before })
  segments.push({ kind: 'challenge' })
  if (after.length > 0) segments.push({ kind: 'normal', sections: after })
  return segments
}

export default function WorkoutSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [segmentIndex, setSegmentIndex] = useState(0)
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(0)
  // Resultado de la sección de reto (si el workout tiene una) — capturado
  // cuando ese segmento termina, para adjuntarlo al log final sin importar
  // en qué posición cae dentro de los segmentos. Mismo criterio que
  // sectionChallengeResult en workout/[id]/page.tsx (apps/web).
  const [challengeResult, setChallengeResult] = useState<{ roundsCompleted: number; timeCapSeconds: number } | null>(null)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchWorkoutById(id)
      .then(setWorkout)
      .catch((err: any) => setError(err?.message ?? 'No se pudo cargar el workout'))
      .finally(() => setLoading(false))
  }, [id])

  const segments = useMemo(() => (workout ? buildSegments(workout) : []), [workout])

  const handleExit = () => router.back()

  const advanceOrFinish = (durationSeconds: number) => {
    setTotalDurationSeconds((d) => d + durationSeconds)
    setSegmentIndex((i) => {
      if (i + 1 >= segments.length) {
        setIsDone(true)
        return i
      }
      return i + 1
    })
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#fff" />
      </View>
    )
  }

  if (error || !workout) {
    return (
      <StatusScreen
        icon={RefreshCcw}
        tone="error"
        title="No pudimos cargar el workout"
        description={error ?? 'Workout no encontrado'}
        primaryAction={{ label: 'Volver', onPress: () => router.back() }}
      />
    )
  }

  if (segments.length === 0) {
    return (
      <StatusScreen
        icon={RefreshCcw}
        tone="warning"
        title="Este workout no tiene ejercicios"
        primaryAction={{ label: 'Volver', onPress: () => router.back() }}
      />
    )
  }

  if (isDone) {
    return (
      <WorkoutCompletedView
        workout={workout}
        durationSeconds={totalDurationSeconds}
        challengeResult={challengeResult}
        onSaved={() => router.replace('/profile')}
        onSkip={() => router.back()}
      />
    )
  }

  const segment = segments[segmentIndex]

  if (segment.kind === 'challenge') {
    return (
      <ChallengeExecutionView
        workout={workout}
        onExit={handleExit}
        onComplete={({ roundsCompleted, elapsedSeconds }) => {
          setChallengeResult({ roundsCompleted, timeCapSeconds: workout.challenge?.timeCapSeconds ?? 0 })
          advanceOrFinish(elapsedSeconds)
        }}
      />
    )
  }

  return (
    <ExecutionView
      // key fuerza a remontar entre segmentos (secciones distintas): así el
      // cursor interno de ExecutionView arranca limpio en 0 en vez de
      // arrastrar el del segmento anterior.
      key={segmentIndex}
      workout={{ ...workout, sections: segment.sections }}
      onExit={handleExit}
      onComplete={({ durationSeconds }) => advanceOrFinish(durationSeconds)}
    />
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#050816',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
