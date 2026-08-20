import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { ChevronLeft, ChevronRight, Dumbbell, Info, Pause, Play, Trophy, Zap } from 'lucide-react-native'

import { formatDuration } from '@mygym/shared'
import { useTheme } from '@/theme'
import { Badge, Sheet, usePressScale } from '@/components/ui'
import type { WorkoutDetail } from '@/lib/workouts'
import { SessionBackground } from './SessionBackground'
import { SessionMediaRing } from './SessionMediaRing'

// Puerto de WorkoutChallengeExecutionView.tsx (apps/web) — ya era
// independiente ahí (no necesita un cursor externo, se ubica solo dentro
// de la sección de reto y recorre el circuito en loop), así que acá se
// mantiene el mismo criterio de auto-suficiencia. Reduce lo mismo que
// ExecutionView: un solo cronómetro grande (el countdown del reto ES el
// dato relevante — mostrarlo dos veces, grande y "global" arriba, sería la
// duplicación que se pidió evitar), y la lista de ejercicios del circuito
// de la web (una columna con nombre+duración de cada uno) se resume a la
// posición actual "X/N" — con nombre + imagen del ejercicio activo ya se
// entiende dónde se está sin repetir el circuito entero en pantalla.
interface ChallengeExecutionViewProps {
  workout: WorkoutDetail
  onExit: () => void
  onComplete: (result: { roundsCompleted: number; elapsedSeconds: number }) => void
}

type Phase = 'prepare' | 'active'

const PREPARE_SECONDS = 5
const DEFAULT_TIME_CAP_SECONDS = 720 // 12 min — mismo default que la web cuando no hay challenge cargado

