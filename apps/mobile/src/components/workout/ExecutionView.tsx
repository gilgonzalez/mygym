import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { CheckCircle2, ChevronLeft, ChevronRight, Dumbbell, Info, Pause, Play, SkipForward } from 'lucide-react-native'

import { formatDuration } from '@mygym/shared'
import { useTheme } from '@/theme'
import { Badge, Sheet, usePressScale } from '@/components/ui'
import type { WorkoutDetail, WorkoutDetailExercise, WorkoutDetailSection } from '@/lib/workouts'
import { SessionBackground } from './SessionBackground'
import { SessionMediaRing } from './SessionMediaRing'

// Puerto de WorkoutExecutionView.tsx (apps/web) — componente independiente,
// no requiere un store externo: administra su propio cursor (sección/
// ejercicio/serie), countdown y reloj global. La versión web reparte la
// MISMA información en 3-4 lugares distintos (header desktop, header
// mobile, badges arriba del círculo, texto debajo) porque tiene un layout
// responsive doble (desktop/mobile) que acá no hace falta — esto es
// siempre "mobile". Achicado a lo esencial, sin duplicar nada:
//   - nombre + imagen + cronómetro → un solo lugar, en el círculo central.
//   - "serie actual" y "ronda actual dentro de la sección" → dos chips,
//     una sola vez cada uno (ronda = posición en la secuencia ejercicio×serie
//     circuito completo; con 3 ejercicios × 3 series son 9 rondas — no es
//     lo mismo que "serie actual", por eso van separados).
//   - reloj global de la sesión → arriba a la derecha, chico, aparte del
//     cronómetro de la actividad actual.
// Todo lo no esencial (descripción, músculos, equipo) va a un <Sheet> con
// el botón "i", en vez de ocupar pantalla siempre.
interface ExecutionViewProps {
  workout: WorkoutDetail
  onExit: () => void
  onComplete: (summary: { durationSeconds: number }) => void
}

type Stage = 'prepare' | 'exercise' | 'rest'

interface Cursor {
  sectionIndex: number
  exerciseIndex: number
  set: number
}

const PREPARE_SECONDS = 5

function maxSetsOf(exercises: WorkoutDetailExercise[]) {
  return Math.max(...exercises.map((e) => Math.max(e.sets, 1)), 1)
}

// Orden "circuito": todas las series 1 de cada ejercicio, después todas las
// series 2, etc. — mismo criterio que el roadmap de la web (ver
// getVisibleSeriesNumber en WorkoutExecutionView.tsx). Un ejercicio con
// menos series que otros dentro de la misma sección deja de aparecer en las
// rondas finales.
function nextCursor(workout: WorkoutDetail, cursor: Cursor): Cursor | null {
  const section = workout.sections[cursor.sectionIndex]
  const exercises = section.exercises
  const maxSets = maxSetsOf(exercises)

  for (let i = cursor.exerciseIndex + 1; i < exercises.length; i++) {
    if (Math.max(exercises[i].sets, 1) >= cursor.set) {
      return { sectionIndex: cursor.sectionIndex, exerciseIndex: i, set: cursor.set }
    }
  }

  for (let s = cursor.set + 1; s <= maxSets; s++) {
    for (let i = 0; i < exercises.length; i++) {
      if (Math.max(exercises[i].sets, 1) >= s) {
        return { sectionIndex: cursor.sectionIndex, exerciseIndex: i, set: s }
      }
    }
  }

  for (let sec = cursor.sectionIndex + 1; sec < workout.sections.length; sec++) {
    if (workout.sections[sec].exercises.length > 0) {
      return { sectionIndex: sec, exerciseIndex: 0, set: 1 }
    }
  }

  return null
}

