import { StyleSheet, View } from 'react-native'

import { useTheme } from '@/theme'
import { Skeleton } from '@/components/ui'

// Calca la forma de StatCard (ícono cuadrado + valor + label).
export function StatCardSkeleton() {
  const theme = useTheme()

  return (
    <View style={[styles.card, { borderRadius: theme.radius.card, backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Skeleton width={40} height={40} radius={theme.radius.xl} />
      <Skeleton width={48} height={20} radius={4} />
      <Skeleton width={64} height={11} radius={4} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
})
