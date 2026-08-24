import { StyleSheet, View } from 'react-native'

import { Badge } from '@/components/ui'
import { useTheme } from '@/theme'

interface TagListProps {
  tags: string[] | null | undefined
  max?: number
  // Color propio del tipo de dato — p. ej. naranja para grupos musculares,
  // celeste para materiales (ver ExerciseInstanceRow.tsx). Por default el
  // gris neutro de siempre (tags de workout, sin identidad de color propia).
  color?: string
}

// Lista de tags en pills — se repite en WorkoutCard, WorkoutOverview y el
// preview del editor de creación.
export function TagList({ tags, max = 4, color }: TagListProps) {
  const theme = useTheme()
  if (!tags || tags.length === 0) return null

  return (
    <View style={styles.row}>
      {tags.slice(0, max).map((tag) => (
        <Badge key={tag} label={tag} color={color ?? theme.colors.mutedForeground} variant="outline" />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
})
