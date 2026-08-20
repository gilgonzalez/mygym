import { StyleSheet, View } from 'react-native'

import { Skeleton } from '@/components/ui'

// Calca la forma de XPBar (nivel + xp a la derecha, barra abajo).
export function XPBarSkeleton() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Skeleton width={90} height={16} radius={4} />
        <Skeleton width={70} height={12} radius={4} />
      </View>
      <Skeleton width="100%" height={10} radius={5} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})