// Espejo de nextCursor recorriendo el circuito al revés — para el botón de
// "atrás". Vuelve al último (ejercicio, serie) válido de la sección
// anterior cuando se cruza el borde de la sección actual.
function prevCursor(workout: WorkoutDetail, cursor: Cursor): Cursor | null {
  const section = workout.sections[cursor.sectionIndex]
  const exercises = section.exercises

  for (let i = cursor.exerciseIndex - 1; i >= 0; i--) {
    if (Math.max(exercises[i].sets, 1) >= cursor.set) {
      return { sectionIndex: cursor.sectionIndex, exerciseIndex: i, set: cursor.set }
    }
  }

  for (let s = cursor.set - 1; s >= 1; s--) {
    for (let i = exercises.length - 1; i >= 0; i--) {
      if (Math.max(exercises[i].sets, 1) >= s) {
        return { sectionIndex: cursor.sectionIndex, exerciseIndex: i, set: s }
      }
    }
  }

  for (let sec = cursor.sectionIndex - 1; sec >= 0; sec--) {
    const prevSection = workout.sections[sec]
    if (prevSection.exercises.length === 0) continue

    const maxSets = maxSetsOf(prevSection.exercises)
    for (let s = maxSets; s >= 1; s--) {
      for (let i = prevSection.exercises.length - 1; i >= 0; i--) {
        if (Math.max(prevSection.exercises[i].sets, 1) >= s) {
          return { sectionIndex: sec, exerciseIndex: i, set: s }
        }
      }
    }
  }

  return null
}

function getRoundInfo(section: WorkoutDetailSection, cursor: Cursor) {
  const exercises = section.exercises
  const maxSets = maxSetsOf(exercises)
  let total = 0
  let current = 1

  for (let s = 1; s <= maxSets; s++) {
    for (let i = 0; i < exercises.length; i++) {
      if (Math.max(exercises[i].sets, 1) >= s) {
        total += 1
        if (s === cursor.set && i === cursor.exerciseIndex) current = total
      }
    }
  }

  return { current, total: total || 1 }
}

const STAGE_COLOR: Record<Stage, string> = {
  prepare: '#38bdf8',
  exercise: '#22c55e',
  rest: '#f97316',
}

const STAGE_LABEL: Record<Stage, string> = {
  prepare: 'Prepárate',
  exercise: 'Actividad',
  rest: 'Descanso',
}

