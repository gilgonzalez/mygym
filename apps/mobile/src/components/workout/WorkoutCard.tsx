import { useState } from 'react'
import { router } from 'expo-router'
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Clock, MessageSquare, Play, SquarePen, Trash2 } from 'lucide-react-native'
import { formatCount, formatDuration, timeAgo } from '@mygym/shared'

import { useTheme } from '@/theme'
import { Avatar, Button, Card } from '@/components/ui'
import { deleteWorkout, type FeedWorkout } from '@/lib/workouts'
import { DifficultyBadge } from './DifficultyBadge'
import { LikeButton } from './LikeButton'
import { LikesPreview } from './LikesPreview'
import { NeonBorder } from './NeonBorder'
import { TagList } from './TagList'

// Versión simplificada de src/components/WorkoutCard.tsx (apps/web, 780+
// líneas: atributos RPG, menú de opciones, compartir, comentarios en sheet,
// etc). Acá solo lo esencial para el feed: portada, autor, tags, dificultad/
// duración y like — armado con las piezas de la librería de componentes
// (Avatar, DifficultyBadge, TagList, LikeButton) para no repetir esa lógica
// en el detalle de workout cuando se porte.
//
// Estética HUD/neón (Blade Runner): esquineras tipo mira sobre la portada,
// brillo de tubo de neón permanente en el borde de la card (Card con
// glow=true) y, en la card 100% visible en pantalla, un tramo de luz que
// recorre todo el perímetro en loop (`spotlight` → <NeonBorder>, ver
// app/index.tsx: onViewableItemsChanged decide cuál es esa card).
interface WorkoutCardProps {
  workout: FeedWorkout
  onToggleLike: (workout: FeedWorkout) => void
  onStart: (workout: FeedWorkout) => void
  onOpenComments: (workout: FeedWorkout) => void
  likePending: boolean
  spotlight?: boolean
  // Id del usuario viendo el feed — si coincide con workout.user_id, se
  // muestran los botones de editar/eliminar (ver punto 4 del pedido: "si
  // eres el creador del workout"). onDeleted es opcional porque solo hace
  // falta pasarlo desde donde de verdad hay algo que sacar de una lista
  // (ver app/(tabs)/index.tsx) — sin el, el botón de borrar no aparece.
  viewerId?: string
  onDeleted?: (workoutId: string) => void
}

