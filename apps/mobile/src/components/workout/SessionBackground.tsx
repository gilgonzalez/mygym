import { useEffect } from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import { BlurView } from 'expo-blur'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

// Fondo "aurora" compartido por ExecutionView/ChallengeExecutionView — antes
// era un color plano (#050816/#040612) detrás de todo, sin vida. Acá son 3
// manchas de color grandes, semitransparentes, que flotan solas en loop
// (cada una con su propio período/fase para que no se sienta mecánico) por
// detrás de un <BlurView> que las difumina en un degradé fluido tipo mesh-
// gradient — sin eso, círculos sólidos semitransparentes se ven como
// círculos, no como un fondo atmosférico.
//
// `accentColor` es el color "vivo" — el mismo que usa el anillo central
// (ver SessionMediaRing) — así el fondo entero acompaña el cambio de etapa
// (celeste→verde→naranja) en vez de quedar desconectado de lo que pasa en
// pantalla. Los otros dos colores son fijos, para que siempre haya
// variación incluso cuando accentColor no cambia por un rato.
interface SessionBackgroundProps {
  baseColor: string
  accentColor: string
  secondaryColors: [string, string]
}

function useDrift(durationMs: number) {
  const value = useSharedValue(0)

  useEffect(() => {
    value.value = withRepeat(
      withSequence(
        withTiming(1, { duration: durationMs, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: durationMs, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return value
}

export function SessionBackground({ baseColor, accentColor, secondaryColors }: SessionBackgroundProps) {
  const { width, height } = useWindowDimensions()
  const size = Math.max(width, height) * 0.85

  const animatedAccent = useSharedValue(accentColor)
  useEffect(() => {
    animatedAccent.value = withTiming(accentColor, { duration: 500 })
  }, [accentColor, animatedAccent])

  const drift1 = useDrift(9000)
  const drift2 = useDrift(12000)
  const drift3 = useDrift(7500)

  const blob1Style = useAnimatedStyle(() => ({
    backgroundColor: animatedAccent.value,
    transform: [
      { translateX: interpolate(drift1.value, [0, 1], [-size * 0.12, size * 0.08]) },
      { translateY: interpolate(drift1.value, [0, 1], [-size * 0.08, size * 0.06]) },
      { scale: interpolate(drift1.value, [0, 1], [1, 1.18]) },
    ],
  }))

  const blob2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift2.value, [0, 1], [size * 0.06, -size * 0.1]) },
      { translateY: interpolate(drift2.value, [0, 1], [size * 0.05, -size * 0.07]) },
      { scale: interpolate(drift2.value, [0, 1], [1.1, 0.95]) },
    ],
  }))

  const blob3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift3.value, [0, 1], [-size * 0.05, size * 0.09]) },
      { translateY: interpolate(drift3.value, [0, 1], [size * 0.04, -size * 0.05]) },
      { scale: interpolate(drift3.value, [0, 1], [0.95, 1.1]) },
    ],
  }))

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: baseColor }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.blob,
          blob1Style,
          { width: size, height: size, borderRadius: size / 2, top: -size * 0.32, left: -size * 0.3, opacity: 0.45 },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          blob2Style,
          {
            width: size * 0.75,
            height: size * 0.75,
            borderRadius: (size * 0.75) / 2,
            bottom: -size * 0.28,
            right: -size * 0.32,
            backgroundColor: secondaryColors[0],
            opacity: 0.38,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          blob3Style,
          {
            width: size * 0.55,
            height: size * 0.55,
            borderRadius: (size * 0.55) / 2,
            top: height * 0.32,
            left: width * 0.5 - size * 0.27,
            backgroundColor: secondaryColors[1],
            opacity: 0.3,
          },
        ]}
      />
      <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `${baseColor}55` }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
  },
})
