import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { RefreshCcw, Trophy } from 'lucide-react-native'

import { formatDuration } from '@mygym/shared'
import { StatusScreen } from '@/components/ui'
import { ChallengeExecutionView, ExecutionView } from '@/components/workout'
import { fetchWorkoutById, type WorkoutDetail, type WorkoutDetailSection } from '@/lib/workouts'

// Orquesta la sesión completa de un workout — el pedacito que faltaba entre
// WorkoutOverview ("Empezar entrenamiento") y los dos componentes de
// ejecución (ver ExecutionView.tsx/ChallengeExecutionView.tsx: cada uno ya
// es independiente y se basta solo, pero ninguno sabe del otro). Acá sí se
// decide "cuál toca ahora":
//   - Sin sección de reto: un solo segmento, ExecutionView con todas las
//     secciones.
//   - Con sección de reto: hasta 3 segmentos en orden — las secciones antes
//     del reto (ExecutionView), el reto (ChallengeExecutionView), las
//     secciones después (ExecutionView) — salteando los que queden vacíos.
// No es la orquestación completa de la web (WorkoutChangeTypeView como
// pantalla de transición entre segmentos, resume de sesión activa, log a la
// base): acá el cambio de segmento es directo, y al terminar el último se
// ve un resumen simple en esta misma pantalla en vez de navegar a otra.
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
  const [totalRounds, setTotalRounds] = useState<number | null>(null)
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

  const advanceOrFinish = (durationSeconds: number, roundsCompleted?: number) => {
    setTotalDurationSeconds((d) => d + durationSeconds)
    if (typeof roundsCompleted === 'number') {
      setTotalRounds((r) => (r ?? 0) + roundsCompleted)
    }
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
    return <SessionCompletedView durationSeconds={totalDurationSeconds} rounds={totalRounds} onDone={() => router.back()} />
  }

  const segment = segments[segmentIndex]

  if (segment.kind === 'challenge') {
    return (
      <ChallengeExecutionView
        workout={workout}
        onExit={handleExit}
        onComplete={({ roundsCompleted, elapsedSeconds }) => advanceOrFinish(elapsedSeconds, roundsCompleted)}
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

function SessionCompletedView({
  durationSeconds,
  rounds,
  onDone,
}: {
  durationSeconds: number
  rounds: number | null
  onDone: () => void
}) {
  return (
    <View style={styles.completedContainer}>
      <View style={styles.completedIcon}>
        <Trophy size={40} color="#22c55e" />
      </View>
      <Text style={styles.completedTitle}>¡Entrenamiento completado!</Text>
      <Text style={styles.completedDuration}>{formatDuration(durationSeconds, { style: 'clock' })}</Text>
      {rounds !== null ? (
        <Text style={styles.completedRounds}>
          {rounds} ronda{rounds === 1 ? '' : 's'} en el reto
        </Text>
      ) : null}
      <Pressable onPress={onDone} style={styles.completedButton}>
        <Text style={styles.completedButtonText}>Volver al workout</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#050816',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedContainer: {
    flex: 1,
    backgroundColor: '#050816',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  completedIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,197,94,0.15)',
    marginBottom: 8,
  },
  completedTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  completedDuration: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  completedRounds: {
    color: '#6ee7b7',
    fontSize: 14,
    fontWeight: '700',
  },
  completedButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#22c55e',
  },
  completedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
})
