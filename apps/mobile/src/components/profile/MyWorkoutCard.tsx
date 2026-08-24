import { useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Clock, Heart, MessageSquare, SquarePen, Trash2 } from 'lucide-react-native'

import { formatCount, formatDuration, timeAgo, visibilityLabelMap } from '@mygym/shared'
import { useTheme } from '@/theme'
import { useSession } from '@/lib/session'
import { Badge, Card } from '@/components/ui'
import { DifficultyBadge, TagList } from '@/components/workout'
import { deleteWorkout, type MyWorkout } from '@/lib/workouts'
import { VISIBILITY_COLORS } from '@/lib/visibility'

interface MyWorkoutCardProps {
  workout: MyWorkout
  // Recarga la lista del padre después de un borrado confirmado (ver
  // WorkoutsTab.tsx) — la card no mantiene su propia copia de la lista.
  onDeleted: () => void
}

// Card de "mis workouts" (tab Workouts del perfil) — rediseñada con banner
// de portada (antes un thumbnail cuadrado chico) y el mismo <Card glow>
// (borde/sombra verde de marca) que usan las cards del feed, para que se
// sienta al mismo nivel visual en vez de una fila de lista genérica. Sin
// like/comentarios interactivos ni botón de "Comenzar" (son los workouts
// propios del usuario, no ajenos a consumir) — solo identificarlo, entrar
// al detalle, editarlo o borrarlo (lápiz/tacho sobre la portada; son
// siempre workouts propios acá, no hace falta chequear ownership para
// mostrar los botones).
export function MyWorkoutCard({ workout, onDeleted }: MyWorkoutCardProps) {
  const theme = useTheme()
  const { session } = useSession()
  const visibilityColor = VISIBILITY_COLORS[workout.visibility]
  const [deleting, setDeleting] = useState(false)

  const handleDelete = () => {
    Alert.alert('Eliminar workout', `¿Seguro que querés eliminar "${workout.title}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true)
          try {
            await deleteWorkout(workout.id, session!.user.id)
            onDeleted()
          } catch (err: any) {
            setDeleting(false)
            Alert.alert('No se pudo eliminar', err?.message ?? 'Ocurrió un error inesperado')
          }
        },
      },
    ])
  }

  return (
    <Card onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id } })} style={styles.card}>
      <View style={styles.coverWrapper}>
        {workout.cover ? (
          <Image source={{ uri: workout.cover }} style={styles.cover} />
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
        {/* Sombra propia (no la del Badge base) para que se lea bien tanto
            sobre una foto clara como sobre el degradé de fallback. */}
        <View style={styles.visibilityBadgeWrapper}>
          <Badge label={visibilityLabelMap[workout.visibility]} variant="solid" color={visibilityColor} />
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => router.push({ pathname: '/workout-editor/[id]', params: { id: workout.id } })}
            hitSlop={8}
            style={styles.actionButton}
          >
            <SquarePen size={15} color="#fff" />
          </Pressable>
          <Pressable onPress={handleDelete} disabled={deleting} hitSlop={8} style={styles.actionButton}>
            {deleting ? <ActivityIndicator size="small" color="#fff" /> : <Trash2 size={15} color="#fff" />}
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        <Text
          style={[styles.title, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}
          numberOfLines={1}
        >
          {workout.title}
        </Text>

        <View style={styles.metaRow}>
          <DifficultyBadge difficulty={workout.difficulty} />
          <View style={styles.metaItem}>
            <Clock size={12} color={theme.colors.mutedForeground} />
            <Text
              style={[styles.metaText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}
            >
              {formatDuration(workout.estimated_time || 0)}
            </Text>
          </View>
        </View>

        <TagList tags={workout.tags} max={3} />

        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <View style={styles.footerLeft}>
            <View style={styles.metaItem}>
              <Heart size={13} color={theme.colors.mutedForeground} />
              <Text
                style={[
                  styles.metaText,
                  { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular },
                ]}
              >
                {formatCount(workout.likes_count)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MessageSquare size={13} color={theme.colors.mutedForeground} />
              <Text
                style={[
                  styles.metaText,
                  { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular },
                ]}
              >
                {formatCount(workout.comments_count)}
              </Text>
            </View>
          </View>
          {workout.created_at ? (
            <Text
              style={[styles.metaText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}
            >
              {timeAgo(workout.created_at)}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  coverWrapper: {
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: 130,
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  coverFallbackTitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  visibilityBadgeWrapper: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  actionsRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  body: {
    padding: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
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
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
})
