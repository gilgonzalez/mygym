import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/theme'
import { ProgressBar } from '@/components/ui'

// Barra de nivel/XP del perfil (level, current_xp, next_level_xp — ver
// UserStats en src/app/(app)/profile/page.tsx).
interface XPBarProps {
  level: number
  currentXp: number
  nextLevelXp: number
  rankTitle?: string
}

export function XPBar({ level, currentXp, nextLevelXp, rankTitle }: XPBarProps) {
  const theme = useTheme()
  const percent = nextLevelXp > 0 ? (currentXp / nextLevelXp) * 100 : 0

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={[styles.level, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
          Nivel {level}
          {rankTitle ? (
            <Text style={[styles.rank, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium }]}>
              {' '}
              · {rankTitle}
            </Text>
          ) : null}
        </Text>
        <Text style={[styles.xp, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium }]}>
          {currentXp} / {nextLevelXp} XP
        </Text>
      </View>
      <ProgressBar value={percent} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  level: {
    fontSize: 16,
  },
  rank: {
    fontSize: 12,
  },
  xp: {
    fontSize: 12,
  },
})
