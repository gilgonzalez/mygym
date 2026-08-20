import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import Svg, { Circle } from 'react-native-svg'
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Dumbbell } from 'lucide-react-native'

// Pieza visual compartida entre ExecutionView y ChallengeExecutionView: el
// círculo grande con la imagen del ejercicio adentro y un anillo de progreso
// alrededor. Es un átomo puramente visual (no maneja countdown ni pausa —
// eso lo maneja cada vista, que le pasa `progress` ya calculado), así que
// vive separado para no duplicarlo entre los dos componentes de ejecución
// sin que eso choque con que ambos sean "independientes" — comparten un
// átomo visual, no lógica de sesión.
//
// No reutiliza <Timer> (ver Timer.tsx): ese widget es chico (círculo tipo
// "torta" + texto al lado, pensado para un contexto secundario) y maneja su
// propio play/pause interno sin forma de controlarlo desde afuera. Acá hace
// falta lo opuesto — un anillo grande con la imagen adentro, y la pausa
// controlada por la vista (para que el mismo botón pause el cronómetro Y el
// contador global a la vez).
//
// <Image> es de expo-image, no el Image nativo de react-native: el
// thumbnail de un ejercicio puede ser un GIF (demostración del movimiento),
// y el Image de RN en iOS solo pinta el primer frame — no anima. expo-image
// sí decodifica y anima GIF/WebP nativamente, sin nada extra de nuestro
// lado (ver también expo-image ya viene en Expo Go para este SDK).
//
// El color del anillo/glow no salta de golpe entre etapas (celeste→verde→
// naranja): se anima con withTiming sobre un shared value de color —
// Reanimated interpola colores automáticamente cuando el valor destino es
// un string de color, tanto en useAnimatedStyle como en useAnimatedProps.
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface SessionMediaRingProps {
  imageUrl?: string
  alt: string
  progress: number // 0..1
  color: string
  size?: number
  restLabel?: string
  // Pulso de urgencia — últimos segundos de la cuenta regresiva. Además del
  // "respirar" ambiente (siempre activo, le da vida al círculo aunque no
  // haya apuro), esto marca que se acaba el tiempo.
  urgent?: boolean
}

export function SessionMediaRing({ imageUrl, alt, progress, color, size = 240, restLabel, urgent = false }: SessionMediaRingProps) {
  const strokeWidth = size * 0.045
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const animatedProgress = useSharedValue(progress)
  const animatedColor = useSharedValue(color)
  const breathe = useSharedValue(0)
  const urgentPulse = useSharedValue(0)

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 400 })
  }, [progress, animatedProgress])

  useEffect(() => {
    animatedColor.value = withTiming(color, { duration: 450 })
  }, [color, animatedColor])

  // "Respira" todo el tiempo, no solo cuando hay apuro — así el círculo se
  // siente vivo aunque el número no esté por llegar a cero.
  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    )
  }, [breathe])

  useEffect(() => {
    if (urgent) {
      urgentPulse.value = withRepeat(withSequence(withTiming(1, { duration: 260 }), withTiming(0, { duration: 260 })), -1, true)
    } else {
      urgentPulse.value = withTiming(0, { duration: 200 })
    }
  }, [urgent, urgentPulse])

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
    stroke: animatedColor.value,
  }))

  const glowStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColor.value,
    opacity: 0.18 + breathe.value * 0.14 + urgentPulse.value * 0.2,
    transform: [{ scale: 1 + breathe.value * 0.035 + urgentPulse.value * 0.05 }],
  }))

  const ringWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + urgentPulse.value * 0.025 }],
  }))

  const innerInset = strokeWidth + size * 0.03

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }, glowStyle]} />

      <Animated.View style={[{ width: size, height: size }, ringWrapStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={styles.svgRotated}>
          <Circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animatedCircleProps}
          />
        </Svg>

        <View
          style={[
            styles.inner,
            {
              top: innerInset,
              left: innerInset,
              right: innerInset,
              bottom: innerInset,
              borderRadius: size,
            },
          ]}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={alt} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.fallback]}>
              <Dumbbell size={size * 0.22} color="#cbd5e1" />
            </View>
          )}

          {restLabel ? (
            <View style={[StyleSheet.absoluteFill, styles.restOverlay]}>
              <Text style={[styles.restText, { fontSize: size * 0.13 }]}>{restLabel}</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  svgRotated: {
    transform: [{ rotate: '-90deg' }],
  },
  inner: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  restOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217,119,6,0.55)',
  },
  restText: {
    fontWeight: '900',
    letterSpacing: 2,
    color: '#78350f',
    textTransform: 'uppercase',
  },
})
