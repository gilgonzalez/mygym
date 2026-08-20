import { Image, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BatteryWarning, Crown, Frown, Meh, Smile, Star, User, Zap } from 'lucide-react-native'
import { FEELING_COLORS, FEELING_LABELS, FEELING_LEVELS, timeAgo, type FeelingType } from '@mygym/shared'

import { useTheme } from '@/theme'
import type { WorkoutComment } from '@/lib/comments'
import { ChallengeStats } from './ChallengeStats'

// Puerto de CommentCard en WorkoutCommentsSheet.tsx (apps/web) — "comentario"
// acá es un workout_log con notas: rating, feeling, texto y, si el workout
// es un reto AMRAP, su resultado. isTopRecord (el mejor score entre TODOS
// los comentarios ya cargados, no solo esta página) le pone la corona.
const FEELING_ICONS: Record<FeelingType, typeof Zap> = {
  tired: BatteryWarning,
  sad: Frown,
  normal: Meh,
  happy: Smile,
  pumped: Zap,
}

interface CommentCardProps {
  comment: WorkoutComment
  isTopRecord: boolean
}

export function CommentCard({ comment, isTopRecord }: CommentCardProps) {
  const theme = useTheme()
  const feelingKey = comment.feeling as FeelingType | null
  const FeelingIcon = feelingKey ? FEELING_ICONS[feelingKey] : null

  const containerStyle = isTopRecord
    ? { borderColor: 'rgba(251,191,36,0.5)', backgroundColor: 'rgba(245,158,11,0.08)' }
    : { borderColor: theme.colors.border, backgroundColor: theme.colors.card }

  return (
    <View style={[styles.card, { borderRadius: theme.radius.card }, containerStyle]}>
      {isTopRecord && (
        <LinearGradient
          colors={['rgba(251,191,36,0.5)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topLine}
        />
      )}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {comment.user.avatar_url ? (
            <Image source={{ uri: comment.user.avatar_url }} style={[styles.avatar, { borderRadius: theme.radius.lg }]} />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarFallback,
                { borderRadius: theme.radius.lg, backgroundColor: theme.colors.secondary },
              ]}
            >
              <User size={18} color={theme.colors.mutedForeground} />
            </View>
          )}
          <View style={styles.headerText}>
            <Text
              style={[styles.name, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}
              numberOfLines={1}
            >
              {comment.user.name || 'Anónimo'}
            </Text>
            <View style={styles.metaRow}>
              <Text
                style={[styles.username, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium }]}
                numberOfLines={1}
              >
                @{comment.user.username}
              </Text>
              <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
              <Text style={[styles.time, { color: theme.colors.primary, fontFamily: theme.fontFamily.semibold }]}>
                {comment.completed_at ? timeAgo(comment.completed_at) : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {isTopRecord && (
          <LinearGradient
            colors={['#fbbf24', '#fde047', '#f59e0b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.recordBadge, { borderRadius: theme.radius.full }]}
          >
            <Crown size={12} color="#78350f" />
            <Text style={[styles.recordText, { fontFamily: theme.fontFamily.bold }]}>RÉCORD</Text>
          </LinearGradient>
        )}
      </View>

      <View style={[styles.body, { borderLeftColor: `${theme.colors.primary}55` }]}>
        {comment.challenge ? <ChallengeStats challenge={comment.challenge} /> : null}

        <RatingRow rating={comment.rating ?? 0} theme={theme} />

        {feelingKey && FeelingIcon ? (
          <FeelingRow feelingKey={feelingKey} icon={FeelingIcon} theme={theme} />
        ) : null}

        {comment.notes ? (
          <Text style={[styles.notes, { color: theme.colors.foreground, fontFamily: theme.fontFamily.regular }]}>
            {comment.notes}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

function RatingRow({ rating, theme }: { rating: number; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statLabel}>
        <Star size={11} color="#f59e0b" fill="#f59e0b" />
      </View>
      <View style={styles.bars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i <= rating ? '#f59e0b' : theme.colors.secondary },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.statValue, { color: '#f59e0b', fontFamily: theme.fontFamily.bold }]}>{rating}</Text>
    </View>
  )
}

function FeelingRow({
  feelingKey,
  icon: Icon,
  theme,
}: {
  feelingKey: FeelingType
  icon: typeof Zap
  theme: ReturnType<typeof useTheme>
}) {
  const level = FEELING_LEVELS[feelingKey]
  const color = FEELING_COLORS[feelingKey]

  return (
    <View style={styles.statRow}>
      <View style={styles.statLabel}>
        <Icon size={11} color={color} />
      </View>
      <View style={styles.bars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i <= level ? color : theme.colors.secondary }]} />
        ))}
      </View>
      <Text style={[styles.feelingLabel, { color, fontFamily: theme.fontFamily.bold }]}>
        {FEELING_LABELS[feelingKey]}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    padding: 14,
    gap: 10,
  },
  topLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 42,
    height: 42,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 14,
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: 10,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.6,
  },
  time: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  recordText: {
    fontSize: 10,
    color: '#78350f',
    letterSpacing: 0.5,
  },
  body: {
    borderLeftWidth: 2,
    paddingLeft: 12,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    width: 16,
    alignItems: 'center',
  },
  bars: {
    flexDirection: 'row',
    gap: 3,
    flex: 1,
    maxWidth: 140,
    height: 6,
  },
  bar: {
    flex: 1,
    borderRadius: 1,
    transform: [{ skewX: '-12deg' }],
  },
  statValue: {
    fontSize: 12,
    width: 20,
  },
  feelingLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  notes: {
    fontSize: 13,
    lineHeight: 19,
  },
})
