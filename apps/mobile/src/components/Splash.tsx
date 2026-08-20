import { useEffect } from 'react'
import { Image, StyleSheet } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

// Splash propio en JS, montado sobre el contenido real apenas arranca la
// app. El splash nativo (config plugin de expo-splash-screen en app.json)
// solo se ve en un build standalone — en Expo Go siempre se ve el suyo
// genérico, así que esta es la única pantalla de arranque con marca que se
// puede previsualizar durante el desarrollo. Fondo oscuro fijo (no sigue el
// tema claro/oscuro): el isotipo (favicon.png de apps/web, mismo archivo)
// es un mark neón pensado para fondo oscuro.
const SPLASH_BG = '#09090b'
const HOLD_MS = 550

export function Splash({ onFinish }: { onFinish: () => void }) {
  const logoOpacity = useSharedValue(0)
  const logoScale = useSharedValue(0.85)
  const glow = useSharedValue(0.6)
  const overlayOpacity = useSharedValue(1)

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) })
    logoScale.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) })
    // Respiración sutil del glow mientras se sostiene el splash.
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.6, { duration: 700 })), -1, true)

    overlayOpacity.value = withDelay(
      HOLD_MS,
      withTiming(0, { duration: 280 }, (finished) => {
        if (finished) runOnJS(onFinish)()
      })
    )
    // Se dispara una sola vez al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }))
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }))
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }))

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none">
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.Image
        source={require('../../assets/images/splash-icon.png')}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: SPLASH_BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#10b981',
    opacity: 0.6,
    // Blur real no existe en RN sin una lib aparte; con shadow + un radio
    // grande alcanza para el efecto "halo" detrás del logo.
    shadowColor: '#10b981',
    shadowOpacity: 1,
    shadowRadius: 60,
  },
  logo: {
    width: 140,
    height: 140,
  },
})
