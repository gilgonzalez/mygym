import { StyleSheet, Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/theme'

// Puerto de src/components/ui/badge.tsx — pills de tag/dificultad/estado
// que se repiten en el feed y en WorkoutCard. "solid"/"soft" llevan un
// glow de neón en el texto (estética HUD); "outline" se queda solo con el
// borde más marcado para no saturar cuando hay varios juntos (TagList).
interface BadgeProps {
  label: string
  icon?: LucideIcon
  color?: string
  variant?: 'soft' | 'outline' | 'solid'
}

export function Badge({ label, icon: Icon, color, variant = 'soft' }: BadgeProps) {
  const theme = useTheme()
  const tint = color ?? theme.colors.primary

  const containerStyle =
    variant === 'solid'
      ? { backgroundColor: tint }
      : variant === 'outline'
      ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: `${tint}80` }
      : { backgroundColor: `${tint}1A` }

  const textStyle = variant === 'solid' ? '#fff' : tint
  const glow = variant !== 'outline'

  return (
    <View
      style={[
        styles.base,
        { borderRadius: theme.radius.full },
        containerStyle,
        glow && {
          shadowColor: tint,
          shadowOpacity: 0.55,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
          elevation: 2,
        },
      ]}
    >
      {Icon && <Icon size={12} color={variant === 'solid' ? '#fff' : tint} />}
      <Text
        style={[
          styles.text,
          { color: textStyle, fontFamily: theme.fontFamily.semibold },
          glow && {
            textShadowColor: variant === 'solid' ? 'rgba(255,255,255,0.7)' : `${tint}99`,
            textShadowRadius: 6,
            textShadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
})
