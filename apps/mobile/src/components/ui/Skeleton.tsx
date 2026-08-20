import { useEffect } from 'react'
import { StyleSheet, type DimensionValue } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'

import { useTheme } from '@/theme'

// Puerto del "animate-pulse" que usa la web para los skeletons del feed
// (FeedWorkoutCardSkeleton) y del perfil (ver profile/page.tsx). Un solo
// bloque reusable en vez de reimplementar el pulso en cada pantalla.
interface SkeletonProps {
  width?: DimensionValue
  height?: number
  radius?: number
}

export function Skeleton({ width = '100%', height = 16, radius = 8 }: SkeletonProps) {
  const theme = useTheme()
  const opacity = useSharedValue(0.5)

  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.5, { duration: 700 })), -1, true)
  }, [opacity])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius: radius, backgroundColor: theme.colors.secondary },
        animatedStyle,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
})
