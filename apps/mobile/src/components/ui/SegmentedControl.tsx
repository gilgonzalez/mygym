import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/theme'

// Generaliza el patrón de tabs tipo pill que se repite en la web (Nuevo /
// Popular / Mi círculo en el feed, filtros de "Todos / Públicos / Privados"
// en el perfil): la opción activa se resuelve con el gradiente esmeralda,
// igual que hicimos a mano en el feed — ahora es un componente único.
export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  scrollable?: boolean
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  scrollable = false,
}: SegmentedControlProps<T>) {
  const content = options.map((option) => (
    <Segment key={option.value} option={option} active={option.value === value} onPress={() => onChange(option.value)} />
  ))

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {content}
      </ScrollView>
    )
  }

  return <>{content}</>
}

function Segment<T extends string>({
  option,
  active,
  onPress,
}: {
  option: SegmentedOption<T>
  active: boolean
  onPress: () => void
}) {
  const theme = useTheme()
  const Icon = option.icon

  if (active) {
    return (
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={theme.gradients.primaryButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.segment, { borderRadius: theme.radius.full }]}
        >
          {Icon && <Icon size={13} color="#fff" />}
          <Text style={[styles.text, { color: '#fff', fontFamily: theme.fontFamily.semibold }]}>{option.label}</Text>
        </LinearGradient>
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      style={[styles.segment, { borderRadius: theme.radius.full, backgroundColor: theme.colors.secondary }]}
    >
      {Icon && <Icon size={13} color={theme.colors.mutedForeground} />}
      <Text style={[styles.text, { color: theme.colors.secondaryForeground, fontFamily: theme.fontFamily.semibold }]}>
        {option.label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  text: {
    fontSize: 13,
  },
})
