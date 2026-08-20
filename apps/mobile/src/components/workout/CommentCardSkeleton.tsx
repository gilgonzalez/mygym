import { StyleSheet, View } from 'react-native'

import { useTheme } from '@/theme'
import { Skeleton } from '@/components/ui'

// Calca la forma de CommentCard (avatar, nombre+usuario+fecha, barra de
// rating, barra de energía, texto de la reseña).
export function CommentCardSkeleton() {
  const theme = useTheme()

  return (
    <View style={[styles.card, { borderColor: theme.colors.border, borderRadius: theme.radius.card }]}>
      <View style={styles.header}>
        <Skeleton width={42} height={42} radius={theme.radius.lg} />
        <View style={styles.headerText}>
          <Skeleton width={110} height={13} radius={4} />
          <Skeleton width={90} height={10} radius={4} />
        </View>
      </View>

      <View style={[styles.body, { borderLeftColor: theme.colors.border }]}>
        <Skeleton width="100%" height={44} radius={theme.radius.xl} />
        <View style={styles.statRow}>
          <Skeleton width={16} height={11} radius={3} />
          <Skeleton width={100} height={6} radius={3} />
          <Skeleton width={16} height={11} radius={3} />
        </View>
        <View style={styles.statRow}>
          <Skeleton width={16} height={11} radius={3} />
          <Skeleton width={100} height={6} radius={3} />
          <Skeleton width={30} height={9} radius={3} />
        </View>
        <Skeleton width="100%" height={13} radius={4} />
        <Skeleton width="70%" height={13} radius={4} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    gap: 6,
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
})
