import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { MONTH_NAMES } from './ActivityHeatmap'

interface MonthNavigatorProps {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
  onPressLabel: () => void
  canGoNext: boolean
}

// "< Agosto 2026 >" — navegación del calendario del tab Actividad. El label
// central abre MonthYearPickerSheet.tsx para saltar directo a un mes/año
// puntual en vez de tener que ir de a uno con las flechas.
export function MonthNavigator({ year, month, onPrev, onNext, onPressLabel, canGoNext }: MonthNavigatorProps) {
  const theme = useTheme()

  return (
    <View style={styles.row}>
      <Pressable onPress={onPrev} hitSlop={10} style={styles.arrow}>
        <ChevronLeft size={20} color={theme.colors.foreground} />
      </Pressable>

      <Pressable
        onPress={onPressLabel}
        hitSlop={6}
        style={[styles.label, { backgroundColor: theme.colors.secondary, borderRadius: theme.radius.full }]}
      >
        <Text style={[styles.labelText, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
          {MONTH_NAMES[month]} {year}
        </Text>
      </Pressable>

      <Pressable onPress={onNext} disabled={!canGoNext} hitSlop={10} style={styles.arrow}>
        <ChevronRight size={20} color={canGoNext ? theme.colors.foreground : theme.colors.mutedForeground} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: {
    padding: 6,
  },
  label: {
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  labelText: {
    fontSize: 14,
  },
})
