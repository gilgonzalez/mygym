import { useEffect } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated'
import { Heart } from 'lucide-react-native'

import { formatCount } from '@mygym/shared'
import { useTheme } from '@/theme'

// Extraído de WorkoutCard para poder reusarlo en el detalle de workout
// (workout/[id]) más adelante — mismo corazón con bounce, mismo estado
// optimista que ya maneja el caller (ver app/index.tsx: handleToggleLike).
interface LikeButtonProps {
  liked: boolean
  count: number
  onToggle: () => void
  pending?: boolean
}

export function LikeButton({ liked, count, onToggle, pending }: LikeButtonProps) {
  const theme = useTheme()
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  useEffect(() => {
    if (liked) {
      scale.value = withSequence(withTiming(1.3, { duration: 120 }), withTiming(1, { duration: 120 }))
    }
    // Solo queremos el bounce cuando pasa a "liked", no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liked])

  return (
    <Pressable onPress={onToggle} disabled={pending} style={styles.row} hitSlop={8}>
      <Animated.View
        style={[
          animatedStyle,
          liked && {
            shadowColor: theme.colors.destructive,
            shadowOpacity: 0.9,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <Heart
          size={19}
          color={liked ? theme.colors.destructive : theme.colors.mutedForeground}
          fill={liked ? theme.colors.destructive : 'transparent'}
        />
      </Animated.View>
      <Text style={[styles.count, { color: theme.colors.foreground, fontFamily: theme.fontFamily.medium }]}>
        {formatCount(count)}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  count: {
    fontSize: 13,
  },
})
