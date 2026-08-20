import { Pressable, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'

import { useTheme } from '@/theme'

// Puerto de src/components/ui/switch.tsx (Radix Switch) — para toggles de
// formulario (visibilidad, notificaciones, etc. en el editor de workout y
// configuración de perfil).
interface SwitchProps {
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
}

const TRACK_WIDTH = 44
const TRACK_HEIGHT = 26
const THUMB_SIZE = 22

export function Switch({ value, onValueChange, disabled }: SwitchProps) {
  const theme = useTheme()

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(value ? theme.colors.primary : theme.colors.border, { duration: 150 }),
  }))

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value ? TRACK_WIDTH - THUMB_SIZE - 2 : 2, { duration: 150 }) }],
  }))

  return (
    <Pressable onPress={() => !disabled && onValueChange(!value)} disabled={disabled} hitSlop={8}>
      <Animated.View style={[styles.track, trackStyle, disabled && styles.disabled]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
})
