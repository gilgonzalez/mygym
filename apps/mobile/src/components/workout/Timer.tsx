import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Pause, Play, SkipForward } from 'lucide-react-native'

import { formatDuration } from '@mygym/shared'
import { useTheme } from '@/theme'

// EL cronómetro — puerto único de src/components/WorkoutTimer.tsx, pensado
// para usarse en todos los puntos que necesiten cuenta regresiva: ejecución
// de ejercicios por tiempo/EMOM, descansos entre series, y el reto AMRAP
// (WorkoutChallengeExecutionView en la web). No crear otro timer a mano:
// todo lo que cuenta segundos pasa por acá.
//
// Diferencia con la web: ahí el beep final se sintetiza con Web Audio API.
// En RN eso implica bundlear un archivo de audio o sumar expo-audio solo
// para un beep; en su lugar usamos feedback háptico (expo-haptics) en la
// cuenta regresiva y al completar — funciona sin sonido y es más "nativo"
// en un dispositivo que probablemente esté en el bolsillo durante el
// entrenamiento.
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface TimerProps {
  duration: number // segundos
  mode: 'exercise' | 'rest'
  onComplete: () => void
  onSkip?: () => void
  size?: number
}

export function Timer({ duration, mode, onComplete, onSkip, size = 64 }: TimerProps) {
  const theme = useTheme()
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(true)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // "Pie" relleno, no anillo: el trazo mide la mitad del radio total y con
  // strokeWidth = 2*radius cubre todo el disco (mismo truco que la web:
  // WorkoutTimer.tsx, comentario "creates a filled pie effect"). Al vaciarse
  // el dashoffset, el pie se va "comiendo" en sentido horario.
  const radius = size / 4
  const strokeWidth = size / 2
  const circumference = 2 * Math.PI * radius
  const progress = useSharedValue(1)

  const color = mode === 'rest' ? '#f97316' /* orange-500 */ : theme.colors.primary

  // Reinicia si cambia la duración (nuevo ejercicio/descanso).
  useEffect(() => {
    setTimeLeft(duration)
    setIsRunning(true)
  }, [duration])

  useEffect(() => {
    progress.value = withTiming(duration > 0 ? timeLeft / duration : 0, { duration: 1000 })
  }, [timeLeft, duration, progress])

  useEffect(() => {
    if (!isRunning) return

    if (timeLeft <= 0) {
      setIsRunning(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      onCompleteRef.current()
      return
    }

    if (timeLeft <= 5) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    }

    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [isRunning, timeLeft])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }))

  const addTime = () => setTimeLeft((t) => t + 10)

  return (
    <View style={styles.row}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={styles.svgRotated}>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="rgba(255,255,255,0.2)" />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animatedProps}
          />
        </Svg>
      </View>

      <View style={styles.controls}>
        <Text style={[styles.time, { color: mode === 'exercise' ? '#fff' : theme.colors.foreground, fontFamily: theme.fontFamily.timer }]}>
          {formatDuration(Math.max(0, timeLeft), { style: 'clock' })}
        </Text>

        {mode === 'exercise' ? (
          <Pressable onPress={() => setIsRunning((r) => !r)} hitSlop={8}>
            {isRunning ? <Pause size={22} color="#fff" fill="#fff" /> : <Play size={22} color="#fff" fill="#fff" />}
          </Pressable>
        ) : (
          <View style={styles.restControls}>
            <Pressable onPress={addTime} hitSlop={6} style={styles.restButton}>
              <Text style={[styles.restButtonText, { color: theme.colors.foreground, fontFamily: theme.fontFamily.semibold }]}>
                +10s
              </Text>
            </Pressable>
            <Pressable onPress={onSkip ?? onComplete} hitSlop={6} style={styles.restButton}>
              <Text style={[styles.restButtonText, { color: theme.colors.foreground, fontFamily: theme.fontFamily.semibold }]}>
                Saltar
              </Text>
              <SkipForward size={12} color={theme.colors.foreground} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 8,
  },
  svgRotated: {
    transform: [{ rotate: '-90deg' }],
  },
  controls: {
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 22,
    letterSpacing: 1,
  },
  restControls: {
    flexDirection: 'row',
    gap: 8,
  },
  restButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  restButtonText: {
    fontSize: 12,
  },
})
