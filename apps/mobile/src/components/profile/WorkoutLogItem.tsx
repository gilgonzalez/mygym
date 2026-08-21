import { Image, StyleSheet, Text, View } from 'react-native'
import { Clock, Star, Zap } from 'lucide-react-native'

import { FEELING_COLORS, FEELING_LABELS, formatDuration, timeAgo } from '@mygym/shared'
import { amber, useTheme } from '@/theme'
import { Card } from '@/components/ui'
import type { WorkoutLogEntry } from '@/lib/profile'

// Card del historial de sesiones completadas (tab Actividad del perfil) —
// agrandada y con más información que antes: no hay modal de detalle (así
// lo pidió el producto), así que todo lo relevante de la sesión tiene que
// leerse acá mismo — portada más grande, rating con estrellas y preview de
// las notas, además de duración/XP/feeling que ya mostraba.
export function WorkoutLogItem({ entry }: { entry: WorkoutLogEntry }) {
  const theme = useTheme()

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.thumbWrapper, { borderRadius: theme.radius.lg }]}>
          {entry.workoutCover ? (
            <Image source={{ uri: entry.workoutCover }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, { backgroundColor: theme.colors.secondary }]} />
          )}
        </View>

        <View style={styles.headerText}>
          <Text
            style={[styles.title, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}
            numberOfLines={2}
          >
            {entry.workoutTitle}
          </Text>
          <Text style={[styles.date, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
            {timeAgo(entry.completedAt)}
          </Text>
        </View>
      </View>

      <View style={[styles.metaRow, { borderTopColor: theme.colors.border }]}>
        <View style={styles.metaItem}>
          <Clock size={14} color={theme.colors.mutedForeground} />
          <Text
            style={[styles.metaText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium }]}
          >
            {formatDuration(entry.durationSeconds)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Zap size={14} color={amber[500]} />
          <Text style={[styles.metaText, { color: amber[500], fontFamily: theme.fontFamily.bold }]}>
            +{entry.xpEarned} XP
          </Text>
        </View>
        {entry.rating != null ? (
          <View style={styles.metaItem}>
            <Star size={14} color="#eab308" fill="#eab308" />
            <Text style={[styles.metaText, { color: theme.colors.foreground, fontFamily: theme.fontFamily.medium }]}>
              {entry.rating.toFixed(1)}
            </Text>
          </View>
        ) : null}
        {entry.feeling ? (
          <View style={[styles.feelingPill, { backgroundColor: `${FEELING_COLORS[entry.feeling]}1F` }]}>
            <Text
              style={[styles.metaText, { color: FEELING_COLORS[entry.feeling], fontFamily: theme.fontFamily.bold }]}
            >
              {FEELING_LABELS[entry.feeling]}
            </Text>
          </View>
        ) : null}
      </View>

      {entry.notes ? (
        <Text
          style={[styles.notes, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}
          numberOfLines={3}
        >
          {entry.notes}
        </Text>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbWrapper: {
    overflow: 'hidden',
  },
  thumb: {
    width: 72,
    height: 72,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  feelingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  notes: {
    fontSize: 13,
    lineHeight: 18,
  },
})
