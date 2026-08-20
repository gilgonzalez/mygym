import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { Sheet } from '@/components/ui'
import { MONTH_NAMES } from './ActivityHeatmap'

interface MonthYearPickerSheetProps {
  visible: boolean
  onClose: () => void
  year: number
  month: number
  onSelect: (year: number, month: number) => void
}

const now = new Date()
const CURRENT_YEAR = now.getUTCFullYear()
const CURRENT_MONTH = now.getUTCMonth()

// Selector de mes/año que abre el label central de MonthNavigator.tsx — año
// con flechas, grid de 12 meses debajo. Meses/años futuros deshabilitados:
// el calendario de actividad no tiene nada que mostrar todavía ahí.
export function MonthYearPickerSheet({ visible, onClose, year, month, onSelect }: MonthYearPickerSheetProps) {
  const theme = useTheme()
  const [pickerYear, setPickerYear] = useState(year)

  useEffect(() => {
    if (visible) setPickerYear(year)
  }, [visible, year])

  const handleSelectMonth = (m: number) => {
    onSelect(pickerYear, m)
    onClose()
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Elegí un mes">
      <View style={styles.yearRow}>
        <Pressable onPress={() => setPickerYear((y) => y - 1)} hitSlop={10} style={styles.yearArrow}>
          <ChevronLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Text style={[styles.year, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
          {pickerYear}
        </Text>
        <Pressable
          onPress={() => setPickerYear((y) => Math.min(y + 1, CURRENT_YEAR))}
          disabled={pickerYear >= CURRENT_YEAR}
          hitSlop={10}
          style={styles.yearArrow}
        >
          <ChevronRight size={20} color={pickerYear >= CURRENT_YEAR ? theme.colors.mutedForeground : theme.colors.foreground} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {MONTH_NAMES.map((name, m) => {
          const disabled = pickerYear === CURRENT_YEAR && m > CURRENT_MONTH
          const active = pickerYear === year && m === month
          return (
            <Pressable
              key={name}
              disabled={disabled}
              onPress={() => handleSelectMonth(m)}
              style={[
                styles.monthCell,
                { borderRadius: theme.radius.lg },
                { backgroundColor: active ? theme.colors.primary : theme.colors.secondary },
                disabled && styles.monthCellDisabled,
              ]}
            >
              <Text
                style={[
                  styles.monthCellText,
                  { color: active ? '#fff' : theme.colors.foreground, fontFamily: theme.fontFamily.semibold },
                ]}
              >
                {name.slice(0, 3)}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  yearArrow: {
    padding: 8,
  },
  year: {
    fontSize: 18,
    minWidth: 60,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthCell: {
    width: '31%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellDisabled: {
    opacity: 0.4,
  },
  monthCellText: {
    fontSize: 14,
  },
})
