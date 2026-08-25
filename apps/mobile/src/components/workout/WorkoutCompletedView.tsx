import { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  BatteryWarning,
  Dumbbell,
  Frown,
  Meh,
  Smile,
  Star,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react-native'

import { calcWorkoutXP, FEELING_COLORS, FEELING_LABELS, formatDuration, type FeelingType } from '@mygym/shared'
import { useTheme } from '@/theme'
import { Button, TextArea } from '@/components/ui'
import { useSession } from '@/lib/session'
import type { WorkoutDetail } from '@/lib/workouts'
import { completeWorkoutSession, saveWorkoutLogDetails, type ChallengeResultInput } from '@/lib/workoutCompletion'
import { SessionBackground } from './SessionBackground'

// Puerto de WorkoutCompleted.tsx (apps/web) — a diferencia de esa versión,
// acá no hay gate de Premium (ver conversación: la app todavía no tiene ese
// concepto), así que el guardado corre siempre. Dos pasos, como en la web:
//   1. Al montar, se guarda solo el workout_log "base" (duración/XP, y el
//      resultado del reto si lo hubo) — equivalente al useEffect de
//      isCompleted en workout/[id]/page.tsx. No depende de que el usuario
//      llegue a tocar nada.
//   2. El formulario (rating/sensación/notas) actualiza ESE mismo log
//      cuando el usuario toca "Guardar y finalizar" — equivalente a
//      logWorkoutCompletion.ts.
// Si el paso 1 falla (sin red, etc.) se ofrece reintentar en vez de dejar
// el formulario ahí sin nada donde guardar.
const FEELING_ICONS: Record<FeelingType, typeof Zap> = {
  tired: BatteryWarning,
  sad: Frown,
  normal: Meh,
  happy: Smile,
  pumped: Zap,
}

const FEELING_ORDER: FeelingType[] = ['tired', 'sad', 'normal', 'happy', 'pumped']

interface WorkoutCompletedViewProps {
  workout: WorkoutDetail
  durationSeconds: number
  challengeResult?: { roundsCompleted: number; timeCapSeconds: number } | null
  onSaved: () => void
  onSkip: () => void
}

type SaveStatus = 'saving' | 'ready' | 'error'

export function WorkoutCompletedView({ workout, durationSeconds, challengeResult, onSaved, onSkip }: WorkoutCompletedViewProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { session } = useSession()
  const userId = session?.user.id

  const [status, setStatus] = useState<SaveStatus>('saving')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [logId, setLogId] = useState<string | null>(null)
  const [xpEarned, setXpEarned] = useState(0)
  const [isPr, setIsPr] = useState(false)

  const [rating, setRating] = useState(5)
  const [feeling, setFeeling] = useState<FeelingType>('happy')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Evita disparar el guardado automático dos veces si el componente se
  // re-renderiza antes de que la primera llamada resuelva.
  const hasStartedRef = useRef(false)

  const totalSets = workout.sections.reduce(
    (acc, section) => acc + section.exercises.reduce((exAcc, ex) => exAcc + (ex.sets || 0), 0),
    0
  )
  const timeString = formatDuration(Math.floor(durationSeconds), { style: 'clock' })

  const runAutoSave = () => {
    if (!userId) return
    hasStartedRef.current = true
    setStatus('saving')
    setErrorMessage(null)

    const challengePayload: ChallengeResultInput | undefined = challengeResult
      ? {
          mode: 'amrap_section',
          roundsCompleted: challengeResult.roundsCompleted,
          score: challengeResult.roundsCompleted,
          timeCapSeconds: challengeResult.timeCapSeconds,
        }
      : undefined

    const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60))
    const calculatedXp = calcWorkoutXP(durationSeconds, workout.difficulty)

    completeWorkoutSession({
      userId,
      workoutId: workout.id,
      durationMinutes,
      xpEarned: calculatedXp,
      challengeResult: challengePayload,
    })
      .then((result) => {
        setLogId(result.logId)
        setXpEarned(result.xpEarned)
        setIsPr(result.challengeIsPr)
        setStatus('ready')
      })
      .catch((err: any) => {
        setErrorMessage(err?.message ?? 'No se pudo registrar el workout')
        setStatus('error')
      })
  }

  useEffect(() => {
    if (hasStartedRef.current || !userId) return
    runAutoSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleSave = () => {
    if (!logId || !userId) return
    setIsSaving(true)
    saveWorkoutLogDetails({ logId, userId, notes, rating, feeling })
      .then(() => onSaved())
      .catch((err: any) => {
        setErrorMessage(err?.message ?? 'No se pudo guardar el detalle del workout')
        setIsSaving(false)
      })
  }

  return (
    <View style={styles.container}>
      <SessionBackground baseColor="#050816" accentColor="#22c55e" secondaryColors={['#f59e0b', '#0ea5e9']} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.trophyBadge}>
              <Trophy size={30} color="#22c55e" />
            </View>
            <Text style={styles.title}>¡Workout completado!</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              Completaste <Text style={styles.subtitleStrong}>{workout.title}</Text>
            </Text>
          </View>

          <View style={styles.statsRow}>
            <StatBox
              icon={Dumbbell}
              iconColor="#38bdf8"
              value={challengeResult ? `${challengeResult.roundsCompleted}` : `${totalSets}`}
              label={challengeResult ? 'Rondas' : 'Series'}
            />
            <StatBox icon={Timer} iconColor="#22c55e" value={timeString} label="Tiempo" mono />
            <StatBox
              icon={Trophy}
              iconColor="#f59e0b"
              value={status === 'saving' ? '…' : `+${xpEarned}`}
              label="XP"
              valueColor="#f59e0b"
            />
          </View>

          {challengeResult ? (
            <View style={styles.challengeCard}>
              <View style={styles.challengeBadgeRow}>
                <View style={styles.challengeBadge}>
                  <Text style={styles.challengeBadgeText}>Reto AMRAP</Text>
                </View>
                {isPr ? (
                  <View style={styles.prBadge}>
                    <Text style={styles.prBadgeText}>Nueva marca</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.challengeRounds}>
                {challengeResult.roundsCompleted} ronda{challengeResult.roundsCompleted === 1 ? '' : 's'}
              </Text>
              <Text style={styles.challengeHint}>Resultado final del reto dentro del time cap.</Text>
            </View>
          ) : null}

          {status === 'error' ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Button title="Reintentar" variant="outline" size="sm" onPress={runAutoSave} />
            </View>
          ) : null}

          <View style={[styles.formSection, status !== 'ready' && styles.formDisabled]} pointerEvents={status === 'ready' ? 'auto' : 'none'}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Valora el workout</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => setRating(star)} hitSlop={6} style={styles.starButton}>
                    <Star size={30} color={star <= rating ? '#fbbf24' : 'rgba(255,255,255,0.2)'} fill={star <= rating ? '#fbbf24' : 'transparent'} />
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>¿Cómo te sentiste?</Text>
              <View style={styles.feelingRow}>
                {FEELING_ORDER.map((key) => {
                  const Icon = FEELING_ICONS[key]
                  const isActive = feeling === key
                  const color = FEELING_COLORS[key]
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setFeeling(key)}
                      style={[
                        styles.feelingButton,
                        isActive && { backgroundColor: `${color}22`, borderColor: color },
                      ]}
                    >
                      <Icon size={22} color={isActive ? color : 'rgba(255,255,255,0.5)'} />
                    </Pressable>
                  )
                })}
              </View>
              <Text style={styles.feelingLabel}>{FEELING_LABELS[feeling]}</Text>
            </View>

            <View style={styles.fieldBlock}>
              <TextArea
                value={notes}
                onChangeText={setNotes}
                placeholder="Añade notas sobre tu workout... (Opcional)"
                minHeight={80}
                style={styles.notesInput}
              />
            </View>

            <Button
              title="Guardar y finalizar"
              onPress={handleSave}
              loading={isSaving}
              disabled={status !== 'ready' || isSaving}
              style={styles.saveButton}
            />
          </View>

          <Pressable onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Volver sin más detalles</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

