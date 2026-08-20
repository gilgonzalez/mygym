import { StyleSheet, Text, View } from 'react-native'
import { formatShortName } from '@mygym/shared'

import { useTheme } from '@/theme'
import { Avatar } from '@/components/ui'
import type { LikePreviewUser } from '@/lib/workouts'

// "A quién le gustó" — avatares apilados (máx. 3) + nombres cortos ("Nombre
// A."). Viene de FeedWorkout.likes_preview (ver lib/workouts.ts:
// fetchLikesData, join con users ordenado por fecha de like descendente).
interface LikesPreviewProps {
  users: LikePreviewUser[]
}

export function LikesPreview({ users }: LikesPreviewProps) {
  const theme = useTheme()
  if (users.length === 0) return null

  const names = users
    .map((u) => formatShortName(u.name || u.username || 'Usuario') || 'Usuario')
    .join(', ')

  return (
    <View style={styles.row}>
      <View style={styles.stack}>
        {users.map((u, index) => (
          <View
            key={u.id}
            style={[
              styles.avatarSlot,
              { marginLeft: index === 0 ? 0 : -10, zIndex: users.length - index, borderColor: theme.colors.card },
            ]}
          >
            <Avatar uri={u.avatar_url} name={u.name || u.username} size={20} ring={false} />
          </View>
        ))}
      </View>
      <Text
        numberOfLines={1}
        style={[styles.text, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}
      >
        Le gustó a {names}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stack: {
    flexDirection: 'row',
  },
  avatarSlot: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  text: {
    flex: 1,
    fontSize: 12,
  },
})
