import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

// Micro-interacción de "prensado" reusada por Button/Card/WorkoutCard —
// mismo espíritu que las transitions de hover/active de la web
// (.glow-card, active:scale-[0.998] en el botón de "nuevos workouts" del
// feed), adaptado a touch: se achica un poco al tocar y vuelve al soltar.
export function usePressScale(scaleTo = 0.97) {
  const scale = useSharedValue(1)

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const onPressIn = () => {
    scale.value = withTiming(scaleTo, { duration: 100 })
  }

  const onPressOut = () => {
    scale.value = withTiming(1, { duration: 150 })
  }

  return { style, onPressIn, onPressOut }
}
