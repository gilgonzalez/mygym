import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import Animated from 'react-native-reanimated'

import { useTheme } from '@/theme'
import { usePressScale } from '../ui/usePressScale'
import { GoogleIcon } from './GoogleIcon'

interface GoogleButtonProps {
  title?: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Pill blanca sólida en vez del outline que usa Button (ui/Button.tsx):
// sobre el glass oscuro de <AuthCard> es lo que más contrasta, y deja que
// el ícono de Google —el único elemento realmente multicolor de la
// pantalla— sea el acento de color del form en vez de competir con el verde
// de marca del botón principal.
export function GoogleButton({
  title = 'Continuar con Google',
  onPress,
  loading = false,
  disabled = false,
}: GoogleButtonProps) {
  const theme = useTheme()
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  const isDisabled = disabled || loading

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
      style={[pressStyle, styles.base, isDisabled && styles.disabled]}
    >
      {loading ? <ActivityIndicator size="small" color="#18181b" /> : <GoogleIcon size={18} />}
      <Text style={[styles.text, { fontFamily: theme.fontFamily.semibold }]}>{title}</Text>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#fafafa',
    width: '100%',
  },
  text: {
    fontSize: 15,
    color: '#18181b',
  },
  disabled: {
    opacity: 0.6,
  },
})
