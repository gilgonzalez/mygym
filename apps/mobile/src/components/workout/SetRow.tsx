import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Check } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { NumberStepper } from '@/components/ui'

// Fila de una serie — para la ejecución de un ejercicio tipo "reps" (marcar
// peso usado y completarla) y para el form de creación (definir reps/peso
// objetivo por serie). Corresponde a section_exercises en la DB (sets, reps,
// weight_kg — ver packages/shared/src/types/database.ts).
interface SetRowProps {
  index: number
  reps: number
  weightKg?: number | null
  completed?: boolean
  onChangeReps?: (reps: number) => void
  onChangeWeight?: (weightKg: number) => void
  onToggleCompleted?: () => void
  readOnly?: boolean
}

export function SetRow({
  index,
  reps,
  weightKg,
  completed = false,
  onChangeReps,
  onChangeWeight,
  onToggleCompleted,
  readOnly = false,
}: SetRowProps) {
  const theme = useTheme()

  return (
    <View
      style={[
        styles.row,
        {
          borderRadius: theme.radius.lg,
          borderColor: completed ? theme.colors.primary : theme.colors.border,
          backgroundColor: completed ? `${theme.colors.primary}0D` : theme.colors.card,
        },
      ]}
    >
      <Text style={[styles.index, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.bold }]}>
        {index}
      </Text>

      {readOnly ? (
        <View style={styles.readonlyValues}>
          <Text style={[styles.readonlyText, { color: theme.colors.foreground, fontFamily: theme.fontFamily.semibold }]}>
            {reps} reps
          </Text>
          {weightKg ? (
            <Text style={[styles.readonlyText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
              {weightKg} kg
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.steppers}>
          <NumberStepper value={reps} onChange={onChangeReps ?? (() => {})} min={0} max={999} suffix="reps" />
          {onChangeWeight ? (
            <NumberStepper value={weightKg ?? 0} onChange={onChangeWeight} min={0} max={999} step={2.5} suffix="kg" />
          ) : null}
        </View>
      )}

      {onToggleCompleted ? (
        <Pressable
          onPress={onToggleCompleted}
          hitSlop={8}
          style={[
            styles.check,
            {
              borderRadius: theme.radius.full,
              backgroundColor: completed ? theme.colors.primary : 'transparent',
              borderColor: completed ? theme.colors.primary : theme.colors.border,
            },
          ]}
        >
          <Check size={15} color={completed ? '#fff' : theme.colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 10,
  },
  index: {
    width: 20,
    fontSize: 14,
    textAlign: 'center',
  },
  steppers: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  readonlyValues: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'baseline',
  },
  readonlyText: {
    fontSize: 14,
  },
  check: {
    width: 28,
    height: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
