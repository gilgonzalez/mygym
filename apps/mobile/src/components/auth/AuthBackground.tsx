import { useEffect } from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import { BlurView } from 'expo-blur'
import { StatusBar } from 'expo-status-bar'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const BASE = '#09090b' // mismo fondo que components/Splash.tsx
const EMERALD = '#10b981'
const CYAN = '#22d3ee' // el otro color del duotono "Blade Runner" de la marca, ver theme/palette.ts

// Fondo "aurora" para toda la zona de auth (login/forgot-password/reset-
// password) — versión liviana (2 manchas fijas, sin accentColor dinámico)
// del mismo patrón que usa components/workout/SessionBackground.tsx durante
// la ejecución de un workout. Fondo oscuro fijo a propósito: es la puerta de
// entrada a la marca, no un formulario que tenga que seguir el tema claro/
// oscuro del resto de la app (mismo criterio que components/Splash.tsx) —
// por eso el resto de los componentes de esta carpeta usan colores fijos en
// vez de theme.colors. También fuerza el status bar a claro mientras está
// montado, porque el del layout raíz sigue el tema del sistema y sobre este
// fondo oscuro unos íconos de status bar oscuros quedarían invisibles.
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
    // Se dispara una sola vez al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return value
}

export function AuthBackground() {
  const { width, height } = useWindowDimensions()
  const size = Math.max(width, height) * 0.9

  const drift1 = useDrift(11000)
  const drift2 = useDrift(14000)

  const blob1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift1.value, [0, 1], [-size * 0.1, size * 0.05]) },
      { translateY: interpolate(drift1.value, [0, 1], [-size * 0.06, size * 0.04]) },
      { scale: interpolate(drift1.value, [0, 1], [1, 1.12]) },
    ],
  }))

  const blob2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift2.value, [0, 1], [size * 0.06, -size * 0.08]) },
      { translateY: interpolate(drift2.value, [0, 1], [size * 0.05, -size * 0.03]) },
      { scale: interpolate(drift2.value, [0, 1], [1.08, 0.96]) },
    ],
  }))

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: BASE }]} pointerEvents="none">
      <StatusBar style="light" />
      <Animated.View
        style={[
          styles.blob,
          blob1Style,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            top: -size * 0.35,
            left: -size * 0.3,
            backgroundColor: EMERALD,
            opacity: 0.55,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          blob2Style,
          {
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: (size * 0.7) / 2,
            bottom: -size * 0.3,
            right: -size * 0.28,
            backgroundColor: CYAN,
            opacity: 0.32,
          },
        ]}
      />
      <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `${BASE}70` }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
  },
})
