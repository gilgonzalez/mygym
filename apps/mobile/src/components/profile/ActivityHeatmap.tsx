import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/theme'

export const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]
const WEEKDAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

interface MonthDayCell {
  dateKey: string
  day: number
  count: number
  isFuture: boolean
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// Grid del mes puntual (year/month) — antes esto era una sola tira continua
// de 52 semanas con scroll horizontal; ahora el calendario navega mes a mes
// (ver MonthNavigator.tsx en ActivityTab.tsx), así que el grid vuelve al
// formato de calendario de toda la vida: domingo a sábado, semanas como
// filas. `dates` ya viene acotado a este mes (ver lib/profile.ts:
// fetchCompletedDates con sinceISO/untilISO), no hace falta filtrar acá.
function buildMonthGrid(year: number, month: number, dates: string[]): (MonthDayCell | null)[][] {
  const counts = new Map<string, number>()
  for (const iso of dates) {
    const key = toDateKey(new Date(iso))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const firstOfMonth = new Date(Date.UTC(year, month, 1))
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const startWeekday = firstOfMonth.getUTCDay()

  const cells: (MonthDayCell | null)[] = new Array(startWeekday).fill(null)
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month, day))
    const dateKey = toDateKey(date)
    cells.push({ dateKey, day, count: counts.get(dateKey) ?? 0, isFuture: date > today })
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const rows: (MonthDayCell | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  return rows
}

function intensityColor(count: number, primary: string, track: string): string {
  if (count <= 0) return track
  if (count === 1) return `${primary}55`
  if (count === 2) return `${primary}99`
  return primary
}

interface ActivityHeatmapProps {
  year: number
  month: number
  dates: string[]
  selectedDate: string | null
  onSelectDate: (dateKey: string) => void
}

export function ActivityHeatmap({ year, month, dates, selectedDate, onSelectDate }: ActivityHeatmapProps) {
  const theme = useTheme()
  const rows = useMemo(() => buildMonthGrid(year, month, dates), [year, month, dates])

  return (
    <View style={styles.wrapper}>
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={i} style={styles.cellWrapper}>
            <Text
              style={[styles.weekdayLabel, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium }]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      {rows.map((row, i) => (
        <View key={i} style={styles.weekRow}>
          {row.map((cell, j) => (
            <View key={j} style={styles.cellWrapper}>
              {cell ? (
                <Pressable
                  disabled={cell.isFuture}
                  onPress={() => onSelectDate(cell.dateKey)}
                  style={[
                    styles.dayCell,
                    {
                      borderRadius: theme.radius.lg,
                      backgroundColor: cell.isFuture
                        ? 'transparent'
                        : intensityColor(cell.count, theme.colors.primary, theme.colors.secondary),
                    },
                    cell.dateKey === selectedDate && { borderWidth: 2, borderColor: theme.colors.foreground },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      {
                        color: cell.count > 0 ? '#fff' : theme.colors.mutedForeground,
                        fontFamily: theme.fontFamily.medium,
                      },
                    ]}
                  >
                    {cell.day}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ))}

      <View style={styles.legend}>
        <Text
          style={[styles.legendText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}
        >
          Menos
        </Text>
        {[0, 1, 2, 3].map((level) => (
          <View
            key={level}
            style={[
              styles.legendCell,
              { backgroundColor: intensityColor(level, theme.colors.primary, theme.colors.secondary) },
            ]}
          />
        ))}
        <Text
          style={[styles.legendText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}
        >
          Más
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  weekRow: {
    flexDirection: 'row',
  },
  cellWrapper: {
    flex: 1,
    aspectRatio: 1,
    padding: 2,
  },
  weekdayLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  legendText: {
    fontSize: 11,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
})
