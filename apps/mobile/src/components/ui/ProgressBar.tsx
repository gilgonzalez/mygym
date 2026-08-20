import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useEffect } from 'react'

import { useTheme } from '@/theme'

// Puerto de src/components/ui/progress.tsx. Pensado para la barra de XP del
// perfil y cualquier otra métrica con "valor sobre un total" (progreso de un
// reto AMRAP, etc.) — ver profile/XPBar.tsx para el caso de uso concreto.
interface ProgressBarProps {
  value: number // 0-100
  height?: number
  color?: string
  trackColor?: string
}

export function ProgressBar({ value, height = 10, color, trackColor }: ProgressBarProps) {
  const theme = useTheme()
  const clamped = Math.max(0, Math.min(100, value))
  const width = useSharedValue(0)

  useEffect(() => {
    width.value = withTiming(clamped, { duration: 500 })
  }, [clamped, width])

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }))

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor ?? theme.colors.secondary },
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          { borderRadius: height / 2, backgroundColor: color ?? theme.colors.primary },
          animatedStyle,
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
})
