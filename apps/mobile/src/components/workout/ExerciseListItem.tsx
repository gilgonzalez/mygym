import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Clock, Dumbbell } from 'lucide-react-native'

import { formatDuration } from '@mygym/shared'
import { useTheme } from '@/theme'

// Fila de ejercicio dentro de una sección — puerto del patrón que se repite
// en WorkoutOverview.tsx (resumen antes de arrancar) y en ExercisesVault.tsx
// (buscador del editor). Misma fila sirve para ambos casos con `onPress`
// opcional (en el vault abre el preview, en el overview no hace falta).
export type ExerciseKind = 'reps' | 'time' | 'emom'

interface ExerciseListItemProps {
  name: string
  thumbnailUrl?: string | null
  type: ExerciseKind
  reps?: number | null
  duration?: number | null
  sets?: number | null
  restSeconds?: number | null
  onPress?: () => void
}

export function ExerciseListItem({
  name,
  thumbnailUrl,
  type,
  reps,
  duration,
  sets,
  restSeconds,
  onPress,
}: ExerciseListItemProps) {
  const theme = useTheme()

  const loadValue =
    type === 'reps'
      ? `${reps || 0} reps`
      : type === 'emom'
      ? `${reps || 0}r · ${formatDuration(duration || 0)}`
      : formatDuration(duration || 0)

  const typeLabel = type === 'emom' ? 'EMOM' : type === 'reps' ? 'Repeticiones' : 'Tiempo'

  const Wrapper = onPress ? Pressable : View

  return (
    <Wrapper onPress={onPress} style={[styles.row, { borderColor: theme.colors.border }]}>
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={[styles.thumb, { borderRadius: theme.radius.md }]} />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback, { borderRadius: theme.radius.md, backgroundColor: theme.colors.secondary }]}>
          <Dumbbell size={18} color={theme.colors.mutedForeground} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.colors.foreground, fontFamily: theme.fontFamily.semibold }]} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.chip, { backgroundColor: theme.colors.secondary, borderRadius: theme.radius.full }]}>
            <Text style={[styles.chipText, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
              {loadValue}
            </Text>
          </View>
          {typeof sets === 'number' && sets > 0 ? (
            <Text style={[styles.metaText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium }]}>
              {sets} series
            </Text>
          ) : null}
          {typeof restSeconds === 'number' ? (
            <View style={styles.metaItem}>
              <Clock size={11} color={theme.colors.mutedForeground} />
              <Text style={[styles.metaText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium }]}>
                {restSeconds}s
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Text style={[styles.typeLabel, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.semibold }]}>
        {typeLabel}
      </Text>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  thumb: {
    width: 48,
    height: 48,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 5,
  },
  name: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
  },
  typeLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    maxWidth: 60,
    textAlign: 'right',
  },
})