export function ExecutionView({ workout, onExit, onComplete }: ExecutionViewProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [cursor, setCursor] = useState<Cursor>({ sectionIndex: 0, exerciseIndex: 0, set: 1 })
  const [stage, setStage] = useState<Stage>('prepare')
  const [timeLeft, setTimeLeft] = useState(PREPARE_SECONDS)
  const [isPaused, setIsPaused] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const prevTimeLeftRef = useRef(timeLeft)
  const hasCompletedRef = useRef(false)

  const section = workout.sections[cursor.sectionIndex]
  const exercise = section?.exercises[cursor.exerciseIndex]
  const hasTimer = stage !== 'exercise' || exercise?.type !== 'reps'

  const totalDuration =
    stage === 'prepare'
      ? PREPARE_SECONDS
      : stage === 'rest'
        ? Math.max(exercise?.rest ?? 0, 0)
        : exercise?.type === 'reps'
          ? 0
          : Math.max(exercise?.duration || 30, 1)

  const stageKey = `${stage}-${cursor.sectionIndex}-${cursor.exerciseIndex}-${cursor.set}`

  // Reinicia el countdown al entrar a una etapa nueva (prepare/exercise/rest
  // de un ejercicio distinto).
  useEffect(() => {
    setTimeLeft(totalDuration)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageKey])

  const advanceStage = () => {
    if (!section || !exercise) return

    if (stage === 'prepare') {
      setStage('exercise')
      return
    }

    if (stage === 'exercise') {
      if ((exercise.rest || 0) > 0) {
        setStage('rest')
      } else {
        goNext()
      }
      return
    }

    goNext()
  }

  const goNext = () => {
    const next = nextCursor(workout, cursor)
    if (!next) {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true
        onComplete({ durationSeconds: elapsedSeconds })
      }
      return
    }
    setCursor(next)
    setStage('exercise')
  }

  // Vuelve al ejercicio anterior — siempre a su etapa "exercise" (no tiene
  // sentido volver a mitad de un descanso), con el countdown arrancando de
  // nuevo. No resta del reloj global: ese cuenta tiempo de sesión real, no
  // se "deshace" al navegar.
  const goPrev = () => {
    const prev = prevCursor(workout, cursor)
    if (!prev) return
    setCursor(prev)
    setStage('exercise')
  }

  // Cuenta regresiva de la etapa actual.
  useEffect(() => {
    if (isPaused || isInfoOpen || !hasTimer || timeLeft <= 0) return
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [isPaused, isInfoOpen, hasTimer, timeLeft])

  // Dispara el avance de etapa una sola vez, al cruzar a 0 (no en cada
  // render mientras timeLeft se queda en 0).
  useEffect(() => {
    const prev = prevTimeLeftRef.current
    prevTimeLeftRef.current = timeLeft
    if (!hasTimer || timeLeft > 0 || prev <= 0) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    advanceStage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, hasTimer])

  useEffect(() => {
    if (hasTimer && timeLeft > 0 && timeLeft <= 3) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    }
  }, [hasTimer, timeLeft])

  // Reloj global de la sesión — se pausa/reanuda con el mismo control que
  // el cronómetro de la etapa actual.
  useEffect(() => {
    if (isPaused || isInfoOpen) return
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [isPaused, isInfoOpen])

  if (!section || !exercise) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Este workout no tiene ejercicios.</Text>
        <Pressable onPress={onExit} style={styles.emptyButton}>
          <Text style={styles.emptyButtonText}>Volver</Text>
        </Pressable>
      </View>
    )
  }

  const roundInfo = getRoundInfo(section, cursor)
  const totalSets = Math.max(exercise.sets, 1)
  const currentSet = Math.min(cursor.set, totalSets)
  const progress = hasTimer && totalDuration > 0 ? 1 - timeLeft / totalDuration : 1
  // EMOM tiene su propia identidad visual (rosa, como en la web) — no es
  // "sólo otro ejercicio con timer": necesita mostrar el tiempo disponible
  // Y las repeticiones a hacer en ese tiempo a la vez, así que se distingue
  // del resto para que quede claro que son dos datos, no uno.
  const isEmomActive = stage === 'exercise' && exercise.type === 'emom'
  const ringColor = isEmomActive ? '#ec4899' : STAGE_COLOR[stage]
  const stageBadgeLabel = isEmomActive ? 'EMOM' : STAGE_LABEL[stage]
  const timerLabel = hasTimer ? formatDuration(Math.max(timeLeft, 0), { style: 'clock' }) : `${exercise.reps || 0} reps`
  const nextLabel = stage === 'prepare' ? 'Iniciar' : exercise.type === 'reps' && stage === 'exercise' ? 'Hecho' : 'Saltar'
  const hasDetails = Boolean(exercise.description?.trim()) || exercise.muscle_groups.length > 0 || exercise.equipment.length > 0
  const isUrgent = hasTimer && timeLeft > 0 && timeLeft <= 3

  const upcomingCursor = nextCursor(workout, cursor)
  const upcomingExercise = upcomingCursor ? workout.sections[upcomingCursor.sectionIndex].exercises[upcomingCursor.exerciseIndex] : null
  const upcomingIsNewSection = upcomingCursor ? upcomingCursor.sectionIndex !== cursor.sectionIndex : false
  const canGoBack = stage !== 'prepare' && Boolean(prevCursor(workout, cursor))

  return (
    <View style={styles.container}>
      <SessionBackground baseColor="#050816" accentColor={ringColor} secondaryColors={['#8b5cf6', '#0ea5e9']} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ControlButton onPress={onExit} hitSlop={10} style={styles.iconButton}>
          <ChevronLeft size={20} color="#fff" />
        </ControlButton>

        <View style={styles.headerCenter}>
          <Text style={styles.headerSection} numberOfLines={1}>
            {section.name}
          </Text>
          <Text style={styles.headerSectionMeta}>
            Sección {cursor.sectionIndex + 1}/{workout.sections.length}
          </Text>
        </View>

        <View style={styles.clockChip}>
          <Text style={[styles.clockChipText, { fontFamily: theme.fontFamily.timer }]}>
            {formatDuration(elapsedSeconds, { style: 'clock' })}
          </Text>
        </View>
      </View>

      <View style={styles.sectionProgressTrack}>
        <ProgressBar ratio={roundInfo.current / roundInfo.total} color={ringColor} />
      </View>

      <View style={styles.body}>
        <View style={styles.statsRow}>
          <StatCard label="Ronda" current={roundInfo.current} total={roundInfo.total} color="#a78bfa" />
          <StatCard label="Serie" current={currentSet} total={totalSets} color="#38bdf8" />
        </View>

        <View style={styles.ringWrap}>
          <SessionMediaRing
            imageUrl={exercise.thumbnail_url}
            alt={exercise.name}
            progress={progress}
            color={ringColor}
            restLabel={stage === 'rest' ? 'Descanso' : undefined}
            urgent={isUrgent}
            size={266}
          />
        </View>

        <Animated.View key={stageKey} entering={FadeIn.duration(280)} style={styles.nameBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.exerciseName} numberOfLines={2}>
              {exercise.name}
            </Text>
            {hasDetails ? (
              <ControlButton onPress={() => setIsInfoOpen(true)} hitSlop={8} style={styles.infoButton} scaleTo={0.85}>
                <Info size={16} color="rgba(255,255,255,0.7)" />
              </ControlButton>
            ) : null}
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.stageBadge, { borderColor: `${ringColor}55`, backgroundColor: `${ringColor}1A` }]}>
              <Text style={[styles.stageBadgeText, { color: ringColor }]}>{stageBadgeLabel}</Text>
            </View>
            {isEmomActive ? (
              <View style={[styles.stageBadge, { borderColor: `${ringColor}55`, backgroundColor: `${ringColor}1A` }]}>
                <Text style={[styles.stageBadgeText, { color: ringColor }]}>{exercise.reps || 0} reps</Text>
              </View>
            ) : null}
          </View>
          <Text
            style={[
              styles.timerText,
              {
                fontFamily: hasTimer ? theme.fontFamily.timerBold : theme.fontFamily.bold,
                letterSpacing: hasTimer ? 2 : 0.4,
                color: isUrgent ? '#fca5a5' : 'rgba(255,255,255,0.85)',
              },
            ]}
          >
            {timerLabel}
          </Text>
        </Animated.View>

        {upcomingExercise ? (
          <View style={styles.upNextCard}>
            <View style={styles.upNextThumb}>
              {upcomingExercise.thumbnail_url ? (
                <ExpoImage source={{ uri: upcomingExercise.thumbnail_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <Dumbbell size={16} color="rgba(255,255,255,0.35)" />
              )}
            </View>
            <View style={styles.upNextText}>
              <Text style={styles.upNextLabel}>{upcomingIsNewSection ? 'Después · nueva sección' : 'Después'}</Text>
              <Text style={styles.upNextName} numberOfLines={1}>
                {upcomingExercise.name}
              </Text>
            </View>
            <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
          </View>
        ) : null}
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <ControlButton onPress={goPrev} style={styles.controlButton} disabled={!canGoBack}>
          <ChevronLeft size={22} color="#fff" />
        </ControlButton>

        <ControlButton onPress={() => setIsPaused((p) => !p)} style={styles.controlButton}>
          {isPaused ? <Play size={22} color="#fff" fill="#fff" /> : <Pause size={22} color="#fff" fill="#fff" />}
        </ControlButton>

        <ControlButton onPress={advanceStage} style={[styles.controlButton, styles.controlButtonPrimary]}>
          {stage === 'prepare' ? (
            <Play size={22} color="#fff" fill="#fff" />
          ) : exercise.type === 'reps' && stage === 'exercise' ? (
            <CheckCircle2 size={22} color="#fff" />
          ) : (
            <SkipForward size={22} color="#fff" />
          )}
          <Text style={styles.controlPrimaryText}>{nextLabel}</Text>
        </ControlButton>
      </View>

      <Sheet visible={isInfoOpen} onClose={() => setIsInfoOpen(false)} title={exercise.name}>
        <View style={styles.sheetContent}>
          {exercise.description?.trim() ? (
            <Text style={[styles.sheetDescription, { color: theme.colors.foreground }]}>{exercise.description}</Text>
          ) : null}

          {exercise.muscle_groups.length > 0 ? (
            <View style={styles.sheetTagRow}>
              {exercise.muscle_groups.map((m) => (
                <Badge key={m} label={m.replace(/_/g, ' ')} color="#fb923c" />
              ))}
            </View>
          ) : null}

          {exercise.equipment.length > 0 ? (
            <View style={styles.sheetTagRow}>
              {exercise.equipment.map((e) => (
                <Badge key={e} label={e.replace(/_/g, ' ')} color="#38bdf8" />
              ))}
            </View>
          ) : null}
        </View>
      </Sheet>
    </View>
  )
}