export function ChallengeExecutionView({ workout, onExit, onComplete }: ChallengeExecutionViewProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const challengeSection = useMemo(
    () => workout.sections.find((s) => s.id === workout.challenge?.challengeSectionId) ?? workout.sections[0],
    [workout.challenge?.challengeSectionId, workout.sections]
  )
  const exercises = challengeSection?.exercises ?? []
  const timeCapSeconds = workout.challenge?.timeCapSeconds || DEFAULT_TIME_CAP_SECONDS

  const [phase, setPhase] = useState<Phase>('prepare')
  const [timeLeft, setTimeLeft] = useState(PREPARE_SECONDS)
  const [isPaused, setIsPaused] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [roundsCompleted, setRoundsCompleted] = useState(0)
  const hasFinishedRef = useRef(false)

  const currentExercise = exercises[exerciseIndex]

  useEffect(() => {
    if (isPaused || isInfoOpen || !exercises.length || timeLeft <= 0) return
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [isPaused, isInfoOpen, exercises.length, timeLeft])

  const finalize = (elapsedSeconds: number, finalRounds: number) => {
    if (hasFinishedRef.current) return
    hasFinishedRef.current = true
    onComplete({ roundsCompleted: finalRounds, elapsedSeconds })
  }

  useEffect(() => {
    if (!exercises.length || timeLeft > 0) return

    if (phase === 'prepare') {
      setPhase('active')
      setTimeLeft(timeCapSeconds)
      return
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
    setIsPaused(true)
    finalize(timeCapSeconds, roundsCompleted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  useEffect(() => {
    if (phase === 'active' && timeLeft > 0 && timeLeft <= 3) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    }
  }, [phase, timeLeft])

  if (!challengeSection || !currentExercise) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Este reto no tiene una sección válida.</Text>
        <Pressable onPress={onExit} style={styles.emptyButton}>
          <Text style={styles.emptyButtonText}>Volver</Text>
        </Pressable>
      </View>
    )
  }

  const handleAdvance = () => {
    if (phase !== 'active') return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})

    if (exerciseIndex === exercises.length - 1) {
      setRoundsCompleted((r) => r + 1)
      setExerciseIndex(0)
      return
    }
    setExerciseIndex((i) => i + 1)
  }

  const handleFinishNow = () => {
    if (phase !== 'active') return
    setIsPaused(true)
    finalize(timeCapSeconds - Math.max(timeLeft, 0), roundsCompleted)
  }

  const progress = phase === 'prepare' ? 0 : 1 - Math.max(timeLeft, 0) / timeCapSeconds
  const timerLabel = formatDuration(Math.max(timeLeft, 0), { style: 'clock' })
  const targetLabel =
    currentExercise.type === 'time'
      ? formatDuration(currentExercise.duration || 0)
      : currentExercise.type === 'emom'
        ? `${currentExercise.reps || 0} reps · ${formatDuration(currentExercise.duration || 0)}`
        : `${currentExercise.reps || 0} reps`
  const hasDetails =
    Boolean(currentExercise.description?.trim()) || currentExercise.muscle_groups.length > 0 || currentExercise.equipment.length > 0
  const ringColor = phase === 'prepare' ? '#38bdf8' : '#10b981'
  const isUrgent = phase === 'active' && timeLeft > 0 && timeLeft <= 10
  const nextExercise = exercises[(exerciseIndex + 1) % exercises.length]
  const isLastInRound = exerciseIndex === exercises.length - 1

  return (
    <View style={styles.container}>
      <SessionBackground baseColor="#040612" accentColor={ringColor} secondaryColors={['#f59e0b', '#8b5cf6']} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ControlButton onPress={onExit} hitSlop={10} style={styles.iconButton}>
          <ChevronLeft size={20} color="#fff" />
        </ControlButton>

        <View style={styles.headerCenter}>
          <Text style={styles.headerSection} numberOfLines={1}>
            {challengeSection.name}
          </Text>
          <Text style={styles.headerSectionMeta}>AMRAP · {Math.round(timeCapSeconds / 60)} min</Text>
        </View>

        <Animated.View key={`rounds-${roundsCompleted}`} entering={ZoomIn.duration(260)} style={styles.roundsChip}>
          <Trophy size={12} color="#f59e0b" />
          <Text style={styles.roundsChipText}>{roundsCompleted}</Text>
        </Animated.View>
      </View>

      <View style={styles.sectionProgressTrack}>
        <ProgressBar ratio={phase === 'active' ? 1 - Math.max(timeLeft, 0) / timeCapSeconds : 0} color={ringColor} />
      </View>

      <View style={styles.body}>
        <View style={styles.statsRow}>
          <StatCard label="Circuito" current={exerciseIndex + 1} total={exercises.length} color="#10b981" />
          <View style={[styles.statCard, { borderColor: 'rgba(245,158,11,0.4)' }]}>
            <Text style={styles.statCardLabel}>Rondas</Text>
            <Animated.View key={`rounds-big-${roundsCompleted}`} entering={ZoomIn.duration(240)}>
              <Text style={styles.statCardValue}>{roundsCompleted}</Text>
            </Animated.View>
            <View style={styles.statCardHint}>
              <Trophy size={11} color="rgba(251,191,36,0.7)" />
              <Text style={styles.statCardHintText}>completadas</Text>
            </View>
          </View>
        </View>

        <View style={styles.ringWrap}>
          <SessionMediaRing
            imageUrl={currentExercise.thumbnail_url}
            alt={currentExercise.name}
            progress={progress}
            color={ringColor}
            urgent={isUrgent}
            size={266}
          />
        </View>

        <Animated.View key={`${phase}-${exerciseIndex}-${roundsCompleted}`} entering={FadeIn.duration(280)} style={styles.nameBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.exerciseName} numberOfLines={2}>
              {phase === 'prepare' ? 'Entra fuerte' : currentExercise.name}
            </Text>
            {hasDetails && phase === 'active' ? (
              <ControlButton onPress={() => setIsInfoOpen(true)} hitSlop={8} style={styles.infoButton} scaleTo={0.85}>
                <Info size={16} color="rgba(255,255,255,0.7)" />
              </ControlButton>
            ) : null}
          </View>
          {phase === 'active' ? (
            <View style={[styles.stageBadge, { borderColor: 'rgba(16,185,129,0.35)', backgroundColor: 'rgba(16,185,129,0.1)' }]}>
              <Text style={[styles.stageBadgeText, { color: '#6ee7b7' }]}>{targetLabel}</Text>
            </View>
          ) : null}
          <Text style={[styles.timerText, { fontFamily: theme.fontFamily.timerBold, color: isUrgent ? '#fca5a5' : 'rgba(255,255,255,0.9)' }]}>
            {timerLabel}
          </Text>
        </Animated.View>

        {phase === 'active' ? (
          <View style={styles.upNextCard}>
            <View style={styles.upNextThumb}>
              {nextExercise.thumbnail_url ? (
                <ExpoImage source={{ uri: nextExercise.thumbnail_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <Dumbbell size={16} color="rgba(255,255,255,0.35)" />
              )}
            </View>
            <View style={styles.upNextText}>
              <Text style={styles.upNextLabel}>{isLastInRound ? 'Después · nueva ronda' : 'Después'}</Text>
              <Text style={styles.upNextName} numberOfLines={1}>
                {nextExercise.name}
              </Text>
            </View>
            <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
          </View>
        ) : null}
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <ControlButton onPress={() => setIsPaused((p) => !p)} style={styles.controlButton} disabled={phase !== 'active'}>
          {isPaused ? <Play size={22} color="#fff" fill="#fff" /> : <Pause size={22} color="#fff" fill="#fff" />}
        </ControlButton>

        <ControlButton onPress={handleAdvance} style={[styles.controlButton, styles.controlButtonPrimary]} disabled={phase !== 'active'}>
          <Zap size={20} color="#fff" />
          <Text style={styles.controlPrimaryText}>Siguiente</Text>
        </ControlButton>

        <ControlButton onPress={handleFinishNow} style={[styles.controlButton, styles.controlButtonFinish]} disabled={phase !== 'active'}>
          <Trophy size={20} color="#1c1917" />
        </ControlButton>
      </View>

      <Sheet visible={isInfoOpen} onClose={() => setIsInfoOpen(false)} title={currentExercise.name}>
        <View style={styles.sheetContent}>
          {currentExercise.description?.trim() ? (
            <Text style={[styles.sheetDescription, { color: theme.colors.foreground }]}>{currentExercise.description}</Text>
          ) : null}

          {currentExercise.muscle_groups.length > 0 ? (
            <View style={styles.sheetTagRow}>
              {currentExercise.muscle_groups.map((m) => (
                <Badge key={m} label={m.replace(/_/g, ' ')} color="#fb923c" />
              ))}
            </View>
          ) : null}

          {currentExercise.equipment.length > 0 ? (
            <View style={styles.sheetTagRow}>
              {currentExercise.equipment.map((e) => (
                <Badge key={e} label={e.replace(/_/g, ' ')} color="#38bdf8" />
              ))}
            </View>
          ) : null}
        </View>
      </Sheet>
    </View>
  )
}

// Misma barra de progreso y tarjeta de estadística grande que ExecutionView
// (ver ese archivo) — se repite acá en vez de compartirse porque cada
// componente de ejecución es independiente a propósito.
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

// Mismo botón con feedback táctil que ExecutionView (ver ese archivo) — se
// repite acá en vez de compartirse porque cada componente de ejecución es
// independiente a propósito (ver el comentario del archivo).
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
    backgroundColor: '#040612',
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
  roundsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  roundsChipText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
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
  statCardHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statCardHintText: {
    color: 'rgba(251,191,36,0.7)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  stageBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  timerText: {
    fontSize: 42,
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
    backgroundColor: '#10b981',
  },
  controlButtonFinish: {
    backgroundColor: '#f59e0b',
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
    backgroundColor: '#040612',
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
