import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated'
import { usePressScale } from '@/components/ui'

// Antes duplicado byte a byte entre ExecutionView.tsx y
// ChallengeExecutionView.tsx (con un comentario explícito diciendo que era
// a propósito) — son las piezas que sí son genuinamente iguales entre los
// dos componentes de ejecución (que por lo demás son independientes, ver
// el comentario de cada uno).
export const PREPARE_SECONDS = 5

export function ProgressBar({ ratio, color }: { ratio: number; color: string }) {
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
export function StatCard({ label, current, total, color }: { label: string; current: number; total: number; color: string }) {
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

export const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Botón de control con feedback táctil (usePressScale, ya usado por
// Button/Card en el resto de la app) — sin esto los controles se sentían
// "muertos" al tocar, no daban ninguna señal de vida más allá del cambio
// de estado.
export function ControlButton({
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

export const styles = StyleSheet.create({
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
  controlButtonDisabled: {
    opacity: 0.4,
  },
})
