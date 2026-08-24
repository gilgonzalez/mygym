import { Pressable, StyleSheet, Text, View } from 'react-native'
import { DIFFICULTY_VALUES, getDifficultyColor, getDifficultyLabel, type Difficulty } from '@mygym/shared'

import { useTheme } from '@/theme'

// Selector de dificultad para el editor de workout (workout y, por
// ejercicio nuevo, ExerciseInstanceRow) — a diferencia del <Select> plano
// que usa la web (ExercisesFieldArray.tsx), acá cada opción lleva el mismo
// color que ya identifica esa dificultad en toda la app (DifficultyBadge,
// getDifficultyColor: verde principiante, ámbar intermedio, rosa avanzado),
// para que el editor hable el mismo lenguaje visual que el resto.
interface DifficultyPickerProps {
  value: Difficulty
  onChange: (value: Difficulty) => void
  disabled?: boolean
}

export function DifficultyPicker({ value, onChange, disabled = false }: DifficultyPickerProps) {
  const theme = useTheme()

  return (
    <View style={styles.row}>
      {DIFFICULTY_VALUES.map((difficulty) => {
        const color = getDifficultyColor(difficulty)
        const active = difficulty === value

        return (
          <Pressable
            key={difficulty}
            onPress={() => !disabled && onChange(difficulty)}
            disabled={disabled}
            style={[
              styles.pill,
              {
                borderRadius: theme.radius.full,
                borderColor: active ? color : theme.colors.border,
                backgroundColor: active ? `${color}1A` : 'transparent',
                opacity: disabled && !active ? 0.5 : 1,
              },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text
              style={[
                styles.label,
                { color: active ? color : theme.colors.mutedForeground, fontFamily: theme.fontFamily.semibold },
              ]}
            >
              {getDifficultyLabel(difficulty)}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
  },
})
