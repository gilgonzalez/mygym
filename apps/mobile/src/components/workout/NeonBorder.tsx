import { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import Svg, { Rect } from 'react-native-svg'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { useTheme } from '@/theme'

const AnimatedRect = Animated.createAnimatedComponent(Rect)

// El "moving border" tipo HUD/Blade Runner: un tramo de luz que recorre el
// perímetro en loop, con halo + núcleo casi blanco (así se ve un tubo de
// neón real, no un color plano). Se monta como wrapper por FUERA de <Card>
// (ver WorkoutCard.tsx) para que el halo pueda salirse un poco del borde
// sin que el overflow:hidden de la card lo recorte.
//
// Solo se monta en la card que está 100% visible en pantalla (spotlight,
// ver onViewableItemsChanged en app/index.tsx) — prenderlo en todas a la vez
// sería ruido visual y trabajo de más para nada.
interface NeonBorderProps {
  radius: number
  inset?: number
}

export function NeonBorder({ radius, inset = 6 }: NeonBorderProps) {
  const theme = useTheme()
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const dashOffset = useSharedValue(0)

  const rw = size ? size.width - inset * 2 : 0
  const rh = size ? size.height - inset * 2 : 0
  const r = Math.min(radius, rw / 2, rh / 2)
  // Longitud del perímetro de un rect con esquinas redondeadas: los 4 lados
  // rectos más el círculo completo que forman las 4 esquinas juntas.
  const perimeter = Math.max(2 * (rw + rh) + 2 * r * (Math.PI - 4), 1)
  const dashLength = perimeter * 0.22
  const dashArray = [dashLength, Math.max(perimeter - dashLength, 1)]

  useEffect(() => {
    if (!size) return
    dashOffset.value = 0
    dashOffset.value = withRepeat(withTiming(-perimeter, { duration: 2600, easing: Easing.linear }), -1, false)
    // Reinicia el loop si cambia el tamaño medido (rotación de pantalla, etc).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }))

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(150)}
      style={[styles.wrapper, { top: -inset, left: -inset, right: -inset, bottom: -inset }]}
      pointerEvents="none"
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {size && (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
          {/* Halo ancho y tenue — el "resplandor" del tubo contra el aire */}
          <AnimatedRect
            x={inset}
            y={inset}
            width={rw}
            height={rh}
            rx={r}
            fill="none"
            stroke={theme.colors.primary}
            strokeWidth={9}
            strokeOpacity={0.28}
            strokeLinecap="round"
            strokeDasharray={dashArray}
            animatedProps={animatedProps}
          />
          {/* Cuerpo del trazo */}
          <AnimatedRect
            x={inset}
            y={inset}
            width={rw}
            height={rh}
            rx={r}
            fill="none"
            stroke={theme.colors.primary}
            strokeWidth={3}
            strokeOpacity={0.9}
            strokeLinecap="round"
            strokeDasharray={dashArray}
            animatedProps={animatedProps}
          />
          {/* Núcleo casi blanco — el "filamento" caliente del neón */}
          <AnimatedRect
            x={inset}
            y={inset}
            width={rw}
            height={rh}
            rx={r}
            fill="none"
            stroke="#ecfdf5"
            strokeWidth={1.3}
            strokeOpacity={0.95}
            strokeLinecap="round"
            strokeDasharray={dashArray}
            animatedProps={animatedProps}
          />
        </Svg>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },
})
