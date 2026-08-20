import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/theme'

export interface FluidTabOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
}

interface FluidTabsProps<T extends string> {
  options: FluidTabOption<T>[]
  value: T
  onChange: (value: T) => void
  scrollable?: boolean
}

const SPRING_CONFIG = { damping: 18, stiffness: 220, mass: 0.6 }

// Tab bar con un único fondo verde que se desliza al segmento activo, en
// vez de que cada opción tenga su propio pill independiente (eso es
// SegmentedControl.tsx, que se queda como está — lo sigue usando el feed).
// Mide el layout real de cada segmento con onLayout (los labels no miden lo
// mismo) y anima translateX/width del indicador con Reanimated en vez de
// animar left/width directo, que no corre en el UI thread.
export function FluidTabs<T extends string>({ options, value, onChange, scrollable = false }: FluidTabsProps<T>) {
  const theme = useTheme()
  const [layouts, setLayouts] = useState<Partial<Record<T, { x: number; width: number }>>>({})

  const indicatorX = useSharedValue(0)
  const indicatorWidth = useSharedValue(0)
  const indicatorOpacity = useSharedValue(0)

  const activeLayout = layouts[value]

  useEffect(() => {
    if (!activeLayout) return
    indicatorX.value = withSpring(activeLayout.x, SPRING_CONFIG)
    indicatorWidth.value = withSpring(activeLayout.width, SPRING_CONFIG)
    indicatorOpacity.value = withSpring(1, SPRING_CONFIG)
    // Solo nos importa la posición/ancho medidos del tab activo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayout?.x, activeLayout?.width])

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
    opacity: indicatorOpacity.value,
  }))

  const handleLayout = (optionValue: T) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout
    setLayouts((prev) => {
      const existing = prev[optionValue]
      if (existing && existing.x === x && existing.width === width) return prev
      return { ...prev, [optionValue]: { x, width } }
    })
  }

  const track = (
    <View style={[styles.track, { backgroundColor: theme.colors.secondary, borderRadius: theme.radius.full }]}>
      <Animated.View style={[styles.indicator, { borderRadius: theme.radius.full }, indicatorStyle]}>
        <LinearGradient
          colors={theme.gradients.primaryButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {options.map((option) => {
        const active = option.value === value
        const Icon = option.icon

        return (
          <Pressable
            key={option.value}
            onLayout={handleLayout(option.value)}
            onPress={() => onChange(option.value)}
            style={styles.segment}
            hitSlop={4}
          >
            {Icon && <Icon size={14} color={active ? '#fff' : theme.colors.mutedForeground} />}
            <Text
              style={[
                styles.text,
                {
                  color: active ? '#fff' : theme.colors.mutedForeground,
                  fontFamily: active ? theme.fontFamily.bold : theme.fontFamily.semibold,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {track}
      </ScrollView>
    )
  }

  return track
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    overflow: 'hidden',
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  text: {
    fontSize: 13,
  },
  scrollContent: {
    flexGrow: 1,
  },
})
