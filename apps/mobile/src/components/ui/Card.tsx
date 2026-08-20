import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

import { useTheme } from '@/theme'
import { usePressScale } from './usePressScale'

// Puerto de src/components/ui/card.tsx + el efecto ".glow-card" de
// globals.css, pero sin el borde de esa versión: acá el único "borde" que
// se ve es el <NeonBorder> animado de la card en foco (ver WorkoutCard.tsx)
// — el resto de las cards solo llevan la sombra verde ambiente, sin línea.
// `glow` es el estado de reposo; `onPress` intensifica un poco al tocar,
// como el hover de la web.
interface CardProps {
  children: React.ReactNode
  onPress?: () => void
  glow?: boolean
  style?: StyleProp<ViewStyle>
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Card({ children, onPress, glow = true, style }: CardProps) {
  const theme = useTheme()
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale(0.985)

  const cardStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.card,
    },
    glow && {
      shadowColor: theme.colors.glowShadow,
      shadowOpacity: 1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    style,
  ]

  if (!onPress) {
    return <View style={cardStyle}>{children}</View>
  }

  return (
    <AnimatedPressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={[pressStyle, cardStyle]}>
      {children}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
})