function StatBox({
  icon: Icon,
  iconColor,
  value,
  label,
  mono,
  valueColor,
}: {
  icon: typeof Trophy
  iconColor: string
  value: string
  label: string
  mono?: boolean
  valueColor?: string
}) {
  const theme = useTheme()

  return (
    <View style={styles.statBox}>
      <Icon size={18} color={iconColor} />
      <Text
        style={[
          styles.statValue,
          { fontFamily: mono ? theme.fontFamily.timer : theme.fontFamily.bold, color: valueColor ?? '#fff' },
        ]}
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 18,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  trophyBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,197,94,0.15)',
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
  },
  subtitleStrong: {
    color: '#6ee7b7',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statValue: {
    fontSize: 18,
    letterSpacing: 0.4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  challengeCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    backgroundColor: 'rgba(34,197,94,0.06)',
    padding: 14,
    gap: 6,
  },
  challengeBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  challengeBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  challengeBadgeText: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  prBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  prBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  challengeRounds: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  challengeHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  errorCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    backgroundColor: 'rgba(248,113,113,0.08)',
    padding: 14,
    gap: 10,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  formSection: {
    gap: 18,
  },
  formDisabled: {
    opacity: 0.4,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  feelingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  feelingButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  feelingLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
  },
  saveButton: {
    marginTop: 4,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
})
