import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { MessageSquare } from 'lucide-react-native'
import { formatCount } from '@mygym/shared'

import { useTheme } from '@/theme'
import { Sheet } from '@/components/ui'
import { countWorkoutComments, fetchWorkoutComments, type WorkoutComment } from '@/lib/comments'
import { CommentCard } from './CommentCard'
import { CommentCardSkeleton } from './CommentCardSkeleton'

// Puerto de WorkoutCommentsSheet.tsx (apps/web) — mismo header "Locker Room"
// con el contador de comentarios, misma paginación de a 10 con scroll
// infinito, mismo cálculo de "récord" sobre todos los comentarios ya
// cargados (no solo la página actual — ver CommentCard: isTopRecord).
//
// A diferencia de la web (donde cada WorkoutCard monta su propio Drawer sin
// costo), acá es UNA sola instancia controlada desde el feed (ver
// app/index.tsx: commentsWorkoutId/onOpenComments) en vez de una por card:
// @gorhom/bottom-sheet espera un puñado de sheets montados a la vez, no uno
// por fila de una lista — con 8 `BottomSheetModal` vivos a la vez (uno por
// card visible) el trigger dejaba de abrir el sheet.
const PAGE_SIZE = 10

interface CommentsSheetProps {
  workoutId: string | null
  isChallenge?: boolean
  onClose: () => void
}

export function CommentsSheet({ workoutId, isChallenge = false, onClose }: CommentsSheetProps) {
  const theme = useTheme()
  const visible = workoutId !== null
  const [comments, setComments] = useState<WorkoutComment[]>([])
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    if (!workoutId) return

    const myRequestId = ++requestId.current
    setLoading(true)
    setComments([])
    setPage(0)
    setHasMore(true)

    Promise.all([fetchWorkoutComments(workoutId, 0, PAGE_SIZE, isChallenge), countWorkoutComments(workoutId)])
      .then(([firstPage, count]) => {
        if (myRequestId !== requestId.current) return
        setComments(firstPage)
        setHasMore(firstPage.length === PAGE_SIZE)
        setTotalCount(count)
      })
      .catch(() => {
        if (myRequestId !== requestId.current) return
        setComments([])
        setHasMore(false)
      })
      .finally(() => {
        if (myRequestId !== requestId.current) return
        setLoading(false)
      })
  }, [workoutId, isChallenge])

  const handleLoadMore = async () => {
    if (!workoutId || loading || loadingMore || !hasMore) return
    const nextPage = page + 1
    const myRequestId = requestId.current
    setLoadingMore(true)
    try {
      const rows = await fetchWorkoutComments(workoutId, nextPage, PAGE_SIZE, isChallenge)
      if (myRequestId !== requestId.current) return
      setComments((prev) => [...prev, ...rows])
      setHasMore(rows.length === PAGE_SIZE)
      setPage(nextPage)
    } catch {
      if (myRequestId !== requestId.current) return
      setHasMore(false)
    } finally {
      if (myRequestId === requestId.current) {
        setLoadingMore(false)
      }
    }
  }

  // El récord es el mejor score entre TODOS los comentarios ya cargados en
  // el sheet (no solo la página actual) — mismo criterio que el cálculo en
  // el render de WorkoutCommentsSheet.tsx (apps/web).
  const topRecordId = (() => {
    let best = -Infinity
    let bestId: string | null = null
    let bestDate: string | null = null
    for (const c of comments) {
      const score = c.challenge?.score
      if (typeof score !== 'number') continue
      const date = c.completed_at ?? ''
      if (score > best || (score === best && bestDate && date && new Date(date).getTime() < new Date(bestDate).getTime())) {
        best = score
        bestId = c.id
        bestDate = date
      }
    }
    return bestId
  })()

  return (
    <Sheet visible={visible} onClose={onClose} fullHeight>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconBox, { backgroundColor: theme.colors.emeraldSoft, borderRadius: theme.radius.lg }]}>
              <MessageSquare size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text
                numberOfLines={1}
                style={[styles.title, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}
              >
                Locker Room
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.subtitle, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.semibold }]}
              >
                Comunidad y estadísticas
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.countPill,
              { borderRadius: theme.radius.full, backgroundColor: theme.colors.emeraldSoft, borderColor: `${theme.colors.primary}55` },
            ]}
          >
            <Text style={[styles.countText, { color: theme.colors.primary, fontFamily: theme.fontFamily.bold }]}>
              {formatCount(totalCount ?? comments.length)}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.list}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={i > 1 && styles.spacing}>
                <CommentCardSkeleton />
              </View>
            ))}
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.empty}>
            <MessageSquare size={40} color={theme.colors.mutedForeground} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyTitle, { color: theme.colors.foreground, fontFamily: theme.fontFamily.semibold }]}>
              Todavía no hay comentarios.
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}
            >
              ¡Sé el primero en completar este workout y dejar una reseña!
            </Text>
          </View>
        ) : (
          <BottomSheetFlatList
            data={comments}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <CommentCard comment={item} isTopRecord={item.id === topRecordId} />}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            onEndReachedThreshold={0.3}
            onEndReached={handleLoadMore}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator color={theme.colors.primary} />
                </View>
              ) : null
            }
          />
        )}
    </Sheet>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  countPill: {
    flexShrink: 0,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countText: {
    fontSize: 13,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 12,
  },
  spacing: {
    marginTop: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 15,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 260,
  },
  footerLoading: {
    paddingVertical: 20,
  },
})
