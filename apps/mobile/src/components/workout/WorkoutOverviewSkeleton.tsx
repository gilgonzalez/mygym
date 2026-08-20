import { StyleSheet, View } from 'react-native'

import { useTheme } from '@/theme'
import { Skeleton } from '@/components/ui'

// Calca la forma de WorkoutOverview mientras carga fetchWorkoutById — mismo
// criterio que WorkoutCardSkeleton (ver ese archivo): la forma real, no un
// bloque gris genérico. Puerto de WorkoutOverviewSkeleton en
// src/app/workout/[id]/page.tsx (apps/web).
export function WorkoutOverviewSkeleton() {
  const theme = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Skeleton width="100%" height={210} radius={0} />

      <View style={styles.content}>
        <View style={styles.pillsRow}>
          <Skeleton width={90} height={26} radius={theme.radius.full} />
          <Skeleton width={90} height={26} radius={theme.radius.full} />
          <Skeleton width={90} height={26} radius={theme.radius.full} />
        </View>

        <Skeleton width={180} height={36} radius={theme.radius.lg} />

        <Skeleton width="100%" height={90} radius={theme.radius.card} />
        <Skeleton width="100%" height={90} radius={theme.radius.card} />

        <View style={styles.sections}>
          <Skeleton width="100%" height={64} radius={theme.radius.card} />
          <Skeleton width="100%" height={64} radius={theme.radius.card} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sections: {
    gap: 12,
  },
})
