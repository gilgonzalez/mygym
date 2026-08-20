import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { RefreshCcw, X } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { StatusScreen } from '@/components/ui'
import { fetchCompletedDates, fetchWorkoutLogsPage, type WorkoutLogEntry } from '@/lib/profile'
import { ActivityHeatmap, MONTH_LABELS } from './ActivityHeatmap'
import { MonthNavigator } from './MonthNavigator'
import { MonthYearPickerSheet } from './MonthYearPickerSheet'
import { WorkoutLogItem } from './WorkoutLogItem'

const now = new Date()
const CURRENT_YEAR = now.getUTCFullYear()
const CURRENT_MONTH = now.getUTCMonth()

function formatDayLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  return `${date.getUTCDate()} de ${MONTH_LABELS[date.getUTCMonth()]}`
}

interface ActivityTabProps {
  userId: string
}

// Tab "Actividad" del perfil: calendario tipo GitHub, navegado mes a mes
// (ver MonthNavigator.tsx/MonthYearPickerSheet.tsx — antes era una tira
// continua de 52 semanas con scroll horizontal), + historial de sesiones
// completadas con scroll infinito (limit 5). No tiene equivalente en la
// web, construido desde cero para mobile (ver lib/profile.ts:
// fetchCompletedDates/fetchWorkoutLogsPage). Tocar un día del calendario
// filtra el historial a ese día puntual; tocar el mismo día de nuevo
// desactiva el filtro.
export function ActivityTab({ userId }: ActivityTabProps) {
  const theme = useTheme()

  const [viewedYear, setViewedYear] = useState(CURRENT_YEAR)
  const [viewedMonth, setViewedMonth] = useState(CURRENT_MONTH)
  const [pickerVisible, setPickerVisible] = useState(false)

  const [dates, setDates] = useState<string[]>([])
  const [datesLoading, setDatesLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [entries, setEntries] = useState<WorkoutLogEntry[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const isCurrentMonth = viewedYear === CURRENT_YEAR && viewedMonth === CURRENT_MONTH

  // El calendario se recarga cada vez que cambia el mes visto (no hace
  // falta traer el historial de todos los meses, solo el que se está
  // mirando) — el filtro de día seleccionado se limpia también, no tendría
  // sentido arrastrar un día de otro mes.
  useEffect(() => {
    setSelectedDate(null)

    const sinceISO = new Date(Date.UTC(viewedYear, viewedMonth, 1)).toISOString()
    const untilISO = new Date(Date.UTC(viewedYear, viewedMonth + 1, 1)).toISOString()

    setDatesLoading(true)
    fetchCompletedDates(userId, sinceISO, untilISO)
      .then(setDates)
      // El historial de abajo ya tiene su propio error + "Reintentar"; si
      // solo falla el calendario no hace falta bloquear toda la pantalla,
      // se queda vacío.
      .catch(() => {})
      .finally(() => setDatesLoading(false))
  }, [userId, viewedYear, viewedMonth])

  const loadLogs = useCallback(() => {
    const myRequestId = ++requestId.current
    setLoadingInitial(true)
    setError(null)

    fetchWorkoutLogsPage(userId, 1, selectedDate ?? undefined)
      .then((result) => {
        if (myRequestId !== requestId.current) return
        setEntries(result.entries)
        setHasMore(result.hasMore)
        setPage(1)
      })
      .catch((err: any) => {
        if (myRequestId !== requestId.current) return
        setError(err?.message ?? 'No se pudo cargar tu actividad')
      })
      .finally(() => {
        if (myRequestId !== requestId.current) return
        setLoadingInitial(false)
      })
  }, [userId, selectedDate])

  // Se resetea a la página 1 cada vez que cambia el día seleccionado.
  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleLoadMore = () => {
    if (loadingInitial || loadingMore || !hasMore) return
    setLoadingMore(true)
    fetchWorkoutLogsPage(userId, page + 1, selectedDate ?? undefined)
      .then((result) => {
        setEntries((prev) => [...prev, ...result.entries])
        setHasMore(result.hasMore)
        setPage((p) => p + 1)
      })
      // Falla silenciosa en "cargar más" — igual que handleLoadMore del feed
      // (app/(tabs)/index.tsx), un reintento vía scroll alcanza.
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  const handleSelectDate = (dateKey: string) => {
    setSelectedDate((prev) => (prev === dateKey ? null : dateKey))
  }

  const goToPrevMonth = () => {
    setViewedMonth((m) => {
      if (m === 0) {
        setViewedYear((y) => y - 1)
        return 11
      }
      return m - 1
    })
  }

  const goToNextMonth = () => {
    if (isCurrentMonth) return
    setViewedMonth((m) => {
      if (m === 11) {
        setViewedYear((y) => y + 1)
        return 0
      }
      return m + 1
    })
  }

  if (error) {
    return (
      <StatusScreen
        icon={RefreshCcw}
        tone="error"
        title="No pudimos cargar tu actividad"
        description={error}
        primaryAction={{ label: 'Reintentar', onPress: loadLogs }}
      />
    )
  }

  return (
    <>
      <FlatList
        data={entries}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <View style={styles.section}>
            <MonthNavigator
              year={viewedYear}
              month={viewedMonth}
              onPrev={goToPrevMonth}
              onNext={goToNextMonth}
              onPressLabel={() => setPickerVisible(true)}
              canGoNext={!isCurrentMonth}
            />
            {datesLoading ? (
              <ActivityIndicator color={theme.colors.primary} style={styles.calendarLoading} />
            ) : (
              <ActivityHeatmap
                year={viewedYear}
                month={viewedMonth}
                dates={dates}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            )}
          </View>

          <View style={styles.historyHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
              {selectedDate ? `Historial del ${formatDayLabel(selectedDate)}` : 'Historial'}
            </Text>
            {selectedDate ? (
              <Pressable onPress={() => setSelectedDate(null)} hitSlop={8} style={styles.clearFilter}>
                <Text style={[styles.clearFilterText, { color: theme.colors.primary, fontFamily: theme.fontFamily.semibold }]}>
                  Ver todo
                </Text>
                <X size={13} color={theme.colors.primary} />
              </Pressable>
            ) : null}
          </View>
        </View>
      }
      renderItem={({ item }) => <WorkoutLogItem entry={item} />}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      onEndReachedThreshold={0.4}
      onEndReached={handleLoadMore}
      ListFooterComponent={
        loadingInitial ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.footerLoading} />
        ) : loadingMore ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.footerLoading} />
        ) : null
      }
      ListEmptyComponent={
        !loadingInitial ? (
          <Text style={[styles.emptyText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
            {selectedDate ? 'No completaste ningún workout ese día.' : 'Todavía no completaste ningún workout.'}
          </Text>
        ) : null
      }
      />

      <MonthYearPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        year={viewedYear}
        month={viewedMonth}
        onSelect={(year, month) => {
          setViewedYear(year)
          setViewedMonth(month)
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  listHeader: {
    gap: 14,
    marginBottom: 14,
  },
  section: {
    gap: 12,
  },
  calendarLoading: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearFilterText: {
    fontSize: 13,
  },
  footerLoading: {
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
})