export default function WorkoutCard({
  workout,
  onToggleLike,
  onStart,
  onOpenComments,
  likePending,
  spotlight = false,
  viewerId,
  onDeleted,
}: WorkoutCardProps) {
  const theme = useTheme()
  const [imageFailed, setImageFailed] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const hasCover = Boolean(workout.cover) && !imageFailed
  const durationLabel = formatDuration(workout.estimated_time || 45 * 60)
  const authorName = workout.user?.name || workout.user?.username || 'Usuario'
  const isOwner = Boolean(viewerId) && workout.user_id === viewerId

  const handleDelete = () => {
    Alert.alert('Eliminar workout', `¿Seguro que querés eliminar "${workout.title}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true)
          try {
            await deleteWorkout(workout.id, viewerId!)
            onDeleted?.(workout.id)
          } catch (err: any) {
            setDeleting(false)
            Alert.alert('No se pudo eliminar', err?.message ?? 'Ocurrió un error inesperado')
          }
        },
      },
    ])
  }

  return (
    <View style={styles.wrapper}>
      {spotlight && <NeonBorder radius={theme.radius.card} />}
      <Card style={styles.card}>
        <View style={styles.header}>
          <Avatar uri={workout.user?.avatar_url} name={authorName} size={36} />
          <View style={styles.headerText}>
            <Text
              style={[styles.authorName, { color: theme.colors.foreground, fontFamily: theme.fontFamily.semibold }]}
              numberOfLines={1}
            >
              {authorName}
            </Text>
            {workout.created_at ? (
              <Text style={[styles.timeAgo, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
                {timeAgo(workout.created_at)}
              </Text>
            ) : null}
          </View>

          {isOwner ? (
            <View style={styles.ownerActions}>
              <Pressable
                onPress={() => router.push({ pathname: '/workout-editor/[id]', params: { id: workout.id } })}
                hitSlop={8}
                style={styles.ownerActionButton}
              >
                <SquarePen size={16} color={theme.colors.mutedForeground} />
              </Pressable>
              <Pressable onPress={handleDelete} disabled={deleting} hitSlop={8} style={styles.ownerActionButton}>
                {deleting ? (
                  <ActivityIndicator size="small" color={theme.colors.destructive} />
                ) : (
                  <Trash2 size={16} color={theme.colors.destructive} />
                )}
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Padding horizontal para que quede a la misma altura que el resto
            del contenido (header/body/footer, todos con 12 de cada lado) en
            vez de ir a sangre de borde a borde de la card. */}
        <View style={styles.coverWrapper}>
          <View style={styles.coverInner}>
            {hasCover ? (
              <Image source={{ uri: workout.cover! }} style={styles.cover} onError={() => setImageFailed(true)} />
            ) : (
              <LinearGradient
                colors={theme.gradients.coverFallback}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.cover, styles.coverFallback]}
              >
                <Text style={[styles.coverFallbackTitle, { fontFamily: theme.fontFamily.bold }]} numberOfLines={2}>
                  {workout.title}
                </Text>
              </LinearGradient>
            )}
            {/* Sheen diagonal tipo panel de vidrio/HUD */}
            <LinearGradient
              colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.6, y: 1 }}
              style={styles.sheen}
              pointerEvents="none"
            />
            <CornerBrackets color={theme.colors.primary} />
          </View>
        </View>

        <View style={styles.body}>
          <Text
            style={[styles.title, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}
            numberOfLines={2}
          >
            {workout.title}
          </Text>
          {workout.description ? (
            <Text
              style={[styles.description, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}
              numberOfLines={2}
            >
              {workout.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <DifficultyBadge difficulty={workout.difficulty} />
            <View style={styles.metaItem}>
              <Clock size={13} color={theme.colors.mutedForeground} />
              <Text style={[styles.metaText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
                {durationLabel}
              </Text>
            </View>
          </View>

          <TagList tags={workout.tags} />

          <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
            <LikeButton
              liked={workout.is_liked}
              count={workout.likes_count}
              onToggle={() => onToggleLike(workout)}
              pending={likePending}
            />
            <Pressable onPress={() => onOpenComments(workout)} style={styles.footerAction} hitSlop={8}>
              <MessageSquare size={17} color={theme.colors.mutedForeground} />
              <Text style={[styles.footerActionText, { color: theme.colors.foreground, fontFamily: theme.fontFamily.medium }]}>
                {formatCount(workout.comments_count)}
              </Text>
            </Pressable>
          </View>

          <LikesPreview users={workout.likes_preview} />

          <Button
            title="Comenzar workout"
            icon={Play}
            onPress={() => onStart(workout)}
            gradientColors={theme.gradients.neonCta}
            style={[
              styles.startButton,
              { shadowColor: '#22d3ee', shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
            ]}
          />
        </View>
      </Card>
    </View>
  )
}

// Esquineras tipo mira/HUD sobre la portada — motivo clásico de sci-fi
// (targeting reticle) que refuerza la estética neón sin agregar ruido.
function CornerBrackets({ color }: { color: string }) {
  return (
    <>
      <View style={[bracketStyles.base, bracketStyles.topLeft, { borderColor: color }]} />
      <View style={[bracketStyles.base, bracketStyles.topRight, { borderColor: color }]} />
      <View style={[bracketStyles.base, bracketStyles.bottomLeft, { borderColor: color }]} />
      <View style={[bracketStyles.base, bracketStyles.bottomRight, { borderColor: color }]} />
    </>
  )
}

const BRACKET_SIZE = 16

const bracketStyles = StyleSheet.create({
  base: {
    position: 'absolute',
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    opacity: 0.85,
  },
  topLeft: {
    top: 8,
    left: 8,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 8,
    right: 8,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 8,
    left: 8,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 8,
    right: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderBottomRightRadius: 4,
  },
})

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    position: 'relative',
  },
  card: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  headerText: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
  },
  timeAgo: {
    fontSize: 12,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  ownerActionButton: {
    padding: 6,
  },
  coverWrapper: {
    width: '100%',
    paddingHorizontal: 12,
  },
  coverInner: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: 180,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  coverFallbackTitle: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
  },
  body: {
    padding: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
  },
  description: {
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 10,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerActionText: {
    fontSize: 13,
  },
  startButton: {
    marginTop: 4,
  },
})