// Barra delgada de progreso — usada en el header (ronda dentro de la
// sección) y adentro de cada StatCard. Un solo lugar para la animación de
// ancho en vez de repetirla.
function ProgressBar({ ratio, color }: { ratio: number; color: string }) {
  const width = useSharedValue(ratio)

  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(ratio, 1)), { duration: 350 })
  }, [ratio, width])

  const style = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }))

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, style, { backgroundColor: color }]} />
    </View>
  )
}

// Tarjeta de estadística grande (Ronda/Serie) — antes era una píldora chica
// con un número de 15px; el pedido fue "aprovechá mejor el espacio, hacé
// más grande lo que ya tenemos". Ahora es una tarjeta con número de 34px +
// mini barra de progreso propia, y sigue "poppeando" (ZoomIn) cada vez que
// cambia el valor.
function StatCard({ label, current, total, color }: { label: string; current: number; total: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: `${color}40` }]}>
      <Text style={styles.statCardLabel}>{label}</Text>
      <Animated.View key={`${label}-${current}`} entering={ZoomIn.duration(240)}>
        <Text style={styles.statCardValue}>
          {current}
          <Text style={styles.statCardValueTotal}>/{total}</Text>
        </Text>
      </Animated.View>
      <ProgressBar ratio={total > 0 ? current / total : 0} color={color} />
    </View>
  )
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Botón de control con feedback táctil (usePressScale, ya usado por
// Button/Card en el resto de la app) — sin esto los controles se sentían
// "muertos" al tocar, no daban ninguna señal de vida más allá del cambio
// de estado.
function ControlButton({
  onPress,
  children,
  style,
  hitSlop,
  disabled,
  scaleTo = 0.92,
}: {
  onPress: () => void
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  hitSlop?: number
  disabled?: boolean
  scaleTo?: number
}) {
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale(scaleTo)
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      hitSlop={hitSlop}
      disabled={disabled}
      style={[pressStyle, style, disabled && styles.controlButtonDisabled]}
    >
      {children}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerCenter: {
    flex: 1,
    minWidth: 0,
  },
  headerSection: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '700',
  },
  headerSectionMeta: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginTop: 1,
  },
  clockChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  clockChipText: {
    color: '#6ee7b7',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  sectionProgressTrack: {
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  statCard: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 4,
  },
  statCardLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statCardValue: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statCardValueTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBlock: {
    alignItems: 'center',
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  exerciseName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  timerText: {
    fontSize: 34,
    letterSpacing: 2,
  },
  upNextCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  upNextThumb: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  upNextText: {
    flex: 1,
    minWidth: 0,
  },
  upNextLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  upNextName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  controlButtonDisabled: {
    opacity: 0.4,
  },
  controlButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    borderRadius: 28,
    backgroundColor: '#22c55e',
  },
  controlPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  sheetContent: {
    gap: 12,
  },
  sheetDescription: {
    fontSize: 14,
    lineHeight: 21,
  },
  sheetTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emptyState: {
    flex: 1,
    backgroundColor: '#050816',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  emptyText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
})
