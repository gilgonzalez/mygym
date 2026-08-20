import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { usePressScale } from './usePressScale'

// Puerto de src/components/ui/button.tsx (shadcn) — mismas variantes
// semánticas (default/secondary/outline/ghost/destructive), con "default"
// como gradiente esmeralda para que las CTA principales tengan la misma
// energía que los botones destacados de la web (ver el CTA del skeleton en
// feed/page.tsx: "bg-gradient-to-r from-emerald-500/70 to-emerald-400/70").
export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md'

interface ButtonProps {
  title: string
  onPress?: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  icon?: LucideIcon
  style?: StyleProp<ViewStyle>
  fullWidth?: boolean
  // Override del degradé de la variante "default" — p. ej. el CTA cian de
  // "Comenzar workout" en WorkoutCard, distinto del verde de marca para que
  // la acción principal salte a la vista (duotono verde+cian tipo Blade
  // Runner, ver theme/colors.ts: gradients.neonCta).
  gradientColors?: readonly [string, string, ...string[]]
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Button({
  title,
  onPress,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  style,
  fullWidth = true,
  gradientColors,
}: ButtonProps) {
  const theme = useTheme()
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale()
  const isDisabled = disabled || loading

  const sizeStyle = size === 'sm' ? styles.sizeSm : styles.sizeMd
  const textSizeStyle = size === 'sm' ? { fontSize: theme.fontSize.sm } : { fontSize: theme.fontSize.base }

  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'default' ? '#fff' : theme.colors.primary}
        />
      ) : (
        Icon && <Icon size={size === 'sm' ? 15 : 17} color={iconColor(variant, theme)} />
      )}
      <Text
        style={[
          styles.text,
          textSizeStyle,
          { color: textColor(variant, theme), fontFamily: theme.fontFamily.semibold },
        ]}
      >
        {title}
      </Text>
    </>
  )

  if (variant === 'default') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        style={[pressStyle, fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={gradientColors ?? theme.gradients.primaryButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, sizeStyle, { borderRadius: theme.radius.lg }]}
        >
          {content}
        </LinearGradient>
      </AnimatedPressable>
    )
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
      style={[
        pressStyle,
        styles.base,
        sizeStyle,
        fullWidth && styles.fullWidth,
        { borderRadius: theme.radius.lg },
        variantStyle(variant, theme),
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {content}
    </AnimatedPressable>
  )
}

function variantStyle(variant: ButtonVariant, theme: ReturnType<typeof useTheme>): StyleProp<ViewStyle> {
  switch (variant) {
    case 'secondary':
      return { backgroundColor: theme.colors.secondary }
    case 'outline':
      return { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border }
    case 'ghost':
      return { backgroundColor: 'transparent' }
    case 'destructive':
      return { backgroundColor: theme.colors.destructive }
    default:
      return {}
  }
}

function textColor(variant: ButtonVariant, theme: ReturnType<typeof useTheme>) {
  switch (variant) {
    case 'default':
      return '#fff'
    case 'destructive':
      return theme.colors.destructiveForeground
    case 'secondary':
      return theme.colors.secondaryForeground
    default:
      return theme.colors.foreground
  }
}

function iconColor(variant: ButtonVariant, theme: ReturnType<typeof useTheme>) {
  return textColor(variant, theme)
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sizeMd: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sizeSm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
})
