import { StyleSheet, Text, View } from 'react-native'
import { RotateCcw, Timer, Trophy } from 'lucide-react-native'

import { amber, useTheme } from '@/theme'
import type { ChallengeResultInfo } from '@/lib/comments'

// Puerto de ChallengeStats en WorkoutCommentsSheet.tsx (apps/web) — score,
// rondas completadas y límite de tiempo de un resultado de reto AMRAP,
// resaltado en ámbar cuando es el récord del workout.
export function ChallengeStats({ challenge }: { challenge: ChallengeResultInfo }) {
  const theme = useTheme()
  const isRecord = Boolean(challenge.is_workout_record)
  const accent = isRecord ? amber[500] : theme.colors.primary
  const minutes = Math.floor(challenge.time_cap_seconds / 60)
  const seconds = String(challenge.time_cap_seconds % 60).padStart(2, '0')

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderRadius: theme.radius.xl,
          borderColor: isRecord ? 'rgba(245,158,11,0.5)' : `${theme.colors.primary}33`,
          backgroundColor: isRecord ? 'rgba(245,158,11,0.12)' : `${theme.colors.primary}0D`,
        },
      ]}
    >
      <Stat icon={Trophy} color={accent} label="Puntuación" value={String(challenge.score)} theme={theme} />
      <Stat icon={RotateCcw} color="#10b981" label="Rondas" value={String(challenge.rounds_completed)} theme={theme} />
      <Stat icon={Timer} color={isRecord ? accent : amber[500]} label="Límite" value={`${minutes}:${seconds}`} theme={theme} />
    </View>
  )
}

function Stat({
  icon: Icon,
  color,
  label,
  value,
  theme,
}: {
  icon: typeof Trophy
  color: string
  label: string
  value: string
  theme: ReturnType<typeof useTheme>
}) {
  return (
    <View style={styles.stat}>
      <View style={[styles.iconBox, { backgroundColor: `${color}33`, borderRadius: theme.radius.md }]}>
        <Icon size={13} color={color} />
      </View>
      <View>
        <Text style={[styles.label, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.bold }]}>
          {label}
        </Text>
        <Text style={[styles.value, { color, fontFamily: theme.fontFamily.bold }]}>{value}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    borderWidth: 1,
    padding: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 13,
  },
})
