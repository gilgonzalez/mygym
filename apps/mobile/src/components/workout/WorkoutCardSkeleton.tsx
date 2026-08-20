import { StyleSheet, View } from 'react-native'

import { useTheme } from '@/theme'
import { Skeleton } from '@/components/ui'

// Calca la forma real de WorkoutCard (avatar+nombre, portada con padding
// horizontal, título, descripción de 2 líneas, badge de dificultad +
// duración, tags, footer de like/comentarios, preview de likes y botón de
// "Comenzar") — no un bloque gris genérico. Puerto de
// FeedWorkoutCardSkeleton en src/app/(app)/feed/page.tsx (apps/web). Sin
// borde, igual que la card real (ver ui/Card.tsx).
export function WorkoutCardSkeleton() {
  const theme = useTheme()

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderRadius: theme.radius.card }]}>
      <View style={styles.header}>
        <Skeleton width={36} height={36} radius={18} />
        <View style={styles.headerText}>
          <Skeleton width={120} height={12} radius={4} />
          <Skeleton width={70} height={10} radius={4} />
        </View>
      </View>

      <View style={styles.coverWrapper}>
        <Skeleton width="100%" height={180} radius={16} />
      </View>

      <View style={styles.body}>
        <Skeleton width="85%" height={16} radius={4} />
        <Skeleton width="60%" height={13} radius={4} />

        <View style={styles.metaRow}>
          <Skeleton width={90} height={22} radius={theme.radius.full} />
          <Skeleton width={60} height={12} radius={4} />
        </View>

        <View style={styles.tagsRow}>
          <Skeleton width={64} height={20} radius={theme.radius.full} />
          <Skeleton width={48} height={20} radius={theme.radius.full} />
        </View>

        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <Skeleton width={40} height={16} radius={4} />
          <Skeleton width={40} height={16} radius={4} />
        </View>

        <View style={styles.likesPreview}>
          <Skeleton width={20} height={20} radius={10} />
          <Skeleton width={140} height={11} radius={4} />
        </View>

        <Skeleton width="100%" height={44} radius={theme.radius.lg} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  headerText: {
    gap: 6,
  },
  coverWrapper: {
    paddingHorizontal: 12,
  },
  body: {
    padding: 12,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  footer: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 10,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  likesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
})
