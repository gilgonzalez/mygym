import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Trash2, TrendingDown, TrendingUp } from 'lucide-react-native'

import { useTheme } from '@/theme'
import type { WeightEntry } from '@/lib/profile'
import { MONTH_LABELS } from './ActivityHeatmap'

const RECENT_COUNT = 5
const UP_COLOR = '#ef4444' // subir de peso — mismo rojo que el resto de la app usa para "cuidado"
const DOWN_COLOR = '#22c55e'

function shortDate(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  return `${date.getUTCDate()} ${MONTH_LABELS[date.getUTCMonth()]}`
}

interface WeightHistoryListProps {
  entries: WeightEntry[]
  onDelete: (id: string) => void
}

// Los últimos registros de peso con la variación contra el anterior — le da
// uso concreto a cada "nodo" de WeightChart.tsx además del punto en la
// gráfica. Borrar (deleteWeightEntry, ya existía en lib/profile.ts sin usar)
// es la única edición que tiene un registro de peso: es un dato puntual del
// día, si está mal se borra y se carga uno nuevo, no se edita.
export function WeightHistoryList({ entries, onDelete }: WeightHistoryListProps) {
  const theme = useTheme()
  const recent = entries.slice(0, RECENT_COUNT)

  return (
    <View style={styles.list}>
      {recent.map((entry, index) => {
        // entries viene desc (más reciente primero), así que el "anterior"
        // cronológicamente es el siguiente índice.
        const previous = entries[index + 1]
        const delta = previous ? Math.round((entry.weightKg - previous.weightKg) * 10) / 10 : null

        return (
          <View
            key={entry.id}
            style={[styles.row, index > 0 && { borderTopColor: theme.colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}
          >
            <Text style={[styles.date, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
              {shortDate(entry.loggedAt)}
            </Text>
            <Text style={[styles.weight, { color: theme.colors.foreground, fontFamily: theme.fontFamily.semibold }]}>
              {entry.weightKg} kg
            </Text>

            <View style={styles.delta}>
              {delta != null && delta !== 0 ? (
                <>
                  {delta > 0 ? (
                    <TrendingUp size={12} color={UP_COLOR} />
                  ) : (
                    <TrendingDown size={12} color={DOWN_COLOR} />
                  )}
                  <Text
                    style={[
                      styles.deltaText,
                      { color: delta > 0 ? UP_COLOR : DOWN_COLOR, fontFamily: theme.fontFamily.medium },
                    ]}
                  >
                    {delta > 0 ? '+' : ''}
                    {delta} kg
                  </Text>
                </>
              ) : null}
            </View>

            <Pressable onPress={() => onDelete(entry.id)} hitSlop={8}>
              <Trash2 size={14} color={theme.colors.mutedForeground} />
            </Pressable>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  date: {
    fontSize: 12,
    width: 44,
  },
  weight: {
    fontSize: 13,
    width: 58,
  },
  delta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  deltaText: {
    fontSize: 12,
  },
})
